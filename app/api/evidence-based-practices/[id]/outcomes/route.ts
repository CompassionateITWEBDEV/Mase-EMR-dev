import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { recalculateEbpMetrics } from "../../utils/calculate-metrics"

// GET - Get outcomes for an EBP
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id
    const { searchParams } = new URL(request.url)
    const outcomeType = searchParams.get("outcome_type")
    const patientId = searchParams.get("patient_id")

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from("ebp_outcomes")
      .select("*")
      .eq("ebp_id", ebpId)

    if (outcomeType) {
      query = query.eq("outcome_type", outcomeType)
    }

    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    query = query.order("measurement_date", { ascending: false })

    const { data: outcomes, error } = await query

    if (error) {
      console.error("Error fetching outcomes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get statistics by outcome type
    const statsByType: Record<string, any> = {}
    if (outcomes && outcomes.length > 0) {
      outcomes.forEach((outcome) => {
        if (!statsByType[outcome.outcome_type]) {
          statsByType[outcome.outcome_type] = {
            type: outcome.outcome_type,
            count: 0,
            average: 0,
            values: [],
          }
        }
        statsByType[outcome.outcome_type].count++
        if (outcome.outcome_value !== null) {
          statsByType[outcome.outcome_type].values.push(parseFloat(outcome.outcome_value))
        }
      })

      // Calculate averages
      Object.keys(statsByType).forEach((type) => {
        const values = statsByType[type].values.filter((v: number) => !isNaN(v))
        if (values.length > 0) {
          statsByType[type].average = values.reduce((a: number, b: number) => a + b, 0) / values.length
        }
      })
    }

    return NextResponse.json({
      success: true,
      outcomes: outcomes || [],
      statistics: Object.values(statsByType),
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/evidence-based-practices/[id]/outcomes:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST - Record an outcome for an EBP
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id
    const body = await request.json()

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Validation
    if (!body.patient_id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    if (!body.outcome_type || !body.outcome_type.trim()) {
      return NextResponse.json({ error: "Outcome type is required" }, { status: 400 })
    }

    // Date validation
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const measurementDate = body.measurement_date || new Date().toISOString().split('T')[0]
    const measurementDateObj = new Date(measurementDate)
    measurementDateObj.setHours(0, 0, 0, 0)
    
    if (measurementDateObj > today) {
      return NextResponse.json({ error: "Measurement date cannot be in the future" }, { status: 400 })
    }

    // Outcome value validation based on outcome type
    if (body.outcome_value !== undefined && body.outcome_value !== null && body.outcome_value !== '') {
      const outcomeValue = parseFloat(body.outcome_value)
      if (isNaN(outcomeValue)) {
        return NextResponse.json({ error: "Outcome value must be a valid number" }, { status: 400 })
      }

      const outcomeType = body.outcome_type.trim().toLowerCase()
      
      // Validation rules based on common outcome types
      if (outcomeType.includes('percentage') || outcomeType.includes('rate') || outcomeType.includes('%')) {
        if (outcomeValue < 0 || outcomeValue > 100) {
          return NextResponse.json({ error: "Percentage/rate outcomes must be between 0 and 100" }, { status: 400 })
        }
      } else if (outcomeType.includes('score') || outcomeType.includes('scale')) {
        // Common scales: 0-10, 0-27 (PHQ-9), 0-15 (BIMS), etc.
        // We'll allow 0-100 as default, but can be customized
        if (outcomeValue < 0) {
          return NextResponse.json({ error: "Score outcomes cannot be negative" }, { status: 400 })
        }
        // Max value depends on specific scale, but we'll allow up to 100 as default
        if (outcomeValue > 100) {
          return NextResponse.json({ error: "Score outcomes should typically be between 0 and 100. If using a different scale, please verify the value." }, { status: 400 })
        }
      } else if (outcomeType.includes('count') || outcomeType.includes('number')) {
        if (outcomeValue < 0) {
          return NextResponse.json({ error: "Count outcomes cannot be negative" }, { status: 400 })
        }
      }
      // For other types, we'll allow any numeric value but warn if negative
      if (outcomeValue < 0 && !outcomeType.includes('change') && !outcomeType.includes('difference')) {
        return NextResponse.json({ error: "Outcome value cannot be negative unless it represents a change or difference" }, { status: 400 })
      }
    }

    // Duplicate prevention: Check if same patient, same EBP, same outcome type, same date already exists
    const { data: existingOutcome, error: checkError } = await supabase
      .from("ebp_outcomes")
      .select("id")
      .eq("ebp_id", ebpId)
      .eq("patient_id", body.patient_id)
      .eq("outcome_type", body.outcome_type.trim())
      .eq("measurement_date", measurementDate)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking for duplicate outcome:", checkError)
      return NextResponse.json({ error: "Error checking for duplicate outcome" }, { status: 500 })
    }

    if (existingOutcome) {
      return NextResponse.json({ 
        error: "An outcome of this type for this patient on this date already exists. Please use a different date or update the existing record." 
      }, { status: 409 }) // 409 Conflict
    }

    // Prepare outcome data
    const outcomeData = {
      ebp_id: ebpId,
      patient_id: body.patient_id,
      organization_id: body.organization_id || null,
      outcome_type: body.outcome_type.trim(),
      outcome_value: body.outcome_value !== undefined && body.outcome_value !== null && body.outcome_value !== '' ? parseFloat(body.outcome_value) : null,
      outcome_unit: body.outcome_unit || null,
      measurement_date: measurementDate,
      encounter_id: body.encounter_id || null,
      assessment_id: body.assessment_id || null,
      notes: body.notes || null,
      recorded_by: body.recorded_by || null,
    }

    // Insert outcome
    const { data, error } = await supabase
      .from("ebp_outcomes")
      .insert(outcomeData)
      .select()
      .single()

    if (error) {
      console.error("Error creating outcome:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Recalculate and update cached metrics (especially sustainability score)
    try {
      await recalculateEbpMetrics(ebpId)
    } catch (metricError) {
      console.warn("Error recalculating metrics after outcome creation:", metricError)
      // Don't fail the request if metric calculation fails
    }

    return NextResponse.json({
      success: true,
      outcome: data,
      message: "Outcome recorded successfully",
    }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in POST /api/evidence-based-practices/[id]/outcomes:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

