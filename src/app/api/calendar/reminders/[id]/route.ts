/**
 * Individual Reminder API
 * 
 * DELETE /api/calendar/reminders/[id] - Delete a reminder
 */

import { prisma } from "@/lib/prisma"
import { requireAuth, requireModifyAccess } from "@/lib/auth-utils"
import { withErrorHandling, noContentResponse, Errors } from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"

/**
 * DELETE /api/calendar/reminders/[id]
 * 
 * Delete a reminder
 */
export const DELETE = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit
  const rateLimitHeaders = applyRateLimit("eventUpdate", member.id)

  // Get reminder with event info
  const reminder = await prisma.eventReminder.findFirst({
    where: { id },
    include: {
      event: {
        select: {
          createdById: true,
          familyId: true,
        }
      }
    }
  })

  if (!reminder) {
    throw Errors.notFound("Reminder")
  }

  // Verify family access
  if (reminder.event.familyId !== member.familyId) {
    throw Errors.notFound("Reminder")
  }

  // Check modify permissions
  await requireModifyAccess(member, reminder.event.createdById, "Reminder")

  // Delete reminder
  await prisma.eventReminder.delete({
    where: { id }
  })

  return noContentResponse()
})
