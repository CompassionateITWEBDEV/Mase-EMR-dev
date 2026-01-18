import { createServiceClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");
    const documentType = searchParams.get("document_type");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!patientId) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    let query = supabase
      .from("documents")
      .select("*")
      .eq("patient_id", patientId)
      .order("document_date", { ascending: false })
      .limit(limit);

    if (documentType) {
      query = query.eq("document_type", documentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API] Error fetching documents:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data || [] });
  } catch (error) {
    console.error("[API] Documents GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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

    if (!body.document_type) {
      return NextResponse.json(
        { error: "document_type is required" },
        { status: 400 }
      );
    }

    // Build document data object
    const documentData: Record<string, unknown> = {
      patient_id: body.patient_id,
      document_type: body.document_type,
      document_date: body.document_date || new Date().toISOString().split("T")[0],
    };

    // Add optional fields
    if (body.title) documentData.title = body.title;
    if (body.description) documentData.description = body.description;
    if (body.file_name) documentData.file_name = body.file_name;
    if (body.file_url) documentData.file_url = body.file_url;
    if (body.file_size) documentData.file_size = body.file_size;
    if (body.mime_type) documentData.mime_type = body.mime_type;
    if (body.uploaded_by) documentData.uploaded_by = body.uploaded_by;
    if (body.status) documentData.status = body.status;
    if (body.expiration_date) documentData.expiration_date = body.expiration_date;
    if (body.notes) documentData.notes = body.notes;
    
    // Court order specific fields
    if (body.court_name) documentData.court_name = body.court_name;
    if (body.order_details) documentData.order_details = body.order_details;
    if (body.case_number) documentData.case_number = body.case_number;

    console.log("[API] Creating document:", documentData);

    const { data, error } = await supabase
      .from("documents")
      .insert(documentData)
      .select()
      .single();

    if (error) {
      console.error("[API] Error creating document:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API] Document created successfully:", data.id);
    return NextResponse.json({ document: data, success: true });
  } catch (error) {
    console.error("[API] Documents POST error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Update fields if provided
    if (body.document_type !== undefined) updateData.document_type = body.document_type;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.document_date !== undefined) updateData.document_date = body.document_date;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.expiration_date !== undefined) updateData.expiration_date = body.expiration_date;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("[API] Error updating document:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data, success: true });
  } catch (error) {
    console.error("[API] Documents PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
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
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[API] Error deleting document:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Documents DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
