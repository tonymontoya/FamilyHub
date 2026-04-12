"use client"

import { useCallback, useState, useMemo } from "react"
import { CSS } from "@dnd-kit/utilities"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { Trash2, GripVertical } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { cn } from "@/lib/utils"
import { useToggleItem, useDeleteItem } from "@/hooks/lists"
import type { ListItem as ListItemType } from "@/hooks/lists"

interface SortableItemRowProps {
  item: ListItemType
  listId: string
  isActive?: boolean
}

export function SortableItemRow({ item, listId, isActive: isDraggingOverlay }: SortableItemRowProps) {
  const toggleItem = useToggleItem()
  const deleteItem = useDeleteItem()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: deleteItem.isPending,
    data: {
      item,
    },
  })

  // Memoize style to prevent unnecessary re-renders
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }), [transform, transition, isDragging])

  const handleToggle = useCallback(() => {
    const newCompleted = !item.completed

    toggleItem.mutate(
      {
        listId,
        itemId: item.id,
        completed: newCompleted,
      },
      {
        onError: (error) => {
          toast.error("Failed to update item", {
            description: error instanceof Error ? error.message : "Please try again",
          })
        },
      }
    )
  }, [item.completed, item.id, listId, toggleItem])

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteDialog(false)

    deleteItem.mutate(
      { listId, itemId: item.id },
      {
        onSuccess: () => {
          toast.success("Item deleted", {
            description: `"${item.name}" has been removed`,
          })
        },
        onError: (error) => {
          toast.error("Failed to delete item", {
            description: error instanceof Error ? error.message : "Please try again",
          })
        },
      }
    )
  }, [deleteItem, item.id, item.name, listId])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteDialog(false)
  }, [])

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex items-center gap-3 rounded-lg border bg-card p-3 transition-all",
          item.completed && "bg-muted/50",
          deleteItem.isPending && "opacity-50",
          isDragging && "shadow-lg ring-2 ring-primary opacity-50",
          isDraggingOverlay && "opacity-0"
        )}
        role="listitem"
        aria-grabbed={isDragging}
      >
        {/* Drag Handle */}
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none"
          aria-label={`Drag to reorder "${item.name}". Press space to lift, arrow keys to move, space to drop.`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Checkbox */}
        <Checkbox
          checked={item.completed}
          onCheckedChange={handleToggle}
          disabled={toggleItem.isPending}
          aria-label={`Mark "${item.name}" as ${item.completed ? "incomplete" : "complete"}`}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "font-medium",
              item.completed && "line-through text-muted-foreground"
            )}
          >
            {item.name}
          </div>
          {item.notes && (
            <div className="text-sm text-muted-foreground truncate">
              {item.notes}
            </div>
          )}
          {item.quantity > 1 && (
            <div className="text-xs text-muted-foreground">
              Qty: {item.quantity}
            </div>
          )}
          {item.completed && item.completedBy && (
            <div className="text-xs text-muted-foreground">
              Completed by {item.completedBy.displayName}
            </div>
          )}
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100"
          onClick={handleDeleteClick}
          disabled={deleteItem.isPending}
          aria-label={`Delete "${item.name}"`}
        >
          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{item.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
