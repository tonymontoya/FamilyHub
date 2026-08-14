/**
 * API Error Handling
 * 
 * Standardized error responses for API routes
 */

import { ZodError } from "zod"
import { RATE_LIMIT_HEADERS } from "./rate-limit"

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}`
}

export class ApiError extends Error {
  public requestId: string

  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public headers?: Record<string, string>
  ) {
    super(message)
    this.name = "ApiError"
    this.requestId = generateRequestId()
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        requestId: this.requestId,
        ...(this.details && { details: this.details }),
      },
    }
  }
}

// Common error factories
export const Errors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    new ApiError(400, "BAD_REQUEST", message, details),

  validation: (issues: Array<{ path: string; message: string }>) =>
    new ApiError(400, "VALIDATION_ERROR", "Validation failed", { issues }),

  unauthorized: (message: string = "Authentication required") =>
    new ApiError(401, "UNAUTHORIZED", message),

  forbidden: (message: string = "Access denied") =>
    new ApiError(403, "FORBIDDEN", message),

  notFound: (resource: string) =>
    new ApiError(404, "NOT_FOUND", `${resource} not found`),

  conflict: (message: string) =>
    new ApiError(409, "CONFLICT", message),

  rateLimit: (retryAfter: number) =>
    new ApiError(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many requests",
      { retryAfter },
      { [RATE_LIMIT_HEADERS.RETRY_AFTER]: String(retryAfter) }
    ),

  internal: (message: string = "Internal server error") =>
    new ApiError(500, "INTERNAL_ERROR", message),
}

/**
 * Convert ZodError to ApiError
 */
export function zodToApiError(error: ZodError): ApiError {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }))
  return Errors.validation(issues)
}

/**
 * Handle API errors and return consistent response
 * Also logs to console for server-side debugging
 */
export function handleApiError(error: unknown): Response {
  // Convert Zod errors
  if (error instanceof ZodError) {
    const apiError = zodToApiError(error)
    return createErrorResponse(apiError)
  }

  // Handle known API errors
  if (error instanceof ApiError) {
    // Log for debugging (don't expose internals to client)
    console.error(`[API Error ${error.requestId}]`, {
      code: error.code,
      status: error.statusCode,
      message: error.message,
      details: error.details,
    })
    return createErrorResponse(error)
  }

  // Unknown error - log full details but return generic message
  const requestId = generateRequestId()
  console.error(`[Unexpected Error ${requestId}]`, error)

  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        requestId,
      },
    },
    { status: 500 }
  )
}

/**
 * Create error response with appropriate headers
 */
function createErrorResponse(error: ApiError): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
  })

  // Add custom headers (e.g., rate limit retry-after)
  if (error.headers) {
    Object.entries(error.headers).forEach(([key, value]) => {
      headers.set(key, value)
    })
  }

  return Response.json(error.toJSON(), {
    status: error.statusCode,
    headers,
  })
}

// ========== ROUTE HANDLER UTILITIES ==========

/**
 * Type for route handler function
 * Compatible with Next.js App Router pattern
 */
export type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response>

/**
 * Wrap async route handlers with error handling
 * Usage:
 *   export const GET = withErrorHandling(async (request, context) => { ... })
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * Helper for common success responses
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): Response {
  const responseHeaders = new Headers({
    "Content-Type": "application/json",
  })

  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      responseHeaders.set(key, value)
    })
  }

  return Response.json({ success: true, data }, { status, headers: responseHeaders })
}

/**
 * Helper for 201 Created responses
 */
export function createdResponse<T>(data: T, headers?: Record<string, string>): Response {
  return successResponse(data, 201, headers)
}

/**
 * Helper for 204 No Content responses
 */
export function noContentResponse(): Response {
  return new Response(null, { status: 204 })
}

// ========== FLAT-ENVELOPE ERROR HANDLING ==========
//
// The chores / completions / dashboard / children / auth routes serve clients
// that expect the LEGACY flat envelope: `{ error: "<message>" [, details] }`.
// The lists / calendar routes serve clients that expect the newer nested
// envelope from withErrorHandling() above. Both renderers share the SAME
// `Errors` factories and `ApiError` type — only the rendering differs — so
// there is still a single source of error definitions. (Unifying the two
// client envelopes is tracked as a separate effort.)

/**
 * Render any thrown error as a FLAT `{ error, details? }` Response.
 * Mirrors the shapes previously produced by the api-utils Errors object:
 *   - badRequest(message, details) -> { error, details }
 *   - everything else              -> { error }
 */
export function handleApiErrorFlat(error: unknown): Response {
  if (error instanceof ZodError) {
    const apiError = zodToApiError(error)
    return Response.json(
      { error: apiError.message, details: apiError.details },
      { status: apiError.statusCode }
    )
  }

  if (error instanceof ApiError) {
    console.error(`[API Error ${error.requestId}]`, {
      code: error.code,
      status: error.statusCode,
      message: error.message,
      details: error.details,
    })
    const body: Record<string, unknown> = { error: error.message }
    if (error.details !== undefined) body.details = error.details
    return Response.json(body, {
      status: error.statusCode,
      headers: error.headers,
    })
  }

  const requestId = generateRequestId()
  console.error(`[Unexpected Error ${requestId}]`, error)
  return Response.json({ error: "Internal server error" }, { status: 500 })
}

/**
 * Wrap a route handler, rendering errors with the flat envelope.
 * Use for routes whose clients expect `{ error: string }`.
 */
export function withFlatErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      return handleApiErrorFlat(error)
    }
  }
}
