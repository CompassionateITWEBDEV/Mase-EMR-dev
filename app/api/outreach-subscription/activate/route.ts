import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const { tier } = await request.json()

    // Get organization ID (in real app, get from authenticated user)
    const organizationId = "00000000-0000-0000-0000-000000000001" // Replace with actual org ID

    // Define pricing and limits by tier
    const tierConfig: Record<string, any> = {
      basic: {
        monthly_price: 299.0,
        max_monthly_screenings: 100,
        max_monthly_referrals: 50,
        max_external_providers: 10,
        enable_analytics: false,
        enable_custom_branding: false,
      },
      professional: {
        monthly_price: 499.0,
        max_monthly_screenings: 500,
        max_monthly_referrals: 200,
        max_external_providers: 50,
        enable_analytics: true,
        enable_custom_branding: false,
      },
      enterprise: {
        monthly_price: 999.0,
        max_monthly_screenings: 999999,
        max_monthly_referrals: 999999,
        max_external_providers: 999999,
        enable_analytics: true,
        enable_custom_branding: true,
      },
    }

    const config = tierConfig[tier] || tierConfig.basic

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from("community_outreach_subscriptions")
      .select("id")
      .eq("organization_id", organizationId)
      .single()

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from("community_outreach_subscriptions")
        .update({
          feature_tier: tier,
          status: "trial",
          trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          ...config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from("community_outreach_subscriptions")
        .insert({
          organization_id: organizationId,
          feature_tier: tier,
          status: "trial",
          trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          ...config,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error("Error activating outreach subscription:", error)
    return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 })
  }
}
