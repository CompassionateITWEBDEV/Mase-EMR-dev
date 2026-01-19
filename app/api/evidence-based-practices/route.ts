import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET - List all evidence-based practices with search and filtering
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const organizationId = searchParams.get("organization_id")

    // Build query
    let query = supabase
      .from("evidence_based_practices")
      .select("*", { count: "exact" })
      .eq("is_active", true)

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }

    // Search filter (name, description)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Category filter
    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false })

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching evidence-based practices:", error)
      
      // Check if table doesn't exist
      if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Database table not found",
            message: "The evidence_based_practices table has not been created. Please run the database migration script: scripts/create_evidence_based_practices_tables.sql",
            code: "TABLE_NOT_FOUND",
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // For each EBP, calculate additional metrics
    const ebpsWithMetrics = await Promise.all(
      (data || []).map(async (ebp) => {
        // Get latest fidelity assessment
        let latestFidelity = null
        try {
          const { data: fidelityData, error: fidelityError } = await supabase
            .from("ebp_fidelity_assessments")
            .select("assessment_date, fidelity_score")
            .eq("ebp_id", ebp.id)
            .order("assessment_date", { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (!fidelityError && fidelityData) {
            latestFidelity = fidelityData
          }
        } catch (err) {
          // Silently continue if table doesn't exist or query fails
          console.warn(`Error fetching fidelity for EBP ${ebp.id}:`, err)
        }

        // Get trained staff count
        let trainedCount = 0
        try {
          const { count, error: staffError } = await supabase
            .from("ebp_staff_assignments")
            .select("*", { count: "exact", head: true })
            .eq("ebp_id", ebp.id)
            .in("status", ["trained", "certified"])
          
          if (!staffError && count !== null) {
            trainedCount = count
          }
        } catch (err) {
          // Silently continue if table doesn't exist or query fails
          console.warn(`Error fetching staff count for EBP ${ebp.id}:`, err)
        }

        // Calculate adoption rate: (trained_staff / total_staff) * 100
        let adoptionRate = 0
        try {
          if (ebp.total_staff > 0 && trainedCount > 0) {
            adoptionRate = Math.round((trainedCount / ebp.total_staff) * 100)
            // Ensure it doesn't exceed 100%
            adoptionRate = Math.min(100, adoptionRate)
          } else if (ebp.total_staff > 0) {
            // If total_staff exists but no trained staff yet
            adoptionRate = 0
          }
          // If total_staff is 0 or not set, adoption_rate remains 0
        } catch (err) {
          // Silently continue if calculation fails
          console.warn(`Error calculating adoption rate for EBP ${ebp.id}:`, err)
          adoptionRate = ebp.adoption_rate || 0
        }

        // Calculate sustainability score from outcomes
        let sustainabilityScore = 0
        try {
          // Get all outcomes for this EBP
          const { data: outcomes, error: outcomesError } = await supabase
            .from("ebp_outcomes")
            .select("outcome_value, outcome_type, measurement_date")
            .eq("ebp_id", ebp.id)
            .not("outcome_value", "is", null)
            .order("measurement_date", { ascending: false })
            .limit(100) // Get last 100 outcomes for calculation
          
          if (!outcomesError && outcomes && outcomes.length > 0) {
            // Filter valid numeric values
            const validValues = outcomes
              .map(o => parseFloat(o.outcome_value))
              .filter(v => !isNaN(v) && v !== null)
            
            if (validValues.length > 0) {
              // Calculate average improvement/performance
              const averageValue = validValues.reduce((a, b) => a + b, 0) / validValues.length
              
              // Group by outcome type to calculate type-specific averages
              const outcomesByType: Record<string, number[]> = {}
              outcomes.forEach((outcome) => {
                const value = parseFloat(outcome.outcome_value)
                if (!isNaN(value)) {
                  if (!outcomesByType[outcome.outcome_type]) {
                    outcomesByType[outcome.outcome_type] = []
                  }
                  outcomesByType[outcome.outcome_type].push(value)
                }
              })
              
              // Calculate sustainability based on:
              // 1. Average outcome value (normalized to 0-100 scale if needed)
              // 2. Consistency (lower variance = higher sustainability)
              // 3. Trend (improving outcomes = higher sustainability)
              
              // For now, use a simple approach:
              // - If outcomes are percentages (0-100), use average directly
              // - If outcomes are scores, normalize to 0-100 scale
              // - Consider trend: compare recent vs older outcomes
              
              const recentOutcomes = outcomes.slice(0, Math.min(20, outcomes.length))
              const olderOutcomes = outcomes.slice(20, Math.min(40, outcomes.length))
              
              let recentAvg = 0
              let olderAvg = 0
              
              if (recentOutcomes.length > 0) {
                const recentValues = recentOutcomes
                  .map(o => parseFloat(o.outcome_value))
                  .filter(v => !isNaN(v))
                if (recentValues.length > 0) {
                  recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
                }
              }
              
              if (olderOutcomes.length > 0) {
                const olderValues = olderOutcomes
                  .map(o => parseFloat(o.outcome_value))
                  .filter(v => !isNaN(v))
                if (olderValues.length > 0) {
                  olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length
                }
              }
              
              // Calculate base score from average (assuming outcomes are already in 0-100 scale)
              // If outcomes are not in 0-100 scale, we'll use a simple normalization
              let baseScore = averageValue
              
              // Normalize if values seem to be outside 0-100 range
              if (averageValue > 100) {
                // Assume max possible value is around 200-300, normalize to 0-100
                const maxValue = Math.max(...validValues)
                if (maxValue > 100) {
                  baseScore = (averageValue / maxValue) * 100
                }
              } else if (averageValue < 0) {
                // Handle negative values (e.g., change scores)
                const minValue = Math.min(...validValues)
                const maxValue = Math.max(...validValues)
                if (maxValue > minValue) {
                  baseScore = ((averageValue - minValue) / (maxValue - minValue)) * 100
                }
              }
              
              // Apply trend bonus/penalty
              let trendBonus = 0
              if (olderAvg > 0 && recentAvg > 0) {
                const improvement = recentAvg - olderAvg
                // If improving, add bonus (max 10 points)
                // If declining, subtract penalty (max 10 points)
                trendBonus = Math.max(-10, Math.min(10, improvement / 10))
              }
              
              // Calculate consistency (lower variance = higher consistency bonus, 0-10 range)
              const variance = validValues.reduce((sum, val) => sum + Math.pow(val - averageValue, 2), 0) / validValues.length
              const stdDev = Math.sqrt(variance)
              const consistencyBonus = Math.max(0, Math.min(10, 10 - (stdDev / 10)))
              
              // Final sustainability score formula:
              // - Base performance: 70% weight (baseScore * 0.70 = 0-70 points)
              // - Trend (improving vs declining): 15% weight (~13.5-16.5 points)
              // - Consistency (stable results): 15% weight (consistencyBonus * 1.5 = 0-15 points)
              // Total: ~100 points max
              sustainabilityScore = Math.round(
                (baseScore * 0.70) + 
                ((baseScore + trendBonus) * 0.15) + 
                (consistencyBonus * 1.5)
              )
              
              // Ensure score is between 0-100
              sustainabilityScore = Math.max(0, Math.min(100, sustainabilityScore))
            }
          }
        } catch (err) {
          // Silently continue if calculation fails
          console.warn(`Error calculating sustainability score for EBP ${ebp.id}:`, err)
          sustainabilityScore = ebp.sustainability_score || 0
        }

        // Get outcomes tracked (JSONB is automatically parsed by Supabase)
        let outcomesTracked: string[] = []
        if (ebp.outcomes_tracked) {
          if (Array.isArray(ebp.outcomes_tracked)) {
            outcomesTracked = ebp.outcomes_tracked
          } else if (typeof ebp.outcomes_tracked === 'string') {
            // Handle legacy string format if any exist
            try {
              outcomesTracked = JSON.parse(ebp.outcomes_tracked)
            } catch {
              outcomesTracked = []
            }
          }
        }
        
        // If no outcomes in JSONB, optionally get from outcomes table (for backwards compatibility)
        if (outcomesTracked.length === 0) {
          const { data: outcomes } = await supabase
            .from("ebp_outcomes")
            .select("outcome_type")
            .eq("ebp_id", ebp.id)
            .limit(10)
          
          if (outcomes && outcomes.length > 0) {
            outcomesTracked = [...new Set((outcomes || []).map(o => o.outcome_type))]
          }
        }

        return {
          ...ebp,
          // Use the cached fidelity_score from database (calculated weighted score)
          // NOT the raw score from the latest assessment
          fidelity_score: ebp.fidelity_score || 0,
          // Keep last_fidelity_review from the latest assessment date
          last_fidelity_review: latestFidelity?.assessment_date || ebp.last_fidelity_review,
          trained_staff: trainedCount || ebp.trained_staff || 0,
          total_staff: ebp.total_staff || 0,
          adoption_rate: adoptionRate,
          sustainability_score: sustainabilityScore,
          outcomes_tracked: outcomesTracked,
        }
      })
    )

    return NextResponse.json({
      success: true,
      ebps: ebpsWithMetrics,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/evidence-based-practices:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST - Create a new evidence-based practice
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    // Validation
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "EBP name is required" }, { status: 400 })
    }

    if (!body.category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    const validCategories = ["Counseling", "Behavioral", "Medical", "Organizational"]
    if (!validCategories.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    // Prepare EBP data
    const ebpData = {
      organization_id: body.organization_id || null,
      name: body.name.trim(),
      category: body.category,
      description: body.description?.trim() || null,
      // JSONB columns accept JavaScript arrays/objects directly - no need to stringify
      outcomes_tracked: Array.isArray(body.outcomes_tracked) ? body.outcomes_tracked : [],
      adoption_rate: 0,
      fidelity_score: 0,
      sustainability_score: 0,
      total_staff: body.total_staff || 0,
      trained_staff: 0,
      created_by: body.created_by || null,
    }

    // Insert EBP
    const { data, error } = await supabase
      .from("evidence_based_practices")
      .insert(ebpData)
      .select()
      .single()

    if (error) {
      console.error("Error creating evidence-based practice:", error)
      
      // Check if table doesn't exist
      if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Database table not found",
            message: "The evidence_based_practices table has not been created. Please run the database migration script: scripts/create_evidence_based_practices_tables.sql",
            code: "TABLE_NOT_FOUND",
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // JSONB is automatically parsed by Supabase, but handle both cases for safety
    const ebp = {
      ...data,
      outcomes_tracked: Array.isArray(data.outcomes_tracked) 
        ? data.outcomes_tracked 
        : (data.outcomes_tracked ? (typeof data.outcomes_tracked === 'string' ? JSON.parse(data.outcomes_tracked) : data.outcomes_tracked) : []),
    }

    return NextResponse.json(
      {
        success: true,
        ebp: ebp,
        message: "Evidence-based practice created successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Unexpected error in POST /api/evidence-based-practices:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

