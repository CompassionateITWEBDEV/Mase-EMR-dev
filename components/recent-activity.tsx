"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Activity {
  id: string
  type: string
  action: string
  time: string
  status: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/dashboard/activity")
        if (!response.ok) throw new Error("Failed to fetch activity")

        const data = await response.json()
        setActivities(data.activities || [])

        console.log("[v0] Recent activity loaded successfully")
      } catch (err) {
        console.error("[v0] Error loading recent activity:", err)
        setError("Failed to load activity data")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  const getInitials = (type: string) => {
    const typeMap: Record<string, string> = {
      appointment: "AP",
      note: "NT",
      patients: "PT",
      medications: "MD",
      assessments: "AS",
      default: "SY",
    }
    return typeMap[type] || typeMap["default"]
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="mt-4" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No recent activity. Activity will appear here as you use the system.
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 border border-border rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-muted">{getInitials(activity.type)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-card-foreground">
                    <span className="font-medium capitalize">{activity.type}</span>: {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatTime(activity.time)}</p>
                </div>

                <Badge
                  variant={
                    activity.status === "completed"
                      ? "default"
                      : activity.status === "alert"
                        ? "destructive"
                        : activity.status === "pending"
                          ? "secondary"
                          : "outline"
                  }
                >
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
