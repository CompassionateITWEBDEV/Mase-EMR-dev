// ============================================================================
// Health Equity Types for Research Dashboard
// ============================================================================

// Stratification dimensions for equity analysis
export type StratificationType = 
  | 'race' 
  | 'ethnicity' 
  | 'gender' 
  | 'age_group' 
  | 'insurance_type' 
  | 'geography'
  | 'language'
  | 'sdoh_risk_level'

export type MetricType = 
  | 'outcome' 
  | 'access' 
  | 'quality' 
  | 'experience' 
  | 'sdoh' 
  | 'utilization'

export type AlertLevel = 'none' | 'warning' | 'critical'

export type TrendDirection = 'improving' | 'worsening' | 'stable' | 'insufficient_data'

export type InitiativeStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'

export type InitiativeType = 
  | 'intervention' 
  | 'program' 
  | 'policy' 
  | 'outreach' 
  | 'training' 
  | 'partnership' 
  | 'research'

export type GoalType = 
  | 'eliminate_disparity' 
  | 'reduce_disparity' 
  | 'achieve_parity' 
  | 'improvement' 
  | 'maintenance'

export type GoalStatus = 'active' | 'achieved' | 'not_achieved' | 'in_progress' | 'cancelled'

export type SdohRiskLevel = 'low' | 'moderate' | 'high' | 'very_high'

// ============================================================================
// Core Interfaces
// ============================================================================

export interface HealthEquityMetric {
  id: string
  organization_id?: string
  
  // Basic Information
  name: string
  code?: string
  description?: string
  metric_type: MetricType
  
  // Stratification
  stratification_dimensions: StratificationType[]
  reference_group?: string
  
  // Targets and Thresholds
  equity_target?: number
  warning_threshold?: number
  critical_threshold?: number
  
  // Benchmarks
  national_benchmark?: number
  state_benchmark?: number
  benchmark_source?: string
  benchmark_year?: number
  
  // Data Source
  data_source?: string
  calculation_method?: string
  numerator_definition?: string
  denominator_definition?: string
  
  // Configuration
  reporting_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  higher_is_better: boolean
  unit: string
  
  // Status
  is_active: boolean
  is_cms_required: boolean
  is_ccbhc_required: boolean
  measure_steward?: string
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface HealthEquitySnapshot {
  id: string
  metric_id: string
  organization_id?: string
  
  // Stratification
  stratification_type: StratificationType
  stratification_value: string
  
  // Values
  current_value: number
  numerator?: number
  denominator?: number
  population_count?: number
  
  // Reference Comparison
  reference_value?: number
  disparity_ratio?: number
  disparity_difference?: number
  disparity_index?: number
  
  // Statistical Significance
  confidence_interval_lower?: number
  confidence_interval_upper?: number
  p_value?: number
  is_statistically_significant?: boolean
  
  // Period
  snapshot_date: string
  period_start?: string
  period_end?: string
  
  // Trend
  previous_value?: number
  trend?: TrendDirection
  trend_percentage?: number
  
  // Status
  meets_equity_target?: boolean
  alert_level?: AlertLevel
  
  // Metadata
  created_at: string
  calculation_notes?: string
  data_quality_score?: number
}

export interface HealthEquityInitiative {
  id: string
  organization_id?: string
  
  // Basic Information
  title: string
  description?: string
  initiative_type: InitiativeType
  
  // Target Population
  target_demographic_type?: StratificationType
  target_demographic_value?: string
  target_disparity_metric_id?: string
  target_population_size?: number
  
  // Timeline
  start_date: string
  end_date?: string
  status: InitiativeStatus
  
  // Progress
  baseline_value?: number
  target_value?: number
  current_progress?: number
  progress_percentage?: number
  
  // Resources
  lead_contact?: string
  lead_email?: string
  lead_phone?: string
  team_members?: string[]
  budget_allocated?: number
  budget_spent?: number
  funding_source?: string
  
  // Outcomes
  participants_enrolled: number
  participants_completed: number
  outcome_summary?: string
  lessons_learned?: string
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface HealthEquityGoal {
  id: string
  metric_id: string
  organization_id?: string
  initiative_id?: string
  
  // Target Specification
  stratification_type: StratificationType
  stratification_value: string
  
  // Goal Details
  goal_type: GoalType
  goal_name?: string
  goal_description?: string
  
  // Values
  baseline_value?: number
  baseline_date?: string
  target_value: number
  target_disparity_reduction?: number
  
  // Timeline
  start_date: string
  end_date: string
  
  // Progress
  current_value?: number
  current_disparity?: number
  progress_percentage?: number
  status: GoalStatus
  achieved_date?: string
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface PatientSdohScore {
  id: string
  patient_id: string
  
  // Domain Scores (0-100)
  housing_risk_score: number
  food_security_risk_score: number
  transportation_risk_score: number
  employment_risk_score: number
  social_support_risk_score: number
  healthcare_access_risk_score: number
  utility_risk_score: number
  mental_health_risk_score: number
  
  // Composite
  composite_sdoh_score: number
  risk_level: SdohRiskLevel
  
  // Domain Flags
  has_housing_instability: boolean
  has_food_insecurity: boolean
  has_transportation_barrier: boolean
  has_employment_barrier: boolean
  has_social_isolation: boolean
  has_healthcare_access_barrier: boolean
  
  // Source
  last_assessment_date?: string
  last_chw_encounter_id?: string
  assessment_count: number
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface HealthEquityAlert {
  id: string
  organization_id?: string
  metric_id: string
  snapshot_id?: string
  
  // Alert Details
  alert_type: 'threshold_exceeded' | 'trend_worsening' | 'new_disparity' | 'goal_at_risk' | 'data_quality'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message?: string
  
  // Context
  stratification_type?: StratificationType
  stratification_value?: string
  current_value?: number
  threshold_value?: number
  disparity_amount?: number
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_at?: string
  resolution_notes?: string
  
  // Metadata
  created_at: string
  updated_at: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface HealthEquityDashboardResponse {
  success: boolean
  
  // Summary Stats
  summary: {
    total_metrics: number
    metrics_with_disparities: number
    critical_disparities: number
    warning_disparities: number
    active_initiatives: number
    populations_at_risk: number
    average_disparity_index: number
  }
  
  // Key Disparities
  disparities: StratifiedOutcome[]
  
  // SDOH Overview
  sdoh_summary: SdohSummary
  
  // Active Alerts
  alerts: HealthEquityAlert[]
  
  // Initiatives
  initiatives: HealthEquityInitiative[]
}

export interface StratifiedOutcome {
  metric_id: string
  metric_name: string
  metric_code?: string
  stratification_type: StratificationType
  
  // Group values
  groups: {
    group_name: string
    value: number
    population_count: number
    disparity_from_reference: number
    disparity_ratio: number
    alert_level: AlertLevel
    trend: TrendDirection
  }[]
  
  // Reference
  reference_group: string
  reference_value: number
  
  // Benchmark
  benchmark_value?: number
  equity_target?: number
}

export interface SdohSummary {
  total_patients_screened: number
  screening_rate: number
  
  // Risk Distribution
  risk_distribution: {
    low: number
    moderate: number
    high: number
    very_high: number
  }
  
  // Domain Prevalence
  domain_prevalence: {
    housing_instability: number
    food_insecurity: number
    transportation_barrier: number
    employment_barrier: number
    social_isolation: number
    healthcare_access_barrier: number
  }
  
  // Impact on Outcomes
  sdoh_outcome_correlation: {
    domain: string
    retention_impact: number
    outcome_impact: number
  }[]
}

export interface HealthEquityAnalyticsRequest {
  metric_ids?: string[]
  stratification_types?: StratificationType[]
  date_from?: string
  date_to?: string
  include_trends?: boolean
  include_benchmarks?: boolean
}

export interface CreateInitiativeRequest {
  title: string
  description?: string
  initiative_type: InitiativeType
  target_demographic_type?: StratificationType
  target_demographic_value?: string
  target_disparity_metric_id?: string
  start_date: string
  end_date?: string
  baseline_value?: number
  target_value?: number
  lead_contact?: string
  lead_email?: string
  budget_allocated?: number
  funding_source?: string
}

export interface UpdateInitiativeRequest {
  title?: string
  description?: string
  status?: InitiativeStatus
  current_progress?: number
  participants_enrolled?: number
  participants_completed?: number
  outcome_summary?: string
  lessons_learned?: string
  budget_spent?: number
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface DisparityHeatmapData {
  metrics: string[]
  groups: string[]
  values: number[][] // metrics x groups matrix
  alerts: AlertLevel[][] // corresponding alert levels
}

export interface EquityTrendData {
  dates: string[]
  series: {
    group_name: string
    values: number[]
    is_reference: boolean
  }[]
  target_line?: number
  benchmark_line?: number
}

export interface SdohCorrelationData {
  domain: string
  domain_label: string
  prevalence: number
  retention_impact: number
  outcome_correlation: number
}

export interface PopulationRiskData {
  group_name: string
  stratification_type: StratificationType
  population_count: number
  disparity_score: number
  risk_factors: string[]
  recommended_interventions: string[]
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getAlertLevelColor(level: AlertLevel): string {
  switch (level) {
    case 'critical': return '#ef4444' // red-500
    case 'warning': return '#f59e0b' // amber-500
    case 'none': return '#22c55e' // green-500
    default: return '#6b7280' // gray-500
  }
}

export function getAlertLevelBgColor(level: AlertLevel): string {
  switch (level) {
    case 'critical': return '#fef2f2' // red-50
    case 'warning': return '#fffbeb' // amber-50
    case 'none': return '#f0fdf4' // green-50
    default: return '#f9fafb' // gray-50
  }
}

export function getTrendIcon(trend: TrendDirection): string {
  switch (trend) {
    case 'improving': return '↗'
    case 'worsening': return '↘'
    case 'stable': return '→'
    default: return '?'
  }
}

export function getTrendColor(trend: TrendDirection, higherIsBetter: boolean = true): string {
  const improving = higherIsBetter ? trend === 'improving' : trend === 'worsening'
  const worsening = higherIsBetter ? trend === 'worsening' : trend === 'improving'
  
  if (improving) return '#22c55e' // green
  if (worsening) return '#ef4444' // red
  return '#6b7280' // gray
}

export function formatDisparityValue(value: number, isRatio: boolean = false): string {
  if (isRatio) {
    return value.toFixed(2)
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function getStratificationLabel(type: StratificationType): string {
  const labels: Record<StratificationType, string> = {
    race: 'Race',
    ethnicity: 'Ethnicity',
    gender: 'Gender',
    age_group: 'Age Group',
    insurance_type: 'Insurance Type',
    geography: 'Geography',
    language: 'Language',
    sdoh_risk_level: 'SDOH Risk Level'
  }
  return labels[type] || type
}

export function getSdohRiskLevelLabel(level: SdohRiskLevel): string {
  const labels: Record<SdohRiskLevel, string> = {
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    very_high: 'Very High Risk'
  }
  return labels[level] || level
}

export function getSdohRiskLevelColor(level: SdohRiskLevel): string {
  const colors: Record<SdohRiskLevel, string> = {
    low: '#22c55e',
    moderate: '#f59e0b',
    high: '#f97316',
    very_high: '#ef4444'
  }
  return colors[level] || '#6b7280'
}

export function calculateDisparityIndex(
  groupValue: number, 
  referenceValue: number, 
  higherIsBetter: boolean = true
): number {
  if (referenceValue === 0) return 0
  
  const difference = groupValue - referenceValue
  const index = (difference / referenceValue) * 100
  
  // Normalize so positive = better, negative = disparity
  return higherIsBetter ? index : -index
}

export function getInitiativeStatusColor(status: InitiativeStatus): string {
  const colors: Record<InitiativeStatus, string> = {
    planning: '#6b7280',
    active: '#22c55e',
    paused: '#f59e0b',
    completed: '#3b82f6',
    cancelled: '#ef4444'
  }
  return colors[status] || '#6b7280'
}

