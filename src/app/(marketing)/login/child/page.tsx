"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

const childLoginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username is too long"),
  password: z
    .string()
    .min(1, "Password is required"),
})

type ChildLoginFormData = z.infer<typeof childLoginSchema>

export default function ChildLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChildLoginFormData>({
    resolver: zodResolver(childLoginSchema),
  })

  const onSubmit = async (data: ChildLoginFormData) => {
    setIsLoading(true)

    try {
      // Use username-based sign in
      const { error } = await authClient.signIn.username({
        username: data.username.toLowerCase(),
        password: data.password,
      })

      if (error) {
        // Generic error to prevent username enumeration
        toast.error("Invalid username or password")
        return
      }

      toast.success("Welcome back!")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 dark:from-blue-950/20 dark:to-background">
      <div className="w-full max-w-md">
        {/* Kid-friendly header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl">
            👋
          </div>
          <h1 className="text-2xl font-bold text-primary">Hello!</h1>
          <p className="text-muted-foreground">
            Ask your parent for your username and password
          </p>
        </div>

        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Child Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your login details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Your username"
                  autoComplete="username"
                  {...register("username")}
                  aria-invalid={errors.username ? "true" : "false"}
                  className="h-12 text-lg"
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                  className="h-12 text-lg"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg" 
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In 🚀"
                )}
              </Button>

              <div className="pt-4 text-center">
                <a 
                  href="/login" 
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  Are you a parent? Sign in here
                </a>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Forgot your password? Ask your parent to reset it for you.
        </p>
      </div>
    </main>
  )
}
