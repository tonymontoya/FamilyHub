import { describe, it, expect } from "vitest"
import { parseDateOnly, dateKey, normalizeToUTCDate, utcDayRange } from "./dates"

describe("parseDateOnly", () => {
  it("parses a YYYY-MM-DD string to UTC midnight", () => {
    expect(parseDateOnly("2026-08-14").toISOString()).toBe("2026-08-14T00:00:00.000Z")
    expect(parseDateOnly("2026-01-01").toISOString()).toBe("2026-01-01T00:00:00.000Z")
  })

  it("is independent of the process timezone", () => {
    const original = process.env.TZ
    try {
      const results: string[] = []
      for (const tz of ["UTC", "America/New_York", "Pacific/Auckland"]) {
        process.env.TZ = tz
        results.push(parseDateOnly("2026-08-14").toISOString())
      }
      expect(results).toEqual([
        "2026-08-14T00:00:00.000Z",
        "2026-08-14T00:00:00.000Z",
        "2026-08-14T00:00:00.000Z",
      ])
    } finally {
      process.env.TZ = original
    }
  })

  it("round-trips through dateKey", () => {
    expect(dateKey(parseDateOnly("2024-02-29"))).toBe("2024-02-29")
  })
})

describe("dateKey", () => {
  it("returns the UTC calendar date of an instant", () => {
    expect(dateKey(new Date("2026-08-14T23:59:59.999Z"))).toBe("2026-08-14")
    expect(dateKey(new Date("2026-08-15T00:00:00.000Z"))).toBe("2026-08-15")
  })
})

describe("normalizeToUTCDate", () => {
  it("strips the time component, keeping the UTC calendar date", () => {
    expect(normalizeToUTCDate(new Date("2026-08-14T09:30:00Z")).toISOString()).toBe(
      "2026-08-14T00:00:00.000Z"
    )
    expect(normalizeToUTCDate(new Date("2026-08-14T00:00:00.000Z")).toISOString()).toBe(
      "2026-08-14T00:00:00.000Z"
    )
  })
})

describe("utcDayRange", () => {
  it("builds UTC day bounds spanning start (inclusive) through end (inclusive)", () => {
    const { start, end } = utcDayRange("2026-08-01", "2026-08-31")
    expect(start.toISOString()).toBe("2026-08-01T00:00:00.000Z")
    expect(end.toISOString()).toBe("2026-08-31T23:59:59.999Z")
  })

  it("handles a single-day range", () => {
    const { start, end } = utcDayRange("2026-08-14", "2026-08-14")
    expect(start.toISOString()).toBe("2026-08-14T00:00:00.000Z")
    expect(end.toISOString()).toBe("2026-08-14T23:59:59.999Z")
  })
})
