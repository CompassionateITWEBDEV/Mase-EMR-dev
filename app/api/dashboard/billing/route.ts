import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Get monthly revenue from insurance_claims
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(0)

    let monthlyRevenue = 0
    let pendingClaims = 0
    let priorAuths = 0
    let pmpAlerts = 0

    // Monthly revenue from paid claims
    try {
      const { data: claims } = await supabase
        .from("insurance_claims")
        .select("paid_amount, claim_status")
        .gte("submission_date", startOfMonth.toISOString())
        .lte("submission_date", endOfMonth.toISOString())

      if (claims) {
        monthlyRevenue = claims
          .filter((c) => c.claim_status === "paid")
          .reduce((sum, c) => sum + (Number(c.paid_amount) || 0), 0)

        pendingClaims = claims.filter((c) => c.claim_status === "pending" || c.claim_status === "submitted").length
      }
    } catch (e) {
      console.error("Error fetching claims:", e)
    }

    // Prior authorizations
    try {
      const { count } = await supabase
        .from("prior_auth_requests_edi")
        .select("*", { count: "exact", head: true })
        .eq("auth_status", "approved")

      priorAuths = count || 0
    } catch (e) {
      console.error("Error fetching prior auths:", e)
    }

    // PMP high risk alerts from encounter_alerts
    try {
      const { count } = await supabase
        .from("encounter_alerts")
        .select("*", { count: "exact", head: true })
        .eq("severity", "high")
        .eq("is_acknowledged", false)

      pmpAlerts = count || 0
    } catch (e) {
      console.error("Error fetching PMP alerts:", e)
    }

    return NextResponse.json({
      monthlyRevenue,
      pendingClaims,
      priorAuths,
      pmpAlerts,
    })
  } catch (error) {
    console.error("Dashboard billing error:", error)
    return NextResponse.json({
      monthlyRevenue: 0,
      pendingClaims: 0,
      priorAuths: 0,
      pmpAlerts: 0,
    })
  }
}
