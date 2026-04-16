/**
 * React Query Hooks for Calendar Events
 * 
 * Provides queries and mutations for calendar event operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { calendarKeys } from "./keys"
import {
  fetchEvents,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "./api"
import type {
  CalendarEvent,
  EventsResponse,
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
} from "./types"

// ===== Queries =====

export function useEvents(filters: EventFilters) {
  return useQuery<EventsResponse>({
    queryKey: calendarKeys.list(filters),
    queryFn: () => fetchEvents(filters),
    staleTime: 1000 * 60, // 1 minute
    enabled: !!filters.start && !!filters.end, // Only fetch when we have date range
  })
}

export function useEvent(id: string) {
  return useQuery<CalendarEvent>({
    queryKey: calendarKeys.detail(id),
    queryFn: async () => {
      const data = await fetchEvent(id)
      return data.event
    },
    staleTime: 1000 * 60,
    enabled: !!id,
  })
}

// ===== Mutations =====

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEvent,
    onSuccess: (data) => {
      // Invalidate event lists and occurrences
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.occurrences() })
      
      // Set the new event in cache
      queryClient.setQueryData(calendarKeys.detail(data.event.id), data.event)
      
      toast.success("Event created", {
        description: `"${data.event.title}" has been added to your calendar`,
      })
    },
    onError: (error) => {
      toast.error("Failed to create event", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      updateEvent(id, input),
    onSuccess: (data, variables) => {
      // Update cache for this event
      queryClient.setQueryData(calendarKeys.detail(variables.id), data.event)
      
      // Invalidate event lists and occurrences
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.occurrences() })
      
      toast.success("Event updated", {
        description: `"${data.event.title}" has been updated`,
      })
    },
    onError: (error) => {
      toast.error("Failed to update event", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.details() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.occurrences() })
      
      toast.success("Event deleted", {
        description: "The event has been removed from your calendar",
      })
    },
    onError: (error) => {
      toast.error("Failed to delete event", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    },
  })
}
