import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { 
  QualityMetricsListResponse, 
  QualityMetricWithData,
  QualityMetricsFilterOptions,
  CreateQualityMetricRequest 
} from "@/lib/quality-metrics-types"

// GET - Fetch all quality metrics with current values and historical data
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Parse filter options
    const filters: QualityMetricsFilterOptions = {
      category: searchParams.get("category") as QualityMetricsFilterOptions["category"] || undefined,
      status: searchParams.get("status") as QualityMetricsFilterOptions["status"] || undefined,
      is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
      is_ccbhc_required: searchParams.get("is_ccbhc_required") === "true" ? true : undefined,
      is_mips_measure: searchParams.get("is_mips_measure") === "true" ? true : undefined,
      search: searchParams.get("search") || undefined,
      sort_by: searchParams.get("sort_by") as QualityMetricsFilterOptions["sort_by"] || "name",
      sort_order: searchParams.get("sort_order") as QualityMetricsFilterOptions["sort_order"] || "asc",
    }
    
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const includeHistory = searchParams.get("include_history") === "true"
    const historyMonths = parseInt(searchParams.get("history_months") || "12")

    // Build query for metrics
    let query = supabase
      .from("research_quality_metrics")
      .select("*", { count: "exact" })
    
    // Apply filters
    if (filters.category) {
      query = query.eq("category", filters.category)
    }
    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active)
    }
    if (filters.is_ccbhc_required) {
      query = query.eq("is_ccbhc_required", true)
    }
    if (filters.is_mips_measure) {
      query = query.eq("is_mips_measure", true)
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,code.ilike.%${filters.search}%`)
    }
    
    // Apply sorting
    const sortColumn = filters.sort_by || "name"
    const sortOrder = filters.sort_order === "desc" ? false : true
    query = query.order(sortColumn, { ascending: sortOrder })
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: metrics, error: metricsError, count } = await query

    if (metricsError) {
      console.error("Error fetching quality metrics:", metricsError)
      return NextResponse.json(
        { success: false, error: metricsError.message },
        { status: 500 }
      )
    }

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        success: true,
        metrics: [],
        total: 0,
        page,
        limit,
        summary: {
          total_metrics: 0,
          active_metrics: 0,
          meeting_target: 0,
          meeting_benchmark: 0,
          below_warning: 0,
          below_critical: 0,
          average_performance: 0,
        },
      } as QualityMetricsListResponse)
    }

    // Get latest snapshots for each metric
    const metricIds = metrics.map(m => m.id)
    
    // Get latest snapshot for each metric
    const { data: latestSnapshots, error: snapshotsError } = await supabase
      .from("research_quality_snapshots")
      .select("*")
      .in("metric_id", metricIds)
      .order("snapshot_date", { ascending: false })

    if (snapshotsError) {
      console.error("Error fetching snapshots:", snapshotsError)
    }

    // Group snapshots by metric and get the most recent
    const latestSnapshotByMetric: Record<string, any> = {}
    const historicalByMetric: Record<string, any[]> = {}
    
    if (latestSnapshots) {
      for (const snapshot of latestSnapshots) {
        if (!latestSnapshotByMetric[snapshot.metric_id]) {
          latestSnapshotByMetric[snapshot.metric_id] = snapshot
        }
        
        if (includeHistory) {
          if (!historicalByMetric[snapshot.metric_id]) {
            historicalByMetric[snapshot.metric_id] = []
          }
          // Only include snapshots within the history window
          const snapshotDate = new Date(snapshot.snapshot_date)
          const cutoffDate = new Date()
          cutoffDate.setMonth(cutoffDate.getMonth() - historyMonths)
          
          if (snapshotDate >= cutoffDate) {
            historicalByMetric[snapshot.metric_id].push(snapshot)
          }
        }
      }
    }

    // Combine metrics with their latest snapshot data
    const metricsWithData: QualityMetricWithData[] = metrics.map(metric => {
      const latestSnapshot = latestSnapshotByMetric[metric.id]
      const historical = historicalByMetric[metric.id] || []
      
      return {
        ...metric,
        current_value: latestSnapshot?.current_value ?? null,
        trend: latestSnapshot?.trend ?? null,
        trend_percentage: latestSnapshot?.trend_percentage ?? null,
        meets_target: latestSnapshot?.meets_target ?? null,
        meets_benchmark: latestSnapshot?.meets_benchmark ?? null,
        last_calculated: latestSnapshot?.created_at ?? null,
        historical_data: includeHistory ? historical.reverse() : undefined, // Chronological order
      }
    })

    // Filter by status if specified (needs current_value)
    let filteredMetrics = metricsWithData
    if (filters.status && filters.status !== 'all') {
      filteredMetrics = metricsWithData.filter(m => {
        if (m.current_value === null || m.current_value === undefined) return false
        
        const higherIsBetter = m.higher_is_better !== false
        const meetsTarget = higherIsBetter 
          ? m.current_value >= m.target_value
          : m.current_value <= m.target_value
        
        const nearTarget = higherIsBetter
          ? m.current_value >= (m.benchmark_value ?? m.target_value * 0.9)
          : m.current_value <= (m.benchmark_value ?? m.target_value * 1.1)
        
        switch (filters.status) {
          case 'meeting_target':
            return meetsTarget
          case 'near_target':
            return !meetsTarget && nearTarget
          case 'below_target':
            return !meetsTarget && !nearTarget
          default:
            return true
        }
      })
    }

    // Calculate summary statistics
    const activeMetrics = filteredMetrics.filter(m => m.is_active)
    const metricsWithValues = activeMetrics.filter(m => m.current_value !== null && m.current_value !== undefined)
    
    const meetingTarget = metricsWithValues.filter(m => {
      const higherIsBetter = m.higher_is_better !== false
      return higherIsBetter 
        ? (m.current_value ?? 0) >= m.target_value
        : (m.current_value ?? 0) <= m.target_value
    }).length

    const meetingBenchmark = metricsWithValues.filter(m => {
      if (!m.benchmark_value) return false
      const higherIsBetter = m.higher_is_better !== false
      return higherIsBetter 
        ? (m.current_value ?? 0) >= m.benchmark_value
        : (m.current_value ?? 0) <= m.benchmark_value
    }).length

    const belowWarning = metricsWithValues.filter(m => {
      if (!m.warning_threshold) return false
      const higherIsBetter = m.higher_is_better !== false
      return higherIsBetter 
        ? (m.current_value ?? 0) < m.warning_threshold
        : (m.current_value ?? 0) > m.warning_threshold
    }).length

    const belowCritical = metricsWithValues.filter(m => {
      if (!m.critical_threshold) return false
      const higherIsBetter = m.higher_is_better !== false
      return higherIsBetter 
        ? (m.current_value ?? 0) < m.critical_threshold
        : (m.current_value ?? 0) > m.critical_threshold
    }).length

    const avgPerformance = metricsWithValues.length > 0
      ? metricsWithValues.reduce((sum, m) => sum + (m.current_value ?? 0), 0) / metricsWithValues.length
      : 0

    return NextResponse.json({
      success: true,
      metrics: filteredMetrics,
      total: count || filteredMetrics.length,
      page,
      limit,
      summary: {
        total_metrics: metrics.length,
        active_metrics: activeMetrics.length,
        meeting_target: meetingTarget,
        meeting_benchmark: meetingBenchmark,
        below_warning: belowWarning,
        below_critical: belowCritical,
        average_performance: Math.round(avgPerformance * 10) / 10,
      },
    } as QualityMetricsListResponse)

  } catch (error) {
    console.error("Unexpected error in GET /api/research/quality-metrics:", error)
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

// POST - Create a new quality metric
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body: CreateQualityMetricRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.category || body.target_value === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: name, category, and target_value are required" 
        },
        { status: 400 }
      )
    }

    // Validate category
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

    // Check for duplicate code if provided
    if (body.code) {
      const { data: existing } = await supabase
        .from("research_quality_metrics")
        .select("id")
        .eq("code", body.code)
        .single()
      
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Metric with code '${body.code}' already exists` },
          { status: 409 }
        )
      }
    }

    // Insert the new metric
    const { data: newMetric, error: insertError } = await supabase
      .from("research_quality_metrics")
      .insert({
        name: body.name,
        code: body.code || null,
        description: body.description || null,
        category: body.category,
        target_value: body.target_value,
        benchmark_value: body.benchmark_value || null,
        benchmark_source: body.benchmark_source || null,
        unit: body.unit || '%',
        data_source: body.data_source || null,
        calculation_method: body.calculation_method || null,
        reporting_period: body.reporting_period || 'monthly',
        higher_is_better: body.higher_is_better !== false,
        warning_threshold: body.warning_threshold || null,
        critical_threshold: body.critical_threshold || null,
        is_active: true,
        is_ccbhc_required: body.is_ccbhc_required || false,
        is_mips_measure: body.is_mips_measure || false,
        measure_steward: body.measure_steward || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating quality metric:", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      metric: newMetric,
      message: "Quality metric created successfully",
    })

  } catch (error) {
    console.error("Unexpected error in POST /api/research/quality-metrics:", error)
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

