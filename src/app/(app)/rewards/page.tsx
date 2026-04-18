"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Gift, Edit, Trash2, Star } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Reward {
  id: string
  title: string
  description: string | null
  pointsCost: number
  isActive: boolean
  createdAt: string
}

export default function RewardsPage() {
  const router = useRouter()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [deletingReward, setDeletingReward] = useState<Reward | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pointsCost: 100,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRewards = async () => {
    try {
      const response = await fetch("/api/rewards")
      if (!response.ok) throw new Error("Failed to fetch rewards")
      const data = await response.json()
      setRewards(data.rewards)
      setIsAdmin(data.isAdmin)
    } catch {
      toast.error("Failed to load rewards")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRewards()
  }, [])

  const handleCreate = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || "Failed to create reward")
        return
      }

      toast.success("Reward created!")
      setShowCreateDialog(false)
      setFormData({ title: "", description: "", pointsCost: 100 })
      fetchRewards()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingReward) return
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/rewards/${editingReward.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || "Failed to update reward")
        return
      }

      toast.success("Reward updated!")
      setEditingReward(null)
      fetchRewards()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingReward) return
    
    try {
      const response = await fetch(`/api/rewards/${deletingReward.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || "Failed to delete reward")
        return
      }

      toast.success("Reward deleted")
      setDeletingReward(null)
      fetchRewards()
    } catch {
      toast.error("Something went wrong")
    }
  }

  const openEditDialog = (reward: Reward) => {
    setEditingReward(reward)
    setFormData({
      title: reward.title,
      description: reward.description || "",
      pointsCost: reward.pointsCost,
    })
  }

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
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "Create rewards for your children to redeem with their points"
                : "Redeem your points for awesome rewards!"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reward
            </Button>
          )}
        </div>

        {rewards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Gift className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No rewards yet</h3>
              <p className="mb-6 max-w-sm text-center text-muted-foreground">
                {isAdmin
                  ? "Create your first reward to motivate your children!"
                  : "Ask your parent to set up some rewards you can earn!"}
              </p>
              {isAdmin && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Reward
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{reward.title}</h3>
                        {!reward.isActive && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      {reward.description && (
                        <p className="mb-3 text-sm text-muted-foreground">
                          {reward.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-medium">{reward.pointsCost} points</span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="ml-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(reward)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingReward(reward)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog 
          open={showCreateDialog || !!editingReward} 
          onOpenChange={() => {
            setShowCreateDialog(false)
            setEditingReward(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Edit Reward" : "Create New Reward"}
              </DialogTitle>
              <DialogDescription>
                Set up a reward that children can redeem with their points.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Extra 30 minutes of screen time"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details about the reward..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="points">Points Cost *</Label>
                <Input
                  id="points"
                  type="number"
                  min={1}
                  value={formData.pointsCost}
                  onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingReward(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={editingReward ? handleUpdate : handleCreate}
                disabled={isSubmitting || !formData.title || formData.pointsCost < 1}
              >
                {isSubmitting ? (
                  "Saving..."
                ) : editingReward ? (
                  "Update Reward"
                ) : (
                  "Create Reward"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingReward} onOpenChange={() => setDeletingReward(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reward?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{deletingReward?.title}&quot;. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  )
}
