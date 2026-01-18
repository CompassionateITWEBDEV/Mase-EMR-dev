import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { organization_id, cancellation_reason } = body

    if (!organization_id) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("community_outreach_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellation_reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organization_id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Outreach Subscription] Error cancelling subscription:", error)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }
}
