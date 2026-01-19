import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET - Export quality metrics data in various formats
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const format = searchParams.get("format") || "json" // json, csv, summary
    const category = searchParams.get("category")
    const includeHistory = searchParams.get("include_history") === "true"
    const historyMonths = parseInt(searchParams.get("history_months") || "12")

    // Build query
    let query = supabase
      .from("research_quality_metrics")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name")

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data: metrics, error: metricsError } = await query

    if (metricsError) {
      console.error("Error fetching metrics:", metricsError)
      return NextResponse.json(
        { success: false, error: metricsError.message },
        { status: 500 }
      )
    }

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        format,
        message: "No metrics found",
      })
    }

    // Get latest snapshots
    const metricIds = metrics.map(m => m.id)
    
    const { data: snapshots, error: snapshotsError } = await supabase
      .from("research_quality_snapshots")
      .select("*")
      .in("metric_id", metricIds)
      .order("snapshot_date", { ascending: false })

    if (snapshotsError) {
      console.error("Error fetching snapshots:", snapshotsError)
    }

    // Group snapshots by metric
    const snapshotsByMetric: Record<string, any[]> = {}
    const latestSnapshotByMetric: Record<string, any> = {}
    
    if (snapshots) {
      const cutoffDate = new Date()
      cutoffDate.setMonth(cutoffDate.getMonth() - historyMonths)
      
      for (const snapshot of snapshots) {
        if (!latestSnapshotByMetric[snapshot.metric_id]) {
          latestSnapshotByMetric[snapshot.metric_id] = snapshot
        }
        
        if (includeHistory) {
          const snapshotDate = new Date(snapshot.snapshot_date)
          if (snapshotDate >= cutoffDate) {
            if (!snapshotsByMetric[snapshot.metric_id]) {
              snapshotsByMetric[snapshot.metric_id] = []
            }
            snapshotsByMetric[snapshot.metric_id].push(snapshot)
          }
        }
      }
    }

    // Enrich metrics with snapshot data
    const enrichedMetrics = metrics.map(metric => {
      const latest = latestSnapshotByMetric[metric.id]
      const history = snapshotsByMetric[metric.id] || []
      
      return {
        id: metric.id,
        code: metric.code,
        name: metric.name,
        description: metric.description,
        category: metric.category,
        target_value: metric.target_value,
        benchmark_value: metric.benchmark_value,
        benchmark_source: metric.benchmark_source,
        unit: metric.unit,
        current_value: latest?.current_value ?? null,
        trend: latest?.trend ?? null,
        trend_percentage: latest?.trend_percentage ?? null,
        meets_target: latest?.meets_target ?? null,
        meets_benchmark: latest?.meets_benchmark ?? null,
        last_calculated: latest?.snapshot_date ?? null,
        data_source: metric.data_source,
        calculation_method: metric.calculation_method,
        reporting_period: metric.reporting_period,
        higher_is_better: metric.higher_is_better,
        warning_threshold: metric.warning_threshold,
        critical_threshold: metric.critical_threshold,
        is_ccbhc_required: metric.is_ccbhc_required,
        is_mips_measure: metric.is_mips_measure,
        measure_steward: metric.measure_steward,
        historical_values: includeHistory ? history.reverse().map((s: any) => ({
          date: s.snapshot_date,
          value: s.current_value,
          meets_target: s.meets_target,
        })) : undefined,
      }
    })

    // Calculate summary statistics
    const metricsWithValues = enrichedMetrics.filter(m => m.current_value !== null)
    const summary = {
      total_metrics: enrichedMetrics.length,
      metrics_with_data: metricsWithValues.length,
      meeting_target: metricsWithValues.filter(m => m.meets_target === true).length,
      near_target: metricsWithValues.filter(m => {
        if (m.meets_target) return false
        if (m.current_value === null || m.benchmark_value === null) return false
        return m.higher_is_better !== false
          ? m.current_value >= m.benchmark_value
          : m.current_value <= m.benchmark_value
      }).length,
      below_target: metricsWithValues.filter(m => m.meets_target === false).length,
      average_performance: metricsWithValues.length > 0
        ? Math.round(metricsWithValues.reduce((sum, m) => sum + (m.current_value || 0), 0) / metricsWithValues.length * 10) / 10
        : 0,
      by_category: Object.entries(
        enrichedMetrics.reduce((acc: Record<string, any>, m) => {
          if (!acc[m.category]) {
            acc[m.category] = { total: 0, meeting_target: 0, values: [] }
          }
          acc[m.category].total++
          if (m.meets_target) acc[m.category].meeting_target++
          if (m.current_value !== null) acc[m.category].values.push(m.current_value)
          return acc
        }, {})
      ).map(([category, data]: [string, any]) => ({
        category,
        total: data.total,
        meeting_target: data.meeting_target,
        average: data.values.length > 0
          ? Math.round(data.values.reduce((a: number, b: number) => a + b, 0) / data.values.length * 10) / 10
          : null,
      })),
      ccbhc_compliance: {
        required: enrichedMetrics.filter(m => m.is_ccbhc_required).length,
        meeting: enrichedMetrics.filter(m => m.is_ccbhc_required && m.meets_target).length,
      },
      mips_compliance: {
        tracked: enrichedMetrics.filter(m => m.is_mips_measure).length,
        meeting: enrichedMetrics.filter(m => m.is_mips_measure && m.meets_target).length,
      },
      report_generated: new Date().toISOString(),
    }

    // Format output based on requested format
    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Code",
        "Name",
        "Category",
        "Current Value",
        "Target",
        "Benchmark",
        "Unit",
        "Trend",
        "Trend %",
        "Meets Target",
        "Data Source",
        "Reporting Period",
        "CCBHC Required",
        "MIPS Measure",
      ]
      
      const rows = enrichedMetrics.map(m => [
        m.code || "",
        m.name,
        m.category,
        m.current_value ?? "",
        m.target_value,
        m.benchmark_value ?? "",
        m.unit,
        m.trend ?? "",
        m.trend_percentage ?? "",
        m.meets_target === null ? "" : m.meets_target ? "Yes" : "No",
        m.data_source || "",
        m.reporting_period,
        m.is_ccbhc_required ? "Yes" : "No",
        m.is_mips_measure ? "Yes" : "No",
      ])
      
      const csv = [
        headers.join(","),
        ...rows.map(row => row.map(cell => 
          typeof cell === "string" && cell.includes(",") 
            ? `"${cell}"` 
            : cell
        ).join(","))
      ].join("\n")
      
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="quality-metrics-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    if (format === "summary") {
      return NextResponse.json({
        success: true,
        summary,
        report_type: "Quality Metrics Summary Report",
        generated_at: new Date().toISOString(),
      })
    }

    // Default JSON format
    return NextResponse.json({
      success: true,
      metrics: enrichedMetrics,
      summary,
      format: "json",
      filters: {
        category: category || "all",
        include_history: includeHistory,
        history_months: historyMonths,
      },
      generated_at: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Unexpected error in GET /api/research/quality-metrics/export:", error)
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

