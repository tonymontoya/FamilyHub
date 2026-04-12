"use client"

import { useState } from "react"
import { Check, Trash2, GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useToggleItem, useDeleteItem } from "@/hooks/lists"
import type { ListItem as ListItemType } from "@/hooks/lists"

interface ItemRowProps {
  item: ListItemType
  listId: string
}

export function ItemRow({ item, listId }: ItemRowProps) {
  const toggleItem = useToggleItem()
  const deleteItem = useDeleteItem()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = () => {
    toggleItem.mutate({
      listId,
      itemId: item.id,
      completed: !item.completed,
    })
  }

  const handleDelete = () => {
    setIsDeleting(true)
    deleteItem.mutate(
      { listId, itemId: item.id },
      {
        onError: () => setIsDeleting(false),
      }
    )
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-3 transition-all",
        item.completed && "bg-muted/50",
        isDeleting && "opacity-50"
      )}
    >
      {/* Drag Handle (for DnD - visual only for now) */}
      <div className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Checkbox */}
      <Checkbox
        checked={item.completed}
        onCheckedChange={handleToggle}
        disabled={toggleItem.isPending}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium", item.completed && "line-through text-muted-foreground")}>
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
        className="h-8 w-8 opacity-0 group-hover:opacity-100"
        onClick={handleDelete}
        disabled={deleteItem.isPending}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
