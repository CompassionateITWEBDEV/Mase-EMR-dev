/**
 * AI Assistant API Route
 * Handles AI-powered clinical decision support and recommendations
 *
 * Note: This is a mock implementation. In production, integrate with
 * OpenAI, Anthropic, or a specialized medical AI service.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type {
  AIRecommendation,
  AIAssistantRequest,
} from "@/types/ai-assistant";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

/**
 * GET /api/ai-assistant
 * Fetch cached AI recommendations for a patient
 */
export async function GET(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const patientId = searchParams.get("patientId");
    const encounterType = searchParams.get("encounterType");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Fetch patient data and recent history for context
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select(
        `
        id,
        first_name,
        last_name,
        date_of_birth,
        gender
      `
      )
      .eq("id", patientId)
      .single();

    if (patientError) {
      console.error("[API] Error fetching patient:", patientError);
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Fetch recent medications
    const { data: medications } = await supabase
      .from("medications")
      .select("id, medication_name, dosage, frequency, status")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .limit(10);

    // Generate mock AI recommendations based on patient data
    const recommendations = generateMockRecommendations(
      patient,
      medications || []
    );

    return NextResponse.json({
      patientId,
      recommendations,
      generatedAt: new Date().toISOString(),
      model: "mock-clinical-ai-v1",
    });
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
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const body: AIAssistantRequest = await request.json();

    if (!body.patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Fetch patient data
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, date_of_birth, gender")
      .eq("id", body.patientId)
      .single();

    if (patientError) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Fetch medications if requested
    let medications: Array<{ medication_name: string }> = [];
    if (body.includeMedicationReview !== false) {
      const { data } = await supabase
        .from("medications")
        .select("id, medication_name, dosage, frequency, status")
        .eq("patient_id", body.patientId)
        .eq("status", "active")
        .limit(20);
      medications = data || [];
    }

    // Generate analysis based on request parameters
    const analysis = generateMockAnalysis(patient, medications, body);

    return NextResponse.json({
      patientId: body.patientId,
      analysisType: body.analysisType || "quick",
      ...analysis,
      generatedAt: new Date().toISOString(),
      model: "mock-clinical-ai-v1",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] AI Assistant analysis error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate AI analysis" },
      { status: 500 }
    );
  }
}

// Mock recommendation generator returning AIRecommendation structure
function generateMockRecommendations(
  patient: { first_name: string; last_name: string; date_of_birth: string },
  medications: Array<{ medication_name: string }>
): AIRecommendation {
  const age = calculateAge(patient.date_of_birth);
  const patientName = `${patient.first_name} ${patient.last_name}`;

  const recommendation: AIRecommendation = {
    summary: `${patientName} is a ${age}-year-old patient with ${medications.length} active medications.`,
    riskAlerts: [],
    recommendations: [],
    drugInteractions: {
      status: "no_major",
      message: "No major interactions detected",
    },
    labOrders: [],
    differentialDiagnosis: [],
    preventiveGaps: [],
    educationTopics: [],
  };

  // Age-based preventive care recommendations
  if (age >= 50 && age < 75) {
    recommendation.preventiveGaps.push({
      measure: "Colorectal Cancer Screening",
      status: "overdue",
      days: 365,
      action: "Order colonoscopy",
    });
    recommendation.recommendations.push({
      category: "Preventive Care",
      color: "border-blue-500",
      text: "Order colorectal cancer screening - USPSTF Grade A recommendation for adults 50-75",
    });
  }

  if (age >= 40) {
    recommendation.labOrders.push({
      test: "Lipid Panel",
      reason: "Cardiovascular risk assessment",
      urgency: "Routine",
    });
  }

  // Medication-based recommendations
  if (medications.length > 5) {
    recommendation.riskAlerts.push({
      type: "warning",
      message: `Polypharmacy detected: ${medications.length} active medications. Consider comprehensive medication review.`,
    });
  }

  // Drug interactions for multiple medications
  if (medications.length > 1) {
    const drug1 = medications[0]?.medication_name || "Drug A";
    const drug2 = medications[1]?.medication_name || "Drug B";
    recommendation.drugInteractions = {
      status: "minor",
      message: "Minor interaction detected - monitor patient",
      interactions: [
        {
          drug1,
          drug2,
          severity: "moderate",
          description: "Mock interaction - review clinical significance",
          action: "Monitor patient closely",
        },
      ],
    };
  }

  // General education topics
  recommendation.educationTopics = [
    "Medication adherence",
    "Lifestyle modifications",
    "Follow-up care importance",
  ];

  return recommendation;
}

// Mock analysis generator
function generateMockAnalysis(
  patient: { first_name: string; last_name: string },
  medications: Array<{ medication_name: string }>,
  request: AIAssistantRequest
): AIRecommendation {
  const recommendation = generateMockRecommendations(
    { ...patient, date_of_birth: "1970-01-01" },
    medications
  );

  // Add chief complaint context if provided
  if (request.chiefComplaint) {
    recommendation.summary += ` Chief complaint: ${request.chiefComplaint}.`;
    recommendation.differentialDiagnosis.push({
      diagnosis: "To be determined based on evaluation",
      probability: "Consider",
      type: "secondary",
    });
  }

  return recommendation;
}

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
