import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword, userEmail } = body

    console.log("[v0] Password change request received")

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 })
    }

    const resolvedEmail =
      userEmail || request.headers.get("x-user-email") || request.headers.get("x-admin-email")

    if (!resolvedEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 })
    }

    // Verify current password
    const userResult = await sql`
      SELECT id, password_hash, 'user_accounts' as source
      FROM user_accounts
      WHERE email = ${resolvedEmail}
    `

    const superAdminResult = userResult.length
      ? []
      : await sql`
          SELECT id, password_hash, 'super_admins' as source
          FROM super_admins
          WHERE email = ${resolvedEmail}
        `

    const result = userResult.length ? userResult : superAdminResult

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
    if (user.source === "user_accounts") {
      await sql`
        UPDATE user_accounts
        SET password_hash = ${newPasswordHash},
          updated_at = NOW()
        WHERE id = ${user.id}
      `
    } else {
      await sql`
        UPDATE super_admins 
        SET password_hash = ${newPasswordHash}
        WHERE id = ${user.id}
      `
    }

    console.log("[v0] Password changed successfully for:", resolvedEmail)

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("[v0] Password change error:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
