/**
 * Drug Interactions API Route
 * Checks for potential drug-drug interactions using multiple data sources.
 *
 * This route uses the DrugInteractionService which aggregates data from:
 * 1. Internal knowledge base (known critical interactions)
 * 2. RxNav/RxNorm API (NIH-provided, comprehensive)
 * 3. OpenFDA Drug Adverse Events API (supplementary data)
 *
 * If an external service is configured via DRUG_INTERACTION_API_URL, that
 * will be used as the primary source instead.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { DrugInteractionResult } from "@/types/ai-assistant";
import { checkDrugInteractions } from "@/lib/services/drug-interaction-service";

/**
 * GET /api/ai-assistant/drug-interactions
 * Check drug interactions for a patient's medications or a list of medication
 * IDs. Accepts either a `patientId` or `medicationIds` query parameter.
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
      // Fetch active medications for the given patient
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

    // Attempt to call an external drug interaction API if configured.
    const externalUrl = process.env.DRUG_INTERACTION_API_URL;
    if (externalUrl && medications.length > 0) {
      try {
        // Build query string using medication names. We use lowercase names
        // to avoid case-sensitivity issues. Spaces are replaced with
        // underscores to improve URL encoding readability.
        const medicationNames = medications
          .map((m) => m.medication_name.toLowerCase().replace(/\s+/g, "_"))
          .join(",");
        const url = `${externalUrl}?medications=${encodeURIComponent(medicationNames)}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          const data = (await response.json()) as DrugInteractionResult;
          return NextResponse.json(data);
        } else {
          console.warn(
            `[API] External drug interaction service returned ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        console.error(
          "[API] Error calling external drug interaction service:",
          error
        );
        // Continue to internal implementation below
      }
    }

    // Use the comprehensive drug interaction service
    const result = await checkDrugInteractions(medications);
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
 * POST /api/ai-assistant/drug-interactions
 * Check drug interactions for a list of medication names (without database lookup)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { medications } = body as { medications: string[] };

    if (!medications || !Array.isArray(medications)) {
      return NextResponse.json(
        { error: "medications array is required" },
        { status: 400 }
      );
    }

    // Convert medication names to the expected format
    const medicationObjects = medications.map((name, idx) => ({
      id: `temp-${idx}`,
      medication_name: name,
    }));

    // Use the comprehensive drug interaction service
    const result = await checkDrugInteractions(medicationObjects);
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
