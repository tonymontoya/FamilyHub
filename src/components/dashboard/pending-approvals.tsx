"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Star, Loader2, User, Clock } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

interface PendingApprovalsProps {
  approvals: PendingApproval[]
  onUpdate: () => void
}

export function PendingApprovals({ approvals, onUpdate }: PendingApprovalsProps) {
  const router = useRouter()
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false)
  const [customPoints, setCustomPoints] = useState<string>("")
  const [approvalNotes, setApprovalNotes] = useState("")
  const [declineReason, setDeclineReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)

  const handleApproveClick = (approval: PendingApproval) => {
    setSelectedApproval(approval)
    setCustomPoints(approval.points.toString())
    setApprovalNotes("")
    setIsApproveDialogOpen(true)
  }

  const handleDeclineClick = (approval: PendingApproval) => {
    setSelectedApproval(approval)
    setDeclineReason("")
    setIsDeclineDialogOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedApproval || isSubmitting) return

    const points = parseInt(customPoints, 10)
    if (isNaN(points) || points < 0 || points > 100) {
      toast.error("Points must be between 0 and 100")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/completions/${selectedApproval.id}/approve`,
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
        throw new Error(error.error || "Failed to approve")
      }

      const result = await response.json()
      toast.success(
        `Approved! ${result.child.displayName} earned ${result.pointsAwarded} points.`
      )

      setIsApproveDialogOpen(false)
      setSelectedApproval(null)
      onUpdate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async () => {
    if (!selectedApproval || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/completions/${selectedApproval.id}/decline`,
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
        throw new Error(error.error || "Failed to decline")
      }

      toast.success("Completion declined")

      setIsDeclineDialogOpen(false)
      setSelectedApproval(null)
      onUpdate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to decline"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (approvals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No completions waiting for approval.
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
            <Clock className="h-5 w-5" />
            Pending Approvals
            <Badge variant="secondary">{approvals.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{approval.choreTitle}</span>
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3" />
                      {approval.points}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <User className="h-3 w-3" />
                    {approval.childName}
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    {formatTime(approval.completedAt)}
                  </div>
                </div>
              </div>

              {approval.notes && (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  &ldquo;{approval.notes}&rdquo;
                </p>
              )}

              {approval.photoUrl && (
                <div
                  className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => setEnlargedPhoto(approval.photoUrl)}
                >
                  <img
                    src={approval.photoUrl}
                    alt="Completion"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApproveClick(approval)}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeclineClick(approval)}
                >
                  <X className="mr-1 h-4 w-4" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Completion</DialogTitle>
            <DialogDescription>
              Approve {selectedApproval?.childName}&apos;s completion of &quot;
              {selectedApproval?.choreTitle}&quot;
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Great job!"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Approve
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
              Decline {selectedApproval?.childName}&apos;s completion of &quot;
              {selectedApproval?.choreTitle}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Please try again..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          {enlargedPhoto && (
            <img
              src={enlargedPhoto}
              alt="Completion"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
