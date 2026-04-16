"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { format, parseISO, isBefore, startOfDay } from "date-fns"
import { CalendarIcon, Clock, MapPin, Repeat, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CreateEventInput, UpdateEventInput, CalendarEvent } from "@/hooks/calendar"
import type { EventType } from "@prisma/client"
import { ReminderSection } from "./reminder-section"

// Constants
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_LOCATION_LENGTH = 500

const eventTypes = [
  { value: "EVENT" as EventType, label: "Event", color: "bg-blue-500" },
  { value: "APPOINTMENT" as EventType, label: "Appointment", color: "bg-purple-500" },
  { value: "ACTIVITY" as EventType, label: "Activity", color: "bg-green-500" },
  { value: "BIRTHDAY" as EventType, label: "Birthday", color: "bg-pink-500" },
  { value: "HOLIDAY" as EventType, label: "Holiday", color: "bg-red-500" },
  { value: "REMINDER" as EventType, label: "Reminder", color: "bg-yellow-500" },
]

const colorOptions = [
  { value: "", label: "Default" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#22c55e", label: "Green" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#06b6d4", label: "Cyan" },
]

// Types
interface EventFormData {
  title: string
  description?: string
  startDate: Date
  startTime?: string
  endDate?: Date
  endTime?: string
  isRecurring: boolean
  recurrenceRule?: string
  recurrenceEnd?: Date
  assigneeIds: string[]
  isFamilyWide: boolean
  type: EventType
  location?: string
  color?: string
}

interface EventFormProps {
  event?: CalendarEvent | null
  initialDate?: Date
  familyMembers: Array<{ id: string; displayName: string; avatarUrl?: string | null }>
  currentMemberId: string
  isParent: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateEventInput | UpdateEventInput) => void
  onDelete?: () => void
  isSubmitting?: boolean
  onAddReminder?: (minutesBefore: number) => void
  onDeleteReminder?: (reminderId: string) => void
  isReminderLoading?: boolean
}

// Validation function
function validateFormData(data: EventFormData): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!data.title.trim()) {
    errors.title = "Title is required"
  } else if (data.title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title must be ${MAX_TITLE_LENGTH} characters or less`
  }

  if (!data.startDate) {
    errors.startDate = "Start date is required"
  }

  if (data.endDate && data.startDate) {
    const start = startOfDay(data.startDate)
    const end = startOfDay(data.endDate)
    if (isBefore(end, start)) {
      errors.endDate = "End date cannot be before start date"
    }
  }

  if (data.endTime && !data.startTime) {
    errors.startTime = "Start time is required when end time is set"
  }

  if (data.isRecurring && !data.recurrenceRule) {
    errors.recurrenceRule = "Recurrence pattern is required"
  }

  return errors
}

export function EventForm({
  event,
  initialDate,
  familyMembers,
  isParent,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  isSubmitting = false,
  onAddReminder,
  onDeleteReminder,
  isReminderLoading = false,
}: EventFormProps) {
  const isEditing = !!event

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors: formErrors },
  } = useForm<EventFormData>({
    defaultValues: {
      title: "",
      description: "",
      startDate: initialDate || new Date(),
      isRecurring: false,
      assigneeIds: [],
      isFamilyWide: false,
      type: "EVENT",
    },
  })

  const isRecurring = watch("isRecurring")
  const isFamilyWide = watch("isFamilyWide")
  const startDate = watch("startDate")
  const assigneeIds = watch("assigneeIds")

  // Populate form when editing
  useEffect(() => {
    if (!open) return

    if (event) {
      reset({
        title: event.title,
        description: event.description || undefined,
        startDate: parseISO(event.startDate),
        startTime: event.startTime ? format(parseISO(event.startTime), "HH:mm") : undefined,
        endDate: event.endDate ? parseISO(event.endDate) : undefined,
        endTime: event.endTime ? format(parseISO(event.endTime), "HH:mm") : undefined,
        isRecurring: event.isRecurring,
        recurrenceRule: event.recurrenceRule || undefined,
        recurrenceEnd: event.recurrenceEnd ? parseISO(event.recurrenceEnd) : undefined,
        assigneeIds: event.assigneeIds,
        isFamilyWide: event.isFamilyWide,
        type: event.type,
        location: event.location || undefined,
        color: event.color || undefined,
      })
    } else {
      reset({
        title: "",
        description: "",
        startDate: initialDate || new Date(),
        startTime: undefined,
        endDate: undefined,
        endTime: undefined,
        isRecurring: false,
        recurrenceRule: undefined,
        recurrenceEnd: undefined,
        assigneeIds: [],
        isFamilyWide: false,
        type: "EVENT",
        location: undefined,
        color: undefined,
      })
    }
  }, [event, initialDate, reset, open])

  const onFormSubmit = (data: EventFormData) => {
    // Validate
    const validationErrors = validateFormData(data)
    if (Object.keys(validationErrors).length > 0) {
      // Display first error
      const firstError = Object.values(validationErrors)[0]
      return
    }

    const formattedData = {
      title: data.title,
      description: data.description,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      startTime: data.startTime || undefined,
      endDate: data.endDate ? format(data.endDate, "yyyy-MM-dd") : undefined,
      endTime: data.endTime || undefined,
      isRecurring: data.isRecurring,
      recurrenceRule: data.isRecurring ? data.recurrenceRule : undefined,
      recurrenceEnd: data.recurrenceEnd?.toISOString(),
      assigneeIds: data.assigneeIds,
      isFamilyWide: data.isFamilyWide,
      type: data.type,
      location: data.location,
      color: data.color,
    }
    onSubmit(formattedData)
  }

  // Helper to show field error
  const showError = (fieldName: string) => {
    const data = watch()
    const errors = validateFormData(data)
    return errors[fieldName]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isEditing ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <form id="event-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 px-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Event title"
                {...register("title")}
                className={cn(showError("title") && "border-destructive")}
              />
              {showError("title") && (
                <p className="text-sm text-destructive">{showError("title")}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Event Type</Label>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue("type", type.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                      watch("type") === type.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", type.color)} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "inline-flex w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      showError("startDate") && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setValue("startDate", date)}
                    />
                  </PopoverContent>
                </Popover>
                {showError("startDate") && (
                  <p className="text-sm text-destructive">{showError("startDate")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    {...register("startTime")}
                    className={cn("flex-1", showError("startTime") && "border-destructive")}
                  />
                </div>
                {showError("startTime") && (
                  <p className="text-sm text-destructive">{showError("startTime")}</p>
                )}
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "inline-flex w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      showError("endDate") && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {watch("endDate") ? format(watch("endDate")!, "PPP") : "Same day"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watch("endDate")}
                      onSelect={(date) => setValue("endDate", date)}
                    />
                  </PopoverContent>
                </Popover>
                {showError("endDate") && (
                  <p className="text-sm text-destructive">{showError("endDate")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    {...register("endTime")}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Recurrence */}
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="recurring" className="cursor-pointer">Recurring Event</Label>
                </div>
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setValue("isRecurring", checked)}
                />
              </div>

              {isRecurring && (
                <div className="space-y-3 border-t pt-3">
                  <div className="space-y-2">
                    <Label>Repeat Pattern</Label>
                    <Select
                      value={watch("recurrenceRule") || "FREQ=DAILY"}
                      onValueChange={(value) => setValue("recurrenceRule", value)}
                    >
                      <SelectTrigger className={cn(showError("recurrenceRule") && "border-destructive")}>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREQ=DAILY">Daily</SelectItem>
                        <SelectItem value="FREQ=WEEKLY">Weekly</SelectItem>
                        <SelectItem value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">Weekdays</SelectItem>
                        <SelectItem value="FREQ=WEEKLY;BYDAY=SA,SU">Weekends</SelectItem>
                        <SelectItem value="FREQ=MONTHLY">Monthly</SelectItem>
                        <SelectItem value="FREQ=YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {showError("recurrenceRule") && (
                      <p className="text-sm text-destructive">{showError("recurrenceRule")}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>End Recurrence</Label>
                    <Popover>
                      <PopoverTrigger
                        className="inline-flex w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        {watch("recurrenceEnd") 
                          ? format(watch("recurrenceEnd")!, "PPP")
                          : "Never"
                        }
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={watch("recurrenceEnd")}
                          onSelect={(date) => setValue("recurrenceEnd", date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            {/* Assignment */}
            {isParent && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label className="cursor-pointer">Family-wide</Label>
                  </div>
                  <Switch
                    checked={isFamilyWide}
                    onCheckedChange={(checked) => {
                      setValue("isFamilyWide", checked)
                      if (checked) setValue("assigneeIds", [])
                    }}
                  />
                </div>

                {!isFamilyWide && (
                  <div className="border-t pt-3">
                    <Label className="mb-2 block">Assign to</Label>
                    <div className="flex flex-wrap gap-2">
                      {familyMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            const current = assigneeIds
                            const updated = current.includes(member.id)
                              ? current.filter((id) => id !== member.id)
                              : [...current, member.id]
                            setValue("assigneeIds", updated)
                          }}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                            assigneeIds.includes(member.id)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          <User className="h-3 w-3" />
                          {member.displayName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reminders - only show when editing */}
            {event && onAddReminder && onDeleteReminder && (
              <ReminderSection
                reminders={event.reminders || []}
                onAdd={onAddReminder}
                onDelete={onDeleteReminder}
                isLoading={isReminderLoading}
              />
            )}

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="Add location"
                {...register("location")}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue("color", color.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                      watch("color") === color.value
                        ? "ring-2 ring-primary ring-offset-1"
                        : ""
                    )}
                    style={color.value ? { backgroundColor: `${color.value}20` } : undefined}
                  >
                    {color.value ? (
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                    ) : (
                      <span className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                    )}
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add details..."
                rows={3}
                {...register("description")}
              />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t gap-2">
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="event-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
