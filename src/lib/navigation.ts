import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  List,
  Users,
  Settings,
  Trophy,
  UserCircle,
  ShieldCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: "pendingApprovals" | "pendingCompletions" | "overdueTodos"
  children?: NavItem[]
}

export interface NavConfig {
  parent: NavItem[]
  child: NavItem[]
}

export const navigationConfig: NavConfig = {
  parent: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "pendingApprovals",
    },
    {
      label: "Chores",
      href: "/chores",
      icon: CheckSquare,
    },
    {
      label: "Todos",
      href: "/todos",
      icon: ListTodo,
      badge: "overdueTodos",
    },
    {
      label: "Lists",
      href: "/lists",
      icon: List,
    },
    {
      label: "Family",
      href: "/family",
      icon: Users,
      children: [
        {
          label: "Children",
          href: "/family/children",
          icon: UserCircle,
        },
        {
          label: "Approvals",
          href: "/family/approvals",
          icon: ShieldCheck,
          badge: "pendingApprovals",
        },
      ],
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ],
  child: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Chores",
      href: "/chores",
      icon: CheckSquare,
    },
    {
      label: "My Todos",
      href: "/todos",
      icon: ListTodo,
      badge: "overdueTodos",
    },
    {
      label: "Lists",
      href: "/lists",
      icon: List,
    },
    {
      label: "My Points",
      href: "/dashboard#points",
      icon: Trophy,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ],
}

export function getNavItems(role: "PARENT" | "CHILD"): NavItem[] {
  return navigationConfig[role.toLowerCase() as keyof NavConfig]
}

// Helper to find a nav item by href
export function findNavItem(
  items: NavItem[],
  href: string
): NavItem | undefined {
  for (const item of items) {
    if (item.href === href) return item
    if (item.children) {
      const child = findNavItem(item.children, href)
      if (child) return child
    }
  }
  return undefined
}

// Helper to check if a nav item is active
export function isNavItemActive(
  itemHref: string,
  currentPath: string
): boolean {
  // Exact match
  if (itemHref === currentPath) return true

  // Handle hash links (e.g., /dashboard#points)
  const itemPath = itemHref.split("#")[0]
  if (itemPath === currentPath) return true

  // Section match (for parent routes)
  if (currentPath.startsWith(itemHref + "/")) return true

  // Special case: dashboard is active for root
  if (itemHref === "/dashboard" && currentPath === "/") return true

  return false
}

// Helper to check if any child is active
export function isNavSectionActive(
  item: NavItem,
  currentPath: string
): boolean {
  if (!item.children) return false
  return item.children.some((child) => isNavItemActive(child.href, currentPath))
}
