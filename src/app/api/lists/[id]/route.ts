/**
 * List Detail API
 * 
 * GET    /api/lists/[id] - Get a single list with items
 * PATCH  /api/lists/[id] - Update list details
 * DELETE /api/lists/[id] - Soft delete a list
 */

import { prisma } from "@/lib/prisma"
import {
  requireAuth,
  requireModifyAccess,
  getListWithAccess,
} from "@/lib/auth-utils"
import {
  updateListSchema,
  validateOrThrow,
} from "@/lib/validation"
import {
  withErrorHandling,
  successResponse,
  noContentResponse,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"

/**
 * GET /api/lists/[id]
 * 
 * Includes items sorted by completion status then sort order
 */
export const GET = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("read", member.id)

  // Get list with access verification
  const list = await getListWithAccess(id, member)

  // Fetch items
  const items = await prisma.listItem.findMany({
    where: {
      listId: list.id,
      deletedAt: null,
    },
    include: {
      completer: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
    orderBy: [
      { completed: "asc" }, // Incomplete first
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  })

  const response = {
    id: list.id,
    title: list.title,
    type: list.type,
    description: list.description,
    familyId: list.familyId,
    createdById: list.createdById,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
      completed: item.completed,
      completedBy: item.completer,
      completedAt: item.completedAt?.toISOString() || null,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt.toISOString(),
    })),
  }

  return successResponse(response, 200, rateLimitHeaders)
})

/**
 * PATCH /api/lists/[id]
 * 
 * Body: { title?: string, type?: ListType, description?: string }
 */
export const PATCH = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("listUpdate", member.id)

  // Get list with access verification
  const list = await getListWithAccess(id, member)

  // Check modify permissions (parents can modify any, children only their own)
  await requireModifyAccess(member, list.createdById)

  // Parse and validate body
  const body = await request.json()
  const data = validateOrThrow(updateListSchema, body)

  // Update list
  const updated = await prisma.list.update({
    where: { id: list.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
        },
      },
      _count: {
        select: {
          items: {
            where: { deletedAt: null },
          },
        },
      },
    },
  })

  const response = {
    id: updated.id,
    title: updated.title,
    type: updated.type,
    description: updated.description,
    createdBy: updated.createdBy,
    itemCount: updated._count.items,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }

  return successResponse(response, 200, rateLimitHeaders)
})

/**
 * DELETE /api/lists/[id]
 * 
 * Soft deletes the list and all its items
 */
export const DELETE = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  applyRateLimit("listDelete", member.id)

  // Get list with access verification
  const list = await getListWithAccess(id, member)

  // Check modify permissions
  await requireModifyAccess(member, list.createdById)

  // Soft delete list (cascade will soft delete items via application logic)
  const now = new Date()
  
  await prisma.$transaction([
    // Soft delete all items first
    prisma.listItem.updateMany({
      where: { listId: list.id, deletedAt: null },
      data: { deletedAt: now },
    }),
    // Soft delete the list
    prisma.list.update({
      where: { id: list.id },
      data: { deletedAt: now },
    }),
  ])

  return noContentResponse()
})
