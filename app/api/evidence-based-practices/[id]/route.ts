import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Helper function to create Supabase service client
function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// GET - Get a single EBP by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Get EBP
    const { data: ebp, error } = await supabase
      .from("evidence_based_practices")
      .select("*")
      .eq("id", ebpId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "EBP not found" }, { status: 404 })
      }
      console.error("Error fetching EBP:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Parse outcomes_tracked
    const ebpWithOutcomes = {
      ...ebp,
      outcomes_tracked: ebp.outcomes_tracked ? (typeof ebp.outcomes_tracked === 'string' ? JSON.parse(ebp.outcomes_tracked) : ebp.outcomes_tracked) : [],
    }

    return NextResponse.json({
      success: true,
      ebp: ebpWithOutcomes,
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/evidence-based-practices/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// PATCH - Update an EBP
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id
    const body = await request.json()

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Validate category if provided
    if (body.category) {
      const validCategories = ["Counseling", "Behavioral", "Medical", "Organizational"]
      if (!validCategories.includes(body.category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.category !== undefined) updateData.category = body.category
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.outcomes_tracked !== undefined) {
      // JSONB columns accept JavaScript arrays directly - no need to stringify
      updateData.outcomes_tracked = Array.isArray(body.outcomes_tracked) 
        ? body.outcomes_tracked 
        : (typeof body.outcomes_tracked === 'string' ? JSON.parse(body.outcomes_tracked) : [])
    }
    if (body.total_staff !== undefined) {
      // Handle both number and string types
      updateData.total_staff = typeof body.total_staff === 'number' 
        ? body.total_staff 
        : parseInt(String(body.total_staff)) || 0
    }
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Update EBP
    const { data, error } = await supabase
      .from("evidence_based_practices")
      .update(updateData)
      .eq("id", ebpId)
      .select()
      .single()

    if (error) {
      console.error("Error updating EBP:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Parse outcomes_tracked
    const ebp = {
      ...data,
      outcomes_tracked: data.outcomes_tracked ? (typeof data.outcomes_tracked === 'string' ? JSON.parse(data.outcomes_tracked) : data.outcomes_tracked) : [],
    }

    return NextResponse.json({
      success: true,
      ebp: ebp,
      message: "EBP updated successfully",
    })
  } catch (error) {
    console.error("Unexpected error in PATCH /api/evidence-based-practices/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete an EBP
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("evidence_based_practices")
      .update({ is_active: false })
      .eq("id", ebpId)

    if (error) {
      console.error("Error deleting EBP:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "EBP deleted successfully",
    })
  } catch (error) {
    console.error("Unexpected error in DELETE /api/evidence-based-practices/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

