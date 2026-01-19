"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Heart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Users,
  Target,
  Activity,
  Home,
  Car,
  Utensils,
  Briefcase,
  HeartHandshake,
  Stethoscope,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import type { 
  HealthEquityDashboardResponse, 
  StratifiedOutcome, 
  HealthEquityInitiative,
  SdohSummary,
  StratificationType,
  AlertLevel 
} from "@/lib/health-equity-types"

// ============================================================================
// Summary Cards Component
// ============================================================================
interface SummaryCardsProps {
  summary: HealthEquityDashboardResponse["summary"]
}

export function HealthEquitySummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical Disparities</p>
              <p className="text-3xl font-bold text-red-600">{summary.critical_disparities}</p>
              <p className="text-xs text-muted-foreground">{summary.warning_disparities} warnings</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-100">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">At-Risk Populations</p>
              <p className="text-3xl font-bold text-amber-600">{summary.populations_at_risk}</p>
              <p className="text-xs text-muted-foreground">demographic groups</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Initiatives</p>
              <p className="text-3xl font-bold text-blue-600">{summary.active_initiatives}</p>
              <p className="text-xs text-muted-foreground">in progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Disparity Index</p>
              <p className="text-3xl font-bold text-purple-600">{summary.average_disparity_index.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">across all metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Disparity Chart Component
// ============================================================================
interface DisparityChartProps {
  outcome: StratifiedOutcome
}

function getAlertColor(level: AlertLevel): string {
  switch (level) {
    case "critical": return "#ef4444"
    case "warning": return "#f59e0b"
    default: return "#22c55e"
  }
}

export function DisparityBarChart({ outcome }: DisparityChartProps) {
  const chartData = outcome.groups.map(g => ({
    name: g.group_name,
    value: g.value,
    disparity: g.disparity_from_reference,
    color: getAlertColor(g.alert_level),
    population: g.population_count,
  }))
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{outcome.metric_name}</h4>
        <Badge variant="outline" className="text-xs">
          Reference: {outcome.reference_group} ({outcome.reference_value}%)
        </Badge>
      </div>
      
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="name" width={95} />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-white border rounded-lg p-2 shadow-lg">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm">Value: {data.value}%</p>
                    <p className="text-sm">Disparity: {data.disparity >= 0 ? '+' : ''}{data.disparity}%</p>
                    <p className="text-xs text-gray-500">n={data.population}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
          {outcome.benchmark_value && (
            <line x1={outcome.benchmark_value} y1={0} x2={outcome.benchmark_value} y2="100%" stroke="#6b7280" strokeDasharray="5 5" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================================
// Stratified Outcomes Panel
// ============================================================================
interface StratifiedOutcomesPanelProps {
  disparities: StratifiedOutcome[]
  selectedStratification: StratificationType
  onStratificationChange: (type: StratificationType) => void
}

export function StratifiedOutcomesPanel({ 
  disparities, 
  selectedStratification, 
  onStratificationChange 
}: StratifiedOutcomesPanelProps) {
  const filteredDisparities = disparities.filter(d => d.stratification_type === selectedStratification)
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Outcome Disparities by Demographics
            </CardTitle>
            <CardDescription>Treatment outcomes stratified by demographic groups</CardDescription>
          </div>
          <Select value={selectedStratification} onValueChange={(v) => onStratificationChange(v as StratificationType)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select stratification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="race">Race</SelectItem>
              <SelectItem value="ethnicity">Ethnicity</SelectItem>
              <SelectItem value="insurance_type">Insurance Type</SelectItem>
              <SelectItem value="geography">Geography</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDisparities.length > 0 ? (
          <div className="space-y-8">
            {filteredDisparities.map((outcome, idx) => (
              <DisparityBarChart key={idx} outcome={outcome} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No disparity data available for this stratification
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SDOH Impact Panel
// ============================================================================
interface SdohPanelProps {
  sdohSummary: SdohSummary
}

const SDOH_ICONS: Record<string, any> = {
  housing_instability: Home,
  food_insecurity: Utensils,
  transportation_barrier: Car,
  employment_barrier: Briefcase,
  social_isolation: HeartHandshake,
  healthcare_access_barrier: Stethoscope,
}

export function SdohImpactPanel({ sdohSummary }: SdohPanelProps) {
  const domainData = Object.entries(sdohSummary.domain_prevalence).map(([key, value]) => ({
    domain: key,
    label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    prevalence: value,
    Icon: SDOH_ICONS[key] || Activity,
  }))
  
  const riskData = [
    { name: "Low", value: sdohSummary.risk_distribution.low, color: "#22c55e" },
    { name: "Moderate", value: sdohSummary.risk_distribution.moderate, color: "#f59e0b" },
    { name: "High", value: sdohSummary.risk_distribution.high, color: "#f97316" },
    { name: "Very High", value: sdohSummary.risk_distribution.very_high, color: "#ef4444" },
  ]
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Social Determinants of Health Impact
        </CardTitle>
        <CardDescription>
          SDOH screening and correlation with treatment outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SDOH Domain Prevalence */}
          <div className="space-y-4">
            <h4 className="font-medium">SDOH Domain Prevalence</h4>
            <div className="space-y-3">
              {domainData.map((domain) => {
                const Icon = domain.Icon
                return (
                  <div key={domain.domain} className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{domain.label}</span>
                        <span className="text-sm font-medium">{domain.prevalence}%</span>
                      </div>
                      <Progress 
                        value={domain.prevalence} 
                        className="h-2"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patients Screened</span>
                <span className="font-medium">{sdohSummary.total_patients_screened}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Screening Rate</span>
                <span className="font-medium">{sdohSummary.screening_rate}%</span>
              </div>
            </div>
          </div>
          
          {/* Risk Distribution */}
          <div className="space-y-4">
            <h4 className="font-medium">SDOH Risk Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Patients">
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Outcome Correlation */}
            {sdohSummary.sdoh_outcome_correlation.length > 0 && (
              <div className="pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Impact on Retention</h5>
                <div className="space-y-2">
                  {sdohSummary.sdoh_outcome_correlation.slice(0, 3).map((corr) => (
                    <div key={corr.domain} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{corr.domain_label}</span>
                      <span className={`font-medium ${corr.retention_impact < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {corr.retention_impact >= 0 ? '+' : ''}{corr.retention_impact}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Initiatives Panel
// ============================================================================
interface InitiativesPanelProps {
  initiatives: HealthEquityInitiative[]
  onRefresh?: () => void
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active": return "bg-green-100 text-green-800"
    case "planning": return "bg-blue-100 text-blue-800"
    case "paused": return "bg-yellow-100 text-yellow-800"
    case "completed": return "bg-purple-100 text-purple-800"
    case "cancelled": return "bg-gray-100 text-gray-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export function InitiativesPanel({ initiatives, onRefresh }: InitiativesPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Equity Improvement Initiatives</CardTitle>
            <CardDescription>Active programs addressing health disparities</CardDescription>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {initiatives.length > 0 ? (
          <div className="space-y-4">
            {initiatives.map((initiative) => (
              <div 
                key={initiative.id} 
                className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{initiative.title}</h4>
                      <Badge className={getStatusColor(initiative.status)}>
                        {initiative.status}
                      </Badge>
                    </div>
                    {initiative.target_demographic_value && (
                      <p className="text-sm text-muted-foreground">
                        Target: {initiative.target_demographic_value}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setExpanded(expanded === initiative.id ? null : initiative.id)}
                  >
                    {expanded === initiative.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{initiative.progress_percentage || 0}%</span>
                    </div>
                    <Progress value={initiative.progress_percentage || 0} className="h-2" />
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Enrolled</p>
                    <p className="font-medium">{initiative.participants_enrolled}</p>
                  </div>
                </div>
                
                {expanded === initiative.id && (
                  <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                    {initiative.description && (
                      <p className="text-muted-foreground">{initiative.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {initiative.baseline_value !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Baseline: </span>
                          <span className="font-medium">{initiative.baseline_value}%</span>
                        </div>
                      )}
                      {initiative.target_value !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Target: </span>
                          <span className="font-medium">{initiative.target_value}%</span>
                        </div>
                      )}
                      {initiative.lead_contact && (
                        <div>
                          <span className="text-muted-foreground">Lead: </span>
                          <span className="font-medium">{initiative.lead_contact}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Start: </span>
                        <span className="font-medium">
                          {new Date(initiative.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No active initiatives found
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Identified Disparities Alert Panel
// ============================================================================
interface DisparitiesAlertProps {
  disparities: StratifiedOutcome[]
}

export function IdentifiedDisparitiesAlert({ disparities }: DisparitiesAlertProps) {
  // Find critical and warning disparities
  const criticalDisparities: { metric: string; group: string; disparity: number }[] = []
  const warningDisparities: { metric: string; group: string; disparity: number }[] = []
  
  for (const outcome of disparities) {
    for (const group of outcome.groups) {
      if (group.alert_level === "critical") {
        criticalDisparities.push({
          metric: outcome.metric_name,
          group: group.group_name,
          disparity: group.disparity_from_reference,
        })
      } else if (group.alert_level === "warning") {
        warningDisparities.push({
          metric: outcome.metric_name,
          group: group.group_name,
          disparity: group.disparity_from_reference,
        })
      }
    }
  }
  
  if (criticalDisparities.length === 0 && warningDisparities.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800">
            <TrendingUp className="h-5 w-5" />
            <span className="font-medium">No significant disparities identified</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            All demographic groups are within acceptable equity thresholds.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="font-medium text-red-800">Identified Disparities</span>
        </div>
        <ul className="text-sm text-red-700 space-y-1">
          {criticalDisparities.slice(0, 5).map((d, idx) => (
            <li key={idx}>
              • {Math.abs(d.disparity)}% {d.disparity < 0 ? 'lower' : 'higher'} {d.metric.toLowerCase()} for {d.group} patients
            </li>
          ))}
          {warningDisparities.slice(0, 3).map((d, idx) => (
            <li key={idx} className="text-amber-700">
              • {Math.abs(d.disparity)}% {d.disparity < 0 ? 'lower' : 'higher'} {d.metric.toLowerCase()} for {d.group} patients
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Health Equity Dashboard Component
// ============================================================================
interface HealthEquityDashboardProps {
  initialData?: HealthEquityDashboardResponse
}

export function HealthEquityDashboard({ initialData }: HealthEquityDashboardProps) {
  const [loading, setLoading] = useState(!initialData)
  const [data, setData] = useState<HealthEquityDashboardResponse | null>(initialData || null)
  const [error, setError] = useState<string | null>(null)
  const [selectedStratification, setSelectedStratification] = useState<StratificationType>("race")
  const [activeTab, setActiveTab] = useState("overview")
  const [exporting, setExporting] = useState(false)
  
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/research/health-equity")
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch health equity data")
      }
      
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])
  
  const handleExport = async (format: "json" | "csv" | "summary" | "pdf", reportType: "monthly" | "quarterly" | "annual" = "monthly") => {
    setExporting(true)
    try {
      if (format === "pdf") {
        // Fetch report data
        const response = await fetch(`/api/research/health-equity/reports?report_type=${reportType}&format=json`)
        if (!response.ok) throw new Error("Failed to fetch report data")
        const reportData = await response.json()
        
        // Dynamically import jsPDF and jspdf-autotable
        const [jsPDFModule, autoTableModule] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable")
        ])
        
        const jsPDF = jsPDFModule.default
        let autoTable = (autoTableModule as any).autoTable || (autoTableModule as any).default
        
        if (!autoTable && (autoTableModule as any).applyPlugin) {
          (autoTableModule as any).applyPlugin(jsPDF)
          autoTable = null
        }
        
        // Create PDF
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 15
        let yPos = margin
        
        // Helper function for autoTable
        const hasAutoTableFunction = typeof autoTable === 'function'
        const hasAutoTableMethod = typeof (doc as any).autoTable === 'function'
        
        const callAutoTable = (options: any) => {
          if (hasAutoTableFunction) {
            autoTable(doc, options)
          } else {
            (doc as any).autoTable(options)
          }
        }
        
        // Helper for page breaks
        const checkPageBreak = (requiredSpace: number) => {
          if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage()
            yPos = margin
          }
        }
        
        // Report period label
        const periodLabel = reportType.charAt(0).toUpperCase() + reportType.slice(1)
        const summary = reportData.disparity_summary || {}
        
        // ========== HEADER ==========
        doc.setFillColor(30, 64, 175) // Blue header
        doc.rect(0, 0, pageWidth, 35, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(20)
        doc.setFont("helvetica", "bold")
        doc.text(`${periodLabel} Health Equity Report`, margin, 18)
        
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`MASE Behavioral Health EMR - Generated: ${new Date().toLocaleDateString()}`, margin, 28)
        
        doc.setTextColor(0, 0, 0)
        yPos = 45
        
        // ========== REPORTING PERIOD ==========
        doc.setFillColor(219, 234, 254)
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, 'F')
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text(`Reporting Period: ${reportData.period?.start || 'N/A'} to ${reportData.period?.end || 'N/A'}`, margin + 5, yPos + 8)
        yPos += 20
        
        // ========== SUMMARY CARDS ==========
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Summary Overview", margin, yPos)
        yPos += 8
        
        const summaryData = [
          ["Metric", "Value"],
          ["Critical Disparities", String(summary.critical_count || 0)],
          ["Warning Level", String(summary.warning_count || 0)],
          ["Meeting Targets", String(summary.at_target_count || 0)],
          ["Average Disparity", `${summary.average_disparity || 0}%`],
          ["Total Metrics Tracked", String(summary.total_metrics_tracked || 0)],
          ["Demographic Groups Analyzed", String(summary.total_groups_tracked || 0)],
        ]
        
        callAutoTable({
          startY: yPos,
          head: [summaryData[0]],
          body: summaryData.slice(1),
          theme: "striped",
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
        })
        yPos = (doc as any).lastAutoTable.finalY + 15
        
        // ========== EXECUTIVE SUMMARY ==========
        checkPageBreak(40)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Executive Summary", margin, yPos)
        yPos += 8
        
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        const execSummary = reportData.executive_summary || `This report analyzes health equity across ${summary.total_metrics_tracked || 0} key metrics and ${summary.total_groups_tracked || 0} demographic groups.`
        const summaryLines = doc.splitTextToSize(execSummary, pageWidth - margin * 2)
        doc.text(summaryLines, margin, yPos)
        yPos += summaryLines.length * 5 + 10
        
        // ========== CRITICAL DISPARITIES ==========
        if (summary.critical_disparities && summary.critical_disparities.length > 0) {
          checkPageBreak(50)
          doc.setFillColor(254, 242, 242)
          doc.setDrawColor(220, 38, 38)
          doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8 + summary.critical_disparities.length * 6, 2, 2, 'FD')
          
          doc.setTextColor(220, 38, 38)
          doc.setFontSize(11)
          doc.setFont("helvetica", "bold")
          doc.text("⚠ Critical Disparities Requiring Immediate Attention", margin + 3, yPos + 6)
          yPos += 12
          
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
          summary.critical_disparities.slice(0, 5).forEach((d: any) => {
            const text = `• ${d.group}: ${Math.abs(d.disparity || 0)}% ${(d.disparity || 0) < 0 ? 'lower' : 'higher'} ${d.metric || 'outcome'} (Current: ${d.value || 0}%)`
            doc.text(text, margin + 5, yPos)
            yPos += 5
          })
          yPos += 10
        }
        
        // ========== KEY FINDINGS ==========
        if (reportData.key_findings && reportData.key_findings.length > 0) {
          checkPageBreak(40)
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text("Key Findings", margin, yPos)
          yPos += 8
          
          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
          reportData.key_findings.slice(0, 5).forEach((finding: string) => {
            const lines = doc.splitTextToSize(`• ${finding}`, pageWidth - margin * 2 - 5)
            doc.text(lines, margin + 3, yPos)
            yPos += lines.length * 4 + 3
          })
          yPos += 8
        }
        
        // ========== STRATIFIED OUTCOMES TABLE ==========
        if (reportData.stratified_outcomes && reportData.stratified_outcomes.length > 0) {
          checkPageBreak(60)
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text("Stratified Outcomes by Demographics", margin, yPos)
          yPos += 8
          
          const outcomeRows: any[] = []
          reportData.stratified_outcomes.forEach((outcome: any) => {
            (outcome.groups || []).slice(0, 3).forEach((group: any) => {
              outcomeRows.push([
                outcome.metric_name || 'N/A',
                outcome.stratification_type || 'N/A',
                group.group_name || 'N/A',
                `${group.value || 0}%`,
                `${outcome.reference_value || 0}%`,
                `${(group.disparity_from_reference || 0) >= 0 ? '+' : ''}${group.disparity_from_reference || 0}%`,
                group.alert_level || 'none',
              ])
            })
          })
          
          if (outcomeRows.length > 0) {
            callAutoTable({
              startY: yPos,
              head: [["Metric", "Stratification", "Group", "Value", "Reference", "Disparity", "Status"]],
              body: outcomeRows.slice(0, 15),
              theme: "striped",
              headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
              margin: { left: margin, right: margin },
              styles: { fontSize: 7, cellPadding: 2 },
              columnStyles: {
                0: { cellWidth: 35 },
                6: { cellWidth: 18 },
              },
            })
            yPos = (doc as any).lastAutoTable.finalY + 15
          }
        }
        
        // ========== SDOH ANALYSIS ==========
        if (reportData.sdoh_analysis?.summary) {
          checkPageBreak(60)
          doc.addPage()
          yPos = margin
          
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text("Social Determinants of Health (SDOH) Analysis", margin, yPos)
          yPos += 10
          
          const sdohSummary = reportData.sdoh_analysis.summary
          const sdohRows = Object.entries(sdohSummary.domain_prevalence || {}).map(([domain, value]) => [
            domain.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            `${value}%`,
            (value as number) > 30 ? 'High' : (value as number) > 15 ? 'Moderate' : 'Low',
          ])
          
          if (sdohRows.length > 0) {
            callAutoTable({
              startY: yPos,
              head: [["SDOH Domain", "Prevalence", "Impact Level"]],
              body: sdohRows,
              theme: "striped",
              headStyles: { fillColor: [30, 64, 175] },
              margin: { left: margin, right: margin },
              styles: { fontSize: 9 },
            })
            yPos = (doc as any).lastAutoTable.finalY + 15
          }
          
          // Risk Distribution
          const riskDist = sdohSummary.risk_distribution || {}
          const riskRows = Object.entries(riskDist).map(([level, count]) => [
            level.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            String(count),
          ])
          
          if (riskRows.length > 0) {
            doc.setFontSize(12)
            doc.setFont("helvetica", "bold")
            doc.text("SDOH Risk Distribution", margin, yPos)
            yPos += 8
            
            callAutoTable({
              startY: yPos,
              head: [["Risk Level", "Patient Count"]],
              body: riskRows,
              theme: "striped",
              headStyles: { fillColor: [30, 64, 175] },
              margin: { left: margin, right: margin },
              styles: { fontSize: 9 },
            })
            yPos = (doc as any).lastAutoTable.finalY + 15
          }
        }
        
        // ========== INITIATIVES ==========
        if (reportData.initiatives?.details && reportData.initiatives.details.length > 0) {
          checkPageBreak(60)
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text("Active Equity Improvement Initiatives", margin, yPos)
          yPos += 8
          
          const initiativeRows = reportData.initiatives.details.slice(0, 10).map((init: any) => [
            init.title || 'N/A',
            init.target_demographic_value || 'N/A',
            init.status || 'N/A',
            `${init.progress_percentage || 0}%`,
            String(init.participants_enrolled || 0),
          ])
          
          callAutoTable({
            startY: yPos,
            head: [["Initiative", "Target Group", "Status", "Progress", "Enrolled"]],
            body: initiativeRows,
            theme: "striped",
            headStyles: { fillColor: [30, 64, 175] },
            margin: { left: margin, right: margin },
            styles: { fontSize: 8 },
          })
          yPos = (doc as any).lastAutoTable.finalY + 15
        }
        
        // ========== RECOMMENDATIONS ==========
        if (reportData.recommendations && reportData.recommendations.length > 0) {
          checkPageBreak(50)
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text("Recommendations", margin, yPos)
          yPos += 8
          
          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
          reportData.recommendations.forEach((rec: string, idx: number) => {
            checkPageBreak(15)
            const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, pageWidth - margin * 2 - 5)
            doc.text(lines, margin + 3, yPos)
            yPos += lines.length * 4 + 4
          })
        }
        
        // ========== FOOTER ==========
        const totalPages = doc.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i)
          doc.setFontSize(8)
          doc.setTextColor(128, 128, 128)
          doc.text(
            `Page ${i} of ${totalPages} | MASE Behavioral Health EMR - Health Equity Dashboard | Confidential`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          )
        }
        
        // Save PDF
        doc.save(`health-equity-${reportType}-report-${new Date().toISOString().split("T")[0]}.pdf`)
        
      } else {
        // CSV and JSON exports
        const response = await fetch(`/api/research/health-equity/reports?report_type=${reportType}&format=${format}`)
        
        if (!response.ok) {
          throw new Error("Failed to generate report")
        }
        
        if (format === "csv") {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `health-equity-${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `health-equity-${reportType}-report-${new Date().toISOString().split("T")[0]}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
    } catch (err) {
      console.error("Export error:", err)
      alert("Failed to export report. Please try again.")
    } finally {
      setExporting(false)
    }
  }
  
  useEffect(() => {
    if (!initialData) {
      fetchData()
    }
  }, [fetchData, initialData])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading health equity data...</span>
      </div>
    )
  }
  
  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No health equity data available
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-600" />
            Health Equity Dashboard
          </h2>
          <p className="text-muted-foreground">Monitor and address disparities across demographic groups</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">PDF Reports</div>
              <DropdownMenuItem onClick={() => handleExport("pdf", "monthly")}>
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                Monthly Report (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf", "quarterly")}>
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                Quarterly Report (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf", "annual")}>
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                Annual Report (PDF)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">CSV Exports</div>
              <DropdownMenuItem onClick={() => handleExport("csv", "monthly")}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                Monthly Report (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv", "quarterly")}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                Quarterly Report (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv", "annual")}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                Annual Report (CSV)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Data Exports</div>
              <DropdownMenuItem onClick={() => handleExport("json", "monthly")}>
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Full Data Export (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("summary", "quarterly")}>
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Executive Summary (JSON)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Summary Cards */}
      <HealthEquitySummaryCards summary={data.summary} />
      
      {/* Identified Disparities Alert */}
      <IdentifiedDisparitiesAlert disparities={data.disparities} />
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Disparity Overview</TabsTrigger>
          <TabsTrigger value="sdoh">SDOH Impact</TabsTrigger>
          <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <StratifiedOutcomesPanel 
            disparities={data.disparities}
            selectedStratification={selectedStratification}
            onStratificationChange={setSelectedStratification}
          />
        </TabsContent>
        
        <TabsContent value="sdoh">
          <SdohImpactPanel sdohSummary={data.sdoh_summary} />
        </TabsContent>
        
        <TabsContent value="initiatives">
          <InitiativesPanel 
            initiatives={data.initiatives} 
            onRefresh={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default HealthEquityDashboard

