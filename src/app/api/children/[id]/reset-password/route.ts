import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: childId } = await params

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
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Get child member record
    const childMember = await prisma.member.findUnique({
      where: { id: childId },
    })

    if (!childMember) {
      return NextResponse.json(
        { error: "Child not found" },
        { status: 404 }
      )
    }

    // Verify child belongs to parent's family
    if (childMember.familyId !== parentMember.familyId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Verify this is a child account
    if (childMember.role !== "CHILD") {
      return NextResponse.json(
        { error: "Can only reset passwords for child accounts" },
        { status: 400 }
      )
    }

    // Generate new password
    const newPassword = generatePassword()

    // Get the Better-Auth user
    const authUser = await prisma.user.findUnique({
      where: { username: childMember.username },
    })

    if (!authUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: "Credential account not found" },
        { status: 404 }
      )
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

    return NextResponse.json({
      success: true,
      newPassword,
    })

  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
