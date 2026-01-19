import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/clinical-alerts/facility/[id]
 * Update a facility alert
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.alert_type && !body.message) {
      return NextResponse.json(
        { error: "At least one field (alert_type or message) is required for update" },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.alert_type !== undefined) updateData.alert_type = body.alert_type
    if (body.message !== undefined) updateData.message = body.message
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.affected_areas !== undefined) updateData.affected_areas = body.affected_areas
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from("facility_alerts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    return NextResponse.json({ alert: data })
  } catch (error: any) {
    console.error("[API] Error updating facility alert:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/clinical-alerts/facility/[id]
 * Partially update a facility alert (for dismiss/soft delete)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Handle dismiss operation
    if (body.dismiss === true || body.is_active === false) {
      updateData.is_active = false
    }

    // Allow other fields to be updated
    if (body.alert_type !== undefined) updateData.alert_type = body.alert_type
    if (body.message !== undefined) updateData.message = body.message
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.affected_areas !== undefined) updateData.affected_areas = body.affected_areas
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from("facility_alerts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    return NextResponse.json({ alert: data })
  } catch (error: any) {
    console.error("[API] Error patching facility alert:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/clinical-alerts/facility/[id]
 * Hard delete a facility alert
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from("facility_alerts")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Alert deleted successfully" })
  } catch (error: any) {
    console.error("[API] Error deleting facility alert:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

