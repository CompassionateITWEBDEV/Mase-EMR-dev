import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET - Get patient deliveries for an EBP
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Get deliveries
    const { data: deliveries, error } = await supabase
      .from("ebp_patient_delivery")
      .select("*")
      .eq("ebp_id", ebpId)
      .order("delivery_date", { ascending: false })

    if (error) {
      console.error("Error fetching patient deliveries:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get statistics
    const totalDeliveries = deliveries?.length || 0
    const uniquePatients = new Set(deliveries?.map(d => d.patient_id)).size

    return NextResponse.json({
      success: true,
      deliveries: deliveries || [],
      statistics: {
        total: totalDeliveries,
        uniquePatients,
      },
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/evidence-based-practices/[id]/patient-deliveries:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST - Record a patient delivery
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id
    const body = await request.json()

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Validation
    if (!body.patient_id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    // Date validation
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deliveryDate = body.delivery_date || new Date().toISOString().split('T')[0]
    const deliveryDateObj = new Date(deliveryDate)
    deliveryDateObj.setHours(0, 0, 0, 0)
    
    if (deliveryDateObj > today) {
      return NextResponse.json({ error: "Delivery date cannot be in the future" }, { status: 400 })
    }

    // Duplicate prevention: Check if same patient, same EBP, same date already exists
    const { data: existingDelivery, error: checkError } = await supabase
      .from("ebp_patient_delivery")
      .select("id")
      .eq("ebp_id", ebpId)
      .eq("patient_id", body.patient_id)
      .eq("delivery_date", deliveryDate)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking for duplicate delivery:", checkError)
      return NextResponse.json({ error: "Error checking for duplicate delivery" }, { status: 500 })
    }

    if (existingDelivery) {
      return NextResponse.json({ 
        error: "A delivery for this patient on this date already exists. Please use a different date or update the existing record." 
      }, { status: 409 }) // 409 Conflict
    }

    // Prepare delivery data
    const deliveryData = {
      ebp_id: ebpId,
      patient_id: body.patient_id,
      organization_id: body.organization_id || null,
      delivery_date: deliveryDate,
      delivery_type: body.delivery_type || 'session',
      encounter_id: body.encounter_id || null, // Link to clinical encounter if provided
      delivered_by: body.delivered_by || null,
      notes: body.notes || null,
    }

    // Insert delivery
    const { data, error } = await supabase
      .from("ebp_patient_delivery")
      .insert(deliveryData)
      .select()
      .single()

    if (error) {
      console.error("Error creating patient delivery:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      delivery: data,
      message: "Patient delivery recorded successfully",
    }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in POST /api/evidence-based-practices/[id]/patient-deliveries:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

