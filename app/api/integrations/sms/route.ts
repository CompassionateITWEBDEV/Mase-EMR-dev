import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { randomUUID } from "crypto"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const patientId = searchParams.get("patientId")

    let query = `
      SELECT 
        sm.*,
        p.first_name,
        p.last_name
      FROM sms_messages sm
      LEFT JOIN patients p ON sm.patient_id = p.id
    `

    if (patientId) {
      query += ` WHERE sm.patient_id = $1`
      const messages = await sql(query, [patientId])
      return NextResponse.json({ success: true, messages })
    }

    query += ` ORDER BY sm.created_at DESC LIMIT 100`
    const messages = await sql(query)

    return NextResponse.json({ success: true, messages })
  } catch (error: any) {
    console.error("[v0] Error fetching SMS messages:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, toNumber, messageBody } = body

    if (!toNumber || !messageBody) {
      return NextResponse.json(
        { success: false, error: "toNumber and messageBody are required" },
        { status: 400 },
      )
    }

    const fromNumber = process.env.TWILIO_PHONE_NUMBER || null

    const [sms] = await sql`
      INSERT INTO sms_messages (
        patient_id,
        direction,
        from_number,
        to_number,
        message_body,
        status
      ) VALUES (
        ${patientId},
        'outbound',
        ${fromNumber},
        ${toNumber},
        ${messageBody},
        'queued'
      )
      RETURNING *
    `

    const twilioSid = `SM${randomUUID().replace(/-/g, "")}`
    const [sentSms] = await sql`
      UPDATE sms_messages
      SET status = 'sent',
        sent_at = NOW(),
        twilio_sid = ${twilioSid}
      WHERE id = ${sms.id}
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      sms: sentSms,
      message: "SMS sent successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error sending SMS:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
