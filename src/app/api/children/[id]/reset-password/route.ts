import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-utils"
import { Errors, withErrorHandling, successResponse } from "@/lib/errors"
import { randomInt } from "crypto"

// Generate a cryptographically secure random password
function generatePassword(): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  const charsetLength = charset.length

  // Use Node.js crypto for cryptographically secure randomness

  let password = ""
  for (let i = 0; i < 16; i++) {
    password += charset.charAt(randomInt(0, charsetLength))
  }
  return password
}

/**
 * POST /api/children/:id/reset-password
 *
 * Reset a child's password (parent only).
 * Generates a new password and returns it (displayed once).
 */
export const POST = withErrorHandling(async (_request, context) => {
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
    throw Errors.badRequest("Can only reset passwords for child accounts")
  }

  // Generate new password
  const newPassword = generatePassword()

  // Get the Better-Auth user
  const authUser = await prisma.user.findUnique({
    where: { username: childMember.username },
  })

  if (!authUser) {
    throw Errors.notFound("User account")
  }

  // Update password via Better-Auth
  // Note: Better-Auth stores passwords in the Account table
  const account = await prisma.account.findFirst({
    where: {
      userId: authUser.id,
      providerId: "credential",
    },
  })

  if (!account) {
    throw Errors.notFound("Credential account")
  }

  // Hash the new password using Better-Auth's expected format
  // Better-Auth uses scrypt by default
  const { hashPassword } = await import("better-auth/crypto")
  const hashedPassword = await hashPassword(newPassword)

  // Update the account password
  await prisma.account.update({
    where: { id: account.id },
    data: { password: hashedPassword },
  })

  return successResponse({ newPassword })
})
