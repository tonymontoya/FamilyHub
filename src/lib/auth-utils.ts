/**
 * Authentication & Authorization Utilities
 * 
 * Server-side helpers for API route authorization with Better Auth
 */

import { headers } from "next/headers"
import { auth } from "./auth"
import { prisma } from "./prisma"
import { Errors } from "./errors"
import type { Member, Role } from "@prisma/client"

export interface AuthContext {
  member: Member
  userId: string
}

/**
 * Verify session and return authenticated member context
 * Throws ApiError for unauthenticated requests
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.email) {
    throw Errors.unauthorized()
  }

  const member = await prisma.member.findUnique({
    where: { username: session.user.email },
  })

  if (!member || member.deletedAt) {
    // Deleted members or members not found = unauthorized
    throw Errors.unauthorized("Account not found or deactivated")
  }

  return {
    member,
    userId: session.user.id,
  }
}

/**
 * Require specific role (PARENT/CHILD)
 * Throws ApiError if role doesn't match
 */
export function requireRole(member: Member, requiredRole: Role): void {
  if (member.role !== requiredRole) {
    throw Errors.forbidden(`This action requires ${requiredRole} role`)
  }
}

/**
 * Check if member is a parent (convenience helper)
 */
export function isParent(role: Role): boolean {
  return role === "PARENT"
}

/**
 * Verify member can modify a resource
 * Rules:
 * - Parents can modify any resource in their family
 * - Children can only modify resources they created
 * 
 * Uses 404 to prevent information leakage about resource existence
 */
export async function requireModifyAccess(
  member: Member,
  resourceCreatorId: string,
  resourceName: string = "Resource"
): Promise<void> {
  if (member.role === "PARENT") return
  
  if (member.id !== resourceCreatorId) {
    throw Errors.notFound(resourceName)
  }
}

/**
 * Verify member has access to family's resources
 * Uses 404 to prevent information leakage
 */
export async function requireFamilyAccess(
  memberFamilyId: string,
  targetFamilyId: string,
  resourceName: string = "Resource"
): Promise<void> {
  if (memberFamilyId !== targetFamilyId) {
    throw Errors.notFound(resourceName)
  }
}

/**
 * Get list with access verification (checks family access + not deleted)
 * Returns list or throws 404 (not found / no access)
 */
export async function getListWithAccess(
  listId: string,
  member: Member
) {
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      deletedAt: null, // Exclude soft-deleted lists
    },
  })

  if (!list || list.familyId !== member.familyId) {
    throw Errors.notFound("List")
  }

  return list
}

/**
 * Get list item with access verification
 * Returns item with list or throws 404
 */
export async function getItemWithAccess(
  itemId: string,
  listId: string,
  member: Member
) {
  const item = await prisma.listItem.findFirst({
    where: {
      id: itemId,
      listId,
      deletedAt: null,
      list: {
        deletedAt: null,
        familyId: member.familyId,
      },
    },
    include: {
      list: true,
      completer: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  })

  if (!item) {
    throw Errors.notFound("Item")
  }

  return item
}

/**
 * Get calendar event with access verification (checks family access + not deleted)
 * Returns event or throws 404 (not found / no access)
 */
export async function getEventWithAccess(
  eventId: string,
  member: Member
) {
  const event = await prisma.calendarEvent.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
    },
  })

  if (!event || event.familyId !== member.familyId) {
    throw Errors.notFound("Event")
  }

  return event
}
