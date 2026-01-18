import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Fetch assessment types from catalog
    const { data: assessmentCatalog, error: catalogError } = await supabase
      .from("assessment_forms_catalog")
      .select("*")
      .eq("is_active", true)
      .order("form_name")

    // Fetch recent patient assessments with patient info
    const { data: recentAssessments, error: recentError } = await supabase
      .from("patient_assessments")
      .select(
        `
        *,
        assessment_forms_catalog(form_name, category)
      `,
      )
      .order("assessment_date", { ascending: false })
      .limit(20)

    // Fetch patients for patient selection
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .order("last_name")

    // Fetch providers for provider info
    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select("id, first_name, last_name")

    // Calculate statistics
    const { count: totalAssessments } = await supabase
      .from("patient_assessments")
      .select("*", { count: "exact", head: true })

    const { count: completedCount } = await supabase
      .from("patient_assessments")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")

    const { data: highRiskData } = await supabase
      .from("patient_assessments")
      .select("id")
      .eq("severity_level", "high")
      .eq("status", "completed")

    const { data: scoreData } = await supabase
      .from("patient_assessments")
      .select("total_score")
      .not("total_score", "is", null)

    const avgScore =
      scoreData && scoreData.length > 0
        ? scoreData.reduce((sum, a) => sum + Number(a.total_score || 0), 0) / scoreData.length
        : 0

    const completionRate =
      totalAssessments && totalAssessments > 0 ? Math.round((completedCount || 0 / totalAssessments) * 100) : 0

    // Map recent assessments with patient and provider names
    const mappedAssessments = (recentAssessments || []).map((assessment: any) => {
      const patient = patients?.find((p) => p.id === assessment.patient_id)
      const provider = providers?.find((p) => p.id === assessment.provider_id)
      return {
        ...assessment,
        patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Unknown Patient",
        providerName: provider ? `${provider.first_name} ${provider.last_name}` : "Unknown Provider",
        formName: assessment.assessment_forms_catalog?.form_name || "Assessment",
        category: assessment.assessment_forms_catalog?.category || "General",
      }
    })

    // Group assessment catalog by category for display
    const categoryGroups: Record<string, any[]> = {}
    ;(assessmentCatalog || []).forEach((form: any) => {
      const category = form.category || "General"
      if (!categoryGroups[category]) {
        categoryGroups[category] = []
      }
      categoryGroups[category].push(form)
    })

    return NextResponse.json({
      assessmentCatalog: assessmentCatalog || [],
      categoryGroups,
      recentAssessments: mappedAssessments,
      patients: patients || [],
      providers: providers || [],
      statistics: {
        totalAssessments: totalAssessments || 0,
        completionRate,
        avgScore: Math.round(avgScore * 10) / 10,
        highRiskCount: highRiskData?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === "create_assessment") {
      const { patient_id, form_id, provider_id } = data

      const { data: newAssessment, error } = await supabase
        .from("patient_assessments")
        .insert({
          patient_id,
          form_id,
          provider_id,
          assessment_date: new Date().toISOString(),
          status: "in_progress",
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, assessment: newAssessment })
    }

    if (action === "complete_assessment") {
      const { assessment_id, total_score, severity_level, clinical_interpretation, recommendations } = data

      const { data: updated, error } = await supabase
        .from("patient_assessments")
        .update({
          status: "completed",
          total_score,
          severity_level,
          clinical_interpretation,
          recommendations,
          completed_at: new Date().toISOString(),
        })
        .eq("id", assessment_id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, assessment: updated })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing assessment:", error)
    return NextResponse.json({ error: "Failed to process assessment" }, { status: 500 })
  }
}
