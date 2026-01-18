import { type NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");

    let query = `
      SELECT
        sm.*,
        p.first_name,
        p.last_name
      FROM sms_messages sm
      LEFT JOIN patients p ON sm.patient_id = p.id
    `;

    if (patientId) {
      query += ` WHERE sm.patient_id = $1`;
      const messages = await sql.query(query, [patientId]);
      return NextResponse.json({ success: true, messages });
    }

    query += ` ORDER BY sm.created_at DESC LIMIT 100`;
    const messages = await sql.query(query, []);

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("[v0] Error fetching SMS messages:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const body = await request.json();
    const { patientId, toNumber, messageBody } = body;

    const [sms] = await sql`
      INSERT INTO sms_messages (
        patient_id,
        direction,
        to_number,
        message_body,
        status
      ) VALUES (
        ${patientId},
        'outbound',
        ${toNumber},
        ${messageBody},
        'queued'
      )
      RETURNING *
    `;

    // TODO: Integrate with Twilio API
    // const twilioResponse = await sendTwilioSMS(...)

    return NextResponse.json({
      success: true,
      sms,
      message: "SMS queued for sending",
    });
  } catch (error: any) {
    console.error("[v0] Error sending SMS:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
