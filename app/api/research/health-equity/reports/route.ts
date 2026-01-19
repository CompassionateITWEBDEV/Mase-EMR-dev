import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { getAllStratifiedOutcomes, getSdohSummary } from "@/lib/health-equity-calculator"
import type { StratificationType } from "@/lib/health-equity-types"

interface ReportOptions {
  report_type: "monthly" | "quarterly" | "annual" | "custom"
  start_date?: string
  end_date?: string
  stratification_types?: StratificationType[]
  include_sdoh?: boolean
  include_initiatives?: boolean
  include_benchmarks?: boolean
  format?: "json" | "csv" | "summary" | "pdf"
}

// GET - Generate health equity report
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const reportType = (searchParams.get("report_type") || "monthly") as ReportOptions["report_type"]
    const format = (searchParams.get("format") || "json") as ReportOptions["format"]
    const includeSdoh = searchParams.get("include_sdoh") !== "false"
    const includeInitiatives = searchParams.get("include_initiatives") !== "false"
    const includeBenchmarks = searchParams.get("include_benchmarks") !== "false"
    
    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()
    
    switch (reportType) {
      case "monthly":
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case "quarterly":
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case "annual":
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        const customStart = searchParams.get("start_date")
        const customEnd = searchParams.get("end_date")
        if (customStart) startDate = new Date(customStart)
        if (customEnd) endDate.setTime(new Date(customEnd).getTime())
    }
    
    // Generate report data
    const reportData = await generateReport({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      includeSdoh,
      includeInitiatives,
      includeBenchmarks,
      supabase,
    })
    
    // Format response based on requested format
    if (format === "csv") {
      const csv = convertToCSV(reportData)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="health-equity-report-${endDate.toISOString().split("T")[0]}.csv"`,
        },
      })
    }
    
    if (format === "pdf") {
      const executiveSummary = generateExecutiveSummary(reportData)
      const keyFindings = generateKeyFindings(reportData)
      const recommendations = generateRecommendations(reportData)
      
      const html = generatePDFHTML({
        reportType,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        reportData,
        executiveSummary,
        keyFindings,
        recommendations,
      })
      
      // Return HTML for client-side PDF generation
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Report-Type": reportType,
          "X-Report-Date": endDate.toISOString().split("T")[0],
        },
      })
    }
    
    if (format === "summary") {
      return NextResponse.json({
        success: true,
        report_type: reportType,
        period: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
        },
        executive_summary: generateExecutiveSummary(reportData),
        key_findings: generateKeyFindings(reportData),
        recommendations: generateRecommendations(reportData),
      })
    }
    
    return NextResponse.json({
      success: true,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      period: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      ...reportData,
      executive_summary: generateExecutiveSummary(reportData),
      key_findings: generateKeyFindings(reportData),
      recommendations: generateRecommendations(reportData),
    })
    
  } catch (error) {
    console.error("Error in GET /api/research/health-equity/reports:", error)
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

// POST - Schedule or generate custom report
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body: ReportOptions = await request.json()
    
    const endDate = body.end_date || new Date().toISOString().split("T")[0]
    let startDate = body.start_date
    
    if (!startDate) {
      const sd = new Date(endDate)
      switch (body.report_type) {
        case "monthly":
          sd.setMonth(sd.getMonth() - 1)
          break
        case "quarterly":
          sd.setMonth(sd.getMonth() - 3)
          break
        case "annual":
          sd.setFullYear(sd.getFullYear() - 1)
          break
      }
      startDate = sd.toISOString().split("T")[0]
    }
    
    const reportData = await generateReport({
      startDate,
      endDate,
      includeSdoh: body.include_sdoh !== false,
      includeInitiatives: body.include_initiatives !== false,
      includeBenchmarks: body.include_benchmarks !== false,
      stratificationTypes: body.stratification_types,
      supabase,
    })
    
    // Store report in database for historical tracking
    const { error: insertError } = await supabase
      .from("health_equity_reports")
      .insert({
        report_type: body.report_type,
        period_start: startDate,
        period_end: endDate,
        report_data: reportData,
        generated_at: new Date().toISOString(),
      })
    
    // Generate response based on format
    if (body.format === "csv") {
      const csv = convertToCSV(reportData)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="health-equity-report-${endDate}.csv"`,
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      message: "Report generated successfully",
      report_type: body.report_type,
      period: { start: startDate, end: endDate },
      ...reportData,
      executive_summary: generateExecutiveSummary(reportData),
      key_findings: generateKeyFindings(reportData),
      recommendations: generateRecommendations(reportData),
    })
    
  } catch (error) {
    console.error("Error in POST /api/research/health-equity/reports:", error)
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

async function generateReport(options: {
  startDate: string
  endDate: string
  includeSdoh: boolean
  includeInitiatives: boolean
  includeBenchmarks: boolean
  stratificationTypes?: StratificationType[]
  supabase: any
}) {
  const { supabase } = options
  
  // Get stratified outcomes
  const stratificationTypes = options.stratificationTypes || ["race", "ethnicity", "insurance_type", "geography"]
  const disparities = await getAllStratifiedOutcomes(stratificationTypes as StratificationType[])
  
  // Get snapshots for the period
  const { data: snapshots } = await supabase
    .from("health_equity_snapshots")
    .select(`
      *,
      health_equity_metrics(name, code, equity_target, national_benchmark)
    `)
    .gte("snapshot_date", options.startDate)
    .lte("snapshot_date", options.endDate)
    .order("snapshot_date", { ascending: false })
  
  // Calculate disparity summary
  const snapshotList = snapshots || []
  const criticalDisparities = snapshotList.filter((s: any) => s.alert_level === "critical")
  const warningDisparities = snapshotList.filter((s: any) => s.alert_level === "warning")
  
  const disparity_summary = {
    total_metrics_tracked: new Set(snapshotList.map((s: any) => s.metric_id)).size,
    total_groups_tracked: snapshotList.length,
    critical_count: criticalDisparities.length,
    warning_count: warningDisparities.length,
    at_target_count: snapshotList.filter((s: any) => s.meets_equity_target).length,
    average_disparity: snapshotList.length > 0
      ? Math.round(snapshotList.reduce((sum: number, s: any) => sum + Math.abs(s.disparity_difference || 0), 0) / snapshotList.length * 10) / 10
      : 0,
    critical_disparities: criticalDisparities.map((s: any) => ({
      metric: s.health_equity_metrics?.name,
      group: s.stratification_value,
      disparity: s.disparity_difference,
      value: s.current_value,
    })),
    warning_disparities: warningDisparities.slice(0, 10).map((s: any) => ({
      metric: s.health_equity_metrics?.name,
      group: s.stratification_value,
      disparity: s.disparity_difference,
      value: s.current_value,
    })),
  }
  
  const report: any = {
    disparity_summary,
    stratified_outcomes: disparities,
    snapshots: snapshotList,
  }
  
  // Add SDOH data
  if (options.includeSdoh) {
    const sdohSummary = await getSdohSummary()
    
    const { data: sdohScores } = await supabase
      .from("patient_sdoh_scores")
      .select("*")
    
    report.sdoh_analysis = {
      summary: sdohSummary,
      scores: sdohScores || [],
      high_risk_count: (sdohScores || []).filter((s: any) => 
        s.risk_level === "high" || s.risk_level === "very_high"
      ).length,
    }
  }
  
  // Add initiatives
  if (options.includeInitiatives) {
    const { data: initiatives } = await supabase
      .from("health_equity_initiatives")
      .select("*")
      .order("created_at", { ascending: false })
    
    report.initiatives = {
      total: initiatives?.length || 0,
      active: initiatives?.filter((i: any) => i.status === "active").length || 0,
      completed: initiatives?.filter((i: any) => i.status === "completed").length || 0,
      details: initiatives || [],
    }
  }
  
  // Add benchmark comparisons
  if (options.includeBenchmarks) {
    const { data: benchmarks } = await supabase
      .from("health_equity_benchmarks")
      .select("*")
      .eq("is_active", true)
    
    report.benchmarks = benchmarks || []
  }
  
  return report
}

function convertToCSV(reportData: any): string {
  const lines: string[] = []
  
  // Header
  lines.push("Health Equity Report")
  lines.push("")
  
  // Disparity Summary
  lines.push("Disparity Summary")
  lines.push("Metric,Total Metrics,Critical,Warning,At Target,Average Disparity")
  const summary = reportData.disparity_summary
  lines.push(`Summary,${summary.total_metrics_tracked},${summary.critical_count},${summary.warning_count},${summary.at_target_count},${summary.average_disparity}%`)
  lines.push("")
  
  // Critical Disparities
  lines.push("Critical Disparities")
  lines.push("Metric,Group,Value,Disparity")
  for (const d of summary.critical_disparities || []) {
    lines.push(`"${d.metric}","${d.group}",${d.value}%,${d.disparity}%`)
  }
  lines.push("")
  
  // Stratified Outcomes
  lines.push("Stratified Outcomes")
  lines.push("Metric,Stratification,Group,Value,Reference,Disparity,Alert Level")
  for (const outcome of reportData.stratified_outcomes || []) {
    for (const group of outcome.groups || []) {
      lines.push(`"${outcome.metric_name}","${outcome.stratification_type}","${group.group_name}",${group.value}%,${outcome.reference_value}%,${group.disparity_from_reference}%,${group.alert_level}`)
    }
  }
  lines.push("")
  
  // SDOH Summary
  if (reportData.sdoh_analysis) {
    lines.push("SDOH Analysis")
    lines.push("Domain,Prevalence (%)")
    const prevalence = reportData.sdoh_analysis.summary?.domain_prevalence || {}
    for (const [domain, value] of Object.entries(prevalence)) {
      lines.push(`"${domain.replace(/_/g, ' ')}",${value}%`)
    }
    lines.push("")
    
    lines.push("SDOH Risk Distribution")
    lines.push("Risk Level,Count")
    const riskDist = reportData.sdoh_analysis.summary?.risk_distribution || {}
    for (const [level, count] of Object.entries(riskDist)) {
      lines.push(`${level},${count}`)
    }
  }
  
  return lines.join("\n")
}

function generateExecutiveSummary(reportData: any): string {
  const summary = reportData.disparity_summary
  const parts: string[] = []
  
  parts.push(`This report analyzes health equity across ${summary.total_metrics_tracked} key metrics and ${summary.total_groups_tracked} demographic groups.`)
  
  if (summary.critical_count > 0) {
    parts.push(`CRITICAL: ${summary.critical_count} significant disparities require immediate attention.`)
  }
  
  if (summary.warning_count > 0) {
    parts.push(`${summary.warning_count} metrics show warning-level disparities that need monitoring.`)
  }
  
  parts.push(`The average disparity across all groups is ${summary.average_disparity}%.`)
  parts.push(`${summary.at_target_count} groups currently meet equity targets.`)
  
  if (reportData.initiatives) {
    parts.push(`${reportData.initiatives.active} equity improvement initiatives are currently active.`)
  }
  
  return parts.join(" ")
}

function generateKeyFindings(reportData: any): string[] {
  const findings: string[] = []
  const summary = reportData.disparity_summary
  
  // Critical disparities
  if (summary.critical_disparities?.length > 0) {
    for (const d of summary.critical_disparities.slice(0, 3)) {
      findings.push(`${d.group} patients show ${Math.abs(d.disparity)}% ${d.disparity < 0 ? 'lower' : 'higher'} ${d.metric?.toLowerCase() || 'outcome'} compared to reference group`)
    }
  }
  
  // SDOH findings
  if (reportData.sdoh_analysis) {
    const highRisk = reportData.sdoh_analysis.high_risk_count || 0
    const total = reportData.sdoh_analysis.scores?.length || 0
    if (total > 0) {
      const pct = Math.round((highRisk / total) * 100)
      findings.push(`${pct}% of screened patients have high or very high SDOH risk scores`)
    }
    
    // Highest SDOH domain
    const prevalence = reportData.sdoh_analysis.summary?.domain_prevalence || {}
    const sorted = Object.entries(prevalence).sort((a: any, b: any) => b[1] - a[1])
    if (sorted.length > 0) {
      const [domain, value] = sorted[0]
      findings.push(`${domain.replace(/_/g, ' ')} is the most prevalent SDOH barrier at ${value}%`)
    }
  }
  
  // Initiative findings
  if (reportData.initiatives?.active > 0) {
    findings.push(`${reportData.initiatives.active} active equity initiatives are addressing identified disparities`)
  }
  
  return findings
}

function generateRecommendations(reportData: any): string[] {
  const recommendations: string[] = []
  const summary = reportData.disparity_summary
  
  // Based on critical disparities
  if (summary.critical_disparities?.length > 0) {
    const uniqueGroups = [...new Set(summary.critical_disparities.map((d: any) => d.group))]
    
    for (const group of uniqueGroups.slice(0, 2)) {
      recommendations.push(`Implement targeted interventions for ${group} patients to reduce identified disparities`)
    }
  }
  
  // SDOH recommendations
  if (reportData.sdoh_analysis) {
    const screeningRate = reportData.sdoh_analysis.summary?.screening_rate || 0
    if (screeningRate < 80) {
      recommendations.push(`Increase SDOH screening rate from current ${screeningRate}% to meet 80% CCBHC target`)
    }
    
    const prevalence = reportData.sdoh_analysis.summary?.domain_prevalence || {}
    if (prevalence.transportation_barrier > 20) {
      recommendations.push(`Expand telehealth services to address transportation barriers affecting ${prevalence.transportation_barrier}% of patients`)
    }
    if (prevalence.housing_instability > 15) {
      recommendations.push(`Partner with housing assistance programs to address housing instability affecting ${prevalence.housing_instability}% of patients`)
    }
  }
  
  // General recommendations
  recommendations.push("Continue monitoring disparity trends monthly and adjust interventions as needed")
  recommendations.push("Engage community health workers to address SDOH barriers in high-risk populations")
  
  return recommendations.slice(0, 5)
}

function generatePDFHTML(options: {
  reportType: string
  startDate: string
  endDate: string
  reportData: any
  executiveSummary: string
  keyFindings: string[]
  recommendations: string[]
}): string {
  const { reportType, startDate, endDate, reportData, executiveSummary, keyFindings, recommendations } = options
  const summary = reportData.disparity_summary
  const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Health Equity Report`
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.5; color: #1f2937; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 24pt; color: #1e40af; margin-bottom: 8px; border-bottom: 3px solid #3b82f6; padding-bottom: 12px; }
    h2 { font-size: 16pt; color: #1e40af; margin: 24px 0 12px; border-bottom: 1px solid #dbeafe; padding-bottom: 6px; }
    h3 { font-size: 13pt; color: #374151; margin: 16px 0 8px; }
    .header { text-align: center; margin-bottom: 32px; }
    .header .subtitle { color: #6b7280; font-size: 12pt; }
    .header .period { background: #dbeafe; padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 12px; font-weight: 500; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
    .summary-card .value { font-size: 28pt; font-weight: bold; }
    .summary-card .label { font-size: 10pt; color: #6b7280; margin-top: 4px; }
    .summary-card.critical .value { color: #dc2626; }
    .summary-card.warning .value { color: #f59e0b; }
    .summary-card.success .value { color: #16a34a; }
    .summary-card.info .value { color: #2563eb; }
    .alert-box { padding: 16px; border-radius: 8px; margin: 16px 0; }
    .alert-box.critical { background: #fef2f2; border: 1px solid #fecaca; }
    .alert-box.warning { background: #fffbeb; border: 1px solid #fed7aa; }
    .alert-box.info { background: #eff6ff; border: 1px solid #bfdbfe; }
    .alert-box h3 { margin-bottom: 8px; }
    .alert-box.critical h3 { color: #dc2626; }
    .alert-box.warning h3 { color: #d97706; }
    ul { padding-left: 20px; margin: 8px 0; }
    li { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; color: #374151; }
    tr:nth-child(even) { background: #f9fafb; }
    .status-critical { background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: 500; }
    .status-warning { background: #fffbeb; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: 500; }
    .status-none { background: #f0fdf4; color: #16a34a; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: 500; }
    .executive-summary { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .findings-list li { margin: 8px 0; padding: 8px 12px; background: #f9fafb; border-radius: 4px; }
    .recommendations-list li { margin: 8px 0; padding: 10px 14px; background: #f0fdf4; border-left: 3px solid #16a34a; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 9pt; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 ${reportTitle}</h1>
    <p class="subtitle">MASE Behavioral Health EMR - Health Equity Analysis</p>
    <div class="period">📅 Reporting Period: ${startDate} to ${endDate}</div>
  </div>

  <div class="summary-grid">
    <div class="summary-card critical">
      <div class="value">${summary.critical_count}</div>
      <div class="label">Critical Disparities</div>
    </div>
    <div class="summary-card warning">
      <div class="value">${summary.warning_count}</div>
      <div class="label">Warning Level</div>
    </div>
    <div class="summary-card success">
      <div class="value">${summary.at_target_count}</div>
      <div class="label">Meeting Targets</div>
    </div>
    <div class="summary-card info">
      <div class="value">${summary.average_disparity}%</div>
      <div class="label">Avg Disparity</div>
    </div>
  </div>

  <h2>📋 Executive Summary</h2>
  <div class="executive-summary">
    <p>${executiveSummary}</p>
  </div>

  ${summary.critical_disparities?.length > 0 ? `
  <div class="alert-box critical">
    <h3>⚠️ Critical Disparities Requiring Immediate Attention</h3>
    <ul>
      ${summary.critical_disparities.slice(0, 5).map((d: any) => `
        <li><strong>${d.group}</strong>: ${Math.abs(d.disparity)}% ${d.disparity < 0 ? 'lower' : 'higher'} ${d.metric || 'outcome'} (Current: ${d.value}%)</li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  <h2>📊 Key Findings</h2>
  <ul class="findings-list">
    ${keyFindings.map(f => `<li>${f}</li>`).join('')}
  </ul>

  <h2>📈 Stratified Outcomes by Demographics</h2>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Stratification</th>
        <th>Group</th>
        <th>Value</th>
        <th>Reference</th>
        <th>Disparity</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${(reportData.stratified_outcomes || []).flatMap((outcome: any) => 
        (outcome.groups || []).slice(0, 5).map((group: any) => `
          <tr>
            <td>${outcome.metric_name}</td>
            <td>${outcome.stratification_type}</td>
            <td>${group.group_name}</td>
            <td>${group.value}%</td>
            <td>${outcome.reference_value}%</td>
            <td>${group.disparity_from_reference >= 0 ? '+' : ''}${group.disparity_from_reference}%</td>
            <td><span class="status-${group.alert_level}">${group.alert_level}</span></td>
          </tr>
        `)
      ).join('')}
    </tbody>
  </table>

  ${reportData.sdoh_analysis ? `
  <div class="page-break"></div>
  <h2>🏠 Social Determinants of Health (SDOH) Analysis</h2>
  
  <h3>SDOH Domain Prevalence</h3>
  <table>
    <thead>
      <tr>
        <th>Domain</th>
        <th>Prevalence (%)</th>
        <th>Impact Level</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(reportData.sdoh_analysis.summary?.domain_prevalence || {}).map(([domain, value]: [string, any]) => `
        <tr>
          <td>${domain.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</td>
          <td>${value}%</td>
          <td><span class="status-${value > 30 ? 'critical' : value > 15 ? 'warning' : 'none'}">${value > 30 ? 'High' : value > 15 ? 'Moderate' : 'Low'}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3>Risk Distribution</h3>
  <div class="summary-grid">
    ${Object.entries(reportData.sdoh_analysis.summary?.risk_distribution || {}).map(([level, count]: [string, any]) => `
      <div class="summary-card ${level === 'very_high' || level === 'high' ? 'critical' : level === 'moderate' ? 'warning' : 'success'}">
        <div class="value">${count}</div>
        <div class="label">${level.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Risk</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${reportData.initiatives?.details?.length > 0 ? `
  <h2>🎯 Active Equity Improvement Initiatives</h2>
  <table>
    <thead>
      <tr>
        <th>Initiative</th>
        <th>Target Group</th>
        <th>Status</th>
        <th>Progress</th>
        <th>Enrolled</th>
      </tr>
    </thead>
    <tbody>
      ${reportData.initiatives.details.slice(0, 10).map((init: any) => `
        <tr>
          <td>${init.title}</td>
          <td>${init.target_demographic_value || 'N/A'}</td>
          <td>${init.status}</td>
          <td>${init.progress_percentage || 0}%</td>
          <td>${init.participants_enrolled || 0}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <h2>💡 Recommendations</h2>
  <ul class="recommendations-list">
    ${recommendations.map(r => `<li>${r}</li>`).join('')}
  </ul>

  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>MASE Behavioral Health EMR - Health Equity Dashboard</p>
    <p>This report is confidential and intended for authorized personnel only.</p>
  </div>
</body>
</html>`
}

