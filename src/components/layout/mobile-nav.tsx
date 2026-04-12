"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getNavItems, isNavItemActive, type NavItem } from "@/lib/navigation"
import { Badge } from "@/components/ui/badge"

interface MobileNavProps {
  userRole: "PARENT" | "CHILD"
  initialNotificationCount: number
}

// Maximum visible items on mobile (design constraint)
const MAX_VISIBLE_ITEMS = 5

export function MobileNav({ userRole, initialNotificationCount }: MobileNavProps) {
  const pathname = usePathname()
  const allItems = useMemo(() => getNavItems(userRole), [userRole])

  // Flatten and limit items for mobile
  // Priority: main items first, hide nested children
  const mobileItems = useMemo(() => {
    const items: NavItem[] = []
    for (const item of allItems) {
      if (items.length >= MAX_VISIBLE_ITEMS) break
      items.push(item)
    }
    return items
  }, [allItems])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Mobile navigation"
      data-testid="mobile-nav"
    >
      <div className="flex h-16 items-center justify-around">
        {mobileItems.map((item) => (
          <MobileNavItem
            key={item.href}
            item={item}
            pathname={pathname}
            pendingCount={item.badge === "pendingApprovals" ? initialNotificationCount : 0}
          />
        ))}
      </div>
    </nav>
  )
}

interface MobileNavItemProps {
  item: NavItem
  pathname: string
  pendingCount: number
}

function MobileNavItem({ item, pathname, pendingCount }: MobileNavItemProps) {
  const isActive = isNavItemActive(item.href, pathname)
  const Icon = item.icon

  // Show badge if there are pending items
  const showBadge = pendingCount > 0
  const displayCount = pendingCount > 9 ? "9+" : pendingCount

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] rounded-lg transition-colors",
        "motion-safe:active:scale-95", // Touch feedback (respects reduced motion)
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="relative">
        <Icon
          className={cn(
            "h-6 w-6 transition-all",
            isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
          )}
          aria-hidden="true"
        />
        {showBadge && (
          <Badge
            variant="destructive"
            className="absolute -right-2 -top-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
          >
            {displayCount}
          </Badge>
        )}
      </div>
      <span
        className={cn(
          "text-[10px] font-medium transition-all",
          isActive ? "opacity-100" : "opacity-70"
        )}
      >
        {item.label}
      </span>
    </Link>
  )
}
