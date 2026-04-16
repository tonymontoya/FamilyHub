/**
 * Individual Event API
 * 
 * GET    /api/calendar/events/[id] - Get single event
 * PATCH  /api/calendar/events/[id] - Update event
 * DELETE /api/calendar/events/[id] - Soft delete event
 */

import { prisma } from "@/lib/prisma"
import { requireAuth, getEventWithAccess, requireModifyAccess } from "@/lib/auth-utils"
import { updateEventSchema, validateOrThrow } from "@/lib/validation"
import {
  withErrorHandling,
  successResponse,
  noContentResponse,
  Errors,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import { parseISO } from "date-fns"

/**
 * GET /api/calendar/events/[id]
 */
export const GET = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("read", member.id)

  // Fetch event with access check
  const event = await prisma.calendarEvent.findFirst({
    where: {
      id,
      familyId: member.familyId,
      deletedAt: null,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      attendees: {
        include: {
          member: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      exceptions: true,
      reminders: true,
    },
  })

  if (!event) {
    throw Errors.notFound("Event")
  }

  const response = {
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate.toISOString(),
    startTime: event.startTime?.toISOString() || null,
    endDate: event.endDate?.toISOString() || null,
    endTime: event.endTime?.toISOString() || null,
    timezone: event.timezone,
    isRecurring: event.isRecurring,
    recurrenceRule: event.recurrenceRule,
    recurrenceEnd: event.recurrenceEnd?.toISOString() || null,
    assigneeIds: event.assigneeIds,
    isFamilyWide: event.isFamilyWide,
    type: event.type,
    location: event.location,
    color: event.color,
    createdBy: event.createdBy,
    attendees: event.attendees.map((a) => ({
      id: a.id,
      memberId: a.memberId,
      member: a.member,
      status: a.status,
    })),
    exceptions: event.exceptions.map((e) => ({
      id: e.id,
      originalDate: e.originalDate.toISOString(),
      title: e.title,
      description: e.description,
      startTime: e.startTime?.toISOString() || null,
      endTime: e.endTime?.toISOString() || null,
      location: e.location,
      isCancelled: e.isCancelled,
    })),
    reminders: event.reminders.map((r) => ({
      id: r.id,
      minutesBefore: r.minutesBefore,
      type: r.type,
    })),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }

  return successResponse(response, 200, rateLimitHeaders)
})

/**
 * PATCH /api/calendar/events/[id]
 */
export const PATCH = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("eventUpdate", member.id)

  // Get event with access verification
  const existingEvent = await getEventWithAccess(id, member)

  // Check modify permissions (parents can modify any, children only their own)
  await requireModifyAccess(member, existingEvent.createdById, "Event")

  // Parse and validate body
  const body = await request.json()
  const data = validateOrThrow(updateEventSchema, body)

  // Manual validation for update (since updateEventSchema can't have refinements with .partial())
  const validationErrors: Array<{ path: string; message: string }> = []

  // If setting isRecurring to true, must have recurrenceRule
  if (data.isRecurring === true && !data.recurrenceRule) {
    validationErrors.push({
      path: "recurrenceRule",
      message: "Recurring events must have a recurrence rule",
    })
  }

  // If has endTime, must have startTime
  if (data.endTime !== undefined && data.endTime !== null && !data.startTime && !existingEvent.startTime) {
    validationErrors.push({
      path: "endTime",
      message: "Cannot specify end time without start time",
    })
  }

  // If all-day (no startTime), cannot have endTime
  if (data.startTime === null && data.endTime !== undefined && data.endTime !== null) {
    validationErrors.push({
      path: "endTime",
      message: "All-day events cannot have an end time",
    })
  }

  if (validationErrors.length > 0) {
    throw Errors.validation(validationErrors)
  }

  // Validate assignees are family members (if provided)
  if (data.assigneeIds !== undefined && data.assigneeIds.length > 0) {
    const validMembers = await prisma.member.count({
      where: {
        id: { in: data.assigneeIds },
        familyId: member.familyId,
        deletedAt: null,
      },
    })
    if (validMembers !== data.assigneeIds.length) {
      throw Errors.validation([{
        path: "assigneeIds",
        message: "One or more assignees are not valid family members",
      }])
    }
  }

  // Parse dates if provided (all stored as UTC)
  const startDate = data.startDate ? parseISO(data.startDate) : undefined
  const startTime = data.startTime
    ? new Date(`${data.startDate || existingEvent.startDate.toISOString().split("T")[0]}T${data.startTime}:00Z`)
    : data.startTime === null
      ? null
      : undefined
  const endDate = data.endDate
    ? parseISO(data.endDate)
    : data.endDate === null
      ? null
      : undefined
  const endTime = data.endTime
    ? new Date(
        `${(data.endDate || data.startDate || existingEvent.startDate.toISOString().split("T")[0])}T${data.endTime}:00Z`
      )
    : data.endTime === null
      ? null
      : undefined
  const recurrenceEnd = data.recurrenceEnd
    ? new Date(data.recurrenceEnd)
    : data.recurrenceEnd === null
      ? null
      : undefined

  // Validate endDate >= startDate (if both are being set or one is being changed)
  const effectiveStartDate = startDate ?? existingEvent.startDate
  const effectiveEndDate = endDate ?? existingEvent.endDate
  if (effectiveEndDate && effectiveStartDate && effectiveEndDate < effectiveStartDate) {
    throw Errors.validation([{
      path: "endDate",
      message: "End date must be on or after start date",
    }])
  }

  // Update event and sync attendees in transaction
  const event = await prisma.$transaction(async (tx) => {
    // Update the event
    const updatedEvent = await tx.calendarEvent.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(startDate !== undefined && { startDate }),
        ...(startTime !== undefined && { startTime }),
        ...(endDate !== undefined && { endDate }),
        ...(endTime !== undefined && { endTime }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.recurrenceRule !== undefined && { recurrenceRule: data.recurrenceRule }),
        ...(recurrenceEnd !== undefined && { recurrenceEnd }),
        ...(data.assigneeIds !== undefined && { assigneeIds: data.assigneeIds }),
        ...(data.isFamilyWide !== undefined && { isFamilyWide: data.isFamilyWide }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.color !== undefined && { color: data.color }),
      },
    })

    // Sync attendees if assigneeIds changed
    if (data.assigneeIds !== undefined) {
      // Remove attendees not in new list
      await tx.eventAttendee.deleteMany({
        where: {
          eventId: id,
          memberId: { notIn: data.assigneeIds },
        },
      })

      // Add new attendees (for non-family-wide events)
      if (!data.isFamilyWide && data.assigneeIds.length > 0) {
        const existingAttendees = await tx.eventAttendee.findMany({
          where: { eventId: id },
          select: { memberId: true },
        })
        const existingIds = new Set(existingAttendees.map(a => a.memberId))
        const newAssigneeIds = data.assigneeIds.filter(id => !existingIds.has(id))

        if (newAssigneeIds.length > 0) {
          await tx.eventAttendee.createMany({
            data: newAssigneeIds.map((assigneeId) => ({
              eventId: id,
              memberId: assigneeId,
              status: "ACCEPTED" as const,
            })),
            skipDuplicates: true,
          })
        }
      }
    }

    return updatedEvent
  })

  // Fetch full event with relations
  const fullEvent = await prisma.calendarEvent.findUnique({
    where: { id: event.id },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      attendees: {
        include: {
          member: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      reminders: true,
    },
  })

  const response = {
    id: fullEvent!.id,
    title: fullEvent!.title,
    description: fullEvent!.description,
    startDate: fullEvent!.startDate.toISOString(),
    startTime: fullEvent!.startTime?.toISOString() || null,
    endDate: fullEvent!.endDate?.toISOString() || null,
    endTime: fullEvent!.endTime?.toISOString() || null,
    timezone: fullEvent!.timezone,
    isRecurring: fullEvent!.isRecurring,
    recurrenceRule: fullEvent!.recurrenceRule,
    recurrenceEnd: fullEvent!.recurrenceEnd?.toISOString() || null,
    assigneeIds: fullEvent!.assigneeIds,
    isFamilyWide: fullEvent!.isFamilyWide,
    type: fullEvent!.type,
    location: fullEvent!.location,
    color: fullEvent!.color,
    createdBy: fullEvent!.createdBy,
    attendees: fullEvent!.attendees.map((a) => ({
      id: a.id,
      memberId: a.memberId,
      member: a.member,
      status: a.status,
    })),
    reminders: fullEvent!.reminders.map((r) => ({
      id: r.id,
      minutesBefore: r.minutesBefore,
      type: r.type,
    })),
    createdAt: fullEvent!.createdAt.toISOString(),
    updatedAt: fullEvent!.updatedAt.toISOString(),
  }

  return successResponse(response, 200, rateLimitHeaders)
})

/**
 * DELETE /api/calendar/events/[id]
 * 
 * Soft delete - sets deletedAt timestamp
 */
export const DELETE = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("eventDelete", member.id)

  // Get event with access verification
  const existingEvent = await getEventWithAccess(id, member)

  // Check modify permissions (parents can modify any, children only their own)
  await requireModifyAccess(member, existingEvent.createdById, "Event")

  // Soft delete
  await prisma.calendarEvent.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return noContentResponse()
})
