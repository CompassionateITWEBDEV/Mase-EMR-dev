import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get("org_id")

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get onboarding status
    const { data: onboarding } = await supabase
      .from("clinic_onboarding")
      .select("*")
      .eq("organization_id", orgId)
      .single()

    // Get organization details
    const { data: organization } = await supabase.from("organizations").select("*").eq("id", orgId).single()

    // Get clinic configuration
    const { data: config } = await supabase
      .from("clinic_configuration")
      .select("*")
      .eq("organization_id", orgId)
      .single()

    // Get insurance plans
    const { data: insurancePlans } = await supabase
      .from("clinic_insurance_plans")
      .select("*, insurance_payers(*)")
      .eq("organization_id", orgId)
      .eq("is_active", true)

    // Get specialties
    const { data: specialties } = await supabase.from("clinic_specialties").select("*").eq("organization_id", orgId)

    // Get staff count
    const { count: staffCount } = await supabase
      .from("user_accounts")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)

    return NextResponse.json({
      onboarding: onboarding || { organization_id: orgId, current_step: 1 },
      organization,
      config,
      insurancePlans: insurancePlans || [],
      specialties: specialties || [],
      staffCount: staffCount || 0,
    })
  } catch (error) {
    console.error("[v0] Get onboarding error:", error)
    return NextResponse.json({ error: "Failed to fetch onboarding status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, step, data } = body
    const supabase = await createClient()

    // Update or create onboarding record
    const { data: existing } = await supabase
      .from("clinic_onboarding")
      .select("*")
      .eq("organization_id", organization_id)
      .single()

    if (!existing) {
      await supabase.from("clinic_onboarding").insert({
        organization_id,
        current_step: step,
        started_at: new Date().toISOString(),
      })
    }

    // Handle different steps
    if (step === 1 && data.basicInfo) {
      // Update clinic configuration
      await supabase.from("clinic_configuration").upsert({
        organization_id,
        ...data.basicInfo,
        updated_at: new Date().toISOString(),
      })

      await supabase
        .from("clinic_onboarding")
        .update({ basic_info_completed: true, current_step: 2 })
        .eq("organization_id", organization_id)
    }

    if (step === 2 && data.insurancePlans) {
      // Add insurance plans
      for (const plan of data.insurancePlans) {
        await supabase.from("clinic_insurance_plans").insert({
          organization_id,
          ...plan,
          created_at: new Date().toISOString(),
        })
      }

      await supabase
        .from("clinic_onboarding")
        .update({ insurance_configured: true, current_step: 3 })
        .eq("organization_id", organization_id)
    }

    if (step === 3 && data.specialties) {
      // Add specialties
      for (const specialty of data.specialties) {
        await supabase.from("clinic_specialties").upsert({
          organization_id,
          specialty_code: specialty.code,
          specialty_name: specialty.name,
          is_primary: specialty.isPrimary || false,
          enabled_features: specialty.features || [],
        })
      }

      await supabase
        .from("clinic_onboarding")
        .update({ specialty_selected: true, current_step: 4 })
        .eq("organization_id", organization_id)
    }

    if (step === 4 && data.complete) {
      // Mark onboarding as complete
      await supabase
        .from("clinic_onboarding")
        .update({
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("organization_id", organization_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update onboarding error:", error)
    return NextResponse.json({ error: "Failed to update onboarding" }, { status: 500 })
  }
}
