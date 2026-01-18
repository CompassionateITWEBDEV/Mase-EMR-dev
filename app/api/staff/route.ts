import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const staff = await sql`
      SELECT
        id,
        first_name,
        last_name,
        email,
        role,
        department,
        status,
        created_at,
        updated_at
      FROM staff
      ORDER BY last_name, first_name
    `

    return NextResponse.json({
      success: true,
      staff,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching staff:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const body = await request.json()
    const { firstName, lastName, email, role, department, status } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const [newStaff] = await sql`
      INSERT INTO staff (
        first_name,
        last_name,
        email,
        role,
        department,
        status
      ) VALUES (
        ${firstName},
        ${lastName},
        ${email},
        ${role},
        ${department || null},
        ${status || 'active'}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      staff: newStaff,
      message: "Staff member created successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error creating staff:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
