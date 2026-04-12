"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
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
import { useCreateList, useCreateItem } from "@/hooks/lists"
import type { ListType } from "@prisma/client"
import { TemplateSelector } from "./template-selector"
import type { ListTemplate } from "@/lib/list-templates"

const createListSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100, "Title must be 100 characters or less"),
  type: z.enum(["SHOPPING", "PACKING", "WISHLIST", "CUSTOM"]),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
})

type CreateListFormData = z.infer<typeof createListSchema>

interface CreateListFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateListForm({ open, onOpenChange }: CreateListFormProps) {
  const router = useRouter()
  const createList = useCreateList()
  const createItem = useCreateItem()
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<CreateListFormData | null>(null)

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

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      reset()
      setPendingFormData(null)
    }
    onOpenChange(newOpen)
  }, [isSubmitting, onOpenChange, reset])

  const createListWithItems = useCallback(async (
    formData: CreateListFormData,
    template: ListTemplate | null
  ) => {
    try {
      // Create the list
      const list = await createList.mutateAsync({
        title: formData.title,
        type: formData.type as ListType,
        description: formData.description || undefined,
      })

      // Add template items if selected
      if (template) {
        let addedCount = 0
        for (const item of template.items) {
          try {
            await createItem.mutateAsync({
              listId: list.id,
              input: {
                name: item.name,
                quantity: item.quantity || 1,
                notes: item.notes,
              },
            })
            addedCount++
          } catch {
            // Continue adding other items if one fails
          }
        }
        toast.success("List created", {
          description: `Created "${formData.title}" with ${addedCount} items`,
        })
      } else {
        toast.success("List created", {
          description: `"${formData.title}" has been created`,
        })
      }

      reset()
      setPendingFormData(null)
      onOpenChange(false)
      router.push(`/lists/${list.id}`)
    } catch (error) {
      toast.error("Failed to create list", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    }
  }, [createList, createItem, onOpenChange, reset, router])

  const onSubmit = useCallback(async (data: CreateListFormData) => {
    // For template-eligible types, show template selector first
    const templateTypes: ListType[] = ["SHOPPING", "PACKING", "WISHLIST"]
    if (templateTypes.includes(data.type)) {
      setPendingFormData(data)
      setShowTemplateSelector(true)
      return
    }

    // For CUSTOM type, create immediately without template
    await createListWithItems(data, null)
  }, [createListWithItems])

  const handleSelectTemplate = useCallback((template: ListTemplate) => {
    setShowTemplateSelector(false)
    
    // Continue with list creation using the template
    if (pendingFormData) {
      createListWithItems(pendingFormData, template)
    }
  }, [createListWithItems, pendingFormData])

  const handleSkipTemplate = useCallback(() => {
    setShowTemplateSelector(false)
    
    // Create list without template
    if (pendingFormData) {
      createListWithItems(pendingFormData, null)
    }
  }, [createListWithItems, pendingFormData])

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Weekly Groceries"
                {...register("title")}
                aria-invalid={errors.title ? "true" : "false"}
                aria-describedby={errors.title ? "title-error" : undefined}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-destructive" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue("type", value as ListType)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="type">
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
                {isSubmitting ? "Creating..." : "Create List"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        selectedType={type as ListType}
        onSelectTemplate={handleSelectTemplate}
        onSkipTemplate={handleSkipTemplate}
      />
    </>
  )
}
