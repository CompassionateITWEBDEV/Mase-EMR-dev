import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import {
  getAllStratifiedOutcomes,
  getSdohSummary,
  getHealthEquityDashboardSummary,
} from "@/lib/health-equity-calculator"
import type { StratificationType, HealthEquityDashboardResponse } from "@/lib/health-equity-types"

// GET - Get health equity dashboard data
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Parse parameters
    const stratificationTypesParam = searchParams.get("stratification_types")
    const stratificationTypes = stratificationTypesParam 
      ? stratificationTypesParam.split(",") as StratificationType[]
      : ["race", "ethnicity", "insurance_type", "geography"] as StratificationType[]
    
    const includeSnapshots = searchParams.get("include_snapshots") !== "false"
    const includeSdoh = searchParams.get("include_sdoh") !== "false"
    const includeInitiatives = searchParams.get("include_initiatives") !== "false"
    
    // Get dashboard summary
    const { summary, alerts, initiatives } = await getHealthEquityDashboardSummary()
    
    // Get stratified outcomes from real data calculation
    let disparities = []
    if (includeSnapshots) {
      disparities = await getAllStratifiedOutcomes(stratificationTypes)
      
      // If no real data, fall back to stored snapshots
      if (disparities.length === 0) {
        const { data: snapshots, error: snapshotsError } = await supabase
          .from("health_equity_snapshots")
          .select(`
            *,
            health_equity_metrics(name, code, benchmark_value, equity_target)
          `)
          .order("snapshot_date", { ascending: false })
        
        if (!snapshotsError && snapshots) {
          // Group snapshots by metric and stratification type
          const groupedSnapshots: Record<string, any[]> = {}
          
          for (const snapshot of snapshots) {
            const key = `${snapshot.metric_id}-${snapshot.stratification_type}`
            if (!groupedSnapshots[key]) {
              groupedSnapshots[key] = []
            }
            groupedSnapshots[key].push(snapshot)
          }
          
          // Convert to stratified outcomes format
          for (const [key, snapshotGroup] of Object.entries(groupedSnapshots)) {
            const metric = snapshotGroup[0]?.health_equity_metrics
            if (!metric) continue
            
            const refSnapshot = snapshotGroup.find(s => s.disparity_difference === 0) || snapshotGroup[0]
            
            disparities.push({
              metric_id: snapshotGroup[0].metric_id,
              metric_name: metric.name,
              metric_code: metric.code,
              stratification_type: snapshotGroup[0].stratification_type,
              groups: snapshotGroup.map(s => ({
                group_name: s.stratification_value,
                value: s.current_value,
                population_count: s.population_count || 0,
                disparity_from_reference: s.disparity_difference || 0,
                disparity_ratio: s.disparity_ratio || 1,
                alert_level: s.alert_level || "none",
                trend: s.trend || "stable",
              })),
              reference_group: refSnapshot?.stratification_value || "Unknown",
              reference_value: refSnapshot?.current_value || 0,
              benchmark_value: metric.benchmark_value,
              equity_target: metric.equity_target,
            })
          }
        }
      }
    }
    
    // Get SDOH summary
    let sdohSummary = null
    if (includeSdoh) {
      sdohSummary = await getSdohSummary()
    }
    
    // Build response
    const response: HealthEquityDashboardResponse = {
      success: true,
      summary,
      disparities,
      sdoh_summary: sdohSummary || {
        total_patients_screened: 0,
        screening_rate: 0,
        risk_distribution: { low: 0, moderate: 0, high: 0, very_high: 0 },
        domain_prevalence: {
          housing_instability: 0,
          food_insecurity: 0,
          transportation_barrier: 0,
          employment_barrier: 0,
          social_isolation: 0,
          healthcare_access_barrier: 0,
        },
        sdoh_outcome_correlation: [],
      },
      alerts,
      initiatives: includeInitiatives ? initiatives : [],
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error("Error in GET /api/research/health-equity:", error)
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

// POST - Calculate and store new equity snapshots
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    const { 
      metric_ids,
      stratification_types = ["race", "ethnicity", "insurance_type", "geography"],
      force_recalculate = false 
    } = body
    
    // Get active metrics
    let metricsQuery = supabase
      .from("health_equity_metrics")
      .select("*")
      .eq("is_active", true)
    
    if (metric_ids && metric_ids.length > 0) {
      metricsQuery = metricsQuery.in("id", metric_ids)
    }
    
    const { data: metrics, error: metricsError } = await metricsQuery
    
    if (metricsError) {
      return NextResponse.json(
        { success: false, error: metricsError.message },
        { status: 500 }
      )
    }
    
    // Calculate stratified outcomes
    const outcomes = await getAllStratifiedOutcomes(stratification_types as StratificationType[])
    
    let snapshotsCreated = 0
    let snapshotsUpdated = 0
    const snapshotDate = new Date().toISOString().split("T")[0]
    
    // Store snapshots for each outcome
    for (const outcome of outcomes) {
      // Find matching metric
      const metric = metrics?.find(m => 
        m.code === outcome.metric_code || m.id === outcome.metric_id
      )
      
      if (!metric) continue
      
      for (const group of outcome.groups) {
        const snapshotData = {
          metric_id: metric.id,
          stratification_type: outcome.stratification_type,
          stratification_value: group.group_name,
          current_value: group.value,
          population_count: group.population_count,
          reference_value: outcome.reference_value,
          disparity_difference: group.disparity_from_reference,
          disparity_ratio: group.disparity_ratio,
          snapshot_date: snapshotDate,
          period_start: (() => {
            const d = new Date()
            d.setMonth(d.getMonth() - 1)
            return d.toISOString().split("T")[0]
          })(),
          period_end: snapshotDate,
          meets_equity_target: Math.abs(group.disparity_from_reference) <= (outcome.equity_target || 5),
          alert_level: group.alert_level,
        }
        
        const { error: upsertError } = await supabase
          .from("health_equity_snapshots")
          .upsert(snapshotData, {
            onConflict: "metric_id,stratification_type,stratification_value,snapshot_date",
          })
        
        if (!upsertError) {
          snapshotsCreated++
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Health equity snapshots calculated successfully`,
      snapshots_created: snapshotsCreated,
      snapshots_updated: snapshotsUpdated,
      outcomes_processed: outcomes.length,
    })
    
  } catch (error) {
    console.error("Error in POST /api/research/health-equity:", error)
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

