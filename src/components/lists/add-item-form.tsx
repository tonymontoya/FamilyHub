"use client"

import { useState, useCallback, useRef } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreateItem } from "@/hooks/lists"

interface AddItemFormProps {
  listId: string
}

export function AddItemForm({ listId }: AddItemFormProps) {
  const [name, setName] = useState("")
  const createItem = useCreateItem()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    createItem.mutate(
      { listId, input: { name: trimmedName } },
      {
        onSuccess: () => {
          setName("")
          toast.success("Item added", {
            description: `"${trimmedName}" has been added to your list`,
          })
          // Keep focus on input for rapid entry
          inputRef.current?.focus()
        },
        onError: (error) => {
          toast.error("Failed to add item", {
            description: error instanceof Error ? error.message : "Please try again",
          })
        },
      }
    )
  }, [createItem, listId, name])

  const isSubmitting = createItem.isPending

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        placeholder="Add an item..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isSubmitting}
        className="flex-1"
        aria-label="New item name"
        aria-describedby="add-item-help"
      />
      <Button
        type="submit"
        disabled={!name.trim() || isSubmitting}
        aria-label={isSubmitting ? "Adding item..." : "Add item"}
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "Adding..." : "Add"}
      </Button>
      <span id="add-item-help" className="sr-only">
        Enter an item name and click Add or press Enter
      </span>
    </form>
  )
}
