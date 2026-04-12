import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
  recurrenceRule: z
    .string()
    .min(1, "Recurrence rule is required")
    .optional(),
  assigneeId: z
    .string()
    .uuid("Invalid assignee ID")
    .optional()
    .nullable(),
  status: z
    .enum(["ACTIVE", "ARCHIVED"])
    .optional(),
})

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
        { error: "Forbidden - Only parents can update chores" },
        { status: 403 }
      )
    }

    // Get the chore
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
    })

    if (!chore) {
      return NextResponse.json(
        { error: "Chore not found" },
        { status: 404 }
      )
    }

    // Verify chore belongs to parent's family
    if (chore.familyId !== parentMember.familyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
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

    const validationResult = updateChoreSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const updates = validationResult.data

    // If assignee being updated, verify they belong to same family
    if (updates.assigneeId) {
      const assignee = await prisma.member.findUnique({
        where: { id: updates.assigneeId },
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
      updateData.assigneeId = updates.assigneeId
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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
        { error: "Forbidden - Only parents can delete chores" },
        { status: 403 }
      )
    }

    // Get the chore
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
    })

    if (!chore) {
      return NextResponse.json(
        { error: "Chore not found" },
        { status: 404 }
      )
    }

    // Verify chore belongs to parent's family
    if (chore.familyId !== parentMember.familyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
