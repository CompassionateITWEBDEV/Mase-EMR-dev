import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: alerts, error } = await supabase
      .from("facility_alerts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error: any) {
    console.error("[v0] Error fetching facility alerts:", error)
    return NextResponse.json({ alerts: [], error: error.message })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("facility_alerts")
      .insert({
        alert_type: body.alert_type,
        message: body.message,
        created_by: body.created_by || "System",
        is_active: true,
        priority: body.priority || "medium",
        affected_areas: body.affected_areas || [],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ alert: data })
  } catch (error: any) {
    console.error("[v0] Error creating facility alert:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
