/**
 * Acknowledge Reminder API
 * 
 * POST /api/calendar/reminders/[id]/acknowledge
 * 
 * Marks a browser reminder as acknowledged by the user.
 * This prevents duplicate notifications after page refresh.
 */

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { withErrorHandling, successResponse, Errors, type RouteHandler } from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"

/**
 * POST /api/calendar/reminders/[id]/acknowledge
 */
const handler: RouteHandler = async (request, context) => {
  const { member } = await requireAuth()
  const rateLimitHeaders = applyRateLimit("eventUpdate", member.id)
  
  const params = await context.params
  const id = params.id

  if (!id) {
    throw Errors.badRequest("Reminder ID is required")
  }

  // Find the reminder and verify it belongs to the user's family
  const reminder = await prisma.eventReminder.findFirst({
    where: {
      id,
      event: {
        familyId: member.familyId,
        deletedAt: null,
      },
    },
  })

  if (!reminder) {
    throw Errors.notFound("Reminder not found")
  }

  // Mark as acknowledged (which also marks as sent for browser reminders)
  const updated = await prisma.eventReminder.update({
    where: { id },
    data: {
      isAcknowledged: true,
      acknowledgedAt: new Date(),
      // For browser reminders, acknowledgment = sent
      ...(reminder.type === "BROWSER" ? { isSent: true, sentAt: new Date() } : {}),
    },
  })

  return successResponse({ success: true, reminder: updated }, 200, rateLimitHeaders)
}

export const POST = withErrorHandling(handler)
