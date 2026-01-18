"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Shield,
  FileText,
  AlertTriangle,
  Users,
  BarChart3,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Fingerprint,
  MapPin,
  Smartphone,
  ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const supabase = createBrowserClient()

export default function DEAPortalPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")

  // Data states
  const [diversionReports, setDiversionReports] = useState<any[]>([])
  const [complianceAlerts, setComplianceAlerts] = useState<any[]>([])
  const [scanLogs, setScanLogs] = useState<any[]>([])
  const [dispensingLogs, setDispensingLogs] = useState<any[]>([])
  const [inventoryRecords, setInventoryRecords] = useState<any[]>([])
  const [riskScores, setRiskScores] = useState<any[]>([])
  const [stats, setStats] = useState({
    overallCompliance: 0,
    activeViolations: 0,
    diversionAlerts: 0,
    pendingSync: 0,
    totalDispensed: 0,
    totalScans: 0,
    successfulScans: 0,
    highRiskPatients: 0,
    locationViolations: 0,
    timeViolations: 0,
    biometricFailures: 0,
  })

  const fetchDEAData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch DEA diversion reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("dea_diversion_reports")
        .select("*")
        .order("reported_at", { ascending: false })
        .limit(200)

      if (reportsError) console.error("Reports error:", reportsError)

      // Fetch compliance alerts from take-home system
      const { data: alertsData, error: alertsError } = await supabase
        .from("takehome_compliance_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (alertsError) console.error("Alerts error:", alertsError)

      // Fetch scan verification logs
      const { data: scansData, error: scansError } = await supabase
        .from("takehome_scan_logs")
        .select("*")
        .order("scan_timestamp", { ascending: false })
        .limit(500)

      if (scansError) console.error("Scans error:", scansError)

      // Fetch dispensing logs
      const { data: dosingData, error: dosingError } = await supabase
        .from("dosing_log")
        .select("*")
        .order("dose_date", { ascending: false })
        .limit(200)

      if (dosingError) console.error("Dosing error:", dosingError)

      // Fetch inventory records
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("medication_inventory")
        .select("*")
        .order("created_at", { ascending: false })

      if (inventoryError) console.error("Inventory error:", inventoryError)

      // Fetch risk scores
      const { data: riskData, error: riskError } = await supabase
        .from("patient_diversion_risk_scores")
        .select("*")
        .order("assessment_date", { ascending: false })

      if (riskError) console.error("Risk error:", riskError)

      setDiversionReports(reportsData || [])
      setComplianceAlerts(alertsData || [])
      setScanLogs(scansData || [])
      setDispensingLogs(dosingData || [])
      setInventoryRecords(inventoryData || [])
      setRiskScores(riskData || [])

      // Calculate comprehensive stats
      const openAlerts = (alertsData || []).filter((a: any) => a.status === "open").length
      const totalScans = (scansData || []).length
      const successfulScans = (scansData || []).filter((s: any) => s.verification_status === "success").length
      const complianceRate = totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 100
      const totalDispensed = (dosingData || []).reduce((sum: number, d: any) => sum + (d.dose_amount || 0), 0)
      const locationViolations = (scansData || []).filter((s: any) => !s.is_within_geofence).length
      const timeViolations = (scansData || []).filter((s: any) => !s.is_within_dosing_window).length
      const biometricFailures = (scansData || []).filter((s: any) => !s.biometric_verified).length
      const highRiskPatients = (riskData || []).filter(
        (r: any) => r.risk_level === "high" || r.risk_level === "critical",
      ).length
      const pendingSync = (reportsData || []).filter((r: any) => r.sync_status === "pending").length

      setStats({
        overallCompliance: complianceRate,
        activeViolations: openAlerts,
        diversionAlerts: (alertsData || []).filter(
          (a: any) => a.alert_type === "location_violation" || a.alert_type === "biometric_failure",
        ).length,
        pendingSync,
        totalDispensed,
        totalScans,
        successfulScans,
        highRiskPatients,
        locationViolations,
        timeViolations,
        biometricFailures,
      })
    } catch (error) {
      console.error("Error fetching DEA data:", error)
      toast.error("Failed to load DEA compliance data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDEAData()
  }, [fetchDEAData])

  const generateComplianceReport = async (reportType: string) => {
    toast.success(`Generating ${reportType} report...`)
    // In production, this would generate a PDF report
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
      case "complete":
      case "success":
      case "synced":
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Compliant</Badge>
      case "warning":
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "violation":
      case "failed":
      case "open":
        return <Badge className="bg-red-100 text-red-800">Violation</Badge>
      case "reported_to_dea":
        return <Badge className="bg-blue-100 text-blue-800">Reported</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-500 text-white">Critical</Badge>
      case "high":
        return <Badge className="bg-orange-500 text-white">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>
      default:
        return <Badge className="bg-blue-500 text-white">Low</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-blue-900 text-white p-6">
          <Skeleton className="h-12 w-64 bg-blue-800" />
        </div>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* DEA Header */}
      <div className="bg-blue-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">DEA Compliance Portal</h1>
                <p className="text-blue-200">Drug Enforcement Administration - Diversion Control Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/regulatory">
                <Button variant="outline" className="text-white border-white hover:bg-blue-800 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Button
                variant="outline"
                className="text-white border-white hover:bg-blue-800 bg-transparent"
                onClick={fetchDEAData}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Compliance Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.overallCompliance >= 90
                    ? "text-green-600"
                    : stats.overallCompliance >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {stats.overallCompliance}%
              </div>
              <p className="text-xs text-muted-foreground">Overall verification success</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.activeViolations}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Location Violations</CardTitle>
              <MapPin className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.locationViolations}</div>
              <p className="text-xs text-muted-foreground">Outside geofence</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Biometric Failures</CardTitle>
              <Fingerprint className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.biometricFailures}</div>
              <p className="text-xs text-muted-foreground">Failed verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Patients</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highRiskPatients}</div>
              <p className="text-xs text-muted-foreground">Need review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScans}</div>
              <p className="text-xs text-muted-foreground">{stats.successfulScans} successful</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="diversion">Diversion Reports</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Alerts</TabsTrigger>
            <TabsTrigger value="scans">Verification Scans</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessments</TabsTrigger>
            <TabsTrigger value="dispensing">Dispensing Logs</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="reports">Generate Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Diversion Alerts</CardTitle>
                  <CardDescription>Events synced from Take-Home Diversion Control</CardDescription>
                </CardHeader>
                <CardContent>
                  {complianceAlerts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                      <p className="text-muted-foreground">No alerts - all clear</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {complianceAlerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{alert.alert_type?.replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getSeverityBadge(alert.severity)}
                            {getStatusBadge(alert.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Summary</CardTitle>
                  <CardDescription>Key DEA compliance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Verification Success Rate</span>
                      <Badge
                        className={
                          stats.overallCompliance >= 90
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {stats.overallCompliance}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Location Compliance</span>
                      <Badge
                        className={
                          stats.totalScans - stats.locationViolations > stats.totalScans * 0.9
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {stats.totalScans > 0
                          ? Math.round(((stats.totalScans - stats.locationViolations) / stats.totalScans) * 100)
                          : 100}
                        %
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Biometric Compliance</span>
                      <Badge
                        className={
                          stats.totalScans - stats.biometricFailures > stats.totalScans * 0.9
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {stats.totalScans > 0
                          ? Math.round(((stats.totalScans - stats.biometricFailures) / stats.totalScans) * 100)
                          : 100}
                        %
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Time Window Compliance</span>
                      <Badge
                        className={
                          stats.totalScans - stats.timeViolations > stats.totalScans * 0.9
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {stats.totalScans > 0
                          ? Math.round(((stats.totalScans - stats.timeViolations) / stats.totalScans) * 100)
                          : 100}
                        %
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Reports Synced</span>
                      <Badge className="bg-blue-100 text-blue-800">{diversionReports.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Diversion Reports Tab */}
          <TabsContent value="diversion" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Diversion Control Reports</CardTitle>
                    <CardDescription>Events synced from the Take-Home Diversion Control System</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {diversionReports.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Diversion Reports</p>
                    <p className="text-muted-foreground">
                      Reports will appear when events are synced from the diversion control system
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>DEA Reference</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Sync Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diversionReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>{new Date(report.reported_at).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-sm">{report.dea_reference_number || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.event_type?.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(report.sync_status)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Alerts Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Alerts</CardTitle>
                <CardDescription>Active compliance issues from take-home verification</CardDescription>
              </CardHeader>
              <CardContent>
                {complianceAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <p className="text-lg font-medium">All Clear</p>
                    <p className="text-muted-foreground">No compliance alerts at this time</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Alert Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complianceAlerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>{new Date(alert.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{alert.alert_type?.replace(/_/g, " ")}</TableCell>
                          <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{alert.alert_description}</TableCell>
                          <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Scans Tab */}
          <TabsContent value="scans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Verification Scans</CardTitle>
                <CardDescription>Take-home medication verification records with GPS and biometrics</CardDescription>
              </CardHeader>
              <CardContent>
                {scanLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Scan Records</p>
                    <p className="text-muted-foreground">Verification scans will appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Time Window</TableHead>
                        <TableHead>Biometric</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scanLogs.slice(0, 50).map((scan) => (
                        <TableRow key={scan.id}>
                          <TableCell>{new Date(scan.scan_timestamp).toLocaleString()}</TableCell>
                          <TableCell>
                            {scan.is_within_geofence ? (
                              <Badge className="bg-green-100 text-green-800">Pass</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Fail</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {scan.is_within_dosing_window ? (
                              <Badge className="bg-green-100 text-green-800">Pass</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Fail</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {scan.biometric_verified ? (
                              <Badge className="bg-green-100 text-green-800">
                                {((scan.biometric_confidence || 0) * 100).toFixed(0)}%
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Fail</Badge>
                            )}
                          </TableCell>
                          <TableCell>{scan.distance_from_home_feet?.toFixed(0) || "N/A"} ft</TableCell>
                          <TableCell>
                            {scan.verification_status === "success" ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Assessments Tab */}
          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Diversion Risk Assessments</CardTitle>
                <CardDescription>AI-calculated risk scores based on compliance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {riskScores.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Risk Assessments</p>
                    <p className="text-muted-foreground">Patient risk scores will appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assessment Date</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Compliance Score</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Biometric</TableHead>
                        <TableHead>Recommendation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {riskScores.map((score) => (
                        <TableRow key={score.id}>
                          <TableCell>{new Date(score.assessment_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                score.risk_level === "critical"
                                  ? "bg-red-500 text-white"
                                  : score.risk_level === "high"
                                    ? "bg-orange-500 text-white"
                                    : score.risk_level === "medium"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-green-500 text-white"
                              }
                            >
                              {score.risk_level}
                            </Badge>
                          </TableCell>
                          <TableCell>{((score.compliance_score || 0) * 100).toFixed(0)}%</TableCell>
                          <TableCell>{((score.location_compliance_rate || 0) * 100).toFixed(0)}%</TableCell>
                          <TableCell>{((score.time_compliance_rate || 0) * 100).toFixed(0)}%</TableCell>
                          <TableCell>{((score.biometric_success_rate || 0) * 100).toFixed(0)}%</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {score.takehome_recommendation || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dispensing Logs Tab */}
          <TabsContent value="dispensing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dispensing Logs</CardTitle>
                <CardDescription>Controlled substance dispensing records</CardDescription>
              </CardHeader>
              <CardContent>
                {dispensingLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Dispensing Records</p>
                    <p className="text-muted-foreground">Dispensing logs will appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Medication</TableHead>
                        <TableHead>Dose</TableHead>
                        <TableHead>Bottle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispensingLogs.slice(0, 50).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.dose_date}</TableCell>
                          <TableCell>{log.dose_time}</TableCell>
                          <TableCell>{log.medication || "Methadone"}</TableCell>
                          <TableCell>{log.dose_amount} mg</TableCell>
                          <TableCell>{log.bottle_number || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Controlled Substance Inventory</CardTitle>
                <CardDescription>Current inventory of DEA-regulated substances</CardDescription>
              </CardHeader>
              <CardContent>
                {inventoryRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Inventory Records</p>
                    <p className="text-muted-foreground">Inventory data will appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>NDC</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryRecords.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.medication_name}</TableCell>
                          <TableCell className="font-mono text-sm">{item.ndc_code}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.dea_schedule}</Badge>
                          </TableCell>
                          <TableCell>{item.lot_number}</TableCell>
                          <TableCell>
                            {item.quantity_on_hand} {item.unit_of_measure}
                          </TableCell>
                          <TableCell>{item.expiration_date}</TableCell>
                          <TableCell>{item.location}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>DEA Inspection Reports</CardTitle>
                  <CardDescription>One-click compliance reports for DEA inspections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => generateComplianceReport("Take-Home Compliance Summary")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Take-Home Compliance Summary
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => generateComplianceReport("Diversion Risk Assessment")}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Diversion Risk Assessment Report
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => generateComplianceReport("QR Verification Audit")}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    QR Code Verification Audit
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => generateComplianceReport("Biometric Compliance")}
                  >
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Biometric Compliance Report
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => generateComplianceReport("Location Geofence Report")}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Location Geofence Report
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => generateComplianceReport("Patient Risk Profiles")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Patient Risk Profiles
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>Download compliance data for external analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Diversion Reports (CSV)
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Scan Logs (CSV)
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Risk Assessments (CSV)
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Inventory Records (CSV)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
