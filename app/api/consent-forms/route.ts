import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch patients count
    const { count: patientsCount } = await supabase.from("patients").select("*", { count: "exact", head: true })

    // Fetch assessment forms catalog for consent form templates
    const { data: formTemplates } = await supabase
      .from("assessment_forms_catalog")
      .select("*")
      .order("category", { ascending: true })

    // Fetch patient assessments to calculate completion rates
    const { data: patientAssessments } = await supabase
      .from("patient_assessments")
      .select("id, patient_id, form_id, status, completed_at, created_at")

    // Fetch patients for tracking
    const { data: patients } = await supabase.from("patients").select("id, first_name, last_name, created_at").limit(50)

    // Calculate metrics
    const totalForms = formTemplates?.length || 0
    const totalPatients = patientsCount || 0

    // Calculate completed vs pending assessments
    const completedAssessments =
      patientAssessments?.filter((a) => a.status === "completed" || a.completed_at)?.length || 0
    const pendingAssessments =
      patientAssessments?.filter((a) => a.status === "pending" || a.status === "in_progress")?.length || 0
    const totalAssessments = patientAssessments?.length || 0

    // Build form categories from templates
    const categorizedForms: Record<
      string,
      Array<{
        id: number
        name: string
        required: boolean
        completion: number
        version: string
        description: string
        lastModified: string
      }>
    > = {}

    formTemplates?.forEach((template) => {
      const category = template.category || "General"
      if (!categorizedForms[category]) {
        categorizedForms[category] = []
      }

      // Calculate completion rate for this form
      const formAssessments = patientAssessments?.filter((a) => a.form_id === template.id) || []
      const completed = formAssessments.filter((a) => a.status === "completed" || a.completed_at).length
      const completion = formAssessments.length > 0 ? Math.round((completed / formAssessments.length) * 100) : 0

      categorizedForms[category].push({
        id: template.id,
        name: template.form_name || template.full_name || "Unnamed Form",
        required: template.requires_training || false,
        completion,
        version: template.version || "1.0",
        description: template.description || "",
        lastModified: template.updated_at || template.created_at || new Date().toISOString(),
      })
    })

    // Build patient consent tracking data
    const patientConsentData =
      patients?.map((patient) => {
        const patientAssessmentList = patientAssessments?.filter((a) => a.patient_id === patient.id) || []
        const completed = patientAssessmentList.filter((a) => a.status === "completed" || a.completed_at).length
        const pending = patientAssessmentList.filter((a) => a.status === "pending" || a.status === "in_progress").length
        const total = Math.max(totalForms, patientAssessmentList.length)

        return {
          id: patient.id,
          patientId: patient.id.substring(0, 8).toUpperCase(),
          patientName: `${patient.first_name} ${patient.last_name}`,
          totalForms: total,
          completedForms: completed,
          pendingForms: pending,
          expiringSoon: 0, // Would need expiry date tracking
          lastActivity:
            patientAssessmentList[0]?.completed_at || patientAssessmentList[0]?.created_at || patient.created_at,
          status: completed === total ? "complete" : pending > 0 ? "active" : "incomplete",
        }
      }) || []

    // Calculate pending consent forms
    const pendingForms =
      patientAssessments
        ?.filter((a) => a.status === "pending" || a.status === "in_progress")
        ?.slice(0, 10)
        ?.map((a) => {
          const patient = patients?.find((p) => p.id === a.patient_id)
          const form = formTemplates?.find((f) => f.id === a.form_id)
          return {
            id: a.id,
            patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Unknown",
            formName: form?.form_name || form?.full_name || "Unknown Form",
            category: form?.category || "General",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            priority: "medium",
            daysOverdue: 0,
          }
        }) || []

    // Calculate completion rate by category for reports
    const categoryCompletion = Object.entries(categorizedForms).map(([category, forms]) => {
      const avgCompletion =
        forms.length > 0 ? Math.round(forms.reduce((sum, f) => sum + f.completion, 0) / forms.length) : 0
      return {
        category,
        completion: avgCompletion,
        total: totalPatients,
      }
    })

    return NextResponse.json({
      metrics: {
        totalForms,
        totalPatients,
        pendingSignatures: pendingAssessments,
        completedToday: completedAssessments,
        expiringSoon: 0,
        overallCompletionRate: totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0,
      },
      categorizedForms,
      formTemplates:
        formTemplates?.map((t) => ({
          id: t.id,
          name: t.form_name || t.full_name,
          category: t.category || "General",
          description: t.description || "",
          version: t.version || "1.0",
          isRequired: t.requires_training || false,
          lastModified: t.updated_at || t.created_at,
          status: t.is_active ? "active" : "inactive",
          completionRate: 0,
        })) || [],
      patientConsentData,
      pendingForms,
      categoryCompletion,
      statusDistribution: [
        { name: "Completed", value: completedAssessments, color: "#22c55e" },
        { name: "Pending", value: pendingAssessments, color: "#f59e0b" },
        { name: "Overdue", value: 0, color: "#ef4444" },
        { name: "Expired", value: 0, color: "#6b7280" },
      ],
    })
  } catch (error) {
    console.error("Error fetching consent forms data:", error)
    return NextResponse.json({ error: "Failed to fetch consent forms data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    // Create a new form template
    const { data, error } = await supabase
      .from("assessment_forms_catalog")
      .insert({
        form_name: body.name,
        category: body.category,
        description: body.description,
        requires_training: body.isRequired || false,
        is_active: true,
        version: "1.0",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error creating consent form template:", error)
    return NextResponse.json({ error: "Failed to create consent form template" }, { status: 500 })
  }
}
