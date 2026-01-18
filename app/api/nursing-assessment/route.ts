import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const data = await request.json()

    const { error } = await supabase.from("nursing_assessments").insert({
      patient_id: data.patient_id,
      assessment_type: data.assessment_type,
      vital_signs: data.vital_signs,
      physical_exam: data.physical_exam,
      pain_assessment: data.pain_assessment,
      medical_history: data.medical_history,
      assessment_data: data.assessment_data,
      assessed_by: data.assessed_by,
      assessment_date: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patient_id")

    let query = supabase.from("nursing_assessments").select("*").order("assessment_date", { ascending: false })

    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assessments: data })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 })
  }
}
