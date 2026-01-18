import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)

  const patientId = searchParams.get("patient_id")
  const status = searchParams.get("status")

  let query = supabase
    .from("medication_reconciliation_sessions")
    .select(`
      *,
      patient:patients(id, first_name, last_name),
      creator:staff!created_by(id, first_name, last_name),
      items:medication_reconciliation_items(*)
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
    console.error("[v0] Error fetching reconciliation sessions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data to match frontend interface
  const sessions = data?.map((session: any) => ({
    ...session,
    patient_name: session.patient ? `${session.patient.first_name} ${session.patient.last_name}` : "Unknown",
    created_by: session.creator ? `${session.creator.first_name} ${session.creator.last_name}` : "Unknown",
    medications: session.items || [],
  }))

  return NextResponse.json({ sessions })
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data, error } = await supabase.from("medication_reconciliation_sessions").insert([body]).select().single()

  if (error) {
    console.error("[v0] Error creating reconciliation session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ session: data })
}
