/**
 * Reorder List Items API
 * 
 * POST /api/lists/[id]/items/reorder
 * 
 * Body: { itemIds: string[] } - Array of item IDs in desired order
 */

import { prisma } from "@/lib/prisma"
import {
  requireAuth,
  getListWithAccess,
} from "@/lib/auth-utils"
import {
  reorderSchema,
  validateOrThrow,
} from "@/lib/validation"
import {
  withErrorHandling,
  successResponse,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"

export const POST = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("reorder", member.id)

  // Get list with access verification
  const list = await getListWithAccess(id, member)

  // Parse and validate body
  const body = await request.json()
  const data = validateOrThrow(reorderSchema, body)

  // Get all non-deleted items for this list
  const existingItems = await prisma.listItem.findMany({
    where: {
      listId: list.id,
      deletedAt: null,
    },
    select: { id: true },
  })

  const existingIds = new Set(existingItems.map((i) => i.id))
  const providedIds = new Set(data.itemIds)

  // Validate all provided IDs belong to this list
  const invalidIds = data.itemIds.filter((id) => !existingIds.has(id))
  if (invalidIds.length > 0) {
    throw new Error(
      `Invalid item IDs: ${invalidIds.join(", ")}`
    )
  }

  // Validate all list items are included (can't have gaps)
  const missingIds = Array.from(existingIds).filter((id) => !providedIds.has(id))
  if (missingIds.length > 0) {
    throw new Error(
      `Missing item IDs in reorder: ${missingIds.join(", ")}`
    )
  }

  // Update sort orders in transaction
  const updates = data.itemIds.map((itemId, index) =>
    prisma.listItem.update({
      where: { id: itemId },
      data: { sortOrder: index },
    })
  )

  await prisma.$transaction(updates)

  // Fetch updated items
  const items = await prisma.listItem.findMany({
    where: {
      listId: list.id,
      deletedAt: null,
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      sortOrder: true,
    },
  })

  return successResponse({ items }, 200, rateLimitHeaders)
})
