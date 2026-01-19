import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET - Get treatment plans for a patient
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patient_id")

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    const { data: treatmentPlans, error } = await supabase
      .from("treatment_plans")
      .select(`
        *,
        provider:providers(id, first_name, last_name)
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching treatment plans:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      treatmentPlans: treatmentPlans || [],
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/treatment-plans:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST - Create a new treatment plan
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    // Validation
    if (!body.patient_id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    if (!body.provider_id) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    if (!body.goals || !Array.isArray(body.goals) || body.goals.length === 0) {
      return NextResponse.json({ error: "At least one treatment goal is required" }, { status: 400 })
    }

    // Prepare treatment plan data
    const treatmentPlanData = {
      patient_id: body.patient_id,
      provider_id: body.provider_id,
      goals: body.goals,
      interventions: body.interventions || [],
      target_date: body.target_date || null,
      status: body.status || "active",
    }

    // Insert treatment plan
    const { data: treatmentPlan, error } = await supabase
      .from("treatment_plans")
      .insert(treatmentPlanData)
      .select()
      .single()

    if (error) {
      console.error("Error creating treatment plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Link Evidence-Based Practices if provided
    if (body.ebp_ids && Array.isArray(body.ebp_ids) && body.ebp_ids.length > 0) {
      // Store EBP references in the interventions JSONB field
      // This allows us to track which EBPs are part of the treatment plan
      const interventionsWithEBPs = [
        ...(body.interventions || []),
        ...body.ebp_ids.map((ebpId: string) => ({
          type: "evidence_based_practice",
          ebp_id: ebpId,
          description: "Evidence-Based Practice included in treatment plan",
        })),
      ]

      // Update treatment plan with EBP references
      await supabase
        .from("treatment_plans")
        .update({ interventions: interventionsWithEBPs })
        .eq("id", treatmentPlan.id)

      // Optionally, create initial EBP delivery records for tracking
      // This can be done later when the EBP is actually delivered
    }

    return NextResponse.json({
      success: true,
      treatmentPlan,
      message: "Treatment plan created successfully",
    })
  } catch (error) {
    console.error("Unexpected error in POST /api/treatment-plans:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

