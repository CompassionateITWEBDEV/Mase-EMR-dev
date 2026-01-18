import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Get documentation compliance - progress notes completed vs appointments
    let documentationScore = 0
    let documentationDetails = "No data available"
    try {
      const { count: notesCount } = await supabase.from("progress_notes").select("*", { count: "exact", head: true })

      const { count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")

      if (appointmentsCount && appointmentsCount > 0) {
        documentationScore = Math.min(100, Math.round(((notesCount || 0) / appointmentsCount) * 100))
        documentationDetails = `${notesCount || 0}/${appointmentsCount} notes completed`
      }
    } catch (e) {
      console.error("Error fetching documentation data:", e)
    }

    // Get assessment compliance - completed assessments
    let assessmentScore = 0
    let assessmentDetails = "No data available"
    try {
      const { count: completedAssessments } = await supabase
        .from("patient_assessments")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")

      const { count: totalAssessments } = await supabase
        .from("patient_assessments")
        .select("*", { count: "exact", head: true })

      if (totalAssessments && totalAssessments > 0) {
        assessmentScore = Math.round(((completedAssessments || 0) / totalAssessments) * 100)
        assessmentDetails = `${completedAssessments || 0}/${totalAssessments} assessments current`
      }
    } catch (e) {
      console.error("Error fetching assessment data:", e)
    }

    // Get treatment plan compliance
    let treatmentPlanScore = 0
    let treatmentPlanDetails = "No data available"
    try {
      const { count: activePlans } = await supabase
        .from("treatment_plans")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")

      const { count: totalPlans } = await supabase.from("treatment_plans").select("*", { count: "exact", head: true })

      if (totalPlans && totalPlans > 0) {
        treatmentPlanScore = Math.round(((activePlans || 0) / totalPlans) * 100)
        treatmentPlanDetails = `${activePlans || 0}/${totalPlans} plans updated`
      }
    } catch (e) {
      console.error("Error fetching treatment plan data:", e)
    }

    // Get safety protocol compliance from vital signs (proxy for safety screenings)
    let safetyScore = 0
    let safetyDetails = "No data available"
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: recentVitals } = await supabase
        .from("vital_signs")
        .select("*", { count: "exact", head: true })
        .gte("measurement_date", thirtyDaysAgo.toISOString())

      const { count: activePatients } = await supabase.from("patients").select("*", { count: "exact", head: true })

      if (activePatients && activePatients > 0) {
        safetyScore = Math.min(100, Math.round(((recentVitals || 0) / activePatients) * 100))
        safetyDetails = `${recentVitals || 0}/${activePatients} safety screenings complete`
      }
    } catch (e) {
      console.error("Error fetching safety data:", e)
    }

    // Build compliance metrics
    const complianceMetrics = [
      {
        category: "Documentation",
        score: documentationScore,
        status: documentationScore >= 90 ? "excellent" : documentationScore >= 70 ? "good" : "needs-attention",
        details: documentationDetails,
      },
      {
        category: "ASAM Assessments",
        score: assessmentScore,
        status: assessmentScore >= 90 ? "excellent" : assessmentScore >= 70 ? "good" : "needs-attention",
        details: assessmentDetails,
      },
      {
        category: "Treatment Plans",
        score: treatmentPlanScore,
        status: treatmentPlanScore >= 90 ? "excellent" : treatmentPlanScore >= 70 ? "good" : "needs-attention",
        details: treatmentPlanDetails,
      },
      {
        category: "Safety Protocols",
        score: safetyScore,
        status: safetyScore >= 90 ? "excellent" : safetyScore >= 70 ? "good" : "needs-attention",
        details: safetyDetails,
      },
    ]

    // Get recent audits from compliance_reports table
    let recentAudits: Array<{
      date: string
      type: string
      result: string
      score: string
    }> = []

    try {
      const { data: reports } = await supabase
        .from("compliance_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (reports && reports.length > 0) {
        recentAudits = reports.map((report) => ({
          date: new Date(report.created_at).toISOString().split("T")[0],
          type: report.report_type || "Compliance Audit",
          result:
            report.status === "completed" ? "Passed" : report.status === "pending" ? "Pending" : "Action Required",
          score: report.report_data?.score ? `${report.report_data.score}%` : "N/A",
        }))
      }
    } catch (e) {
      console.error("Error fetching audit data:", e)
    }

    // If no audits in database, check audit_trail for recent activity
    if (recentAudits.length === 0) {
      try {
        const { data: auditLogs } = await supabase
          .from("audit_trail")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(3)

        if (auditLogs && auditLogs.length > 0) {
          recentAudits = auditLogs.map((log) => ({
            date: new Date(log.timestamp).toISOString().split("T")[0],
            type: `${log.action} - ${log.table_name}`,
            result: "Logged",
            score: "N/A",
          }))
        }
      } catch (e) {
        console.error("Error fetching audit trail:", e)
      }
    }

    return NextResponse.json({
      complianceMetrics,
      recentAudits,
    })
  } catch (error) {
    console.error("Error in compliance API:", error)
    return NextResponse.json(
      {
        complianceMetrics: [],
        recentAudits: [],
        error: "Failed to fetch compliance data",
      },
      { status: 500 },
    )
  }
}
