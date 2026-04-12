/**
 * List Items API
 * 
 * GET  /api/lists/[id]/items - Get all items in a list
 * POST /api/lists/[id]/items - Add a new item to the list
 */

import { prisma } from "@/lib/prisma"
import {
  requireAuth,
  getListWithAccess,
} from "@/lib/auth-utils"
import {
  createItemSchema,
  validateOrThrow,
} from "@/lib/validation"
import {
  withErrorHandling,
  successResponse,
  createdResponse,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"

/**
 * GET /api/lists/[id]/items
 * 
 * Query params:
 *   - completed: Filter by completion status (true/false)
 *   - limit: Max results (default 100, max 500)
 *   - offset: Pagination offset (default 0)
 */
export const GET = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("read", member.id)

  // Get list with access verification
  const list = await getListWithAccess(id, member)

  // Parse query params
  const { searchParams } = new URL(request.url)
  const completedParam = searchParams.get("completed")
  const completed = completedParam === null 
    ? undefined 
    : completedParam === "true"
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "100", 10),
    500
  )
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  // Build where clause
  const where = {
    listId: list.id,
    deletedAt: null,
    ...(completed !== undefined && { completed }),
  }

  // Fetch items
  const [items, total] = await Promise.all([
    prisma.listItem.findMany({
      where,
      include: {
        completer: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: [
        { completed: "asc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.listItem.count({ where }),
  ])

  const response = {
    items: items.map((item) => ({
      id: item.id,
      listId: item.listId,
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
      completed: item.completed,
      completedBy: item.completer,
      completedAt: item.completedAt?.toISOString() || null,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt.toISOString(),
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    },
  }

  return successResponse(response, 200, rateLimitHeaders)
})

/**
 * POST /api/lists/[id]/items
 * 
 * Body: { name: string, quantity?: number, notes?: string }
 */
export const POST = withErrorHandling(async (request, context) => {
  const { member } = await requireAuth()
  const { id } = await context.params

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("itemCreate", member.id)

  // Get list with access verification
  const list = await getListWithAccess(id, member)

  // Parse and validate body
  const body = await request.json()
  const data = validateOrThrow(createItemSchema, body)

  // Get max sortOrder for appending to end
  const maxSortItem = await prisma.listItem.findFirst({
    where: { listId: list.id, deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  })

  const newSortOrder = (maxSortItem?.sortOrder ?? -1) + 1

  // Create item
  const item = await prisma.listItem.create({
    data: {
      name: data.name,
      quantity: data.quantity,
      notes: data.notes,
      listId: list.id,
      sortOrder: newSortOrder,
    },
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
    id: item.id,
    listId: item.listId,
    name: item.name,
    quantity: item.quantity,
    notes: item.notes,
    completed: item.completed,
    completedBy: item.completer,
    completedAt: item.completedAt,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
  }

  return createdResponse(response, rateLimitHeaders)
})
