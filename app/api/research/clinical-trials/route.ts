import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    const { data: trials, error } = await supabase
      .from("sud_clinical_trials")
      .select("*")
      .in("status", ["Enrolling", "Active"])
      .order("phase")
      .order("title")

    if (error) throw error

    return NextResponse.json({ trials: trials || [] })
  } catch (error: any) {
    console.error("[Research] Error fetching clinical trials:", error)
    return NextResponse.json({ error: "Failed to fetch trials" }, { status: 500 })
  }
}
