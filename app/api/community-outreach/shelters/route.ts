import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || "all"

    let query
    if (type === "all" && !search) {
      query = sql`SELECT * FROM shelters ORDER BY name`
    } else if (type !== "all" && !search) {
      query = sql`SELECT * FROM shelters WHERE type = ${type} ORDER BY name`
    } else if (type === "all" && search) {
      query = sql`
        SELECT * FROM shelters 
        WHERE name ILIKE ${`%${search}%`} OR address ILIKE ${`%${search}%`}
        ORDER BY name
      `
    } else {
      query = sql`
        SELECT * FROM shelters 
        WHERE type = ${type} AND (name ILIKE ${`%${search}%`} OR address ILIKE ${`%${search}%`})
        ORDER BY name
      `
    }

    const shelters = await query
    return NextResponse.json({ shelters })
  } catch (error) {
    console.error("[v0] Error fetching shelters:", error)
    return NextResponse.json({ error: "Failed to fetch shelters" }, { status: 500 })
  }
}
