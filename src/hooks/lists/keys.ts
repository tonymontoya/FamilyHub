/**
 * React Query Keys for Lists Module
 * 
 * Centralized key factory for proper cache invalidation.
 * All filter objects are serialized to ensure stable key comparison.
 */

import type { ListFilters, ItemFilters } from "./types"

/**
 * Serialize filters to a stable string for query keys.
 * Sorts keys to ensure consistent ordering.
 */
function serializeFilters(filters: unknown): string {
  if (!filters || typeof filters !== "object" || Object.keys(filters).length === 0) {
    return ""
  }
  
  const sortedEntries = Object.entries(filters as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
  
  if (sortedEntries.length === 0) {
    return ""
  }
  
  return JSON.stringify(sortedEntries)
}

export const listKeys = {
  // Base
  all: ["lists"] as const,
  
  // Lists list with filters (serialized for stable comparison)
  lists: (filters?: ListFilters) => {
    const serialized = serializeFilters(filters)
    return [...listKeys.all, "list", serialized] as const
  },
  
  // Single list
  detail: (id: string) => [...listKeys.all, "detail", id] as const,
  
  // List items with filters (serialized for stable comparison)
  items: (listId: string, filters?: ItemFilters) => {
    const serialized = serializeFilters(filters)
    return [...listKeys.all, "items", listId, serialized] as const
  },
  
  // Single item
  item: (listId: string, itemId: string) =>
    [...listKeys.all, "item", listId, itemId] as const,
} as const
