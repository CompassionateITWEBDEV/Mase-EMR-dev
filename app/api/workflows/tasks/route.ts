import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)

  const workflowInstanceId = searchParams.get("workflow_instance_id")
  const assignedTo = searchParams.get("assigned_to")
  const status = searchParams.get("status")

  let query = supabase
    .from("workflow_tasks")
    .select(`
      *,
      workflow:workflow_instances(id, patient_id, status),
      assigned_staff:staff!assigned_to(id, first_name, last_name),
      completed_by_staff:staff!completed_by(id, first_name, last_name)
    `)
    .order("task_order", { ascending: true })

  if (workflowInstanceId) {
    query = query.eq("workflow_instance_id", workflowInstanceId)
  }

  if (assignedTo) {
    query = query.eq("assigned_to", assignedTo)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching workflow tasks:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tasks: data })
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data, error } = await supabase.from("workflow_tasks").insert([body]).select().single()

  if (error) {
    console.error("[v0] Error creating workflow task:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task: data })
}
