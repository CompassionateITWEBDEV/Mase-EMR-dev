import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET handler to fetch all clinical documents (assessments and progress notes)
export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch assessments with patient and provider data
    const { data: assessments, error: assessmentsError } = await supabase
      .from("assessments")
      .select(`
        *,
        patients(
          id,
          first_name,
          last_name
        ),
        providers(
          id,
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false })

    if (assessmentsError) {
      console.error("[API] Error fetching assessments:", assessmentsError)
    }

    // Fetch progress notes with patient and provider data
    const { data: progressNotes, error: progressNotesError } = await supabase
      .from("progress_notes")
      .select(`
        *,
        patients(
          id,
          first_name,
          last_name
        ),
        providers(
          id,
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false })

    if (progressNotesError) {
      console.error("[API] Error fetching progress notes:", progressNotesError)
    }

    // Format documents with document_type and computed names
    const formattedAssessments = (assessments || []).map((doc) => ({
      ...doc,
      document_type: "assessment" as const,
      patient_name: `${doc.patients?.first_name || "Unknown"} ${doc.patients?.last_name || "Patient"}`,
      provider_name: `${doc.providers?.first_name || "Unknown"} ${doc.providers?.last_name || "Provider"}`,
    }))

    const formattedProgressNotes = (progressNotes || []).map((doc) => ({
      ...doc,
      document_type: "progress_note" as const,
      patient_name: `${doc.patients?.first_name || "Unknown"} ${doc.patients?.last_name || "Patient"}`,
      provider_name: `${doc.providers?.first_name || "Unknown"} ${doc.providers?.last_name || "Provider"}`,
    }))

    // Combine and sort by created_at
    const allDocuments = [...formattedAssessments, ...formattedProgressNotes]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Calculate statistics
    const stats = {
      total: allDocuments.length,
      assessments: formattedAssessments.length,
      progressNotes: formattedProgressNotes.length,
      pending: formattedAssessments.filter((doc) => !doc.diagnosis_codes?.length).length,
    }

    return NextResponse.json({
      success: true,
      documents: allDocuments,
      assessments: formattedAssessments,
      progressNotes: formattedProgressNotes,
      stats,
    })
  } catch (error: any) {
    console.error("[API] Error fetching clinical documents:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { documentType, ...data } = body

    // Validate document type
    if (documentType !== "assessment" && documentType !== "progress_note") {
      return NextResponse.json(
        { error: "Invalid document type. Must be 'assessment' or 'progress_note'" },
        { status: 400 }
      )
    }

    if (documentType === "assessment") {
      const {
        patient_id,
        provider_id,
        assessment_type,
        chief_complaint,
        history_present_illness,
        mental_status_exam,
        risk_assessment,
        diagnosis_codes,
        treatment_plan,
      } = data

      // Validate required fields
      if (!patient_id) {
        return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
      }
      if (!provider_id) {
        return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
      }
      if (!assessment_type) {
        return NextResponse.json({ error: "Assessment type is required" }, { status: 400 })
      }

      // Check if provider exists in database
      const { data: providerCheck, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("id", provider_id)
        .single()

      let finalProviderId = provider_id

      if (providerError || !providerCheck) {
        // Provider doesn't exist - try to create default provider or get first available
        const DEFAULT_PROVIDER_ID = "00000000-0000-0000-0000-000000000001"
        
        if (provider_id === DEFAULT_PROVIDER_ID) {
          // Try to create the default provider
          const { data: createdProvider, error: createError } = await supabase
            .from("providers")
            .insert({
              id: DEFAULT_PROVIDER_ID,
              first_name: "Demo",
              last_name: "Provider",
              email: "demo@example.com",
            })
            .select()
            .single()

          if (createError && createError.code !== "23505") {
            // If creation fails (and it's not a duplicate), try to get first available provider
            const { data: firstProvider } = await supabase
              .from("providers")
              .select("id")
              .limit(1)
              .single()

            if (firstProvider) {
              finalProviderId = firstProvider.id
            } else {
              return NextResponse.json(
                { error: "No providers available in the database. Please create a provider first." },
                { status: 400 }
              )
            }
          } else if (createdProvider) {
            finalProviderId = createdProvider.id
          }
        } else {
          // Not default provider, try to get first available
          const { data: firstProvider } = await supabase
            .from("providers")
            .select("id")
            .limit(1)
            .single()

          if (firstProvider) {
            finalProviderId = firstProvider.id
          } else {
            return NextResponse.json(
              { error: `Provider with ID ${provider_id} does not exist and no providers are available in the database.` },
              { status: 400 }
            )
          }
        }
      }

      const insertData: any = {
        patient_id,
        provider_id: finalProviderId,
        assessment_type,
        chief_complaint: chief_complaint || null,
        history_present_illness: history_present_illness || null,
        mental_status_exam: mental_status_exam || null,
        risk_assessment: risk_assessment || null,
        diagnosis_codes: diagnosis_codes && Array.isArray(diagnosis_codes) && diagnosis_codes.length > 0 ? diagnosis_codes : null,
        treatment_plan: treatment_plan || null,
      }

      const { data: assessment, error } = await supabase
        .from("assessments")
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error("[API] Error creating assessment:", error)
        return NextResponse.json(
          { error: error.message || "Failed to create assessment" },
          { status: 400 }
        )
      }

      return NextResponse.json({ success: true, document: assessment })
    } else {
      // Progress note
      const {
        patient_id,
        provider_id,
        note_type,
        subjective,
        objective,
        assessment,
        plan,
      } = data

      // Validate required fields
      if (!patient_id) {
        return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
      }
      if (!provider_id) {
        return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
      }
      if (!note_type) {
        return NextResponse.json({ error: "Note type is required" }, { status: 400 })
      }

      // Check if provider exists, create default or use first available if not
      const { data: providerCheck, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("id", provider_id)
        .single()

      let finalProviderId = provider_id

      if (providerError || !providerCheck) {
        const DEFAULT_PROVIDER_ID = "00000000-0000-0000-0000-000000000001"
        
        if (provider_id === DEFAULT_PROVIDER_ID) {
          const { data: createdProvider, error: createError } = await supabase
            .from("providers")
            .insert({
              id: DEFAULT_PROVIDER_ID,
              first_name: "Demo",
              last_name: "Provider",
              email: "demo@example.com",
            })
            .select()
            .single()

          if (createError && createError.code !== "23505") {
            const { data: firstProvider } = await supabase
              .from("providers")
              .select("id")
              .limit(1)
              .single()

            if (firstProvider) {
              finalProviderId = firstProvider.id
            } else {
              return NextResponse.json(
                { error: "No providers available in the database. Please create a provider first." },
                { status: 400 }
              )
            }
          } else if (createdProvider) {
            finalProviderId = createdProvider.id
          }
        } else {
          const { data: firstProvider } = await supabase
            .from("providers")
            .select("id")
            .limit(1)
            .single()

          if (firstProvider) {
            finalProviderId = firstProvider.id
          } else {
            return NextResponse.json(
              { error: `Provider with ID ${provider_id} does not exist and no providers are available in the database.` },
              { status: 400 }
            )
          }
        }
      }

      const insertData: any = {
        patient_id,
        provider_id: finalProviderId,
        note_type,
        subjective: subjective || null,
        objective: objective || null,
        assessment: assessment || null,
        plan: plan || null,
      }

      const { data: progressNote, error } = await supabase
        .from("progress_notes")
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error("[API] Error creating progress note:", error)
        return NextResponse.json(
          { error: error.message || "Failed to create progress note" },
          { status: 400 }
        )
      }

      return NextResponse.json({ success: true, document: progressNote })
    }
  } catch (error: any) {
    console.error("[API] Error creating clinical document:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create document" },
      { status: 500 }
    )
  }
}
