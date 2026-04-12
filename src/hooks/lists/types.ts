/**
 * Types for Lists Module Hooks
 */

import type { ListType } from "@prisma/client"

// ===== API Response Types =====

export interface ListCreator {
  id: string
  displayName: string
}

export interface ListSummary {
  id: string
  title: string
  type: ListType
  description: string | null
  createdBy: ListCreator
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface List extends ListSummary {
  familyId: string
  items: ListItem[]
}

export interface ItemCompleter {
  id: string
  displayName: string
}

export interface ListItem {
  id: string
  listId: string
  name: string
  quantity: number
  notes: string | null
  completed: boolean
  completedBy: ItemCompleter | null
  completedAt: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ===== Pagination =====

export interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface ListsResponse {
  lists: ListSummary[]
  pagination: PaginationInfo
}

export interface ItemsResponse {
  items: ListItem[]
  pagination: PaginationInfo
}

// ===== Input Types =====

export interface CreateListInput {
  title: string
  type: ListType
  description?: string
}

export interface UpdateListInput {
  title?: string
  type?: ListType
  description?: string
}

export interface CreateItemInput {
  name: string
  quantity?: number
  notes?: string
}

export interface UpdateItemInput {
  name?: string
  quantity?: number
  notes?: string
  completed?: boolean
}

export interface ReorderInput {
  itemIds: string[]
}

// ===== Filter Types =====

export interface ListFilters {
  type?: ListType
  limit?: number
  offset?: number
}

export interface ItemFilters {
  completed?: boolean
  limit?: number
  offset?: number
}
