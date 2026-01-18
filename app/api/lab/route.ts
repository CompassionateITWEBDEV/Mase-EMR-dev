import { createServiceClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch lab orders with patient info
    const { data: orders, error: ordersError } = await supabase
      .from("lab_orders")
      .select(`
        *,
        patients:patient_id (first_name, last_name)
      `)
      .order("order_date", { ascending: false })

    if (ordersError) throw ordersError

    // Fetch lab results with patient info
    const { data: results, error: resultsError } = await supabase
      .from("lab_results")
      .select(`
        *,
        patients:patient_id (first_name, last_name)
      `)
      .order("result_date", { ascending: false })

    if (resultsError) throw resultsError

    // Fetch patients for the form
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .order("last_name")

    if (patientsError) throw patientsError

    // Transform the data
    const formattedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      patientName: order.patients ? `${order.patients.first_name} ${order.patients.last_name}` : "Unknown Patient",
      patientId: order.patient_id,
      testNames: order.test_names || [],
      testCodes: order.test_codes || [],
      orderDate: order.order_date,
      status: order.status || "pending",
      priority: order.priority || "routine",
      labName: order.lab_name || "Unknown Lab",
      labNpi: order.lab_npi,
      collectionDate: order.collection_date,
      collectionMethod: order.collection_method,
      specimenType: order.specimen_type,
      notes: order.notes,
    }))

    const formattedResults = (results || []).map((result: any) => ({
      id: result.id,
      patientName: result.patients ? `${result.patients.first_name} ${result.patients.last_name}` : "Unknown Patient",
      patientId: result.patient_id,
      labOrderId: result.lab_order_id,
      testName: result.test_name,
      testCode: result.test_code,
      result: result.result_value,
      referenceRange: result.reference_range,
      units: result.units,
      abnormalFlag: result.abnormal_flag,
      resultDate: result.result_date,
      status: result.status || "final",
      notes: result.notes,
    }))

    return NextResponse.json({
      orders: formattedOrders,
      results: formattedResults,
      patients: patients || [],
    })
  } catch (error) {
    console.error("Error fetching lab data:", error)
    return NextResponse.json({ error: "Failed to fetch lab data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { type, ...data } = body

    if (type === "order") {
      // Create lab order
      const { data: order, error } = await supabase
        .from("lab_orders")
        .insert({
          patient_id: data.patientId,
          provider_id: data.providerId,
          lab_name: data.labName,
          lab_npi: data.labNpi,
          test_names: data.testNames,
          test_codes: data.testCodes,
          priority: data.priority,
          specimen_type: data.specimenType,
          collection_method: data.collectionMethod,
          notes: data.notes,
          status: "pending",
          order_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, order })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Error creating lab order:", error)
    return NextResponse.json({ error: "Failed to create lab order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, type, ...data } = body

    if (type === "order") {
      const { error } = await supabase
        .from("lab_orders")
        .update({
          status: data.status,
          collection_date: data.collectionDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (type === "result") {
      const { error } = await supabase
        .from("lab_results")
        .update({
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Error updating lab data:", error)
    return NextResponse.json({ error: "Failed to update lab data" }, { status: 500 })
  }
}
