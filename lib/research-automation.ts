import { createServiceClient } from "@/lib/supabase/service-role"
import { logResearchAudit } from "@/lib/research-audit"

/**
 * Automatically update study statuses and IRB statuses based on dates
 * This should be called periodically (e.g., daily via cron job)
 * 
 * Status transitions:
 * - planning → active: When start_date passes AND irb_status is "approved"
 * - active/data_collection → analysis: When end_date passes
 * - active/data_collection → planning: When start_date moved to future
 * - approved → expired: When irb_expiration_date passes
 * 
 * Note: Studies in "analysis" or "completed" will NOT auto-revert to "active"
 * to prevent unexpected status changes when dates are edited.
 */
export async function automateStudyStatuses(): Promise<{
  updated: number
  changes: Array<{ study_id: string; old_status: string; new_status: string }>
  irb_updated: number
  irb_changes: Array<{ study_id: string; old_irb_status: string; new_irb_status: string }>
  skipped: number
  skipped_reasons: Array<{ study_id: string; reason: string }>
}> {
  try {
    const supabase = createServiceClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const changes: Array<{ study_id: string; old_status: string; new_status: string }> = []
    const irbChanges: Array<{ study_id: string; old_irb_status: string; new_irb_status: string }> = []
    const skippedReasons: Array<{ study_id: string; reason: string }> = []

    // Get all studies that might need status updates (including all statuses for IRB checks)
    const { data: studies, error } = await supabase
      .from("research_studies")
      .select("*")

    if (error) {
      console.error("Error fetching studies for automation:", error)
      return { updated: 0, changes: [], irb_updated: 0, irb_changes: [] }
    }

    if (!studies || studies.length === 0) {
      return { updated: 0, changes: [], irb_updated: 0, irb_changes: [] }
    }

    for (const study of studies) {
      const startDate = new Date(study.start_date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(study.end_date)
      endDate.setHours(0, 0, 0, 0)

      let newStatus: string | null = null
      let newIrbStatus: string | null = null

      // Check study status changes (only for planning, active, data_collection)
      if (["planning", "active", "data_collection"].includes(study.status)) {
        // Active/Data Collection -> Planning: Start date is in the future (study hasn't started yet)
        // This handles cases where start date was moved to future after study was already active
        if (
          ["active", "data_collection"].includes(study.status) &&
          today < startDate
        ) {
          newStatus = "planning"
          console.log(`[Automation] Study ${study.id}: Active -> Planning (start_date ${study.start_date} is in future)`)
        }
        // Planning -> Active: Start date has passed or is today
        // IMPORTANT: IRB must be approved before study can become active (regulatory requirement)
        else if (study.status === "planning" && today >= startDate) {
          if (study.irb_status === "approved") {
            newStatus = "active"
            console.log(`[Automation] Study ${study.id}: Planning -> Active (start_date ${study.start_date} has passed, IRB approved)`)
          } else {
            // Skip this study - cannot activate without IRB approval
            console.log(`[Automation] Study ${study.id}: Skipped Planning -> Active (IRB status is "${study.irb_status}", not "approved")`)
            skippedReasons.push({
              study_id: study.id,
              reason: `Cannot activate study: IRB status is "${study.irb_status}" (must be "approved")`
            })
          }
        }
        // Active/Data Collection -> Analysis: End date has passed
        else if (
          ["active", "data_collection"].includes(study.status) &&
          today > endDate
        ) {
          newStatus = "analysis"
          console.log(`[Automation] Study ${study.id}: Active -> Analysis (end_date ${study.end_date} has passed)`)
        }
      }
      
      // Note: Studies in "analysis" or "completed" will NOT auto-revert to "active"
      // even if dates are edited. This prevents unexpected status changes.
      // If dates need to be changed, users should manually update the status.

      // Check IRB status expiration (for all studies with IRB expiration date)
      if (study.irb_expiration_date) {
        const expirationDate = new Date(study.irb_expiration_date)
        expirationDate.setHours(0, 0, 0, 0)

        // If IRB expiration date has passed and status is "approved", change to "expired"
        if (today > expirationDate && study.irb_status === "approved") {
          newIrbStatus = "expired"
        }
      }

      // Update study status if needed
      if (newStatus && newStatus !== study.status) {
        const updateData: any = {
          status: newStatus,
          updated_at: new Date().toISOString(),
        }

        // If we also need to update IRB status, include it in the same update
        if (newIrbStatus) {
          updateData.irb_status = newIrbStatus
        }

        const { data: updatedStudy, error: updateError } = await supabase
          .from("research_studies")
          .update(updateData)
          .eq("id", study.id)
          .select()
          .single()

        if (updateError) {
          console.error(`Error updating study ${study.id}:`, updateError)
          continue
        }

        // Log audit trail for status change
        await logResearchAudit({
          study_id: study.id,
          action: "status_changed",
          entity_type: "study",
          changed_by: null, // System automated change
          old_values: study,
          new_values: updatedStudy,
          change_description: `Status automatically changed from ${study.status} to ${newStatus} based on study dates`,
        })

        changes.push({
          study_id: study.id,
          old_status: study.status,
          new_status: newStatus,
        })

        // If IRB status was also updated, log it separately
        if (newIrbStatus) {
          await logResearchAudit({
            study_id: study.id,
            action: "status_changed",
            entity_type: "study",
            changed_by: null, // System automated change
            old_values: { irb_status: study.irb_status },
            new_values: { irb_status: newIrbStatus },
            change_description: `IRB status automatically changed from ${study.irb_status} to ${newIrbStatus} because IRB expiration date (${study.irb_expiration_date}) has passed`,
          })

          irbChanges.push({
            study_id: study.id,
            old_irb_status: study.irb_status,
            new_irb_status: newIrbStatus,
          })
        }
      }
      // Update IRB status only (if study status didn't change)
      else if (newIrbStatus && newIrbStatus !== study.irb_status) {
        const { data: updatedStudy, error: updateError } = await supabase
          .from("research_studies")
          .update({
            irb_status: newIrbStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", study.id)
          .select()
          .single()

        if (updateError) {
          console.error(`Error updating IRB status for study ${study.id}:`, updateError)
          continue
        }

        // Log audit trail for IRB status change
        await logResearchAudit({
          study_id: study.id,
          action: "status_changed",
          entity_type: "study",
          changed_by: null, // System automated change
          old_values: { irb_status: study.irb_status },
          new_values: { irb_status: newIrbStatus },
          change_description: `IRB status automatically changed from ${study.irb_status} to ${newIrbStatus} because IRB expiration date (${study.irb_expiration_date}) has passed`,
        })

        irbChanges.push({
          study_id: study.id,
          old_irb_status: study.irb_status,
          new_irb_status: newIrbStatus,
        })
      }
    }

    return {
      updated: changes.length,
      changes,
      irb_updated: irbChanges.length,
      irb_changes: irbChanges,
      skipped: skippedReasons.length,
      skipped_reasons: skippedReasons,
    }
  } catch (error) {
    console.error("Unexpected error in automateStudyStatuses:", error)
    return { updated: 0, changes: [], irb_updated: 0, irb_changes: [], skipped: 0, skipped_reasons: [] }
  }
}

