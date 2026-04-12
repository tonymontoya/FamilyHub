import { describe, it, expect } from "vitest"
import { isValidUUID, checkRateLimit, cleanupRateLimits } from "./api-utils"

describe("isValidUUID", () => {
  it("returns true for valid UUID v4", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true)
    expect(isValidUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true)
  })

  it("returns false for invalid UUIDs", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false)
    expect(isValidUUID("")).toBe(false)
    expect(isValidUUID("550e8400-e29b-41d4-a716-44665544000")).toBe(false) // too short
    expect(isValidUUID("550e8400-e29b-41d4-a716-4466554400000")).toBe(false) // too long
  })

  it("accepts any valid UUID version 1-5", () => {
    expect(isValidUUID("550e8400-e29b-11d4-a716-446655440000")).toBe(true) // v1
    expect(isValidUUID("550e8400-e29b-21d4-a716-446655440000")).toBe(true) // v2
    expect(isValidUUID("550e8400-e29b-31d4-a716-446655440000")).toBe(true) // v3
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true) // v4
    expect(isValidUUID("550e8400-e29b-51d4-a716-446655440000")).toBe(true) // v5
    expect(isValidUUID("550e8400-e29b-61d4-a716-446655440000")).toBe(false) // v6 invalid
    expect(isValidUUID("550e8400-e29b-01d4-a716-446655440000")).toBe(false) // v0 invalid
  })

  it("returns false for UUID with invalid variant", () => {
    // Variant should be 8, 9, a, or b in position 19
    expect(isValidUUID("550e8400-e29b-41d4-c716-446655440000")).toBe(false)
  })
})

describe("checkRateLimit", () => {
  it("allows requests within limit", () => {
    const key = "test-key-1"
    const config = { max: 3, windowMs: 1000 }

    expect(checkRateLimit(key, config)).toBe(true)
    expect(checkRateLimit(key, config)).toBe(true)
    expect(checkRateLimit(key, config)).toBe(true)
  })

  it("blocks requests over limit", () => {
    const key = "test-key-2"
    const config = { max: 2, windowMs: 1000 }

    expect(checkRateLimit(key, config)).toBe(true)
    expect(checkRateLimit(key, config)).toBe(true)
    expect(checkRateLimit(key, config)).toBe(false) // over limit
    expect(checkRateLimit(key, config)).toBe(false)
  })

  it("resets after window expires", async () => {
    const key = "test-key-3"
    const config = { max: 1, windowMs: 50 }

    expect(checkRateLimit(key, config)).toBe(true)
    expect(checkRateLimit(key, config)).toBe(false) // over limit

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(checkRateLimit(key, config)).toBe(true) // should reset
  })

  it("tracks different keys independently", () => {
    const config = { max: 2, windowMs: 1000 }

    expect(checkRateLimit("key-a", config)).toBe(true)
    expect(checkRateLimit("key-a", config)).toBe(true)
    expect(checkRateLimit("key-b", config)).toBe(true) // different key, fresh count
    expect(checkRateLimit("key-a", config)).toBe(false) // key-a still at limit
  })
})

describe("cleanupRateLimits", () => {
  it("removes expired entries", async () => {
    const config = { max: 1, windowMs: 50 }

    // Create some entries
    checkRateLimit("cleanup-1", config)
    checkRateLimit("cleanup-2", config)

    // Wait for them to expire
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Create a fresh entry
    checkRateLimit("cleanup-3", { max: 10, windowMs: 60000 })

    // Cleanup should remove expired entries
    cleanupRateLimits()

    // Expired keys should have been cleaned up and get fresh counts
    expect(checkRateLimit("cleanup-1", config)).toBe(true)
    expect(checkRateLimit("cleanup-2", config)).toBe(true)
    // cleanup-3 should still be at its limit (was 1/10 before cleanup)
    expect(checkRateLimit("cleanup-3", { max: 10, windowMs: 60000 })).toBe(true) // 2/10
  })
})
