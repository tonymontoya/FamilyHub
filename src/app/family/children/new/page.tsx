"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Copy, Eye, EyeOff, RefreshCw, Check, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Form validation schema
const createChildSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
})

type CreateChildFormData = z.infer<typeof createChildSchema>

// Generate a secure random password
function generatePassword(): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 16; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export default function CreateChildPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [createdChild, setCreatedChild] = useState<{
    username: string
    password: string
  } | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateChildFormData>({
    resolver: zodResolver(createChildSchema),
  })

  const password = watch("password")

  const handleGeneratePassword = () => {
    const newPassword = generatePassword()
    setValue("password", newPassword)
  }

  const onSubmit = async (data: CreateChildFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username.toLowerCase(),
          displayName: data.displayName,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("Username already exists. Please choose another.")
        } else {
          toast.error(result.error || "Failed to create account")
        }
        return
      }

      // Show success dialog with credentials
      setCreatedChild(result.credentials)
      setShowSuccessDialog(true)
      toast.success("Child account created successfully!")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const handleDone = () => {
    setShowSuccessDialog(false)
    router.push("/family/children")
    router.refresh()
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push("/family/children")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Family
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create Child Account</CardTitle>
            <CardDescription>
              Create an account for your child. You&apos;ll need to give them their username and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="e.g., sarah_child"
                  {...register("username")}
                  aria-invalid={errors.username ? "true" : "false"}
                />
                {errors.username ? (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, lowercase letters, numbers, and underscores only
                  </p>
                )}
              </div>

              {/* Display Name Field */}
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="e.g., Sarah"
                  {...register("displayName")}
                  aria-invalid={errors.displayName ? "true" : "false"}
                />
                {errors.displayName ? (
                  <p className="text-sm text-destructive">{errors.displayName.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    How their name appears in the app
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Initial Password <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                      aria-invalid={errors.password ? "true" : "false"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                    title="Generate secure password"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
                {errors.password ? (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Child can change this after their first login
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog with Credentials */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Account Created!
            </DialogTitle>
            <DialogDescription>
              Save these credentials - this is the only time we&apos;ll show the password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Username */}
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="flex gap-2">
                <Input
                  value={createdChild?.username || ""}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(createdChild?.username || "", "Username")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input
                  value={createdChild?.password || ""}
                  readOnly
                  type="text"
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(createdChild?.password || "", "Password")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <p className="font-medium">⚠️ Important:</p>
              <p>
                Make sure to save these credentials somewhere safe. For security reasons, 
                we cannot show the password again.
              </p>
            </div>
          </div>
          <Button onClick={handleDone} className="w-full">
            I&apos;ve Saved It
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  )
}
