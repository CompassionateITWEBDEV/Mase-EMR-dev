import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/middleware"

/**
 * GET /api/medication-order-requests
 * Fetch medication order requests for a physician
 * 
 * Query params:
 * - physician_id: Filter by specific physician (optional - if not provided, fetches all pending orders)
 * - status: Filter by status (default: "pending_physician_review", use "all" to get all statuses)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    // In development, allow requests to proceed with service client if auth fails
    if (authError || !user) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unauthorized", orders: [] },
          { status: 401 }
        )
      } else {
        console.warn("[medication-order-requests] Development mode: Allowing request without authentication")
      }
    }

    // Always use service client to bypass RLS for reliable data access
    // This ensures we can fetch patient and nurse data properly
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const physicianId = searchParams.get("physician_id")
    const status = searchParams.get("status") || "pending_physician_review"

    console.log("[medication-order-requests] GET request:", { 
      physicianId, 
      status,
      userId: user?.id 
    })

    // Build query - fetch orders without join first (to avoid RLS issues on patients table)
    let query = supabase
      .from("medication_order_requests")
      .select("*")

    // If physician_id is provided and not "all", filter by it
    // Otherwise, fetch all orders (useful for admin view or when no physician filter needed)
    if (physicianId && physicianId !== "all") {
      query = query.eq("physician_id", physicianId)
    }

    // Filter by status if provided and not "all"
    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data: orders, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[medication-order-requests] Error fetching orders:", error)
      return NextResponse.json(
        { error: "Failed to fetch orders", orders: [], details: error.message },
        { status: 500 }
      )
    }

    console.log("[medication-order-requests] Found orders:", orders?.length || 0)

    // Fetch patient information separately (more reliable than join with RLS)
    const patientIds = [...new Set((orders || []).map((o: any) => o.patient_id).filter(Boolean))]
    const patientMap = new Map<string, any>()
    
    if (patientIds.length > 0) {
      console.log("[medication-order-requests] Fetching patients for IDs:", patientIds)
      const { data: patients, error: patientError } = await supabase
        .from("patients")
        .select("id, first_name, last_name, date_of_birth, client_number")
        .in("id", patientIds)
      
      if (patientError) {
        console.error("[medication-order-requests] Error fetching patients:", patientError)
      } else {
        console.log("[medication-order-requests] Found patients:", patients?.length || 0)
        patients?.forEach((patient: any) => {
          patientMap.set(patient.id, patient)
        })
      }
    }

    // Fetch nurse information separately
    const nurseIds = [...new Set((orders || []).map((o: any) => o.nurse_id).filter(Boolean))]
    const nurseMap = new Map<string, any>()
    
    if (nurseIds.length > 0) {
      console.log("[medication-order-requests] Fetching nurses for IDs:", nurseIds)
      const { data: nurses, error: nurseError } = await supabase
        .from("staff")
        .select("id, first_name, last_name, employee_id")
        .in("id", nurseIds)
      
      if (nurseError) {
        console.error("[medication-order-requests] Error fetching nurses:", nurseError)
      } else {
        console.log("[medication-order-requests] Found nurses:", nurses?.length || 0)
        nurses?.forEach((nurse: any) => {
          nurseMap.set(nurse.id, nurse)
        })
      }
    }

    // Format orders for frontend
    const formattedOrders = (orders || []).map((order: any) => {
      const patient = patientMap.get(order.patient_id)
      const nurse = nurseMap.get(order.nurse_id)
      
      console.log("[medication-order-requests] Formatting order:", {
        orderId: order.id,
        patientId: order.patient_id,
        nurseId: order.nurse_id,
        patientFound: !!patient,
        nurseFound: !!nurse
      })
      
      return {
        id: order.id,
        patient_id: order.patient_id,
        patient_name: patient
          ? `${patient.first_name} ${patient.last_name}`
          : "Unknown Patient",
        patient_dob: patient?.date_of_birth,
        patient_client_number: patient?.client_number,
        order_type: order.order_type,
        current_dose_mg: order.current_dose_mg,
        requested_dose_mg: order.requested_dose_mg,
        clinical_justification: order.clinical_justification,
        physician_id: order.physician_id,
        nurse_id: order.nurse_id,
        nurse_name: nurse
          ? `${nurse.first_name} ${nurse.last_name}`
          : "Unknown Nurse",
        nurse_employee_id: nurse?.employee_id,
        nurse_signature: order.nurse_signature,
        physician_signature: order.physician_signature,
        status: order.status,
        physician_review_notes: order.physician_review_notes,
        reviewed_at: order.reviewed_at,
        created_at: order.created_at,
        updated_at: order.updated_at,
      }
    })

    return NextResponse.json({ 
      orders: formattedOrders,
      debug: process.env.NODE_ENV !== "production" ? {
        totalOrders: orders?.length || 0,
        patientsFound: patientMap.size,
        nursesFound: nurseMap.size,
        physicianIdFilter: physicianId,
        statusFilter: status
      } : undefined
    })
  } catch (error) {
    console.error("[medication-order-requests] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", orders: [] },
      { status: 500 }
    )
  }
}

/**
 * POST /api/medication-order-requests
 * Create a new medication order request
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    // In development, allow requests to proceed with service client if auth fails
    // This enables testing without full authentication setup
    if (authError || !user) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      } else {
        console.warn("[medication-order-requests] Development mode: Allowing request without authentication")
      }
    }

    const body = await request.json()
    const {
      patient_id,
      order_type,
      current_dose_mg,
      requested_dose_mg,
      clinical_justification,
      physician_id,
      nurse_signature,
      taper_schedule,
      split_ratio,
    } = body

    console.log("[medication-order-requests] POST request body:", {
      patient_id,
      order_type,
      current_dose_mg,
      requested_dose_mg,
      physician_id,
      nurse_id: body.nurse_id,
      userId: user?.id,
      hasNurseSignature: !!nurse_signature
    })

    // Validation
    if (!patient_id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      )
    }

    if (!order_type || !["increase", "decrease", "hold", "taper", "split"].includes(order_type)) {
      return NextResponse.json(
        { error: "Valid order type is required (increase, decrease, hold, taper, split)" },
        { status: 400 }
      )
    }

    if (!physician_id) {
      return NextResponse.json(
        { error: "Physician ID is required" },
        { status: 400 }
      )
    }

    if (!clinical_justification || clinical_justification.trim().length === 0) {
      return NextResponse.json(
        { error: "Clinical justification is required" },
        { status: 400 }
      )
    }

    // Validate requested dose based on order type
    if (order_type === "increase" || order_type === "decrease" || order_type === "taper" || order_type === "split") {
      if (!requested_dose_mg || isNaN(Number(requested_dose_mg)) || Number(requested_dose_mg) <= 0) {
        return NextResponse.json(
          { error: "Valid requested dose (mg) is required" },
          { status: 400 }
        )
      }

      const requestedDose = Number(requested_dose_mg)
      const currentDose = Number(current_dose_mg) || 0

      if (order_type === "increase" && requestedDose <= currentDose) {
        return NextResponse.json(
          { error: "Requested dose must be greater than current dose for increase orders" },
          { status: 400 }
        )
      }

      if (order_type === "decrease" && requestedDose >= currentDose) {
        return NextResponse.json(
          { error: "Requested dose must be less than current dose for decrease orders" },
          { status: 400 }
        )
      }

      if (order_type === "taper" && requestedDose >= currentDose) {
        return NextResponse.json(
          { error: "Target dose must be less than current dose for taper orders" },
          { status: 400 }
        )
      }
    }

    // Always use service client to bypass RLS and ensure proper data insertion
    const supabase = createServiceClient()

    // Determine nurse_id - try to find a valid staff member
    let nurseId = body.nurse_id || user?.id
    let nurseName = "Unknown Nurse"
    
    // If we have a nurse_id, verify it exists in staff table
    if (nurseId) {
      const { data: nurseData, error: nurseError } = await supabase
        .from("staff")
        .select("id, first_name, last_name")
        .eq("id", nurseId)
        .single()
      
      if (nurseData) {
        nurseName = `${nurseData.first_name} ${nurseData.last_name}`
        console.log("[medication-order-requests] Found nurse:", nurseName)
      } else {
        console.warn("[medication-order-requests] Nurse not found in staff table:", nurseId, nurseError)
        // Try to find any active nurse to use as fallback for development
        if (process.env.NODE_ENV !== "production") {
          const { data: anyNurse } = await supabase
            .from("staff")
            .select("id, first_name, last_name")
            .eq("is_active", true)
            .limit(1)
            .single()
          
          if (anyNurse) {
            nurseId = anyNurse.id
            nurseName = `${anyNurse.first_name} ${anyNurse.last_name}`
            console.log("[medication-order-requests] Using fallback nurse:", nurseName)
          }
        }
      }
    }

    // Verify patient exists
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("id", patient_id)
      .single()
    
    if (patientError || !patientData) {
      console.error("[medication-order-requests] Patient not found:", patient_id, patientError)
      return NextResponse.json(
        { error: "Patient not found", details: patientError?.message },
        { status: 400 }
      )
    }

    console.log("[medication-order-requests] Creating order:", {
      patientId: patient_id,
      patientName: `${patientData.first_name} ${patientData.last_name}`,
      nurseId,
      nurseName,
      physicianId: physician_id
    })

    // Insert order request
    const { data: order, error } = await supabase
      .from("medication_order_requests")
      .insert({
        patient_id,
        order_type,
        current_dose_mg: current_dose_mg || 0,
        requested_dose_mg: requested_dose_mg || null,
        clinical_justification: clinical_justification.trim(),
        physician_id,
        nurse_id: nurseId,
        nurse_signature: nurse_signature || null,
        status: nurse_signature ? "pending_physician_review" : "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (error) {
      console.error("[medication-order-requests] Error creating order:", error)
      return NextResponse.json(
        { error: "Failed to create order request", details: error.message },
        { status: 500 }
      )
    }

    console.log("[medication-order-requests] Order created successfully:", order.id)

    // Format response
    const formattedOrder = {
      id: order.id,
      patient_id: order.patient_id,
      patient_name: `${patientData.first_name} ${patientData.last_name}`,
      order_type: order.order_type,
      current_dose_mg: order.current_dose_mg,
      requested_dose_mg: order.requested_dose_mg,
      clinical_justification: order.clinical_justification,
      physician_id: order.physician_id,
      nurse_id: order.nurse_id,
      nurse_name: nurseName,
      status: order.status,
      created_at: order.created_at,
    }

    return NextResponse.json({ order: formattedOrder }, { status: 201 })
  } catch (error) {
    console.error("[medication-order-requests] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/medication-order-requests
 * Update order status (approve/deny)
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    
    // In development, allow requests to proceed with service client if auth fails
    if (authError || !user) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      } else {
        console.warn("[medication-order-requests] Development mode: Allowing request without authentication")
      }
    }

    const body = await request.json()
    const { order_id, status, physician_signature, physician_review_notes } = body

    console.log("[medication-order-requests] PUT request:", {
      orderId: order_id,
      status,
      hasSignature: !!physician_signature,
      hasNotes: !!physician_review_notes
    })

    if (!order_id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    if (!status || !["approved", "denied"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (approved or denied)" },
        { status: 400 }
      )
    }

    if (status === "approved" && !physician_signature) {
      return NextResponse.json(
        { error: "Physician signature is required for approval" },
        { status: 400 }
      )
    }

    if (status === "denied" && !physician_review_notes) {
      return NextResponse.json(
        { error: "Review notes are required for denial" },
        { status: 400 }
      )
    }

    // Always use service client to bypass RLS
    const supabase = createServiceClient()

    // Update order
    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (physician_signature) {
      updateData.physician_signature = physician_signature
    }

    if (physician_review_notes) {
      updateData.physician_review_notes = physician_review_notes.trim()
    }

    const { data: order, error } = await supabase
      .from("medication_order_requests")
      .update(updateData)
      .eq("id", order_id)
      .select("*")
      .single()

    if (error) {
      console.error("[medication-order-requests] Error updating order:", error)
      return NextResponse.json(
        { error: "Failed to update order", details: error.message },
        { status: 500 }
      )
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Fetch patient information
    let patientName = "Unknown Patient"
    if (order.patient_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .eq("id", order.patient_id)
        .single()
      
      if (patient) {
        patientName = `${patient.first_name} ${patient.last_name}`
      }
    }

    // Fetch nurse information
    let nurseName = "Unknown Nurse"
    if (order.nurse_id) {
      const { data: nurse } = await supabase
        .from("staff")
        .select("id, first_name, last_name")
        .eq("id", order.nurse_id)
        .single()
      
      if (nurse) {
        nurseName = `${nurse.first_name} ${nurse.last_name}`
      }
    }

    console.log("[medication-order-requests] Order updated successfully:", {
      orderId: order.id,
      status: order.status,
      patientName,
      nurseName
    })

    // Format response
    const formattedOrder = {
      id: order.id,
      patient_id: order.patient_id,
      patient_name: patientName,
      order_type: order.order_type,
      current_dose_mg: order.current_dose_mg,
      requested_dose_mg: order.requested_dose_mg,
      clinical_justification: order.clinical_justification,
      physician_id: order.physician_id,
      nurse_id: order.nurse_id,
      nurse_name: nurseName,
      status: order.status,
      physician_signature: order.physician_signature,
      physician_review_notes: order.physician_review_notes,
      reviewed_at: order.reviewed_at,
      updated_at: order.updated_at,
    }

    return NextResponse.json({ order: formattedOrder })
  } catch (error) {
    console.error("[medication-order-requests] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
