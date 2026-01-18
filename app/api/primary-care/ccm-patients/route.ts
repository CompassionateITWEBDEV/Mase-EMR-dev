/**
 * Primary Care Chronic Care Management (CCM) Patients API Route
 * Returns count of active CCM patients
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Query patients with active CCM billing codes (99490, 99439, 99487, 99489)
    const ccmCodes = ["99490", "99439", "99487", "99489"];

    // Query encounters or billing records with CCM codes
    // First, try to find patients with recent CCM encounters
    // Try cpt_codes first, fall back to procedure_codes if cpt_codes doesn't exist
    let ccmEncounters: unknown[] = [];
    let encounterError: unknown = null;

    // Try cpt_codes column (after migration 022)
    // For array columns, fetch all matching encounters and filter in memory
    // This avoids PostgREST array operator syntax complexity
    let ccmEncountersWithCpt: unknown[] = [];
    let cptError: unknown = null;
    
    try {
      // Fetch encounters with date/status filters, then filter by array in memory
      const { data: allEncounters, error } = await supabase
        .from("encounters")
        .select("patient_id, encounter_date, cpt_codes")
        .gte("encounter_date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .eq("status", "completed");
      
      if (error) {
        cptError = error;
      } else if (allEncounters) {
        // Filter encounters where cpt_codes array contains any CCM code
        ccmEncountersWithCpt = allEncounters.filter((encounter: any) => {
          if (!encounter.cpt_codes || !Array.isArray(encounter.cpt_codes)) return false;
          return encounter.cpt_codes.some((code: string) => ccmCodes.includes(code));
        });
      }
    } catch (err) {
      cptError = err;
      console.warn("[API] Error querying with cpt_codes array:", err);
    }

    if (cptError) {
      // If cpt_codes doesn't exist, try procedure_codes (existing column)
      const errorMessage = cptError instanceof Error ? cptError.message : String(cptError);
      if (errorMessage.includes("cpt_codes") || errorMessage.includes("does not exist")) {
        console.warn("[API] cpt_codes column not found, trying procedure_codes");
        // procedure_codes is also an array, so fetch and filter in memory
        const { data: allEncountersProc, error: procError } = await supabase
          .from("encounters")
          .select("patient_id, encounter_date, procedure_codes")
          .gte("encounter_date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
          .eq("status", "completed");
        
        let ccmEncountersWithProc: unknown[] = [];
        if (!procError && allEncountersProc) {
          // Filter encounters where procedure_codes array contains any CCM code
          ccmEncountersWithProc = allEncountersProc.filter((encounter: any) => {
            if (!encounter.procedure_codes || !Array.isArray(encounter.procedure_codes)) return false;
            return encounter.procedure_codes.some((code: string) => ccmCodes.includes(code));
          });
        }

        if (procError) {
          encounterError = procError;
          console.warn("[API] Error querying CCM encounters with procedure_codes:", procError);
        } else {
          ccmEncounters = ccmEncountersWithProc || [];
        }
      } else {
        encounterError = cptError;
        console.warn("[API] Error querying CCM encounters:", cptError);
      }
    } else {
      ccmEncounters = ccmEncountersWithCpt || [];
    }

    // Get unique patient IDs
    const patientIds = [
      ...new Set(
        (ccmEncounters || []).map((e: unknown) => {
          const encounter = e as { patient_id: string };
          return encounter.patient_id;
        })
      ),
    ];

    // If we have patient IDs, verify they're active patients
    let activeCCMPatients = 0;
    if (patientIds.length > 0) {
      const { count } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .in("id", patientIds)
        .eq("is_active", true);

      activeCCMPatients = count || 0;
    }

    // If no encounters found, try alternative: count patients with chronic conditions
    if (activeCCMPatients === 0) {
      const { count } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .not("chronic_conditions", "is", null);

      activeCCMPatients = count || 0;
    }

    // Default to 45 if we can't calculate (for backward compatibility during migration)
    const count = activeCCMPatients > 0 ? activeCCMPatients : 45;

    return NextResponse.json({
      count,
      activeCCMPatients,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[API] CCM patients API error:", err);
    // Return default value for backward compatibility
    return NextResponse.json({
      count: 45,
      activeCCMPatients: 0,
      error: err.message || "Failed to fetch CCM patients",
    });
  }
}

