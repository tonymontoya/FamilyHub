"use client"

import { useEffect, useState } from "react"
import { Check, Star, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TodayChore {
  id: string
  title: string
  description: string | null
  points: number
  assigneeId: string | null
  assigneeName: string | null
  scheduledFor: string
  completed: boolean
}

export function TodayChores() {
  const [chores, setChores] = useState<TodayChore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [completingChore, setCompletingChore] = useState<string | null>(null)

  const fetchTodayChores = async () => {
    try {
      const response = await fetch("/api/chores/today")
      if (!response.ok) {
        throw new Error("Failed to fetch today's chores")
      }
      const data = await response.json()
      setChores(data.chores)
    } catch {
      toast.error("Failed to load today's chores")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayChores()
  }, [])

  const handleComplete = async (choreId: string) => {
    setCompletingChore(choreId)

    try {
      const response = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choreId,
          completedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || "Failed to complete chore")
        return
      }

      toast.success("Chore marked as complete!")
      // Refresh the list
      fetchTodayChores()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setCompletingChore(null)
    }
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
                chore.completed ? "bg-muted/50 opacity-60" : ""
              }`}
            >
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h4 className={`font-medium ${chore.completed ? "line-through" : ""}`}>
                    {chore.title}
                  </h4>
                  <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Star className="h-3 w-3" />
                    {chore.points}
                  </span>
                </div>
                
                {chore.description && (
                  <p className={`mb-1 text-sm text-muted-foreground ${chore.completed ? "line-through" : ""}`}>
                    {chore.description}
                  </p>
                )}

                {chore.assigneeName && (
                  <p className="text-xs text-muted-foreground">
                    Assigned to: {chore.assigneeName}
                  </p>
                )}
              </div>

              {!chore.completed && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleComplete(chore.id)}
                  disabled={completingChore === chore.id}
                >
                  {completingChore === chore.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Done
                    </>
                  )}
                </Button>
              )}

              {chore.completed && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                  Completed
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
