import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET - Advanced analytics for quality metrics
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const analysisType = searchParams.get("type") || "overview" // overview, trends, benchmarks, forecasts
    const category = searchParams.get("category")
    const months = parseInt(searchParams.get("months") || "12")

    // Fetch metrics
    let metricsQuery = supabase
      .from("research_quality_metrics")
      .select("*")
      .eq("is_active", true)

    if (category && category !== "all") {
      metricsQuery = metricsQuery.eq("category", category)
    }

    const { data: metrics, error: metricsError } = await metricsQuery

    if (metricsError) {
      return NextResponse.json(
        { success: false, error: metricsError.message },
        { status: 500 }
      )
    }

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        success: true,
        analysis_type: analysisType,
        data: null,
        message: "No metrics found for analysis",
      })
    }

    const metricIds = metrics.map(m => m.id)
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - months)

    // Fetch historical data
    const { data: snapshots, error: snapshotsError } = await supabase
      .from("research_quality_snapshots")
      .select("*")
      .in("metric_id", metricIds)
      .gte("snapshot_date", cutoffDate.toISOString().split("T")[0])
      .order("snapshot_date", { ascending: true })

    if (snapshotsError) {
      console.error("Error fetching snapshots:", snapshotsError)
    }

    // Group snapshots by metric
    const snapshotsByMetric: Record<string, any[]> = {}
    if (snapshots) {
      for (const snapshot of snapshots) {
        if (!snapshotsByMetric[snapshot.metric_id]) {
          snapshotsByMetric[snapshot.metric_id] = []
        }
        snapshotsByMetric[snapshot.metric_id].push(snapshot)
      }
    }

    // Build response based on analysis type
    switch (analysisType) {
      case "trends":
        return NextResponse.json({
          success: true,
          analysis_type: "trends",
          data: analyzeTrends(metrics, snapshotsByMetric),
        })

      case "benchmarks":
        return NextResponse.json({
          success: true,
          analysis_type: "benchmarks",
          data: await analyzeBenchmarks(supabase, metrics, snapshotsByMetric),
        })

      case "forecasts":
        return NextResponse.json({
          success: true,
          analysis_type: "forecasts",
          data: generateForecasts(metrics, snapshotsByMetric),
        })

      case "correlations":
        return NextResponse.json({
          success: true,
          analysis_type: "correlations",
          data: analyzeCorrelations(metrics, snapshotsByMetric),
        })

      case "overview":
      default:
        const overview = await generateOverviewAnalytics(supabase, metrics, snapshotsByMetric)
        return NextResponse.json({
          success: true,
          analysis_type: "overview",
          data: overview,
        })
    }

  } catch (error) {
    console.error("Unexpected error in GET /api/research/quality-metrics/analytics:", error)
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

// ============================================================================
// Analytics Helper Functions
// ============================================================================

async function generateOverviewAnalytics(
  supabase: any, 
  metrics: any[], 
  snapshotsByMetric: Record<string, any[]>
) {
  // Get latest values
  const latestValues = metrics.map(metric => {
    const snapshots = snapshotsByMetric[metric.id] || []
    const latest = snapshots[snapshots.length - 1]
    return {
      id: metric.id,
      name: metric.name,
      code: metric.code,
      category: metric.category,
      current_value: latest?.current_value ?? null,
      target_value: metric.target_value,
      benchmark_value: metric.benchmark_value,
      meets_target: latest?.meets_target ?? null,
    }
  })

  // Calculate category breakdown
  const categoryBreakdown = Object.entries(
    latestValues.reduce((acc: Record<string, any>, m) => {
      if (!acc[m.category]) {
        acc[m.category] = {
          total: 0,
          meeting_target: 0,
          avg_performance: [],
          avg_target_gap: [],
        }
      }
      acc[m.category].total++
      if (m.meets_target) acc[m.category].meeting_target++
      if (m.current_value !== null) {
        acc[m.category].avg_performance.push(m.current_value)
        acc[m.category].avg_target_gap.push(m.current_value - m.target_value)
      }
      return acc
    }, {})
  ).map(([category, data]: [string, any]) => ({
    category,
    total: data.total,
    meeting_target: data.meeting_target,
    meeting_rate: data.total > 0 ? Math.round((data.meeting_target / data.total) * 100) : 0,
    avg_performance: data.avg_performance.length > 0
      ? Math.round(data.avg_performance.reduce((a: number, b: number) => a + b, 0) / data.avg_performance.length * 10) / 10
      : null,
    avg_target_gap: data.avg_target_gap.length > 0
      ? Math.round(data.avg_target_gap.reduce((a: number, b: number) => a + b, 0) / data.avg_target_gap.length * 10) / 10
      : null,
  }))

  // Top performers and underperformers
  const withValues = latestValues.filter(m => m.current_value !== null)
  const topPerformers = [...withValues]
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
    .slice(0, 5)
    .map(m => ({
      name: m.name,
      code: m.code,
      value: m.current_value,
      target: m.target_value,
      gap: (m.current_value || 0) - m.target_value,
    }))

  const underperformers = [...withValues]
    .filter(m => !m.meets_target)
    .sort((a, b) => ((a.current_value || 0) - a.target_value) - ((b.current_value || 0) - b.target_value))
    .slice(0, 5)
    .map(m => ({
      name: m.name,
      code: m.code,
      value: m.current_value,
      target: m.target_value,
      gap: (m.current_value || 0) - m.target_value,
    }))

  // Overall statistics
  const overallStats = {
    total_metrics: metrics.length,
    with_data: withValues.length,
    meeting_target: latestValues.filter(m => m.meets_target).length,
    meeting_rate: metrics.length > 0 
      ? Math.round((latestValues.filter(m => m.meets_target).length / withValues.length) * 100) 
      : 0,
    avg_performance: withValues.length > 0
      ? Math.round(withValues.reduce((sum, m) => sum + (m.current_value || 0), 0) / withValues.length * 10) / 10
      : null,
    ccbhc_compliance: {
      required: metrics.filter(m => m.is_ccbhc_required).length,
      meeting: latestValues.filter(m => metrics.find(met => met.id === m.id)?.is_ccbhc_required && m.meets_target).length,
    },
    mips_compliance: {
      tracked: metrics.filter(m => m.is_mips_measure).length,
      meeting: latestValues.filter(m => metrics.find(met => met.id === m.id)?.is_mips_measure && m.meets_target).length,
    },
  }

  return {
    overall_stats: overallStats,
    category_breakdown: categoryBreakdown,
    top_performers: topPerformers,
    underperformers: underperformers,
    analysis_date: new Date().toISOString(),
  }
}

function analyzeTrends(metrics: any[], snapshotsByMetric: Record<string, any[]>) {
  return metrics.map(metric => {
    const snapshots = snapshotsByMetric[metric.id] || []
    
    if (snapshots.length < 2) {
      return {
        metric_id: metric.id,
        metric_name: metric.name,
        metric_code: metric.code,
        trend: "insufficient_data",
        data_points: snapshots.length,
      }
    }

    const values = snapshots.map(s => s.current_value).filter(v => v !== null)
    const first = values[0]
    const last = values[values.length - 1]
    const change = last - first
    const percentChange = first !== 0 ? (change / first) * 100 : 0

    // Calculate moving averages
    const movingAvg3 = values.length >= 3
      ? values.slice(-3).reduce((a, b) => a + b, 0) / 3
      : null
    const movingAvg6 = values.length >= 6
      ? values.slice(-6).reduce((a, b) => a + b, 0) / 6
      : null

    // Simple linear regression for trend direction
    const n = values.length
    const sumX = values.reduce((_, i) => _ + i, 0)
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = values.reduce((a, v, i) => a + (v * i), 0)
    const sumX2 = values.reduce((_, i) => _ + (i * i), 0)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

    let trendDirection: 'improving' | 'declining' | 'stable'
    if (slope > 0.5) trendDirection = metric.higher_is_better !== false ? 'improving' : 'declining'
    else if (slope < -0.5) trendDirection = metric.higher_is_better !== false ? 'declining' : 'improving'
    else trendDirection = 'stable'

    return {
      metric_id: metric.id,
      metric_name: metric.name,
      metric_code: metric.code,
      category: metric.category,
      trend_direction: trendDirection,
      period_change: Math.round(change * 10) / 10,
      percent_change: Math.round(percentChange * 10) / 10,
      first_value: first,
      latest_value: last,
      moving_avg_3: movingAvg3 !== null ? Math.round(movingAvg3 * 10) / 10 : null,
      moving_avg_6: movingAvg6 !== null ? Math.round(movingAvg6 * 10) / 10 : null,
      slope: Math.round(slope * 100) / 100,
      data_points: snapshots.length,
      timeline: snapshots.map(s => ({
        date: s.snapshot_date,
        value: s.current_value,
      })),
    }
  }).sort((a, b) => (b.percent_change || 0) - (a.percent_change || 0))
}

async function analyzeBenchmarks(
  supabase: any,
  metrics: any[], 
  snapshotsByMetric: Record<string, any[]>
) {
  // Fetch benchmarks
  const metricIds = metrics.map(m => m.id)
  const { data: benchmarks } = await supabase
    .from("research_quality_benchmarks")
    .select("*")
    .in("metric_id", metricIds)
    .eq("is_active", true)

  return metrics.map(metric => {
    const snapshots = snapshotsByMetric[metric.id] || []
    const latest = snapshots[snapshots.length - 1]
    const currentValue = latest?.current_value ?? null
    
    const metricBenchmarks = (benchmarks || []).filter((b: any) => b.metric_id === metric.id)

    const benchmarkComparisons = metricBenchmarks.map((b: any) => ({
      type: b.benchmark_type,
      name: b.benchmark_name,
      value: b.benchmark_value,
      source: b.source_organization,
      gap: currentValue !== null ? currentValue - b.benchmark_value : null,
      meets: currentValue !== null 
        ? (metric.higher_is_better !== false ? currentValue >= b.benchmark_value : currentValue <= b.benchmark_value)
        : null,
    }))

    // Add default benchmark from metric if no specific benchmarks exist
    if (benchmarkComparisons.length === 0 && metric.benchmark_value !== null) {
      benchmarkComparisons.push({
        type: 'default',
        name: metric.benchmark_source || 'Industry Standard',
        value: metric.benchmark_value,
        source: metric.benchmark_source,
        gap: currentValue !== null ? currentValue - metric.benchmark_value : null,
        meets: currentValue !== null 
          ? (metric.higher_is_better !== false ? currentValue >= metric.benchmark_value : currentValue <= metric.benchmark_value)
          : null,
      })
    }

    return {
      metric_id: metric.id,
      metric_name: metric.name,
      metric_code: metric.code,
      category: metric.category,
      current_value: currentValue,
      target_value: metric.target_value,
      target_gap: currentValue !== null ? currentValue - metric.target_value : null,
      meets_target: latest?.meets_target ?? null,
      benchmarks: benchmarkComparisons,
      benchmark_summary: {
        total: benchmarkComparisons.length,
        meeting: benchmarkComparisons.filter((b: any) => b.meets).length,
        best_vs_benchmark: benchmarkComparisons.length > 0
          ? Math.max(...benchmarkComparisons.map((b: any) => b.gap || -Infinity))
          : null,
        worst_vs_benchmark: benchmarkComparisons.length > 0
          ? Math.min(...benchmarkComparisons.map((b: any) => b.gap || Infinity))
          : null,
      },
    }
  })
}

function generateForecasts(metrics: any[], snapshotsByMetric: Record<string, any[]>) {
  return metrics.map(metric => {
    const snapshots = snapshotsByMetric[metric.id] || []
    
    if (snapshots.length < 3) {
      return {
        metric_id: metric.id,
        metric_name: metric.name,
        forecast_available: false,
        reason: "Insufficient historical data (need at least 3 data points)",
      }
    }

    const values = snapshots.map(s => s.current_value).filter(v => v !== null)
    
    // Simple linear regression forecast
    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = values.reduce((a, v, i) => a + (v * i), 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Forecast next 3 periods
    const forecasts = [1, 2, 3].map(periods => {
      const forecastIndex = n + periods - 1
      const forecastValue = intercept + slope * forecastIndex
      return {
        periods_ahead: periods,
        forecasted_value: Math.round(Math.max(0, Math.min(100, forecastValue)) * 10) / 10,
        confidence: Math.max(0.5, 1 - (periods * 0.15)), // Decreasing confidence
      }
    })

    // Estimate when target will be met (if trending toward it)
    const latest = values[values.length - 1]
    const target = metric.target_value
    let periodsToTarget = null
    
    if (metric.higher_is_better !== false) {
      if (latest < target && slope > 0) {
        periodsToTarget = Math.ceil((target - intercept - slope * (n - 1)) / slope)
      }
    } else {
      if (latest > target && slope < 0) {
        periodsToTarget = Math.ceil((target - intercept - slope * (n - 1)) / slope)
      }
    }

    return {
      metric_id: metric.id,
      metric_name: metric.name,
      metric_code: metric.code,
      category: metric.category,
      forecast_available: true,
      current_value: latest,
      target_value: target,
      trend_slope: Math.round(slope * 100) / 100,
      forecasts,
      periods_to_target: periodsToTarget !== null && periodsToTarget > 0 && periodsToTarget < 24 
        ? periodsToTarget 
        : null,
      will_meet_target: forecasts.some(f => 
        metric.higher_is_better !== false 
          ? f.forecasted_value >= target 
          : f.forecasted_value <= target
      ),
    }
  }).filter(f => f.forecast_available)
}

function analyzeCorrelations(metrics: any[], snapshotsByMetric: Record<string, any[]>) {
  // Simple correlation analysis between metrics
  const metricsWithData = metrics.filter(m => (snapshotsByMetric[m.id] || []).length >= 3)
  
  if (metricsWithData.length < 2) {
    return {
      correlations: [],
      message: "Need at least 2 metrics with sufficient data for correlation analysis",
    }
  }

  const correlations: any[] = []
  
  for (let i = 0; i < metricsWithData.length; i++) {
    for (let j = i + 1; j < metricsWithData.length; j++) {
      const metric1 = metricsWithData[i]
      const metric2 = metricsWithData[j]
      
      const values1 = (snapshotsByMetric[metric1.id] || []).map(s => s.current_value)
      const values2 = (snapshotsByMetric[metric2.id] || []).map(s => s.current_value)
      
      // Align by date and calculate correlation
      const minLen = Math.min(values1.length, values2.length)
      const v1 = values1.slice(-minLen)
      const v2 = values2.slice(-minLen)
      
      const correlation = calculateCorrelation(v1, v2)
      
      if (Math.abs(correlation) >= 0.5) { // Only include significant correlations
        correlations.push({
          metric1: { id: metric1.id, name: metric1.name, code: metric1.code },
          metric2: { id: metric2.id, name: metric2.name, code: metric2.code },
          correlation: Math.round(correlation * 100) / 100,
          strength: Math.abs(correlation) >= 0.8 ? 'strong' : Math.abs(correlation) >= 0.6 ? 'moderate' : 'weak',
          direction: correlation > 0 ? 'positive' : 'negative',
        })
      }
    }
  }

  return {
    correlations: correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)),
    metrics_analyzed: metricsWithData.length,
    significant_correlations: correlations.length,
  }
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 2) return 0
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0)
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0)
  const sumY2 = y.reduce((a, yi) => a + yi * yi, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  
  return denominator === 0 ? 0 : numerator / denominator
}

