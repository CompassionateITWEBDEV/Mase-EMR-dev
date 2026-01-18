/**
 * Clinical Protocol Checker Service
 * Checks patient eligibility against specialty-specific clinical protocols
 */

import { createClient } from "@/lib/supabase/server";
import type { StructuredPatientData } from "./patient-data-aggregator";
import type { NoteSummary } from "./note-processor";

export interface ProtocolCheck {
  protocolId: string;
  protocolName: string;
  specialtyId: string;
  eligible: boolean;
  reason: string;
  recommendations: string[];
  requiredCriteria: string[];
  metCriteria: string[];
  unmetCriteria: string[];
}

/**
 * Checks OTP take-home dose eligibility (Behavioral Health)
 */
export async function checkOTPTakeHomeEligibility(
  patientId: string,
  structuredData: StructuredPatientData,
  noteSummary?: NoteSummary
): Promise<ProtocolCheck> {
  const supabase = await createClient();
  const unmetCriteria: string[] = [];
  const metCriteria: string[] = [];
  const recommendations: string[] = [];

  // Check for recent UDS results
  const hasRecentUDS = structuredData.labResults.some((lab) => {
    if (lab.test_name?.toLowerCase().includes("urine") || lab.test_name?.toLowerCase().includes("uds")) {
      const labDate = lab.result_date ? new Date(lab.result_date) : null;
      if (labDate) {
        const daysSince = (Date.now() - labDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30; // Within last 30 days
      }
    }
    return false;
  });

  if (!hasRecentUDS) {
    unmetCriteria.push("Recent UDS within 30 days");
    recommendations.push("Order urine drug screen before approving take-home dose");
  } else {
    metCriteria.push("Recent UDS within 30 days");
  }

  // Check for negative UDS results
  const recentUDS = structuredData.labResults
    .filter((lab) => {
      const name = lab.test_name?.toLowerCase() || "";
      return name.includes("urine") || name.includes("uds");
    })
    .sort((a, b) => {
      const dateA = a.result_date ? new Date(a.result_date).getTime() : 0;
      const dateB = b.result_date ? new Date(b.result_date).getTime() : 0;
      return dateB - dateA;
    })[0];

  const hasNegativeUDS = recentUDS && recentUDS.result_value?.toLowerCase().includes("negative");

  if (!hasNegativeUDS && recentUDS) {
    unmetCriteria.push("Negative UDS results");
    recommendations.push("Patient has positive UDS - review before take-home approval");
  } else if (hasNegativeUDS) {
    metCriteria.push("Negative UDS results");
  }

  // Check attendance/compliance from notes
  const hasGoodAttendance = noteSummary?.concerns.every(
    (c) => !c.toLowerCase().includes("missed") && !c.toLowerCase().includes("no-show")
  );

  if (!hasGoodAttendance) {
    unmetCriteria.push("Good attendance record");
    recommendations.push("Review attendance history - consider counseling before take-home");
  } else {
    metCriteria.push("Good attendance record");
  }

  // Check for COWS/CIWA assessments
  const hasRecentAssessment = noteSummary?.assessmentScores && (
    noteSummary.assessmentScores.cows !== undefined ||
    noteSummary.assessmentScores.ciwa !== undefined
  );

  if (!hasRecentAssessment) {
    unmetCriteria.push("Recent COWS/CIWA assessment");
    recommendations.push("Complete withdrawal assessment before take-home approval");
  } else {
    metCriteria.push("Recent COWS/CIWA assessment");
  }

  // Check treatment duration (typically need 90 days)
  const treatmentStart = structuredData.encounters
    .filter((e) => e.encounter_type?.toLowerCase().includes("intake") || e.encounter_type?.toLowerCase().includes("initial"))
    .sort((a, b) => {
      const dateA = a.encounter_date ? new Date(a.encounter_date).getTime() : 0;
      const dateB = b.encounter_date ? new Date(b.encounter_date).getTime() : 0;
      return dateA - dateB;
    })[0];

  let hasMinimumDuration = false;
  if (treatmentStart?.encounter_date) {
    const daysInTreatment = (Date.now() - new Date(treatmentStart.encounter_date).getTime()) / (1000 * 60 * 60 * 24);
    hasMinimumDuration = daysInTreatment >= 90;
  }

  if (!hasMinimumDuration) {
    unmetCriteria.push("Minimum 90 days in treatment");
    recommendations.push("Patient needs minimum 90 days in treatment for take-home eligibility");
  } else {
    metCriteria.push("Minimum 90 days in treatment");
  }

  const eligible = unmetCriteria.length === 0;
  const reason = eligible
    ? "Patient meets all criteria for OTP take-home dose eligibility"
    : `Patient does not meet ${unmetCriteria.length} required criteria(s)`;

  return {
    protocolId: "otp_takehome_eligibility",
    protocolName: "OTP Take-Home Dose Eligibility",
    specialtyId: "behavioral-health",
    eligible,
    reason,
    recommendations,
    requiredCriteria: [
      "Recent UDS within 30 days",
      "Negative UDS results",
      "Good attendance record",
      "Recent COWS/CIWA assessment",
      "Minimum 90 days in treatment",
    ],
    metCriteria,
    unmetCriteria,
  };
}

/**
 * Checks patient eligibility against a specific protocol
 */
export async function checkProtocolEligibility(
  protocolId: string,
  specialtyId: string,
  patientId: string,
  structuredData: StructuredPatientData,
  noteSummary?: NoteSummary
): Promise<ProtocolCheck | null> {
  switch (protocolId) {
    case "otp_takehome_eligibility":
      if (specialtyId === "behavioral-health") {
        return checkOTPTakeHomeEligibility(patientId, structuredData, noteSummary);
      }
      break;

    // Add more protocol checks here
    // case "primary_care_diabetes_screening":
    //   return checkDiabetesScreeningProtocol(patientId, structuredData, noteSummary);
    // case "psychiatry_phq9_followup":
    //   return checkPHQ9FollowupProtocol(patientId, structuredData, noteSummary);
  }

  return null;
}

/**
 * Gets all applicable protocols for a specialty
 */
export async function getSpecialtyProtocols(specialtyId: string): Promise<string[]> {
  const protocols: Record<string, string[]> = {
    "behavioral-health": ["otp_takehome_eligibility"],
    "primary-care": [],
    "psychiatry": [],
    // Add more specialty protocols
  };

  return protocols[specialtyId] || [];
}

/**
 * Checks all applicable protocols for a patient
 */
export async function checkAllProtocols(
  specialtyId: string,
  patientId: string,
  structuredData: StructuredPatientData,
  noteSummary?: NoteSummary
): Promise<ProtocolCheck[]> {
  const protocolIds = await getSpecialtyProtocols(specialtyId);
  const results: ProtocolCheck[] = [];

  for (const protocolId of protocolIds) {
    const check = await checkProtocolEligibility(
      protocolId,
      specialtyId,
      patientId,
      structuredData,
      noteSummary
    );
    if (check) {
      results.push(check);
    }
  }

  return results;
}
