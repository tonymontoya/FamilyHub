/**
 * Individual Exception API
 * 
 * DELETE /api/calendar/events/[id]/exceptions/[exceptionId]
 * 
 * Removes an exception, restoring the original recurring event occurrence.
 */

import { prisma } from "@/lib/prisma"
import { requireAuth, getEventWithAccess, requireModifyAccess } from "@/lib/auth-utils"
import {
  withErrorHandling,
  noContentResponse,
  Errors,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"

/**
 * DELETE /api/calendar/events/[id]/exceptions/[exceptionId]
 * 
 * Removes an exception, restoring the original occurrence.
 */
export const DELETE = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id, exceptionId } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("eventUpdate", member.id)

  // Get event with access verification
  const event = await getEventWithAccess(id, member)

  // Check modify permissions
  await requireModifyAccess(member, event.createdById, "Event")

  // Verify the exception exists and belongs to this event
  const exception = await prisma.eventException.findFirst({
    where: {
      id: exceptionId,
      eventId: id,
    },
  })

  if (!exception) {
    throw Errors.notFound("Exception")
  }

  // Delete the exception
  await prisma.eventException.delete({
    where: { id: exceptionId },
  })

  return noContentResponse()
})
