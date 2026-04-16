/**
 * Event Exceptions API
 * 
 * POST   /api/calendar/events/[id]/exceptions - Create exception for recurring event
 * DELETE /api/calendar/events/[id]/exceptions/[exceptionId] - Remove exception
 * 
 * Exceptions allow modifying specific occurrences of recurring events
 * without affecting the entire series.
 */

import { prisma } from "@/lib/prisma"
import { requireAuth, getEventWithAccess, requireModifyAccess } from "@/lib/auth-utils"
import { createExceptionSchema, validateOrThrow } from "@/lib/validation"
import {
  withErrorHandling,
  successResponse,
  createdResponse,
  Errors,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import { parseISO } from "date-fns"

/**
 * POST /api/calendar/events/[id]/exceptions
 * 
 * Creates an exception for a specific occurrence of a recurring event.
 * This allows modifying one instance without affecting the series.
 * 
 * Body: {
 *   originalDate: string (YYYY-MM-DD) - The date of the occurrence to modify
 *   title?: string - Override the title for this occurrence
 *   description?: string - Override the description
 *   startTime?: string (HH:MM) - Override start time
 *   endTime?: string (HH:MM) - Override end time
 *   location?: string - Override location
 *   isCancelled?: boolean - Cancel this occurrence
 * }
 */
export const POST = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("eventUpdate", member.id)

  // Get event with access verification
  const event = await getEventWithAccess(id, member)

  // Check modify permissions
  await requireModifyAccess(member, event.createdById, "Event")

  // Must be a recurring event to create exceptions
  if (!event.isRecurring) {
    throw Errors.validation([{
      path: "event",
      message: "Cannot create exceptions for non-recurring events",
    }])
  }

  // Parse and validate body
  const body = await request.json()
  const data = validateOrThrow(createExceptionSchema, body)

  // Parse the original date
  const originalDate = parseISO(data.originalDate)

  // Validate that originalDate is within the event's recurrence range
  if (originalDate < event.startDate) {
    throw Errors.validation([{
      path: "originalDate",
      message: "Exception date cannot be before the event start date",
    }])
  }

  if (event.recurrenceEnd && originalDate > event.recurrenceEnd) {
    throw Errors.validation([{
      path: "originalDate",
      message: "Exception date cannot be after the recurrence end date",
    }])
  }

  // Parse times if provided (stored as UTC)
  const startTime = data.startTime
    ? new Date(`${data.originalDate}T${data.startTime}:00Z`)
    : null
  const endTime = data.endTime
    ? new Date(`${data.originalDate}T${data.endTime}:00Z`)
    : null

  // Create or update the exception
  const exception = await prisma.eventException.upsert({
    where: {
      eventId_originalDate: {
        eventId: id,
        originalDate,
      },
    },
    create: {
      eventId: id,
      originalDate,
      title: data.title,
      description: data.description,
      startTime,
      endTime,
      location: data.location,
      isCancelled: data.isCancelled,
    },
    update: {
      title: data.title,
      description: data.description,
      startTime,
      endTime,
      location: data.location,
      isCancelled: data.isCancelled,
    },
  })

  const response = {
    id: exception.id,
    eventId: exception.eventId,
    originalDate: exception.originalDate.toISOString(),
    title: exception.title,
    description: exception.description,
    startTime: exception.startTime?.toISOString() || null,
    endTime: exception.endTime?.toISOString() || null,
    location: exception.location,
    isCancelled: exception.isCancelled,
    createdAt: exception.createdAt.toISOString(),
    updatedAt: exception.updatedAt.toISOString(),
  }

  return createdResponse(response, rateLimitHeaders)
})
