"use client"

import { useDashboard, DashboardData } from "@/hooks/use-dashboard"
import { WelcomeHeader } from "@/components/dashboard/welcome-header"
import { TodayChores } from "@/components/dashboard/today-chores"
import { PointsCard } from "@/components/dashboard/points-card"
import { PendingApprovals } from "@/components/dashboard/pending-approvals"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"

// Error Fallback Component
function DashboardErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Something unexpected happened in the dashboard.
              <br />
              <span className="text-sm text-destructive">{error instanceof Error ? error.message : "Unknown error"}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              <Button onClick={resetErrorBoundary}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function DashboardContent() {
  const router = useRouter()
  const { data, isLoading, isError, error, isStale, isRefreshing, refresh } = useDashboard({
    pollInterval: 30000, // 30 seconds
  })

  // Handle loading state
  if (isLoading && !data) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Stats Row Skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>

          {/* Content Skeleton */}
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </main>
    )
  }

  // Handle error state (but we might have stale data)
  if (isError && !data) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Failed to load dashboard
              </h2>
              <p className="text-muted-foreground text-center mb-4">
                {error?.message || "Something went wrong"}
              </p>
              <Button onClick={refresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!data) return null

  const isParent = data.user.role === "PARENT"

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Welcome Header */}
        <WelcomeHeader
          displayName={data.user.displayName}
          role={data.user.role}
          isStale={isStale}
          isError={isError}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
        />

        {/* Quick Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Points Card */}
          <PointsCard userRole={data.user.role} points={data.points} />

          {/* Quick Stats for Parent */}
          {isParent && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Today&apos;s Chores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {data.today.chores.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.today.chores.filter((c) => c.status === "TODO").length} remaining
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {data.today.pendingApprovals?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.today.pendingApprovals && data.today.pendingApprovals.length > 0
                      ? "Need your review"
                      : "All caught up!"}
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Quick Stats for Child */}
          {!isParent && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    My Chores Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {data.today.chores.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.today.chores.filter((c) => c.status === "TODO").length} to do
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Waiting for Approval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {data.today.chores.filter((c) => c.status === "PENDING").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.today.chores.filter((c) => c.status === "PENDING").length > 0
                      ? "Parent review"
                      : "All done!"}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Today's Chores */}
          <TodayChores
            chores={data.today.chores}
            userRole={data.user.role}
            userId={data.user.id}
            onComplete={refresh}
          />

          {/* Parent: Pending Approvals */}
          {isParent && data.today.pendingApprovals && (
            <PendingApprovals
              approvals={data.today.pendingApprovals}
              onUpdate={refresh}
            />
          )}

          {/* Child: Encouragement Card */}
          {!isParent && (
            <Card>
              <CardHeader>
                <CardTitle>💡 Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Complete your chores to earn points! Each chore is worth points
                  that you can save up. Check back here to see your progress.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" onClick={() => router.push("/chores")}>
                    View All Chores
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground">
          Last updated: {new Date(data.meta.lastUpdated).toLocaleTimeString()}
          {isStale && " (stale data - refresh to update)"}
        </div>
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <ErrorBoundary FallbackComponent={DashboardErrorFallback}>
      <DashboardContent />
    </ErrorBoundary>
  )
}
