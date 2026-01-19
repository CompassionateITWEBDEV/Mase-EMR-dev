/**
 * Clinical Alerts API Route
 * Handles fetching and creating clinical alerts
 *
 * Uses the `clinical_alerts` table from MASTER_COMPLETE_SETUP.sql schema
 * Falls back to empty array if table doesn't exist
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { ClinicalAlert } from "@/types/clinical";
import type { AlertVariant, PriorityLevel } from "@/types/common";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

/**
 * GET /api/clinical-alerts
 * Fetch clinical alerts with optional filtering
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const patientId = searchParams.get("patientId");
    const priority = searchParams.get("priority");
    const acknowledged = searchParams.get("acknowledged");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Try clinical_alerts table
    // Handle both 'alert_message' and 'message' column names for backward compatibility
    let query = supabase
      .from("clinical_alerts")
      .select(
        `
        id,
        patient_id,
        alert_type,
        severity,
        alert_message,
        message,
        triggered_by,
        status,
        acknowledged_by,
        acknowledged_at,
        created_at,
        patients (
          first_name,
          last_name
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply patient filter
    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    // Apply priority/severity filter
    if (priority && priority !== "all") {
      query = query.eq("severity", priority);
    }

    // Apply acknowledged filter
    if (acknowledged === "false") {
      query = query.eq("status", "active");
    } else if (acknowledged === "true") {
      query = query.in("status", ["acknowledged", "resolved", "dismissed"]);
    }

    const { data: alerts, error, count } = await query;

    // Handle error for clinical_alerts table (but continue to fetch other alert types)
    if (error && error.code !== "42P01") {
      console.error("[API] Error fetching clinical alerts:", error);
      // Continue anyway to try fetching other alert types
    }

    // Also fetch dosing holds and patient precautions to include in clinical alerts
    // These are managed on the /clinical-alerts page and should appear on the dashboard
    let dosingHolds: any[] = [];
    let patientPrecautions: any[] = [];
    let facilityAlerts: any[] = [];

    try {
      // Fetch active dosing holds
      const { data: holdsData } = await supabase
        .from("dosing_holds")
        .select(
          `
          id,
          patient_id,
          hold_type,
          reason,
          severity,
          status,
          created_at,
          patients (
            first_name,
            last_name
          )
        `
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (holdsData) {
        dosingHolds = holdsData.map((hold: any) => {
          const patientName = hold.patients
            ? `${hold.patients.first_name} ${hold.patients.last_name}`
            : "Unknown Patient";
          return {
            id: `hold_${hold.id}`,
            patient_id: hold.patient_id,
            alert_type: "dosing_hold",
            severity: hold.severity || "medium",
            alert_message: `Dosing Hold: ${hold.reason}`,
            message: `Dosing Hold: ${hold.reason}`,
            triggered_by: "system",
            status: "active",
            created_at: hold.created_at,
            patients: hold.patients,
          };
        });
      }
    } catch (holdsError) {
      console.warn(
        "[API] Error fetching dosing holds for clinical alerts:",
        holdsError
      );
    }

    try {
      // Fetch active patient precautions
      const { data: precautionsData } = await supabase
        .from("patient_precautions")
        .select(
          `
          id,
          patient_id,
          precaution_type,
          custom_text,
          created_at,
          patients (
            first_name,
            last_name
          )
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (precautionsData) {
        patientPrecautions = precautionsData.map((precaution: any) => {
          const patientName = precaution.patients
            ? `${precaution.patients.first_name} ${precaution.patients.last_name}`
            : "Unknown Patient";
          return {
            id: `precaution_${precaution.id}`,
            patient_id: precaution.patient_id,
            alert_type: "patient_precaution",
            severity: "medium",
            alert_message:
              precaution.custom_text ||
              `Patient Precaution: ${precaution.precaution_type}`,
            message:
              precaution.custom_text ||
              `Patient Precaution: ${precaution.precaution_type}`,
            triggered_by: "system",
            status: "active",
            created_at: precaution.created_at,
            patients: precaution.patients,
          };
        });
      }
    } catch (precautionsError) {
      console.warn(
        "[API] Error fetching patient precautions for clinical alerts:",
        precautionsError
      );
    }

    try {
      // Fetch active facility alerts
      const { data: facilityData } = await supabase
        .from("facility_alerts")
        .select(
          `
          id,
          alert_type,
          message,
          priority,
          is_active,
          created_at
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (facilityData) {
        facilityAlerts = facilityData.map((alert: any) => {
          return {
            id: `facility_${alert.id}`,
            patient_id: null, // Facility alerts don't have a patient
            alert_type: alert.alert_type || "facility",
            severity: alert.priority || "medium",
            alert_message: alert.message,
            message: alert.message,
            triggered_by: "system",
            status: "active",
            created_at: alert.created_at,
            patients: null,
          };
        });
      }
    } catch (facilityError) {
      console.warn(
        "[API] Error fetching facility alerts for clinical alerts:",
        facilityError
      );
    }

    // Combine all alerts: clinical_alerts, dosing holds, precautions, and facility alerts
    const allAlerts = [
      ...(alerts || []),
      ...dosingHolds,
      ...patientPrecautions,
      ...facilityAlerts,
    ]
      .sort((a, b) => {
        // Sort by created_at descending
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(0, limit); // Apply limit to combined results

    // Only return error if clinical_alerts table error is critical AND we have no other alerts
    // Otherwise, continue with whatever alerts we successfully fetched
    if (error && error.code !== "42P01" && allAlerts.length === 0) {
      console.error(
        "[API] Error fetching clinical alerts and no other alerts available:",
        error
      );
      return NextResponse.json(
        { alerts: [], error: error.message },
        { status: 500 }
      );
    }

    // If clinical_alerts table doesn't exist but we have other alerts, continue
    if (error && error.code === "42P01") {
      console.warn(
        "[API] clinical_alerts table not found, using other alert sources"
      );
    }

    // Transform to match ClinicalAlert type (including combined alerts from all sources)
    const transformedAlerts: ClinicalAlert[] = allAlerts.map((alert) => {
      // Handle joined patient data (could be object or array)
      const patientsData = alert.patients as unknown;
      let patientName = "Unknown Patient";

      // Facility alerts don't have patients
      if (alert.alert_type === "facility" || !alert.patient_id) {
        patientName = "Facility Alert";
      } else if (patientsData && typeof patientsData === "object") {
        const patientObj = Array.isArray(patientsData)
          ? patientsData[0]
          : patientsData;
        if (patientObj?.first_name && patientObj?.last_name) {
          patientName = `${patientObj.first_name} ${patientObj.last_name}`;
        }
      }

      return {
        id: alert.id,
        patient: patientName,
        patientId: alert.patient_id || undefined,
        message: alert.alert_message || alert.message || "No message",
        priority: mapSeverityToPriority(alert.severity),
        time: formatTimeAgo(alert.created_at),
        type: mapSeverityToVariant(alert.severity),
        isAcknowledged: alert.status !== "active",
        createdAt: alert.created_at,
      };
    });

    // Calculate unacknowledged count
    const unacknowledgedCount = transformedAlerts.filter(
      (a) => !a.isAcknowledged
    ).length;

    // Check if summary is requested
    const summary = searchParams.get("summary") === "true";
    if (summary) {
      const countByPriority = {
        high: transformedAlerts.filter((a) => a.priority === "high").length,
        medium: transformedAlerts.filter((a) => a.priority === "medium").length,
        low: transformedAlerts.filter((a) => a.priority === "low").length,
      };

      return NextResponse.json({
        alerts: transformedAlerts,
        total: count || 0,
        countByPriority,
        unacknowledged: unacknowledgedCount,
      });
    }

    return NextResponse.json({
      alerts: transformedAlerts,
      total: count || 0,
      count: { total: count || 0, unacknowledged: unacknowledgedCount },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Clinical alerts API error:", err);
    return NextResponse.json(
      { alerts: [], error: err.message || "Failed to fetch clinical alerts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clinical-alerts
 * Create a new clinical alert
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.patient_id && !body.patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }
    if (!body.alert_message && !body.message) {
      return NextResponse.json(
        { error: "Alert message is required" },
        { status: 400 }
      );
    }

    const insertData = {
      patient_id: body.patient_id || body.patientId,
      alert_type: body.alert_type || body.type || "general",
      severity: body.severity || body.priority || "medium",
      alert_message: body.alert_message || body.message,
      triggered_by: body.triggered_by || body.source || "manual",
      status: "active",
    };

    const { data, error } = await supabase
      .from("clinical_alerts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("[API] Error creating clinical alert:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alert: data }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Create clinical alert error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create clinical alert" },
      { status: 500 }
    );
  }
}

// Helper functions
function mapSeverityToPriority(severity: string | null): PriorityLevel {
  const priorityMap: Record<string, PriorityLevel> = {
    critical: "high",
    high: "high",
    medium: "medium",
    low: "low",
  };
  return priorityMap[severity || ""] || "medium";
}

function mapSeverityToVariant(severity: string | null): AlertVariant {
  const variantMap: Record<string, AlertVariant> = {
    critical: "destructive",
    high: "destructive",
    medium: "warning",
    low: "info",
  };
  return variantMap[severity || ""] || "default";
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}
