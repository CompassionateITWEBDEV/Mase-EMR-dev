import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { dbLogger } from "@/lib/utils/db-logger"
import type { PatientStats } from "@/types/patient"
import type { PatientStatsResponse, ApiError } from "@/types/api"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/patients/stats
 * Fetch patient statistics
 */
export async function GET() {
  const operationStartTime = Date.now()
  let connectionInfo: any = null

  try {
    // Log connection initiation
    const connectionStartTime = Date.now()
    connectionInfo = dbLogger.logConnectionStart("service-role", supabaseUrl, {
      operation: "READ",
      table: "patients",
      endpoint: "/api/patients/stats",
      method: "GET",
    })

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    const connectionTime = Date.now() - connectionStartTime
    dbLogger.logConnectionSuccess(connectionInfo, connectionTime, {
      operation: "READ",
      table: "patients",
    })

    // Fetch counts in parallel
    const [totalResult, activeResult, recentAppointmentsResult, patientsWithAssessments] = await Promise.all([
      // Total patients count
      supabase.from("patients").select("*", { count: "exact", head: true }),
      // Active patients count (assuming status = 'active' or similar)
      supabase.from("patients").select("*", { count: "exact", head: true }),
      // Recent appointments (last 7 days)
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      // Patients with high-risk assessments
      supabase
        .from("patients")
        .select(`
          id,
          assessments(
            risk_assessment
          )
        `),
    ])

    // Calculate high risk count
    const highRiskCount =
      patientsWithAssessments.data?.filter((p) =>
        p.assessments?.some(
          (a: { risk_assessment?: { level?: string } }) =>
            a.risk_assessment &&
            typeof a.risk_assessment === "object" &&
            "level" in a.risk_assessment &&
            a.risk_assessment.level === "high",
        ),
      ).length || 0

    const stats: PatientStats = {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      highRisk: highRiskCount,
      recentAppointments: recentAppointmentsResult.count || 0,
    }

    // Log operation summary
    dbLogger.logOperationSummary("READ", "patients", true, {
      connectionTime,
      totalTime: Date.now() - operationStartTime,
    }, {
      operation: "READ",
      table: "patients",
      endpoint: "/api/patients/stats",
      stats,
    })

    return NextResponse.json<PatientStatsResponse>({ stats })
  } catch (error: any) {
    const totalTime = Date.now() - operationStartTime

    if (connectionInfo) {
      dbLogger.logConnectionError(
        connectionInfo,
        error,
        totalTime,
        {
          operation: "READ",
          table: "patients",
          endpoint: "/api/patients/stats",
        }
      )
    }

    dbLogger.logOperationSummary("READ", "patients", false, {
      totalTime,
    }, {
      operation: "READ",
      table: "patients",
      endpoint: "/api/patients/stats",
      error: error?.message || "Unknown error",
    })

    return NextResponse.json<ApiError>(
      { error: "Failed to fetch patient stats" },
      { status: 500 }
    )
  }
}

