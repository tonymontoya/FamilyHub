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

const registerSchema = z.object({
  familyName: z.string().min(2, "Family name must be at least 2 characters"),
  parentName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    
    try {
      // Step 1: Sign up with Better-Auth
      const { error: signUpError } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.parentName,
      })

      if (signUpError) {
        console.error('[Register] Sign up error:', signUpError)
        toast.error("Unable to create account. Please try again.")
        setIsLoading(false)
        return
      }
      
      // Step 2: Create family and link parent
      const response = await fetch("/api/auth/setup-family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: data.familyName,
          parentName: data.parentName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Register] Setup family failed:', errorData)
        toast.error("Account created but family setup failed.")
        setIsLoading(false)
        return
      }

      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error('[Register] Unexpected error:', error)
      toast.error("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Family Hub</CardTitle>
          <CardDescription>
            Set up your family account and create your first parent profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                placeholder="e.g., The Smith Family"
                {...register("familyName")}
                disabled={isLoading}
              />
              {errors.familyName && (
                <p className="text-sm text-destructive">{errors.familyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentName">Your Name</Label>
              <Input
                id="parentName"
                placeholder="e.g., John Smith"
                {...register("parentName")}
                disabled={isLoading}
              />
              {errors.parentName && (
                <p className="text-sm text-destructive">{errors.parentName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

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

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
