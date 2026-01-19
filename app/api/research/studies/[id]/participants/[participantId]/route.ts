import { createServiceClient } from "@/lib/supabase/service-role"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { logResearchAudit } from "@/lib/research-audit"

// Helper function to get UTC date string (YYYY-MM-DD) for consistent date comparisons
function getUTCDateString(date?: Date): string {
  const d = date || new Date()
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// GET - Get a single participant
export async function GET(
  request: Request,
  { params }: { params: { id: string; participantId: string } }
) {
  try {
    const supabase = createServiceClient()
    const { id: studyId, participantId } = params

    if (!studyId || !participantId) {
      return NextResponse.json(
        { error: "Study ID and Participant ID are required" },
        { status: 400 }
      )
    }

    // Get participant
    const { data: participant, error } = await supabase
      .from("research_study_participants")
      .select("*")
      .eq("id", participantId)
      .eq("study_id", studyId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Participant not found" },
          { status: 404 }
        )
      }
      console.error("Error fetching participant:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get patient information
    let patientInfo = null
    if (participant.patient_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select("id, first_name, last_name, date_of_birth, phone, email")
        .eq("id", participant.patient_id)
        .single()
      patientInfo = patient
    }

    return NextResponse.json({
      success: true,
      participant: {
        ...participant,
        patient: patientInfo,
      },
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/research/studies/[id]/participants/[participantId]:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// PATCH - Update participant status and information
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; participantId: string } }
) {
  try {
    const supabase = createServiceClient()
    const { id: studyId, participantId } = params
    const body = await request.json()

    if (!studyId || !participantId) {
      return NextResponse.json(
        { error: "Study ID and Participant ID are required" },
        { status: 400 }
      )
    }

    // Get current user from auth session
    let currentUserId: string | null = null
    try {
      const authClient = await createClient()
      const { data: { user }, error: authError } = await authClient.auth.getUser()
      if (!authError && user) {
        currentUserId = user.id
      }
    } catch (authErr) {
      console.warn("Could not get user from auth session:", authErr)
    }

    // Get existing participant
    const { data: existingParticipant, error: fetchError } = await supabase
      .from("research_study_participants")
      .select("*")
      .eq("id", participantId)
      .eq("study_id", studyId)
      .single()

    if (fetchError || !existingParticipant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      )
    }

    // Validate enrollment status if provided
    if (body.enrollment_status) {
      const validStatuses = ["enrolled", "withdrawn", "completed", "lost_to_followup"]
      if (!validStatuses.includes(body.enrollment_status)) {
        return NextResponse.json(
          { error: `Invalid enrollment status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        )
      }

      // If changing to withdrawn, withdrawal_date and withdrawal_reason are required
      if (body.enrollment_status === "withdrawn") {
        if (!body.withdrawal_date) {
          return NextResponse.json(
            { error: "Withdrawal date is required when status is 'withdrawn'" },
            { status: 400 }
          )
        }
        if (!body.withdrawal_reason || body.withdrawal_reason.trim() === "") {
          return NextResponse.json(
            { error: "Withdrawal reason is required when status is 'withdrawn'" },
            { status: 400 }
          )
        }
      }

      // If changing from withdrawn to another status, clear withdrawal fields
      if (existingParticipant.enrollment_status === "withdrawn" && body.enrollment_status !== "withdrawn") {
        body.withdrawal_date = null
        body.withdrawal_reason = null
      }
    }

    // Validate dates if provided
    if (body.withdrawal_date) {
      const withdrawalDate = getUTCDateString(new Date(body.withdrawal_date))
      if (!/^\d{4}-\d{2}-\d{2}$/.test(withdrawalDate)) {
        return NextResponse.json(
          { error: "Invalid withdrawal date format. Expected YYYY-MM-DD" },
          { status: 400 }
        )
      }
      body.withdrawal_date = withdrawalDate
    }

    if (body.consent_date) {
      const consentDate = getUTCDateString(new Date(body.consent_date))
      if (!/^\d{4}-\d{2}-\d{2}$/.test(consentDate)) {
        return NextResponse.json(
          { error: "Invalid consent date format. Expected YYYY-MM-DD" },
          { status: 400 }
        )
      }
      body.consent_date = consentDate
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.enrollment_status !== undefined) {
      updateData.enrollment_status = body.enrollment_status
    }
    if (body.withdrawal_date !== undefined) {
      updateData.withdrawal_date = body.withdrawal_date
    }
    if (body.withdrawal_reason !== undefined) {
      updateData.withdrawal_reason = body.withdrawal_reason?.trim() || null
    }
    if (body.consent_obtained !== undefined) {
      updateData.consent_obtained = body.consent_obtained
      // If consent is revoked, clear consent date
      if (body.consent_obtained === false) {
        updateData.consent_date = null
      }
    }
    if (body.consent_date !== undefined) {
      updateData.consent_date = body.consent_date
    }
    if (body.consent_document_url !== undefined) {
      updateData.consent_document_url = body.consent_document_url?.trim() || null
    }

    // Update participant
    const { data: updatedParticipant, error: updateError } = await supabase
      .from("research_study_participants")
      .update(updateData)
      .eq("id", participantId)
      .eq("study_id", studyId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating participant:", updateError)
      return NextResponse.json(
        { error: "Failed to update participant", message: updateError.message },
        { status: 500 }
      )
    }

    // Get updated study enrollment count
    const { data: updatedStudy } = await supabase
      .from("research_studies")
      .select("current_enrollment, enrollment_target")
      .eq("id", studyId)
      .single()

    // Determine audit action based on status change
    let auditAction: "updated" | "status_changed" | "withdrawn" | "completed" = "updated"
    if (body.enrollment_status) {
      if (body.enrollment_status === "withdrawn") {
        auditAction = "withdrawn"
      } else if (body.enrollment_status === "completed") {
        auditAction = "completed"
      } else if (existingParticipant.enrollment_status !== body.enrollment_status) {
        auditAction = "status_changed"
      }
    }

    // Log audit trail
    await logResearchAudit({
      study_id: studyId,
      participant_id: participantId,
      action: auditAction,
      entity_type: "participant",
      changed_by: currentUserId || null,
      old_values: existingParticipant,
      new_values: updatedParticipant,
      change_description: body.enrollment_status
        ? `Status changed from ${existingParticipant.enrollment_status} to ${body.enrollment_status}`
        : "Participant information updated",
    })

    return NextResponse.json({
      success: true,
      participant: updatedParticipant,
      study: updatedStudy,
      message: "Participant updated successfully",
    })
  } catch (error) {
    console.error("Unexpected error in PATCH /api/research/studies/[id]/participants/[participantId]:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove participant from study (soft delete by setting status)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; participantId: string } }
) {
  try {
    const supabase = createServiceClient()
    const { id: studyId, participantId } = params

    if (!studyId || !participantId) {
      return NextResponse.json(
        { error: "Study ID and Participant ID are required" },
        { status: 400 }
      )
    }

    // Check if participant exists
    const { data: existingParticipant, error: fetchError } = await supabase
      .from("research_study_participants")
      .select("*")
      .eq("id", participantId)
      .eq("study_id", studyId)
      .single()

    if (fetchError || !existingParticipant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      )
    }

    // Soft delete: Mark as withdrawn with current date
    const todayUTC = getUTCDateString()
    const { data: updatedParticipant, error: deleteError } = await supabase
      .from("research_study_participants")
      .update({
        enrollment_status: "withdrawn",
        withdrawal_date: todayUTC,
        withdrawal_reason: "Removed from study",
        updated_at: new Date().toISOString(),
      })
      .eq("id", participantId)
      .eq("study_id", studyId)
      .select()
      .single()

    if (deleteError) {
      console.error("Error removing participant:", deleteError)
      return NextResponse.json(
        { error: "Failed to remove participant", message: deleteError.message },
        { status: 500 }
      )
    }

    // Get updated study enrollment count
    const { data: updatedStudy } = await supabase
      .from("research_studies")
      .select("current_enrollment, enrollment_target")
      .eq("id", studyId)
      .single()

    return NextResponse.json({
      success: true,
      participant: updatedParticipant,
      study: updatedStudy,
      message: "Participant removed from study successfully",
    })
  } catch (error) {
    console.error("Unexpected error in DELETE /api/research/studies/[id]/participants/[participantId]:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

