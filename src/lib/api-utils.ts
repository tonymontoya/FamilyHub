/**
 * API Utilities - Shared helper functions for API routes
 */

import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "./auth"
import { prisma } from "./prisma"
import type { Member, Role } from "@prisma/client"

// Rate limiting with in-memory store (MVP only - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  max: number
  windowMs: number
}

/**
 * Check rate limit for a given key
 * Returns true if allowed, false if exceeded
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs })
    return true
  }

  if (record.count >= config.max) {
    return false
  }

  record.count++
  return true
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

export interface AuthContext {
  user: {
    id: string
    email: string
  }
  member: Member
}

/**
 * Authenticate request and return user + member context
 * Returns null if not authenticated
 */
export async function authenticate(): Promise<AuthContext | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.email) {
    return null
  }

  const member = await prisma.member.findUnique({
    where: { username: session.user.email },
  })

  if (!member || member.deletedAt) {
    return null
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
    },
    member,
  }
}

/**
 * Require authentication - returns error response if not authenticated
 */
export function requireAuth(authContext: AuthContext | null): NextResponse | null {
  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

/**
 * Require specific role - returns error response if role doesn't match
 */
export function requireRole(
  authContext: AuthContext,
  role: Role
): NextResponse | null {
  if (authContext.member.role !== role) {
    return NextResponse.json(
      { error: `Forbidden - Only ${role.toLowerCase()}s can perform this action` },
      { status: 403 }
    )
  }
  return null
}

/**
 * Validate UUID format (accepts any valid UUID version 1-5)
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Common error responses
 */
export const Errors = {
  unauthorized: () => NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  forbidden: (message?: string) =>
    NextResponse.json(
      { error: message || "Forbidden" },
      { status: 403 }
    ),
  notFound: (resource?: string) =>
    NextResponse.json(
      { error: resource ? `${resource} not found` : "Not found" },
      { status: 404 }
    ),
  badRequest: (message: string, details?: unknown) =>
    NextResponse.json(
      { error: message, details },
      { status: 400 }
    ),
  conflict: (message: string) =>
    NextResponse.json({ error: message }, { status: 409 }),
  tooManyRequests: () =>
    NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    ),
  internal: () =>
    NextResponse.json({ error: "Internal server error" }, { status: 500 }),
} as const

/**
 * Wrap API handler with standard error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | { error: string }>> {
  return handler().catch((error) => {
    console.error("API error:", error)
    return Errors.internal()
  })
}
