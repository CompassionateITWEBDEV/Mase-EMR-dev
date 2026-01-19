/**
 * Clinical Note Draft Generation API
 * Generates draft SOAP notes from AI analysis.
 *
 * This implementation supports providing a previously generated AIRecommendation
 * directly in the request body to avoid redundant analysis calls. When an
 * existing recommendation is not supplied, the route will call the
 * `/api/ai-assistant` endpoint using any provided analysisType and focusAreas
 * to obtain fresh recommendations before generating the note draft.
 */

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { generateNoteDraft } from "@/lib/services/note-draft-generator";
import { aggregatePatientContext } from "@/lib/services/patient-data-aggregator";
import type { AIRecommendation } from "@/types/ai-assistant";

interface NoteDraftRequestBody {
  patientId: string;
  specialtyId: string;
  encounterType: string;
  chiefComplaint?: string;
  analysisType?: "full" | "quick" | "specific";
  focusAreas?: string[];
  /**
   * Optionally provide AI recommendations obtained earlier. When supplied,
   * the route will skip calling the AI assistant endpoint and use these
   * recommendations directly to build the note draft.
   */
  aiRecommendations?: AIRecommendation;
}

export async function POST(request: Request) {
  try {
    // Authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as NoteDraftRequestBody;
    const {
      patientId,
      specialtyId,
      encounterType,
      chiefComplaint,
      analysisType,
      focusAreas,
      aiRecommendations,
    } = body;

    if (!patientId || !specialtyId || !encounterType) {
      return NextResponse.json(
        { error: "Patient ID, Specialty ID, and Encounter Type are required" },
        { status: 400 }
      );
    }

    // Retrieve patient context to supply structured data for the note. We
    // intentionally limit the number of recent notes to 3 for efficiency in
    // note drafting.
    const patientContext = await aggregatePatientContext(patientId, true, 3);

    // Decide on which AI recommendations to use. Clients may provide
    // recommendations they already obtained from the AI assistant. If not
    // provided, we call the internal AI assistant endpoint with any
    // provided analysisType and focusAreas to generate them.
    let recommendations: AIRecommendation | undefined;
    if (aiRecommendations) {
      recommendations = aiRecommendations;
    } else {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const params = new URLSearchParams({ patientId, specialtyId });
        if (analysisType) params.set("analysisType", analysisType);
        if (focusAreas && focusAreas.length > 0) {
          params.set("focusAreas", focusAreas.join(","));
        }
        const fetchUrl = `${baseUrl}/api/ai-assistant?${params.toString()}`;
        const aiResponse = await fetch(fetchUrl, {
          headers: {
            Cookie: request.headers.get("Cookie") || "",
          },
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          recommendations = (aiData.recommendations || aiData) as AIRecommendation;
        }
      } catch (error) {
        console.error("[API] Error calling AI assistant for note draft:", error);
      }
    }

    // Generate note draft using the recommendations (which may be undefined).
    // If recommendations are undefined, generateNoteDraft will fall back to
    // simplified defaults internally.
    const noteDraft = await generateNoteDraft(
      patientId,
      specialtyId,
      encounterType,
      chiefComplaint,
      recommendations,
      patientContext.structured
    );

    return NextResponse.json({
      success: true,
      noteDraft,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Note draft generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate note draft" },
      { status: 500 }
    );
  }
}