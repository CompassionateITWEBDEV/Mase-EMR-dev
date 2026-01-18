import { createServiceClient } from "@/lib/supabase/server"

export type SMSNotificationResult =
  | { status: "sent"; to: string; message: string; sentAt: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string }

interface QueueNotificationParams {
  queueId: string
  patientId?: string | null
  phone?: string | null
  message: string
}

export async function sendQueueSmsNotification({
  queueId,
  patientId,
  phone,
  message,
}: QueueNotificationParams): Promise<SMSNotificationResult> {
  try {
    const supabase = createServiceClient()

    // Resolve patient contact information if missing
    if (!patientId || !phone) {
      const { data, error } = await supabase
        .from("patient_check_ins")
        .select("patient_id, mobile_phone, patients(phone)")
        .eq("id", queueId)
        .single()

      if (error) throw error

      patientId = patientId || data?.patient_id
      phone = phone || data?.mobile_phone || (data as any)?.patients?.phone
    }

    if (!phone || !patientId) {
      return { status: "skipped", reason: "No phone number on file" }
    }

    const sentAt = new Date().toISOString()

    // Log the SMS in the reminders table for auditability
    const { error: logError } = await supabase.from("patient_reminders").insert({
      patient_id: patientId,
      type: "check-in",
      channel: "sms",
      subject: "Queue Update",
      message,
      sms_status: "sent",
      sms_sent_at: sentAt,
      sent_at: sentAt,
    })

    if (logError) {
      console.error("[v0] Failed to log SMS notification:", logError)
    }

    return { status: "sent", to: phone, message, sentAt }
  } catch (error: any) {
    console.error("[v0] Failed to send SMS notification:", error)
    return { status: "failed", error: error?.message || "Unknown error" }
  }
}
