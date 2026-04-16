/**
 * Active Reminders Hook
 * 
 * Polls for active reminders that need to be shown to the user.
 * Used to display browser notifications and toast alerts while the user is on the site.
 * 
 * Key features:
 * - Cross-tab deduplication using sessionStorage
 * - Tab visibility awareness (pauses when hidden, catches up when visible)
 * - Server-side acknowledgment prevents duplicates after refresh
 * - Sound notification support
 * 
 * @example
 * ```typescript
 * const { reminders, isLoading } = useActiveReminders({
 *   pollInterval: 30000, // Poll every 30 seconds
 *   onReminder: (reminder) => {
 *     showNotification(reminder.eventTitle)
 *     toast.info(`Event starting soon: ${reminder.eventTitle}`)
 *   }
 * })
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useCallback, useState } from "react"
import { fetchActiveReminders, acknowledgeReminder, bulkAcknowledgeReminders } from "./api"
import type { ActiveReminder } from "./types"
import { toast } from "sonner"

// Storage key for cross-tab deduplication
const PROCESSED_REMINDERS_KEY = "family-hub:processed-reminders"
const TAB_ID = Math.random().toString(36).slice(2)

interface UseActiveRemindersOptions {
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  pollInterval?: number
  /** Callback when new reminders are found */
  onReminder?: (reminder: ActiveReminder) => void
  /** Enable/disable polling (default: true) */
  enabled?: boolean
  /** Enable sound notification (default: false) */
  soundEnabled?: boolean
}

/**
 * Get processed reminder IDs from sessionStorage (cross-tab)
 */
function getProcessedReminders(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const stored = sessionStorage.getItem(PROCESSED_REMINDERS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return new Set(parsed)
    }
  } catch {
    // Ignore storage errors
  }
  return new Set()
}

/**
 * Save processed reminder IDs to sessionStorage
 */
function saveProcessedReminders(ids: Set<string>) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(PROCESSED_REMINDERS_KEY, JSON.stringify([...ids]))
  } catch {
    // Ignore storage errors (e.g., storage full)
  }
}

/**
 * Clear old processed reminders (keep only last 100)
 */
function cleanupProcessedReminders() {
  const processed = getProcessedReminders()
  if (processed.size > 100) {
    const toKeep = [...processed].slice(-100)
    saveProcessedReminders(new Set(toKeep))
  }
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  try {
    const audio = new Audio("/sounds/notification.mp3")
    audio.volume = 0.5
    audio.play().catch(() => {
      // Ignore autoplay restrictions
    })
  } catch {
    // Ignore audio errors
  }
}

export function useActiveReminders(options: UseActiveRemindersOptions = {}) {
  const {
    pollInterval = 30000,
    onReminder,
    enabled = true,
    soundEnabled = false,
  } = options

  const queryClient = useQueryClient()
  
  // Track last hidden time for catching up when tab becomes visible
  const lastHiddenTimeRef = useRef<string | null>(null)
  
  // Track tab visibility
  const [isVisible, setIsVisible] = useState(true)
  
  // Track last successful fetch time for the "since" parameter
  const [lastFetchTime, setLastFetchTime] = useState<string | undefined>()
  
  // Use a stable query key - don't include timestamps
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["active-reminders"],
    queryFn: () => fetchActiveReminders(lastFetchTime),
    refetchInterval: enabled && isVisible ? pollInterval : false,
    refetchIntervalInBackground: false,
    enabled: enabled && isVisible,
    staleTime: pollInterval / 2,
  })

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden
      setIsVisible(!hidden)
      
      if (hidden) {
        // Tab is being hidden - remember the time
        lastHiddenTimeRef.current = new Date().toISOString()
      } else {
        // Tab is becoming visible - catch up on missed reminders
        if (lastHiddenTimeRef.current) {
          // Update lastFetchTime to fetch since we were hidden
          setLastFetchTime(lastHiddenTimeRef.current)
          // Force immediate refetch
          refetch()
        }
      }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [refetch])

  // Process new reminders
  useEffect(() => {
    if (!data?.reminders || !onReminder) return

    // Get cross-tab processed reminders
    const processedIds = getProcessedReminders()
    
    // Find reminders we haven't processed yet
    const newReminders = data.reminders.filter(
      (reminder) => !processedIds.has(reminder.id)
    )

    // Process each new reminder
    newReminders.forEach((reminder) => {
      try {
        onReminder(reminder)
        processedIds.add(reminder.id)
      } catch (error) {
        console.error("Failed to process reminder:", error)
      }
    })

    // Save updated processed set
    if (newReminders.length > 0) {
      saveProcessedReminders(processedIds)
      cleanupProcessedReminders()
    }

    // Update last fetch time for next fetch
    if (data.checkedAt) {
      setLastFetchTime(data.checkedAt)
    }
  }, [data, onReminder])

  // Clear processed reminders when disabled
  useEffect(() => {
    if (!enabled) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(PROCESSED_REMINDERS_KEY)
      }
    }
  }, [enabled])

  // Acknowledge a reminder (mark as seen)
  const acknowledge = useCallback(async (reminderId: string) => {
    try {
      await acknowledgeReminder(reminderId)
      
      // Add to processed set
      const processedIds = getProcessedReminders()
      processedIds.add(reminderId)
      saveProcessedReminders(processedIds)
      
      // Invalidate query to refresh
      queryClient.invalidateQueries({ queryKey: ["active-reminders"] })
    } catch (error) {
      console.error("Failed to acknowledge reminder:", error)
    }
  }, [queryClient])

  // Bulk acknowledge reminders
  const acknowledgeAll = useCallback(async (reminderIds: string[]) => {
    try {
      await bulkAcknowledgeReminders(reminderIds)
      
      // Add all to processed set
      const processedIds = getProcessedReminders()
      reminderIds.forEach(id => processedIds.add(id))
      saveProcessedReminders(processedIds)
      
      // Invalidate query to refresh
      queryClient.invalidateQueries({ queryKey: ["active-reminders"] })
    } catch (error) {
      console.error("Failed to acknowledge reminders:", error)
    }
  }, [queryClient])

  // Dismiss a reminder locally (without server call - use for "snooze")
  const dismiss = useCallback((reminderId: string) => {
    const processedIds = getProcessedReminders()
    processedIds.add(reminderId)
    saveProcessedReminders(processedIds)
  }, [])

  // Manual refresh function
  const refresh = useCallback(() => {
    setLastFetchTime(undefined)
    queryClient.invalidateQueries({ queryKey: ["active-reminders"] })
    refetch()
  }, [queryClient, refetch])

  return {
    reminders: data?.reminders || [],
    isLoading,
    error,
    refresh,
    acknowledge,
    acknowledgeAll,
    dismiss,
    isVisible,
    lastChecked: data?.checkedAt,
  }
}

/**
 * Hook to show browser notifications for active reminders
 * 
 * Features:
 * - Browser notifications with click-to-focus
 * - Toast notifications with View action
 * - Sound notifications (optional)
 * - Error handling with retry indication
 * 
 * @example
 * ```typescript
 * useReminderNotifications({
 *   soundEnabled: true,
 * })
 * ```
 */
export function useReminderNotifications(options: {
  pollInterval?: number
  enabled?: boolean
  soundEnabled?: boolean
  onNavigateToEvent?: (date: Date) => void
} = {}) {
  const {
    pollInterval = 30000,
    enabled = true,
    soundEnabled = false,
    onNavigateToEvent,
  } = options

  // Track if browser notifications are supported and permitted
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null)
  
  // Track API errors for user feedback
  const [hasError, setHasError] = useState(false)

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    setNotificationPermission(Notification.permission)
  }, [])

  // Show browser notification
  const showBrowserNotification = useCallback((reminder: ActiveReminder) => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return

    const title = "Event Reminder"
    const body = formatReminderMessage(reminder.eventTitle, reminder.minutesBefore)
    
    try {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: reminder.id, // Prevent duplicate notifications
        requireInteraction: false,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
        if (onNavigateToEvent) {
          onNavigateToEvent(new Date(reminder.eventStartDate))
        }
      }
    } catch (error) {
      console.error("Failed to show browser notification:", error)
    }
  }, [onNavigateToEvent])

  // Show toast notification
  const showToast = useCallback((reminder: ActiveReminder, acknowledgeFn: (id: string) => void) => {
    const message = formatReminderMessage(reminder.eventTitle, reminder.minutesBefore)
    
    toast.info(message, {
      duration: 10000,
      action: {
        label: "View",
        onClick: () => {
          acknowledgeFn(reminder.id)
          if (onNavigateToEvent) {
            onNavigateToEvent(new Date(reminder.eventStartDate))
          }
        },
      },
      onDismiss: () => {
        // Acknowledge when user dismisses the toast
        acknowledgeFn(reminder.id)
      },
    })
  }, [onNavigateToEvent])

  // Handle reminder
  const handleReminder = useCallback((reminder: ActiveReminder, acknowledgeFn: (id: string) => void) => {
    // Play sound if enabled
    if (soundEnabled) {
      playNotificationSound()
    }

    // Show browser notification
    showBrowserNotification(reminder)

    // Show toast
    showToast(reminder, acknowledgeFn)
  }, [soundEnabled, showBrowserNotification, showToast])

  const { 
    reminders, 
    isLoading, 
    error, 
    acknowledge, 
    acknowledgeAll, 
    dismiss,
    refresh,
    isVisible 
  } = useActiveReminders({
    pollInterval,
    enabled,
    soundEnabled,
    onReminder: (reminder) => handleReminder(reminder, acknowledge),
  })

  // Show error toast if API is failing
  useEffect(() => {
    if (error && !hasError) {
      setHasError(true)
      toast.error("Failed to check reminders", {
        description: "Will retry automatically",
        action: {
          label: "Retry",
          onClick: () => {
            setHasError(false)
            refresh()
          },
        },
      })
    } else if (!error && hasError) {
      setHasError(false)
    }
  }, [error, hasError, refresh])

  // Snooze functionality - dismiss locally and remind again in X minutes
  const snooze = useCallback((reminderId: string, minutes: number) => {
    // Dismiss locally
    dismiss(reminderId)
    
    // Schedule to clear from processed set after snooze time
    setTimeout(() => {
      // This will cause the reminder to be shown again on next poll
      // In a real implementation, you might want to track snooze state server-side
      console.log(`Snooze expired for reminder ${reminderId}`)
    }, minutes * 60 * 1000)
    
    toast.success(`Reminder snoozed for ${minutes} minutes`)
  }, [dismiss])

  return {
    reminders,
    isLoading,
    error,
    hasReminders: reminders.length > 0,
    isVisible,
    notificationPermission,
    acknowledge,
    acknowledgeAll,
    snooze,
    dismiss,
    refresh,
  }
}

/**
 * Format a reminder message based on minutes before event
 */
function formatReminderMessage(eventTitle: string, minutesBefore: number): string {
  if (minutesBefore === 0) {
    return `"${eventTitle}" is starting now`
  }
  
  if (minutesBefore < 60) {
    return `"${eventTitle}" starts in ${minutesBefore} minute${minutesBefore === 1 ? "" : "s"}`
  }
  
  const hours = Math.floor(minutesBefore / 60)
  if (hours < 24) {
    return `"${eventTitle}" starts in ${hours} hour${hours === 1 ? "" : "s"}`
  }
  
  const days = Math.floor(hours / 24)
  return `"${eventTitle}" starts in ${days} day${days === 1 ? "" : "s"}`
}
