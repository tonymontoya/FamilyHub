"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon, Clock, XCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { EventOccurrence, CreateExceptionInput } from "@/hooks/calendar"

interface ExceptionDialogProps {
  occurrence: EventOccurrence | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onModifyThisOnly: (input: CreateExceptionInput) => void
  onModifyFuture: (input: CreateExceptionInput) => void
  onModifyAll: (input: CreateExceptionInput) => void
  onCancelOccurrence: () => void
  onRestoreOccurrence: () => void
  isSubmitting?: boolean
}

export function ExceptionDialog({
  occurrence,
  open,
  onOpenChange,
  onModifyThisOnly,
  onModifyFuture,
  onModifyAll,
  onCancelOccurrence,
  onRestoreOccurrence,
  isSubmitting = false,
}: ExceptionDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("this-only")
  const [title, setTitle] = useState(occurrence?.title || "")
  const [startTime, setStartTime] = useState(occurrence?.startTime ? format(parseISO(occurrence.startTime), "HH:mm") : "")
  const [endTime, setEndTime] = useState(occurrence?.endTime ? format(parseISO(occurrence.endTime), "HH:mm") : "")
  const [location, setLocation] = useState(occurrence?.location || "")
  const [isCancelled, setIsCancelled] = useState(false)

  if (!occurrence) return null

  const occurrenceDate = parseISO(occurrence.date)
  const isException = occurrence.isException
  const isAlreadyCancelled = occurrence.isCancelled

  const handleSubmit = () => {
    const input: CreateExceptionInput = {
      originalDate: occurrence.date,
      title: title !== occurrence.title ? title : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location || undefined,
      isCancelled,
    }

    if (activeTab === "this-only") {
      onModifyThisOnly(input)
    } else if (activeTab === "future") {
      onModifyFuture(input)
    } else if (activeTab === "all") {
      onModifyAll(input)
    }
  }

  const handleCancel = () => {
    onCancelOccurrence()
  }

  const handleRestore = () => {
    onRestoreOccurrence()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Occurrence</DialogTitle>
          <DialogDescription>
            {format(occurrenceDate, "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        {isAlreadyCancelled ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
              <XCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">This occurrence is cancelled</p>
                <p className="text-sm opacity-80">
                  You can restore it to its original state
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleRestore}
              disabled={isSubmitting}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore Occurrence
            </Button>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="this-only">This only</TabsTrigger>
                <TabsTrigger value="future">This & future</TabsTrigger>
                <TabsTrigger value="all">All events</TabsTrigger>
              </TabsList>

              <TabsContent value="this-only" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={occurrence.title}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Start Time
                      </Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        End Time
                      </Label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={occurrence.location || "Add location"}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <Label htmlFor="cancel-this" className="cursor-pointer">
                        Cancel this occurrence
                      </Label>
                    </div>
                    <Switch
                      id="cancel-this"
                      checked={isCancelled}
                      onCheckedChange={setIsCancelled}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="future" className="space-y-4 py-4">
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium mb-1">This will split the event</p>
                  <p className="text-muted-foreground">
                    The original event will end before this occurrence, and a new event 
                    will be created with your changes starting from this date.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={occurrence.title}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={occurrence.location || "Add location"}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="all" className="space-y-4 py-4">
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium mb-1">This will update the entire series</p>
                  <p className="text-muted-foreground">
                    All occurrences of this event will be updated with your changes.
                    Existing exceptions will be preserved.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={occurrence.title}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={occurrence.location || "Add location"}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              {!isException && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel This
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
