import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const direction = searchParams.get("direction") // 'outgoing' or 'incoming'

  try {
    // Get current clinic
    const { data: registry } = await supabase.from("mase_clinic_registry").select("id").limit(1).single()

    let query = supabase.from("hie_referrals").select(`
        *,
        patient:patients(id, first_name, last_name, date_of_birth, phone),
        referring_clinic:mase_clinic_registry!hie_referrals_referring_clinic_id_fkey(clinic_name, city, state, phone),
        receiving_clinic:mase_clinic_registry!hie_referrals_receiving_clinic_id_fkey(clinic_name, city, state, phone)
      `)

    if (direction === "outgoing") {
      query = query.eq("referring_clinic_id", registry?.id)
    } else if (direction === "incoming") {
      query = query.eq("receiving_clinic_id", registry?.id)
    }

    if (status) {
      query = query.eq("referral_status", status)
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(100)

    if (error) throw error

    return NextResponse.json({ referrals: data || [] })
  } catch (error: any) {
    console.error("Error fetching referrals:", error)
    return NextResponse.json({ referrals: [] }, { status: 200 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()
    const {
      receiving_clinic_id,
      patient_id,
      referring_provider_id,
      referring_provider_name,
      referring_provider_npi,
      receiving_provider_name,
      receiving_provider_specialty,
      referral_type,
      referral_reason,
      chief_complaint,
      diagnosis_codes,
      clinical_summary,
      urgency,
      preferred_appointment_date,
    } = body

    // Get referring clinic (current clinic)
    const { data: registry, error: regError } = await supabase
      .from("mase_clinic_registry")
      .select("id")
      .limit(1)
      .single()

    if (regError) throw regError

    // Verify patient consent
    const { data: consent, error: consentError } = await supabase
      .from("hie_patient_consents")
      .select("id")
      .eq("patient_id", patient_id)
      .eq("consent_status", "active")
      .contains("authorized_clinics", [receiving_clinic_id])
      .single()

    const referral_number = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const { data, error } = await supabase
      .from("hie_referrals")
      .insert([
        {
          referral_number,
          referring_clinic_id: registry.id,
          receiving_clinic_id,
          patient_id,
          patient_consent_id: consent?.id,
          referring_provider_id,
          referring_provider_name,
          referring_provider_npi,
          receiving_provider_name,
          receiving_provider_specialty,
          referral_type,
          referral_reason,
          chief_complaint,
          diagnosis_codes,
          clinical_summary,
          urgency,
          preferred_appointment_date,
          referral_status: "pending",
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Log the referral
    await supabase.from("hie_audit_log").insert([
      {
        clinic_id: registry.id,
        action: "referral_created",
        resource_type: "referral",
        resource_id: data.id,
        patient_id,
        action_details: `Referral created to ${receiving_clinic_id}`,
        authorization_verified: !!consent,
        consent_id: consent?.id,
      },
    ])

    return NextResponse.json({ success: true, referral: data })
  } catch (error: any) {
    console.error("Error creating referral:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
