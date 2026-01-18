import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Fetch from overdose_prevention_studies or comorbid_sud_research
    // Using overdose_prevention_studies as primary source
    const { data: studies, error } = await supabase
      .from("overdose_prevention_studies")
      .select("*")
      .order("start_date", { ascending: false })

    if (error) throw error

    return NextResponse.json({ studies: studies || [] })
  } catch (error: any) {
    console.error("[Research] Error fetching research studies:", error)
    return NextResponse.json({ error: "Failed to fetch studies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const {
      study_code,
      study_name,
      study_type,
      status,
      participants_enrolled,
      overdose_reversals_documented,
      naloxone_kits_distributed,
      training_sessions_completed,
      community_partners,
      key_findings,
      lives_saved,
      behavior_change_rate,
      mortality_reduction_percentage,
    } = body

    // Generate study_code if not provided
    const finalStudyCode = study_code || `STUDY-${Date.now()}`

    const { data: study, error } = await supabase
      .from("overdose_prevention_studies")
      .insert({
        study_code: finalStudyCode,
        study_name,
        study_type,
        status,
        participants_enrolled: participants_enrolled || 0,
        overdose_reversals_documented: overdose_reversals_documented || 0,
        naloxone_kits_distributed: naloxone_kits_distributed || 0,
        training_sessions_completed: training_sessions_completed || 0,
        community_partners: community_partners || 0,
        key_findings,
        lives_saved: lives_saved || 0,
        behavior_change_rate: behavior_change_rate || null,
        mortality_reduction_percentage: mortality_reduction_percentage || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ study })
  } catch (error: any) {
    console.error("[Research] Error creating study:", error)
    return NextResponse.json({ error: "Failed to create study" }, { status: 500 })
  }
}
