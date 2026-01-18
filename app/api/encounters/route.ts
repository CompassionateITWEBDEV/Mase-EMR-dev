import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const providerId = searchParams.get("provider_id")
    const patientId = searchParams.get("patient_id")
    const date = searchParams.get("date")

    // Query appointments as encounters
    let query = supabase
      .from("appointments")
      .select(`
        *,
        patients (id, first_name, last_name, date_of_birth),
        providers (id, first_name, last_name)
      `)
      .order("appointment_date", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }
    if (providerId) {
      query = query.eq("provider_id", providerId)
    }
    if (patientId) {
      query = query.eq("patient_id", patientId)
    }
    if (date) {
      query = query.gte("appointment_date", `${date}T00:00:00`).lte("appointment_date", `${date}T23:59:59`)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({
        encounters: [],
        patients: [],
        providers: [],
        stats: { todayCount: 0, inProgress: 0, completed: 0, pendingNotes: 0 },
      })
    }

    // Transform data to encounter format
    const encounters =
      data?.map((apt) => ({
        id: apt.id,
        patient_id: apt.patient_id,
        patient_name: apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : "Unknown Patient",
        provider_id: apt.provider_id,
        provider_name: apt.providers
          ? `Dr. ${apt.providers.first_name} ${apt.providers.last_name}`
          : "Unknown Provider",
        encounter_date: apt.appointment_date,
        encounter_type: apt.appointment_type || "established",
        chief_complaint: apt.notes || "No chief complaint recorded",
        status: apt.status,
        visit_reason: apt.appointment_type || "Office Visit",
        created_at: apt.created_at,
      })) || []

    const { data: patients } = await supabase
      .from("patients")
      .select("id, first_name, last_name, date_of_birth")
      .order("last_name")

    const { data: providers } = await supabase.from("providers").select("id, first_name, last_name").order("last_name")

    const today = new Date().toISOString().split("T")[0]
    const todayEncounters = (data || []).filter((e: any) => e.appointment_date?.startsWith(today))
    const inProgress = (data || []).filter((e: any) => e.status === "in_progress").length
    const completed = (data || []).filter((e: any) => e.status === "completed").length

    return NextResponse.json({
      encounters,
      patients: patients || [],
      providers: providers || [],
      stats: {
        todayCount: todayEncounters.length,
        inProgress,
        completed,
        pendingNotes: inProgress,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        encounters: [],
        patients: [],
        providers: [],
        stats: { todayCount: 0, inProgress: 0, completed: 0, pendingNotes: 0 },
        error: "Failed to fetch encounters",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      patient_id,
      provider_id,
      encounter_type,
      chief_complaint,
      visit_reason,
      vitals,
      subjective,
      objective,
      assessment,
      plan,
    } = body

    // Create appointment record
    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .insert({
        patient_id,
        provider_id,
        appointment_date: new Date().toISOString(),
        appointment_type: encounter_type,
        status: "in_progress",
        notes: chief_complaint,
        duration_minutes: 30,
      })
      .select()
      .single()

    if (aptError) {
      throw aptError
    }

    // Create progress note (SOAP note)
    if (subjective || objective || assessment || plan) {
      const { error: noteError } = await supabase.from("progress_notes").insert({
        patient_id,
        provider_id,
        appointment_id: appointment.id,
        note_type: "SOAP",
        subjective,
        objective,
        assessment,
        plan,
      })

      if (noteError) {
        console.error("Failed to create progress note:", noteError)
      }
    }

    // Create vital signs record
    if (vitals && Object.values(vitals).some((v) => v !== null)) {
      const { error: vitalsError } = await supabase.from("vital_signs").insert({
        patient_id,
        provider_id,
        measurement_date: new Date().toISOString(),
        ...vitals,
      })

      if (vitalsError) {
        console.error("Failed to create vital signs:", vitalsError)
      }
    }

    return NextResponse.json({
      success: true,
      encounter: {
        id: appointment.id,
        ...appointment,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to create encounter" }, { status: 500 })
  }
}
