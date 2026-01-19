import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"
import { recalculateEbpMetrics } from "../utils/calculate-metrics"

/**
 * API endpoint to migrate fidelity calculation to weighted formula
 * 
 * GET /api/evidence-based-practices/migrate-fidelity
 *   - Returns migration status and SQL content
 * 
 * POST /api/evidence-based-practices/migrate-fidelity
 *   - Recalculates all EBP fidelity scores using new formula
 *   - This applies the new calculation without needing database trigger changes
 */

// GET - Return migration status and SQL content for manual execution
export async function GET() {
  try {
    const supabase = createServiceClient()
    
    // Check current fidelity scores
    const { data: ebps, error: ebpError } = await supabase
      .from("evidence_based_practices")
      .select("id, name, fidelity_score, last_fidelity_review")
      .order("name")
    
    if (ebpError) {
      return NextResponse.json(
        { error: "Failed to fetch EBPs", message: ebpError.message },
        { status: 500 }
      )
    }
    
    // Check assessment counts for each EBP
    const ebpStatus = await Promise.all(
      (ebps || []).map(async (ebp) => {
        const { count, error } = await supabase
          .from("ebp_fidelity_assessments")
          .select("*", { count: "exact", head: true })
          .eq("ebp_id", ebp.id)
        
        return {
          id: ebp.id,
          name: ebp.name,
          current_fidelity_score: ebp.fidelity_score,
          last_review: ebp.last_fidelity_review,
          assessment_count: error ? 0 : (count || 0),
          needs_recalculation: (count || 0) > 1, // Needs recalc if multiple assessments
        }
      })
    )
    
    const needsRecalc = ebpStatus.filter(e => e.needs_recalculation).length
    
    // Read SQL file for manual execution
    let sql = ""
    try {
      const sqlPath = join(process.cwd(), "scripts", "update_fidelity_calculation.sql")
      sql = readFileSync(sqlPath, "utf-8")
    } catch (err) {
      console.warn("SQL file not found:", err)
    }
    
    return NextResponse.json({
      success: true,
      message: "Fidelity calculation migration status",
      summary: {
        total_ebps: ebpStatus.length,
        ebps_with_multiple_assessments: needsRecalc,
        ebps_needing_recalculation: needsRecalc,
      },
      ebp_status: ebpStatus,
      sql_content: sql || null,
      instructions: {
        option_a: {
          title: "Automatic Recalculation (Recommended)",
          description: "Run POST to this endpoint to recalculate all fidelity scores using the new weighted formula",
          endpoint: "POST /api/evidence-based-practices/migrate-fidelity",
          note: "This updates all scores immediately using the application logic"
        },
        option_b: {
          title: "Manual Database Trigger Update",
          description: "Execute the SQL in Supabase Dashboard to update the database trigger",
          steps: [
            "1. Open your Supabase Dashboard",
            "2. Go to SQL Editor",
            "3. Click 'New Query'",
            "4. Copy and paste the sql_content below",
            "5. Click 'Run' to execute",
            "6. This updates the trigger for future assessments"
          ],
          note: "After updating trigger, new assessments will use the new formula automatically"
        }
      },
      new_formula: {
        description: "Weighted Fidelity Score Calculation",
        components: [
          { name: "Latest Assessment", weight: "50%", points: "0-50" },
          { name: "Historical Average", weight: "30%", points: "0-30" },
          { name: "Trend Bonus", weight: "10%", points: "±10" },
          { name: "Consistency Bonus", weight: "10%", points: "0-10" },
        ],
        total_range: "0-100 points"
      }
    })
  } catch (error) {
    console.error("Migration status check error:", error)
    return NextResponse.json(
      {
        error: "Failed to check migration status",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST - Recalculate all EBP fidelity scores using new formula
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    
    // Get all EBPs
    const { data: ebps, error: ebpError } = await supabase
      .from("evidence_based_practices")
      .select("id, name, fidelity_score")
      .eq("is_active", true)
      .order("name")
    
    if (ebpError) {
      return NextResponse.json(
        { error: "Failed to fetch EBPs", message: ebpError.message },
        { status: 500 }
      )
    }
    
    if (!ebps || ebps.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No EBPs found to recalculate",
        updated: 0,
        results: []
      })
    }
    
    // Recalculate each EBP's fidelity score
    const results: Array<{
      id: string
      name: string
      old_score: number
      new_score: number | null
      status: "updated" | "error" | "unchanged"
      message?: string
    }> = []
    
    for (const ebp of ebps) {
      try {
        const oldScore = ebp.fidelity_score || 0
        
        // Use the updated recalculateEbpMetrics function
        const newMetrics = await recalculateEbpMetrics(ebp.id)
        
        if (newMetrics) {
          const newScore = newMetrics.fidelity_score || 0
          results.push({
            id: ebp.id,
            name: ebp.name,
            old_score: oldScore,
            new_score: newScore,
            status: newScore !== oldScore ? "updated" : "unchanged",
            message: newScore !== oldScore 
              ? `Score changed from ${oldScore}% to ${newScore}%`
              : "Score unchanged"
          })
        } else {
          results.push({
            id: ebp.id,
            name: ebp.name,
            old_score: oldScore,
            new_score: null,
            status: "error",
            message: "Recalculation returned no result"
          })
        }
      } catch (err) {
        results.push({
          id: ebp.id,
          name: ebp.name,
          old_score: ebp.fidelity_score || 0,
          new_score: null,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error"
        })
      }
    }
    
    const updatedCount = results.filter(r => r.status === "updated").length
    const errorCount = results.filter(r => r.status === "error").length
    const unchangedCount = results.filter(r => r.status === "unchanged").length
    
    return NextResponse.json({
      success: true,
      message: `Fidelity scores recalculated for ${ebps.length} EBPs`,
      summary: {
        total: ebps.length,
        updated: updatedCount,
        unchanged: unchangedCount,
        errors: errorCount,
      },
      results,
      next_steps: errorCount > 0 
        ? ["Some EBPs had errors. Check the results for details."]
        : updatedCount > 0
          ? [
              "Fidelity scores have been updated using the new weighted formula.",
              "To update the database trigger for future assessments, run the SQL in Supabase Dashboard.",
              "GET this endpoint to retrieve the SQL content."
            ]
          : ["All scores are already up to date."]
    })
  } catch (error) {
    console.error("Migration execution error:", error)
    return NextResponse.json(
      {
        error: "Failed to execute migration",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

