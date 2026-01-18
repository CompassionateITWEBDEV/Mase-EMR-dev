import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const patient_id = searchParams.get("patient_id");

  try {
    let query = supabase
      .from("hie_patient_consents")
      .select(
        `
        *,
        patient:patients(id, first_name, last_name),
        source_clinic:mase_clinic_registry!hie_patient_consents_source_clinic_id_fkey(clinic_name, clinic_code)
      `
      )
      .eq("consent_status", "active");

    if (patient_id) {
      query = query.eq("patient_id", patient_id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ consents: data || [] });
  } catch (error: any) {
    console.error("Error fetching consents:", error);
    return NextResponse.json({ consents: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const {
      patient_id,
      consent_type,
      share_demographics,
      share_medications,
      share_diagnoses,
      share_lab_results,
      share_treatment_plans,
      share_clinical_notes,
      share_mental_health_records,
      share_substance_use_records,
      authorized_clinics,
      effective_date,
      expiration_date,
      consent_form_signed,
      signed_date,
      witness_name,
    } = body;

    // Get current clinic as source
    const { data: registry, error: regError } = await supabase
      .from("mase_clinic_registry")
      .select("id")
      .limit(1)
      .single();

    if (regError) throw regError;

    const { data, error } = await supabase
      .from("hie_patient_consents")
      .insert([
        {
          patient_id,
          source_clinic_id: registry.id,
          consent_type,
          consent_status: "active",
          share_demographics,
          share_medications,
          share_diagnoses,
          share_lab_results,
          share_treatment_plans,
          share_clinical_notes,
          share_mental_health_records,
          share_substance_use_records,
          authorized_clinics,
          effective_date,
          expiration_date,
          consent_form_signed,
          signed_date,
          witness_name,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log the consent creation
    await supabase.from("hie_audit_log").insert([
      {
        clinic_id: registry.id,
        action: "consent_created",
        resource_type: "patient_consent",
        resource_id: data.id,
        patient_id,
        action_details: `HIE consent created: ${consent_type}`,
        authorization_verified: true,
        consent_id: data.id,
      },
    ]);

    return NextResponse.json({ success: true, consent: data });
  } catch (error: any) {
    console.error("Error creating consent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
