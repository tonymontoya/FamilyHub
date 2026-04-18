/**
 * React Query Hook for Event Occurrences
 * 
 * Expands recurring events into individual occurrences for display.
 * Features:
 * - Debounced filters to prevent excessive API calls
 * - Memoized occurrence expansion with LRU caching
 * - React Query integration for stale-while-revalidate
 */

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { calendarKeys } from "./keys"
import { fetchEvents } from "./api"
import { generateOccurrencesCached, invalidateEventCache, clearOccurrenceCache } from "@/lib/calendar/recurrence-cache"
import type { EventOccurrence, OccurrenceFilters, CalendarEvent, EventException, EventsResponse } from "./types"
import { parseISO, startOfDay, endOfDay } from "date-fns"
import type { CalendarEvent as PrismaCalendarEvent, EventException as PrismaEventException } from "@prisma/client"
import { useDebounce } from "@/hooks/use-debounce"

// ===== Type Converters =====

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
  } as unknown as PrismaCalendarEvent
}

/**
 * Convert API EventException (strings) to Prisma EventException (Dates)
 */
function toPrismaException(exception: EventException): PrismaEventException {
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
  } as unknown as PrismaEventException
}

// ===== Main Hooks =====

/**
 * Core occurrence fetching hook (without debouncing)
 * 
 * Use this when you need immediate updates (e.g., from URL params)
 * 
 * @example
 * ```typescript
 * const { data: occurrences, isLoading } = useOccurrences({
 *   start: '2024-01-01',
 *   end: '2024-01-31',
 *   type: 'EVENT'
 * })
 * ```
 */
export function useOccurrences(filters: OccurrenceFilters) {
  const queryClient = useQueryClient()

  return useQuery<EventOccurrence[]>({
    queryKey: calendarKeys.occurrence(filters),
    queryFn: async () => {
      // Fetch events for the range
      // Note: 500 is a reasonable upper limit for events in a month view
      const apiResponse = await fetchEvents({
        ...filters,
        limit: 500,
        offset: 0,
      })
      
      // Handle API wrapper format: { success: true, data: { events: [...] } }
      const apiData = apiResponse as unknown as Record<string, unknown>
      const response = 'data' in apiData 
        ? (apiData.data as EventsResponse)
        : (apiResponse as EventsResponse)

      const rangeStart = startOfDay(parseISO(filters.start))
      const rangeEnd = endOfDay(parseISO(filters.end))

      // Expand recurring events into occurrences
      const occurrences: EventOccurrence[] = []

      for (const event of response.events) {
        // Use cached expansion for each event
        const eventOccurrences = generateOccurrencesCached(
          toPrismaEvent(event),
          event.exceptions.map(toPrismaException),
          rangeStart,
          rangeEnd
        )

        // Convert to our Occurrence type and apply filters
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

/**
 * Debounced occurrence hook for user-driven filter changes
 * 
 * Delays the API call by 300ms to prevent excessive requests
 * when users are rapidly changing filters (e.g., typing in search,
 * dragging date range sliders, etc.)
 * 
 * @example
 * ```typescript
 * // In your component with user input
 * const [localFilters, setLocalFilters] = useState({ start, end, type })
 * const { data: occurrences, isLoading } = useDebouncedOccurrences(localFilters, 300)
 * 
 * // User types rapidly - only one API call after 300ms of inactivity
 * ```
 */
export function useDebouncedOccurrences(
  filters: OccurrenceFilters,
  delay: number = 300
) {
  const debouncedFilters = useDebounce(filters, delay)
  return useOccurrences(debouncedFilters)
}

// ===== Cache Utilities =====

/**
 * Hook to manually invalidate occurrence caches
 * 
 * Call this when you know an event has changed and want to
 * force fresh occurrence expansion on next render.
 */
export function useInvalidateOccurrenceCache() {
  const queryClient = useQueryClient()

  return {
    /**
     * Invalidate cache for a specific event
     */
    invalidateEvent: (eventId: string) => {
      invalidateEventCache(eventId)
      queryClient.invalidateQueries({ queryKey: calendarKeys.occurrences() })
    },

    /**
     * Clear all occurrence caches
     */
    clearAll: () => {
      clearOccurrenceCache()
      queryClient.invalidateQueries({ queryKey: calendarKeys.occurrences() })
    },
  }
}

// Re-export cache functions
export { invalidateEventCache, clearOccurrenceCache } from "@/lib/calendar/recurrence-cache"
