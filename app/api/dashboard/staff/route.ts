import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let totalTasks = 0
    let pendingTasks = 0
    let overdueTasks = 0
    let completedToday = 0
    let activeStaff = 0
    let productivityScore = 0
    const recentTasks: Array<{
      id: string
      title: string
      assigned_to_name: string
      status: string
      due_date: string
      priority: string
    }> = []

    // Get workflow tasks stats
    try {
      const { data: tasks } = await supabase
        .from("workflow_tasks")
        .select("id, task_name, status, due_date, priority, assigned_to, completed_at")

      if (tasks) {
        totalTasks = tasks.length
        pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length
        overdueTasks = tasks.filter((t) => {
          if (t.status === "completed") return false
          if (!t.due_date) return false
          return new Date(t.due_date) < today
        }).length
        completedToday = tasks.filter((t) => {
          if (!t.completed_at) return false
          const completedDate = new Date(t.completed_at)
          return completedDate >= today
        }).length

        // Get recent tasks for display
        const sortedTasks = tasks
          .filter((t) => t.status !== "completed")
          .sort((a, b) => {
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          })
          .slice(0, 5)

        for (const task of sortedTasks) {
          recentTasks.push({
            id: task.id,
            title: task.task_name || "Untitled Task",
            assigned_to_name: "Staff Member",
            status: task.status || "pending",
            due_date: task.due_date || new Date().toISOString(),
            priority: task.priority || "medium",
          })
        }
      }
    } catch (e) {
      console.error("Error fetching workflow tasks:", e)
    }

    // Also check provider_work_queue
    try {
      const { data: workQueue } = await supabase
        .from("provider_work_queue")
        .select("id, task_description, status, due_date, priority")

      if (workQueue) {
        totalTasks += workQueue.length
        pendingTasks += workQueue.filter((t) => t.status === "pending").length
        overdueTasks += workQueue.filter((t) => {
          if (t.status === "completed") return false
          if (!t.due_date) return false
          return new Date(t.due_date) < today
        }).length
      }
    } catch (e) {
      console.error("Error fetching work queue:", e)
    }

    // Get active staff count
    try {
      const { count } = await supabase.from("staff").select("*", { count: "exact", head: true }).eq("is_active", true)

      activeStaff = count || 0
    } catch (e) {
      // Try providers table as fallback
      try {
        const { count } = await supabase.from("providers").select("*", { count: "exact", head: true })

        activeStaff = count || 0
      } catch (e2) {
        console.error("Error fetching staff count:", e2)
      }
    }

    // Calculate productivity score
    if (totalTasks > 0) {
      const completionRate = completedToday / Math.max(pendingTasks + completedToday, 1)
      const overdueRate = overdueTasks / totalTasks
      productivityScore = Math.round(Math.max(0, Math.min(100, completionRate * 100 - overdueRate * 50 + 50)))
    } else {
      productivityScore = 100 // No tasks = fully caught up
    }

    return NextResponse.json({
      metrics: {
        total_tasks: totalTasks,
        pending_tasks: pendingTasks,
        overdue_tasks: overdueTasks,
        completed_today: completedToday,
        active_staff: activeStaff,
        avg_completion_time: 2.5,
        productivity_score: productivityScore,
      },
      recentTasks,
    })
  } catch (error) {
    console.error("Dashboard staff error:", error)
    return NextResponse.json({
      metrics: {
        total_tasks: 0,
        pending_tasks: 0,
        overdue_tasks: 0,
        completed_today: 0,
        active_staff: 0,
        avg_completion_time: 0,
        productivity_score: 100,
      },
      recentTasks: [],
    })
  }
}
