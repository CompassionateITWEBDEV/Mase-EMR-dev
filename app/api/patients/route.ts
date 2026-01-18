import { createServiceClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import {
  validatePhone,
  normalizePhone,
  validateEmail,
  validateDateOfBirth,
} from "@/lib/validation/patient";
import { generatePatientNumber } from "@/lib/utils/patient-number";

export async function GET(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();

    // Log authentication details for debugging
    if (authError || !user) {
      console.warn("[API] Authentication failed:", {
        hasError: !!authError,
        errorMessage: authError,
        hasUser: !!user,
        path: "/api/patients",
      });

      // In development, allow the request to proceed with service role client
      // In production, this should be strict
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { patients: [], error: "Unauthorized" },
          { status: 401 }
        );
      } else {
        console.warn(
          "[API] Development mode: Allowing request without authentication"
        );
      }
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");
    const includeStats = searchParams.get("includeStats") === "true";

    // Filter by active patients by default (soft delete support)
    let query = supabase
      .from("patients")
      .select(
        `
        id,
        first_name,
        last_name,
        mrn,
        date_of_birth,
        phone,
        email,
        gender,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        insurance_provider,
        insurance_id,
        program_type,
        client_number,
        is_active,
        created_at,
        updated_at
      `
      )
      .order("last_name", { ascending: true });

    // Filter by active patients by default (unless explicitly requesting inactive)
    // PostgREST syntax for OR: use .or() with comma-separated conditions
    // Format: "column.operator.value,column.operator.value"
    if (status === "inactive") {
      query = query.eq("is_active", false);
    } else if (status !== "all") {
      // Include patients where is_active = true OR is_active IS NULL
      // PostgREST OR syntax for same column: "column.operator.value,column.operator.value"
      query = query.or("is_active.eq.true,is_active.is.null");
    }

    if (search) {
      // Use full_name if available, otherwise fall back to separate fields
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,mrn.ilike.%${search}%`
      );
    }

    if (status && status !== "all" && status !== "inactive") {
      query = query.eq("status", status);
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit));
    } else {
      query = query.limit(200);
    }

    const { data: patients, error } = await query;

    if (error) {
      // If error is due to is_active column or OR syntax issue, retry without the is_active filter
      const isActiveRelatedError = 
        error.message?.includes("is_active") || 
        error.code === "42703" ||
        error.message?.includes("syntax error") ||
        error.message?.includes("operator does not exist");

      if (isActiveRelatedError && status !== "inactive" && status !== "all") {
        console.warn("[API] is_active filter caused error, retrying without filter:", error.message);
        try {
          // Build query without is_active filter
          const retryQuery = supabase
            .from("patients")
            .select(
              `
              id,
              first_name,
              last_name,
              mrn,
              date_of_birth,
              phone,
              email,
              gender,
              address,
              emergency_contact_name,
              emergency_contact_phone,
              insurance_provider,
              insurance_id,
              program_type,
              client_number,
              is_active,
              created_at,
              updated_at
            `
            )
            .order("last_name", { ascending: true });

          if (search) {
            retryQuery.or(
              `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,mrn.ilike.%${search}%`
            );
          }

          if (status && status !== "all" && status !== "inactive") {
            retryQuery.eq("status", status);
          }

          if (limit) {
            retryQuery.limit(Number.parseInt(limit));
          } else {
            retryQuery.limit(200);
          }

          const { data: retryPatients, error: retryError } = await retryQuery;

          if (retryError) {
            console.error("[v0] Error fetching patients (retry):", {
              message: retryError.message,
              code: retryError.code,
              details: retryError.details,
              hint: retryError.hint,
            });
            return NextResponse.json(
              { patients: [], error: retryError.message },
              { status: 500 }
            );
          }

          // Filter in memory to exclude explicitly inactive patients
          const filteredPatients = (retryPatients || []).filter(
            (p: any) => p.is_active !== false
          );

          console.log(`[v0] Fetched ${filteredPatients.length} patients (filtered in memory, original: ${retryPatients?.length || 0})`);
          return NextResponse.json({
            patients: filteredPatients,
            ...(includeStats && { 
              stats: { 
                total: filteredPatients.length, 
                active: filteredPatients.filter((p: any) => p.is_active === true).length, 
                highRisk: 0, 
                recentAppointments: 0 
              } 
            }),
          });
        } catch (retryErr) {
          console.error("[v0] Retry failed:", retryErr);
        }
      }

      console.error("[v0] Error fetching patients:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        query: "patients",
      });
      return NextResponse.json(
        { patients: [], error: error.message },
        { status: 500 }
      );
    }

    // Calculate stats if requested
    let stats = undefined;
    if (includeStats && patients) {
      const totalCount = patients.length;
      const activeCount = patients.filter((p) => p.is_active !== false).length;

      // For high risk and recent appointments, we'd need to join with assessments and appointments
      // For now, return basic stats
      stats = {
        total: totalCount,
        active: activeCount,
        highRisk: 0, // Would need to join with assessments
        recentAppointments: 0, // Would need to join with appointments
      };
    }

    console.log(`[v0] Fetched ${patients?.length || 0} patients`, {
      status,
      search,
      limit,
      hasActiveFilter: status !== "inactive" && status !== "all",
    });
    
    // Log warning if no patients found but we expect some
    if ((patients?.length || 0) === 0 && status !== "inactive") {
      console.warn("[API] No patients returned - possible issues:", {
        statusFilter: status,
        hasSearch: !!search,
        limit,
        suggestion: "Check if is_active filter is too restrictive or if patients table is empty",
      });
    }
    
    return NextResponse.json({
      patients: patients || [],
      ...(stats && { stats }),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[v0] Patients API error:", err);
    return NextResponse.json(
      { patients: [], error: err.message || "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();

    // Log authentication details for debugging
    if (authError || !user) {
      console.warn("[API] Authentication failed:", {
        hasError: !!authError,
        errorMessage: authError,
        hasUser: !!user,
        path: "/api/patients",
        method: "POST",
      });

      // In development, allow the request to proceed with service role client
      // In production, this should be strict
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      } else {
        console.warn(
          "[API] Development mode: Allowing request without authentication"
        );
      }
    }

    const supabase = createServiceClient();
    const body = await request.json();

    // Validate required fields
    const firstName = body.first_name || body.firstName;
    const lastName = body.last_name || body.lastName;
    const dateOfBirth = body.date_of_birth || body.dateOfBirth;
    const phone = body.phone;

    if (!firstName || !lastName || !dateOfBirth || !phone) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: first_name, last_name, date_of_birth, and phone are required",
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!validatePhone(phone)) {
      return NextResponse.json(
        {
          error:
            "Invalid phone number format. Please provide a valid 10-digit US phone number.",
        },
        { status: 400 }
      );
    }

    // Validate date of birth
    if (!validateDateOfBirth(dateOfBirth)) {
      return NextResponse.json(
        {
          error:
            "Invalid date of birth. Date must not be in the future and must be in a valid format (YYYY-MM-DD).",
        },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (body.email && !validateEmail(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // Normalize program_type to lowercase if provided
    let programType = null;
    if (body.program_type) {
      const normalized = body.program_type.toLowerCase().trim();
      // Map display values to database values
      if (normalized === "otp" || normalized.includes("opioid treatment")) {
        programType = "otp";
      } else if (
        normalized === "mat" ||
        normalized.includes("medication-assisted")
      ) {
        programType = "mat";
      } else if (
        normalized === "primary_care" ||
        normalized === "primary care" ||
        normalized.includes("primary")
      ) {
        programType = "primary_care";
      } else if (normalized === "sub" || normalized.includes("substance use")) {
        programType = "sub";
      } else if (normalized === "beh" || normalized.includes("behavioral health")) {
        programType = "beh";
      } else {
        // For custom program types, keep as provided (normalized to lowercase)
        programType = normalized;
      }
    }

    const insertData: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      phone: normalizePhone(phone), // Normalize phone to digits only
      email: body.email || null,
      gender: body.gender || null,
      address: body.address || null,
      emergency_contact_name: body.emergency_contact_name || null,
      emergency_contact_phone: body.emergency_contact_phone || null,
      insurance_provider: body.insurance_provider || null,
      insurance_id: body.insurance_id || null,
      is_active: true, // Set new patients as active by default
    };

    // Only include program_type if it's provided (column might not exist in all databases)
    if (programType) {
      insertData.program_type = programType;
    }

    let { data, error } = await supabase
      .from("patients")
      .insert(insertData)
      .select()
      .single();

    // If error is due to program_type column not existing, retry without it
    if (error && programType && error.message?.includes("program_type")) {
      console.warn(
        "[v0] program_type column may not exist, retrying without it"
      );
      delete insertData.program_type;
      const retryResult = await supabase
        .from("patients")
        .insert(insertData)
        .select()
        .single();

      if (retryResult.error) {
        console.error(
          "[v0] Error creating patient (retry):",
          retryResult.error
        );
        return NextResponse.json(
          { error: retryResult.error.message || "Failed to create patient" },
          { status: 500 }
        );
      }

      data = retryResult.data;
      error = null;
    }

    if (error) {
      console.error("[v0] Error creating patient:", error);
      console.error("[v0] Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: error.message || "Failed to create patient" },
        { status: 500 }
      );
    }

    // Generate and assign patient number if patient was created successfully
    if (data && data.id) {
      try {
        const patientNumber = await generatePatientNumber(programType, supabase);
        
        // Update the patient with the generated client_number
        const { data: updatedPatient, error: updateError } = await supabase
          .from("patients")
          .update({ client_number: patientNumber })
          .eq("id", data.id)
          .select()
          .single();

        if (updateError) {
          console.warn("[v0] Error updating patient with client_number:", updateError);
          // Don't fail the request if number generation fails, just log it
          // The patient was created successfully, number can be assigned later
        } else if (updatedPatient) {
          // Return the updated patient with client_number
          return NextResponse.json({ patient: updatedPatient });
        }
      } catch (numberError) {
        console.error("[v0] Error generating patient number:", numberError);
        // Don't fail the request if number generation fails
      }
    }

    return NextResponse.json({ patient: data });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[v0] Create patient error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create patient" },
      { status: 500 }
    );
  }
}
