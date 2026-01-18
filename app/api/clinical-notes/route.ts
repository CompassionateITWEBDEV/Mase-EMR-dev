import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch recent progress notes with patient and provider info
    const { data: notes, error: notesError } = await supabase
      .from("progress_notes")
      .select(`
        id,
        note_type,
        subjective,
        objective,
        assessment,
        plan,
        created_at,
        updated_at,
        patient_id,
        provider_id
      `)
      .order("created_at", { ascending: false })
      .limit(20)

    if (notesError) throw notesError

    // Get patient and provider names
    const patientIds = [...new Set(notes?.map((n) => n.patient_id).filter(Boolean))]
    const providerIds = [...new Set(notes?.map((n) => n.provider_id).filter(Boolean))]

    const [patientsRes, providersRes] = await Promise.all([
      patientIds.length > 0
        ? supabase.from("patients").select("id, first_name, last_name").in("id", patientIds)
        : { data: [] },
      providerIds.length > 0
        ? supabase.from("staff").select("id, first_name, last_name, role").in("id", providerIds)
        : { data: [] },
    ])

    const patients = patientsRes.data || []
    const providers = providersRes.data || []

    const patientMap = Object.fromEntries(patients.map((p) => [p.id, `${p.first_name} ${p.last_name}`]))
    const providerMap = Object.fromEntries(
      providers.map((p) => [p.id, { name: `${p.first_name} ${p.last_name}`, role: p.role }]),
    )

    const enrichedNotes =
      notes?.map((note) => ({
        ...note,
        patient_name: patientMap[note.patient_id] || "Unknown Patient",
        provider_name: providerMap[note.provider_id]?.name || "Unknown Provider",
        provider_role: providerMap[note.provider_id]?.role || "Provider",
        status: note.plan ? "completed" : "draft",
      })) || []

    // Fetch custom templates
    const { data: templates } = await supabase
      .from("clinical_protocols")
      .select("id, name, description, protocol_steps")
      .eq("category", "documentation")
      .eq("is_active", true)

    return NextResponse.json({
      notes: enrichedNotes,
      templates: templates || [],
      stats: {
        total: enrichedNotes.length,
        completed: enrichedNotes.filter((n) => n.status === "completed").length,
        drafts: enrichedNotes.filter((n) => n.status === "draft").length,
      },
    })
  } catch (error) {
    console.error("Clinical notes error:", error)
    return NextResponse.json({ error: "Failed to fetch clinical notes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { patient_id, note_type, subjective, objective, assessment, plan, provider_id } = body

    const { data, error } = await supabase
      .from("progress_notes")
      .insert({
        patient_id,
        provider_id,
        note_type: note_type || "progress",
        subjective,
        objective,
        assessment,
        plan,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, note: data })
  } catch (error) {
    console.error("Save note error:", error)
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 })
  }
}
