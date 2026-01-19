/**
 * Patient utility functions
 * Helper functions for patient data manipulation and formatting
 */

import type { Patient, PatientWithRelations, PatientRiskLevel } from "@/types/patient"

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

/**
 * Format patient full name
 */
export function formatPatientName(patient: Patient): string {
  return `${patient.first_name} ${patient.last_name}`
}

/**
 * Get patient initials
 */
export function getPatientInitials(patient: Patient): string {
  return `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase()
}

/**
 * Get patient risk level from assessments
 */
export function getPatientRiskLevel(patient: PatientWithRelations): PatientRiskLevel {
  const latestAssessment = patient.assessments?.[0]
  if (
    latestAssessment?.risk_assessment &&
    typeof latestAssessment.risk_assessment === "object" &&
    "level" in latestAssessment.risk_assessment
  ) {
    const level = latestAssessment.risk_assessment.level
    if (level === "low" || level === "medium" || level === "high") {
      return level
    }
  }
  return "low"
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "N/A"
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "")
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

/**
 * Format date for display
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "N/A"
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return date
  }
}

/**
 * Get last visit date from appointments
 */
export function getLastVisit(patient: PatientWithRelations): string {
  const lastAppointment = patient.appointments?.[0]
  if (lastAppointment) {
    return formatDate(lastAppointment.appointment_date)
  }
  return "No visits"
}

/**
 * Get current active medication
 */
export function getCurrentMedication(patient: PatientWithRelations): string {
  const activeMed = patient.medications?.find((med) => med.status === "active")
  return activeMed ? `${activeMed.medication_name} ${activeMed.dosage}` : "No active medications"
}

/**
 * Get patient status based on appointments and risk
 */
export function getPatientStatus(patient: PatientWithRelations): string {
  const hasRecentAppointment = patient.appointments?.some((apt) => {
    const aptDate = new Date(apt.appointment_date)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return aptDate > weekAgo
  })

  const riskLevel = getPatientRiskLevel(patient)

  if (riskLevel === "high") return "High Risk"
  if (!hasRecentAppointment) return "Assessment Due"
  return "Active"
}

