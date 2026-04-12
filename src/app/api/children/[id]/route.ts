import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * DELETE /api/children/:id
 * 
 * Soft delete a child account (parent only).
 * Sets deletedAt timestamp - data retained for 30 days per FRD.
 */
export async function DELETE(
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
        { error: "Can only delete child accounts" },
        { status: 400 }
      )
    }

    // Soft delete the member record
    await prisma.member.update({
      where: { id: childId },
      data: { deletedAt: new Date() },
    })

    // Note: We're not deleting the Better-Auth user account immediately
    // This allows the child to still log in during the 30-day retention period
    // A background job should permanently delete data after 30 days

    return NextResponse.json({
      success: true,
      message: "Child account scheduled for deletion (30-day retention period)",
    })

  } catch (error) {
    console.error("Delete child error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
