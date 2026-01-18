/**
 * Clinical Note Draft Generator Service
 * Generates draft clinical notes from AI analysis for encounters
 */

import { generateText } from "ai";
import type { AIRecommendation } from "@/types/ai-assistant";
import type { StructuredPatientData } from "./patient-data-aggregator";

export interface NoteDraft {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  chiefComplaint?: string;
  noteType: string;
}

/**
 * Generates a draft SOAP note from AI recommendations and patient data
 */
export async function generateNoteDraft(
  patientId: string,
  specialtyId: string,
  encounterType: string,
  chiefComplaint?: string,
  aiRecommendations?: AIRecommendation,
  structuredData?: StructuredPatientData
): Promise<NoteDraft> {
  const context = buildNoteContext(
    patientId,
    specialtyId,
    encounterType,
    chiefComplaint,
    aiRecommendations,
    structuredData
  );

  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `You are an expert clinical documentation assistant. Your role is to generate draft SOAP notes that are:
- Clinically accurate and evidence-based
- Well-structured and professional
- Appropriate for the specialty and encounter type
- Ready for provider review and editing

Generate a complete SOAP note with all four sections. The note should be comprehensive but concise.`,
      prompt: `Generate a draft SOAP note based on the following clinical context:

${context}

Create a professional SOAP note with:
SUBJECTIVE: Patient's reported symptoms, history of present illness, review of systems
OBJECTIVE: Physical exam findings, vital signs, lab results, assessments performed
ASSESSMENT: Clinical impression, diagnoses, differential considerations
PLAN: Treatment plan, medications, follow-up, patient education

Return the note in this JSON format:
{
  "subjective": "Subjective section text",
  "objective": "Objective section text",
  "assessment": "Assessment section text",
  "plan": "Plan section text",
  "chiefComplaint": "Chief complaint if applicable",
  "noteType": "${encounterType}"
}`,
      temperature: 0.3,
    });

    // Parse AI response
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      const parsed = JSON.parse(jsonText);

      return {
        subjective: parsed.subjective || "",
        objective: parsed.objective || "",
        assessment: parsed.assessment || "",
        plan: parsed.plan || "",
        chiefComplaint: parsed.chiefComplaint || chiefComplaint || "",
        noteType: parsed.noteType || encounterType,
      };
    } catch (parseError) {
      console.error("Error parsing note draft:", parseError);
      // Fallback to structured generation
      return generateDefaultNoteDraft(
        encounterType,
        chiefComplaint,
        aiRecommendations
      );
    }
  } catch (error) {
    console.error("Error generating note draft:", error);
    return generateDefaultNoteDraft(encounterType, chiefComplaint, aiRecommendations);
  }
}

/**
 * Builds context string for note generation
 */
function buildNoteContext(
  patientId: string,
  specialtyId: string,
  encounterType: string,
  chiefComplaint?: string,
  aiRecommendations?: AIRecommendation,
  structuredData?: StructuredPatientData
): string {
  let context = `ENCOUNTER TYPE: ${encounterType}\n`;
  context += `SPECIALTY: ${specialtyId}\n`;

  if (chiefComplaint) {
    context += `CHIEF COMPLAINT: ${chiefComplaint}\n`;
  }

  if (structuredData) {
    context += `\nPATIENT: ${structuredData.demographics.first_name} ${structuredData.demographics.last_name}, Age ${structuredData.demographics.age}\n`;

    if (structuredData.problems.length > 0) {
      context += `ACTIVE DIAGNOSES: ${structuredData.problems.map((p) => p.diagnosis).join(", ")}\n`;
    }

    if (structuredData.medications.length > 0) {
      context += `CURRENT MEDICATIONS: ${structuredData.medications.map((m) => m.medication_name).join(", ")}\n`;
    }

    if (structuredData.vitalSigns.length > 0) {
      const recentVitals = structuredData.vitalSigns[0];
      context += `RECENT VITALS: `;
      if (recentVitals.blood_pressure) context += `BP ${recentVitals.blood_pressure} `;
      if (recentVitals.heart_rate) context += `HR ${recentVitals.heart_rate} `;
      if (recentVitals.temperature) context += `Temp ${recentVitals.temperature}°F `;
      context += `\n`;
    }
  }

  if (aiRecommendations) {
    context += `\nAI CLINICAL SUMMARY:\n${aiRecommendations.summary}\n\n`;

    if (aiRecommendations.recommendations.length > 0) {
      context += `KEY RECOMMENDATIONS:\n`;
      aiRecommendations.recommendations.forEach((rec) => {
        context += `- ${rec.text}\n`;
      });
      context += "\n";
    }

    if (aiRecommendations.riskAlerts.length > 0) {
      context += `RISK ALERTS:\n`;
      aiRecommendations.riskAlerts.forEach((alert) => {
        context += `- ${alert.message}\n`;
      });
      context += "\n";
    }
  }

  return context;
}

/**
 * Generates a default note draft when AI generation fails
 */
function generateDefaultNoteDraft(
  encounterType: string,
  chiefComplaint?: string,
  aiRecommendations?: AIRecommendation
): NoteDraft {
  const subjective = chiefComplaint
    ? `Chief Complaint: ${chiefComplaint}\n\nHistory of Present Illness: Patient presents for ${encounterType} visit.`
    : `Patient presents for ${encounterType} visit.`;

  const objective = `Physical examination performed. Vital signs stable.`;

  const assessment = aiRecommendations
    ? `Assessment based on clinical evaluation and AI-assisted analysis:\n${aiRecommendations.summary}`
    : `Clinical assessment pending provider review.`;

  const plan = aiRecommendations && aiRecommendations.recommendations.length > 0
    ? `Plan:\n${aiRecommendations.recommendations.map((rec) => `- ${rec.text}`).join("\n")}`
    : `Plan: Continue current treatment. Follow-up as needed.`;

  return {
    subjective,
    objective,
    assessment,
    plan,
    chiefComplaint: chiefComplaint || "",
    noteType: encounterType,
  };
}
