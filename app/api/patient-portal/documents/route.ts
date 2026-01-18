import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
    }

    // Get treatment plans
    const { data: treatmentPlans } = await supabase
      .from("treatment_plans")
      .select(`
        *,
        provider:providers(first_name, last_name)
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    // Get consent forms from patient assessments
    const { data: consents } = await supabase
      .from("patient_assessments")
      .select(`
        *,
        form:assessment_forms_catalog(form_name, category)
      `)
      .eq("patient_id", patientId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })

    // Get discharge summaries
    const { data: dischargeSummaries } = await supabase
      .from("discharge_summaries")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    // Get medications
    const { data: medications } = await supabase
      .from("patient_medications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .order("start_date", { ascending: false })

    return NextResponse.json({
      treatmentPlans: treatmentPlans || [],
      consents: consents || [],
      dischargeSummaries: dischargeSummaries || [],
      medications: medications || [],
    })
  } catch (error) {
    console.error("Error fetching patient documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
