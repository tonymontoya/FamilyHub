"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, Loader2 } from "lucide-react"

interface WelcomeHeaderProps {
  displayName: string
  role: "PARENT" | "CHILD"
  isStale: boolean
  isError: boolean
  isRefreshing: boolean
  onRefresh: () => void
}

export function WelcomeHeader({
  displayName,
  role,
  isStale,
  isError,
  isRefreshing,
  onRefresh,
}: WelcomeHeaderProps) {
  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}, {displayName}!
        </h1>
        <p className="text-muted-foreground">
          {role === "PARENT"
            ? "Here's what's happening with your family today."
            : "Here are your chores for today."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isError && (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Update failed</span>
          </div>
        )}
        {isStale && !isError && (
          <div className="text-sm text-muted-foreground">Data may be stale</div>
        )}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
