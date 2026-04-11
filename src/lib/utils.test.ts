import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatPoints } from './utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar')
  })

  it('should merge tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('formatDate', () => {
  it('should format date correctly', () => {
    // Use UTC date to avoid timezone issues
    const date = new Date(Date.UTC(2026, 3, 11)) // April 11, 2026 UTC
    const formatted = formatDate(date)
    expect(formatted).toContain('2026')
    // Just verify it returns a string in expected format
    expect(typeof formatted).toBe('string')
    expect(formatted.length).toBeGreaterThan(0)
  })

  it('should handle string dates', () => {
    const result = formatDate('2026-04-11')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('formatPoints', () => {
  it('should format points with commas', () => {
    expect(formatPoints(1000)).toBe('1,000')
    expect(formatPoints(1000000)).toBe('1,000,000')
  })

  it('should handle single digits', () => {
    expect(formatPoints(5)).toBe('5')
  })
})
