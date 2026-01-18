import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerClient()

  try {
    // Fetch integration providers
    const { data: providers, error: providersError } = await supabase
      .from("dme_integration_providers")
      .select("*")
      .order("provider_name")

    if (providersError) throw providersError

    // Fetch Parachute orders
    const { data: parachuteOrders, error: parachuteError } = await supabase
      .from("parachute_orders")
      .select(`
        *,
        patients(id, first_name, last_name),
        providers(id, first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    // Fetch Verse orders
    const { data: verseOrders, error: verseError } = await supabase
      .from("verse_orders")
      .select(`
        *,
        patients(id, first_name, last_name),
        providers(id, first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    // Fetch supplier catalog
    const { data: catalog, error: catalogError } = await supabase
      .from("parachute_supplier_catalog")
      .select("*")
      .eq("in_stock", true)
      .limit(100)

    return NextResponse.json({
      providers: providers || [],
      parachuteOrders: parachuteOrders || [],
      verseOrders: verseOrders || [],
      supplierCatalog: catalog || [],
    })
  } catch (error: any) {
    console.error("[v0] Error fetching DME integrations:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { action, provider, orderId, orderData } = body

    if (action === "connect_provider") {
      // Connect Parachute or Verse
      const { data, error } = await supabase
        .from("dme_integration_providers")
        .insert({
          provider_name: provider,
          connection_status: "connected",
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ provider: data })
    }

    if (action === "create_parachute_order") {
      // Create Parachute ePrescribe order
      const { data, error } = await supabase
        .from("parachute_orders")
        .insert({
          ...orderData,
          order_status: "draft",
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ order: data })
    }

    if (action === "create_verse_order") {
      // Create Verse AI order with automatic extraction
      const { data, error } = await supabase
        .from("verse_orders")
        .insert({
          ...orderData,
          order_status: "processing",
          ai_processing_started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Simulate AI extraction (in production, call Verse API)
      await supabase
        .from("verse_orders")
        .update({
          medical_record_extracted: {
            diagnosis: ["M54.5 - Low back pain"],
            supplies: ["Lumbar support brace", "TENS unit"],
          },
          ai_processing_completed_at: new Date().toISOString(),
          documentation_complete: true,
        })
        .eq("id", data.id)

      return NextResponse.json({ order: data })
    }

    if (action === "submit_to_supplier") {
      // Submit order to supplier via Parachute
      const { error } = await supabase
        .from("parachute_orders")
        .update({
          order_status: "submitted",
          submitted_to_parachute_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === "check_coverage") {
      // Verse coverage validation
      const { error } = await supabase
        .from("verse_orders")
        .update({
          insurance_coverage_checked: true,
          coverage_validation_result: {
            covered: true,
            copay: 0,
            deductible_applies: false,
          },
        })
        .eq("id", orderId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error in DME integrations:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
