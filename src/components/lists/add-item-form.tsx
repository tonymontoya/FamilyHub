"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreateItem } from "@/hooks/lists"

interface AddItemFormProps {
  listId: string
}

export function AddItemForm({ listId }: AddItemFormProps) {
  const [name, setName] = useState("")
  const createItem = useCreateItem()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createItem.mutate(
      { listId, input: { name: name.trim() } },
      {
        onSuccess: () => {
          setName("")
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Add an item..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={createItem.isPending}
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={!name.trim() || createItem.isPending}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add
      </Button>
    </form>
  )
}
