/**
 * Patient filtering utilities
 * Functions for filtering patient lists
 */

import type { PatientWithRelations, PatientFilters } from "@/types/patient"
import { getPatientStatus, getPatientRiskLevel } from "./patient-helpers"

/**
 * Filter patients based on search term
 */
export function filterBySearch(patients: PatientWithRelations[], searchTerm: string): PatientWithRelations[] {
  if (!searchTerm) return patients

  const lowerSearch = searchTerm.toLowerCase()
  return patients.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
    const phone = patient.phone?.toLowerCase() || ""
    const email = patient.email?.toLowerCase() || ""
    const mrn = patient.mrn?.toLowerCase() || ""

    return (
      fullName.includes(lowerSearch) ||
      phone.includes(lowerSearch) ||
      email.includes(lowerSearch) ||
      mrn.includes(lowerSearch)
    )
  })
}

/**
 * Filter patients by status
 */
export function filterByStatus(patients: PatientWithRelations[], status: string): PatientWithRelations[] {
  if (status === "all") return patients

  return patients.filter((patient) => {
    const patientStatus = getPatientStatus(patient)
    return (
      (status === "active" && patientStatus === "Active") ||
      (status === "high-risk" && patientStatus === "High Risk") ||
      (status === "assessment-due" && patientStatus === "Assessment Due")
    )
  })
}

/**
 * Filter patients by risk level
 */
export function filterByRiskLevel(
  patients: PatientWithRelations[],
  riskLevel: string
): PatientWithRelations[] {
  if (riskLevel === "all") return patients

  return patients.filter((patient) => {
    const patientRisk = getPatientRiskLevel(patient)
    return patientRisk === riskLevel
  })
}

/**
 * Apply all filters to patient list
 */
export function applyPatientFilters(
  patients: PatientWithRelations[],
  filters: PatientFilters
): PatientWithRelations[] {
  let filtered = patients

  if (filters.search) {
    filtered = filterBySearch(filtered, filters.search)
  }

  if (filters.status && filters.status !== "all") {
    filtered = filterByStatus(filtered, filters.status)
  }

  if (filters.riskLevel && filters.riskLevel !== "all") {
    filtered = filterByRiskLevel(filtered, filters.riskLevel)
  }

  if (filters.gender) {
    filtered = filtered.filter((p) => p.gender === filters.gender)
  }

  if (filters.insuranceProvider) {
    filtered = filtered.filter((p) => p.insurance_provider === filters.insuranceProvider)
  }

  if (filters.dateOfBirthFrom) {
    filtered = filtered.filter((p) => p.date_of_birth >= filters.dateOfBirthFrom!)
  }

  if (filters.dateOfBirthTo) {
    filtered = filtered.filter((p) => p.date_of_birth <= filters.dateOfBirthTo!)
  }

  return filtered
}

