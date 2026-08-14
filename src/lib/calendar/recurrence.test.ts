import { describe, it, expect } from "vitest"
import { generateOccurrences, isValidOccurrence, getNextOccurrence } from "./recurrence"
import type { CalendarEvent, EventException } from "@prisma/client"

// The system stores date-only values as UTC wall-clock instants (00:00Z).
// All tests use explicit instants so they pass in any runner timezone.

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "event-1",
    familyId: "family-1",
    createdById: "member-1",
    title: "Soccer practice",
    description: null,
    startDate: new Date("2026-08-14T00:00:00.000Z"), // Friday
    startTime: null,
    endDate: null,
    endTime: null,
    timezone: "America/New_York",
    isRecurring: true,
    recurrenceRule: "RRULE:FREQ=WEEKLY;BYDAY=FR",
    recurrenceEnd: null,
    assigneeIds: [],
    isFamilyWide: true,
    type: "ACTIVITY",
    location: null,
    color: null,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

function makeException(overrides: Partial<EventException> = {}): EventException {
  return {
    id: "exception-1",
    eventId: "event-1",
    originalDate: new Date("2026-08-14T00:00:00.000Z"),
    title: null,
    description: null,
    startTime: null,
    endTime: null,
    location: null,
    isCancelled: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }
}

const augustRange = {
  start: new Date("2026-08-01T00:00:00.000Z"),
  end: new Date("2026-08-31T23:59:59.999Z"),
}

describe("generateOccurrences — expansion", () => {
  it("expands a weekly rule to every Friday in the range", () => {
    const event = makeEvent()
    const occurrences = generateOccurrences(event, [], augustRange.start, augustRange.end)

    expect(occurrences.map((o) => o.date.toISOString())).toEqual([
      "2026-08-14T00:00:00.000Z",
      "2026-08-21T00:00:00.000Z",
      "2026-08-28T00:00:00.000Z",
    ])
    expect(occurrences.map((o) => o.id)).toEqual([
      "event-1_2026-08-14",
      "event-1_2026-08-21",
      "event-1_2026-08-28",
    ])
  })

  it("expands a daily rule within the range", () => {
    const event = makeEvent({ recurrenceRule: "RRULE:FREQ=DAILY" })
    const occurrences = generateOccurrences(
      event,
      [],
      new Date("2026-08-14T00:00:00.000Z"),
      new Date("2026-08-16T23:59:59.999Z")
    )

    expect(occurrences.map((o) => o.date.toISOString())).toEqual([
      "2026-08-14T00:00:00.000Z",
      "2026-08-15T00:00:00.000Z",
      "2026-08-16T00:00:00.000Z",
    ])
  })

  it("expands a monthly rule on the same day of month", () => {
    const event = makeEvent({ recurrenceRule: "RRULE:FREQ=MONTHLY" })
    const occurrences = generateOccurrences(
      event,
      [],
      new Date("2026-08-01T00:00:00.000Z"),
      new Date("2026-09-30T23:59:59.999Z")
    )

    expect(occurrences.map((o) => o.date.toISOString())).toEqual([
      "2026-08-14T00:00:00.000Z",
      "2026-09-14T00:00:00.000Z",
    ])
  })

  it("includes occurrences that fall exactly on the range boundaries", () => {
    const event = makeEvent({ recurrenceRule: "RRULE:FREQ=DAILY" })
    const occurrences = generateOccurrences(
      event,
      [],
      new Date("2026-08-14T00:00:00.000Z"),
      new Date("2026-08-14T23:59:59.999Z")
    )

    expect(occurrences).toHaveLength(1)
    expect(occurrences[0].date.toISOString()).toBe("2026-08-14T00:00:00.000Z")
  })

  it("does not expand beyond recurrenceEnd", () => {
    const event = makeEvent({
      recurrenceRule: "RRULE:FREQ=DAILY",
      recurrenceEnd: new Date("2026-08-15T23:59:59.999Z"),
    })
    const occurrences = generateOccurrences(event, [], augustRange.start, augustRange.end)

    expect(occurrences.map((o) => o.date.toISOString())).toEqual([
      "2026-08-14T00:00:00.000Z",
      "2026-08-15T00:00:00.000Z",
    ])
  })

  it("returns a single occurrence for a non-recurring event in range", () => {
    const event = makeEvent({ isRecurring: false, recurrenceRule: null })
    const occurrences = generateOccurrences(event, [], augustRange.start, augustRange.end)

    expect(occurrences).toHaveLength(1)
    expect(occurrences[0].date.toISOString()).toBe("2026-08-14T00:00:00.000Z")
    expect(occurrences[0].id).toBe("event-1_2026-08-14")
  })

  it("returns nothing for a non-recurring event out of range", () => {
    const event = makeEvent({ isRecurring: false, recurrenceRule: null })
    const occurrences = generateOccurrences(
      event,
      [],
      new Date("2026-09-01T00:00:00.000Z"),
      new Date("2026-09-30T23:59:59.999Z")
    )

    expect(occurrences).toEqual([])
  })

  it("falls back to the start date when the RRULE cannot be parsed", () => {
    const event = makeEvent({ recurrenceRule: "RRULE:FREQ=BOGUS" })
    const occurrences = generateOccurrences(event, [], augustRange.start, augustRange.end)

    expect(occurrences).toHaveLength(1)
    expect(occurrences[0].date.toISOString()).toBe("2026-08-14T00:00:00.000Z")
  })

  it("normalizes occurrence dates to UTC midnight even if startDate carries a time", () => {
    const event = makeEvent({ startDate: new Date("2026-08-14T09:30:00.000Z") })
    const occurrences = generateOccurrences(event, [], augustRange.start, augustRange.end)

    expect(occurrences.map((o) => o.date.toISOString())).toEqual([
      "2026-08-14T00:00:00.000Z",
      "2026-08-21T00:00:00.000Z",
      "2026-08-28T00:00:00.000Z",
    ])
    expect(occurrences.map((o) => o.id)).toEqual([
      "event-1_2026-08-14",
      "event-1_2026-08-21",
      "event-1_2026-08-28",
    ])
  })
})

describe("generateOccurrences — times", () => {
  it("applies the event start time to every occurrence", () => {
    const event = makeEvent({ startTime: new Date("2026-01-01T09:00:00.000Z") })
    const occurrences = generateOccurrences(event, [], augustRange.start, augustRange.end)

    expect(occurrences.map((o) => o.startTime?.toISOString())).toEqual([
      "2026-08-14T09:00:00.000Z",
      "2026-08-21T09:00:00.000Z",
      "2026-08-28T09:00:00.000Z",
    ])
  })

  it("applies the event end time to every occurrence", () => {
    const event = makeEvent({
      startTime: new Date("2026-01-01T09:00:00.000Z"),
      endTime: new Date("2026-01-01T10:00:00.000Z"),
    })
    const occurrences = generateOccurrences(event, [], augustRange.start, augustRange.end)

    expect(occurrences.map((o) => o.endTime?.toISOString())).toEqual([
      "2026-08-14T10:00:00.000Z",
      "2026-08-21T10:00:00.000Z",
      "2026-08-28T10:00:00.000Z",
    ])
  })
})

describe("generateOccurrences — exceptions", () => {
  it("overrides the matching occurrence with exception values", () => {
    const event = makeEvent()
    const exception = makeException({
      originalDate: new Date("2026-08-21T00:00:00.000Z"),
      title: "Moved to field 2",
      startTime: new Date("2026-01-01T10:30:00.000Z"),
    })
    const occurrences = generateOccurrences(event, [exception], augustRange.start, augustRange.end)

    expect(occurrences).toHaveLength(3)
    const overridden = occurrences.find((o) => o.date.toISOString() === "2026-08-21T00:00:00.000Z")
    expect(overridden).toMatchObject({
      title: "Moved to field 2",
      isException: true,
      exceptionId: "exception-1",
      startTime: new Date("2026-08-21T10:30:00.000Z"),
    })
    const untouched = occurrences.find((o) => o.date.toISOString() === "2026-08-14T00:00:00.000Z")
    expect(untouched).toMatchObject({
      title: "Soccer practice",
      isException: false,
      exceptionId: undefined,
    })
  })

  it("flags a cancelled occurrence without removing it", () => {
    const event = makeEvent()
    const exception = makeException({
      originalDate: new Date("2026-08-14T00:00:00.000Z"),
      isCancelled: true,
    })
    const occurrences = generateOccurrences(event, [exception], augustRange.start, augustRange.end)

    expect(occurrences).toHaveLength(3)
    expect(occurrences[0]).toMatchObject({ isCancelled: true, isException: true })
    expect(occurrences[1].isCancelled).toBe(false)
  })

  it("matches exceptions against UTC date keys regardless of event timezone", () => {
    const event = makeEvent({ recurrenceRule: "RRULE:FREQ=DAILY" })
    const exception = makeException({
      originalDate: new Date("2026-08-15T00:00:00.000Z"),
      title: "Rescheduled",
    })
    const occurrences = generateOccurrences(
      event,
      [exception],
      new Date("2026-08-14T00:00:00.000Z"),
      new Date("2026-08-16T23:59:59.999Z")
    )

    expect(occurrences.map((o) => o.title)).toEqual(["Soccer practice", "Rescheduled", "Soccer practice"])
  })
})

describe("isValidOccurrence", () => {
  const dailyEvent = makeEvent({ recurrenceRule: "RRULE:FREQ=DAILY" })

  it("accepts a date that matches the rule", () => {
    expect(isValidOccurrence(dailyEvent, new Date("2026-08-15T00:00:00.000Z"), [])).toBe(true)
  })

  it("accepts a mid-day instant on a valid occurrence date", () => {
    expect(isValidOccurrence(dailyEvent, new Date("2026-08-15T15:30:00.000Z"), [])).toBe(true)
  })

  it("rejects a date that does not match the rule", () => {
    const weekly = makeEvent()
    expect(isValidOccurrence(weekly, new Date("2026-08-15T00:00:00.000Z"), [])).toBe(false)
  })

  it("rejects a cancelled occurrence", () => {
    const exception = makeException({
      originalDate: new Date("2026-08-15T00:00:00.000Z"),
      isCancelled: true,
    })
    expect(isValidOccurrence(dailyEvent, new Date("2026-08-15T00:00:00.000Z"), [exception])).toBe(false)
  })

  it("rejects dates past recurrenceEnd", () => {
    const event = makeEvent({
      recurrenceRule: "RRULE:FREQ=DAILY",
      recurrenceEnd: new Date("2026-08-15T23:59:59.999Z"),
    })
    expect(isValidOccurrence(event, new Date("2026-08-15T00:00:00.000Z"), [])).toBe(true)
    expect(isValidOccurrence(event, new Date("2026-08-16T00:00:00.000Z"), [])).toBe(false)
  })

  it("handles non-recurring events by exact start date", () => {
    const single = makeEvent({ isRecurring: false, recurrenceRule: null })
    expect(isValidOccurrence(single, new Date("2026-08-14T00:00:00.000Z"), [])).toBe(true)
    expect(isValidOccurrence(single, new Date("2026-08-15T00:00:00.000Z"), [])).toBe(false)
  })
})

describe("getNextOccurrence", () => {
  const dailyEvent = makeEvent({ recurrenceRule: "RRULE:FREQ=DAILY" })

  it("returns the first occurrence at or after the given date", () => {
    const next = getNextOccurrence(dailyEvent, [], new Date("2026-08-13T23:59:59.000Z"))
    expect(next?.toISOString()).toBe("2026-08-14T00:00:00.000Z")
  })

  it("returns a later occurrence when afterDate is between occurrences", () => {
    const next = getNextOccurrence(dailyEvent, [], new Date("2026-08-15T12:00:00.000Z"))
    expect(next?.toISOString()).toBe("2026-08-16T00:00:00.000Z")
  })

  it("skips a cancelled occurrence and returns the next valid one", () => {
    const exception = makeException({
      originalDate: new Date("2026-08-14T00:00:00.000Z"),
      isCancelled: true,
    })
    const next = getNextOccurrence(dailyEvent, [exception], new Date("2026-08-13T23:59:59.000Z"))
    expect(next?.toISOString()).toBe("2026-08-15T00:00:00.000Z")
  })

  it("skips a chain of consecutive cancelled occurrences", () => {
    const exceptions = [
      makeException({
        id: "exception-1",
        originalDate: new Date("2026-08-14T00:00:00.000Z"),
        isCancelled: true,
      }),
      makeException({
        id: "exception-2",
        originalDate: new Date("2026-08-15T00:00:00.000Z"),
        isCancelled: true,
      }),
    ]
    const next = getNextOccurrence(dailyEvent, exceptions, new Date("2026-08-13T23:59:59.000Z"))
    expect(next?.toISOString()).toBe("2026-08-16T00:00:00.000Z")
  })

  it("returns null when the next occurrence would fall past recurrenceEnd", () => {
    const event = makeEvent({
      recurrenceRule: "RRULE:FREQ=DAILY",
      recurrenceEnd: new Date("2026-08-15T23:59:59.999Z"),
    })
    const next = getNextOccurrence(event, [], new Date("2026-08-15T12:00:00.000Z"))
    expect(next).toBeNull()
  })

  it("handles non-recurring events", () => {
    const single = makeEvent({ isRecurring: false, recurrenceRule: null })
    const before = getNextOccurrence(single, [], new Date("2026-08-13T00:00:00.000Z"))
    expect(before?.toISOString()).toBe("2026-08-14T00:00:00.000Z")
    const after = getNextOccurrence(single, [], new Date("2026-08-15T00:00:00.000Z"))
    expect(after).toBeNull()
  })
})
