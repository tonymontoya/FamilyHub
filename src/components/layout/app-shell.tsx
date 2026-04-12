"use client"

import { useState } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { MobileNav } from "./mobile-nav"

interface User {
  id: string
  name: string
  role: "PARENT" | "CHILD"
  email: string | null
  image: string | null
}

interface AppShellProps {
  children: React.ReactNode
  user: User
  initialNotificationCount: number
}

export function AppShell({ children, user, initialNotificationCount }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
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
          transition-all duration-200 ease-in-out
          pt-16 pb-20 md:pb-0
          md:ml-16 lg:ml-64
          min-h-screen
        `}
      >
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>

      {/* Mobile navigation - bottom fixed */}
      <MobileNav userRole={user.role} />
    </div>
  )
}
