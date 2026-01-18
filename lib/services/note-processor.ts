/**
 * Clinical Notes Processing Service
 * Summarizes and extracts insights from unstructured clinical notes
 */

import { generateText } from "ai";

export interface NoteSummary {
  keyFindings: string[];
  diagnoses: string[];
  concerns: string[];
  assessmentScores: {
    phq9?: number;
    gad7?: number;
    cows?: number;
    ciwa?: number;
    [key: string]: number | undefined;
  };
  missingDocumentation: string[];
  timeline: Array<{
    date: string;
    event: string;
  }>;
  summary: string;
}

export interface ProcessedNote {
  id: string;
  note_type: string;
  created_at: string;
  summary: NoteSummary;
}

/**
 * Summarizes a single clinical note using AI
 */
export async function summarizeNote(
  noteText: string,
  noteType: string = "progress"
): Promise<string> {
  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `You are an expert clinical documentation assistant. Your role is to provide concise, accurate summaries of clinical notes while preserving all critical medical information.`,
      prompt: `Please provide a concise clinical summary (2-3 sentences) of the following ${noteType} note. Focus on key findings, diagnoses, and treatment plans:

${noteText}

Summary:`,
      temperature: 0.2,
    });

    return text.trim();
  } catch (error) {
    console.error("Error summarizing note:", error);
    return "Unable to summarize note";
  }
}

/**
 * Extracts structured insights from clinical notes using AI
 */
export async function extractNoteInsights(
  notes: Array<{
    id: string;
    note_type: string;
    created_at: string;
    fullText: string;
  }>,
  specialtyId?: string
): Promise<NoteSummary> {
  if (notes.length === 0) {
    return {
      keyFindings: [],
      diagnoses: [],
      concerns: [],
      assessmentScores: {},
      missingDocumentation: [],
      timeline: [],
      summary: "No clinical notes available for analysis.",
    };
  }

  // Combine all notes into a single text for analysis
  const combinedNotes = notes
    .map(
      (note, idx) =>
        `--- Note ${idx + 1} (${note.note_type}, ${note.created_at}) ---\n${note.fullText}`
    )
    .join("\n\n");

  // Build specialty-specific extraction prompt
  const specialtyContext = getSpecialtyExtractionContext(specialtyId);

  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `You are an expert clinical documentation analyst. Your role is to extract structured insights from clinical notes, including key findings, diagnoses, assessment scores, and documentation gaps.

${specialtyContext}

Return ONLY a valid JSON object with this exact structure:
{
  "keyFindings": ["finding1", "finding2"],
  "diagnoses": ["diagnosis1", "diagnosis2"],
  "concerns": ["concern1", "concern2"],
  "assessmentScores": {
    "phq9": 15,
    "gad7": 8,
    "cows": 5,
    "ciwa": 3
  },
  "missingDocumentation": ["missing item 1", "missing item 2"],
  "timeline": [
    {"date": "2024-01-15", "event": "Event description"}
  ],
  "summary": "Overall summary of notes"
}`,
      prompt: `Analyze the following clinical notes and extract structured insights:

${combinedNotes}

Extract:
1. Key findings and clinical observations
2. Diagnoses mentioned or implied
3. Clinical concerns or red flags
4. Assessment scores (PHQ-9, GAD-7, COWS, CIWA, etc.) - extract numeric values
5. Missing documentation (e.g., suicide risk assessment, treatment plan updates)
6. Timeline of significant events
7. Overall summary (2-3 sentences)

Return the results as JSON.`,
      temperature: 0.2,
    });

    // Parse JSON response
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      const parsed = JSON.parse(jsonText) as NoteSummary;

      // Validate and clean the parsed data
      return {
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
        diagnoses: Array.isArray(parsed.diagnoses) ? parsed.diagnoses : [],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
        assessmentScores: parsed.assessmentScores || {},
        missingDocumentation: Array.isArray(parsed.missingDocumentation)
          ? parsed.missingDocumentation
          : [],
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
        summary: parsed.summary || "Unable to generate summary",
      };
    } catch (parseError) {
      console.error("Error parsing note insights:", parseError);
      console.error("AI response:", text);
      // Fallback to basic summary
      return {
        keyFindings: [],
        diagnoses: [],
        concerns: [],
        assessmentScores: {},
        missingDocumentation: [],
        timeline: [],
        summary: await summarizeNote(combinedNotes),
      };
    }
  } catch (error) {
    console.error("Error extracting note insights:", error);
    return {
      keyFindings: [],
      diagnoses: [],
      concerns: [],
      assessmentScores: {},
      missingDocumentation: [],
      timeline: [],
      summary: "Error processing notes",
    };
  }
}

/**
 * Gets specialty-specific context for note extraction
 */
function getSpecialtyExtractionContext(specialtyId?: string): string {
  const contexts: Record<string, string> = {
    "behavioral-health": `For Behavioral Health/SUD notes, pay special attention to:
- UDS (urine drug screen) results and patterns
- COWS (Clinical Opiate Withdrawal Scale) scores
- CIWA (Clinical Institute Withdrawal Assessment) scores
- Relapse indicators and risk factors
- Treatment compliance and attendance
- 42 CFR Part 2 documentation requirements
- OTP phase advancement indicators`,
    psychiatry: `For Psychiatry/Mental Health notes, pay special attention to:
- PHQ-9 (Patient Health Questionnaire-9) depression scores
- GAD-7 (Generalized Anxiety Disorder-7) anxiety scores
- Suicide risk assessment documentation
- Medication side effects and adherence
- Treatment response and symptom changes
- Therapy progress and engagement`,
    "primary-care": `For Primary Care notes, pay special attention to:
- Chronic disease management indicators
- Preventive care gaps
- Medication adherence
- Vital sign trends
- Lab result follow-ups
- Referral needs`,
    "physical-therapy": `For Physical Therapy notes, pay special attention to:
- Range of motion measurements
- Functional assessment scores
- Progress toward therapy goals
- Re-evaluation timing
- Discharge readiness indicators`,
    "occupational-therapy": `For Occupational Therapy notes, pay special attention to:
- ADL (Activities of Daily Living) assessments
- Functional independence measures
- Home safety concerns
- Adaptive equipment needs`,
    "speech-therapy": `For Speech Therapy notes, pay special attention to:
- Swallowing assessment results
- Communication assessment scores
- Diet modifications
- Alternative communication strategies`,
  };

  return (
    contexts[specialtyId || ""] ||
    "Extract all relevant clinical information, assessment scores, diagnoses, and concerns."
  );
}

/**
 * Processes multiple notes and returns a comprehensive summary
 */
export async function processClinicalNotes(
  notes: Array<{
    id: string;
    note_type: string;
    created_at: string;
    fullText: string;
  }>,
  specialtyId?: string
): Promise<{
  summary: NoteSummary;
  processedNotes: ProcessedNote[];
}> {
  // Extract insights from all notes together
  const summary = await extractNoteInsights(notes, specialtyId);

  // Optionally summarize each note individually (for detailed view)
  const processedNotes = await Promise.all(
    notes.map(async (note) => {
      const noteSummary = await summarizeNote(note.fullText, note.note_type);
      return {
        id: note.id,
        note_type: note.note_type,
        created_at: note.created_at,
        summary: {
          ...summary,
          summary: noteSummary, // Individual note summary
        },
      };
    })
  );

  return {
    summary,
    processedNotes,
  };
}

/**
 * Checks for missing documentation based on specialty requirements
 */
export function checkMissingDocumentation(
  notes: Array<{ fullText: string; note_type: string }>,
  specialtyId?: string
): string[] {
  const missing: string[] = [];

  // Combine all note text
  const allText = notes.map((n) => n.fullText).join(" ").toLowerCase();

  // Specialty-specific checks
  if (specialtyId === "psychiatry" || specialtyId === "behavioral-health") {
    if (!allText.includes("suicide") && !allText.includes("risk assessment")) {
      missing.push("Suicide risk assessment");
    }
    if (!allText.includes("phq-9") && !allText.includes("phq9")) {
      missing.push("PHQ-9 depression screening");
    }
  }

  if (specialtyId === "behavioral-health") {
    if (!allText.includes("cows") && !allText.includes("withdrawal")) {
      missing.push("COWS withdrawal assessment");
    }
    if (!allText.includes("uds") && !allText.includes("urine drug")) {
      missing.push("Urine drug screen results");
    }
    if (!allText.includes("42 cfr") && !allText.includes("part 2")) {
      missing.push("42 CFR Part 2 consent documentation");
    }
  }

  if (specialtyId === "primary-care") {
    if (!allText.includes("vital") && !allText.includes("blood pressure")) {
      missing.push("Vital signs documentation");
    }
  }

  return missing;
}

/**
 * Parses assessment scores from note text
 */
export function parseAssessmentScores(noteText: string): {
  phq9?: number;
  gad7?: number;
  cows?: number;
  ciwa?: number;
  [key: string]: number | undefined;
} {
  const scores: Record<string, number | undefined> = {};
  const text = noteText.toLowerCase();

  // PHQ-9 pattern: "phq-9: 15" or "phq9 score: 15" or "phq-9 of 15"
  const phq9Match = text.match(/phq-?9[:\s]+(\d+)/i);
  if (phq9Match) {
    scores.phq9 = parseInt(phq9Match[1], 10);
  }

  // GAD-7 pattern
  const gad7Match = text.match(/gad-?7[:\s]+(\d+)/i);
  if (gad7Match) {
    scores.gad7 = parseInt(gad7Match[1], 10);
  }

  // COWS pattern
  const cowsMatch = text.match(/cows[:\s]+(\d+)/i);
  if (cowsMatch) {
    scores.cows = parseInt(cowsMatch[1], 10);
  }

  // CIWA pattern
  const ciwaMatch = text.match(/ciwa[:\s]+(\d+)/i);
  if (ciwaMatch) {
    scores.ciwa = parseInt(ciwaMatch[1], 10);
  }

  return scores;
}
