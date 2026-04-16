/**
 * Recurrence Utilities
 * 
 * Handles RRULE parsing and expansion for recurring events.
 * Uses the 'rrule' library (RFC 5545 compliant).
 */

import { rrulestr } from "rrule"
import type { CalendarEvent, EventException } from "@prisma/client"

export interface EventOccurrence {
  id: string // eventId + date
  eventId: string
  date: Date
  title: string
  description: string | null
  startTime: Date | null
  endTime: Date | null
  timezone: string
  location: string | null
  color: string | null
  type: string
  isException: boolean
  exceptionId?: string
  isCancelled: boolean
}

/**
 * Generate occurrences for a recurring event within a date range
 * 
 * @param event - The base recurring event
 * @param exceptions - Array of exceptions for this event
 * @param rangeStart - Start of the range to generate occurrences for
 * @param rangeEnd - End of the range to generate occurrences for
 * @returns Array of event occurrences
 */
export function generateOccurrences(
  event: CalendarEvent,
  exceptions: EventException[],
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  // If not recurring, return single occurrence if in range
  if (!event.isRecurring || !event.recurrenceRule) {
    if (event.startDate >= rangeStart && event.startDate <= rangeEnd && !event.deletedAt) {
      return [createOccurrence(event, event.startDate, null)]
    }
    return []
  }

  try {
    // Parse the RRULE
    const rule = rrulestr(event.recurrenceRule, {
      dtstart: event.startDate,
    })

    // Get all dates in the range
    const dates = rule.between(rangeStart, rangeEnd, true)

    // Create a map of exceptions by date for quick lookup
    const exceptionMap = new Map<string, EventException>()
    for (const ex of exceptions) {
      const dateKey = ex.originalDate.toISOString().split("T")[0]
      exceptionMap.set(dateKey, ex)
    }

    // Generate occurrences
    const occurrences: EventOccurrence[] = []
    for (const date of dates) {
      const dateKey = date.toISOString().split("T")[0]
      const exception = exceptionMap.get(dateKey)
      
      occurrences.push(createOccurrence(event, date, exception ?? null))
    }

    return occurrences
  } catch (error) {
    // If RRULE parsing fails, return original event as single occurrence
    console.error("Failed to parse RRULE:", error)
    if (event.startDate >= rangeStart && event.startDate <= rangeEnd) {
      return [createOccurrence(event, event.startDate, null)]
    }
    return []
  }
}

/**
 * Create an occurrence object from an event and optional exception
 */
function createOccurrence(
  event: CalendarEvent,
  date: Date,
  exception: EventException | null
): EventOccurrence {
  // If there's an exception, use its values (if set) or fall back to event values
  const title = exception?.title ?? event.title
  const description = exception?.description ?? event.description
  const location = exception?.location ?? event.location
  
  // For times, we need to handle the date portion correctly
  // Exception times are stored as full Date objects, but we need to apply them to the occurrence date
  let startTime: Date | null = null
  let endTime: Date | null = null
  
  if (exception?.startTime) {
    // Apply exception's time to the occurrence date
    startTime = combineDateAndTime(date, exception.startTime)
  } else if (event.startTime) {
    // Apply event's time to the occurrence date
    startTime = combineDateAndTime(date, event.startTime)
  }
  
  if (exception?.endTime) {
    endTime = combineDateAndTime(date, exception.endTime)
  } else if (event.endTime) {
    endTime = combineDateAndTime(date, event.endTime)
  }

  return {
    id: `${event.id}_${date.toISOString().split("T")[0]}`,
    eventId: event.id,
    date,
    title,
    description,
    startTime,
    endTime,
    timezone: event.timezone,
    location,
    color: event.color,
    type: event.type,
    isException: exception !== null,
    exceptionId: exception?.id,
    isCancelled: exception?.isCancelled ?? false,
  }
}

/**
 * Combine a date with a time from another Date object
 */
function combineDateAndTime(date: Date, timeDate: Date): Date {
  const result = new Date(date)
  result.setUTCHours(
    timeDate.getUTCHours(),
    timeDate.getUTCMinutes(),
    timeDate.getUTCSeconds(),
    timeDate.getUTCMilliseconds()
  )
  return result
}

/**
 * Check if a date is a valid occurrence for a recurring event
 */
export function isValidOccurrence(
  event: CalendarEvent,
  date: Date,
  exceptions: EventException[]
): boolean {
  if (!event.isRecurring || !event.recurrenceRule) {
    return date.getTime() === event.startDate.getTime()
  }

  try {
    const rule = rrulestr(event.recurrenceRule, {
      dtstart: event.startDate,
    })

    // Check if date matches the recurrence pattern
    const dates = rule.between(date, date, true)
    if (dates.length === 0) {
      return false
    }

    // Check if there's a cancellation exception
    const dateKey = date.toISOString().split("T")[0]
    const exception = exceptions.find(
      (e) => e.originalDate.toISOString().split("T")[0] === dateKey
    )

    return !exception?.isCancelled
  } catch {
    return false
  }
}

/**
 * Get the next occurrence of a recurring event after a given date
 */
export function getNextOccurrence(
  event: CalendarEvent,
  exceptions: EventException[],
  afterDate: Date = new Date(),
  maxDepth: number = 10,
  currentDepth: number = 0
): Date | null {
  // Prevent infinite recursion if many consecutive occurrences are cancelled
  if (currentDepth >= maxDepth) return null
  if (!event.isRecurring || !event.recurrenceRule) {
    return event.startDate > afterDate ? event.startDate : null
  }

  try {
    const rule = rrulestr(event.recurrenceRule, {
      dtstart: event.startDate,
    })

    // Get next 10 occurrences and find the first valid one
    const dates = rule.after(afterDate, true)
    
    if (!dates) return null

    // Check for cancellation exception
    const dateKey = dates.toISOString().split("T")[0]
    const exception = exceptions.find(
      (e) => e.originalDate.toISOString().split("T")[0] === dateKey
    )

    if (exception?.isCancelled) {
      // Get the next one recursively (with depth limit to prevent infinite loop)
      return getNextOccurrence(event, exceptions, dates, maxDepth, currentDepth + 1)
    }

    return dates
  } catch {
    return null
  }
}
