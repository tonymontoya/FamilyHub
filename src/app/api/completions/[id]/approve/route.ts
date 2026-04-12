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

    const validationResult = approveSchema.safeParse(body)
    if (!validationResult.success) {
      return Errors.badRequest(
        "Invalid input",
        validationResult.error.flatten()
      )
    }

    const { points: customPoints, notes: approvalNotes } = validationResult.data

    // Determine points to award
    const pointsToAward = customPoints ?? completion.chore.points

    // Sanitize notes
    const sanitizedNotes = approvalNotes
      ? approvalNotes.replace(/<[^>]*>/g, "").trim().slice(0, 500)
      : null

    // Execute approval in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update completion status
      const updatedCompletion = await tx.completion.update({
        where: { id: completionId },
        data: {
          status: "APPROVED",
          approvedBy: parentMember.id,
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

    // Get updated member stats
    const memberStats = await prisma.pointTransaction.aggregate({
      where: { memberId: completion.memberId },
      _sum: { amount: true },
    })

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error("Completion approval error:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Errors.notFound("Completion")
    }

    return Errors.internal()
  }
}
