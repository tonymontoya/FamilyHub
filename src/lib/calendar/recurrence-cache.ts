/**
 * Cached Recurrence Utilities
 * 
 * Provides LRU-cached occurrence generation for performance.
 * Repeated calls with the same parameters return cached results instantly.
 * 
 * @example
 * ```typescript
 * // First call - computes and caches
 * const occ1 = generateOccurrencesCached(event, exceptions, start, end)
 * 
 * // Second call - returns cached result
 * const occ2 = generateOccurrencesCached(event, exceptions, start, end) // instant
 * ```
 */

import { LRUCache } from "lru-cache"
import type { CalendarEvent, EventException } from "@prisma/client"
import { generateOccurrences as generateOccurrencesBase } from "./recurrence"
import type { EventOccurrence } from "./recurrence"

// ===== Cache Configuration =====

interface CacheKey {
  eventId: string
  recurrenceRule: string | null
  startDate: string // ISO date string
  rangeStart: string // ISO date string
  rangeEnd: string // ISO date string
  exceptionHash: string // Hash of exception IDs and dates
}

interface CacheEntry {
  occurrences: EventOccurrence[]
  timestamp: number
}

// LRU cache: max 500 occurrence sets, 5 minute TTL
const occurrenceCache = new LRUCache<string, CacheEntry>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true,
  allowStale: false,
})

// ===== Cache Key Generation =====

/**
 * Generate a stable cache key for occurrence generation
 */
function generateCacheKey(
  event: CalendarEvent,
  exceptions: EventException[],
  rangeStart: Date,
  rangeEnd: Date
): string {
  // Hash exceptions by their IDs and update times
  const exceptionHash = exceptions
    .map((e) => `${e.id}:${e.updatedAt.getTime()}`)
    .sort()
    .join("|")

  const key: CacheKey = {
    eventId: event.id,
    recurrenceRule: event.recurrenceRule,
    startDate: event.startDate.toISOString(),
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    exceptionHash: exceptionHash || "none",
  }

  return JSON.stringify(key)
}

/**
 * Generate cache key for a single event (used for cache invalidation)
 */
export function generateEventCacheKey(eventId: string): string {
  return `event:${eventId}`
}

// ===== Cached Operations =====

/**
 * Generate occurrences with LRU caching
 * 
 * This function caches the result of occurrence expansion to avoid
 * re-parsing RRULEs and re-computing date sequences on every render.
 * 
 * Cache invalidation happens automatically when:
 * - Event recurrence rule changes
 * - Exceptions are added/modified
 * - Date range changes
 * - 5 minute TTL expires
 */
export function generateOccurrencesCached(
  event: CalendarEvent,
  exceptions: EventException[],
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  // Non-recurring events are cheap - don't cache
  if (!event.isRecurring || !event.recurrenceRule) {
    return generateOccurrencesBase(event, exceptions, rangeStart, rangeEnd)
  }

  const cacheKey = generateCacheKey(event, exceptions, rangeStart, rangeEnd)
  const cached = occurrenceCache.get(cacheKey)

  if (cached) {
    return cached.occurrences
  }

  // Generate and cache
  const occurrences = generateOccurrencesBase(event, exceptions, rangeStart, rangeEnd)
  occurrenceCache.set(cacheKey, {
    occurrences,
    timestamp: Date.now(),
  })

  return occurrences
}

// ===== Cache Management =====

/**
 * Clear all cached occurrences for a specific event
 * Call this when an event is updated or deleted
 */
export function invalidateEventCache(eventId: string): void {
  // LRUCache doesn't support prefix deletion, so we use a generation counter
  // approach or just let TTL handle it for now
  // For immediate invalidation, we'd need a more sophisticated cache structure
  
  // Simple approach: iterate and delete matching keys
  // Note: This is O(n) but acceptable for cache size of 500
  for (const key of occurrenceCache.keys()) {
    if (key.includes(`"eventId":"${eventId}"`)) {
      occurrenceCache.delete(key)
    }
  }
}

/**
 * Clear the entire occurrence cache
 */
export function clearOccurrenceCache(): void {
  occurrenceCache.clear()
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  size: number
  maxSize: number
  utilization: number
} {
  return {
    size: occurrenceCache.size,
    maxSize: occurrenceCache.max,
    utilization: occurrenceCache.size / (occurrenceCache.max || 1),
  }
}

// ===== React Query Integration =====

/**
 * Create a stable query key for occurrence expansion
 * This key changes only when the inputs change
 */
export function createOccurrenceExpansionKey(
  event: CalendarEvent,
  exceptions: EventException[],
  rangeStart: Date,
  rangeEnd: Date
): string[] {
  const exceptionHash = exceptions
    .map((e) => `${e.id}:${e.updatedAt.getTime()}`)
    .sort()
    .join("|")

  return [
    "occurrence-expansion",
    event.id,
    event.updatedAt.getTime().toString(),
    event.recurrenceRule || "none",
    rangeStart.toISOString(),
    rangeEnd.toISOString(),
    exceptionHash || "none",
  ]
}

// Re-export base function for non-cached use cases
export { generateOccurrencesBase as generateOccurrences }
