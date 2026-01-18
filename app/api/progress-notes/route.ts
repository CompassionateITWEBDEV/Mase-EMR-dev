import { createServiceClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");
    const noteType = searchParams.get("note_type");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!patientId) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    let query = supabase
      .from("progress_notes")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (noteType) {
      query = query.eq("note_type", noteType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API] Error fetching progress notes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progressNotes: data || [] });
  } catch (error) {
    console.error("[API] Progress notes GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress notes" },
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

    // Build note data object
    // Note: note_date column doesn't exist in the schema - using created_at (auto-set by database)
    const noteData: Record<string, unknown> = {
      patient_id: body.patient_id,
      note_type: body.note_type || "progress_note",
    };

    // Add optional fields if provided
    if (body.provider_id) noteData.provider_id = body.provider_id;
    if (body.appointment_id) noteData.appointment_id = body.appointment_id;
    
    // SOAP note fields
    if (body.subjective) noteData.subjective = body.subjective;
    if (body.objective) noteData.objective = body.objective;
    if (body.assessment) noteData.assessment = body.assessment;
    if (body.plan) noteData.plan = body.plan;
    
    // Full note (for non-SOAP notes)
    if (body.full_note) noteData.full_note = body.full_note;
    
    // Additional fields
    if (body.chief_complaint) noteData.chief_complaint = body.chief_complaint;
    if (body.diagnosis_codes) noteData.diagnosis_codes = body.diagnosis_codes;
    if (body.cpt_codes) noteData.cpt_codes = body.cpt_codes;
    if (body.author_id) noteData.author_id = body.author_id;
    if (body.cosigner_id) noteData.cosigner_id = body.cosigner_id;
    if (body.is_signed !== undefined) noteData.is_signed = body.is_signed;
    if (body.signed_at) noteData.signed_at = body.signed_at;

    console.log("[API] Creating progress note:", noteData);

    const { data, error } = await supabase
      .from("progress_notes")
      .insert(noteData)
      .select()
      .single();

    if (error) {
      console.error("[API] Error creating progress note:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API] Progress note created successfully:", data.id);
    return NextResponse.json({ progressNote: data, success: true });
  } catch (error) {
    console.error("[API] Progress notes POST error:", error);
    return NextResponse.json(
      { error: "Failed to create progress note" },
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
    // Note: note_date column doesn't exist in the schema - using created_at (auto-set)
    if (body.note_type !== undefined) updateData.note_type = body.note_type;
    if (body.subjective !== undefined) updateData.subjective = body.subjective;
    if (body.objective !== undefined) updateData.objective = body.objective;
    if (body.assessment !== undefined) updateData.assessment = body.assessment;
    if (body.plan !== undefined) updateData.plan = body.plan;
    if (body.full_note !== undefined) updateData.full_note = body.full_note;
    if (body.chief_complaint !== undefined) updateData.chief_complaint = body.chief_complaint;
    if (body.is_signed !== undefined) updateData.is_signed = body.is_signed;
    if (body.signed_at !== undefined) updateData.signed_at = body.signed_at;
    if (body.cosigner_id !== undefined) updateData.cosigner_id = body.cosigner_id;

    const { data, error } = await supabase
      .from("progress_notes")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("[API] Error updating progress note:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progressNote: data, success: true });
  } catch (error) {
    console.error("[API] Progress notes PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update progress note" },
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
      .from("progress_notes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[API] Error deleting progress note:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Progress notes DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete progress note" },
      { status: 500 }
    );
  }
}
