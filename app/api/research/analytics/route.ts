import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET - Get research analytics and reporting data
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const studyId = searchParams.get("studyId")
    const dateRange = searchParams.get("dateRange") || "all" // all, 30, 90, 365

    // Calculate date filter
    let dateFilter: Date | null = null
    if (dateRange !== "all") {
      dateFilter = new Date()
      dateFilter.setDate(dateFilter.getDate() - parseInt(dateRange))
    }

    // Build base query
    let studiesQuery = supabase.from("research_studies").select("*")
    if (studyId) {
      studiesQuery = studiesQuery.eq("id", studyId)
    }

    const { data: studies, error: studiesError } = await studiesQuery

    if (studiesError) {
      console.error("Error fetching studies for analytics:", studiesError)
      return NextResponse.json({ error: studiesError.message }, { status: 500 })
    }

    if (!studies || studies.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          total_studies: 0,
          enrollment_trends: [],
          status_distribution: {},
          enrollment_by_month: [],
          consent_rates: [],
        },
      })
    }

    // Get all participants
    const studyIds = studies.map((s) => s.id)
    const { data: participants, error: participantsError } = await supabase
      .from("research_study_participants")
      .select("*")
      .in("study_id", studyIds)

    if (participantsError) {
      console.error("Error fetching participants for analytics:", participantsError)
    }

    const participantsList = participants || []

    // Calculate enrollment trends (last 12 months)
    const enrollmentTrends: Array<{ month: string; enrolled: number; withdrawn: number }> = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const enrolled = participantsList.filter((p) => {
        const enrolledDate = new Date(p.enrolled_date)
        return enrolledDate >= monthStart && enrolledDate <= monthEnd
      }).length

      const withdrawn = participantsList.filter((p) => {
        if (!p.withdrawal_date) return false
        const withdrawalDate = new Date(p.withdrawal_date)
        return withdrawalDate >= monthStart && withdrawalDate <= monthEnd
      }).length

      enrollmentTrends.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        enrolled,
        withdrawn,
      })
    }

    // Status distribution
    const statusDistribution: Record<string, number> = {}
    studies.forEach((study) => {
      statusDistribution[study.status] = (statusDistribution[study.status] || 0) + 1
    })

    // Enrollment by month (for selected study or all)
    const enrollmentByMonth: Array<{ month: string; count: number }> = []
    const enrollmentMap: Record<string, number> = {}
    participantsList.forEach((p) => {
      const enrolledDate = new Date(p.enrolled_date)
      const monthKey = enrolledDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      enrollmentMap[monthKey] = (enrollmentMap[monthKey] || 0) + 1
    })
    Object.entries(enrollmentMap)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .forEach(([month, count]) => {
        enrollmentByMonth.push({ month, count })
      })

    // Consent rates by study
    const consentRates: Array<{
      study_id: string
      study_title: string
      total_participants: number
      consent_obtained: number
      consent_rate: number
    }> = []
    studies.forEach((study) => {
      const studyParticipants = participantsList.filter((p) => p.study_id === study.id)
      const consentObtained = studyParticipants.filter((p) => p.consent_obtained === true).length
      const total = studyParticipants.length
      consentRates.push({
        study_id: study.id,
        study_title: study.title,
        total_participants: total,
        consent_obtained: consentObtained, // Fixed: use explicit property assignment
        consent_rate: total > 0 ? (consentObtained / total) * 100 : 0,
      })
    })

    // Overall statistics
    const totalStudies = studies.length
    const totalParticipants = participantsList.length
    const activeStudies = studies.filter((s) => ["active", "data_collection"].includes(s.status)).length
    const totalEnrolled = participantsList.filter((p) => p.enrollment_status === "enrolled").length
    const totalWithdrawn = participantsList.filter((p) => p.enrollment_status === "withdrawn").length
    const totalCompleted = participantsList.filter((p) => p.enrollment_status === "completed").length
    const overallConsentRate =
      totalParticipants > 0
        ? (participantsList.filter((p) => p.consent_obtained === true).length / totalParticipants) * 100
        : 0

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          total_studies: totalStudies,
          active_studies: activeStudies,
          total_participants: totalParticipants,
          total_enrolled: totalEnrolled,
          total_withdrawn: totalWithdrawn,
          total_completed: totalCompleted,
          overall_consent_rate: overallConsentRate,
        },
        enrollment_trends: enrollmentTrends,
        status_distribution: statusDistribution,
        enrollment_by_month: enrollmentByMonth,
        consent_rates: consentRates,
      },
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/research/analytics:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

