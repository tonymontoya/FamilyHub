"use client"

import { useState } from "react"
import { CheckCircle2, Clock, Star, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CompleteChoreDialog } from "@/components/chores/complete-chore-dialog"

interface Chore {
  id: string
  title: string
  points: number
  assigneeId: string | null
  assigneeName: string | null
  status: "TODO" | "PENDING" | "APPROVED" | "DECLINED"
  completedBy: string | null
  completedByName: string | null
}

interface TodayChoresProps {
  chores: Chore[]
  userRole: "PARENT" | "CHILD"
  userId: string
  onComplete: () => void
}

export function TodayChores({
  chores,
  userRole,
  userId,
  onComplete,
}: TodayChoresProps) {
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCompleteClick = (chore: Chore) => {
    setSelectedChore(chore)
    setIsDialogOpen(true)
  }

  const todoChores = chores.filter((c) => c.status === "TODO")
  const pendingChores = chores.filter((c) => c.status === "PENDING")
  const approvedChores = chores.filter((c) => c.status === "APPROVED")
  const declinedChores = chores.filter((c) => c.status === "DECLINED")

  const getStatusBadge = (status: Chore["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "DECLINED":
        return (
          <Badge variant="destructive" className="gap-1">
            Declined
          </Badge>
        )
      default:
        return null
    }
  }

  if (chores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Chores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
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
            <Badge variant="secondary">{chores.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* To Do Section */}
          {todoChores.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                To Do
              </h3>
              {todoChores.map((chore) => (
                <div
                  key={chore.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{chore.title}</span>
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3" />
                        {chore.points}
                      </Badge>
                    </div>
                    {userRole === "PARENT" && chore.assigneeName && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        {chore.assigneeName}
                      </div>
                    )}
                  </div>
                  {(userRole === "PARENT" ||
                    chore.assigneeId === userId ||
                    chore.assigneeId === null) && (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteClick(chore)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pending Section */}
          {pendingChores.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Waiting for Approval
              </h3>
              {pendingChores.map((chore) => (
                <div
                  key={chore.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{chore.title}</span>
                      {getStatusBadge(chore.status)}
                    </div>
                    {chore.completedByName && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Completed by {chore.completedByName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Approved Section */}
          {approvedChores.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Completed
              </h3>
              {approvedChores.map((chore) => (
                <div
                  key={chore.id}
                  className="flex items-center justify-between rounded-lg border bg-green-50 p-3 dark:bg-green-950"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium line-through">
                        {chore.title}
                      </span>
                      {getStatusBadge(chore.status)}
                    </div>
                    {chore.completedByName && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Completed by {chore.completedByName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Declined Section */}
          {declinedChores.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Declined (Try Again)
              </h3>
              {declinedChores.map((chore) => (
                <div
                  key={chore.id}
                  className="flex items-center justify-between rounded-lg border bg-red-50 p-3 dark:bg-red-950"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{chore.title}</span>
                      {getStatusBadge(chore.status)}
                    </div>
                    {(userRole === "PARENT" ||
                      chore.assigneeId === userId ||
                      chore.assigneeId === null) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => handleCompleteClick(chore)}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
          onComplete={onComplete}
        />
      )}
    </>
  )
}
