import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)

  const isActive = searchParams.get("is_active")
  const acceptsEPrescribing = searchParams.get("accepts_e_prescribing")

  let query = supabase.from("pharmacies").select("*").order("name", { ascending: true })

  if (isActive !== null) {
    query = query.eq("is_active", isActive === "true")
  }

  if (acceptsEPrescribing !== null) {
    query = query.eq("accepts_e_prescribing", acceptsEPrescribing === "true")
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching pharmacies:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pharmacies: data })
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const pharmacyData = {
    name: body.name,
    address: body.address || null,
    city: body.city || null,
    state: body.state || null,
    zip_code: body.zip_code || null,
    phone: body.phone || null,
    fax: body.fax || null,
    email: body.email || null,
    ncpdp_id: body.ncpdp_id || null,
    npi: body.npi || null,
    is_active: body.is_active ?? true,
    accepts_e_prescribing: body.accepts_e_prescribing ?? true,
    hours_of_operation: body.hours_of_operation || null,
    notes: body.notes || null,
  }

  const { data, error } = await supabase.from("pharmacies").insert([pharmacyData]).select().single()

  if (error) {
    console.error("[v0] Error creating pharmacy:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pharmacy: data })
}

export async function PUT(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "Pharmacy ID is required" }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("pharmacies")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating pharmacy:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pharmacy: data })
}

export async function DELETE(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const hardDelete = searchParams.get("hard") === "true"

  if (!id) {
    return NextResponse.json({ error: "Pharmacy ID is required" }, { status: 400 })
  }

  if (hardDelete) {
    // Hard delete - actually remove the record
    const { error } = await supabase.from("pharmacies").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting pharmacy:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // Soft delete - mark as inactive
    const { error } = await supabase
      .from("pharmacies")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error deactivating pharmacy:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
