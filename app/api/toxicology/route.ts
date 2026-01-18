import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    // Get Settings
    if (action === "settings") {
      const { data: settings, error } = await supabase
        .from("toxicology_settings")
        .select("*")
        .limit(1)
        .single()

      // Return default settings if none exist
      if (error || !settings) {
        return NextResponse.json({
          settings: {
            default_collection_method: "Urine",
            observed_collection_policy: "clinical",
            default_test_panel: null,
            auto_send_to_lab: false,
            preferred_lab_id: null,
          }
        })
      }

      return NextResponse.json({ settings })
    }

    // Get Toxicology Labs
    if (action === "labs") {
      const { data: labs, error } = await supabase
        .from("toxicology_labs")
        .select("*")
        .eq("status", "active")
        .order("lab_name")

      if (error) throw error

      return NextResponse.json({ labs: labs || [] })
    }

    // Get Toxicology Orders
    if (action === "orders") {
      const patientId = searchParams.get("patientId")

      let query = supabase
        .from("toxicology_orders")
        .select(`
          *,
          patients(id, first_name, last_name),
          providers(id, first_name, last_name),
          toxicology_labs(lab_name, phone)
        `)
        .order("order_date", { ascending: false })

      if (patientId) {
        query = query.eq("patient_id", patientId)
      }

      const { data: orders, error } = await query

      if (error) throw error

      // Get results for each order
      for (const order of orders || []) {
        const { data: results } = await supabase.from("toxicology_results").select("*").eq("order_id", order.id)

        order.results = results || []
      }

      return NextResponse.json({ orders: orders || [] })
    }

    // Get Pending Results
    if (action === "pending-results") {
      const { data: orders, error } = await supabase
        .from("toxicology_orders")
        .select(`
          *,
          patients(id, first_name, last_name),
          providers(id, first_name, last_name)
        `)
        .in("status", ["collected", "in-lab"])
        .order("collection_date", { ascending: false })

      if (error) throw error

      return NextResponse.json({ pendingOrders: orders || [] })
    }

    // Get Dashboard Stats
    const { data: patients } = await supabase
      .from("patients")
      .select("id, full_name, email")
      .eq("is_active", true)
      .order("full_name")
      .limit(100)

    const { data: providers } = await supabase
      .from("providers")
      .select("id, first_name, last_name, license_type")
      .order("last_name")

    const { count: pendingCount } = await supabase
      .from("toxicology_orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    const { count: collectedCount } = await supabase
      .from("toxicology_orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "collected")

    const { count: resultedCount } = await supabase
      .from("toxicology_orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "resulted")

    return NextResponse.json({
      stats: { pending: pendingCount || 0, collected: collectedCount || 0, resulted: resultedCount || 0 },
      patients: patients || [],
      providers: providers || [],
    })
  } catch (error: any) {
    console.error("[v0] Toxicology API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch toxicology data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { action } = body

    // Create Toxicology Lab
    if (action === "create-lab") {
      const { data, error } = await supabase
        .from("toxicology_labs")
        .insert({
          lab_name: body.labName,
          contact_name: body.contactName,
          phone: body.phone,
          email: body.email,
          clia_number: body.cliaNumber,
          samhsa_certified: body.samhsaCertified || false,
          test_panels_offered: body.testPanelsOffered || [],
          average_turnaround_hours: body.turnaroundHours,
          status: "active",
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from("audit_trail").insert({
        action: "toxicology_lab_created",
        details: { lab_id: data.id, name: body.labName },
      })

      return NextResponse.json({ success: true, lab: data })
    }

    // Create Drug Screen Order
    if (action === "create-order") {
      const orderNumber = `TOX-${Date.now()}`

      const { data, error } = await supabase
        .from("toxicology_orders")
        .insert({
          patient_id: body.patientId,
          provider_id: body.providerId,
          lab_id: body.labId,
          order_date: new Date().toISOString(),
          order_number: orderNumber,
          collection_method: body.collectionMethod || "Urine",
          test_panel: body.testPanel,
          substances_to_test: body.substancesToTest || [],
          reason_for_testing: body.reasonForTesting,
          test_urgency: body.urgency || "Routine",
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from("audit_trail").insert({
        action: "toxicology_order_created",
        details: { order_id: data.id, patient_id: body.patientId, panel: body.testPanel },
      })

      return NextResponse.json({ success: true, order: data })
    }

    // Record Specimen Collection
    if (action === "record-collection") {
      const updateData: Record<string, any> = {
        collection_date: new Date().toISOString(),
        specimen_id: body.specimenId,
        temperature_check: body.temperatureCheck,
        specimen_integrity: body.specimenIntegrity,
        observed_collection: body.observedCollection || false,
        chain_of_custody_number: body.cocNumber,
        custody_sealed: true,
        status: "collected",
        updated_at: new Date().toISOString(),
      }

      // Only include collection_staff_id if a valid UUID is provided
      if (body.staffId && body.staffId.trim() !== "") {
        updateData.collection_staff_id = body.staffId
      }

      const { data, error } = await supabase
        .from("toxicology_orders")
        .update(updateData)
        .eq("id", body.orderId)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, order: data })
    }

    // Enter Lab Results
    if (action === "enter-results") {
      // Update order status
      await supabase
        .from("toxicology_orders")
        .update({
          result_received_date: new Date().toISOString(),
          overall_result: body.overallResult,
          status: "resulted",
        })
        .eq("id", body.orderId)

      // Insert individual substance results
      const results = body.results.map((result: any) => ({
        order_id: body.orderId,
        substance_name: result.substance,
        substance_class: result.substanceClass,
        result: result.result,
        cutoff_level: result.cutoffLevel,
        concentration: result.concentration,
        confirmation_required: result.confirmationRequired || false,
      }))

      const { error } = await supabase.from("toxicology_results").insert(results)

      if (error) throw error

      await supabase.from("audit_trail").insert({
        action: "toxicology_results_entered",
        details: { order_id: body.orderId, result: body.overallResult },
      })

      return NextResponse.json({ success: true })
    }

    // Update Lab
    if (action === "update-lab") {
      const { data, error } = await supabase
        .from("toxicology_labs")
        .update({
          lab_name: body.labName,
          contact_name: body.contactName,
          phone: body.phone,
          email: body.email,
          clia_number: body.cliaNumber,
          samhsa_certified: body.samhsaCertified || false,
          cap_accredited: body.capAccredited || false,
          test_panels_offered: body.testPanelsOffered || [],
          average_turnaround_hours: body.turnaroundHours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.labId)
        .select()
        .single()

      if (error) throw error

      await supabase.from("audit_trail").insert({
        action: "toxicology_lab_updated",
        details: { lab_id: body.labId, name: body.labName },
      })

      return NextResponse.json({ success: true, lab: data })
    }

    // Deactivate Lab
    if (action === "deactivate-lab") {
      // Check if lab has active orders
      const { count } = await supabase
        .from("toxicology_orders")
        .select("*", { count: "exact", head: true })
        .eq("lab_id", body.labId)
        .in("status", ["pending", "collected", "in-lab"])

      if (count && count > 0) {
        return NextResponse.json(
          { error: `Cannot deactivate lab with ${count} active order(s). Complete or cancel orders first.` },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from("toxicology_labs")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.labId)
        .select()
        .single()

      if (error) throw error

      await supabase.from("audit_trail").insert({
        action: "toxicology_lab_deactivated",
        details: { lab_id: body.labId },
      })

      return NextResponse.json({ success: true, lab: data })
    }

    // Cancel Order
    if (action === "cancel-order") {
      const { data, error } = await supabase
        .from("toxicology_orders")
        .update({
          status: "cancelled",
          notes: body.cancellationReason ? `Cancelled: ${body.cancellationReason}` : "Cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.orderId)
        .select()
        .single()

      if (error) throw error

      await supabase.from("audit_trail").insert({
        action: "toxicology_order_cancelled",
        details: { order_id: body.orderId, reason: body.cancellationReason },
      })

      return NextResponse.json({ success: true, order: data })
    }

    // Send to Lab
    if (action === "send-to-lab") {
      const { data, error } = await supabase
        .from("toxicology_orders")
        .update({
          status: "in-lab",
          notes: body.trackingInfo ? `Sent to lab. Tracking: ${body.trackingInfo}` : "Sent to lab",
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.orderId)
        .select()
        .single()

      if (error) throw error

      await supabase.from("audit_trail").insert({
        action: "toxicology_order_sent_to_lab",
        details: { order_id: body.orderId, tracking: body.trackingInfo },
      })

      return NextResponse.json({ success: true, order: data })
    }

    // Save Settings
    if (action === "save-settings") {
      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from("toxicology_settings")
        .select("id")
        .limit(1)
        .single()

      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from("toxicology_settings")
          .update({
            default_collection_method: body.defaultCollectionMethod,
            observed_collection_policy: body.observedCollectionPolicy,
            default_test_panel: body.defaultTestPanel,
            auto_send_to_lab: body.autoSendToLab || false,
            preferred_lab_id: body.preferredLabId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSettings.id)
          .select()
          .single()

        if (error) throw error
        return NextResponse.json({ success: true, settings: data })
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from("toxicology_settings")
          .insert({
            default_collection_method: body.defaultCollectionMethod,
            observed_collection_policy: body.observedCollectionPolicy,
            default_test_panel: body.defaultTestPanel,
            auto_send_to_lab: body.autoSendToLab || false,
            preferred_lab_id: body.preferredLabId || null,
          })
          .select()
          .single()

        if (error) throw error
        return NextResponse.json({ success: true, settings: data })
      }
    }

    // Provider Review
    if (action === "provider-review") {
      // Update order with review info
      const { error: orderError } = await supabase
        .from("toxicology_orders")
        .update({
          status: "reviewed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.orderId)

      if (orderError) throw orderError

      // Update all results for this order with review info
      const { error: resultsError } = await supabase
        .from("toxicology_results")
        .update({
          reviewed_by_provider_id: body.providerId,
          reviewed_date: new Date().toISOString(),
          clinical_notes: body.clinicalNotes,
        })
        .eq("order_id", body.orderId)

      if (resultsError) throw resultsError

      await supabase.from("audit_trail").insert({
        action: "toxicology_results_reviewed",
        details: { order_id: body.orderId, provider_id: body.providerId },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Toxicology API POST error:", error)
    return NextResponse.json({ error: error.message || "Failed to process toxicology request" }, { status: 500 })
  }
}
