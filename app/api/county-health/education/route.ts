import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const programType = searchParams.get("programType")

    const query = supabase.from("county_family_education_resources").select("*").eq("is_active", true).order("title")

    if (programType) {
      query.eq("program_type", programType)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching education resources:", error)
      return NextResponse.json({ resources: [] })
    }

    return NextResponse.json({ resources: data || [] })
  } catch (error) {
    console.error("[v0] Error in education API:", error)
    return NextResponse.json({ resources: [] })
  }
}
