/**
 * Global Reminder Notifications Component
 * 
 * This component runs at the app shell level and handles:
 * - Polling for active reminders
 * - Showing browser notifications
 * - Showing toast notifications
 * - Managing notification permissions
 * 
 * Place this component inside the AppShell so it runs on all authenticated pages.
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import { useReminderNotifications } from "@/hooks/calendar"
import { useRouter } from "next/navigation"

export function ReminderNotifications() {
  const router = useRouter()
  
  // Track if user has enabled sound notifications
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("reminder-sound-enabled") === "true"
  })

  // Save sound preference
  useEffect(() => {
    localStorage.setItem("reminder-sound-enabled", String(soundEnabled))
  }, [soundEnabled])

  // Navigate to calendar when user clicks "View" on a reminder
  const handleNavigateToEvent = useCallback((date: Date) => {
    // Navigate to calendar with date parameter
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    router.push(`/calendar?date=${year}-${month}-${day}`)
  }, [router])

  // Use the reminder notifications hook
  const {
    hasReminders,
    isLoading,
    error,
    notificationPermission,
    acknowledgeAll,
  } = useReminderNotifications({
    pollInterval: 30000, // Poll every 30 seconds
    enabled: true,
    soundEnabled,
    onNavigateToEvent: handleNavigateToEvent,
  })

  // Request notification permission on first load if not set
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "default") {
      // Don't auto-request - let user opt in via settings
      // This avoids the permission prompt appearing unexpectedly
    }
  }, [])

  // This component doesn't render any UI itself - it's a background service
  // The UI (toasts, browser notifications) are handled by the hook
  return null
}

/**
 * Settings component for notification preferences
 * Can be used in a settings page
 */
export function NotificationSettings() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("reminder-sound-enabled") === "true"
  })
  const [permission, setPermission] = useState<NotificationPermission | null>(() => {
    if (typeof window === "undefined") return null
    if ("Notification" in window) {
      return Notification.permission
    }
    return null
  })

  const requestPermission = async () => {
    if (!("Notification" in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem("reminder-sound-enabled", String(newValue))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Browser Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Show system notifications for event reminders
          </p>
        </div>
        <button
          onClick={requestPermission}
          disabled={permission === "granted"}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          {permission === "granted"
            ? "Enabled"
            : permission === "denied"
            ? "Blocked"
            : "Enable"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Sound</h3>
          <p className="text-sm text-muted-foreground">
            Play a sound when reminders trigger
          </p>
        </div>
        <button
          onClick={toggleSound}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            soundEnabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              soundEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  )
}
