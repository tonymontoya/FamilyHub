"use client"

import { useState, useCallback, useMemo } from "react"
import { Plus } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import {
  CalendarGrid,
  EventForm,
  ExceptionDialog,
} from "@/components/calendar"
import {
  useOccurrences,
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useCreateException,
  useDeleteException,
  useCreateReminder,
  useDeleteReminder,
  type EventOccurrence,
  type CreateEventInput,
  type UpdateEventInput,
  type CreateExceptionInput,
  type CalendarEvent,
} from "@/hooks/calendar"
import { useFamily } from "@/hooks/use-family"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedOccurrence, setSelectedOccurrence] = useState<EventOccurrence | null>(null)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [isExceptionDialogOpen, setIsExceptionDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedDateForNew, setSelectedDateForNew] = useState<Date | undefined>()
  const [isDragging, setIsDragging] = useState(false)

  // Get date range for queries
  const dateRange = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return {
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
    }
  }, [currentDate])

  // Fetch data
  const { data: occurrencesData, isLoading: isLoadingOccurrences } = useOccurrences({
    start: dateRange.start,
    end: dateRange.end,
  })

  const { data: eventsData } = useEvents({
    start: dateRange.start,
    end: dateRange.end,
    limit: 500,
  })

  const { data: familyData } = useFamily()

  // Mutations
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()
  const createException = useCreateException()
  const deleteException = useDeleteException()
  const createReminder = useCreateReminder()
  const deleteReminder = useDeleteReminder()

  const occurrences = occurrencesData || []
  const familyMembers = familyData?.family?.members || []
  const isParent = familyData?.currentMember?.role === "PARENT"
  const currentMemberId = familyData?.currentMember?.id || ""

  // Handlers
  const handleEventClick = useCallback((occurrence: EventOccurrence) => {
    setSelectedOccurrence(occurrence)
    
    // Find the full event data
    const event = eventsData?.events.find((e) => e.id === occurrence.eventId)
    if (event) {
      setEditingEvent(event)
      
      if (occurrence.isException || event.isRecurring) {
        // For recurring events, show exception dialog first
        setIsExceptionDialogOpen(true)
      } else {
        // For non-recurring, go straight to edit form
        setIsEventFormOpen(true)
      }
    }
  }, [eventsData])

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDateForNew(date)
    setEditingEvent(null)
    setIsEventFormOpen(true)
  }, [])

  const handleNewEvent = useCallback(() => {
    setSelectedDateForNew(new Date())
    setEditingEvent(null)
    setIsEventFormOpen(true)
  }, [])

  const handleEventMove = useCallback((occurrence: EventOccurrence, newDate: Date) => {
    if (!isParent) {
      toast.error("Only parents can move events")
      return
    }

    const event = eventsData?.events.find((e) => e.id === occurrence.eventId)
    if (!event) {
      toast.error("Event not found")
      return
    }

    // If date hasn't changed, do nothing
    if (occurrence.date === format(newDate, "yyyy-MM-dd")) {
      return
    }

    setIsDragging(true)

    // If it's a recurring event, create an exception
    if (event.isRecurring) {
      createException.mutate({
        eventId: occurrence.eventId,
        input: {
          originalDate: occurrence.date,
        },
      }, {
        onSuccess: () => {
          setIsDragging(false)
          toast.success("Event moved")
        },
        onError: (error) => {
          setIsDragging(false)
          toast.error("Failed to move event", {
            description: error instanceof Error ? error.message : "Please try again",
          })
        },
      })
    } else {
      // For non-recurring, update the event date
      updateEvent.mutate({
        id: occurrence.eventId,
        input: {
          startDate: format(newDate, "yyyy-MM-dd"),
        },
      }, {
        onSuccess: () => {
          setIsDragging(false)
          toast.success("Event moved")
        },
        onError: (error) => {
          setIsDragging(false)
          toast.error("Failed to move event", {
            description: error instanceof Error ? error.message : "Please try again",
          })
        },
      })
    }
  }, [isParent, eventsData, createException, updateEvent])

  const handleEventSubmit = useCallback((data: CreateEventInput | UpdateEventInput) => {
    if (editingEvent) {
      updateEvent.mutate(
        { id: editingEvent.id, input: data as UpdateEventInput },
        {
          onSuccess: () => {
            setIsEventFormOpen(false)
            setEditingEvent(null)
            toast.success("Event updated")
          },
          onError: (error) => {
            toast.error("Failed to update event", {
              description: error instanceof Error ? error.message : "Please try again",
            })
          },
        }
      )
    } else {
      createEvent.mutate(data as CreateEventInput, {
        onSuccess: () => {
          setIsEventFormOpen(false)
          setSelectedDateForNew(undefined)
          toast.success("Event created")
        },
        onError: (error) => {
          toast.error("Failed to create event", {
            description: error instanceof Error ? error.message : "Please try again",
          })
        },
      })
    }
  }, [editingEvent, createEvent, updateEvent])

  const handleEventDelete = useCallback(() => {
    if (!editingEvent) return
    
    deleteEvent.mutate(editingEvent.id, {
      onSuccess: () => {
        setIsEventFormOpen(false)
        setEditingEvent(null)
        toast.success("Event deleted")
      },
      onError: (error) => {
        toast.error("Failed to delete event", {
          description: error instanceof Error ? error.message : "Please try again",
        })
      },
    })
  }, [editingEvent, deleteEvent])

  const handleExceptionModifyThis = useCallback((input: CreateExceptionInput) => {
    if (!selectedOccurrence) return

    createException.mutate({
      eventId: selectedOccurrence.eventId,
      input,
    }, {
      onSuccess: () => {
        setIsExceptionDialogOpen(false)
        setSelectedOccurrence(null)
        toast.success("Occurrence modified")
      },
      onError: (error) => {
        toast.error("Failed to modify occurrence", {
          description: error instanceof Error ? error.message : "Please try again",
        })
      },
    })
  }, [selectedOccurrence, createException])

  const handleExceptionModifyFuture = useCallback((input: CreateExceptionInput) => {
    // For "this and future", we'd need to split the event
    toast.info("Modify future occurrences - feature coming soon")
    setIsExceptionDialogOpen(false)
  }, [])

  const handleExceptionModifyAll = useCallback((input: CreateExceptionInput) => {
    if (!selectedOccurrence || !editingEvent) return

    // Update the base event
    updateEvent.mutate({
      id: selectedOccurrence.eventId,
      input: {
        title: input.title,
        location: input.location,
      },
    }, {
      onSuccess: () => {
        setIsExceptionDialogOpen(false)
        setSelectedOccurrence(null)
        toast.success("All occurrences updated")
      },
      onError: (error) => {
        toast.error("Failed to update event", {
          description: error instanceof Error ? error.message : "Please try again",
        })
      },
    })
  }, [selectedOccurrence, editingEvent, updateEvent])

  const handleExceptionCancel = useCallback(() => {
    if (!selectedOccurrence) return

    createException.mutate({
      eventId: selectedOccurrence.eventId,
      input: {
        originalDate: selectedOccurrence.date,
        isCancelled: true,
      },
    }, {
      onSuccess: () => {
        setIsExceptionDialogOpen(false)
        setSelectedOccurrence(null)
        toast.success("Occurrence cancelled")
      },
      onError: (error) => {
        toast.error("Failed to cancel occurrence", {
          description: error instanceof Error ? error.message : "Please try again",
        })
      },
    })
  }, [selectedOccurrence, createException])

  const handleExceptionRestore = useCallback(() => {
    if (!selectedOccurrence?.exceptionId) return

    deleteException.mutate({
      eventId: selectedOccurrence.eventId,
      exceptionId: selectedOccurrence.exceptionId,
      originalDate: selectedOccurrence.date,
    }, {
      onSuccess: () => {
        setIsExceptionDialogOpen(false)
        setSelectedOccurrence(null)
        toast.success("Occurrence restored")
      },
      onError: (error) => {
        toast.error("Failed to restore occurrence", {
          description: error instanceof Error ? error.message : "Please try again",
        })
      },
    })
  }, [selectedOccurrence, deleteException])

  const handleAddReminder = useCallback((minutesBefore: number) => {
    if (!editingEvent) return

    createReminder.mutate({
      eventId: editingEvent.id,
      input: {
        minutesBefore,
        type: "BROWSER",
      },
    })
  }, [editingEvent, createReminder])

  const handleDeleteReminder = useCallback((reminderId: string) => {
    if (!editingEvent) return

    deleteReminder.mutate({
      reminderId,
      eventId: editingEvent.id,
    })
  }, [editingEvent, deleteReminder])

  const isLoading = isLoadingOccurrences || isDragging || createReminder.isPending || deleteReminder.isPending

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-7xl h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              Manage family events and activities
            </p>
          </div>
          <Button onClick={handleNewEvent} data-testid="new-event-button">
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>

        {/* Calendar Grid */}
        <Card className="h-[calc(100%-4rem)] md:h-[calc(100%-5rem)]" data-testid="calendar-card">
          <CardContent className="p-0 h-full" data-testid="calendar-grid-content">
            {isLoading ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              </div>
            ) : (
              <CalendarGrid
                occurrences={occurrences}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onEventMove={handleEventMove}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Form Dialog */}
      <EventForm
        event={editingEvent}
        initialDate={selectedDateForNew}
        familyMembers={familyMembers}
        currentMemberId={currentMemberId}
        isParent={isParent}
        open={isEventFormOpen}
        onOpenChange={setIsEventFormOpen}
        onSubmit={handleEventSubmit}
        onDelete={editingEvent ? handleEventDelete : undefined}
        isSubmitting={createEvent.isPending || updateEvent.isPending}
        onAddReminder={editingEvent ? handleAddReminder : undefined}
        onDeleteReminder={editingEvent ? handleDeleteReminder : undefined}
        isReminderLoading={createReminder.isPending || deleteReminder.isPending}
      />

      {/* Exception Dialog */}
      <ExceptionDialog
        occurrence={selectedOccurrence}
        open={isExceptionDialogOpen}
        onOpenChange={setIsExceptionDialogOpen}
        onModifyThisOnly={handleExceptionModifyThis}
        onModifyFuture={handleExceptionModifyFuture}
        onModifyAll={handleExceptionModifyAll}
        onCancelOccurrence={handleExceptionCancel}
        onRestoreOccurrence={handleExceptionRestore}
        isSubmitting={createException.isPending || deleteException.isPending}
      />
    </main>
  )
}
