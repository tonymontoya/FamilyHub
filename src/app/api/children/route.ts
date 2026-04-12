import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Rate limiting: Max 5 child accounts per minute per parent
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute

function checkRateLimit(parentId: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(parentId)
  
  if (!record || now > record.resetTime) {
    // New window or expired
    rateLimitMap.set(parentId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  record.count++
  return true
}

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
export async function POST(request: NextRequest) {
  try {
    // Verify parent authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get parent's member record to verify they're a parent
    const parentMember = await prisma.member.findUnique({
      where: { username: session.user.email },
      include: { family: true },
    })

    if (!parentMember || parentMember.role !== "PARENT") {
      return NextResponse.json(
        { error: "Forbidden - Only parents can create child accounts" },
        { status: 403 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(parentMember.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const validationResult = createChildSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    // Check if username is taken in Member table
    const existingMember = await prisma.member.findUnique({
      where: { username: normalizedUsername },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    // Generate synthetic email for Better-Auth (internal only, not shown to user)
    // Format: child-{familyId}-{username}@familyhub.local
    // This ensures uniqueness and prevents email delivery
    const syntheticEmail = `child-${parentMember.familyId}-${normalizedUsername}@familyhub.local`

    // Create child user in Better-Auth via internal API
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const createUserResponse = await fetch(
      `${baseURL}/api/auth/sign-up/email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      )
    }

    // Get the created user to link to Member record
    const authUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    })

    if (!authUser) {
      return NextResponse.json(
        { error: "User creation verification failed" },
        { status: 500 }
      )
    }

    // Create Member record for the child
    // If this fails, we need to roll back the Better-Auth user
    let childMember
    try {
      childMember = await prisma.member.create({
        data: {
          familyId: parentMember.familyId,
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
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: "Failed to create member record" },
        { status: 500 }
      )
    }

    // Return success with credentials (parent needs to save these)
    return NextResponse.json({
      success: true,
      child: {
        id: childMember.id,
        username: normalizedUsername,
        displayName,
        familyId: parentMember.familyId,
      },
      credentials: {
        username: normalizedUsername,
        password,
      },
    }, { status: 201 })

  } catch (error) {
    console.error("Child creation error:", error)

    // Handle unique constraint violations (race condition)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/children
 * 
 * Get all children for the parent's family.
 */
export async function GET() {
  try {
    // Verify parent authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get parent's member record
    const parentMember = await prisma.member.findUnique({
      where: { username: session.user.email },
    })

    if (!parentMember || parentMember.role !== "PARENT") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Get all children in the family
    const children = await prisma.member.findMany({
      where: {
        familyId: parentMember.familyId,
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
        familyId: parentMember.familyId,
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

  } catch (error) {
    console.error("Get children error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
