import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Family Hub
        </h1>
        <p className="text-xl text-muted-foreground">
          A free, open-source family management platform for organizing chores, 
          tasks, and family coordination—running entirely in your home.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
