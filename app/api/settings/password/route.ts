import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    console.log("[v0] Password change request received")

    // Get user from session (for now using super admin email as example)
    const userEmail = "admin@maseemr.com" // TODO: Get from session/auth

    // Verify current password
    const result = await sql`
      SELECT id, password_hash 
      FROM super_admins 
      WHERE email = ${userEmail}
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = result[0]
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    await sql`
      UPDATE super_admins 
      SET password_hash = ${newPasswordHash}
      WHERE id = ${user.id}
    `

    console.log("[v0] Password changed successfully for:", userEmail)

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("[v0] Password change error:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
