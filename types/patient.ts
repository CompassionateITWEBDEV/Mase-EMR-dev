/**
 * Centralized Patient Type Definitions
 * This file contains all patient-related types used across the application
 */

/**
 * Base Patient interface matching the database schema
 */
export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  insurance_provider?: string | null;
  insurance_id?: string | null;
  program_type?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  status?: string | null;
  mrn?: string | null;
  ssn?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  organization_id?: string | null;
}

/**
 * Patient with related data (appointments, assessments, medications)
 */
export interface PatientWithRelations extends Patient {
  appointments?: Appointment[];
  assessments?: Assessment[];
  medications?: Medication[];
  patient_insurance?: PatientInsurance[];
  vital_signs?: VitalSign[];
  progress_notes?: ProgressNote[];
}

/**
 * Appointment interface
 */
export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_date: string;
  duration_minutes?: number | null;
  appointment_type: string;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
  providers?: Provider;
  patients?: Patient;
}

/**
 * Assessment interface
 */
export interface Assessment {
  id: string;
  patient_id: string;
  provider_id?: string | null;
  assessment_type: string;
  assessment_date: string;
  risk_assessment?: RiskAssessment | null;
  scores?: Record<string, any>;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

/**
 * Risk Assessment interface
 */
export interface RiskAssessment {
  level: "low" | "medium" | "high";
  factors?: string[];
  notes?: string;
}

/**
 * Medication interface
 */
export interface Medication {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency?: string | null;
  status: "active" | "discontinued" | "completed";
  start_date?: string | null;
  end_date?: string | null;
  prescriber_id?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

/**
 * Patient Insurance interface
 */
export interface PatientInsurance {
  id: string;
  patient_id: string;
  payer_id?: string | null;
  policy_number: string;
  group_number?: string | null;
  subscriber_name?: string | null;
  subscriber_relationship?: string | null;
  subscriber_dob?: string | null;
  effective_date?: string | null;
  termination_date?: string | null;
  is_primary: boolean;
  copay_amount?: number | null;
  deductible_amount?: number | null;
  out_of_pocket_max?: number | null;
  coverage_level?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
  is_active?: boolean | null;
}

/**
 * Vital Sign interface
 */
export interface VitalSign {
  id: string;
  patient_id: string;
  measurement_date: string;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  heart_rate?: number | null;
  temperature?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
  created_at?: string;
}

/**
 * Progress Note interface
 */
export interface ProgressNote {
  id: string;
  patient_id: string;
  provider_id: string;
  note_date: string;
  note_type: string;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

/**
 * Provider interface
 */
export interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  license_number?: string | null;
  license_type?: string | null;
  specialization?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

/**
 * Patient filters for search and filtering
 */
export interface PatientFilters {
  search?: string;
  status?: string;
  riskLevel?: "low" | "medium" | "high" | "all";
  gender?: string;
  insuranceProvider?: string;
  dateOfBirthFrom?: string;
  dateOfBirthTo?: string;
  createdFrom?: string;
  createdTo?: string;
}

/**
 * Patient sort options
 */
export interface PatientSortOptions {
  field: "last_name" | "first_name" | "created_at" | "date_of_birth";
  direction: "asc" | "desc";
}

/**
 * Pagination input for patient queries
 * Used for paginating patient list requests
 */
export interface PaginationInput {
  page: number;
  pageSize: number;
}

/**
 * Patient statistics
 */
export interface PatientStats {
  total: number;
  active: number;
  highRisk: number;
  recentAppointments: number;
  pendingAssessments?: number;
  inactive?: number;
}

/**
 * Patient status type
 */
export type PatientStatus =
  | "active"
  | "inactive"
  | "discharged"
  | "intake"
  | "on-hold";

/**
 * Patient risk level type
 */
export type PatientRiskLevel = "low" | "medium" | "high";

/**
 * Utility type for patient form data (camelCase)
 */
export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insuranceId?: string;
}

/**
 * Utility type to convert Patient to PatientFormData
 */
export function patientToFormData(patient: Patient): PatientFormData {
  return {
    firstName: patient.first_name,
    lastName: patient.last_name,
    dateOfBirth: patient.date_of_birth,
    gender: patient.gender || undefined,
    phone: patient.phone || undefined,
    email: patient.email || undefined,
    address: patient.address || undefined,
    emergencyContactName: patient.emergency_contact_name || undefined,
    emergencyContactPhone: patient.emergency_contact_phone || undefined,
    insuranceProvider: patient.insurance_provider || undefined,
    insuranceId: patient.insurance_id || undefined,
  };
}

/**
 * Utility type to convert PatientFormData to Patient (for API)
 */
export function formDataToPatient(
  formData: PatientFormData,
  id?: string
): Partial<Patient> {
  return {
    ...(id && { id }),
    first_name: formData.firstName,
    last_name: formData.lastName,
    date_of_birth: formData.dateOfBirth,
    gender: formData.gender || null,
    phone: formData.phone || null,
    email: formData.email || null,
    address: formData.address || null,
    emergency_contact_name: formData.emergencyContactName || null,
    emergency_contact_phone: formData.emergencyContactPhone || null,
    insurance_provider: formData.insuranceProvider || null,
    insurance_id: formData.insuranceId || null,
  };
}
