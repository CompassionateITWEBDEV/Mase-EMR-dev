import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Try to fetch with mrn column first
    let { data: holds, error } = await supabase
      .from("dosing_holds")
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          mrn
        )
      `)
      .order("created_at", { ascending: false })

    // If error is due to missing mrn column, retry without it
    if (error && error.message?.includes("mrn")) {
      console.warn("[API] mrn column not found, fetching without it:", error.message)
      const retryQuery = await supabase
        .from("dosing_holds")
        .select(`
          *,
          patients (
            id,
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false })
      
      if (retryQuery.error) throw retryQuery.error
      holds = retryQuery.data
      error = null
    } else if (error) {
      throw error
    }

    const formattedHolds =
      holds?.map((hold: any) => ({
        id: hold.id,
        patient_id: hold.patient_id,
        patient_name: hold.patients ? `${hold.patients.first_name} ${hold.patients.last_name}` : "Unknown",
        mrn: hold.patients?.mrn || null,
        hold_type: hold.hold_type,
        reason: hold.reason,
        created_by: hold.created_by,
        created_by_role: hold.created_by_role,
        created_at: hold.created_at,
        requires_clearance_from: hold.requires_clearance_from || [],
        cleared_by: hold.cleared_by || [],
        status: hold.status,
        notes: hold.notes,
        severity: hold.severity,
      })) || []

    return NextResponse.json({ holds: formattedHolds })
  } catch (error: any) {
    console.error("[v0] Error fetching dosing holds:", error)
    return NextResponse.json({ holds: [], error: error.message })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("dosing_holds")
      .insert({
        patient_id: body.patient_id,
        hold_type: body.hold_type,
        reason: body.reason,
        created_by: body.created_by || "System",
        created_by_role: body.created_by_role || "Provider",
        requires_clearance_from: body.requires_clearance_from || [],
        cleared_by: [],
        status: "active",
        notes: body.notes,
        severity: body.severity || "medium",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ hold: data })
  } catch (error: any) {
    console.error("[v0] Error creating dosing hold:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Hold ID is required" }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.cleared_by !== undefined) {
      // Get current cleared_by array and append new clearance
      const { data: currentHold } = await supabase
        .from("dosing_holds")
        .select("cleared_by, requires_clearance_from")
        .eq("id", body.id)
        .single()

      if (currentHold) {
        const newClearedBy = [...(currentHold.cleared_by || []), body.cleared_by]
        updateData.cleared_by = newClearedBy

        // Check if all required clearances are met
        const allCleared = (currentHold.requires_clearance_from || []).every((req: string) =>
          newClearedBy.some((cleared: string) => cleared.toLowerCase().includes(req.toLowerCase()))
        )

        if (allCleared) {
          updateData.status = "cleared"
          updateData.cleared_at = new Date().toISOString()
        }
      }
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data, error } = await supabase
      .from("dosing_holds")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ hold: data })
  } catch (error: any) {
    console.error("[v0] Error updating dosing hold:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
