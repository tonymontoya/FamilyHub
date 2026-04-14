/**
 * React Query Hooks for Event Exceptions
 * 
 * Provides mutations for managing recurring event exceptions.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { calendarKeys } from "./keys"
import { createException, deleteException } from "./api"
import type { CreateExceptionInput, EventException } from "./types"

// ===== Mutations =====

export function useCreateException() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      eventId,
      input,
    }: {
      eventId: string
      input: CreateExceptionInput
    }) => createException(eventId, input),
    onSuccess: (exception, variables) => {
      // Invalidate the specific event
      queryClient.invalidateQueries({
        queryKey: calendarKeys.detail(variables.eventId),
      })
      
      // Invalidate event lists and occurrences (they may show modified occurrences)
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.occurrences() })
      
      const action = exception.isCancelled ? "cancelled" : "modified"
      toast.success(`Occurrence ${action}`, {
        description: `The occurrence on ${exception.originalDate} has been ${action}`,
      })
    },
    onError: (error) => {
      toast.error("Failed to create exception", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    },
  })
}

export function useDeleteException() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      eventId,
      exceptionId,
    }: {
      eventId: string
      exceptionId: string
    }) => deleteException(eventId, exceptionId),
    onSuccess: (_, variables) => {
      // Invalidate the specific event
      queryClient.invalidateQueries({
        queryKey: calendarKeys.detail(variables.eventId),
      })
      
      // Invalidate event lists and occurrences
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.occurrences() })
      
      toast.success("Exception removed", {
        description: "The occurrence has been restored to the original event",
      })
    },
    onError: (error) => {
      toast.error("Failed to remove exception", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    },
  })
}
