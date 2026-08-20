import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-utils"
import { Errors, withErrorHandling, createdResponse, successResponse } from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import { isValidUUID } from "@/lib/validation"
import { rrulestr } from "rrule"

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
  recurrenceRule: z.string().min(1, "Recurrence rule is required"),
  assigneeId: z
    .string()
    .refine((val) => val === "" || isValidUUID(val), {
      message: "Invalid assignee ID",
    })
    .optional(),
})

/**
 * Validate RRULE format
 */
function validateRRule(rruleString: string): { valid: boolean; error?: string } {
  try {
    // Must be a valid RRULE that can be parsed
    rrulestr(rruleString)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Invalid RRULE format: ${(error as Error).message}` }
  }
}

/**
 * POST /api/chores
 *
 * Create a new chore (parent only).
 */
export const POST = withErrorHandling(async (request) => {
  const { member } = await requireAuth()
  requireRole(member, "PARENT")

  // Rate limit: 10 chore creations per minute per parent
  const rateLimitHeaders = applyRateLimit("choreCreate", member.id)

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw Errors.badRequest("Invalid JSON in request body")
  }

  const validationResult = createChoreSchema.safeParse(body)
  if (!validationResult.success) {
    throw Errors.badRequest("Invalid input", validationResult.error.flatten())
  }

  const { title, description, points, recurrenceRule, assigneeId } =
    validationResult.data

  // Validate RRULE format
  const rruleValidation = validateRRule(recurrenceRule)
  if (!rruleValidation.valid) {
    throw Errors.badRequest(rruleValidation.error!)
  }

  // Sanitize inputs
  const sanitizedTitle = title.trim()
  const sanitizedDescription = description?.trim() || null

  // If assignee provided, verify they belong to the same family
  if (assigneeId && assigneeId !== "") {
    const assignee = await prisma.member.findUnique({
      where: { id: assigneeId },
    })

    if (!assignee) {
      throw Errors.notFound("Assignee")
    }

    if (assignee.familyId !== member.familyId) {
      throw Errors.forbidden("Assignee does not belong to your family")
    }
  }

  // Create the chore
  let chore
  try {
    chore = await prisma.chore.create({
      data: {
        familyId: member.familyId,
        title: sanitizedTitle,
        description: sanitizedDescription,
        points,
        recurrenceRule,
        assigneeId: assigneeId || null,
        status: "ACTIVE",
        createdBy: member.id,
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
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw Errors.conflict("A chore with this title already exists")
    }
    throw error
  }

  return createdResponse(
    {
      id: chore.id,
      title: chore.title,
      description: chore.description,
      points: chore.points,
      recurrenceRule: chore.recurrenceRule,
      assigneeId: chore.assigneeId,
      assignee: chore.assignee,
      status: chore.status,
      createdAt: chore.createdAt,
    },
    rateLimitHeaders
  )
})

/**
 * GET /api/chores
 *
 * Get chores for the family with optional filters.
 */
export const GET = withErrorHandling(async (request) => {
  const { member } = await requireAuth()

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const assigneeId = searchParams.get("assigneeId")
  const status = searchParams.get("status") as "ACTIVE" | "ARCHIVED" | null

  // Validate assigneeId if provided
  if (assigneeId && !isValidUUID(assigneeId)) {
    throw Errors.badRequest("Invalid assignee ID")
  }

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

  return successResponse({ chores })
})
