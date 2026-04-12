"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { useCreateList } from "@/hooks/lists"
import type { ListType } from "@prisma/client"

const createListSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  type: z.enum(["SHOPPING", "PACKING", "WISHLIST", "CUSTOM"]),
  description: z.string().optional(),
})

type CreateListFormData = z.infer<typeof createListSchema>

interface CreateListFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateListForm({ open, onOpenChange }: CreateListFormProps) {
  const router = useRouter()
  const createList = useCreateList()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateListFormData>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      type: "CUSTOM",
    },
  })

  const type = watch("type")

  async function onSubmit(data: CreateListFormData) {
    setError(null)

    try {
      const list = await createList.mutateAsync({
        title: data.title,
        type: data.type as ListType,
        description: data.description || undefined,
      })

      reset()
      onOpenChange(false)
      router.push(`/lists/${list.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create list")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>
            Create a new list for your family. Choose from shopping, packing,
            wishlist, or custom.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Weekly Groceries"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setValue("type", value as ListType)}
            >
              <SelectTrigger>
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
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add details about this list..."
              {...register("description")}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createList.isPending}>
              {createList.isPending ? "Creating..." : "Create List"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
