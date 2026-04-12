/**
 * Toggle Item Completion API
 * 
 * POST /api/lists/[id]/items/[itemId]/toggle
 * 
 * Body: { completed: boolean }
 * 
 * Convenience endpoint for toggling completion status.
 * Records who completed the item and when.
 */

import { prisma } from "@/lib/prisma"
import {
  requireAuth,
  getItemWithAccess,
} from "@/lib/auth-utils"
import {
  toggleItemSchema,
  validateOrThrow,
} from "@/lib/validation"
import {
  withErrorHandling,
  successResponse,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"

export const POST = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id, itemId } = await context.params

  // Rate limit check (use itemUpdate since this is an update operation)
  const rateLimitHeaders = applyRateLimit("itemUpdate", member.id)

  // Get item with access verification
  const item = await getItemWithAccess(itemId, id, member)

  // Parse and validate body
  const body = await request.json()
  const data = validateOrThrow(toggleItemSchema, body)

  // Build update data based on new completion status
  const updateData: {
    completed: boolean
    completedBy: string | null
    completedAt: Date | null
  } = {
    completed: data.completed,
    completedBy: data.completed ? member.id : null,
    completedAt: data.completed ? new Date() : null,
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
