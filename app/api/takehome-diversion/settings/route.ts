import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: settings, error } = await supabase.from("clinic_diversion_settings").select("*").single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return default settings if none exist
    const defaultSettings = {
      default_geofence_radius_feet: 500,
      dosing_window_start: "06:00",
      dosing_window_end: "10:00",
      biometric_confidence_threshold: 85,
      require_biometric: true,
      alert_delay_minutes: 120,
      callback_threshold_violations: 2,
      notify_sponsor_on_violation: true,
      allow_location_exceptions: true,
      max_exception_days: 14,
      require_seal_photo: true,
      auto_alert_on_miss: true,
      enable_device_binding: false,
      max_registered_devices: 2,
      risk_score_calculation_days: 30,
    }

    return NextResponse.json(settings || defaultSettings)
  } catch (error) {
    console.error("[v0] Error in GET settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { settingType, ...settingsData } = body

    console.log("[v0] Saving settings:", settingType, settingsData)

    // Map frontend fields to database columns based on setting type
    let updateData: Record<string, any> = {}

    switch (settingType) {
      case "geofence":
        updateData = {
          default_geofence_radius_feet: settingsData.geofenceRadius,
          allow_location_exceptions: settingsData.locationTolerance > 0,
        }
        break
      case "dosing":
        updateData = {
          dosing_window_start: settingsData.dosingWindowStart,
          dosing_window_end: settingsData.dosingWindowEnd,
        }
        break
      case "biometric":
        updateData = {
          biometric_confidence_threshold: settingsData.biometricThreshold,
          require_biometric: settingsData.requireLiveness === "yes",
        }
        break
      case "alert":
        updateData = {
          alert_delay_minutes: settingsData.missedDoseDelay * 60, // Convert hours to minutes
          callback_threshold_violations: settingsData.autoCallbackDoses,
          notify_sponsor_on_violation: settingsData.notifySponsor === "yes",
          auto_alert_on_miss: true,
        }
        break
      default:
        return NextResponse.json({ error: "Invalid setting type" }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    // Check if settings exist
    const { data: existing } = await supabase.from("clinic_diversion_settings").select("id").single()

    let result
    if (existing) {
      // Update existing settings
      result = await supabase
        .from("clinic_diversion_settings")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single()
    } else {
      // Insert new settings
      result = await supabase.from("clinic_diversion_settings").insert(updateData).select().single()
    }

    if (result.error) {
      console.error("[v0] Error saving settings:", result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    console.log("[v0] Settings saved successfully:", result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("[v0] Error in POST settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
