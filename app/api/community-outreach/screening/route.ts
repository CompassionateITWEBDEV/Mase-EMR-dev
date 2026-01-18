import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const screenings = await sql`
      SELECT * FROM community_screenings
      ORDER BY created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ screenings })
  } catch (error) {
    console.error("[v0] Error fetching screenings:", error)
    return NextResponse.json({ error: "Failed to fetch screenings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { responses, risk_level, recommendations } = body

    const result = await sql`
      INSERT INTO community_screenings (responses, risk_level, recommendations)
      VALUES (${JSON.stringify(responses)}, ${risk_level}, ${JSON.stringify(recommendations)})
      RETURNING *
    `

    return NextResponse.json({ screening: result[0] })
  } catch (error) {
    console.error("[v0] Error creating screening:", error)
    return NextResponse.json({ error: "Failed to create screening" }, { status: 500 })
  }
}
