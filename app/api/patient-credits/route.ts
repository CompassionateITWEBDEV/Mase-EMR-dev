import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const { searchParams } = new URL(req.url)
    const patient_id = searchParams.get("patient_id")

    if (!patient_id) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
    }

    // Get total available credits
    const result = await sql`
      SELECT get_patient_available_credits(${patient_id}::uuid) as total_credits
    `

    // Get credit history
    const credits = await sql`
      SELECT 
        id,
        credit_amount,
        credit_type,
        credit_reason,
        remaining_amount,
        status,
        applied_at,
        expires_at,
        notes
      FROM patient_credits
      WHERE patient_id = ${patient_id}::uuid
      ORDER BY applied_at DESC
    `

    return NextResponse.json({
      total_credits: result[0]?.total_credits || 0,
      credits: credits,
    })
  } catch (error) {
    console.error("Error fetching patient credits:", error)
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const body = await req.json()
    const { patient_id, credit_amount, credit_type, credit_reason, applied_by, notes, expires_at } = body

    if (!patient_id || !credit_amount || !credit_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert new credit
    const result = await sql`
      INSERT INTO patient_credits (
        patient_id, 
        credit_amount, 
        credit_type, 
        credit_reason, 
        applied_by,
        remaining_amount,
        expires_at,
        notes
      )
      VALUES (
        ${patient_id}::uuid,
        ${credit_amount},
        ${credit_type},
        ${credit_reason || null},
        ${applied_by}::uuid,
        ${credit_amount},
        ${expires_at || null},
        ${notes || null}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, credit: result[0] })
  } catch (error) {
    console.error("Error applying credit:", error)
    return NextResponse.json({ error: "Failed to apply credit" }, { status: 500 })
  }
}
