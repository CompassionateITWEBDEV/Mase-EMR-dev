/**
 * Specialty-Specific Prompt Templates
 * Customizes AI assistant prompts for each of the 13 specialties
 */

import type { PromptContext } from "./base-prompt";
import { getBaseSystemPrompt, getBaseUserPrompt } from "./base-prompt";

export interface SpecialtyPromptConfig {
  specialtyId: string;
  specialtyName: string;
  clinicalFocus: string[];
  assessmentTools: string[];
  riskFactors: string[];
  treatmentConsiderations: string[];
}

/**
 * Specialty configurations for all 13 specialties
 */
const specialtyConfigs: Record<string, SpecialtyPromptConfig> = {
  "behavioral-health": {
    specialtyId: "behavioral-health",
    specialtyName: "Behavioral Health / Substance Use Disorder (OTP/MAT)",
    clinicalFocus: [
      "Substance use disorder treatment",
      "Opioid treatment programs (OTP)",
      "Medication-assisted treatment (MAT)",
      "Counseling and therapy",
      "Relapse prevention",
      "42 CFR Part 2 compliance",
    ],
    assessmentTools: [
      "COWS (Clinical Opiate Withdrawal Scale)",
      "CIWA (Clinical Institute Withdrawal Assessment)",
      "PHQ-9 (Depression screening)",
      "GAD-7 (Anxiety screening)",
      "Urine drug screens (UDS)",
      "Treatment plan compliance",
    ],
    riskFactors: [
      "Relapse risk indicators",
      "Withdrawal symptoms",
      "Medication non-adherence",
      "Missing counseling sessions",
      "Positive UDS results",
      "Concurrent substance use",
      "Mental health comorbidities",
    ],
    treatmentConsiderations: [
      "OTP phase advancement eligibility",
      "Take-home dose protocols",
      "Counseling frequency adjustments",
      "Medication dose adjustments",
      "Support group referrals",
      "Peer support services",
      "Crisis intervention needs",
    ],
  },
  "primary-care": {
    specialtyId: "primary-care",
    specialtyName: "Primary Care / Family Medicine",
    clinicalFocus: [
      "Preventive care and wellness",
      "Chronic disease management",
      "Acute care management",
      "Health maintenance",
      "Disease prevention",
    ],
    assessmentTools: [
      "Vital signs trending",
      "Lab result monitoring",
      "Preventive care screening",
      "Risk calculators (ASCVD, etc.)",
    ],
    riskFactors: [
      "Cardiovascular risk factors",
      "Diabetes complications",
      "Hypertension control",
      "Medication adherence",
      "Preventive care gaps",
    ],
    treatmentConsiderations: [
      "Chronic disease management goals",
      "Preventive care scheduling",
      "Medication optimization",
      "Lifestyle counseling",
      "Specialist referrals",
    ],
  },
  "psychiatry": {
    specialtyId: "psychiatry",
    specialtyName: "Psychiatry / Mental Health",
    clinicalFocus: [
      "Psychiatric evaluation and treatment",
      "Medication management",
      "Therapy coordination",
      "Crisis intervention",
      "Suicide risk assessment",
    ],
    assessmentTools: [
      "PHQ-9 (Depression)",
      "GAD-7 (Anxiety)",
      "PCL-5 (PTSD)",
      "C-SSRS (Suicide risk)",
      "Mood tracking",
    ],
    riskFactors: [
      "Suicidal ideation",
      "Treatment-resistant depression",
      "Medication side effects",
      "Non-adherence",
      "Psychotic symptoms",
      "Mood instability",
    ],
    treatmentConsiderations: [
      "Medication adjustments",
      "Therapy modality changes",
      "Augmentation strategies",
      "Safety planning",
      "Hospitalization needs",
    ],
  },
  "obgyn": {
    specialtyId: "obgyn",
    specialtyName: "OB/GYN (Women's Health)",
    clinicalFocus: [
      "Prenatal care",
      "Postpartum care",
      "Gynecological health",
      "Reproductive health",
      "Menopause management",
    ],
    assessmentTools: [
      "Prenatal screening",
      "Pap smears",
      "Mammography",
      "Bone density screening",
    ],
    riskFactors: [
      "Pregnancy complications",
      "Postpartum depression",
      "Cervical cancer risk",
      "Osteoporosis risk",
    ],
    treatmentConsiderations: [
      "Prenatal care schedule",
      "Postpartum follow-up",
      "Contraception counseling",
      "Cancer screening",
    ],
  },
  "cardiology": {
    specialtyId: "cardiology",
    specialtyName: "Cardiology",
    clinicalFocus: [
      "Cardiovascular disease management",
      "Heart failure management",
      "Arrhythmia management",
      "Preventive cardiology",
    ],
    assessmentTools: [
      "EKG interpretation",
      "Echocardiogram",
      "Stress testing",
      "Cardiac biomarkers",
    ],
    riskFactors: [
      "ASCVD risk",
      "Heart failure exacerbation",
      "Arrhythmia risk",
      "Medication interactions",
    ],
    treatmentConsiderations: [
      "Guideline-directed medical therapy",
      "Echo timing",
      "Medication optimization",
      "Lifestyle modifications",
    ],
  },
  "dermatology": {
    specialtyId: "dermatology",
    specialtyName: "Dermatology",
    clinicalFocus: [
      "Skin cancer screening",
      "Acne management",
      "Eczema/psoriasis",
      "Lesion evaluation",
    ],
    assessmentTools: [
      "Dermoscopy",
      "Skin exams",
      "Biopsy results",
    ],
    riskFactors: [
      "Skin cancer risk",
      "Changing moles",
      "Family history",
      "Sun exposure",
    ],
    treatmentConsiderations: [
      "Screening schedules",
      "Biopsy recommendations",
      "Treatment adjustments",
    ],
  },
  "urgent-care": {
    specialtyId: "urgent-care",
    specialtyName: "Urgent Care",
    clinicalFocus: [
      "Acute care management",
      "Triage",
      "Minor procedures",
      "Emergency stabilization",
    ],
    assessmentTools: [
      "Vital signs",
      "Point-of-care testing",
      "Clinical decision rules",
    ],
    riskFactors: [
      "Red flag symptoms",
      "Decompensation risk",
      "Infection severity",
    ],
    treatmentConsiderations: [
      "Triage decisions",
      "Discharge vs. transfer",
      "Follow-up needs",
    ],
  },
  "pediatrics": {
    specialtyId: "pediatrics",
    specialtyName: "Pediatrics",
    clinicalFocus: [
      "Child and adolescent health",
      "Developmental milestones",
      "Immunizations",
      "Growth monitoring",
    ],
    assessmentTools: [
      "Growth charts",
      "Developmental screening",
      "Immunization schedules",
    ],
    riskFactors: [
      "Growth concerns",
      "Developmental delays",
      "Immunization gaps",
    ],
    treatmentConsiderations: [
      "Age-appropriate care",
      "Immunization catch-up",
      "Developmental referrals",
    ],
  },
  "podiatry": {
    specialtyId: "podiatry",
    specialtyName: "Podiatry",
    clinicalFocus: [
      "Foot and ankle care",
      "Diabetic foot care",
      "Wound management",
    ],
    assessmentTools: [
      "Foot exams",
      "Wound assessment",
      "Vascular assessment",
    ],
    riskFactors: [
      "Diabetic foot ulcers",
      "Infection risk",
      "Amputation risk",
    ],
    treatmentConsiderations: [
      "Foot exam frequency",
      "Wound care protocols",
      "Referral needs",
    ],
  },
  "physical-therapy": {
    specialtyId: "physical-therapy",
    specialtyName: "Physical Therapy",
    clinicalFocus: [
      "Orthopedic rehabilitation",
      "Sports medicine",
      "Functional improvement",
    ],
    assessmentTools: [
      "Range of motion",
      "Strength testing",
      "Functional assessments",
    ],
    riskFactors: [
      "Plateau in progress",
      "Re-injury risk",
      "Discharge readiness",
    ],
    treatmentConsiderations: [
      "Exercise modifications",
      "Re-evaluation timing",
      "Discharge planning",
    ],
  },
  "occupational-therapy": {
    specialtyId: "occupational-therapy",
    specialtyName: "Occupational Therapy",
    clinicalFocus: [
      "ADL training",
      "Hand therapy",
      "Cognitive rehabilitation",
    ],
    assessmentTools: [
      "ADL assessments",
      "Cognitive testing",
      "Functional evaluations",
    ],
    riskFactors: [
      "Safety concerns",
      "Progress plateau",
      "Discharge readiness",
    ],
    treatmentConsiderations: [
      "Home safety assessments",
      "Adaptive equipment",
      "Treatment modifications",
    ],
  },
  "speech-therapy": {
    specialtyId: "speech-therapy",
    specialtyName: "Speech Therapy",
    clinicalFocus: [
      "Speech-language pathology",
      "Swallowing disorders",
      "Communication therapy",
    ],
    assessmentTools: [
      "Swallowing assessments",
      "Language testing",
      "Communication evaluations",
    ],
    riskFactors: [
      "Aspiration risk",
      "Communication barriers",
      "Progress concerns",
    ],
    treatmentConsiderations: [
      "Alternative communication",
      "Diet modifications",
      "Treatment adjustments",
    ],
  },
  "chiropractic": {
    specialtyId: "chiropractic",
    specialtyName: "Chiropractic",
    clinicalFocus: [
      "Musculoskeletal care",
      "Spinal health",
      "Pain management",
    ],
    assessmentTools: [
      "Spinal exams",
      "Range of motion",
      "Pain scales",
    ],
    riskFactors: [
      "Red flag symptoms",
      "Contraindications",
      "Treatment response",
    ],
    treatmentConsiderations: [
      "Adjustment frequency",
      "Contraindication checks",
      "Referral needs",
    ],
  },
};

/**
 * Generates specialty-specific system prompt
 */
export function generateSpecialtySystemPrompt(
  context: PromptContext
): string {
  const config = specialtyConfigs[context.specialtyId];
  if (!config) {
    // Fallback to base prompt if specialty not found
    return getBaseSystemPrompt(context);
  }

  const basePrompt = getBaseSystemPrompt(context);

  const specialtySection = `
SPECIALTY-SPECIFIC CONTEXT:
Specialty: ${config.specialtyName}

Clinical Focus Areas:
${config.clinicalFocus.map((f) => `- ${f}`).join("\n")}

Assessment Tools to Consider:
${config.assessmentTools.map((t) => `- ${t}`).join("\n")}

Key Risk Factors to Monitor:
${config.riskFactors.map((r) => `- ${r}`).join("\n")}

Treatment Planning Considerations:
${config.treatmentConsiderations.map((t) => `- ${t}`).join("\n")}

When analyzing this patient, pay special attention to:
1. Specialty-specific clinical guidelines and best practices
2. Relevant assessment tools and their results
3. Risk factors specific to ${config.specialtyName}
4. Treatment considerations unique to this specialty
5. Interdisciplinary care coordination needs
`;

  return basePrompt + "\n" + specialtySection;
}

/**
 * Generates specialty-specific user prompt
 */
export function generateSpecialtyUserPrompt(
  context: PromptContext
): string {
  const config = specialtyConfigs[context.specialtyId];
  const basePrompt = getBaseUserPrompt(context);

  if (!config) {
    return basePrompt;
  }

  const specialtyInstructions = `

SPECIALTY-SPECIFIC ANALYSIS REQUIRED:
Please provide recommendations that are specifically tailored to ${config.specialtyName} practice. Consider:

1. ${config.specialtyName}-specific clinical guidelines
2. Relevant assessment tools (${config.assessmentTools.join(", ")})
3. Specialty-specific risk factors and safety concerns
4. Treatment planning considerations unique to this specialty
5. Interdisciplinary coordination needs

For example:
${getSpecialtyExamples(context.specialtyId)}
`;

  return basePrompt + specialtyInstructions;
}

/**
 * Gets specialty-specific examples for prompts
 */
function getSpecialtyExamples(specialtyId: string): string {
  const examples: Record<string, string> = {
    "behavioral-health": `- Analyze UDS patterns for relapse indicators
- Check COWS/CIWA scores for withdrawal management
- Recommend OTP phase advancement based on compliance
- Flag missing 42 CFR Part 2 documentation
- Suggest counseling frequency adjustments based on progress`,
    "primary-care": `- Identify preventive care gaps (mammography, colonoscopy, etc.)
- Calculate ASCVD risk and recommend statin therapy if indicated
- Monitor chronic disease management (diabetes, hypertension)
- Suggest medication optimization for polypharmacy
- Recommend age/gender-appropriate screenings`,
    "psychiatry": `- Analyze PHQ-9/GAD-7 trends for treatment response
- Flag missing suicide risk assessments in high-risk cases
- Recommend medication adjustments for treatment-resistant depression
- Suggest therapy modality changes based on progress
- Identify medication side effects requiring attention`,
    "physical-therapy": `- Assess progress toward therapy goals
- Recommend re-evaluation if progress plateaus
- Suggest exercise modifications
- Evaluate discharge readiness
- Identify barriers to progress`,
  };

  return examples[specialtyId] || "Provide evidence-based recommendations specific to this specialty.";
}

/**
 * Generates complete prompt for a specialty
 */
export function generateSpecialtyPrompt(context: PromptContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: generateSpecialtySystemPrompt(context),
    userPrompt: generateSpecialtyUserPrompt(context),
  };
}

/**
 * Gets all available specialty IDs
 */
export function getAvailableSpecialties(): string[] {
  return Object.keys(specialtyConfigs);
}

/**
 * Gets specialty configuration
 */
export function getSpecialtyConfig(specialtyId: string): SpecialtyPromptConfig | null {
  return specialtyConfigs[specialtyId] || null;
}
