"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit, Archive, Calendar, User, Star, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { rrulestr } from "rrule"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { SkeletonChore } from "@/components/ui/skeleton-card"

interface Chore {
  id: string
  title: string
  description: string | null
  points: number
  recurrenceRule: string | null
  assigneeId: string | null
  assignee: {
    id: string
    displayName: string
  } | null
  status: string
  createdAt: string
}

// Get human-readable recurrence text
function getRecurrenceText(rruleString: string | null): string {
  if (!rruleString) return "One-time"
  
  try {
    const rule = rrulestr(rruleString)
    return rule.toText()
  } catch {
    return "Custom schedule"
  }
}

export default function ChoresPage() {
  const router = useRouter()
  const [chores, setChores] = useState<Chore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [choreToArchive, setChoreToArchive] = useState<Chore | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)

  const fetchChores = async () => {
    try {
      const response = await fetch("/api/chores")
      if (!response.ok) {
        throw new Error("Failed to fetch chores")
      }
      const data = await response.json()
      setChores(data.chores)
    } catch {
      toast.error("Failed to load chores")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChores()
  }, [])

  const handleArchive = async () => {
    if (!choreToArchive) return

    setIsArchiving(true)

    try {
      const response = await fetch(`/api/chores/${choreToArchive.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || "Failed to archive chore")
        return
      }

      toast.success("Chore archived")
      setChoreToArchive(null)
      fetchChores()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsArchiving(false)
    }
  }

  if (isLoading) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Chores</h1>
              <p className="text-muted-foreground">
                Manage recurring chores and assignments
              </p>
            </div>
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Chore
            </Button>
          </div>
          <div className="space-y-4">
            <SkeletonChore />
            <SkeletonChore />
            <SkeletonChore />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chores</h1>
            <p className="text-muted-foreground">
              Manage recurring chores and assignments
            </p>
          </div>
          <Button onClick={() => router.push("/chores/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Chore
          </Button>
        </div>

        {chores.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-6 rounded-full bg-primary/10 p-6">
                <ClipboardList className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No chores yet</h3>
              <p className="mb-8 max-w-sm text-center text-muted-foreground leading-relaxed">
                Create your first chore to start tracking tasks for your family. 
                Assign points to motivate your children!
              </p>
              <Button size="lg" onClick={() => router.push("/chores/new")}>
                <Plus className="mr-2 h-5 w-5" />
                Create First Chore
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {chores.map((chore) => (
              <Card key={chore.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{chore.title}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <Star className="h-3 w-3" />
                          {chore.points} pts
                        </span>
                      </div>
                      
                      {chore.description && (
                        <p className="mb-3 text-sm text-muted-foreground">
                          {chore.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{getRecurrenceText(chore.recurrenceRule)}</span>
                        </div>
                        
                        {chore.assignee && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Assigned to {chore.assignee.displayName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/chores/${chore.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChoreToArchive(chore)}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!choreToArchive} onOpenChange={() => setChoreToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Chore?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive &quot;{choreToArchive?.title}&quot;. It will no longer appear
              in active chores but historical completions will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isArchiving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
