/**
 * Calendar Events API
 * 
 * GET  /api/calendar/events - List events for date range
 * POST /api/calendar/events - Create a new event
 */

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import {
  createEventSchema,
  dateRangeSchema,
  validateOrThrow,
} from "@/lib/validation"
import {
  withErrorHandling,
  successResponse,
  createdResponse,
  Errors,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import { startOfDay, endOfDay, parseISO } from "date-fns"
import type { EventType } from "@prisma/client"

/**
 * GET /api/calendar/events
 * 
 * Query params:
 *   - start: Start date (YYYY-MM-DD, required)
 *   - end: End date (YYYY-MM-DD, required)
 *   - type: Filter by event type (optional)
 *   - assigneeId: Filter by assignee member ID (optional)
 *   - limit: Max results (default 50, max 100)
 *   - offset: Pagination offset (default 0)
 */
export const GET = withErrorHandling(async (request) => {
  const { member } = await requireAuth()

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("read", member.id)

  // Parse query params
  const { searchParams } = new URL(request.url)
  const startParam = searchParams.get("start")
  const endParam = searchParams.get("end")
  const type = searchParams.get("type")
  const assigneeId = searchParams.get("assigneeId")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  // Validate date range
  const dateRange = validateOrThrow(dateRangeSchema, {
    start: startParam,
    end: endParam,
  })

  const startDate = startOfDay(parseISO(dateRange.start))
  const endDate = endOfDay(parseISO(dateRange.end))

  // Build where clause
  const where = {
    familyId: member.familyId,
    deletedAt: null,
    // Events that overlap with the date range
    OR: [
      // Events starting within range
      {
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      // Recurring events that may have occurrences in range
      {
        isRecurring: true,
        OR: [
          { recurrenceEnd: null },
          { recurrenceEnd: { gte: startDate } },
        ],
      },
    ],
    ...(type && { type: type as EventType }),
    ...(assigneeId && {
      OR: [
        { assigneeIds: { has: assigneeId } },
        { isFamilyWide: true },
      ],
    }),
  }

  // Fetch events with pagination
  const [events, total] = await Promise.all([
    prisma.calendarEvent.findMany({
      where,
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
        exceptions: {
          where: {
            originalDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        reminders: true,
      },
      orderBy: { startDate: "asc" },
      take: limit,
      skip: offset,
    }),
    prisma.calendarEvent.count({ where }),
  ])

  // Transform for response
  const response = {
    events: events.map((event) => ({
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
    })),
    range: {
      start: dateRange.start,
      end: dateRange.end,
    },
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + events.length < total,
    },
  }

  return successResponse(response, 200, rateLimitHeaders)
})

/**
 * POST /api/calendar/events
 * 
 * Body: CreateEventInput
 */
export const POST = withErrorHandling(async (request) => {
  const { member } = await requireAuth()

  // Rate limit check - use stricter limit for event creation
  const rateLimitHeaders = applyRateLimit("eventCreate", member.id)

  // Parse and validate body
  const body = await request.json()
  const data = validateOrThrow(createEventSchema, body)

  // Validate assignees are family members (if provided)
  if (data.assigneeIds.length > 0) {
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

  // Parse dates
  const startDate = parseISO(data.startDate)
  const startTime = data.startTime
    ? new Date(`${data.startDate}T${data.startTime}:00`)
    : null
  const endDate = data.endDate ? parseISO(data.endDate) : null
  const endTime = data.endTime && data.startTime
    ? new Date(`${data.endDate || data.startDate}T${data.endTime}:00`)
    : null
  const recurrenceEnd = data.recurrenceEnd
    ? new Date(data.recurrenceEnd)
    : null

  // Create event with reminders in transaction
  const event = await prisma.$transaction(async (tx) => {
    const createdEvent = await tx.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startDate,
        startTime,
        endDate,
        endTime,
        timezone: data.timezone,
        isRecurring: data.isRecurring,
        recurrenceRule: data.recurrenceRule,
        recurrenceEnd,
        assigneeIds: data.assigneeIds,
        isFamilyWide: data.isFamilyWide,
        type: data.type,
        location: data.location,
        color: data.color,
        familyId: member.familyId,
        createdById: member.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Create reminders if provided
    if (data.reminders.length > 0) {
      await tx.eventReminder.createMany({
        data: data.reminders.map((reminder) => ({
          eventId: createdEvent.id,
          minutesBefore: reminder.minutesBefore,
          type: reminder.type,
        })),
      })
    }

    // Create attendee records for assignees (if not family-wide)
    if (!data.isFamilyWide && data.assigneeIds.length > 0) {
      await tx.eventAttendee.createMany({
        data: data.assigneeIds.map((assigneeId) => ({
          eventId: createdEvent.id,
          memberId: assigneeId,
          status: "ACCEPTED" as const,
        })),
        skipDuplicates: true,
      })
    }

    return createdEvent
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

  return createdResponse(response, rateLimitHeaders)
})
