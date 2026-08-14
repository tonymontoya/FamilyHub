import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { rateLimiter, rateLimits, applyRateLimit, resetRateLimit } from "./rate-limit"
import { ApiError } from "./errors"

const config = { limit: 2, window: 60 }

describe("RateLimiter.check", () => {
  it("allows requests within the limit and reports remaining", () => {
    rateLimiter.reset("test:allow")

    const first = rateLimiter.check("test:allow", config)
    expect(first).toMatchObject({ allowed: true, remaining: 1, limit: 2 })

    const second = rateLimiter.check("test:allow", config)
    expect(second).toMatchObject({ allowed: true, remaining: 0, limit: 2 })

    rateLimiter.reset("test:allow")
  })

  it("blocks requests once the limit is reached", () => {
    rateLimiter.reset("test:block")

    rateLimiter.check("test:block", config)
    rateLimiter.check("test:block", config)
    const third = rateLimiter.check("test:block", config)

    expect(third.allowed).toBe(false)
    expect(third.remaining).toBe(0)
    expect(third.limit).toBe(2)
    expect(third.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000))

    rateLimiter.reset("test:block")
  })

  it("allows again after the window expires", () => {
    vi.useFakeTimers()
    try {
      rateLimiter.reset("test:window")

      rateLimiter.check("test:window", config)
      rateLimiter.check("test:window", config)
      expect(rateLimiter.check("test:window", config).allowed).toBe(false)

      vi.advanceTimersByTime(config.window * 1000 + 1)

      const fresh = rateLimiter.check("test:window", config)
      expect(fresh).toMatchObject({ allowed: true, remaining: config.limit - 1 })
    } finally {
      vi.useRealTimers()
      rateLimiter.reset("test:window")
    }
  })

  it("tracks keys independently", () => {
    rateLimiter.reset("test:key-a")
    rateLimiter.reset("test:key-b")

    rateLimiter.check("test:key-a", config)
    rateLimiter.check("test:key-a", config)
    const blocked = rateLimiter.check("test:key-a", config)

    const other = rateLimiter.check("test:key-b", config)

    expect(blocked.allowed).toBe(false)
    expect(other).toMatchObject({ allowed: true, remaining: config.limit - 1 })

    rateLimiter.reset("test:key-a")
    rateLimiter.reset("test:key-b")
  })

  it("clears a key on reset", () => {
    rateLimiter.check("test:reset", config)
    rateLimiter.check("test:reset", config)

    rateLimiter.reset("test:reset")

    const fresh = rateLimiter.check("test:reset", config)
    expect(fresh).toMatchObject({ allowed: true, remaining: config.limit - 1 })

    rateLimiter.reset("test:reset")
  })
})

describe("applyRateLimit", () => {
  const userId = "rate-limit-test-user"

  beforeEach(() => {
    resetRateLimit("childCreate", userId)
  })

  it("returns rate limit headers when allowed", () => {
    const headers = applyRateLimit("childCreate", userId)

    const childCreate = rateLimits.childCreate
    expect(headers["X-RateLimit-Limit"]).toBe(String(childCreate.limit))
    expect(headers["X-RateLimit-Remaining"]).toBe(String(childCreate.limit - 1))
    expect(Number(headers["X-RateLimit-Reset"])).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it("throws a 429 ApiError once the action limit is exhausted", () => {
    const { childCreate } = rateLimits
    for (let i = 0; i < childCreate.limit; i++) {
      applyRateLimit("childCreate", userId)
    }

    let thrown: unknown
    try {
      applyRateLimit("childCreate", userId)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ApiError)
    expect((thrown as ApiError).statusCode).toBe(429)
  })

  it("applies limits per user", () => {
    const otherUser = "rate-limit-test-other-user"
    const { childCreate } = rateLimits
    for (let i = 0; i < childCreate.limit; i++) {
      applyRateLimit("childCreate", otherUser)
    }

    expect(() => applyRateLimit("childCreate", otherUser)).toThrow()
    expect(() => applyRateLimit("childCreate", userId)).not.toThrow()

    resetRateLimit("childCreate", otherUser)
  })
})
