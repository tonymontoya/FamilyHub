"use client"

import { useEffect, useState } from "react"
import { Star, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CompleteChoreDialog } from "./complete-chore-dialog"

interface TodayChore {
  id: string
  title: string
  description: string | null
  points: number
  assigneeId: string | null
  assigneeName: string | null
  scheduledFor: string
  completed: boolean
  completionStatus?: "PENDING" | "APPROVED" | "DECLINED"
}

interface TodayChoresResponse {
  chores: TodayChore[]
  meta?: {
    date: string
    timezone: string
    invalidRules?: Array<{ choreId: string; error: string }>
  }
}

export function TodayChores() {
  const [chores, setChores] = useState<TodayChore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChore, setSelectedChore] = useState<TodayChore | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchTodayChores = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      const response = await fetch(
        `/api/chores/today?timezone=${encodeURIComponent(timezone)}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch today's chores")
      }

      const data: TodayChoresResponse = await response.json()
      setChores(data.chores)

      // Warn about invalid rules in development
      if (data.meta?.invalidRules && data.meta.invalidRules.length > 0) {
        console.warn("Chores with invalid recurrence rules:", data.meta.invalidRules)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load today's chores"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayChores()
  }, [])

  const handleCompleteClick = (chore: TodayChore) => {
    setSelectedChore(chore)
    setIsDialogOpen(true)
  }

  const handleCompleteSuccess = () => {
    fetchTodayChores()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-destructive">{error}</p>
          <button
            onClick={fetchTodayChores}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground block mx-auto"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  if (chores.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">
            No chores scheduled for today. Enjoy your free time!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Today&apos;s Chores
            <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-normal text-muted-foreground">
              {chores.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chores.map((chore) => (
              <div
                key={chore.id}
                className={`flex items-start justify-between rounded-lg border p-3 ${
                  chore.completed ? "bg-muted/50" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4
                      className={`font-medium ${
                        chore.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {chore.title}
                    </h4>
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />
                      {chore.points}
                    </span>
                  </div>

                  {chore.description && (
                    <p
                      className={`mb-1 text-sm text-muted-foreground ${
                        chore.completed ? "line-through" : ""
                      }`}
                    >
                      {chore.description}
                    </p>
                  )}

                  {chore.assigneeName && (
                    <p className="text-xs text-muted-foreground">
                      Assigned to: {chore.assigneeName}
                    </p>
                  )}
                </div>

                <div className="ml-4">
                  {chore.completed ? (
                    <div className="flex flex-col items-end gap-1">
                      {chore.completionStatus === "PENDING" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <Loader2 className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                      {chore.completionStatus === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Approved
                        </span>
                      )}
                      {chore.completionStatus === "DECLINED" && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                          Declined
                        </span>
                      )}
                      {!chore.completionStatus && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          Completed
                        </span>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteClick(chore)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedChore && (
        <CompleteChoreDialog
          chore={{
            id: selectedChore.id,
            title: selectedChore.title,
            points: selectedChore.points,
          }}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onComplete={handleCompleteSuccess}
        />
      )}
    </>
  )
}
