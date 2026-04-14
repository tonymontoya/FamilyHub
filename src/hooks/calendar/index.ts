/**
 * Calendar Module Hooks
 * 
 * React Query hooks for calendar functionality.
 */

// Types
export type {
  CalendarEvent,
  EventOccurrence,
  EventCreator,
  EventAttendee,
  EventException,
  EventReminder,
  EventsResponse,
  CreateEventInput,
  UpdateEventInput,
  CreateExceptionInput,
  EventFilters,
  OccurrenceFilters,
  PaginationInfo,
} from "./types"

// Queries & Mutations
export {
  useEvents,
  useEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "./use-events"

export {
  useCreateException,
  useDeleteException,
} from "./use-exceptions"

export {
  useOccurrences,
} from "./use-occurrences"

// Keys
export { calendarKeys } from "./keys"

// API (for advanced use cases)
export {
  fetchEvents,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  createException,
  deleteException,
} from "./api"
