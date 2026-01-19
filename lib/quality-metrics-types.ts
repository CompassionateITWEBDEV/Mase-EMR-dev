// ============================================================================
// Quality Metrics Types for Research Dashboard
// ============================================================================

export type MetricCategory = 
  | 'outcomes' 
  | 'access' 
  | 'ccbhc' 
  | 'integration' 
  | 'safety' 
  | 'efficiency' 
  | 'patient_experience'

export type ReportingPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'

export type TrendDirection = 'up' | 'down' | 'stable'

export type GoalType = 'annual' | 'quarterly' | 'improvement' | 'maintenance' | 'stretch'

export type GoalStatus = 'active' | 'achieved' | 'not_achieved' | 'cancelled' | 'in_progress'

export type BenchmarkType = 'national' | 'state' | 'regional' | 'peer' | 'internal' | 'accreditation'

export type LinkedEntityType = 'ebp' | 'research_study' | 'treatment_program' | 'intervention'

export type RelationshipType = 'affects' | 'measures' | 'contributes_to' | 'derived_from'

// ============================================================================
// Core Interfaces
// ============================================================================

export interface QualityMetric {
  id: string
  organization_id?: string
  
  // Basic Information
  name: string
  code?: string
  description?: string
  category: MetricCategory
  
  // Target and Benchmark
  target_value: number
  benchmark_value?: number
  benchmark_source?: string
  unit: string
  
  // Configuration
  data_source?: string
  calculation_method?: string
  reporting_period: ReportingPeriod
  higher_is_better: boolean
  
  // Thresholds
  warning_threshold?: number
  critical_threshold?: number
  
  // Status
  is_active: boolean
  is_ccbhc_required: boolean
  is_mips_measure: boolean
  measure_steward?: string
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
}

export interface QualityMetricWithData extends QualityMetric {
  // Current snapshot data
  current_value?: number
  trend?: TrendDirection
  trend_percentage?: number
  meets_target?: boolean
  meets_benchmark?: boolean
  last_calculated?: string
  
  // Historical data for charts
  historical_data?: QualitySnapshot[]
  
  // Related benchmarks
  benchmarks?: QualityBenchmark[]
  
  // Active goals
  goals?: QualityGoal[]
}

export interface QualitySnapshot {
  id: string
  metric_id: string
  organization_id?: string
  
  // Value Information
  current_value: number
  numerator?: number
  denominator?: number
  
  // Period Information
  snapshot_date: string
  period_start?: string
  period_end?: string
  reporting_period?: ReportingPeriod
  
  // Comparison Data
  previous_value?: number
  trend?: TrendDirection
  trend_percentage?: number
  
  // Status
  meets_target?: boolean
  meets_benchmark?: boolean
  
  // Calculation Details
  calculation_notes?: string
  data_quality_score?: number
  
  // Metadata
  created_at: string
  calculated_by: string
}

export interface QualityBenchmark {
  id: string
  metric_id: string
  
  // Benchmark Information
  benchmark_type: BenchmarkType
  benchmark_name: string
  benchmark_value: number
  benchmark_year?: number
  
  // Source Information
  source_organization?: string
  source_url?: string
  methodology_notes?: string
  
  // Validity Period
  effective_date?: string
  expiration_date?: string
  
  // Status
  is_active: boolean
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface QualityGoal {
  id: string
  metric_id: string
  organization_id?: string
  
  // Goal Information
  goal_type: GoalType
  goal_name?: string
  target_value: number
  baseline_value?: number
  
  // Timeline
  start_date: string
  end_date: string
  
  // Status Tracking
  current_progress?: number
  status: GoalStatus
  achieved_date?: string
  
  // Notes
  description?: string
  action_plan?: string
  barriers?: string
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
}

export interface QualityMetricLink {
  id: string
  metric_id: string
  
  // Link Target
  linked_entity_type: LinkedEntityType
  linked_entity_id: string
  
  // Relationship
  relationship_type: RelationshipType
  impact_weight: number
  
  // Notes
  description?: string
  
  // Metadata
  created_at: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface QualityMetricsListResponse {
  success: boolean
  metrics: QualityMetricWithData[]
  total: number
  page: number
  limit: number
  summary?: {
    total_metrics: number
    active_metrics: number
    meeting_target: number
    meeting_benchmark: number
    below_warning: number
    below_critical: number
    average_performance: number
  }
}

export interface QualityMetricDetailResponse {
  success: boolean
  metric: QualityMetricWithData
  historical_data: QualitySnapshot[]
  benchmarks: QualityBenchmark[]
  goals: QualityGoal[]
  linked_entities: QualityMetricLink[]
}

export interface CreateQualityMetricRequest {
  name: string
  code?: string
  description?: string
  category: MetricCategory
  target_value: number
  benchmark_value?: number
  benchmark_source?: string
  unit?: string
  data_source?: string
  calculation_method?: string
  reporting_period?: ReportingPeriod
  higher_is_better?: boolean
  warning_threshold?: number
  critical_threshold?: number
  is_ccbhc_required?: boolean
  is_mips_measure?: boolean
  measure_steward?: string
}

export interface UpdateQualityMetricRequest {
  name?: string
  description?: string
  category?: MetricCategory
  target_value?: number
  benchmark_value?: number
  benchmark_source?: string
  unit?: string
  data_source?: string
  calculation_method?: string
  reporting_period?: ReportingPeriod
  higher_is_better?: boolean
  warning_threshold?: number
  critical_threshold?: number
  is_active?: boolean
  is_ccbhc_required?: boolean
  is_mips_measure?: boolean
  measure_steward?: string
}

export interface CreateSnapshotRequest {
  current_value: number
  numerator?: number
  denominator?: number
  snapshot_date?: string
  period_start?: string
  period_end?: string
  calculation_notes?: string
  data_quality_score?: number
}

export interface QualityMetricsFilterOptions {
  category?: MetricCategory
  status?: 'all' | 'meeting_target' | 'near_target' | 'below_target'
  is_active?: boolean
  is_ccbhc_required?: boolean
  is_mips_measure?: boolean
  search?: string
  sort_by?: 'name' | 'current_value' | 'trend' | 'category' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  date_from?: string
  date_to?: string
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface MetricTrendDataPoint {
  date: string
  value: number
  target?: number
  benchmark?: number
}

export interface CategoryPerformanceData {
  category: MetricCategory
  label: string
  meeting_target: number
  near_target: number
  below_target: number
  total: number
  average_performance: number
}

export interface BenchmarkComparisonData {
  metric_name: string
  current_value: number
  target_value: number
  national_benchmark?: number
  state_benchmark?: number
  peer_benchmark?: number
}

// ============================================================================
// Notification Types
// ============================================================================

export interface QualityMetricNotification {
  id: string
  metric_id: string
  metric_name: string
  notification_type: 'below_threshold' | 'trend_change' | 'missing_data' | 'goal_achieved' | 'benchmark_comparison'
  severity: 'info' | 'warning' | 'error'
  title: string
  message: string
  action_required: boolean
  created_at: string
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getMetricStatus(
  currentValue: number,
  targetValue: number,
  benchmarkValue?: number,
  higherIsBetter: boolean = true
): 'met' | 'near_target' | 'below' {
  const comparison = higherIsBetter
    ? (current: number, target: number) => current >= target
    : (current: number, target: number) => current <= target

  if (comparison(currentValue, targetValue)) {
    return 'met'
  }
  
  const threshold = benchmarkValue ?? targetValue * 0.9
  if (comparison(currentValue, threshold)) {
    return 'near_target'
  }
  
  return 'below'
}

export function calculateTrend(
  currentValue: number,
  previousValue: number | null | undefined
): { trend: TrendDirection; percentage: number } {
  if (previousValue === null || previousValue === undefined || previousValue === 0) {
    return { trend: 'stable', percentage: 0 }
  }
  
  const change = ((currentValue - previousValue) / previousValue) * 100
  
  if (change > 1) {
    return { trend: 'up', percentage: Math.round(change * 10) / 10 }
  } else if (change < -1) {
    return { trend: 'down', percentage: Math.round(change * 10) / 10 }
  }
  
  return { trend: 'stable', percentage: Math.round(change * 10) / 10 }
}

export function getCategoryLabel(category: MetricCategory): string {
  const labels: Record<MetricCategory, string> = {
    outcomes: 'Outcomes',
    access: 'Access',
    ccbhc: 'CCBHC',
    integration: 'Integration',
    safety: 'Safety',
    efficiency: 'Efficiency',
    patient_experience: 'Patient Experience'
  }
  return labels[category] || category
}

export function getCategoryColor(category: MetricCategory): string {
  const colors: Record<MetricCategory, string> = {
    outcomes: '#8884d8',
    access: '#82ca9d',
    ccbhc: '#ffc658',
    integration: '#ff7300',
    safety: '#dc2626',
    efficiency: '#0088fe',
    patient_experience: '#00C49F'
  }
  return colors[category] || '#666666'
}

