import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server-client"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Fetch PIHP user with organization details
    const { data: pihpUser, error: pihpError } = await supabase
      .from("pihp_users")
      .select("*, pihp_organizations(*)")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single()

    if (pihpError || !pihpUser) {
      console.error("[v0] PIHP user not found:", email)
      return NextResponse.json(
        { success: false, error: "Invalid credentials or account is inactive" },
        { status: 401 }
      )
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, pihpUser.password_hash)

    if (!isPasswordValid) {
      console.error("[v0] Invalid password for PIHP user:", email)
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Update last login timestamp
    await supabase
      .from("pihp_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", pihpUser.id)

    // Log the successful login
    await supabase.from("pihp_audit_log").insert({
      pihp_user_id: pihpUser.id,
      action: "login",
      resource_type: "system",
      action_details: `Successful login from PIHP: ${pihpUser.pihp_organizations.pihp_name}`,
      user_agent: request.headers.get("user-agent") || "unknown",
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    })

    console.log("[v0] PIHP user logged in successfully:", email)

    // Return user data (excluding password hash)
    const { password_hash, ...userDataWithoutPassword } = pihpUser

    return NextResponse.json({
      success: true,
      user: userDataWithoutPassword,
    })
  } catch (error) {
    console.error("[v0] PIHP login error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred during login" },
      { status: 500 }
    )
  }
}
