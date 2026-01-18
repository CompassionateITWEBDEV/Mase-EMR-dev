import { createServiceClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get user counts for each organization
    const orgsWithCounts = await Promise.all(
      (organizations || []).map(async (org) => {
        const { count } = await supabase
          .from("user_accounts")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id)

        return { ...org, user_count: count || 0 }
      }),
    )

    return NextResponse.json(orgsWithCounts)
  } catch (error) {
    console.error("[v0] Get organizations error:", error)
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Creating organization with data:", body)

    const supabase = createServiceClient()

    const { data: organization, error } = await supabase
      .from("organizations")
      .insert({
        organization_name: body.organization_name,
        organization_slug: body.organization_slug,
        organization_type: body.organization_type,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Create organization error:", error)
      throw error
    }

    console.log("[v0] Organization created successfully:", organization)
    return NextResponse.json(organization)
  } catch (error) {
    console.error("[v0] Create organization error:", error)
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
  }
}
