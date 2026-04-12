"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listKeys } from "./keys"
import * as api from "./api"
import type {
  ItemFilters,
  CreateItemInput,
  UpdateItemInput,
  ReorderInput,
  ListItem,
  ItemsResponse,
} from "./types"

// ===== Queries =====

export function useListItems(listId: string, filters: ItemFilters = {}) {
  return useQuery({
    queryKey: listKeys.items(listId, filters),
    queryFn: ({ signal }) => api.fetchItems(listId, filters, signal),
    enabled: !!listId,
    staleTime: 10 * 1000, // 10 seconds (items change frequently)
  })
}

// ===== Mutations with Optimistic Updates =====

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listId, input }: { listId: string; input: CreateItemInput }) =>
      api.createItem(listId, input),
    
    // Optimistically add item to the list
    onMutate: async ({ listId, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: listKeys.items(listId) })
      
      // Snapshot previous value
      const previousItems = queryClient.getQueryData<ItemsResponse>(
        listKeys.items(listId)
      )
      
      // Create optimistic item
      const optimisticItem: ListItem = {
        id: `temp-${Date.now()}`,
        listId,
        name: input.name,
        quantity: input.quantity ?? 1,
        notes: input.notes ?? null,
        completed: false,
        completedBy: null,
        completedAt: null,
        sortOrder: (previousItems?.items.length ?? 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      // Optimistically update cache
      queryClient.setQueryData<ItemsResponse>(
        listKeys.items(listId),
        (old) => {
          if (!old) return { items: [optimisticItem], pagination: { total: 1, limit: 100, offset: 0, hasMore: false } }
          return {
            ...old,
            items: [...old.items, optimisticItem],
            pagination: { ...old.pagination, total: old.pagination.total + 1 },
          }
        }
      )
      
      return { previousItems }
    },
    
    // Rollback on error
    onError: (err, { listId }, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(listKeys.items(listId), context.previousItems)
      }
    },
    
    // Refetch after success or error
    onSettled: (_, __, { listId }) => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(listId) })
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      input,
    }: {
      listId: string
      itemId: string
      input: UpdateItemInput
    }) => api.updateItem(listId, itemId, input),
    
    onMutate: async ({ listId, itemId, input }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.items(listId) })
      
      const previousItems = queryClient.getQueryData<ItemsResponse>(
        listKeys.items(listId)
      )
      
      queryClient.setQueryData<ItemsResponse>(
        listKeys.items(listId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === itemId
                ? { ...item, ...input, updatedAt: new Date().toISOString() }
                : item
            ),
          }
        }
      )
      
      return { previousItems }
    },
    
    onError: (err, { listId }, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(listKeys.items(listId), context.previousItems)
      }
    },
    
    onSettled: (_, __, { listId, itemId }) => {
      queryClient.invalidateQueries({ queryKey: listKeys.item(listId, itemId) })
      queryClient.invalidateQueries({ queryKey: listKeys.items(listId) })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      api.deleteItem(listId, itemId),
    
    onMutate: async ({ listId, itemId }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.items(listId) })
      
      const previousItems = queryClient.getQueryData<ItemsResponse>(
        listKeys.items(listId)
      )
      
      queryClient.setQueryData<ItemsResponse>(
        listKeys.items(listId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.filter((item) => item.id !== itemId),
            pagination: { ...old.pagination, total: Math.max(0, old.pagination.total - 1) },
          }
        }
      )
      
      return { previousItems }
    },
    
    onError: (err, { listId }, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(listKeys.items(listId), context.previousItems)
      }
    },
    
    onSettled: (_, __, { listId }) => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(listId) })
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) })
    },
  })
}

export function useToggleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      completed,
    }: {
      listId: string
      itemId: string
      completed: boolean
    }) => api.toggleItem(listId, itemId, completed),
    
    onMutate: async ({ listId, itemId, completed }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.items(listId) })
      
      const previousItems = queryClient.getQueryData<ItemsResponse>(
        listKeys.items(listId)
      )
      
      queryClient.setQueryData<ItemsResponse>(
        listKeys.items(listId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    completed,
                    completedAt: completed ? new Date().toISOString() : null,
                    updatedAt: new Date().toISOString(),
                  }
                : item
            ),
          }
        }
      )
      
      return { previousItems }
    },
    
    onError: (err, { listId }, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(listKeys.items(listId), context.previousItems)
      }
    },
    
    onSettled: (_, __, { listId, itemId }) => {
      queryClient.invalidateQueries({ queryKey: listKeys.item(listId, itemId) })
      queryClient.invalidateQueries({ queryKey: listKeys.items(listId) })
    },
  })
}

export function useReorderItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listId, input }: { listId: string; input: ReorderInput }) =>
      api.reorderItems(listId, input),
    
    onMutate: async ({ listId, input }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.items(listId) })
      
      const previousItems = queryClient.getQueryData<ItemsResponse>(
        listKeys.items(listId)
      )
      
      // Create a map of id to new sort order
      const orderMap = new Map(input.itemIds.map((id, index) => [id, index]))
      
      queryClient.setQueryData<ItemsResponse>(
        listKeys.items(listId),
        (old) => {
          if (!old) return old
          
          // Sort items according to new order
          const sortedItems = [...old.items].sort((a, b) => {
            const orderA = orderMap.get(a.id) ?? a.sortOrder
            const orderB = orderMap.get(b.id) ?? b.sortOrder
            return orderA - orderB
          })
          
          // Update sortOrder values
          return {
            ...old,
            items: sortedItems.map((item, index) => ({
              ...item,
              sortOrder: index,
            })),
          }
        }
      )
      
      return { previousItems }
    },
    
    onError: (err, { listId }, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(listKeys.items(listId), context.previousItems)
      }
    },
    
    onSettled: (_, __, { listId }) => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(listId) })
    },
  })
}
