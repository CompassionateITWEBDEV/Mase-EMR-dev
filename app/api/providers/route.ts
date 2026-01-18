/**
 * Providers API Route
 * Handles fetching providers list
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

/**
 * GET /api/providers
 * Fetch list of providers
 */
export async function GET(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { providers: [], error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    const active = searchParams.get("active") !== "false"; // Default to true

    let query = supabase
      .from("providers")
      .select("id, first_name, last_name, specialization, email")
      .order("last_name", { ascending: true });

    // Filter by active status if providers table has is_active field
    // Note: This will work after migration 022 adds is_active column
    // If the column doesn't exist, the query will fail and we'll handle it in the error handler
    if (active) {
      query = query.eq("is_active", true).or("is_active.is.null");
    }

    // Filter by specialty if provided
    if (specialty) {
      query = query.eq("specialization", specialty);
    }

    const { data: providers, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        console.warn("[API] providers table not found");
        return NextResponse.json({ providers: [] });
      }
      // If is_active column doesn't exist, retry without the filter
      if (error.message?.includes("is_active") || error.code === "42703") {
        console.warn("[API] is_active column not found, retrying without filter");
        const retryQuery = supabase
          .from("providers")
          .select("id, first_name, last_name, specialization, email")
          .order("last_name", { ascending: true });
        
        if (specialty) {
          retryQuery.eq("specialization", specialty);
        }
        
        const { data: retryData, error: retryError } = await retryQuery;
        
        if (retryError) {
          console.error("[API] Error fetching providers (retry):", retryError);
          return NextResponse.json(
            { providers: [], error: retryError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ providers: retryData || [] });
      }
      console.error("[API] Error fetching providers:", error);
      return NextResponse.json(
        { providers: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ providers: providers || [] });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[API] Providers API error:", err);
    return NextResponse.json(
      { providers: [], error: err.message || "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

