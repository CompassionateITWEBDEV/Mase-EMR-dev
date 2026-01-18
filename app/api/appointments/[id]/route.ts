
/**
 * Single Appointment API Route
 * Handles GET, PUT, DELETE for individual appointments
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAuthenticatedUser, getUserRole } from "@/lib/auth/middleware";
import { validateAppointmentDate } from "@/lib/validation/patient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/appointments/[id]
 * Fetch a single appointment by ID with related patient and provider data
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      console.warn("[API] Authentication failed:", {
        hasError: !!authError,
        errorMessage: authError,
        hasUser: !!user,
        path: "/api/appointments/[id]",
        method: "GET",
      });

      // In development, allow the request to proceed with service role client
      // In production, this should be strict
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      } else {
        console.warn(
          "[API] Development mode: Allowing request without authentication"
        );
      }
    }

    const { id } = await params;
    // Check if user is Super Admin - if so, use service role client to bypass RLS
    // In development mode without auth, always use service client
    const userRole = user ? getUserRole(user) : null;
    const isSuperAdmin = userRole === "super_admin";
    const useServiceClient = isSuperAdmin || !user;
    const supabase = useServiceClient ? createServiceClient() : await createClient();

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        patient_id,
        provider_id,
        appointment_date,
        duration_minutes,
        appointment_type,
        status,
        notes,
        created_at,
        updated_at,
        patients (
          id,
          first_name,
          last_name,
          date_of_birth,
          phone,
          email
        ),
        providers (
          id,
          first_name,
          last_name,
          specialization,
          email
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }
      console.error("[API] Error fetching appointment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Get appointment error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/appointments/[id]
 * Update an appointment (status, notes, reschedule, etc.)
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      console.warn("[API] Authentication failed:", {
        hasError: !!authError,
        errorMessage: authError,
        hasUser: !!user,
        path: "/api/appointments/[id]",
        method: "PUT",
      });

      // In development, allow the request to proceed with service role client
      // In production, this should be strict
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      } else {
        console.warn(
          "[API] Development mode: Allowing request without authentication"
        );
      }
    }

    const { id } = await params;
    // Check if user is Super Admin - if so, use service role client to bypass RLS
    // In development mode without auth, always use service client
    const userRole = user ? getUserRole(user) : null;
    const isSuperAdmin = userRole === "super_admin";
    const useServiceClient = isSuperAdmin || !user;
    const supabase = useServiceClient ? createServiceClient() : await createClient();
    const body = await request.json();

    // Validate appointment date if provided
    if (body.appointment_date && !validateAppointmentDate(body.appointment_date, true)) {
      return NextResponse.json(
        { error: "Invalid appointment date format" },
        { status: 400 }
      );
    }

    // Verify patient exists if patient_id is being updated
    if (body.patient_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("id", body.patient_id)
        .single();

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }
    }

    // Verify provider exists if provider_id is being updated
    if (body.provider_id) {
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("id", body.provider_id)
        .single();

      if (!provider) {
        return NextResponse.json(
          { error: "Provider not found" },
          { status: 404 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.appointment_date !== undefined)
      updateData.appointment_date = body.appointment_date;
    if (body.duration_minutes !== undefined)
      updateData.duration_minutes = body.duration_minutes;
    if (body.appointment_type !== undefined)
      updateData.appointment_type = body.appointment_type;
    if (body.provider_id !== undefined)
      updateData.provider_id = body.provider_id;
    if (body.mode !== undefined) updateData.mode = body.mode;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }
      console.error("[API] Error updating appointment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment: data });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Update appointment error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/[id]
 * Cancel/delete an appointment (soft delete by setting status to cancelled)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      console.warn("[API] Authentication failed:", {
        hasError: !!authError,
        errorMessage: authError,
        hasUser: !!user,
        path: "/api/appointments/[id]",
        method: "DELETE",
      });

      // In development, allow the request to proceed with service role client
      // In production, this should be strict
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      } else {
        console.warn(
          "[API] Development mode: Allowing request without authentication"
        );
      }
    }

    const { id } = await params;
    // Check if user is Super Admin - if so, use service role client to bypass RLS
    // In development mode without auth, always use service client
    const userRole = user ? getUserRole(user) : null;
    const isSuperAdmin = userRole === "super_admin";
    const useServiceClient = isSuperAdmin || !user;
    const supabase = useServiceClient ? createServiceClient() : await createClient();

    // Soft delete: update status to cancelled
    const { data, error } = await supabase
      .from("appointments")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }
      console.error("[API] Error cancelling appointment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Appointment cancelled",
      appointment: data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Cancel appointment error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
