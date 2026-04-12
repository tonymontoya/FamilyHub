"use client"

import { ListPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyListsProps {
  onCreateClick: () => void
}

export function EmptyLists({ onCreateClick }: EmptyListsProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <ListPlus className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No lists yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Create your first list to get started. You can make shopping lists,
        packing lists, wishlists, or custom lists.
      </p>
      <Button onClick={onCreateClick} className="mt-6">
        <ListPlus className="mr-2 h-4 w-4" />
        Create List
      </Button>
    </div>
  )
}
