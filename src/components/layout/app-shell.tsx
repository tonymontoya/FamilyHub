"use client"

import { useState, useEffect } from "react"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { MobileNav } from "./mobile-nav"
import { NavUser } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReminderNotifications } from "@/components/reminder-notifications"

interface AppShellProps {
  children: React.ReactNode
  user: NavUser
  initialNotificationCount: number
}

function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-md w-full border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-center mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button onClick={resetErrorBoundary}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AppShellContent({ children, user, initialNotificationCount }: AppShellProps) {
  // Load sidebar state from localStorage (hydration-safe)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("sidebar-collapsed") === "true"
  })

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <div className="min-h-screen bg-background">
      {/* Global reminder notifications - runs on all pages */}
      <ReminderNotifications />
      
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Header - fixed top */}
      <Header
        user={user}
        initialNotificationCount={initialNotificationCount}
        onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Sidebar - desktop only */}
      <Sidebar
        userRole={user.role}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />

      {/* Main content area */}
      <main
        id="main-content"
        className={`
          motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-in-out
          pt-16 pb-24 md:pb-8
          md:ml-16 lg:ml-64
          min-h-screen
        `}
      >
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>

      {/* Mobile navigation - bottom fixed */}
      <MobileNav 
        userRole={user.role} 
        initialNotificationCount={initialNotificationCount}
      />
    </div>
  )
}

export function AppShell(props: AppShellProps) {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <AppShellContent {...props} />
    </ErrorBoundary>
  )
}
