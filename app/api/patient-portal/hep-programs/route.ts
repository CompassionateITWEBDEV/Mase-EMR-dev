import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
    }

    // Fetch patient HEP programs with exercises
    const { data: programs, error: programsError } = await supabase
      .from("patient_hep_programs")
      .select(`
        *,
        hep_exercises(
          *,
          exercise_library(*)
        )
      `)
      .eq("patient_id", patientId)
      .eq("active", true)
      .order("created_date", { ascending: false })

    if (programsError) throw programsError

    // Fetch compliance logs for each program
    const programsWithCompliance = await Promise.all(
      (programs || []).map(async (program: any) => {
        const { data: complianceLogs, error: logsError } = await supabase
          .from("hep_compliance_log")
          .select("*")
          .eq("program_id", program.id)
          .order("completed_date", { ascending: false })
          .limit(30) // Last 30 days

        if (logsError) {
          console.error("Error fetching compliance logs:", logsError)
        }

        // Calculate compliance rate
        const totalDays = Math.ceil((new Date().getTime() - new Date(program.start_date || program.created_date).getTime()) / (1000 * 60 * 60 * 24))
        const completedDays = complianceLogs?.length || 0
        const complianceRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

        // Get exercises with completion status
        const exercises = (program.hep_exercises || []).map((he: any) => ({
          id: he.id,
          exercise_id: he.exercise_id,
          exercise_name: he.exercise_library?.exercise_name || "Unknown Exercise",
          description: he.exercise_library?.description || "",
          sets: he.sets,
          reps: he.reps,
          hold_duration_seconds: he.hold_duration_seconds,
          special_instructions: he.special_instructions,
          video_url: he.exercise_library?.video_url,
          completed_today: false, // Would need to check today's compliance log
        }))

        return {
          id: program.id,
          program_name: program.program_name,
          therapist_name: program.therapist_name,
          frequency: `${program.frequency_per_week}x per week`,
          status: program.active ? "active" : "inactive",
          start_date: program.start_date || program.created_date,
          end_date: program.end_date,
          compliance_rate: complianceRate,
          days_completed: completedDays,
          streak: 0, // Would need to calculate from compliance logs
          program_goals: "", // Not in schema, would need to add
          special_instructions: "", // Not in schema, would need to add
          exercises,
          weekly_progress: [], // Would need to calculate from compliance logs
        }
      })
    )

    return NextResponse.json(programsWithCompliance)
  } catch (error: any) {
    console.error("[Patient Portal] Error fetching HEP programs:", error)
    return NextResponse.json({ error: "Failed to fetch HEP programs" }, { status: 500 })
  }
}
