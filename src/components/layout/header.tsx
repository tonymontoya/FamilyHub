"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { NavUser } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { UserMenu } from "./user-menu"
import { NotificationBell } from "./notification-bell"

interface HeaderProps {
  user: NavUser
  initialNotificationCount: number
  onMenuToggle: () => void
}

export function Header({ user, initialNotificationCount, onMenuToggle }: HeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 font-bold text-base sm:text-lg"
            aria-label="Family Hub Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              FH
            </div>
            <span className="hidden xs:inline sm:hidden md:inline">Family Hub</span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notifications - hidden for children if no pending */}
          {user.role === "PARENT" && (
            <NotificationBell initialCount={initialNotificationCount} />
          )}

          {/* User menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
