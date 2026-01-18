import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get("locationId")

    // Get all locations with bed counts
    const { data: locations, error: locError } = await supabase
      .from("facility_locations")
      .select("*")
      .eq("active", true)
      .order("name")

    if (locError) throw locError

    // Get occupancy data
    const query = supabase.from("facility_beds").select(`
        *,
        facility_rooms(
          id,
          room_number,
          room_type,
          gender_restriction,
          location_id,
          facility_locations(name, location_type)
        ),
        patients(id, first_name, last_name, patient_number, dob)
      `)

    if (locationId) {
      query.eq("facility_rooms.location_id", locationId)
    }

    const { data: beds, error: bedError } = await query

    if (bedError) throw bedError

    // Calculate statistics
    const stats = {
      totalBeds: beds?.length || 0,
      occupied: beds?.filter((b) => b.occupied).length || 0,
      available: beds?.filter((b) => !b.occupied).length || 0,
      occupancyRate: beds?.length ? ((beds.filter((b) => b.occupied).length / beds.length) * 100).toFixed(1) : "0.0",
    }

    return NextResponse.json({
      locations: locations || [],
      beds: beds || [],
      stats,
    })
  } catch (error) {
    console.error("Error fetching occupancy data:", error)
    return NextResponse.json({ error: "Failed to fetch occupancy data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { action, bedId, patientId, assignedBy } = body

    if (action === "assign") {
      // Assign patient to bed
      const { data, error } = await supabase
        .from("facility_beds")
        .update({
          occupied: true,
          current_patient_id: patientId,
          assignment_date: new Date().toISOString(),
          expected_discharge_date: body.expectedDischargeDate,
        })
        .eq("id", bedId)
        .select()

      if (error) throw error

      // Record in history
      await supabase.from("bed_assignment_history").insert({
        bed_id: bedId,
        patient_id: patientId,
        assigned_by: assignedBy,
        assignment_date: new Date().toISOString(),
      })

      return NextResponse.json(data[0])
    } else if (action === "discharge") {
      // Discharge patient from bed
      const { data, error } = await supabase
        .from("facility_beds")
        .update({
          occupied: false,
          current_patient_id: null,
          assignment_date: null,
          expected_discharge_date: null,
        })
        .eq("id", bedId)
        .select()

      if (error) throw error

      // Update history
      await supabase
        .from("bed_assignment_history")
        .update({
          discharge_date: new Date().toISOString(),
        })
        .eq("bed_id", bedId)
        .is("discharge_date", null)

      return NextResponse.json(data[0])
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error managing occupancy:", error)
    return NextResponse.json({ error: "Failed to manage occupancy" }, { status: 500 })
  }
}
