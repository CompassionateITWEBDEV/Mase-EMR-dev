import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/middleware"

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

    // Validate required fields
    if (!patient_id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    if (!subjective && !objective && !assessment && !plan) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 })
    }

    // Get provider_id from authenticated user if not provided
    let finalProviderId = provider_id
    if (!finalProviderId) {
      const { user, error: authError } = await getAuthenticatedUser()
      
      // In development mode, allow proceeding without auth (similar to patients API)
      if (authError || !user) {
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        } else {
          console.warn(
            "[API] Development mode: Proceeding without authentication, provider_id will be null"
          )
          // In development, allow saving without provider_id
          finalProviderId = null
        }
      } else {
        // User is authenticated, try to get provider_id from staff or providers table
        const { data: staffData } = await supabase
          .from("staff")
          .select("id")
          .eq("id", user.id)
          .single()

        if (staffData) {
          finalProviderId = staffData.id
        } else {
          // Check if user is in providers table
          const { data: providerData } = await supabase
            .from("providers")
            .select("id")
            .eq("id", user.id)
            .single()

          if (providerData) {
            finalProviderId = providerData.id
          } else {
            // In development, allow null provider_id
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "[API] Development mode: Provider ID not found in staff or providers tables, proceeding with null provider_id"
              )
              finalProviderId = null
            } else {
              return NextResponse.json({ error: "Provider ID not found" }, { status: 400 })
            }
          }
        }
      }
    }

    // Note: note_date column doesn't exist in the schema - using created_at (auto-set by database)
    const { data, error } = await supabase
      .from("progress_notes")
      .insert({
        patient_id,
        provider_id: finalProviderId,
        note_type: note_type || "progress",
        subjective: subjective || "",
        objective: objective || "",
        assessment: assessment || "",
        plan: plan || "",
      })
      .select()
      .single()

    if (error) {
      console.error("Save note error:", error)
      return NextResponse.json({ error: error.message || "Failed to save note" }, { status: 500 })
    }

    return NextResponse.json({ success: true, note: data })
  } catch (error: any) {
    console.error("Save note error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to save note" 
    }, { status: 500 })
  }
}
