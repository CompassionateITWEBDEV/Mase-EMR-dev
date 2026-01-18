import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const referrals = await sql`
      SELECT 
        cr.*,
        (SELECT COUNT(*) FROM community_referral_notes WHERE referral_id = cr.id) as notes_count
      FROM community_referrals cr
      ORDER BY cr.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ referrals })
  } catch (error) {
    console.error("[v0] Error fetching referrals:", error)
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { first_name, last_name, phone, email, referral_source, urgency_level, services_requested, notes } = body

    // Generate referral number
    const year = new Date().getFullYear()
    const countResult = await sql`
      SELECT COUNT(*) as count FROM community_referrals 
      WHERE EXTRACT(YEAR FROM created_at) = ${year}
    `
    const nextNumber = (Number.parseInt(countResult[0].count) + 1).toString().padStart(4, "0")
    const referral_number = `REF-${year}-${nextNumber}`

    const result = await sql`
      INSERT INTO community_referrals (
        referral_number, first_name, last_name, phone, email,
        referral_source, urgency_level, services_requested, notes, status
      ) VALUES (
        ${referral_number}, ${first_name}, ${last_name}, ${phone}, ${email},
        ${referral_source}, ${urgency_level}, ${JSON.stringify(services_requested)}, 
        ${notes}, 'new'
      )
      RETURNING *
    `

    return NextResponse.json({ referral: result[0] })
  } catch (error) {
    console.error("[v0] Error creating referral:", error)
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 })
  }
}
