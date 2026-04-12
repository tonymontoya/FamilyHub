"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDashboard } from "@/hooks/use-dashboard"

interface NotificationBellProps {
  initialCount: number
}

export function NotificationBell({ initialCount }: NotificationBellProps) {
  const router = useRouter()
  const [hasError, setHasError] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { data, isError } = useDashboard({
    pollInterval: 30000,
    enabled: true,
  })

  // Use dashboard data for pending approvals count
  const pendingCount = data?.today?.pendingApprovals?.length ?? initialCount

  // Track error state
  useEffect(() => {
    if (isError) setHasError(true)
  }, [isError])

  // Show "!" if there was an error loading counts
  const displayCount = hasError ? "!" : pendingCount > 9 ? "9+" : pendingCount
  const showBadge = pendingCount > 0 || hasError

  const handleNavigate = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${pendingCount > 0 ? `, ${pendingCount} pending` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {showBadge && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-medium",
                hasError
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {displayCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {pendingCount > 0 ? (
          <>
            <DropdownMenuItem 
              className="cursor-pointer flex flex-col items-start"
              onClick={() => handleNavigate("/family/approvals")}
            >
              <span className="font-medium">Pending Approvals</span>
              <span className="text-sm text-muted-foreground">
                {pendingCount} chore{pendingCount !== 1 ? "s" : ""} waiting for your review
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer justify-center text-primary"
              onClick={() => handleNavigate("/family/approvals")}
            >
              View all approvals
            </DropdownMenuItem>
          </>
        ) : hasError ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            <p className="text-destructive font-medium mb-1">Unable to load notifications</p>
            <p>Will retry automatically</p>
          </div>
        ) : (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
