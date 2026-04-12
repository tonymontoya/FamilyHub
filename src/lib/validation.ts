/**
 * Validation Schemas
 * 
 * Zod schemas for API input validation
 * Aligned with database constraints (@db.VarChar limits)
 */

import { z } from "zod"

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
