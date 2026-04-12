import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Rate limiting: Max 10 chore creations per minute per parent
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute

function checkRateLimit(parentId: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(parentId)
  
  if (!record || now > record.resetTime) {
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
const createChoreSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  points: z
    .number()
    .int()
    .min(0, "Points must be 0 or more")
    .max(100, "Points must be 100 or less"),
  recurrenceRule: z
    .string()
    .min(1, "Recurrence rule is required"),
  assigneeId: z
    .string()
    .uuid("Invalid assignee ID")
    .optional(),
})

/**
 * POST /api/chores
 * 
 * Create a new chore (parent only).
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

    // Get parent's member record
    const parentMember = await prisma.member.findUnique({
      where: { username: session.user.email },
    })

    if (!parentMember || parentMember.role !== "PARENT") {
      return NextResponse.json(
        { error: "Forbidden - Only parents can create chores" },
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

    const validationResult = createChoreSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, points, recurrenceRule, assigneeId } = validationResult.data

    // Sanitize inputs
    const sanitizedTitle = title.trim()
    const sanitizedDescription = description?.trim() || null

    // If assignee provided, verify they belong to the same family
    if (assigneeId) {
      const assignee = await prisma.member.findUnique({
        where: { id: assigneeId },
      })

      if (!assignee) {
        return NextResponse.json(
          { error: "Assignee not found" },
          { status: 404 }
        )
      }

      if (assignee.familyId !== parentMember.familyId) {
        return NextResponse.json(
          { error: "Assignee does not belong to your family" },
          { status: 403 }
        )
      }
    }

    // Create the chore
    const chore = await prisma.chore.create({
      data: {
        familyId: parentMember.familyId,
        title: sanitizedTitle,
        description: sanitizedDescription,
        points,
        recurrenceRule,
        assigneeId: assigneeId || null,
        status: "ACTIVE",
        createdBy: parentMember.id,
      },
      include: {
        assignee: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: chore.id,
      title: chore.title,
      description: chore.description,
      points: chore.points,
      recurrenceRule: chore.recurrenceRule,
      assigneeId: chore.assigneeId,
      assignee: chore.assignee,
      status: chore.status,
      createdAt: chore.createdAt,
    }, { status: 201 })

  } catch (error) {
    console.error("Chore creation error:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A chore with this title already exists" },
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
 * GET /api/chores
 * 
 * Get chores for the family with optional filters.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get member record
    const member = await prisma.member.findUnique({
      where: { username: session.user.email },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const assigneeId = searchParams.get("assigneeId")
    const status = searchParams.get("status") as "ACTIVE" | "ARCHIVED" | null

    // Build where clause
    const where: Prisma.ChoreWhereInput = {
      familyId: member.familyId,
      deletedAt: null,
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (status) {
      where.status = status
    } else {
      // Default to active chores only
      where.status = "ACTIVE"
    }

    // Get chores
    const chores = await prisma.chore.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignee: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json({ chores })

  } catch (error) {
    console.error("Get chores error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
