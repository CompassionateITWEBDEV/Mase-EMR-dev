import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { logResearchAudit } from "@/lib/research-audit"
import { createClient as createAuthClient } from "@/lib/supabase/server"

// Helper function to create Supabase service client
function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// GET - Get a single research study by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const studyId = params.id

    if (!studyId) {
      return NextResponse.json({ error: "Study ID is required" }, { status: 400 })
    }

    // Get study
    const { data: study, error } = await supabase
      .from("research_studies")
      .select("*")
      .eq("id", studyId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Study not found" }, { status: 404 })
      }
      console.error("Error fetching research study:", error)
      
      // Check if table doesn't exist
      if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Database table not found",
            message: "The research_studies table has not been created. Please run the database migration script: scripts/create_research_studies_tables.sql",
            code: "TABLE_NOT_FOUND",
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get participant count
    const { count: participantCount } = await supabase
      .from("research_study_participants")
      .select("*", { count: "exact", head: true })
      .eq("study_id", studyId)
      .eq("enrollment_status", "enrolled")

    return NextResponse.json({
      success: true,
      study: {
        ...study,
        current_enrollment: participantCount || 0,
      },
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/research/studies/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// PATCH - Update a research study
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const studyId = params.id
    const body = await request.json()

    if (!studyId) {
      return NextResponse.json({ error: "Study ID is required" }, { status: 400 })
    }

    // Get current user from auth session
    let currentUserId: string | null = null
    try {
      const authClient = await createAuthClient()
      const { data: { user }, error: authError } = await authClient.auth.getUser()
      if (!authError && user) {
        currentUserId = user.id
      }
    } catch (authErr) {
      console.warn("Could not get user from auth session:", authErr)
    }

    // Check if study exists
    const { data: existingStudy, error: fetchError } = await supabase
      .from("research_studies")
      .select("*")
      .eq("id", studyId)
      .single()

    if (fetchError || !existingStudy) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 })
    }

    // Helper function to get UTC date string (YYYY-MM-DD) for consistent date comparisons
    function getUTCDateString(date?: Date): string {
      const d = date || new Date()
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // Validate dates if provided
    if (body.start_date || body.end_date) {
      const startDate = body.start_date ? new Date(body.start_date) : new Date(existingStudy.start_date)
      const endDate = body.end_date ? new Date(body.end_date) : new Date(existingStudy.end_date)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
      }
      if (endDate < startDate) {
        return NextResponse.json({ error: "End date must be after start date" }, { status: 400 })
      }
    }

    // Auto-adjust status based on date changes
    const todayUTC = getUTCDateString()
    const newStartDate = body.start_date ? getUTCDateString(new Date(body.start_date)) : existingStudy.start_date
    const newEndDate = body.end_date ? getUTCDateString(new Date(body.end_date)) : existingStudy.end_date
    const currentStatus = body.status !== undefined ? body.status : existingStudy.status

    // If start date is moved to the future, revert status to "planning" if currently active/data_collection
    if (body.start_date && newStartDate > todayUTC) {
      if (["active", "data_collection"].includes(currentStatus)) {
        // Don't override if user explicitly set status, but auto-adjust if status wasn't explicitly changed
        if (body.status === undefined) {
          // Status will be automatically adjusted to "planning"
          // We'll handle this in the updateData below
        }
      }
    }

    // If end date is moved to the future and study is in "analysis" or "completed", consider reverting
    // But only if start date hasn't passed (study should be active/data_collection)
    if (body.end_date && newEndDate > todayUTC && newStartDate <= todayUTC) {
      if (["analysis", "completed"].includes(currentStatus)) {
        // If end date is moved to future and start date has passed, study should be active/data_collection
        if (body.status === undefined) {
          // Status will be automatically adjusted
        }
      }
    }

    // Validate enrollment target if provided
    if (body.enrollment_target !== undefined) {
      if (body.enrollment_target <= 0) {
        return NextResponse.json({ error: "Enrollment target must be greater than 0" }, { status: 400 })
      }
      // Check if current enrollment exceeds new target
      if (existingStudy.current_enrollment > body.enrollment_target) {
        return NextResponse.json(
          { error: "Enrollment target cannot be less than current enrollment" },
          { status: 400 }
        )
      }
    }

    // Validate study type if provided
    if (body.study_type) {
      const validStudyTypes = ["implementation", "pilot", "quality_improvement", "outcomes", "equity"]
      if (!validStudyTypes.includes(body.study_type)) {
        return NextResponse.json({ error: "Invalid study type" }, { status: 400 })
      }
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ["planning", "active", "data_collection", "analysis", "completed", "cancelled"]
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.study_type !== undefined) updateData.study_type = body.study_type
    if (body.pi_name !== undefined) updateData.pi_name = body.pi_name.trim()
    if (body.pi_email !== undefined) updateData.pi_email = body.pi_email?.trim() || null
    if (body.pi_phone !== undefined) updateData.pi_phone = body.pi_phone?.trim() || null
    if (body.start_date !== undefined) updateData.start_date = body.start_date
    if (body.end_date !== undefined) updateData.end_date = body.end_date
    if (body.enrollment_target !== undefined) updateData.enrollment_target = parseInt(body.enrollment_target)
    
    // Auto-adjust status based on date changes (only if status wasn't explicitly set by user)
    if (body.status === undefined) {
      // Check if start date was moved to future
      if (body.start_date && newStartDate > todayUTC) {
        // If study is currently active/data_collection, revert to planning
        if (["active", "data_collection"].includes(existingStudy.status)) {
          updateData.status = "planning"
        }
      }
      // Check if end date was moved to future and start date has passed
      else if (body.end_date && newEndDate > todayUTC && newStartDate <= todayUTC) {
        // If study is in analysis/completed but dates suggest it should be active
        if (["analysis", "completed"].includes(existingStudy.status) && newStartDate <= todayUTC) {
          // Determine appropriate status: if start date passed, should be active or data_collection
          // Keep current status if it's data_collection, otherwise set to active
          if (existingStudy.status === "data_collection") {
            // Keep as data_collection
          } else {
            updateData.status = "active"
          }
        }
      }
      // If start date is in the past and study is planning, should be active
      else if (body.start_date && newStartDate <= todayUTC && existingStudy.status === "planning") {
        updateData.status = "active"
      }
      // If end date is in the past and study is active/data_collection, should be analysis
      else if (body.end_date && newEndDate < todayUTC && ["active", "data_collection"].includes(existingStudy.status)) {
        updateData.status = "analysis"
      }
    } else {
      // User explicitly set status, use their value
      updateData.status = body.status
    }
    // ============================================================================
    // PHASE 1 & 2: Smart IRB Approval Date and Status Connection Logic
    // ============================================================================
    
    // Use existing todayUTC variable (already declared above)
    
    // Phase 2: Validate dates first
    // Allow future dates only if status is explicitly set to non-approved (pending, rejected, etc.)
    // This allows users to plan ahead or revert approved studies back to pending with future dates
    if (body.irb_approval_date !== undefined && body.irb_approval_date) {
      const approvalDate = getUTCDateString(new Date(body.irb_approval_date))
      const targetStatus = body.irb_status !== undefined ? body.irb_status : existingStudy.irb_status
      
      // Only block future dates if status is "approved" or will be auto-set to "approved"
      // If user explicitly sets status to pending/rejected/etc., allow future dates
      if (approvalDate > todayUTC) {
        // Check if status will be auto-set to approved (pending + future date = will auto-set)
        const willAutoSetToApproved = existingStudy.irb_status === "pending" && 
                                       body.irb_status === undefined &&
                                       approvalDate <= todayUTC // This won't happen if date is future
        
        // Block future dates only if:
        // 1. Status is explicitly "approved" (user can't set approved with future date)
        // 2. Status will be auto-set to approved (but this won't happen with future date)
        // Allow future dates if status is explicitly set to pending/rejected/etc.
        if (targetStatus === "approved" || (willAutoSetToApproved && approvalDate <= todayUTC)) {
          return NextResponse.json(
            { error: "IRB approval date cannot be in the future when status is 'approved'" },
            { status: 400 }
          )
        }
        // If status is pending/rejected/etc., allow future date (for planning purposes)
      }
    }
    
    // Validate expiration_date is after approval_date
    const approvalDateToCheck = body.irb_approval_date || existingStudy.irb_approval_date
    const expirationDateToCheck = body.irb_expiration_date || existingStudy.irb_expiration_date
    
    if (approvalDateToCheck && expirationDateToCheck) {
      const approvalDate = getUTCDateString(new Date(approvalDateToCheck))
      const expirationDate = getUTCDateString(new Date(expirationDateToCheck))
      
      if (expirationDate <= approvalDate) {
        return NextResponse.json(
          { error: "IRB expiration date must be after approval date" },
          { status: 400 }
        )
      }
    }
    
    // Phase 1: Smart connection logic
    let irbStatusToSet: string | undefined = undefined
    let irbApprovalDateToSet: string | null | undefined = undefined
    
    // Case 1: Approval date is being set
    if (body.irb_approval_date !== undefined) {
      if (body.irb_approval_date && body.irb_approval_date.trim() !== "") {
        const approvalDate = getUTCDateString(new Date(body.irb_approval_date))
        const isFutureDate = approvalDate > todayUTC
        
        // Approval date is being set → auto-set status to "approved" (if currently pending AND date is not in future)
        // Only auto-set to approved if:
        // 1. Current status is pending
        // 2. User didn't explicitly set status
        // 3. Approval date is NOT in the future (can't approve with future date)
        if (existingStudy.irb_status === "pending" && 
            body.irb_status === undefined && 
            !isFutureDate) {
          irbStatusToSet = "approved"
        } else if (body.irb_status === "pending") {
          // User explicitly set to pending - respect their choice, even with approval date
          // This allows: approved → pending with future date (planning scenario)
          irbStatusToSet = "pending"
        } else if (isFutureDate && body.irb_status === undefined) {
          // Future date but no explicit status - keep current status (don't auto-set to approved)
          // This handles: user changes approved → pending, then sets future date
          // Don't change status, just update the date
        }
        irbApprovalDateToSet = body.irb_approval_date
      } else {
        // Approval date is being cleared → auto-set status to "pending" (if currently approved)
        if (existingStudy.irb_status === "approved" && body.irb_status === undefined) {
          irbStatusToSet = "pending"
        }
        irbApprovalDateToSet = null
      }
    }
    
    // Case 2: Status is being set to "approved" → require approval_date
    if (body.irb_status === "approved") {
      const approvalDate = body.irb_approval_date !== undefined 
        ? body.irb_approval_date 
        : existingStudy.irb_approval_date
      
      if (!approvalDate || approvalDate.trim() === "") {
        return NextResponse.json(
          { 
            error: "IRB approval date is required when status is 'approved'",
            field: "irb_approval_date"
          },
          { status: 400 }
        )
      }
      irbStatusToSet = "approved"
    }
    
    // Case 3: Status is being changed but approval_date exists
    // Preserve approval_date (don't delete) when status changes
    if (body.irb_status !== undefined && body.irb_status !== "approved") {
      // If status is being changed away from approved, keep the approval_date for historical record
      // Only set status, don't touch approval_date
      irbStatusToSet = body.irb_status
      // Don't modify approval_date - preserve it
    }
    
    // Apply the determined values
    if (irbStatusToSet !== undefined) {
      updateData.irb_status = irbStatusToSet
    } else if (body.irb_status !== undefined) {
      updateData.irb_status = body.irb_status
    }
    
    if (irbApprovalDateToSet !== undefined) {
      updateData.irb_approval_date = irbApprovalDateToSet
    } else if (body.irb_approval_date !== undefined) {
      updateData.irb_approval_date = body.irb_approval_date || null
    }
    
    // Handle other IRB fields
    if (body.irb_number !== undefined) updateData.irb_number = body.irb_number?.trim() || null
    if (body.irb_expiration_date !== undefined) updateData.irb_expiration_date = body.irb_expiration_date || null
    if (body.funding_source !== undefined) updateData.funding_source = body.funding_source?.trim() || null
    if (body.funding_amount !== undefined) updateData.funding_amount = body.funding_amount ? parseFloat(body.funding_amount) : null
    if (body.grant_number !== undefined) updateData.grant_number = body.grant_number?.trim() || null
    if (body.updated_by !== undefined) updateData.updated_by = body.updated_by

    // Update study
    const { data, error } = await supabase
      .from("research_studies")
      .update(updateData)
      .eq("id", studyId)
      .select()
      .single()

    if (error) {
      console.error("Error updating research study:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit trail
    const changedFields: string[] = []
    Object.keys(updateData).forEach((key) => {
      if (key !== "updated_at" && existingStudy[key] !== updateData[key]) {
        changedFields.push(key)
      }
    })

    if (changedFields.length > 0) {
      // Determine if status changed
      const action = changedFields.includes("status") ? "status_changed" : "updated"
      
      // Check if status was auto-adjusted due to date changes
      const statusAutoAdjusted = changedFields.includes("status") && 
        body.status === undefined && 
        (body.start_date !== undefined || body.end_date !== undefined)
      
      let changeDescription = `Updated fields: ${changedFields.join(", ")}`
      if (statusAutoAdjusted) {
        changeDescription += ` (Status automatically adjusted based on date changes)`
      }
      
      await logResearchAudit({
        study_id: studyId,
        action: action as any,
        entity_type: "study",
        changed_by: currentUserId || null,
        old_values: existingStudy,
        new_values: data,
        change_description: changeDescription,
      })
    }

    return NextResponse.json({
      success: true,
      study: data,
      message: "Research study updated successfully",
    })
  } catch (error) {
    console.error("Unexpected error in PATCH /api/research/studies/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a research study
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const studyId = params.id

    if (!studyId) {
      return NextResponse.json({ error: "Study ID is required" }, { status: 400 })
    }

    // Check if study exists
    const { data: existingStudy, error: fetchError } = await supabase
      .from("research_studies")
      .select("*")
      .eq("id", studyId)
      .single()

    if (fetchError || !existingStudy) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 })
    }

    // Check if study has enrolled participants
    const { count: participantCount } = await supabase
      .from("research_study_participants")
      .select("*", { count: "exact", head: true })
      .eq("study_id", studyId)
      .eq("enrollment_status", "enrolled")

    if (participantCount && participantCount > 0) {
      // Option 1: Soft delete (recommended)
      const { data, error } = await supabase
        .from("research_studies")
        .update({ status: "cancelled" })
        .eq("id", studyId)
        .select()
        .single()

      if (error) {
        console.error("Error cancelling research study:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        study: data,
        message: "Research study cancelled (has enrolled participants)",
      })
    }

    // Get current user from auth session
    let currentUserId: string | null = null
    try {
      const authClient = await createAuthClient()
      const { data: { user }, error: authError } = await authClient.auth.getUser()
      if (!authError && user) {
        currentUserId = user.id
      }
    } catch (authErr) {
      console.warn("Could not get user from auth session:", authErr)
    }

    // Option 2: Hard delete (only if no participants)
    const { error } = await supabase.from("research_studies").delete().eq("id", studyId)

    if (error) {
      console.error("Error deleting research study:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit trail
    await logResearchAudit({
      study_id: studyId,
      action: "deleted",
      entity_type: "study",
      changed_by: currentUserId || null,
      old_values: existingStudy,
      change_description: `Study "${existingStudy.title}" deleted`,
    })

    return NextResponse.json({
      success: true,
      message: "Research study deleted successfully",
    })
  } catch (error) {
    console.error("Unexpected error in DELETE /api/research/studies/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

