"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"

// Shared types for dashboard - exported to avoid duplication
export interface DashboardChore {
  id: string
  title: string
  points: number
  assigneeId: string | null
  assigneeName: string | null
  status: "TODO" | "PENDING" | "APPROVED" | "DECLINED"
  completedBy: string | null
  completedByName: string | null
}

export interface PendingApproval {
  id: string
  choreId: string
  choreTitle: string
  childId: string
  childName: string
  completedAt: string
  photoUrl: string | null
  notes: string | null
  points: number
}

export interface ChildPoints {
  id: string
  name: string
  total: number
  thisWeek: number
}

export interface DashboardData {
  user: {
    id: string
    role: "PARENT" | "CHILD"
    displayName: string
  }
  today: {
    date: string
    chores: DashboardChore[]
    pendingApprovals?: PendingApproval[]
  }
  points: {
    children?: ChildPoints[]
    total?: number
    thisWeek?: number
    weeklyGoal?: number
  }
  meta: {
    lastUpdated: string
    timezone: string
  }
}

interface UseDashboardOptions {
  pollInterval?: number // milliseconds, default: 30000 (30s)
  enabled?: boolean // default: true
  staleThreshold?: number // milliseconds, default: 60000 (1 minute)
}

interface UseDashboardReturn {
  data: DashboardData | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  lastUpdated: Date | null
  isStale: boolean
  refresh: () => void
  isRefreshing: boolean
}

// Configuration constants
const DEFAULT_POLL_INTERVAL = 30000 // 30 seconds
const DEFAULT_STALE_THRESHOLD = 60000 // 1 minute
const STORAGE_KEY = "dashboard_cache"
const STORAGE_MAX_AGE = 5 * 60 * 1000 // 5 minutes

/**
 * Load cached dashboard data from sessionStorage
 */
function loadCachedData(): DashboardData | null {
  if (typeof window === "undefined") return null
  
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    const age = Date.now() - timestamp
    
    // Only use if less than 5 minutes old
    if (age < STORAGE_MAX_AGE) {
      return data
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

/**
 * Save dashboard data to sessionStorage
 */
function saveCachedData(data: DashboardData): void {
  if (typeof window === "undefined") return
  
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    )
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

export function useDashboard(
  options: UseDashboardOptions = {}
): UseDashboardReturn {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    enabled = true,
    staleThreshold = DEFAULT_STALE_THRESHOLD,
  } = options

  // Initialize with cached data for immediate hydration
  const [data, setData] = useState<DashboardData | null>(() => loadCachedData())
  const [isLoading, setIsLoading] = useState(!loadCachedData())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)

  // Use refs to track state without triggering re-renders
  const retryCountRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Clear all pending timeouts and intervals
   */
  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (visibilityTimeoutRef.current) {
      clearTimeout(visibilityTimeoutRef.current)
      visibilityTimeoutRef.current = null
    }
  }, [])

  // Use ref to track if we have data without causing dependency changes
  const hasDataRef = useRef(!!data)
  useEffect(() => {
    hasDataRef.current = !!data
  }, [data])

  /**
   * Main fetch function
   */
  const fetchDashboard = useCallback(
    async (isManual = false) => {
      if (!enabled) return

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      try {
        // Show loading state (refreshing for manual, loading for initial)
        if (isManual) {
          setIsRefreshing(true)
        } else if (!hasDataRef.current) {
          setIsLoading(true)
        }

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const response = await fetch(
          `/api/dashboard?timezone=${encodeURIComponent(timezone)}`,
          { signal: abortControllerRef.current.signal }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || "Failed to fetch dashboard")
        }

        const body = await response.json()
        const newData: DashboardData = body.data
        setData(newData)
        saveCachedData(newData)
        setLastUpdated(new Date())
        setIsError(false)
        setError(null)
        setIsStale(false)
        retryCountRef.current = 0
      } catch (err) {
        // Don't set error if it was an abort
        if (err instanceof Error && err.name === "AbortError") {
          return
        }

        console.error("Dashboard fetch error:", err)
        setIsError(true)
        setError(err instanceof Error ? err : new Error("Unknown error"))

        // Retry with exponential backoff (max 3 retries)
        retryCountRef.current++
        if (retryCountRef.current <= 3) {
          const backoffDelay = Math.min(
            5000 * Math.pow(2, retryCountRef.current - 1),
            30000
          )
          visibilityTimeoutRef.current = setTimeout(() => {
            fetchDashboard()
          }, backoffDelay)
        }
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled]
  )

  /**
   * Manual refresh with debounce
   */
  const refresh = useCallback(() => {
    if (isRefreshing) return // Prevent double-clicks
    fetchDashboard(true)
  }, [fetchDashboard, isRefreshing])

  /**
   * Setup polling and visibility handling
   */
  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchDashboard()

    // Setup polling interval
    intervalRef.current = setInterval(() => {
      fetchDashboard()
    }, pollInterval)

    // Handle visibility changes (pause polling when tab hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - clear interval to save resources
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // Page visible - restore polling
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            fetchDashboard()
          }, pollInterval)
        }
        // Immediate refresh when becoming visible (if stale)
        if (isStale) {
          fetchDashboard()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearAllTimers()
    }
  }, [fetchDashboard, pollInterval, enabled, isStale, clearAllTimers])

  /**
   * Stale data indicator
   */
  useEffect(() => {
    if (!lastUpdated) return

    const checkStale = () => {
      const now = new Date()
      const diff = now.getTime() - lastUpdated.getTime()
      setIsStale(diff > staleThreshold)
    }

    checkStale()
    const intervalId = setInterval(checkStale, 10000)

    return () => clearInterval(intervalId)
  }, [lastUpdated, staleThreshold])

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      data,
      isLoading,
      isError,
      error,
      lastUpdated,
      isStale,
      refresh,
      isRefreshing,
    }),
    [data, isLoading, isError, error, lastUpdated, isStale, refresh, isRefreshing]
  )
}
