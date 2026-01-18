import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const patientId = params.id

  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id", code: "missing_patient_id" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single()

  if (patientError) {
    const status = patientError.code === "PGRST116" ? 404 : 500
    return NextResponse.json(
      {
        error: patientError.message || "Failed to load patient",
        code: patientError.code || "patient_fetch_failed",
      },
      { status },
    )
  }

  try {
    const [vitalSignsResult, medicationsResult, assessmentsResult, encountersResult, dosingLogResult, consentsResult] =
      await Promise.all([
        supabase
          .from("vital_signs")
          .select("*")
          .eq("patient_id", patientId)
          .order("measurement_date", { ascending: false })
          .limit(30),
        supabase
          .from("medications")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("assessments")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("encounters")
          .select("*")
          .eq("patient_id", patientId)
          .order("encounter_date", { ascending: false })
          .limit(10),
        supabase
          .from("dosing_log")
          .select("*")
          .eq("patient_id", patientId)
          .order("dose_date", { ascending: false })
          .limit(30),
        supabase
          .from("hie_patient_consents")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
      ])

    const queryErrors = [
      vitalSignsResult.error,
      medicationsResult.error,
      assessmentsResult.error,
      encountersResult.error,
      dosingLogResult.error,
      consentsResult.error,
    ].filter(Boolean)

    if (queryErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Failed to load patient chart data",
          code: "patient_chart_fetch_failed",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      patient,
      vital_signs: vitalSignsResult.data || [],
      medications: medicationsResult.data || [],
      assessments: assessmentsResult.data || [],
      encounters: encountersResult.data || [],
      dosing_log: dosingLogResult.data || [],
      hie_patient_consents: consentsResult.data || [],
    })
  } catch (error) {
    console.error("Error fetching patient chart data", error)
    return NextResponse.json(
      { error: "Unexpected error loading patient chart", code: "patient_chart_unexpected" },
      { status: 500 },
    )
  }
}
