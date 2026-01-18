import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createClient()

  try {
    // Get all active clinics in the MASE network
    const { data: clinics, error } = await supabase
      .from("mase_clinic_registry")
      .select("*")
      .eq("network_status", "active")
      .eq("hie_enabled", true)
      .order("clinic_name")

    if (error) throw error

    // Get directory information for search
    const { data: directory, error: dirError } = await supabase
      .from("hie_clinic_directory")
      .select("*")
      .eq("is_visible", true)

    if (dirError) console.error("Directory error:", dirError)

    return NextResponse.json({
      clinics: clinics || [],
      directory: directory || [],
      network_stats: {
        total_clinics: clinics?.length || 0,
        total_states: new Set(clinics?.map((c) => c.state)).size || 0,
      },
    })
  } catch (error: any) {
    console.error("Error fetching HIE registry:", error)
    return NextResponse.json(
      {
        clinics: [],
        directory: [],
        network_stats: { total_clinics: 0, total_states: 0 },
      },
      { status: 200 },
    )
  }
}

// Register a new clinic to the network
export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()
    const {
      organization_id,
      clinic_name,
      clinic_code,
      facility_type,
      npi_number,
      address,
      city,
      state,
      zip_code,
      phone,
      email,
      specialties,
      services_offered,
    } = body

    const { data, error } = await supabase
      .from("mase_clinic_registry")
      .insert([
        {
          organization_id,
          clinic_name,
          clinic_code,
          facility_type,
          npi_number,
          address,
          city,
          state,
          zip_code,
          phone,
          email,
          specialties,
          services_offered,
          hie_enabled: true,
          network_status: "active",
          joined_network_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Also create directory entry
    await supabase.from("hie_clinic_directory").insert([
      {
        clinic_id: data.id,
        display_name: clinic_name,
        specialties,
        services: services_offered,
        public_phone: phone,
        public_email: email,
        address,
        city,
        state,
        zip_code,
        accepting_new_patients: true,
        accepts_referrals: true,
        is_visible: true,
      },
    ])

    return NextResponse.json({ success: true, clinic: data })
  } catch (error: any) {
    console.error("Error registering clinic:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
