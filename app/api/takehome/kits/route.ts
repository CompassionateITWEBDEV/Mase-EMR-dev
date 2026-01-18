import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Get medication orders that have been issued as kits
    const { data: orders, error } = await supabase
      .from("medication_order")
      .select(`
        id,
        patient_id,
        daily_dose_mg,
        max_takehome,
        start_date,
        stop_date,
        status,
        created_at,
        patient_dispensing!inner(name)
      `)
      .eq("status", "active")
      .gt("max_takehome", 0)
      .order("created_at", { ascending: false })
      .limit(50)

    // Transform into kit format with doses
    const kits = (orders || []).map((order: any) => {
      const days = order.max_takehome || 7
      const doses = []
      const startDate = new Date(order.start_date)

      for (let i = 0; i < days; i++) {
        const dayDate = new Date(startDate)
        dayDate.setDate(dayDate.getDate() + i)
        doses.push({
          id: i + 1,
          day_date: dayDate.toISOString().split("T")[0],
          dose_mg: order.daily_dose_mg,
          dose_ml: order.daily_dose_mg / 10,
          bottle_uid: `BTL-${order.id}-${i + 1}`,
          status: i === 0 ? "dispensed" : "pending",
        })
      }

      return {
        id: order.id,
        patient_name: order.patient_dispensing?.name || "Unknown",
        status: "issued",
        issue_time: order.created_at,
        issued_by: "System",
        seal_batch: `SB-${new Date().getFullYear()}-${String(order.id).padStart(4, "0")}`,
        doses,
      }
    })

    return NextResponse.json({ kits })
  } catch (error) {
    console.error("[v0] Error fetching kits:", error)
    return NextResponse.json({ kits: [], error: "Failed to fetch kits" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { patient_id, days, seal_batch } = body

    // Create a medication order for the kit
    const { data, error } = await supabase
      .from("medication_order")
      .insert({
        patient_id: Number.parseInt(patient_id),
        daily_dose_mg: 80,
        max_takehome: days,
        start_date: new Date().toISOString().split("T")[0],
        stop_date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, kit: data })
  } catch (error) {
    console.error("[v0] Error creating kit:", error)
    return NextResponse.json({ error: "Failed to create kit" }, { status: 500 })
  }
}
