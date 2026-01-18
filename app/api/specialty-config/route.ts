import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get configured specialties for this clinic
    const { data: specialties, error: specialtiesError } = await supabase
      .from("clinic_specialty_configuration")
      .select("*")
      .eq("enabled", true)
      .order("configured_at", { ascending: false })

    if (specialtiesError) {
      console.error("[v0] Error fetching specialties:", specialtiesError)
      // Return empty array if table doesn't exist yet
      return NextResponse.json({ specialties: [], features: [] })
    }

    // Get all available specialty features
    const { data: features, error: featuresError } = await supabase
      .from("specialty_features")
      .select("*")
      .order("specialty_id, feature_code")

    if (featuresError) {
      console.error("[v0] Error fetching features:", featuresError)
    }

    return NextResponse.json({
      specialties: specialties || [],
      features: features || [],
    })
  } catch (error: any) {
    console.error("[v0] Specialty config error:", error)
    return NextResponse.json({ specialties: [], features: [], error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { specialtyIds } = body

    if (!Array.isArray(specialtyIds)) {
      return NextResponse.json({ error: "specialtyIds must be an array" }, { status: 400 })
    }

    // First, disable all specialties
    await supabase
      .from("clinic_specialty_configuration")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .neq("id", "00000000-0000-0000-0000-000000000000") // Update all

    // Then enable the selected ones (insert or update)
    for (const specialtyId of specialtyIds) {
      const { data: existing } = await supabase
        .from("clinic_specialty_configuration")
        .select("id")
        .eq("specialty_id", specialtyId)
        .single()

      if (existing) {
        // Update existing
        await supabase
          .from("clinic_specialty_configuration")
          .update({
            enabled: true,
            updated_at: new Date().toISOString(),
          })
          .eq("specialty_id", specialtyId)
      } else {
        // Insert new
        await supabase.from("clinic_specialty_configuration").insert({
          specialty_id: specialtyId,
          enabled: true,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error saving specialty config:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
