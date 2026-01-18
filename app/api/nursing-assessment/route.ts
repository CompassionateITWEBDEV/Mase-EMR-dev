import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
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
      console.error("[nursing-assessment] Error saving assessment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[nursing-assessment] Error saving assessment:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to save assessment"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patient_id")

    let query = supabase.from("nursing_assessments").select("*").order("assessment_date", { ascending: false })

    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[nursing-assessment] Error fetching assessments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assessments: data })
  } catch (error) {
    console.error("[nursing-assessment] Error fetching assessments:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch assessments"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
