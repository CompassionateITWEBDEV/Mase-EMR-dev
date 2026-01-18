import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employee_id, event_type, biometric_data } = body

    // Simulate facial biometric verification
    const facialVerified = biometric_data?.facial_image ? true : false
    const matchConfidence = facialVerified ? 98.5 : 0

    const result = await sql`
      INSERT INTO hr_time_clock_events (
        employee_id,
        organization_id,
        event_type,
        event_date,
        event_time,
        biometric_method,
        facial_biometric_verified,
        facial_match_confidence,
        liveness_check_passed,
        clock_location,
        gps_latitude,
        gps_longitude,
        verification_status
      ) VALUES (
        ${employee_id},
        ${"org-001"},
        ${event_type},
        CURRENT_DATE,
        CURRENT_TIME,
        ${"facial"},
        ${facialVerified},
        ${matchConfidence},
        ${facialVerified},
        ${body.location || "Main Entrance"},
        ${body.latitude || null},
        ${body.longitude || null},
        ${"verified"}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, event: result[0] })
  } catch (error) {
    console.error("Error recording time clock event:", error)
    return NextResponse.json({ error: "Failed to record time clock event" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employee_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    // Return mock time clock data
    const mockEvents = [
      {
        id: "tc-001",
        employee_id: employeeId || "emp-001",
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
        employee_id: employeeId || "emp-001",
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
  } catch (error) {
    console.error("Error fetching time clock events:", error)
    return NextResponse.json({ error: "Failed to fetch time clock events" }, { status: 500 })
  }
}
