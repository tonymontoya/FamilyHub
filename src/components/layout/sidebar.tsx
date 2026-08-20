"use client"

import { useState, useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { getNavItems, isNavItemActive, isNavSectionActive, type NavItem } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  userRole: "PARENT" | "CHILD"
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export function Sidebar({ userRole, collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const navItems = useMemo(() => getNavItems(userRole), [userRole])

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] border-r bg-background motion-safe:transition-all motion-safe:duration-200 md:flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
        aria-label="Main navigation"
      >
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse toggle */}
        <div className="border-t p-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
                  onClick={() => onCollapse(!collapsed)}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                />
              }
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}

interface SidebarNavItemProps {
  item: NavItem
  pathname: string
  collapsed: boolean
}

function SidebarNavItem({ item, pathname, collapsed }: SidebarNavItemProps) {
  const [isExpanded, setIsExpanded] = useState(() =>
    isNavSectionActive(item, pathname)
  )
  const isActive = isNavItemActive(item.href, pathname)
  const hasChildren = item.children && item.children.length > 0
  const Icon = item.icon

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Link
            href={item.href}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
          >
            <Icon className="h-5 w-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="space-y-1">
      {hasChildren ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive || isNavSectionActive(item, pathname)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      ) : (
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon className="h-5 w-5" />
          <span>{item.label}</span>
        </Link>
      )}

      {/* Child items */}
      {hasChildren && isExpanded && (
        <div className="ml-4 space-y-1 border-l pl-3">
          {item.children!.map((child) => {
            const isChildActive = isNavItemActive(child.href, pathname)
            const ChildIcon = child.icon
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isChildActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-current={isChildActive ? "page" : undefined}
              >
                <ChildIcon className="h-4 w-4" />
                <span>{child.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
