import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { tier, organization_id } = body

    if (!organization_id) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

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
    const { data: existing, error: existingError } = await supabase
      .from("community_outreach_subscriptions")
      .select("id")
      .eq("organization_id", organization_id)
      .single()

    if (existingError && existingError.code !== "PGRST116") {
      throw existingError
    }

    const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from("community_outreach_subscriptions")
        .update({
          feature_tier: tier,
          status: "trial",
          trial_end_date: trialEndDate,
          monthly_price: config.monthly_price,
          max_monthly_screenings: config.max_monthly_screenings,
          max_monthly_referrals: config.max_monthly_referrals,
          max_external_providers: config.max_external_providers,
          enable_analytics: config.enable_analytics,
          enable_custom_branding: config.enable_custom_branding,
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
          organization_id,
          feature_tier: tier,
          status: "trial",
          trial_end_date: trialEndDate,
          monthly_price: config.monthly_price,
          max_monthly_screenings: config.max_monthly_screenings,
          max_monthly_referrals: config.max_monthly_referrals,
          max_external_providers: config.max_external_providers,
          enable_analytics: config.enable_analytics,
          enable_custom_branding: config.enable_custom_branding,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }
  } catch (error: any) {
    console.error("[Outreach Subscription] Error activating subscription:", error)
    return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 })
  }
}
