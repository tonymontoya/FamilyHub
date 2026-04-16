/**
 * Event Reminders API
 * 
 * POST /api/calendar/events/[id]/reminders - Create a reminder
 */

import { prisma } from "@/lib/prisma"
import { requireAuth, getEventWithAccess } from "@/lib/auth-utils"
import { withErrorHandling, createdResponse, Errors } from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import { z } from "zod"

// Validation schema
const createReminderSchema = z.object({
  minutesBefore: z.number().min(0).max(10080), // Max 1 week
  type: z.enum(["BROWSER", "EMAIL", "PUSH"]).default("BROWSER"),
})

const MAX_REMINDERS_PER_EVENT = 5

/**
 * POST /api/calendar/events/[id]/reminders
 * 
 * Create a reminder for an event
 */
export const POST = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id: eventId } = await context.params

  // Rate limit
  const rateLimitHeaders = applyRateLimit("eventUpdate", member.id)

  // Get event with access check
  const event = await getEventWithAccess(eventId, member)

  // Parse and validate body
  const body = await request.json()
  const data = createReminderSchema.parse(body)

  // Check max reminders
  const existingCount = await prisma.eventReminder.count({
    where: { eventId }
  })

  if (existingCount >= MAX_REMINDERS_PER_EVENT) {
    throw Errors.validation([{
      path: "reminder",
      message: `Maximum ${MAX_REMINDERS_PER_EVENT} reminders per event`,
    }])
  }

  // Check for duplicate reminder time
  const existing = await prisma.eventReminder.findFirst({
    where: {
      eventId,
      minutesBefore: data.minutesBefore,
    }
  })

  if (existing) {
    throw Errors.validation([{
      path: "minutesBefore",
      message: "A reminder already exists for this time",
    }])
  }

  // Create reminder
  const reminder = await prisma.eventReminder.create({
    data: {
      eventId,
      minutesBefore: data.minutesBefore,
      type: data.type,
      isSent: false,
    }
  })

  return createdResponse({
    id: reminder.id,
    eventId: reminder.eventId,
    minutesBefore: reminder.minutesBefore,
    type: reminder.type,
    isSent: reminder.isSent,
    createdAt: reminder.createdAt.toISOString(),
  }, rateLimitHeaders)
})
