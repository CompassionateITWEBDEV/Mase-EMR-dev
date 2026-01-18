"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, AlertTriangle, Users, FileText, Loader2 } from "lucide-react"
import Link from "next/link"

interface StaffMetrics {
  total_tasks: number
  pending_tasks: number
  overdue_tasks: number
  completed_today: number
  active_staff: number
  avg_completion_time: number
  productivity_score: number
}

interface RecentTask {
  id: string
  title: string
  assigned_to_name: string
  status: string
  due_date: string
  priority: string
}

export function StaffDashboardWidget() {
  const [metrics, setMetrics] = useState<StaffMetrics | null>(null)
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/dashboard/staff")
      if (!response.ok) {
        throw new Error("Failed to fetch staff data")
      }

      const data = await response.json()
      setMetrics(data.metrics)
      setRecentTasks(data.recentTasks || [])
    } catch (err) {
      console.error("Error loading staff data:", err)
      setError("Unable to load staff metrics")
      // Set empty defaults on error
      setMetrics({
        total_tasks: 0,
        pending_tasks: 0,
        overdue_tasks: 0,
        completed_today: 0,
        active_staff: 0,
        avg_completion_time: 0,
        productivity_score: 100,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
          <p className="text-muted-foreground">Loading staff metrics...</p>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No staff data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Staff Dashboard
        </CardTitle>
        <CardDescription>Team productivity and task management</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Staff Metrics Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{metrics.pending_tasks}</div>
            <div className="text-xs text-muted-foreground">Active Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{metrics.overdue_tasks}</div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.completed_today}</div>
            <div className="text-xs text-muted-foreground">Completed Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{metrics.active_staff}</div>
            <div className="text-xs text-muted-foreground">Active Staff</div>
          </div>
        </div>

        {/* Productivity Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Team Productivity</span>
            <span className="text-sm text-muted-foreground">{metrics.productivity_score}%</span>
          </div>
          <Progress value={metrics.productivity_score} className="h-2" />
        </div>

        {/* Overdue Tasks Alert */}
        {metrics.overdue_tasks > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">Overdue Tasks Require Attention</div>
              {metrics.overdue_tasks} task(s) are overdue and need immediate review.{" "}
              <Link href="/workflows?tab=overdue" className="underline font-medium">
                View overdue tasks
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty state when no tasks */}
        {metrics.total_tasks === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks in the system yet</p>
          </div>
        )}

        <Link href="/workflows">
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <FileText className="mr-2 h-4 w-4" />
            View All Tasks
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
