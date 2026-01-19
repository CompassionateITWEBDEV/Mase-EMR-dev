import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { 
  QualityMetricDetailResponse,
  UpdateQualityMetricRequest 
} from "@/lib/quality-metrics-types"

// GET - Fetch a single quality metric with all related data
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const metricId = params.id
    const { searchParams } = new URL(request.url)
    const historyMonths = parseInt(searchParams.get("history_months") || "12")

    // Fetch the metric
    const { data: metric, error: metricError } = await supabase
      .from("research_quality_metrics")
      .select("*")
      .eq("id", metricId)
      .single()

    if (metricError) {
      if (metricError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Quality metric not found" },
          { status: 404 }
        )
      }
      console.error("Error fetching quality metric:", metricError)
      return NextResponse.json(
        { success: false, error: metricError.message },
        { status: 500 }
      )
    }

    // Calculate cutoff date for historical data
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - historyMonths)

    // Fetch historical snapshots
    const { data: snapshots, error: snapshotsError } = await supabase
      .from("research_quality_snapshots")
      .select("*")
      .eq("metric_id", metricId)
      .gte("snapshot_date", cutoffDate.toISOString().split("T")[0])
      .order("snapshot_date", { ascending: true })

    if (snapshotsError) {
      console.error("Error fetching snapshots:", snapshotsError)
    }

    // Fetch benchmarks
    const { data: benchmarks, error: benchmarksError } = await supabase
      .from("research_quality_benchmarks")
      .select("*")
      .eq("metric_id", metricId)
      .eq("is_active", true)
      .order("benchmark_type")

    if (benchmarksError) {
      console.error("Error fetching benchmarks:", benchmarksError)
    }

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from("research_quality_goals")
      .select("*")
      .eq("metric_id", metricId)
      .in("status", ["active", "in_progress"])
      .order("end_date", { ascending: true })

    if (goalsError) {
      console.error("Error fetching goals:", goalsError)
    }

    // Fetch linked entities
    const { data: links, error: linksError } = await supabase
      .from("research_quality_metric_links")
      .select("*")
      .eq("metric_id", metricId)

    if (linksError) {
      console.error("Error fetching links:", linksError)
    }

    // Get the latest snapshot for current values
    const latestSnapshot = snapshots && snapshots.length > 0 
      ? snapshots[snapshots.length - 1] 
      : null

    // Combine metric with current data
    const metricWithData = {
      ...metric,
      current_value: latestSnapshot?.current_value ?? null,
      trend: latestSnapshot?.trend ?? null,
      trend_percentage: latestSnapshot?.trend_percentage ?? null,
      meets_target: latestSnapshot?.meets_target ?? null,
      meets_benchmark: latestSnapshot?.meets_benchmark ?? null,
      last_calculated: latestSnapshot?.created_at ?? null,
      historical_data: snapshots || [],
    }

    return NextResponse.json({
      success: true,
      metric: metricWithData,
      historical_data: snapshots || [],
      benchmarks: benchmarks || [],
      goals: goals || [],
      linked_entities: links || [],
    } as QualityMetricDetailResponse)

  } catch (error) {
    console.error("Unexpected error in GET /api/research/quality-metrics/[id]:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// PATCH - Update a quality metric
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const metricId = params.id
    const body: UpdateQualityMetricRequest = await request.json()

    // Check if metric exists
    const { data: existingMetric, error: fetchError } = await supabase
      .from("research_quality_metrics")
      .select("id")
      .eq("id", metricId)
      .single()

    if (fetchError || !existingMetric) {
      return NextResponse.json(
        { success: false, error: "Quality metric not found" },
        { status: 404 }
      )
    }

    // Validate category if provided
    if (body.category) {
      const validCategories = ['outcomes', 'access', 'ccbhc', 'integration', 'safety', 'efficiency', 'patient_experience']
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
          },
          { status: 400 }
        )
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.target_value !== undefined) updateData.target_value = body.target_value
    if (body.benchmark_value !== undefined) updateData.benchmark_value = body.benchmark_value
    if (body.benchmark_source !== undefined) updateData.benchmark_source = body.benchmark_source
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.data_source !== undefined) updateData.data_source = body.data_source
    if (body.calculation_method !== undefined) updateData.calculation_method = body.calculation_method
    if (body.reporting_period !== undefined) updateData.reporting_period = body.reporting_period
    if (body.higher_is_better !== undefined) updateData.higher_is_better = body.higher_is_better
    if (body.warning_threshold !== undefined) updateData.warning_threshold = body.warning_threshold
    if (body.critical_threshold !== undefined) updateData.critical_threshold = body.critical_threshold
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.is_ccbhc_required !== undefined) updateData.is_ccbhc_required = body.is_ccbhc_required
    if (body.is_mips_measure !== undefined) updateData.is_mips_measure = body.is_mips_measure
    if (body.measure_steward !== undefined) updateData.measure_steward = body.measure_steward

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      )
    }

    // Perform update
    const { data: updatedMetric, error: updateError } = await supabase
      .from("research_quality_metrics")
      .update(updateData)
      .eq("id", metricId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating quality metric:", updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      metric: updatedMetric,
      message: "Quality metric updated successfully",
    })

  } catch (error) {
    console.error("Unexpected error in PATCH /api/research/quality-metrics/[id]:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a quality metric (soft delete by setting is_active to false)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const metricId = params.id
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get("hard") === "true"

    // Check if metric exists
    const { data: existingMetric, error: fetchError } = await supabase
      .from("research_quality_metrics")
      .select("id, name")
      .eq("id", metricId)
      .single()

    if (fetchError || !existingMetric) {
      return NextResponse.json(
        { success: false, error: "Quality metric not found" },
        { status: 404 }
      )
    }

    if (hardDelete) {
      // Hard delete - this will cascade delete snapshots, benchmarks, goals, and links
      const { error: deleteError } = await supabase
        .from("research_quality_metrics")
        .delete()
        .eq("id", metricId)

      if (deleteError) {
        console.error("Error deleting quality metric:", deleteError)
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Quality metric '${existingMetric.name}' permanently deleted`,
      })
    } else {
      // Soft delete - set is_active to false
      const { error: updateError } = await supabase
        .from("research_quality_metrics")
        .update({ is_active: false })
        .eq("id", metricId)

      if (updateError) {
        console.error("Error deactivating quality metric:", updateError)
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Quality metric '${existingMetric.name}' deactivated`,
      })
    }

  } catch (error) {
    console.error("Unexpected error in DELETE /api/research/quality-metrics/[id]:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

