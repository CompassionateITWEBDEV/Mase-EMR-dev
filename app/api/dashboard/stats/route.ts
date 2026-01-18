import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Get patient stats - wrap each query in try-catch to handle individual failures
    let totalPatients = 0
    let activePatients = 0
    let highRiskPatients = 0
    let pendingAssessments = 0
    let waitingCount = 0
    let recentPatients: any[] = []

    try {
      const { count } = await supabase.from("patients").select("*", { count: "exact", head: true })
      totalPatients = count || 0
    } catch (e) {
      console.error("[v0] Error fetching patients count:", e)
    }

    try {
      const { count } = await supabase
        .from("medications")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
      activePatients = count || 0
    } catch (e) {
      console.error("[v0] Error fetching active medications:", e)
    }

    try {
      const { count } = await supabase
        .from("dosing_holds")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
      highRiskPatients = count || 0
    } catch (e) {
      console.error("[v0] Error fetching dosing holds:", e)
    }

    try {
      const { count } = await supabase
        .from("patient_assessments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
      pendingAssessments = count || 0
    } catch (e) {
      console.error("[v0] Error fetching pending assessments:", e)
    }

    try {
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5)
      recentPatients = data || []
    } catch (e) {
      console.error("[v0] Error fetching recent patients:", e)
    }

    try {
      const { count } = await supabase
        .from("patient_check_ins")
        .select("*", { count: "exact", head: true })
        .eq("status", "waiting")
      waitingCount = count || 0
    } catch (e) {
      console.error("[v0] Error fetching check-in queue:", e)
    }

    return NextResponse.json({
      stats: {
        totalPatients,
        activePatients,
        highRiskPatients,
        pendingAssessments,
        waitingCount,
      },
      recentPatients,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({
      stats: {
        totalPatients: 0,
        activePatients: 0,
        highRiskPatients: 0,
        pendingAssessments: 0,
        waitingCount: 0,
      },
      recentPatients: [],
    })
  }
}
