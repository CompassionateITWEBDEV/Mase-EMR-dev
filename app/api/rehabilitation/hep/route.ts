import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const therapistId = searchParams.get("therapist_id")
    const patientId = searchParams.get("patient_id")

    // Fetch HEP programs
    let programsQuery = supabase
      .from("hep_programs")
      .select(`
        *,
        patients(id, first_name, last_name, phone, email),
        staff(id, first_name, last_name)
      `)
      .order("created_at", { ascending: false })

    if (therapistId) {
      programsQuery = programsQuery.eq("therapist_id", therapistId)
    }
    if (patientId) {
      programsQuery = programsQuery.eq("patient_id", patientId)
    }

    const { data: programs, error: programsError } = await programsQuery

    // Fetch exercise library
    const { data: exercises, error: exercisesError } = await supabase
      .from("hep_exercises")
      .select("*")
      .eq("is_active", true)
      .order("exercise_category", { ascending: true })

    // Fetch compliance alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("hep_compliance_alerts")
      .select(`
        *,
        patients(first_name, last_name),
        hep_programs(program_name)
      `)
      .eq("is_acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(20)

    // Calculate stats
    const activePrograms = programs?.filter((p) => p.status === "active").length || 0
    const completedPrograms = programs?.filter((p) => p.status === "completed").length || 0

    return NextResponse.json({
      programs: programs || [],
      exercises: exercises || [],
      alerts: alerts || [],
      stats: {
        activePrograms,
        completedPrograms,
        pendingAlerts: alerts?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching HEP data:", error)
    return NextResponse.json({ error: "Failed to fetch HEP data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { action, ...data } = body

    if (action === "create_program") {
      // Create new HEP program
      const { data: program, error } = await supabase
        .from("hep_programs")
        .insert({
          patient_id: data.patient_id,
          therapist_id: data.therapist_id,
          program_name: data.program_name,
          diagnosis_codes: data.diagnosis_codes,
          start_date: data.start_date,
          end_date: data.end_date,
          frequency: data.frequency,
          duration_weeks: data.duration_weeks,
          program_goals: data.program_goals,
          special_instructions: data.special_instructions,
          status: "active",
        })
        .select()
        .single()

      if (error) throw error

      // Add exercises to program
      if (data.exercises && data.exercises.length > 0) {
        const exerciseInserts = data.exercises.map((ex: any, index: number) => ({
          program_id: program.id,
          exercise_id: ex.exercise_id,
          exercise_order: index + 1,
          sets: ex.sets,
          reps: ex.reps,
          hold_duration_seconds: ex.hold_duration_seconds,
          rest_seconds: ex.rest_seconds,
          frequency_per_day: ex.frequency_per_day,
          frequency_per_week: ex.frequency_per_week,
          special_instructions: ex.special_instructions,
        }))

        await supabase.from("hep_program_exercises").insert(exerciseInserts)
      }

      return NextResponse.json({ success: true, program })
    }

    if (action === "log_exercise") {
      // Patient logs exercise completion
      const { data: log, error } = await supabase
        .from("hep_patient_logs")
        .insert({
          program_id: data.program_id,
          exercise_id: data.exercise_id,
          patient_id: data.patient_id,
          log_date: data.log_date,
          log_time: data.log_time,
          sets_completed: data.sets_completed,
          reps_completed: data.reps_completed,
          duration_minutes: data.duration_minutes,
          pain_level: data.pain_level,
          difficulty_rating: data.difficulty_rating,
          notes: data.notes,
          completed: true,
        })
        .select()
        .single()

      if (error) throw error

      // Update RTM billing minutes
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01"
      await supabase.rpc("increment_rtm_minutes", {
        p_patient_id: data.patient_id,
        p_program_id: data.program_id,
        p_service_month: currentMonth,
        p_minutes: data.duration_minutes || 0,
      })

      return NextResponse.json({ success: true, log })
    }

    if (action === "create_progress_review") {
      // Therapist creates progress review
      const { data: review, error } = await supabase
        .from("hep_progress_reviews")
        .insert({
          program_id: data.program_id,
          patient_id: data.patient_id,
          therapist_id: data.therapist_id,
          review_date: data.review_date,
          compliance_percentage: data.compliance_percentage,
          pain_trend: data.pain_trend,
          function_improvement: data.function_improvement,
          modifications_made: data.modifications_made,
          next_review_date: data.next_review_date,
          billable_minutes: data.billable_minutes,
          cpt_codes_billed: data.cpt_codes_billed,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, review })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in HEP POST:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
