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
