import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    let auditEntries: any[] = []
    let recentAppointments: any[] = []
    let recentNotes: any[] = []

    try {
      const { data } = await supabase
        .from("audit_trail")
        .select("id, action, table_name, timestamp, user_id, patient_id")
        .order("timestamp", { ascending: false })
        .limit(10)
      auditEntries = data || []
    } catch (e) {
      console.error("[v0] Error fetching audit trail:", e)
    }

    try {
      const { data } = await supabase
        .from("appointments")
        .select("id, appointment_date, status, appointment_type, patient_id, provider_id")
        .order("appointment_date", { ascending: false })
        .limit(5)
      recentAppointments = data || []
    } catch (e) {
      console.error("[v0] Error fetching appointments:", e)
    }

    try {
      const { data } = await supabase
        .from("progress_notes")
        .select("id, note_type, created_at, patient_id, provider_id")
        .order("created_at", { ascending: false })
        .limit(5)
      recentNotes = data || []
    } catch (e) {
      console.error("[v0] Error fetching progress notes:", e)
    }

    // Combine and format activities
    const activities = [
      ...auditEntries.map((entry) => ({
        id: entry.id,
        type: entry.table_name,
        action: entry.action,
        time: entry.timestamp,
        status: "completed",
      })),
      ...recentAppointments.map((apt) => ({
        id: apt.id,
        type: "appointment",
        action: `${apt.appointment_type || "Appointment"} ${apt.status || "scheduled"}`,
        time: apt.appointment_date,
        status: apt.status,
      })),
      ...recentNotes.map((note) => ({
        id: note.id,
        type: "note",
        action: `${note.note_type || "Progress"} note created`,
        time: note.created_at,
        status: "completed",
      })),
    ]
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
      .slice(0, 10)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Dashboard activity error:", error)
    return NextResponse.json({ activities: [] })
  }
}
