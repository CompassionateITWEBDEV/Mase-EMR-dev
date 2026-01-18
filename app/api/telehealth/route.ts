import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch today's appointments
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_type,
        status,
        duration_minutes,
        notes,
        patient:patients(id, first_name, last_name),
        provider:providers(id, first_name, last_name, role)
      `)
      .gte("appointment_date", `${todayStr}T00:00:00`)
      .lte("appointment_date", `${todayStr}T23:59:59`)
      .order("appointment_date", { ascending: true })

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError)
    }

    // Fetch patients for new session dropdown
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .order("last_name", { ascending: true })

    if (patientsError) {
      console.error("Error fetching patients:", patientsError)
    }

    // Fetch providers for new session dropdown
    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select("id, first_name, last_name, role")
      .order("last_name", { ascending: true })

    if (providersError) {
      console.error("Error fetching providers:", providersError)
    }

    // Format appointments
    const formattedAppointments = (appointments || []).map((apt) => ({
      id: apt.id,
      patient: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : "Unknown Patient",
      patientId: apt.patient?.id,
      time: new Date(apt.appointment_date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      type: apt.appointment_type || "General",
      provider: apt.provider
        ? `${apt.provider.first_name} ${apt.provider.last_name} (${apt.provider.role || "Provider"})`
        : "Unassigned",
      providerId: apt.provider?.id,
      status: apt.status || "scheduled",
      duration: apt.duration_minutes || 30,
    }))

    return NextResponse.json({
      appointments: formattedAppointments,
      patients: patients || [],
      providers: providers || [],
      activeSessions: [], // No active sessions table, managed client-side
    })
  } catch (error) {
    console.error("Telehealth API error:", error)
    return NextResponse.json({ error: "Failed to fetch telehealth data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { action, ...data } = body

    if (action === "start_session") {
      // Create a new appointment for the session if not from existing appointment
      const { patientId, providerId, sessionType } = data

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: patientId,
          provider_id: providerId,
          appointment_date: new Date().toISOString(),
          appointment_type: sessionType || "Telehealth Session",
          status: "in-progress",
          duration_minutes: 30,
          notes: "Telehealth session started",
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating session:", error)
        return NextResponse.json({ error: "Failed to start session" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        session: {
          id: appointment.id,
          startTime: new Date().toISOString(),
        },
      })
    }

    if (action === "end_session") {
      const { appointmentId, duration } = data

      const { error } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          duration_minutes: duration,
        })
        .eq("id", appointmentId)

      if (error) {
        console.error("Error ending session:", error)
        return NextResponse.json({ error: "Failed to end session" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Telehealth POST error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
