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

export function useOccurrences(filters: OccurrenceFilters) {
  return useQuery<EventOccurrence[]>({
    queryKey: calendarKeys.occurrence(filters),
    queryFn: async () => {
      // Fetch events for the range
      const response = await fetchEvents({
        ...filters,
        limit: 100, // Get all events in range
        offset: 0,
      })

      const rangeStart = startOfDay(parseISO(filters.start))
      const rangeEnd = endOfDay(parseISO(filters.end))

      // Expand recurring events into occurrences
      const occurrences: EventOccurrence[] = []

      for (const event of response.events) {
        const eventOccurrences = generateOccurrences(
          event as unknown as import("@prisma/client").CalendarEvent,
          event.exceptions as unknown as import("@prisma/client").EventException[],
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
