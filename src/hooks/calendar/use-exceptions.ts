/**
 * React Query Hooks for Event Exceptions
 * 
 * Provides mutations for managing recurring event exceptions.
 * Uses optimistic updates for instant UI feedback.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { calendarKeys } from "./keys"
import { createException, deleteException } from "./api"
import type { CreateExceptionInput, EventException, EventOccurrence } from "./types"

// ===== Types =====

interface CreateExceptionVariables {
  eventId: string
  input: CreateExceptionInput
}

interface DeleteExceptionVariables {
  eventId: string
  exceptionId: string
  originalDate: string // Needed to identify which occurrence to restore
}

// Context types for optimistic updates
interface CreateExceptionContext {
  previousOccurrences: EventOccurrence[] | undefined
  previousEvent: { exceptions: EventException[] } | undefined
  optimisticExceptionId: string
}

interface DeleteExceptionContext {
  previousOccurrences: EventOccurrence[] | undefined
  previousEvent: { exceptions: EventException[] } | undefined
}

// ===== Optimistic Update Helpers =====

/**
 * Apply an exception to an occurrence optimistically
 */
function applyExceptionToOccurrence(
  occurrence: EventOccurrence,
  exception: CreateExceptionInput,
  exceptionId: string
): EventOccurrence {
  return {
    ...occurrence,
    title: exception.title ?? occurrence.title,
    description: exception.description ?? occurrence.description,
    startTime: exception.startTime ?? occurrence.startTime,
    endTime: exception.endTime ?? occurrence.endTime,
    location: exception.location ?? occurrence.location,
    isException: true,
    exceptionId,
    isCancelled: exception.isCancelled ?? false,
  }
}

/**
 * Remove an exception from an occurrence (restore to original)
 */
function removeExceptionFromOccurrence(
  occurrence: EventOccurrence,
  originalEvent: { title: string; description: string | null; location: string | null }
): EventOccurrence {
  return {
    ...occurrence,
    title: originalEvent.title,
    description: originalEvent.description,
    // For times, we'd need the original event times - simplified here
    isException: false,
    exceptionId: undefined,
    isCancelled: false,
  }
}

// ===== Mutations =====

export function useCreateException() {
  const queryClient = useQueryClient()

  return useMutation<EventException, Error, CreateExceptionVariables, CreateExceptionContext>({
    mutationFn: ({ eventId, input }) => createException(eventId, input),

    // Optimistically update the cache
    onMutate: async (variables) => {
      const { eventId, input } = variables

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: calendarKeys.occurrences() })
      await queryClient.cancelQueries({ queryKey: calendarKeys.detail(eventId) })

      // Snapshot previous values for rollback
      const previousOccurrences = queryClient.getQueryData<EventOccurrence[]>(
        calendarKeys.occurrences()
      )
      const previousEvent = queryClient.getQueryData<{ exceptions: EventException[] }>(
        calendarKeys.detail(eventId)
      )

      // Generate a temporary ID for the optimistic exception
      const optimisticExceptionId = `temp-${Date.now()}`

      // Optimistically update occurrences
      queryClient.setQueriesData<EventOccurrence[]>(
        { queryKey: calendarKeys.occurrences() },
        (old) => {
          if (!old) return old
          return old.map((occ) =>
            occ.eventId === eventId && occ.date === input.originalDate
              ? applyExceptionToOccurrence(occ, input, optimisticExceptionId)
              : occ
          )
        }
      )

      // Optimistically update the event detail cache
      if (previousEvent) {
        queryClient.setQueryData(calendarKeys.detail(eventId), {
          ...previousEvent,
          exceptions: [
            ...previousEvent.exceptions,
            {
              id: optimisticExceptionId,
              eventId,
              ...input,
            } as EventException,
          ],
        })
      }

      return { previousOccurrences, previousEvent, optimisticExceptionId }
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousOccurrences) {
        queryClient.setQueriesData<EventOccurrence[]>(
          { queryKey: calendarKeys.occurrences() },
          context.previousOccurrences
        )
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(
          calendarKeys.detail(variables.eventId),
          context.previousEvent
        )
      }

      toast.error("Failed to create exception", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    },

    // Success handling
    onSuccess: (exception, variables, context) => {
      // Replace optimistic ID with real ID
      queryClient.setQueriesData<EventOccurrence[]>(
        { queryKey: calendarKeys.occurrences() },
        (old) => {
          if (!old) return old
          return old.map((occ) =>
            occ.exceptionId === context?.optimisticExceptionId
              ? { ...occ, exceptionId: exception.id }
              : occ
          )
        }
      )

      const action = exception.isCancelled ? "cancelled" : "modified"
      toast.success(`Occurrence ${action}`, {
        description: `The occurrence on ${exception.originalDate} has been ${action}`,
      })
    },

    // Always invalidate to ensure consistency
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.occurrences() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.detail(variables.eventId) })
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
    },
  })
}

export function useDeleteException() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, DeleteExceptionVariables, DeleteExceptionContext>({
    mutationFn: ({ eventId, exceptionId }) => deleteException(eventId, exceptionId),

    // Optimistically update the cache
    onMutate: async (variables) => {
      const { eventId, exceptionId } = variables

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: calendarKeys.occurrences() })
      await queryClient.cancelQueries({ queryKey: calendarKeys.detail(eventId) })

      // Snapshot previous values
      const previousOccurrences = queryClient.getQueryData<EventOccurrence[]>(
        calendarKeys.occurrences()
      )
      const previousEvent = queryClient.getQueryData<{ exceptions: EventException[] }>(
        calendarKeys.detail(eventId)
      )

      // Get original event data for restoration
      const eventData = queryClient.getQueryData<{
        title: string
        description: string | null
        location: string | null
      }>(calendarKeys.detail(eventId))

      // Optimistically remove exception from occurrences
      queryClient.setQueriesData<EventOccurrence[]>(
        { queryKey: calendarKeys.occurrences() },
        (old) => {
          if (!old) return old
          return old.map((occ) =>
            occ.exceptionId === exceptionId && eventData
              ? removeExceptionFromOccurrence(occ, eventData)
              : occ
          )
        }
      )

      // Optimistically update the event detail cache
      if (previousEvent) {
        queryClient.setQueryData(calendarKeys.detail(eventId), {
          ...previousEvent,
          exceptions: previousEvent.exceptions.filter((e) => e.id !== exceptionId),
        })
      }

      return { previousOccurrences, previousEvent }
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousOccurrences) {
        queryClient.setQueriesData<EventOccurrence[]>(
          { queryKey: calendarKeys.occurrences() },
          context.previousOccurrences
        )
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(
          calendarKeys.detail(variables.eventId),
          context.previousEvent
        )
      }

      toast.error("Failed to remove exception", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    },

    // Success handling
    onSuccess: () => {
      toast.success("Exception removed", {
        description: "The occurrence has been restored to the original event",
      })
    },

    // Always invalidate to ensure consistency
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.occurrences() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.detail(variables.eventId) })
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
    },
  })
}
