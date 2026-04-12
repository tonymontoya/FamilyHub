"use client"

import { useCallback, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateList } from "@/hooks/lists"
import type { ListType } from "@prisma/client"
import type { ListSummary } from "@/hooks/lists"

const editListSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100, "Title must be 100 characters or less"),
  type: z.enum(["SHOPPING", "PACKING", "WISHLIST", "CUSTOM"]),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
})

type EditListFormData = z.infer<typeof editListSchema>

interface EditListFormProps {
  list: ListSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditListForm({ list, open, onOpenChange }: EditListFormProps) {
  const updateList = useUpdateList()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EditListFormData>({
    resolver: zodResolver(editListSchema),
    defaultValues: {
      title: "",
      type: "CUSTOM",
      description: "",
    },
  })

  const type = watch("type")
  const isSubmitting = updateList.isPending

  // Reset form when list changes
  useEffect(() => {
    if (list) {
      reset({
        title: list.title,
        type: list.type,
        description: list.description || "",
      })
    }
  }, [list, reset])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset to list values on close
      if (list) {
        reset({
          title: list.title,
          type: list.type,
          description: list.description || "",
        })
      }
    }
    onOpenChange(newOpen)
  }, [isSubmitting, list, onOpenChange, reset])

  const onSubmit = useCallback(async (data: EditListFormData) => {
    if (!list) return

    try {
      await updateList.mutateAsync({
        id: list.id,
        input: {
          title: data.title,
          type: data.type as ListType,
          description: data.description || undefined,
        },
      })

      toast.success("List updated", {
        description: `"${data.title}" has been updated`,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to update list", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    }
  }, [list, onOpenChange, updateList])

  if (!list) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
          <DialogDescription>
            Make changes to your list here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              placeholder="e.g., Weekly Groceries"
              {...register("title")}
              aria-invalid={errors.title ? "true" : "false"}
              aria-describedby={errors.title ? "edit-title-error" : undefined}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p id="edit-title-error" className="text-sm text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setValue("type", value as ListType)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="edit-type">
                <SelectValue placeholder="Select list type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SHOPPING">Shopping</SelectItem>
                <SelectItem value="PACKING">Packing</SelectItem>
                <SelectItem value="WISHLIST">Wishlist</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              placeholder="Add details about this list..."
              {...register("description")}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
