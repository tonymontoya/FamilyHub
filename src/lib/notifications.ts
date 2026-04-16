/**
 * Browser Notification Utilities
 * 
 * Handles requesting permission and showing browser notifications.
 */

// Check if browser supports notifications
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return "default"
  }
  return Notification.permission
}

// Request permission from user
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return "denied"
  }

  if (Notification.permission === "granted") {
    return "granted"
  }

  if (Notification.permission === "denied") {
    return "denied"
  }

  const permission = await Notification.requestPermission()
  return permission
}

// Show a notification
interface ShowNotificationOptions {
  title: string
  body?: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  onClick?: () => void
}

export function showNotification(options: ShowNotificationOptions): Notification | null {
  if (!isNotificationSupported()) {
    return null
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted")
    return null
  }

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || "/icon.png",
    tag: options.tag,
    requireInteraction: options.requireInteraction ?? false,
  })

  if (options.onClick) {
    notification.onclick = options.onClick
  }

  return notification
}

// Format reminder message
export function formatReminderMessage(eventTitle: string, minutesBefore: number): string {
  if (minutesBefore === 0) {
    return `"${eventTitle}" is starting now`
  }
  
  if (minutesBefore < 60) {
    return `"${eventTitle}" starts in ${minutesBefore} minutes`
  }
  
  const hours = Math.floor(minutesBefore / 60)
  if (hours === 1) {
    return `"${eventTitle}" starts in 1 hour`
  }
  
  return `"${eventTitle}" starts in ${hours} hours`
}

// Reminder time options
export const REMINDER_TIME_OPTIONS = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
] as const

// Get human-readable label for minutes
export function getReminderLabel(minutes: number): string {
  const option = REMINDER_TIME_OPTIONS.find(opt => opt.value === minutes)
  return option?.label || `${minutes} minutes before`
}
