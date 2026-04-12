import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  authenticate,
  requireAuth,
  checkRateLimit,
  Errors,
} from "@/lib/api-utils"
import { rrulestr } from "rrule"

// Rate limiting: 60 requests per minute per user
const RATE_LIMIT_CONFIG = { max: 60, windowMs: 60 * 1000 }

/**
 * GET /api/dashboard
 *
 * Returns unified dashboard data for the authenticated user.
 * Different data is returned based on role (parent vs child).
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authContext = await authenticate()
    const authError = requireAuth(authContext)
    if (authError) return authError

    const member = authContext!.member

    // Check rate limit
    if (!checkRateLimit(`dashboard:${member.id}`, RATE_LIMIT_CONFIG)) {
      return Errors.tooManyRequests()
    }

    // Get timezone from query params (default to UTC)
    const { searchParams } = new URL(request.url)
    const timezone = searchParams.get("timezone") || "UTC"

    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch {
      return Errors.badRequest("Invalid timezone")
    }

    // Calculate today's date range in the requested timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })

    const parts = formatter.formatToParts(now)
    const year = parseInt(parts.find((p) => p.type === "year")?.value || "0")
    const month = parseInt(parts.find((p) => p.type === "month")?.value || "0")
    const day = parseInt(parts.find((p) => p.type === "day")?.value || "0")

    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))

    // Get start of week (Sunday) for "this week" calculations
    const dayOfWeek = new Date(
      Date.UTC(year, month - 1, day)
    ).getUTCDay()
    const startOfWeek = new Date(
      Date.UTC(year, month - 1, day - dayOfWeek, 0, 0, 0)
    )

    // Fetch all active chores for the family
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

    // Get today's completions for the family
    const todayCompletions = await prisma.completion.findMany({
      where: {
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        chore: {
          familyId: member.familyId,
        },
      },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            points: true,
          },
        },
        member: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    // Create a map of completed chore IDs with status
    const completionMap = new Map(
      todayCompletions.map((c) => [
        c.choreId,
        { status: c.status, memberId: c.memberId, completion: c },
      ])
    )

    // Filter chores that occur today
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
          occursToday = false
        }
      } else {
        // No recurrence rule - treat as one-time chore
        occursToday = true
      }

      if (occursToday) {
        const completionInfo = completionMap.get(chore.id)
        todayChores.push({
          id: chore.id,
          title: chore.title,
          points: chore.points,
          assigneeId: chore.assigneeId,
          assigneeName: chore.assignee?.displayName || null,
          status: completionInfo
            ? completionInfo.status === "APPROVED"
              ? "APPROVED"
              : completionInfo.status === "DECLINED"
                ? "DECLINED"
                : "PENDING"
            : "TODO",
          completedBy: completionInfo?.memberId || null,
          completedByName: completionInfo?.completion?.member?.displayName || null,
        })
      }
    }

    // Build response based on role
    const baseResponse = {
      user: {
        id: member.id,
        role: member.role,
        displayName: member.displayName,
      },
      today: {
        date: startOfDay.toISOString().split("T")[0],
        chores: member.role === "CHILD" 
          ? todayChores.filter(
              (c) =>
                c.assigneeId === member.id ||
                (c.assigneeId === null && c.completedBy === member.id) ||
                (!c.assigneeId && c.status === "TODO")
            )
          : todayChores,
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        timezone,
      },
    }

    if (member.role === "PARENT") {
      // Get pending approvals
      const pendingApprovals = await prisma.completion.findMany({
        where: {
          chore: {
            familyId: member.familyId,
          },
          status: "PENDING",
        },
        orderBy: { completedAt: "desc" },
        include: {
          chore: {
            select: {
              id: true,
              title: true,
              points: true,
            },
          },
          member: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      })

      // Get points data for all children
      const children = await prisma.member.findMany({
        where: {
          familyId: member.familyId,
          role: "CHILD",
          deletedAt: null,
        },
        select: {
          id: true,
          displayName: true,
        },
      })

      const pointsData = await Promise.all(
        children.map(async (child) => {
          // Total points (all time)
          const totalResult = await prisma.pointTransaction.aggregate({
            where: {
              memberId: child.id,
              type: "EARNED",
            },
            _sum: { amount: true },
          })

          // This week's points
          const weekResult = await prisma.pointTransaction.aggregate({
            where: {
              memberId: child.id,
              type: "EARNED",
              createdAt: {
                gte: startOfWeek,
              },
            },
            _sum: { amount: true },
          })

          return {
            id: child.id,
            name: child.displayName,
            total: totalResult._sum.amount || 0,
            thisWeek: weekResult._sum.amount || 0,
          }
        })
      )

      // Sort by total points (descending)
      pointsData.sort((a, b) => b.total - a.total)

      return NextResponse.json({
        ...baseResponse,
        today: {
          ...baseResponse.today,
          pendingApprovals: pendingApprovals.map((p) => ({
            id: p.id,
            choreId: p.choreId,
            choreTitle: p.chore.title,
            childId: p.memberId,
            childName: p.member.displayName,
            completedAt: p.completedAt.toISOString(),
            photoUrl: p.photoUrl,
            notes: p.notes,
            points: p.chore.points,
          })),
        },
        points: {
          children: pointsData,
        },
      })
    } else {
      // Child view - personal points only
      const totalResult = await prisma.pointTransaction.aggregate({
        where: {
          memberId: member.id,
          type: "EARNED",
        },
        _sum: { amount: true },
      })

      const weekResult = await prisma.pointTransaction.aggregate({
        where: {
          memberId: member.id,
          type: "EARNED",
          createdAt: {
            gte: startOfWeek,
          },
        },
        _sum: { amount: true },
      })

      return NextResponse.json({
        ...baseResponse,
        points: {
          total: totalResult._sum.amount || 0,
          thisWeek: weekResult._sum.amount || 0,
          weeklyGoal: 100, // MVP default goal
        },
      })
    }
  } catch (error) {
    console.error("Dashboard error:", error)
    return Errors.internal()
  }
}
