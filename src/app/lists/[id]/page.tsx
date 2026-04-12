"use client"

import { use, useCallback, useMemo, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Trash2, Edit, GripVertical } from "lucide-react"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ListTypeBadge } from "@/components/lists/list-type-badge"
import { SortableItemRow } from "@/components/lists/sortable-item-row"
import { AddItemForm } from "@/components/lists/add-item-form"
import { EditListForm } from "@/components/lists/edit-list-form"
import { useList, useDeleteList, useReorderItems } from "@/hooks/lists"
import { useRouter } from "next/navigation"
import type { ListItem } from "@/hooks/lists"
import { cn } from "@/lib/utils"

interface ListDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: list, isLoading, isError } = useList(id)
  const deleteList = useDeleteList()
  const reorderItems = useReorderItems()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  // Local state for optimistic DND reordering
  const [items, setItems] = useState<ListItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState<string>("")
  
  // Sync local state when data loads (using useEffect, not render-time)
  useEffect(() => {
    if (list?.items) {
      setItems(list.items)
    }
  }, [list?.items])

  // Memoized item IDs for SortableContext
  const itemIds = useMemo(() => items.map((item) => item.id), [items])

  // Sensors for DND
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Memoize progress calculation
  const { completedCount, progress, totalCount } = useMemo(() => {
    const completed = items.filter((item) => item.completed).length
    const total = items.length
    const prog = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completedCount: completed, progress: prog, totalCount: total }
  }, [items])

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteDialog(false)

    deleteList.mutate(id, {
      onSuccess: () => {
        toast.success("List deleted", {
          description: `"${list?.title}" has been deleted`,
        })
        router.push("/lists")
      },
      onError: (error) => {
        toast.error("Failed to delete list", {
          description: error instanceof Error ? error.message : "Please try again",
        })
      },
    })
  }, [deleteList, id, list?.title, router])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteDialog(false)
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    const item = items.find((i) => i.id === active.id)
    if (item) {
      setAnnouncement(`Started dragging "${item.name}"`)
    }
  }, [items])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.id === active.id)
        const newIndex = currentItems.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(currentItems, oldIndex, newIndex)
        const movedItem = newItems[newIndex]
        
        setAnnouncement(`"${movedItem.name}" moved to position ${newIndex + 1} of ${newItems.length}`)
        
        // Persist to server
        reorderItems.mutate(
          { 
            listId: id, 
            input: { itemIds: newItems.map((item) => item.id) } 
          },
          {
            onSuccess: () => {
              toast.success("Items reordered")
            },
            onError: (error) => {
              toast.error("Failed to reorder items", {
                description: error instanceof Error ? error.message : "Please try again",
              })
              // Revert to server state on error
              if (list?.items) {
                setItems(list.items)
              }
            },
          }
        )

        return newItems
      })
    } else {
      setAnnouncement("Reorder cancelled")
    }
  }, [id, list?.items, reorderItems])

  // Get active item for drag overlay
  const activeItem = useMemo(() => {
    return activeId ? items.find((item) => item.id === activeId) : null
  }, [activeId, items])

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <h2 className="text-lg font-medium text-destructive">
            List not found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This list may have been deleted or you don&apos;t have access.
          </p>
          <Link href="/lists" className="mt-4 inline-block">
            <Button>Back to Lists</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading || !list) {
    return <ListDetailSkeleton />
  }

  return (
    <div className="container mx-auto py-8">
      {/* Screen reader announcements for DND */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="assertive" 
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Header */}
      <div className="mb-6">
        <Link href="/lists" className="mb-4 inline-flex items-center text-sm">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Lists
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {list.title}
              </h1>
              <ListTypeBadge type={list.type} />
            </div>
            {list.description && (
              <p className="mt-2 text-muted-foreground">{list.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowEditDialog(true)}
              aria-label={`Edit list "${list.title}"`}
            >
              <Edit className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDeleteClick}
              disabled={deleteList.isPending}
              aria-label={`Delete list "${list.title}"`}
            >
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground" aria-live="polite">
                {completedCount} of {totalCount} completed
              </span>
              <span className="font-medium" aria-label={`${progress}% complete`}>
                {progress}%
              </span>
            </div>
            <div
              className="mt-2 h-2 rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="List completion progress"
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Add Item Form */}
      <div className="mb-6">
        <AddItemForm listId={id} />
      </div>

      {/* DND Instructions */}
      {totalCount > 1 && (
        <p className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
          <GripVertical className="h-4 w-4" aria-hidden="true" />
          Drag items by the handle to reorder
        </p>
      )}

      {/* Items List with DND */}
      {totalCount === 0 ? (
        <div
          className="rounded-lg border border-dashed p-8 text-center"
          role="status"
          aria-live="polite"
        >
          <p className="text-muted-foreground">No items yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first item above
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart: () => "",
              onDragOver: () => "",
              onDragEnd: () => "",
              onDragCancel: () => "",
            },
          }}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2" role="list" aria-label="List items. Use Tab to navigate, Space to activate drag handle, arrow keys to move items.">
              {items.map((item) => (
                <SortableItemRow 
                  key={item.id} 
                  item={item} 
                  listId={id}
                  isActive={item.id === activeId}
                />
              ))}
            </div>
          </SortableContext>
          
          {/* Drag Overlay for visual feedback */}
          <DragOverlay>
            {activeItem ? (
              <div className="rounded-lg border bg-card p-3 shadow-xl opacity-90">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{activeItem.name}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Edit List Dialog */}
      <EditListForm
        list={list}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete list?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{list.title}&quot;? This will delete all {totalCount} items in the list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ListDetailSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="mb-4 h-8 w-24" />
      <Skeleton className="mb-2 h-10 w-1/2" />
      <Skeleton className="mb-6 h-4 w-1/3" />
      <Skeleton className="mb-6 h-2 w-full" />
      <Skeleton className="mb-4 h-10 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}
