// Shared types used across the application

/**
 * User type for navigation and UI components
 * Derived from Member + Session data
 */
export interface NavUser {
  id: string
  name: string
  role: "PARENT" | "CHILD"
  email: string | null
  image: string | null
}

/**
 * Notification types for badge counts
 */
export type NotificationType =
  | "pendingApprovals"
  | "pendingCompletions"

/**
 * Route configuration for navigation
 */
export interface RouteConfig {
  href: string
  label: string
  requiresAuth: boolean
  allowedRoles?: ("PARENT" | "CHILD")[]
}
