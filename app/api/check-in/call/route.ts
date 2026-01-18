import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendQueueSmsNotification } from "../_utils/notifications"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { queueId, staffMember, sendSMS } = body

    // Fetch current notification counters to increment accurately
    const { data: existing, error: fetchError } = await supabase
      .from("patient_check_ins")
      .select("patient_id, patient_number, service_type, mobile_phone, notifications_sent, last_notification")
      .eq("id", queueId)
      .single()

    if (fetchError || !existing) throw fetchError

    const now = new Date().toISOString()
    const notificationCount = sendSMS ? (existing.notifications_sent || 0) + 1 : existing.notifications_sent || 0

    const { data, error } = await supabase
      .from("patient_check_ins")
      .update({
        status: "called",
        assigned_to: staffMember,
        called_time: now,
        notifications_sent: notificationCount,
        last_notification: sendSMS ? now : existing.last_notification,
      })
      .eq("id", queueId)
      .select()
      .single()

    if (error) throw error

    const notification = sendSMS
      ? await sendQueueSmsNotification({
          queueId,
          patientId: existing.patient_id,
          phone: existing.mobile_phone,
          message: `Hi! We're ready for you now for your ${existing.service_type || "visit"}. Please proceed to the front desk.`,
        })
      : null

    return NextResponse.json({ success: true, data, notification })
  } catch (error) {
    console.error("Error calling patient:", error)
    return NextResponse.json({ message: "Failed to call patient" }, { status: 500 })
  }
}
