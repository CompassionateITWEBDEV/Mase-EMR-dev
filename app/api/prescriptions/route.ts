import { createServiceClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("prescriptions")
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: prescriptions, error } = await query

    if (error) {
      console.error("Error fetching prescriptions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get providers for prescriber names
    const { data: providers } = await supabase.from("providers").select("id, first_name, last_name")

    const providerMap = new Map((providers || []).map((p) => [p.id, `Dr. ${p.first_name} ${p.last_name}`]))

    // Format the data
    const formattedPrescriptions = (prescriptions || []).map((rx) => ({
      ...rx,
      patient_name: rx.patients ? `${rx.patients.first_name} ${rx.patients.last_name}` : "Unknown Patient",
      prescriber_name: providerMap.get(rx.prescribed_by) || "Unknown Provider",
    }))

    // Get patients for dropdown
    const { data: patients } = await supabase.from("patients").select("id, first_name, last_name").order("last_name")

    const { data: allProviders } = await supabase
      .from("providers")
      .select("id, first_name, last_name, specialization")
      .order("last_name")

    return NextResponse.json({
      prescriptions: formattedPrescriptions,
      patients: patients || [],
      providers: allProviders || [],
    })
  } catch (error) {
    console.error("Error in prescriptions API:", error)
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const prescriptionData = {
      patient_id: body.patient_id,
      prescribed_by: body.prescribed_by,
      medication_name: body.medication_name,
      generic_name: body.generic_name || null,
      dosage: body.dosage,
      quantity: body.quantity,
      refills: body.refills,
      directions: body.directions,
      pharmacy_name: body.pharmacy_name || null,
      pharmacy_address: body.pharmacy_address || null,
      pharmacy_phone: body.pharmacy_phone || null,
      pharmacy_npi: body.pharmacy_npi || null,
      status: "pending",
      prescribed_date: new Date().toISOString(),
      notes: body.notes || null,
    }

    const { data, error } = await supabase.from("prescriptions").insert(prescriptionData).select().single()

    if (error) {
      console.error("Error creating prescription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in prescriptions POST:", error)
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Prescription ID is required" }, { status: 400 })
    }

    if (updates.status === "sent") {
      updates.sent_date = new Date().toISOString()
    } else if (updates.status === "filled") {
      updates.filled_date = new Date().toISOString()
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("prescriptions").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating prescription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in prescriptions PUT:", error)
    return NextResponse.json({ error: "Failed to update prescription" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Prescription ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("prescriptions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting prescription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in prescriptions DELETE:", error)
    return NextResponse.json({ error: "Failed to delete prescription" }, { status: 500 })
  }
}
