import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: holds, error } = await supabase
      .from("dosing_holds")
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          mrn
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedHolds =
      holds?.map((hold: any) => ({
        id: hold.id,
        patient_id: hold.patient_id,
        patient_name: hold.patients ? `${hold.patients.first_name} ${hold.patients.last_name}` : "Unknown",
        mrn: hold.patients?.mrn || "N/A",
        hold_type: hold.hold_type,
        reason: hold.reason,
        created_by: hold.created_by,
        created_by_role: hold.created_by_role,
        created_at: hold.created_at,
        requires_clearance_from: hold.requires_clearance_from || [],
        cleared_by: hold.cleared_by || [],
        status: hold.status,
        notes: hold.notes,
        severity: hold.severity,
      })) || []

    return NextResponse.json({ holds: formattedHolds })
  } catch (error: any) {
    console.error("[v0] Error fetching dosing holds:", error)
    return NextResponse.json({ holds: [], error: error.message })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("dosing_holds")
      .insert({
        patient_id: body.patient_id,
        hold_type: body.hold_type,
        reason: body.reason,
        created_by: body.created_by || "System",
        created_by_role: body.created_by_role || "Provider",
        requires_clearance_from: body.requires_clearance_from || [],
        cleared_by: [],
        status: "active",
        notes: body.notes,
        severity: body.severity || "medium",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ hold: data })
  } catch (error: any) {
    console.error("[v0] Error creating dosing hold:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
