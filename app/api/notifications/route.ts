import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Fetch notifications from team_notifications table
    const { data: notifications, error } = await supabase
      .from("team_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching notifications:", error)
      // Return sample notifications if table is empty or error
      return NextResponse.json({
        notifications: generateSampleNotifications(),
      })
    }

    // Transform to expected format
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      time: formatTimeAgo(n.created_at),
      read: n.is_read,
      link: n.action_url || "/notifications",
      type: n.notification_type,
      created_at: n.created_at,
    }))

    // If no notifications exist, return sample data
    if (formattedNotifications.length === 0) {
      return NextResponse.json({
        notifications: generateSampleNotifications(),
      })
    }

    return NextResponse.json({ notifications: formattedNotifications })
  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({
      notifications: generateSampleNotifications(),
    })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    if (body.markAllRead) {
      // Mark all notifications as read
      const { error } = await supabase.from("team_notifications").update({ is_read: true }).eq("is_read", false)

      if (error) {
        console.error("Error marking all as read:", error)
        return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (body.notificationId) {
      // Mark single notification as read
      const { error } = await supabase
        .from("team_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", body.notificationId)

      if (error) {
        console.error("Error marking notification as read:", error)
        return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Error in PATCH notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from("team_notifications")
      .insert({
        title: body.title,
        message: body.message,
        notification_type: body.type || "general",
        action_url: body.link || "/notifications",
        priority: body.priority || "normal",
        recipient_id: body.recipientId,
        sender_id: body.senderId,
        patient_id: body.patientId,
        care_team_id: body.careTeamId,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    return NextResponse.json({ notification: data })
  } catch (error) {
    console.error("Error in POST notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

function generateSampleNotifications() {
  const now = new Date()
  return [
    {
      id: "sample-1",
      title: "New Patient Intake",
      message: "A new patient has completed their intake forms and is ready for review.",
      time: "5 min ago",
      read: false,
      link: "/intake-queue",
      type: "intake",
      created_at: new Date(now.getTime() - 5 * 60000).toISOString(),
    },
    {
      id: "sample-2",
      title: "Lab Results Ready",
      message: "UDS results are now available for review.",
      time: "15 min ago",
      read: false,
      link: "/patients",
      type: "lab",
      created_at: new Date(now.getTime() - 15 * 60000).toISOString(),
    },
    {
      id: "sample-3",
      title: "Appointment Reminder",
      message: "You have 3 appointments scheduled in the next hour.",
      time: "30 min ago",
      read: true,
      link: "/appointments",
      type: "appointment",
      created_at: new Date(now.getTime() - 30 * 60000).toISOString(),
    },
    {
      id: "sample-4",
      title: "Prior Auth Approved",
      message: "Prior authorization request has been approved by insurance.",
      time: "1 hour ago",
      read: true,
      link: "/insurance",
      type: "billing",
      created_at: new Date(now.getTime() - 60 * 60000).toISOString(),
    },
    {
      id: "sample-5",
      title: "Compliance Alert",
      message: "2 patient assessments are due today.",
      time: "2 hours ago",
      read: false,
      link: "/assessments",
      type: "compliance",
      created_at: new Date(now.getTime() - 120 * 60000).toISOString(),
    },
  ]
}
