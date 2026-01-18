import { createServiceClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/middleware"

// Helper to validate UUID format
function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

interface ASAMDimensions {
  dimension1: number | null
  dimension2: number | null
  dimension3: number | null
  dimension4: string | null
  dimension5: number | null
  dimension6: number | null
}

interface ASAMAssessmentPayload {
  patient_id: string
  provider_id?: string
  dimensions: ASAMDimensions
  recommended_level: string
  suggested_level?: string | null
  suggestion_overridden?: boolean
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    
    if (authError || !user) {
      console.warn("[ASAM API] Authentication failed:", authError)
      // In development, allow the request to proceed
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const supabase = createServiceClient()
    const body: ASAMAssessmentPayload = await request.json()

    // Validate required fields
    if (!body.patient_id) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      )
    }

    if (!body.dimensions) {
      return NextResponse.json(
        { error: "dimensions object is required" },
        { status: 400 }
      )
    }

    if (!body.recommended_level) {
      return NextResponse.json(
        { error: "recommended_level is required" },
        { status: 400 }
      )
    }

    // Validate all dimensions are present
    const { dimension1, dimension2, dimension3, dimension4, dimension5, dimension6 } = body.dimensions
    if (
      dimension1 === null || dimension1 === undefined ||
      dimension2 === null || dimension2 === undefined ||
      dimension3 === null || dimension3 === undefined ||
      dimension4 === null || dimension4 === undefined ||
      dimension5 === null || dimension5 === undefined ||
      dimension6 === null || dimension6 === undefined
    ) {
      return NextResponse.json(
        { error: "All six ASAM dimensions must be provided" },
        { status: 400 }
      )
    }

    // Build the risk_assessment JSONB structure
    const riskAssessment = {
      asam_dimensions: {
        dimension1: body.dimensions.dimension1,
        dimension2: body.dimensions.dimension2,
        dimension3: body.dimensions.dimension3,
        dimension4: body.dimensions.dimension4,
        dimension5: body.dimensions.dimension5,
        dimension6: body.dimensions.dimension6,
      },
      recommended_level: body.recommended_level,
      suggested_level: body.suggested_level || null,
      suggestion_overridden: body.suggestion_overridden || false,
    }

    // Determine provider_id - must be a valid UUID
    let providerId: string | null = null
    if (body.provider_id && isValidUUID(body.provider_id)) {
      providerId = body.provider_id
    } else if (user?.id && isValidUUID(user.id)) {
      providerId = user.id
    }
    // If provider_id is not a valid UUID (e.g., "dev-bypass-user"), leave it as null

    // Create the assessment record
    const { data: assessment, error: insertError } = await supabase
      .from("assessments")
      .insert({
        patient_id: body.patient_id,
        provider_id: providerId,
        assessment_type: "ASAM Criteria Assessment",
        risk_assessment: riskAssessment,
        chief_complaint: body.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("[ASAM API] Error creating assessment:", insertError)
      return NextResponse.json(
        { error: insertError.message || "Failed to create ASAM assessment" },
        { status: 500 }
      )
    }

    console.log("[ASAM API] Created ASAM assessment:", assessment.id)

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        patient_id: assessment.patient_id,
        provider_id: assessment.provider_id,
        assessment_type: assessment.assessment_type,
        risk_assessment: assessment.risk_assessment,
        created_at: assessment.created_at,
      },
    })
  } catch (error) {
    console.error("[ASAM API] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to process ASAM assessment" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patient_id")

    if (!patientId) {
      return NextResponse.json(
        { error: "patient_id query parameter is required" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Fetch ASAM assessments for the patient
    const { data: assessments, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("patient_id", patientId)
      .ilike("assessment_type", "%asam%")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ASAM API] Error fetching assessments:", error)
      return NextResponse.json(
        { error: error.message || "Failed to fetch ASAM assessments" },
        { status: 500 }
      )
    }

    // Transform assessments to extract ASAM-specific data
    const asamAssessments = (assessments || []).map((assessment) => {
      const riskAssessment = assessment.risk_assessment as {
        asam_dimensions?: ASAMDimensions
        recommended_level?: string
        suggested_level?: string | null
        suggestion_overridden?: boolean
      } | null

      return {
        id: assessment.id,
        patient_id: assessment.patient_id,
        provider_id: assessment.provider_id,
        assessment_type: assessment.assessment_type,
        dimensions: riskAssessment?.asam_dimensions || null,
        recommended_level: riskAssessment?.recommended_level || null,
        suggested_level: riskAssessment?.suggested_level || null,
        suggestion_overridden: riskAssessment?.suggestion_overridden || false,
        notes: assessment.chief_complaint,
        created_at: assessment.created_at,
        updated_at: assessment.updated_at,
      }
    })

    return NextResponse.json({
      assessments: asamAssessments,
      count: asamAssessments.length,
    })
  } catch (error) {
    console.error("[ASAM API] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to fetch ASAM assessments" },
      { status: 500 }
    )
  }
}
