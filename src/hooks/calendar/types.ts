/**
 * Types for Calendar Module Hooks
 */

import type { EventType, AttendeeStatus, ReminderType } from "@prisma/client"

// ===== API Response Types =====

export interface EventCreator {
  id: string
  displayName: string
  avatarUrl: string | null
}

export interface EventAttendee {
  id: string
  memberId: string
  member: EventCreator
  status: AttendeeStatus
}

export interface EventException {
  id: string
  originalDate: string
  title: string | null
  description: string | null
  startTime: string | null
  endTime: string | null
  location: string | null
  isCancelled: boolean
}

export interface EventReminder {
  id: string
  minutesBefore: number
  type: ReminderType
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startDate: string
  startTime: string | null
  endDate: string | null
  endTime: string | null
  timezone: string
  isRecurring: boolean
  recurrenceRule: string | null
  recurrenceEnd: string | null
  assigneeIds: string[]
  isFamilyWide: boolean
  type: EventType
  location: string | null
  color: string | null
  createdBy: EventCreator
  attendees: EventAttendee[]
  exceptions: EventException[]
  reminders: EventReminder[]
  createdAt: string
  updatedAt: string
}

// ===== Occurrence Type (from recurrence expansion) =====

export interface EventOccurrence {
  id: string // eventId_date
  eventId: string
  date: string // YYYY-MM-DD
  title: string
  description: string | null
  startTime: string | null
  endTime: string | null
  timezone: string
  location: string | null
  color: string | null
  type: EventType
  isException: boolean
  exceptionId?: string
  isCancelled: boolean
}

// ===== Pagination =====

export interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface EventsResponse {
  events: CalendarEvent[]
  range: {
    start: string
    end: string
  }
  pagination: PaginationInfo
}

// ===== Input Types =====

export interface CreateEventInput {
  title: string
  description?: string
  startDate: string // YYYY-MM-DD
  startTime?: string // HH:MM
  endDate?: string // YYYY-MM-DD
  endTime?: string // HH:MM
  timezone?: string
  isRecurring?: boolean
  recurrenceRule?: string
  recurrenceEnd?: string // ISO 8601
  assigneeIds?: string[]
  isFamilyWide?: boolean
  type?: EventType
  location?: string
  color?: string
  reminders?: Array<{
    minutesBefore: number
    type: ReminderType
  }>
}

export interface UpdateEventInput {
  title?: string
  description?: string
  startDate?: string
  startTime?: string | null
  endDate?: string | null
  endTime?: string | null
  timezone?: string
  isRecurring?: boolean
  recurrenceRule?: string | null
  recurrenceEnd?: string | null
  assigneeIds?: string[]
  isFamilyWide?: boolean
  type?: EventType
  location?: string | null
  color?: string | null
}

export interface CreateExceptionInput {
  originalDate: string // YYYY-MM-DD
  title?: string
  description?: string
  startTime?: string // HH:MM
  endTime?: string // HH:MM
  location?: string
  isCancelled?: boolean
}

// ===== Reminder Types =====

export interface CreateReminderInput {
  minutesBefore: number
  type: "BROWSER" | "EMAIL" | "PUSH"
}

export interface ActiveReminder {
  id: string
  eventId: string
  eventTitle: string
  eventStartDate: string
  eventStartTime: string | null
  eventLocation: string | null
  minutesBefore: number
  type: "BROWSER" | "EMAIL" | "PUSH"
  sentAt: string
}

export type { ReminderType } from "@prisma/client"

// ===== Filter Types =====

export interface EventFilters {
  start: string // YYYY-MM-DD, required
  end: string // YYYY-MM-DD, required
  type?: EventType
  assigneeId?: string
  limit?: number
  offset?: number
}

export interface OccurrenceFilters {
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  type?: EventType
  assigneeId?: string
}
