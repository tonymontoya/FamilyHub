"use client"

import { useState, useRef, ChangeEvent } from "react"
import { Camera, X, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface CompleteChoreDialogProps {
  chore: {
    id: string
    title: string
    points: number
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"]

export function CompleteChoreDialog({
  chore,
  open,
  onOpenChange,
  onComplete,
}: CompleteChoreDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPhotoError(null)

    if (!file) return

    // Client-side validation
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError("Photo must be smaller than 5MB")
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError("Only JPEG and PNG images are allowed")
      return
    }

    setPhoto(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const clearPhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    setPhotoError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Build form data
      const formData = new FormData()
      formData.append("choreId", chore.id)
      formData.append("completedAt", new Date().toISOString())
      if (notes.trim()) {
        formData.append("notes", notes.trim())
      }
      if (photo) {
        formData.append("photo", photo)
      }

      const response = await fetch("/api/completions", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit completion")
      }

      const result = await response.json()

      if (result.updated) {
        toast.success("Completion updated!")
      } else {
        toast.success("Chore marked as complete! Waiting for parent approval.")
      }

      // Reset form
      setNotes("")
      clearPhoto()
      onOpenChange(false)
      onComplete()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit completion"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Chore</DialogTitle>
          <DialogDescription>
            Mark &quot;{chore.title}" as complete. Add a photo as proof!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="photo">Photo (optional)</Label>

            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={clearPhoto}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to add a photo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG or PNG, max 5MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              id="photo"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handlePhotoSelect}
              disabled={isSubmitting}
            />

            {photoError && (
              <p className="text-sm text-destructive">{photoError}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about how it went..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              disabled={isSubmitting}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/500
            </p>
          </div>

          {/* Points Info */}
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm font-medium">Points Available</span>
            <span className="text-sm font-bold">{chore.points} pts</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Mark Complete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
