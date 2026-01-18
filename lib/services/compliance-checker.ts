/**
 * Compliance Checker Service
 * Ensures AI recommendations support MIPS, billing codes, documentation, and regulatory compliance
 */

import type { AIRecommendation } from "@/types/ai-assistant";
import type { StructuredPatientData } from "./patient-data-aggregator";

export interface ComplianceCheck {
  category: "mips" | "billing" | "documentation" | "regulatory";
  compliant: boolean;
  issues: string[];
  recommendations: string[];
  requiredActions: string[];
}

export interface ComplianceResult {
  overallCompliant: boolean;
  checks: ComplianceCheck[];
  summary: string;
}

/**
 * MIPS Quality Measures
 */
const MIPS_MEASURES = {
  "diabetes_hemoglobin_a1c": {
    code: "CMS122v11",
    description: "Diabetes: Hemoglobin A1c Poor Control (>9%)",
    required: (data: StructuredPatientData) => {
      const hasDiabetes = data.problems.some(
        (p) => p.diagnosis?.toLowerCase().includes("diabetes")
      );
      if (!hasDiabetes) return null;

      const recentHbA1c = data.labResults
        .filter((lab) => lab.test_name?.toLowerCase().includes("hba1c") || lab.test_name?.toLowerCase().includes("hemoglobin a1c"))
        .sort((a, b) => {
          const dateA = a.result_date ? new Date(a.result_date).getTime() : 0;
          const dateB = b.result_date ? new Date(b.result_date).getTime() : 0;
          return dateB - dateA;
        })[0];

      return {
        required: true,
        documented: !!recentHbA1c,
        value: recentHbA1c?.result_value ? parseFloat(recentHbA1c.result_value) : null,
        target: recentHbA1c?.result_value ? parseFloat(recentHbA1c.result_value) <= 9 : null,
      };
    },
  },
  "hypertension_control": {
    code: "CMS165v10",
    description: "Controlling High Blood Pressure",
    required: (data: StructuredPatientData) => {
      const hasHypertension = data.problems.some(
        (p) => p.diagnosis?.toLowerCase().includes("hypertension") || p.diagnosis?.toLowerCase().includes("high blood pressure")
      );
      if (!hasHypertension) return null;

      const recentBP = data.vitalSigns
        .filter((v) => v.blood_pressure)
        .sort((a, b) => {
          const dateA = a.measurement_date ? new Date(a.measurement_date).getTime() : 0;
          const dateB = b.measurement_date ? new Date(b.measurement_date).getTime() : 0;
          return dateB - dateA;
        })[0];

      if (!recentBP?.blood_pressure) {
        return { required: true, documented: false, value: null, target: null };
      }

      const [systolic, diastolic] = recentBP.blood_pressure.split("/").map(Number);
      const controlled = systolic < 140 && diastolic < 90;

      return {
        required: true,
        documented: true,
        value: { systolic, diastolic },
        target: controlled,
      };
    },
  },
};

/**
 * Checks MIPS quality measure compliance
 */
export function checkMIPSCompliance(
  recommendations: AIRecommendation,
  structuredData: StructuredPatientData
): ComplianceCheck {
  const issues: string[] = [];
  const requiredActions: string[] = [];
  const mipsRecommendations: string[] = [];

  // Check each MIPS measure
  for (const [measureId, measure] of Object.entries(MIPS_MEASURES)) {
    const result = measure.required(structuredData);
    if (result === null) continue; // Not applicable

    if (!result.documented) {
      issues.push(`${measure.description}: Missing required documentation`);
      requiredActions.push(`Document ${measure.description} (${measure.code})`);
      mipsRecommendations.push(
        `Order lab/test to document ${measure.description} for MIPS reporting`
      );
    } else if (result.target === false) {
      issues.push(`${measure.description}: Target not met`);
      requiredActions.push(`Address ${measure.description} to meet MIPS target`);
      mipsRecommendations.push(
        `Review and adjust treatment plan to meet ${measure.description} target`
      );
    }
  }

  return {
    category: "mips",
    compliant: issues.length === 0,
    issues,
    recommendations: mipsRecommendations,
    requiredActions,
  };
}

/**
 * Checks billing code compliance
 */
export function checkBillingCompliance(
  recommendations: AIRecommendation,
  structuredData: StructuredPatientData
): ComplianceCheck {
  const issues: string[] = [];
  const recommendations_list: string[] = [];

  // Check if recommendations include appropriate billing codes
  const hasLabOrders = recommendations.labOrders.length > 0;
  const hasDiagnosis = recommendations.differentialDiagnosis.length > 0;

  if (hasLabOrders) {
    // Ensure lab orders have appropriate CPT codes
    const labsWithoutCodes = recommendations.labOrders.filter((lab) => !lab.test?.includes("CPT"));
    if (labsWithoutCodes.length > 0) {
      issues.push("Some lab orders may be missing CPT codes");
      recommendations_list.push("Ensure all lab orders include appropriate CPT codes for billing");
    }
  }

  if (hasDiagnosis) {
    // Ensure diagnoses have ICD-10 codes
    const dxWithoutCodes = recommendations.differentialDiagnosis.filter(
      (dx) => !dx.diagnosis?.includes("ICD-10")
    );
    if (dxWithoutCodes.length > 0) {
      issues.push("Some diagnoses may be missing ICD-10 codes");
      recommendations_list.push("Ensure all diagnoses include ICD-10 codes for billing");
    }
  }

  return {
    category: "billing",
    compliant: issues.length === 0,
    issues,
    recommendations: recommendations_list,
    requiredActions: [],
  };
}

/**
 * Checks documentation requirements
 */
export function checkDocumentationCompliance(
  recommendations: AIRecommendation,
  structuredData: StructuredPatientData
): ComplianceCheck {
  const issues: string[] = [];
  const recommendations_list: string[] = [];
  const requiredActions: string[] = [];

  // Check for required documentation elements
  if (recommendations.riskAlerts.length > 0) {
    const criticalAlerts = recommendations.riskAlerts.filter(
      (alert) => alert.type === "warning" || alert.type === "destructive"
    );
    if (criticalAlerts.length > 0) {
      issues.push("Critical risk alerts require immediate documentation");
      requiredActions.push("Document risk assessment and mitigation plan in clinical note");
      recommendations_list.push(
        "Ensure all critical risk alerts are documented in the patient's chart"
      );
    }
  }

  // Check for medication changes
  if (recommendations.recommendations.some((r) => r.text?.toLowerCase().includes("medication"))) {
    issues.push("Medication changes require documentation");
    requiredActions.push("Document medication changes with rationale in clinical note");
    recommendations_list.push("Document all medication recommendations in clinical notes");
  }

  return {
    category: "documentation",
    compliant: issues.length === 0,
    issues,
    recommendations: recommendations_list,
    requiredActions,
  };
}

/**
 * Checks regulatory compliance (42 CFR Part 2, HIPAA)
 */
export function checkRegulatoryCompliance(
  recommendations: AIRecommendation,
  structuredData: StructuredPatientData,
  specialtyId: string
): ComplianceCheck {
  const issues: string[] = [];
  const recommendations_list: string[] = [];
  const requiredActions: string[] = [];

  // 42 CFR Part 2 compliance for Behavioral Health
  if (specialtyId === "behavioral-health") {
    // Check if patient consent is documented
    const hasConsent = structuredData.encounters.some((e) =>
      e.chief_complaint?.toLowerCase().includes("consent") || e.chief_complaint?.toLowerCase().includes("42 cfr")
    );

    if (!hasConsent) {
      issues.push("42 CFR Part 2: Patient consent may not be documented");
      requiredActions.push("Verify patient consent for substance use treatment is documented");
      recommendations_list.push(
        "Ensure 42 CFR Part 2 consent is properly documented before sharing information"
      );
    }

    // Check for proper confidentiality notices
    recommendations_list.push(
      "Ensure all recommendations comply with 42 CFR Part 2 confidentiality requirements"
    );
  }

  // HIPAA compliance
  // Check if recommendations contain PHI that should be protected
  const hasPHI = recommendations.summary?.match(/\b\d{3}-\d{2}-\d{4}\b/) || // SSN pattern
    recommendations.summary?.match(/\b\d{10}\b/); // Phone pattern

  if (hasPHI) {
    issues.push("HIPAA: Recommendations may contain protected health information");
    requiredActions.push("Review recommendations to ensure PHI is properly protected");
    recommendations_list.push("Ensure all recommendations comply with HIPAA privacy rules");
  }

  return {
    category: "regulatory",
    compliant: issues.length === 0,
    issues,
    recommendations: recommendations_list,
    requiredActions,
  };
}

/**
 * Performs all compliance checks
 */
export function checkCompliance(
  recommendations: AIRecommendation,
  structuredData: StructuredPatientData,
  specialtyId: string
): ComplianceResult {
  const checks: ComplianceCheck[] = [
    checkMIPSCompliance(recommendations, structuredData),
    checkBillingCompliance(recommendations, structuredData),
    checkDocumentationCompliance(recommendations, structuredData),
    checkRegulatoryCompliance(recommendations, structuredData, specialtyId),
  ];

  const overallCompliant = checks.every((check) => check.compliant);
  const allIssues = checks.flatMap((check) => check.issues);
  const allActions = checks.flatMap((check) => check.requiredActions);

  const summary = overallCompliant
    ? "All compliance checks passed"
    : `Found ${allIssues.length} compliance issue(s) requiring attention: ${allIssues.join(", ")}`;

  return {
    overallCompliant,
    checks,
    summary,
  };
}
