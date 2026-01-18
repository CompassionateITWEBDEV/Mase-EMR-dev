import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
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
      .order("created_at", { ascending: false })

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

    const { data, error } = await query.limit(200)

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

    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, date_of_birth, mrn, client_number")
      .order("last_name")
      .limit(10000)

    if (patientsError) {
      console.error("[v0] Error fetching patients:", patientsError.message)
    }

    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select("id, first_name, last_name, specialization")
      .order("last_name")
      .limit(10000)

    if (providersError) {
      console.error("[v0] Error fetching providers:", providersError.message)
    }

    const today = new Date().toISOString().split("T")[0]
    const todayEncounters = (data || []).filter((e: any) => e.appointment_date?.startsWith(today))
    const inProgress = (data || []).filter((e: any) => e.status === "in_progress").length
    const completed = (data || []).filter((e: any) => e.status === "completed" || e.status === "signed").length

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
    const supabase = createServiceClient()
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
      status,
    } = body

    // Determine appointment status based on encounter status
    // "signed" means completed, "draft" means in_progress
    const appointmentStatus = status === "signed" ? "completed" : "in_progress"

    // Validate required fields
    if (!patient_id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      )
    }

    if (!provider_id) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      )
    }

    if (!encounter_type) {
      return NextResponse.json(
        { error: "Encounter type is required" },
        { status: 400 }
      )
    }

    // Create appointment record
    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .insert({
        patient_id,
        provider_id,
        appointment_date: new Date().toISOString(),
        appointment_type: encounter_type,
        status: appointmentStatus,
        notes: chief_complaint || null,
        duration_minutes: 30,
      })
      .select()
      .single()

    if (aptError) {
      console.error("Database error creating appointment:", aptError)
      return NextResponse.json(
        { 
          error: aptError.message || "Failed to create appointment",
          details: aptError.details,
          hint: aptError.hint,
          code: aptError.code
        },
        { status: 500 }
      )
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
    if (vitals && Object.values(vitals).some((v) => v !== null && v !== "")) {
      // Map temperature_site to temperature_unit (form uses 'F' for Fahrenheit)
      const temperatureUnit = vitals.temperature_site ? 'F' : 'F' // Default to Fahrenheit
      
      const { error: vitalsError } = await supabase.from("vital_signs").insert({
        patient_id,
        provider_id,
        measurement_date: new Date().toISOString(),
        systolic_bp: vitals.systolic_bp,
        diastolic_bp: vitals.diastolic_bp,
        heart_rate: vitals.heart_rate,
        respiratory_rate: vitals.respiratory_rate,
        temperature: vitals.temperature,
        temperature_unit: temperatureUnit,
        oxygen_saturation: vitals.oxygen_saturation,
        weight: vitals.weight,
        weight_unit: vitals.weight_unit || 'lbs',
        height_feet: vitals.height_feet,
        height_inches: vitals.height_inches,
        bmi: vitals.bmi,
        pain_scale: vitals.pain_scale,
        pain_location: vitals.pain_location || null,
        notes: vitals.notes || null,
      })

      if (vitalsError) {
        console.error("Failed to create vital signs:", vitalsError)
        // Don't fail the entire request if vitals fail, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      encounter: {
        id: appointment.id,
        ...appointment,
      },
    })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to create encounter",
        details: error.details,
        hint: error.hint
      },
      { status: 500 }
    )
  }
}
