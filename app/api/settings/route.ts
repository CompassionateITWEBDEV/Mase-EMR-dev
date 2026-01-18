import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { profile } = body

    console.log("[v0] Saving settings:", profile)

    if (!profile?.email) {
      return NextResponse.json({ error: "Profile email is required" }, { status: 400 })
    }

    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim()

    const [userAccount] = await sql`
      UPDATE user_accounts
      SET first_name = ${profile.firstName},
        last_name = ${profile.lastName},
        phone = ${profile.phone},
        license_number = ${profile.license},
        role = ${profile.role},
        permissions = COALESCE(permissions, '{}'::jsonb) || ${JSON.stringify({ profile_bio: profile.bio || "" })}::jsonb,
        updated_at = NOW()
      WHERE email = ${profile.email}
      RETURNING *
    `

    let updatedProfile = userAccount

    if (!updatedProfile) {
      const [provider] = await sql`
        UPDATE providers
        SET first_name = ${profile.firstName},
          last_name = ${profile.lastName},
          phone = ${profile.phone},
          license_number = ${profile.license},
          updated_at = NOW()
        WHERE email = ${profile.email}
        RETURNING *
      `

      updatedProfile = provider
    }

    if (!updatedProfile) {
      const [superAdmin] = await sql`
        UPDATE super_admins
        SET full_name = ${fullName},
          phone = ${profile.phone}
        WHERE email = ${profile.email}
        RETURNING *
      `

      updatedProfile = superAdmin
    }

    if (!updatedProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      profile: updatedProfile,
    })
  } catch (error) {
    console.error("[v0] Settings save error:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
