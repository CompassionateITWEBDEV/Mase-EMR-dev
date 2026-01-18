import { createServiceClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!patientId) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("urine_drug_screens")
      .select("*")
      .eq("patient_id", patientId)
      .order("collection_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[API] Error fetching UDS results:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ udsResults: data || [] });
  } catch (error) {
    console.error("[API] UDS results GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch UDS results" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      console.warn("[API] Development mode: Allowing request without authentication");
    }

    const supabase = createServiceClient();
    const body = await request.json();

    // Validate required fields
    if (!body.patient_id) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    // Build UDS data object
    const udsData: Record<string, unknown> = {
      patient_id: body.patient_id,
      collection_date: body.collection_date || new Date().toISOString().split("T")[0],
      test_type: body.test_type || "Urine Drug Screen",
    };

    // Add optional fields if provided
    if (body.collected_by) udsData.collected_by = body.collected_by;
    if (body.collection_method) udsData.collection_method = body.collection_method;
    if (body.specimen_id) udsData.specimen_id = body.specimen_id;
    
    // Test results - store as array
    if (body.positive_for && Array.isArray(body.positive_for)) {
      udsData.positive_for = body.positive_for;
    }
    if (body.negative_for && Array.isArray(body.negative_for)) {
      udsData.negative_for = body.negative_for;
    }
    
    // Individual drug results (as JSON object)
    if (body.results) udsData.results = body.results;
    
    // Temperature for validity
    if (body.specimen_temperature !== undefined && body.specimen_temperature !== "") {
      udsData.specimen_temperature = parseFloat(body.specimen_temperature);
    }
    
    // Validity indicators
    if (body.is_valid !== undefined) udsData.is_valid = body.is_valid;
    if (body.validity_notes) udsData.validity_notes = body.validity_notes;
    
    // Interpretation and notes
    if (body.interpretation) udsData.interpretation = body.interpretation;
    if (body.notes) udsData.notes = body.notes;
    
    // Lab information
    if (body.lab_name) udsData.lab_name = body.lab_name;
    if (body.is_confirmation) udsData.is_confirmation = body.is_confirmation;
    if (body.confirmation_lab) udsData.confirmation_lab = body.confirmation_lab;
    
    // Status
    udsData.status = body.status || "completed";

    console.log("[API] Creating UDS result:", udsData);

    const { data, error } = await supabase
      .from("urine_drug_screens")
      .insert(udsData)
      .select()
      .single();

    if (error) {
      console.error("[API] Error creating UDS result:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API] UDS result created successfully:", data.id);
    return NextResponse.json({ udsResult: data, success: true });
  } catch (error) {
    console.error("[API] UDS results POST error:", error);
    return NextResponse.json(
      { error: "Failed to create UDS result" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const supabase = createServiceClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Update fields if provided
    if (body.collection_date !== undefined) updateData.collection_date = body.collection_date;
    if (body.test_type !== undefined) updateData.test_type = body.test_type;
    if (body.positive_for !== undefined) updateData.positive_for = body.positive_for;
    if (body.negative_for !== undefined) updateData.negative_for = body.negative_for;
    if (body.results !== undefined) updateData.results = body.results;
    if (body.interpretation !== undefined) updateData.interpretation = body.interpretation;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.is_valid !== undefined) updateData.is_valid = body.is_valid;

    const { data, error } = await supabase
      .from("urine_drug_screens")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("[API] Error updating UDS result:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ udsResult: data, success: true });
  } catch (error) {
    console.error("[API] UDS results PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update UDS result" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("urine_drug_screens")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[API] Error deleting UDS result:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] UDS results DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete UDS result" },
      { status: 500 }
    );
  }
}
