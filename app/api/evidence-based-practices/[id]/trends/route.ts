import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET - Get trend data for an EBP (fidelity over time, adoption trends, etc.)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "6months" // 1month, 3months, 6months, 1year, all

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Calculate date range based on period
    const today = new Date()
    let startDate: Date
    switch (period) {
      case "1month":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        break
      case "3months":
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
        break
      case "6months":
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())
        break
      case "1year":
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        break
      default:
        startDate = new Date(0) // All time
    }

    // Fetch fidelity assessments over time
    const { data: fidelityAssessments, error: fidelityError } = await supabase
      .from("ebp_fidelity_assessments")
      .select("assessment_date, fidelity_score")
      .eq("ebp_id", ebpId)
      .gte("assessment_date", startDate.toISOString().split('T')[0])
      .order("assessment_date", { ascending: true })

    if (fidelityError) {
      console.error("Error fetching fidelity assessments:", fidelityError)
    }

    // Fetch staff assignments over time (for adoption rate trend)
    const { data: staffAssignments, error: staffError } = await supabase
      .from("ebp_staff_assignments")
      .select("assigned_at, status")
      .eq("ebp_id", ebpId)
      .gte("assigned_at", startDate.toISOString())

    if (staffError) {
      console.error("Error fetching staff assignments:", staffError)
    }

    // Fetch patient deliveries over time
    const { data: deliveries, error: deliveryError } = await supabase
      .from("ebp_patient_delivery")
      .select("delivery_date")
      .eq("ebp_id", ebpId)
      .gte("delivery_date", startDate.toISOString().split('T')[0])
      .order("delivery_date", { ascending: true })

    if (deliveryError) {
      console.error("Error fetching deliveries:", deliveryError)
    }

    // Fetch outcomes over time
    const { data: outcomes, error: outcomeError } = await supabase
      .from("ebp_outcomes")
      .select("measurement_date, outcome_value, outcome_type")
      .eq("ebp_id", ebpId)
      .gte("measurement_date", startDate.toISOString().split('T')[0])
      .order("measurement_date", { ascending: true })

    if (outcomeError) {
      console.error("Error fetching outcomes:", outcomeError)
    }

    // Process fidelity trend data (monthly averages)
    const fidelityTrend: Array<{ month: string; score: number; count: number }> = []
    if (fidelityAssessments && fidelityAssessments.length > 0) {
      const monthlyData: Record<string, number[]> = {}
      fidelityAssessments.forEach((assessment: any) => {
        const date = new Date(assessment.assessment_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = []
        }
        monthlyData[monthKey].push(assessment.fidelity_score)
      })

      Object.keys(monthlyData).sort().forEach((monthKey) => {
        const scores = monthlyData[monthKey]
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
        fidelityTrend.push({
          month: monthKey,
          score: Math.round(avgScore * 10) / 10,
          count: scores.length,
        })
      })
    }

    // Process adoption trend (monthly trained staff count)
    const adoptionTrend: Array<{ month: string; trained: number; total: number }> = []
    if (staffAssignments && staffAssignments.length > 0) {
      const monthlyData: Record<string, { trained: number; total: number }> = {}
      staffAssignments.forEach((assignment: any) => {
        const date = new Date(assignment.assigned_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { trained: 0, total: 0 }
        }
        monthlyData[monthKey].total++
        if (assignment.status === 'trained' || assignment.status === 'certified') {
          monthlyData[monthKey].trained++
        }
      })

      Object.keys(monthlyData).sort().forEach((monthKey) => {
        adoptionTrend.push({
          month: monthKey,
          trained: monthlyData[monthKey].trained,
          total: monthlyData[monthKey].total,
        })
      })
    }

    // Process delivery trend (monthly count)
    const deliveryTrend: Array<{ month: string; count: number; uniquePatients: number }> = []
    if (deliveries && deliveries.length > 0) {
      const monthlyData: Record<string, { count: number; patients: Set<string> }> = {}
      deliveries.forEach((delivery: any) => {
        const date = new Date(delivery.delivery_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { count: 0, patients: new Set() }
        }
        monthlyData[monthKey].count++
        if (delivery.patient_id) {
          monthlyData[monthKey].patients.add(delivery.patient_id)
        }
      })

      Object.keys(monthlyData).sort().forEach((monthKey) => {
        deliveryTrend.push({
          month: monthKey,
          count: monthlyData[monthKey].count,
          uniquePatients: monthlyData[monthKey].patients.size,
        })
      })
    }

    // Process outcome trend (monthly averages by type)
    const outcomeTrend: Record<string, Array<{ month: string; value: number; count: number }>> = {}
    if (outcomes && outcomes.length > 0) {
      const monthlyDataByType: Record<string, Record<string, number[]>> = {}
      outcomes.forEach((outcome: any) => {
        if (outcome.outcome_value === null || outcome.outcome_value === undefined) return
        const date = new Date(outcome.measurement_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const type = outcome.outcome_type || 'Unknown'
        
        if (!monthlyDataByType[type]) {
          monthlyDataByType[type] = {}
        }
        if (!monthlyDataByType[type][monthKey]) {
          monthlyDataByType[type][monthKey] = []
        }
        monthlyDataByType[type][monthKey].push(parseFloat(outcome.outcome_value))
      })

      Object.keys(monthlyDataByType).forEach((type) => {
        outcomeTrend[type] = []
        Object.keys(monthlyDataByType[type]).sort().forEach((monthKey) => {
          const values = monthlyDataByType[type][monthKey]
          const avgValue = values.reduce((a, b) => a + b, 0) / values.length
          outcomeTrend[type].push({
            month: monthKey,
            value: Math.round(avgValue * 10) / 10,
            count: values.length,
          })
        })
      })
    }

    return NextResponse.json({
      success: true,
      period,
      trends: {
        fidelity: fidelityTrend,
        adoption: adoptionTrend,
        deliveries: deliveryTrend,
        outcomes: outcomeTrend,
      },
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/evidence-based-practices/[id]/trends:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

