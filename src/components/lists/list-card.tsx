"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ListTypeBadge } from "./list-type-badge"
import type { ListSummary } from "@/hooks/lists"

interface ListCardProps {
  list: ListSummary
}

export function ListCard({ list }: ListCardProps) {
  return (
    <Link href={`/lists/${list.id}`} className="block">
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1">{list.title}</CardTitle>
            <ListTypeBadge type={list.type} />
          </div>
          {list.description && (
            <CardDescription className="line-clamp-2">
              {list.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{list.itemCount} items</span>
            <span>•</span>
            <span>by {list.createdBy.displayName}</span>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Updated {formatRelativeDate(list.updatedAt)}
        </CardFooter>
      </Card>
    </Link>
  )
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}
