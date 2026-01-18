/**
 * Treatment Plan Generation API
 * Generates treatment plan drafts from AI analysis
 *
 * This endpoint has been enhanced to better support different analysis modes
 * (full, quick, specific) and to avoid redundant calls to the main AI
 * assistant. Clients may optionally supply a previously generated
 * AIRecommendation object when creating a treatment plan. If a prior
 * recommendation is not provided, the route will call the primary
 * `/api/ai-assistant` endpoint with any supplied analysisType and
 * focusAreas to generate fresh recommendations. The generated plan is
 * returned alongside a timestamp.
 */

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { generateTreatmentPlanDraft } from "@/lib/services/treatment-plan-generator";
import { aggregatePatientContext } from "@/lib/services/patient-data-aggregator";
import { processClinicalNotes } from "@/lib/services/note-processor";
import type { AIRecommendation } from "@/types/ai-assistant";

interface TreatmentPlanRequestBody {
  patientId: string;
  specialtyId: string;
  analysisType?: "full" | "quick" | "specific";
  focusAreas?: string[];
  /**
   * Optionally provide a previously generated AIRecommendation to avoid
   * regenerating the full analysis. If provided, the assistant will
   * skip calling the /api/ai-assistant endpoint and use this
   * recommendation directly.
   */
  aiRecommendations?: AIRecommendation;
}

export async function POST(request: Request) {
  try {
    // Ensure the user is authenticated
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as TreatmentPlanRequestBody;
    const { patientId, specialtyId, analysisType, focusAreas, aiRecommendations } = body;

    if (!patientId || !specialtyId) {
      return NextResponse.json(
        { error: "Patient ID and Specialty ID are required" },
        { status: 400 }
      );
    }

    // Fetch patient context for building the treatment plan. We retrieve up to
    // 5 recent notes so that the draft can reference note summaries when
    // available. Note summaries are optional in quick analyses, but they
    // provide valuable context for treatment planning.
    const patientContext = await aggregatePatientContext(patientId, true, 5);

    // Optionally process clinical notes into a summary for inclusion in the
    // treatment plan. We only attempt this if recent notes exist.
    let noteSummary;
    if (patientContext.unstructured.recentNotes.length > 0) {
      try {
        const processed = await processClinicalNotes(
          patientContext.unstructured.recentNotes,
          specialtyId
        );
        noteSummary = processed.summary;
      } catch (error) {
        console.error("[API] Error processing notes:", error);
      }
    }

    // Determine the AI recommendations to use. If the client supplied
    // aiRecommendations in the request body, use those directly. Otherwise
    // call the primary AI assistant endpoint, passing along analysisType
    // and focusAreas as query parameters. We retain the request's cookie
    // header when making internal calls so that authentication/context is
    // preserved.
    let recommendations: AIRecommendation;
    if (aiRecommendations) {
      recommendations = aiRecommendations;
    } else {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        // Build query parameters. We include analysisType and focusAreas only
        // when they are defined to avoid sending empty values.
        const params = new URLSearchParams({ patientId, specialtyId });
        if (analysisType) params.set("analysisType", analysisType);
        if (focusAreas && focusAreas.length > 0) {
          // Send focus areas as a comma-separated list. The downstream route
          // will split and decode this value.
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
          // The enhanced ai-assistant route returns recommendations in the
          // `recommendations` field for backwards compatibility. If not
          // present, fall back to aiData itself assuming it matches the
          // AIRecommendation shape.
          recommendations = (aiData.recommendations || aiData) as AIRecommendation;
        } else {
          // If the call fails, use a basic placeholder recommendation.
          recommendations = {
            summary: `Treatment plan for ${patientContext.structured.demographics.first_name} ${patientContext.structured.demographics.last_name}`,
            riskAlerts: [],
            recommendations: [],
            drugInteractions: { status: "no_major", message: "No major interactions" },
            labOrders: [],
            differentialDiagnosis: [],
            preventiveGaps: [],
            educationTopics: [],
          };
        }
      } catch (error) {
        console.error("[API] Error calling AI assistant:", error);
        recommendations = {
          summary: `Treatment plan for ${patientContext.structured.demographics.first_name} ${patientContext.structured.demographics.last_name}`,
          riskAlerts: [],
          recommendations: [],
          drugInteractions: { status: "no_major", message: "No major interactions" },
          labOrders: [],
          differentialDiagnosis: [],
          preventiveGaps: [],
          educationTopics: [],
        };
      }
    }

    // Generate treatment plan draft using the determined recommendations and
    // patient context. Note that noteSummary is optional and will be
    // undefined if no clinical notes were processed.
    const treatmentPlan = await generateTreatmentPlanDraft(
      patientId,
      specialtyId,
      recommendations,
      patientContext.structured,
      noteSummary
    );

    return NextResponse.json({
      success: true,
      treatmentPlan,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Treatment plan generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate treatment plan" },
      { status: 500 }
    );
  }
}