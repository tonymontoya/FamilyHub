import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-utils"
import { Errors, withErrorHandling, successResponse } from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import { isValidUUID } from "@/lib/validation"

// Input validation schema
const declineSchema = z.object({
  reason: z.string().max(500).optional(),
})

/**
 * POST /api/completions/:id/decline
 *
 * Decline a completion. Child can retry later.
 * Photos are retained for audit purposes.
 */
export const POST = withErrorHandling(async (request, context) => {
  const { id: completionId } = await context.params

  // Validate UUID format
  if (!isValidUUID(completionId)) {
    throw Errors.badRequest("Invalid completion ID format")
  }

  const { member } = await requireAuth()
  requireRole(member, "PARENT")

  // Rate limit: 30 declines per hour per parent
  const rateLimitHeaders = applyRateLimit("approval", member.id, "decline")

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

  const validationResult = declineSchema.safeParse(body)
  if (!validationResult.success) {
    throw Errors.badRequest("Invalid input", validationResult.error.flatten())
  }

  const { reason } = validationResult.data

  // Sanitize reason - prevent nested [Declined:] brackets
  const sanitizedReason = reason
    ? reason.replace(/<[^>]*>/g, "").replace(/\[Declined:[^\]]*\]/g, "").trim().slice(0, 500)
    : null

  // Update completion status
  // Note: Photos are retained for audit purposes even when declined
  const updatedCompletion = await prisma.completion.update({
    where: { id: completionId },
    data: {
      status: "DECLINED",
      approvedBy: member.id,
      approvedAt: new Date(),
      pointsAwarded: 0,
      notes: sanitizedReason
        ? `${completion.notes || ""}\n\n[Declined: ${sanitizedReason}]`
        : completion.notes,
    },
  })

  return successResponse({
    id: updatedCompletion.id,
    status: "DECLINED",
    declinedAt: updatedCompletion.approvedAt?.toISOString(),
    reason: sanitizedReason,
    child: {
      id: completion.memberId,
      displayName: completion.member.displayName,
    },
    chore: {
      id: completion.choreId,
      title: completion.chore.title,
    },
  }, 200, rateLimitHeaders)
})
