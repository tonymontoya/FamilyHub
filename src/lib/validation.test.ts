import { describe, it, expect } from "vitest"
import { isValidUUID } from "./validation"

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
