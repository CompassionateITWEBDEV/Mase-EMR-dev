import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  try {
    let query = supabase.from("hie_data_requests").select(`
        *,
        patient:patients(id, first_name, last_name, date_of_birth),
        requesting_clinic:mase_clinic_registry!hie_data_requests_requesting_clinic_id_fkey(clinic_name, city, state),
        source_clinic:mase_clinic_registry!hie_data_requests_source_clinic_id_fkey(clinic_name, city, state)
      `)

    if (status) {
      query = query.eq("request_status", status)
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(50)

    if (error) throw error

    return NextResponse.json({ requests: data || [] })
  } catch (error: any) {
    console.error("Error fetching data requests:", error)
    return NextResponse.json({ requests: [] }, { status: 200 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()
    const {
      source_clinic_id,
      patient_id,
      requesting_provider_id,
      requesting_provider_name,
      requesting_provider_npi,
      request_type,
      request_reason,
      urgency,
      data_types_requested,
      date_range_start,
      date_range_end,
    } = body

    // Get requesting clinic (current clinic)
    const { data: registry, error: regError } = await supabase
      .from("mase_clinic_registry")
      .select("id")
      .limit(1)
      .single()

    if (regError) throw regError

    // Verify patient consent exists
    const { data: consent, error: consentError } = await supabase
      .from("hie_patient_consents")
      .select("id")
      .eq("patient_id", patient_id)
      .eq("consent_status", "active")
      .contains("authorized_clinics", [source_clinic_id])
      .single()

    const request_number = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const { data, error } = await supabase
      .from("hie_data_requests")
      .insert([
        {
          request_number,
          requesting_clinic_id: registry.id,
          source_clinic_id,
          patient_id,
          requesting_provider_id,
          requesting_provider_name,
          requesting_provider_npi,
          request_type,
          request_reason,
          urgency,
          data_types_requested,
          date_range_start,
          date_range_end,
          patient_consent_id: consent?.id,
          consent_verified: !!consent,
          request_status: "pending",
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Log the request
    await supabase.from("hie_audit_log").insert([
      {
        clinic_id: registry.id,
        action: "data_request_created",
        resource_type: "data_request",
        resource_id: data.id,
        patient_id,
        action_details: `Data request created for ${patient_id}`,
        authorization_verified: !!consent,
        consent_id: consent?.id,
      },
    ])

    return NextResponse.json({ success: true, request: data })
  } catch (error: any) {
    console.error("Error creating data request:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
