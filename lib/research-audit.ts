import { createServiceClient } from "@/lib/supabase/service-role"

interface AuditLogEntry {
  study_id?: string
  participant_id?: string
  action: "created" | "updated" | "deleted" | "status_changed" | "enrolled" | "withdrawn" | "completed"
  entity_type: "study" | "participant"
  changed_by?: string | null
  old_values?: any
  new_values?: any
  change_description?: string
}

/**
 * Log an audit trail entry for research study changes
 */
export async function logResearchAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServiceClient()
    
    const { error } = await supabase
      .from("research_study_audit_log")
      .insert({
        study_id: entry.study_id || null,
        participant_id: entry.participant_id || null,
        action: entry.action,
        entity_type: entry.entity_type,
        changed_by: entry.changed_by || null,
        old_values: entry.old_values || null,
        new_values: entry.new_values || null,
        change_description: entry.change_description || null,
      })

    if (error) {
      console.error("Error logging audit trail:", error)
      // Don't throw - audit logging should not break the main operation
    }
  } catch (error) {
    console.error("Unexpected error in logResearchAudit:", error)
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Get audit trail for a study
 */
export async function getStudyAuditTrail(studyId: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("research_study_audit_log")
      .select("*")
      .eq("study_id", studyId)
      .order("changed_at", { ascending: false })

    if (error) {
      console.error("Error fetching audit trail:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error in getStudyAuditTrail:", error)
    return []
  }
}

/**
 * Get audit trail for a participant
 */
export async function getParticipantAuditTrail(participantId: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("research_study_audit_log")
      .select("*")
      .eq("participant_id", participantId)
      .order("changed_at", { ascending: false })

    if (error) {
      console.error("Error fetching participant audit trail:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error in getParticipantAuditTrail:", error)
    return []
  }
}

