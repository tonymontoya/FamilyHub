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
    queryFn: () => fetchEvent(id),
    staleTime: 1000 * 60,
    enabled: !!id,
  })
}

// ===== Mutations =====

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEvent,
    onSuccess: (newEvent) => {
      // Invalidate event lists
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      
      // Set the new event in cache
      queryClient.setQueryData(calendarKeys.detail(newEvent.id), newEvent)
      
      toast.success("Event created", {
        description: `"${newEvent.title}" has been added to your calendar`,
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
    onSuccess: (updatedEvent, variables) => {
      // Update cache for this event
      queryClient.setQueryData(calendarKeys.detail(variables.id), updatedEvent)
      
      // Invalidate event lists
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      
      toast.success("Event updated", {
        description: `"${updatedEvent.title}" has been updated`,
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
