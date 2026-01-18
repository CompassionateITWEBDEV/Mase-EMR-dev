import { type NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Vonage/eFax configuration (set these in environment variables)
const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
const VONAGE_FAX_NUMBER = process.env.VONAGE_FAX_NUMBER;

interface FaxSendResponse {
  faxId: string;
  status: string;
  error?: string;
}

/**
 * Send Fax via Vonage API
 * Returns null if Vonage is not configured (mock mode)
 * 
 * Note: Vonage Fax API requires specific setup. This is a simplified implementation.
 * For production, consider using their SDK or a dedicated fax service like eFax, Phaxio, etc.
 */
async function sendVonageFax(
  recipientFax: string,
  fileUrl: string,
  subject: string
): Promise<FaxSendResponse | null> {
  if (!VONAGE_API_KEY || !VONAGE_API_SECRET || !VONAGE_FAX_NUMBER) {
    console.log("[v0] Vonage not configured - Fax will be queued but not sent");
    return null;
  }

  try {
    // Vonage Fax API endpoint (simplified - actual implementation may vary)
    const response = await fetch("https://api.nexmo.com/v1/fax", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${VONAGE_API_KEY}:${VONAGE_API_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({
        from: VONAGE_FAX_NUMBER,
        to: recipientFax,
        file: fileUrl,
        subject: subject,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[v0] Vonage Fax API error:", data);
      return {
        faxId: "",
        status: "failed",
        error: data.message || "Failed to send fax",
      };
    }

    return {
      faxId: data.fax_id || data.uuid,
      status: "sent",
    };
  } catch (error) {
    console.error("[v0] Vonage Fax request failed:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const searchParams = request.nextUrl.searchParams;
    const direction = searchParams.get("direction") || "inbound";
    const status = searchParams.get("status");

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
    `;
    const params: any[] = [direction];

    if (status) {
      query += ` AND fm.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY fm.created_at DESC LIMIT 100`;

    const messages = await sql.query(query, params);

    return NextResponse.json({
      success: true,
      messages,
      vonageConfigured: !!(VONAGE_API_KEY && VONAGE_API_SECRET),
    });
  } catch (error: any) {
    console.error("[v0] Error fetching fax messages:", error);
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
    const { patientId, recipientFax, subject, fileUrl, pageCount } = body;

    // Validate required fields
    if (!recipientFax || !fileUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: recipientFax, fileUrl" },
        { status: 400 }
      );
    }

    // Insert outbound fax record
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
        ${patientId || null},
        'outbound',
        ${recipientFax},
        ${subject || "Medical Document"},
        'pending',
        ${pageCount || 1},
        ${fileUrl}
      )
      RETURNING *
    `;

    // Attempt to send via Vonage
    const vonageResponse = await sendVonageFax(recipientFax, fileUrl, subject || "Medical Document");

    if (vonageResponse) {
      // Update fax record with Vonage response
      await sql`
        UPDATE fax_messages
        SET 
          status = ${vonageResponse.status === "failed" ? "failed" : "sent"},
          external_id = ${vonageResponse.faxId || null},
          error_message = ${vonageResponse.error || null},
          sent_at = ${vonageResponse.status !== "failed" ? new Date().toISOString() : null}
        WHERE id = ${fax.id}
      `;

      if (vonageResponse.status === "failed") {
        return NextResponse.json({
          success: false,
          error: vonageResponse.error || "Failed to send fax",
          fax,
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        fax: { ...fax, status: "sent", external_id: vonageResponse.faxId },
        message: "Fax sent successfully",
      });
    }

    // Vonage not configured - return pending status
    return NextResponse.json({
      success: true,
      fax,
      message: "Fax queued (Vonage not configured - set VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FAX_NUMBER)",
      vonageConfigured: false,
    });
  } catch (error: any) {
    console.error("[v0] Error sending fax:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
