import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type Params = {
  params: {
    id: string
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(_: Request, { params }: Params) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase configuration." }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const patientId = params.id

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single()

    if (patientError) {
      return NextResponse.json({ error: patientError.message }, { status: 500 })
    }

    const [
      vitalSignsResult,
      medicationsResult,
      assessmentsResult,
      encountersResult,
      dosingLogResult,
      consentsResult,
    ] = await Promise.all([
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

    const errors = [
      vitalSignsResult.error,
      medicationsResult.error,
      assessmentsResult.error,
      encountersResult.error,
      dosingLogResult.error,
      consentsResult.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      return NextResponse.json({ error: "Failed to load patient chart data." }, { status: 500 })
    }

    return NextResponse.json({
      patient,
      vitalSigns: vitalSignsResult.data || [],
      medications: medicationsResult.data || [],
      assessments: assessmentsResult.data || [],
      encounters: encountersResult.data || [],
      dosingLog: dosingLogResult.data || [],
      consents: consentsResult.data || [],
    })
  } catch (error) {
    console.error("[v0] Patient chart API error:", error)
    return NextResponse.json({ error: "Failed to fetch patient chart data." }, { status: 500 })
  }
}
