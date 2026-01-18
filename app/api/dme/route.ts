import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    // Get DME Suppliers
    if (action === "suppliers") {
      const { data: suppliers, error } = await supabase
        .from("dme_suppliers")
        .select("*")
        .eq("status", "active")
        .order("supplier_name")

      if (error) throw error

      return NextResponse.json({ suppliers: suppliers || [] })
    }

    // Get DME Orders
    if (action === "orders") {
      const patientId = searchParams.get("patientId")

      let query = supabase
        .from("dme_orders")
        .select(`
          *,
          patients(id, first_name, last_name, date_of_birth),
          providers(id, first_name, last_name),
          dme_suppliers(supplier_name, phone)
        `)
        .order("order_date", { ascending: false })

      if (patientId) {
        query = query.eq("patient_id", patientId)
      }

      const { data: orders, error } = await query

      if (error) throw error

      return NextResponse.json({ orders: orders || [] })
    }

    const { data: pendingOrders } = await supabase
      .from("dme_orders")
      .select("id", { count: "exact" })
      .eq("status", "pending")

    const { data: processingOrders } = await supabase
      .from("dme_orders")
      .select("id", { count: "exact" })
      .eq("status", "processing")

    const { data: deliveredOrders } = await supabase
      .from("dme_orders")
      .select("id", { count: "exact" })
      .eq("delivery_status", "delivered")

    const { data: allOrders } = await supabase.from("dme_orders").select("id", { count: "exact" })

    const { data: patients } = await supabase
      .from("patients")
      .select("id, first_name, last_name, date_of_birth")
      .order("last_name")
      .limit(200)

    const { data: providers } = await supabase
      .from("providers")
      .select("id, first_name, last_name, specialization, license_type")
      .order("last_name")

    return NextResponse.json({
      stats: {
        pending: pendingOrders?.length || 0,
        in_process: processingOrders?.length || 0,
        delivered: deliveredOrders?.length || 0,
        total: allOrders?.length || 0,
      },
      patients: patients || [],
      providers: providers || [],
    })
  } catch (error: any) {
    console.error("[v0] DME API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch DME data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Create DME Supplier
    if (action === "create-supplier") {
      const { data, error } = await supabase
        .from("dme_suppliers")
        .insert({
          supplier_name: body.supplierName,
          contact_name: body.contactName,
          phone: body.phone,
          email: body.email,
          address: body.address,
          city: body.city,
          state: body.state,
          zip: body.zip,
          npi: body.npi,
          specialties: body.specialties || [],
          status: "active",
        })
        .select()
        .single()

      if (error) throw error

      // Log to audit trail
      await supabase.from("audit_trail").insert({
        action: "dme_supplier_created",
        table_name: "dme_suppliers",
        new_values: { supplier_id: data.id, name: body.supplierName },
      })

      return NextResponse.json({ success: true, supplier: data })
    }

    // Create DME Order
    if (action === "create-order") {
      const orderNumber = `DME-${Date.now()}`

      const { data, error } = await supabase
        .from("dme_orders")
        .insert({
          patient_id: body.patientId,
          provider_id: body.providerId,
          supplier_id: body.supplierId || null,
          order_date: body.orderDate || new Date().toISOString().split("T")[0],
          order_number: orderNumber,
          urgency: body.urgency || "Routine",
          equipment_category: body.equipmentCategory,
          equipment_name: body.equipmentName,
          hcpcs_code: body.hcpcsCode,
          quantity: body.quantity || 1,
          rental_or_purchase: body.rentalOrPurchase,
          diagnosis_codes: body.diagnosisCodes || [],
          clinical_indication: body.clinicalIndication,
          prior_auth_required: body.priorAuthRequired || false,
          delivery_address: body.deliveryAddress,
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      // Log to audit trail
      await supabase.from("audit_trail").insert({
        action: "dme_order_created",
        table_name: "dme_orders",
        patient_id: body.patientId,
        new_values: { order_id: data.id, equipment: body.equipmentName },
      })

      return NextResponse.json({ success: true, order: data })
    }

    // Update Order Status
    if (action === "update-status") {
      const { data, error } = await supabase
        .from("dme_orders")
        .update({
          status: body.status,
          delivery_status: body.deliveryStatus,
          delivery_date: body.deliveryDate,
          tracking_number: body.trackingNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.orderId)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, order: data })
    }

    if (action === "delete-order") {
      const { error } = await supabase.from("dme_orders").delete().eq("id", body.orderId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] DME API POST error:", error)
    return NextResponse.json({ error: error.message || "Failed to process DME request" }, { status: 500 })
  }
}
