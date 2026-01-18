"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { useToast } from "@/hooks/use-toast"
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
  Loader2,
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

interface Patient {
  id: string
  first_name: string
  last_name: string
  mrn?: string | null
}

export default function ClinicalAlertsPage() {
  const { toast } = useToast()
  const [dosingHolds, setDosingHolds] = useState<DosingHold[]>([])
  const [precautions, setPrecautions] = useState<PatientPrecaution[]>([])
  const [facilityAlerts, setFacilityAlerts] = useState<FacilityAlert[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddHoldOpen, setIsAddHoldOpen] = useState(false)
  const [isAddPrecautionOpen, setIsAddPrecautionOpen] = useState(false)
  const [isAddFacilityAlertOpen, setIsAddFacilityAlertOpen] = useState(false)
  const [isEditFacilityAlertOpen, setIsEditFacilityAlertOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<FacilityAlert | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDismissing, setIsDismissing] = useState<string | null>(null)
  const [isCreatingHold, setIsCreatingHold] = useState(false)

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
  const [newFacilityAlert, setNewFacilityAlert] = useState<{
    alert_type: string;
    message: string;
    priority: "low" | "medium" | "high" | "critical";
    affected_areas: string[];
  }>({
    alert_type: "",
    message: "",
    priority: "medium",
    affected_areas: [],
  })

  // Edit facility alert form state
  const [editFacilityAlert, setEditFacilityAlert] = useState<{
    alert_type: string;
    message: string;
    priority: "low" | "medium" | "high" | "critical";
    affected_areas: string[];
  }>({
    alert_type: "",
    message: "",
    priority: "medium",
    affected_areas: [],
  })

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true)
    try {
      const response = await fetch("/api/patients?limit=200")
      const data = await response.json()
      
      if (response.ok) {
        // Handle both possible response structures
        const patientsList = data.patients || data || []
        console.log("[Clinical Alerts] Loaded patients:", patientsList.length, {
          responseStatus: response.status,
          hasPatientsKey: !!data.patients,
          dataKeys: Object.keys(data),
          firstPatient: patientsList[0],
        })
        
        if (Array.isArray(patientsList)) {
          setPatients(patientsList)
        } else {
          console.error("[Clinical Alerts] Patients data is not an array:", patientsList)
          setPatients([])
          toast({
            title: "Warning",
            description: "Patient data format is invalid. Please refresh the page.",
            variant: "destructive",
          })
        }
      } else {
        // Handle error response
        const errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`
        console.error("[Clinical Alerts] Failed to load patients:", {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          data,
        })
        setPatients([])
        toast({
          title: "Warning",
          description: errorMessage || "Failed to load patient list. Please refresh the page.",
          variant: "destructive",
        })
      }
    } catch (e: any) {
      console.error("[Clinical Alerts] Error loading patients:", e)
      setPatients([])
      toast({
        title: "Error",
        description: e.message || "Failed to load patient list. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoadingPatients(false)
    }
  }, [toast])

  // Load data on component mount
  useEffect(() => {
    loadData()
    loadPatients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload patients when dialogs open to ensure fresh data
  // Use refs to track previous dialog state to only trigger on open, not close
  const prevHoldOpenRef = useRef(false)
  const prevPrecautionOpenRef = useRef(false)

  useEffect(() => {
    // Only reload when dialog transitions from closed to open (not on every state change)
    const justOpened = isAddHoldOpen && !prevHoldOpenRef.current
    if (justOpened) {
      // loadPatients handles its own loading state, so we don't need to check loadingPatients here
      loadPatients()
    }
    prevHoldOpenRef.current = isAddHoldOpen
    // Note: Intentionally not including loadPatients in deps to avoid infinite loops
    // loadPatients is a useCallback that depends on toast, which could change and cause loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddHoldOpen])

  useEffect(() => {
    // Only reload when dialog transitions from closed to open (not on every state change)
    const justOpened = isAddPrecautionOpen && !prevPrecautionOpenRef.current
    if (justOpened) {
      // loadPatients handles its own loading state, so we don't need to check loadingPatients here
      loadPatients()
    }
    prevPrecautionOpenRef.current = isAddPrecautionOpen
    // Note: Intentionally not including loadPatients in deps to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddPrecautionOpen])

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
    // Validation
    if (!newHold.patient_id || !newHold.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Patient and Reason).",
        variant: "destructive",
      })
      return
    }

    setIsCreatingHold(true)
    try {
      const response = await fetch("/api/clinical-alerts/holds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: newHold.patient_id,
          hold_type: newHold.hold_type,
          reason: newHold.reason,
          created_by: "Current User",
          created_by_role: "Provider",
          requires_clearance_from: newHold.requires_clearance_from,
          notes: newHold.notes,
          severity: newHold.severity,
        }),
      })

      if (response.ok) {
        // Reload data to get the properly formatted hold with patient info
        await loadData()
        toast({
          title: "Success",
          description: "Dosing hold created successfully.",
        })
        setIsAddHoldOpen(false)
        setNewHold({
          patient_id: "",
          hold_type: "counselor",
          reason: "",
          requires_clearance_from: [],
          notes: "",
          severity: "medium",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create dosing hold")
      }
    } catch (e: any) {
      console.error("Error creating dosing hold:", e)
      toast({
        title: "Error",
        description: e.message || "Failed to create dosing hold. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingHold(false)
    }
  }

  const handleClearHold = async (holdId: string, clearedBy: string) => {
    try {
      const response = await fetch("/api/clinical-alerts/holds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: holdId,
          cleared_by: clearedBy,
        }),
      })

      if (response.ok) {
        // Reload data to get updated hold status
        await loadData()
        toast({
          title: "Success",
          description: "Hold clearance updated successfully.",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update hold")
      }
    } catch (e: any) {
      console.error("Error clearing hold:", e)
      toast({
        title: "Error",
        description: e.message || "Failed to update hold clearance. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreatePrecaution = async () => {
    // Validation
    if (!newPrecaution.patient_id || !newPrecaution.precaution_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Patient and Precaution Type).",
        variant: "destructive",
      })
      return
    }

    const precautionType = defaultPrecautionTypes.find((t) => t.id === newPrecaution.precaution_type)
    
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/clinical-alerts/precautions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: newPrecaution.patient_id,
          precaution_type: newPrecaution.precaution_type,
          custom_text: newPrecaution.custom_text,
          icon: precautionType?.icon || "FileText",
          color: precautionType?.color || "#64748b",
          created_by: "Current User",
          show_on_chart: newPrecaution.show_on_chart,
        }),
      })

      if (response.ok) {
        // Reload data to get the properly formatted precaution with patient info
        await loadData()
        toast({
          title: "Success",
          description: "Patient precaution created successfully.",
        })
        setIsAddPrecautionOpen(false)
        setNewPrecaution({
          patient_id: "",
          precaution_type: "",
          custom_text: "",
          show_on_chart: true,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create precaution")
      }
    } catch (e: any) {
      console.error("Error creating precaution:", e)
      toast({
        title: "Error",
        description: e.message || "Failed to create precaution. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ADDED FUNCTION: handleCreateFacilityAlert
  const handleCreateFacilityAlert = async () => {
    // Validation
    if (!newFacilityAlert.alert_type || !newFacilityAlert.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Alert Type and Message).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
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
        toast({
          title: "Success",
          description: "Facility alert created successfully.",
        })
        setIsAddFacilityAlertOpen(false)
        setNewFacilityAlert({
          alert_type: "",
          message: "",
          priority: "medium",
          affected_areas: [],
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create alert")
      }
    } catch (e: any) {
      console.error("Error creating facility alert:", e)
      toast({
        title: "Error",
        description: e.message || "Failed to create facility alert. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ADDED FUNCTION: handleDismissFacilityAlert
  const handleDismissFacilityAlert = async (alertId: string) => {
    setIsDismissing(alertId)
    try {
      const response = await fetch(`/api/clinical-alerts/facility/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismiss: true, is_active: false }),
      })

      if (response.ok) {
        const data = await response.json()
        setFacilityAlerts(
          facilityAlerts.map((alert) => (alert.id === alertId ? { ...alert, is_active: false } : alert))
        )
        toast({
          title: "Success",
          description: "Facility alert dismissed successfully.",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to dismiss alert")
      }
    } catch (e: any) {
      console.error("Error dismissing facility alert:", e)
      toast({
        title: "Error",
        description: e.message || "Failed to dismiss facility alert. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDismissing(null)
    }
  }

  // NEW FUNCTION: handleEditFacilityAlert
  const handleEditFacilityAlert = (alert: FacilityAlert) => {
    setEditingAlert(alert)
    setEditFacilityAlert({
      alert_type: alert.alert_type,
      message: alert.message,
      priority: alert.priority,
      affected_areas: alert.affected_areas,
    })
    setIsEditFacilityAlertOpen(true)
  }

  // NEW FUNCTION: handleUpdateFacilityAlert
  const handleUpdateFacilityAlert = async () => {
    if (!editingAlert) return

    // Validation
    if (!editFacilityAlert.alert_type || !editFacilityAlert.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Alert Type and Message).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/clinical-alerts/facility/${editingAlert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_type: editFacilityAlert.alert_type,
          message: editFacilityAlert.message,
          priority: editFacilityAlert.priority,
          affected_areas: editFacilityAlert.affected_areas,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFacilityAlerts(
          facilityAlerts.map((alert) =>
            alert.id === editingAlert.id
              ? {
                  ...alert,
                  alert_type: data.alert.alert_type,
                  message: data.alert.message,
                  priority: data.alert.priority,
                  affected_areas: data.alert.affected_areas,
                }
              : alert
          )
        )
        toast({
          title: "Success",
          description: "Facility alert updated successfully.",
        })
        setIsEditFacilityAlertOpen(false)
        setEditingAlert(null)
        setEditFacilityAlert({
          alert_type: "",
          message: "",
          priority: "medium",
          affected_areas: [],
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update alert")
      }
    } catch (e: any) {
      console.error("Error updating facility alert:", e)
      toast({
        title: "Error",
        description: e.message || "Failed to update facility alert. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
                            <div className="flex items-center justify-between mb-2">
                              <Label>Patient <span style={{ color: "#ef4444" }}>*</span></Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => loadPatients()}
                                disabled={loadingPatients}
                                className="h-6 text-xs"
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${loadingPatients ? "animate-spin" : ""}`} />
                                Refresh
                              </Button>
                            </div>
                            <Select
                              value={newHold.patient_id}
                              onValueChange={(v) => setNewHold({ ...newHold, patient_id: v })}
                              disabled={loadingPatients}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select patient..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {loadingPatients ? (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    Loading patients...
                                  </div>
                                ) : patients.length > 0 ? (
                                  patients.map((patient) => (
                                    <SelectItem key={patient.id} value={patient.id}>
                                      {patient.first_name} {patient.last_name}
                                      {patient.mrn ? ` (MRN: ${patient.mrn})` : ""}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No patients available. Click Refresh to reload.
                                  </div>
                                )}
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
                          <Button
                            variant="outline"
                            onClick={() => setIsAddHoldOpen(false)}
                            disabled={isCreatingHold}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateHold}
                            style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                            disabled={!newHold.patient_id || !newHold.reason || isCreatingHold}
                          >
                            {isCreatingHold ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create Hold"
                            )}
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
                            <div className="flex items-center justify-between mb-2">
                              <Label>Patient <span style={{ color: "#ef4444" }}>*</span></Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => loadPatients()}
                                disabled={loadingPatients}
                                className="h-6 text-xs"
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${loadingPatients ? "animate-spin" : ""}`} />
                                Refresh
                              </Button>
                            </div>
                            <Select
                              value={newPrecaution.patient_id}
                              onValueChange={(v) => setNewPrecaution({ ...newPrecaution, patient_id: v })}
                              disabled={loadingPatients}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select patient..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {loadingPatients ? (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    Loading patients...
                                  </div>
                                ) : patients.length > 0 ? (
                                  patients.map((patient) => (
                                    <SelectItem key={patient.id} value={patient.id}>
                                      {patient.first_name} {patient.last_name}
                                      {patient.mrn ? ` (MRN: ${patient.mrn})` : ""}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No patients available. Click Refresh to reload.
                                  </div>
                                )}
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
                          <Button 
                            variant="outline" 
                            onClick={() => setIsAddPrecautionOpen(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreatePrecaution}
                            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
                            disabled={!newPrecaution.patient_id || !newPrecaution.precaution_type || isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Add Precaution"
                            )}
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
                            <Label>Alert Type <span style={{ color: "#ef4444" }}>*</span></Label>
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
                            <Label>Priority <span style={{ color: "#ef4444" }}>*</span></Label>
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
                            <Label>Alert Message <span style={{ color: "#ef4444" }}>*</span></Label>
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
                          <Button
                            variant="outline"
                            onClick={() => setIsAddFacilityAlertOpen(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateFacilityAlert}
                            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                            disabled={!newFacilityAlert.alert_type || !newFacilityAlert.message.trim() || isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create Alert"
                            )}
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
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditFacilityAlert(alert)}
                                    title="Edit Alert"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDismissFacilityAlert(alert.id)}
                                    title="Dismiss Alert"
                                    disabled={isDismissing === alert.id}
                                  >
                                    {isDismissing === alert.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#ef4444" }} />
                                    ) : (
                                      <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
                                    )}
                                  </Button>
                                </div>
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

              {/* Edit Facility Alert Dialog */}
              <Dialog open={isEditFacilityAlertOpen} onOpenChange={setIsEditFacilityAlertOpen}>
                <DialogContent className="max-w-lg" style={{ backgroundColor: "#ffffff" }}>
                  <DialogHeader>
                    <DialogTitle style={{ color: "#1e293b" }}>Edit Facility Alert</DialogTitle>
                    <DialogDescription>Update the facility-wide alert details</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label>Alert Type <span style={{ color: "#ef4444" }}>*</span></Label>
                      <Select
                        value={editFacilityAlert.alert_type}
                        onValueChange={(v) => setEditFacilityAlert({ ...editFacilityAlert, alert_type: v })}
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
                      <Label>Priority <span style={{ color: "#ef4444" }}>*</span></Label>
                      <Select
                        value={editFacilityAlert.priority}
                        onValueChange={(v: any) => setEditFacilityAlert({ ...editFacilityAlert, priority: v })}
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
                      <Label>Alert Message <span style={{ color: "#ef4444" }}>*</span></Label>
                      <Textarea
                        value={editFacilityAlert.message}
                        onChange={(e) => setEditFacilityAlert({ ...editFacilityAlert, message: e.target.value })}
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
                              checked={editFacilityAlert.affected_areas.includes(area)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setEditFacilityAlert({
                                    ...editFacilityAlert,
                                    affected_areas: [...editFacilityAlert.affected_areas, area],
                                  })
                                } else {
                                  setEditFacilityAlert({
                                    ...editFacilityAlert,
                                    affected_areas: editFacilityAlert.affected_areas.filter((a) => a !== area),
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
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditFacilityAlertOpen(false)
                        setEditingAlert(null)
                        setEditFacilityAlert({
                          alert_type: "",
                          message: "",
                          priority: "medium",
                          affected_areas: [],
                        })
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateFacilityAlert}
                      style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                      disabled={
                        !editFacilityAlert.alert_type || !editFacilityAlert.message.trim() || isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Alert"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
