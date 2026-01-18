/**
 * AI Assistant API Route
 * Handles AI-powered clinical decision support and recommendations
 * Uses Anthropic Claude for real AI analysis
 */

import { NextResponse } from "next/server";
import { generateText } from "ai";
import type {
  AIRecommendation,
  AIAssistantRequest,
} from "@/types/ai-assistant";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import {
  aggregatePatientContext,
  formatPatientDataForPrompt,
} from "@/lib/services/patient-data-aggregator";
import { generateSpecialtyPrompt } from "@/lib/prompts/specialty-prompts";
import { processClinicalNotes } from "@/lib/services/note-processor";
import {
  generateSpecialtyRecommendations,
  formatSpecialtyRecommendations,
} from "@/lib/services/specialty-recommendations";
import {
  calculateAllRiskScores,
  formatRiskScores,
} from "@/lib/services/risk-calculators";
import {
  normalizeRole,
  getRoleFocusAreas,
  getRoleSystemPromptAddition,
} from "@/lib/services/role-context";
import {
  getCachedAnalysis,
  cacheAnalysis,
  generateDataHash,
} from "@/lib/services/ai-cache";
import { logRecommendation } from "@/lib/services/ai-feedback";
import { checkRateLimit, recordRequest } from "@/lib/services/rate-limiter";
import { checkCompliance } from "@/lib/services/compliance-checker";

/**
 * Helper to get specialty name from ID
 */
function getSpecialtyName(specialtyId: string): string {
  const specialtyNames: Record<string, string> = {
    "behavioral-health": "Behavioral Health / Substance Use Disorder",
    "primary-care": "Primary Care / Family Medicine",
    "psychiatry": "Psychiatry / Mental Health",
    "obgyn": "OB/GYN (Women's Health)",
    "cardiology": "Cardiology",
    "dermatology": "Dermatology",
    "urgent-care": "Urgent Care",
    "pediatrics": "Pediatrics",
    "podiatry": "Podiatry",
    "physical-therapy": "Physical Therapy",
    "occupational-therapy": "Occupational Therapy",
    "speech-therapy": "Speech Therapy",
    "chiropractic": "Chiropractic",
  };
  return specialtyNames[specialtyId] || "Primary Care";
}

/**
 * GET /api/ai-assistant
 * Fetch AI recommendations for a patient
 */
export async function GET(request: Request) {
  try {
    // Authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Role normalization and rate limiting
    const userRole = (user as any)?.role || (user as any)?.staff?.role || null;
    const normalizedRole = normalizeRole(userRole);
    const clinicId = (user as any)?.clinic_id || (user as any)?.staff?.clinic_id || null;
    const rateLimit = await checkRateLimit(user.id, clinicId, "ai_assistant");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `You have exceeded the rate limit of ${rateLimit.limit} requests per hour. Please try again after ${rateLimit.resetAt.toISOString()}.`,
          resetAt: rateLimit.resetAt.toISOString(),
          limit: rateLimit.limit,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const specialtyId = searchParams.get("specialtyId") || "primary-care";
    const encounterType = searchParams.get("encounterType");
    const chiefComplaint = searchParams.get("chiefComplaint");
    // Analysis type and focus areas
    const analysisType = (searchParams.get("analysisType") as "full" | "quick" | "specific") || "full";
    const focusAreasParam = searchParams.get("focusAreas");
    const focusAreas = focusAreasParam ? focusAreasParam.split(",").map((s) => s.trim()) : undefined;

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Determine whether to include detailed note analysis
    const includeNotes = analysisType !== "quick";
    // Aggregate patient data
    let patientContext;
    try {
      patientContext = await aggregatePatientContext(patientId, includeNotes, 5);
    } catch (error: any) {
      if (
        error?.code === "PGRST116" ||
        error?.message?.includes("No rows found") ||
        error?.message?.includes("Patient not found")
      ) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    // Process clinical notes if included
    let noteInsights = "";
    let noteSummary;
    if (includeNotes && patientContext.unstructured.recentNotes.length > 0) {
      try {
        const processed = await processClinicalNotes(
          patientContext.unstructured.recentNotes,
          specialtyId
        );
        noteSummary = processed.summary;
        noteInsights = `\n\nCLINICAL NOTES ANALYSIS:\n${processed.summary.summary}\n\nKey Findings: ${processed.summary.keyFindings.join(", ")}\nDiagnoses from Notes: ${processed.summary.diagnoses.join(", ")}\nConcerns: ${processed.summary.concerns.join(", ")}\nAssessment Scores: ${JSON.stringify(processed.summary.assessmentScores)}\nMissing Documentation: ${processed.summary.missingDocumentation.join(", ")}`;
      } catch (error) {
        console.error("Error processing notes:", error);
      }
    }

    // Generate specialty-specific context
    const specialtyRecs = generateSpecialtyRecommendations(
      specialtyId,
      patientContext.structured,
      noteSummary
    );
    const specialtyRecsText = formatSpecialtyRecommendations(specialtyRecs);
    const riskScores = calculateAllRiskScores(
      specialtyId,
      patientContext.structured,
      noteSummary
    );
    const riskScoresText = formatRiskScores(riskScores);
    const patientDataText =
      formatPatientDataForPrompt(patientContext) + noteInsights + specialtyRecsText + riskScoresText;

    // Generate cache key including analysisType and focusAreas
    const cacheKeyContext = patientDataText + JSON.stringify({ analysisType, focusAreas });
    const dataHash = generateDataHash(patientId, specialtyId, cacheKeyContext);
    const cached = await getCachedAnalysis(patientId, specialtyId, dataHash);
    if (cached) {
      const complianceResult = checkCompliance(
        cached.recommendations,
        patientContext.structured,
        specialtyId
      );
      return NextResponse.json({
        patientId,
        analysisType,
        focusAreas,
        recommendations: cached.recommendations,
        compliance: complianceResult,
        generatedAt: cached.generated_at,
        model: "claude-sonnet-4-20250514",
        cached: true,
      });
    }

    // Build prompts with role context
    const roleFocusAreas = getRoleFocusAreas(normalizedRole);
    const rolePromptAddition = getRoleSystemPromptAddition(normalizedRole);
    const { systemPrompt, userPrompt } = generateSpecialtyPrompt({
      patientData: patientDataText,
      specialtyId,
      specialtyName: getSpecialtyName(specialtyId),
      userRole: normalizedRole,
      encounterType: encounterType || undefined,
      chiefComplaint: chiefComplaint || undefined,
      roleContext: {
        role: normalizedRole,
        focusAreas: roleFocusAreas,
      },
    });
    const enhancedSystemPrompt = systemPrompt + "\n\n" + rolePromptAddition;

    // Call AI service
    const startTime = Date.now();
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: enhancedSystemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });
    const processingTime = Date.now() - startTime;

    // Parse AI response
    let recommendations: AIRecommendation;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      recommendations = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("[API] Failed to parse AI response:", parseError);
      console.error("[API] AI response text:", text);
      return NextResponse.json({
        patientId,
        analysisType,
        focusAreas,
        recommendations: {
          summary: "AI analysis completed but response format was invalid. Please try again.",
          riskAlerts: [
            {
              type: "warning" as const,
              message: "AI response parsing error - please retry the analysis",
            },
          ],
          recommendations: [],
          drugInteractions: { status: "no_major" as const, message: "Unable to analyze" },
          labOrders: [],
          differentialDiagnosis: [],
          preventiveGaps: [],
          educationTopics: [],
        },
        generatedAt: new Date().toISOString(),
        model: "claude-sonnet-4-20250514",
        processingTime,
        error: "Failed to parse AI response",
      });
    }

    // Apply filters based on analysisType and focusAreas
    let finalRecommendations: AIRecommendation = recommendations;
    if (analysisType === "quick") {
      finalRecommendations = {
        ...finalRecommendations,
        labOrders: [],
        differentialDiagnosis: [],
        preventiveGaps: [],
        educationTopics: [],
      };
    }
    if (analysisType === "specific" && focusAreas && focusAreas.length > 0) {
      finalRecommendations = {
        ...finalRecommendations,
        recommendations: finalRecommendations.recommendations.filter((rec) =>
          focusAreas.includes(rec.category)
        ),
      };
    }
    recommendations = finalRecommendations;

    // Cache and record
    await cacheAnalysis(patientId, specialtyId, dataHash, recommendations, 5);
    await recordRequest(user.id, clinicId, "ai_assistant");

    // Compliance check
    const complianceResult = checkCompliance(
      recommendations,
      patientContext.structured,
      specialtyId
    );

    // Log recommendations and collect IDs for feedback tracking
    const recommendationIds: Record<string, string> = {};
    try {
      for (let i = 0; i < recommendations.riskAlerts.length; i++) {
        const alert = recommendations.riskAlerts[i];
        const id = await logRecommendation(
          patientId,
          specialtyId,
          user.id,
          "risk_alert",
          alert.message,
          alert
        );
        recommendationIds[`alert-${i}`] = id;
      }
      for (let i = 0; i < recommendations.recommendations.length; i++) {
        const rec = recommendations.recommendations[i];
        const id = await logRecommendation(
          patientId,
          specialtyId,
          user.id,
          "recommendation",
          rec.text,
          rec
        );
        recommendationIds[`rec-${i}`] = id;
      }
      for (let i = 0; i < recommendations.labOrders.length; i++) {
        const lab = recommendations.labOrders[i];
        const id = await logRecommendation(
          patientId,
          specialtyId,
          user.id,
          "lab_order",
          `${lab.test}: ${lab.reason}`,
          lab
        );
        recommendationIds[`lab-${i}`] = id;
      }
      for (let i = 0; i < recommendations.differentialDiagnosis.length; i++) {
        const dx = recommendations.differentialDiagnosis[i];
        const id = await logRecommendation(
          patientId,
          specialtyId,
          user.id,
          "differential_diagnosis",
          `${dx.diagnosis} (${dx.probability})`,
          dx
        );
        recommendationIds[`dx-${i}`] = id;
      }
    } catch (logError) {
      // Don't fail if logging fails
      console.error("[API] Error logging recommendations:", logError);
    }

    return NextResponse.json(
      {
        patientId,
        analysisType,
        focusAreas,
        recommendations,
        recommendationIds,
        compliance: complianceResult,
        generatedAt: new Date().toISOString(),
        model: "claude-sonnet-4-20250514",
        processingTime,
        cached: false,
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": (rateLimit.remaining - 1).toString(),
          "X-RateLimit-Reset": Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
        },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] AI Assistant error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to get AI recommendations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-assistant
 * Request new AI analysis for a patient encounter
 */
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

    const userRole = (user as any)?.role || (user as any)?.staff?.role || null;
    const normalizedRole = normalizeRole(userRole);
    const clinicId = (user as any)?.clinic_id || (user as any)?.staff?.clinic_id || null;
    const rateLimit = await checkRateLimit(user.id, clinicId, "ai_assistant");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `You have exceeded the rate limit of ${rateLimit.limit} requests per hour. Please try again after ${rateLimit.resetAt.toISOString()}.`,
          resetAt: rateLimit.resetAt.toISOString(),
          limit: rateLimit.limit,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
          },
        }
      );
    }

    const body: AIAssistantRequest = await request.json();
    if (!body.patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const specialtyId = (body as any).specialtyId || "primary-care";
    const analysisType = (body.analysisType as "full" | "quick" | "specific") || "full";
    const focusAreas = body.focusAreas;

    // Determine whether to include detailed note analysis
    const includeNotes = analysisType !== "quick" && body.includeLabReview !== false;

    let patientContext;
    try {
      patientContext = await aggregatePatientContext(
        body.patientId,
        includeNotes,
        5
      );
    } catch (error: any) {
      if (
        error?.code === "PGRST116" ||
        error?.message?.includes("No rows found") ||
        error?.message?.includes("Patient not found")
      ) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    // Process clinical notes if included
    let noteInsights = "";
    let noteSummary;
    if (includeNotes && patientContext.unstructured.recentNotes.length > 0) {
      try {
        const processed = await processClinicalNotes(
          patientContext.unstructured.recentNotes,
          specialtyId
        );
        noteSummary = processed.summary;
        noteInsights = `\n\nCLINICAL NOTES ANALYSIS:\n${processed.summary.summary}\n\nKey Findings: ${processed.summary.keyFindings.join(", ")}\nDiagnoses from Notes: ${processed.summary.diagnoses.join(", ")}\nConcerns: ${processed.summary.concerns.join(", ")}\nAssessment Scores: ${JSON.stringify(processed.summary.assessmentScores)}\nMissing Documentation: ${processed.summary.missingDocumentation.join(", ")}`;
      } catch (error) {
        console.error("Error processing notes:", error);
      }
    }

    // Generate specialty-specific context
    const specialtyRecs = generateSpecialtyRecommendations(
      specialtyId,
      patientContext.structured,
      noteSummary
    );
    const specialtyRecsText = formatSpecialtyRecommendations(specialtyRecs);
    const riskScores = calculateAllRiskScores(
      specialtyId,
      patientContext.structured,
      noteSummary
    );
    const riskScoresText = formatRiskScores(riskScores);
    const patientDataText =
      formatPatientDataForPrompt(patientContext) + noteInsights + specialtyRecsText + riskScoresText;

    // Cache key includes analysisType and focusAreas
    const cacheKeyContext = patientDataText + JSON.stringify({ analysisType, focusAreas });
    const dataHash = generateDataHash(body.patientId, specialtyId, cacheKeyContext);
    const cached = await getCachedAnalysis(body.patientId, specialtyId, dataHash);
    if (cached) {
      const complianceResult = checkCompliance(
        cached.recommendations,
        patientContext.structured,
        specialtyId
      );
      return NextResponse.json({
        patientId: body.patientId,
        analysisType,
        focusAreas,
        recommendations: cached.recommendations,
        compliance: complianceResult,
        generatedAt: cached.generated_at,
        model: "claude-sonnet-4-20250514",
        cached: true,
      });
    }

    // Build prompts with role context
    const roleFocusAreas = getRoleFocusAreas(normalizedRole);
    const rolePromptAddition = getRoleSystemPromptAddition(normalizedRole);
    const { systemPrompt, userPrompt } = generateSpecialtyPrompt({
      patientData: patientDataText,
      specialtyId,
      specialtyName: getSpecialtyName(specialtyId),
      userRole: normalizedRole,
      encounterType: body.encounterType,
      chiefComplaint: body.chiefComplaint,
      roleContext: {
        role: normalizedRole,
        focusAreas: roleFocusAreas,
      },
    });
    const enhancedSystemPrompt = systemPrompt + "\n\n" + rolePromptAddition;

    // Call AI service
    const startTime = Date.now();
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: enhancedSystemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });
    const processingTime = Date.now() - startTime;

    // Parse AI response
    let recommendations: AIRecommendation;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      recommendations = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("[API] Failed to parse AI response:", parseError);
      console.error("[API] AI response text:", text);
      return NextResponse.json({
        patientId: body.patientId,
        analysisType,
        focusAreas,
        recommendations: {
          summary: "AI analysis completed but response format was invalid. Please try again.",
          riskAlerts: [
            {
              type: "warning" as const,
              message: "AI response parsing error - please retry the analysis",
            },
          ],
          recommendations: [],
          drugInteractions: { status: "no_major" as const, message: "Unable to analyze" },
          labOrders: [],
          differentialDiagnosis: [],
          preventiveGaps: [],
          educationTopics: [],
        },
        generatedAt: new Date().toISOString(),
        model: "claude-sonnet-4-20250514",
        processingTime,
        error: "Failed to parse AI response",
      });
    }

    // Apply filters based on analysisType and focusAreas
    let finalRecommendations: AIRecommendation = recommendations;
    if (analysisType === "quick") {
      finalRecommendations = {
        ...finalRecommendations,
        labOrders: [],
        differentialDiagnosis: [],
        preventiveGaps: [],
        educationTopics: [],
      };
    }
    if (analysisType === "specific" && focusAreas && focusAreas.length > 0) {
      finalRecommendations = {
        ...finalRecommendations,
        recommendations: finalRecommendations.recommendations.filter((rec) =>
          focusAreas.includes(rec.category)
        ),
      };
    }
    recommendations = finalRecommendations;

    // Cache and record
    await cacheAnalysis(body.patientId, specialtyId, dataHash, recommendations, 5);
    await recordRequest(user.id, clinicId, "ai_assistant");

    // Compliance check
    const complianceResult = checkCompliance(
      recommendations,
      patientContext.structured,
      specialtyId
    );

    // Log recommendations and collect IDs for feedback tracking
    const recommendationIds: Record<string, string> = {};
    try {
      for (let i = 0; i < recommendations.riskAlerts.length; i++) {
        const alert = recommendations.riskAlerts[i];
        const id = await logRecommendation(
          body.patientId,
          specialtyId,
          user.id,
          "risk_alert",
          alert.message,
          alert
        );
        recommendationIds[`alert-${i}`] = id;
      }
      for (let i = 0; i < recommendations.recommendations.length; i++) {
        const rec = recommendations.recommendations[i];
        const id = await logRecommendation(
          body.patientId,
          specialtyId,
          user.id,
          "recommendation",
          rec.text,
          rec
        );
        recommendationIds[`rec-${i}`] = id;
      }
      for (let i = 0; i < recommendations.labOrders.length; i++) {
        const lab = recommendations.labOrders[i];
        const id = await logRecommendation(
          body.patientId,
          specialtyId,
          user.id,
          "lab_order",
          `${lab.test}: ${lab.reason}`,
          lab
        );
        recommendationIds[`lab-${i}`] = id;
      }
      for (let i = 0; i < recommendations.differentialDiagnosis.length; i++) {
        const dx = recommendations.differentialDiagnosis[i];
        const id = await logRecommendation(
          body.patientId,
          specialtyId,
          user.id,
          "differential_diagnosis",
          `${dx.diagnosis} (${dx.probability})`,
          dx
        );
        recommendationIds[`dx-${i}`] = id;
      }
    } catch (logError) {
      console.error("[API] Error logging recommendations:", logError);
    }

    return NextResponse.json(
      {
        patientId: body.patientId,
        analysisType,
        focusAreas,
        recommendations,
        recommendationIds,
        compliance: complianceResult,
        generatedAt: new Date().toISOString(),
        model: "claude-sonnet-4-20250514",
        processingTime,
        cached: false,
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": (rateLimit.remaining - 1).toString(),
          "X-RateLimit-Reset": Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
        },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] AI Assistant analysis error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate AI analysis" },
      { status: 500 }
    );
  }
}