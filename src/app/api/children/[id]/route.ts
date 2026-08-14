import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-utils"
import { Errors, withFlatErrorHandling } from "@/lib/errors"

/**
 * DELETE /api/children/:id
 *
 * Soft delete a child account (parent only).
 * Sets deletedAt timestamp - data retained for 30 days per FRD.
 */
export const DELETE = withFlatErrorHandling(async (_request, context) => {
  const { id: childId } = await context.params

  const { member } = await requireAuth()
  requireRole(member, "PARENT")

  // Get child member record
  const childMember = await prisma.member.findUnique({
    where: { id: childId },
  })

  if (!childMember) {
    throw Errors.notFound("Child")
  }

  // Verify child belongs to parent's family
  if (childMember.familyId !== member.familyId) {
    throw Errors.forbidden("Access denied")
  }

  // Verify this is a child account
  if (childMember.role !== "CHILD") {
    throw Errors.badRequest("Can only delete child accounts")
  }

  // Get the auth user to delete their sessions
  const authUser = await prisma.user.findUnique({
    where: { username: childMember.username },
  })

  if (authUser) {
    // Delete all active sessions for this user
    await prisma.session.deleteMany({
      where: { userId: authUser.id },
    })
  }

  // Soft delete the member record
  await prisma.member.update({
    where: { id: childId },
    data: { deletedAt: new Date() },
  })

  // Note: We're soft-deleting, not hard-deleting.
  // The Better-Auth user record remains but sessions are invalidated.
  // A background job should permanently delete data after 30 days.

  return NextResponse.json({
    success: true,
    message: "Child account scheduled for deletion (30-day retention period)",
  })
})
