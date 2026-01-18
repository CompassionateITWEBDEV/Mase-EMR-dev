import { createServiceClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/patients/[id]/medications
 * Fetch all medications for a specific patient
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get("status") // 'active', 'discontinued', 'all'
    const includeHistory = searchParams.get("include_history") === "true"

    let query = supabase
      .from("patient_medications")
      .select(`
        *,
        prescriber:prescribed_by (
          id,
          first_name,
          last_name
        ),
        pharmacy:pharmacy_id (
          id,
          name,
          phone,
          address
        )
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    // Filter by status if specified
    if (status && status !== "all") {
      query = query.eq("status", status)
    } else if (!includeHistory) {
      // Default to active medications only
      query = query.eq("status", "active")
    }

    const { data: medications, error } = await query

    if (error) {
      console.error("Error fetching patient medications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    const formattedMedications = (medications || []).map((med) => ({
      ...med,
      prescriber_name: med.prescriber 
        ? `Dr. ${med.prescriber.first_name} ${med.prescriber.last_name}` 
        : null,
      pharmacy_name: med.pharmacy?.name || null,
    }))

    return NextResponse.json({ 
      medications: formattedMedications,
      total: formattedMedications.length 
    })
  } catch (error) {
    console.error("Error in patient medications GET:", error)
    return NextResponse.json({ error: "Failed to fetch medications" }, { status: 500 })
  }
}

/**
 * POST /api/patients/[id]/medications
 * Add a new medication to the patient's list
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const supabase = createServiceClient()
    const body = await request.json()

    // Validate required fields
    if (!body.medication_name || !body.dosage || !body.frequency) {
      return NextResponse.json(
        { error: "Medication name, dosage, and frequency are required" },
        { status: 400 }
      )
    }

    const medicationData = {
      patient_id: patientId,
      medication_name: body.medication_name,
      generic_name: body.generic_name || null,
      dosage: body.dosage,
      frequency: body.frequency,
      route: body.route || "oral",
      start_date: body.start_date || new Date().toISOString().split("T")[0],
      end_date: body.end_date || null,
      prescribed_by: body.prescribed_by || null,
      medication_type: body.medication_type || "regular", // regular, prn, controlled
      ndc_number: body.ndc_number || null,
      pharmacy_id: body.pharmacy_id || null,
      refills_remaining: body.refills_remaining || 0,
      status: body.status || "active",
      notes: body.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("patient_medications")
      .insert(medicationData)
      .select()
      .single()

    if (error) {
      console.error("Error creating patient medication:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error in patient medications POST:", error)
    return NextResponse.json({ error: "Failed to create medication" }, { status: 500 })
  }
}

/**
 * PUT /api/patients/[id]/medications
 * Update an existing medication
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const supabase = createServiceClient()
    const body = await request.json()

    if (!body.medication_id) {
      return NextResponse.json(
        { error: "Medication ID is required" },
        { status: 400 }
      )
    }

    const { medication_id, ...updates } = body
    updates.updated_at = new Date().toISOString()

    // Verify the medication belongs to this patient
    const { data: existing } = await supabase
      .from("patient_medications")
      .select("id")
      .eq("id", medication_id)
      .eq("patient_id", patientId)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: "Medication not found for this patient" },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from("patient_medications")
      .update(updates)
      .eq("id", medication_id)
      .eq("patient_id", patientId)
      .select()
      .single()

    if (error) {
      console.error("Error updating patient medication:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in patient medications PUT:", error)
    return NextResponse.json({ error: "Failed to update medication" }, { status: 500 })
  }
}

/**
 * DELETE /api/patients/[id]/medications
 * Discontinue (soft-delete) a medication
 * Query param: medication_id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const medicationId = searchParams.get("medication_id")
    const reason = searchParams.get("reason") || "Discontinued by provider"
    const discontinuedBy = searchParams.get("discontinued_by")

    if (!medicationId) {
      return NextResponse.json(
        { error: "Medication ID is required" },
        { status: 400 }
      )
    }

    // Verify the medication belongs to this patient
    const { data: existing } = await supabase
      .from("patient_medications")
      .select("id, status")
      .eq("id", medicationId)
      .eq("patient_id", patientId)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: "Medication not found for this patient" },
        { status: 404 }
      )
    }

    // Soft delete - mark as discontinued
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("patient_medications")
      .update({
        status: "discontinued",
        end_date: now.split("T")[0],
        discontinuation_reason: reason,
        discontinued_by: discontinuedBy || null,
        discontinued_at: now,
        updated_at: now,
      })
      .eq("id", medicationId)
      .eq("patient_id", patientId)
      .select()
      .single()

    if (error) {
      console.error("Error discontinuing patient medication:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      medication: data,
      message: "Medication discontinued successfully" 
    })
  } catch (error) {
    console.error("Error in patient medications DELETE:", error)
    return NextResponse.json({ error: "Failed to discontinue medication" }, { status: 500 })
  }
}
