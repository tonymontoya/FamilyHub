import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  authenticate,
  requireAuth,
  requireRole,
  isValidUUID,
  Errors,
} from "@/lib/api-utils"
import { rrulestr } from "rrule"

// Update validation schema
const updateChoreSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  points: z
    .number()
    .int()
    .min(0, "Points must be 0 or more")
    .max(100, "Points must be 100 or less")
    .optional(),
  recurrenceRule: z.string().min(1, "Recurrence rule is required").optional(),
  assigneeId: z
    .string()
    .refine((val) => val === "" || val === null || isValidUUID(val), {
      message: "Invalid assignee ID",
    })
    .optional()
    .nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
})

/**
 * Validate RRULE format
 */
function validateRRule(rruleString: string): { valid: boolean; error?: string } {
  try {
    rrulestr(rruleString)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: `Invalid RRULE format: ${(error as Error).message}`,
    }
  }
}

/**
 * PATCH /api/chores/:id
 *
 * Update chore details (parent only).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: choreId } = await params

    // Validate UUID format
    if (!isValidUUID(choreId)) {
      return Errors.badRequest("Invalid chore ID format")
    }

    // Authenticate
    const authContext = await authenticate()
    const authError = requireAuth(authContext)
    if (authError) return authError

    // Require parent role
    const roleError = requireRole(authContext!, "PARENT")
    if (roleError) return roleError

    const parentMember = authContext!.member

    // Get the chore
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
    })

    if (!chore) {
      return Errors.notFound("Chore")
    }

    // Verify chore belongs to parent's family
    if (chore.familyId !== parentMember.familyId) {
      return Errors.forbidden("Access denied")
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Errors.badRequest("Invalid JSON in request body")
    }

    const validationResult = updateChoreSchema.safeParse(body)
    if (!validationResult.success) {
      return Errors.badRequest(
        "Invalid input",
        validationResult.error.flatten()
      )
    }

    const updates = validationResult.data

    // Validate RRULE if being updated
    if (updates.recurrenceRule) {
      const rruleValidation = validateRRule(updates.recurrenceRule)
      if (!rruleValidation.valid) {
        return Errors.badRequest(rruleValidation.error!)
      }
    }

    // If assignee being updated, verify they belong to same family
    if (updates.assigneeId && updates.assigneeId !== "") {
      const assignee = await prisma.member.findUnique({
        where: { id: updates.assigneeId },
      })

      if (!assignee) {
        return Errors.notFound("Assignee")
      }

      if (assignee.familyId !== parentMember.familyId) {
        return Errors.forbidden("Assignee does not belong to your family")
      }
    }

    // Sanitize inputs
    const updateData: Record<string, unknown> = {}

    if (updates.title !== undefined) {
      updateData.title = updates.title.trim()
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null
    }
    if (updates.points !== undefined) {
      updateData.points = updates.points
    }
    if (updates.recurrenceRule !== undefined) {
      updateData.recurrenceRule = updates.recurrenceRule
    }
    if (updates.assigneeId !== undefined) {
      updateData.assigneeId = updates.assigneeId === "" ? null : updates.assigneeId
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status
    }

    // Update the chore
    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: updateData,
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
      id: updatedChore.id,
      title: updatedChore.title,
      description: updatedChore.description,
      points: updatedChore.points,
      recurrenceRule: updatedChore.recurrenceRule,
      assigneeId: updatedChore.assigneeId,
      assignee: updatedChore.assignee,
      status: updatedChore.status,
      createdAt: updatedChore.createdAt,
      updatedAt: updatedChore.updatedAt,
    })
  } catch (error) {
    console.error("Chore update error:", error)
    return Errors.internal()
  }
}

/**
 * DELETE /api/chores/:id
 *
 * Soft delete (archive) a chore (parent only).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: choreId } = await params

    // Validate UUID format
    if (!isValidUUID(choreId)) {
      return Errors.badRequest("Invalid chore ID format")
    }

    // Authenticate
    const authContext = await authenticate()
    const authError = requireAuth(authContext)
    if (authError) return authError

    // Require parent role
    const roleError = requireRole(authContext!, "PARENT")
    if (roleError) return roleError

    const parentMember = authContext!.member

    // Get the chore
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
    })

    if (!chore) {
      return Errors.notFound("Chore")
    }

    // Verify chore belongs to parent's family
    if (chore.familyId !== parentMember.familyId) {
      return Errors.forbidden("Access denied")
    }

    // Soft delete by updating status and deletedAt
    await prisma.chore.update({
      where: { id: choreId },
      data: {
        status: "ARCHIVED",
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Chore archived successfully",
    })
  } catch (error) {
    console.error("Chore delete error:", error)
    return Errors.internal()
  }
}
