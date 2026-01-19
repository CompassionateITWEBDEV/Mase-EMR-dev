import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { CreateSnapshotRequest } from "@/lib/quality-metrics-types"

// GET - Fetch historical snapshots for a metric
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const metricId = params.id
    const { searchParams } = new URL(request.url)
    
    const months = parseInt(searchParams.get("months") || "12")
    const limit = parseInt(searchParams.get("limit") || "100")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")

    // Verify metric exists
    const { data: metric, error: metricError } = await supabase
      .from("research_quality_metrics")
      .select("id, name, target_value, benchmark_value, higher_is_better")
      .eq("id", metricId)
      .single()

    if (metricError || !metric) {
      return NextResponse.json(
        { success: false, error: "Quality metric not found" },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from("research_quality_snapshots")
      .select("*")
      .eq("metric_id", metricId)
      .order("snapshot_date", { ascending: true })
      .limit(limit)

    // Apply date filters
    if (dateFrom) {
      query = query.gte("snapshot_date", dateFrom)
    } else {
      // Default to last N months
      const cutoffDate = new Date()
      cutoffDate.setMonth(cutoffDate.getMonth() - months)
      query = query.gte("snapshot_date", cutoffDate.toISOString().split("T")[0])
    }

    if (dateTo) {
      query = query.lte("snapshot_date", dateTo)
    }

    const { data: snapshots, error: snapshotsError } = await query

    if (snapshotsError) {
      console.error("Error fetching snapshots:", snapshotsError)
      return NextResponse.json(
        { success: false, error: snapshotsError.message },
        { status: 500 }
      )
    }

    // Calculate statistics
    const values = (snapshots || []).map(s => s.current_value).filter(v => v !== null)
    const stats = values.length > 0 ? {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      average: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
      latest: values[values.length - 1],
      earliest: values[0],
      overall_trend: values.length > 1 
        ? (values[values.length - 1] > values[0] ? 'improving' : values[values.length - 1] < values[0] ? 'declining' : 'stable')
        : 'insufficient_data',
      meeting_target_rate: Math.round(
        (values.filter(v => 
          metric.higher_is_better !== false 
            ? v >= metric.target_value 
            : v <= metric.target_value
        ).length / values.length) * 100
      ),
    } : null

    // Format data for charts
    const chartData = (snapshots || []).map(s => ({
      date: s.snapshot_date,
      value: s.current_value,
      target: metric.target_value,
      benchmark: metric.benchmark_value,
    }))

    return NextResponse.json({
      success: true,
      metric: {
        id: metric.id,
        name: metric.name,
        target_value: metric.target_value,
        benchmark_value: metric.benchmark_value,
        higher_is_better: metric.higher_is_better,
      },
      snapshots: snapshots || [],
      chart_data: chartData,
      statistics: stats,
    })

  } catch (error) {
    console.error("Unexpected error in GET /api/research/quality-metrics/[id]/snapshots:", error)
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

// POST - Create a new snapshot for a metric
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const metricId = params.id
    const body: CreateSnapshotRequest = await request.json()

    // Validate required fields
    if (body.current_value === undefined || body.current_value === null) {
      return NextResponse.json(
        { success: false, error: "current_value is required" },
        { status: 400 }
      )
    }

    // Verify metric exists and get its config
    const { data: metric, error: metricError } = await supabase
      .from("research_quality_metrics")
      .select("id, target_value, benchmark_value, higher_is_better, reporting_period")
      .eq("id", metricId)
      .single()

    if (metricError || !metric) {
      return NextResponse.json(
        { success: false, error: "Quality metric not found" },
        { status: 404 }
      )
    }

    // Get previous snapshot for trend calculation
    const snapshotDate = body.snapshot_date || new Date().toISOString().split("T")[0]
    
    const { data: previousSnapshot } = await supabase
      .from("research_quality_snapshots")
      .select("current_value, snapshot_date")
      .eq("metric_id", metricId)
      .lt("snapshot_date", snapshotDate)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .single()

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable'
    let trendPercentage = 0
    
    if (previousSnapshot?.current_value !== null && previousSnapshot?.current_value !== undefined) {
      const change = body.current_value - previousSnapshot.current_value
      trendPercentage = Math.round((change / previousSnapshot.current_value) * 1000) / 10
      
      if (change > 1) {
        trend = 'up'
      } else if (change < -1) {
        trend = 'down'
      }
    }

    // Calculate if meeting target/benchmark
    const higherIsBetter = metric.higher_is_better !== false
    const meetsTarget = higherIsBetter 
      ? body.current_value >= metric.target_value
      : body.current_value <= metric.target_value
    
    const meetsBenchmark = metric.benchmark_value !== null
      ? (higherIsBetter 
          ? body.current_value >= metric.benchmark_value
          : body.current_value <= metric.benchmark_value)
      : null

    // Insert the snapshot
    const { data: newSnapshot, error: insertError } = await supabase
      .from("research_quality_snapshots")
      .insert({
        metric_id: metricId,
        current_value: body.current_value,
        numerator: body.numerator || null,
        denominator: body.denominator || null,
        snapshot_date: snapshotDate,
        period_start: body.period_start || null,
        period_end: body.period_end || null,
        reporting_period: metric.reporting_period,
        previous_value: previousSnapshot?.current_value || null,
        trend,
        trend_percentage: trendPercentage,
        meets_target: meetsTarget,
        meets_benchmark: meetsBenchmark,
        calculation_notes: body.calculation_notes || null,
        data_quality_score: body.data_quality_score || null,
        calculated_by: 'manual',
      })
      .select()
      .single()

    if (insertError) {
      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: `Snapshot already exists for date ${snapshotDate}` },
          { status: 409 }
        )
      }
      console.error("Error creating snapshot:", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      snapshot: newSnapshot,
      message: "Snapshot created successfully",
    })

  } catch (error) {
    console.error("Unexpected error in POST /api/research/quality-metrics/[id]/snapshots:", error)
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

