import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-utils"
import { Errors, withFlatErrorHandling } from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"

// Input validation schema
const createChildSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
})

/**
 * POST /api/children
 *
 * Create a child account (parent only).
 * COPPA-compliant: No email collected from child, parent manages account.
 */
export const POST = withFlatErrorHandling(async (request) => {
  const { member } = await requireAuth()
  requireRole(member, "PARENT")

  // Rate limit: 5 child accounts per minute per parent
  const rateLimitHeaders = applyRateLimit("childCreate", member.id)

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw Errors.badRequest("Invalid JSON in request body")
  }

  const validationResult = createChildSchema.safeParse(body)
  if (!validationResult.success) {
    throw Errors.badRequest("Invalid input", validationResult.error.flatten())
  }

  const { username, displayName, password } = validationResult.data
  const normalizedUsername = username.toLowerCase()

  // Sanitize display name to prevent XSS
  // Remove HTML tags and trim whitespace
  const sanitizedDisplayName = displayName
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .trim()
    .slice(0, 50) // Ensure max length

  // Check if username is already taken in Better-Auth
  const existingUser = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  })

  if (existingUser) {
    throw Errors.conflict("Username already exists")
  }

  // Check if username is taken in Member table
  const existingMember = await prisma.member.findUnique({
    where: { username: normalizedUsername },
  })

  if (existingMember) {
    throw Errors.conflict("Username already exists")
  }

  // Generate synthetic email for Better-Auth (internal only, not shown to user)
  // Format: child-{familyId}-{username}@familyhub.local
  // This ensures uniqueness and prevents email delivery
  const syntheticEmail = `child-${member.familyId}-${normalizedUsername}@familyhub.local`

  // Create child user in Better-Auth via internal API.
  // The Origin header is required: Better-Auth enforces CSRF/origin checks and
  // a server-side fetch omits Origin by default (would 403 MISSING_OR_NULL_ORIGIN).
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const createUserResponse = await fetch(
    `${baseURL}/api/auth/sign-up/email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": baseURL,
      },
      body: JSON.stringify({
        email: syntheticEmail,
        password,
        name: sanitizedDisplayName,
        username: normalizedUsername,
      }),
    }
  )

  if (!createUserResponse.ok) {
    const errorData = await createUserResponse.json().catch(() => ({}))
    console.error("Better-Auth user creation failed:", errorData)
    throw Errors.internal("Failed to create user account")
  }

  // Get the created user to link to Member record
  const authUser = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  })

  if (!authUser) {
    throw Errors.internal("User creation verification failed")
  }

  // Create Member record for the child
  // If this fails, we need to roll back the Better-Auth user
  let childMember
  try {
    childMember = await prisma.member.create({
      data: {
        familyId: member.familyId,
        userId: authUser.id,
        role: "CHILD",
        username: normalizedUsername,
        displayName: sanitizedDisplayName,
      },
    })
  } catch (memberError) {
    // Rollback: Delete the Better-Auth user we just created
    console.error("Member creation failed, rolling back auth user:", memberError)

    try {
      await prisma.user.delete({
        where: { id: authUser.id },
      })
      // Also delete associated account
      await prisma.account.deleteMany({
        where: { userId: authUser.id },
      })
    } catch (rollbackError) {
      console.error("CRITICAL: Rollback failed, orphaned auth user:", rollbackError)
    }

    if (
      memberError instanceof Prisma.PrismaClientKnownRequestError &&
      memberError.code === "P2002"
    ) {
      throw Errors.conflict("Username already exists")
    }

    throw Errors.internal("Failed to create member record")
  }

  // Return success with credentials (parent needs to save these)
  return NextResponse.json({
    success: true,
    child: {
      id: childMember.id,
      username: normalizedUsername,
      displayName,
      familyId: member.familyId,
    },
    credentials: {
      username: normalizedUsername,
      password,
    },
  }, { status: 201, headers: rateLimitHeaders })
})

/**
 * GET /api/children
 *
 * Get all children for the parent's family.
 */
export const GET = withFlatErrorHandling(async () => {
  const { member } = await requireAuth()
  requireRole(member, "PARENT")

  // Get all children in the family
  const children = await prisma.member.findMany({
    where: {
      familyId: member.familyId,
      role: "CHILD",
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
    },
  })

  // Get parent info
  const parent = await prisma.member.findFirst({
    where: {
      familyId: member.familyId,
      role: "PARENT",
      deletedAt: null,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
    },
  })

  return NextResponse.json({ children, parent })
})
