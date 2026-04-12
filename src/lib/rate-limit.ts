/**
 * Rate Limiting Service
 * 
 * MVP: In-memory Map with memory protection
 * Future: Redis backend for distributed deployments
 */

import { Errors } from "./errors"

// Rate limit headers (RFC 6585 + RateLimit header draft)
export const RATE_LIMIT_HEADERS = {
  LIMIT: "X-RateLimit-Limit",
  REMAINING: "X-RateLimit-Remaining",
  RESET: "X-RateLimit-Reset",
  RETRY_AFTER: "Retry-After",
} as const

interface RateLimitEntry {
  count: number
  resetAt: number // timestamp in ms
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number // timestamp in seconds
  limit: number
}

interface RateLimitConfig {
  limit: number
  window: number // seconds
  maxKeys?: number // memory protection - default 10000
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null
  private maxKeys: number

  constructor(maxKeys = 10000) {
    this.maxKeys = maxKeys
    this.startCleanup()
  }

  private startCleanup(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)

    // Don't keep process alive (for graceful shutdown)
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`)
    }
  }

  private enforceMaxKeys(): void {
    if (this.store.size < this.maxKeys) return

    // Emergency cleanup: remove oldest 20% of entries
    const entries = Array.from(this.store.entries())
    const toRemove = Math.floor(entries.length * 0.2)
    
    // Sort by resetAt (oldest first) and remove
    entries
      .sort((a, b) => a[1].resetAt - b[1].resetAt)
      .slice(0, toRemove)
      .forEach(([key]) => this.store.delete(key))

    console.warn(`[RateLimit] Enforced max keys limit, removed ${toRemove} entries`)
  }

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const { limit, window } = config
    const windowMs = window * 1000
    const now = Date.now()

    // Memory protection
    this.enforceMaxKeys()

    const entry = this.store.get(key)

    if (!entry || entry.resetAt < now) {
      // First request or window expired
      const resetAt = now + windowMs
      this.store.set(key, { count: 1, resetAt })

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: Math.floor(resetAt / 1000),
        limit,
      }
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: Math.floor(entry.resetAt / 1000),
        limit,
      }
    }

    // Increment count
    entry.count++

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetAt: Math.floor(entry.resetAt / 1000),
      limit,
    }
  }

  reset(key: string): void {
    this.store.delete(key)
  }

  getStats(): { totalKeys: number; estimatedMemoryBytes: number } {
    // Rough estimate: 100 bytes overhead per entry + key length
    const estimatedBytes = Array.from(this.store.keys()).reduce(
      (sum, key) => sum + 100 + key.length * 2,
      0
    )
    return {
      totalKeys: this.store.size,
      estimatedMemoryBytes: estimatedBytes,
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// HMR-safe singleton
const globalForRateLimiter = globalThis as unknown as {
  __rateLimiter?: RateLimiter
}

export const rateLimiter = globalForRateLimiter.__rateLimiter ?? new RateLimiter()

// Save reference for HMR
if (process.env.NODE_ENV !== "production") {
  globalForRateLimiter.__rateLimiter = rateLimiter
}

// Common rate limit configurations
export const rateLimits = {
  // List operations
  listCreate: { limit: 10, window: 3600 }, // 10 lists per hour
  listUpdate: { limit: 30, window: 60 },   // 30 updates per minute
  listDelete: { limit: 10, window: 60 },   // 10 deletes per minute
  
  // Item operations
  itemCreate: { limit: 60, window: 60 },   // 60 items per minute
  itemUpdate: { limit: 120, window: 60 },  // 120 updates per minute (checkbox toggles)
  itemDelete: { limit: 30, window: 60 },   // 30 deletes per minute
  
  // Read operations
  read: { limit: 60, window: 60 },         // 60 reads per minute
  
  // Reorder
  reorder: { limit: 30, window: 60 },      // 30 reorders per minute
} as const

export type RateLimitAction = keyof typeof rateLimits

/**
 * Generate rate limit key for a user action
 */
export function generateRateLimitKey(
  action: RateLimitAction,
  userId: string,
  resourceId?: string
): string {
  return resourceId 
    ? `rl:${action}:${userId}:${resourceId}`
    : `rl:${action}:${userId}`
}

/**
 * Apply rate limit and throw if exceeded
 * Returns headers to set on successful response
 */
export function applyRateLimit(
  action: RateLimitAction,
  userId: string,
  resourceId?: string
): Record<string, string> {
  const key = generateRateLimitKey(action, userId, resourceId)
  const config = rateLimits[action]
  const result = rateLimiter.check(key, config)

  const headers: Record<string, string> = {
    [RATE_LIMIT_HEADERS.LIMIT]: String(result.limit),
    [RATE_LIMIT_HEADERS.REMAINING]: String(result.remaining),
    [RATE_LIMIT_HEADERS.RESET]: String(result.resetAt),
  }

  if (!result.allowed) {
    const retryAfter = result.resetAt - Math.floor(Date.now() / 1000)
    throw Errors.rateLimit(Math.max(1, retryAfter))
  }

  return headers
}

/**
 * Reset rate limit for testing purposes
 */
export function resetRateLimit(
  action: RateLimitAction,
  userId: string,
  resourceId?: string
): void {
  const key = generateRateLimitKey(action, userId, resourceId)
  rateLimiter.reset(key)
}

/**
 * Get rate limiter stats for monitoring
 */
export function getRateLimitStats(): ReturnType<typeof rateLimiter.getStats> {
  return rateLimiter.getStats()
}
