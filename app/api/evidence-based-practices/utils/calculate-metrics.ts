import { createServiceClient } from "@/lib/supabase/service-role"

/**
 * Recalculates and updates cached metrics for an EBP
 * This should be called whenever related data changes (training, fidelity, outcomes)
 * 
 * METRIC FORMULAS:
 * - Adoption Rate: (trained_staff / total_staff) × 100
 * - Fidelity Score: Weighted calculation using latest + historical + trend + consistency
 * - Sustainability Score: Base average + trend bonus + consistency bonus from outcomes
 */
export async function recalculateEbpMetrics(ebpId: string) {
  try {
    const supabase = createServiceClient()

    // Get current EBP data
    const { data: ebp, error: ebpError } = await supabase
      .from("evidence_based_practices")
      .select("total_staff")
      .eq("id", ebpId)
      .single()

    if (ebpError || !ebp) {
      console.error(`Error fetching EBP ${ebpId} for metric calculation:`, ebpError)
      return
    }

    // 1. Calculate trained staff count
    let trainedCount = 0
    try {
      const { count, error: staffError } = await supabase
        .from("ebp_staff_assignments")
        .select("*", { count: "exact", head: true })
        .eq("ebp_id", ebpId)
        .in("status", ["trained", "certified"])
      
      if (!staffError && count !== null) {
        trainedCount = count
      }
    } catch (err) {
      console.warn(`Error counting trained staff for EBP ${ebpId}:`, err)
    }

    // 2. Calculate adoption rate: (trained_staff / total_staff) * 100
    let adoptionRate = 0
    if (ebp.total_staff > 0 && trainedCount > 0) {
      adoptionRate = Math.round((trainedCount / ebp.total_staff) * 100)
      adoptionRate = Math.min(100, adoptionRate)
    }

    // 3. Calculate fidelity score - Use LATEST assessment (clinically appropriate)
    // Fidelity is a point-in-time measurement showing current adherence to EBP protocol
    // Historical trends are viewable separately in the "View Fidelity" assessment list
    let fidelityScore = 0
    let lastFidelityReview = null
    try {
      // Fetch assessments and sort to get the latest one
      const { data: rawAssessments, error: fidelityError } = await supabase
        .from("ebp_fidelity_assessments")
        .select("assessment_date, fidelity_score, created_at")
        .eq("ebp_id", ebpId)
        .limit(50)
      
      if (fidelityError) {
        console.error(`[Fidelity] Error fetching assessments for EBP ${ebpId}:`, fidelityError)
        throw fidelityError
      }
      
      if (rawAssessments && rawAssessments.length > 0) {
        // Sort to get the most recent assessment
        // Primary: assessment_date DESC, Secondary: created_at DESC (for same-date tiebreaker)
        const sortedAssessments = [...rawAssessments].sort((a, b) => {
          const dateCompare = new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime()
          if (dateCompare !== 0) return dateCompare
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        
        // Use the LATEST assessment score directly (clinically appropriate)
        const latestAssessment = sortedAssessments[0]
        fidelityScore = Math.round(latestAssessment.fidelity_score || 0)
        lastFidelityReview = latestAssessment.assessment_date
        
        console.log(`[Fidelity] EBP ${ebpId}: Using latest assessment score: ${fidelityScore}% (from ${lastFidelityReview})`)
      }
    } catch (err) {
      console.error(`[Fidelity] Error calculating fidelity for EBP ${ebpId}:`, err)
    }

    // 4. Calculate sustainability score from outcomes
    let sustainabilityScore = 0
    try {
      const { data: outcomes, error: outcomesError } = await supabase
        .from("ebp_outcomes")
        .select("outcome_value, outcome_type, measurement_date")
        .eq("ebp_id", ebpId)
        .not("outcome_value", "is", null)
        .order("measurement_date", { ascending: false })
        .limit(100)
      
      if (!outcomesError && outcomes && outcomes.length > 0) {
        const validValues = outcomes
          .map(o => parseFloat(o.outcome_value))
          .filter(v => !isNaN(v) && v !== null)
        
        if (validValues.length > 0) {
          const averageValue = validValues.reduce((a, b) => a + b, 0) / validValues.length
          
          // Normalize to 0-100 scale
          let baseScore = averageValue
          if (averageValue > 100) {
            const maxValue = Math.max(...validValues)
            if (maxValue > 100) {
              baseScore = (averageValue / maxValue) * 100
            }
          } else if (averageValue < 0) {
            const minValue = Math.min(...validValues)
            const maxValue = Math.max(...validValues)
            if (maxValue > minValue) {
              baseScore = ((averageValue - minValue) / (maxValue - minValue)) * 100
            }
          }
          
          // Calculate trend
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
          
          let trendBonus = 0
          if (olderAvg > 0 && recentAvg > 0) {
            const improvement = recentAvg - olderAvg
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
          
          sustainabilityScore = Math.max(0, Math.min(100, sustainabilityScore))
        }
      }
    } catch (err) {
      console.warn(`Error calculating sustainability score for EBP ${ebpId}:`, err)
    }

    // Update cached metrics in database
    const { error: updateError } = await supabase
      .from("evidence_based_practices")
      .update({
        trained_staff: trainedCount,
        adoption_rate: adoptionRate,
        fidelity_score: fidelityScore,
        last_fidelity_review: lastFidelityReview,
        sustainability_score: sustainabilityScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ebpId)

    if (updateError) {
      console.error(`Error updating metrics for EBP ${ebpId}:`, updateError)
      throw updateError
    }

    return {
      trained_staff: trainedCount,
      adoption_rate: adoptionRate,
      fidelity_score: fidelityScore,
      last_fidelity_review: lastFidelityReview,
      sustainability_score: sustainabilityScore,
    }
  } catch (error) {
    console.error(`Unexpected error recalculating metrics for EBP ${ebpId}:`, error)
    throw error
  }
}

