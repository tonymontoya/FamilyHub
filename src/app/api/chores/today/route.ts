import { NextRequest, NextResponse } from "next/server"
import { rrulestr } from "rrule"
import { prisma } from "@/lib/prisma"
import { authenticate, requireAuth, Errors } from "@/lib/api-utils"

/**
 * Get today's date range in a specific timezone
 * Defaults to 'America/Los_Angeles' if no timezone provided
 */
function getTodayRange(timezone: string): { startOfDay: Date; endOfDay: Date } {
  // Create date in the target timezone
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

  // Create start and end of day in that timezone, then convert to UTC for DB query
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))

  return { startOfDay, endOfDay }
}

/**
 * GET /api/chores/today
 *
 * Get all chores scheduled for today (expanded from recurrence rules).
 * Query params:
 * - timezone: IANA timezone string (default: America/Los_Angeles)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authContext = await authenticate()
    const authError = requireAuth(authContext)
    if (authError) return authError

    const member = authContext!.member

    // Get timezone from query params
    const { searchParams } = new URL(request.url)
    const timezone = searchParams.get("timezone") || "America/Los_Angeles"

    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch {
      return Errors.badRequest("Invalid timezone")
    }

    // Get today's date range in the requested timezone
    const { startOfDay, endOfDay } = getTodayRange(timezone)

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

    // Get today's completions for THIS FAMILY ONLY
    // We need to join through chores to ensure family isolation
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
      select: {
        choreId: true,
        memberId: true,
        status: true,
      },
    })

    // Create a set of completed chore IDs
    const completedChoreIds = new Set(
      todayCompletions
        .filter((c) => c.status === "APPROVED" || c.status === "PENDING")
        .map((c) => c.choreId)
    )

    // Track chores with invalid rules for reporting
    const invalidRules: Array<{ choreId: string; error: string }> = []

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
          invalidRules.push({
            choreId: chore.id,
            error: (error as Error).message,
          })
          // If we can't parse the rule, assume it doesn't occur today
          occursToday = false
        }
      } else {
        // No recurrence rule - treat as one-time chore
        // For now, assume it occurs today if active
        // TODO: Add createdAt check - one-time chores should only show for a limited time
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

    return NextResponse.json({
      chores: todayChores,
      meta: {
        date: startOfDay.toISOString().split("T")[0],
        timezone,
        invalidRules: invalidRules.length > 0 ? invalidRules : undefined,
      },
    })
  } catch (error) {
    console.error("Get today's chores error:", error)
    return Errors.internal()
  }
}
