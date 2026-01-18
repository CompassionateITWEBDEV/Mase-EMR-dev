import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    const { data: screenings, error } = await supabase
      .from("community_screenings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ screenings: screenings || [] })
  } catch (error: any) {
    console.error("[Community Outreach] Error fetching screenings:", error)
    return NextResponse.json({ error: "Failed to fetch screenings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const {
      screening_type,
      session_id,
      responses,
      total_score,
      severity_level,
      recommendations,
      resources_provided,
      follow_up_requested,
      follow_up_email,
      follow_up_phone,
      ip_region,
      user_agent_summary,
      referral_source,
    } = body

    const { data: screening, error } = await supabase
      .from("community_screenings")
      .insert({
        screening_type,
        session_id,
        responses: responses || {},
        total_score,
        severity_level,
        recommendations: recommendations || [],
        resources_provided: resources_provided || [],
        follow_up_requested: follow_up_requested || false,
        follow_up_email,
        follow_up_phone,
        ip_region,
        user_agent_summary,
        referral_source,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ screening })
  } catch (error: any) {
    console.error("[Community Outreach] Error creating screening:", error)
    return NextResponse.json({ error: "Failed to create screening" }, { status: 500 })
  }
}
