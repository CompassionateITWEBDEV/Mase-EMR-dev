import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Check if time is within dosing window
function isWithinDosingWindow(
  currentTime: Date,
  windowStart = "06:00:00",
  windowEnd = "11:00:00",
): { isWithin: boolean; minutesOutside: number } {
  const hours = currentTime.getHours()
  const minutes = currentTime.getMinutes()
  const currentMinutes = hours * 60 + minutes

  const [startH, startM] = windowStart.split(":").map(Number)
  const [endH, endM] = windowEnd.split(":").map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    return { isWithin: true, minutesOutside: 0 }
  }

  const minutesBefore = startMinutes - currentMinutes
  const minutesAfter = currentMinutes - endMinutes

  return {
    isWithin: false,
    minutesOutside: minutesBefore > 0 ? minutesBefore : minutesAfter,
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { qr_code_data, patient_id, gps_location, facial_biometric_data, seal_photo_url, device_info } = body

    // Verify QR code hash
    const qrCodeHash = crypto.createHash("sha256").update(qr_code_data).digest("hex")

    // Find the bottle
    const { data: bottle, error: bottleError } = await supabase
      .from("takehome_bottle_qr")
      .select("*")
      .eq("qr_code_hash", qrCodeHash)
      .single()

    if (bottleError || !bottle) {
      return NextResponse.json({ error: "Invalid QR code", verified: false }, { status: 400 })
    }

    // Verify this is the correct patient
    if (bottle.patient_id !== patient_id) {
      // Log suspicious activity
      await supabase.from("takehome_compliance_alerts").insert({
        organization_id: bottle.organization_id,
        patient_id: patient_id,
        bottle_qr_id: bottle.id,
        alert_type: "wrong_patient_scan",
        severity: "critical",
        alert_title: "Wrong Patient Scanned Medication",
        alert_description: `Patient ${patient_id} attempted to scan medication belonging to another patient`,
        callback_required: true,
        dea_reportable: true,
      })

      return NextResponse.json({ error: "This medication is not assigned to you", verified: false }, { status: 403 })
    }

    // Check if already consumed
    if (bottle.status === "consumed") {
      return NextResponse.json({ error: "This dose has already been consumed", verified: false }, { status: 400 })
    }

    const verificationFailures: string[] = []
    const currentTime = new Date()

    // 1. TIME VERIFICATION
    const timeCheck = isWithinDosingWindow(currentTime, bottle.dosing_window_start, bottle.dosing_window_end)

    // 2. LOCATION VERIFICATION
    let locationVerified = false
    let distanceFromHome = 0
    let homeAddress = null

    if (gps_location?.latitude && gps_location?.longitude) {
      // Get patient's registered home address
      const { data: homeAddresses } = await supabase
        .from("patient_home_addresses")
        .select("*")
        .eq("patient_id", patient_id)
        .eq("is_active", true)
        .order("address_type", { ascending: true })

      if (homeAddresses && homeAddresses.length > 0) {
        // Check against all registered addresses
        for (const addr of homeAddresses) {
          if (addr.latitude && addr.longitude) {
            const distance = calculateDistance(
              gps_location.latitude,
              gps_location.longitude,
              addr.latitude,
              addr.longitude,
            )

            if (distance <= (addr.geofence_radius_meters || 150)) {
              locationVerified = true
              homeAddress = addr
              distanceFromHome = distance
              break
            }

            if (!homeAddress || distance < distanceFromHome) {
              distanceFromHome = distance
              homeAddress = addr
            }
          }
        }
      }

      // Check for approved travel exceptions
      if (!locationVerified) {
        const today = currentTime.toISOString().split("T")[0]
        const { data: travelException } = await supabase
          .from("takehome_travel_exceptions")
          .select("*")
          .eq("patient_id", patient_id)
          .eq("status", "approved")
          .lte("start_date", today)
          .gte("end_date", today)
          .single()

        if (travelException && travelException.temporary_latitude && travelException.temporary_longitude) {
          const distance = calculateDistance(
            gps_location.latitude,
            gps_location.longitude,
            travelException.temporary_latitude,
            travelException.temporary_longitude,
          )

          if (distance <= (travelException.temporary_geofence_radius_meters || 500)) {
            locationVerified = true
            distanceFromHome = distance
          }
        }
      }
    }

    if (!locationVerified) {
      verificationFailures.push("location_violation")
    }

    if (!timeCheck.isWithin) {
      verificationFailures.push("time_violation")
    }

    // 3. BIOMETRIC VERIFICATION
    let biometricVerified = false
    let biometricConfidence = 0

    if (facial_biometric_data) {
      // Get patient's enrolled biometric template
      const { data: enrollment } = await supabase
        .from("patient_biometric_enrollment")
        .select("*")
        .eq("patient_id", patient_id)
        .eq("is_active", true)
        .single()

      if (enrollment) {
        // In production, this would call a facial recognition API
        // For now, simulate verification
        biometricConfidence = facial_biometric_data.confidence || 0
        biometricVerified = biometricConfidence >= (enrollment.match_threshold_percentage || 85)

        if (facial_biometric_data.liveness_check !== undefined) {
          biometricVerified = biometricVerified && facial_biometric_data.liveness_check
        }
      }
    }

    if (!biometricVerified && facial_biometric_data) {
      verificationFailures.push("biometric_failure")
    }

    // 4. SEAL VERIFICATION
    const sealVerified = seal_photo_url ? true : false

    // OVERALL VERIFICATION
    const verificationPassed = locationVerified && timeCheck.isWithin && biometricVerified

    // Create scan log
    const scanLog = {
      bottle_qr_id: bottle.id,
      patient_id,
      organization_id: bottle.organization_id,
      scan_type: "consumption",
      gps_latitude: gps_location?.latitude,
      gps_longitude: gps_location?.longitude,
      gps_accuracy_meters: gps_location?.accuracy,
      gps_altitude: gps_location?.altitude,
      address_resolved: gps_location?.address,
      is_within_home_geofence: locationVerified,
      distance_from_home_meters: distanceFromHome,
      registered_home_id: homeAddress?.id,
      is_within_dosing_window: timeCheck.isWithin,
      minutes_outside_window: timeCheck.minutesOutside,
      facial_scan_attempted: !!facial_biometric_data,
      facial_scan_successful: biometricVerified,
      facial_match_percentage: biometricConfidence,
      liveness_check_passed: facial_biometric_data?.liveness_check,
      device_id: device_info?.device_id,
      device_type: device_info?.device_type,
      device_model: device_info?.device_model,
      app_version: device_info?.app_version,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      verification_passed: verificationPassed,
      verification_failures: verificationFailures.length > 0 ? verificationFailures : null,
      seal_photo_url,
      seal_verified: sealVerified,
    }

    const { data: insertedScanLog } = await supabase.from("takehome_scan_log").insert(scanLog).select().single()

    // Update bottle status
    const bottleUpdate: any = {
      consumed_at: currentTime.toISOString(),
      consumption_location_lat: gps_location?.latitude,
      consumption_location_lng: gps_location?.longitude,
      consumption_gps_accuracy: gps_location?.accuracy,
      consumption_verified: verificationPassed,
      facial_biometric_verified: biometricVerified,
      facial_biometric_confidence: biometricConfidence,
      seal_photo_url,
      seal_intact_confirmed: sealVerified,
      status: "consumed",
      compliance_status: verificationPassed ? "compliant" : "non_compliant",
      non_compliance_reason: verificationFailures.length > 0 ? verificationFailures.join(", ") : null,
    }

    await supabase.from("takehome_bottle_qr").update(bottleUpdate).eq("id", bottle.id)

    // Create alerts for non-compliance
    if (!verificationPassed) {
      const alerts = []

      if (!locationVerified) {
        alerts.push({
          organization_id: bottle.organization_id,
          patient_id,
          bottle_qr_id: bottle.id,
          scan_log_id: insertedScanLog?.id,
          alert_type: "location_violation",
          severity: "high",
          alert_title: "Location Violation - Dose Consumed Outside Home",
          alert_description: `Patient consumed dose ${distanceFromHome.toFixed(0)} meters from registered home address`,
          expected_location: homeAddress?.street_address || "Registered home address",
          actual_location: gps_location?.address || `${gps_location?.latitude}, ${gps_location?.longitude}`,
          distance_violation_meters: distanceFromHome,
          callback_required: true,
          callback_within_hours: 24,
          clinical_review_required: true,
        })
      }

      if (!timeCheck.isWithin) {
        alerts.push({
          organization_id: bottle.organization_id,
          patient_id,
          bottle_qr_id: bottle.id,
          scan_log_id: insertedScanLog?.id,
          alert_type: "time_violation",
          severity: "medium",
          alert_title: "Dosing Time Violation",
          alert_description: `Patient consumed dose ${timeCheck.minutesOutside} minutes outside the dosing window`,
          expected_time_window: `${bottle.dosing_window_start} - ${bottle.dosing_window_end}`,
          actual_time: currentTime.toISOString(),
          minutes_outside_window: timeCheck.minutesOutside,
          callback_required: timeCheck.minutesOutside > 120,
          clinical_review_required: true,
        })
      }

      if (!biometricVerified && facial_biometric_data) {
        alerts.push({
          organization_id: bottle.organization_id,
          patient_id,
          bottle_qr_id: bottle.id,
          scan_log_id: insertedScanLog?.id,
          alert_type: "biometric_failure",
          severity: "critical",
          alert_title: "Biometric Verification Failed",
          alert_description: `Facial recognition failed with ${biometricConfidence.toFixed(1)}% confidence (required: 85%)`,
          callback_required: true,
          callback_within_hours: 4,
          clinical_review_required: true,
          dea_reportable: biometricConfidence < 50,
        })
      }

      if (alerts.length > 0) {
        await supabase.from("takehome_compliance_alerts").insert(alerts)
      }
    }

    return NextResponse.json({
      verified: verificationPassed,
      bottle_number: bottle.bottle_number,
      medication: bottle.medication_name,
      dose: bottle.dose_amount,
      verification_details: {
        location: {
          verified: locationVerified,
          distance_from_home_meters: Math.round(distanceFromHome),
          within_geofence: locationVerified,
        },
        time: {
          verified: timeCheck.isWithin,
          minutes_outside_window: timeCheck.minutesOutside,
          dosing_window: `${bottle.dosing_window_start} - ${bottle.dosing_window_end}`,
        },
        biometric: {
          verified: biometricVerified,
          confidence: biometricConfidence,
          liveness_passed: facial_biometric_data?.liveness_check,
        },
        seal: {
          photo_captured: sealVerified,
        },
      },
      failures: verificationFailures,
      message: verificationPassed
        ? "Dose consumption verified successfully"
        : `Verification failed: ${verificationFailures.join(", ")}. Please return to clinic immediately.`,
    })
  } catch (error) {
    console.error("Error verifying scan:", error)
    return NextResponse.json({ error: "Failed to verify scan" }, { status: 500 })
  }
}
