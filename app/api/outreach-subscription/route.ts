import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get("organization_id")

    if (!organization_id) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    const { data: subscription, error } = await supabase
      .from("community_outreach_subscriptions")
      .select("*")
      .eq("organization_id", organization_id)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json(subscription || null)
  } catch (error: any) {
    console.error("[Outreach Subscription] Error fetching subscription:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}
