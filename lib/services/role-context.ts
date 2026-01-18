/**
 * Role-Based Context Service
 * Filters and customizes AI recommendations based on user role, specialty, and preferences
 * 
 * Enhanced in Phase 2 with:
 * - More granular role definitions
 * - Specialty-specific customizations
 * - User preference support
 * - Recommendation priority scoring
 */

export type UserRole =
  | "physician"
  | "nurse_practitioner"
  | "physician_assistant"
  | "registered_nurse"
  | "licensed_practical_nurse"
  | "medical_assistant"
  | "therapist"
  | "physical_therapist"
  | "occupational_therapist"
  | "speech_therapist"
  | "care_manager"
  | "case_manager"
  | "counselor"
  | "psychologist"
  | "psychiatrist"
  | "social_worker"
  | "pharmacist"
  | "dietitian"
  | "admin"
  | "provider"
  | "other";

// Role capability levels
export type CapabilityLevel = "full" | "limited" | "view_only" | "none";

export interface RoleCapabilities {
  prescribing: CapabilityLevel;
  ordering: CapabilityLevel;
  diagnosing: CapabilityLevel;
  documenting: CapabilityLevel;
  counseling: CapabilityLevel;
  coordination: CapabilityLevel;
}

export interface RoleContext {
  role: UserRole;
  specialtyId?: string;
  permissions?: string[];
  capabilities?: RoleCapabilities;
}

export interface UserPreferences {
  defaultAnalysisType?: "full" | "quick" | "specific";
  preferredFocusAreas?: string[];
  showDifferentialDiagnosis?: boolean;
  showLabOrders?: boolean;
  showPreventiveGaps?: boolean;
  showEducationTopics?: boolean;
  verbosityLevel?: "concise" | "standard" | "detailed";
  highlightUrgent?: boolean;
}

// Role capability definitions
const ROLE_CAPABILITIES: Record<UserRole, RoleCapabilities> = {
  physician: {
    prescribing: "full",
    ordering: "full",
    diagnosing: "full",
    documenting: "full",
    counseling: "full",
    coordination: "full",
  },
  psychiatrist: {
    prescribing: "full",
    ordering: "full",
    diagnosing: "full",
    documenting: "full",
    counseling: "full",
    coordination: "full",
  },
  nurse_practitioner: {
    prescribing: "full",
    ordering: "full",
    diagnosing: "full",
    documenting: "full",
    counseling: "full",
    coordination: "full",
  },
  physician_assistant: {
    prescribing: "limited",
    ordering: "full",
    diagnosing: "limited",
    documenting: "full",
    counseling: "full",
    coordination: "full",
  },
  psychologist: {
    prescribing: "none",
    ordering: "limited",
    diagnosing: "full",
    documenting: "full",
    counseling: "full",
    coordination: "limited",
  },
  registered_nurse: {
    prescribing: "none",
    ordering: "limited",
    diagnosing: "none",
    documenting: "full",
    counseling: "limited",
    coordination: "full",
  },
  licensed_practical_nurse: {
    prescribing: "none",
    ordering: "none",
    diagnosing: "none",
    documenting: "limited",
    counseling: "limited",
    coordination: "limited",
  },
  medical_assistant: {
    prescribing: "none",
    ordering: "none",
    diagnosing: "none",
    documenting: "limited",
    counseling: "none",
    coordination: "limited",
  },
  therapist: {
    prescribing: "none",
    ordering: "limited",
    diagnosing: "limited",
    documenting: "full",
    counseling: "full",
    coordination: "limited",
  },
  physical_therapist: {
    prescribing: "none",
    ordering: "limited",
    diagnosing: "limited",
    documenting: "full",
    counseling: "limited",
    coordination: "limited",
  },
  occupational_therapist: {
    prescribing: "none",
    ordering: "limited",
    diagnosing: "limited",
    documenting: "full",
    counseling: "limited",
    coordination: "limited",
  },
  speech_therapist: {
    prescribing: "none",
    ordering: "limited",
    diagnosing: "limited",
    documenting: "full",
    counseling: "limited",
    coordination: "limited",
  },
  care_manager: {
    prescribing: "none",
    ordering: "none",
    diagnosing: "none",
    documenting: "limited",
    counseling: "limited",
    coordination: "full",
  },
  case_manager: {
    prescribing: "none",
    ordering: "none",
    diagnosing: "none",
    documenting: "limited",
    counseling: "limited",
    coordination: "full",
  },
  counselor: {
    prescribing: "none",
    ordering: "none",
    diagnosing: "limited",
    documenting: "full",
    counseling: "full",
    coordination: "limited",
  },
  social_worker: {
    prescribing: "none",
    ordering: "none",
    diagnosing: "none",
    documenting: "full",
    counseling: "full",
    coordination: "full",
  },
  pharmacist: {
    prescribing: "limited",
    ordering: "limited",
    diagnosing: "none",
    documenting: "limited",
    counseling: "limited",
    coordination: "limited",
  },
  dietitian: {
    prescribing: "none",
    ordering: "limited",
    diagnosing: "none",
    documenting: "full",
    counseling: "full",
    coordination: "limited",
  },
  admin: {
    prescribing: "none",
    ordering: "none",
    diagnosing: "none",
    documenting: "view_only",
    counseling: "none",
    coordination: "view_only",
  },
  provider: {
    prescribing: "limited",
    ordering: "limited",
    diagnosing: "limited",
    documenting: "full",
    counseling: "limited",
    coordination: "limited",
  },
  other: {
    prescribing: "none",
    ordering: "none",
    diagnosing: "none",
    documenting: "view_only",
    counseling: "none",
    coordination: "view_only",
  },
};

/**
 * Maps database role strings to standardized role types
 * Enhanced with more granular role detection
 */
export function normalizeRole(role: string | null | undefined): UserRole {
  if (!role) return "provider";

  const roleLower = role.toLowerCase().replace(/[_-]/g, " ");

  // Physicians and prescribers
  if (
    roleLower.includes("physician") ||
    roleLower.includes("doctor") ||
    roleLower === "md" ||
    roleLower === "do"
  ) {
    return "physician";
  }

  if (roleLower.includes("psychiatrist")) {
    return "psychiatrist";
  }

  if (
    roleLower.includes("nurse practitioner") ||
    roleLower === "np" ||
    roleLower === "arnp" ||
    roleLower === "aprn"
  ) {
    return "nurse_practitioner";
  }

  if (
    roleLower.includes("physician assistant") ||
    roleLower === "pa" ||
    roleLower === "pa c"
  ) {
    return "physician_assistant";
  }

  // Nursing roles
  if (
    roleLower.includes("registered nurse") ||
    roleLower === "rn" ||
    roleLower === "bsn"
  ) {
    return "registered_nurse";
  }

  if (
    roleLower.includes("licensed practical nurse") ||
    roleLower.includes("licensed vocational nurse") ||
    roleLower === "lpn" ||
    roleLower === "lvn"
  ) {
    return "licensed_practical_nurse";
  }

  if (
    roleLower.includes("medical assistant") ||
    roleLower === "ma" ||
    roleLower === "cma"
  ) {
    return "medical_assistant";
  }

  // Therapy roles
  if (
    roleLower.includes("physical therapist") ||
    roleLower === "pt" ||
    roleLower === "dpt"
  ) {
    return "physical_therapist";
  }

  if (
    roleLower.includes("occupational therapist") ||
    roleLower === "ot" ||
    roleLower === "otr"
  ) {
    return "occupational_therapist";
  }

  if (
    roleLower.includes("speech") ||
    roleLower === "slp" ||
    roleLower === "ccc slp"
  ) {
    return "speech_therapist";
  }

  if (roleLower.includes("therapist")) {
    return "therapist";
  }

  // Mental health roles
  if (
    roleLower.includes("psychologist") ||
    roleLower === "phd" ||
    roleLower === "psyd"
  ) {
    return "psychologist";
  }

  if (
    roleLower.includes("counselor") ||
    roleLower === "lpc" ||
    roleLower === "lmhc" ||
    roleLower === "lcpc"
  ) {
    return "counselor";
  }

  if (
    roleLower.includes("social worker") ||
    roleLower === "lcsw" ||
    roleLower === "lmsw" ||
    roleLower === "msw"
  ) {
    return "social_worker";
  }

  // Care management roles
  if (
    roleLower.includes("care manager") ||
    roleLower.includes("care coordinator")
  ) {
    return "care_manager";
  }

  if (roleLower.includes("case manager")) {
    return "case_manager";
  }

  // Other clinical roles
  if (
    roleLower.includes("pharmacist") ||
    roleLower === "pharmd" ||
    roleLower === "rph"
  ) {
    return "pharmacist";
  }

  if (
    roleLower.includes("dietitian") ||
    roleLower.includes("nutritionist") ||
    roleLower === "rd" ||
    roleLower === "rdn"
  ) {
    return "dietitian";
  }

  // Administrative
  if (roleLower.includes("admin")) {
    return "admin";
  }

  // Generic nursing fallback
  if (roleLower.includes("nurse")) {
    return "registered_nurse";
  }

  return "provider";
}

/**
 * Gets capabilities for a role
 */
export function getRoleCapabilities(role: UserRole): RoleCapabilities {
  return ROLE_CAPABILITIES[role] || ROLE_CAPABILITIES.other;
}

/**
 * Checks if a role can perform a specific action
 */
export function canPerformAction(
  role: UserRole,
  action: keyof RoleCapabilities,
  level: CapabilityLevel = "limited"
): boolean {
  const capabilities = getRoleCapabilities(role);
  const roleLevel = capabilities[action];

  const levelOrder: CapabilityLevel[] = ["none", "view_only", "limited", "full"];
  return levelOrder.indexOf(roleLevel) >= levelOrder.indexOf(level);
}

/**
 * Gets role-specific focus areas for AI recommendations
 * Enhanced with more granular role-specific areas
 */
export function getRoleFocusAreas(role: UserRole): string[] {
  const baseAreas: Record<UserRole, string[]> = {
    physician: [
      "diagnostic recommendations",
      "treatment plan decisions",
      "medication management",
      "differential diagnosis",
      "specialist referrals",
      "clinical decision-making",
      "procedure recommendations",
      "risk stratification",
    ],
    psychiatrist: [
      "psychiatric diagnosis",
      "psychotropic medication management",
      "therapy recommendations",
      "risk assessment",
      "treatment adherence",
      "crisis intervention",
      "medication interactions",
    ],
    nurse_practitioner: [
      "diagnostic recommendations",
      "treatment planning",
      "medication management",
      "patient education",
      "preventive care",
      "chronic disease management",
      "care coordination",
    ],
    physician_assistant: [
      "diagnostic support",
      "treatment recommendations",
      "medication review",
      "patient education",
      "procedure assistance",
      "care coordination",
    ],
    psychologist: [
      "psychological assessment",
      "therapy planning",
      "behavioral interventions",
      "cognitive assessments",
      "treatment progress",
      "diagnostic formulation",
    ],
    registered_nurse: [
      "care coordination",
      "medication administration",
      "patient education",
      "vital signs monitoring",
      "follow-up scheduling",
      "patient adherence",
      "care plan execution",
      "symptom management",
    ],
    licensed_practical_nurse: [
      "basic care tasks",
      "medication administration",
      "vital signs",
      "patient comfort",
      "documentation",
    ],
    medical_assistant: [
      "vital signs",
      "patient intake",
      "appointment scheduling",
      "basic documentation",
    ],
    therapist: [
      "progress tracking",
      "goal adjustments",
      "treatment modifications",
      "functional assessments",
      "discharge planning",
      "home exercise programs",
    ],
    physical_therapist: [
      "mobility assessment",
      "exercise prescription",
      "pain management",
      "functional goals",
      "equipment recommendations",
      "discharge planning",
    ],
    occupational_therapist: [
      "ADL assessment",
      "adaptive equipment",
      "cognitive rehabilitation",
      "home modifications",
      "functional independence",
      "return to work planning",
    ],
    speech_therapist: [
      "communication assessment",
      "swallowing evaluation",
      "speech therapy goals",
      "cognitive-linguistic therapy",
      "AAC recommendations",
    ],
    care_manager: [
      "care gaps",
      "follow-up scheduling",
      "patient engagement",
      "resource coordination",
      "preventive care",
      "chronic disease management",
      "transition planning",
      "utilization management",
    ],
    case_manager: [
      "resource coordination",
      "discharge planning",
      "insurance authorization",
      "community resources",
      "care transitions",
    ],
    counselor: [
      "therapy progress",
      "treatment adherence",
      "crisis assessment",
      "support services",
      "relapse prevention",
      "coping strategies",
      "family involvement",
    ],
    social_worker: [
      "psychosocial assessment",
      "resource coordination",
      "crisis intervention",
      "family support",
      "discharge planning",
      "community resources",
      "advocacy needs",
    ],
    pharmacist: [
      "medication review",
      "drug interactions",
      "dosing optimization",
      "medication reconciliation",
      "adherence counseling",
      "therapeutic alternatives",
    ],
    dietitian: [
      "nutritional assessment",
      "diet recommendations",
      "meal planning",
      "nutrition education",
      "weight management",
      "disease-specific diets",
    ],
    admin: [
      "scheduling",
      "documentation status",
      "compliance tracking",
    ],
    provider: [
      "clinical recommendations",
      "patient care",
      "treatment planning",
    ],
    other: [
      "general information",
    ],
  };

  return baseAreas[role] || baseAreas.other;
}

/**
 * Gets role-specific information to emphasize in AI prompts
 * Enhanced with more detailed role-specific guidance
 */
export function getRolePromptContext(role: UserRole): string {
  const contexts: Record<UserRole, string> = {
    physician: `You are providing recommendations to a PHYSICIAN. Focus on:
- Diagnostic considerations and differential diagnoses
- Evidence-based treatment recommendations
- Medication management and adjustments
- Specialist referral needs
- Clinical decision support for complex cases
- Billing and documentation requirements
- Risk stratification and prognostic factors`,

    psychiatrist: `You are providing recommendations to a PSYCHIATRIST. Focus on:
- Psychiatric diagnostic considerations (DSM-5 criteria)
- Psychotropic medication management and interactions
- Therapy modality recommendations
- Suicide and violence risk assessment
- Treatment-resistant case strategies
- Medication side effect monitoring
- Comorbidity management`,

    nurse_practitioner: `You are providing recommendations to a NURSE PRACTITIONER. Focus on:
- Diagnostic and treatment recommendations
- Medication prescribing considerations
- Patient education and counseling
- Preventive care and screening
- Chronic disease management
- Care coordination and referrals
- Evidence-based practice guidelines`,

    physician_assistant: `You are providing recommendations to a PHYSICIAN ASSISTANT. Focus on:
- Diagnostic support and clinical reasoning
- Treatment recommendations within scope
- Medication considerations
- Patient education
- Collaboration points with supervising physician
- Procedure-related recommendations`,

    psychologist: `You are providing recommendations to a PSYCHOLOGIST. Focus on:
- Psychological assessment findings
- Evidence-based therapy recommendations
- Behavioral intervention strategies
- Cognitive assessment considerations
- Treatment progress monitoring
- Diagnostic formulation support
- Referral needs for medication evaluation`,

    registered_nurse: `You are providing recommendations to a REGISTERED NURSE. Focus on:
- Care coordination tasks and follow-ups
- Medication administration and monitoring
- Patient education topics and materials
- Vital signs and symptom monitoring
- Patient adherence and engagement
- Practical care delivery recommendations
- Documentation requirements
- Safety and fall risk considerations`,

    licensed_practical_nurse: `You are providing recommendations to a LICENSED PRACTICAL NURSE. Focus on:
- Basic care tasks within scope
- Medication administration reminders
- Vital sign monitoring
- Patient comfort measures
- Documentation needs
- When to escalate to RN or provider`,

    medical_assistant: `You are providing recommendations to a MEDICAL ASSISTANT. Focus on:
- Vital sign collection priorities
- Patient intake information needs
- Appointment scheduling considerations
- Basic documentation tasks
- When to alert clinical staff`,

    therapist: `You are providing recommendations to a THERAPIST. Focus on:
- Progress toward therapy goals
- Treatment plan modifications
- Functional assessment results
- Home exercise program updates
- Re-evaluation timing
- Discharge readiness
- Equipment needs`,

    physical_therapist: `You are providing recommendations to a PHYSICAL THERAPIST. Focus on:
- Mobility and functional assessments
- Exercise prescription and progression
- Pain management strategies
- Gait and balance training
- Equipment recommendations
- Discharge planning and home program
- Return to activity guidelines`,

    occupational_therapist: `You are providing recommendations to an OCCUPATIONAL THERAPIST. Focus on:
- ADL and IADL assessment
- Adaptive equipment needs
- Cognitive rehabilitation strategies
- Home modification recommendations
- Functional independence goals
- Return to work/school planning
- Caregiver training needs`,

    speech_therapist: `You are providing recommendations to a SPEECH-LANGUAGE PATHOLOGIST. Focus on:
- Communication assessment findings
- Swallowing safety and diet recommendations
- Speech therapy goal progression
- Cognitive-linguistic therapy needs
- AAC device considerations
- Family training needs`,

    care_manager: `You are providing recommendations to a CARE MANAGER. Focus on:
- Preventive care gaps and quality measures
- Care coordination needs
- Follow-up scheduling priorities
- Patient engagement strategies
- Resource referrals
- Chronic disease management tracking
- Transition of care planning
- Utilization management considerations`,

    case_manager: `You are providing recommendations to a CASE MANAGER. Focus on:
- Resource coordination needs
- Discharge planning requirements
- Insurance authorization needs
- Community resource connections
- Care transition planning
- Social determinants of health`,

    counselor: `You are providing recommendations to a COUNSELOR. Focus on:
- Therapy session planning
- Treatment adherence monitoring
- Crisis intervention needs
- Support service referrals
- Relapse prevention strategies
- Progress monitoring
- Family involvement opportunities
- Coping skill development`,

    social_worker: `You are providing recommendations to a SOCIAL WORKER. Focus on:
- Psychosocial assessment needs
- Resource coordination
- Crisis intervention
- Family support services
- Discharge planning
- Community resources
- Advocacy needs
- Social determinants of health`,

    pharmacist: `You are providing recommendations to a PHARMACIST. Focus on:
- Medication therapy review
- Drug-drug interactions
- Dosing optimization
- Medication reconciliation needs
- Adherence counseling opportunities
- Therapeutic alternatives
- Cost-effective options
- Monitoring parameters`,

    dietitian: `You are providing recommendations to a REGISTERED DIETITIAN. Focus on:
- Nutritional assessment findings
- Medical nutrition therapy recommendations
- Meal planning guidance
- Nutrition education topics
- Weight management strategies
- Disease-specific dietary modifications
- Supplement recommendations
- Enteral/parenteral nutrition needs`,

    admin: `You are providing information to an ADMINISTRATIVE STAFF member. Focus on:
- Scheduling considerations
- Documentation status
- Compliance tracking needs
- General patient information (within HIPAA guidelines)`,

    provider: `You are providing clinical recommendations. Focus on evidence-based care and patient safety.`,

    other: `You are providing general clinical information. Focus on patient safety and appropriate referrals.`,
  };

  return contexts[role] || contexts.other;
}

/**
 * Filters AI recommendations based on role relevance and capabilities
 * Enhanced with capability-based filtering
 */
export function filterRecommendationsByRole(
  role: UserRole,
  recommendations: {
    riskAlerts: any[];
    recommendations: any[];
    labOrders: any[];
    differentialDiagnosis: any[];
    preventiveGaps: any[];
    educationTopics: any[];
  },
  preferences?: UserPreferences
): {
  riskAlerts: any[];
  recommendations: any[];
  labOrders: any[];
  differentialDiagnosis: any[];
  preventiveGaps: any[];
  educationTopics: any[];
} {
  const capabilities = getRoleCapabilities(role);
  
  const filtered = {
    riskAlerts: [...recommendations.riskAlerts], // Always show all alerts
    recommendations: [...recommendations.recommendations],
    labOrders: [...recommendations.labOrders],
    differentialDiagnosis: [...recommendations.differentialDiagnosis],
    preventiveGaps: [...recommendations.preventiveGaps],
    educationTopics: [...recommendations.educationTopics],
  };

  // Apply capability-based filtering
  if (capabilities.diagnosing === "none") {
    filtered.differentialDiagnosis = [];
  }

  if (capabilities.ordering === "none") {
    filtered.labOrders = [];
  }

  // Apply user preferences if provided
  if (preferences) {
    if (preferences.showDifferentialDiagnosis === false) {
      filtered.differentialDiagnosis = [];
    }
    if (preferences.showLabOrders === false) {
      filtered.labOrders = [];
    }
    if (preferences.showPreventiveGaps === false) {
      filtered.preventiveGaps = [];
    }
    if (preferences.showEducationTopics === false) {
      filtered.educationTopics = [];
    }

    // Filter by preferred focus areas
    if (preferences.preferredFocusAreas && preferences.preferredFocusAreas.length > 0) {
      filtered.recommendations = filtered.recommendations.filter((rec) =>
        preferences.preferredFocusAreas!.some(
          (area) =>
            rec.category?.toLowerCase().includes(area.toLowerCase()) ||
            rec.text?.toLowerCase().includes(area.toLowerCase())
        )
      );
    }
  }

  // Role-specific filtering
  switch (role) {
    case "registered_nurse":
    case "licensed_practical_nurse":
      // Nurses see care-focused recommendations
      filtered.recommendations = filtered.recommendations.filter(
        (rec) =>
          !rec.category?.toLowerCase().includes("diagnostic") &&
          !rec.text?.toLowerCase().includes("differential")
      );
      break;

    case "medical_assistant":
      // MAs see minimal clinical recommendations
      filtered.differentialDiagnosis = [];
      filtered.labOrders = [];
      filtered.recommendations = filtered.recommendations.filter(
        (rec) =>
          rec.category?.toLowerCase().includes("vital") ||
          rec.category?.toLowerCase().includes("intake") ||
          rec.category?.toLowerCase().includes("scheduling")
      );
      break;

    case "physical_therapist":
    case "occupational_therapist":
    case "speech_therapist":
    case "therapist":
      // Therapists focus on functional recommendations
      filtered.differentialDiagnosis = [];
      filtered.labOrders = filtered.labOrders.filter(
        (lab) =>
          lab.test?.toLowerCase().includes("functional") ||
          lab.test?.toLowerCase().includes("assessment") ||
          lab.test?.toLowerCase().includes("imaging")
      );
      break;

    case "care_manager":
    case "case_manager":
      // Care managers focus on coordination
      filtered.differentialDiagnosis = [];
      filtered.labOrders = [];
      break;

    case "counselor":
    case "social_worker":
      // Mental health focus
      filtered.differentialDiagnosis = [];
      filtered.labOrders = [];
      filtered.recommendations = filtered.recommendations.filter(
        (rec) =>
          rec.category?.toLowerCase().includes("therapy") ||
          rec.category?.toLowerCase().includes("counseling") ||
          rec.category?.toLowerCase().includes("support") ||
          rec.category?.toLowerCase().includes("mental") ||
          rec.category?.toLowerCase().includes("behavioral") ||
          rec.category?.toLowerCase().includes("crisis") ||
          rec.category?.toLowerCase().includes("resource")
      );
      break;

    case "pharmacist":
      // Pharmacists focus on medications
      filtered.differentialDiagnosis = [];
      filtered.recommendations = filtered.recommendations.filter(
        (rec) =>
          rec.category?.toLowerCase().includes("medication") ||
          rec.category?.toLowerCase().includes("drug") ||
          rec.category?.toLowerCase().includes("dosing") ||
          rec.category?.toLowerCase().includes("adherence") ||
          rec.text?.toLowerCase().includes("medication") ||
          rec.text?.toLowerCase().includes("drug")
      );
      break;

    case "dietitian":
      // Dietitians focus on nutrition
      filtered.differentialDiagnosis = [];
      filtered.labOrders = filtered.labOrders.filter(
        (lab) =>
          lab.test?.toLowerCase().includes("nutrition") ||
          lab.test?.toLowerCase().includes("vitamin") ||
          lab.test?.toLowerCase().includes("albumin") ||
          lab.test?.toLowerCase().includes("glucose") ||
          lab.test?.toLowerCase().includes("lipid") ||
          lab.test?.toLowerCase().includes("a1c")
      );
      filtered.recommendations = filtered.recommendations.filter(
        (rec) =>
          rec.category?.toLowerCase().includes("nutrition") ||
          rec.category?.toLowerCase().includes("diet") ||
          rec.category?.toLowerCase().includes("weight") ||
          rec.text?.toLowerCase().includes("nutrition") ||
          rec.text?.toLowerCase().includes("diet")
      );
      break;

    case "admin":
      // Admins see minimal clinical detail
      filtered.differentialDiagnosis = [];
      filtered.labOrders = [];
      filtered.recommendations = [];
      break;

    case "physician":
    case "psychiatrist":
    case "nurse_practitioner":
    case "psychologist":
    default:
      // Full access roles see everything
      break;
  }

  return filtered;
}

/**
 * Scores recommendation priority based on role relevance
 */
export function scoreRecommendationPriority(
  role: UserRole,
  recommendation: { category?: string; text?: string; urgency?: string }
): number {
  let score = 50; // Base score

  const focusAreas = getRoleFocusAreas(role);
  const categoryLower = recommendation.category?.toLowerCase() || "";
  const textLower = recommendation.text?.toLowerCase() || "";

  // Boost score for role-relevant recommendations
  for (const area of focusAreas) {
    if (categoryLower.includes(area) || textLower.includes(area)) {
      score += 20;
      break;
    }
  }

  // Urgency boost
  if (recommendation.urgency === "STAT" || recommendation.urgency === "Today") {
    score += 30;
  } else if (recommendation.urgency === "This week") {
    score += 15;
  }

  // Safety-related boost (always high priority)
  if (
    textLower.includes("safety") ||
    textLower.includes("risk") ||
    textLower.includes("urgent") ||
    textLower.includes("critical")
  ) {
    score += 25;
  }

  return Math.min(100, score);
}

/**
 * Gets role-specific system prompt addition
 */
export function getRoleSystemPromptAddition(role: UserRole): string {
  return getRolePromptContext(role);
}

/**
 * Gets default user preferences for a role
 */
export function getDefaultPreferencesForRole(role: UserRole): UserPreferences {
  const capabilities = getRoleCapabilities(role);

  return {
    defaultAnalysisType: "full",
    showDifferentialDiagnosis: capabilities.diagnosing !== "none",
    showLabOrders: capabilities.ordering !== "none",
    showPreventiveGaps: true,
    showEducationTopics: capabilities.counseling !== "none",
    verbosityLevel: "standard",
    highlightUrgent: true,
  };
}
