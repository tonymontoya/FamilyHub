"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface DashboardChore {
  id: string
  title: string
  points: number
  assigneeId: string | null
  assigneeName: string | null
  status: "TODO" | "PENDING" | "APPROVED" | "DECLINED"
  completedBy: string | null
  completedByName: string | null
}

interface PendingApproval {
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

interface ChildPoints {
  id: string
  name: string
  total: number
  thisWeek: number
}

interface DashboardData {
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
}

interface UseDashboardReturn {
  data: DashboardData | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  lastUpdated: Date | null
  isStale: boolean
  refresh: () => void
}

const DEFAULT_POLL_INTERVAL = 30000 // 30 seconds
const STALE_THRESHOLD = 60000 // 1 minute

export function useDashboard(
  options: UseDashboardOptions = {}
): UseDashboardReturn {
  const { pollInterval = DEFAULT_POLL_INTERVAL, enabled = true } = options

  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)

  const retryCountRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const staleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchDashboard = useCallback(
    async (isManual = false) => {
      if (!enabled) return

      try {
        // Only show loading on initial fetch, not on polling refresh
        if (!data || isManual) {
          setIsLoading(true)
        }

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const response = await fetch(
          `/api/dashboard?timezone=${encodeURIComponent(timezone)}`
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch dashboard")
        }

        const newData: DashboardData = await response.json()
        setData(newData)
        setLastUpdated(new Date())
        setIsError(false)
        setError(null)
        setIsStale(false)
        retryCountRef.current = 0
      } catch (err) {
        console.error("Dashboard fetch error:", err)
        setIsError(true)
        setError(err instanceof Error ? err : new Error("Unknown error"))

        // Retry with exponential backoff
        retryCountRef.current++
        if (retryCountRef.current <= 3) {
          const backoffDelay = Math.min(5000 * Math.pow(2, retryCountRef.current - 1), 30000)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          timeoutRef.current = setTimeout(() => {
            fetchDashboard()
          }, backoffDelay)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [enabled, data]
  )

  const refresh = useCallback(() => {
    fetchDashboard(true)
  }, [fetchDashboard])

  // Initial fetch and polling
  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchDashboard()

    // Set up polling
    const intervalId = setInterval(() => {
      fetchDashboard()
    }, pollInterval)

    return () => {
      clearInterval(intervalId)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (staleTimeoutRef.current) {
        clearTimeout(staleTimeoutRef.current)
      }
    }
  }, [fetchDashboard, pollInterval, enabled])

  // Stale data indicator
  useEffect(() => {
    if (!lastUpdated) return

    const checkStale = () => {
      const now = new Date()
      const diff = now.getTime() - lastUpdated.getTime()
      setIsStale(diff > STALE_THRESHOLD)
    }

    // Check immediately
    checkStale()

    // Set up periodic check
    const intervalId = setInterval(checkStale, 10000) // Check every 10 seconds

    return () => clearInterval(intervalId)
  }, [lastUpdated])

  return {
    data,
    isLoading,
    isError,
    error,
    lastUpdated,
    isStale,
    refresh,
  }
}
