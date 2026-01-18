/**
 * Billing and CPT Code Type Definitions
 * Types for CPT codes, billing claims, and charge capture
 */

/**
 * CPT code category for categorizing billing codes
 */
export type BillingCategory =
  | "Office Visit"
  | "New Patient"
  | "Preventive"
  | "CCM"
  | "Wellness"
  | "TCM"
  | "Procedure"
  | "Lab"
  | "Other";

/**
 * CPT Code interface for billing and charge capture
 */
export interface CPTCode {
  /** CPT or HCPCS code (e.g., '99213', 'G0438') */
  code: string;
  /** Description of the service */
  description: string;
  /** Fee/rate in dollars */
  rate: number;
  /** Category for grouping/filtering */
  category: BillingCategory;
  /** Optional modifier code */
  modifier?: string;
}

/**
 * Claim status type
 */
export type ClaimStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "accepted"
  | "rejected"
  | "paid"
  | "denied"
  | "appealed";

/**
 * Claim type
 */
export type ClaimType = "professional" | "institutional" | "dental";

/**
 * Billing claim interface
 */
export interface BillingClaim {
  /** UUID primary key */
  id: string;
  /** Patient ID */
  patient_id: string;
  /** Provider ID */
  provider_id?: string | null;
  /** Encounter/visit ID */
  encounter_id?: string | null;
  /** CPT codes included in claim */
  cpt_codes: string[];
  /** ICD-10 diagnosis codes */
  diagnosis_codes?: string[];
  /** Date of service */
  service_date: string;
  /** Date claim was submitted */
  submission_date?: string | null;
  /** Claim status */
  claim_status: ClaimStatus;
  /** Type of claim */
  claim_type: ClaimType;
  /** Total charges */
  total_charges: number;
  /** Amount paid */
  paid_amount?: number | null;
  /** Adjustment amount */
  adjustment_amount?: number | null;
  /** Payer ID */
  payer_id?: string | null;
  /** Payer name for display */
  payer_name?: string | null;
  /** Whether patient has Medicare + Medicaid */
  is_medicare_medicaid?: boolean;
  /** Week reference for OTP bundle billing */
  week_of?: string | null;
  /** Creation timestamp */
  created_at?: string;
  /** Last update timestamp */
  updated_at?: string | null;
}

/**
 * Billing summary for dashboard display
 */
export interface BillingSummary {
  /** Total revenue */
  revenue: number;
  /** Revenue change percentage */
  revenueChange: number;
  /** Number of bundle claims */
  bundleClaims: number;
  /** Bundle to APG ratio */
  bundleApgRatio: number;
  /** Number of prior authorizations */
  priorAuths: number;
  /** Pending authorizations */
  pendingAuths: number;
  /** Collection rate percentage */
  collectionRate: number;
  /** Collection rate change */
  collectionChange: number;
}

/**
 * Weekly billing breakdown
 */
export interface WeeklyBilling {
  fullBundle: number;
  takeHomeBundle: number;
  apgClaims: number;
  dualEligible: number;
}

/**
 * Rate code distribution for reporting
 */
export interface RateCodeDistribution {
  methadoneFull: number;
  buprenorphineFull: number;
  methadoneTakeHome: number;
  buprenorphineTakeHome: number;
}

/**
 * Recent claim for display
 */
export interface RecentClaim {
  id: string;
  patientName: string;
  weekOf: string;
  description: string;
  claimType: string;
  amount: number;
  isMedicareMedicaid?: boolean;
}

/**
 * Billing dashboard data response
 */
export interface BillingDashboardData {
  revenue: number;
  revenueChange: number;
  bundleClaims: number;
  bundleApgRatio: number;
  priorAuths: number;
  pendingAuths: number;
  collectionRate: number;
  collectionChange: number;
  weeklyBilling: WeeklyBilling;
  rateCodeDistribution: RateCodeDistribution;
  recentClaims: RecentClaim[];
}

