/**
 * ASAM Level of Care Scoring Service
 * 
 * Implements decision support logic for suggesting appropriate ASAM levels
 * based on the 6-dimension assessment ratings.
 */

import type { ASAMDimensions, ASAMLevel } from "@/types/clinical"

export interface ASAMSuggestionResult {
  suggestedLevel: ASAMLevel
  explanation: string
  confidence: "high" | "medium" | "low"
  factors: string[]
}

/**
 * Suggests an appropriate ASAM level of care based on dimension ratings.
 * 
 * @param dimensions - The 6 ASAM dimension ratings
 * @returns Suggested level with explanation
 */
export function suggestASAMLevel(dimensions: ASAMDimensions): ASAMSuggestionResult | null {
  const { dimension1, dimension2, dimension3, dimension4, dimension5, dimension6 } = dimensions

  // Need all numeric dimensions to calculate
  if (
    dimension1 === null ||
    dimension2 === null ||
    dimension3 === null ||
    dimension5 === null ||
    dimension6 === null
  ) {
    return null
  }

  const factors: string[] = []
  let suggestedLevel: ASAMLevel
  let explanation: string
  let confidence: "high" | "medium" | "low" = "medium"

  // Check for severe withdrawal risk (D1 = 3)
  if (dimension1 === 3) {
    factors.push("Severe withdrawal risk requiring medical supervision")
    
    // If also severe medical issues, suggest highest level
    if (dimension2 === 3) {
      suggestedLevel = "4.0"
      explanation = "Severe withdrawal risk combined with acute medical conditions requires medically managed intensive inpatient care."
      confidence = "high"
    } else {
      suggestedLevel = "3.7"
      explanation = "Severe withdrawal risk requires medically monitored intensive inpatient care for safe detoxification."
      confidence = "high"
    }
    
    return { suggestedLevel, explanation, confidence, factors }
  }

  // Check for severe medical conditions (D2 = 3)
  if (dimension2 === 3) {
    factors.push("Severe biomedical conditions requiring intensive management")
    suggestedLevel = "3.7"
    explanation = "Acute or unstable medical conditions require medically monitored inpatient care."
    confidence = "high"
    return { suggestedLevel, explanation, confidence, factors }
  }

  // Check for severe psychiatric conditions (D3 = 3)
  if (dimension3 === 3) {
    factors.push("Severe psychiatric symptoms requiring intensive intervention")
    
    // Consider D1 and D2 for level determination
    if (dimension1 >= 2 || dimension2 >= 2) {
      suggestedLevel = "3.7"
      explanation = "Severe psychiatric symptoms with medical/withdrawal concerns require medically monitored inpatient care."
    } else {
      suggestedLevel = "3.5"
      explanation = "Severe psychiatric symptoms require high-intensity residential treatment with psychiatric support."
    }
    confidence = "high"
    return { suggestedLevel, explanation, confidence, factors }
  }

  // Check for high relapse potential (D5 = 3)
  if (dimension5 === 3) {
    factors.push("High relapse potential without intensive support")
    
    if (dimension1 >= 2 || dimension2 >= 2) {
      suggestedLevel = "3.1"
      explanation = "High relapse risk with moderate medical/withdrawal needs suggests residential treatment."
      confidence = "high"
    } else if (dimension6 >= 2) {
      suggestedLevel = "3.1"
      explanation = "High relapse risk combined with unsupportive environment suggests residential treatment."
      confidence = "high"
    } else {
      suggestedLevel = "2.5"
      explanation = "High relapse risk may benefit from partial hospitalization for intensive daily support."
      confidence = "medium"
    }
    return { suggestedLevel, explanation, confidence, factors }
  }

  // Check for dangerous living environment (D6 = 3)
  if (dimension6 === 3) {
    factors.push("Dangerous or hostile living environment")
    suggestedLevel = "3.1"
    explanation = "Unsafe living environment requires residential treatment for safe recovery setting."
    confidence = "high"
    return { suggestedLevel, explanation, confidence, factors }
  }

  // Count moderate severity dimensions
  const moderateDimensions = [dimension1, dimension2, dimension3, dimension5, dimension6].filter(
    (d) => d === 2
  )
  const moderateCount = moderateDimensions.length

  // Multiple moderate dimensions
  if (moderateCount >= 3) {
    factors.push(`${moderateCount} dimensions at moderate severity`)
    suggestedLevel = "2.5"
    explanation = "Multiple moderate-severity dimensions suggest partial hospitalization for comprehensive daily treatment."
    confidence = "medium"
    return { suggestedLevel, explanation, confidence, factors }
  }

  // Two moderate dimensions or high relapse risk
  if (moderateCount >= 2 || dimension5 === 2) {
    if (dimension5 === 2) factors.push("Moderate relapse potential")
    if (moderateCount >= 2) factors.push(`${moderateCount} dimensions at moderate severity`)
    
    suggestedLevel = "2.1"
    explanation = "Moderate severity across multiple dimensions suggests intensive outpatient treatment."
    confidence = "medium"
    return { suggestedLevel, explanation, confidence, factors }
  }

  // Check readiness to change
  const lowReadiness = dimension4 === "precontemplation" || dimension4 === "contemplation"
  if (lowReadiness && moderateCount >= 1) {
    factors.push("Low readiness to change with some moderate concerns")
    suggestedLevel = "2.1"
    explanation = "Low motivation combined with moderate concerns suggests intensive outpatient with motivational enhancement."
    confidence = "medium"
    return { suggestedLevel, explanation, confidence, factors }
  }

  // All low severity
  const allLow = [dimension1, dimension2, dimension3, dimension5, dimension6].every(
    (d) => d <= 1
  )

  if (allLow) {
    factors.push("All dimensions at minimal or no severity")
    
    // Check if any dimension is 1 (minimal)
    const hasMinimal = [dimension1, dimension2, dimension3, dimension5, dimension6].some(
      (d) => d === 1
    )
    
    if (hasMinimal) {
      suggestedLevel = "1.0"
      explanation = "Low severity across all dimensions suggests standard outpatient services are appropriate."
      confidence = "high"
    } else {
      suggestedLevel = "0.5"
      explanation = "No significant issues identified; early intervention services may be sufficient."
      confidence = "high"
    }
    return { suggestedLevel, explanation, confidence, factors }
  }

  // Default to IOP for mixed presentations
  factors.push("Mixed severity presentation")
  suggestedLevel = "2.1"
  explanation = "Mixed severity pattern suggests intensive outpatient treatment for structured support."
  confidence = "low"
  return { suggestedLevel, explanation, confidence, factors }
}

/**
 * Get a human-readable description of an ASAM level
 */
export function getASAMLevelDescription(level: ASAMLevel): string {
  const descriptions: Record<ASAMLevel, string> = {
    "0.5": "Early Intervention - Prevention and education services",
    "1.0": "Outpatient Services - Less than 9 hours/week, OTP/MAT eligible",
    "2.1": "Intensive Outpatient (IOP) - 9+ hours/week structured programming",
    "2.5": "Partial Hospitalization (PHP) - 20+ hours/week, day treatment",
    "3.1": "Clinically Managed Low-Intensity Residential - 24-hour structure, low intensity",
    "3.3": "Clinically Managed Population-Specific High-Intensity Residential - Specialized populations",
    "3.5": "Clinically Managed High-Intensity Residential - 24-hour care, high intensity",
    "3.7": "Medically Monitored Intensive Inpatient - 24-hour nursing, physician available",
    "4.0": "Medically Managed Intensive Inpatient - 24-hour medical/nursing care, daily physician",
  }
  return descriptions[level] || level
}

/**
 * Get the program badge/recommendation for an ASAM level
 */
export function getASAMLevelBadge(level: ASAMLevel): string | null {
  const badges: Partial<Record<ASAMLevel, string>> = {
    "0.5": "Early Intervention",
    "1.0": "OTP MAT Program Eligible",
    "2.1": "IOP + MAT Recommended",
    "2.5": "Partial Hospitalization Program",
    "3.1": "Residential Treatment",
    "3.3": "Residential Treatment",
    "3.5": "Residential Treatment",
    "3.7": "Inpatient/Detox Referral Recommended",
    "4.0": "Inpatient/Detox Referral Recommended",
  }
  return badges[level] || null
}

/**
 * Determine if a level requires referral to a higher level of care
 */
export function requiresReferral(level: ASAMLevel): boolean {
  const referralLevels: ASAMLevel[] = ["3.7", "4.0"]
  return referralLevels.includes(level)
}

/**
 * Get severity category based on numeric dimension value
 */
export function getDimensionSeverity(value: number): "none" | "minimal" | "moderate" | "severe" {
  if (value === 0) return "none"
  if (value === 1) return "minimal"
  if (value === 2) return "moderate"
  return "severe"
}
