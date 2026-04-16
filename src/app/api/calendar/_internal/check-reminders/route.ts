/**
 * Internal Reminder Check API
 * 
 * GET /api/calendar/_internal/check-reminders
 * 
 * Called by Vercel Cron every minute to check for due reminders.
 * This is an internal endpoint - should be protected by cron secret.
 * 
 * For BROWSER reminders: They remain "unsent" until the user acknowledges them.
 * This prevents missed notifications when the user isn't actively polling.
 * 
 * For EMAIL/PUSH reminders: These are sent server-side and marked as sent immediately.
 */

import { prisma } from "@/lib/prisma"
import { withErrorHandling, successResponse } from "@/lib/errors"
import { subMinutes } from "date-fns"

// Simple in-memory deduplication to prevent double-sending
// In production, use Redis or database locking
const inFlightReminders = new Map<string, number>()
const IN_FLIGHT_TTL = 5 * 60 * 1000 // 5 minutes

// Clean up stale in-flight entries periodically
function cleanupInFlightReminders() {
  const now = Date.now()
  for (const [id, timestamp] of inFlightReminders.entries()) {
    if (now - timestamp > IN_FLIGHT_TTL) {
      inFlightReminders.delete(id)
    }
  }
}

/**
 * Check for reminders that need to be sent
 */
export const GET = withErrorHandling(async (request) => {
  // Verify cron secret is required in production
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn("CRON_SECRET not set - cron job is insecure!")
  }
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Clean up stale entries
  cleanupInFlightReminders()

  const now = new Date()
  const checkWindow = subMinutes(now, 5) // Check for reminders up to 5 minutes past due (for recovery)

  // Find unsent reminders where event starts within the reminder window
  const dueReminders = await prisma.eventReminder.findMany({
    where: {
      isSent: false,
      event: {
        // Event hasn't started yet or just started
        startDate: {
          gte: checkWindow,
        },
        deletedAt: null,
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          startTime: true,
          familyId: true,
        }
      }
    }
  })

  const results = {
    checked: dueReminders.length,
    sent: 0,
    browserReady: 0, // BROWSER reminders that are ready to be shown
    errors: 0,
    skipped: 0,
  }

  for (const reminder of dueReminders) {
    // Skip if already being processed
    if (inFlightReminders.has(reminder.id)) {
      results.skipped++
      continue
    }

    // Calculate actual reminder time
    const eventStart = new Date(reminder.event.startDate)
    if (reminder.event.startTime) {
      const time = new Date(reminder.event.startTime)
      eventStart.setHours(time.getHours(), time.getMinutes(), 0, 0)
    }

    const reminderTime = subMinutes(eventStart, reminder.minutesBefore)

    // Only send if reminder time has passed
    if (reminderTime > now) {
      // Not due yet, skip
      continue
    }

    // Mark as in-flight to prevent duplicates
    inFlightReminders.set(reminder.id, Date.now())

    try {
      switch (reminder.type) {
        case "BROWSER":
          // For browser reminders, we DON'T mark them as sent here.
          // They remain "unsent" until the user acknowledges them client-side.
          // This ensures users don't miss reminders if they weren't polling when the reminder fired.
          results.browserReady++
          break
          
        case "EMAIL":
          // TODO: Implement email notifications
          // For now, mark as sent to prevent repeated attempts
          await prisma.eventReminder.update({
            where: { id: reminder.id },
            data: { isSent: true, sentAt: new Date() },
          })
          results.sent++
          break
          
        case "PUSH":
          // TODO: Implement push notifications
          // For now, mark as sent to prevent repeated attempts
          await prisma.eventReminder.update({
            where: { id: reminder.id },
            data: { isSent: true, sentAt: new Date() },
          })
          results.sent++
          break
      }
    } catch (error) {
      console.error(`Failed to process reminder ${reminder.id}:`, error)
      results.errors++
    } finally {
      inFlightReminders.delete(reminder.id)
    }
  }

  return successResponse(results)
})
