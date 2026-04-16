/**
 * React Query Hooks for Event Reminders
 * 
 * Provides mutations for managing event reminders.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { calendarKeys } from "./keys"
import { createReminder, deleteReminder } from "./api"
import type { CreateReminderInput } from "./types"

// ===== Types =====

interface CreateReminderVariables {
  eventId: string
  input: CreateReminderInput
}

// ===== Mutations =====

export function useCreateReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, input }: CreateReminderVariables) => 
      createReminder(eventId, input),
    
    onSuccess: (_, variables) => {
      // Invalidate the specific event to refresh reminders
      queryClient.invalidateQueries({ 
        queryKey: calendarKeys.detail(variables.eventId) 
      })
      
      toast.success("Reminder added", {
        description: `You'll be notified ${variables.input.minutesBefore} minutes before`,
      })
    },
    
    onError: (error) => {
      toast.error("Failed to add reminder", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    },
  })
}

export function useDeleteReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reminderId, eventId }: { reminderId: string; eventId: string }) => 
      deleteReminder(eventId, reminderId),
    
    onSuccess: (_, variables) => {
      // Invalidate the specific event to refresh reminders
      queryClient.invalidateQueries({ 
        queryKey: calendarKeys.detail(variables.eventId) 
      })
      
      toast.success("Reminder removed")
    },
    
    onError: (error) => {
      toast.error("Failed to remove reminder", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    },
  })
}
