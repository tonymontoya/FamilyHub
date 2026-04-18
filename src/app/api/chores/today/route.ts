/**
 * GET /api/chores/today
 * 
 * Returns today's chores for the authenticated child member
 * Includes completion status and stats
 */

import { NextRequest, NextResponse } from "next/server"
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get member
    const member = await prisma.member.findUnique({
      where: { username: session.user.email },
      include: { family: true },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)

    // Get all active chores for this family
    const chores = await prisma.chore.findMany({
      where: {
        familyId: member.familyId,
        status: "ACTIVE",
        deletedAt: null,
        // Only get chores assigned to this member or unassigned
        OR: [
          { assigneeId: member.id },
          { assigneeId: null },
        ],
      },
      orderBy: { createdAt: "desc" },
    })

    // Get today's completions
    const todayCompletions = await prisma.completion.findMany({
      where: {
        memberId: member.id,
        scheduledFor: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        chore: true,
      },
    })

    // Get this week's completions for weekly stats
    const weeklyCompletions = await prisma.completion.findMany({
      where: {
        memberId: member.id,
        scheduledFor: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: "APPROVED",
      },
      include: {
        chore: true,
      },
    })

    // Get total points
    const totalPointsResult = await prisma.completion.aggregate({
      where: {
        memberId: member.id,
        status: "APPROVED",
      },
      _sum: {
        pointsAwarded: true,
      },
    })

    // Calculate weekly points
    const weeklyPoints = weeklyCompletions.reduce(
      (sum, c) => sum + (c.pointsAwarded || c.chore.points),
      0
    )

    // Map chores with status
    const choresWithStatus = chores.map((chore) => {
      const completion = todayCompletions.find((c) => c.choreId === chore.id)
      
      return {
        id: chore.id,
        title: chore.title,
        description: chore.description,
        points: chore.points,
        status: completion?.status || "TODO",
        completedAt: completion?.completedAt?.toISOString(),
      }
    })

    const completedToday = choresWithStatus.filter((c) => c.status === "APPROVED").length

    return NextResponse.json({
      chores: choresWithStatus,
      stats: {
        totalPoints: totalPointsResult._sum.pointsAwarded || 0,
        weeklyPoints,
        completedToday,
        totalToday: chores.length,
      },
    })
  } catch (error) {
    console.error("Get today's chores error:", error)
    return NextResponse.json(
      { error: "Failed to fetch chores" },
      { status: 500 }
    )
  }
}
