"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Building,
  Search,
  Download,
  Eye,
  Lock,
  Plus,
  RefreshCw,
  Loader2,
  Check,
  Copy,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RegulatoryAccess {
  id: string
  inspector_id: string
  inspector_name: string
  organization: string
  role: string
  is_active: boolean
  access_granted_at: string
  access_expires_at: string
  notes: string
}

interface ComplianceAlert {
  id: string
  alert_type: string
  severity: string
  alert_message: string
  created_at: string
  status: string
}

interface ComplianceReport {
  id: string
  report_type: string
  status: string
  created_at: string
  report_data: any
}

export default function RegulatoryDashboardPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [activeAccess, setActiveAccess] = useState<RegulatoryAccess[]>([])
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([])
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([])
  const [complianceScore, setComplianceScore] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isGrantAccessOpen, setIsGrantAccessOpen] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [newAccess, setNewAccess] = useState({
    inspector_name: "",
    inspector_id: "",
    organization: "DEA",
    role: "dea_inspector",
    notes: "",
    expires_days: 7,
  })

  const [generatedCredentials, setGeneratedCredentials] = useState<{
    agentId: string
    tempPassword: string
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fetchRegulatoryData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch active regulatory access
      const { data: accessData } = await supabase
        .from("regulatory_access")
        .select("*")
        .eq("is_active", true)
        .order("access_granted_at", { ascending: false })

      if (accessData) setActiveAccess(accessData)

      // Fetch compliance alerts
      const { data: alertsData } = await supabase
        .from("clinical_alerts")
        .select("*")
        .in("alert_type", ["compliance", "regulatory", "audit"])
        .order("created_at", { ascending: false })
        .limit(20)

      if (alertsData) setComplianceAlerts(alertsData)

      // Fetch compliance reports
      const { data: reportsData } = await supabase
        .from("compliance_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (reportsData) setComplianceReports(reportsData)

      // Calculate compliance score from real data
      const { count: totalAlerts } = await supabase
        .from("clinical_alerts")
        .select("*", { count: "exact", head: true })
        .in("alert_type", ["compliance", "regulatory"])

      const { count: resolvedAlerts } = await supabase
        .from("clinical_alerts")
        .select("*", { count: "exact", head: true })
        .in("alert_type", ["compliance", "regulatory"])
        .eq("status", "resolved")

      const score = totalAlerts && totalAlerts > 0 ? Math.round(((resolvedAlerts || 0) / totalAlerts) * 100) : 85 // Default if no alerts

      setComplianceScore(score)
    } catch (error) {
      console.error("Error fetching regulatory data:", error)
      toast({ title: "Error", description: "Failed to load regulatory data", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchRegulatoryData()
  }, [fetchRegulatoryData])

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const generateAgentId = (org: string) => {
    const prefixes: Record<string, string> = {
      DEA: "DEA",
      "Joint Commission": "JC",
      "State Health Department": "SHD",
      OASAS: "OAS",
      CMS: "CMS",
    }
    const prefix = prefixes[org] || "REG"
    const num = Math.floor(100000 + Math.random() * 900000)
    return `${prefix}-${num}`
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  const handleGrantAccess = async () => {
    if (!newAccess.inspector_name) {
      toast({ title: "Error", description: "Please enter agent name", variant: "destructive" })
      return
    }

    setIsGenerating(true)

    try {
      const agentId = generateAgentId(newAccess.organization)
      const tempPassword = generatePassword()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + newAccess.expires_days)

      const { error } = await supabase.from("regulatory_access").insert({
        inspector_name: newAccess.inspector_name,
        inspector_id: agentId,
        organization: newAccess.organization,
        role: newAccess.role,
        notes: `${newAccess.notes}\n\nTemporary password: ${tempPassword} (change on first login)`,
        is_active: true,
        access_granted_at: new Date().toISOString(),
        access_expires_at: expiresAt.toISOString(),
      })

      if (error) throw error

      setGeneratedCredentials({
        agentId,
        tempPassword,
      })

      toast({ title: "Success", description: "Agent credentials created successfully" })
    } catch (error) {
      console.error("Error granting access:", error)
      toast({ title: "Error", description: "Failed to grant access", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRevokeAccess = async (accessId: string) => {
    if (!confirm("Are you sure you want to revoke this access?")) return

    try {
      const { error } = await supabase.from("regulatory_access").update({ is_active: false }).eq("id", accessId)

      if (error) throw error

      toast({ title: "Success", description: "Access revoked successfully" })
      fetchRegulatoryData()
    } catch (error) {
      toast({ title: "Error", description: "Failed to revoke access", variant: "destructive" })
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("clinical_alerts")
        .update({ status: "resolved", acknowledged_at: new Date().toISOString() })
        .eq("id", alertId)

      if (error) throw error

      toast({ title: "Success", description: "Alert resolved" })
      fetchRegulatoryData()
    } catch (error) {
      toast({ title: "Error", description: "Failed to resolve alert", variant: "destructive" })
    }
  }

  const handleGenerateReport = async (reportType: string) => {
    setIsGeneratingReport(true)
    try {
      // Generate report data based on type
      let reportData: any = {}

      if (reportType === "DEA") {
        const { data: inventory } = await supabase.from("medication_inventory").select("*").eq("dea_schedule", "II")
        const { data: transactions } = await supabase.from("inventory_transactions").select("*").limit(100)
        reportData = { inventory, transactions, generated_at: new Date().toISOString() }
      } else if (reportType === "HIPAA") {
        const { data: logins } = await supabase.from("login_activity").select("*").limit(100)
        const { data: audit } = await supabase.from("audit_trail").select("*").limit(100)
        reportData = { logins, audit, generated_at: new Date().toISOString() }
      } else if (reportType === "Joint Commission") {
        const { data: notes } = await supabase.from("progress_notes").select("*").limit(50)
        const { data: assessments } = await supabase.from("patient_assessments").select("*").limit(50)
        reportData = { notes, assessments, generated_at: new Date().toISOString() }
      } else {
        const { data: patients } = await supabase.from("patients").select("id, created_at").limit(100)
        reportData = { patients, generated_at: new Date().toISOString() }
      }

      // Save the report
      const { error } = await supabase.from("compliance_reports").insert({
        report_type: reportType,
        status: "completed",
        report_data: reportData,
      })

      if (error) throw error

      // Download as JSON
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType.toLowerCase().replace(/ /g, "_")}_compliance_report_${new Date().toISOString().split("T")[0]}.json`
      a.click()

      toast({ title: "Success", description: `${reportType} compliance report generated` })
      fetchRegulatoryData()
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Expired</Badge>
    )
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const filteredAccess = activeAccess.filter(
    (a) =>
      a.inspector_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.organization?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Regulatory Compliance Dashboard</h1>
              <p className="text-muted-foreground">Compliance Management & Oversight</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchRegulatoryData()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsGrantAccessOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Grant Access
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Inspections</p>
                    <p className="text-2xl font-bold">{activeAccess.length}</p>
                    <p className="text-xs text-blue-600">Currently authorized</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                    <p
                      className={`text-2xl font-bold ${complianceScore >= 80 ? "text-green-600" : complianceScore >= 60 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {complianceScore}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {complianceScore >= 80 ? "Above threshold" : "Needs attention"}
                    </p>
                  </div>
                  <FileCheck className={`h-8 w-8 ${complianceScore >= 80 ? "text-green-600" : "text-yellow-600"}`} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Alerts</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {complianceAlerts.filter((a) => a.status !== "resolved").length}
                    </p>
                    <p className="text-xs text-orange-600">Require attention</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reports Generated</p>
                    <p className="text-2xl font-bold">{complianceReports.length}</p>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="access">Access Management</TabsTrigger>
              <TabsTrigger value="alerts">Compliance Alerts</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Inspections</CardTitle>
                    <CardDescription>Latest regulatory access and inspections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeAccess.length > 0 ? (
                      <div className="space-y-4">
                        {activeAccess.slice(0, 5).map((access) => (
                          <div key={access.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{access.inspector_name}</p>
                                <p className="text-sm text-muted-foreground">{access.organization}</p>
                              </div>
                            </div>
                            {getStatusBadge(access.is_active)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No active inspections</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Alerts</CardTitle>
                    <CardDescription>Items requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {complianceAlerts.filter((a) => a.status !== "resolved").length > 0 ? (
                      <div className="space-y-4">
                        {complianceAlerts
                          .filter((a) => a.status !== "resolved")
                          .slice(0, 5)
                          .map((alert) => (
                            <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                              {getSeverityIcon(alert.severity)}
                              <div className="flex-1">
                                <p className="font-medium">{alert.alert_type}</p>
                                <p className="text-sm text-muted-foreground">{alert.alert_message}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(alert.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No open alerts</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="access" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Access Management</CardTitle>
                  <CardDescription>Manage regulatory inspector access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by inspector name or agency..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {filteredAccess.map((access) => (
                      <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{access.inspector_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building className="h-3 w-3" />
                              {access.organization}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Expires: {new Date(access.access_expires_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(access.is_active)}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleRevokeAccess(access.id)}>
                              <Lock className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredAccess.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No active regulatory access found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Compliance Alerts</CardTitle>
                  <CardDescription>View and manage compliance alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  {complianceAlerts.length > 0 ? (
                    <div className="space-y-4">
                      {complianceAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(alert.severity)}
                            <div>
                              <p className="font-medium">{alert.alert_type}</p>
                              <p className="text-sm text-muted-foreground">{alert.alert_message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(alert.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {alert.status !== "resolved" ? (
                            <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert.id)}>
                              Resolve
                            </Button>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No compliance alerts</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Reports</CardTitle>
                  <CardDescription>Generate and download compliance reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["DEA", "OASAS", "HIPAA", "Joint Commission"].map((type) => (
                      <div key={type} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{type} Compliance Report</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {type === "DEA" && "Controlled substance handling and documentation"}
                          {type === "OASAS" && "State regulatory compliance documentation"}
                          {type === "HIPAA" && "Privacy and security compliance audit"}
                          {type === "Joint Commission" && "Accreditation compliance documentation"}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateReport(type)}
                          disabled={isGeneratingReport}
                        >
                          {isGeneratingReport ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Generate
                        </Button>
                      </div>
                    ))}
                  </div>

                  {complianceReports.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Recent Reports</h4>
                      <div className="space-y-2">
                        {complianceReports.slice(0, 5).map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{report.report_type}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(report.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Badge className={report.status === "completed" ? "bg-green-100 text-green-800" : ""}>
                              {report.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Grant Access Dialog */}
      <Dialog
        open={isGrantAccessOpen}
        onOpenChange={(open) => {
          setIsGrantAccessOpen(open)
          if (!open) setGeneratedCredentials(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create DEA Grant / Agent Access</DialogTitle>
            <DialogDescription>Generate temporary login credentials for regulatory agents</DialogDescription>
          </DialogHeader>

          {!generatedCredentials ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Agent Name *</Label>
                <Input
                  placeholder="Full name"
                  value={newAccess.inspector_name}
                  onChange={(e) => setNewAccess({ ...newAccess, inspector_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select
                  value={newAccess.organization}
                  onValueChange={(v) => setNewAccess({ ...newAccess, organization: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEA">Drug Enforcement Administration (DEA)</SelectItem>
                    <SelectItem value="Joint Commission">Joint Commission</SelectItem>
                    <SelectItem value="State Health Department">State Health Department</SelectItem>
                    <SelectItem value="OASAS">OASAS</SelectItem>
                    <SelectItem value="CMS">CMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Access Level</Label>
                <Select value={newAccess.role} onValueChange={(v) => setNewAccess({ ...newAccess, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Read Only (View Reports)</SelectItem>
                    <SelectItem value="inspector">Full Access (Inspection Mode)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Access Duration</Label>
                <Select
                  value={String(newAccess.expires_days)}
                  onValueChange={(v) => setNewAccess({ ...newAccess, expires_days: Number.parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Purpose of access..."
                  value={newAccess.notes}
                  onChange={(e) => setNewAccess({ ...newAccess, notes: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-3">
                  Credentials created successfully! Share these with the agent:
                </p>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-green-700">Agent ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={generatedCredentials.agentId} readOnly className="font-mono bg-white" />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials.agentId, "id")}
                      >
                        {copiedField === "id" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-green-700">Temporary Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={generatedCredentials.tempPassword} readOnly className="font-mono bg-white" />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials.tempPassword, "password")}
                      >
                        {copiedField === "password" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-green-600 mt-3">
                  Agent should change password on first login. Access expires in {newAccess.expires_days} days.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {!generatedCredentials ? (
              <>
                <Button variant="outline" onClick={() => setIsGrantAccessOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGrantAccess} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate Credentials"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsGrantAccessOpen(false)}>Done</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
