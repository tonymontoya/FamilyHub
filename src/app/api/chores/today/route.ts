import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { rrulestr } from "rrule"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * GET /api/chores/today
 * 
 * Get all chores scheduled for today (expanded from recurrence rules).
 */
export async function GET() {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get member record
    const member = await prisma.member.findUnique({
      where: { username: session.user.email },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    // Get all active chores for the family
    const chores = await prisma.chore.findMany({
      where: {
        familyId: member.familyId,
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    // Get today's completions
    const todayCompletions = await prisma.completion.findMany({
      where: {
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        choreId: true,
        memberId: true,
        status: true,
      },
    })

    // Create a set of completed chore IDs
    const completedChoreIds = new Set(
      todayCompletions
        .filter(c => c.status === "APPROVED" || c.status === "PENDING")
        .map(c => c.choreId)
    )

    // Filter chores that occur today based on recurrence rules
    const todayChores = []

    for (const chore of chores) {
      let occursToday = false

      if (chore.recurrenceRule) {
        try {
          const rule = rrulestr(chore.recurrenceRule)
          const occurrences = rule.between(startOfDay, endOfDay, true)
          
          if (occurrences.length > 0) {
            occursToday = true
          }
        } catch (error) {
          console.error(`Invalid recurrence rule for chore ${chore.id}:`, error)
          // If we can't parse the rule, assume it doesn't occur today
          occursToday = false
        }
      } else {
        // No recurrence rule - treat as one-time chore
        // For now, assume it occurs today if active
        occursToday = true
      }

      if (occursToday) {
        todayChores.push({
          id: chore.id,
          title: chore.title,
          description: chore.description,
          points: chore.points,
          assigneeId: chore.assigneeId,
          assigneeName: chore.assignee?.displayName || null,
          scheduledFor: startOfDay.toISOString(),
          completed: completedChoreIds.has(chore.id),
        })
      }
    }

    return NextResponse.json({ chores: todayChores })

  } catch (error) {
    console.error("Get today's chores error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
