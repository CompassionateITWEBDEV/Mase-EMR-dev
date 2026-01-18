/**
 * Treatment Plan Generator Service
 * Generates structured treatment plans from AI analysis
 */

import { generateText } from "ai";
import type { AIRecommendation } from "@/types/ai-assistant";
import type { StructuredPatientData } from "./patient-data-aggregator";
import type { NoteSummary } from "./note-processor";

export interface TreatmentPlanGoal {
  id?: string;
  description: string;
  measurable: boolean;
  targetDate?: string;
  status: "active" | "achieved" | "discontinued";
  progress?: string;
}

export interface TreatmentPlanIntervention {
  id?: string;
  type: string; // "medication" | "therapy" | "counseling" | "education" | "monitoring" | "other"
  description: string;
  frequency?: string;
  responsibleParty?: string;
  startDate?: string;
  endDate?: string;
}

export interface TreatmentPlanDraft {
  patientId: string;
  specialtyId: string;
  status: "draft" | "active" | "completed";
  startDate: string;
  endDate?: string;
  goals: TreatmentPlanGoal[];
  interventions: TreatmentPlanIntervention[];
  responsibleParties: string[];
  notes?: string;
}

/**
 * Generates a treatment plan draft from AI recommendations
 */
export async function generateTreatmentPlanDraft(
  patientId: string,
  specialtyId: string,
  aiRecommendations: AIRecommendation,
  structuredData: StructuredPatientData,
  noteSummary?: NoteSummary
): Promise<TreatmentPlanDraft> {
  // Build context for AI to generate treatment plan
  const context = buildTreatmentPlanContext(
    patientId,
    specialtyId,
    aiRecommendations,
    structuredData,
    noteSummary
  );

  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `You are an expert clinical treatment planner. Your role is to generate structured, evidence-based treatment plans from clinical recommendations.

Generate a treatment plan with:
1. Measurable, time-bound goals
2. Specific interventions with responsible parties
3. Realistic timelines
4. Specialty-appropriate structure

Return ONLY valid JSON matching this structure:
{
  "goals": [
    {
      "description": "Goal description (measurable and time-bound)",
      "measurable": true,
      "targetDate": "YYYY-MM-DD",
      "status": "active",
      "progress": "Current progress description"
    }
  ],
  "interventions": [
    {
      "type": "medication" | "therapy" | "counseling" | "education" | "monitoring" | "other",
      "description": "Specific intervention description",
      "frequency": "e.g., 'Daily', 'Weekly', 'As needed'",
      "responsibleParty": "Role or person responsible",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD or null"
    }
  ],
  "responsibleParties": ["List of responsible parties"],
  "notes": "Additional notes or considerations"
}`,
      prompt: `Generate a comprehensive treatment plan based on the following clinical context:

${context}

Create a treatment plan that:
- Addresses the key recommendations and concerns
- Includes measurable, time-bound goals
- Specifies interventions with responsible parties
- Is appropriate for ${specialtyId} specialty
- Follows evidence-based practices

Return the treatment plan as JSON.`,
      temperature: 0.3,
    });

    // Parse AI response
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      const parsed = JSON.parse(jsonText);

      // Build treatment plan draft
      const draft: TreatmentPlanDraft = {
        patientId,
        specialtyId,
        status: "draft",
        startDate: new Date().toISOString().split("T")[0],
        goals: Array.isArray(parsed.goals)
          ? parsed.goals.map((g: any) => ({
              description: g.description || "",
              measurable: g.measurable !== false,
              targetDate: g.targetDate || undefined,
              status: (g.status || "active") as "active" | "achieved" | "discontinued",
              progress: g.progress || undefined,
            }))
          : generateDefaultGoals(specialtyId, aiRecommendations),
        interventions: Array.isArray(parsed.interventions)
          ? parsed.interventions.map((i: any) => ({
              type: i.type || "other",
              description: i.description || "",
              frequency: i.frequency || undefined,
              responsibleParty: i.responsibleParty || undefined,
              startDate: i.startDate || new Date().toISOString().split("T")[0],
              endDate: i.endDate || undefined,
            }))
          : generateDefaultInterventions(specialtyId, aiRecommendations, structuredData),
        responsibleParties: Array.isArray(parsed.responsibleParties)
          ? parsed.responsibleParties
          : ["Primary Provider"],
        notes: parsed.notes || "",
      };

      return draft;
    } catch (parseError) {
      console.error("Error parsing treatment plan:", parseError);
      // Fallback to default plan
      return generateDefaultTreatmentPlan(
        patientId,
        specialtyId,
        aiRecommendations,
        structuredData
      );
    }
  } catch (error) {
    console.error("Error generating treatment plan:", error);
    // Fallback to default plan
    return generateDefaultTreatmentPlan(
      patientId,
      specialtyId,
      aiRecommendations,
      structuredData
    );
  }
}

/**
 * Builds context string for treatment plan generation
 */
function buildTreatmentPlanContext(
  patientId: string,
  specialtyId: string,
  aiRecommendations: AIRecommendation,
  structuredData: StructuredPatientData,
  noteSummary?: NoteSummary
): string {
  let context = `PATIENT: ${structuredData.demographics.first_name} ${structuredData.demographics.last_name}, Age ${structuredData.demographics.age}\n`;
  context += `SPECIALTY: ${specialtyId}\n\n`;

  context += `CLINICAL SUMMARY:\n${aiRecommendations.summary}\n\n`;

  if (aiRecommendations.riskAlerts.length > 0) {
    context += `RISK ALERTS:\n`;
    aiRecommendations.riskAlerts.forEach((alert) => {
      context += `- ${alert.message}\n`;
    });
    context += "\n";
  }

  if (aiRecommendations.recommendations.length > 0) {
    context += `KEY RECOMMENDATIONS:\n`;
    aiRecommendations.recommendations.forEach((rec) => {
      context += `- ${rec.text}\n`;
    });
    context += "\n";
  }

  if (structuredData.problems.length > 0) {
    context += `ACTIVE DIAGNOSES:\n`;
    structuredData.problems.forEach((prob) => {
      context += `- ${prob.diagnosis}\n`;
    });
    context += "\n";
  }

  if (structuredData.medications.length > 0) {
    context += `CURRENT MEDICATIONS:\n`;
    structuredData.medications.forEach((med) => {
      context += `- ${med.medication_name}${med.dosage ? ` ${med.dosage}` : ""}${med.frequency ? ` ${med.frequency}` : ""}\n`;
    });
    context += "\n";
  }

  if (noteSummary) {
    context += `CLINICAL NOTES SUMMARY:\n${noteSummary.summary}\n\n`;
    if (noteSummary.keyFindings.length > 0) {
      context += `KEY FINDINGS: ${noteSummary.keyFindings.join(", ")}\n`;
    }
  }

  return context;
}

/**
 * Generates default goals based on specialty and recommendations
 */
function generateDefaultGoals(
  specialtyId: string,
  recommendations: AIRecommendation
): TreatmentPlanGoal[] {
  const goals: TreatmentPlanGoal[] = [];
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  switch (specialtyId) {
    case "behavioral-health":
      goals.push({
        description: "Maintain sobriety with negative UDS results",
        measurable: true,
        targetDate: sixMonthsFromNow.toISOString().split("T")[0],
        status: "active",
      });
      goals.push({
        description: "Attend scheduled counseling sessions with 80% attendance rate",
        measurable: true,
        targetDate: sixMonthsFromNow.toISOString().split("T")[0],
        status: "active",
      });
      break;

    case "primary-care":
      if (recommendations.preventiveGaps.length > 0) {
        goals.push({
          description: "Complete overdue preventive care screenings",
          measurable: true,
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          status: "active",
        });
      }
      goals.push({
        description: "Maintain chronic disease management goals",
        measurable: true,
        targetDate: sixMonthsFromNow.toISOString().split("T")[0],
        status: "active",
      });
      break;

    case "psychiatry":
      goals.push({
        description: "Achieve target PHQ-9 score reduction of 50%",
        measurable: true,
        targetDate: sixMonthsFromNow.toISOString().split("T")[0],
        status: "active",
      });
      goals.push({
        description: "Maintain medication adherence with <2 missed doses per month",
        measurable: true,
        targetDate: sixMonthsFromNow.toISOString().split("T")[0],
        status: "active",
      });
      break;

    case "physical-therapy":
      goals.push({
        description: "Improve functional mobility and range of motion",
        measurable: true,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status: "active",
      });
      break;
  }

  return goals.length > 0 ? goals : [
    {
      description: "Improve overall health and well-being",
      measurable: false,
      targetDate: sixMonthsFromNow.toISOString().split("T")[0],
      status: "active",
    },
  ];
}

/**
 * Generates default interventions based on specialty and data
 */
function generateDefaultInterventions(
  specialtyId: string,
  recommendations: AIRecommendation,
  structuredData: StructuredPatientData
): TreatmentPlanIntervention[] {
  const interventions: TreatmentPlanIntervention[] = [];
  const today = new Date().toISOString().split("T")[0];

  switch (specialtyId) {
    case "behavioral-health":
      interventions.push({
        type: "counseling",
        description: "Weekly individual counseling sessions",
        frequency: "Weekly",
        responsibleParty: "Counselor",
        startDate: today,
      });
      if (structuredData.medications.some((m) => m.medication_name?.toLowerCase().includes("buprenorphine") || m.medication_name?.toLowerCase().includes("methadone"))) {
        interventions.push({
          type: "medication",
          description: "MAT medication monitoring and administration",
          frequency: "Daily",
          responsibleParty: "Dispensing Nurse",
          startDate: today,
        });
      }
      interventions.push({
        type: "monitoring",
        description: "Weekly urine drug screens",
        frequency: "Weekly",
        responsibleParty: "Nurse",
        startDate: today,
      });
      break;

    case "primary-care":
      if (recommendations.labOrders.length > 0) {
        interventions.push({
          type: "monitoring",
          description: `Complete recommended lab work: ${recommendations.labOrders.map((l) => l.test).join(", ")}`,
          frequency: "As ordered",
          responsibleParty: "Primary Care Provider",
          startDate: today,
        });
      }
      interventions.push({
        type: "education",
        description: "Patient education on chronic disease management",
        frequency: "Ongoing",
        responsibleParty: "Nurse",
        startDate: today,
      });
      break;

    case "psychiatry":
      interventions.push({
        type: "medication",
        description: "Psychiatric medication management",
        frequency: "As prescribed",
        responsibleParty: "Psychiatrist",
        startDate: today,
      });
      interventions.push({
        type: "therapy",
        description: "Psychotherapy sessions",
        frequency: "Weekly or bi-weekly",
        responsibleParty: "Therapist",
        startDate: today,
      });
      break;

    case "physical-therapy":
      interventions.push({
        type: "therapy",
        description: "Physical therapy sessions",
        frequency: "2-3 times per week",
        responsibleParty: "Physical Therapist",
        startDate: today,
      });
      interventions.push({
        type: "education",
        description: "Home exercise program",
        frequency: "Daily",
        responsibleParty: "Patient",
        startDate: today,
      });
      break;
  }

  return interventions.length > 0
    ? interventions
    : [
        {
          type: "monitoring",
          description: "Regular follow-up appointments",
          frequency: "As scheduled",
          responsibleParty: "Provider",
          startDate: today,
        },
      ];
}

/**
 * Generates a default treatment plan when AI generation fails
 */
function generateDefaultTreatmentPlan(
  patientId: string,
  specialtyId: string,
  recommendations: AIRecommendation,
  structuredData: StructuredPatientData
): TreatmentPlanDraft {
  return {
    patientId,
    specialtyId,
    status: "draft",
    startDate: new Date().toISOString().split("T")[0],
    goals: generateDefaultGoals(specialtyId, recommendations),
    interventions: generateDefaultInterventions(
      specialtyId,
      recommendations,
      structuredData
    ),
    responsibleParties: ["Primary Provider"],
    notes: "Treatment plan generated from AI recommendations. Please review and customize as needed.",
  };
}

/**
 * Formats treatment plan for display
 */
export function formatTreatmentPlanForDisplay(plan: TreatmentPlanDraft): string {
  let formatted = `Treatment Plan - ${plan.specialtyId}\n`;
  formatted += `Status: ${plan.status}\n`;
  formatted += `Start Date: ${plan.startDate}\n`;
  if (plan.endDate) {
    formatted += `End Date: ${plan.endDate}\n`;
  }
  formatted += `\nGOALS:\n`;
  plan.goals.forEach((goal, idx) => {
    formatted += `${idx + 1}. ${goal.description}`;
    if (goal.targetDate) {
      formatted += ` (Target: ${goal.targetDate})`;
    }
    formatted += `\n`;
  });
  formatted += `\nINTERVENTIONS:\n`;
  plan.interventions.forEach((intervention, idx) => {
    formatted += `${idx + 1}. [${intervention.type}] ${intervention.description}`;
    if (intervention.frequency) {
      formatted += ` (${intervention.frequency})`;
    }
    if (intervention.responsibleParty) {
      formatted += ` - Responsible: ${intervention.responsibleParty}`;
    }
    formatted += `\n`;
  });
  if (plan.notes) {
    formatted += `\nNOTES:\n${plan.notes}\n`;
  }
  return formatted;
}
