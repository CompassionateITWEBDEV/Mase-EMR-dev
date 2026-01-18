/**
 * Quality Measures and Metrics Type Definitions
 * Types for MIPS, HEDIS, and other quality measure tracking
 */

/**
 * Quality measure status
 */
export type QualityMeasureStatus =
  | "met"
  | "not_met"
  | "excluded"
  | "pending"
  | "not_applicable";

/**
 * Quality measure interface
 */
export interface QualityMeasure {
  /** Measure ID (e.g., 'CMS123v10') */
  measure_id: string;
  /** Measure name */
  name: string;
  /** Measure description */
  description?: string;
  /** Target performance percentage */
  target?: number;
  /** Current performance percentage */
  current_performance?: number;
  /** Status of the measure */
  status?: QualityMeasureStatus;
  /** Specialty this measure applies to */
  specialty?: string;
  /** Reporting year */
  reporting_year?: number;
  /** Numerator count */
  numerator?: number;
  /** Denominator count */
  denominator?: number;
  /** Exclusion count */
  exclusions?: number;
}

/**
 * Quality metrics summary for dashboard
 */
export interface QualityMetricsSummary {
  /** Overall compliance percentage */
  overall_score: number;
  /** Breakdown by measure category */
  by_category?: Record<string, number>;
  /** List of measures with their performance */
  measures: QualityMeasure[];
  /** Total measures tracked */
  total_measures: number;
  /** Measures meeting target */
  measures_met: number;
}

