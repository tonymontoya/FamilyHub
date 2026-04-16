/**
 * Calendar API Functions
 */

import type { 
  CreateEventInput, 
  UpdateEventInput, 
  CreateExceptionInput,
  CreateReminderInput,
  EventsResponse,
  EventOccurrence,
  CalendarEvent,
  ActiveReminder,
  EventException,
} from "./types"

const API_BASE = "/api/calendar"

// ===== Events =====

export async function fetchEvents(
  filters: { start: string; end: string; type?: string; assigneeId?: string; limit?: number; offset?: number }
): Promise<EventsResponse> {
  const params = new URLSearchParams({ start: filters.start, end: filters.end })
  if (filters.type) params.set("type", filters.type)
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId)
  if (filters.limit) params.set("limit", filters.limit.toString())
  if (filters.offset) params.set("offset", filters.offset.toString())

  const response = await fetch(`${API_BASE}/events?${params}`)
  if (!response.ok) throw new Error("Failed to fetch events")
  return response.json()
}

export async function fetchEvent(id: string): Promise<{ event: CalendarEvent }> {
  const response = await fetch(`${API_BASE}/events/${id}`)
  if (!response.ok) throw new Error("Failed to fetch event")
  return response.json()
}

export async function createEvent(input: CreateEventInput): Promise<{ event: CalendarEvent }> {
  const response = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create event")
  }
  return response.json()
}

export async function updateEvent(
  id: string,
  input: UpdateEventInput
): Promise<{ event: CalendarEvent }> {
  const response = await fetch(`${API_BASE}/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update event")
  }
  return response.json()
}

export async function deleteEvent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete event")
}

// ===== Occurrences =====

export async function fetchOccurrences(
  start: string,
  end: string,
  options?: { type?: string; assigneeId?: string }
): Promise<EventOccurrence[]> {
  const params = new URLSearchParams({ start, end })
  if (options?.type) params.set("type", options.type)
  if (options?.assigneeId) params.set("assigneeId", options.assigneeId)

  const response = await fetch(`${API_BASE}/occurrences?${params}`)
  if (!response.ok) throw new Error("Failed to fetch occurrences")
  const data = await response.json()
  return data.occurrences
}

// ===== Exceptions =====

export async function createException(
  eventId: string,
  input: CreateExceptionInput
): Promise<EventException> {
  const response = await fetch(`${API_BASE}/events/${eventId}/exceptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create exception")
  }
  const data = await response.json()
  return data.data
}

export async function deleteException(
  eventId: string,
  exceptionId: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${eventId}/exceptions/${exceptionId}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete exception")
}

// ===== Reminders =====

export async function createReminder(
  eventId: string,
  input: CreateReminderInput
): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${eventId}/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create reminder")
  }
}

export async function deleteReminder(eventId: string, reminderId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${eventId}/reminders/${reminderId}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete reminder")
}

/**
 * Fetch active reminders that need to be shown
 * @param since - Optional timestamp to fetch reminders since (for recovery after tab hidden)
 */
export async function fetchActiveReminders(since?: string): Promise<{ 
  reminders: ActiveReminder[]
  checkedAt: string 
}> {
  const params = new URLSearchParams()
  if (since) params.set("since", since)

  const response = await fetch(`${API_BASE}/reminders/active?${params}`)
  if (!response.ok) throw new Error("Failed to fetch active reminders")
  return response.json()
}

/**
 * Acknowledge a reminder (mark as seen by user)
 */
export async function acknowledgeReminder(reminderId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/reminders/${reminderId}/acknowledge`, {
    method: "POST",
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to acknowledge reminder")
  }
}

/**
 * Bulk acknowledge multiple reminders
 */
export async function bulkAcknowledgeReminders(reminderIds: string[]): Promise<void> {
  const response = await fetch(`${API_BASE}/reminders/acknowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: reminderIds }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to acknowledge reminders")
  }
}
