/**
 * Lists Module Hooks
 * 
 * React Query hooks for managing lists and list items
 * 
 * @example
 * ```tsx
 * import { useLists, useCreateList } from "@/hooks/lists"
 * 
 * function ListsPage() {
 *   const { data, isLoading } = useLists()
 *   const createList = useCreateList()
 *   
 *   if (isLoading) return <Loading />
 *   
 *   return (
 *     <div>
 *       {data?.lists.map(list => <ListCard key={list.id} list={list} />)}
 *     </div>
 *   )
 * }
 * ```
 */

// Query keys
export { listKeys } from "./keys"

// Types
export type {
  ListSummary,
  List,
  ListItem,
  ItemCompleter,
  ListCreator,
  ListsResponse,
  ItemsResponse,
  PaginationInfo,
  CreateListInput,
  UpdateListInput,
  CreateItemInput,
  UpdateItemInput,
  ReorderInput,
  ListFilters,
  ItemFilters,
} from "./types"

// List hooks
export {
  useLists,
  useList,
  useCreateList,
  useUpdateList,
  useDeleteList,
} from "./use-lists"

// Item hooks
export {
  useListItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useToggleItem,
  useReorderItems,
} from "./use-items"

// API functions (for advanced use cases)
export * as listsApi from "./api"

// Error class for error handling
export { ApiError } from "./api"
