/**
 * Calendar API Functions
 * 
 * Direct API calls for calendar operations.
 */

import type {
  CalendarEvent,
  EventsResponse,
  CreateEventInput,
  UpdateEventInput,
  CreateExceptionInput,
  EventException,
  EventFilters,
} from "./types"

const API_BASE = "/api/calendar"

// ===== Error Handling =====

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      data.error?.message || "An error occurred",
      data.error?.details
    )
  }
  return response.json()
}

/**
 * Wrapper for fetch that handles network errors
 */
async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options)
  } catch (error) {
    // Network errors (offline, DNS failure, etc.)
    if (error instanceof TypeError) {
      throw new ApiError(0, "Network error - please check your connection")
    }
    throw error
  }
}

// ===== Events API =====

export async function fetchEvents(filters: EventFilters): Promise<EventsResponse> {
  const params = new URLSearchParams()
  params.set("start", filters.start)
  params.set("end", filters.end)
  if (filters.type) params.set("type", filters.type)
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId)
  if (filters.limit) params.set("limit", String(filters.limit))
  if (filters.offset) params.set("offset", String(filters.offset))

  const response = await safeFetch(`${API_BASE}/events?${params}`)
  const data = await handleResponse<{ data: EventsResponse }>(response)
  return data.data
}

export async function fetchEvent(id: string): Promise<CalendarEvent> {
  const response = await safeFetch(`${API_BASE}/events/${id}`)
  const data = await handleResponse<{ data: CalendarEvent }>(response)
  return data.data
}

export async function createEvent(input: CreateEventInput): Promise<CalendarEvent> {
  const response = await safeFetch(`${API_BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await handleResponse<{ data: CalendarEvent }>(response)
  return data.data
}

export async function updateEvent(id: string, input: UpdateEventInput): Promise<CalendarEvent> {
  const response = await safeFetch(`${API_BASE}/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await handleResponse<{ data: CalendarEvent }>(response)
  return data.data
}

export async function deleteEvent(id: string): Promise<void> {
  const response = await safeFetch(`${API_BASE}/events/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    await handleResponse(response) // Will throw
  }
}

// ===== Exceptions API =====

export async function createException(
  eventId: string,
  input: CreateExceptionInput
): Promise<EventException> {
  const response = await safeFetch(`${API_BASE}/events/${eventId}/exceptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await handleResponse<{ data: EventException }>(response)
  return data.data
}

export async function deleteException(eventId: string, exceptionId: string): Promise<void> {
  const response = await safeFetch(
    `${API_BASE}/events/${eventId}/exceptions/${exceptionId}`,
    { method: "DELETE" }
  )
  if (!response.ok) {
    await handleResponse(response)
  }
}
