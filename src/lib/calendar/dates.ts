/**
 * Calendar date primitives
 *
 * The calendar stores date-only values (YYYY-MM-DD) as UTC wall-clock
 * instants (00:00Z), matching how event times are stored ("HH:MM" embedded
 * in UTC). All helpers here are deterministic: they never depend on the
 * server's or browser's local timezone.
 */

/**
 * Parse a validated YYYY-MM-DD string to UTC midnight.
 * Unlike date-fns parseISO, this never shifts with the process timezone.
 */
export function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

/**
 * The UTC calendar-date key (YYYY-MM-DD) of an instant.
 * This is the key used for occurrence ids and exception matching.
 */
export function dateKey(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Strip the time-of-day from an instant, keeping its UTC calendar date.
 */
export function normalizeToUTCDate(date: Date): Date {
  return new Date(`${dateKey(date)}T00:00:00.000Z`)
}

/**
 * UTC day bounds spanning start through end (both inclusive).
 * Use for range queries and rrule expansion windows.
 */
export function utcDayRange(start: string, end: string): { start: Date; end: Date } {
  return {
    start: parseDateOnly(start),
    end: new Date(`${end}T23:59:59.999Z`),
  }
}
