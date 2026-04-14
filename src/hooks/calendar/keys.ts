/**
 * React Query Keys for Calendar Module
 * 
 * Centralized key management for cache consistency.
 */

export const calendarKeys = {
  all: ["calendar"] as const,
  
  // Events list with filters
  lists: () => [...calendarKeys.all, "events"] as const,
  list: (filters: { start: string; end: string; type?: string; assigneeId?: string }) =>
    [...calendarKeys.lists(), filters] as const,
  
  // Single event
  details: () => [...calendarKeys.all, "event"] as const,
  detail: (id: string) => [...calendarKeys.details(), id] as const,
  
  // Occurrences (expanded recurring events)
  occurrences: () => [...calendarKeys.all, "occurrences"] as const,
  occurrence: (filters: { start: string; end: string; type?: string; assigneeId?: string }) =>
    [...calendarKeys.occurrences(), filters] as const,
} as const
