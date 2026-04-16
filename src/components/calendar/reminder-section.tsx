"use client"

import { Bell, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EventReminder } from "@/hooks/calendar"
import { REMINDER_TIME_OPTIONS, getReminderLabel } from "@/lib/notifications"

interface ReminderSectionProps {
  reminders: EventReminder[]
  onAdd: (minutesBefore: number) => void
  onDelete: (reminderId: string) => void
  isLoading?: boolean
}

const MAX_REMINDERS = 5

export function ReminderSection({
  reminders,
  onAdd,
  onDelete,
  isLoading = false,
}: ReminderSectionProps) {
  const canAddMore = reminders.length < MAX_REMINDERS

  // Get available time options (not already used)
  const usedMinutes = new Set(reminders.map((r) => r.minutesBefore))
  const availableOptions = REMINDER_TIME_OPTIONS.filter(
    (opt) => !usedMinutes.has(opt.value)
  )

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Reminders</span>
          {reminders.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({reminders.length}/{MAX_REMINDERS})
            </span>
          )}
        </div>
      </div>

      {/* Existing reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">
                  {getReminderLabel(reminder.minutesBefore)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({reminder.type.toLowerCase()})
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDelete(reminder.id)}
                disabled={isLoading}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add reminder */}
      {canAddMore && availableOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            disabled={isLoading}
            onValueChange={(value) => onAdd(parseInt(value, 10))}
          >
            <SelectTrigger className="flex-1">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <SelectValue placeholder="Add reminder" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {reminders.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No reminders set. Add one to get notified before the event starts.
        </p>
      )}
    </div>
  )
}

// Bell icon badge for event cards
interface ReminderBadgeProps {
  count: number
  className?: string
}

export function ReminderBadge({ count, className }: ReminderBadgeProps) {
  if (count === 0) return null

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 text-[10px] text-muted-foreground",
        className
      )}
      title={`${count} reminder${count > 1 ? "s" : ""} set`}
    >
      <Bell className="h-3 w-3" />
      {count > 1 && <span>{count}</span>}
    </div>
  )
}
