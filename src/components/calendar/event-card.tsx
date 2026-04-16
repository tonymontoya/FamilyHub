"use client"

import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import type { EventOccurrence } from "@/hooks/calendar"

interface EventCardProps {
  occurrence: EventOccurrence
  onClick?: () => void
  compact?: boolean
}

const typeColors: Record<string, string> = {
  EVENT: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
  APPOINTMENT: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800",
  ACTIVITY: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800",
  BIRTHDAY: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-800",
  HOLIDAY: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800",
  REMINDER: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800",
}

const typeDotColors: Record<string, string> = {
  EVENT: "bg-blue-500",
  APPOINTMENT: "bg-purple-500",
  ACTIVITY: "bg-green-500",
  BIRTHDAY: "bg-pink-500",
  HOLIDAY: "bg-red-500",
  REMINDER: "bg-yellow-500",
}

export function EventCard({ occurrence, onClick, compact = false }: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: occurrence.id,
    data: occurrence,
    disabled: occurrence.isCancelled,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const colorClass = occurrence.color 
    ? "" // Use inline style for custom colors
    : typeColors[occurrence.type] || typeColors.EVENT

  const dotColor = typeDotColors[occurrence.type] || typeDotColors.EVENT

  if (occurrence.isCancelled) {
    return (
      <div
        className={cn(
          "rounded border px-2 py-1 text-xs line-through opacity-50",
          "bg-gray-100 text-gray-500 border-gray-200",
          "dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
          compact ? "truncate" : ""
        )}
        title={`${occurrence.title} (Cancelled)`}
      >
        {compact ? (
          <span className="flex items-center gap-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
            {occurrence.title}
          </span>
        ) : (
          <>
            <div className="font-medium">{occurrence.title}</div>
            <div className="text-[10px]">Cancelled</div>
          </>
        )}
      </div>
    )
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null
    const date = new Date(timeStr)
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  }

  return (
    <button
      ref={setNodeRef}
      style={{
        ...style,
        ...(occurrence.color ? { 
          backgroundColor: `${occurrence.color}20`,
          borderColor: occurrence.color,
          color: occurrence.color 
        } : {}),
      }}
      className={cn(
        "w-full rounded border px-2 py-1 text-left text-xs transition-all",
        "hover:shadow-sm hover:brightness-95 dark:hover:brightness-110",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        colorClass,
        isDragging && "opacity-50 shadow-lg scale-105 z-50",
        occurrence.isException && "ring-1 ring-amber-400",
        compact ? "truncate" : ""
      )}
      onClick={onClick}
      {...listeners}
      {...attributes}
      title={occurrence.title}
    >
      {compact ? (
        <span className="flex items-center gap-1">
          <span 
            className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", !occurrence.color && dotColor)}
            style={occurrence.color ? { backgroundColor: occurrence.color } : undefined}
          />
          <span className="truncate">{occurrence.title}</span>
        </span>
      ) : (
        <>
          <div className="flex items-center gap-1">
            {occurrence.isException && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400">(Modified)</span>
            )}
          </div>
          <div className="font-medium truncate">{occurrence.title}</div>
          {occurrence.startTime && (
            <div className="text-[10px] opacity-80">
              {formatTime(occurrence.startTime)}
              {occurrence.endTime && ` - ${formatTime(occurrence.endTime)}`}
            </div>
          )}
        </>
      )}
    </button>
  )
}

export function EventCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded bg-muted animate-pulse",
        compact ? "h-5" : "h-12"
      )}
    />
  )
}
