import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// This API syncs take-home diversion control data to the DEA reporting system
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { eventType, eventData, patientId, bottleQrId, scanLogId, alertId } = body

    // Generate DEA reference number
    const deaReference = `DEA-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Create diversion report entry
    const { data: report, error } = await supabase
      .from("dea_diversion_reports")
      .insert({
        event_type: eventType,
        event_data: {
          ...eventData,
          patient_id: patientId,
          bottle_qr_id: bottleQrId,
          scan_log_id: scanLogId,
          alert_id: alertId,
          reported_at: new Date().toISOString(),
        },
        reported_at: new Date().toISOString(),
        sync_status: "synced",
        dea_reference_number: deaReference,
        synced_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Update the compliance alert if one was associated
    if (alertId) {
      await supabase
        .from("takehome_compliance_alerts")
        .update({
          status: "reported_to_dea",
          resolution_notes: `Reported to DEA with reference: ${deaReference}`,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId)
    }

    return NextResponse.json({
      success: true,
      report,
      deaReference,
    })
  } catch (error) {
    console.error("Error syncing to DEA:", error)
    return NextResponse.json({ error: "Failed to sync to DEA" }, { status: 500 })
  }
}

// GET - Fetch all DEA reports with summary statistics
export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch all diversion reports
    const { data: reports, error: reportsError } = await supabase
      .from("dea_diversion_reports")
      .select("*")
      .order("reported_at", { ascending: false })
      .limit(500)

    if (reportsError) throw reportsError

    // Fetch related compliance alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("takehome_compliance_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (alertsError) throw alertsError

    // Fetch scan logs for verification data
    const { data: scanLogs, error: scanError } = await supabase
      .from("takehome_scan_logs")
      .select("*")
      .order("scan_timestamp", { ascending: false })
      .limit(500)

    if (scanError) throw scanError

    // Fetch risk scores
    const { data: riskScores, error: riskError } = await supabase
      .from("patient_diversion_risk_scores")
      .select("*")
      .order("assessment_date", { ascending: false })

    if (riskError) throw riskError

    // Calculate statistics
    const totalReports = reports?.length || 0
    const syncedReports = reports?.filter((r) => r.sync_status === "synced").length || 0
    const pendingReports = reports?.filter((r) => r.sync_status === "pending").length || 0

    const totalAlerts = alerts?.length || 0
    const openAlerts = alerts?.filter((a) => a.status === "open").length || 0
    const resolvedAlerts = alerts?.filter((a) => a.status === "resolved").length || 0

    const totalScans = scanLogs?.length || 0
    const successfulScans = scanLogs?.filter((s) => s.verification_status === "success").length || 0
    const failedScans = totalScans - successfulScans

    const highRiskPatients =
      riskScores?.filter((r) => r.risk_level === "high" || r.risk_level === "critical").length || 0

    return NextResponse.json({
      reports: reports || [],
      alerts: alerts || [],
      scanLogs: scanLogs || [],
      riskScores: riskScores || [],
      statistics: {
        totalReports,
        syncedReports,
        pendingReports,
        totalAlerts,
        openAlerts,
        resolvedAlerts,
        totalScans,
        successfulScans,
        failedScans,
        complianceRate: totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 100,
        highRiskPatients,
      },
    })
  } catch (error) {
    console.error("Error fetching DEA data:", error)
    return NextResponse.json({ error: "Failed to fetch DEA data" }, { status: 500 })
  }
}
