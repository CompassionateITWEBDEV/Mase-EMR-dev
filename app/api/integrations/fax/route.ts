import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const direction = searchParams.get("direction") || "inbound"
    const status = searchParams.get("status")

    let query = `
      SELECT 
        fm.*,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        (SELECT COUNT(*) FROM fax_attachments WHERE fax_message_id = fm.id) as attachment_count
      FROM fax_messages fm
      LEFT JOIN patients p ON fm.patient_id = p.id
      WHERE fm.direction = $1
    `
    const params: any[] = [direction]

    if (status) {
      query += ` AND fm.status = $${params.length + 1}`
      params.push(status)
    }

    query += ` ORDER BY fm.created_at DESC LIMIT 100`

    const messages = await sql(query, params)

    return NextResponse.json({
      success: true,
      messages,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching fax messages:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, recipientFax, subject, fileUrl, pageCount } = body

    // Insert outbound fax
    const [fax] = await sql`
      INSERT INTO fax_messages (
        patient_id,
        direction,
        recipient_fax,
        subject,
        status,
        page_count,
        file_url
      ) VALUES (
        ${patientId},
        'outbound',
        ${recipientFax},
        ${subject},
        'pending',
        ${pageCount},
        ${fileUrl}
      )
      RETURNING *
    `

    // TODO: Integrate with Vonage API to send fax
    // const vonageResponse = await sendVonageFax(...)

    return NextResponse.json({
      success: true,
      fax,
      message: "Fax queued for sending",
    })
  } catch (error: any) {
    console.error("[v0] Error sending fax:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
