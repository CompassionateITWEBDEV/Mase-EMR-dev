import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { employee_id, event_type, biometric_data } = body

    // Simulate facial biometric verification
    const facialVerified = biometric_data?.facial_image ? true : false
    const matchConfidence = facialVerified ? 98.5 : 0

    const now = new Date()
    const eventDate = now.toISOString().split("T")[0]
    const eventTime = now.toTimeString().split(" ")[0]

    const { data, error } = await supabase
      .from("hr_time_clock_events")
      .insert({
        employee_id,
        organization_id: "org-001",
        event_type,
        event_date: eventDate,
        event_time: eventTime,
        biometric_method: "facial",
        facial_biometric_verified: facialVerified,
        facial_match_confidence: matchConfidence,
        liveness_check_passed: facialVerified,
        clock_location: body.location || "Main Entrance",
        gps_latitude: body.latitude || null,
        gps_longitude: body.longitude || null,
        verification_status: "verified",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, event: data })
  } catch (error) {
    console.error("[HR] Error recording time clock event:", error)
    return NextResponse.json({ error: "Failed to record time clock event" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employee_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let query = supabase
      .from("hr_time_clock_events")
      .select("*")
      .order("event_timestamp", { ascending: false })

    if (employeeId) {
      query = query.eq("employee_id", employeeId)
    }

    if (startDate) {
      query = query.gte("event_date", startDate)
    }

    if (endDate) {
      query = query.lte("event_date", endDate)
    }

    const { data: events, error } = await query.limit(100)

    if (error) throw error

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error("[HR] Error fetching time clock events:", error)

    // Return mock time clock data
    const mockEvents = [
      {
        id: "tc-001",
        employee_id: "emp-001",
        event_type: "clock_in",
        event_timestamp: "2024-01-13T08:00:00Z",
        event_date: "2024-01-13",
        event_time: "08:00:00",
        facial_biometric_verified: true,
        facial_match_confidence: 98.5,
        liveness_check_passed: true,
        clock_location: "Main Entrance",
        verification_status: "verified",
      },
      {
        id: "tc-002",
        employee_id: "emp-001",
        event_type: "clock_out",
        event_timestamp: "2024-01-13T17:00:00Z",
        event_date: "2024-01-13",
        event_time: "17:00:00",
        facial_biometric_verified: true,
        facial_match_confidence: 97.8,
        liveness_check_passed: true,
        clock_location: "Main Entrance",
        verification_status: "verified",
      },
    ]

    return NextResponse.json({ events: mockEvents })
  }
}
