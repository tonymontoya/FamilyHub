"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Circle, Star, Camera, Loader2, Trophy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

interface Chore {
  id: string
  title: string
  description: string | null
  points: number
  status: "TODO" | "PENDING" | "APPROVED"
  completedAt?: string
}

interface ChildStats {
  totalPoints: number
  weeklyPoints: number
  completedToday: number
  totalToday: number
}

export default function MyChoresPage() {
  const router = useRouter()
  const [chores, setChores] = useState<Chore[]>([])
  const [stats, setStats] = useState<ChildStats>({
    totalPoints: 0,
    weeklyPoints: 0,
    completedToday: 0,
    totalToday: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null)
  const [notes, setNotes] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const fetchChores = async () => {
    try {
      const response = await fetch("/api/chores/today")
      if (!response.ok) throw new Error("Failed to fetch chores")
      const body = await response.json()
      setChores(body.data.chores)
      setStats(body.data.stats)
    } catch {
      toast.error("Failed to load your chores")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChores()
  }, [])

  const handleComplete = async () => {
    if (!selectedChore) return

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("choreId", selectedChore.id)
      formData.append("notes", notes)
      if (photo) {
        formData.append("photo", photo)
      }

      const response = await fetch("/api/completions", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error?.message || "Failed to complete chore")
        return
      }

      toast.success("Great job! 🎉", {
        description: `You earned ${selectedChore.points} points!`,
      })
      
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
      
      setSelectedChore(null)
      setNotes("")
      setPhoto(null)
      fetchChores()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const todoChores = chores.filter((c) => c.status === "TODO")
  const pendingChores = chores.filter((c) => c.status === "PENDING")
  const completedChores = chores.filter((c) => c.status === "APPROVED")

  if (isLoading) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">My Chores</h1>
          <p className="text-muted-foreground">
            Complete chores to earn points!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
            <CardContent className="p-4 text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-yellow-600">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-2xl font-bold">{stats.totalPoints}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardContent className="p-4 text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-blue-600">
                <Trophy className="h-5 w-5" />
                <span className="text-2xl font-bold">{stats.weeklyPoints}</span>
              </div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Today&apos;s Progress</span>
              <span className="text-sm text-muted-foreground">
                {stats.completedToday} of {stats.totalToday}
              </span>
            </div>
            <Progress 
              value={stats.totalToday > 0 ? (stats.completedToday / stats.totalToday) * 100 : 0} 
              className="h-3"
            />
          </CardContent>
        </Card>

        {/* To Do Section */}
        {todoChores.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">To Do</h2>
            <div className="space-y-3">
              {todoChores.map((chore) => (
                <Card 
                  key={chore.id} 
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => setSelectedChore(chore)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{chore.title}</h3>
                      {chore.description && (
                        <p className="text-sm text-muted-foreground">{chore.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{chore.points}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pending Section */}
        {pendingChores.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Waiting for Approval</h2>
            <div className="space-y-3">
              {pendingChores.map((chore) => (
                <Card key={chore.id} className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                      <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{chore.title}</h3>
                      <p className="text-sm text-yellow-600">Waiting for parent approval...</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{chore.points}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {completedChores.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-semibold">Completed Today</h2>
            <div className="space-y-3">
              {completedChores.map((chore) => (
                <Card key={chore.id} className="border-green-200 bg-green-50/50 dark:bg-green-950/10">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium line-through opacity-70">{chore.title}</h3>
                      <p className="text-sm text-green-600">Approved! +{chore.points} points</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{chore.points}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {chores.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No chores today!</h3>
              <p className="text-center text-muted-foreground">
                Enjoy your free time! Check back tomorrow for new chores.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Complete Chore Dialog */}
        <Dialog open={!!selectedChore} onOpenChange={() => setSelectedChore(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Chore</DialogTitle>
              <DialogDescription>
                {selectedChore?.title} - Earn {selectedChore?.points} points!
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell your parent how you did it..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Photo (optional)</label>
                <div className="mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedChore(null)}>
                Cancel
              </Button>
              <Button onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Complete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Celebration Overlay */}
        {showCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="animate-bounce rounded-full bg-yellow-400 p-8 text-6xl shadow-lg">
              🎉
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
