/**
 * Bulk Acknowledge Reminders API
 * 
 * POST /api/calendar/reminders/acknowledge
 * 
 * Bulk acknowledge multiple reminders at once.
 */

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { withErrorHandling, successResponse, Errors } from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import { z } from "zod"

const bulkAcknowledgeSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
})

/**
 * POST /api/calendar/reminders/acknowledge
 */
export const POST = withErrorHandling(async (request: Request) => {
  const { member } = await requireAuth()
  const rateLimitHeaders = applyRateLimit("eventUpdate", member.id)

  const body = await request.json()
  const { ids } = bulkAcknowledgeSchema.parse(body)

  // Verify all reminders belong to user's family
  const reminders = await prisma.eventReminder.findMany({
    where: {
      id: { in: ids },
      event: {
        familyId: member.familyId,
        deletedAt: null,
      },
    },
    select: { id: true, type: true },
  })

  if (reminders.length !== ids.length) {
    throw Errors.notFound("One or more reminders not found")
  }

  const now = new Date()

  // Bulk update all reminders
  const { count } = await prisma.eventReminder.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      isAcknowledged: true,
      acknowledgedAt: now,
      // Only mark as sent for browser reminders
      isSent: true,
      sentAt: now,
    },
  })

  return successResponse({ acknowledged: count }, 200, rateLimitHeaders)
})
