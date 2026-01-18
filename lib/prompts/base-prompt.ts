/**
 * Base Prompt Template for AI Clinical Assistant
 * Provides the foundation for all specialty-specific prompts
 * 
 * Enhanced in Phase 2 with:
 * - Rationale/evidence requirements for recommendations
 * - Citation/reference support
 * - Confidence level indicators
 * - Expandable explanation structure
 */

export interface PromptContext {
  patientData: string;
  specialtyId: string;
  specialtyName: string;
  userRole?: string;
  encounterType?: string;
  chiefComplaint?: string;
  roleContext?: {
    role: string;
    focusAreas?: string[];
  };
  includeRationale?: boolean;
  verbosityLevel?: "concise" | "standard" | "detailed";
}

/**
 * Base system prompt for AI clinical assistant
 * Enhanced with rationale and evidence requirements
 */
export function getBaseSystemPrompt(context: PromptContext): string {
  const includeRationale = context.includeRationale !== false;
  const verbosity = context.verbosityLevel || "standard";

  const rationaleInstructions = includeRationale
    ? `
RATIONALE REQUIREMENTS:
- For each recommendation, include a brief rationale explaining WHY it is suggested
- Reference relevant clinical guidelines when applicable (e.g., "Per ADA guidelines...", "USPSTF recommends...")
- Include confidence level (high/medium/low) based on evidence strength
- Note any patient-specific factors that influenced the recommendation
- For medication recommendations, explain the mechanism or indication`
    : "";

  const verbosityInstructions = {
    concise: "Keep explanations brief and actionable. Focus on key points only.",
    standard: "Provide balanced explanations with essential context.",
    detailed: "Provide comprehensive explanations with full clinical reasoning.",
  }[verbosity];

  return `You are an expert AI clinical assistant for a multi-specialty behavioral health and primary care EMR system. Your role is to analyze patient data and provide evidence-based clinical recommendations to support healthcare providers in delivering optimal care.

CRITICAL GUIDELINES:
1. All recommendations are SUGGESTIONS ONLY - they must be reviewed and approved by licensed healthcare providers
2. Always prioritize patient safety and evidence-based medicine
3. Consider both structured data (medications, labs, vitals) and unstructured data (clinical notes)
4. Provide clear, actionable recommendations with appropriate urgency levels
5. Flag potential drug interactions, allergies, and safety concerns
6. Identify gaps in preventive care and chronic disease management
7. Consider specialty-specific clinical guidelines and best practices
8. Maintain patient privacy - never reference other patients' data
${rationaleInstructions}

VERBOSITY: ${verbosityInstructions}

SPECIALTY CONTEXT: ${context.specialtyName}
${context.userRole || context.roleContext?.role ? `USER ROLE: ${context.userRole || context.roleContext?.role}` : ""}
${context.roleContext?.focusAreas ? `ROLE FOCUS AREAS: ${context.roleContext.focusAreas.join(", ")}` : ""}
${context.encounterType ? `ENCOUNTER TYPE: ${context.encounterType}` : ""}
${context.chiefComplaint ? `CHIEF COMPLAINT: ${context.chiefComplaint}` : ""}

OUTPUT FORMAT:
You must respond with a valid JSON object matching this structure:
{
  "summary": "A concise 2-3 sentence clinical summary of the patient's current status",
  "riskAlerts": [
    {
      "type": "critical" | "warning" | "info",
      "message": "Alert message",
      "rationale": "Brief explanation of why this is a risk"
    }
  ],
  "recommendations": [
    {
      "category": "Category name (e.g., 'Diabetes Management', 'Cardiovascular Risk')",
      "color": "border-blue-500" | "border-yellow-500" | "border-red-500" | "border-green-500",
      "text": "Evidence-based recommendation with rationale",
      "rationale": "Detailed explanation of why this recommendation is made",
      "evidence": "Reference to clinical guideline or evidence (e.g., 'ADA 2024 Standards of Care')",
      "confidence": "high" | "medium" | "low",
      "patientFactors": ["List of patient-specific factors that support this recommendation"]
    }
  ],
  "drugInteractions": {
    "status": "no_major" | "minor" | "major" | "critical",
    "message": "Summary message",
    "interactions": [
      {
        "drug1": "Drug name",
        "drug2": "Drug name",
        "severity": "minor" | "moderate" | "major" | "contraindicated",
        "description": "Interaction description",
        "action": "Recommended action",
        "mechanism": "Brief explanation of the interaction mechanism"
      }
    ]
  },
  "labOrders": [
    {
      "test": "Test name",
      "reason": "Clinical indication",
      "urgency": "STAT" | "Today" | "This week" | "Next 30 days" | "Routine",
      "rationale": "Why this test is recommended for this patient",
      "expectedFindings": "What the test might reveal"
    }
  ],
  "differentialDiagnosis": [
    {
      "diagnosis": "Diagnosis name",
      "probability": "Primary" | "High Probability" | "Consider" | "Rule Out",
      "type": "default" | "secondary" | "outline",
      "supportingEvidence": ["List of findings that support this diagnosis"],
      "againstEvidence": ["List of findings that argue against this diagnosis"]
    }
  ],
  "preventiveGaps": [
    {
      "measure": "Preventive measure name",
      "status": "overdue" | "due" | "needed" | "current" | "not_applicable",
      "days": number | null,
      "action": "Recommended action",
      "guideline": "Reference to guideline (e.g., 'USPSTF Grade A')"
    }
  ],
  "educationTopics": [
    {
      "topic": "Topic name",
      "relevance": "Why this topic is relevant for this patient",
      "keyPoints": ["Key points to cover"]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. Enclose the JSON within a markdown code block labelled 'json' and do not include any explanatory text outside of the JSON code block.`;
}

/**
 * Base user prompt with patient data
 * Enhanced with rationale request
 */
export function getBaseUserPrompt(context: PromptContext): string {
  const rationaleRequest = context.includeRationale !== false
    ? `
For each recommendation, please include:
- A clear rationale explaining WHY this is recommended
- Reference to relevant clinical guidelines when applicable
- Confidence level based on evidence strength
- Patient-specific factors that support the recommendation`
    : "";

  return `Please analyze the following patient data and provide comprehensive clinical recommendations:

${context.patientData}

Based on this information, provide:
1. A clinical summary of the patient's current status
2. Any risk alerts requiring immediate attention
3. Evidence-based treatment recommendations with rationale
4. Drug interaction analysis
5. Suggested lab orders with appropriate urgency
6. Differential diagnosis considerations with supporting/against evidence
7. Preventive care gaps with guideline references
8. Patient education topics with relevance explanation
${rationaleRequest}

Focus on actionable, evidence-based recommendations that will help the provider deliver optimal care. Prioritize recommendations based on clinical urgency and patient-specific factors.`;
}

/**
 * Enhanced recommendation type with rationale support
 */
export interface EnhancedRecommendation {
  category: string;
  color: string;
  text: string;
  rationale?: string;
  evidence?: string;
  confidence?: "high" | "medium" | "low";
  patientFactors?: string[];
}

/**
 * Enhanced lab order type with rationale support
 */
export interface EnhancedLabOrder {
  test: string;
  reason: string;
  urgency: "STAT" | "Today" | "This week" | "Next 30 days" | "Routine";
  rationale?: string;
  expectedFindings?: string;
}

/**
 * Enhanced differential diagnosis type
 */
export interface EnhancedDifferentialDiagnosis {
  diagnosis: string;
  probability: "Primary" | "High Probability" | "Consider" | "Rule Out";
  type: "default" | "secondary" | "outline";
  supportingEvidence?: string[];
  againstEvidence?: string[];
}

/**
 * Enhanced preventive gap type
 */
export interface EnhancedPreventiveGap {
  measure: string;
  status: "overdue" | "due" | "needed" | "current" | "not_applicable";
  days: number | null;
  action: string;
  guideline?: string;
}

/**
 * Enhanced education topic type
 */
export interface EnhancedEducationTopic {
  topic: string;
  relevance?: string;
  keyPoints?: string[];
}

/**
 * Get confidence level color for UI display
 */
export function getConfidenceColor(confidence?: "high" | "medium" | "low"): string {
  switch (confidence) {
    case "high":
      return "text-green-600 dark:text-green-400";
    case "medium":
      return "text-yellow-600 dark:text-yellow-400";
    case "low":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Get confidence level badge variant
 */
export function getConfidenceBadgeVariant(
  confidence?: "high" | "medium" | "low"
): "default" | "secondary" | "outline" {
  switch (confidence) {
    case "high":
      return "default";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
}

/**
 * Format evidence reference for display
 */
export function formatEvidenceReference(evidence?: string): string {
  if (!evidence) return "";

  // Common guideline abbreviations
  const abbreviations: Record<string, string> = {
    "ADA": "American Diabetes Association",
    "ACC": "American College of Cardiology",
    "AHA": "American Heart Association",
    "USPSTF": "U.S. Preventive Services Task Force",
    "CDC": "Centers for Disease Control and Prevention",
    "AAFP": "American Academy of Family Physicians",
    "APA": "American Psychiatric Association",
    "ASAM": "American Society of Addiction Medicine",
    "SAMHSA": "Substance Abuse and Mental Health Services Administration",
    "JNC": "Joint National Committee",
    "NICE": "National Institute for Health and Care Excellence",
  };

  // Check if evidence contains an abbreviation and expand it
  for (const [abbrev, full] of Object.entries(abbreviations)) {
    if (evidence.includes(abbrev)) {
      return evidence.replace(abbrev, `${abbrev} (${full})`);
    }
  }

  return evidence;
}
