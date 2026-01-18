/**
 * Drug Interactions API Route
 * Checks for potential drug-drug interactions
 *
 * Note: This is a mock implementation. In production, integrate with
 * a drug interaction database like DrugBank, RxNorm, or similar.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type {
  DrugInteractionResult,
  DrugInteraction,
} from "@/types/ai-assistant";

/**
 * GET /api/ai-assistant/drug-interactions
 * Check drug interactions for a patient's medications
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const patientId = searchParams.get("patientId");
    const medicationIds = searchParams.get("medicationIds")?.split(",");

    if (!patientId && !medicationIds) {
      return NextResponse.json(
        { error: "Either patientId or medicationIds is required" },
        { status: 400 }
      );
    }

    let medications: Array<{ id: string; medication_name: string }> = [];

    if (patientId) {
      // Fetch active medications for patient
      const { data, error } = await supabase
        .from("medications")
        .select("id, medication_name")
        .eq("patient_id", patientId)
        .eq("status", "active");

      if (error) {
        console.error("[API] Error fetching medications:", error);
        return NextResponse.json(
          { error: "Failed to fetch medications" },
          { status: 500 }
        );
      }
      medications = data || [];
    } else if (medicationIds) {
      // Fetch specific medications by ID
      const { data, error } = await supabase
        .from("medications")
        .select("id, medication_name")
        .in("id", medicationIds);

      if (error) {
        console.error("[API] Error fetching medications:", error);
        return NextResponse.json(
          { error: "Failed to fetch medications" },
          { status: 500 }
        );
      }
      medications = data || [];
    }

    // Generate mock drug interaction check
    const result = checkDrugInteractions(medications);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Drug interaction check error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to check drug interactions" },
      { status: 500 }
    );
  }
}

/**
 * Mock drug interaction checker
 * In production, this would query a drug interaction database
 */
function checkDrugInteractions(
  medications: Array<{ id: string; medication_name: string }>
): DrugInteractionResult {
  if (medications.length < 2) {
    return {
      status: "no_major",
      message: "No drug interactions to check (less than 2 medications)",
    };
  }

  const interactions: DrugInteraction[] = [];

  // Mock interaction detection based on common drug pairs
  const drugNames = medications.map((m) => m.medication_name.toLowerCase());

  // Check for common mock interactions
  if (drugNames.some((d) => d.includes("warfarin"))) {
    if (drugNames.some((d) => d.includes("aspirin"))) {
      interactions.push({
        drug1: "Warfarin",
        drug2: "Aspirin",
        severity: "major",
        description: "Increased risk of bleeding when used together",
        action:
          "Monitor INR closely, consider alternative antiplatelet if possible",
      });
    }
    if (drugNames.some((d) => d.includes("ibuprofen") || d.includes("nsaid"))) {
      interactions.push({
        drug1: "Warfarin",
        drug2: "NSAID",
        severity: "major",
        description: "NSAIDs increase anticoagulant effect and bleeding risk",
        action: "Avoid combination if possible, monitor closely",
      });
    }
  }

  if (drugNames.some((d) => d.includes("metformin"))) {
    if (drugNames.some((d) => d.includes("contrast"))) {
      interactions.push({
        drug1: "Metformin",
        drug2: "IV Contrast",
        severity: "major",
        description: "Risk of lactic acidosis with contrast media",
        action: "Hold metformin 48 hours before and after contrast",
      });
    }
  }

  // Determine overall status
  let status: DrugInteractionResult["status"] = "no_major";
  let message = "No significant drug interactions detected";

  if (interactions.some((i) => i.severity === "contraindicated")) {
    status = "critical";
    message =
      "Critical drug interaction detected - contraindicated combination";
  } else if (interactions.some((i) => i.severity === "major")) {
    status = "major";
    message = `${interactions.length} major drug interaction(s) detected`;
  } else if (interactions.some((i) => i.severity === "moderate")) {
    status = "minor";
    message = `${interactions.length} moderate drug interaction(s) detected`;
  }

  return {
    status,
    message,
    interactions: interactions.length > 0 ? interactions : undefined,
  };
}
