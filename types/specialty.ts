/**
 * Specialty Configuration Type Definitions
 * Types for medical specialty configurations, features, workflows, and templates
 */

import type { LucideIcon } from "lucide-react";

/**
 * Specialty workflow definition
 */
export interface SpecialtyWorkflow {
  /** Workflow name */
  name: string;
  /** Description of the workflow */
  description: string;
}

/**
 * Specialty document template
 */
export interface SpecialtyTemplate {
  /** Template name */
  name: string;
  /** Template type (Assessment, Progress Note, Discharge, etc.) */
  type: string;
}

/**
 * Specialty billing code
 */
export interface SpecialtyBillingCode {
  /** CPT or HCPCS code */
  code: string;
  /** Code description */
  description: string;
  /** Fee amount (as formatted string) */
  fee: string;
}

/**
 * Specialty configuration for UI display
 * Used in app/specialty/[id]/page.tsx
 */
export interface SpecialtyConfig {
  /** Display name of the specialty */
  name: string;
  /** Lucide icon component for the specialty */
  icon: LucideIcon;
  /** Description of the specialty */
  description: string;
  /** Theme color (hex code) */
  color: string;
  /** List of features available for this specialty */
  features: string[];
  /** Workflow definitions */
  workflows: SpecialtyWorkflow[];
  /** Document templates */
  templates: SpecialtyTemplate[];
  /** Billing codes specific to this specialty */
  billingCodes: SpecialtyBillingCode[];
}

/**
 * Specialty configurations map type
 */
export type SpecialtyConfigMap = Record<string, SpecialtyConfig>;

/**
 * Specialty feature from database (specialty_features table)
 */
export interface SpecialtyFeature {
  /** UUID primary key */
  id: string;
  /** Specialty identifier (e.g., 'primary-care', 'behavioral-health') */
  specialty_id: string;
  /** Feature code (e.g., 'icd10', 'vitals_trending') */
  feature_code: string;
  /** Human-readable feature name */
  feature_name: string;
  /** Feature description */
  description?: string | null;
  /** Whether this is a core feature for the specialty */
  is_core_feature: boolean;
  /** Creation timestamp */
  created_at?: string;
}

/**
 * Clinic specialty configuration from database (clinic_specialty_configuration table)
 */
export interface ClinicSpecialtyConfiguration {
  /** UUID primary key */
  id: string;
  /** Clinic UUID (for multi-tenant support) */
  clinic_id?: string | null;
  /** Specialty identifier */
  specialty_id: string;
  /** Whether this specialty is enabled for the clinic */
  enabled: boolean;
  /** When the specialty was configured */
  configured_at?: string | null;
  /** User who configured the specialty */
  configured_by?: string | null;
  /** Custom settings JSON */
  custom_settings?: Record<string, unknown>;
  /** Creation timestamp */
  created_at?: string;
  /** Last update timestamp */
  updated_at?: string | null;
}

/**
 * API response for specialty configuration
 */
export interface SpecialtyConfigResponse {
  specialties: ClinicSpecialtyConfiguration[];
  features: SpecialtyFeature[];
  error?: string;
}

/**
 * Specialty identifier type (for type-safe specialty IDs)
 */
export type SpecialtyId =
  | "behavioral-health"
  | "primary-care"
  | "psychiatry"
  | "obgyn"
  | "cardiology"
  | "dermatology"
  | "urgent-care"
  | "pediatrics"
  | "podiatry"
  | "physical-therapy"
  | "occupational-therapy"
  | "speech-therapy"
  | "chiropractic";

