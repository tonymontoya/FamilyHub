import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  authenticate,
  requireAuth,
  requireRole,
  isValidUUID,
  Errors,
} from "@/lib/api-utils"

// Input validation schema
const declineSchema = z.object({
  reason: z.string().max(500).optional(),
})

/**
 * POST /api/completions/:id/decline
 *
 * Decline a completion. Child can retry later.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: completionId } = await params

    // Validate UUID format
    if (!isValidUUID(completionId)) {
      return Errors.badRequest("Invalid completion ID format")
    }

    // Authenticate
    const authContext = await authenticate()
    const authError = requireAuth(authContext)
    if (authError) return authError

    // Require parent role
    const roleError = requireRole(authContext!, "PARENT")
    if (roleError) return roleError

    const parentMember = authContext!.member

    // Get the completion with related data
    const completion = await prisma.completion.findUnique({
      where: { id: completionId },
      include: {
        chore: true,
        member: true,
      },
    })

    if (!completion) {
      return Errors.notFound("Completion")
    }

    // Verify completion belongs to parent's family
    if (completion.chore.familyId !== parentMember.familyId) {
      return Errors.forbidden("Access denied")
    }

    // Verify completion is pending
    if (completion.status !== "PENDING") {
      return Errors.conflict(`Completion is already ${completion.status.toLowerCase()}`)
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Errors.badRequest("Invalid JSON in request body")
    }

    const validationResult = declineSchema.safeParse(body)
    if (!validationResult.success) {
      return Errors.badRequest(
        "Invalid input",
        validationResult.error.flatten()
      )
    }

    const { reason } = validationResult.data

    // Sanitize reason
    const sanitizedReason = reason
      ? reason.replace(/<[^>]*>/g, "").trim().slice(0, 500)
      : null

    // Update completion status
    const updatedCompletion = await prisma.completion.update({
      where: { id: completionId },
      data: {
        status: "DECLINED",
        approvedBy: parentMember.id,
        approvedAt: new Date(),
        pointsAwarded: 0,
        notes: sanitizedReason
          ? `${completion.notes || ""}\n\n[Declined: ${sanitizedReason}]`
          : completion.notes,
      },
    })

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error("Completion decline error:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Errors.notFound("Completion")
    }

    return Errors.internal()
  }
}
