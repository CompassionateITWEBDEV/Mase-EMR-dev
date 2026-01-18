/**
 * Clinical Type Definitions
 * Types for clinical alerts, protocols, and assessments
 */

import type { AlertVariant, PriorityLevel } from "./common";

/**
 * Alert priority level
 * @deprecated Use PriorityLevel from types/common.ts instead
 */
export type AlertPriority = PriorityLevel;

/**
 * Alert type for styling
 * @deprecated Use AlertVariant from types/common.ts instead
 */
export type AlertType = AlertVariant;

/**
 * Clinical alert interface for dashboard display
 */
export interface ClinicalAlert {
  /** Alert ID (UUID) */
  id?: string;
  /** Patient name or identifier */
  patient: string;
  /** Patient ID for linking */
  patientId?: string;
  /** Alert message */
  message: string;
  /** Alert priority */
  priority: PriorityLevel;
  /** Time since alert was generated */
  time: string;
  /** Alert type for styling */
  type?: AlertVariant;
  /** Whether alert has been acknowledged */
  isAcknowledged?: boolean;
  /** Timestamp when alert was acknowledged */
  acknowledgedAt?: string | null;
  /** User ID who acknowledged the alert */
  acknowledgedBy?: string | null;
  /** Alert creation timestamp */
  createdAt?: string;
  /** Alert update timestamp */
  updatedAt?: string | null;
}

/**
 * Protocol step definition
 */
export interface ProtocolStep {
  /** Step number in sequence */
  step: number;
  /** Action to perform */
  action: string;
  /** Timing for the step */
  timing?: string;
}

/**
 * Protocol triggers
 */
export interface ProtocolTriggers {
  /** Vital sign thresholds */
  vitalSigns?: Record<string, number>;
  /** Lab value thresholds */
  labValues?: Record<string, number>;
  /** Medication triggers */
  medications?: string[];
  /** Other trigger conditions */
  [key: string]: unknown;
}

/**
 * Clinical protocol definition (matches clinical_protocols table)
 */
export interface Protocol {
  /** UUID primary key */
  id: string;
  /** Protocol name */
  name: string;
  /** Protocol category */
  category: string;
  /** Protocol description */
  description: string;
  /** Frequency of protocol execution */
  frequency: string;
  /** Steps to follow in the protocol */
  protocol_steps: ProtocolStep[];
  /** Trigger conditions */
  triggers: ProtocolTriggers;
  /** Whether protocol is currently active */
  is_active: boolean;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at?: string | null;
}

/**
 * COWS (Clinical Opiate Withdrawal Scale) assessment
 */
export interface COWSAssessment {
  id: string;
  patient_id: string;
  provider_id?: string | null;
  assessment_date: string;
  resting_pulse_rate: number;
  sweating: number;
  restlessness: number;
  pupil_size: number;
  bone_joint_aches: number;
  runny_nose_tearing: number;
  gi_upset: number;
  tremor: number;
  yawning: number;
  anxiety_irritability: number;
  gooseflesh_skin: number;
  total_score: number;
  severity_level: "none" | "mild" | "moderate" | "moderately_severe" | "severe";
  notes?: string | null;
  created_at?: string;
}

/**
 * CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol) assessment
 */
export interface CIWAAssessment {
  id: string;
  patient_id: string;
  provider_id?: string | null;
  assessment_date: string;
  nausea_vomiting: number;
  tremor: number;
  paroxysmal_sweats: number;
  anxiety: number;
  agitation: number;
  tactile_disturbances: number;
  auditory_disturbances: number;
  visual_disturbances: number;
  headache_fullness: number;
  orientation: number;
  total_score: number;
  severity_level: "minimal" | "mild" | "moderate" | "severe";
  notes?: string | null;
  created_at?: string;
}

/**
 * Assessment tool definition for display
 */
export interface AssessmentTool {
  /** Tool name (e.g., 'PHQ-9', 'GAD-7') */
  name: string;
  /** Full description */
  description: string;
  /** Number of questions */
  questions: number;
  /** Estimated time to complete */
  time: string;
}

/**
 * Clinical protocols API response
 */
export interface ClinicalProtocolsResponse {
  protocols: Protocol[];
  cowsAssessments?: COWSAssessment[];
  ciwaAssessments?: CIWAAssessment[];
  error?: string;
}

/**
 * ASAM Criteria Assessment Types
 */

/**
 * ASAM Level of Care values
 */
export type ASAMLevel =
  | "0.5"  // Early Intervention
  | "1.0"  // Outpatient Services
  | "2.1"  // Intensive Outpatient (IOP)
  | "2.5"  // Partial Hospitalization (PHP)
  | "3.1"  // Clinically Managed Low-Intensity Residential
  | "3.3"  // Clinically Managed Population-Specific High-Intensity Residential
  | "3.5"  // Clinically Managed High-Intensity Residential
  | "3.7"  // Medically Monitored Intensive Inpatient
  | "4.0"; // Medically Managed Intensive Inpatient

/**
 * Stages of Change for Dimension 4
 */
export type StageOfChange =
  | "precontemplation"
  | "contemplation"
  | "preparation"
  | "action"
  | "maintenance";

/**
 * ASAM 6-Dimension ratings
 */
export interface ASAMDimensions {
  /** Dimension 1: Acute Intoxication & Withdrawal Potential (0-3) */
  dimension1: number | null;
  /** Dimension 2: Biomedical Conditions & Complications (0-3) */
  dimension2: number | null;
  /** Dimension 3: Emotional/Behavioral/Cognitive Conditions (0-3) */
  dimension3: number | null;
  /** Dimension 4: Readiness to Change (stage of change) */
  dimension4: StageOfChange | string | null;
  /** Dimension 5: Relapse/Continued Use Potential (0-3) */
  dimension5: number | null;
  /** Dimension 6: Recovery/Living Environment (0-3) */
  dimension6: number | null;
}

/**
 * ASAM Assessment data stored in risk_assessment JSONB
 */
export interface ASAMRiskAssessment {
  asam_dimensions: ASAMDimensions;
  recommended_level: ASAMLevel | string;
  suggested_level?: ASAMLevel | string | null;
  suggestion_overridden?: boolean;
}

/**
 * Full ASAM Assessment record (extends base Assessment)
 */
export interface ASAMAssessment {
  id: string;
  patient_id: string;
  provider_id?: string | null;
  assessment_type: "ASAM Criteria Assessment";
  risk_assessment: ASAMRiskAssessment;
  chief_complaint?: string | null;
  created_at: string;
  updated_at?: string | null;
}

/**
 * ASAM Assessment form data for submission
 */
export interface ASAMAssessmentFormData {
  dimensions: ASAMDimensions;
  recommendedLevel: ASAMLevel | string | null;
  suggestedLevel?: ASAMLevel | string | null;
  suggestionOverridden?: boolean;
}

/**
 * ASAM Assessment API response
 */
export interface ASAMAssessmentResponse {
  success: boolean;
  assessment?: ASAMAssessment;
  error?: string;
}

/**
 * ASAM Assessments list API response
 */
export interface ASAMAssessmentsListResponse {
  assessments: ASAMAssessment[];
  count: number;
  error?: string;
}
