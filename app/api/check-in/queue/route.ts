import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch today's queue
    const today = new Date().toISOString().split("T")[0]

    const { data: queue, error } = await supabase
      .from("patient_check_ins")
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .gte("check_in_time", `${today}T00:00:00`)
      .in("status", ["waiting", "called", "with-staff", "return-later"])
      .order("queue_position", { ascending: true })

    if (error) throw error

    // Calculate stats
    const waitingPatients = queue?.filter((p) => p.status === "waiting" || p.status === "called") || []
    const completedToday = await supabase
      .from("patient_check_ins")
      .select("id", { count: "exact" })
      .gte("check_in_time", `${today}T00:00:00`)
      .eq("status", "completed")

    const waitTimes = waitingPatients.map((p) => {
      const checkInTime = new Date(p.check_in_time).getTime()
      return Math.round((Date.now() - checkInTime) / 60000)
    })

    const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0
    const longestWait = waitTimes.length > 0 ? Math.max(...waitTimes) : 0

    // Format response
    const formattedQueue = queue?.map((item, index) => ({
      id: item.id,
      patientId: item.patient_id,
      firstName: item.patients?.first_name || "Patient",
      lastName: item.patients?.last_name?.charAt(0) + "." || "",
      checkInTime: item.check_in_time,
      checkInMethod: item.check_in_method,
      queuePosition: item.queue_position || index + 1,
      estimatedWaitMinutes: item.estimated_wait_minutes || avgWait,
      status: item.status,
      assignedTo: item.assigned_to,
      serviceType: item.service_type,
      priority: item.priority || "normal",
      notes: item.notes,
      returnTime: item.return_time,
      mobilePhone: item.patients?.phone || item.mobile_phone,
      notificationsSent: item.notifications_sent || 0,
      lastNotification: item.last_notification,
    }))

    return NextResponse.json({
      queue: formattedQueue || [],
      stats: {
        totalWaiting: waitingPatients.length,
        averageWaitTime: avgWait,
        longestWaitTime: longestWait,
        patientsServedToday: completedToday.count || 0,
        currentServiceRate: 8.5,
        estimatedClearTime: new Date(Date.now() + waitingPatients.length * avgWait * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    })
  } catch (error) {
    console.error("Error fetching queue:", error)
    return NextResponse.json({ queue: [], stats: {} }, { status: 200 })
  }
}
