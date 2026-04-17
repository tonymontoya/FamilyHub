"use client"

import { format, isToday, startOfDay, addHours, isSameDay, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import type { EventOccurrence } from "@/hooks/calendar"
import { EventCard } from "./event-card"

interface DayViewProps {
  currentDate: Date
  occurrences: EventOccurrence[]
  isLoading?: boolean
  onEventClick?: (occurrence: EventOccurrence) => void
  onDateClick?: (date: Date) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function DayView({
  currentDate,
  occurrences,
  isLoading = false,
  onEventClick,
}: DayViewProps) {
  const isTodayDate = isToday(currentDate)
  const dateKey = format(currentDate, "yyyy-MM-dd")

  // Filter occurrences for this day
  const dayOccurrences = occurrences.filter((occ) => occ.date === dateKey)

  // Group all-day events separately
  const allDayEvents = dayOccurrences.filter((occ) => !occ.startTime)
  const timedEvents = dayOccurrences.filter((occ) => occ.startTime)

  // Sort timed events by start time
  timedEvents.sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0
    return a.startTime.localeCompare(b.startTime)
  })

  const getEventHour = (startTime: string | null): number => {
    if (!startTime) return 0
    try {
      const date = parseISO(startTime)
      return date.getHours()
    } catch {
      return 0
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className={cn(
        "py-4 px-4 border-b text-center",
        isTodayDate && "bg-primary/5"
      )}>
        <div className="text-sm text-muted-foreground">
          {format(currentDate, "EEEE")}
        </div>
        <div className={cn(
          "text-3xl font-bold mt-1",
          isTodayDate && "text-primary"
        )}>
          {format(currentDate, "d")}
        </div>
        <div className="text-sm text-muted-foreground">
          {format(currentDate, "MMMM yyyy")}
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b p-2 space-y-2 bg-muted/30">
          <div className="text-xs font-medium text-muted-foreground uppercase">
            All Day
          </div>
          {allDayEvents.map((occurrence) => (
            <EventCard
              key={occurrence.id}
              occurrence={occurrence}
              onClick={() => onEventClick?.(occurrence)}
            />
          ))}
        </div>
      )}

      {/* Hourly grid */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {HOURS.slice(8, 18).map((hour) => (
              <div key={hour} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="relative">
            {HOURS.map((hour) => {
              const hourEvents = timedEvents.filter(
                (e) => getEventHour(e.startTime) === hour
              )

              return (
                <div
                  key={hour}
                  className="flex border-b min-h-[60px] hover:bg-muted/30 transition-colors"
                >
                  {/* Time label */}
                  <div className="w-16 py-2 px-2 text-right text-sm text-muted-foreground border-r flex-shrink-0">
                    {format(addHours(startOfDay(currentDate), hour), "h a")}
                  </div>

                  {/* Events */}
                  <div className="flex-1 p-2 space-y-1">
                    {hourEvents.map((occurrence) => (
                      <EventCard
                        key={occurrence.id}
                        occurrence={occurrence}
                        onClick={() => onEventClick?.(occurrence)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
