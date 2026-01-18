import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)

  const patientId = searchParams.get("patient_id")
  const status = searchParams.get("status")
  const category = searchParams.get("category")

  let query = supabase
    .from("workflow_instances")
    .select(`
      *,
      template:workflow_templates(id, name, category, description),
      patient:patients(id, first_name, last_name)
    `)
    .order("created_at", { ascending: false })

  if (patientId) {
    query = query.eq("patient_id", patientId)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching workflows:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workflows: data })
}

export async function POST(request: Request) {
  const supabase = createServiceClient()
  const body = await request.json()

  const { data, error } = await supabase.from("workflow_instances").insert([body]).select().single()

  if (error) {
    console.error("[v0] Error creating workflow:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workflow: data })
}
