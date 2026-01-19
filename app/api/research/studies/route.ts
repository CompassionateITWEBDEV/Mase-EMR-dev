import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { logResearchAudit } from "@/lib/research-audit"
import { createClient } from "@/lib/supabase/server"

// GET - List all research studies with search and filtering
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const type = searchParams.get("type") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const organizationId = searchParams.get("organization_id")

    // Build query
    let query = supabase
      .from("research_studies")
      .select("*", { count: "exact" })

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }

    // Search filter (title, description, pi_name)
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,pi_name.ilike.%${search}%`
      )
    }

    // Status filter
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Type filter
    if (type && type !== "all") {
      query = query.eq("study_type", type)
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false })

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching research studies:", error)
      
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

    // Get participant counts for each study
    const studiesWithCounts = await Promise.all(
      (data || []).map(async (study) => {
        const { count: participantCount } = await supabase
          .from("research_study_participants")
          .select("*", { count: "exact", head: true })
          .eq("study_id", study.id)
          .eq("enrollment_status", "enrolled")

        return {
          ...study,
          current_enrollment: participantCount || 0,
        }
      })
    )

    return NextResponse.json({
      success: true,
      studies: studiesWithCounts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/research/studies:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST - Create a new research study
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    // Validation
    const requiredFields = ["title", "study_type", "pi_name", "start_date", "end_date", "enrollment_target"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate dates
    const startDate = new Date(body.start_date)
    const endDate = new Date(body.end_date)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }
    if (endDate < startDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 })
    }

    // Validate enrollment target
    if (body.enrollment_target <= 0) {
      return NextResponse.json({ error: "Enrollment target must be greater than 0" }, { status: 400 })
    }

    // Validate study type
    const validStudyTypes = ["implementation", "pilot", "quality_improvement", "outcomes", "equity"]
    if (!validStudyTypes.includes(body.study_type)) {
      return NextResponse.json({ error: "Invalid study type" }, { status: 400 })
    }

    // Validate status
    const validStatuses = ["planning", "active", "data_collection", "analysis", "completed", "cancelled"]
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // ============================================================================
    // PHASE 1 & 2: Smart IRB Approval Date and Status Connection Logic
    // ============================================================================
    
    // Helper to get UTC date string for comparison
    function getUTCDateString(date?: Date): string {
      const d = date || new Date()
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const todayUTC = getUTCDateString()
    
    // Phase 2: Validate dates
    // Allow future dates only if status is explicitly set to non-approved (pending, rejected, etc.)
    if (body.irb_approval_date) {
      const approvalDate = getUTCDateString(new Date(body.irb_approval_date))
      const targetStatus = body.irb_status || "pending"
      
      // Only block future dates if status is "approved"
      // Allow future dates for pending/rejected/etc. (for planning purposes)
      if (approvalDate > todayUTC && targetStatus === "approved") {
        return NextResponse.json(
          { error: "IRB approval date cannot be in the future when status is 'approved'" },
          { status: 400 }
        )
      }
    }
    
    // Validate expiration_date is after approval_date
    if (body.irb_approval_date && body.irb_expiration_date) {
      const approvalDate = getUTCDateString(new Date(body.irb_approval_date))
      const expirationDate = getUTCDateString(new Date(body.irb_expiration_date))
      
      if (expirationDate <= approvalDate) {
        return NextResponse.json(
          { error: "IRB expiration date must be after approval date" },
          { status: 400 }
        )
      }
    }
    
    // Phase 1: Smart connection logic
    let irbStatus = body.irb_status || "pending"
    let irbApprovalDate = body.irb_approval_date || null
    
    // Case 1: Approval date is provided → auto-set status to "approved" (if pending AND date is not in future)
    if (irbApprovalDate && irbApprovalDate.trim() !== "") {
      const approvalDate = getUTCDateString(new Date(irbApprovalDate))
      const isFutureDate = approvalDate > todayUTC
      
      // Only auto-set to approved if:
      // 1. Status is pending (or not explicitly set)
      // 2. Approval date is NOT in the future (can't approve with future date)
      if ((irbStatus === "pending" || !body.irb_status) && !isFutureDate) {
        irbStatus = "approved"
      }
      // If future date, keep status as pending (for planning purposes)
    }
    
    // Case 2: Status is set to "approved" → require approval_date
    if (irbStatus === "approved" && (!irbApprovalDate || irbApprovalDate.trim() === "")) {
      return NextResponse.json(
        { 
          error: "IRB approval date is required when status is 'approved'",
          field: "irb_approval_date"
        },
        { status: 400 }
      )
    }

    // Prepare study data
    const studyData = {
      organization_id: body.organization_id || null, // Will be set from auth in production
      title: body.title.trim(),
      description: body.description?.trim() || null,
      study_type: body.study_type,
      pi_name: body.pi_name.trim(),
      pi_email: body.pi_email?.trim() || null,
      pi_phone: body.pi_phone?.trim() || null,
      start_date: body.start_date,
      end_date: body.end_date,
      enrollment_target: parseInt(body.enrollment_target),
      current_enrollment: 0,
      status: body.status || "planning",
      irb_status: irbStatus,
      irb_number: body.irb_number?.trim() || null,
      irb_approval_date: irbApprovalDate,
      irb_expiration_date: body.irb_expiration_date || null,
      funding_source: body.funding_source?.trim() || null,
      funding_amount: body.funding_amount ? parseFloat(body.funding_amount) : null,
      grant_number: body.grant_number?.trim() || null,
      created_by: body.created_by || null, // Will be set from auth in production
    }

    // Get current user from auth session
    let currentUserId: string | null = null
    try {
      const authClient = await createClient()
      const { data: { user }, error: authError } = await authClient.auth.getUser()
      if (!authError && user) {
        currentUserId = user.id
      }
    } catch (authErr) {
      console.warn("Could not get user from auth session:", authErr)
    }

    // Insert study
    const { data, error } = await supabase.from("research_studies").insert(studyData).select().single()

    if (error) {
      console.error("Error creating research study:", error)
      
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

    // Log audit trail
    await logResearchAudit({
      study_id: data.id,
      action: "created",
      entity_type: "study",
      changed_by: currentUserId || null,
      new_values: data,
      change_description: `Study "${data.title}" created`,
    })

    return NextResponse.json(
      {
        success: true,
        study: data,
        message: "Research study created successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Unexpected error in POST /api/research/studies:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

