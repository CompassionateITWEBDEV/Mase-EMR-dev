import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const supabase = await createClient()

    // Query super_admins table
    const { data: superAdmin, error } = await supabase
      .from("super_admins")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single()

    if (error || !superAdmin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // In production, verify password hash properly
    // For now, simple comparison (CHANGE THIS IN PRODUCTION)
    if (password !== "Admin@123") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Update last login
    await supabase.from("super_admins").update({ last_login_at: new Date().toISOString() }).eq("id", superAdmin.id)

    // Log login activity
    await supabase.from("login_activity").insert({
      user_id: superAdmin.id,
      user_type: "super_admin",
      email: superAdmin.email,
      login_status: "success",
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json({
      success: true,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        full_name: superAdmin.full_name,
        user_type: "super_admin",
        permissions: superAdmin.permissions,
      },
    })
  } catch (error) {
    console.error("[v0] Super admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
