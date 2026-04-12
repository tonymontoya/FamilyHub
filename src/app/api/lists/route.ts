/**
 * Lists API
 * 
 * GET  /api/lists - List all lists for the family
 * POST /api/lists - Create a new list
 */

import { prisma } from "@/lib/prisma"
import {
  requireAuth,
  requireModifyAccess,
} from "@/lib/auth-utils"
import {
  createListSchema,
  validateOrThrow,
} from "@/lib/validation"
import {
  withErrorHandling,
  successResponse,
  createdResponse,
} from "@/lib/errors"
import { applyRateLimit } from "@/lib/rate-limit"
import type { ListType } from "@prisma/client"

/**
 * GET /api/lists
 * 
 * Query params:
 *   - type: Filter by list type (SHOPPING, PACKING, WISHLIST, CUSTOM)
 *   - limit: Max results (default 50, max 100)
 *   - offset: Pagination offset (default 0)
 */
export const GET = withErrorHandling(async (request) => {
  const { member } = await requireAuth()

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("read", member.id)

  // Parse query params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") as ListType | null
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "50", 10),
    100
  )
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  // Build where clause
  const where = {
    familyId: member.familyId,
    deletedAt: null,
    ...(type && { type }),
  }

  // Fetch lists with counts
  const [lists, total] = await Promise.all([
    prisma.list.findMany({
      where,
      include: {
        _count: {
          select: {
            items: {
              where: { deletedAt: null },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.list.count({ where }),
  ])

  // Transform for response
  const response = {
    lists: lists.map((list) => ({
      id: list.id,
      title: list.title,
      type: list.type,
      description: list.description,
      createdBy: list.createdBy,
      itemCount: list._count.items,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + lists.length < total,
    },
  }

  return successResponse(response, 200, rateLimitHeaders)
})

/**
 * POST /api/lists
 * 
 * Body: { title: string, type: ListType, description?: string }
 */
export const POST = withErrorHandling(async (request) => {
  const { member } = await requireAuth()

  // Rate limit check
  const rateLimitHeaders = applyRateLimit("listCreate", member.id)

  // Parse and validate body
  const body = await request.json()
  const data = validateOrThrow(createListSchema, body)

  // Create list
  const list = await prisma.list.create({
    data: {
      title: data.title,
      type: data.type,
      description: data.description,
      familyId: member.familyId,
      createdById: member.id,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
        },
      },
      _count: {
        select: { items: true },
      },
    },
  })

  const response = {
    id: list.id,
    title: list.title,
    type: list.type,
    description: list.description,
    createdBy: list.createdBy,
    itemCount: 0,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  }

  return createdResponse(response, rateLimitHeaders)
})
