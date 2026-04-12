/**
 * Lists API Client
 * 
 * Low-level API functions for the lists module
 * Features: Request cancellation, timeouts, proper error handling
 */

import type {
  ListFilters,
  ItemFilters,
  CreateListInput,
  UpdateListInput,
  CreateItemInput,
  UpdateItemInput,
  ReorderInput,
  ListsResponse,
  List,
  ListSummary,
  ItemsResponse,
  ListItem,
} from "./types"

// ===== Configuration =====

const API_TIMEOUT = 10000 // 10 seconds

// ===== Error Handling =====

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = API_TIMEOUT, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(408, "REQUEST_TIMEOUT", `Request timed out after ${timeout}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Handle API response with proper error extraction
 * Returns unwrapped data directly
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: { error?: { code?: string; message?: string } } = {}
    
    try {
      errorData = await response.json()
    } catch {
      // Response body not JSON
    }
    
    throw new ApiError(
      response.status,
      errorData.error?.code || "UNKNOWN_ERROR",
      errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
    )
  }
  
  // For 204 No Content
  if (response.status === 204) {
    return undefined as T
  }
  
  const json = await response.json()
  return json.data as T
}

/**
 * Build query string from params
 */
function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

// ===== Lists API =====

export async function fetchLists(
  filters: ListFilters = {},
  signal?: AbortSignal
): Promise<ListsResponse> {
  const query = buildQueryString({
    type: filters.type,
    limit: filters.limit,
    offset: filters.offset,
  })
  const response = await fetchWithTimeout(`/api/lists${query}`, { signal })
  return handleResponse<ListsResponse>(response)
}

export async function fetchList(id: string, signal?: AbortSignal): Promise<List> {
  const response = await fetchWithTimeout(`/api/lists/${id}`, { signal })
  return handleResponse<List>(response)
}

export async function createList(
  input: CreateListInput,
  signal?: AbortSignal
): Promise<ListSummary> {
  const response = await fetchWithTimeout("/api/lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  })
  return handleResponse<ListSummary>(response)
}

export async function updateList(
  id: string,
  input: UpdateListInput,
  signal?: AbortSignal
): Promise<ListSummary> {
  const response = await fetchWithTimeout(`/api/lists/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  })
  return handleResponse<ListSummary>(response)
}

export async function deleteList(id: string, signal?: AbortSignal): Promise<void> {
  const response = await fetchWithTimeout(`/api/lists/${id}`, {
    method: "DELETE",
    signal,
  })
  await handleResponse<undefined>(response)
}

// ===== Items API =====

export async function fetchItems(
  listId: string,
  filters: ItemFilters = {},
  signal?: AbortSignal
): Promise<ItemsResponse> {
  const query = buildQueryString({
    completed: filters.completed,
    limit: filters.limit,
    offset: filters.offset,
  })
  const response = await fetchWithTimeout(`/api/lists/${listId}/items${query}`, { signal })
  return handleResponse<ItemsResponse>(response)
}

export async function createItem(
  listId: string,
  input: CreateItemInput,
  signal?: AbortSignal
): Promise<ListItem> {
  const response = await fetchWithTimeout(`/api/lists/${listId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  })
  return handleResponse<ListItem>(response)
}

export async function updateItem(
  listId: string,
  itemId: string,
  input: UpdateItemInput,
  signal?: AbortSignal
): Promise<ListItem> {
  const response = await fetchWithTimeout(`/api/lists/${listId}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  })
  return handleResponse<ListItem>(response)
}

export async function deleteItem(
  listId: string,
  itemId: string,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetchWithTimeout(`/api/lists/${listId}/items/${itemId}`, {
    method: "DELETE",
    signal,
  })
  await handleResponse<undefined>(response)
}

export async function toggleItem(
  listId: string,
  itemId: string,
  completed: boolean,
  signal?: AbortSignal
): Promise<ListItem> {
  const response = await fetchWithTimeout(`/api/lists/${listId}/items/${itemId}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
    signal,
  })
  return handleResponse<ListItem>(response)
}

export async function reorderItems(
  listId: string,
  input: ReorderInput,
  signal?: AbortSignal
): Promise<{ items: Pick<ListItem, "id" | "name" | "sortOrder">[] }> {
  const response = await fetchWithTimeout(`/api/lists/${listId}/items/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  })
  return handleResponse<{ items: Pick<ListItem, "id" | "name" | "sortOrder">[] }>(response)
}
