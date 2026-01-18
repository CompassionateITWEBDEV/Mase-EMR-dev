import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[v0] Super admin login attempt for:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const { data: admins, error: queryError } = await supabase
      .from("super_admins")
      .select("id, email, password_hash, full_name, is_active")
      .eq("email", email)
      .eq("is_active", true)

    console.log("[v0] Query result:", { admins, queryError })

    if (queryError) {
      console.error("[v0] Database query error:", queryError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!admins || admins.length === 0) {
      console.log("[v0] No admin found for email:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const admin = admins[0]

    // In production, use bcrypt.compare(password, admin.password_hash)
    // For demo, simple comparison (CHANGE THIS IN PRODUCTION!)
    const isValid = password === "MaseAdmin2025!"

    console.log("[v0] Password validation:", isValid)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session token
    const sessionToken = `sa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

    const { error: sessionError } = await supabase.from("super_admin_sessions").insert({
      super_admin_id: admin.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
    })

    if (sessionError) {
      console.error("[v0] Session creation error:", sessionError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    await supabase.from("super_admins").update({ last_login_at: new Date().toISOString() }).eq("id", admin.id)

    console.log("[v0] Login successful for:", email)

    const response = NextResponse.json({
      success: true,
      sessionToken,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
      },
      redirectTo: "/super-admin/dashboard",
    })

    // Set session cookie
    response.cookies.set("super_admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
    })

    return response
  } catch (error) {
    console.error("[v0] Super admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
