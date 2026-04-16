/**
 * Active Reminders API
 * 
 * GET /api/calendar/reminders/active
 * 
 * Returns browser reminders that need to be shown to the user.
 * Used by client-side polling to show notifications while user is on the site.
 * 
 * Returns reminders that:
 * 1. Belong to events in the user's family
 * 2. Are of type BROWSER
 * 3. Are NOT acknowledged (isAcknowledged = false)
 * 4. Have passed their reminder time (scheduledTime <= now)
 * 5. Event hasn't ended yet
 */

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { withErrorHandling, successResponse, Errors } from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import { subMinutes } from "date-fns"

/**
 * GET /api/calendar/reminders/active
 * 
 * Query params:
 *   - since: ISO timestamp (optional, default: 10 minutes ago)
 *     Used to catch any reminders that might have been missed due to clock skew
 */
export const GET = withErrorHandling(async (request) => {
  const { member } = await requireAuth()

  // Rate limit: max 60 requests per minute (poll every 1s max)
  const rateLimitHeaders = applyRateLimit("read", member.id)

  // Parse query params
  const { searchParams } = new URL(request.url)
  const sinceParam = searchParams.get("since")
  
  // Use consistent timestamp for the entire request
  const requestTime = new Date()
  
  // Default to 10 minutes ago to handle clock skew and missed polls
  const since = sinceParam 
    ? new Date(sinceParam)
    : subMinutes(requestTime, 10)

  // Find active browser reminders that haven't been acknowledged
  const reminders = await prisma.eventReminder.findMany({
    where: {
      type: "BROWSER",
      isAcknowledged: false,
      // Reminder time has passed (use 5 min buffer for recovery)
      event: {
        familyId: member.familyId,
        deletedAt: null,
        // Event hasn't ended yet (or just started)
        startDate: {
          gte: subMinutes(requestTime, 30), // Started within last 30 min or future
        },
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          startTime: true,
          location: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Reasonable limit for active reminders
  })

  // Calculate scheduled time for each reminder and filter
  const now = requestTime
  const activeReminders = reminders.filter(reminder => {
    const eventStart = new Date(reminder.event.startDate)
    if (reminder.event.startTime) {
      const time = new Date(reminder.event.startTime)
      eventStart.setHours(time.getHours(), time.getMinutes(), 0, 0)
    }
    const scheduledTime = subMinutes(eventStart, reminder.minutesBefore)
    return scheduledTime <= now
  })

  // Format response
  const formattedReminders = activeReminders.map((reminder) => ({
    id: reminder.id,
    eventId: reminder.eventId,
    eventTitle: reminder.event.title,
    eventStartDate: reminder.event.startDate.toISOString(),
    eventStartTime: reminder.event.startTime?.toISOString() || null,
    eventLocation: reminder.event.location,
    minutesBefore: reminder.minutesBefore,
    type: reminder.type,
    createdAt: reminder.createdAt.toISOString(),
  }))

  return successResponse({
    reminders: formattedReminders,
    checkedAt: requestTime.toISOString(),
  }, 200, rateLimitHeaders)
})
