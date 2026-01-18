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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    // Log authentication details for debugging
    if (authError || !user) {
      console.warn("[API] Authentication failed:", {
        hasError: !!authError,
        errorMessage: authError,
        hasUser: !!user,
        path: "/api/patients/[id]",
      });
      
      // In development, allow the request to proceed with service role client
      // In production, this should be strict
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      } else {
        console.warn("[API] Development mode: Allowing request without authentication");
      }
    }

    const supabase = createServiceClient();
    const { id } = await params;

    // Fetch patient data - use select("*") to get all available columns
    // program_type will be included if it exists in the database
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (patientError) {
      console.error("[v0] Error fetching patient:", patientError);
      return NextResponse.json(
        { error: patientError.message },
        { status: 500 }
      );
    }

    if (!patientData) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Log patient data to debug patient number issue
    console.log("[v0] Patient data fetched:", {
      id: patientData.id,
      name: `${patientData.first_name} ${patientData.last_name}`,
      client_number: patientData.client_number,
      patient_number: patientData.patient_number,
      program_type: patientData.program_type,
      allKeys: Object.keys(patientData),
    });

    // Fetch all related data in parallel
    // Wrap potentially missing tables in try-catch to handle gracefully
    const [
      vitalsResult,
      vitalsWithEncountersResult,
      medsResult,
      assessmentsResult,
      encountersResult,
      dosingResult,
      consentsResult,
      udsResult,
      progressNotesResult,
      documentsResult,
      toxicologyOrdersResult,
    ] = await Promise.all([
      supabase
        .from("vital_signs")
        .select("*")
        .eq("patient_id", id)
        .order("measurement_date", { ascending: false })
        .limit(30),
      // Fetch vital signs that have appointment_id (from encounters) with appointment details
      supabase
        .from("vital_signs")
        .select(`
          *,
          appointments:appointment_id (
            id,
            appointment_date,
            visit_reason,
            encounter_type,
            status,
            providers:provider_id (
              id,
              first_name,
              last_name,
              specialization
            )
          )
        `)
        .eq("patient_id", id)
        .not("appointment_id", "is", null)
        .order("measurement_date", { ascending: false })
        .limit(50),
      supabase
        .from("medications")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("assessments")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false })
        .limit(50), // Increased limit to get nursing assessments
      supabase
        .from("encounters")
        .select("*")
        .eq("patient_id", id)
        .order("encounter_date", { ascending: false })
        .limit(10),
      supabase
        .from("dosing_log")
        .select("*")
        .eq("patient_id", id)
        .order("dose_date", { ascending: false })
        .limit(30),
      supabase
        .from("hie_patient_consents")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("urine_drug_screens")
        .select("*")
        .eq("patient_id", id)
        .order("collection_date", { ascending: false })
        .limit(50),
      supabase
        .from("progress_notes")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("documents")
        .select("*")
        .eq("patient_id", id)
        .eq("document_type", "court_order")
        .order("document_date", { ascending: false })
        .limit(50),
      // Fetch toxicology orders with results
      supabase
        .from("toxicology_orders")
        .select(`
          *,
          providers:provider_id (id, first_name, last_name),
          toxicology_labs:lab_id (lab_name),
          toxicology_results (*)
        `)
        .eq("patient_id", id)
        .order("order_date", { ascending: false })
        .limit(50),
    ]);

    // Handle errors gracefully - return empty arrays if tables don't exist
    return NextResponse.json({
      patient: patientData,
      vitalSigns: vitalsResult.data || [],
      vitalSignsUpdates: vitalsWithEncountersResult.error ? [] : vitalsWithEncountersResult.data || [],
      medications: medsResult.data || [],
      assessments: assessmentsResult.data || [],
      encounters: encountersResult.data || [],
      dosingLog: dosingResult.data || [],
      consents: consentsResult.data || [],
      udsResults: udsResult.error ? [] : udsResult.data || [],
      progressNotes: progressNotesResult.error
        ? []
        : progressNotesResult.data || [],
      courtOrders: documentsResult.error ? [] : documentsResult.data || [],
      toxicologyOrders: toxicologyOrdersResult.error ? [] : toxicologyOrdersResult.data || [],
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[v0] Error fetching patient chart data:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch patient chart data" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();

    // Log authentication details for debugging
    if (authError || !user) {
      console.warn("[API] Authentication failed:", {
        hasError: !!authError,
        errorMessage: authError,
        hasUser: !!user,
        path: "/api/patients/[id]",
        method: "PUT",
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
    const { id } = await params;
    const body = await request.json();

    // Fetch current patient data to check if program_type is changing
    const { data: currentPatient } = await supabase
      .from("patients")
      .select("program_type, client_number")
      .eq("id", id)
      .single();

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
            "Invalid date of birth. Date must be in the past and in a valid format.",
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

    // Build update object
    const updateData: Record<string, unknown> = {
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
      updated_at: new Date().toISOString(),
    };

    // Handle program_type - normalize if provided
    // Note: We'll try to include it, but if the column doesn't exist, we'll retry without it
    let hasProgramTypeField = false;
    let newProgramType: string | null = null;
    let programTypeChanged = false;
    
    if (body.program_type !== undefined) {
      hasProgramTypeField = true;
      if (body.program_type && body.program_type.trim()) {
        const normalized = body.program_type.toLowerCase().trim();
        if (normalized === "otp" || normalized.includes("opioid treatment")) {
          newProgramType = "otp";
        } else if (
          normalized === "mat" ||
          normalized.includes("medication-assisted")
        ) {
          newProgramType = "mat";
        } else if (
          normalized === "primary_care" ||
          normalized === "primary care" ||
          normalized.includes("primary")
        ) {
          newProgramType = "primary_care";
        } else if (normalized === "sub" || normalized.includes("substance use")) {
          newProgramType = "sub";
        } else if (normalized === "beh" || normalized.includes("behavioral health")) {
          newProgramType = "beh";
        } else {
          // For custom program types, keep as provided (normalized to lowercase)
          newProgramType = normalized;
        }
      } else {
        newProgramType = null;
      }
      
      // Check if program_type is actually changing
      const currentProgramType = currentPatient?.program_type?.toLowerCase().trim() || null;
      programTypeChanged = currentProgramType !== (newProgramType?.toLowerCase().trim() || null);
      
      updateData.program_type = newProgramType;
    }

    // If program_type changed, check if we need to regenerate patient number
    if (programTypeChanged && newProgramType) {
      const currentClientNumber = currentPatient?.client_number || "";
      const expectedPrefix = newProgramType === "otp" ? "OTP" : 
                            newProgramType === "mat" ? "MAT" : 
                            newProgramType === "primary_care" ? "PC" : "OTP";
      
      // Regenerate if client_number doesn't exist or doesn't match new program type prefix
      const needsRegeneration = !currentClientNumber || !currentClientNumber.startsWith(expectedPrefix);
      
      if (needsRegeneration) {
        try {
          const newPatientNumber = await generatePatientNumber(newProgramType, supabase);
          updateData.client_number = newPatientNumber;
          console.log(`[v0] Regenerating patient number for program type change: ${newPatientNumber}`);
        } catch (numberError) {
          console.error("[v0] Error generating patient number during update:", numberError);
          // Don't fail the update if number generation fails
        }
      }
    } else if (programTypeChanged && !newProgramType && !currentPatient?.client_number) {
      // Program type was cleared and patient has no number - generate default OTP number
      try {
        const newPatientNumber = await generatePatientNumber("otp", supabase);
        updateData.client_number = newPatientNumber;
        console.log(`[v0] Generating default patient number: ${newPatientNumber}`);
      } catch (numberError) {
        console.error("[v0] Error generating default patient number:", numberError);
      }
    }

    console.log("[v0] Updating patient:", { id, updateData });

    let { data, error } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    // If error is due to program_type column not existing, retry without it
    if (
      error &&
      hasProgramTypeField &&
      (error.message?.includes("program_type") ||
        error.message?.includes("schema cache") ||
        error.message?.includes("Could not find") ||
        (error.message?.toLowerCase().includes("column") &&
          error.message?.toLowerCase().includes("program_type")))
    ) {
      console.warn(
        "[v0] program_type column may not exist, retrying without it. Error:",
        error.message
      );
      const updateDataWithoutProgramType = { ...updateData };
      delete updateDataWithoutProgramType.program_type;
      const retryResult = await supabase
        .from("patients")
        .update(updateDataWithoutProgramType)
        .eq("id", id)
        .select()
        .single();

      if (retryResult.error) {
        console.error(
          "[v0] Error updating patient (retry):",
          retryResult.error
        );
        return NextResponse.json(
          { error: retryResult.error.message || "Failed to update patient" },
          { status: 500 }
        );
      }

      data = retryResult.data;
      error = null;
      console.log(
        "[v0] Patient updated successfully (program_type column not available)"
      );
    }

    if (error) {
      console.error("[v0] Error updating patient:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update patient" },
        { status: 500 }
      );
    }

    console.log("[v0] Patient updated successfully:", data);
    return NextResponse.json({ patient: data });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[v0] Update patient error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update patient" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { id } = await params;

    console.log("[v0] Soft deleting patient:", id);

    // First, verify patient exists
    const { data: patientData, error: fetchError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, is_active")
      .eq("id", id)
      .single();

    if (fetchError || !patientData) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Validate user.id is a valid UUID before using it
    // Handle dev-bypass-user and other non-UUID values (e.g., from dev auth bypass)
    const isValidUUID = (str: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const deactivatedBy = isValidUUID(user.id) ? user.id : null;
    
    if (!isValidUUID(user.id)) {
      console.warn(
        "[v0] User ID is not a valid UUID, setting deactivated_by to null:",
        user.id
      );
    }

    // Soft delete: set is_active=false instead of deleting
    const { error: updateError } = await supabase
      .from("patients")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: deactivatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[v0] Error soft deleting patient:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to deactivate patient" },
        { status: 500 }
      );
    }

    console.log("[v0] Patient deactivated successfully:", {
      id,
      name: `${patientData.first_name} ${patientData.last_name}`,
    });

    return NextResponse.json({
      success: true,
      message: "Patient deactivated successfully",
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[v0] Delete patient error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to deactivate patient" },
      { status: 500 }
    );
  }
}
