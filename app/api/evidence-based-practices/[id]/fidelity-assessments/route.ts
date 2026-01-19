import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { recalculateEbpMetrics } from "../../utils/calculate-metrics"

// GET - Get fidelity assessments for an EBP
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Get assessments - order by date DESC, then by created_at DESC for same-date tiebreaker
    const { data: assessments, error } = await supabase
      .from("ebp_fidelity_assessments")
      .select("*")
      .eq("ebp_id", ebpId)
      .order("assessment_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching fidelity assessments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      assessments: assessments || [],
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/evidence-based-practices/[id]/fidelity-assessments:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST - Create a new fidelity assessment
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id
    const body = await request.json()

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Validation
    if (body.fidelity_score === undefined || body.fidelity_score === null) {
      return NextResponse.json({ error: "Fidelity score is required" }, { status: 400 })
    }

    const score = parseFloat(body.fidelity_score)
    if (isNaN(score) || score < 0 || score > 100) {
      return NextResponse.json({ error: "Fidelity score must be between 0 and 100" }, { status: 400 })
    }

    // Date validation
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const assessmentDate = body.assessment_date || new Date().toISOString().split('T')[0]
    const assessmentDateObj = new Date(assessmentDate)
    assessmentDateObj.setHours(0, 0, 0, 0)
    
    if (assessmentDateObj > today) {
      return NextResponse.json({ error: "Assessment date cannot be in the future" }, { status: 400 })
    }

    // Prepare assessment data
    const assessmentData = {
      ebp_id: ebpId,
      organization_id: body.organization_id || null,
      assessment_date: assessmentDate,
      assessor_id: body.assessor_id || null,
      assessment_type: body.assessment_type || 'standard',
      fidelity_score: score,
      assessment_criteria: body.assessment_criteria ? JSON.stringify(body.assessment_criteria) : null,
      notes: body.notes || null,
    }

    // Insert assessment
    const { data, error } = await supabase
      .from("ebp_fidelity_assessments")
      .insert(assessmentData)
      .select()
      .single()

    if (error) {
      console.error("Error creating fidelity assessment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Recalculate and update cached metrics
    let updatedMetrics = null
    try {
      updatedMetrics = await recalculateEbpMetrics(ebpId)
      console.log(`[Fidelity] Recalculated metrics for EBP ${ebpId}:`, updatedMetrics)
    } catch (metricError) {
      console.warn("Error recalculating metrics after fidelity assessment:", metricError)
      // Don't fail the request if metric calculation fails
    }

    // Fetch the updated EBP to return with response
    const { data: updatedEbp, error: ebpError } = await supabase
      .from("evidence_based_practices")
      .select("id, name, fidelity_score, last_fidelity_review, adoption_rate, sustainability_score")
      .eq("id", ebpId)
      .single()

    if (ebpError) {
      console.warn("Error fetching updated EBP:", ebpError)
    }

    // Parse assessment_criteria if it's a string
    const assessment = {
      ...data,
      assessment_criteria: data.assessment_criteria 
        ? (typeof data.assessment_criteria === 'string' ? JSON.parse(data.assessment_criteria) : data.assessment_criteria)
        : null,
    }

    return NextResponse.json({
      success: true,
      assessment: assessment,
      updated_ebp: updatedEbp || null,
      updated_metrics: updatedMetrics || null,
      message: "Fidelity assessment created successfully",
    }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in POST /api/evidence-based-practices/[id]/fidelity-assessments:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

