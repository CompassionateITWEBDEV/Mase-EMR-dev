import { type NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Twilio configuration (set these in environment variables)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

interface TwilioMessageResponse {
  sid: string;
  status: string;
  error_code?: number;
  error_message?: string;
}

/**
 * Send SMS via Twilio API
 * Returns null if Twilio is not configured (mock mode)
 */
async function sendTwilioSMS(
  toNumber: string,
  messageBody: string
): Promise<TwilioMessageResponse | null> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log("[v0] Twilio not configured - SMS will be queued but not sent");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: toNumber,
          From: TWILIO_PHONE_NUMBER,
          Body: messageBody,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error("[v0] Twilio API error:", data);
      return {
        sid: "",
        status: "failed",
        error_code: data.code,
        error_message: data.message,
      };
    }

    return {
      sid: data.sid,
      status: data.status,
    };
  } catch (error) {
    console.error("[v0] Twilio request failed:", error);
    return null;
  }
}

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

    return NextResponse.json({ 
      success: true, 
      messages,
      twilioConfigured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN),
    });
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

    // Validate required fields
    if (!toNumber || !messageBody) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: toNumber, messageBody" },
        { status: 400 }
      );
    }

    // Insert SMS record
    const [sms] = await sql`
      INSERT INTO sms_messages (
        patient_id,
        direction,
        to_number,
        message_body,
        status
      ) VALUES (
        ${patientId || null},
        'outbound',
        ${toNumber},
        ${messageBody},
        'queued'
      )
      RETURNING *
    `;

    // Attempt to send via Twilio
    const twilioResponse = await sendTwilioSMS(toNumber, messageBody);

    if (twilioResponse) {
      // Update SMS record with Twilio response
      await sql`
        UPDATE sms_messages
        SET 
          status = ${twilioResponse.status === "failed" ? "failed" : "sent"},
          external_id = ${twilioResponse.sid || null},
          error_message = ${twilioResponse.error_message || null},
          sent_at = ${twilioResponse.status !== "failed" ? new Date().toISOString() : null}
        WHERE id = ${sms.id}
      `;

      if (twilioResponse.status === "failed") {
        return NextResponse.json({
          success: false,
          error: twilioResponse.error_message || "Failed to send SMS",
          sms,
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        sms: { ...sms, status: "sent", external_id: twilioResponse.sid },
        message: "SMS sent successfully",
      });
    }

    // Twilio not configured - return queued status
    return NextResponse.json({
      success: true,
      sms,
      message: "SMS queued (Twilio not configured - set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)",
      twilioConfigured: false,
    });
  } catch (error: any) {
    console.error("[v0] Error sending SMS:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
