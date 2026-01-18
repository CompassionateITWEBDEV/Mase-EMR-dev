import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendQueueSmsNotification } from "../_utils/notifications"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { queueId, returnTime, sendSMS } = body

    const { data: existing, error: fetchError } = await supabase
      .from("patient_check_ins")
      .select("patient_id, mobile_phone, notifications_sent, last_notification")
      .eq("id", queueId)
      .single()

    if (fetchError || !existing) throw fetchError

    const now = new Date().toISOString()
    const notificationCount = sendSMS ? (existing.notifications_sent || 0) + 1 : existing.notifications_sent || 0

    const { data, error } = await supabase
      .from("patient_check_ins")
      .update({
        status: "return-later",
        return_time: returnTime,
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
          message: `We've noted your return time for ${new Date(returnTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}. Please check in at the front desk when you return.`,
        })
      : null

    return NextResponse.json({ success: true, data, notification })
  } catch (error) {
    console.error("Error marking return later:", error)
    return NextResponse.json({ message: "Failed to update status" }, { status: 500 })
  }
}
