import { NextResponse } from "next/server";
import { aggregatePatientContext, formatPatientDataForPrompt } from "@/lib/services/patient-data-aggregator";
import { generateText } from "ai";

/**
 * API endpoint to generate predictive insights for a patient.
 *
 * This route aggregates structured patient data (demographics, medications,
 * problems, allergies, vitals, encounters, etc.) and uses an AI model to
 * forecast future risks such as disease progression, readmission risk or
 * emergent complications. The AI is instructed to return a JSON object
 * wrapped in a markdown ```json code block with an array of insights. Each
 * insight should include:
 *   - category: name of the risk category (e.g. "Cardiovascular Risk")
 *   - level: one of "low", "moderate", or "high"
 *   - description: short free‑text description of why the risk is present
 *   - recommendedActions: array of recommended actions to mitigate the risk
 *
 * Clients can POST a JSON body with { patientId } or call GET with a
 * patientId query parameter. The response is { insights: Insight[] } or an
 * error object.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const patientId = url.searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }
  return handlePredictiveInsights(patientId);
}

export async function POST(req: Request) {
  try {
    const { patientId } = await req.json();
    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }
    return handlePredictiveInsights(patientId);
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

async function handlePredictiveInsights(patientId: string) {
  try {
    // Aggregate structured patient data; we exclude notes for performance.
    const patientContext = await aggregatePatientContext({
      patientId,
      includeNotes: false,
    } as any);
    // Format the structured data into a succinct string for the AI prompt.
    const patientDataString = formatPatientDataForPrompt(patientContext);
    // Compose prompt instructing the model to produce predictive insights.
    const prompt = [
      "You are an AI clinical assistant tasked with forecasting future health risks for a patient.",
      "Based on the following structured patient data, identify any significant risks of disease progression, readmission, or complications.",
      "For each identified risk, provide a category name, a risk level (low/moderate/high), a brief description explaining why the patient is at risk, and a list of recommended actions or interventions to mitigate it.",
      "Return ONLY valid JSON wrapped in a markdown ```json code block. The JSON format should be {\"insights\": [ {\"category\": \"\", \"level\": \"\", \"description\": \"\", \"recommendedActions\": [\"\", ...] }, ... ]}. Do not include any additional commentary.",
      "",
      patientDataString,
    ].join("\n\n");
    // Generate AI response. Destructure the returned text from the generateText result.
    const { text: aiText } = await generateText({
      prompt,
      maxTokens: 800,
    } as any);
    // Extract JSON from markdown code block
    const jsonMatch = aiText.match(/```json\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : aiText;
    let insights;
    try {
      insights = JSON.parse(jsonString);
    } catch (error) {
      return NextResponse.json(
        { error: "AI response parsing error", raw: aiText },
        { status: 500 },
      );
    }
    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error generating predictive insights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
