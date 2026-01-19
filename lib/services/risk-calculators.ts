/**
 * Risk Scoring Algorithms
 * Calculates clinical risk scores for various conditions and outcomes
 */

import type { StructuredPatientData } from "./patient-data-aggregator";
import type { NoteSummary } from "./note-processor";

export interface RiskScore {
  name: string;
  value: number;
  category: "low" | "moderate" | "high" | "very_high";
  interpretation: string;
  recommendations: string[];
}

export interface ASCVDRiskFactors {
  age: number;
  gender: "male" | "female";
  totalCholesterol?: number;
  hdlCholesterol?: number;
  systolicBP?: number;
  isDiabetic: boolean;
  isSmoker: boolean;
  isOnBPMedication: boolean;
}

/**
 * Calculates 10-year ASCVD (Atherosclerotic Cardiovascular Disease) risk
 * Based on ACC/AHA Pooled Cohort Equations
 * Simplified version - full implementation would use exact equations
 */
export function calculateASCVDRisk(factors: ASCVDRiskFactors): RiskScore {
  const { age, gender, totalCholesterol, hdlCholesterol, systolicBP, isDiabetic, isSmoker, isOnBPMedication } = factors;

  // Simplified risk calculation (actual ASCVD uses complex equations)
  // This is a placeholder - in production, use the full Pooled Cohort Equations
  let risk = 0;

  // Base risk by age
  if (age >= 40 && age < 50) risk += 2;
  else if (age >= 50 && age < 60) risk += 5;
  else if (age >= 60 && age < 70) risk += 10;
  else if (age >= 70) risk += 15;

  // Gender adjustment
  if (gender === "male") risk += 3;

  // Cholesterol factors
  if (totalCholesterol && hdlCholesterol) {
    const ratio = totalCholesterol / hdlCholesterol;
    if (ratio > 5) risk += 5;
    else if (ratio > 4) risk += 3;
  }

  // Blood pressure
  if (systolicBP) {
    if (systolicBP >= 160) risk += 8;
    else if (systolicBP >= 140) risk += 5;
    else if (systolicBP >= 130) risk += 2;
  }

  // Diabetes
  if (isDiabetic) risk += 6;

  // Smoking
  if (isSmoker) risk += 4;

  // Convert to percentage (simplified)
  const riskPercent = Math.min(risk * 1.2, 30); // Cap at 30% for simplification

  // Categorize risk
  let category: "low" | "moderate" | "high" | "very_high";
  let interpretation: string;
  const recommendations: string[] = [];

  if (riskPercent < 5) {
    category = "low";
    interpretation = "Low 10-year ASCVD risk (<5%)";
    recommendations.push("Continue healthy lifestyle");
  } else if (riskPercent < 7.5) {
    category = "moderate";
    interpretation = "Borderline 10-year ASCVD risk (5-7.5%)";
    recommendations.push("Consider lifestyle modifications");
    recommendations.push("Reassess risk in 5 years");
  } else if (riskPercent < 20) {
    category = "high";
    interpretation = "High 10-year ASCVD risk (7.5-20%)";
    recommendations.push("Consider moderate-intensity statin therapy");
    recommendations.push("Lifestyle modifications recommended");
  } else {
    category = "very_high";
    interpretation = "Very high 10-year ASCVD risk (≥20%)";
    recommendations.push("High-intensity statin therapy recommended");
    recommendations.push("Aggressive lifestyle modifications");
    recommendations.push("Consider additional risk-reducing medications");
  }

  return {
    name: "10-Year ASCVD Risk",
    value: Math.round(riskPercent * 10) / 10, // Round to 1 decimal
    category,
    interpretation,
    recommendations,
  };
}

/**
 * Calculates relapse risk for substance use disorder patients
 */
export function calculateRelapseRisk(
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): RiskScore {
  let riskScore = 0;
  const factors: string[] = [];

  // Positive UDS results
  const udsResults = data.labResults.filter(
    (lab) =>
      lab.test_name?.toLowerCase().includes("urine") ||
      lab.test_name?.toLowerCase().includes("uds") ||
      lab.test_name?.toLowerCase().includes("toxicology")
  );

  const positiveUDS = udsResults.filter(
    (lab) =>
      lab.result_value?.toLowerCase().includes("positive") ||
      lab.result_value?.toLowerCase().includes("detected")
  );

  if (positiveUDS.length > 0) {
    riskScore += 30;
    factors.push(`${positiveUDS.length} positive UDS result(s)`);
  }

  // Missing counseling sessions (inferred from encounter frequency)
  const recentEncounters = data.encounters.filter((enc) => {
    const encDate = new Date(enc.encounter_date);
    const daysAgo = (Date.now() - encDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  if (recentEncounters.length < 2) {
    riskScore += 15;
    factors.push("Low encounter frequency (potential non-adherence)");
  }

  // Assessment scores from notes
  if (noteSummary) {
    const cowsScore = noteSummary.assessmentScores.cows;
    if (cowsScore !== undefined && cowsScore >= 5) {
      riskScore += 20;
      factors.push(`Elevated COWS score: ${cowsScore}`);
    }

    const concerns = noteSummary.concerns.filter(
      (c) =>
        c.toLowerCase().includes("relapse") ||
        c.toLowerCase().includes("craving") ||
        c.toLowerCase().includes("use")
    );

    if (concerns.length > 0) {
      riskScore += 25;
      factors.push("Relapse concerns noted in clinical notes");
    }
  }

  // Medication non-adherence (inferred from gaps in medication history)
  const matMeds = data.medications.filter(
    (med) =>
      med.medication_name?.toLowerCase().includes("buprenorphine") ||
      med.medication_name?.toLowerCase().includes("methadone") ||
      med.medication_name?.toLowerCase().includes("naltrexone")
  );

  if (matMeds.length === 0) {
    riskScore += 10;
    factors.push("No MAT medication documented");
  }

  // Categorize risk
  let category: "low" | "moderate" | "high" | "very_high";
  let interpretation: string;
  const recommendations: string[] = [];

  if (riskScore < 20) {
    category = "low";
    interpretation = "Low relapse risk - patient appears stable";
    recommendations.push("Continue current treatment plan");
    recommendations.push("Maintain regular monitoring");
  } else if (riskScore < 40) {
    category = "moderate";
    interpretation = "Moderate relapse risk - increased monitoring recommended";
    recommendations.push("Increase counseling frequency");
    recommendations.push("Consider peer support services");
    recommendations.push("Review medication adherence");
  } else if (riskScore < 60) {
    category = "high";
    interpretation = "High relapse risk - intervention needed";
    recommendations.push("Intensify treatment (more frequent sessions)");
    recommendations.push("Consider medication adjustment");
    recommendations.push("Involve care team in risk management");
    recommendations.push("Consider higher level of care");
  } else {
    category = "very_high";
    interpretation = "Very high relapse risk - immediate intervention required";
    recommendations.push("Urgent care team meeting");
    recommendations.push("Consider crisis intervention");
    recommendations.push("Evaluate for higher level of care (IOP, residential)");
    recommendations.push("Increase support services");
  }

  return {
    name: "SUD Relapse Risk",
    value: riskScore,
    category,
    interpretation: `${interpretation}. Risk factors: ${factors.join("; ")}`,
    recommendations,
  };
}

/**
 * Calculates readmission risk for any patient
 */
export function calculateReadmissionRisk(
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): RiskScore {
  let riskScore = 0;
  const factors: string[] = [];

  // Multiple chronic conditions
  if (data.problems.length >= 3) {
    riskScore += 15;
    factors.push(`${data.problems.length} active diagnoses (poly-morbidity)`);
  }

  // Polypharmacy
  if (data.medications.length >= 5) {
    riskScore += 10;
    factors.push(`${data.medications.length} active medications (polypharmacy)`);
  }

  // Recent hospitalizations (inferred from encounters)
  const recentEncounters = data.encounters.filter((enc) => {
    const encDate = new Date(enc.encounter_date);
    const daysAgo = (Date.now() - encDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 90 && enc.encounter_type?.toLowerCase().includes("hospital");
  });

  if (recentEncounters.length > 0) {
    riskScore += 20;
    factors.push("Recent hospitalization(s)");
  }

  // Age factor
  if (data.demographics.age >= 65) {
    riskScore += 10;
    factors.push("Age ≥65 years");
  }

  // Concerns from notes
  if (noteSummary) {
    const concerns = noteSummary.concerns.filter(
      (c) =>
        c.toLowerCase().includes("decompensation") ||
        c.toLowerCase().includes("declining") ||
        c.toLowerCase().includes("worsening")
    );

    if (concerns.length > 0) {
      riskScore += 15;
      factors.push("Clinical deterioration noted");
    }
  }

  // Categorize risk
  let category: "low" | "moderate" | "high" | "very_high";
  let interpretation: string;
  const recommendations: string[] = [];

  if (riskScore < 20) {
    category = "low";
    interpretation = "Low readmission risk";
    recommendations.push("Continue standard follow-up care");
  } else if (riskScore < 40) {
    category = "moderate";
    interpretation = "Moderate readmission risk";
    recommendations.push("Enhanced care coordination");
    recommendations.push("Close follow-up within 7-14 days");
  } else if (riskScore < 60) {
    category = "high";
    interpretation = "High readmission risk";
    recommendations.push("Intensive care management");
    recommendations.push("Follow-up within 3-7 days");
    recommendations.push("Consider home health services");
  } else {
    category = "very_high";
    interpretation = "Very high readmission risk";
    recommendations.push("Immediate care coordination");
    recommendations.push("Follow-up within 24-48 hours");
    recommendations.push("Consider transitional care management");
    recommendations.push("Home health evaluation");
  }

  return {
    name: "30-Day Readmission Risk",
    value: riskScore,
    category,
    interpretation: `${interpretation}. Risk factors: ${factors.join("; ")}`,
    recommendations,
  };
}

/**
 * Calculates no-show risk for appointments
 */
export function calculateNoShowRisk(
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): RiskScore {
  let riskScore = 0;
  const factors: string[] = [];

  // History of missed appointments (inferred from encounter gaps)
  const encounters = data.encounters.sort(
    (a, b) =>
      new Date(b.encounter_date).getTime() - new Date(a.encounter_date).getTime()
  );

  if (encounters.length > 1) {
    const gaps = [];
    for (let i = 0; i < encounters.length - 1; i++) {
      const gap =
        (new Date(encounters[i].encounter_date).getTime() -
          new Date(encounters[i + 1].encounter_date).getTime()) /
        (1000 * 60 * 60 * 24);
      gaps.push(gap);
    }

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avgGap > 90) {
      riskScore += 20;
      factors.push("Long gaps between encounters");
    }
  }

  // Substance use concerns
  if (noteSummary) {
    const concerns = noteSummary.concerns.filter(
      (c) =>
        c.toLowerCase().includes("non-adherent") ||
        c.toLowerCase().includes("missed") ||
        c.toLowerCase().includes("no-show")
    );

    if (concerns.length > 0) {
      riskScore += 25;
      factors.push("History of missed appointments noted");
    }
  }

  // Social determinants (inferred from address/insurance - simplified)
  // In production, would check for transportation barriers, insurance status, etc.

  // Categorize risk
  let category: "low" | "moderate" | "high" | "very_high";
  let interpretation: string;
  const recommendations: string[] = [];

  if (riskScore < 15) {
    category = "low";
    interpretation = "Low no-show risk";
    recommendations.push("Standard appointment reminders");
  } else if (riskScore < 30) {
    category = "moderate";
    interpretation = "Moderate no-show risk";
    recommendations.push("Enhanced appointment reminders (call + text)");
    recommendations.push("Confirm appointment 24 hours prior");
  } else if (riskScore < 45) {
    category = "high";
    interpretation = "High no-show risk";
    recommendations.push("Multiple reminder contacts");
    recommendations.push("Consider same-day scheduling");
    recommendations.push("Address barriers to attendance");
  } else {
    category = "very_high";
    interpretation = "Very high no-show risk";
    recommendations.push("Intensive outreach (multiple contacts)");
    recommendations.push("Consider walk-in availability");
    recommendations.push("Address social determinants of health");
    recommendations.push("Care coordination to reduce barriers");
  }

  return {
    name: "No-Show Risk",
    value: riskScore,
    category,
    interpretation: `${interpretation}. Risk factors: ${factors.join("; ")}`,
    recommendations,
  };
}

/**
 * Calculates all relevant risk scores for a patient based on specialty
 */
export function calculateAllRiskScores(
  specialtyId: string,
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): RiskScore[] {
  const scores: RiskScore[] = [];

  // ASCVD risk for Primary Care and Cardiology
  if (specialtyId === "primary-care" || specialtyId === "cardiology") {
    const age = data.demographics.age;
    const gender = data.demographics.gender?.toLowerCase() || "male";
    const recentBP = data.vitalSigns[0]?.blood_pressure;
    const systolicBP = recentBP
      ? parseInt(recentBP.split("/")[0])
      : undefined;

    const recentLabs = data.labResults.filter(
      (lab) =>
        lab.test_name?.toLowerCase().includes("lipid") ||
        lab.test_name?.toLowerCase().includes("cholesterol")
    );

    const totalChol = recentLabs.find((lab) =>
      lab.test_name?.toLowerCase().includes("total")
    )?.result_value
      ? parseFloat(recentLabs.find((lab) => lab.test_name?.toLowerCase().includes("total"))!.result_value!)
      : undefined;

    const hdlChol = recentLabs.find((lab) =>
      lab.test_name?.toLowerCase().includes("hdl")
    )?.result_value
      ? parseFloat(recentLabs.find((lab) => lab.test_name?.toLowerCase().includes("hdl"))!.result_value!)
      : undefined;

    const isDiabetic = data.problems.some(
      (p) =>
        p.diagnosis?.toLowerCase().includes("diabetes") ||
        p.icd_code?.startsWith("E11")
    );

    // Simplified - would need actual smoking status from patient data
    const isSmoker = false; // Placeholder

    if (age >= 40) {
      scores.push(
        calculateASCVDRisk({
          age,
          gender: gender === "female" ? "female" : "male",
          totalCholesterol: totalChol,
          hdlCholesterol: hdlChol,
          systolicBP,
          isDiabetic,
          isSmoker,
          isOnBPMedication: data.medications.some(
            (med) =>
              med.medication_name?.toLowerCase().includes("lisinopril") ||
              med.medication_name?.toLowerCase().includes("amlodipine")
          ),
        })
      );
    }
  }

  // Relapse risk for Behavioral Health
  if (specialtyId === "behavioral-health") {
    scores.push(calculateRelapseRisk(data, noteSummary));
  }

  // Readmission risk (all specialties)
  scores.push(calculateReadmissionRisk(data, noteSummary));

  // No-show risk (all specialties)
  scores.push(calculateNoShowRisk(data, noteSummary));

  return scores;
}

/**
 * Formats risk scores for inclusion in AI prompt
 */
export function formatRiskScores(scores: RiskScore[]): string {
  if (scores.length === 0) {
    return "";
  }

  let formatted = "\n\nRISK SCORES:\n";
  scores.forEach((score) => {
    formatted += `${score.name}: ${score.value}% (${score.category.toUpperCase()})\n`;
    formatted += `Interpretation: ${score.interpretation}\n`;
    if (score.recommendations.length > 0) {
      formatted += `Recommendations: ${score.recommendations.join("; ")}\n`;
    }
    formatted += "\n";
  });

  return formatted;
}
