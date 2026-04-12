"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listKeys } from "./keys"
import * as api from "./api"
import type {
  ListFilters,
  CreateListInput,
  UpdateListInput,
  ListsResponse,
  ListSummary,
} from "./types"

// ===== Queries =====

export function useLists(filters: ListFilters = {}) {
  return useQuery({
    queryKey: listKeys.lists(filters),
    queryFn: ({ signal }) => api.fetchLists(filters, signal),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useList(id: string) {
  return useQuery({
    queryKey: listKeys.detail(id),
    queryFn: ({ signal }) => api.fetchList(id, signal),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

// ===== Mutations with Optimistic Updates =====

export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateListInput) => api.createList(input),
    
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listKeys.all })
      
      const previousLists = queryClient.getQueryData<{ data: ListsResponse }>(
        listKeys.lists()
      )
      
      // Create optimistic list
      const optimisticList: ListSummary = {
        id: `temp-${Date.now()}`,
        title: input.title,
        type: input.type,
        description: input.description ?? null,
        createdBy: { id: "temp", displayName: "You" },
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      queryClient.setQueryData<{ data: ListsResponse }>(
        listKeys.lists(),
        (old) => {
          if (!old?.data) return old
          return {
            data: {
              lists: [optimisticList, ...old.data.lists],
              pagination: {
                ...old.data.pagination,
                total: old.data.pagination.total + 1,
              },
            },
          }
        }
      )
      
      return { previousLists }
    },
    
    onError: (err, __, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.lists(), context.previousLists)
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all })
    },
  })
}

export function useUpdateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateListInput }) =>
      api.updateList(id, input),
    
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: listKeys.all })
      
      const previousList = queryClient.getQueryData<{ data: ListSummary }>(
        listKeys.detail(id)
      )
      const previousLists = queryClient.getQueryData<{ data: ListsResponse }>(
        listKeys.lists()
      )
      
      // Optimistically update detail
      queryClient.setQueryData<{ data: ListSummary }>(
        listKeys.detail(id),
        (old) => {
          if (!old?.data) return old
          return {
            data: { ...old.data, ...input, updatedAt: new Date().toISOString() },
          }
        }
      )
      
      // Optimistically update list
      queryClient.setQueryData<{ data: ListsResponse }>(
        listKeys.lists(),
        (old) => {
          if (!old?.data) return old
          return {
            data: {
              ...old.data,
              lists: old.data.lists.map((list) =>
                list.id === id
                  ? { ...list, ...input, updatedAt: new Date().toISOString() }
                  : list
              ),
            },
          }
        }
      )
      
      return { previousList, previousLists }
    },
    
    onError: (err, { id }, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(listKeys.detail(id), context.previousList)
      }
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.lists(), context.previousLists)
      }
    },
    
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: listKeys.all })
    },
  })
}

export function useDeleteList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteList(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKeys.all })
      
      const previousLists = queryClient.getQueryData<{ data: ListsResponse }>(
        listKeys.lists()
      )
      
      queryClient.setQueryData<{ data: ListsResponse }>(
        listKeys.lists(),
        (old) => {
          if (!old?.data) return old
          return {
            data: {
              ...old.data,
              lists: old.data.lists.filter((list) => list.id !== id),
              pagination: {
                ...old.data.pagination,
                total: Math.max(0, old.data.pagination.total - 1),
              },
            },
          }
        }
      )
      
      return { previousLists }
    },
    
    onError: (err, __, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.lists(), context.previousLists)
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all })
    },
  })
}
