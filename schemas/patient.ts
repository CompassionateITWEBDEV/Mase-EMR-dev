/**
 * Zod Schemas for Patient Validation
 * Runtime validation for patient data in forms and API routes
 */

import { z } from "zod"

/**
 * Base patient schema matching the database schema
 */
export const patientSchema = z.object({
  id: z.string().uuid().optional(),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  gender: z.enum(["Male", "Female", "Non-binary", "Other", "Prefer not to say"]).optional().nullable(),
  phone: z.string().regex(/^[\d\s\-\(\)]+$/, "Invalid phone number format").optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergency_contact_name: z.string().max(200).optional().nullable(),
  emergency_contact_phone: z.string().regex(/^[\d\s\-\(\)]+$/, "Invalid phone number format").optional().nullable(),
  insurance_provider: z.string().max(255).optional().nullable(),
  insurance_id: z.string().max(100).optional().nullable(),
  created_by: z.string().uuid().optional().nullable(),
  status: z.string().optional().nullable(),
  mrn: z.string().max(50).optional().nullable(),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in XXX-XX-XXXX format").optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().length(2, "State must be 2 characters").optional().nullable(),
  zip: z.string().max(10).optional().nullable(),
  organization_id: z.string().uuid().optional().nullable(),
})

/**
 * Patient form schema (camelCase for frontend forms)
 */
export const patientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  gender: z.enum(["Male", "Female", "Non-binary", "Other", "Prefer not to say"]).optional(),
  phone: z.string().regex(/^[\d\s\-\(\)]+$/, "Invalid phone number format").optional(),
  email: z.string().email("Invalid email format").optional(),
  address: z.string().max(500).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().regex(/^[\d\s\-\(\)]+$/, "Invalid phone number format").optional(),
  insuranceProvider: z.string().max(255).optional(),
  insuranceId: z.string().max(100).optional(),
})

/**
 * Patient update schema (all fields optional except id)
 */
export const patientUpdateSchema = patientSchema.partial().extend({
  id: z.string().uuid(),
  updated_at: z.string().optional(),
})

/**
 * Patient filters schema
 */
export const patientFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  riskLevel: z.enum(["low", "medium", "high", "all"]).optional(),
  gender: z.string().optional(),
  insuranceProvider: z.string().optional(),
  dateOfBirthFrom: z.string().optional(),
  dateOfBirthTo: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
})

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Patient query params schema (for API routes)
 */
export const patientQueryParamsSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(["last_name", "first_name", "created_at", "date_of_birth"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

/**
 * Type inference from schemas
 */
export type PatientInput = z.infer<typeof patientSchema>
export type PatientFormInput = z.infer<typeof patientFormSchema>
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>
export type PatientFiltersInput = z.infer<typeof patientFiltersSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type PatientQueryParams = z.infer<typeof patientQueryParamsSchema>

