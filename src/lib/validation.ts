/**
 * Validation Schemas
 * 
 * Zod schemas for API input validation
 * Aligned with database constraints (@db.VarChar limits)
 */

import { z } from "zod"
import { rrulestr } from "rrule"

// Custom validation helpers
const nonEmptyString = (maxLength: number, fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: `${fieldName} cannot be empty or whitespace only`,
    })

const optionalNonEmptyString = (maxLength: number, fieldName: string) =>
  z
    .string()
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return undefined
      const trimmed = val.trim()
      return trimmed.length > 0 ? trimmed : undefined
    })

// UUID schema with better error message
export const uuidSchema = z
  .string({ message: "ID is required" })
  .uuid("Invalid ID format")

/**
 * Validate UUID format (accepts any valid UUID version 1-5).
 * Imperative helper for non-Zod code paths (e.g. route params).
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Common field schemas (aligned with @db.VarChar in schema)
export const titleSchema = nonEmptyString(100, "Title")

export const descriptionSchema = optionalNonEmptyString(500, "Description")

export const notesSchema = optionalNonEmptyString(200, "Notes")

// Quantity: coerce from string for JSON APIs, validate range
export const quantitySchema = z
  .union([z.number(), z.string()])
  .transform((val) => {
    if (typeof val === "string") {
      const parsed = parseInt(val, 10)
      if (isNaN(parsed)) throw new Error("Quantity must be a valid number")
      return parsed
    }
    return val
  })
  .pipe(
    z
      .number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(999, "Quantity must be 999 or less")
  )

// List type enum
export const listTypeSchema = z.enum([
  "SHOPPING",
  "PACKING",
  "WISHLIST",
  "CUSTOM",
])

// ========== LIST SCHEMAS ==========

export const createListSchema = z.object({
  title: titleSchema,
  type: listTypeSchema,
  description: descriptionSchema,
})

export const updateListSchema = z.object({
  title: titleSchema.optional(),
  type: listTypeSchema.optional(),
  description: descriptionSchema,
})

// ========== LIST ITEM SCHEMAS ==========

export const createItemSchema = z.object({
  name: nonEmptyString(100, "Item name"),
  quantity: quantitySchema.default(1),
  notes: notesSchema,
})

export const updateItemSchema = z.object({
  name: nonEmptyString(100, "Item name").optional(),
  quantity: quantitySchema.optional(),
  notes: notesSchema,
  completed: z.boolean().optional(),
})

// Toggle completion (separate schema for clarity)
export const toggleItemSchema = z.object({
  completed: z.boolean({ message: "Completed status is required" }),
})

// ========== REORDER SCHEMA ==========

export const reorderSchema = z.object({
  itemIds: z
    .array(uuidSchema)
    .min(1, "At least one item is required")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Duplicate item IDs are not allowed",
    }),
})

// ========== EXPORT TYPES ==========

export type CreateListInput = z.infer<typeof createListSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type ToggleItemInput = z.infer<typeof toggleItemSchema>
export type ReorderInput = z.infer<typeof reorderSchema>

// ========== CALENDAR SCHEMAS ==========

// Calendar enums
export const eventTypeSchema = z.enum([
  "EVENT",
  "APPOINTMENT",
  "ACTIVITY",
  "BIRTHDAY",
  "HOLIDAY",
  "REMINDER",
])

export const reminderTypeSchema = z.enum(["BROWSER", "EMAIL", "PUSH"])

// Hex color validation (#RGB or #RRGGBB)
const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{3}){1,2}$/, "Color must be a valid hex code (e.g., #3b82f6)")
  .optional()

// IANA timezone validation (basic pattern)
const timezoneSchema = z
  .string()
  .regex(/^[A-Za-z]+\/[A-Za-z_]+$/, "Invalid timezone format")
  .default("UTC")

// Date string validation (YYYY-MM-DD)
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")

// Time string validation (HH:MM)
const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format")
  .optional()

// RRULE validation using actual rrule parsing
const rruleSchema = z
  .string()
  .refine(
    (val) => {
      try {
        rrulestr(val)
        return true
      } catch {
        return false
      }
    },
    { message: "Invalid recurrence rule format" }
  )
  .optional()

// Reminder schema (nested in event creation)
const reminderSchema = z.object({
  minutesBefore: z
    .number()
    .int()
    .min(1, "Reminder must be at least 1 minute before")
    .max(10080, "Reminder cannot be more than 1 week before"), // 7 days
  type: reminderTypeSchema.default("BROWSER"),
})

// Base event fields (without refinements)
const eventBaseSchema = z.object({
  title: nonEmptyString(200, "Title"),
  description: optionalNonEmptyString(2000, "Description"),
  startDate: dateStringSchema,
  startTime: timeStringSchema,
  endDate: dateStringSchema.optional(),
  endTime: timeStringSchema,
  timezone: timezoneSchema,
  isRecurring: z.boolean().default(false),
  recurrenceRule: rruleSchema,
  recurrenceEnd: z.string().datetime().optional(),
  assigneeIds: z.array(uuidSchema).default([]),
  isFamilyWide: z.boolean().default(true),
  type: eventTypeSchema.default("EVENT"),
  location: optionalNonEmptyString(500, "Location"),
  color: hexColorSchema,
})

// Create event schema with reminders and refinements
export const createEventSchema = eventBaseSchema
  .extend({
    reminders: z.array(reminderSchema).default([]),
  })
  .refine(
    (data) => {
      if (data.isRecurring && !data.recurrenceRule) return false
      return true
    },
    { message: "Recurring events must have a recurrence rule", path: ["recurrenceRule"] }
  )
  .refine(
    (data) => {
      if (data.endTime && !data.startTime) return false
      return true
    },
    { message: "Cannot specify end time without start time", path: ["endTime"] }
  )
  .refine(
    (data) => {
      if (!data.startTime && data.endTime) return false
      return true
    },
    { message: "All-day events cannot have an end time", path: ["endTime"] }
  )

// Update event schema (all fields optional, no refinements to avoid .partial() issue)
// Note: reminders are handled separately via dedicated API routes
export const updateEventSchema = eventBaseSchema.partial()

// Create exception schema (for modifying specific occurrences)
export const createExceptionSchema = z.object({
  originalDate: dateStringSchema,
  title: optionalNonEmptyString(200, "Title"),
  description: optionalNonEmptyString(2000, "Description"),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  location: optionalNonEmptyString(500, "Location"),
  isCancelled: z.boolean().default(false),
})

// Date range query schema
export const dateRangeSchema = z.object({
  start: dateStringSchema,
  end: dateStringSchema,
})

// ========== CALENDAR TYPES ==========

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type CreateExceptionInput = z.infer<typeof createExceptionSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>

// ========== VALIDATION HELPERS ==========

/**
 * Validate data against a schema and return result or throw formatted error
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _errorCode: string = "VALIDATION_ERROR"
): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new z.ZodError(result.error.issues)
  }

  return result.data
}

/**
 * Coerce empty strings to undefined for optional fields
 * Useful for form data processing
 */
export function normalizeFormData(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.trim() === "") {
      normalized[key] = undefined
    } else {
      normalized[key] = value
    }
  }

  return normalized
}
