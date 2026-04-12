"use client"

import { use, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { toast } from "sonner"

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Memoize progress calculation
  const { completedCount, progress } = useMemo(() => {
    if (!list) return { completedCount: 0, progress: 0 }
    const completed = list.items.filter((item) => item.completed).length
    const prog = list.items.length > 0
      ? Math.round((completed / list.items.length) * 100)
      : 0
    return { completedCount: completed, progress: prog }
  }, [list])

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
              onClick={handleDeleteClick}
              disabled={deleteList.isPending}
              aria-label={`Delete list "${list.title}"`}
            >
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        {list.items.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground" aria-live="polite">
                {completedCount} of {list.items.length} completed
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

      {/* Items List */}
      {list.items.length === 0 ? (
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
        <div className="space-y-2" role="list" aria-label="List items">
          {list.items.map((item) => (
            <ItemRow key={item.id} item={item} listId={id} />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete list?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{list.title}&quot;? This will delete all {list.items.length} items in the list. This action cannot be undone.
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
