import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    const query = supabase.from("county_staff_education_modules").select("*").eq("is_active", true).order("module_code")

    if (category) {
      query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching staff modules:", error)
      return NextResponse.json({ modules: [] })
    }

    return NextResponse.json({ modules: data || [] })
  } catch (error) {
    console.error("[v0] Error in staff education API:", error)
    return NextResponse.json({ modules: [] })
  }
}
