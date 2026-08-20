"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Star, Loader2, User, Calendar, ImageIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

interface PendingCompletion {
  id: string
  choreId: string
  choreTitle: string
  memberId: string
  memberName: string
  completedAt: string
  photoUrl: string | null
  notes: string | null
  points: number
}

export default function ApprovalsPage() {
  const router = useRouter()
  const [completions, setCompletions] = useState<PendingCompletion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCompletion, setSelectedCompletion] = useState<PendingCompletion | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false)
  const [customPoints, setCustomPoints] = useState<string>("")
  const [approvalNotes, setApprovalNotes] = useState("")
  const [declineReason, setDeclineReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)

  const fetchPendingCompletions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/completions?status=PENDING")

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        if (response.status === 403) {
          router.push("/dashboard")
          return
        }
        throw new Error("Failed to fetch pending completions")
      }

      const body = await response.json()
      setCompletions(body.data.completions)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load completions"
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingCompletions()
  }, [])

  const handleApproveClick = (completion: PendingCompletion) => {
    setSelectedCompletion(completion)
    setCustomPoints(completion.points.toString())
    setApprovalNotes("")
    setIsApproveDialogOpen(true)
  }

  const handleDeclineClick = (completion: PendingCompletion) => {
    setSelectedCompletion(completion)
    setDeclineReason("")
    setIsDeclineDialogOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedCompletion || isSubmitting) return

    const points = parseInt(customPoints, 10)
    if (isNaN(points) || points < 0 || points > 100) {
      toast.error("Points must be between 0 and 100")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/completions/${selectedCompletion.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            points,
            notes: approvalNotes.trim() || undefined,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to approve completion")
      }

      const result = await response.json()
      toast.success(
        `Approved! ${result.data.child.displayName} earned ${result.data.pointsAwarded} points.`
      )

      setIsApproveDialogOpen(false)
      setSelectedCompletion(null)
      fetchPendingCompletions()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve completion"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async () => {
    if (!selectedCompletion || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/completions/${selectedCompletion.id}/decline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: declineReason.trim() || undefined,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to decline completion")
      }

      toast.success("Completion declined")

      setIsDeclineDialogOpen(false)
      setSelectedCompletion(null)
      fetchPendingCompletions()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to decline completion"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Approve Completions
          </h1>
          <p className="text-muted-foreground">
            Review and approve chore completions from your children
          </p>
        </div>

        {completions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Check className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-medium">All caught up!</h3>
              <p className="text-center text-muted-foreground">
                No pending completions to review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {completions.map((completion) => (
              <Card key={completion.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    {/* Photo */}
                    {completion.photoUrl ? (
                      <div
                        className="relative h-32 w-32 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => setEnlargedPhoto(completion.photoUrl)}
                      >
                        <img
                          src={completion.photoUrl}
                          alt="Completion photo"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                          <ImageIcon className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {completion.choreTitle}
                        </h3>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <Star className="h-3 w-3" />
                          {completion.points} pts
                        </span>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{completion.memberName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(completion.completedAt)}</span>
                        </div>
                      </div>

                      {completion.notes && (
                        <div className="mb-4 rounded-lg bg-muted p-3">
                          <p className="text-sm text-muted-foreground">
                            &ldquo;{completion.notes}&rdquo;
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveClick(completion)}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineClick(completion)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Completion</DialogTitle>
            <DialogDescription>
              Approve {selectedCompletion?.memberName}&apos;s completion of &quot;
              {selectedCompletion?.choreTitle}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points to Award</Label>
              <Input
                id="points"
                type="number"
                min={0}
                max={100}
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Default is {selectedCompletion?.points} points
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvalNotes">Notes (optional)</Label>
              <Textarea
                id="approvalNotes"
                placeholder="Great job! Keep it up..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Completion</DialogTitle>
            <DialogDescription>
              Decline {selectedCompletion?.memberName}&apos;s completion of &quot;
              {selectedCompletion?.choreTitle}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="declineReason">Reason (optional)</Label>
              <Textarea
                id="declineReason"
                placeholder="Please try again and make sure to..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeclineDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Decline
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enlarged Photo Dialog */}
      <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          {enlargedPhoto && (
            <img
              src={enlargedPhoto}
              alt="Completion photo"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
