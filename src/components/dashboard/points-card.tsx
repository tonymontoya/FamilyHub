"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, TrendingUp } from "lucide-react"
import { ChildPoints } from "@/hooks/use-dashboard"

interface PointsCardProps {
  userRole: "PARENT" | "CHILD"
  points: {
    children?: ChildPoints[]
    total?: number
    thisWeek?: number
    weeklyGoal?: number
  }
}

export function PointsCard({ userRole, points }: PointsCardProps) {
  if (userRole === "PARENT" && points.children) {
    return <ParentPointsCard childPoints={points.children} />
  }

  if (userRole === "CHILD" && points.total !== undefined) {
    return (
      <ChildPointsCard
        total={points.total}
        thisWeek={points.thisWeek || 0}
        weeklyGoal={points.weeklyGoal || 100}
      />
    )
  }

  return null
}

function ParentPointsCard({ childPoints }: { childPoints: ChildPoints[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Family Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        {childPoints.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No children in family yet.
          </p>
        ) : (
          <div className="space-y-4">
            {childPoints.map((child, index) => (
              <div key={child.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <span className="text-lg">🥇</span>
                    )}
                    {index === 1 && (
                      <span className="text-lg">🥈</span>
                    )}
                    {index === 2 && (
                      <span className="text-lg">🥉</span>
                    )}
                    <span className="font-medium">{child.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{child.total} pts</div>
                    <div className="text-xs text-muted-foreground">
                      {child.thisWeek} this week
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChildPointsCard({
  total,
  thisWeek,
  weeklyGoal,
}: {
  total: number
  thisWeek: number
  weeklyGoal: number
}) {
  const progress = Math.min((thisWeek / weeklyGoal) * 100, 100)
  const remaining = Math.max(weeklyGoal - thisWeek, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          My Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>Weekly Goal</span>
            </div>
            <span className="font-medium">
              {thisWeek} / {weeklyGoal}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {remaining > 0
              ? `${remaining} points to reach your goal!`
              : "🎉 Goal reached! Great job!"}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <div className="text-sm">
            <span className="font-medium">{thisWeek} points</span>
            <span className="text-muted-foreground"> earned this week</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
