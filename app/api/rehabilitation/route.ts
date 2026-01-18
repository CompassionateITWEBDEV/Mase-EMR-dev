import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    // Get Rehab Providers
    if (action === "providers") {
      const specialtyType = searchParams.get("specialtyType")

      let query = supabase.from("rehab_providers").select("*").eq("status", "active").order("therapist_name")

      if (specialtyType) {
        query = query.eq("specialty_type", specialtyType)
      }

      const { data: providers, error } = await query

      if (error) throw error

      return NextResponse.json({ providers: providers || [] })
    }

    // Get Referrals
    if (action === "referrals") {
      const patientId = searchParams.get("patientId")

      let query = supabase
        .from("rehab_referrals")
        .select(`
          *,
          patients(id, first_name, last_name),
          providers(id, first_name, last_name),
          rehab_providers(therapist_name, specialty_type, credentials)
        `)
        .order("referral_date", { ascending: false })

      if (patientId) {
        query = query.eq("patient_id", patientId)
      }

      const { data: referrals, error } = await query

      if (error) throw error

      return NextResponse.json({ referrals: referrals || [] })
    }

    // Get Evaluations
    if (action === "evaluations") {
      const referralId = searchParams.get("referralId")

      const { data: evaluations, error } = await supabase
        .from("rehab_evaluations")
        .select("*")
        .eq("referral_id", referralId)
        .order("evaluation_date", { ascending: false })

      if (error) throw error

      return NextResponse.json({ evaluations: evaluations || [] })
    }

    // Get Treatment Notes
    if (action === "treatment-notes") {
      const referralId = searchParams.get("referralId")

      const { data: notes, error } = await supabase
        .from("rehab_treatment_notes")
        .select("*")
        .eq("referral_id", referralId)
        .order("treatment_date", { ascending: false })

      if (error) throw error

      return NextResponse.json({ notes: notes || [] })
    }

    // Get Dashboard Stats
    const { data: patients } = await supabase
      .from("patients")
      .select("id, first_name, last_name, patient_number")
      .order("last_name")
      .limit(100)

    const { data: providers } = await supabase
      .from("providers")
      .select("id, first_name, last_name, credentials")
      .order("last_name")

    const { count: pendingCount } = await supabase
      .from("rehab_referrals")
      .select("*", { count: "exact", head: true })
      .eq("referral_status", "pending")

    const { count: activeCount } = await supabase
      .from("rehab_referrals")
      .select("*", { count: "exact", head: true })
      .eq("referral_status", "in-progress")

    const { count: completedCount } = await supabase
      .from("rehab_referrals")
      .select("*", { count: "exact", head: true })
      .eq("referral_status", "completed")

    return NextResponse.json({
      stats: { pending: pendingCount || 0, active: activeCount || 0, completed: completedCount || 0 },
      patients: patients || [],
      providers: providers || [],
    })
  } catch (error: any) {
    console.error("[v0] Rehabilitation API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch rehabilitation data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { action } = body

    // Create Rehab Provider
    if (action === "create-provider") {
      const { data, error } = await supabase
        .from("rehab_providers")
        .insert({
          therapist_name: body.therapistName,
          credentials: body.credentials,
          specialty_type: body.specialtyType,
          subspecialties: body.subspecialties || [],
          phone: body.phone,
          email: body.email,
          license_number: body.licenseNumber,
          npi: body.npi,
          status: "active",
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from("audit_trail").insert({
        action: "rehab_provider_created",
        details: { provider_id: data.id, name: body.therapistName, type: body.specialtyType },
      })

      return NextResponse.json({ success: true, provider: data })
    }

    // Create Referral
    if (action === "create-referral") {
      const referralNumber = `REHAB-${Date.now()}`

      const { data, error } = await supabase
        .from("rehab_referrals")
        .insert({
          patient_id: body.patientId,
          referring_provider_id: body.referringProviderId,
          rehab_provider_id: body.rehabProviderId,
          referral_date: body.referralDate || new Date().toISOString().split("T")[0],
          referral_number: referralNumber,
          therapy_type: body.therapyType,
          urgency: body.urgency || "Routine",
          diagnosis_codes: body.diagnosisCodes || [],
          primary_complaint: body.primaryComplaint,
          current_functional_level: body.currentFunctionalLevel,
          functional_goals: body.functionalGoals,
          requested_frequency: body.requestedFrequency,
          requested_duration: body.requestedDuration,
          referral_status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from("audit_trail").insert({
        action: "rehab_referral_created",
        details: { referral_id: data.id, patient_id: body.patientId, type: body.therapyType },
      })

      return NextResponse.json({ success: true, referral: data })
    }

    // Create Evaluation
    if (action === "create-evaluation") {
      const { data, error } = await supabase
        .from("rehab_evaluations")
        .insert({
          referral_id: body.referralId,
          patient_id: body.patientId,
          therapist_id: body.therapistId,
          evaluation_date: body.evaluationDate || new Date().toISOString().split("T")[0],
          evaluation_type: body.evaluationType || "Initial",
          chief_complaint: body.chiefComplaint,
          patient_goals: body.patientGoals,
          pain_level: body.painLevel,
          range_of_motion: body.rangeOfMotion || {},
          strength_testing: body.strengthTesting || {},
          clinical_impression: body.clinicalImpression,
          short_term_goals: body.shortTermGoals,
          long_term_goals: body.longTermGoals,
          treatment_plan: body.treatmentPlan,
          prognosis: body.prognosis,
          evaluation_status: "draft",
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, evaluation: data })
    }

    // Create Treatment Note
    if (action === "create-treatment-note") {
      const { data, error } = await supabase
        .from("rehab_treatment_notes")
        .insert({
          referral_id: body.referralId,
          patient_id: body.patientId,
          therapist_id: body.therapistId,
          treatment_date: body.treatmentDate || new Date().toISOString().split("T")[0],
          session_number: body.sessionNumber,
          session_duration_minutes: body.durationMinutes,
          patient_report: body.patientReport,
          pain_level_pre: body.painLevelPre,
          pain_level_post: body.painLevelPost,
          interventions_performed: body.interventionsPerformed || [],
          patient_response: body.patientResponse,
          progress_status: body.progressStatus,
          plan_for_next_visit: body.planForNextVisit,
          cpt_codes: body.cptCodes || [],
          billable_units: body.billableUnits,
          note_status: "draft",
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, note: data })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Rehabilitation API POST error:", error)
    return NextResponse.json({ error: error.message || "Failed to process rehabilitation request" }, { status: 500 })
  }
}
