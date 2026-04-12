"use client"

import { useState, useMemo, useCallback } from "react"
import { Plus, ShoppingBag, Luggage, Gift, List } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ListCard } from "@/components/lists/list-card"
import { EmptyLists } from "@/components/lists/empty-lists"
import { CreateListForm } from "@/components/lists/create-list-form"
import { useLists } from "@/hooks/lists"
import type { ListType } from "@prisma/client"

type FilterType = "all" | ListType

interface FilterConfig {
  value: FilterType
  label: string
  icon: typeof List
}

const filters: FilterConfig[] = [
  { value: "all", label: "All", icon: List },
  { value: "SHOPPING", label: "Shopping", icon: ShoppingBag },
  { value: "PACKING", label: "Packing", icon: Luggage },
  { value: "WISHLIST", label: "Wishlists", icon: Gift },
]

export default function ListsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const { data, isLoading, isError, error } = useLists(
    useMemo(() => activeFilter !== "all" ? { type: activeFilter } : undefined, [activeFilter])
  )

  // Memoize lists to prevent unnecessary re-renders
  const lists = useMemo(() => data?.lists || [], [data?.lists])
  const hasLists = lists.length > 0

  // Memoize error handler
  const handleError = useCallback(() => {
    toast.error("Failed to load lists", {
      description: error instanceof Error ? error.message : "Please try again",
    })
  }, [error])

  if (isError) {
    handleError()
    return (
      <div className="container mx-auto py-8">
        <div 
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <h2 className="text-lg font-medium text-destructive">
            Failed to load lists
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please try again later.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

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
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
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
          <nav aria-label="List filters" className="mb-6">
            <div className="flex flex-wrap gap-2" role="tablist">
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
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="lists-grid"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {filter.label}
                  </Button>
                )
              })}
            </div>
          </nav>

          {/* Lists Grid */}
          <div 
            id="lists-grid"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            role="tabpanel"
          >
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
