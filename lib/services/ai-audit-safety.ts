/**
 * AI Audit Logging and Safety Validation Service
 * Provides comprehensive audit trails and safety checks for AI recommendations
 * 
 * Features:
 * - Audit logging for all AI interactions
 * - Safety validation against contraindications
 * - Recommendation validation rules
 * - Explainability tracking
 * - Regulatory compliance support
 * - Alert generation for safety concerns
 */

import { createClient } from "@/lib/supabase/server";
import type { AIRecommendation, DrugInteraction } from "@/types/ai-assistant";

// Audit event types
export type AuditEventType =
  | "analysis_requested"
  | "analysis_completed"
  | "analysis_failed"
  | "recommendation_generated"
  | "recommendation_accepted"
  | "recommendation_rejected"
  | "safety_alert_triggered"
  | "contraindication_detected"
  | "drug_interaction_flagged"
  | "feedback_submitted"
  | "cache_hit"
  | "cache_miss";

// Audit log entry
export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId: string;
  patientId: string;
  specialtyId?: string;
  sessionId?: string;
  details: Record<string, any>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  };
}

// Safety validation result
export interface SafetyValidationResult {
  isValid: boolean;
  alerts: SafetyAlert[];
  blockedRecommendations: string[];
  warnings: string[];
  validatedAt: Date;
}

// Safety alert
export interface SafetyAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: "contraindication" | "allergy" | "drug_interaction" | "dosing" | "age_related" | "condition_related";
  message: string;
  recommendation?: string;
  affectedItems: string[];
  action: "block" | "warn" | "flag";
}

// Contraindication rule
interface ContraindicationRule {
  id: string;
  condition: string;
  contraindicated: string[];
  severity: "critical" | "high" | "medium";
  message: string;
}

// Known contraindication rules
const CONTRAINDICATION_RULES: ContraindicationRule[] = [
  {
    id: "pregnancy-teratogenic",
    condition: "pregnancy",
    contraindicated: ["methotrexate", "warfarin", "isotretinoin", "valproic acid", "lithium", "statins"],
    severity: "critical",
    message: "Contraindicated in pregnancy due to teratogenic effects",
  },
  {
    id: "renal-nsaid",
    condition: "chronic kidney disease",
    contraindicated: ["nsaid", "ibuprofen", "naproxen", "ketorolac"],
    severity: "high",
    message: "NSAIDs can worsen renal function in CKD patients",
  },
  {
    id: "liver-acetaminophen",
    condition: "liver disease",
    contraindicated: ["acetaminophen high dose", "tylenol high dose"],
    severity: "high",
    message: "High-dose acetaminophen contraindicated in liver disease",
  },
  {
    id: "asthma-betablocker",
    condition: "asthma",
    contraindicated: ["propranolol", "atenolol", "metoprolol", "beta blocker"],
    severity: "high",
    message: "Non-selective beta blockers can trigger bronchospasm in asthma",
  },
  {
    id: "glaucoma-anticholinergic",
    condition: "narrow angle glaucoma",
    contraindicated: ["diphenhydramine", "oxybutynin", "anticholinergic"],
    severity: "high",
    message: "Anticholinergics can precipitate acute angle closure",
  },
  {
    id: "bleeding-anticoagulant",
    condition: "active bleeding",
    contraindicated: ["warfarin", "heparin", "enoxaparin", "rivaroxaban", "apixaban", "anticoagulant"],
    severity: "critical",
    message: "Anticoagulants contraindicated in active bleeding",
  },
  {
    id: "sulfa-allergy",
    condition: "sulfa allergy",
    contraindicated: ["sulfamethoxazole", "bactrim", "septra", "sulfasalazine"],
    severity: "critical",
    message: "Sulfa drugs contraindicated in patients with sulfa allergy",
  },
  {
    id: "maoi-ssri",
    condition: "maoi use",
    contraindicated: ["fluoxetine", "sertraline", "paroxetine", "citalopram", "escitalopram", "ssri"],
    severity: "critical",
    message: "SSRIs contraindicated with MAOIs - risk of serotonin syndrome",
  },
];

// Age-related safety rules
const AGE_SAFETY_RULES = [
  {
    ageGroup: "pediatric",
    maxAge: 18,
    contraindicated: ["aspirin"],
    message: "Aspirin contraindicated in children due to Reye's syndrome risk",
  },
  {
    ageGroup: "elderly",
    minAge: 65,
    cautionMedications: ["benzodiazepine", "opioid", "anticholinergic"],
    message: "Use caution with sedating medications in elderly patients",
  },
];

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<string> {
  const supabase = await createClient();
  
  const auditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("ai_audit_log")
      .insert({
        event_type: entry.eventType,
        user_id: entry.userId,
        patient_id: entry.patientId,
        specialty_id: entry.specialtyId,
        session_id: entry.sessionId,
        details: entry.details,
        metadata: entry.metadata,
        created_at: auditEntry.timestamp,
      })
      .select("id")
      .single();

    if (error) {
      // Log to console if database insert fails
      console.error("[Audit] Failed to log event:", error);
      console.log("[Audit] Event:", JSON.stringify(auditEntry));
      return `local-${Date.now()}`;
    }

    return data.id;
  } catch (error) {
    console.error("[Audit] Error logging event:", error);
    console.log("[Audit] Event:", JSON.stringify(auditEntry));
    return `local-${Date.now()}`;
  }
}

/**
 * Validate AI recommendations for safety
 */
export async function validateRecommendationSafety(
  recommendations: AIRecommendation,
  patientContext: {
    conditions?: string[];
    allergies?: string[];
    medications?: string[];
    age?: number;
    isPregnant?: boolean;
  }
): Promise<SafetyValidationResult> {
  const alerts: SafetyAlert[] = [];
  const blockedRecommendations: string[] = [];
  const warnings: string[] = [];

  // Normalize patient data for comparison
  const conditions = (patientContext.conditions || []).map((c) => c.toLowerCase());
  const allergies = (patientContext.allergies || []).map((a) => a.toLowerCase());
  const currentMeds = (patientContext.medications || []).map((m) => m.toLowerCase());

  // Check pregnancy contraindications
  if (patientContext.isPregnant) {
    const pregnancyRule = CONTRAINDICATION_RULES.find((r) => r.condition === "pregnancy");
    if (pregnancyRule) {
      for (const rec of recommendations.recommendations) {
        const recText = rec.text.toLowerCase();
        for (const contraindicated of pregnancyRule.contraindicated) {
          if (recText.includes(contraindicated)) {
            alerts.push({
              id: `pregnancy-${contraindicated}-${Date.now()}`,
              severity: "critical",
              type: "contraindication",
              message: `${pregnancyRule.message}: ${contraindicated}`,
              recommendation: rec.text,
              affectedItems: [contraindicated],
              action: "block",
            });
            blockedRecommendations.push(rec.text);
          }
        }
      }
    }
  }

  // Check condition-based contraindications
  for (const rule of CONTRAINDICATION_RULES) {
    const hasCondition = conditions.some(
      (c) => c.includes(rule.condition) || rule.condition.includes(c)
    );

    if (hasCondition) {
      for (const rec of recommendations.recommendations) {
        const recText = rec.text.toLowerCase();
        for (const contraindicated of rule.contraindicated) {
          if (recText.includes(contraindicated)) {
            const alert: SafetyAlert = {
              id: `${rule.id}-${Date.now()}`,
              severity: rule.severity,
              type: "contraindication",
              message: rule.message,
              recommendation: rec.text,
              affectedItems: [contraindicated],
              action: rule.severity === "critical" ? "block" : "warn",
            };
            alerts.push(alert);

            if (rule.severity === "critical") {
              blockedRecommendations.push(rec.text);
            } else {
              warnings.push(`${rule.message} - Review recommendation: ${rec.category}`);
            }
          }
        }
      }
    }
  }

  // Check allergy contraindications
  for (const allergy of allergies) {
    for (const rec of recommendations.recommendations) {
      const recText = rec.text.toLowerCase();
      if (recText.includes(allergy)) {
        alerts.push({
          id: `allergy-${allergy}-${Date.now()}`,
          severity: "critical",
          type: "allergy",
          message: `Patient has documented allergy to ${allergy}`,
          recommendation: rec.text,
          affectedItems: [allergy],
          action: "block",
        });
        blockedRecommendations.push(rec.text);
      }
    }

    // Check for cross-reactivity patterns
    const crossReactivity: Record<string, string[]> = {
      penicillin: ["amoxicillin", "ampicillin", "cephalosporin"],
      sulfa: ["sulfamethoxazole", "sulfasalazine", "thiazide"],
      aspirin: ["nsaid", "ibuprofen", "naproxen"],
    };

    for (const [allergen, related] of Object.entries(crossReactivity)) {
      if (allergy.includes(allergen)) {
        for (const rec of recommendations.recommendations) {
          const recText = rec.text.toLowerCase();
          for (const relatedDrug of related) {
            if (recText.includes(relatedDrug)) {
              alerts.push({
                id: `cross-allergy-${relatedDrug}-${Date.now()}`,
                severity: "high",
                type: "allergy",
                message: `Potential cross-reactivity: Patient allergic to ${allergen}, recommendation includes ${relatedDrug}`,
                recommendation: rec.text,
                affectedItems: [relatedDrug],
                action: "warn",
              });
              warnings.push(`Cross-reactivity warning: ${allergen} allergy may react with ${relatedDrug}`);
            }
          }
        }
      }
    }
  }

  // Check age-related safety
  if (patientContext.age !== undefined) {
    for (const rule of AGE_SAFETY_RULES) {
      const matchesAge =
        (rule.maxAge && patientContext.age <= rule.maxAge) ||
        (rule.minAge && patientContext.age >= rule.minAge);

      if (matchesAge) {
        const checkList = rule.contraindicated || rule.cautionMedications || [];
        for (const rec of recommendations.recommendations) {
          const recText = rec.text.toLowerCase();
          for (const med of checkList) {
            if (recText.includes(med)) {
              const severity = rule.contraindicated ? "high" : "medium";
              alerts.push({
                id: `age-${rule.ageGroup}-${med}-${Date.now()}`,
                severity,
                type: "age_related",
                message: rule.message,
                recommendation: rec.text,
                affectedItems: [med],
                action: rule.contraindicated ? "block" : "warn",
              });

              if (rule.contraindicated) {
                blockedRecommendations.push(rec.text);
              } else {
                warnings.push(rule.message);
              }
            }
          }
        }
      }
    }
  }

  // Check drug interactions from the AI response
  if (recommendations.drugInteractions.interactions) {
    for (const interaction of recommendations.drugInteractions.interactions) {
      if (interaction.severity === "major" || interaction.severity === "contraindicated") {
        alerts.push({
          id: `drug-interaction-${interaction.drug1}-${interaction.drug2}-${Date.now()}`,
          severity: interaction.severity === "contraindicated" ? "critical" : "high",
          type: "drug_interaction",
          message: interaction.description,
          affectedItems: [interaction.drug1, interaction.drug2],
          action: interaction.severity === "contraindicated" ? "block" : "warn",
        });

        if (interaction.severity === "contraindicated") {
          // Find and block related recommendations
          for (const rec of recommendations.recommendations) {
            const recText = rec.text.toLowerCase();
            if (
              recText.includes(interaction.drug1.toLowerCase()) ||
              recText.includes(interaction.drug2.toLowerCase())
            ) {
              blockedRecommendations.push(rec.text);
            }
          }
        }
      }
    }
  }

  return {
    isValid: alerts.filter((a) => a.action === "block").length === 0,
    alerts,
    blockedRecommendations: [...new Set(blockedRecommendations)],
    warnings: [...new Set(warnings)],
    validatedAt: new Date(),
  };
}

/**
 * Filter recommendations based on safety validation
 */
export function filterUnsafeRecommendations(
  recommendations: AIRecommendation,
  safetyResult: SafetyValidationResult
): AIRecommendation {
  if (safetyResult.isValid && safetyResult.blockedRecommendations.length === 0) {
    return recommendations;
  }

  return {
    ...recommendations,
    recommendations: recommendations.recommendations.filter(
      (rec) => !safetyResult.blockedRecommendations.includes(rec.text)
    ),
    // Add safety alerts to risk alerts
    riskAlerts: [
      ...recommendations.riskAlerts,
      ...safetyResult.alerts
        .filter((a) => a.action === "block" || a.severity === "critical")
        .map((alert) => ({
          type: "destructive" as const,
          message: `⚠️ Safety Alert: ${alert.message}`,
        })),
    ],
  };
}

/**
 * Get audit trail for a patient
 */
export async function getPatientAuditTrail(
  patientId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: AuditEventType[];
    limit?: number;
  }
): Promise<AuditLogEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("ai_audit_log")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (options?.startDate) {
    query = query.gte("created_at", options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte("created_at", options.endDate.toISOString());
  }

  if (options?.eventTypes && options.eventTypes.length > 0) {
    query = query.in("event_type", options.eventTypes);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Audit] Error fetching audit trail:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    timestamp: new Date(row.created_at),
    eventType: row.event_type as AuditEventType,
    userId: row.user_id,
    patientId: row.patient_id,
    specialtyId: row.specialty_id,
    sessionId: row.session_id,
    details: row.details,
    metadata: row.metadata,
  }));
}

/**
 * Generate explainability report for AI recommendations
 */
export function generateExplainabilityReport(
  recommendations: AIRecommendation,
  patientContext: Record<string, any>,
  safetyResult?: SafetyValidationResult
): {
  summary: string;
  factors: Array<{ factor: string; influence: string; weight: "high" | "medium" | "low" }>;
  limitations: string[];
  confidence: number;
} {
  const factors: Array<{ factor: string; influence: string; weight: "high" | "medium" | "low" }> = [];
  const limitations: string[] = [];

  // Analyze what data influenced the recommendations
  if (patientContext.diagnoses?.length > 0) {
    factors.push({
      factor: "Active Diagnoses",
      influence: `${patientContext.diagnoses.length} conditions considered`,
      weight: "high",
    });
  } else {
    limitations.push("No active diagnoses available for analysis");
  }

  if (patientContext.medications?.length > 0) {
    factors.push({
      factor: "Current Medications",
      influence: `${patientContext.medications.length} medications reviewed for interactions`,
      weight: "high",
    });
  } else {
    limitations.push("No medication list available");
  }

  if (patientContext.labResults?.length > 0) {
    factors.push({
      factor: "Lab Results",
      influence: `${patientContext.labResults.length} recent lab values analyzed`,
      weight: "medium",
    });
  } else {
    limitations.push("No recent lab results available");
  }

  if (patientContext.vitalSigns?.length > 0) {
    factors.push({
      factor: "Vital Signs",
      influence: "Recent vitals incorporated into assessment",
      weight: "medium",
    });
  }

  if (patientContext.clinicalNotes?.length > 0) {
    factors.push({
      factor: "Clinical Notes",
      influence: `${patientContext.clinicalNotes.length} recent notes analyzed`,
      weight: "medium",
    });
  } else {
    limitations.push("No recent clinical notes available for context");
  }

  // Safety validation influence
  if (safetyResult) {
    if (safetyResult.alerts.length > 0) {
      factors.push({
        factor: "Safety Validation",
        influence: `${safetyResult.alerts.length} safety checks performed`,
        weight: "high",
      });
    }
    if (safetyResult.blockedRecommendations.length > 0) {
      factors.push({
        factor: "Blocked Recommendations",
        influence: `${safetyResult.blockedRecommendations.length} recommendations blocked for safety`,
        weight: "high",
      });
    }
  }

  // Calculate confidence based on data completeness
  const dataPoints = [
    patientContext.diagnoses?.length > 0,
    patientContext.medications?.length > 0,
    patientContext.labResults?.length > 0,
    patientContext.vitalSigns?.length > 0,
    patientContext.clinicalNotes?.length > 0,
    patientContext.allergies?.length >= 0, // Even empty allergies list is informative
  ];
  const confidence = dataPoints.filter(Boolean).length / dataPoints.length;

  return {
    summary: `Analysis based on ${factors.length} data categories with ${Math.round(confidence * 100)}% data completeness.`,
    factors,
    limitations,
    confidence,
  };
}

/**
 * Create audit middleware for API routes
 */
export function createAuditMiddleware(eventType: AuditEventType) {
  return async (
    userId: string,
    patientId: string,
    details: Record<string, any>,
    metadata?: AuditLogEntry["metadata"]
  ) => {
    return logAuditEvent({
      eventType,
      userId,
      patientId,
      details,
      metadata,
    });
  };
}
