/**
 * React Query Hook for Event Occurrences
 * 
 * Expands recurring events into individual occurrences for display.
 */

import { useQuery } from "@tanstack/react-query"
import { calendarKeys } from "./keys"
import { fetchEvents } from "./api"
import { generateOccurrences } from "@/lib/calendar/recurrence"
import type { EventOccurrence, OccurrenceFilters, CalendarEvent } from "./types"
import { parseISO, startOfDay, endOfDay } from "date-fns"
import type { CalendarEvent as PrismaCalendarEvent, EventException as PrismaEventException } from "@prisma/client"

/**
 * Convert API CalendarEvent (strings) to Prisma CalendarEvent (Dates)
 */
function toPrismaEvent(event: CalendarEvent): PrismaCalendarEvent {
  return {
    id: event.id,
    familyId: "", // Not needed for recurrence calculation
    createdById: "", // Not needed for recurrence calculation
    title: event.title,
    description: event.description,
    startDate: parseISO(event.startDate),
    startTime: event.startTime ? parseISO(event.startTime) : null,
    endDate: event.endDate ? parseISO(event.endDate) : null,
    endTime: event.endTime ? parseISO(event.endTime) : null,
    timezone: event.timezone,
    isRecurring: event.isRecurring,
    recurrenceRule: event.recurrenceRule,
    recurrenceEnd: event.recurrenceEnd ? parseISO(event.recurrenceEnd) : null,
    assigneeIds: event.assigneeIds,
    isFamilyWide: event.isFamilyWide,
    type: event.type,
    location: event.location,
    color: event.color,
    deletedAt: null,
    createdAt: parseISO(event.createdAt),
    updatedAt: parseISO(event.updatedAt),
  } as PrismaCalendarEvent
}

/**
 * Convert API EventException (strings) to Prisma EventException (Dates)
 */
function toPrismaException(exception: import("./types").EventException): PrismaEventException {
  return {
    id: exception.id,
    eventId: "", // Not needed for recurrence calculation
    originalDate: parseISO(exception.originalDate),
    title: exception.title,
    description: exception.description,
    startTime: exception.startTime ? parseISO(exception.startTime) : null,
    endTime: exception.endTime ? parseISO(exception.endTime) : null,
    location: exception.location,
    isCancelled: exception.isCancelled,
    createdAt: new Date(), // Not used in recurrence calculation
    updatedAt: new Date(), // Not used in recurrence calculation
  } as PrismaEventException
}

export function useOccurrences(filters: OccurrenceFilters) {
  return useQuery<EventOccurrence[]>({
    queryKey: calendarKeys.occurrence(filters),
    queryFn: async () => {
      // Fetch events for the range
      // Note: 500 is a reasonable upper limit for events in a month view
      // including recurring events. Adjust if users have very dense calendars.
      const response = await fetchEvents({
        ...filters,
        limit: 500,
        offset: 0,
      })

      const rangeStart = startOfDay(parseISO(filters.start))
      const rangeEnd = endOfDay(parseISO(filters.end))

      // Expand recurring events into occurrences
      const occurrences: EventOccurrence[] = []

      for (const event of response.events) {
        const eventOccurrences = generateOccurrences(
          toPrismaEvent(event),
          event.exceptions.map(toPrismaException),
          rangeStart,
          rangeEnd
        )

        // Convert to our Occurrence type
        for (const occ of eventOccurrences) {
          // Filter by type if specified
          if (filters.type && occ.type !== filters.type) continue

          // Filter by assignee if specified
          if (filters.assigneeId && !event.assigneeIds.includes(filters.assigneeId)) {
            if (!event.isFamilyWide) continue
          }

          occurrences.push({
            id: occ.id,
            eventId: occ.eventId,
            date: occ.date.toISOString().split("T")[0],
            title: occ.title,
            description: occ.description,
            startTime: occ.startTime?.toISOString() || null,
            endTime: occ.endTime?.toISOString() || null,
            timezone: occ.timezone,
            location: occ.location,
            color: occ.color,
            type: occ.type as EventOccurrence["type"],
            isException: occ.isException,
            exceptionId: occ.exceptionId,
            isCancelled: occ.isCancelled,
          })
        }
      }

      // Sort by date, then by start time
      return occurrences.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        
        // Both all-day or both have times
        if (!a.startTime && !b.startTime) return 0
        if (!a.startTime) return -1 // All-day first
        if (!b.startTime) return 1
        
        return a.startTime.localeCompare(b.startTime)
      })
    },
    staleTime: 1000 * 60, // 1 minute
    enabled: !!filters.start && !!filters.end,
  })
}
