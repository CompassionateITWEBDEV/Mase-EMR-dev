import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ success: false, error: "Patient ID required" }, { status: 400 })
    }

    const requests = await sql`
      SELECT 
        pr.*,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        prov.first_name as provider_first_name,
        prov.last_name as provider_last_name,
        (SELECT COUNT(*) FROM pdmp_prescriptions WHERE pdmp_request_id = pr.id) as prescription_count
      FROM pdmp_requests pr
      LEFT JOIN patients p ON pr.patient_id = p.id
      LEFT JOIN providers prov ON pr.provider_id = prov.id
      WHERE pr.patient_id = ${patientId}
      ORDER BY pr.request_date DESC
    `

    return NextResponse.json({ success: true, requests })
  } catch (error: any) {
    console.error("[v0] Error fetching PDMP requests:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, providerId, requestType, stateCode } = body

    // Create PDMP request
    const [pdmpRequest] = await sql`
      INSERT INTO pdmp_requests (
        patient_id,
        provider_id,
        request_type,
        request_status,
        state_requested
      ) VALUES (
        ${patientId},
        ${providerId},
        ${requestType || "routine"},
        'pending',
        ${stateCode}
      )
      RETURNING *
    `

    // TODO: Integrate with State PDMP API
    // const pdmpResponse = await queryStatePDMP(...)

    // Mock red flags analysis
    const mockRedFlags = {
      doctor_shopping: false,
      overlapping_prescriptions: false,
      high_mme: false,
      multiple_pharmacies: false,
    }

    return NextResponse.json({
      success: true,
      request: pdmpRequest,
      message: "PDMP request submitted",
      redFlags: mockRedFlags,
    })
  } catch (error: any) {
    console.error("[v0] Error creating PDMP request:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
