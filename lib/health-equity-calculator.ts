import { createServiceClient } from "@/lib/supabase/service-role"
import type { 
  StratificationType, 
  TrendDirection, 
  AlertLevel,
  SdohRiskLevel,
  StratifiedOutcome,
  SdohSummary,
  SdohCorrelationData
} from "@/lib/health-equity-types"

// ============================================================================
// Health Equity Calculator Service
// ============================================================================
// Functions to calculate health equity metrics, detect disparities,
// and analyze social determinants of health impact on outcomes
// ============================================================================

interface DisparityResult {
  group_name: string
  value: number
  population_count: number
  disparity_from_reference: number
  disparity_ratio: number
  disparity_index: number
  alert_level: AlertLevel
  is_statistically_significant: boolean
  confidence_interval?: { lower: number; upper: number }
}

interface StratificationOptions {
  metric_code?: string
  stratification_type: StratificationType
  start_date?: string
  end_date?: string
  reference_group?: string
  warning_threshold?: number
  critical_threshold?: number
}

// ============================================================================
// Treatment Retention Stratified by Demographics
// ============================================================================
export async function calculateRetentionByDemographic(
  stratificationType: StratificationType,
  options?: { start_date?: string; end_date?: string }
): Promise<DisparityResult[]> {
  const supabase = createServiceClient()
  const results: DisparityResult[] = []
  
  const endDate = options?.end_date || new Date().toISOString().split("T")[0]
  const startDate = options?.start_date || (() => {
    const d = new Date(endDate)
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().split("T")[0]
  })()
  
  // Get demographic field name
  const demographicField = getDemographicField(stratificationType)
  if (!demographicField) return results
  
  try {
    // Query admissions with patient demographics
    const { data: admissions, error } = await supabase
      .from("otp_admissions")
      .select(`
        id,
        patient_id,
        status,
        admission_date,
        discharge_date,
        patients!inner(${demographicField})
      `)
      .gte("admission_date", startDate)
      .lte("admission_date", endDate)
    
    if (error || !admissions) {
      console.error("Error fetching admissions:", error)
      return results
    }
    
    // Group by demographic
    const groups: Record<string, { total: number; retained: number }> = {}
    
    for (const admission of admissions) {
      const patient = admission.patients as any
      const groupValue = patient?.[demographicField] || "Unknown"
      
      if (!groups[groupValue]) {
        groups[groupValue] = { total: 0, retained: 0 }
      }
      
      groups[groupValue].total++
      
      // Check if retained (active or stayed 90+ days)
      if (admission.status === "active") {
        groups[groupValue].retained++
      } else if (admission.discharge_date) {
        const admitDate = new Date(admission.admission_date)
        const dischargeDate = new Date(admission.discharge_date)
        const daysDiff = Math.floor((dischargeDate.getTime() - admitDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff >= 90) {
          groups[groupValue].retained++
        }
      }
    }
    
    // Calculate rates and disparities
    const referenceGroup = findReferenceGroup(Object.keys(groups), stratificationType)
    const referenceRate = groups[referenceGroup]?.total > 0 
      ? (groups[referenceGroup].retained / groups[referenceGroup].total) * 100 
      : 75.0
    
    for (const [groupName, data] of Object.entries(groups)) {
      if (data.total < 5) continue // Skip small groups
      
      const rate = (data.retained / data.total) * 100
      const disparity = rate - referenceRate
      const ratio = referenceRate > 0 ? rate / referenceRate : 1
      
      results.push({
        group_name: groupName,
        value: Math.round(rate * 10) / 10,
        population_count: data.total,
        disparity_from_reference: Math.round(disparity * 10) / 10,
        disparity_ratio: Math.round(ratio * 100) / 100,
        disparity_index: calculateDisparityIndex(rate, referenceRate, true),
        alert_level: getAlertLevel(Math.abs(disparity), 10, 20),
        is_statistically_significant: data.total >= 30 && Math.abs(disparity) > 5,
      })
    }
    
    return results.sort((a, b) => a.disparity_from_reference - b.disparity_from_reference)
  } catch (error) {
    console.error("Error calculating retention by demographic:", error)
    return results
  }
}

// ============================================================================
// MAT Initiation Stratified by Demographics
// ============================================================================
export async function calculateMATInitiationByDemographic(
  stratificationType: StratificationType,
  options?: { start_date?: string; end_date?: string }
): Promise<DisparityResult[]> {
  const supabase = createServiceClient()
  const results: DisparityResult[] = []
  
  const endDate = options?.end_date || new Date().toISOString().split("T")[0]
  const startDate = options?.start_date || (() => {
    const d = new Date(endDate)
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().split("T")[0]
  })()
  
  const demographicField = getDemographicField(stratificationType)
  if (!demographicField) return results
  
  try {
    const { data: admissions, error } = await supabase
      .from("otp_admissions")
      .select(`
        id,
        patient_id,
        medication,
        admission_date,
        patients!inner(${demographicField})
      `)
      .gte("admission_date", startDate)
      .lte("admission_date", endDate)
    
    if (error || !admissions) return results
    
    const groups: Record<string, { total: number; mat_initiated: number }> = {}
    
    for (const admission of admissions) {
      const patient = admission.patients as any
      const groupValue = patient?.[demographicField] || "Unknown"
      
      if (!groups[groupValue]) {
        groups[groupValue] = { total: 0, mat_initiated: 0 }
      }
      
      groups[groupValue].total++
      
      // Check if MAT was initiated
      if (admission.medication && isMAT(admission.medication)) {
        groups[groupValue].mat_initiated++
      }
    }
    
    const referenceGroup = findReferenceGroup(Object.keys(groups), stratificationType)
    const referenceRate = groups[referenceGroup]?.total > 0 
      ? (groups[referenceGroup].mat_initiated / groups[referenceGroup].total) * 100 
      : 85.0
    
    for (const [groupName, data] of Object.entries(groups)) {
      if (data.total < 5) continue
      
      const rate = (data.mat_initiated / data.total) * 100
      const disparity = rate - referenceRate
      const ratio = referenceRate > 0 ? rate / referenceRate : 1
      
      results.push({
        group_name: groupName,
        value: Math.round(rate * 10) / 10,
        population_count: data.total,
        disparity_from_reference: Math.round(disparity * 10) / 10,
        disparity_ratio: Math.round(ratio * 100) / 100,
        disparity_index: calculateDisparityIndex(rate, referenceRate, true),
        alert_level: getAlertLevel(Math.abs(disparity), 10, 15),
        is_statistically_significant: data.total >= 30 && Math.abs(disparity) > 5,
      })
    }
    
    return results.sort((a, b) => a.disparity_from_reference - b.disparity_from_reference)
  } catch (error) {
    console.error("Error calculating MAT initiation by demographic:", error)
    return results
  }
}

// ============================================================================
// Appointment No-Show Rate by Demographics
// ============================================================================
export async function calculateNoShowByDemographic(
  stratificationType: StratificationType,
  options?: { start_date?: string; end_date?: string }
): Promise<DisparityResult[]> {
  const supabase = createServiceClient()
  const results: DisparityResult[] = []
  
  const endDate = options?.end_date || new Date().toISOString().split("T")[0]
  const startDate = options?.start_date || (() => {
    const d = new Date(endDate)
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split("T")[0]
  })()
  
  const demographicField = getDemographicField(stratificationType)
  if (!demographicField) return results
  
  try {
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_id,
        status,
        patients!inner(${demographicField})
      `)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .in("status", ["completed", "no-show", "cancelled"])
    
    if (error || !appointments) return results
    
    const groups: Record<string, { total: number; no_shows: number }> = {}
    
    for (const apt of appointments) {
      const patient = apt.patients as any
      const groupValue = patient?.[demographicField] || "Unknown"
      
      if (!groups[groupValue]) {
        groups[groupValue] = { total: 0, no_shows: 0 }
      }
      
      groups[groupValue].total++
      if (apt.status === "no-show") {
        groups[groupValue].no_shows++
      }
    }
    
    const referenceGroup = findReferenceGroup(Object.keys(groups), stratificationType)
    const referenceRate = groups[referenceGroup]?.total > 0 
      ? (groups[referenceGroup].no_shows / groups[referenceGroup].total) * 100 
      : 10.0
    
    for (const [groupName, data] of Object.entries(groups)) {
      if (data.total < 10) continue
      
      const rate = (data.no_shows / data.total) * 100
      const disparity = rate - referenceRate // For no-show, higher is worse
      const ratio = referenceRate > 0 ? rate / referenceRate : 1
      
      results.push({
        group_name: groupName,
        value: Math.round(rate * 10) / 10,
        population_count: data.total,
        disparity_from_reference: Math.round(disparity * 10) / 10,
        disparity_ratio: Math.round(ratio * 100) / 100,
        disparity_index: calculateDisparityIndex(rate, referenceRate, false), // Lower is better
        alert_level: getAlertLevel(Math.abs(disparity), 5, 15),
        is_statistically_significant: data.total >= 30 && Math.abs(disparity) > 3,
      })
    }
    
    return results.sort((a, b) => b.disparity_from_reference - a.disparity_from_reference) // Higher no-show first
  } catch (error) {
    console.error("Error calculating no-show by demographic:", error)
    return results
  }
}

// ============================================================================
// SDOH Impact Analysis
// ============================================================================
export async function calculateSdohImpactOnOutcomes(): Promise<SdohCorrelationData[]> {
  const supabase = createServiceClient()
  const correlations: SdohCorrelationData[] = []
  
  try {
    // Get SDOH scores and link to outcomes
    const { data: sdohScores, error: sdohError } = await supabase
      .from("patient_sdoh_scores")
      .select("*")
    
    if (sdohError || !sdohScores) return correlations
    
    const patientIds = sdohScores.map(s => s.patient_id)
    
    // Get admissions for these patients
    const { data: admissions, error: admError } = await supabase
      .from("otp_admissions")
      .select("*")
      .in("patient_id", patientIds)
    
    if (admError || !admissions) return correlations
    
    // Calculate retention rates by SDOH domain
    const domains = [
      { key: "has_housing_instability", label: "Housing Instability", field: "housing_risk_score" },
      { key: "has_food_insecurity", label: "Food Insecurity", field: "food_security_risk_score" },
      { key: "has_transportation_barrier", label: "Transportation Barrier", field: "transportation_risk_score" },
      { key: "has_employment_barrier", label: "Employment Barrier", field: "employment_risk_score" },
      { key: "has_social_isolation", label: "Social Isolation", field: "social_support_risk_score" },
      { key: "has_healthcare_access_barrier", label: "Healthcare Access Barrier", field: "healthcare_access_risk_score" },
    ]
    
    for (const domain of domains) {
      const patientsWithBarrier = sdohScores.filter((s: any) => s[domain.key] === true)
      const patientsWithoutBarrier = sdohScores.filter((s: any) => s[domain.key] !== true)
      
      const prevalence = (patientsWithBarrier.length / sdohScores.length) * 100
      
      // Calculate retention for each group
      const retentionWith = calculateGroupRetention(
        patientsWithBarrier.map(p => p.patient_id),
        admissions
      )
      const retentionWithout = calculateGroupRetention(
        patientsWithoutBarrier.map(p => p.patient_id),
        admissions
      )
      
      const retentionImpact = retentionWith - retentionWithout
      
      correlations.push({
        domain: domain.key,
        domain_label: domain.label,
        prevalence: Math.round(prevalence * 10) / 10,
        retention_impact: Math.round(retentionImpact * 10) / 10,
        outcome_correlation: Math.round(retentionImpact / 10) / 10, // Simplified correlation
      })
    }
    
    return correlations.sort((a, b) => a.retention_impact - b.retention_impact)
  } catch (error) {
    console.error("Error calculating SDOH impact:", error)
    return correlations
  }
}

// ============================================================================
// SDOH Summary Statistics
// ============================================================================
export async function getSdohSummary(): Promise<SdohSummary> {
  const supabase = createServiceClient()
  
  const defaultSummary: SdohSummary = {
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
  }
  
  try {
    // Get total patients
    const { count: totalPatients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
    
    // Get SDOH scores
    const { data: sdohScores, error } = await supabase
      .from("patient_sdoh_scores")
      .select("*")
    
    if (error || !sdohScores) return defaultSummary
    
    const screened = sdohScores.length
    
    // Risk distribution
    const riskDist = { low: 0, moderate: 0, high: 0, very_high: 0 }
    const domainCounts = {
      housing_instability: 0,
      food_insecurity: 0,
      transportation_barrier: 0,
      employment_barrier: 0,
      social_isolation: 0,
      healthcare_access_barrier: 0,
    }
    
    for (const score of sdohScores) {
      // Count risk levels
      const level = score.risk_level as SdohRiskLevel
      if (level && riskDist[level] !== undefined) {
        riskDist[level]++
      }
      
      // Count domain flags
      if (score.has_housing_instability) domainCounts.housing_instability++
      if (score.has_food_insecurity) domainCounts.food_insecurity++
      if (score.has_transportation_barrier) domainCounts.transportation_barrier++
      if (score.has_employment_barrier) domainCounts.employment_barrier++
      if (score.has_social_isolation) domainCounts.social_isolation++
      if (score.has_healthcare_access_barrier) domainCounts.healthcare_access_barrier++
    }
    
    // Get outcome correlations
    const correlations = await calculateSdohImpactOnOutcomes()
    
    return {
      total_patients_screened: screened,
      screening_rate: totalPatients ? Math.round((screened / totalPatients) * 1000) / 10 : 0,
      risk_distribution: riskDist,
      domain_prevalence: {
        housing_instability: screened > 0 ? Math.round((domainCounts.housing_instability / screened) * 1000) / 10 : 0,
        food_insecurity: screened > 0 ? Math.round((domainCounts.food_insecurity / screened) * 1000) / 10 : 0,
        transportation_barrier: screened > 0 ? Math.round((domainCounts.transportation_barrier / screened) * 1000) / 10 : 0,
        employment_barrier: screened > 0 ? Math.round((domainCounts.employment_barrier / screened) * 1000) / 10 : 0,
        social_isolation: screened > 0 ? Math.round((domainCounts.social_isolation / screened) * 1000) / 10 : 0,
        healthcare_access_barrier: screened > 0 ? Math.round((domainCounts.healthcare_access_barrier / screened) * 1000) / 10 : 0,
      },
      sdoh_outcome_correlation: correlations,
    }
  } catch (error) {
    console.error("Error getting SDOH summary:", error)
    return defaultSummary
  }
}

// ============================================================================
// Get All Stratified Outcomes for Dashboard
// ============================================================================
export async function getAllStratifiedOutcomes(
  stratificationTypes?: StratificationType[]
): Promise<StratifiedOutcome[]> {
  const types = stratificationTypes || ['race', 'ethnicity', 'insurance_type', 'geography']
  const outcomes: StratifiedOutcome[] = []
  
  for (const stratType of types) {
    // Retention
    const retention = await calculateRetentionByDemographic(stratType)
    if (retention.length > 0) {
      const referenceGroup = findReferenceGroup(retention.map(r => r.group_name), stratType)
      const refValue = retention.find(r => r.group_name === referenceGroup)?.value || 75
      
      outcomes.push({
        metric_id: 'HE_RET90',
        metric_name: 'Treatment Retention (90-day)',
        metric_code: 'HE_RET90',
        stratification_type: stratType,
        groups: retention.map(r => ({
          group_name: r.group_name,
          value: r.value,
          population_count: r.population_count,
          disparity_from_reference: r.disparity_from_reference,
          disparity_ratio: r.disparity_ratio,
          alert_level: r.alert_level,
          trend: 'stable' as TrendDirection,
        })),
        reference_group: referenceGroup,
        reference_value: refValue,
        benchmark_value: 75,
        equity_target: 5,
      })
    }
    
    // MAT Initiation
    const matInit = await calculateMATInitiationByDemographic(stratType)
    if (matInit.length > 0) {
      const referenceGroup = findReferenceGroup(matInit.map(r => r.group_name), stratType)
      const refValue = matInit.find(r => r.group_name === referenceGroup)?.value || 85
      
      outcomes.push({
        metric_id: 'HE_MAT_INIT',
        metric_name: 'MAT Initiation Rate',
        metric_code: 'HE_MAT_INIT',
        stratification_type: stratType,
        groups: matInit.map(r => ({
          group_name: r.group_name,
          value: r.value,
          population_count: r.population_count,
          disparity_from_reference: r.disparity_from_reference,
          disparity_ratio: r.disparity_ratio,
          alert_level: r.alert_level,
          trend: 'stable' as TrendDirection,
        })),
        reference_group: referenceGroup,
        reference_value: refValue,
        benchmark_value: 85,
        equity_target: 5,
      })
    }
    
    // No-Show Rate
    const noShow = await calculateNoShowByDemographic(stratType)
    if (noShow.length > 0) {
      const referenceGroup = findReferenceGroup(noShow.map(r => r.group_name), stratType)
      const refValue = noShow.find(r => r.group_name === referenceGroup)?.value || 10
      
      outcomes.push({
        metric_id: 'HE_NOSHOW',
        metric_name: 'Appointment No-Show Rate',
        metric_code: 'HE_NOSHOW',
        stratification_type: stratType,
        groups: noShow.map(r => ({
          group_name: r.group_name,
          value: r.value,
          population_count: r.population_count,
          disparity_from_reference: r.disparity_from_reference,
          disparity_ratio: r.disparity_ratio,
          alert_level: r.alert_level,
          trend: 'stable' as TrendDirection,
        })),
        reference_group: referenceGroup,
        reference_value: refValue,
        benchmark_value: 10,
        equity_target: 5,
      })
    }
  }
  
  return outcomes
}

// ============================================================================
// Calculate Dashboard Summary
// ============================================================================
export async function getHealthEquityDashboardSummary() {
  const supabase = createServiceClient()
  
  try {
    // Get metrics from database
    const { data: snapshots } = await supabase
      .from("health_equity_snapshots")
      .select("*")
      .eq("snapshot_date", new Date().toISOString().split("T")[0])
    
    const { data: initiatives } = await supabase
      .from("health_equity_initiatives")
      .select("*")
      .eq("status", "active")
    
    const { data: alerts } = await supabase
      .from("health_equity_alerts")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10)
    
    // Calculate summary statistics
    const snapshotList = snapshots || []
    const criticalCount = snapshotList.filter(s => s.alert_level === "critical").length
    const warningCount = snapshotList.filter(s => s.alert_level === "warning").length
    const metricsWithDisparity = snapshotList.filter(s => 
      s.alert_level === "critical" || s.alert_level === "warning"
    ).length
    
    const avgDisparityIndex = snapshotList.length > 0
      ? snapshotList.reduce((sum, s) => sum + Math.abs(s.disparity_index || 0), 0) / snapshotList.length
      : 0
    
    // Get unique populations at risk
    const atRiskPopulations = new Set(
      snapshotList
        .filter(s => s.alert_level === "critical" || s.alert_level === "warning")
        .map(s => `${s.stratification_type}:${s.stratification_value}`)
    )
    
    return {
      summary: {
        total_metrics: new Set(snapshotList.map(s => s.metric_id)).size,
        metrics_with_disparities: metricsWithDisparity,
        critical_disparities: criticalCount,
        warning_disparities: warningCount,
        active_initiatives: initiatives?.length || 0,
        populations_at_risk: atRiskPopulations.size,
        average_disparity_index: Math.round(avgDisparityIndex * 100) / 100,
      },
      alerts: alerts || [],
      initiatives: initiatives || [],
    }
  } catch (error) {
    console.error("Error getting dashboard summary:", error)
    return {
      summary: {
        total_metrics: 0,
        metrics_with_disparities: 0,
        critical_disparities: 0,
        warning_disparities: 0,
        active_initiatives: 0,
        populations_at_risk: 0,
        average_disparity_index: 0,
      },
      alerts: [],
      initiatives: [],
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDemographicField(stratificationType: StratificationType): string | null {
  const fieldMap: Record<StratificationType, string> = {
    race: "race",
    ethnicity: "ethnicity",
    gender: "gender",
    age_group: "date_of_birth", // Will need to calculate age group
    insurance_type: "insurance_type",
    geography: "rural_urban_code",
    language: "preferred_language",
    sdoh_risk_level: "id", // Special handling needed
  }
  return fieldMap[stratificationType] || null
}

function findReferenceGroup(groups: string[], stratificationType: StratificationType): string {
  // Define typical reference groups
  const referenceMap: Partial<Record<StratificationType, string[]>> = {
    race: ["White", "white"],
    ethnicity: ["Non-Hispanic/Latino", "Non-Hispanic", "non_hispanic"],
    insurance_type: ["Commercial", "commercial", "Commercial HMO", "Commercial PPO"],
    geography: ["Urban", "urban", "Suburban"],
    language: ["English", "english"],
  }
  
  const preferredRefs = referenceMap[stratificationType] || []
  
  for (const ref of preferredRefs) {
    const match = groups.find(g => g.toLowerCase() === ref.toLowerCase())
    if (match) return match
  }
  
  // Fall back to most common group
  return groups[0] || "Unknown"
}

function calculateDisparityIndex(
  groupValue: number, 
  referenceValue: number, 
  higherIsBetter: boolean
): number {
  if (referenceValue === 0) return 0
  const difference = groupValue - referenceValue
  const index = (difference / referenceValue) * 100
  return Math.round((higherIsBetter ? index : -index) * 100) / 100
}

function getAlertLevel(disparity: number, warningThreshold: number, criticalThreshold: number): AlertLevel {
  if (disparity >= criticalThreshold) return "critical"
  if (disparity >= warningThreshold) return "warning"
  return "none"
}

function isMAT(medication: string): boolean {
  const matMedications = [
    "methadone", "buprenorphine", "suboxone", "subutex",
    "sublocade", "naltrexone", "vivitrol", "zubsolv"
  ]
  return matMedications.some(m => medication.toLowerCase().includes(m))
}

function calculateGroupRetention(patientIds: string[], admissions: any[]): number {
  if (patientIds.length === 0) return 0
  
  const patientAdmissions = admissions.filter(a => patientIds.includes(a.patient_id))
  if (patientAdmissions.length === 0) return 0
  
  const retained = patientAdmissions.filter(a => {
    if (a.status === "active") return true
    if (a.discharge_date) {
      const admitDate = new Date(a.admission_date)
      const dischargeDate = new Date(a.discharge_date)
      const daysDiff = (dischargeDate.getTime() - admitDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff >= 90
    }
    return false
  })
  
  return (retained.length / patientAdmissions.length) * 100
}

// Export all calculator functions
export const healthEquityCalculators = {
  calculateRetentionByDemographic,
  calculateMATInitiationByDemographic,
  calculateNoShowByDemographic,
  calculateSdohImpactOnOutcomes,
  getSdohSummary,
  getAllStratifiedOutcomes,
  getHealthEquityDashboardSummary,
}

