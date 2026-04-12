"use client"

import { useMemo } from "react"
import { ShoppingBag, Luggage, Gift, List } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { listTemplates, type ListTemplate } from "@/lib/list-templates"
import type { ListType } from "@prisma/client"

interface TemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedType: ListType
  onSelectTemplate: (template: ListTemplate) => void
}

const typeIcons: Record<ListType | "all", typeof ShoppingBag> = {
  SHOPPING: ShoppingBag,
  PACKING: Luggage,
  WISHLIST: Gift,
  CUSTOM: List,
  all: List,
}

export function TemplateSelector({
  open,
  onOpenChange,
  selectedType,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const templates = useMemo(() => {
    return listTemplates.filter(
      (template) => template.type === selectedType
    )
  }, [selectedType])

  const Icon = typeIcons[selectedType]
  const hasTemplates = templates.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Choose a Template
          </DialogTitle>
          <DialogDescription>
            Start with a pre-made list of items for your {selectedType.toLowerCase()} list.
          </DialogDescription>
        </DialogHeader>

        {!hasTemplates ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No templates available for {selectedType.toLowerCase()} lists.</p>
            <p className="text-sm mt-2">Create a custom list instead.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            {/* Start from scratch option */}
            <button
              onClick={() => onOpenChange(false)}
              className="flex flex-col items-start p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left h-full"
            >
              <div className="font-medium mb-1">Start from scratch</div>
              <div className="text-sm text-muted-foreground">
                Create an empty list and add your own items
              </div>
            </button>

            {/* Template options */}
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="flex flex-col items-start p-4 rounded-lg border hover:bg-muted/50 hover:border-primary transition-colors text-left h-full"
              >
                <div className="font-medium mb-1">{template.title}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  {template.description}
                </div>
                <div className="text-xs text-muted-foreground">
                  {template.items.length} items
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
