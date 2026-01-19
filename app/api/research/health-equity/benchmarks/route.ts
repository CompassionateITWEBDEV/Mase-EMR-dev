import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// CMS Health Equity Index Measures (2024-2025)
const CMS_HEALTH_EQUITY_BENCHMARKS = {
  "HE_RET90": {
    measure_name: "Treatment Retention (90-day)",
    cms_code: "HEDIS-FUA",
    national_benchmark: 75.0,
    by_demographic: {
      race: {
        "White": 76.2,
        "Black/African American": 71.5,
        "Hispanic/Latino": 68.3,
        "Asian": 79.1,
        "Native American/Alaska Native": 65.2,
      },
      insurance_type: {
        "Medicare": 78.5,
        "Medicaid": 68.2,
        "Commercial": 82.1,
        "Uninsured": 52.3,
      },
    },
    source: "CMS Health Equity Index 2024",
    effective_year: 2024,
  },
  "HE_MAT_INIT": {
    measure_name: "MAT Initiation Within 14 Days",
    cms_code: "HEDIS-IET",
    national_benchmark: 85.0,
    by_demographic: {
      race: {
        "White": 87.2,
        "Black/African American": 78.5,
        "Hispanic/Latino": 75.8,
        "Asian": 88.4,
        "Native American/Alaska Native": 71.3,
      },
      insurance_type: {
        "Medicare": 82.1,
        "Medicaid": 76.4,
        "Commercial": 89.2,
        "Uninsured": 45.6,
      },
    },
    source: "CMS Health Equity Index 2024",
    effective_year: 2024,
  },
  "HE_FU_ED": {
    measure_name: "Follow-up After ED Visit for SUD",
    cms_code: "HEDIS-FUA",
    national_benchmark: 70.0,
    by_demographic: {
      race: {
        "White": 72.5,
        "Black/African American": 65.2,
        "Hispanic/Latino": 62.8,
        "Asian": 74.1,
        "Native American/Alaska Native": 58.6,
      },
      insurance_type: {
        "Medicare": 68.2,
        "Medicaid": 61.5,
        "Commercial": 78.4,
        "Uninsured": 38.2,
      },
    },
    source: "CMS Health Equity Index 2024",
    effective_year: 2024,
  },
  "HE_DEP_REM": {
    measure_name: "Depression Remission at 12 Months",
    cms_code: "NQF-0710",
    national_benchmark: 48.0,
    by_demographic: {
      race: {
        "White": 50.2,
        "Black/African American": 42.1,
        "Hispanic/Latino": 39.5,
        "Asian": 46.8,
        "Native American/Alaska Native": 35.2,
      },
      insurance_type: {
        "Medicare": 45.6,
        "Medicaid": 38.2,
        "Commercial": 54.8,
        "Uninsured": 28.5,
      },
    },
    source: "HEDIS/NCQA 2024",
    effective_year: 2024,
  },
  "HE_SDOH_SCR": {
    measure_name: "SDOH Screening Within 30 Days",
    cms_code: "CCBHC-QM",
    national_benchmark: 80.0,
    by_demographic: {
      race: {
        "White": 82.5,
        "Black/African American": 78.2,
        "Hispanic/Latino": 75.1,
        "Asian": 80.4,
        "Native American/Alaska Native": 72.6,
      },
      geography: {
        "Urban": 85.2,
        "Suburban": 79.5,
        "Rural": 68.3,
        "Frontier": 55.2,
      },
    },
    source: "CCBHC Quality Measures 2024",
    effective_year: 2024,
  },
}

// SAMHSA National Outcome Measures
const SAMHSA_BENCHMARKS = {
  "SAMHSA_RET": {
    measure_name: "Treatment Retention",
    samhsa_code: "NOM-01",
    national_benchmark: 72.0,
    by_demographic: {
      race: {
        "White": 74.5,
        "Black/African American": 68.2,
        "Hispanic/Latino": 65.8,
        "Asian": 76.1,
        "Native American/Alaska Native": 62.3,
        "Native Hawaiian/Pacific Islander": 64.5,
      },
      age_group: {
        "18-24": 58.2,
        "25-34": 68.5,
        "35-44": 72.8,
        "45-54": 76.2,
        "55-64": 78.5,
        "65+": 80.1,
      },
    },
    source: "SAMHSA National Outcome Measures 2023-2024",
    effective_year: 2024,
  },
  "SAMHSA_EMPLOY": {
    measure_name: "Employment at Discharge",
    samhsa_code: "NOM-02",
    national_benchmark: 55.0,
    by_demographic: {
      race: {
        "White": 58.2,
        "Black/African American": 48.5,
        "Hispanic/Latino": 52.1,
        "Asian": 62.4,
        "Native American/Alaska Native": 42.8,
      },
    },
    source: "SAMHSA National Outcome Measures 2023-2024",
    effective_year: 2024,
  },
  "SAMHSA_HOUSING": {
    measure_name: "Stable Housing at Discharge",
    samhsa_code: "NOM-03",
    national_benchmark: 65.0,
    by_demographic: {
      race: {
        "White": 68.5,
        "Black/African American": 55.2,
        "Hispanic/Latino": 58.8,
        "Asian": 72.1,
        "Native American/Alaska Native": 48.5,
      },
    },
    source: "SAMHSA National Outcome Measures 2023-2024",
    effective_year: 2024,
  },
  "SAMHSA_ABSTINENCE": {
    measure_name: "Abstinence at Discharge",
    samhsa_code: "NOM-04",
    national_benchmark: 45.0,
    by_demographic: {
      race: {
        "White": 48.2,
        "Black/African American": 42.5,
        "Hispanic/Latino": 38.8,
        "Asian": 52.1,
        "Native American/Alaska Native": 35.6,
      },
    },
    source: "SAMHSA National Outcome Measures 2023-2024",
    effective_year: 2024,
  },
}

// State-level benchmarks (example for a few states)
const STATE_BENCHMARKS = {
  "MI": { // Michigan
    "HE_RET90": 73.5,
    "HE_MAT_INIT": 82.1,
    "HE_SDOH_SCR": 78.2,
  },
  "CA": { // California
    "HE_RET90": 76.2,
    "HE_MAT_INIT": 86.5,
    "HE_SDOH_SCR": 82.5,
  },
  "NY": { // New York
    "HE_RET90": 74.8,
    "HE_MAT_INIT": 84.2,
    "HE_SDOH_SCR": 80.1,
  },
  "TX": { // Texas
    "HE_RET90": 71.2,
    "HE_MAT_INIT": 79.5,
    "HE_SDOH_SCR": 72.8,
  },
}

// GET - Fetch benchmark data
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const benchmarkType = searchParams.get("type") || "all" // cms, samhsa, state, all
    const metricCode = searchParams.get("metric_code")
    const demographicType = searchParams.get("demographic_type")
    const state = searchParams.get("state")
    
    let response: any = {
      success: true,
    }
    
    // CMS benchmarks
    if (benchmarkType === "all" || benchmarkType === "cms") {
      let cmsBenchmarks = { ...CMS_HEALTH_EQUITY_BENCHMARKS }
      
      if (metricCode) {
        cmsBenchmarks = Object.fromEntries(
          Object.entries(cmsBenchmarks).filter(([code]) => code === metricCode)
        )
      }
      
      response.cms_benchmarks = cmsBenchmarks
    }
    
    // SAMHSA benchmarks
    if (benchmarkType === "all" || benchmarkType === "samhsa") {
      let samhsaBenchmarks = { ...SAMHSA_BENCHMARKS }
      
      if (metricCode) {
        samhsaBenchmarks = Object.fromEntries(
          Object.entries(samhsaBenchmarks).filter(([code]) => 
            code.includes(metricCode) || CMS_HEALTH_EQUITY_BENCHMARKS[metricCode as keyof typeof CMS_HEALTH_EQUITY_BENCHMARKS]
          )
        )
      }
      
      response.samhsa_benchmarks = samhsaBenchmarks
    }
    
    // State benchmarks
    if (benchmarkType === "all" || benchmarkType === "state") {
      if (state && STATE_BENCHMARKS[state as keyof typeof STATE_BENCHMARKS]) {
        response.state_benchmarks = {
          [state]: STATE_BENCHMARKS[state as keyof typeof STATE_BENCHMARKS]
        }
      } else {
        response.state_benchmarks = STATE_BENCHMARKS
      }
    }
    
    // Get custom benchmarks from database
    const { data: customBenchmarks, error } = await supabase
      .from("health_equity_benchmarks")
      .select("*")
      .eq("is_active", true)
    
    if (!error && customBenchmarks) {
      response.custom_benchmarks = customBenchmarks
    }
    
    // Add benchmark comparison helper data
    response.comparison_metadata = {
      benchmark_sources: [
        { code: "cms", name: "CMS Health Equity Index", year: 2024 },
        { code: "samhsa", name: "SAMHSA National Outcome Measures", year: 2024 },
        { code: "hedis", name: "HEDIS/NCQA Quality Measures", year: 2024 },
        { code: "ccbhc", name: "CCBHC Quality Measures", year: 2024 },
        { code: "state", name: "State-level Benchmarks", year: 2024 },
      ],
      demographic_dimensions: [
        { code: "race", name: "Race/Ethnicity" },
        { code: "insurance_type", name: "Insurance Type" },
        { code: "age_group", name: "Age Group" },
        { code: "geography", name: "Geography (Urban/Rural)" },
      ],
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error("Error in GET /api/research/health-equity/benchmarks:", error)
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

// POST - Compare current metrics against benchmarks
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    const { 
      metric_codes,
      demographic_type = "race",
      benchmark_source = "cms"
    } = body
    
    // Get current snapshots
    const { data: snapshots, error } = await supabase
      .from("health_equity_snapshots")
      .select(`
        *,
        health_equity_metrics(name, code)
      `)
      .eq("stratification_type", demographic_type)
      .order("snapshot_date", { ascending: false })
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    // Group by metric
    const snapshotsByMetric: Record<string, any[]> = {}
    for (const snapshot of snapshots || []) {
      const code = snapshot.health_equity_metrics?.code
      if (!code) continue
      if (metric_codes && !metric_codes.includes(code)) continue
      
      if (!snapshotsByMetric[code]) {
        snapshotsByMetric[code] = []
      }
      snapshotsByMetric[code].push(snapshot)
    }
    
    // Compare against benchmarks
    const comparisons: any[] = []
    
    const benchmarkSource = benchmark_source === "samhsa" 
      ? SAMHSA_BENCHMARKS 
      : CMS_HEALTH_EQUITY_BENCHMARKS
    
    for (const [metricCode, metricSnapshots] of Object.entries(snapshotsByMetric)) {
      const benchmark = benchmarkSource[metricCode as keyof typeof benchmarkSource]
      if (!benchmark) continue
      
      const demographicBenchmarks = benchmark.by_demographic?.[demographic_type as keyof typeof benchmark.by_demographic]
      
      const groupComparisons = metricSnapshots.map((snapshot: any) => {
        const groupBenchmark = demographicBenchmarks?.[snapshot.stratification_value as keyof typeof demographicBenchmarks]
        const nationalBenchmark = benchmark.national_benchmark
        
        const vsNational = snapshot.current_value - nationalBenchmark
        const vsGroup = groupBenchmark ? snapshot.current_value - groupBenchmark : null
        
        return {
          metric_code: metricCode,
          metric_name: benchmark.measure_name,
          group: snapshot.stratification_value,
          current_value: snapshot.current_value,
          national_benchmark: nationalBenchmark,
          group_benchmark: groupBenchmark || null,
          vs_national: Math.round(vsNational * 10) / 10,
          vs_group: vsGroup ? Math.round(vsGroup * 10) / 10 : null,
          performance_vs_national: vsNational >= 0 ? "above" : "below",
          performance_vs_group: vsGroup ? (vsGroup >= 0 ? "above" : "below") : null,
          gap_size: Math.abs(vsNational),
          gap_severity: Math.abs(vsNational) >= 15 ? "critical" : Math.abs(vsNational) >= 5 ? "warning" : "acceptable",
        }
      })
      
      comparisons.push({
        metric_code: metricCode,
        metric_name: benchmark.measure_name,
        source: benchmark.source,
        national_benchmark: benchmark.national_benchmark,
        group_comparisons: groupComparisons,
        average_gap: groupComparisons.length > 0
          ? Math.round(groupComparisons.reduce((sum: number, g: any) => sum + g.vs_national, 0) / groupComparisons.length * 10) / 10
          : 0,
      })
    }
    
    // Calculate summary
    const allGaps = comparisons.flatMap(c => c.group_comparisons.map((g: any) => g.vs_national))
    const criticalCount = comparisons.flatMap(c => c.group_comparisons).filter((g: any) => g.gap_severity === "critical").length
    const warningCount = comparisons.flatMap(c => c.group_comparisons).filter((g: any) => g.gap_severity === "warning").length
    
    return NextResponse.json({
      success: true,
      benchmark_source: benchmark_source,
      demographic_type: demographic_type,
      comparisons,
      summary: {
        metrics_compared: comparisons.length,
        groups_compared: allGaps.length,
        average_gap: allGaps.length > 0 
          ? Math.round(allGaps.reduce((a: number, b: number) => a + b, 0) / allGaps.length * 10) / 10
          : 0,
        critical_gaps: criticalCount,
        warning_gaps: warningCount,
        groups_above_benchmark: allGaps.filter((g: number) => g >= 0).length,
        groups_below_benchmark: allGaps.filter((g: number) => g < 0).length,
      },
    })
    
  } catch (error) {
    console.error("Error in POST /api/research/health-equity/benchmarks:", error)
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

