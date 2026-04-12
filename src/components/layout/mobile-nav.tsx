"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getNavItems, isNavItemActive, type NavItem } from "@/lib/navigation"
import { Badge } from "@/components/ui/badge"

interface MobileNavProps {
  userRole: "PARENT" | "CHILD"
}

// Maximum visible items on mobile (design constraint)
const MAX_VISIBLE_ITEMS = 5

export function MobileNav({ userRole }: MobileNavProps) {
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
          />
        ))}
      </div>
    </nav>
  )
}

interface MobileNavItemProps {
  item: NavItem
  pathname: string
}

function MobileNavItem({ item, pathname }: MobileNavItemProps) {
  const isActive = isNavItemActive(item.href, pathname)
  const Icon = item.icon

  // Mock badge values - would come from API in real implementation
  const getBadgeCount = () => {
    if (item.badge === "pendingApprovals") return 0 // Would come from props
    if (item.badge === "overdueTodos") return 0 // Placeholder for #9
    return 0
  }

  const badgeCount = getBadgeCount()
  const showBadge = badgeCount > 0

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] rounded-lg transition-colors",
        "active:scale-95", // Touch feedback
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
            {badgeCount > 9 ? "9+" : badgeCount}
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
