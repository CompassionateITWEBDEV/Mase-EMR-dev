/**
 * Billing CPT Codes API Route
 * Handles fetching CPT codes by specialty
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { CPTCode } from "@/types/billing";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const specialty = searchParams.get("specialty");

    let query = supabase
      .from("specialty_billing_codes")
      .select("*")
      .eq("is_active", true)
      .order("code", { ascending: true });

    // Filter by specialty if provided
    if (specialty) {
      // Map common specialty names to specialty_id values
      const specialtyMap: Record<string, string> = {
        "primary-care": "primary_care",
        "primary_care": "primary_care",
        "behavioral-health": "behavioral_health",
        "behavioral_health": "behavioral_health",
      };

      const specialtyId = specialtyMap[specialty] || specialty;
      query = query.eq("specialty_id", specialtyId);
    }

    const { data: codes, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        console.warn("[API] specialty_billing_codes table not found");
        return NextResponse.json({ codes: [] });
      }
      console.error("[API] Error fetching billing codes:", error);
      return NextResponse.json(
        { codes: [], error: error.message },
        { status: 500 }
      );
    }

    // Transform to CPTCode interface
    const transformedCodes: CPTCode[] = (codes || []).map((code) => ({
      code: code.code,
      description: code.description,
      rate: code.base_rate || 0,
      category: (code.category as CPTCode["category"]) || "Other",
    }));

    return NextResponse.json({ codes: transformedCodes });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[API] Billing codes API error:", err);
    return NextResponse.json(
      { codes: [], error: err.message || "Failed to fetch billing codes" },
      { status: 500 }
    );
  }
}

