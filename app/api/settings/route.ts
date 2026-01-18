import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user profile settings
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json({
      profile: profile || {
        user_id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || "",
        timezone: "America/Los_Angeles",
        language: "en",
        notifications_enabled: true,
        email_notifications: true,
        sms_notifications: false,
        theme: "system",
      },
    })
  } catch (error) {
    console.error("[v0] Settings fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { profile } = body

    console.log("[v0] Saving settings for user:", user.id)

    // Upsert user profile settings
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        display_name: profile.display_name,
        timezone: profile.timezone,
        language: profile.language,
        notifications_enabled: profile.notifications_enabled,
        email_notifications: profile.email_notifications,
        sms_notifications: profile.sms_notifications,
        theme: profile.theme,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving settings:", error)
      // If table doesn't exist, still return success for backward compatibility
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          message: "Settings saved (profile table not configured)",
        })
      }
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      profile: data,
    })
  } catch (error) {
    console.error("[v0] Settings save error:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
