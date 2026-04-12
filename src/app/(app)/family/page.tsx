"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function FamilyPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to children page as the default family view
    router.push("/family/children")
  }, [router])

  return (
    <div className="p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>Redirecting to Family...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
