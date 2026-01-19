/**
 * Appointments API Route
 * Handles fetching appointments with filtering and summary statistics
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { AppointmentStatus } from "@/types/schedule";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { validateAppointmentDate } from "@/lib/validation/patient";

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

    // Parse query parameters
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const providerId = searchParams.get("providerId");
    const patientId = searchParams.get("patientId");
    const statusParam = searchParams.get("status");
    const typeParam = searchParams.get("type");
    const summary = searchParams.get("summary") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    // Build query with related data
    let query = supabase
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
          phone
        ),
        providers (
          id,
          first_name,
          last_name,
          specialization
        )
      `,
        { count: "exact" }
      )
      .order("appointment_date", { ascending: true });

    // Apply date filters
    if (date) {
      const dayStart = `${date}T00:00:00`;
      const dayEnd = `${date}T23:59:59`;
      query = query
        .gte("appointment_date", dayStart)
        .lte("appointment_date", dayEnd);
    } else if (startDate && endDate) {
      query = query
        .gte("appointment_date", `${startDate}T00:00:00`)
        .lte("appointment_date", `${endDate}T23:59:59`);
    } else if (startDate) {
      query = query.gte("appointment_date", `${startDate}T00:00:00`);
    } else if (endDate) {
      query = query.lte("appointment_date", `${endDate}T23:59:59`);
    }

    // Apply provider filter
    if (providerId) {
      query = query.eq("provider_id", providerId);
    }

    // Apply patient filter
    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    // Apply status filter (comma-separated list)
    if (statusParam) {
      const statuses = statusParam.split(",") as AppointmentStatus[];
      query = query.in("status", statuses);
    }

    // Apply type filter (comma-separated list)
    if (typeParam) {
      const types = typeParam.split(",");
      query = query.in("appointment_type", types);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: appointments, error, count } = await query;

    if (error) {
      console.error("[API] Error fetching appointments:", error);
      return NextResponse.json(
        { appointments: [], error: error.message },
        { status: 500 }
      );
    }

    // If summary requested, calculate statistics
    if (summary) {
      const summaryStats = {
        total: appointments?.length || 0,
        completed:
          appointments?.filter((a) => a.status === "completed").length || 0,
        scheduled:
          appointments?.filter((a) => a.status === "scheduled").length || 0,
        cancelled:
          appointments?.filter((a) => a.status === "cancelled").length || 0,
        noShow:
          appointments?.filter(
            (a) => a.status === "no-show" || a.status === "no_show"
          ).length || 0,
        checkedIn:
          appointments?.filter(
            (a) => a.status === "checked-in" || a.status === "checked_in"
          ).length || 0,
      };

      return NextResponse.json({
        summary: summaryStats,
        appointments: appointments || [],
        pagination: { page, pageSize, total: count || 0 },
      });
    }

    return NextResponse.json({
      appointments: appointments || [],
      pagination: { page, pageSize, total: count || 0 },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Appointments API error:", err);
    return NextResponse.json(
      {
        appointments: [],
        error: err.message || "Failed to fetch appointments",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
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
    const body = await request.json();

    // Validate required fields
    if (!body.patient_id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }
    if (!body.appointment_date) {
      return NextResponse.json(
        { error: "Appointment date is required" },
        { status: 400 }
      );
    }
    if (!body.appointment_type) {
      return NextResponse.json(
        { error: "Appointment type is required" },
        { status: 400 }
      );
    }

    // Validate appointment date is not in the past (for new appointments)
    if (!validateAppointmentDate(body.appointment_date, false)) {
      return NextResponse.json(
        { error: "Appointment date cannot be in the past" },
        { status: 400 }
      );
    }

    // Verify patient exists
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

    // Verify provider exists if provided
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

    const insertData = {
      patient_id: body.patient_id,
      provider_id: body.provider_id || null,
      appointment_date: body.appointment_date,
      duration_minutes: body.duration_minutes || 60,
      appointment_type: body.appointment_type,
      status: body.status || "scheduled",
      notes: body.notes || null,
    };

    const { data, error } = await supabase
      .from("appointments")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("[API] Error creating appointment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Create appointment error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create appointment" },
      { status: 500 }
    );
  }
}
