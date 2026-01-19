import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { 
  HealthEquityInitiative, 
  CreateInitiativeRequest, 
  InitiativeStatus,
  InitiativeType 
} from "@/lib/health-equity-types"

// GET - Fetch all health equity initiatives
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const status = searchParams.get("status") as InitiativeStatus | null
    const type = searchParams.get("type") as InitiativeType | null
    const targetDemographic = searchParams.get("target_demographic")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    
    // Build query
    let query = supabase
      .from("health_equity_initiatives")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
    
    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status)
    }
    
    if (type) {
      query = query.eq("initiative_type", type)
    }
    
    if (targetDemographic) {
      query = query.eq("target_demographic_value", targetDemographic)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data: initiatives, error, count } = await query
    
    if (error) {
      console.error("Error fetching initiatives:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    // Calculate summary stats
    const { data: allInitiatives } = await supabase
      .from("health_equity_initiatives")
      .select("status, participants_enrolled, budget_allocated, budget_spent")
    
    const summary = {
      total: allInitiatives?.length || 0,
      by_status: {
        planning: allInitiatives?.filter(i => i.status === "planning").length || 0,
        active: allInitiatives?.filter(i => i.status === "active").length || 0,
        paused: allInitiatives?.filter(i => i.status === "paused").length || 0,
        completed: allInitiatives?.filter(i => i.status === "completed").length || 0,
        cancelled: allInitiatives?.filter(i => i.status === "cancelled").length || 0,
      },
      total_participants: allInitiatives?.reduce((sum, i) => sum + (i.participants_enrolled || 0), 0) || 0,
      total_budget_allocated: allInitiatives?.reduce((sum, i) => sum + (parseFloat(i.budget_allocated) || 0), 0) || 0,
      total_budget_spent: allInitiatives?.reduce((sum, i) => sum + (parseFloat(i.budget_spent) || 0), 0) || 0,
    }
    
    return NextResponse.json({
      success: true,
      initiatives: initiatives || [],
      total: count || 0,
      page,
      limit,
      summary,
    })
    
  } catch (error) {
    console.error("Error in GET /api/research/health-equity/initiatives:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// POST - Create a new health equity initiative
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body: CreateInitiativeRequest = await request.json()
    
    // Validate required fields
    if (!body.title || !body.initiative_type || !body.start_date) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, initiative_type, and start_date are required",
        },
        { status: 400 }
      )
    }
    
    // Validate initiative type
    const validTypes: InitiativeType[] = [
      "intervention", "program", "policy", "outreach", "training", "partnership", "research"
    ]
    if (!validTypes.includes(body.initiative_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid initiative_type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      )
    }
    
    // Validate dates
    if (body.end_date && new Date(body.end_date) <= new Date(body.start_date)) {
      return NextResponse.json(
        {
          success: false,
          error: "End date must be after start date",
        },
        { status: 400 }
      )
    }
    
    // Calculate initial progress percentage
    let progressPercentage = 0
    if (body.baseline_value !== undefined && body.target_value !== undefined && body.baseline_value !== body.target_value) {
      progressPercentage = 0 // Starting at 0%
    }
    
    // Insert the new initiative
    const { data: newInitiative, error: insertError } = await supabase
      .from("health_equity_initiatives")
      .insert({
        title: body.title,
        description: body.description || null,
        initiative_type: body.initiative_type,
        target_demographic_type: body.target_demographic_type || null,
        target_demographic_value: body.target_demographic_value || null,
        target_disparity_metric_id: body.target_disparity_metric_id || null,
        start_date: body.start_date,
        end_date: body.end_date || null,
        status: "planning",
        baseline_value: body.baseline_value || null,
        target_value: body.target_value || null,
        current_progress: body.baseline_value || null,
        progress_percentage: progressPercentage,
        lead_contact: body.lead_contact || null,
        lead_email: body.lead_email || null,
        budget_allocated: body.budget_allocated || null,
        funding_source: body.funding_source || null,
        participants_enrolled: 0,
        participants_completed: 0,
      })
      .select()
      .single()
    
    if (insertError) {
      console.error("Error creating initiative:", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      initiative: newInitiative,
      message: "Health equity initiative created successfully",
    })
    
  } catch (error) {
    console.error("Error in POST /api/research/health-equity/initiatives:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// PATCH - Update an existing initiative
export async function PATCH(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Initiative ID is required" },
        { status: 400 }
      )
    }
    
    // Build update object (only include provided fields)
    const updateData: Partial<HealthEquityInitiative> = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.current_progress !== undefined) updateData.current_progress = body.current_progress
    if (body.participants_enrolled !== undefined) updateData.participants_enrolled = body.participants_enrolled
    if (body.participants_completed !== undefined) updateData.participants_completed = body.participants_completed
    if (body.outcome_summary !== undefined) updateData.outcome_summary = body.outcome_summary
    if (body.lessons_learned !== undefined) updateData.lessons_learned = body.lessons_learned
    if (body.budget_spent !== undefined) updateData.budget_spent = body.budget_spent
    if (body.lead_contact !== undefined) updateData.lead_contact = body.lead_contact
    if (body.lead_email !== undefined) updateData.lead_email = body.lead_email
    if (body.end_date !== undefined) updateData.end_date = body.end_date
    if (body.target_value !== undefined) updateData.target_value = body.target_value
    
    // Calculate progress percentage if we have the necessary values
    if (body.current_progress !== undefined || body.target_value !== undefined || body.baseline_value !== undefined) {
      // Get current initiative data
      const { data: currentInit } = await supabase
        .from("health_equity_initiatives")
        .select("baseline_value, target_value, current_progress")
        .eq("id", body.id)
        .single()
      
      if (currentInit) {
        const baseline = body.baseline_value ?? currentInit.baseline_value ?? 0
        const target = body.target_value ?? currentInit.target_value
        const current = body.current_progress ?? currentInit.current_progress ?? baseline
        
        if (target && target !== baseline) {
          const progress = ((current - baseline) / (target - baseline)) * 100
          updateData.progress_percentage = Math.min(100, Math.max(0, Math.round(progress * 10) / 10))
        }
      }
    }
    
    const { data: updatedInitiative, error: updateError } = await supabase
      .from("health_equity_initiatives")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single()
    
    if (updateError) {
      console.error("Error updating initiative:", updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      initiative: updatedInitiative,
      message: "Initiative updated successfully",
    })
    
  } catch (error) {
    console.error("Error in PATCH /api/research/health-equity/initiatives:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete an initiative
export async function DELETE(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Initiative ID is required" },
        { status: 400 }
      )
    }
    
    // Check if initiative exists
    const { data: existing } = await supabase
      .from("health_equity_initiatives")
      .select("id, status")
      .eq("id", id)
      .single()
    
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Initiative not found" },
        { status: 404 }
      )
    }
    
    // Soft delete by changing status, or hard delete if planning
    if (existing.status === "planning") {
      const { error: deleteError } = await supabase
        .from("health_equity_initiatives")
        .delete()
        .eq("id", id)
      
      if (deleteError) {
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: "Initiative deleted successfully",
      })
    } else {
      // For non-planning initiatives, mark as cancelled
      const { error: cancelError } = await supabase
        .from("health_equity_initiatives")
        .update({ status: "cancelled" })
        .eq("id", id)
      
      if (cancelError) {
        return NextResponse.json(
          { success: false, error: cancelError.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: "Initiative cancelled successfully",
      })
    }
    
  } catch (error) {
    console.error("Error in DELETE /api/research/health-equity/initiatives:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

