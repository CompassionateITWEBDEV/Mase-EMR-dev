import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const today = new Date().toISOString().split("T")[0]
    const currentHour = new Date().getHours()

    // Only run after dosing window ends (after 11 AM by default)
    if (currentHour < 11) {
      return NextResponse.json({ message: "Dosing window still open", checked: false })
    }

    // Find all bottles scheduled for today that haven't been consumed
    const { data: missedDoses, error } = await supabase
      .from("takehome_bottle_qr")
      .select(`
        *,
        patients:patient_id (first_name, last_name, phone, email)
      `)
      .eq("scheduled_consumption_date", today)
      .eq("status", "dispensed")
      .neq("compliance_status", "compliant")

    if (error) throw error

    const alerts = []
    const patientNotifications = []

    for (const bottle of missedDoses || []) {
      // Check if alert already exists for this bottle
      const { data: existingAlert } = await supabase
        .from("takehome_compliance_alerts")
        .select("id")
        .eq("bottle_qr_id", bottle.id)
        .eq("alert_type", "missed_dose")
        .single()

      if (!existingAlert) {
        // Create missed dose alert
        alerts.push({
          organization_id: bottle.organization_id,
          patient_id: bottle.patient_id,
          bottle_qr_id: bottle.id,
          alert_type: "missed_dose",
          severity: "high",
          alert_title: `Missed Dose - Bottle #${bottle.bottle_number}`,
          alert_description: `Patient did not scan take-home dose #${bottle.bottle_number} (${bottle.medication_name} ${bottle.dose_amount}mg) by the end of the dosing window`,
          expected_time_window: `${bottle.dosing_window_start} - ${bottle.dosing_window_end}`,
          callback_required: true,
          callback_within_hours: 4,
          clinical_review_required: true,
          patient_notified: false,
        })

        // Update bottle status
        await supabase
          .from("takehome_bottle_qr")
          .update({
            status: "missed",
            compliance_status: "non_compliant",
            non_compliance_reason: "Dose not consumed within dosing window",
          })
          .eq("id", bottle.id)

        // Queue patient notification
        patientNotifications.push({
          patient_id: bottle.patient_id,
          patient_name: bottle.patients ? `${bottle.patients.first_name} ${bottle.patients.last_name}` : "Unknown",
          phone: bottle.patients?.phone,
          bottle_number: bottle.bottle_number,
          medication: bottle.medication_name,
        })
      }
    }

    // Insert all alerts
    if (alerts.length > 0) {
      await supabase.from("takehome_compliance_alerts").insert(alerts)
    }

    // In production, send SMS/push notifications to patients
    // For now, log the notifications that would be sent
    console.log("Patient notifications to send:", patientNotifications)

    return NextResponse.json({
      checked: true,
      missed_doses_found: missedDoses?.length || 0,
      alerts_created: alerts.length,
      notifications_queued: patientNotifications.length,
    })
  } catch (error) {
    console.error("Error checking missed doses:", error)
    return NextResponse.json({ error: "Failed to check missed doses" }, { status: 500 })
  }
}
