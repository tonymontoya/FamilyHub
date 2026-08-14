/**
 * Recurrence Utilities
 *
 * Handles RRULE parsing and expansion for recurring events.
 * Uses the 'rrule' library (RFC 5545 compliant).
 *
 * Date handling: the calendar stores date-only values as UTC wall-clock
 * instants (00:00Z). Expansion, occurrence ids, and exception matching all
 * key off UTC calendar dates via the helpers in ./dates, so behavior is
 * identical regardless of the process timezone.
 */

import { rrulestr } from "rrule"
import type { CalendarEvent, EventException } from "@prisma/client"
import { dateKey, normalizeToUTCDate } from "./dates"

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
 * Parse the stored recurrence rule with a normalized UTC dtstart so the
 * library expands on clean calendar dates regardless of the stored
 * instant's time component.
 */
function parseRule(event: CalendarEvent) {
  return rrulestr(event.recurrenceRule!, {
    dtstart: normalizeToUTCDate(event.startDate),
  })
}

/**
 * Find a cancellation-style exception for a UTC date key.
 */
function findExceptionByDateKey(
  exceptions: EventException[],
  key: string
): EventException | undefined {
  return exceptions.find((e) => dateKey(e.originalDate) === key)
}

/**
 * The latest instant an occurrence may have: the range end, clamped by the
 * series' recurrenceEnd when one is set.
 */
function effectiveRangeEnd(rangeEnd: Date, recurrenceEnd: Date | null): Date {
  if (recurrenceEnd && recurrenceEnd < rangeEnd) {
    return recurrenceEnd
  }
  return rangeEnd
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
    const rule = parseRule(event)

    const dates = rule.between(
      rangeStart,
      effectiveRangeEnd(rangeEnd, event.recurrenceEnd),
      true
    )

    // Create a map of exceptions by date for quick lookup
    const exceptionMap = new Map<string, EventException>()
    for (const ex of exceptions) {
      exceptionMap.set(dateKey(ex.originalDate), ex)
    }

    // Generate occurrences
    const occurrences: EventOccurrence[] = []
    for (const date of dates) {
      const exception = exceptionMap.get(dateKey(date))

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
    id: `${event.id}_${dateKey(date)}`,
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
    const rule = parseRule(event)

    // Check if the date's calendar day matches the recurrence pattern
    const dayStart = normalizeToUTCDate(date)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1)
    const dates = rule.between(
      dayStart,
      effectiveRangeEnd(dayEnd, event.recurrenceEnd),
      true
    )
    if (dates.length === 0) {
      return false
    }

    // Check if there's a cancellation exception
    const exception = findExceptionByDateKey(exceptions, dateKey(dayStart))

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
  maxDepth: number = 10
): Date | null {
  return findNextOccurrence(event, exceptions, afterDate, maxDepth, 0, true)
}

function findNextOccurrence(
  event: CalendarEvent,
  exceptions: EventException[],
  afterDate: Date,
  maxDepth: number,
  currentDepth: number,
  inclusive: boolean
): Date | null {
  // Prevent infinite recursion if many consecutive occurrences are cancelled
  if (currentDepth >= maxDepth) return null
  if (!event.isRecurring || !event.recurrenceRule) {
    return event.startDate > afterDate ? event.startDate : null
  }

  try {
    const rule = parseRule(event)

    const next = rule.after(afterDate, inclusive)

    if (!next) return null

    // The series ends at recurrenceEnd
    if (event.recurrenceEnd && next > event.recurrenceEnd) return null

    // Check for cancellation exception
    const exception = findExceptionByDateKey(exceptions, dateKey(next))

    if (exception?.isCancelled) {
      // Get the next one (strictly after the cancelled date) with a depth
      // limit to prevent unbounded recursion
      return findNextOccurrence(
        event,
        exceptions,
        next,
        maxDepth,
        currentDepth + 1,
        false
      )
    }

    return next
  } catch {
    return null
  }
}
