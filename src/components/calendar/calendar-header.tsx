"use client"

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type CalendarView = "month" | "week" | "day"

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  onDateChange: (date: Date) => void
  onViewChange: (view: CalendarView) => void
  onToday: () => void
}

export function CalendarHeader({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onToday,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    if (view === "month") {
      onDateChange(subMonths(currentDate, 1))
    } else if (view === "week") {
      onDateChange(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    } else {
      onDateChange(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))
    }
  }

  const handleNext = () => {
    if (view === "month") {
      onDateChange(addMonths(currentDate, 1))
    } else if (view === "week") {
      onDateChange(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    } else {
      onDateChange(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))
    }
  }

  const getTitle = (short = false) => {
    if (view === "month") {
      return short 
        ? format(currentDate, "MMM yyyy") 
        : format(currentDate, "MMMM yyyy")
    } else if (view === "week") {
      return short
        ? `Week of ${format(currentDate, "MMM d")}`
        : `Week of ${format(currentDate, "MMM d, yyyy")}`
    } else {
      return short
        ? format(currentDate, "EEE, MMM d")
        : format(currentDate, "EEEE, MMMM d, yyyy")
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            aria-label="Previous"
            data-testid="calendar-previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            aria-label="Next"
            data-testid="calendar-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Popover>
          <PopoverTrigger
            className="inline-flex items-center justify-start gap-2 min-w-[100px] sm:min-w-[140px] rounded-md border border-input bg-background px-2 sm:px-3 py-2 text-sm font-normal shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">{getTitle(true)}</span>
              <span className="hidden sm:inline">{getTitle(false)}</span>
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" onClick={onToday} data-testid="calendar-today" className="px-2 sm:px-4">
          <span className="sm:hidden">T</span>
          <span className="hidden sm:inline">Today</span>
        </Button>
      </div>

      {/* Right: View switcher - only month view implemented for now */}
      <div className="flex items-center gap-1 rounded-lg border p-1">
        <Button
          variant="secondary"
          size="sm"
          className="capitalize font-medium"
        >
          Month
        </Button>
        {/* Week and Day views coming soon */}
      </div>
    </div>
  )
}
