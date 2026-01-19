import { createServiceClient } from "@/lib/supabase/service-role"

export interface ResearchNotification {
  id: string
  type: "irb_expiring" | "irb_expired" | "enrollment_target" | "study_status" | "study_ending"
  severity: "info" | "warning" | "error"
  title: string
  message: string
  study_id: string
  study_title: string
  action_required: boolean
  created_at: string
}

/**
 * Check for research study notifications
 */
export async function checkResearchNotifications(): Promise<ResearchNotification[]> {
  try {
    const supabase = createServiceClient()
    const notifications: ResearchNotification[] = []
    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    // Get all active studies
    const { data: studies, error } = await supabase
      .from("research_studies")
      .select("*")
      .in("status", ["planning", "active", "data_collection"])

    if (error) {
      console.error("Error fetching studies for notifications:", error)
      return []
    }

    if (!studies || studies.length === 0) {
      return []
    }

    for (const study of studies) {
      // Check IRB expiration
      if (study.irb_expiration_date) {
        const expirationDate = new Date(study.irb_expiration_date)
        const daysUntilExpiration = Math.ceil(
          (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntilExpiration < 0) {
          // IRB expired
          notifications.push({
            id: `irb-expired-${study.id}`,
            type: "irb_expired",
            severity: "error",
            title: "IRB Approval Expired",
            message: `IRB approval for "${study.title}" expired on ${new Date(study.irb_expiration_date).toLocaleDateString()}. Study cannot enroll new participants.`,
            study_id: study.id,
            study_title: study.title,
            action_required: true,
            created_at: new Date().toISOString(),
          })
        } else if (daysUntilExpiration <= 30) {
          // IRB expiring soon
          notifications.push({
            id: `irb-expiring-${study.id}`,
            type: "irb_expiring",
            severity: "warning",
            title: "IRB Approval Expiring Soon",
            message: `IRB approval for "${study.title}" expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? "s" : ""} (${new Date(study.irb_expiration_date).toLocaleDateString()}).`,
            study_id: study.id,
            study_title: study.title,
            action_required: true,
            created_at: new Date().toISOString(),
          })
        }
      }

      // Check enrollment targets
      if (study.enrollment_target > 0) {
        const enrollmentPercentage = (study.current_enrollment / study.enrollment_target) * 100
        const remaining = study.enrollment_target - study.current_enrollment

        if (enrollmentPercentage >= 100) {
          notifications.push({
            id: `enrollment-full-${study.id}`,
            type: "enrollment_target",
            severity: "info",
            title: "Enrollment Target Reached",
            message: `"${study.title}" has reached its enrollment target (${study.current_enrollment}/${study.enrollment_target}).`,
            study_id: study.id,
            study_title: study.title,
            action_required: false,
            created_at: new Date().toISOString(),
          })
        } else if (enrollmentPercentage >= 90 && remaining <= 5) {
          notifications.push({
            id: `enrollment-90-${study.id}`,
            type: "enrollment_target",
            severity: "info",
            title: "Enrollment Near Target",
            message: `"${study.title}" is at ${enrollmentPercentage.toFixed(1)}% of enrollment target (${study.current_enrollment}/${study.enrollment_target}). ${remaining} spot${remaining !== 1 ? "s" : ""} remaining.`,
            study_id: study.id,
            study_title: study.title,
            action_required: false,
            created_at: new Date().toISOString(),
          })
        }
      }

      // Check study status transitions
      const startDate = new Date(study.start_date)
      const endDate = new Date(study.end_date)

      if (study.status === "planning" && today >= startDate) {
        notifications.push({
          id: `study-should-start-${study.id}`,
          type: "study_status",
          severity: "warning",
          title: "Study Should Be Activated",
          message: `"${study.title}" start date has passed (${new Date(study.start_date).toLocaleDateString()}). Consider updating status to "active".`,
          study_id: study.id,
          study_title: study.title,
          action_required: true,
          created_at: new Date().toISOString(),
        })
      }

      if (today >= endDate && !["completed", "cancelled"].includes(study.status)) {
        notifications.push({
          id: `study-should-end-${study.id}`,
          type: "study_ending",
          severity: "warning",
          title: "Study End Date Passed",
          message: `"${study.title}" end date has passed (${new Date(study.end_date).toLocaleDateString()}). Consider updating status to "completed" or "analysis".`,
          study_id: study.id,
          study_title: study.title,
          action_required: true,
          created_at: new Date().toISOString(),
        })
      }

      // Check if study ending soon (within 30 days)
      const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilEnd > 0 && daysUntilEnd <= 30 && !["completed", "cancelled"].includes(study.status)) {
        notifications.push({
          id: `study-ending-soon-${study.id}`,
          type: "study_ending",
          severity: "info",
          title: "Study Ending Soon",
          message: `"${study.title}" will end in ${daysUntilEnd} day${daysUntilEnd !== 1 ? "s" : ""} (${new Date(study.end_date).toLocaleDateString()}).`,
          study_id: study.id,
          study_title: study.title,
          action_required: false,
          created_at: new Date().toISOString(),
        })
      }
    }

    // Sort by severity (error > warning > info) and date
    notifications.sort((a, b) => {
      const severityOrder = { error: 3, warning: 2, info: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return notifications
  } catch (error) {
    console.error("Unexpected error in checkResearchNotifications:", error)
    return []
  }
}

