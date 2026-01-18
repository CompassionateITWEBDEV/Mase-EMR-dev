import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const {
      program_id,
      patient_id,
      completed_date,
      exercises_completed,
      total_exercises,
      completion_percentage,
      time_spent_minutes,
      pain_level,
      difficulty_rating,
      patient_notes,
      device_used,
    } = body

    if (!program_id || !patient_id || !completed_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert HEP compliance log entry
    const { data: logEntry, error } = await supabase
      .from("hep_compliance_log")
      .insert({
        program_id,
        patient_id,
        completed_date,
        exercises_completed: exercises_completed || 0,
        total_exercises: total_exercises || 0,
        completion_percentage: completion_percentage || 0,
        time_spent_minutes: time_spent_minutes || 0,
        pain_level: pain_level || null,
        difficulty_rating: difficulty_rating || null,
        patient_notes: patient_notes || null,
        device_used: device_used || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Exercise logged successfully",
      logEntry,
    })
  } catch (error: any) {
    console.error("[Patient Portal] Error logging HEP exercise:", error)
    return NextResponse.json({ error: "Failed to log exercise" }, { status: 500 })
  }
}
