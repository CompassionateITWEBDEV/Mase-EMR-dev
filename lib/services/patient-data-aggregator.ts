/**
 * Patient Data Aggregator Service
 * Collects structured and unstructured patient data for AI analysis
 */

import { createClient } from "@/lib/supabase/server";

export interface StructuredPatientData {
  demographics: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender?: string;
    age: number;
  };
  medications: Array<{
    id: string;
    medication_name: string;
    dosage?: string;
    frequency?: string;
    status: string;
  }>;
  problems: Array<{
    id: string;
    diagnosis: string;
    icd_code?: string;
    status: string;
  }>;
  allergies: Array<{
    id: string;
    allergen: string;
    reaction?: string;
    severity?: string;
  }>;
  labResults: Array<{
    id: string;
    test_name: string;
    result_value?: string;
    result_date: string;
    status?: string;
  }>;
  vitalSigns: Array<{
    id: string;
    measurement_date: string;
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    bmi?: number;
  }>;
  encounters: Array<{
    id: string;
    encounter_date: string;
    encounter_type?: string;
    chief_complaint?: string;
  }>;
  treatmentPlans: Array<{
    id: string;
    status: string;
    created_at: string;
    goals?: any;
  }>;
}

export interface UnstructuredPatientData {
  recentNotes: Array<{
    id: string;
    note_type: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    created_at: string;
    fullText: string;
  }>;
  noteSummary?: string;
}

export interface AggregatedPatientContext {
  structured: StructuredPatientData;
  unstructured: UnstructuredPatientData;
}

/**
 * Calculates patient age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Aggregates structured patient data from EHR
 */
export async function aggregatePatientStructuredData(
  patientId: string
): Promise<StructuredPatientData> {
  const supabase = await createClient();

  // Fetch all structured data in parallel
  const [
    { data: patient, error: patientError },
    { data: medications },
    { data: problems },
    { data: allergies },
    { data: labResults },
    { data: vitalSigns },
    { data: encounters },
    { data: treatmentPlans },
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("id, first_name, last_name, date_of_birth, gender")
      .eq("id", patientId)
      .single(),
    supabase
      .from("medications")
      .select("id, medication_name, dosage, frequency, status")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("problems")
      .select("id, diagnosis, icd_code, status")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("allergies")
      .select("id, allergen, reaction, severity")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("lab_results")
      .select("id, test_name, result_value, result_date, status")
      .eq("patient_id", patientId)
      .order("result_date", { ascending: false })
      .limit(20),
    supabase
      .from("vital_signs")
      .select(
        "id, measurement_date, blood_pressure, heart_rate, temperature, weight, height, bmi"
      )
      .eq("patient_id", patientId)
      .order("measurement_date", { ascending: false })
      .limit(30),
    supabase
      .from("encounters")
      .select("id, encounter_date, encounter_type, chief_complaint")
      .eq("patient_id", patientId)
      .order("encounter_date", { ascending: false })
      .limit(10),
    supabase
      .from("treatment_plans")
      .select("id, status, created_at, goals")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (patientError || !patient) {
    throw new Error(`Patient not found: ${patientError?.message}`);
  }

  const age = calculateAge(patient.date_of_birth);

  return {
    demographics: {
      ...patient,
      age,
    },
    medications: medications || [],
    problems: problems || [],
    allergies: allergies || [],
    labResults: labResults || [],
    vitalSigns: vitalSigns || [],
    encounters: encounters || [],
    treatmentPlans: treatmentPlans || [],
  };
}

/**
 * Aggregates unstructured patient data (clinical notes)
 */
export async function aggregatePatientUnstructuredData(
  patientId: string,
  limit: number = 5
): Promise<UnstructuredPatientData> {
  const supabase = await createClient();

  // Fetch recent progress notes
  const { data: notes, error: notesError } = await supabase
    .from("progress_notes")
    .select(
      "id, note_type, subjective, objective, assessment, plan, created_at"
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (notesError) {
    console.error("Error fetching notes:", notesError);
    return { recentNotes: [] };
  }

  // Combine note sections into full text
  const recentNotes =
    notes?.map((note) => {
      const sections = [
        note.subjective,
        note.objective,
        note.assessment,
        note.plan,
      ]
        .filter(Boolean)
        .join("\n\n");

      return {
        id: note.id,
        note_type: note.note_type || "progress",
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        created_at: note.created_at,
        fullText: sections,
      };
    }) || [];

  // Process notes to extract insights (optional - can be done async)
  let noteSummary: string | undefined;
  if (recentNotes.length > 0) {
    try {
      const { processClinicalNotes } = await import("./note-processor");
      const processed = await processClinicalNotes(recentNotes);
      noteSummary = processed.summary.summary;
    } catch (error) {
      console.error("Error processing notes for summary:", error);
      // Continue without summary
    }
  }

  return {
    recentNotes,
    noteSummary,
  };
}

/**
 * Aggregates complete patient context (structured + unstructured)
 */
export async function aggregatePatientContext(
  patientId: string,
  includeNotes: boolean = true,
  noteLimit: number = 5
): Promise<AggregatedPatientContext> {
  const [structured, unstructured] = await Promise.all([
    aggregatePatientStructuredData(patientId),
    includeNotes
      ? aggregatePatientUnstructuredData(patientId, noteLimit)
      : Promise.resolve({ recentNotes: [] }),
  ]);

  return {
    structured,
    unstructured,
  };
}

/**
 * Formats patient data into a text summary for AI prompts
 */
export function formatPatientDataForPrompt(
  context: AggregatedPatientContext
): string {
  const { structured, unstructured } = context;
  const { demographics, medications, problems, allergies, labResults, vitalSigns, encounters, treatmentPlans } = structured;

  let summary = `PATIENT DEMOGRAPHICS:\n`;
  summary += `Name: ${demographics.first_name} ${demographics.last_name}\n`;
  summary += `Age: ${demographics.age} years\n`;
  summary += `Date of Birth: ${demographics.date_of_birth}\n`;
  if (demographics.gender) {
    summary += `Gender: ${demographics.gender}\n`;
  }

  summary += `\nACTIVE MEDICATIONS (${medications.length}):\n`;
  medications.forEach((med) => {
    summary += `- ${med.medication_name}`;
    if (med.dosage) summary += ` ${med.dosage}`;
    if (med.frequency) summary += ` ${med.frequency}`;
    summary += `\n`;
  });

  summary += `\nACTIVE PROBLEMS/DIAGNOSES (${problems.length}):\n`;
  problems.forEach((prob) => {
    summary += `- ${prob.diagnosis}`;
    if (prob.icd_code) summary += ` (${prob.icd_code})`;
    summary += `\n`;
  });

  if (allergies.length > 0) {
    summary += `\nALLERGIES (${allergies.length}):\n`;
    allergies.forEach((allergy) => {
      summary += `- ${allergy.allergen}`;
      if (allergy.reaction) summary += `: ${allergy.reaction}`;
      if (allergy.severity) summary += ` (${allergy.severity})`;
      summary += `\n`;
    });
  }

  if (labResults.length > 0) {
    summary += `\nRECENT LAB RESULTS (last ${labResults.length}):\n`;
    labResults.slice(0, 10).forEach((lab) => {
      summary += `- ${lab.test_name}`;
      if (lab.result_value) summary += `: ${lab.result_value}`;
      summary += ` (${lab.result_date})\n`;
    });
  }

  if (vitalSigns.length > 0) {
    summary += `\nRECENT VITAL SIGNS (last ${vitalSigns.length}):\n`;
    vitalSigns.slice(0, 10).forEach((vital) => {
      summary += `- ${vital.measurement_date}:`;
      if (vital.blood_pressure) summary += ` BP: ${vital.blood_pressure}`;
      if (vital.heart_rate) summary += ` HR: ${vital.heart_rate}`;
      if (vital.temperature) summary += ` Temp: ${vital.temperature}°F`;
      if (vital.weight) summary += ` Weight: ${vital.weight} lbs`;
      if (vital.bmi) summary += ` BMI: ${vital.bmi}`;
      summary += `\n`;
    });
  }

  if (encounters.length > 0) {
    summary += `\nRECENT ENCOUNTERS (last ${encounters.length}):\n`;
    encounters.forEach((enc) => {
      summary += `- ${enc.encounter_date}`;
      if (enc.encounter_type) summary += ` (${enc.encounter_type})`;
      if (enc.chief_complaint) summary += `: ${enc.chief_complaint}`;
      summary += `\n`;
    });
  }

  if (treatmentPlans.length > 0) {
    summary += `\nTREATMENT PLANS (${treatmentPlans.length}):\n`;
    treatmentPlans.forEach((plan) => {
      summary += `- Status: ${plan.status}, Created: ${plan.created_at}\n`;
    });
  }

  if (unstructured.recentNotes.length > 0) {
    summary += `\nRECENT CLINICAL NOTES (last ${unstructured.recentNotes.length}):\n`;
    unstructured.recentNotes.forEach((note, idx) => {
      summary += `\n--- Note ${idx + 1} (${note.note_type}, ${note.created_at}) ---\n`;
      if (note.subjective) summary += `Subjective: ${note.subjective}\n`;
      if (note.objective) summary += `Objective: ${note.objective}\n`;
      if (note.assessment) summary += `Assessment: ${note.assessment}\n`;
      if (note.plan) summary += `Plan: ${note.plan}\n`;
    });
  }

  return summary;
}
