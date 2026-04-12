/**
 * List Item Detail API
 * 
 * GET    /api/lists/[id]/items/[itemId] - Get a single item
 * PATCH  /api/lists/[id]/items/[itemId] - Update item
 * DELETE /api/lists/[id]/items/[itemId] - Soft delete item
 */

import { prisma } from "@/lib/prisma"
import {
  requireAuth,
  getItemWithAccess,
} from "@/lib/auth-utils"
import {
  updateItemSchema,
  validateOrThrow,
} from "@/lib/validation"
import {
  withErrorHandling,
  successResponse,
  noContentResponse,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"

/**
 * GET /api/lists/[id]/items/[itemId]
 */
export const GET = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id, itemId } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("read", member.id)

  // Get item with access verification
  const item = await getItemWithAccess(itemId, id, member)

  const response = {
    id: item.id,
    listId: item.listId,
    name: item.name,
    quantity: item.quantity,
    notes: item.notes,
    completed: item.completed,
    completedBy: item.completer
      ? {
          id: item.completer.id,
          displayName: item.completer.displayName,
        }
      : null,
    completedAt: item.completedAt?.toISOString() || null,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
  }

  return successResponse(response, 200, rateLimitHeaders)
})

/**
 * PATCH /api/lists/[id]/items/[itemId]
 * 
 * Body: { name?: string, quantity?: number, notes?: string, completed?: boolean }
 * 
 * Note: Setting completed=true will record the current user as completer
 *       Setting completed=false will clear the completer
 */
export const PATCH = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id, itemId } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("itemUpdate", member.id)

  // Get item with access verification
  const item = await getItemWithAccess(itemId, id, member)

  // Parse and validate body
  const body = await request.json()
  const data = validateOrThrow(updateItemSchema, body)

  // Build update data
  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.quantity !== undefined) updateData.quantity = data.quantity
  if (data.notes !== undefined) updateData.notes = data.notes

  // Handle completion status changes
  if (data.completed !== undefined) {
    if (data.completed && !item.completed) {
      // Marking as complete
      updateData.completed = true
      updateData.completedBy = member.id
      updateData.completedAt = new Date()
    } else if (!data.completed && item.completed) {
      // Unmarking as complete
      updateData.completed = false
      updateData.completedBy = null
      updateData.completedAt = null
    }
  }

  // Update item
  const updated = await prisma.listItem.update({
    where: { id: item.id },
    data: updateData,
    include: {
      completer: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  })

  const response = {
    id: updated.id,
    listId: updated.listId,
    name: updated.name,
    quantity: updated.quantity,
    notes: updated.notes,
    completed: updated.completed,
    completedBy: updated.completer
      ? {
          id: updated.completer.id,
          displayName: updated.completer.displayName,
        }
      : null,
    completedAt: updated.completedAt?.toISOString() || null,
    sortOrder: updated.sortOrder,
    createdAt: updated.createdAt.toISOString(),
  }

  return successResponse(response, 200, rateLimitHeaders)
})

/**
 * DELETE /api/lists/[id]/items/[itemId]
 * 
 * Soft deletes the item
 */
export const DELETE = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id, itemId } = await context.params

  // Rate limit check
  applyRateLimit("itemDelete", member.id)

  // Get item with access verification
  const item = await getItemWithAccess(itemId, id, member)

  // Soft delete
  await prisma.listItem.update({
    where: { id: item.id },
    data: { deletedAt: new Date() },
  })

  return noContentResponse()
})
