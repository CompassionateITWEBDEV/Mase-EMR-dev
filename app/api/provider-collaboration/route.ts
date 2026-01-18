import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

console.log("[v0] Provider collaboration API loaded")

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (type === "external-providers") {
      const { data: providers, error } = await supabase
        .from("external_providers")
        .select("*")
        .order("organization_name")

      if (error) throw error
      return NextResponse.json({ providers: providers || [] })
    }

    if (type === "authorizations") {
      const { data: auths, error } = await supabase
        .from("patient_sharing_authorizations")
        .select(`
          *,
          patients(id, first_name, last_name),
          external_providers(id, provider_name, organization_name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      return NextResponse.json({ authorizations: auths || [] })
    }

    if (type === "collaboration-notes") {
      const { data: notes, error } = await supabase
        .from("collaboration_notes")
        .select(`
          *,
          patients(id, first_name, last_name),
          external_providers(id, provider_name, organization_name),
          providers(id, first_name, last_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return NextResponse.json({ notes: notes || [] })
    }

    if (type === "referrals") {
      const { data: referrals, error } = await supabase
        .from("provider_referrals")
        .select(`
          *,
          patients(id, first_name, last_name),
          external_providers(id, provider_name, organization_name),
          providers(id, first_name, last_name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return NextResponse.json({ referrals: referrals || [] })
    }

    // Default: Get dashboard overview
    const [
      { data: externalProviders },
      { data: activeAuths },
      { data: pendingReferrals },
      { data: unreadNotes },
      { data: patients },
      { data: internalProviders },
    ] = await Promise.all([
      supabase.from("external_providers").select("*").eq("is_active", true),
      supabase.from("patient_sharing_authorizations").select("*").eq("is_active", true),
      supabase.from("provider_referrals").select("*").eq("status", "pending"),
      supabase.from("collaboration_notes").select("*").eq("is_read", false),
      supabase.from("patients").select("id, first_name, last_name").order("last_name"),
      supabase.from("providers").select("id, first_name, last_name").order("last_name"),
    ])

    return NextResponse.json({
      metrics: {
        totalPartners: externalProviders?.length || 0,
        activeAuthorizations: activeAuths?.length || 0,
        pendingReferrals: pendingReferrals?.length || 0,
        unreadMessages: unreadNotes?.length || 0,
      },
      externalProviders: externalProviders || [],
      patients: patients || [],
      internalProviders: internalProviders || [],
    })
  } catch (error) {
    console.error("Error fetching collaboration data:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { action } = body

    if (action === "add-provider") {
      console.log("[v0] Adding new provider:", {
        organizationName: body.organizationName,
        providerName: body.providerName,
        providerType: body.providerType
      })
      
      const { data, error } = await supabase
        .from("external_providers")
        .insert({
          organization_name: body.organizationName,
          provider_name: body.providerName,
          provider_type: body.providerType,
          npi_number: body.npiNumber,
          specialty: body.specialty,
          email: body.email,
          phone: body.phone,
          fax: body.fax,
          address: body.address,
          city: body.city,
          state: body.state,
          zip_code: body.zipCode,
          notes: body.notes,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error adding provider:", error)
        throw error
      }
      
      console.log("[v0] Provider added successfully:", data.id)
      return NextResponse.json({ success: true, provider: data })
    }

    if (action === "create-authorization") {
      const { data, error } = await supabase
        .from("patient_sharing_authorizations")
        .insert({
          patient_id: body.patientId,
          external_provider_id: body.externalProviderId,
          authorization_type: body.authorizationType,
          purpose: body.purpose,
          information_types: body.informationTypes,
          effective_date: body.effectiveDate,
          expiration_date: body.expirationDate,
          created_by: body.createdBy,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, authorization: data })
    }

    if (action === "send-note") {
      const { data, error } = await supabase
        .from("collaboration_notes")
        .insert({
          patient_id: body.patientId,
          external_provider_id: body.externalProviderId,
          internal_provider_id: body.internalProviderId,
          note_type: body.noteType,
          subject: body.subject,
          note_content: body.noteContent,
          clinical_data: body.clinicalData,
          is_urgent: body.isUrgent,
          requires_response: body.requiresResponse,
          response_due_date: body.responseDueDate,
          parent_note_id: body.parentNoteId,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, note: data })
    }

    if (action === "create-referral") {
      const { data, error } = await supabase
        .from("provider_referrals")
        .insert({
          patient_id: body.patientId,
          referring_provider_id: body.referringProviderId,
          external_provider_id: body.externalProviderId,
          referral_type: body.referralType,
          referral_reason: body.referralReason,
          clinical_information: body.clinicalInformation,
          diagnosis_codes: body.diagnosisCodes,
          urgency: body.urgency,
          preferred_date: body.preferredDate,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, referral: data })
    }

    if (action === "mark-note-read") {
      const { error } = await supabase
        .from("collaboration_notes")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", body.noteId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "update-referral-status") {
      const { error } = await supabase
        .from("provider_referrals")
        .update({
          status: body.status,
          status_updated_at: new Date().toISOString(),
          outcome: body.outcome,
          outcome_date: body.outcomeDate,
        })
        .eq("id", body.referralId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "submit-referral-response") {
      const { data: referral, error: refError } = await supabase
        .from("provider_referrals")
        .update({
          external_provider_response: body.response,
          response_attachments: body.attachments || null,
          response_received_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", body.referralId)
        .select()
        .single()

      if (refError) throw refError

      // Create a collaboration note for internal tracking
      await supabase.from("collaboration_notes").insert({
        patient_id: referral.patient_id,
        external_provider_id: referral.external_provider_id,
        internal_provider_id: referral.referring_provider_id,
        note_type: "referral_response",
        subject: `Response to ${body.referralType || "Referral"}`,
        note_content: body.response,
        clinical_data: { referral_id: body.referralId, attachments: body.attachments },
        requires_response: false,
        is_urgent: false,
      })

      return NextResponse.json({ success: true, referral })
    }

    if (action === "review-referral-response") {
      const { referralId, reviewStatus, reviewerId, importToChart } = body

      // Update review status
      const updateData: any = {
        review_status: reviewStatus,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      }

      // If approved and should import to chart
      if (reviewStatus === "approved" && importToChart) {
        // Get the referral details
        const { data: referral } = await supabase
          .from("provider_referrals")
          .select(`
            *,
            patients(id, first_name, last_name),
            external_providers(provider_name, organization_name)
          `)
          .eq("id", referralId)
          .single()

        if (referral && referral.external_provider_response) {
          // Create a progress note from the external provider response
          const { data: progressNote, error: noteError } = await supabase
            .from("progress_notes")
            .insert({
              patient_id: referral.patient_id,
              provider_id: reviewerId,
              note_type: "consultation",
              subjective: `External consultation response from ${referral.external_providers.provider_name} (${referral.external_providers.organization_name})`,
              objective: `Referral for: ${referral.referral_reason}`,
              assessment: referral.external_provider_response,
              plan: referral.follow_up_notes || "Continue care per external provider recommendations",
            })
            .select()
            .single()

          if (noteError) throw noteError

          updateData.imported_to_chart = true
          updateData.chart_note_id = progressNote.id

          // Log to audit trail
          await supabase.from("audit_trail").insert({
            action: "EXTERNAL_RESPONSE_IMPORTED",
            table_name: "provider_referrals",
            record_id: referralId,
            patient_id: referral.patient_id,
            user_id: reviewerId,
            new_values: {
              chart_note_id: progressNote.id,
              external_provider: referral.external_providers.provider_name,
              referral_type: referral.referral_type,
            },
            timestamp: new Date().toISOString(),
          })
        }
      }

      const { error } = await supabase.from("provider_referrals").update(updateData).eq("id", referralId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "get-pending-responses") {
      const { data, error } = await supabase
        .from("provider_referrals")
        .select(`
          *,
          patients(id, first_name, last_name),
          external_providers(id, provider_name, organization_name, provider_type),
          providers(id, first_name, last_name)
        `)
        .not("external_provider_response", "is", null)
        .eq("review_status", "pending")
        .eq("imported_to_chart", false)
        .order("response_received_at", { ascending: false })

      if (error) throw error
      return NextResponse.json({ pendingResponses: data || [] })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in collaboration action:", error)
    return NextResponse.json({ error: "Action failed" }, { status: 500 })
  }
}
