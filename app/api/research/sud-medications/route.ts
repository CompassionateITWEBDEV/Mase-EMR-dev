import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Order by development stage priority
    const { data: medications, error } = await supabase
      .from("sud_medication_development")
      .select("*")
      .order("medication_name")

    if (error) throw error

    // Sort by development stage priority (client-side since Supabase doesn't support CASE in order)
    const stagePriority: Record<string, number> = {
      fda_review: 1,
      phase_3: 2,
      phase_2: 3,
      phase_1: 4,
      preclinical: 5,
      discovery: 6,
      approved: 0,
    }

    const sortedMedications = (medications || []).sort((a: any, b: any) => {
      const aPriority = stagePriority[a.development_stage] || 7
      const bPriority = stagePriority[b.development_stage] || 7
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      return a.medication_name.localeCompare(b.medication_name)
    })

    return NextResponse.json({ medications: sortedMedications })
  } catch (error: any) {
    console.error("[Research] Error fetching SUD medications:", error)
    return NextResponse.json({ error: "Failed to fetch medications" }, { status: 500 })
  }
}
