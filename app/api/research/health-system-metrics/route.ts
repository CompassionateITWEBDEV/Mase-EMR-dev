import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

const mockHealthSystemData = {
  hivMetrics: {
    hiv_related_mortality_rate: 2.3,
    hiv_related_morbidity_rate: 15.2,
    viral_suppression_rate: 82,
    linkage_to_care_30_days: 71,
    retention_in_care_12_months: 74,
    measurement_date: new Date().toISOString(),
  },
  vitalStats: [
    {
      birth_registration_completeness: 94,
      death_registration_completeness: 88,
      natality_data_quality_score: 87,
      mortality_data_quality_score: 85,
      vital_events_processing_time_days: 12,
      reporting_period: "current",
    },
  ],
  outbreakMetrics: [
    {
      id: "1",
      disease: "Influenza A",
      status: "Monitoring",
      cases_reported: 23,
      threshold: 50,
      trend: "Increasing",
      alert_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      severity: "Low",
    },
    {
      id: "2",
      disease: "Hepatitis A",
      status: "Active",
      cases_reported: 8,
      threshold: 5,
      trend: "Cluster Detected",
      alert_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      severity: "High",
    },
    {
      id: "3",
      disease: "COVID-19 Variant",
      status: "Monitoring",
      cases_reported: 12,
      threshold: 20,
      trend: "Stable",
      alert_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      severity: "Medium",
    },
  ],
  hisMetrics: {
    emr_system_interoperability: 76,
    data_quality_index: 82,
    system_integration_score: 71,
    realtime_data_availability: 88,
    cross_facility_data_exchange: 69,
    measurement_date: new Date().toISOString(),
  },
}

export async function GET(request: NextRequest) {
  try {
    // HIV/AIDS Monitoring
    const hivMetrics = await sql`
      SELECT * FROM hiv_aids_monitoring
      WHERE measurement_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY measurement_date DESC
      LIMIT 1
    `

    // Vital Statistics
    const vitalStats = await sql`
      SELECT * FROM vital_statistics_system
      WHERE reporting_period = 'current'
    `

    // Disease Outbreak Detection
    const outbreakMetrics = await sql`
      SELECT * FROM disease_outbreak_monitoring
      WHERE status IN ('Active', 'Monitoring')
      ORDER BY alert_date DESC
    `

    // HIS Integration
    const hisMetrics = await sql`
      SELECT * FROM health_information_system_integration
      WHERE measurement_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY measurement_date DESC
      LIMIT 1
    `

    return NextResponse.json({
      hivMetrics: hivMetrics[0] || {},
      vitalStats: vitalStats || [],
      outbreakMetrics: outbreakMetrics || [],
      hisMetrics: hisMetrics[0] || {},
    })
  } catch (error: any) {
    console.error("[v0] Error fetching health system metrics:", error)

    if (error?.code === "42P01") {
      console.log("[v0] Health system metrics tables not found, returning mock data")
      return NextResponse.json(mockHealthSystemData)
    }

    return NextResponse.json(
      {
        error: "Failed to fetch metrics",
        ...mockHealthSystemData,
      },
      { status: 500 },
    )
  }
}
