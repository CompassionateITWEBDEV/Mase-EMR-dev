"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  AlertTriangle,
  Shield,
  StopCircle,
  UserCheck,
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Droplets,
  Home,
  Phone,
  Heart,
  Brain,
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react"

interface DosingHold {
  id: string
  patient_id: string
  patient_name: string
  mrn: string
  hold_type: "counselor" | "nurse" | "doctor" | "compliance"
  reason: string
  created_by: string
  created_by_role: string
  created_at: string
  requires_clearance_from: string[]
  cleared_by: string[]
  status: "active" | "cleared" | "expired"
  notes: string
  severity: "low" | "medium" | "high" | "critical"
}

interface PatientPrecaution {
  id: string
  patient_id: string
  patient_name: string
  mrn: string
  precaution_type: string
  custom_text: string
  icon: string
  color: string
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  show_on_chart: boolean
}

interface FacilityAlert {
  id: string
  alert_type: string
  message: string
  created_at: string
  created_by: string
  is_active: boolean
  priority: "low" | "medium" | "high" | "critical"
  affected_areas: string[]
}

const defaultPrecautionTypes = [
  { id: "water_off", label: "Water Off", icon: "Droplets", color: "#3b82f6" },
  { id: "electric_off", label: "Electric Off", icon: "Zap", color: "#eab308" },
  { id: "needs_assistance", label: "Needs Assistance", icon: "UserCheck", color: "#8b5cf6" },
  { id: "fall_risk", label: "Fall Risk", icon: "AlertTriangle", color: "#ef4444" },
  { id: "wheelchair", label: "Wheelchair User", icon: "Home", color: "#06b6d4" },
  { id: "hearing_impaired", label: "Hearing Impaired", icon: "Phone", color: "#f97316" },
  { id: "vision_impaired", label: "Vision Impaired", icon: "Eye", color: "#a855f7" },
  { id: "cognitive", label: "Cognitive Impairment", icon: "Brain", color: "#ec4899" },
  { id: "cardiac", label: "Cardiac Precaution", icon: "Heart", color: "#dc2626" },
  { id: "custom", label: "Custom Precaution", icon: "FileText", color: "#64748b" },
]

export default function ClinicalAlertsPage() {
  const [dosingHolds, setDosingHolds] = useState<DosingHold[]>([])
  const [precautions, setPrecautions] = useState<PatientPrecaution[]>([])
  const [facilityAlerts, setFacilityAlerts] = useState<FacilityAlert[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddHoldOpen, setIsAddHoldOpen] = useState(false)
  const [isAddPrecautionOpen, setIsAddPrecautionOpen] = useState(false)
  const [isAddFacilityAlertOpen, setIsAddFacilityAlertOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // New hold form state
  const [newHold, setNewHold] = useState({
    patient_id: "",
    hold_type: "counselor" as const,
    reason: "",
    requires_clearance_from: [] as string[],
    notes: "",
    severity: "medium" as const,
  })

  // New precaution form state
  const [newPrecaution, setNewPrecaution] = useState({
    patient_id: "",
    precaution_type: "",
    custom_text: "",
    show_on_chart: true,
  })

  // New facility alert form state
  const [newFacilityAlert, setNewFacilityAlert] = useState({
    alert_type: "",
    message: "",
    priority: "medium" as const,
    affected_areas: [] as string[],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    // Load dosing holds
    try {
      const holdsRes = await fetch("/api/clinical-alerts/holds")
      if (holdsRes.ok) {
        const data = await holdsRes.json()
        setDosingHolds(data.holds || [])
      }
    } catch (e) {
      // Use mock data
      setDosingHolds([
        {
          id: "1",
          patient_id: "P001",
          patient_name: "John Smith",
          mrn: "MRN-001234",
          hold_type: "counselor",
          reason: "Missed 3 consecutive counseling sessions",
          created_by: "Dr. Sarah Johnson",
          created_by_role: "Physician",
          created_at: new Date().toISOString(),
          requires_clearance_from: ["Counselor"],
          cleared_by: [],
          status: "active",
          notes: "Patient has not attended counseling since 11/15. Must see counselor before next dose.",
          severity: "high",
        },
        {
          id: "2",
          patient_id: "P002",
          patient_name: "Maria Garcia",
          mrn: "MRN-001235",
          hold_type: "nurse",
          reason: "Suspected intoxication at last visit",
          created_by: "RN Lisa Chen",
          created_by_role: "Nurse",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          requires_clearance_from: ["Nurse", "Physician"],
          cleared_by: ["RN Lisa Chen"],
          status: "active",
          notes: "Patient appeared intoxicated. Requires nurse assessment and physician clearance.",
          severity: "critical",
        },
        {
          id: "3",
          patient_id: "P003",
          patient_name: "Robert Johnson",
          mrn: "MRN-001236",
          hold_type: "compliance",
          reason: "Positive drug screen - non-prescribed benzodiazepines",
          created_by: "System",
          created_by_role: "Automated",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          requires_clearance_from: ["Counselor", "Physician"],
          cleared_by: [],
          status: "active",
          notes: "UDS positive for benzodiazepines not in medication list. Treatment plan review required.",
          severity: "high",
        },
      ])
    }

    // Load precautions
    try {
      const precautionsRes = await fetch("/api/clinical-alerts/precautions")
      if (precautionsRes.ok) {
        const data = await precautionsRes.json()
        setPrecautions(data.precautions || [])
      }
    } catch (e) {
      setPrecautions([
        {
          id: "1",
          patient_id: "P001",
          patient_name: "John Smith",
          mrn: "MRN-001234",
          precaution_type: "water_off",
          custom_text: "Patient water service disconnected - offer water at each visit",
          icon: "Droplets",
          color: "#3b82f6",
          created_by: "Case Manager Amy",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          show_on_chart: true,
        },
        {
          id: "2",
          patient_id: "P004",
          patient_name: "Susan Williams",
          mrn: "MRN-001237",
          precaution_type: "needs_assistance",
          custom_text: "Patient requires wheelchair assistance from parking lot to dosing window",
          icon: "UserCheck",
          color: "#8b5cf6",
          created_by: "RN Lisa Chen",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          show_on_chart: true,
        },
        {
          id: "3",
          patient_id: "P005",
          patient_name: "James Brown",
          mrn: "MRN-001238",
          precaution_type: "fall_risk",
          custom_text: "High fall risk - recent hip replacement surgery. Assist with seating.",
          icon: "AlertTriangle",
          color: "#ef4444",
          created_by: "Dr. Sarah Johnson",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          show_on_chart: true,
        },
        {
          id: "4",
          patient_id: "P002",
          patient_name: "Maria Garcia",
          mrn: "MRN-001235",
          precaution_type: "custom",
          custom_text: "Patient electricity has been shut off - may need resources for medication storage",
          icon: "Zap",
          color: "#eab308",
          created_by: "Case Manager Amy",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          show_on_chart: true,
        },
      ])
    }

    // Load facility alerts
    try {
      const facilityRes = await fetch("/api/clinical-alerts/facility")
      if (facilityRes.ok) {
        const data = await facilityRes.json()
        setFacilityAlerts(data.alerts || [])
      }
    } catch (e) {
      setFacilityAlerts([
        {
          id: "1",
          alert_type: "maintenance",
          message: "Water main repair scheduled for 11/28 - Limited restroom access 8am-12pm",
          created_at: new Date().toISOString(),
          created_by: "Facility Manager",
          is_active: true,
          priority: "medium",
          affected_areas: ["Lobby", "Waiting Room"],
        },
        {
          id: "2",
          alert_type: "safety",
          message: "Ice advisory - Salt walkways and assist patients as needed",
          created_at: new Date().toISOString(),
          created_by: "Safety Officer",
          is_active: true,
          priority: "high",
          affected_areas: ["Parking Lot", "Entrance"],
        },
      ])
    }

    setLoading(false)
  }

  const handleCreateHold = async () => {
    // API call would go here
    const newHoldEntry: DosingHold = {
      id: Date.now().toString(),
      patient_id: newHold.patient_id,
      patient_name: "New Patient",
      mrn: "MRN-" + Math.random().toString().slice(2, 8),
      hold_type: newHold.hold_type,
      reason: newHold.reason,
      created_by: "Current User",
      created_by_role: "Provider",
      created_at: new Date().toISOString(),
      requires_clearance_from: newHold.requires_clearance_from,
      cleared_by: [],
      status: "active",
      notes: newHold.notes,
      severity: newHold.severity,
    }
    setDosingHolds([newHoldEntry, ...dosingHolds])
    setIsAddHoldOpen(false)
    setNewHold({
      patient_id: "",
      hold_type: "counselor",
      reason: "",
      requires_clearance_from: [],
      notes: "",
      severity: "medium",
    })
  }

  const handleClearHold = async (holdId: string, clearedBy: string) => {
    setDosingHolds(
      dosingHolds.map((hold) => {
        if (hold.id === holdId) {
          const newClearedBy = [...hold.cleared_by, clearedBy]
          const allCleared = hold.requires_clearance_from.every((req) =>
            newClearedBy.some((cleared) => cleared.toLowerCase().includes(req.toLowerCase())),
          )
          return {
            ...hold,
            cleared_by: newClearedBy,
            status: allCleared ? "cleared" : "active",
          }
        }
        return hold
      }),
    )
  }

  const handleCreatePrecaution = async () => {
    const precautionType = defaultPrecautionTypes.find((t) => t.id === newPrecaution.precaution_type)
    const newPrecautionEntry: PatientPrecaution = {
      id: Date.now().toString(),
      patient_id: newPrecaution.patient_id,
      patient_name: "New Patient",
      mrn: "MRN-" + Math.random().toString().slice(2, 8),
      precaution_type: newPrecaution.precaution_type,
      custom_text: newPrecaution.custom_text,
      icon: precautionType?.icon || "FileText",
      color: precautionType?.color || "#64748b",
      created_by: "Current User",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      show_on_chart: newPrecaution.show_on_chart,
    }
    setPrecautions([newPrecautionEntry, ...precautions])
    setIsAddPrecautionOpen(false)
    setNewPrecaution({
      patient_id: "",
      precaution_type: "",
      custom_text: "",
      show_on_chart: true,
    })
  }

  // ADDED FUNCTION: handleCreateFacilityAlert
  const handleCreateFacilityAlert = async () => {
    try {
      const response = await fetch("/api/clinical-alerts/facility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_type: newFacilityAlert.alert_type,
          message: newFacilityAlert.message,
          priority: newFacilityAlert.priority,
          affected_areas: newFacilityAlert.affected_areas,
          created_by: "Current User",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFacilityAlerts([
          {
            id: data.alert?.id || Date.now().toString(),
            alert_type: newFacilityAlert.alert_type,
            message: newFacilityAlert.message,
            created_at: new Date().toISOString(),
            created_by: "Current User",
            is_active: true,
            priority: newFacilityAlert.priority,
            affected_areas: newFacilityAlert.affected_areas,
          },
          ...facilityAlerts,
        ])
      } else {
        // Still add locally if API fails
        setFacilityAlerts([
          {
            id: Date.now().toString(),
            alert_type: newFacilityAlert.alert_type,
            message: newFacilityAlert.message,
            created_at: new Date().toISOString(),
            created_by: "Current User",
            is_active: true,
            priority: newFacilityAlert.priority,
            affected_areas: newFacilityAlert.affected_areas,
          },
          ...facilityAlerts,
        ])
      }
    } catch (e) {
      // Add locally on error
      setFacilityAlerts([
        {
          id: Date.now().toString(),
          alert_type: newFacilityAlert.alert_type,
          message: newFacilityAlert.message,
          created_at: new Date().toISOString(),
          created_by: "Current User",
          is_active: true,
          priority: newFacilityAlert.priority,
          affected_areas: newFacilityAlert.affected_areas,
        },
        ...facilityAlerts,
      ])
    }

    setIsAddFacilityAlertOpen(false)
    setNewFacilityAlert({
      alert_type: "",
      message: "",
      priority: "medium",
      affected_areas: [],
    })
  }

  // ADDED FUNCTION: handleDismissFacilityAlert
  const handleDismissFacilityAlert = async (alertId: string) => {
    setFacilityAlerts(facilityAlerts.map((alert) => (alert.id === alertId ? { ...alert, is_active: false } : alert)))
  }

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Droplets,
      Zap,
      UserCheck,
      AlertTriangle,
      Home,
      Phone,
      Eye,
      Brain,
      Heart,
      FileText,
    }
    return icons[iconName] || FileText
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" }
      case "high":
        return { bg: "#fff7ed", border: "#fed7aa", text: "#ea580c" }
      case "medium":
        return { bg: "#fefce8", border: "#fef08a", text: "#ca8a04" }
      case "low":
        return { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" }
      default:
        return { bg: "#f8fafc", border: "#e2e8f0", text: "#64748b" }
    }
  }

  const filteredHolds = dosingHolds.filter((hold) => {
    const matchesSearch =
      hold.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hold.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hold.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || hold.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const activeHoldsCount = dosingHolds.filter((h) => h.status === "active").length
  const criticalHoldsCount = dosingHolds.filter((h) => h.severity === "critical" && h.status === "active").length
  const activePrecautionsCount = precautions.filter((p) => p.is_active).length
  const activeFacilityAlertsCount = facilityAlerts.filter((a) => a.is_active).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
              Clinical Alerts Dashboard
            </h1>
            <p style={{ color: "#64748b" }}>Manage dosing holds, patient precautions, and facility alerts</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#991b1b" }}>
                      Active Dosing Holds
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "#dc2626" }}>
                      {activeHoldsCount}
                    </p>
                  </div>
                  <StopCircle className="h-10 w-10" style={{ color: "#dc2626" }} />
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderColor: "#fed7aa", backgroundColor: "#fff7ed" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#9a3412" }}>
                      Critical Holds
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "#ea580c" }}>
                      {criticalHoldsCount}
                    </p>
                  </div>
                  <AlertCircle className="h-10 w-10" style={{ color: "#ea580c" }} />
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderColor: "#c4b5fd", backgroundColor: "#f5f3ff" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#5b21b6" }}>
                      Patient Precautions
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "#7c3aed" }}>
                      {activePrecautionsCount}
                    </p>
                  </div>
                  <Shield className="h-10 w-10" style={{ color: "#7c3aed" }} />
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderColor: "#93c5fd", backgroundColor: "#eff6ff" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#1e40af" }}>
                      Facility Alerts
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "#2563eb" }}>
                      {activeFacilityAlertsCount}
                    </p>
                  </div>
                  <AlertTriangle className="h-10 w-10" style={{ color: "#2563eb" }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="holds" className="space-y-4">
            <TabsList style={{ backgroundColor: "#f1f5f9" }}>
              <TabsTrigger value="holds">
                Dosing Holds
                {activeHoldsCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {activeHoldsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="precautions">
                Patient Precautions
                {activePrecautionsCount > 0 && (
                  <Badge className="ml-2" style={{ backgroundColor: "#7c3aed" }}>
                    {activePrecautionsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="facility">
                Facility Alerts
                {activeFacilityAlertsCount > 0 && (
                  <Badge className="ml-2" style={{ backgroundColor: "#2563eb" }}>
                    {activeFacilityAlertsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Dosing Holds Tab */}
            <TabsContent value="holds" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle style={{ color: "#1e293b" }}>Stop Dosing Holds</CardTitle>
                      <CardDescription>
                        Patients with active holds cannot receive their dose until cleared
                      </CardDescription>
                    </div>
                    <Dialog open={isAddHoldOpen} onOpenChange={setIsAddHoldOpen}>
                      <DialogTrigger asChild>
                        <Button style={{ backgroundColor: "#dc2626", color: "#ffffff" }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Dosing Hold
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg" style={{ backgroundColor: "#ffffff" }}>
                        <DialogHeader>
                          <DialogTitle style={{ color: "#1e293b" }}>Create Dosing Hold</DialogTitle>
                          <DialogDescription>
                            Stop dosing for a patient until they meet with the required staff member
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <Label>Patient</Label>
                            <Select
                              value={newHold.patient_id}
                              onValueChange={(v) => setNewHold({ ...newHold, patient_id: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="P001">John Smith (MRN-001234)</SelectItem>
                                <SelectItem value="P002">Maria Garcia (MRN-001235)</SelectItem>
                                <SelectItem value="P003">Robert Johnson (MRN-001236)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Hold Type</Label>
                            <Select
                              value={newHold.hold_type}
                              onValueChange={(v: any) => setNewHold({ ...newHold, hold_type: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select hold type..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="counselor">Must See Counselor</SelectItem>
                                <SelectItem value="nurse">Must See Nurse</SelectItem>
                                <SelectItem value="doctor">Must See Doctor</SelectItem>
                                <SelectItem value="compliance">Compliance Review</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Severity</Label>
                            <Select
                              value={newHold.severity}
                              onValueChange={(v: any) => setNewHold({ ...newHold, severity: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select severity..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low - Advisory</SelectItem>
                                <SelectItem value="medium">Medium - Review Required</SelectItem>
                                <SelectItem value="high">High - Mandatory Hold</SelectItem>
                                <SelectItem value="critical">Critical - Safety Concern</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Reason for Hold</Label>
                            <Select value={newHold.reason} onValueChange={(v) => setNewHold({ ...newHold, reason: v })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="missed_counseling">Missed Counseling Sessions</SelectItem>
                                <SelectItem value="positive_uds">Positive Drug Screen</SelectItem>
                                <SelectItem value="suspected_intoxication">Suspected Intoxication</SelectItem>
                                <SelectItem value="non_compliance">Treatment Non-Compliance</SelectItem>
                                <SelectItem value="missed_appointments">Missed Medical Appointments</SelectItem>
                                <SelectItem value="medication_concern">Medication Concern</SelectItem>
                                <SelectItem value="behavioral_issue">Behavioral Issue</SelectItem>
                                <SelectItem value="diversion_concern">Diversion Concern</SelectItem>
                                <SelectItem value="other">Other (Specify in Notes)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Requires Clearance From</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {["Counselor", "Nurse", "Physician", "Case Manager", "Program Director"].map((role) => (
                                <label key={role} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={newHold.requires_clearance_from.includes(role)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setNewHold({
                                          ...newHold,
                                          requires_clearance_from: [...newHold.requires_clearance_from, role],
                                        })
                                      } else {
                                        setNewHold({
                                          ...newHold,
                                          requires_clearance_from: newHold.requires_clearance_from.filter(
                                            (r) => r !== role,
                                          ),
                                        })
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{role}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Notes</Label>
                            <Textarea
                              value={newHold.notes}
                              onChange={(e) => setNewHold({ ...newHold, notes: e.target.value })}
                              placeholder="Additional details about the hold..."
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddHoldOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateHold} style={{ backgroundColor: "#dc2626", color: "#ffffff" }}>
                            Create Hold
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                        style={{ color: "#94a3b8" }}
                      />
                      <Input
                        placeholder="Search by patient name, MRN, or reason..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Holds</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="cleared">Cleared</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Holds List */}
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredHolds.map((hold) => {
                        const severityColors = getSeverityColor(hold.severity)
                        return (
                          <Card
                            key={hold.id}
                            style={{
                              borderColor: severityColors.border,
                              backgroundColor: severityColors.bg,
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <StopCircle className="h-5 w-5" style={{ color: severityColors.text }} />
                                    <span className="font-semibold" style={{ color: "#1e293b" }}>
                                      {hold.patient_name}
                                    </span>
                                    <Badge variant="outline">{hold.mrn}</Badge>
                                    <Badge
                                      style={{
                                        backgroundColor: severityColors.text,
                                        color: "#ffffff",
                                      }}
                                    >
                                      {hold.severity.toUpperCase()}
                                    </Badge>
                                    {hold.status === "active" ? (
                                      <Badge variant="destructive">ACTIVE HOLD</Badge>
                                    ) : (
                                      <Badge style={{ backgroundColor: "#16a34a", color: "#ffffff" }}>CLEARED</Badge>
                                    )}
                                  </div>

                                  <div className="mb-2">
                                    <span className="font-medium" style={{ color: severityColors.text }}>
                                      {hold.hold_type === "counselor" && "Must See Counselor"}
                                      {hold.hold_type === "nurse" && "Must See Nurse"}
                                      {hold.hold_type === "doctor" && "Must See Doctor"}
                                      {hold.hold_type === "compliance" && "Compliance Review"}
                                    </span>
                                    <span style={{ color: "#64748b" }}> - {hold.reason}</span>
                                  </div>

                                  <p className="text-sm mb-2" style={{ color: "#475569" }}>
                                    {hold.notes}
                                  </p>

                                  <div className="flex items-center gap-4 text-xs" style={{ color: "#94a3b8" }}>
                                    <span>Created by: {hold.created_by}</span>
                                    <span>
                                      {new Date(hold.created_at).toLocaleDateString()} at{" "}
                                      {new Date(hold.created_at).toLocaleTimeString()}
                                    </span>
                                  </div>

                                  {/* Clearance Status */}
                                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid #e2e8f0" }}>
                                    <p className="text-sm font-medium mb-2" style={{ color: "#1e293b" }}>
                                      Clearance Required From:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {hold.requires_clearance_from.map((role) => {
                                        const isCleared = hold.cleared_by.some((c) =>
                                          c.toLowerCase().includes(role.toLowerCase()),
                                        )
                                        return (
                                          <div
                                            key={role}
                                            className="flex items-center gap-1 px-2 py-1 rounded text-sm"
                                            style={{
                                              backgroundColor: isCleared ? "#dcfce7" : "#fee2e2",
                                              color: isCleared ? "#166534" : "#991b1b",
                                            }}
                                          >
                                            {isCleared ? (
                                              <CheckCircle className="h-3 w-3" />
                                            ) : (
                                              <Clock className="h-3 w-3" />
                                            )}
                                            {role}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>

                                {hold.status === "active" && (
                                  <div className="flex flex-col gap-2 ml-4">
                                    <Button
                                      size="sm"
                                      style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
                                      onClick={() => handleClearHold(hold.id, "Current User (Counselor)")}
                                    >
                                      <CheckCircle className="mr-1 h-4 w-4" />
                                      Clear as Counselor
                                    </Button>
                                    <Button
                                      size="sm"
                                      style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                                      onClick={() => handleClearHold(hold.id, "Current User (Nurse)")}
                                    >
                                      <CheckCircle className="mr-1 h-4 w-4" />
                                      Clear as Nurse
                                    </Button>
                                    <Button
                                      size="sm"
                                      style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
                                      onClick={() => handleClearHold(hold.id, "Current User (Physician)")}
                                    >
                                      <CheckCircle className="mr-1 h-4 w-4" />
                                      Clear as Physician
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patient Precautions Tab */}
            <TabsContent value="precautions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle style={{ color: "#1e293b" }}>Patient Precautions & Chart Notes</CardTitle>
                      <CardDescription>
                        Custom alerts and precautions that display on patient charts (water off, electric off, needs
                        assistance, etc.)
                      </CardDescription>
                    </div>
                    <Dialog open={isAddPrecautionOpen} onOpenChange={setIsAddPrecautionOpen}>
                      <DialogTrigger asChild>
                        <Button style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Precaution
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg" style={{ backgroundColor: "#ffffff" }}>
                        <DialogHeader>
                          <DialogTitle style={{ color: "#1e293b" }}>Add Patient Precaution</DialogTitle>
                          <DialogDescription>
                            {"Add a precaution or alert that will display on the patient's chart"}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <Label>Patient</Label>
                            <Select
                              value={newPrecaution.patient_id}
                              onValueChange={(v) => setNewPrecaution({ ...newPrecaution, patient_id: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="P001">John Smith (MRN-001234)</SelectItem>
                                <SelectItem value="P002">Maria Garcia (MRN-001235)</SelectItem>
                                <SelectItem value="P003">Robert Johnson (MRN-001236)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Precaution Type</Label>
                            <Select
                              value={newPrecaution.precaution_type}
                              onValueChange={(v) => setNewPrecaution({ ...newPrecaution, precaution_type: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select precaution type..." />
                              </SelectTrigger>
                              <SelectContent>
                                {defaultPrecautionTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Custom Text / Details</Label>
                            <Textarea
                              value={newPrecaution.custom_text}
                              onChange={(e) => setNewPrecaution({ ...newPrecaution, custom_text: e.target.value })}
                              placeholder="Enter specific details about this precaution..."
                              className="min-h-[100px]"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="show_on_chart"
                              checked={newPrecaution.show_on_chart}
                              onCheckedChange={(checked) =>
                                setNewPrecaution({ ...newPrecaution, show_on_chart: checked as boolean })
                              }
                            />
                            <Label htmlFor="show_on_chart">Display prominently on patient chart</Label>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddPrecautionOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreatePrecaution}
                            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
                          >
                            Add Precaution
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {precautions
                      .filter((p) => p.is_active)
                      .map((precaution) => {
                        const IconComponent = getIconComponent(precaution.icon)
                        return (
                          <Card key={precaution.id} style={{ borderLeft: `4px solid ${precaution.color}` }}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${precaution.color}20` }}>
                                    <IconComponent className="h-5 w-5" style={{ color: precaution.color }} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold" style={{ color: "#1e293b" }}>
                                        {precaution.patient_name}
                                      </span>
                                      <Badge variant="outline">{precaution.mrn}</Badge>
                                    </div>
                                    <Badge
                                      className="mb-2"
                                      style={{ backgroundColor: precaution.color, color: "#ffffff" }}
                                    >
                                      {defaultPrecautionTypes.find((t) => t.id === precaution.precaution_type)?.label ||
                                        "Custom"}
                                    </Badge>
                                    <p className="text-sm" style={{ color: "#475569" }}>
                                      {precaution.custom_text}
                                    </p>
                                    <div className="mt-2 text-xs" style={{ color: "#94a3b8" }}>
                                      Added by {precaution.created_by} on{" "}
                                      {new Date(precaution.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" style={{ color: "#ef4444" }} />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Facility Alerts Tab */}
            <TabsContent value="facility" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle style={{ color: "#1e293b" }}>Facility-Wide Alerts</CardTitle>
                      <CardDescription>
                        General alerts affecting the facility (maintenance, safety, etc.)
                      </CardDescription>
                    </div>
                    {/* CONNECTED ADD FACILITY ALERT BUTTON TO DIALOG */}
                    <Dialog open={isAddFacilityAlertOpen} onOpenChange={setIsAddFacilityAlertOpen}>
                      <DialogTrigger asChild>
                        <Button style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Facility Alert
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg" style={{ backgroundColor: "#ffffff" }}>
                        <DialogHeader>
                          <DialogTitle style={{ color: "#1e293b" }}>Create Facility Alert</DialogTitle>
                          <DialogDescription>
                            Create a facility-wide alert visible to all staff members
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <Label>Alert Type</Label>
                            <Select
                              value={newFacilityAlert.alert_type}
                              onValueChange={(v) => setNewFacilityAlert({ ...newFacilityAlert, alert_type: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select alert type..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="safety">Safety</SelectItem>
                                <SelectItem value="weather">Weather</SelectItem>
                                <SelectItem value="staffing">Staffing</SelectItem>
                                <SelectItem value="equipment">Equipment</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                                <SelectItem value="general">General Announcement</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Priority</Label>
                            <Select
                              value={newFacilityAlert.priority}
                              onValueChange={(v: any) => setNewFacilityAlert({ ...newFacilityAlert, priority: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low - Informational</SelectItem>
                                <SelectItem value="medium">Medium - Action Recommended</SelectItem>
                                <SelectItem value="high">High - Action Required</SelectItem>
                                <SelectItem value="critical">Critical - Immediate Action</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Alert Message</Label>
                            <Textarea
                              value={newFacilityAlert.message}
                              onChange={(e) => setNewFacilityAlert({ ...newFacilityAlert, message: e.target.value })}
                              placeholder="Describe the alert in detail..."
                              className="min-h-[100px]"
                            />
                          </div>

                          <div>
                            <Label>Affected Areas</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {[
                                "Lobby",
                                "Waiting Room",
                                "Dosing Window",
                                "Counseling Offices",
                                "Medical Suite",
                                "Parking Lot",
                                "Entrance",
                                "Restrooms",
                                "All Areas",
                              ].map((area) => (
                                <label key={area} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={newFacilityAlert.affected_areas.includes(area)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setNewFacilityAlert({
                                          ...newFacilityAlert,
                                          affected_areas: [...newFacilityAlert.affected_areas, area],
                                        })
                                      } else {
                                        setNewFacilityAlert({
                                          ...newFacilityAlert,
                                          affected_areas: newFacilityAlert.affected_areas.filter((a) => a !== area),
                                        })
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{area}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddFacilityAlertOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateFacilityAlert}
                            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                            disabled={!newFacilityAlert.alert_type || !newFacilityAlert.message}
                          >
                            Create Alert
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {facilityAlerts
                      .filter((a) => a.is_active)
                      .map((alert) => {
                        const priorityColors = getSeverityColor(alert.priority)
                        return (
                          <Card
                            key={alert.id}
                            style={{
                              borderColor: priorityColors.border,
                              backgroundColor: priorityColors.bg,
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle className="h-5 w-5 mt-0.5" style={{ color: priorityColors.text }} />
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge
                                        style={{
                                          backgroundColor: priorityColors.text,
                                          color: "#ffffff",
                                        }}
                                      >
                                        {alert.priority.toUpperCase()}
                                      </Badge>
                                      <Badge variant="outline">{alert.alert_type}</Badge>
                                    </div>
                                    <p className="font-medium" style={{ color: "#1e293b" }}>
                                      {alert.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                                        Affected areas:
                                      </span>
                                      {alert.affected_areas.map((area) => (
                                        <Badge key={area} variant="outline" className="text-xs">
                                          {area}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                                      Posted by {alert.created_by} on {new Date(alert.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                {/* MADE DISMISS BUTTON FUNCTIONAL */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDismissFacilityAlert(alert.id)}
                                  title="Dismiss Alert"
                                >
                                  <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}

                    {/* ADDED EMPTY STATE WHEN NO FACILITY ALERTS */}
                    {facilityAlerts.filter((a) => a.is_active).length === 0 && (
                      <div className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-3" style={{ color: "#94a3b8" }} />
                        <p className="font-medium" style={{ color: "#64748b" }}>
                          No Active Facility Alerts
                        </p>
                        <p className="text-sm" style={{ color: "#94a3b8" }}>
                          Click "Add Facility Alert" to create a new alert
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
