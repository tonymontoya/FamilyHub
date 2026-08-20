"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Constants
const MAX_POINTS = 100
const MIN_POINTS = 0
const MAX_TITLE_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 500

// Form validation schema
const createChoreSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(MAX_TITLE_LENGTH, `Title must be less than ${MAX_TITLE_LENGTH} characters`),
  description: z
    .string()
    .max(MAX_DESCRIPTION_LENGTH, `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`)
    .optional(),
  points: z
    .number()
    .int()
    .min(MIN_POINTS, `Points must be ${MIN_POINTS} or more`)
    .max(MAX_POINTS, `Points must be ${MAX_POINTS} or less`),
  recurrenceType: z.enum(["daily", "weekdays", "weekly"]),
  weeklyDays: z.array(z.string()).optional(),
  assigneeId: z.string().optional(),
})

type CreateChoreFormData = z.infer<typeof createChoreSchema>

interface FamilyMember {
  id: string
  displayName: string
  role: string
}

// Generate RRULE from form selections
function generateRRule(type: string, weeklyDays?: string[]): string {
  switch (type) {
    case "daily":
      return "FREQ=DAILY"
    case "weekdays":
      return "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"
    case "weekly":
      if (weeklyDays && weeklyDays.length > 0) {
        return `FREQ=WEEKLY;BYDAY=${weeklyDays.join(",")}`
      }
      return "FREQ=WEEKLY"
    default:
      return "FREQ=DAILY"
  }
}

// Get human-readable text for recurrence
function getRecurrenceText(type: string, weeklyDays?: string[]): string {
  switch (type) {
    case "daily":
      return "Every day"
    case "weekdays":
      return "Every weekday (Mon-Fri)"
    case "weekly":
      if (weeklyDays && weeklyDays.length > 0) {
        const dayNames: Record<string, string> = {
          MO: "Monday",
          TU: "Tuesday",
          WE: "Wednesday",
          TH: "Thursday",
          FR: "Friday",
          SA: "Saturday",
          SU: "Sunday",
        }
        return `Weekly on ${weeklyDays.map((d) => dayNames[d]).join(", ")}`
      }
      return "Weekly"
    default:
      return "Daily"
  }
}

const DAYS_OF_WEEK = [
  { value: "MO", label: "Mon" },
  { value: "TU", label: "Tue" },
  { value: "WE", label: "Wed" },
  { value: "TH", label: "Thu" },
  { value: "FR", label: "Fri" },
  { value: "SA", label: "Sat" },
  { value: "SU", label: "Sun" },
]

export default function CreateChorePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateChoreFormData>({
    resolver: zodResolver(createChoreSchema),
    defaultValues: {
      title: "",
      description: "",
      points: 10,
      recurrenceType: "daily",
      weeklyDays: [],
    },
  })

  const recurrenceType = watch("recurrenceType")

  // Sync selectedDays with form state
  useEffect(() => {
    setValue("weeklyDays", selectedDays)
  }, [selectedDays, setValue])

  // Fetch family members for assignee dropdown
  useEffect(() => {
    async function fetchFamilyMembers() {
      try {
      const response = await fetch("/api/children")
      if (response.ok) {
        const body = await response.json()
        // Combine parent and children
        const members = [
          ...(body.data.parent ? [body.data.parent] : []),
          ...body.data.children,
        ]
        setFamilyMembers(members)
        } else {
          toast.error("Failed to load family members")
        }
      } catch {
        toast.error("Failed to load family members")
      } finally {
        setIsLoadingMembers(false)
      }
    }

    fetchFamilyMembers()
  }, [])

  const onSubmit = async (data: CreateChoreFormData) => {
    setIsLoading(true)

    try {
      // Validate weekly days if weekly recurrence selected
      if (data.recurrenceType === "weekly" && selectedDays.length === 0) {
        toast.error("Please select at least one day for weekly recurrence")
        setIsLoading(false)
        return
      }

      // Generate RRULE
      const recurrenceRule = generateRRule(
        data.recurrenceType,
        data.recurrenceType === "weekly" ? selectedDays : undefined
      )

      const response = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          points: data.points,
          recurrenceRule,
          assigneeId: data.assigneeId && data.assigneeId !== "none" ? data.assigneeId : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error?.message || "Failed to create chore")
        return
      }

      toast.success("Chore created successfully!")
      router.push("/chores")
      router.refresh()
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push("/chores")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chores
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Chore</CardTitle>
            <CardDescription>
              Set up a recurring chore for your family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Clean bedroom"
                  disabled={isLoading}
                  {...register("title")}
                  aria-invalid={errors.title ? "true" : "false"}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Make bed, pick up toys, vacuum floor"
                  disabled={isLoading}
                  {...register("description")}
                  aria-invalid={errors.description ? "true" : "false"}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Points Field */}
              <div className="space-y-2">
                <Label htmlFor="points">
                  Points <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="points"
                  type="number"
                  min={MIN_POINTS}
                  max={MAX_POINTS}
                  disabled={isLoading}
                  {...register("points", { valueAsNumber: true })}
                  aria-invalid={errors.points ? "true" : "false"}
                />
                {errors.points ? (
                  <p className="text-sm text-destructive">
                    {errors.points.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Points awarded when chore is completed ({MIN_POINTS}-{MAX_POINTS})
                  </p>
                )}
              </div>

              {/* Recurrence Type */}
              <div className="space-y-2">
                <Label>
                  Recurrence <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="recurrenceType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Every day</SelectItem>
                        <SelectItem value="weekdays">
                          Weekdays only (Mon-Fri)
                        </SelectItem>
                        <SelectItem value="weekly">
                          Weekly on specific days
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.recurrenceType && (
                  <p className="text-sm text-destructive">
                    {errors.recurrenceType.message}
                  </p>
                )}
              </div>

              {/* Weekly Days Selection */}
              {recurrenceType === "weekly" && (
                <div className="space-y-2">
                  <Label>
                    Repeat on <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={
                          selectedDays.includes(day.value) ? "default" : "outline"
                        }
                        size="sm"
                        disabled={isLoading}
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                  {selectedDays.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {getRecurrenceText("weekly", selectedDays)}
                    </p>
                  )}
                </div>
              )}

              {/* Assignee Selection */}
              <div className="space-y-2">
                <Label htmlFor="assigneeId">Assign To</Label>
                <Controller
                  name="assigneeId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingMembers || isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingMembers ? "Loading..." : "Select someone"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Anyone (no specific assignee)
                        </SelectItem>
                        {familyMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.displayName}{" "}
                            {member.role === "PARENT" && "(You)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Chore"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
