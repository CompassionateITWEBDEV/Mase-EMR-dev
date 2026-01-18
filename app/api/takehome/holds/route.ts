import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: holds, error } = await supabase
      .from("dosing_holds")
      .select(`
        id,
        patient_id,
        hold_type,
        reason,
        severity,
        status,
        created_at,
        created_by,
        requires_clearance_from,
        cleared_by,
        cleared_at,
        notes
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get patient names
    const patientIds = [...new Set((holds || []).map((h: any) => h.patient_id))]
    let patientNames: Record<string, string> = {}

    if (patientIds.length > 0) {
      const { data: patients } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .in("id", patientIds)

      patientNames = (patients || []).reduce(
        (acc: Record<string, string>, p: any) => {
          acc[p.id] = `${p.first_name} ${p.last_name}`
          return acc
        },
        {} as Record<string, string>,
      )
    }

    const holdsWithNames = (holds || []).map((hold: any) => ({
      ...hold,
      patient_name: patientNames[hold.patient_id] || "Unknown Patient",
      reason_code: hold.hold_type,
      opened_time: hold.created_at,
      opened_by: hold.created_by,
      requires_counselor: hold.requires_clearance_from?.includes("counselor") || false,
    }))

    return NextResponse.json({ holds: holdsWithNames })
  } catch (error) {
    console.error("[v0] Error fetching holds:", error)
    return NextResponse.json({ holds: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { patient_id, hold_type, reason, severity, requires_clearance_from } = body

    const { data, error } = await supabase
      .from("dosing_holds")
      .insert({
        patient_id,
        hold_type,
        reason,
        severity: severity || "medium",
        status: "active",
        created_by: "System",
        requires_clearance_from: requires_clearance_from || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, hold: data })
  } catch (error) {
    console.error("[v0] Error creating hold:", error)
    return NextResponse.json({ error: "Failed to create hold" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, action, notes, cleared_by } = body

    if (action === "clear") {
      const { error } = await supabase
        .from("dosing_holds")
        .update({
          status: "cleared",
          cleared_at: new Date().toISOString(),
          cleared_by: cleared_by ? [cleared_by] : ["System"],
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating hold:", error)
    return NextResponse.json({ error: "Failed to update hold" }, { status: 500 })
  }
}
