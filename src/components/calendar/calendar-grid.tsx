"use client"

import { useState, useCallback } from "react"
import { DndContext, type DragEndEvent, DragOverlay as DragOverlayComponent, useSensor, useSensors, PointerSensor, TouchSensor } from "@dnd-kit/core"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import type { EventOccurrence } from "@/hooks/calendar"
import { CalendarHeader, type CalendarView } from "./calendar-header"
import { MonthView } from "./month-view"
import { EventCard } from "./event-card"

interface CalendarGridProps {
  occurrences: EventOccurrence[]
  isLoading?: boolean
  onEventClick?: (occurrence: EventOccurrence) => void
  onEventMove?: (occurrence: EventOccurrence, newDate: Date) => void
  onDateClick?: (date: Date) => void
  view?: CalendarView
  currentDate?: Date
  onViewChange?: (view: CalendarView) => void
  onDateChange?: (date: Date) => void
}

export function CalendarGrid({
  occurrences,
  isLoading = false,
  onEventClick,
  onEventMove,
  onDateClick,
  view: controlledView,
  currentDate: controlledDate,
  onViewChange,
  onDateChange,
}: CalendarGridProps) {
  // Use controlled or uncontrolled mode
  const [internalDate, setInternalDate] = useState(new Date())
  const [internalView, setInternalView] = useState<CalendarView>("month")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedOccurrence, setDraggedOccurrence] = useState<EventOccurrence | null>(null)

  const currentDate = controlledDate ?? internalDate
  const view = controlledView ?? internalView

  const setCurrentDate = useCallback((date: Date) => {
    if (onDateChange) {
      onDateChange(date)
    } else {
      setInternalDate(date)
    }
  }, [onDateChange])

  const setView = useCallback((newView: CalendarView) => {
    if (onViewChange) {
      onViewChange(newView)
    } else {
      setInternalView(newView)
    }
  }, [onViewChange])

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay for touch
        tolerance: 5,
      },
    })
  )

  const handleDragStart = useCallback((event: DragEndEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    const occurrence = occurrences.find(o => o.id === active.id)
    if (occurrence) {
      setDraggedOccurrence(occurrence)
    }
  }, [occurrences])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDraggedOccurrence(null)

    if (!over) return

    const occurrence = occurrences.find(o => o.id === active.id)
    if (!occurrence) return

    // The over.id is the date string (yyyy-MM-dd) from the day cell
    const newDateStr = over.id as string
    const newDate = parseISO(newDateStr)

    // Only trigger if date actually changed
    if (occurrence.date !== newDateStr) {
      onEventMove?.(occurrence, newDate)
    }
  }, [occurrences, onEventMove])

  const handleToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [setCurrentDate])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col gap-4">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onDateChange={setCurrentDate}
          onViewChange={setView}
          onToday={handleToday}
        />

        <div className={cn(
          "flex-1 overflow-hidden rounded-lg border",
          "bg-card"
        )}>
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              occurrences={occurrences}
              isLoading={isLoading}
              onEventClick={onEventClick}
              onDateClick={onDateClick}
            />
          )}

          {view === "week" && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Week view coming soon</p>
            </div>
          )}

          {view === "day" && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Day view coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay - shows what's being dragged */}
      <DragOverlayComponent>
        {draggedOccurrence ? (
          <div className="opacity-80 shadow-lg">
            <EventCard occurrence={draggedOccurrence} />
          </div>
        ) : null}
      </DragOverlayComponent>
    </DndContext>
  )
}

export type { CalendarView }
