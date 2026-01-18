import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch direct messages/communications
    const { data: messages, error: messagesError } = await supabase
      .from("case_communications")
      .select(`
        *,
        patients:patient_id(first_name, last_name),
        sender:sender_id(first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    if (messagesError) throw messagesError

    // Fetch announcements from team_notifications with type 'announcement'
    const { data: announcements, error: announcementsError } = await supabase
      .from("team_notifications")
      .select("*")
      .eq("notification_type", "announcement")
      .order("created_at", { ascending: false })
      .limit(20)

    if (announcementsError) throw announcementsError

    // Fetch emergency alerts
    const { data: emergencyAlerts, error: emergencyError } = await supabase
      .from("facility_alerts")
      .select("*")
      .eq("alert_type", "emergency")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10)

    if (emergencyError) throw emergencyError

    // Fetch patients for the new message dialog
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .order("last_name")
      .limit(100)

    if (patientsError) throw patientsError

    // Fetch providers/staff for recipients
    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select("id, first_name, last_name, role")
      .order("last_name")
      .limit(100)

    if (providersError) throw providersError

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("case_communications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false)

    return NextResponse.json({
      messages: messages || [],
      announcements: announcements || [],
      emergencyAlerts: emergencyAlerts || [],
      patients: patients || [],
      providers: providers || [],
      unreadCount: unreadCount || 0,
    })
  } catch (error) {
    console.error("Error fetching communications:", error)
    return NextResponse.json({ error: "Failed to fetch communications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { action, ...data } = body

    if (action === "send_message") {
      // Create the communication
      const { data: message, error: messageError } = await supabase
        .from("case_communications")
        .insert({
          patient_id: data.patient_id || null,
          care_team_id: data.care_team_id || null,
          sender_id: data.sender_id,
          message_type: data.message_type || "general",
          subject: data.subject,
          message: data.message,
          priority: data.priority || "normal",
          is_read: false,
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Add recipients if specified
      if (data.recipients && data.recipients.length > 0) {
        const recipientRecords = data.recipients.map((recipientId: string) => ({
          communication_id: message.id,
          recipient_id: recipientId,
          is_read: false,
        }))

        const { error: recipientError } = await supabase.from("communication_recipients").insert(recipientRecords)

        if (recipientError) throw recipientError

        // Create notifications for recipients
        const notifications = data.recipients.map((recipientId: string) => ({
          recipient_id: recipientId,
          sender_id: data.sender_id,
          patient_id: data.patient_id || null,
          notification_type: data.priority === "urgent" ? "urgent_message" : "case_message",
          title: `New message: ${data.subject}`,
          message: data.message.substring(0, 200),
          priority: data.priority || "normal",
          action_url: "/communications",
          is_read: false,
        }))

        await supabase.from("team_notifications").insert(notifications)
      }

      return NextResponse.json({ success: true, message })
    }

    if (action === "create_announcement") {
      const { data: announcement, error } = await supabase
        .from("team_notifications")
        .insert({
          notification_type: "announcement",
          title: data.title,
          message: data.message,
          priority: data.priority || "normal",
          is_read: false,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, announcement })
    }

    if (action === "create_emergency_alert") {
      const { data: alert, error } = await supabase
        .from("facility_alerts")
        .insert({
          alert_type: "emergency",
          message: data.message,
          priority: data.priority || "high",
          affected_areas: data.affected_areas || [],
          is_active: true,
          created_by: data.created_by || "System",
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, alert })
    }

    if (action === "mark_read") {
      const { error } = await supabase.from("case_communications").update({ is_read: true }).eq("id", data.message_id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in communications:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
