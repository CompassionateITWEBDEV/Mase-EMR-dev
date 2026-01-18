import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    // Get organization ID (in real app, get from authenticated user)
    const organizationId = "00000000-0000-0000-0000-000000000001" // Replace with actual org ID

    const { data: subscription, error } = await supabase
      .from("community_outreach_subscriptions")
      .select("*")
      .eq("organization_id", organizationId)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json(subscription || null)
  } catch (error) {
    console.error("Error fetching outreach subscription:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}
