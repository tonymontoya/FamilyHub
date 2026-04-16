"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { format, isSameMonth, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns"
import type { EventOccurrence } from "@/hooks/calendar"
import { EventCard, EventCardSkeleton } from "./event-card"

interface MonthViewProps {
  currentDate: Date
  occurrences: EventOccurrence[]
  isLoading?: boolean
  onEventClick?: (occurrence: EventOccurrence) => void
  onDateClick?: (date: Date) => void
  selectedDate?: Date
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function MonthView({
  currentDate,
  occurrences,
  isLoading = false,
  onEventClick,
  onDateClick,
  selectedDate,
}: MonthViewProps) {
  // Get all days to display (including days from prev/next months)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

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
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7 auto-rows-fr">
        {days.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd")
          const dayOccurrences = occurrencesByDate.get(dateKey) || []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDate = isToday(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <DayCell
              key={dateKey}
              date={day}
              occurrences={dayOccurrences}
              isCurrentMonth={isCurrentMonth}
              isToday={isTodayDate}
              isSelected={isSelected}
              isLoading={isLoading}
              onEventClick={onEventClick}
              onDateClick={onDateClick}
              isFirstRow={index < 7}
            />
          )
        })}
      </div>
    </div>
  )
}

interface DayCellProps {
  date: Date
  occurrences: EventOccurrence[]
  isCurrentMonth: boolean
  isToday: boolean
  isSelected?: boolean
  isLoading: boolean
  onEventClick?: (occurrence: EventOccurrence) => void
  onDateClick?: (date: Date) => void
  isFirstRow: boolean
}

function DayCell({
  date,
  occurrences,
  isCurrentMonth,
  isToday,
  isSelected,
  isLoading,
  onEventClick,
  onDateClick,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, "yyyy-MM-dd"),
    data: { date },
  })

  const dateKey = format(date, "yyyy-MM-dd")

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] border-b border-r p-1 transition-colors",
        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
        isToday && "bg-primary/5",
        isSelected && "ring-2 ring-primary ring-inset",
        isOver && "bg-primary/10 border-primary",
        "flex flex-col gap-1"
      )}
    >
      {/* Date header */}
      <button
        onClick={() => onDateClick?.(date)}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-sm",
          "hover:bg-accent transition-colors",
          isToday && "bg-primary text-primary-foreground font-semibold hover:bg-primary/90",
          !isCurrentMonth && "text-muted-foreground"
        )}
      >
        {format(date, "d")}
      </button>

      {/* Events */}
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {isLoading ? (
          <>
            <EventCardSkeleton compact />
            <EventCardSkeleton compact />
          </>
        ) : (
          occurrences.map((occurrence) => (
            <EventCard
              key={occurrence.id}
              occurrence={occurrence}
              onClick={() => onEventClick?.(occurrence)}
              compact
            />
          ))
        )}
      </div>

      {/* "More" indicator if many events */}
      {!isLoading && occurrences.length > 3 && (
        <div className="text-[10px] text-muted-foreground px-1">
          +{occurrences.length - 3} more
        </div>
      )}
    </div>
  )
}
