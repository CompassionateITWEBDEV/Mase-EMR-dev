import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
    const locationId = searchParams.get("location_id")

    const supabase = await createServiceRoleClient()

    let query = supabase.from("offsite_dose_administration").select(`
      *,
      patient:patients(first_name, last_name, mrn),
      location:offsite_dosing_locations(facility_name),
      kit:offsite_bottle_kits(kit_number, medication_name)
    `)

    query = query.eq("scheduled_dose_date", date)

    if (locationId) {
      query = query.eq("offsite_location_id", locationId)
    }

    const { data: doses, error } = await query.order("scheduled_dose_time")

    if (error) {
      console.error("[offsite-admin] Error fetching administrations:", error)
      return NextResponse.json({ error: "Failed to fetch administrations" }, { status: 500 })
    }

    return NextResponse.json({ doses })
  } catch (error) {
    console.error("[offsite-admin] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createServiceRoleClient()

    const { data: admin, error } = await supabase
      .from("offsite_dose_administration")
      .update({
        actual_administration_date: body.actual_administration_date,
        actual_administration_time: body.actual_administration_time,
        administered_by_name: body.administered_by_name,
        administered_by_license: body.administered_by_license,
        witnessed_by_name: body.witnessed_by_name,
        patient_response: body.patient_response,
        administration_status: body.refused_dose ? "refused" : "administered",
        refused_dose: body.refused_dose,
        refusal_reason: body.refusal_reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      console.error("[offsite-admin] Error recording administration:", error)
      return NextResponse.json({ error: "Failed to record administration" }, { status: 500 })
    }

    return NextResponse.json({ administration: admin })
  } catch (error) {
    console.error("[offsite-admin] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
