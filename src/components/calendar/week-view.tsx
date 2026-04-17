"use client"

import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import type { EventOccurrence } from "@/hooks/calendar"
import { EventCard } from "./event-card"

interface WeekViewProps {
  currentDate: Date
  occurrences: EventOccurrence[]
  isLoading?: boolean
  onEventClick?: (occurrence: EventOccurrence) => void
  onDateClick?: (date: Date) => void
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function WeekView({
  currentDate,
  occurrences,
  isLoading = false,
  onEventClick,
  onDateClick,
}: WeekViewProps) {
  // Get all days in the week
  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Group occurrences by date
  const occurrencesByDate = new Map<string, EventOccurrence[]>()
  for (const occ of occurrences) {
    const list = occurrencesByDate.get(occ.date) || []
    list.push(occ)
    occurrencesByDate.set(occ.date, list)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {days.map((day, i) => {
          const isTodayDate = isToday(day)
          const dayKey = format(day, "yyyy-MM-dd")
          const dayOccurrences = occurrencesByDate.get(dayKey) || []
          
          return (
            <div
              key={dayKey}
              className={cn(
                "py-2 px-1 text-center border-r last:border-r-0",
                isTodayDate && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {weekDays[i]}
              </div>
              <button
                onClick={() => onDateClick?.(day)}
                className={cn(
                  "text-lg font-semibold rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1",
                  "hover:bg-accent transition-colors",
                  isTodayDate && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {format(day, "d")}
              </button>
              {dayOccurrences.length > 0 && (
                <div className="mt-1">
                  <span className="text-xs text-muted-foreground">
                    {dayOccurrences.length} event{dayOccurrences.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Week grid */}
      <div className="flex-1 grid grid-cols-7 overflow-auto">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd")
          const dayOccurrences = occurrencesByDate.get(dayKey) || []
          const isTodayDate = isToday(day)

          return (
            <div
              key={dayKey}
              className={cn(
                "border-r last:border-r-0 p-2 min-h-[200px]",
                isTodayDate && "bg-primary/5"
              )}
            >
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-16 bg-muted animate-pulse rounded" />
                  <div className="h-16 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <div className="space-y-2">
                  {dayOccurrences.map((occurrence) => (
                    <EventCard
                      key={occurrence.id}
                      occurrence={occurrence}
                      onClick={() => onEventClick?.(occurrence)}
                    />
                  ))}
                  {dayOccurrences.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-muted-foreground">No events</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
