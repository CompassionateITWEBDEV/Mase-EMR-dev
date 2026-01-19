import { createServiceClient } from "@/lib/supabase/service-role"

export interface EBPNotification {
  id: string
  type: "low_fidelity" | "certification_expiring" | "certification_expired" | "no_fidelity_review" | "low_adoption"
  severity: "info" | "warning" | "error"
  title: string
  message: string
  ebp_id: string
  ebp_name: string
  action_required: boolean
  created_at: string
}

/**
 * Check for Evidence-Based Practice notifications
 */
export async function checkEBPNotifications(): Promise<EBPNotification[]> {
  try {
    const supabase = createServiceClient()
    const notifications: EBPNotification[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    const ninetyDaysAgo = new Date(today)
    ninetyDaysAgo.setDate(today.getDate() - 90)

    // Get all active EBPs
    const { data: ebps, error } = await supabase
      .from("evidence_based_practices")
      .select("*")
      .eq("is_active", true)

    if (error) {
      console.error("Error fetching EBPs for notifications:", error)
      return []
    }

    if (!ebps || ebps.length === 0) {
      return []
    }

    for (const ebp of ebps) {
      // Check for low fidelity score (< 70%)
      if (ebp.fidelity_score !== null && ebp.fidelity_score < 70) {
        notifications.push({
          id: `low-fidelity-${ebp.id}`,
          type: "low_fidelity",
          severity: "warning",
          title: "Low Fidelity Score",
          message: `"${ebp.name}" has a fidelity score of ${ebp.fidelity_score.toFixed(1)}%, which is below the recommended threshold of 70%. Consider conducting a fidelity assessment.`,
          ebp_id: ebp.id,
          ebp_name: ebp.name,
          action_required: true,
          created_at: new Date().toISOString(),
        })
      }

      // Check for no fidelity review in the last 90 days
      if (!ebp.last_fidelity_review || new Date(ebp.last_fidelity_review) < ninetyDaysAgo) {
        notifications.push({
          id: `no-fidelity-review-${ebp.id}`,
          type: "no_fidelity_review",
          severity: "warning",
          title: "Fidelity Review Overdue",
          message: `"${ebp.name}" has not had a fidelity assessment in the last 90 days. Regular fidelity reviews are recommended for maintaining quality.`,
          ebp_id: ebp.id,
          ebp_name: ebp.name,
          action_required: true,
          created_at: new Date().toISOString(),
        })
      }

      // Check for low adoption rate (< 50%)
      if (ebp.adoption_rate !== null && ebp.adoption_rate < 50 && ebp.total_staff > 0) {
        notifications.push({
          id: `low-adoption-${ebp.id}`,
          type: "low_adoption",
          severity: "info",
          title: "Low Adoption Rate",
          message: `"${ebp.name}" has an adoption rate of ${ebp.adoption_rate.toFixed(1)}% (${ebp.trained_staff}/${ebp.total_staff} staff trained). Consider additional staff training.`,
          ebp_id: ebp.id,
          ebp_name: ebp.name,
          action_required: false,
          created_at: new Date().toISOString(),
        })
      }

      // Check for expiring certifications
      const { data: staffAssignments, error: staffError } = await supabase
        .from("ebp_staff_assignments")
        .select("id, certification_expires_date, staff_id")
        .eq("ebp_id", ebp.id)
        .in("status", ["certified", "trained"])
        .not("certification_expires_date", "is", null)

      if (!staffError && staffAssignments) {
        for (const assignment of staffAssignments) {
          if (assignment.certification_expires_date) {
            const expirationDate = new Date(assignment.certification_expires_date)
            expirationDate.setHours(0, 0, 0, 0)
            const daysUntilExpiration = Math.ceil(
              (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )

            if (daysUntilExpiration < 0) {
              // Certification expired
              notifications.push({
                id: `cert-expired-${ebp.id}-${assignment.id}`,
                type: "certification_expired",
                severity: "error",
                title: "Staff Certification Expired",
                message: `A staff member's certification for "${ebp.name}" expired on ${new Date(assignment.certification_expires_date).toLocaleDateString()}. Recertification is required.`,
                ebp_id: ebp.id,
                ebp_name: ebp.name,
                action_required: true,
                created_at: new Date().toISOString(),
              })
            } else if (daysUntilExpiration <= 30) {
              // Certification expiring soon
              notifications.push({
                id: `cert-expiring-${ebp.id}-${assignment.id}`,
                type: "certification_expiring",
                severity: "warning",
                title: "Staff Certification Expiring Soon",
                message: `A staff member's certification for "${ebp.name}" expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? "s" : ""} (${new Date(assignment.certification_expires_date).toLocaleDateString()}). Plan for recertification.`,
                ebp_id: ebp.id,
                ebp_name: ebp.name,
                action_required: true,
                created_at: new Date().toISOString(),
              })
            }
          }
        }
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
    console.error("Unexpected error in checkEBPNotifications:", error)
    return []
  }
}

