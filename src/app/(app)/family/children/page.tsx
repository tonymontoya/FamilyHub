"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, User, UserCog, RefreshCw, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Member {
  id: string
  username: string
  displayName: string
  role: "PARENT" | "CHILD"
  createdAt: string
}

interface FamilyData {
  children: Member[]
  parent: Member | null
}

export default function FamilyPage() {
  const router = useRouter()
  const [familyData, setFamilyData] = useState<FamilyData>({ children: [], parent: null })
  const [isLoading, setIsLoading] = useState(true)
  const [childToDelete, setChildToDelete] = useState<Member | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)

  const fetchFamilyData = async () => {
    try {
      const response = await fetch("/api/children")
      if (!response.ok) {
        throw new Error("Failed to fetch family data")
      }
      const body = await response.json()
      setFamilyData(body.data)
    } catch {
      toast.error("Failed to load family members")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFamilyData()
  }, [])

  const handleResetPassword = async (childId: string) => {
    setIsResettingPassword(childId)
    
    try {
      const response = await fetch(`/api/children/${childId}/reset-password`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error?.message || "Failed to delete account")
        return
      }

      setNewPassword(result.data.newPassword)
      toast.success("Password reset successfully")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsResettingPassword(null)
    }
  }

  const handleDeleteChild = async () => {
    if (!childToDelete) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/children/${childToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || "Failed to delete account")
        return
      }

      toast.success("Child account deleted")
      setChildToDelete(null)
      fetchFamilyData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Family Members</h1>
            <p className="text-muted-foreground">
              Manage your family and child accounts
            </p>
          </div>
          <Button onClick={() => router.push("/family/children/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Child
          </Button>
        </div>

        <div className="space-y-6">
          {/* Parent Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                You (Parent)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You are the family administrator and can manage child accounts.
              </p>
            </CardContent>
          </Card>

          {/* Children Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Children
              </CardTitle>
              <CardDescription>
                {familyData.children.length === 0
                  ? "No child accounts yet. Add your first child to get started."
                  : `${familyData.children.length} child account(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {familyData.children.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="mb-4 text-center text-muted-foreground">
                    Create accounts for your children so they can:
                  </p>
                  <ul className="mb-6 list-inside list-disc text-sm text-muted-foreground">
                    <li>View their assigned chores</li>
                    <li>Mark chores as complete</li>
                    <li>See their points and rewards</li>
                  </ul>
                  <Button onClick={() => router.push("/family/children/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Child
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {familyData.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <h3 className="font-medium">{child.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Username: {child.username}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(child.id)}
                          disabled={isResettingPassword === child.id}
                        >
                          {isResettingPassword === child.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Reset Password
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChildToDelete(child)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!childToDelete} onOpenChange={() => setChildToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Child Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for{" "}
              <strong>{childToDelete?.displayName}</strong>. All their data including
              chore completions and points will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChild}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Password Dialog */}
      <AlertDialog open={!!newPassword} onOpenChange={() => setNewPassword(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password Reset Successful</AlertDialogTitle>
            <AlertDialogDescription>
              The new password has been generated. Save it now - we won&apos;t show it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-medium">New Password:</p>
              <code className="break-all text-lg font-mono">{newPassword}</code>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setNewPassword(null)}>
              I&apos;ve Saved It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
