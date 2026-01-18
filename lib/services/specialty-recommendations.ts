/**
 * Specialty-Specific Recommendation Logic
 * Adds specialty-specific analysis and recommendations based on patient data
 */

import type { StructuredPatientData, UnstructuredPatientData } from "./patient-data-aggregator";
import type { NoteSummary } from "./note-processor";

export interface SpecialtyRecommendation {
  type: "alert" | "recommendation" | "gap" | "assessment";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  action?: string;
  data?: any;
}

/**
 * Generates specialty-specific recommendations based on patient data
 */
export function generateSpecialtyRecommendations(
  specialtyId: string,
  structuredData: StructuredPatientData,
  noteSummary?: NoteSummary
): SpecialtyRecommendation[] {
  const recommendations: SpecialtyRecommendation[] = [];

  switch (specialtyId) {
    case "behavioral-health":
      recommendations.push(
        ...generateBehavioralHealthRecommendations(structuredData, noteSummary)
      );
      break;
    case "primary-care":
      recommendations.push(
        ...generatePrimaryCareRecommendations(structuredData, noteSummary)
      );
      break;
    case "psychiatry":
      recommendations.push(
        ...generatePsychiatryRecommendations(structuredData, noteSummary)
      );
      break;
    case "physical-therapy":
    case "occupational-therapy":
    case "speech-therapy":
      recommendations.push(
        ...generateTherapyRecommendations(specialtyId, structuredData, noteSummary)
      );
      break;
    case "cardiology":
      recommendations.push(
        ...generateCardiologyRecommendations(structuredData, noteSummary)
      );
      break;
    case "pediatrics":
      recommendations.push(
        ...generatePediatricsRecommendations(structuredData, noteSummary)
      );
      break;
    case "obgyn":
      recommendations.push(
        ...generateOBGYNRecommendations(structuredData, noteSummary)
      );
      break;
  }

  return recommendations;
}

/**
 * Behavioral Health/SUD specific recommendations
 */
function generateBehavioralHealthRecommendations(
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): SpecialtyRecommendation[] {
  const recommendations: SpecialtyRecommendation[] = [];

  // Check for UDS patterns
  const udsResults = data.labResults.filter(
    (lab) =>
      lab.test_name?.toLowerCase().includes("urine") ||
      lab.test_name?.toLowerCase().includes("uds") ||
      lab.test_name?.toLowerCase().includes("toxicology")
  );

  if (udsResults.length > 0) {
    const recentUDS = udsResults[0];
    const cleanCount = udsResults.filter(
      (lab) =>
        lab.result_value?.toLowerCase().includes("negative") ||
        lab.result_value?.toLowerCase().includes("clean")
    ).length;

    if (cleanCount >= 3) {
      recommendations.push({
        type: "recommendation",
        priority: "medium",
        title: "OTP Phase Advancement Consideration",
        description: `Patient has ${cleanCount} consecutive clean UDS results. Consider advancing to next OTP phase per protocol.`,
        action: "Review OTP phase advancement criteria",
      });
    }

    if (
      recentUDS.result_value?.toLowerCase().includes("positive") ||
      recentUDS.result_value?.toLowerCase().includes("detected")
    ) {
      recommendations.push({
        type: "alert",
        priority: "high",
        title: "Positive UDS Result",
        description: `Recent UDS shows positive result: ${recentUDS.result_value}. Review with patient and consider treatment adjustments.`,
        action: "Schedule counseling session to discuss results",
      });
    }
  }

  // Check COWS/CIWA scores from notes
  if (noteSummary) {
    const cowsScore = noteSummary.assessmentScores.cows;
    if (cowsScore !== undefined) {
      if (cowsScore >= 5) {
        recommendations.push({
          type: "alert",
          priority: "high",
          title: "Elevated COWS Score",
          description: `COWS score of ${cowsScore} indicates moderate withdrawal. Monitor closely and consider medication adjustment.`,
          action: "Review withdrawal management protocol",
        });
      }
    }

    const ciwaScore = noteSummary.assessmentScores.ciwa;
    if (ciwaScore !== undefined && ciwaScore >= 10) {
      recommendations.push({
        type: "alert",
        priority: "critical",
        title: "High CIWA Score",
        description: `CIWA score of ${ciwaScore} indicates significant withdrawal risk. Consider medical intervention.`,
        action: "Immediate medical assessment recommended",
      });
    }
  }

  // Check for missing 42 CFR Part 2 documentation
  if (noteSummary?.missingDocumentation.includes("42 CFR Part 2 consent")) {
    recommendations.push({
      type: "gap",
      priority: "high",
      title: "Missing 42 CFR Part 2 Documentation",
      description: "42 CFR Part 2 consent documentation is required for SUD treatment.",
      action: "Complete 42 CFR Part 2 consent form",
    });
  }

  // Medication adherence check
  const matMeds = data.medications.filter(
    (med) =>
      med.medication_name?.toLowerCase().includes("buprenorphine") ||
      med.medication_name?.toLowerCase().includes("methadone") ||
      med.medication_name?.toLowerCase().includes("naltrexone")
  );

  if (matMeds.length > 0) {
    recommendations.push({
      type: "recommendation",
      priority: "medium",
      title: "MAT Medication Review",
      description: `Patient on ${matMeds[0].medication_name}. Ensure proper dosing and monitor for side effects.`,
      action: "Review medication effectiveness and adherence",
    });
  }

  return recommendations;
}

/**
 * Primary Care specific recommendations
 */
function generatePrimaryCareRecommendations(
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): SpecialtyRecommendation[] {
  const recommendations: SpecialtyRecommendation[] = [];
  const age = data.demographics.age;

  // Chronic disease management
  const diabetes = data.problems.find(
    (p) =>
      p.diagnosis?.toLowerCase().includes("diabetes") ||
      p.icd_code?.startsWith("E11")
  );

  if (diabetes) {
    const recentA1c = data.labResults.find(
      (lab) =>
        lab.test_name?.toLowerCase().includes("a1c") ||
        lab.test_name?.toLowerCase().includes("hba1c")
    );

    if (!recentA1c || isOlderThanMonths(recentA1c.result_date, 3)) {
      recommendations.push({
        type: "gap",
        priority: "medium",
        title: "HbA1c Monitoring Due",
        description: "HbA1c should be checked every 3 months for diabetes management.",
        action: "Order HbA1c lab test",
      });
    }

    // Check for diabetic foot exam
    if (age >= 18) {
      recommendations.push({
        type: "gap",
        priority: "medium",
        title: "Diabetic Foot Exam",
        description: "Annual diabetic foot exam recommended for all diabetic patients.",
        action: "Perform comprehensive foot exam",
      });
    }
  }

  // Hypertension management
  const hypertension = data.problems.find(
    (p) =>
      p.diagnosis?.toLowerCase().includes("hypertension") ||
      p.icd_code?.startsWith("I10")
  );

  if (hypertension && data.vitalSigns.length > 0) {
    const recentBP = data.vitalSigns[0].blood_pressure;
    if (recentBP) {
      const [systolic, diastolic] = recentBP.split("/").map(Number);
      if (systolic >= 140 || diastolic >= 90) {
        recommendations.push({
          type: "alert",
          priority: "high",
          title: "Elevated Blood Pressure",
          description: `Current BP ${recentBP} is above target. Consider medication adjustment or lifestyle counseling.`,
          action: "Review antihypertensive medication regimen",
        });
      }
    }
  }

  // Preventive care gaps
  if (age >= 50 && age < 75) {
    recommendations.push({
      type: "gap",
      priority: "medium",
      title: "Colorectal Cancer Screening",
      description: "USPSTF recommends colorectal cancer screening for adults 50-75.",
      action: "Order colonoscopy or stool-based test",
    });
  }

  if (age >= 40) {
    recommendations.push({
      type: "gap",
      priority: "low",
      title: "Cardiovascular Risk Assessment",
      description: "Consider ASCVD risk calculation for statin therapy decision.",
      action: "Calculate 10-year ASCVD risk",
    });
  }

  return recommendations;
}

/**
 * Psychiatry specific recommendations
 */
function generatePsychiatryRecommendations(
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): SpecialtyRecommendation[] {
  const recommendations: SpecialtyRecommendation[] = [];

  // PHQ-9 trend analysis
  if (noteSummary) {
    const phq9Score = noteSummary.assessmentScores.phq9;
    if (phq9Score !== undefined) {
      if (phq9Score >= 20) {
        recommendations.push({
          type: "alert",
          priority: "critical",
          title: "Severe Depression (PHQ-9 ≥20)",
          description: `PHQ-9 score of ${phq9Score} indicates severe depression. Consider intensive treatment or referral.`,
          action: "Review treatment plan and consider augmentation",
        });
      } else if (phq9Score >= 15) {
        recommendations.push({
          type: "alert",
          priority: "high",
          title: "Moderately Severe Depression (PHQ-9 15-19)",
          description: `PHQ-9 score of ${phq9Score} indicates moderately severe depression.`,
          action: "Consider medication adjustment or therapy intensification",
        });
      }
    }

    const gad7Score = noteSummary.assessmentScores.gad7;
    if (gad7Score !== undefined && gad7Score >= 15) {
      recommendations.push({
        type: "alert",
        priority: "high",
        title: "Severe Anxiety (GAD-7 ≥15)",
        description: `GAD-7 score of ${gad7Score} indicates severe anxiety.`,
        action: "Review anxiety treatment and consider adjustments",
      });
    }

    // Suicide risk assessment check
    if (noteSummary.missingDocumentation.includes("Suicide risk assessment")) {
      recommendations.push({
        type: "gap",
        priority: "critical",
        title: "Missing Suicide Risk Assessment",
        description: "Suicide risk assessment should be documented for all psychiatric patients.",
        action: "Complete suicide risk assessment (C-SSRS)",
      });
    }
  }

  // Medication side effect monitoring
  const psychMeds = data.medications.filter(
    (med) =>
      med.medication_name?.toLowerCase().includes("ssri") ||
      med.medication_name?.toLowerCase().includes("sertraline") ||
      med.medication_name?.toLowerCase().includes("fluoxetine") ||
      med.medication_name?.toLowerCase().includes("citalopram") ||
      med.medication_name?.toLowerCase().includes("escitalopram")
  );

  if (psychMeds.length > 0) {
    recommendations.push({
      type: "recommendation",
      priority: "medium",
      title: "SSRI Monitoring",
      description: "Monitor for SSRI side effects (GI upset, sexual dysfunction, activation).",
      action: "Assess medication tolerability and side effects",
    });
  }

  return recommendations;
}

/**
 * Therapy/Rehab specific recommendations
 */
function generateTherapyRecommendations(
  specialtyId: string,
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): SpecialtyRecommendation[] {
  const recommendations: SpecialtyRecommendation[] = [];

  // Check for progress notes indicating plateau
  if (noteSummary) {
    const concerns = noteSummary.concerns.filter(
      (c) =>
        c.toLowerCase().includes("plateau") ||
        c.toLowerCase().includes("no progress") ||
        c.toLowerCase().includes("declining")
    );

    if (concerns.length > 0) {
      recommendations.push({
        type: "alert",
        priority: "medium",
        title: "Progress Plateau Detected",
        description: "Notes indicate patient may be plateauing in therapy progress.",
        action: "Consider re-evaluation or treatment plan modification",
      });
    }
  }

  // Re-evaluation timing
  const recentPlan = data.treatmentPlans[0];
  if (recentPlan) {
    const planDate = new Date(recentPlan.created_at);
    const daysSincePlan = Math.floor(
      (Date.now() - planDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePlan >= 30) {
      recommendations.push({
        type: "gap",
        priority: "medium",
        title: "Re-evaluation Due",
        description: `Treatment plan is ${daysSincePlan} days old. Re-evaluation recommended per Medicare guidelines.`,
        action: "Schedule re-evaluation assessment",
      });
    }
  }

  return recommendations;
}

/**
 * Cardiology specific recommendations
 */
function generateCardiologyRecommendations(
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): SpecialtyRecommendation[] {
  const recommendations: SpecialtyRecommendation[] = [];

  // Check for heart failure
  const hf = data.problems.find(
    (p) =>
      p.diagnosis?.toLowerCase().includes("heart failure") ||
      p.icd_code?.startsWith("I50")
  );

  if (hf) {
    // Check for echo timing
    const lastEcho = data.labResults.find(
      (lab) =>
        lab.test_name?.toLowerCase().includes("echo") ||
        lab.test_name?.toLowerCase().includes("echocardiogram")
    );

    if (!lastEcho || isOlderThanMonths(lastEcho.result_date, 12)) {
      recommendations.push({
        type: "gap",
        priority: "medium",
        title: "Echocardiogram Due",
        description: "Annual echocardiogram recommended for heart failure patients.",
        action: "Order echocardiogram",
      });
    }

    // Check for guideline-directed medical therapy
    const hasACE = data.medications.some(
      (med) =>
        med.medication_name?.toLowerCase().includes("lisinopril") ||
        med.medication_name?.toLowerCase().includes("enalapril") ||
        med.medication_name?.toLowerCase().includes("ace")
    );

    const hasBetaBlocker = data.medications.some(
      (med) =>
        med.medication_name?.toLowerCase().includes("metoprolol") ||
        med.medication_name?.toLowerCase().includes("carvedilol") ||
        med.medication_name?.toLowerCase().includes("beta")
    );

    if (!hasACE || !hasBetaBlocker) {
      recommendations.push({
        type: "recommendation",
        priority: "high",
        title: "Guideline-Directed Medical Therapy",
        description: "Ensure patient is on ACE/ARB and beta-blocker per HF guidelines.",
        action: "Review and optimize HF medication regimen",
      });
    }
  }

  return recommendations;
}

/**
 * Pediatrics specific recommendations
 */
function generatePediatricsRecommendations(
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): SpecialtyRecommendation[] {
  const recommendations: SpecialtyRecommendation[] = [];
  const age = data.demographics.age;

  // Immunization reminders
  if (age < 18) {
    recommendations.push({
      type: "gap",
      priority: "medium",
      title: "Immunization Status Review",
      description: "Verify patient is up to date with age-appropriate immunizations.",
      action: "Review immunization records and schedule catch-up if needed",
    });
  }

  // Developmental screening
  if (age >= 18 && age <= 30) {
    recommendations.push({
      type: "gap",
      priority: "low",
      title: "Developmental Screening",
      description: "Consider developmental screening for age-appropriate milestones.",
      action: "Perform developmental assessment",
    });
  }

  return recommendations;
}

/**
 * OB/GYN specific recommendations
 */
function generateOBGYNRecommendations(
  data: StructuredPatientData,
  noteSummary?: NoteSummary
): SpecialtyRecommendation[] {
  const recommendations: SpecialtyRecommendation[] = [];

  // Pap smear screening
  recommendations.push({
    type: "gap",
    priority: "medium",
    title: "Cervical Cancer Screening",
    description: "Ensure patient is up to date with Pap smear per guidelines.",
    action: "Schedule Pap smear if due",
  });

  // Mammography
  const age = data.demographics.age;
  if (age >= 40) {
    recommendations.push({
      type: "gap",
      priority: "medium",
      title: "Mammography Screening",
      description: "Annual mammography recommended for women 40+.",
      action: "Order mammography if due",
    });
  }

  return recommendations;
}

/**
 * Helper function to check if a date is older than N months
 */
function isOlderThanMonths(dateString: string, months: number): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const monthsDiff =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth());
  return monthsDiff >= months;
}

/**
 * Formats specialty recommendations for inclusion in AI prompt
 */
export function formatSpecialtyRecommendations(
  recommendations: SpecialtyRecommendation[]
): string {
  if (recommendations.length === 0) {
    return "";
  }

  let formatted = "\n\nSPECIALTY-SPECIFIC RECOMMENDATIONS:\n";
  recommendations.forEach((rec, idx) => {
    formatted += `${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.title}\n`;
    formatted += `   ${rec.description}\n`;
    if (rec.action) {
      formatted += `   Action: ${rec.action}\n`;
    }
    formatted += "\n";
  });

  return formatted;
}
