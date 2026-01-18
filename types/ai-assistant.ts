/**
 * AI Clinical Assistant Type Definitions
 * Types for AI-powered clinical decision support and recommendations
 */

import type { AlertVariant } from "./common";

/**
 * Risk alert type for styling
 * @deprecated Use AlertVariant from types/common.ts instead
 */
export type RiskAlertType = AlertVariant;

/**
 * Risk alert from AI analysis
 */
export interface RiskAlert {
  /** Alert type for styling */
  type: AlertVariant;
  /** Alert message */
  message: string;
}

/**
 * Clinical recommendation from AI
 */
export interface ClinicalRecommendation {
  /** Recommendation category (e.g., 'Diabetes Management') */
  category: string;
  /** Border color class for display */
  color: string;
  /** Recommendation text with evidence */
  text: string;
}

/**
 * Drug interaction check result
 */
export interface DrugInteractionResult {
  /** Status: no_major, minor, major, critical */
  status: "no_major" | "minor" | "major" | "critical";
  /** Summary message */
  message: string;
  /** List of specific interactions if any */
  interactions?: DrugInteraction[];
}

/**
 * Individual drug interaction detail
 */
export interface DrugInteraction {
  /** First drug in interaction */
  drug1: string;
  /** Second drug in interaction */
  drug2: string;
  /** Severity level */
  severity: "minor" | "moderate" | "major" | "contraindicated";
  /** Description of the interaction */
  description: string;
  /** Recommended action */
  action?: string;
}

/**
 * Lab order recommendation
 */
export interface LabOrder {
  /** Test name */
  test: string;
  /** Reason for ordering */
  reason: string;
  /** Urgency level */
  urgency: "STAT" | "Today" | "This week" | "Next 30 days" | "Routine";
}

/**
 * Badge variant type for diagnosis display
 */
export type DiagnosisBadgeType =
  | "destructive"
  | "default"
  | "secondary"
  | "outline";

/**
 * Differential diagnosis suggestion
 */
export interface Diagnosis {
  /** Diagnosis name */
  diagnosis: string;
  /** Probability/likelihood descriptor */
  probability: "Primary" | "High Probability" | "Consider" | "Rule Out";
  /** Badge type for styling */
  type: DiagnosisBadgeType;
}

/**
 * Preventive care status
 */
export type PreventiveStatus =
  | "overdue"
  | "due"
  | "needed"
  | "current"
  | "not_applicable";

/**
 * Preventive care gap
 */
export interface PreventiveGap {
  /** Preventive measure name */
  measure: string;
  /** Current status */
  status: PreventiveStatus;
  /** Days until due/since overdue (null if not applicable) */
  days: number | null;
  /** Recommended action */
  action: string;
}

/**
 * Complete AI recommendation response
 * Returned from /api/ai-clinical-assistant
 */
export interface AIRecommendation {
  /** Patient summary */
  summary: string;
  /** Risk alerts requiring attention */
  riskAlerts: RiskAlert[];
  /** Clinical recommendations with evidence */
  recommendations: ClinicalRecommendation[];
  /** Drug interaction check results */
  drugInteractions: DrugInteractionResult;
  /** Suggested lab orders */
  labOrders: LabOrder[];
  /** Differential diagnosis suggestions */
  differentialDiagnosis: Diagnosis[];
  /** Preventive care gaps */
  preventiveGaps: PreventiveGap[];
  /** Patient education topics */
  educationTopics: string[];
}

/**
 * AI assistant request payload
 */
export interface AIAssistantRequest {
  /** Patient ID to analyze */
  patientId: string;
  /** Analysis type */
  analysisType?: "full" | "quick" | "specific";
  /** Focus areas for specific analysis */
  focusAreas?: string[];
  /** Type of encounter for context */
  encounterType?:
    | "new_patient"
    | "follow_up"
    | "annual_wellness"
    | "sick_visit"
    | "procedure";
  /** Chief complaint for focused analysis */
  chiefComplaint?: string;
  /** Whether to include lab result review */
  includeLabReview?: boolean;
  /** Whether to include medication review */
  includeMedicationReview?: boolean;
}

/**
 * AI assistant API response
 */
export interface AIAssistantResponse {
  data?: AIRecommendation;
  error?: string;
  processingTime?: number;
}
