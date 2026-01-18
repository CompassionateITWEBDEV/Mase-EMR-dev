import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const locationId = searchParams.get("location_id")

    const supabase = await createServiceRoleClient()

    let query = supabase.from("offsite_bottle_kits").select(`
      *,
      patient:patients(first_name, last_name, mrn),
      location:offsite_dosing_locations(facility_name, facility_type)
    `)

    if (status) {
      query = query.eq("kit_status", status)
    }

    if (locationId) {
      query = query.eq("offsite_location_id", locationId)
    }

    const { data: kits, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[offsite-kits] Error fetching kits:", error)
      return NextResponse.json({ error: "Failed to fetch kits" }, { status: 500 })
    }

    return NextResponse.json({ kits })
  } catch (error) {
    console.error("[offsite-kits] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createServiceRoleClient()

    // Generate kit number
    const kitNumber = `KIT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const { data: kit, error } = await supabase
      .from("offsite_bottle_kits")
      .insert({
        ...body,
        kit_number: kitNumber,
        kit_status: "prepared",
        dispensed_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[offsite-kits] Error creating kit:", error)
      return NextResponse.json({ error: "Failed to create kit" }, { status: 500 })
    }

    // Create scheduled doses for each day
    const doses = []
    const startDate = new Date(body.start_date)
    const endDate = new Date(body.end_date)
    const doseTimesArray = body.scheduled_dose_times || ["08:00:00"]

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      for (const time of doseTimesArray) {
        doses.push({
          bottle_kit_id: kit.id,
          organization_id: body.organization_id,
          patient_id: body.patient_id,
          offsite_location_id: body.offsite_location_id,
          scheduled_dose_date: d.toISOString().split("T")[0],
          scheduled_dose_time: time,
          dose_amount: body.dose_amount,
          dose_unit: body.dose_unit,
          volume_ml: body.dose_amount / Number.parseFloat(body.concentration.split("mg/ml")[0]),
          administration_status: "scheduled",
        })
      }
    }

    const { error: doseError } = await supabase.from("offsite_dose_administration").insert(doses)

    if (doseError) {
      console.error("[offsite-kits] Error creating scheduled doses:", doseError)
    }

    return NextResponse.json({ kit, scheduled_doses: doses.length }, { status: 201 })
  } catch (error) {
    console.error("[offsite-kits] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
