"use client"

import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Luggage, Gift, List } from "lucide-react"
import type { ListType } from "@prisma/client"

interface ListTypeBadgeProps {
  type: ListType
}

const typeConfig: Record<
  ListType,
  { label: string; icon: typeof ShoppingBag; variant: "default" | "secondary" | "outline" }
> = {
  SHOPPING: {
    label: "Shopping",
    icon: ShoppingBag,
    variant: "default",
  },
  PACKING: {
    label: "Packing",
    icon: Luggage,
    variant: "secondary",
  },
  WISHLIST: {
    label: "Wishlist",
    icon: Gift,
    variant: "outline",
  },
  CUSTOM: {
    label: "Custom",
    icon: List,
    variant: "outline",
  },
}

export function ListTypeBadge({ type }: ListTypeBadgeProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
