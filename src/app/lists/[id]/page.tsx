"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ListTypeBadge } from "@/components/lists/list-type-badge"
import { ItemRow } from "@/components/lists/item-row"
import { AddItemForm } from "@/components/lists/add-item-form"
import { useList, useDeleteList } from "@/hooks/lists"
import { useRouter } from "next/navigation"

interface ListDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: list, isLoading, isError } = useList(id)
  const deleteList = useDeleteList()

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
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

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this list?")) {
      deleteList.mutate(id, {
        onSuccess: () => {
          router.push("/lists")
        },
      })
    }
  }

  const completedCount = list.items.filter((item) => item.completed).length
  const progress = list.items.length > 0
    ? Math.round((completedCount / list.items.length) * 100)
    : 0

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/lists" className="mb-4 inline-flex items-center text-sm">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
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
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleteList.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        {list.items.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount} of {list.items.length} completed
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
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

      {/* Items List */}
      {list.items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No items yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first item above
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.items.map((item) => (
            <ItemRow key={item.id} item={item} listId={id} />
          ))}
        </div>
      )}
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
