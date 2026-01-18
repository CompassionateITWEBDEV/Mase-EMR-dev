import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    const { data: locations, error } = await supabase
      .from("offsite_dosing_locations")
      .select("*")
      .eq("is_active", true)
      .order("facility_name")

    if (error) {
      console.error("[offsite-locations] Error fetching locations:", error)
      return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
    }

    return NextResponse.json({ locations })
  } catch (error) {
    console.error("[offsite-locations] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createServiceRoleClient()

    const { data: location, error } = await supabase
      .from("offsite_dosing_locations")
      .insert({
        ...body,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[offsite-locations] Error creating location:", error)
      return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
    }

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error("[offsite-locations] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
