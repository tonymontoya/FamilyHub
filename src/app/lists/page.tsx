"use client"

import { useState } from "react"
import { Plus, ShoppingBag, Luggage, Gift, List } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ListCard } from "@/components/lists/list-card"
import { EmptyLists } from "@/components/lists/empty-lists"
import { CreateListForm } from "@/components/lists/create-list-form"
import { useLists } from "@/hooks/lists"
import { cn } from "@/lib/utils"
import type { ListType } from "@prisma/client"

type FilterType = "all" | ListType

const filters: { value: FilterType; label: string; icon: typeof List }[] = [
  { value: "all", label: "All", icon: List },
  { value: "SHOPPING", label: "Shopping", icon: ShoppingBag },
  { value: "PACKING", label: "Packing", icon: Luggage },
  { value: "WISHLIST", label: "Wishlists", icon: Gift },
]

export default function ListsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const { data, isLoading, isError } = useLists(
    activeFilter !== "all" ? { type: activeFilter } : undefined
  )

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <h2 className="text-lg font-medium text-destructive">
            Failed to load lists
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please try again later.
          </p>
        </div>
      </div>
    )
  }

  const lists = data?.lists || []
  const hasLists = lists.length > 0

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lists</h1>
          <p className="text-muted-foreground">
            Manage your family&apos;s shopping, packing, and wish lists
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New List
        </Button>
      </div>

      {isLoading ? (
        <ListsSkeleton />
      ) : !hasLists ? (
        <EmptyLists onCreateClick={() => setCreateOpen(true)} />
      ) : (
        <>
          {/* Filter Buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            {filters.map((filter) => {
              const Icon = filter.icon
              const isActive = activeFilter === filter.value

              return (
                <Button
                  key={filter.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.value)}
                  className="gap-1"
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </Button>
              )
            })}
          </div>

          {/* Lists Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        </>
      )}

      <CreateListForm open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

function ListsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-4 h-4 w-full" />
        </div>
      ))}
    </div>
  )
}
