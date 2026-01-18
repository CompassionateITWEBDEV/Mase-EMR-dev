import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    let workflowTasks: any[] = []
    let providerQueue: any[] = []
    let completedTasks: any[] = []

    try {
      const { data } = await supabase
        .from("workflow_tasks")
        .select(
          "id, task_name, task_description, status, priority, due_date, estimated_duration_minutes, assigned_to, created_at, workflow_instance_id",
        )
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true })
        .limit(20)
      workflowTasks = data || []
    } catch (e) {
      console.error("[v0] Error fetching workflow tasks:", e)
    }

    try {
      const { data } = await supabase
        .from("provider_work_queue")
        .select("id, task_type, task_description, status, priority, due_date, patient_id, provider_id")
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(20)
      providerQueue = data || []
    } catch (e) {
      console.error("[v0] Error fetching provider queue:", e)
    }

    // Get completed tasks for today
    const today = new Date().toISOString().split("T")[0]
    try {
      const { data } = await supabase
        .from("workflow_tasks")
        .select("*")
        .eq("status", "completed")
        .gte("completed_at", today)
        .limit(10)
      completedTasks = data || []
    } catch (e) {
      console.error("[v0] Error fetching completed tasks:", e)
    }

    return NextResponse.json({
      pendingTasks: workflowTasks,
      providerQueue,
      completedTasks,
    })
  } catch (error) {
    console.error("Work queue error:", error)
    return NextResponse.json({
      pendingTasks: [],
      providerQueue: [],
      completedTasks: [],
    })
  }
}
