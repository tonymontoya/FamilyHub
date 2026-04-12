"use client"

import { useRouter } from "next/navigation"
import { ListTodo, ArrowLeft, Plus, Calendar, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function TodosPage() {
  const router = useRouter()

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Todos</h1>
            <p className="text-muted-foreground">
              Track your personal tasks and reminders
            </p>
          </div>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          New Todo
        </Button>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Todos Coming Soon</h2>
          <p className="text-muted-foreground max-w-sm mb-4">
            We&apos;re building a powerful todo system with due dates, priorities, 
            and reminders. Stay tuned!
          </p>
          <Button 
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Preview of what's coming */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Tasks to complete</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Badge variant="secondary">Upcoming</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Scheduled tasks</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Done this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Features</CardTitle>
          <CardDescription>
            What&apos;s planned for the Todos module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Create personal and family todos</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Set due dates and reminders</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Assign priorities (high, medium, low)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Recurring todos with schedules</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Filter and sort by status, date, priority</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
