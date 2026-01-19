/**
 * Clinical Alert Acknowledge API Route
 * Handles marking a clinical alert as acknowledged
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clinical-alerts/[id]/acknowledge
 * Mark a clinical alert as acknowledged
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Update the alert status
    const { data, error } = await supabase
      .from("clinical_alerts")
      .update({
        status: "acknowledged",
        acknowledged_by: user?.id || null,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Alert not found" }, { status: 404 });
      }
      console.error("[API] Error acknowledging clinical alert:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Alert acknowledged successfully",
      alert: data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Acknowledge clinical alert error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to acknowledge alert" },
      { status: 500 }
    );
  }
}
