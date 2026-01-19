import { createServiceClient } from "@/lib/supabase/service-role"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { logResearchAudit } from "@/lib/research-audit"

// Helper function to get UTC date string (YYYY-MM-DD) for consistent date comparisons
// Uses UTC to avoid timezone issues - DATE fields in PostgreSQL are timezone-agnostic
function getUTCDateString(date?: Date): string {
  const d = date || new Date()
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Validation helper function
async function validateEnrollment(
  supabase: any, 
  studyId: string, 
  patientId: string, 
  enrollmentDate?: string
) {
  const errors: string[] = []
  
  // Get study
  const { data: study, error: studyError } = await supabase
    .from('research_studies')
    .select('*')
    .eq('id', studyId)
    .single()
  
  if (studyError || !study) {
    errors.push('Study not found')
    return { valid: false, errors }
  }
  
  // Check study status
  if (!['active', 'data_collection'].includes(study.status)) {
    errors.push(`Study is ${study.status}. Only active studies can enroll participants.`)
  }
  
  // Check IRB status
  if (study.irb_status !== 'approved') {
    errors.push(`Study IRB status is ${study.irb_status}. Only approved studies can enroll participants.`)
  }
  
  // Get UTC date for consistent comparison (DATE fields are timezone-agnostic)
  const todayUTC = getUTCDateString()
  
  // Check date range - enrollment must be within study timeline
  const enrollDate = enrollmentDate || todayUTC
  if (enrollDate < study.start_date || enrollDate > study.end_date) {
    errors.push(`Enrollment date (${enrollDate}) is outside study timeline (${study.start_date} to ${study.end_date})`)
  }
  
  // Also check that study is currently active (today is within study dates)
  if (todayUTC < study.start_date || todayUTC > study.end_date) {
    errors.push(`Current date is outside study timeline (${study.start_date} to ${study.end_date})`)
  }
  
  // Check enrollment capacity
  if (study.current_enrollment >= study.enrollment_target) {
    errors.push('Study enrollment target has been reached')
  }
  
  // Check patient exists
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .single()
  
  if (patientError || !patient) {
    errors.push('Patient not found')
  }
  
  // Check duplicate (will be caught by UNIQUE constraint, but provide friendly message)
  const { data: existing } = await supabase
    .from('research_study_participants')
    .select('id')
    .eq('study_id', studyId)
    .eq('patient_id', patientId)
    .maybeSingle()
  
  if (existing) {
    errors.push('Patient is already enrolled in this study')
  }
  
  return { valid: errors.length === 0, errors }
}

// GET - Get participants for a research study
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const studyId = params.id

    if (!studyId) {
      return NextResponse.json({ error: "Study ID is required" }, { status: 400 })
    }

    // Get participants
    const { data: participants, error } = await supabase
      .from("research_study_participants")
      .select("*")
      .eq("study_id", studyId)
      .order("enrolled_date", { ascending: false })

    if (error) {
      console.error("Error fetching participants:", error)
      
      // Check if table doesn't exist
      if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Database table not found",
            message: "The research_study_participants table has not been created. Please run the database migration script.",
            code: "TABLE_NOT_FOUND",
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get enrollment statistics
    const enrolledCount = participants?.filter(p => p.enrollment_status === "enrolled").length || 0
    const withdrawnCount = participants?.filter(p => p.enrollment_status === "withdrawn").length || 0
    const completedCount = participants?.filter(p => p.enrollment_status === "completed").length || 0
    const lostToFollowupCount = participants?.filter(p => p.enrollment_status === "lost_to_followup").length || 0
    const consentObtainedCount = participants?.filter(p => p.consent_obtained === true).length || 0

    return NextResponse.json({
      success: true,
      participants: participants || [],
      statistics: {
        total: participants?.length || 0,
        enrolled: enrolledCount,
        withdrawn: withdrawnCount,
        completed: completedCount,
        lostToFollowup: lostToFollowupCount,
        consentObtained: consentObtainedCount,
      },
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/research/studies/[id]/participants:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST - Enroll a patient in a research study
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const studyId = params.id
    const body = await request.json()

    if (!studyId) {
      return NextResponse.json({ error: "Study ID is required" }, { status: 400 })
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
      // Continue without user ID - will be null
    }

    // Validate required fields
    if (!body.patient_id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    if (body.consent_obtained === undefined || body.consent_obtained === null) {
      return NextResponse.json({ error: "Consent status is required" }, { status: 400 })
    }

    // If consent is obtained, consent_date is required
    if (body.consent_obtained === true && !body.consent_date) {
      return NextResponse.json({ error: "Consent date is required when consent is obtained" }, { status: 400 })
    }

    // Validate and normalize enrollment date
    const enrollmentDate = body.enrolled_date 
      ? getUTCDateString(new Date(body.enrolled_date))
      : getUTCDateString()
    
    // Validate enrollment date format
    if (body.enrolled_date && !/^\d{4}-\d{2}-\d{2}$/.test(enrollmentDate)) {
      return NextResponse.json(
        { error: "Invalid enrollment date format. Expected YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Validate enrollment eligibility (pass enrollment date for validation)
    const validation = await validateEnrollment(supabase, studyId, body.patient_id, enrollmentDate)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Enrollment validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      )
    }

    // Prepare participant data (use normalized UTC date)
    const participantData = {
      study_id: studyId,
      patient_id: body.patient_id,
      enrolled_date: enrollmentDate,
      enrollment_status: 'enrolled',
      consent_obtained: body.consent_obtained,
      consent_date: body.consent_obtained 
        ? (body.consent_date ? getUTCDateString(new Date(body.consent_date)) : enrollmentDate)
        : null,
      consent_document_url: body.consent_document_url || null,
      enrolled_by: currentUserId || body.enrolled_by || null,
    }

    // Insert participant
    const { data: participant, error } = await supabase
      .from("research_study_participants")
      .insert(participantData)
      .select()
      .single()

    if (error) {
      console.error("Error enrolling participant:", error)
      
      // Handle duplicate enrollment (UNIQUE constraint violation)
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: "Enrollment failed",
            message: "Patient is already enrolled in this study",
          },
          { status: 409 }
        )
      }
      
      // Check if table doesn't exist
      if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            success: false,
            error: "Database table not found",
            message: "The research_study_participants table has not been created. Please run the database migration script.",
            code: "TABLE_NOT_FOUND",
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        {
          success: false,
          error: "Failed to enroll participant",
          message: error.message,
        },
        { status: 500 }
      )
    }

    // Get updated study with new enrollment count (trigger should have updated it)
    const { data: updatedStudy } = await supabase
      .from("research_studies")
      .select("current_enrollment, enrollment_target")
      .eq("id", studyId)
      .single()

    // Log audit trail
    await logResearchAudit({
      study_id: studyId,
      participant_id: participant.id,
      action: "enrolled",
      entity_type: "participant",
      changed_by: currentUserId || null,
      new_values: participant,
      change_description: `Patient enrolled in study. Consent: ${participant.consent_obtained ? "Yes" : "No"}`,
    })

    return NextResponse.json({
      success: true,
      participant,
      study: updatedStudy,
      message: "Patient enrolled successfully",
    })
  } catch (error) {
    console.error("Unexpected error in POST /api/research/studies/[id]/participants:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

