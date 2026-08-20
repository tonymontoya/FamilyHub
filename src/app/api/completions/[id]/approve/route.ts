import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-utils"
import { Errors, withErrorHandling, successResponse } from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import { isValidUUID } from "@/lib/validation"

// Input validation schema
const approveSchema = z.object({
  points: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
})

/**
 * POST /api/completions/:id/approve
 *
 * Approve a completion and award points to the child.
 * Transactional: All operations succeed or all fail.
 */
export const POST = withErrorHandling(async (request, context) => {
  const { id: completionId } = await context.params

  // Validate UUID format
  if (!isValidUUID(completionId)) {
    throw Errors.badRequest("Invalid completion ID format")
  }

  const { member } = await requireAuth()
  requireRole(member, "PARENT")

  // Rate limit: 30 approvals per hour per parent
  const rateLimitHeaders = applyRateLimit("approval", member.id, "approve")

  // Get the completion with related data
  const completion = await prisma.completion.findUnique({
    where: { id: completionId },
    include: {
      chore: true,
      member: true,
    },
  })

  if (!completion) {
    throw Errors.notFound("Completion")
  }

  // Verify completion belongs to parent's family
  if (completion.chore.familyId !== member.familyId) {
    throw Errors.forbidden("Access denied")
  }

  // Verify completion is pending
  if (completion.status !== "PENDING") {
    throw Errors.conflict(`Completion is already ${completion.status.toLowerCase()}`)
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw Errors.badRequest("Invalid JSON in request body")
  }

  const validationResult = approveSchema.safeParse(body)
  if (!validationResult.success) {
    throw Errors.badRequest("Invalid input", validationResult.error.flatten())
  }

  const { points: customPoints, notes: approvalNotes } = validationResult.data

  // Determine points to award
  const pointsToAward = customPoints ?? completion.chore.points

  // Sanitize notes - prevent nested [Parent Notes:] brackets
  const sanitizedNotes = approvalNotes
    ? approvalNotes.replace(/<[^>]*>/g, "").replace(/\[Parent Notes:[^\]]*\]/g, "").trim().slice(0, 500)
    : null

  // Execute approval in a transaction
  let result
  try {
    result = await prisma.$transaction(async (tx) => {
      // 1. Update completion status
      const updatedCompletion = await tx.completion.update({
        where: { id: completionId },
        data: {
          status: "APPROVED",
          approvedBy: member.id,
          approvedAt: new Date(),
          pointsAwarded: pointsToAward,
          notes: sanitizedNotes
            ? `${completion.notes || ""}\n\n[Parent Notes: ${sanitizedNotes}]`
            : completion.notes,
        },
      })

      // 2. Create point transaction record
      const pointTransaction = await tx.pointTransaction.create({
        data: {
          memberId: completion.memberId,
          amount: pointsToAward,
          type: "EARNED",
          referenceId: completionId,
          description: `Completed: ${completion.chore.title}`,
        },
      })

      return { updatedCompletion, pointTransaction }
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw Errors.notFound("Completion")
    }
    throw error
  }

  // Get updated member stats
  const memberStats = await prisma.pointTransaction.aggregate({
    where: { memberId: completion.memberId },
    _sum: { amount: true },
  })

  return successResponse({
    id: result.updatedCompletion.id,
    status: "APPROVED",
    pointsAwarded: result.updatedCompletion.pointsAwarded,
    approvedAt: result.updatedCompletion.approvedAt?.toISOString(),
    child: {
      id: completion.memberId,
      displayName: completion.member.displayName,
      totalPoints: memberStats._sum.amount || 0,
    },
    chore: {
      id: completion.choreId,
      title: completion.chore.title,
    },
  }, 200, rateLimitHeaders)
})
