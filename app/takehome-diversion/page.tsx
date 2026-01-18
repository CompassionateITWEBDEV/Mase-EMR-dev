// Find the existing state declarations and add these new ones

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, RefreshCw, Eye, Send } from "lucide-react"

interface Alert {
  id: string
  patient_id: string
  patient_name?: string
  alert_type: string
  severity: string
  alert_title: string
  alert_description: string
  status: string
  created_at: string
  scheduled_date: string
  callback_required: boolean
  violation_details: any
}

interface RiskScore {
  id: string
  patient_id: string
  patient_name?: string
  risk_level: string
  compliance_score: number
  location_compliance_rate: number
  biometric_success_rate: number
  missed_doses_30_days: number
  assessment_date: string
}

interface LocationException {
  id: string
  patient_id: string
  patient_name?: string
  exception_type: string
  reason: string
  temporary_address: string
  start_date: string
  end_date: string
  status: string
  requested_at: string
}

interface ScanLog {
  id: string
  patient_id: string
  patient_name?: string
  scan_timestamp: string
  verification_status: string
  is_within_geofence: boolean
  is_within_dosing_window: boolean
  biometric_verified: boolean
  distance_from_home_feet: number
}

export default function TakeHomeDiversionPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [riskScores, setRiskScores] = useState<RiskScore[]>([])
  const [locationExceptions, setLocationExceptions] = useState<LocationException[]>([])
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [alertDetailOpen, setAlertDetailOpen] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false)
  const [scanLogFilter, setScanLogFilter] = useState("all")
  const [syncing, setSyncing] = useState(false)

  // Settings state
  const [geofenceRadius, setGeofenceRadius] = useState("500")
  const [locationTolerance, setLocationTolerance] = useState("50")
  const [gpsAccuracy, setGpsAccuracy] = useState("20")
  const [dosingWindowStart, setDosingWindowStart] = useState("06:00")
  const [dosingWindowEnd, setDosingWindowEnd] = useState("10:00")
  const [weekendWindowEnd, setWeekendWindowEnd] = useState("12:00")
  const [biometricThreshold, setBiometricThreshold] = useState("85")
  const [maxBiometricAttempts, setMaxBiometricAttempts] = useState("3")
  const [requireLiveness, setRequireLiveness] = useState("yes")
  const [missedDoseDelay, setMissedDoseDelay] = useState("2")
  const [autoCallbackDoses, setAutoCallbackDoses] = useState("2")
  const [notifySponsor, setNotifySponsor] = useState("yes")
  const [savingGeofence, setSavingGeofence] = useState(false)
  const [savingDosing, setSavingDosing] = useState(false)
  const [savingBiometric, setSavingBiometric] = useState(false)
  const [savingAlert, setSavingAlert] = useState(false)

  // New exception form state
  const [newException, setNewException] = useState({
    patientId: "",
    exceptionType: "travel",
    reason: "",
    temporaryAddress: "",
    startDate: "",
    endDate: "",
  })

  // Stats calculated from data
  const [stats, setStats] = useState({
    totalScans: 0,
    compliantScans: 0,
    locationViolations: 0,
    biometricFailures: 0,
    complianceRate: 0,
  })

  // State callback policy tracking
  const [callbackPolicies, setCallbackPolicies] = useState<any[]>([])
  const [callbackLogs, setCallbackLogs] = useState<any[]>([])
  const [showCallbackDialog, setShowCallbackDialog] = useState(false)
  const [selectedPatientForCallback, setSelectedPatientForCallback] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchAllData()
    fetchSettings()
    fetchCallbackPolicies() // Fetch callback policies on load
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/takehome-diversion/settings")
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setGeofenceRadius(data.default_geofence_radius_feet?.toString() || "500")
          setDosingWindowStart(data.dosing_window_start || "06:00")
          setDosingWindowEnd(data.dosing_window_end || "10:00")
          setBiometricThreshold(data.biometric_confidence_threshold?.toString() || "85")
          setRequireLiveness(data.require_biometric ? "yes" : "no")
          setMissedDoseDelay((data.alert_delay_minutes / 60)?.toString() || "2")
          setAutoCallbackDoses(data.callback_threshold_violations?.toString() || "2")
          setNotifySponsor(data.notify_sponsor_on_violation ? "yes" : "no")
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching settings:", error)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // First fetch patients for name lookup
      const { data: patientsData } = await supabase.from("patients").select("id, first_name, last_name")

      const patientsMap = new Map((patientsData || []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]))

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from("takehome_compliance_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (alertsError) {
        console.error("[v0] Error fetching alerts:", alertsError)
      } else {
        const alertsWithNames = (alertsData || []).map((alert) => ({
          ...alert,
          patient_name: patientsMap.get(alert.patient_id) || "Unknown Patient",
        }))
        setAlerts(alertsWithNames)
      }

      // Fetch risk scores
      const { data: riskData, error: riskError } = await supabase
        .from("patient_diversion_risk_scores")
        .select("*")
        .order("assessment_date", { ascending: false })
        .limit(100)

      if (riskError) {
        console.error("[v0] Error fetching risk scores:", riskError)
      } else {
        const riskWithNames = (riskData || []).map((risk) => ({
          ...risk,
          patient_name: patientsMap.get(risk.patient_id) || "Unknown Patient",
        }))
        setRiskScores(riskWithNames)
      }

      // Fetch location exceptions
      const { data: exceptionsData, error: exceptionsError } = await supabase
        .from("takehome_location_exceptions")
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(100)

      if (exceptionsError) {
        console.error("[v0] Error fetching exceptions:", exceptionsError)
      } else {
        const exceptionsWithNames = (exceptionsData || []).map((exc) => ({
          ...exc,
          patient_name: patientsMap.get(exc.patient_id) || "Unknown Patient",
        }))
        setLocationExceptions(exceptionsWithNames)
      }

      // Fetch scan logs
      const { data: scanData, error: scanError } = await supabase
        .from("takehome_scan_logs")
        .select("*")
        .order("scan_timestamp", { ascending: false })
        .limit(200)

      if (scanError) {
        console.error("[v0] Error fetching scan logs:", scanError)
      } else {
        const scansWithNames = (scanData || []).map((scan) => ({
          ...scan,
          patient_name: patientsMap.get(scan.patient_id) || "Unknown Patient",
        }))
        setScanLogs(scansWithNames)

        // Calculate stats from scan logs
        const total = scansWithNames.length
        const compliant = scansWithNames.filter((s) => s.verification_status === "passed").length
        const locationViolations = scansWithNames.filter((s) => !s.is_within_geofence).length
        const biometricFailures = scansWithNames.filter((s) => !s.biometric_verified).length

        setStats({
          totalScans: total,
          compliantScans: compliant,
          locationViolations,
          biometricFailures,
          complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCallbackPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from("state_callback_policies")
        .select("*")
        .eq("is_active", true)
        .order("policy_type")

      if (error) {
        console.error("[v0] Error fetching callback policies:", error)
      } else {
        setCallbackPolicies(data || [])
      }

      // Also fetch recent callback logs
      const { data: logsData, error: logsError } = await supabase
        .from("state_callback_log")
        .select("*, patients(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(50)

      if (!logsError) {
        setCallbackLogs(logsData || [])
      }
    } catch (error) {
      console.error("[v0] Error in fetchCallbackPolicies:", error)
    }
  }

  const checkAndTriggerCallback = async (patientId: string, violationType: string) => {
    console.log("[v0] Checking callback requirements for patient:", patientId, "violation:", violationType)

    // Find matching policy
    const matchingPolicy = callbackPolicies.find((p) => p.policy_type === violationType && p.callback_requirement)

    if (!matchingPolicy) {
      console.log("[v0] No callback policy found for violation type:", violationType)
      return
    }

    // Check if patient has exceeded max failures
    const recentAlerts = alerts.filter(
      (a) => a.patient_id === patientId && a.alert_type === violationType && a.status !== "resolved",
    )

    if (recentAlerts.length >= matchingPolicy.max_failures_allowed) {
      console.log("[v0] Patient exceeded max failures, scheduling callback")

      // Calculate callback window
      const callbackDate = new Date()
      callbackDate.setHours(callbackDate.getHours() + matchingPolicy.callback_window_hours)

      // Create callback log entry
      const { error: callbackError } = await supabase.from("state_callback_log").insert({
        patient_id: patientId,
        callback_policy_id: matchingPolicy.id,
        trigger_event: `${violationType} violation - ${recentAlerts.length} failures`,
        callback_scheduled_date: callbackDate.toISOString().split("T")[0],
        callback_completed: false,
        outcome: "pending",
        staff_notes: `Auto-triggered by diversion control system. Policy: ${matchingPolicy.policy_type}`,
      })

      if (callbackError) {
        console.error("[v0] Error creating callback log:", callbackError)
      } else {
        toast({
          title: "Callback Scheduled",
          description: `State callback policy triggered for patient. Due within ${matchingPolicy.callback_window_hours} hours.`,
        })
        fetchCallbackPolicies() // Refresh callback logs
      }
    }
  }

  const handleSaveGeofenceSettings = async () => {
    setSavingGeofence(true)
    try {
      const response = await fetch("/api/takehome-diversion/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settingType: "geofence",
          geofenceRadius: Number.parseInt(geofenceRadius),
          locationTolerance: Number.parseInt(locationTolerance),
          gpsAccuracy: Number.parseInt(gpsAccuracy),
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Geofence settings saved successfully" })
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to save settings", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error saving geofence settings:", error)
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSavingGeofence(false)
    }
  }

  const handleSaveDosingSettings = async () => {
    setSavingDosing(true)
    try {
      const response = await fetch("/api/takehome-diversion/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settingType: "dosing",
          dosingWindowStart,
          dosingWindowEnd,
          weekendWindowEnd,
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Dosing window settings saved successfully" })
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to save settings", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error saving dosing settings:", error)
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSavingDosing(false)
    }
  }

  const handleSaveBiometricSettings = async () => {
    setSavingBiometric(true)
    try {
      const response = await fetch("/api/takehome-diversion/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settingType: "biometric",
          biometricThreshold: Number.parseInt(biometricThreshold),
          maxBiometricAttempts: Number.parseInt(maxBiometricAttempts),
          requireLiveness,
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Biometric settings saved successfully" })
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to save settings", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error saving biometric settings:", error)
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSavingBiometric(false)
    }
  }

  const handleSaveAlertSettings = async () => {
    setSavingAlert(true)
    try {
      const response = await fetch("/api/takehome-diversion/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settingType: "alert",
          missedDoseDelay: Number.parseInt(missedDoseDelay),
          autoCallbackDoses: Number.parseInt(autoCallbackDoses),
          notifySponsor,
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Alert settings saved successfully" })
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to save settings", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error saving alert settings:", error)
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSavingAlert(false)
    }
  }

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert(alert)
    setAlertDetailOpen(true)
  }

  const handleResolveAlert = async () => {
    if (!selectedAlert) return

    try {
      const { error } = await supabase
        .from("takehome_compliance_alerts")
        .update({
          status: "resolved",
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", selectedAlert.id)

      if (error) throw error

      toast({ title: "Success", description: "Alert resolved successfully" })
      setResolveDialogOpen(false)
      setResolutionNotes("")
      fetchAllData()
    } catch (error) {
      console.error("[v0] Error resolving alert:", error)
      toast({ title: "Error", description: "Failed to resolve alert", variant: "destructive" })
    }
  }

  const handleSyncToDEA = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/dea/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncType: "full" }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Data synced to DEA Portal successfully" })
      } else {
        toast({ title: "Error", description: "Failed to sync to DEA Portal", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error syncing to DEA:", error)
      toast({ title: "Error", description: "Failed to sync to DEA Portal", variant: "destructive" })
    } finally {
      setSyncing(false)
    }
  }

  const handleApproveException = async (exceptionId: string) => {
    try {
      const { error } = await supabase
        .from("takehome_location_exceptions")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", exceptionId)

      if (error) throw error

      toast({ title: "Success", description: "Exception approved" })
      fetchAllData()
    } catch (error) {
      console.error("[v0] Error approving exception:", error)
      toast({ title: "Error", description: "Failed to approve exception", variant: "destructive" })
    }
  }

  const handleDenyException = async (exceptionId: string) => {
    try {
      const { error } = await supabase
        .from("takehome_location_exceptions")
        .update({
          status: "denied",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", exceptionId)

      if (error) throw error

      toast({ title: "Success", description: "Exception denied" })
      fetchAllData()
    } catch (error) {
      console.error("[v0] Error denying exception:", error)
      toast({ title: "Error", description: "Failed to deny exception", variant: "destructive" })
    }
  }

  const handleCreateException = async () => {
    try {
      const { error } = await supabase.from("takehome_location_exceptions").insert({
        patient_id: newException.patientId,
        exception_type: newException.exceptionType,
        reason: newException.reason,
        temporary_address: newException.temporaryAddress,
        start_date: newException.startDate,
        end_date: newException.endDate,
        status: "pending",
        requested_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({ title: "Success", description: "Location exception created" })
      setExceptionDialogOpen(false)
      setNewException({
        patientId: "",
        exceptionType: "travel",
        reason: "",
        temporaryAddress: "",
        startDate: "",
        endDate: "",
      })
      fetchAllData()
    } catch (error) {
      console.error("[v0] Error creating exception:", error)
      toast({ title: "Error", description: "Failed to create exception", variant: "destructive" })
    }
  }

  const filteredScanLogs = scanLogs.filter((scan) => {
    switch (scanLogFilter) {
      case "passed":
        return scan.verification_status === "passed"
      case "failed":
        return scan.verification_status === "failed"
      case "location":
        return !scan.is_within_geofence
      case "biometric":
        return !scan.biometric_verified
      default:
        return true
    }
  })

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-100"
      case "medium":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-green-600 bg-green-100"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Take-Home Diversion Control</h1>
          <p className="text-muted-foreground">QR Code + GPS + Facial Biometrics Verification System</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSyncToDEA} disabled={syncing}>
            <Send className="h-4 w-4 mr-2" />
            {syncing ? "Syncing..." : "Sync to DEA Portal"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.filter((a) => a.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="compliance">Patient Compliance</TabsTrigger>
          <TabsTrigger value="exceptions">Travel Exceptions</TabsTrigger>
          <TabsTrigger value="scans">Scan Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Scans (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalScans}</div>
                <p className="text-xs text-muted-foreground">Dose verifications</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.complianceRate}%</div>
                <p className="text-xs text-muted-foreground">{stats.compliantScans} compliant scans</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Location Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.locationViolations}</div>
                <p className="text-xs text-muted-foreground">Outside geofence</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Biometric Failures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.biometricFailures}</div>
                <p className="text-xs text-muted-foreground">Failed verifications</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Scan Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanLogs.slice(0, 5).map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">{scan.patient_name}</TableCell>
                        <TableCell>{new Date(scan.scan_timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={scan.verification_status === "passed" ? "default" : "destructive"}>
                            {scan.verification_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {scanLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No scan activity yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts
                    .filter((a) => a.status === "pending")
                    .slice(0, 5)
                    .map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                          <div>
                            <p className="font-medium">{alert.patient_name}</p>
                            <p className="text-sm text-muted-foreground">{alert.alert_type}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleViewAlert(alert)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  {alerts.filter((a) => a.status === "pending").length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No active alerts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
              <CardDescription>Review and resolve patient compliance alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Alert Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.patient_name}</TableCell>
                      <TableCell>{alert.alert_type}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      </TableCell>
                      <TableCell>{new Date(alert.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={alert.status === "resolved" ? "outline" : "default"}>{alert.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewAlert(alert)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {alert.status !== "resolved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAlert(alert)
                                setResolveDialogOpen(true)
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {alerts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No alerts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patient Compliance Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Patient Risk Scores</CardTitle>
              <CardDescription>Diversion risk assessment for all patients</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Compliance Score</TableHead>
                    <TableHead>Location Compliance</TableHead>
                    <TableHead>Biometric Success</TableHead>
                    <TableHead>Missed Doses (30d)</TableHead>
                    <TableHead>Assessment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskScores.map((score) => (
                    <TableRow key={score.id}>
                      <TableCell className="font-medium">{score.patient_name}</TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(score.risk_level)}>{score.risk_level}</Badge>
                      </TableCell>
                      <TableCell>{score.compliance_score?.toFixed(1)}%</TableCell>
                      <TableCell>{score.location_compliance_rate?.toFixed(1)}%</TableCell>
                      <TableCell>{score.biometric_success_rate?.toFixed(1)}%</TableCell>
                      <TableCell>{score.missed_doses_30_days}</TableCell>
                      <TableCell>{new Date(score.assessment_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {riskScores.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No risk assessments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Travel Exceptions Tab */}
        <TabsContent value="exceptions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Location Exceptions</CardTitle>
                <CardDescription>Manage travel and temporary location exceptions</CardDescription>
              </div>
              <Button onClick={() => setExceptionDialogOpen(true)}>Add Exception</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationExceptions.map((exception) => (
                    <TableRow key={exception.id}>
                      <TableCell className="font-medium">{exception.patient_name}</TableCell>
                      <TableCell className="capitalize">{exception.exception_type}</TableCell>
                      <TableCell className="max-w-xs truncate">{exception.reason}</TableCell>
                      <TableCell>
                        {new Date(exception.start_date).toLocaleDateString()} -{" "}
                        {new Date(exception.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exception.status === "approved"
                              ? "default"
                              : exception.status === "denied"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {exception.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {exception.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleApproveException(exception.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDenyException(exception.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {locationExceptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No location exceptions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scan Logs Tab */}
        <TabsContent value="scans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Scan Logs</CardTitle>
                <CardDescription>All dose verification scan history</CardDescription>
              </div>
              <Select value={scanLogFilter} onValueChange={setScanLogFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter scans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scans</SelectItem>
                  <SelectItem value="passed">Passed Only</SelectItem>
                  <SelectItem value="failed">Failed Only</SelectItem>
                  <SelectItem value="location">Location Violations</SelectItem>
                  <SelectItem value="biometric">Biometric Failures</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Scan Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Dosing Window</TableHead>
                    <TableHead>Biometric</TableHead>
                    <TableHead>Distance (ft)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScanLogs.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium">{scan.patient_name}</TableCell>
                      <TableCell>{new Date(scan.scan_timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={scan.verification_status === "passed" ? "default" : "destructive"}>
                          {scan.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {scan.is_within_geofence ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        {scan.is_within_dosing_window ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        {scan.biometric_verified ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>{scan.distance_from_home_feet?.toFixed(0) || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                  {filteredScanLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No scan logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Geofence Settings</CardTitle>
                <CardDescription>Configure location verification parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Geofence Radius (feet)</Label>
                  <Input type="number" value={geofenceRadius} onChange={(e) => setGeofenceRadius(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Location Verification Tolerance</Label>
                  <Input
                    type="number"
                    value={locationTolerance}
                    onChange={(e) => setLocationTolerance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GPS Accuracy Requirement (meters)</Label>
                  <Input type="number" value={gpsAccuracy} onChange={(e) => setGpsAccuracy(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleSaveGeofenceSettings} disabled={savingGeofence}>
                  {savingGeofence ? "Saving..." : "Save Geofence Settings"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dosing Window Settings</CardTitle>
                <CardDescription>Configure time-based compliance rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Dosing Window Start</Label>
                  <Input type="time" value={dosingWindowStart} onChange={(e) => setDosingWindowStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Default Dosing Window End</Label>
                  <Input type="time" value={dosingWindowEnd} onChange={(e) => setDosingWindowEnd(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Weekend Extended Window End</Label>
                  <Input type="time" value={weekendWindowEnd} onChange={(e) => setWeekendWindowEnd(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleSaveDosingSettings} disabled={savingDosing}>
                  {savingDosing ? "Saving..." : "Save Dosing Settings"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Biometric Settings</CardTitle>
                <CardDescription>Configure facial recognition parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Facial Match Confidence Threshold (%)</Label>
                  <Input
                    type="number"
                    value={biometricThreshold}
                    onChange={(e) => setBiometricThreshold(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Biometric Attempts</Label>
                  <Input
                    type="number"
                    value={maxBiometricAttempts}
                    onChange={(e) => setMaxBiometricAttempts(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Require Liveness Check</Label>
                  <Select value={requireLiveness} onValueChange={setRequireLiveness}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleSaveBiometricSettings} disabled={savingBiometric}>
                  {savingBiometric ? "Saving..." : "Save Biometric Settings"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Settings</CardTitle>
                <CardDescription>Configure notification and callback rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Missed Dose Alert Delay (hours)</Label>
                  <Input type="number" value={missedDoseDelay} onChange={(e) => setMissedDoseDelay(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Auto Callback After Missed Doses</Label>
                  <Input
                    type="number"
                    value={autoCallbackDoses}
                    onChange={(e) => setAutoCallbackDoses(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notify Sponsor on Violation</Label>
                  <Select value={notifySponsor} onValueChange={setNotifySponsor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleSaveAlertSettings} disabled={savingAlert}>
                  {savingAlert ? "Saving..." : "Save Alert Settings"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Dialog */}
      <Dialog open={alertDetailOpen} onOpenChange={setAlertDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{selectedAlert.patient_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Alert Type</Label>
                  <p className="font-medium">{selectedAlert.alert_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedAlert.status === "resolved" ? "outline" : "default"}>
                    {selectedAlert.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{selectedAlert.alert_title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p>{selectedAlert.alert_description}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p>{new Date(selectedAlert.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDetailOpen(false)}>
              Close
            </Button>
            {selectedAlert?.status !== "resolved" && (
              <Button
                onClick={() => {
                  setAlertDetailOpen(false)
                  setResolveDialogOpen(true)
                }}
              >
                Resolve Alert
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Alert Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>Provide resolution notes for this alert</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter notes about how this alert was resolved..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveAlert}>Resolve Alert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Exception Dialog */}
      <Dialog open={exceptionDialogOpen} onOpenChange={setExceptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Location Exception</DialogTitle>
            <DialogDescription>Add a temporary location exception for a patient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient ID</Label>
              <Input
                value={newException.patientId}
                onChange={(e) => setNewException({ ...newException, patientId: e.target.value })}
                placeholder="Enter patient ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Exception Type</Label>
              <Select
                value={newException.exceptionType}
                onValueChange={(value) => setNewException({ ...newException, exceptionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="family">Family Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={newException.reason}
                onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                placeholder="Reason for exception..."
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary Address</Label>
              <Input
                value={newException.temporaryAddress}
                onChange={(e) => setNewException({ ...newException, temporaryAddress: e.target.value })}
                placeholder="Enter temporary address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newException.startDate}
                  onChange={(e) => setNewException({ ...newException, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newException.endDate}
                  onChange={(e) => setNewException({ ...newException, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExceptionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateException}>Create Exception</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
