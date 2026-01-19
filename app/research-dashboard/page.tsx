"use client"

import { useState, useEffect, useCallback } from "react"
import * as XLSX from "xlsx"
// jsPDF and jspdf-autotable will be dynamically imported in the exportToPDF function
import { createClient } from "@/lib/supabase/client"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Database,
  FileBarChart,
  TrendingUp,
  Users,
  Shield,
  Download,
  Plus,
  Search,
  Target,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Microscope,
  Lightbulb,
  BookOpen,
  Heart,
  Activity,
  Zap,
  Award,
  Building2,
  ArrowRight,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  Loader2,
  Edit,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  FileDown,
  BarChart3,
  GitCompare,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  MultiMetricTrendChart,
  CategoryPerformanceChart,
  BenchmarkRadarChart,
  StatusDistributionChart,
} from "@/components/quality-metrics-chart"
import { HealthEquityDashboard } from "@/components/health-equity-dashboard"

interface ResearchStudy {
  id: string
  title: string
  study_type: "implementation" | "pilot" | "quality_improvement" | "outcomes" | "equity"
  status: "planning" | "active" | "data_collection" | "analysis" | "completed" | "cancelled"
  pi_name: string
  pi_email: string | null
  pi_phone: string | null
  start_date: string
  end_date: string
  enrollment_target: number
  current_enrollment: number
  irb_status: "pending" | "approved" | "exempt" | "rejected" | "expired"
  irb_number: string | null
  irb_approval_date: string | null
  irb_expiration_date: string | null
  funding_source: string | null
  funding_amount: number | string | null
  grant_number: string | null
  description: string | null
  organization_id?: string
  created_at?: string
  updated_at?: string
}

interface EvidenceBasedPractice {
  id: string
  name: string
  category: string
  description?: string
  adoption_rate: number
  fidelity_score: number
  sustainability_score: number
  trained_staff: number
  total_staff: number
  last_fidelity_review: string | null
  outcomes_tracked: string[]
  created_at?: string
  is_active?: boolean
}

interface QualityMetric {
  id: string
  name: string
  code?: string
  category: string
  description?: string
  current_value: number | null
  target_value: number
  benchmark_value?: number
  benchmark_source?: string
  trend: "up" | "down" | "stable" | null
  trend_percentage?: number
  data_source?: string
  calculation_method?: string
  reporting_period?: string
  higher_is_better?: boolean
  warning_threshold?: number
  critical_threshold?: number
  is_active?: boolean
  is_ccbhc_required?: boolean
  is_mips_measure?: boolean
  unit?: string
  meets_target?: boolean
  meets_benchmark?: boolean
  last_calculated?: string
  historical_data?: Array<{ snapshot_date: string; current_value: number }>
}

interface QualityMetricsSummary {
  total_metrics: number
  active_metrics: number
  meeting_target: number
  meeting_benchmark: number
  below_warning: number
  below_critical: number
  average_performance: number
}

export default function ResearchDashboardPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewStudyDialog, setShowNewStudyDialog] = useState(false)
  const [showDataExportDialog, setShowDataExportDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Research studies state
  const [studies, setStudies] = useState<ResearchStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Form state for new study
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    study_type: "implementation" as ResearchStudy["study_type"],
    status: "planning" as ResearchStudy["status"],
    pi_name: "",
    pi_email: "",
    pi_phone: "",
    start_date: "",
    end_date: "",
    enrollment_target: "",
    funding_source: "",
    irb_status: "pending" as ResearchStudy["irb_status"],
    irb_number: "",
    irb_approval_date: "",
    irb_expiration_date: "",
    funding_amount: "",
    grant_number: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Editing state
  const [editingStudy, setEditingStudy] = useState<ResearchStudy | null>(null)
  
  // View Details and Data Dashboard state
  const [selectedStudy, setSelectedStudy] = useState<ResearchStudy | null>(null)
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false)
  const [showDataDashboardDialog, setShowDataDashboardDialog] = useState(false)
  const [studyDetails, setStudyDetails] = useState<ResearchStudy | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)

  // Enrollment dialog state
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [enrollingPatient, setEnrollingPatient] = useState(false)
  const [enrollmentFormData, setEnrollmentFormData] = useState({
    patient_id: "",
    consent_obtained: false,
    consent_date: "",
    consent_document_url: "",
    enrolled_date: new Date().toISOString().split('T')[0],
  })
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [uploadingConsent, setUploadingConsent] = useState(false)
  const [consentFile, setConsentFile] = useState<File | null>(null)

  // Export format dialog state
  const [showExportFormatDialog, setShowExportFormatDialog] = useState(false)
  const [selectedStudyForExport, setSelectedStudyForExport] = useState<ResearchStudy | null>(null)
  const [exporting, setExporting] = useState(false)
  const [patientSearchTerm, setPatientSearchTerm] = useState("")

  // Participant status management state
  const [showParticipantStatusDialog, setShowParticipantStatusDialog] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null)
  const [updatingParticipant, setUpdatingParticipant] = useState(false)
  const [participantStatusFormData, setParticipantStatusFormData] = useState({
    enrollment_status: "enrolled" as "enrolled" | "withdrawn" | "completed" | "lost_to_followup",
    withdrawal_date: "",
    withdrawal_reason: "",
  })
  const [participantStatusError, setParticipantStatusError] = useState<string | null>(null)

  // Participant detail view state
  const [showParticipantDetailDialog, setShowParticipantDetailDialog] = useState(false)
  const [selectedParticipantForDetail, setSelectedParticipantForDetail] = useState<any | null>(null)
  const [loadingParticipantDetail, setLoadingParticipantDetail] = useState(false)
  const [participantDetailData, setParticipantDetailData] = useState<any | null>(null)

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [ebpNotifications, setEbpNotifications] = useState<any[]>([])
  const [loadingEbpNotifications, setLoadingEbpNotifications] = useState(false)
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)

  // Analytics state
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Helper function to format DATE strings without timezone conversion
  // PostgreSQL DATE fields are stored as "YYYY-MM-DD" and should be displayed as-is
  const formatDateForDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A"
    // Extract date part (in case it includes time)
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-')
    if (!year || !month || !day) return dateString
    // Format as M/D/YYYY (US format) without timezone conversion
    return `${parseInt(month)}/${parseInt(day)}/${year}`
  }

  // Helper function to check fidelity assessment recency and return status
  // Returns: { status: 'current' | 'due_soon' | 'overdue' | 'never', daysSince: number | null, message: string }
  const getFidelityRecencyStatus = (lastReviewDate: string | null | undefined): {
    status: 'current' | 'due_soon' | 'overdue' | 'never'
    daysSince: number | null
    message: string
    color: string
  } => {
    if (!lastReviewDate) {
      return { 
        status: 'never', 
        daysSince: null, 
        message: 'No assessment recorded',
        color: 'text-gray-500'
      }
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const reviewDate = new Date(lastReviewDate)
    reviewDate.setHours(0, 0, 0, 0)
    
    const daysSince = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Fidelity assessments are typically done quarterly (90 days)
    // - Current: within 90 days
    // - Due Soon: 60-90 days (approaching due date)
    // - Overdue: more than 90 days
    if (daysSince <= 60) {
      return { 
        status: 'current', 
        daysSince, 
        message: `${daysSince} days ago`,
        color: 'text-green-600'
      }
    } else if (daysSince <= 90) {
      return { 
        status: 'due_soon', 
        daysSince, 
        message: `${daysSince} days ago - Due soon`,
        color: 'text-yellow-600'
      }
    } else {
      return { 
        status: 'overdue', 
        daysSince, 
        message: `${daysSince} days ago - Overdue`,
        color: 'text-red-600'
      }
    }
  }

  // Fetch studies from API
  const fetchStudies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        type: typeFilter,
        page: currentPage.toString(),
        limit: "10",
      })

      const response = await fetch(`/api/research/studies?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch studies")
      }

      setStudies(data.studies || [])
      setTotalCount(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load studies")
      setStudies([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, typeFilter, currentPage])

  // Fetch studies on mount and when filters change
  useEffect(() => {
    fetchStudies()
  }, [fetchStudies])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1) // Reset to first page on search
      fetchStudies()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true)
    try {
      const response = await fetch("/api/research/notifications")
      const data = await response.json()
      if (response.ok && data.notifications) {
        setNotifications(data.notifications)
      }
    } catch (err) {
      console.error("Error fetching notifications:", err)
    } finally {
      setLoadingNotifications(false)
    }
  }, [])

  // Fetch EBP notifications
  const fetchEbpNotifications = useCallback(async () => {
    setLoadingEbpNotifications(true)
    try {
      const response = await fetch("/api/evidence-based-practices/notifications")
      const data = await response.json()
      if (response.ok && data.notifications) {
        setEbpNotifications(data.notifications)
      }
    } catch (err) {
      console.error("Error fetching EBP notifications:", err)
    } finally {
      setLoadingEbpNotifications(false)
    }
  }, [])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true)
    try {
      const response = await fetch("/api/research/analytics")
      const data = await response.json()
      if (response.ok && data.analytics) {
        setAnalytics(data.analytics)
      }
    } catch (err) {
      console.error("Error fetching analytics:", err)
    } finally {
      setLoadingAnalytics(false)
    }
  }, [])

  // Load notifications and analytics on mount
  useEffect(() => {
    fetchNotifications()
    fetchAnalytics()
    fetchEbpNotifications()
  }, [fetchNotifications, fetchAnalytics, fetchEbpNotifications])

  // Handle create/update study
  const handleCreateStudy = async () => {
    setSubmitting(true)
    setFormError(null)

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error("Study title is required")
      }
      if (!formData.pi_name.trim()) {
        throw new Error("Principal Investigator name is required")
      }
      if (!formData.start_date || !formData.end_date) {
        throw new Error("Start date and end date are required")
      }
      if (!formData.enrollment_target || parseInt(formData.enrollment_target) <= 0) {
        throw new Error("Enrollment target must be greater than 0")
      }
      
      // Phase 2: IRB validation
      if (formData.irb_status === "approved" && !formData.irb_approval_date) {
        throw new Error("IRB approval date is required when status is 'approved'")
      }
      // Only block future dates if status is "approved"
      // Allow future dates for pending/rejected/etc. (for planning purposes)
      if (formData.irb_approval_date && 
          formData.irb_approval_date > new Date().toISOString().split('T')[0] && 
          formData.irb_status === "approved") {
        throw new Error("IRB approval date cannot be in the future when status is 'approved'")
      }
      if (formData.irb_approval_date && formData.irb_expiration_date && 
          formData.irb_expiration_date <= formData.irb_approval_date) {
        throw new Error("IRB expiration date must be after approval date")
      }

      const isEditing = editingStudy !== null
      const url = isEditing ? `/api/research/studies/${editingStudy.id}` : "/api/research/studies"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Get error message from response
        let errorMessage = `Failed to ${isEditing ? "update" : "create"} study`
        const contentType = response.headers.get("content-type")
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch (e) {
            errorMessage = response.statusText || errorMessage
          }
        } else {
          try {
            const errorText = await response.text()
            errorMessage = errorText || response.statusText || errorMessage
          } catch (e) {
            errorMessage = response.statusText || errorMessage
          }
        }
        throw new Error(errorMessage)
      }

      // Parse JSON only if response is ok
      const data = await response.json()

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        study_type: "implementation",
        status: "planning",
        pi_name: "",
        pi_email: "",
        pi_phone: "",
        start_date: "",
        end_date: "",
        enrollment_target: "",
        funding_source: "",
        irb_status: "pending",
        irb_number: "",
        irb_approval_date: "",
        irb_expiration_date: "",
        funding_amount: "",
        grant_number: "",
      })
      setEditingStudy(null)
      setShowNewStudyDialog(false)
      await fetchStudies()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save study")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete study
  const handleDeleteStudy = async (studyId: string) => {
    if (!confirm("Are you sure you want to delete this study?")) {
      return
    }

    try {
      const response = await fetch(`/api/research/studies/${studyId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete study")
      }

      await fetchStudies()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Failed to delete study",
      })
    }
  }

  // Handle View Details
  const handleViewDetails = async (study: ResearchStudy) => {
    setSelectedStudy(study)
    setLoadingDetails(true)
    setShowViewDetailsDialog(true)
    
    // IMPORTANT: Reset participants immediately to prevent showing data from previous study
    setParticipants([])
    
    try {
      const response = await fetch(`/api/research/studies/${study.id}`)
      const data = await response.json()
      
      if (response.ok && data.study) {
        setStudyDetails(data.study)
        
        // Fetch participants for THIS specific study
        const participantsResponse = await fetch(`/api/research/studies/${study.id}/participants`)
        const participantsData = await participantsResponse.json()
        if (participantsResponse.ok) {
          setParticipants(participantsData.participants || [])
        } else {
          // Ensure participants is empty if fetch fails
          setParticipants([])
        }
      } else {
        setStudyDetails(study)
        setParticipants([])
      }
    } catch (err) {
      console.error("Error fetching study details:", err)
      setStudyDetails(study)
      // Ensure participants is empty on error
      setParticipants([])
    } finally {
      setLoadingDetails(false)
    }
  }

  // Handle Data Dashboard
  const handleDataDashboard = async (study: ResearchStudy) => {
    setSelectedStudy(study)
    setLoadingParticipants(true)
    setShowDataDashboardDialog(true)
    
    // IMPORTANT: Reset participants immediately to prevent showing data from previous study
    setParticipants([])
    setStudyDetails(null)
    
    try {
      // Fetch detailed study data and participants for THIS specific study
      const [studyResponse, participantsResponse] = await Promise.all([
        fetch(`/api/research/studies/${study.id}`),
        fetch(`/api/research/studies/${study.id}/participants`)
      ])
      
      const studyData = await studyResponse.json()
      const participantsData = await participantsResponse.json()
      
      if (studyResponse.ok && studyData.study) {
        setStudyDetails(studyData.study)
      } else {
        setStudyDetails(study)
      }
      
      if (participantsResponse.ok) {
        setParticipants(participantsData.participants || [])
      } else {
        // Ensure participants is empty if fetch fails
        setParticipants([])
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setStudyDetails(study)
      setParticipants([])
    } finally {
      setLoadingParticipants(false)
    }
  }

  // Open Export Format Dialog
  const handleExportData = (study: ResearchStudy) => {
    setSelectedStudyForExport(study)
    setShowExportFormatDialog(true)
  }

  // Export to Excel with multiple sheets
  const exportToExcel = async (study: ResearchStudy) => {
    setExporting(true)
    try {
      // Fetch full study data and participants
      const [studyResponse, participantsResponse] = await Promise.all([
        fetch(`/api/research/studies/${study.id}`),
        fetch(`/api/research/studies/${study.id}/participants`)
      ])
      
      const studyData = await studyResponse.json()
      const participantsData = await participantsResponse.json()
      
      const fullStudy = studyResponse.ok && studyData.study ? studyData.study : study
      const studyParticipants = participantsResponse.ok ? (participantsData.participants || []) : []
      const stats = participantsResponse.ok ? (participantsData.statistics || {}) : {}

      // Create workbook
      const workbook = XLSX.utils.book_new()

      // Sheet 1: Study Overview
      const studyOverview = [
        ["Study Information", ""],
        ["Title", fullStudy.title || "N/A"],
        ["Description", fullStudy.description || "N/A"],
        ["Study Type", fullStudy.study_type || "N/A"],
        ["Status", fullStudy.status || "N/A"],
        ["Principal Investigator", fullStudy.pi_name || "N/A"],
        ["PI Email", fullStudy.pi_email || "N/A"],
        ["PI Phone", fullStudy.pi_phone || "N/A"],
        ["Start Date", fullStudy.start_date || "N/A"],
        ["End Date", fullStudy.end_date || "N/A"],
        ["Enrollment Target", fullStudy.enrollment_target || 0],
        ["Current Enrollment", fullStudy.current_enrollment || 0],
        ["IRB Status", fullStudy.irb_status || "N/A"],
        ["IRB Number", fullStudy.irb_number || "N/A"],
        ["IRB Approval Date", fullStudy.irb_approval_date || "N/A"],
        ["IRB Expiration Date", fullStudy.irb_expiration_date || "N/A"],
        ["Funding Source", fullStudy.funding_source || "N/A"],
        ["Funding Amount", fullStudy.funding_amount || "N/A"],
        ["Grant Number", fullStudy.grant_number || "N/A"],
        ["Created At", fullStudy.created_at ? new Date(fullStudy.created_at).toLocaleString() : "N/A"],
        ["Updated At", fullStudy.updated_at ? new Date(fullStudy.updated_at).toLocaleString() : "N/A"],
      ]
      const studySheet = XLSX.utils.aoa_to_sheet(studyOverview)
      XLSX.utils.book_append_sheet(workbook, studySheet, "Study Overview")

      // Sheet 2: Enrollment Statistics
      const enrollmentStats = [
        ["Enrollment Statistics", ""],
        ["Total Participants", stats.total || 0],
        ["Currently Enrolled", stats.enrolled || 0],
        ["Withdrawn", stats.withdrawn || 0],
        ["Completed", stats.completed || 0],
        ["Lost to Follow-up", stats.lostToFollowup || 0],
        ["Consent Obtained", stats.consentObtained || 0],
        ["Consent Rate", stats.total > 0 ? `${((stats.consentObtained || 0) / stats.total * 100).toFixed(1)}%` : "0%"],
        ["Enrollment Progress", `${fullStudy.current_enrollment || 0} / ${fullStudy.enrollment_target || 0} (${fullStudy.enrollment_target > 0 ? ((fullStudy.current_enrollment || 0) / fullStudy.enrollment_target * 100).toFixed(1) : 0}%)`],
      ]
      const statsSheet = XLSX.utils.aoa_to_sheet(enrollmentStats)
      XLSX.utils.book_append_sheet(workbook, statsSheet, "Enrollment Statistics")

      // Sheet 3: Participants Detail
      const participantsDataArray = [
        ["Participant ID", "Patient ID", "Enrolled Date", "Enrollment Status", "Withdrawal Date", "Withdrawal Reason", "Consent Obtained", "Consent Date", "Consent Document URL", "Enrolled By", "Created At", "Updated At"]
      ]
      
      studyParticipants.forEach((p: any) => {
        participantsDataArray.push([
          p.id || "N/A",
          p.patient_id || "N/A",
          p.enrolled_date || "N/A",
          p.enrollment_status || "N/A",
          p.withdrawal_date || "N/A",
          p.withdrawal_reason || "N/A",
          p.consent_obtained ? "Yes" : "No",
          p.consent_date || "N/A",
          p.consent_document_url || "N/A",
          p.enrolled_by || "N/A",
          p.created_at ? new Date(p.created_at).toLocaleString() : "N/A",
          p.updated_at ? new Date(p.updated_at).toLocaleString() : "N/A",
        ])
      })
      
      const participantsSheet = XLSX.utils.aoa_to_sheet(participantsDataArray)
      XLSX.utils.book_append_sheet(workbook, participantsSheet, "Participants")

      // Generate Excel file
      const fileName = `research_study_${study.id}_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)

      setShowExportFormatDialog(false)
      setSelectedStudyForExport(null)
    } catch (err) {
      console.error("Error exporting to Excel:", err)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export to Excel. Please try again.",
      })
    } finally {
      setExporting(false)
    }
  }

  // Export to PDF
  const exportToPDF = async (study: ResearchStudy) => {
    setExporting(true)
    try {
      // Dynamically import jsPDF and jspdf-autotable to ensure proper loading in Next.js
      // jspdf-autotable v5+ requires importing autoTable as a named export function
      const [jsPDFModule, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ])

      const jsPDF = jsPDFModule.default
      // Try named export first, fallback to default if needed
      let autoTable = (autoTableModule as any).autoTable || (autoTableModule as any).default
      
      // If autoTable is not available, try using applyPlugin approach
      if (!autoTable && (autoTableModule as any).applyPlugin) {
        (autoTableModule as any).applyPlugin(jsPDF)
        // After applying plugin, autoTable becomes a method on the instance
        autoTable = null // Will use doc.autoTable instead
      }

      // Fetch full study data and participants
      const [studyResponse, participantsResponse] = await Promise.all([
        fetch(`/api/research/studies/${study.id}`),
        fetch(`/api/research/studies/${study.id}/participants`)
      ])
      
      const studyData = await studyResponse.json()
      const participantsData = await participantsResponse.json()
      
      const fullStudy = studyResponse.ok && studyData.study ? studyData.study : study
      const studyParticipants = participantsResponse.ok ? (participantsData.participants || []) : []
      const stats = participantsResponse.ok ? (participantsData.statistics || {}) : {}

      // Create PDF
      const doc = new jsPDF()
      
      // Verify autoTable is available (either as function or method)
      const hasAutoTableFunction = typeof autoTable === 'function'
      const hasAutoTableMethod = typeof (doc as any).autoTable === 'function'
      
      if (!hasAutoTableFunction && !hasAutoTableMethod) {
        throw new Error("autoTable is not available. Please ensure jspdf-autotable v5+ is properly installed.")
      }
      
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let yPos = margin
      
      // Helper function to call autoTable (supports both v4 and v5+ APIs)
      const callAutoTable = (options: any) => {
        if (hasAutoTableFunction) {
          autoTable(doc, options)
        } else {
          (doc as any).autoTable(options)
        }
      }

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage()
          yPos = margin
        }
      }

      // Header
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("Research Study Report", margin, yPos)
      yPos += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)
      yPos += 15

      // Study Information Section
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Study Information", margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const studyInfo = [
        ["Field", "Value"],
        ["Title", fullStudy.title || "N/A"],
        ["Description", fullStudy.description || "N/A"],
        ["Study Type", fullStudy.study_type || "N/A"],
        ["Status", fullStudy.status || "N/A"],
        ["Principal Investigator", fullStudy.pi_name || "N/A"],
        ["PI Email", fullStudy.pi_email || "N/A"],
        ["PI Phone", fullStudy.pi_phone || "N/A"],
        ["Start Date", fullStudy.start_date || "N/A"],
        ["End Date", fullStudy.end_date || "N/A"],
        ["Enrollment Target", String(fullStudy.enrollment_target || 0)],
        ["Current Enrollment", String(fullStudy.current_enrollment || 0)],
        ["IRB Status", fullStudy.irb_status || "N/A"],
        ["IRB Number", fullStudy.irb_number || "N/A"],
        ["IRB Approval Date", fullStudy.irb_approval_date || "N/A"],
        ["IRB Expiration Date", fullStudy.irb_expiration_date || "N/A"],
        ["Funding Source", fullStudy.funding_source || "N/A"],
        ["Funding Amount", fullStudy.funding_amount ? String(fullStudy.funding_amount) : "N/A"],
        ["Grant Number", fullStudy.grant_number || "N/A"],
      ]

      checkPageBreak(studyInfo.length * 6 + 20)
      // Use autoTable helper function (supports both v4 and v5+ APIs)
      callAutoTable({
        startY: yPos,
        head: [studyInfo[0]],
        body: studyInfo.slice(1),
        theme: "striped",
        headStyles: { fillColor: [15, 118, 110] },
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15

      // Enrollment Statistics Section
      checkPageBreak(50)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Enrollment Statistics", margin, yPos)
      yPos += 8

      const statsData = [
        ["Metric", "Value"],
        ["Total Participants", String(stats.total || 0)],
        ["Currently Enrolled", String(stats.enrolled || 0)],
        ["Withdrawn", String(stats.withdrawn || 0)],
        ["Completed", String(stats.completed || 0)],
        ["Lost to Follow-up", String(stats.lostToFollowup || 0)],
        ["Consent Obtained", String(stats.consentObtained || 0)],
        ["Consent Rate", stats.total > 0 ? `${((stats.consentObtained || 0) / stats.total * 100).toFixed(1)}%` : "0%"],
        ["Enrollment Progress", `${fullStudy.current_enrollment || 0} / ${fullStudy.enrollment_target || 0} (${fullStudy.enrollment_target > 0 ? ((fullStudy.current_enrollment || 0) / fullStudy.enrollment_target * 100).toFixed(1) : 0}%)`],
      ]

      // Use autoTable helper function (supports both v4 and v5+ APIs)
      callAutoTable({
        startY: yPos,
        head: [statsData[0]],
        body: statsData.slice(1),
        theme: "striped",
        headStyles: { fillColor: [15, 118, 110] },
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15

      // Participants Section
      if (studyParticipants.length > 0) {
        checkPageBreak(50)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Participants", margin, yPos)
        yPos += 8

        const participantsTableData = studyParticipants.map((p: any) => [
          p.patient_id || "N/A",
          p.enrolled_date || "N/A",
          p.enrollment_status || "N/A",
          p.consent_obtained ? "Yes" : "No",
          p.consent_date || "N/A",
        ])

        // Use autoTable helper function (supports both v4 and v5+ APIs)
        callAutoTable({
          startY: yPos,
          head: [["Patient ID", "Enrolled Date", "Status", "Consent", "Consent Date"]],
          body: participantsTableData,
          theme: "striped",
          headStyles: { fillColor: [15, 118, 110] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8 },
        })
      }

      // Save PDF
      const fileName = `research_study_${study.id}_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)

      setShowExportFormatDialog(false)
      setSelectedStudyForExport(null)
    } catch (err) {
      console.error("Error exporting to PDF:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      console.error("Detailed error:", errorMessage)
      
      // Provide more specific error messages
      if (errorMessage.includes("autoTable")) {
        toast({
          variant: "destructive",
          title: "PDF Export Failed",
          description: "The table plugin could not be loaded. Please refresh the page and try again.",
        })
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        toast({
          variant: "destructive",
          title: "PDF Export Failed",
          description: "Could not fetch study data. Please check your connection and try again.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "PDF Export Failed",
          description: `${errorMessage}. Please try again or contact support if the issue persists.`,
        })
      }
    } finally {
      setExporting(false)
    }
  }

  // Export individual EBP to PDF
  const exportEbpToPDF = async (ebp: EvidenceBasedPractice) => {
    try {
      toast({ title: "Generating PDF...", description: "Please wait while we prepare your report." })
      
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

      // Fetch fidelity assessments for this EBP
      const fidelityResponse = await fetch(`/api/evidence-based-practices/${ebp.id}/fidelity-assessments`)
      const fidelityData = await fidelityResponse.json()
      const assessments = fidelityResponse.ok ? (fidelityData.assessments || []) : []

      // Create PDF
      const doc = new jsPDF()
      
      const hasAutoTableFunction = typeof autoTable === 'function'
      const hasAutoTableMethod = typeof (doc as any).autoTable === 'function'
      
      if (!hasAutoTableFunction && !hasAutoTableMethod) {
        throw new Error("autoTable is not available")
      }
      
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let yPos = margin
      
      const callAutoTable = (options: any) => {
        if (hasAutoTableFunction) {
          autoTable(doc, options)
        } else {
          (doc as any).autoTable(options)
        }
      }

      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage()
          yPos = margin
        }
      }

      // Header
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("Evidence-Based Practice Report", margin, yPos)
      yPos += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)
      yPos += 15

      // EBP Information Section
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Practice Information", margin, yPos)
      yPos += 8

      const recency = getFidelityRecencyStatus(ebp.last_fidelity_review)
      const ebpInfo = [
        ["Field", "Value"],
        ["Name", ebp.name || "N/A"],
        ["Category", ebp.category || "N/A"],
        ["Description", ebp.description || "N/A"],
        ["Total Staff", String(ebp.total_staff || 0)],
        ["Trained Staff", String(ebp.trained_staff || 0)],
        ["Adoption Rate", `${ebp.adoption_rate || 0}%`],
        ["Fidelity Score", `${ebp.fidelity_score || 0}%`],
        ["Sustainability Score", `${ebp.sustainability_score || 0}%`],
        ["Last Fidelity Review", ebp.last_fidelity_review ? formatDateForDisplay(ebp.last_fidelity_review) : "Never"],
        ["Assessment Status", recency.message],
        ["Outcomes Tracked", Array.isArray(ebp.outcomes_tracked) && ebp.outcomes_tracked.length > 0 
          ? ebp.outcomes_tracked.join(", ") 
          : "None"],
      ]

      callAutoTable({
        startY: yPos,
        head: [ebpInfo[0]],
        body: ebpInfo.slice(1),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] }, // Blue color for EBP
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15

      // Metrics Summary Section
      checkPageBreak(60)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Performance Metrics", margin, yPos)
      yPos += 8

      const metricsData = [
        ["Metric", "Score", "Status"],
        ["Adoption Rate", `${ebp.adoption_rate || 0}%`, ebp.adoption_rate >= 80 ? "Excellent" : ebp.adoption_rate >= 60 ? "Good" : ebp.adoption_rate >= 40 ? "Fair" : "Needs Improvement"],
        ["Fidelity Score", `${ebp.fidelity_score || 0}%`, ebp.fidelity_score >= 80 ? "Excellent" : ebp.fidelity_score >= 60 ? "Good" : ebp.fidelity_score >= 40 ? "Fair" : "Needs Improvement"],
        ["Sustainability Score", `${ebp.sustainability_score || 0}%`, ebp.sustainability_score >= 80 ? "Excellent" : ebp.sustainability_score >= 60 ? "Good" : ebp.sustainability_score >= 40 ? "Fair" : "Needs Improvement"],
      ]

      callAutoTable({
        startY: yPos,
        head: [metricsData[0]],
        body: metricsData.slice(1),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15

      // Fidelity Assessments Section
      if (assessments.length > 0) {
        checkPageBreak(50)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(`Fidelity Assessment History (${assessments.length} records)`, margin, yPos)
        yPos += 8

        const assessmentsTableData = assessments.slice(0, 20).map((a: any) => [
          a.assessment_date || "N/A",
          `${a.fidelity_score || 0}%`,
          a.assessment_type || "N/A",
          a.notes ? (a.notes.length > 50 ? a.notes.substring(0, 50) + "..." : a.notes) : "-",
        ])

        callAutoTable({
          startY: yPos,
          head: [["Date", "Score", "Type", "Notes"]],
          body: assessmentsTableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8 },
        })
        yPos = (doc as any).lastAutoTable.finalY + 15
      }

      // Fidelity Score Calculation Info
      checkPageBreak(50)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Fidelity Score Calculation", margin, yPos)
      yPos += 8

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      const calcInfo = [
        "The fidelity score is calculated using a weighted formula:",
        "• Latest Assessment: 50% weight (current compliance state)",
        "• Historical Average: 30% weight (stability factor)",
        "• Trend Bonus: ±10 points (improvement or decline)",
        "• Consistency Bonus: 0-10 points (score stability)",
        "",
        "Assessment Schedule: Quarterly (every 90 days recommended)"
      ]
      calcInfo.forEach((line) => {
        doc.text(line, margin, yPos)
        yPos += 5
      })

      // Save PDF
      const fileName = `ebp_report_${ebp.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)

      toast({ title: "Success", description: "EBP report exported as PDF successfully" })
    } catch (err) {
      console.error("Error exporting EBP to PDF:", err)
      toast({
        variant: "destructive",
        title: "PDF Export Failed",
        description: err instanceof Error ? err.message : "Failed to generate PDF report",
      })
    }
  }

  // Export all EBPs to PDF
  const exportAllEbpsToPDF = async () => {
    try {
      toast({ title: "Generating PDF...", description: "Please wait while we prepare your summary report." })
      
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
      
      const hasAutoTableFunction = typeof autoTable === 'function'
      const hasAutoTableMethod = typeof (doc as any).autoTable === 'function'
      
      if (!hasAutoTableFunction && !hasAutoTableMethod) {
        throw new Error("autoTable is not available")
      }
      
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let yPos = margin
      
      const callAutoTable = (options: any) => {
        if (hasAutoTableFunction) {
          autoTable(doc, options)
        } else {
          (doc as any).autoTable(options)
        }
      }

      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage()
          yPos = margin
        }
      }

      // Header
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("Evidence-Based Practices Summary Report", margin, yPos)
      yPos += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)
      doc.text(`Total EBPs: ${ebps.length}`, pageWidth - margin - 50, yPos)
      yPos += 15

      // Summary Statistics
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Organization Summary", margin, yPos)
      yPos += 8

      const avgAdoption = ebps.length > 0 
        ? Math.round(ebps.reduce((sum, e) => sum + (e.adoption_rate || 0), 0) / ebps.length) 
        : 0
      const avgFidelity = ebps.length > 0 
        ? Math.round(ebps.reduce((sum, e) => sum + (e.fidelity_score || 0), 0) / ebps.length) 
        : 0
      const avgSustainability = ebps.length > 0 
        ? Math.round(ebps.reduce((sum, e) => sum + (e.sustainability_score || 0), 0) / ebps.length) 
        : 0
      
      const overdueCount = ebps.filter(e => {
        const recency = getFidelityRecencyStatus(e.last_fidelity_review)
        return recency.status === 'overdue' || recency.status === 'never'
      }).length

      const summaryStats = [
        ["Metric", "Value"],
        ["Total EBPs", String(ebps.length)],
        ["Average Adoption Rate", `${avgAdoption}%`],
        ["Average Fidelity Score", `${avgFidelity}%`],
        ["Average Sustainability Score", `${avgSustainability}%`],
        ["Assessments Overdue", `${overdueCount} EBPs need assessment`],
        ["Categories", [...new Set(ebps.map(e => e.category))].join(", ")],
      ]

      callAutoTable({
        startY: yPos,
        head: [summaryStats[0]],
        body: summaryStats.slice(1),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15

      // EBP Overview Table
      checkPageBreak(50)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("All Evidence-Based Practices", margin, yPos)
      yPos += 8

      const ebpTableData = ebps.map(e => {
        const recency = getFidelityRecencyStatus(e.last_fidelity_review)
        return [
          e.name || "N/A",
          e.category || "N/A",
          `${e.adoption_rate || 0}%`,
          `${e.fidelity_score || 0}%`,
          `${e.sustainability_score || 0}%`,
          `${e.trained_staff || 0}/${e.total_staff || 0}`,
          recency.status === 'current' ? '✓ Current' : 
            recency.status === 'due_soon' ? '⚠ Due Soon' : 
            recency.status === 'overdue' ? '✗ Overdue' : '○ Never',
        ]
      })

      callAutoTable({
        startY: yPos,
        head: [["Name", "Category", "Adoption", "Fidelity", "Sustainability", "Staff", "Assessment"]],
        body: ebpTableData,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          6: { cellWidth: 25 },
        },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15

      // Category Breakdown
      const categories = [...new Set(ebps.map(e => e.category))]
      if (categories.length > 1) {
        checkPageBreak(50)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Performance by Category", margin, yPos)
        yPos += 8

        const categoryData = categories.map(cat => {
          const catEbps = ebps.filter(e => e.category === cat)
          return [
            cat,
            String(catEbps.length),
            `${Math.round(catEbps.reduce((s, e) => s + (e.adoption_rate || 0), 0) / catEbps.length)}%`,
            `${Math.round(catEbps.reduce((s, e) => s + (e.fidelity_score || 0), 0) / catEbps.length)}%`,
            `${Math.round(catEbps.reduce((s, e) => s + (e.sustainability_score || 0), 0) / catEbps.length)}%`,
          ]
        })

        callAutoTable({
          startY: yPos,
          head: [["Category", "Count", "Avg Adoption", "Avg Fidelity", "Avg Sustainability"]],
          body: categoryData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: margin, right: margin },
        })
        yPos = (doc as any).lastAutoTable.finalY + 15
      }

      // Recommendations Section
      checkPageBreak(60)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Recommendations", margin, yPos)
      yPos += 8

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      
      const recommendations: string[] = []
      if (overdueCount > 0) {
        recommendations.push(`• ${overdueCount} EBP(s) have overdue fidelity assessments - schedule reviews immediately`)
      }
      if (avgFidelity < 70) {
        recommendations.push(`• Average fidelity score (${avgFidelity}%) is below target - consider additional training`)
      }
      if (avgAdoption < 70) {
        recommendations.push(`• Average adoption rate (${avgAdoption}%) indicates training gaps - review staff assignments`)
      }
      if (recommendations.length === 0) {
        recommendations.push("• All metrics are within acceptable ranges - continue current practices")
      }
      
      recommendations.forEach((rec) => {
        checkPageBreak(10)
        doc.text(rec, margin, yPos)
        yPos += 6
      })

      // Save PDF
      const fileName = `ebp_summary_report_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)

      toast({ title: "Success", description: "EBP summary exported as PDF successfully" })
    } catch (err) {
      console.error("Error exporting all EBPs to PDF:", err)
      toast({
        variant: "destructive",
        title: "PDF Export Failed",
        description: err instanceof Error ? err.message : "Failed to generate PDF report",
      })
    }
  }

  // Fetch patients for enrollment dialog
  const fetchPatients = useCallback(async (searchTerm: string = "", page: number = 1) => {
    setLoadingPatients(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append("search", searchTerm)
      }
      params.append("limit", "50") // Reduced for better performance
      params.append("page", page.toString())
      
      const response = await fetch(`/api/patients?${params.toString()}`)
      const data = await response.json()
      setPatients(data.patients || [])
    } catch (err) {
      console.error("Error fetching patients:", err)
      setPatients([])
    } finally {
      setLoadingPatients(false)
    }
  }, [])

  // Handle opening enrollment dialog
  const handleOpenEnrollDialog = async () => {
    // Check if a study is selected
    if (!studyDetails) {
      toast({
        variant: "destructive",
        title: "No Study Selected",
        description: "Please select a study first by viewing its details before enrolling patients.",
      })
      return
    }

    // Refresh study data to ensure we have the latest status and enrollment count
    let currentStudyDetails = studyDetails
    try {
      const response = await fetch(`/api/research/studies/${studyDetails.id}`)
      const data = await response.json()
      if (response.ok && data.study) {
        currentStudyDetails = data.study
        setStudyDetails(data.study)
      }
    } catch (err) {
      console.error("Error refreshing study data:", err)
      // Continue with existing data if refresh fails
    }
    
    // Check if study can accept enrollments using refreshed data
    const today = new Date().toISOString().split('T')[0]
    const canEnroll = 
      ['active', 'data_collection'].includes(currentStudyDetails.status) &&
      currentStudyDetails.irb_status === 'approved' &&
      today >= currentStudyDetails.start_date &&
      today <= currentStudyDetails.end_date &&
      currentStudyDetails.current_enrollment < currentStudyDetails.enrollment_target

    if (!canEnroll) {
      const reasons: string[] = []
      if (!['active', 'data_collection'].includes(currentStudyDetails.status)) {
        reasons.push(`Study status is "${currentStudyDetails.status}" (must be "active" or "data_collection")`)
      }
      if (currentStudyDetails.irb_status !== 'approved') {
        reasons.push(`IRB status is "${currentStudyDetails.irb_status}" (must be "approved")`)
      }
      if (today < currentStudyDetails.start_date || today > currentStudyDetails.end_date) {
        reasons.push(`Current date is outside study timeline (${formatDateForDisplay(currentStudyDetails.start_date)} to ${formatDateForDisplay(currentStudyDetails.end_date)})`)
      }
      if (currentStudyDetails.current_enrollment >= currentStudyDetails.enrollment_target) {
        reasons.push(`Enrollment capacity reached (${currentStudyDetails.current_enrollment}/${currentStudyDetails.enrollment_target})`)
      }
      
      toast({
        variant: "destructive",
        title: "Cannot Enroll Patient",
        description: reasons.length > 0 
          ? `Study "${currentStudyDetails.title}" cannot accept new enrollments: ${reasons.join("; ")}`
          : "This study cannot accept new enrollments. Please check study status, IRB approval, date range, and enrollment capacity.",
      })
      return
    }

    setEnrollmentFormData({
      patient_id: "",
      consent_obtained: false,
      consent_date: "",
      consent_document_url: "",
      enrolled_date: new Date().toISOString().split('T')[0],
    })
    setEnrollmentError(null)
    setPatientSearchTerm("")
    setConsentFile(null)
    fetchPatients("")
    setShowEnrollDialog(true)
  }

  // Handle consent document file upload
  const handleUploadConsentFile = async (file: File) => {
    if (!studyDetails) return

    setUploadingConsent(true)
    setEnrollmentError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("studyId", studyDetails.id)

      const response = await fetch("/api/research/upload-consent", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.message || data.error || "Failed to upload document"
        setEnrollmentError(errorMessage)
        setUploadingConsent(false)
        return
      }

      // Update form with uploaded URL
      setEnrollmentFormData({
        ...enrollmentFormData,
        consent_document_url: data.url,
      })

      toast({
        title: "Upload Successful",
        description: "Consent document has been uploaded successfully.",
      })
    } catch (err) {
      console.error("Error uploading consent document:", err)
      setEnrollmentError("An unexpected error occurred while uploading the document.")
    } finally {
      setUploadingConsent(false)
    }
  }

  // Handle patient search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showEnrollDialog) {
        fetchPatients(patientSearchTerm)
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [patientSearchTerm, showEnrollDialog, fetchPatients])

  // Handle enrollment submission
  const handleEnrollPatient = async () => {
    if (!studyDetails) return

    setEnrollmentError(null)

    // Validation
    if (!enrollmentFormData.patient_id) {
      setEnrollmentError("Please select a patient")
      return
    }

    if (!enrollmentFormData.consent_obtained) {
      setEnrollmentError("Consent must be obtained before enrollment")
      return
    }

    if (enrollmentFormData.consent_obtained && !enrollmentFormData.consent_date) {
      setEnrollmentError("Consent date is required when consent is obtained")
      return
    }

    // Validate enrollment date is within study date range
    const enrolledDate = enrollmentFormData.enrolled_date
    if (enrolledDate < studyDetails.start_date || enrolledDate > studyDetails.end_date) {
      setEnrollmentError(`Enrollment date must be between ${studyDetails.start_date} and ${studyDetails.end_date}`)
      return
    }

    // Check for duplicate enrollment (client-side check)
    const isDuplicate = participants.some(
      (p: any) => p.patient_id === enrollmentFormData.patient_id && p.enrollment_status === 'enrolled'
    )
    if (isDuplicate) {
      setEnrollmentError("This patient is already enrolled in this study")
      return
    }

    setEnrollingPatient(true)

    try {
      const response = await fetch(`/api/research/studies/${studyDetails.id}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: enrollmentFormData.patient_id,
          consent_obtained: enrollmentFormData.consent_obtained,
          consent_date: enrollmentFormData.consent_date || null,
          consent_document_url: enrollmentFormData.consent_document_url || null,
          enrolled_date: enrollmentFormData.enrolled_date,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.errors?.join(", ") || data.message || data.error || "Failed to enroll patient"
        setEnrollmentError(errorMessage)
        return
      }

      // Success - refresh data
      setShowEnrollDialog(false)
      
      // Refresh study details and participants
      const [studyResponse, participantsResponse] = await Promise.all([
        fetch(`/api/research/studies/${studyDetails.id}`),
        fetch(`/api/research/studies/${studyDetails.id}/participants`)
      ])
      
      const studyData = await studyResponse.json()
      const participantsData = await participantsResponse.json()
      
      if (studyResponse.ok && studyData.study) {
        setStudyDetails(studyData.study)
      }
      
      if (participantsResponse.ok) {
        setParticipants(participantsData.participants || [])
      }

      // Also refresh the studies list
      fetchStudies()

      toast({
        title: "Enrollment Successful",
        description: "Patient has been enrolled in the study successfully.",
      })
    } catch (err) {
      console.error("Error enrolling patient:", err)
      setEnrollmentError("An unexpected error occurred. Please try again.")
    } finally {
      setEnrollingPatient(false)
    }
  }

  // Handle opening participant status dialog
  const handleOpenParticipantStatusDialog = (participant: any) => {
    setSelectedParticipant(participant)
    setParticipantStatusFormData({
      enrollment_status: participant.enrollment_status || "enrolled",
      withdrawal_date: participant.withdrawal_date || new Date().toISOString().split('T')[0],
      withdrawal_reason: participant.withdrawal_reason || "",
    })
    setParticipantStatusError(null)
    setShowParticipantStatusDialog(true)
  }

  // Handle participant status update
  const handleUpdateParticipantStatus = async () => {
    if (!selectedParticipant || !studyDetails) return

    setUpdatingParticipant(true)
    setParticipantStatusError(null)

    try {
      // Validation
      if (participantStatusFormData.enrollment_status === "withdrawn") {
        if (!participantStatusFormData.withdrawal_date) {
          setParticipantStatusError("Withdrawal date is required")
          setUpdatingParticipant(false)
          return
        }
        if (!participantStatusFormData.withdrawal_reason || participantStatusFormData.withdrawal_reason.trim() === "") {
          setParticipantStatusError("Withdrawal reason is required")
          setUpdatingParticipant(false)
          return
        }
      }

      const response = await fetch(
        `/api/research/studies/${studyDetails.id}/participants/${selectedParticipant.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enrollment_status: participantStatusFormData.enrollment_status,
            withdrawal_date: participantStatusFormData.enrollment_status === "withdrawn" 
              ? participantStatusFormData.withdrawal_date 
              : null,
            withdrawal_reason: participantStatusFormData.enrollment_status === "withdrawn"
              ? participantStatusFormData.withdrawal_reason
              : null,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.errors?.join(", ") || data.message || data.error || "Failed to update participant status"
        setParticipantStatusError(errorMessage)
        return
      }

      // Success - refresh data
      setShowParticipantStatusDialog(false)
      setSelectedParticipant(null)

      // Refresh participants list
      const participantsResponse = await fetch(`/api/research/studies/${studyDetails.id}/participants`)
      const participantsData = await participantsResponse.json()
      if (participantsResponse.ok) {
        setParticipants(participantsData.participants || [])
      }

      // Refresh study details
      const studyResponse = await fetch(`/api/research/studies/${studyDetails.id}`)
      const studyData = await studyResponse.json()
      if (studyResponse.ok && studyData.study) {
        setStudyDetails(studyData.study)
      }

      // Refresh studies list
      fetchStudies()

      toast({
        title: "Status Updated",
        description: `Participant status has been updated to ${participantStatusFormData.enrollment_status}.`,
      })
    } catch (err) {
      console.error("Error updating participant status:", err)
      setParticipantStatusError("An unexpected error occurred. Please try again.")
    } finally {
      setUpdatingParticipant(false)
    }
  }

  // Handle opening participant detail dialog
  const handleOpenParticipantDetail = async (participant: any) => {
    if (!studyDetails) return

    setSelectedParticipantForDetail(participant)
    setLoadingParticipantDetail(true)
    setShowParticipantDetailDialog(true)

    try {
      const response = await fetch(
        `/api/research/studies/${studyDetails.id}/participants/${participant.id}`
      )
      const data = await response.json()

      if (response.ok && data.participant) {
        setParticipantDetailData(data.participant)
      } else {
        setParticipantDetailData(participant)
      }
    } catch (err) {
      console.error("Error fetching participant details:", err)
      setParticipantDetailData(participant)
    } finally {
      setLoadingParticipantDetail(false)
    }
  }

  // Evidence-based practices state
  const [ebps, setEbps] = useState<EvidenceBasedPractice[]>([])
  const [loadingEbps, setLoadingEbps] = useState(true)
  const [ebpError, setEbpError] = useState<string | null>(null)
  const [ebpTotalCount, setEbpTotalCount] = useState(0)
  const [ebpCurrentPage, setEbpCurrentPage] = useState(1)
  const [ebpPageSize] = useState(10) // Items per page
  
  // EBP dialog states
  const [showEbpDialog, setShowEbpDialog] = useState(false)
  const [editingEbp, setEditingEbp] = useState<EvidenceBasedPractice | null>(null)
  const [ebpFormData, setEbpFormData] = useState({
    name: "",
    category: "Counseling" as "Counseling" | "Behavioral" | "Medical" | "Organizational",
    description: "",
    outcomes_tracked: [] as string[],
    total_staff: "",
  })
  const [submittingEbp, setSubmittingEbp] = useState(false)
  
  // EBP detail dialogs
  const [selectedEbp, setSelectedEbp] = useState<EvidenceBasedPractice | null>(null)
  const [showFidelityDialog, setShowFidelityDialog] = useState(false)
  const [showTrainingDialog, setShowTrainingDialog] = useState(false)
  const [showOutcomesDialog, setShowOutcomesDialog] = useState(false)
  const [fidelityAssessments, setFidelityAssessments] = useState<any[]>([])
  const [trainingRecords, setTrainingRecords] = useState<any[]>([])
  const [outcomes, setOutcomes] = useState<any[]>([])
  const [loadingEbpDetails, setLoadingEbpDetails] = useState(false)

  // EBP creation dialogs
  const [showCreateFidelityDialog, setShowCreateFidelityDialog] = useState(false)
  const [showCreateTrainingDialog, setShowCreateTrainingDialog] = useState(false)
  const [showCreateDeliveryDialog, setShowCreateDeliveryDialog] = useState(false)
  const [showCreateOutcomeDialog, setShowCreateOutcomeDialog] = useState(false)
  
  // Form states for creation dialogs
  const [fidelityFormData, setFidelityFormData] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    assessment_type: "standard" as "standard" | "spot_check" | "comprehensive" | "self_assessment",
    fidelity_score: "",
    notes: "",
  })
  const [submittingFidelity, setSubmittingFidelity] = useState(false)

  const [trainingFormData, setTrainingFormData] = useState({
    staff_id: "",
    status: "pending" as "pending" | "trained" | "certified" | "inactive",
    training_date: new Date().toISOString().split('T')[0],
    certification_date: "",
    certification_expires_date: "",
    certificate_url: "",
  })
  const [submittingTraining, setSubmittingTraining] = useState(false)
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [uploadingCertificate, setUploadingCertificate] = useState(false)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)

  const [deliveryFormData, setDeliveryFormData] = useState({
    patient_id: "",
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_type: "session" as "session" | "intervention" | "assessment" | "group" | "individual",
    encounter_id: "",
    delivered_by: "",
    notes: "",
  })
  const [submittingDelivery, setSubmittingDelivery] = useState(false)
  const [ebpPatients, setEbpPatients] = useState<any[]>([])
  const [loadingEbpPatients, setLoadingEbpPatients] = useState(false)
  const [ebpPatientSearchTerm, setEbpPatientSearchTerm] = useState("")
  const [ebpEncounters, setEbpEncounters] = useState<any[]>([])
  const [loadingEbpEncounters, setLoadingEbpEncounters] = useState(false)

  const [outcomeFormData, setOutcomeFormData] = useState({
    patient_id: "",
    outcome_type: "",
    outcome_value: "",
    outcome_unit: "",
    measurement_date: new Date().toISOString().split('T')[0],
    notes: "",
  })
  const [submittingOutcome, setSubmittingOutcome] = useState(false)

  // Search and filter state
  const [ebpSearchTerm, setEbpSearchTerm] = useState("")
  const [ebpCategoryFilter, setEbpCategoryFilter] = useState("all")
  
  // Advanced filtering state
  const [ebpMinAdoptionRate, setEbpMinAdoptionRate] = useState("")
  const [ebpMinFidelityScore, setEbpMinFidelityScore] = useState("")
  const [ebpMinSustainabilityScore, setEbpMinSustainabilityScore] = useState("")
  const [ebpDateRangeStart, setEbpDateRangeStart] = useState("")
  const [ebpDateRangeEnd, setEbpDateRangeEnd] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Trend charts state
  const [showTrendsDialog, setShowTrendsDialog] = useState(false)
  const [trendData, setTrendData] = useState<any>(null)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [trendPeriod, setTrendPeriod] = useState<"1month" | "3months" | "6months" | "1year" | "all">("6months")
  
  // Comparison view state
  const [showComparisonDialog, setShowComparisonDialog] = useState(false)
  const [selectedEbpsForComparison, setSelectedEbpsForComparison] = useState<string[]>([])
  
  // Sorting state
  const [ebpSortBy, setEbpSortBy] = useState<"name" | "category" | "adoption_rate" | "fidelity_score" | "sustainability_score" | "created_at">("created_at")
  const [ebpSortOrder, setEbpSortOrder] = useState<"asc" | "desc">("desc")

  // Quality metrics state - fetched from API
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([])
  const [qualityMetricsSummary, setQualityMetricsSummary] = useState<QualityMetricsSummary | null>(null)
  const [loadingQualityMetrics, setLoadingQualityMetrics] = useState(false)
  const [qualityMetricsError, setQualityMetricsError] = useState<string | null>(null)
  
  // Quality metrics filtering and sorting
  const [qualityMetricsCategoryFilter, setQualityMetricsCategoryFilter] = useState("all")
  const [qualityMetricsStatusFilter, setQualityMetricsStatusFilter] = useState("all")
  const [qualityMetricsSearch, setQualityMetricsSearch] = useState("")
  const [qualityMetricsSortBy, setQualityMetricsSortBy] = useState<"name" | "current_value" | "category" | "trend">("name")
  const [qualityMetricsSortOrder, setQualityMetricsSortOrder] = useState<"asc" | "desc">("asc")
  
  // Quality metrics CRUD dialogs
  const [showAddMetricDialog, setShowAddMetricDialog] = useState(false)
  const [showEditMetricDialog, setShowEditMetricDialog] = useState(false)
  const [showMetricDetailDialog, setShowMetricDetailDialog] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<QualityMetric | null>(null)
  const [metricDetailData, setMetricDetailData] = useState<any>(null)
  const [loadingMetricDetail, setLoadingMetricDetail] = useState(false)
  const [qualityMetricsViewMode, setQualityMetricsViewMode] = useState<"table" | "charts">("table")
  
  // Quality metrics notifications
  const [qualityNotifications, setQualityNotifications] = useState<any[]>([])
  const [qualityNotificationsSummary, setQualityNotificationsSummary] = useState<any>(null)
  // Note: showNotificationsPanel is already defined above (line 252) and is reused here
  
  // New metric form state
  const [newMetricForm, setNewMetricForm] = useState({
    name: "",
    code: "",
    description: "",
    category: "outcomes",
    target_value: "",
    benchmark_value: "",
    benchmark_source: "",
    unit: "%",
    data_source: "",
    calculation_method: "",
    reporting_period: "monthly",
    higher_is_better: true,
    warning_threshold: "",
    critical_threshold: "",
    is_ccbhc_required: false,
    is_mips_measure: false,
  })
  const [submittingMetric, setSubmittingMetric] = useState(false)
  const [metricFormError, setMetricFormError] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return "bg-green-100 text-green-800"
      case "data_collection":
        return "bg-blue-100 text-blue-800"
      case "planning":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "analysis":
        return "bg-purple-100 text-purple-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      default:
        return <ArrowRight className="h-4 w-4 text-gray-600" />
    }
  }

  // Fetch evidence-based practices with pagination
  const fetchEbps = useCallback(async () => {
    setLoadingEbps(true)
    setEbpError(null)
    try {
      const params = new URLSearchParams()
      if (ebpSearchTerm) params.append("search", ebpSearchTerm)
      if (ebpCategoryFilter !== "all") params.append("category", ebpCategoryFilter)
      params.append("page", ebpCurrentPage.toString())
      params.append("limit", ebpPageSize.toString())
      
      const response = await fetch(`/api/evidence-based-practices?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch EBPs")
      }
      setEbps(data.ebps || [])
      setEbpTotalCount(data.total || 0)
    } catch (err) {
      setEbpError(err instanceof Error ? err.message : "Failed to load EBPs")
      setEbps([])
      setEbpTotalCount(0)
    } finally {
      setLoadingEbps(false)
    }
  }, [ebpSearchTerm, ebpCategoryFilter, ebpCurrentPage, ebpPageSize])

  // Fetch EBPs on mount and when filters/page change
  useEffect(() => {
    fetchEbps()
  }, [fetchEbps])

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setEbpCurrentPage(1)
  }, [ebpSearchTerm, ebpCategoryFilter])

  // Fetch quality metrics from API
  const fetchQualityMetrics = useCallback(async () => {
    setLoadingQualityMetrics(true)
    setQualityMetricsError(null)
    try {
      const params = new URLSearchParams()
      if (qualityMetricsSearch) params.append("search", qualityMetricsSearch)
      if (qualityMetricsCategoryFilter !== "all") params.append("category", qualityMetricsCategoryFilter)
      if (qualityMetricsStatusFilter !== "all") params.append("status", qualityMetricsStatusFilter)
      params.append("sort_by", qualityMetricsSortBy)
      params.append("sort_order", qualityMetricsSortOrder)
      params.append("include_history", "true")
      params.append("history_months", "12")
      
      const response = await fetch(`/api/research/quality-metrics?${params.toString()}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch quality metrics")
      }
      
      setQualityMetrics(data.metrics || [])
      setQualityMetricsSummary(data.summary || null)
    } catch (err) {
      setQualityMetricsError(err instanceof Error ? err.message : "Failed to load quality metrics")
      setQualityMetrics([])
      setQualityMetricsSummary(null)
    } finally {
      setLoadingQualityMetrics(false)
    }
  }, [qualityMetricsSearch, qualityMetricsCategoryFilter, qualityMetricsStatusFilter, qualityMetricsSortBy, qualityMetricsSortOrder])

  // Fetch quality metrics on mount and when filters change
  useEffect(() => {
    fetchQualityMetrics()
  }, [fetchQualityMetrics])

  // Fetch quality metrics notifications
  const fetchQualityNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/research/quality-metrics/notifications")
      const data = await response.json()
      
      if (data.success) {
        setQualityNotifications(data.notifications || [])
        setQualityNotificationsSummary(data.summary || null)
      }
    } catch (err) {
      console.error("Error fetching quality notifications:", err)
    }
  }, [])

  // Fetch notifications when quality metrics are loaded or when tab is active
  useEffect(() => {
    if (activeTab === "quality" && qualityMetrics.length > 0) {
      fetchQualityNotifications()
    }
  }, [activeTab, qualityMetrics.length, fetchQualityNotifications])

  // Fetch single metric detail
  const fetchMetricDetail = useCallback(async (metricId: string) => {
    setLoadingMetricDetail(true)
    try {
      // Fetch metric details and links in parallel
      const [metricResponse, linksResponse] = await Promise.all([
        fetch(`/api/research/quality-metrics/${metricId}?history_months=12`),
        fetch(`/api/research/quality-metrics/${metricId}/links`),
      ])
      
      const metricData = await metricResponse.json()
      const linksData = await linksResponse.json()
      
      if (!metricResponse.ok) {
        throw new Error(metricData.error || "Failed to fetch metric details")
      }
      
      // Combine the data
      setMetricDetailData({
        ...metricData,
        linked_entities: linksData.success ? linksData.links : [],
        links_summary: linksData.success ? linksData.summary : null,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load metric details",
      })
      setMetricDetailData(null)
    } finally {
      setLoadingMetricDetail(false)
    }
  }, [toast])

  // Handle view metric details
  const handleViewMetricDetails = (metric: QualityMetric) => {
    setSelectedMetric(metric)
    setShowMetricDetailDialog(true)
    fetchMetricDetail(metric.id)
  }

  // Handle edit metric
  const handleEditMetric = (metric: QualityMetric) => {
    setSelectedMetric(metric)
    setNewMetricForm({
      name: metric.name,
      code: metric.code || "",
      description: metric.description || "",
      category: metric.category,
      target_value: metric.target_value.toString(),
      benchmark_value: metric.benchmark_value?.toString() || "",
      benchmark_source: metric.benchmark_source || "",
      unit: metric.unit || "%",
      data_source: metric.data_source || "",
      calculation_method: metric.calculation_method || "",
      reporting_period: metric.reporting_period || "monthly",
      higher_is_better: metric.higher_is_better !== false,
      warning_threshold: metric.warning_threshold?.toString() || "",
      critical_threshold: metric.critical_threshold?.toString() || "",
      is_ccbhc_required: metric.is_ccbhc_required || false,
      is_mips_measure: metric.is_mips_measure || false,
    })
    setShowEditMetricDialog(true)
  }

  // Handle add new metric
  const handleAddMetric = async () => {
    setSubmittingMetric(true)
    setMetricFormError(null)
    
    try {
      if (!newMetricForm.name || !newMetricForm.category || !newMetricForm.target_value) {
        throw new Error("Name, category, and target value are required")
      }
      
      const response = await fetch("/api/research/quality-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMetricForm.name,
          code: newMetricForm.code || undefined,
          description: newMetricForm.description || undefined,
          category: newMetricForm.category,
          target_value: parseFloat(newMetricForm.target_value),
          benchmark_value: newMetricForm.benchmark_value ? parseFloat(newMetricForm.benchmark_value) : undefined,
          benchmark_source: newMetricForm.benchmark_source || undefined,
          unit: newMetricForm.unit,
          data_source: newMetricForm.data_source || undefined,
          calculation_method: newMetricForm.calculation_method || undefined,
          reporting_period: newMetricForm.reporting_period,
          higher_is_better: newMetricForm.higher_is_better,
          warning_threshold: newMetricForm.warning_threshold ? parseFloat(newMetricForm.warning_threshold) : undefined,
          critical_threshold: newMetricForm.critical_threshold ? parseFloat(newMetricForm.critical_threshold) : undefined,
          is_ccbhc_required: newMetricForm.is_ccbhc_required,
          is_mips_measure: newMetricForm.is_mips_measure,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create metric")
      }
      
      toast({
        title: "Success",
        description: "Quality metric created successfully",
      })
      
      setShowAddMetricDialog(false)
      resetMetricForm()
      fetchQualityMetrics()
    } catch (err) {
      setMetricFormError(err instanceof Error ? err.message : "Failed to create metric")
    } finally {
      setSubmittingMetric(false)
    }
  }

  // Handle update metric
  const handleUpdateMetric = async () => {
    if (!selectedMetric) return
    
    setSubmittingMetric(true)
    setMetricFormError(null)
    
    try {
      const response = await fetch(`/api/research/quality-metrics/${selectedMetric.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMetricForm.name,
          description: newMetricForm.description || undefined,
          category: newMetricForm.category,
          target_value: parseFloat(newMetricForm.target_value),
          benchmark_value: newMetricForm.benchmark_value ? parseFloat(newMetricForm.benchmark_value) : undefined,
          benchmark_source: newMetricForm.benchmark_source || undefined,
          unit: newMetricForm.unit,
          data_source: newMetricForm.data_source || undefined,
          calculation_method: newMetricForm.calculation_method || undefined,
          reporting_period: newMetricForm.reporting_period,
          higher_is_better: newMetricForm.higher_is_better,
          warning_threshold: newMetricForm.warning_threshold ? parseFloat(newMetricForm.warning_threshold) : undefined,
          critical_threshold: newMetricForm.critical_threshold ? parseFloat(newMetricForm.critical_threshold) : undefined,
          is_ccbhc_required: newMetricForm.is_ccbhc_required,
          is_mips_measure: newMetricForm.is_mips_measure,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update metric")
      }
      
      toast({
        title: "Success",
        description: "Quality metric updated successfully",
      })
      
      setShowEditMetricDialog(false)
      setSelectedMetric(null)
      resetMetricForm()
      fetchQualityMetrics()
    } catch (err) {
      setMetricFormError(err instanceof Error ? err.message : "Failed to update metric")
    } finally {
      setSubmittingMetric(false)
    }
  }

  // Handle delete metric
  const handleDeleteMetric = async (metric: QualityMetric) => {
    if (!confirm(`Are you sure you want to deactivate "${metric.name}"?`)) return
    
    try {
      const response = await fetch(`/api/research/quality-metrics/${metric.id}`, {
        method: "DELETE",
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete metric")
      }
      
      toast({
        title: "Success",
        description: data.message || "Quality metric deactivated",
      })
      
      fetchQualityMetrics()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete metric",
      })
    }
  }

  // Reset metric form
  const resetMetricForm = () => {
    setNewMetricForm({
      name: "",
      code: "",
      description: "",
      category: "outcomes",
      target_value: "",
      benchmark_value: "",
      benchmark_source: "",
      unit: "%",
      data_source: "",
      calculation_method: "",
      reporting_period: "monthly",
      higher_is_better: true,
      warning_threshold: "",
      critical_threshold: "",
      is_ccbhc_required: false,
      is_mips_measure: false,
    })
    setMetricFormError(null)
  }

  // Export quality metrics to CSV or JSON
  const handleExportQualityMetrics = async (format: "csv" | "json") => {
    try {
      const params = new URLSearchParams()
      params.append("format", format)
      if (qualityMetricsCategoryFilter !== "all") {
        params.append("category", qualityMetricsCategoryFilter)
      }
      params.append("include_history", "true")
      params.append("history_months", "12")
      
      const response = await fetch(`/api/research/quality-metrics/export?${params.toString()}`)
      
      if (format === "csv") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `quality-metrics-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Export Complete",
          description: "Quality metrics exported to CSV successfully",
        })
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `quality-metrics-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Export Complete",
          description: "Quality metrics exported to JSON successfully",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export quality metrics",
      })
    }
  }

  // Generate quality metrics Excel report (multiple sheets)
  const handleGenerateExcelReport = async () => {
    try {
      // Fetch data for report
      const params = new URLSearchParams()
      params.append("format", "json")
      params.append("include_history", "true")
      params.append("history_months", "12")
      
      const response = await fetch(`/api/research/quality-metrics/export?${params.toString()}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch data for report")
      }
      
      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new()
      
      // Summary sheet
      const summaryData = [
        ["Quality Metrics Report"],
        ["Generated:", new Date().toLocaleString()],
        [""],
        ["Summary Statistics"],
        ["Total Metrics:", data.summary.total_metrics],
        ["Metrics with Data:", data.summary.metrics_with_data],
        ["Meeting Target:", data.summary.meeting_target],
        ["Near Target:", data.summary.near_target],
        ["Below Target:", data.summary.below_target],
        ["Average Performance:", `${data.summary.average_performance}%`],
        [""],
        ["CCBHC Compliance"],
        ["Required Measures:", data.summary.ccbhc_compliance.required],
        ["Meeting Requirements:", data.summary.ccbhc_compliance.meeting],
        [""],
        ["MIPS Compliance"],
        ["Tracked Measures:", data.summary.mips_compliance.tracked],
        ["Meeting Requirements:", data.summary.mips_compliance.meeting],
      ]
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")
      
      // Metrics sheet
      const metricsHeaders = [
        "Code", "Name", "Category", "Current Value", "Target", "Benchmark",
        "Trend", "Trend %", "Meets Target", "Data Source", "CCBHC", "MIPS"
      ]
      const metricsData = [
        metricsHeaders,
        ...data.metrics.map((m: any) => [
          m.code || "",
          m.name,
          m.category,
          m.current_value ?? "N/A",
          m.target_value,
          m.benchmark_value ?? "N/A",
          m.trend ?? "N/A",
          m.trend_percentage ?? "N/A",
          m.meets_target === null ? "N/A" : m.meets_target ? "Yes" : "No",
          m.data_source || "",
          m.is_ccbhc_required ? "Yes" : "No",
          m.is_mips_measure ? "Yes" : "No",
        ])
      ]
      const metricsWs = XLSX.utils.aoa_to_sheet(metricsData)
      XLSX.utils.book_append_sheet(wb, metricsWs, "Metrics")
      
      // Category Performance sheet
      const categoryHeaders = ["Category", "Total", "Meeting Target", "Average Performance"]
      const categoryData = [
        categoryHeaders,
        ...(data.summary.by_category || []).map((c: any) => [
          c.category,
          c.total,
          c.meeting_target,
          c.average !== null ? `${c.average}%` : "N/A"
        ])
      ]
      const categoryWs = XLSX.utils.aoa_to_sheet(categoryData)
      XLSX.utils.book_append_sheet(wb, categoryWs, "By Category")
      
      // Historical Data sheet (if available)
      const metricsWithHistory = data.metrics.filter((m: any) => m.historical_values && m.historical_values.length > 0)
      if (metricsWithHistory.length > 0) {
        // Get all unique dates
        const allDates = new Set<string>()
        metricsWithHistory.forEach((m: any) => {
          m.historical_values.forEach((h: any) => allDates.add(h.date))
        })
        const sortedDates = Array.from(allDates).sort()
        
        const historyHeaders = ["Metric", ...sortedDates]
        const historyData = [
          historyHeaders,
          ...metricsWithHistory.map((m: any) => {
            const row = [m.name]
            sortedDates.forEach(date => {
              const value = m.historical_values.find((h: any) => h.date === date)
              row.push(value?.value ?? "")
            })
            return row
          })
        ]
        const historyWs = XLSX.utils.aoa_to_sheet(historyData)
        XLSX.utils.book_append_sheet(wb, historyWs, "Historical Trends")
      }
      
      // Generate and download
      XLSX.writeFile(wb, `quality-metrics-report-${new Date().toISOString().split("T")[0]}.xlsx`)
      
      toast({
        title: "Report Generated",
        description: "Quality metrics report downloaded successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: err instanceof Error ? err.message : "Failed to generate report",
      })
    }
  }

  // Generate quality metrics PDF report
  const handleGeneratePDFReport = async () => {
    try {
      toast({ title: "Generating PDF...", description: "Please wait while we prepare your report." })
      
      // Fetch data for report
      const params = new URLSearchParams()
      params.append("format", "json")
      params.append("include_history", "true")
      params.append("history_months", "12")
      
      const response = await fetch(`/api/research/quality-metrics/export?${params.toString()}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch data for report")
      }
      
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
      
      const hasAutoTableFunction = typeof autoTable === 'function'
      const hasAutoTableMethod = typeof (doc as any).autoTable === 'function'
      
      // Helper to call autoTable
      const callAutoTable = (options: any) => {
        if (hasAutoTableFunction) {
          autoTable(doc, options)
        } else if (hasAutoTableMethod) {
          (doc as any).autoTable(options)
        }
      }
      
      let yPos = 20
      
      // Title
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("Quality Metrics Report", 105, yPos, { align: "center" })
      yPos += 10
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, yPos, { align: "center" })
      yPos += 15
      
      // Summary Statistics
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Summary Statistics", 14, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const summaryLines = [
        `Total Metrics: ${data.summary.total_metrics}`,
        `Metrics with Data: ${data.summary.metrics_with_data}`,
        `Meeting Target: ${data.summary.meeting_target} (${((data.summary.meeting_target / data.summary.total_metrics) * 100).toFixed(1)}%)`,
        `Near Target: ${data.summary.near_target}`,
        `Below Target: ${data.summary.below_target}`,
        `Average Performance: ${data.summary.average_performance}%`,
      ]
      summaryLines.forEach(line => {
        doc.text(line, 14, yPos)
        yPos += 6
      })
      yPos += 5
      
      // Compliance Summary
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Compliance Summary", 14, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`CCBHC: ${data.summary.ccbhc_compliance.meeting} of ${data.summary.ccbhc_compliance.required} required measures`, 14, yPos)
      yPos += 6
      doc.text(`MIPS: ${data.summary.mips_compliance.meeting} of ${data.summary.mips_compliance.tracked} tracked measures`, 14, yPos)
      yPos += 15
      
      // Metrics Table
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Quality Metrics Detail", 14, yPos)
      yPos += 8
      
      const metricsTableData = data.metrics.map((m: any) => [
        m.name.substring(0, 30) + (m.name.length > 30 ? "..." : ""),
        m.category,
        m.current_value !== null ? `${m.current_value}%` : "N/A",
        `${m.target_value}%`,
        m.trend || "N/A",
        m.meets_target === null ? "N/A" : m.meets_target ? "✓" : "✗"
      ])
      
      callAutoTable({
        startY: yPos,
        head: [["Metric", "Category", "Current", "Target", "Trend", "Met"]],
        body: metricsTableData,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25 },
          2: { cellWidth: 22 },
          3: { cellWidth: 22 },
          4: { cellWidth: 20 },
          5: { cellWidth: 15 }
        }
      })
      
      // Add new page for category breakdown
      doc.addPage()
      yPos = 20
      
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Performance by Category", 14, yPos)
      yPos += 10
      
      const categoryTableData = (data.summary.by_category || []).map((c: any) => [
        c.category,
        c.total,
        c.meeting_target,
        c.average !== null ? `${c.average}%` : "N/A"
      ])
      
      callAutoTable({
        startY: yPos,
        head: [["Category", "Total", "Meeting Target", "Avg Performance"]],
        body: categoryTableData,
        theme: "striped",
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 3 },
      })
      
      // Footer on each page
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" })
        doc.text("MASE Behavioral Health EMR - Quality Metrics Report", 14, 290)
      }
      
      // Save PDF
      doc.save(`quality-metrics-report-${new Date().toISOString().split("T")[0]}.pdf`)
      
      toast({
        title: "PDF Report Generated",
        description: "Quality metrics PDF report downloaded successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: err instanceof Error ? err.message : "Failed to generate PDF report",
      })
    }
  }

  // Get metric status helper
  const getMetricStatus = (metric: QualityMetric): "met" | "near_target" | "below" => {
    if (metric.current_value === null || metric.current_value === undefined) return "below"
    
    const higherIsBetter = metric.higher_is_better !== false
    const meetsTarget = higherIsBetter 
      ? metric.current_value >= metric.target_value
      : metric.current_value <= metric.target_value
    
    if (meetsTarget) return "met"
    
    const benchmark = metric.benchmark_value ?? metric.target_value * 0.9
    const nearTarget = higherIsBetter 
      ? metric.current_value >= benchmark
      : metric.current_value <= benchmark
    
    if (nearTarget) return "near_target"
    
    return "below"
  }

  // Filter EBPs with advanced filters
  const filteredEbps = ebps.filter((ebp) => {
    // Advanced filtering
    if (ebpMinAdoptionRate && (ebp.adoption_rate || 0) < parseFloat(ebpMinAdoptionRate)) {
      return false
    }
    if (ebpMinFidelityScore && (ebp.fidelity_score || 0) < parseFloat(ebpMinFidelityScore)) {
      return false
    }
    if (ebpMinSustainabilityScore && (ebp.sustainability_score || 0) < parseFloat(ebpMinSustainabilityScore)) {
      return false
    }
    if (ebpDateRangeStart && ebp.created_at) {
      const createdDate = new Date(ebp.created_at)
      const startDate = new Date(ebpDateRangeStart)
      if (createdDate < startDate) return false
    }
    if (ebpDateRangeEnd && ebp.created_at) {
      const createdDate = new Date(ebp.created_at)
      const endDate = new Date(ebpDateRangeEnd)
      endDate.setHours(23, 59, 59, 999) // Include entire end date
      if (createdDate > endDate) return false
    }
    return true
  })

  // Sort EBPs
  const sortedEbps = [...filteredEbps].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (ebpSortBy) {
      case "name":
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case "category":
        aValue = a.category.toLowerCase()
        bValue = b.category.toLowerCase()
        break
      case "adoption_rate":
        aValue = a.adoption_rate || 0
        bValue = b.adoption_rate || 0
        break
      case "fidelity_score":
        aValue = a.fidelity_score || 0
        bValue = b.fidelity_score || 0
        break
      case "sustainability_score":
        aValue = a.sustainability_score || 0
        bValue = b.sustainability_score || 0
        break
      case "created_at":
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return ebpSortOrder === "asc" ? -1 : 1
    if (aValue > bValue) return ebpSortOrder === "asc" ? 1 : -1
    return 0
  })

  // Fetch staff members for training assignment
  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name, email, role")
        .eq("is_active", true)
        .order("last_name", { ascending: true })
      
      if (error) {
        console.error("Error fetching staff:", error)
        setStaffMembers([])
      } else {
        setStaffMembers(data || [])
      }
    } catch (err) {
      console.error("Error fetching staff:", err)
      setStaffMembers([])
    } finally {
      setLoadingStaff(false)
    }
  }, [])

  // Fetch patients for delivery/outcome tracking
  const fetchEbpPatients = useCallback(async (searchTerm: string = "") => {
    setLoadingEbpPatients(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append("search", searchTerm)
      }
      params.append("limit", "50")
      
      const response = await fetch(`/api/patients?${params.toString()}`)
      const data = await response.json()
      setEbpPatients(data.patients || [])
    } catch (err) {
      console.error("Error fetching patients:", err)
      setEbpPatients([])
    } finally {
      setLoadingEbpPatients(false)
    }
  }, [])

  // Fetch encounters for selected patient
  const fetchEbpEncounters = useCallback(async (patientId: string) => {
    if (!patientId) {
      setEbpEncounters([])
      return
    }

    setLoadingEbpEncounters(true)
    try {
      const response = await fetch(`/api/encounters?patient_id=${patientId}&status=completed`)
      const data = await response.json()
      
      if (response.ok && data.encounters) {
        // Filter to recent encounters (last 90 days) and sort by date
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        
        const recentEncounters = (data.encounters || [])
          .filter((enc: any) => {
            if (!enc.encounter_date) return false
            const encDate = new Date(enc.encounter_date)
            return encDate >= ninetyDaysAgo
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.encounter_date).getTime()
            const dateB = new Date(b.encounter_date).getTime()
            return dateB - dateA // Most recent first
          })
          .slice(0, 20) // Limit to 20 most recent
        
        setEbpEncounters(recentEncounters)
      } else {
        setEbpEncounters([])
      }
    } catch (err) {
      console.error("Error fetching encounters:", err)
      setEbpEncounters([])
    } finally {
      setLoadingEbpEncounters(false)
    }
  }, [])

  // Debounce patient search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showCreateDeliveryDialog || showCreateOutcomeDialog) {
        fetchEbpPatients(ebpPatientSearchTerm)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [ebpPatientSearchTerm, showCreateDeliveryDialog, showCreateOutcomeDialog, fetchEbpPatients])

  // Fetch encounters when patient is selected in delivery dialog
  useEffect(() => {
    if (showCreateDeliveryDialog && deliveryFormData.patient_id) {
      fetchEbpEncounters(deliveryFormData.patient_id)
    } else if (!deliveryFormData.patient_id) {
      setEbpEncounters([])
      setDeliveryFormData(prev => ({ ...prev, encounter_id: "" }))
    }
  }, [deliveryFormData.patient_id, showCreateDeliveryDialog, fetchEbpEncounters])

  // Handle create/update EBP
  const handleSaveEbp = async () => {
    if (!ebpFormData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "EBP name is required",
      })
      return
    }

    setSubmittingEbp(true)
    try {

      const ebpData = {
        name: ebpFormData.name.trim(),
        category: ebpFormData.category,
        description: ebpFormData.description.trim() || null,
        outcomes_tracked: ebpFormData.outcomes_tracked,
        total_staff: ebpFormData.total_staff ? parseInt(ebpFormData.total_staff) : 0,
      }

      const url = editingEbp 
        ? `/api/evidence-based-practices/${editingEbp.id}`
        : "/api/evidence-based-practices"
      const method = editingEbp ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ebpData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${editingEbp ? "update" : "create"} EBP`)
      }

      toast({
        title: "Success",
        description: `EBP ${editingEbp ? "updated" : "created"} successfully`,
      })

      setShowEbpDialog(false)
      setEditingEbp(null)
      setEbpFormData({
        name: "",
        category: "Counseling",
        description: "",
        outcomes_tracked: [],
        total_staff: "",
      })
      await fetchEbps()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save EBP",
      })
    } finally {
      setSubmittingEbp(false)
    }
  }

  // Handle delete EBP
  const handleDeleteEbp = async (ebpId: string) => {
    if (!confirm("Are you sure you want to delete this EBP?")) {
      return
    }
    try {
      const response = await fetch(`/api/evidence-based-practices/${ebpId}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete EBP")
      }
      toast({
        title: "Success",
        description: "EBP deleted successfully",
      })
      await fetchEbps()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete EBP",
      })
    }
  }

  // Handle viewing fidelity assessments
  const handleViewFidelity = async (ebp: EvidenceBasedPractice) => {
    setSelectedEbp(ebp)
    setLoadingEbpDetails(true)
    setShowFidelityDialog(true)
    try {
      const response = await fetch(`/api/evidence-based-practices/${ebp.id}/fidelity-assessments`)
      const data = await response.json()
      if (response.ok) {
        setFidelityAssessments(data.assessments || [])
      }
    } catch (err) {
      console.error("Error fetching fidelity assessments:", err)
      setFidelityAssessments([])
    } finally {
      setLoadingEbpDetails(false)
    }
  }

  // Handle viewing training records
  const handleViewTraining = async (ebp: EvidenceBasedPractice) => {
    setSelectedEbp(ebp)
    setLoadingEbpDetails(true)
    setShowTrainingDialog(true)
    try {
      const response = await fetch(`/api/evidence-based-practices/${ebp.id}/training-records`)
      const data = await response.json()
      if (response.ok) {
        setTrainingRecords(data.records || [])
      }
    } catch (err) {
      console.error("Error fetching training records:", err)
      setTrainingRecords([])
    } finally {
      setLoadingEbpDetails(false)
    }
  }

  // Handle viewing outcomes
  const handleViewOutcomes = async (ebp: EvidenceBasedPractice) => {
    setSelectedEbp(ebp)
    setLoadingEbpDetails(true)
    setShowOutcomesDialog(true)
    try {
      const response = await fetch(`/api/evidence-based-practices/${ebp.id}/outcomes`)
      const data = await response.json()
      if (response.ok) {
        setOutcomes(data.outcomes || [])
      }
    } catch (err) {
      console.error("Error fetching outcomes:", err)
      setOutcomes([])
    } finally {
      setLoadingEbpDetails(false)
    }
  }

  // Handle creating fidelity assessment
  const handleCreateFidelity = async () => {
    if (!selectedEbp) return

    if (!fidelityFormData.fidelity_score || parseFloat(fidelityFormData.fidelity_score) < 0 || parseFloat(fidelityFormData.fidelity_score) > 100) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Fidelity score must be between 0 and 100",
      })
      return
    }

    setSubmittingFidelity(true)
    try {
      const response = await fetch(`/api/evidence-based-practices/${selectedEbp.id}/fidelity-assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fidelityFormData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create fidelity assessment")
      }

      // Show success with updated score if available
      const newScore = data.updated_ebp?.fidelity_score
      toast({
        title: "Success",
        description: newScore !== undefined 
          ? `Fidelity assessment created. New score: ${newScore}%`
          : "Fidelity assessment created successfully",
      })

      // Immediately update the EBP in state with the returned data
      if (data.updated_ebp) {
        setEbps(prevEbps => 
          prevEbps.map(ebp => 
            ebp.id === data.updated_ebp.id 
              ? { ...ebp, ...data.updated_ebp }
              : ebp
          )
        )
        // Also update selectedEbp if it's the same one
        if (selectedEbp && selectedEbp.id === data.updated_ebp.id) {
          setSelectedEbp(prev => prev ? { ...prev, ...data.updated_ebp } : prev)
        }
      }

      setShowCreateFidelityDialog(false)
      setFidelityFormData({
        assessment_date: new Date().toISOString().split('T')[0],
        assessment_type: "standard",
        fidelity_score: "",
        notes: "",
      })
      
      // Also refresh EBP list to ensure consistency
      await fetchEbps()
      
      // Refresh fidelity assessments if dialog is open
      if (showFidelityDialog && selectedEbp) {
        await handleViewFidelity(selectedEbp)
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create fidelity assessment",
      })
    } finally {
      setSubmittingFidelity(false)
    }
  }

  // Handle certificate file upload
  const handleUploadCertificateFile = async (file: File) => {
    if (!selectedEbp) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an EBP first",
      })
      return
    }

    setUploadingCertificate(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("ebpId", selectedEbp.id)
      if (trainingFormData.staff_id) {
        formData.append("staffId", trainingFormData.staff_id)
      }

      const response = await fetch("/api/evidence-based-practices/upload-certificate", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        const errorMessage = data.message || data.error || "Failed to upload certificate"
        throw new Error(errorMessage)
      }

      // Update form with uploaded URL
      setTrainingFormData({
        ...trainingFormData,
        certificate_url: data.url,
      })

      toast({
        title: "Upload Successful",
        description: "Certificate has been uploaded successfully.",
      })
    } catch (err) {
      console.error("Error uploading certificate:", err)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred while uploading the certificate.",
      })
    } finally {
      setUploadingCertificate(false)
    }
  }

  // Handle creating training record
  const handleCreateTraining = async () => {
    if (!selectedEbp) return

    if (!trainingFormData.staff_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a staff member",
      })
      return
    }

    setSubmittingTraining(true)
    try {
      const response = await fetch(`/api/evidence-based-practices/${selectedEbp.id}/training-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trainingFormData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create training record")
      }

      toast({
        title: "Success",
        description: "Staff assigned/trained successfully",
      })

      setShowCreateTrainingDialog(false)
      setTrainingFormData({
        staff_id: "",
        status: "pending",
        training_date: new Date().toISOString().split('T')[0],
        certification_date: "",
        certification_expires_date: "",
        certificate_url: "",
      })
      setCertificateFile(null)
      
      // Refresh EBP list to update metrics
      await fetchEbps()
      
      // Refresh training records if dialog is open
      if (showTrainingDialog) {
        await handleViewTraining(selectedEbp)
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create training record",
      })
    } finally {
      setSubmittingTraining(false)
    }
  }

  // Handle creating patient delivery
  const handleCreateDelivery = async () => {
    if (!selectedEbp) return

    if (!deliveryFormData.patient_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a patient",
      })
      return
    }

    setSubmittingDelivery(true)
    try {
      const response = await fetch(`/api/evidence-based-practices/${selectedEbp.id}/patient-deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryFormData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to record patient delivery")
      }

      toast({
        title: "Success",
        description: "Patient delivery recorded successfully",
      })

      setShowCreateDeliveryDialog(false)
      setDeliveryFormData({
        patient_id: "",
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_type: "session",
        encounter_id: "",
        delivered_by: "",
        notes: "",
      })
      setEbpEncounters([])
      
      // Refresh EBP list to update adoption rate
      await fetchEbps()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to record patient delivery",
      })
    } finally {
      setSubmittingDelivery(false)
    }
  }

  // Handle viewing trends
  const handleViewTrends = async (ebp: EvidenceBasedPractice) => {
    setSelectedEbp(ebp)
    setLoadingTrends(true)
    setShowTrendsDialog(true)
    try {
      const response = await fetch(`/api/evidence-based-practices/${ebp.id}/trends?period=${trendPeriod}`)
      const data = await response.json()
      if (response.ok) {
        setTrendData(data.trends)
      } else {
        setTrendData(null)
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to load trend data",
        })
      }
    } catch (err) {
      setTrendData(null)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load trend data",
      })
    } finally {
      setLoadingTrends(false)
    }
  }


  // Handle comparison view
  const handleCompareEbps = () => {
    if (selectedEbpsForComparison.length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least 2 EBPs to compare",
      })
      return
    }
    setShowComparisonDialog(true)
  }

  // Handle creating outcome
  const handleCreateOutcome = async () => {
    if (!selectedEbp) return

    if (!outcomeFormData.patient_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a patient",
      })
      return
    }

    if (!outcomeFormData.outcome_type || !outcomeFormData.outcome_type.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Outcome type is required",
      })
      return
    }

    setSubmittingOutcome(true)
    try {
      const response = await fetch(`/api/evidence-based-practices/${selectedEbp.id}/outcomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outcomeFormData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to record outcome")
      }

      toast({
        title: "Success",
        description: "Outcome recorded successfully",
      })

      setShowCreateOutcomeDialog(false)
      setOutcomeFormData({
        patient_id: "",
        outcome_type: "",
        outcome_value: "",
        outcome_unit: "",
        measurement_date: new Date().toISOString().split('T')[0],
        notes: "",
      })
      
      // Refresh outcomes if dialog is open
      if (showOutcomesDialog) {
        await handleViewOutcomes(selectedEbp)
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to record outcome",
      })
    } finally {
      setSubmittingOutcome(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader />

        <main className="p-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-cyan-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Studies</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {studies.filter((s) => s.status === "active" || s.status === "data_collection").length}
                    </p>
                  </div>
                  <Microscope className="h-8 w-8 text-cyan-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {studies.filter((s) => s.study_type === "implementation").length} implementation,{" "}
                  {studies.filter((s) => s.study_type === "equity").length} equity
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">EBP Adoption Rate</p>
                    <p className="text-2xl font-bold text-gray-900">84%</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={84} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Quality Metrics Met</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {qualityMetricsSummary 
                        ? `${qualityMetricsSummary.meeting_target}/${qualityMetricsSummary.active_metrics}`
                        : "—/—"}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {qualityMetricsSummary && qualityMetricsSummary.active_metrics > 0
                    ? `${Math.round((qualityMetricsSummary.meeting_target / qualityMetricsSummary.active_metrics) * 100)}% meeting targets`
                    : "Loading..."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Research Participants</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {studies.reduce((sum, s) => sum + (s.current_enrollment || 0), 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Across all active studies</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="studies">Research Studies</TabsTrigger>
              <TabsTrigger value="ebp">Evidence-Based Practices</TabsTrigger>
              <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
              <TabsTrigger value="equity">Health Equity</TabsTrigger>
              <TabsTrigger value="ccbhc">CCBHC Compliance</TabsTrigger>
              <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
              <TabsTrigger value="network">Network Analysis</TabsTrigger>
              <TabsTrigger value="nlp">Clinical NLP</TabsTrigger>
              <TabsTrigger value="cost">Cost-Effectiveness</TabsTrigger>
              <TabsTrigger value="data-export">Data Export</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* Notifications Panel */}
              {notifications.length > 0 && (
                <Card className="mb-6 border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        Research Study Notifications ({notifications.length})
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                      >
                        {showNotificationsPanel ? "Hide" : "Show All"}
                      </Button>
                    </div>
                  </CardHeader>
                  {showNotificationsPanel && (
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-lg border ${
                              notification.severity === "error"
                                ? "bg-red-50 border-red-200"
                                : notification.severity === "warning"
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{notification.title}</p>
                                <p className="text-xs mt-1">{notification.message}</p>
                                {notification.action_required && (
                                  <Badge className="mt-2 bg-orange-100 text-orange-800 text-xs">
                                    Action Required
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const study = studies.find((s) => s.id === notification.study_id)
                                  if (study) {
                                    handleViewDetails(study)
                                  }
                                }}
                              >
                                View Study
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                  {!showNotificationsPanel && notifications.length > 0 && (
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm">
                          {notifications.filter((n) => n.severity === "error").length} critical,{" "}
                          {notifications.filter((n) => n.severity === "warning").length} warnings,{" "}
                          {notifications.filter((n) => n.severity === "info").length} informational
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* EBP Notifications Panel */}
              {ebpNotifications.length > 0 && (
                <Card className="mb-6 border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-blue-600" />
                        Evidence-Based Practice Notifications ({ebpNotifications.length})
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                      >
                        {showNotificationsPanel ? "Hide" : "Show All"}
                      </Button>
                    </div>
                  </CardHeader>
                  {showNotificationsPanel && (
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {ebpNotifications.map((notification: any) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-lg border ${
                              notification.severity === "error"
                                ? "bg-red-50 border-red-200"
                                : notification.severity === "warning"
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{notification.title}</p>
                                <p className="text-xs mt-1">{notification.message}</p>
                                {notification.action_required && (
                                  <Badge className="mt-2 bg-orange-100 text-orange-800 text-xs">
                                    Action Required
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const ebp = ebps.find((e) => e.id === notification.ebp_id)
                                  if (ebp) {
                                    setSelectedEbp(ebp)
                                    setActiveTab("ebp")
                                  }
                                }}
                              >
                                View EBP
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                  {!showNotificationsPanel && ebpNotifications.length > 0 && (
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        <p className="text-sm">
                          {ebpNotifications.filter((n: any) => n.severity === "error").length} critical,{" "}
                          {ebpNotifications.filter((n: any) => n.severity === "warning").length} warnings,{" "}
                          {ebpNotifications.filter((n: any) => n.severity === "info").length} informational
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Learning Health System Cycle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-cyan-600" />
                      Learning Health System Cycle
                    </CardTitle>
                    <CardDescription>Continuous improvement through data-driven insights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 bg-cyan-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Data Collection</p>
                          <p className="text-sm text-gray-500">Real-time EHR data aggregation</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Analysis & Insights</p>
                          <p className="text-sm text-gray-500">AI-powered pattern recognition</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Knowledge Generation</p>
                          <p className="text-sm text-gray-500">Evidence synthesis and best practices</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                          4
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Implementation</p>
                          <p className="text-sm text-gray-500">Practice changes and quality improvement</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Implementation Science Framework */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Implementation Science Metrics
                    </CardTitle>
                    <CardDescription>RE-AIM Framework Assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Reach</span>
                          <span className="text-sm text-gray-500">78%</span>
                        </div>
                        <Progress value={78} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">% of eligible patients receiving EBPs</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Effectiveness</span>
                          <span className="text-sm text-gray-500">72%</span>
                        </div>
                        <Progress value={72} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">Patient outcome improvement rate</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Adoption</span>
                          <span className="text-sm text-gray-500">84%</span>
                        </div>
                        <Progress value={84} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">% of staff trained in EBPs</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Implementation</span>
                          <span className="text-sm text-gray-500">76%</span>
                        </div>
                        <Progress value={76} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">Fidelity to EBP protocols</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Maintenance</span>
                          <span className="text-sm text-gray-500">82%</span>
                        </div>
                        <Progress value={82} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">Long-term sustainability score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Research Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      Recent Research Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { action: "New participant enrolled", study: "CM Implementation Study", time: "2 hours ago" },
                        {
                          action: "Data collection milestone reached",
                          study: "CCBHC QI Initiative",
                          time: "5 hours ago",
                        },
                        { action: "Fidelity review completed", study: "CBT Protocol", time: "1 day ago" },
                        { action: "Quarterly report generated", study: "Health Equity in MAT", time: "2 days ago" },
                        { action: "IRB amendment approved", study: "Telehealth Pilot", time: "3 days ago" },
                      ].map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.study}</p>
                          </div>
                          <span className="text-xs text-gray-400">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                        onClick={() => setShowNewStudyDialog(true)}
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-sm">New Study</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                        onClick={() => setShowDataExportDialog(true)}
                      >
                        <Download className="h-5 w-5" />
                        <span className="text-sm">Export Data</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent">
                        <FileBarChart className="h-5 w-5" />
                        <span className="text-sm">Generate Report</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent">
                        <BookOpen className="h-5 w-5" />
                        <span className="text-sm">EBP Library</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="studies">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Research Studies</CardTitle>
                      <CardDescription>Implementation, pilot, and quality improvement studies</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/research/automate", { method: "POST" })
                            const data = await response.json()
                            if (response.ok) {
                              let description = data.message || "Automation completed."
                              
                              // Add details about changes if any
                              if (data.total_updates > 0) {
                                const details: string[] = []
                                if (data.updated > 0) {
                                  details.push(`${data.updated} study status${data.updated !== 1 ? "es" : ""} updated`)
                                }
                                if (data.irb_updated > 0) {
                                  details.push(`${data.irb_updated} IRB status${data.irb_updated !== 1 ? "es" : ""} updated`)
                                }
                                if (details.length > 0) {
                                  description += ` (${details.join(", ")})`
                                }
                              }
                              
                              toast({
                                title: "Automation Complete",
                                description,
                              })
                              // Refresh studies list
                              fetchStudies()
                            } else {
                              toast({
                                variant: "destructive",
                                title: "Automation Error",
                                description: data.message || "Failed to run automation.",
                              })
                            }
                          } catch (err) {
                            toast({
                              variant: "destructive",
                              title: "Automation Error",
                              description: "Failed to run automation.",
                            })
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run Automation
                      </Button>
                    <Button onClick={() => setShowNewStudyDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Study
                    </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search studies..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="data_collection">Data Collection</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="implementation">Implementation</SelectItem>
                        <SelectItem value="pilot">Pilot</SelectItem>
                        <SelectItem value="quality_improvement">Quality Improvement</SelectItem>
                        <SelectItem value="outcomes">Outcomes</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Loading studies...</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-red-800 font-medium">{error}</p>
                      </div>
                      {error.includes("table") || error.includes("TABLE_NOT_FOUND") ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                          <p className="text-sm text-yellow-800 mb-2">
                            <strong>Setup Required:</strong> The database tables need to be created first.
                          </p>
                          <ol className="text-sm text-yellow-800 list-decimal list-inside space-y-1">
                            <li>Open your Supabase Dashboard</li>
                            <li>Go to SQL Editor</li>
                            <li>Copy and paste the contents of <code className="bg-yellow-100 px-1 rounded">scripts/create_research_studies_tables.sql</code></li>
                            <li>Click "Run" to execute the script</li>
                            <li>Refresh this page</li>
                          </ol>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => fetchStudies()}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  )}

                  {!loading && !error && studies.length === 0 && (
                    <div className="text-center py-12">
                      <Microscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No studies found</p>
                      <Button onClick={() => setShowNewStudyDialog(true)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Study
                      </Button>
                    </div>
                  )}

                  {!loading && !error && studies.length > 0 && (
                    <>
                      <div className="space-y-4">
                        {studies.map((study) => (
                          <div key={study.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{study.title}</h3>
                                  <Badge className={getStatusColor(study.status)}>
                                    {study.status.replace("_", " ")}
                                  </Badge>
                                  <Badge variant="outline">{study.study_type.replace("_", " ")}</Badge>
                                </div>
                                {study.description && (
                                  <p className="text-sm text-gray-600 mb-3">{study.description}</p>
                                )}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">PI:</span>
                                    <p className="font-medium">{study.pi_name}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Funding:</span>
                                    <p className="font-medium">
                                      {study.funding_source || "N/A"}
                                      {study.funding_amount && ` ($${parseFloat(study.funding_amount.toString()).toLocaleString()})`}
                                    </p>
                                    {study.grant_number && (
                                      <p className="text-xs text-gray-500 mt-1">Grant: {study.grant_number}</p>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">IRB Status:</span>
                                    <Badge className={getStatusColor(study.irb_status)} variant="outline">
                                      {study.irb_status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Timeline:</span>
                                    <p className="font-medium">
                                      {formatDateForDisplay(study.start_date)} -{" "}
                                      {formatDateForDisplay(study.end_date)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingStudy(study)
                                    // Format dates for date input fields (YYYY-MM-DD)
                                    // Parse DATE string directly without timezone conversion
                                    const formatDateForInput = (dateString: string | null | undefined) => {
                                      if (!dateString) return ""
                                      // Extract date part directly (YYYY-MM-DD format from database)
                                      const datePart = dateString.split('T')[0]
                                      // Validate format (YYYY-MM-DD)
                                      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                                        return datePart
                                      }
                                      // Fallback: try to parse as Date if format is different
                                      const date = new Date(dateString)
                                      if (isNaN(date.getTime())) return ""
                                      return date.toISOString().split("T")[0]
                                    }
                                    setFormData({
                                      title: study.title,
                                      description: study.description || "",
                                      study_type: study.study_type,
                                      status: study.status,
                                      pi_name: study.pi_name,
                                      pi_email: study.pi_email || "",
                                      pi_phone: study.pi_phone || "",
                                      start_date: formatDateForInput(study.start_date),
                                      end_date: formatDateForInput(study.end_date),
                                      enrollment_target: study.enrollment_target.toString(),
                                      funding_source: study.funding_source || "",
                                      irb_status: study.irb_status,
                                      irb_number: study.irb_number || "",
                                      irb_approval_date: formatDateForInput(study.irb_approval_date || ""),
                                      irb_expiration_date: formatDateForInput(study.irb_expiration_date || ""),
                                      funding_amount: study.funding_amount ? study.funding_amount.toString() : "",
                                      grant_number: study.grant_number || "",
                                    })
                                    setShowNewStudyDialog(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteStudy(study.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Enrollment Progress</span>
                                <span className="text-sm font-medium">
                                  {study.current_enrollment} / {study.enrollment_target}
                                </span>
                              </div>
                              <Progress
                                value={
                                  study.enrollment_target > 0
                                    ? (study.current_enrollment / study.enrollment_target) * 100
                                    : 0
                                }
                                className="h-2"
                              />
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewDetails(study)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDataDashboard(study)}
                              >
                                <FileBarChart className="h-4 w-4 mr-1" />
                                Data Dashboard
                              </Button>
                              <Button
                                size="sm" 
                                variant="outline"
                                onClick={() => handleExportData(study)}
                              >
                                <FileDown className="h-4 w-4 mr-1" />
                                Export Data
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {totalCount > 10 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-500">
                            Showing {studies.length} of {totalCount} studies
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage * 10 >= totalCount}
                              onClick={() => setCurrentPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ebp">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Evidence-Based Practices Tracker</CardTitle>
                      <CardDescription>Monitor adoption, fidelity, and sustainability of EBPs</CardDescription>
                    </div>
                    <Button onClick={() => {
                      setEditingEbp(null)
                      setEbpFormData({
                        name: "",
                        category: "Counseling",
                        description: "",
                        outcomes_tracked: [],
                        total_staff: "",
                      })
                      setShowEbpDialog(true)
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add EBP
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search and Filter */}
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search EBPs by name or description..."
                        className="pl-10"
                        value={ebpSearchTerm}
                        onChange={(e) => setEbpSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={ebpCategoryFilter} onValueChange={setEbpCategoryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Counseling">Counseling</SelectItem>
                        <SelectItem value="Behavioral">Behavioral</SelectItem>
                        <SelectItem value="Medical">Medical</SelectItem>
                        <SelectItem value="Organizational">Organizational</SelectItem>
                      </SelectContent>
                    </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      >
                        {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
                      </Button>
                    </div>
                    
                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div>
                            <Label className="text-xs">Min Adoption Rate (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={ebpMinAdoptionRate}
                              onChange={(e) => setEbpMinAdoptionRate(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Min Fidelity Score (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={ebpMinFidelityScore}
                              onChange={(e) => setEbpMinFidelityScore(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Min Sustainability (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={ebpMinSustainabilityScore}
                              onChange={(e) => setEbpMinSustainabilityScore(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Date Range Start</Label>
                            <Input
                              type="date"
                              value={ebpDateRangeStart}
                              onChange={(e) => setEbpDateRangeStart(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Date Range End</Label>
                            <Input
                              type="date"
                              value={ebpDateRangeEnd}
                              onChange={(e) => setEbpDateRangeEnd(e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEbpMinAdoptionRate("")
                              setEbpMinFidelityScore("")
                              setEbpMinSustainabilityScore("")
                              setEbpDateRangeStart("")
                              setEbpDateRangeEnd("")
                            }}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {loadingEbps && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Loading EBPs...</span>
                    </div>
                  )}
                  
                  {ebpError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-red-800 font-medium">{ebpError}</p>
                      </div>
                      {ebpError.includes("table") || ebpError.includes("TABLE_NOT_FOUND") ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                          <p className="text-sm text-yellow-800 mb-2">
                            <strong>Setup Required:</strong> The database tables need to be created first.
                          </p>
                          <ol className="text-sm text-yellow-800 list-decimal list-inside space-y-1">
                            <li>Open your Supabase Dashboard</li>
                            <li>Go to SQL Editor</li>
                            <li>Copy and paste the contents of <code className="bg-yellow-100 px-1 rounded">scripts/create_evidence_based_practices_tables.sql</code></li>
                            <li>Click "Run" to execute the script</li>
                            <li>Refresh this page</li>
                          </ol>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchEbps()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  )}

                  {!loadingEbps && !ebpError && ebps.length === 0 && (
                    <div className="text-center py-12">
                      <Microscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No evidence-based practices found</p>
                      <Button onClick={() => setShowEbpDialog(true)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First EBP
                      </Button>
                    </div>
                  )}

                  {!loadingEbps && !ebpError && sortedEbps.length > 0 && (
                    <>
                      {/* Sorting and Export Controls */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Sort by:</Label>
                          <Select value={ebpSortBy} onValueChange={(value: any) => setEbpSortBy(value)}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">Name</SelectItem>
                              <SelectItem value="category">Category</SelectItem>
                              <SelectItem value="adoption_rate">Adoption Rate</SelectItem>
                              <SelectItem value="fidelity_score">Fidelity Score</SelectItem>
                              <SelectItem value="sustainability_score">Sustainability</SelectItem>
                              <SelectItem value="created_at">Date Created</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEbpSortOrder(ebpSortOrder === "asc" ? "desc" : "asc")}
                          >
                            {ebpSortOrder === "asc" ? "↑" : "↓"}
                          </Button>
                          {selectedEbpsForComparison.length > 0 && (
                            <>
                              <span className="text-sm text-gray-500 mx-2">
                                {selectedEbpsForComparison.length} selected
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCompareEbps}
                                disabled={selectedEbpsForComparison.length < 2}
                              >
                                <GitCompare className="h-4 w-4 mr-2" />
                                Compare Selected ({selectedEbpsForComparison.length})
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEbpsForComparison([])}
                              >
                                Clear
                              </Button>
                            </>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileDown className="h-4 w-4 mr-2" />
                              Export All
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  const response = await fetch("/api/evidence-based-practices/export?format=excel")
                                  if (!response.ok) throw new Error("Export failed")
                                  const blob = await response.blob()
                                  const url = window.URL.createObjectURL(blob)
                                  const a = document.createElement("a")
                                  a.href = url
                                  a.download = `ebp_summary_${new Date().toISOString().split('T')[0]}.xlsx`
                                  document.body.appendChild(a)
                                  a.click()
                                  window.URL.revokeObjectURL(url)
                                  document.body.removeChild(a)
                                  toast({ title: "Success", description: "EBP summary exported as Excel successfully" })
                                } catch (err) {
                                  toast({
                                    variant: "destructive",
                                    title: "Export Failed",
                                    description: err instanceof Error ? err.message : "Failed to export EBPs",
                                  })
                                }
                              }}
                            >
                              <FileDown className="h-4 w-4 mr-2" />
                              Export as Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportAllEbpsToPDF()}>
                              <FileText className="h-4 w-4 mr-2" />
                              Export as PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    <div className="space-y-4">
                        {sortedEbps.map((ebp) => (
                        <div key={ebp.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Checkbox
                                  checked={selectedEbpsForComparison.includes(ebp.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedEbpsForComparison([...selectedEbpsForComparison, ebp.id])
                                    } else {
                                      setSelectedEbpsForComparison(selectedEbpsForComparison.filter(id => id !== ebp.id))
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <h3 className="font-semibold text-lg">{ebp.name}</h3>
                                <Badge variant="outline">{ebp.category}</Badge>
                                <div className="ml-auto flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setEditingEbp(ebp)
                                    setEbpFormData({
                                      name: ebp.name,
                                      category: ebp.category as "Counseling" | "Behavioral" | "Medical" | "Organizational",
                                      description: ebp.description || "",
                                      outcomes_tracked: Array.isArray(ebp.outcomes_tracked) ? ebp.outcomes_tracked : [],
                                      total_staff: ebp.total_staff.toString(),
                                    })
                                    setShowEbpDialog(true)
                                  }}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteEbp(ebp.id)}>
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                              {ebp.description && (
                                <p className="text-sm text-gray-600 mb-2">{ebp.description}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm text-gray-500">Last Fidelity Review</p>
                              {(() => {
                                const recency = getFidelityRecencyStatus(ebp.last_fidelity_review)
                                return (
                                  <div>
                                    <p className="font-medium">
                                      {ebp.last_fidelity_review ? formatDateForDisplay(ebp.last_fidelity_review) : "N/A"}
                                    </p>
                                    <p className={`text-xs ${recency.color}`}>
                                      {recency.message}
                                    </p>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-500">Adoption Rate</span>
                                <span className="text-sm font-medium">{ebp.adoption_rate}%</span>
                              </div>
                              <Progress value={ebp.adoption_rate} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-500">Fidelity Score</span>
                                <span className="text-sm font-medium">{ebp.fidelity_score}%</span>
                              </div>
                              <Progress value={ebp.fidelity_score} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-500">Sustainability</span>
                                <span className="text-sm font-medium">{ebp.sustainability_score}%</span>
                              </div>
                              <Progress value={ebp.sustainability_score} className="h-2" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-gray-500">Trained Staff: </span>
                              <span className="font-medium">
                                {ebp.trained_staff}/{ebp.total_staff}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(ebp.outcomes_tracked) && ebp.outcomes_tracked.length > 0 ? (
                                ebp.outcomes_tracked.map((outcome, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {outcome}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">No outcomes tracked</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => handleViewFidelity(ebp)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Fidelity
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedEbp(ebp)
                              setFidelityFormData({
                                assessment_date: new Date().toISOString().split('T')[0],
                                assessment_type: "standard",
                                fidelity_score: "",
                                notes: "",
                              })
                              setShowCreateFidelityDialog(true)
                            }}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add Assessment
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleViewTraining(ebp)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Training
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedEbp(ebp)
                              setTrainingFormData({
                                staff_id: "",
                                status: "pending",
                                training_date: new Date().toISOString().split('T')[0],
                                certification_date: "",
                                certification_expires_date: "",
                                certificate_url: "",
                              })
                              fetchStaff()
                              setShowCreateTrainingDialog(true)
                            }}>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign Staff
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedEbp(ebp)
                              setDeliveryFormData({
                                patient_id: "",
                                delivery_date: new Date().toISOString().split('T')[0],
                                delivery_type: "session",
                                encounter_id: "",
                                delivered_by: "",
                                notes: "",
                              })
                              setEbpPatientSearchTerm("")
                              setEbpEncounters([])
                              fetchEbpPatients("")
                              fetchStaff()
                              setShowCreateDeliveryDialog(true)
                            }}>
                              <Plus className="h-4 w-4 mr-1" />
                              Record Delivery
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleViewOutcomes(ebp)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Outcomes
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedEbp(ebp)
                              setOutcomeFormData({
                                patient_id: "",
                                outcome_type: "",
                                outcome_value: "",
                                outcome_unit: "",
                                measurement_date: new Date().toISOString().split('T')[0],
                                notes: "",
                              })
                              setEbpPatientSearchTerm("")
                              fetchEbpPatients("")
                              setShowCreateOutcomeDialog(true)
                            }}>
                              <Plus className="h-4 w-4 mr-1" />
                              Record Outcome
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <FileDown className="h-4 w-4 mr-1" />
                                  Export
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/evidence-based-practices/export?format=excel&ebp_id=${ebp.id}`)
                                      if (!response.ok) throw new Error("Export failed")
                                      const blob = await response.blob()
                                      const url = window.URL.createObjectURL(blob)
                                      const a = document.createElement("a")
                                      a.href = url
                                      a.download = `ebp_report_${ebp.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
                                      document.body.appendChild(a)
                                      a.click()
                                      window.URL.revokeObjectURL(url)
                                      document.body.removeChild(a)
                                      toast({ title: "Success", description: "EBP report exported as Excel successfully" })
                                    } catch (err) {
                                      toast({
                                        variant: "destructive",
                                        title: "Export Failed",
                                        description: err instanceof Error ? err.message : "Failed to export EBP report",
                                      })
                                    }
                                  }}
                                >
                                  <FileDown className="h-4 w-4 mr-2" />
                                  Export as Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportEbpToPDF(ebp)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Export as PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTrends(ebp)}
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              View Trends
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Pagination Controls */}
                    {ebpTotalCount > ebpPageSize && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-500">
                          Showing {((ebpCurrentPage - 1) * ebpPageSize) + 1} to {Math.min(ebpCurrentPage * ebpPageSize, ebpTotalCount)} of {ebpTotalCount} EBPs
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={ebpCurrentPage === 1}
                            onClick={() => setEbpCurrentPage((p) => Math.max(1, p - 1))}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={ebpCurrentPage * ebpPageSize >= ebpTotalCount}
                            onClick={() => setEbpCurrentPage((p) => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                    </div>
                    )}
                  </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality">
              <div className="space-y-6">
                {/* Notifications Alert */}
                {qualityNotificationsSummary && qualityNotificationsSummary.action_required_count > 0 && (
                  <Card className={`border-l-4 ${
                    qualityNotificationsSummary.by_severity.error > 0 
                      ? 'border-l-red-500 bg-red-50' 
                      : 'border-l-yellow-500 bg-yellow-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`h-6 w-6 ${
                            qualityNotificationsSummary.by_severity.error > 0 
                              ? 'text-red-600' 
                              : 'text-yellow-600'
                          }`} />
                          <div>
                            <p className="font-semibold">
                              {qualityNotificationsSummary.action_required_count} Alert{qualityNotificationsSummary.action_required_count !== 1 ? 's' : ''} Requiring Attention
                            </p>
                            <p className="text-sm text-gray-600">
                              {qualityNotificationsSummary.by_severity.error > 0 && (
                                <span className="text-red-600">{qualityNotificationsSummary.by_severity.error} critical</span>
                              )}
                              {qualityNotificationsSummary.by_severity.error > 0 && qualityNotificationsSummary.by_severity.warning > 0 && ", "}
                              {qualityNotificationsSummary.by_severity.warning > 0 && (
                                <span className="text-yellow-600">{qualityNotificationsSummary.by_severity.warning} warnings</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                        >
                          {showNotificationsPanel ? "Hide" : "View"} Alerts
                        </Button>
                      </div>
                      
                      {/* Expanded Notifications Panel */}
                      {showNotificationsPanel && (
                        <div className="mt-4 pt-4 border-t space-y-3 max-h-64 overflow-y-auto">
                          {qualityNotifications
                            .filter(n => n.action_required || n.severity !== 'info')
                            .slice(0, 10)
                            .map(notification => (
                              <div 
                                key={notification.id}
                                className={`p-3 rounded-lg border ${
                                  notification.severity === 'error' 
                                    ? 'bg-red-100 border-red-200' 
                                    : notification.severity === 'warning'
                                    ? 'bg-yellow-100 border-yellow-200'
                                    : 'bg-blue-100 border-blue-200'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className={`text-xs ${
                                        notification.severity === 'error' 
                                          ? 'border-red-500 text-red-700' 
                                          : notification.severity === 'warning'
                                          ? 'border-yellow-500 text-yellow-700'
                                          : 'border-blue-500 text-blue-700'
                                      }`}>
                                        {notification.notification_type.replace(/_/g, ' ')}
                                      </Badge>
                                      {notification.metric_code && (
                                        <span className="text-xs text-gray-500">[{notification.metric_code}]</span>
                                      )}
                                    </div>
                                    <p className="font-medium text-sm mt-1">{notification.title}</p>
                                    <p className="text-sm text-gray-600">{notification.message}</p>
                                  </div>
                                  {notification.action_required && (
                                    <Badge className="bg-orange-100 text-orange-800 text-xs ml-2">
                                      Action Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          {qualityNotifications.filter(n => n.action_required || n.severity !== 'info').length > 10 && (
                            <p className="text-sm text-gray-500 text-center">
                              And {qualityNotifications.filter(n => n.action_required || n.severity !== 'info').length - 10} more...
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Summary Cards */}
                {qualityMetricsSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Metrics</p>
                            <p className="text-2xl font-bold">{qualityMetricsSummary.total_metrics}</p>
                          </div>
                          <Target className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{qualityMetricsSummary.active_metrics} active</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Meeting Target</p>
                            <p className="text-2xl font-bold text-green-600">{qualityMetricsSummary.meeting_target}</p>
                          </div>
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {qualityMetricsSummary.active_metrics > 0 
                            ? Math.round((qualityMetricsSummary.meeting_target / qualityMetricsSummary.active_metrics) * 100)
                            : 0}% of metrics
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Below Warning</p>
                            <p className="text-2xl font-bold text-yellow-600">{qualityMetricsSummary.below_warning}</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Need attention</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Avg Performance</p>
                            <p className="text-2xl font-bold">{qualityMetricsSummary.average_performance}%</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Across all metrics</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <CardTitle>Quality Metrics & Outcomes</CardTitle>
                        <CardDescription>Track performance against benchmarks and targets</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search metrics..."
                            value={qualityMetricsSearch}
                            onChange={(e) => setQualityMetricsSearch(e.target.value)}
                            className="pl-10 w-48"
                          />
                        </div>
                        <Select value={qualityMetricsCategoryFilter} onValueChange={setQualityMetricsCategoryFilter}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="outcomes">Outcomes</SelectItem>
                            <SelectItem value="access">Access</SelectItem>
                            <SelectItem value="ccbhc">CCBHC</SelectItem>
                            <SelectItem value="integration">Integration</SelectItem>
                            <SelectItem value="safety">Safety</SelectItem>
                            <SelectItem value="efficiency">Efficiency</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={qualityMetricsStatusFilter} onValueChange={setQualityMetricsStatusFilter}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="meeting_target">Meeting Target</SelectItem>
                            <SelectItem value="near_target">Near Target</SelectItem>
                            <SelectItem value="below_target">Below Target</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => fetchQualityMetrics()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                        <div className="flex items-center border rounded-lg">
                          <Button 
                            variant={qualityMetricsViewMode === "table" ? "default" : "ghost"} 
                            size="sm"
                            className="rounded-r-none"
                            onClick={() => setQualityMetricsViewMode("table")}
                          >
                            Table
                          </Button>
                          <Button 
                            variant={qualityMetricsViewMode === "charts" ? "default" : "ghost"} 
                            size="sm"
                            className="rounded-l-none"
                            onClick={() => setQualityMetricsViewMode("charts")}
                          >
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Charts
                          </Button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExportQualityMetrics("csv")}>
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Export to CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateExcelReport()}>
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Generate Excel Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGeneratePDFReport()}>
                              <FileBarChart className="h-4 w-4 mr-2" />
                              Generate PDF Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={() => { resetMetricForm(); setShowAddMetricDialog(true); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Metric
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingQualityMetrics ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500">Loading quality metrics...</span>
                      </div>
                    ) : qualityMetricsError ? (
                      <div className="text-center py-12">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{qualityMetricsError}</p>
                        <Button variant="outline" onClick={() => fetchQualityMetrics()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    ) : qualityMetrics.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No quality metrics found</p>
                        <Button onClick={() => { resetMetricForm(); setShowAddMetricDialog(true); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Metric
                        </Button>
                      </div>
                    ) : qualityMetricsViewMode === "charts" ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <StatusDistributionChart metrics={qualityMetrics} />
                          <CategoryPerformanceChart metrics={qualityMetrics} />
                        </div>
                        <MultiMetricTrendChart metrics={qualityMetrics} />
                        <BenchmarkRadarChart metrics={qualityMetrics} />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium cursor-pointer hover:bg-gray-50" onClick={() => {
                                if (qualityMetricsSortBy === "name") {
                                  setQualityMetricsSortOrder(qualityMetricsSortOrder === "asc" ? "desc" : "asc")
                                } else {
                                  setQualityMetricsSortBy("name")
                                  setQualityMetricsSortOrder("asc")
                                }
                              }}>
                                Metric {qualityMetricsSortBy === "name" && (qualityMetricsSortOrder === "asc" ? "↑" : "↓")}
                              </th>
                              <th className="text-left p-3 font-medium cursor-pointer hover:bg-gray-50" onClick={() => {
                                if (qualityMetricsSortBy === "category") {
                                  setQualityMetricsSortOrder(qualityMetricsSortOrder === "asc" ? "desc" : "asc")
                                } else {
                                  setQualityMetricsSortBy("category")
                                  setQualityMetricsSortOrder("asc")
                                }
                              }}>
                                Category {qualityMetricsSortBy === "category" && (qualityMetricsSortOrder === "asc" ? "↑" : "↓")}
                              </th>
                              <th className="text-center p-3 font-medium cursor-pointer hover:bg-gray-50" onClick={() => {
                                if (qualityMetricsSortBy === "current_value") {
                                  setQualityMetricsSortOrder(qualityMetricsSortOrder === "asc" ? "desc" : "asc")
                                } else {
                                  setQualityMetricsSortBy("current_value")
                                  setQualityMetricsSortOrder("desc")
                                }
                              }}>
                                Current {qualityMetricsSortBy === "current_value" && (qualityMetricsSortOrder === "asc" ? "↑" : "↓")}
                              </th>
                              <th className="text-center p-3 font-medium">Target</th>
                              <th className="text-center p-3 font-medium">Benchmark</th>
                              <th className="text-center p-3 font-medium cursor-pointer hover:bg-gray-50" onClick={() => {
                                if (qualityMetricsSortBy === "trend") {
                                  setQualityMetricsSortOrder(qualityMetricsSortOrder === "asc" ? "desc" : "asc")
                                } else {
                                  setQualityMetricsSortBy("trend")
                                  setQualityMetricsSortOrder("desc")
                                }
                              }}>
                                Trend {qualityMetricsSortBy === "trend" && (qualityMetricsSortOrder === "asc" ? "↑" : "↓")}
                              </th>
                              <th className="text-center p-3 font-medium">Status</th>
                              <th className="text-center p-3 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {qualityMetrics.map((metric) => {
                              const status = getMetricStatus(metric)
                              return (
                                <tr key={metric.id} className="border-b hover:bg-gray-50">
                                  <td className="p-3">
                                    <p className="font-medium">{metric.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {metric.code && <span className="mr-2">[{metric.code}]</span>}
                                      Source: {metric.data_source || "N/A"}
                                    </p>
                                    {metric.is_ccbhc_required && (
                                      <Badge variant="outline" className="mt-1 text-xs">CCBHC</Badge>
                                    )}
                                    {metric.is_mips_measure && (
                                      <Badge variant="outline" className="mt-1 ml-1 text-xs">MIPS</Badge>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="outline" className="capitalize">{metric.category}</Badge>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="font-bold">
                                      {metric.current_value !== null && metric.current_value !== undefined 
                                        ? `${metric.current_value}${metric.unit || '%'}` 
                                        : "—"}
                                    </span>
                                    {metric.trend_percentage !== undefined && metric.trend_percentage !== 0 && (
                                      <span className={`text-xs ml-1 ${metric.trend_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ({metric.trend_percentage > 0 ? '+' : ''}{metric.trend_percentage}%)
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">{metric.target_value}{metric.unit || '%'}</td>
                                  <td className="p-3 text-center text-gray-500">
                                    {metric.benchmark_value !== undefined && metric.benchmark_value !== null 
                                      ? `${metric.benchmark_value}${metric.unit || '%'}` 
                                      : "—"}
                                  </td>
                                  <td className="p-3 text-center">{getTrendIcon(metric.trend)}</td>
                                  <td className="p-3 text-center">
                                    {status === "met" ? (
                                      <Badge className="bg-green-100 text-green-800">Met</Badge>
                                    ) : status === "near_target" ? (
                                      <Badge className="bg-yellow-100 text-yellow-800">Near Target</Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-800">Below</Badge>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="ghost">
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleViewMetricDetails(metric)}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEditMetric(metric)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Metric
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteMetric(metric)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Deactivate
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="equity">
              <HealthEquityDashboard />
            </TabsContent>

            <TabsContent value="ccbhc">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      CCBHC Compliance Dashboard
                    </CardTitle>
                    <CardDescription>Certified Community Behavioral Health Clinic performance measures</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-800">92%</p>
                        <p className="text-sm text-green-600">Overall CCBHC Compliance</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-800">8/9</p>
                        <p className="text-sm text-blue-600">Required Services Offered</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-purple-800">Next: Apr 15</p>
                        <p className="text-sm text-purple-600">Quality Report Due</p>
                      </div>
                    </div>

                    <h4 className="font-medium mb-4">CCBHC Required Quality Measures</h4>
                    <div className="space-y-3">
                      {[
                        { name: "Depression Screening and Follow-up", met: true, value: 89 },
                        { name: "Follow-up After Hospitalization for Mental Illness", met: true, value: 78 },
                        { name: "Follow-up After ED Visit for Mental Illness/SUD", met: true, value: 72 },
                        { name: "Initiation and Engagement of SUD Treatment", met: true, value: 85 },
                        { name: "Preventive Care: Tobacco Use Assessment", met: true, value: 95 },
                        { name: "Screening for Clinical Depression and Follow-up Plan", met: false, value: 68 },
                        {
                          name: "Child and Adolescent Major Depressive Disorder: Suicide Risk Assessment",
                          met: true,
                          value: 91,
                        },
                        { name: "Adult Major Depressive Disorder: Suicide Risk Assessment", met: false, value: 74 },
                      ].map((measure, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${measure.met ? "bg-green-100" : "bg-red-100"}`}
                          >
                            {measure.met ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{measure.name}</p>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${measure.met ? "text-green-600" : "text-red-600"}`}>
                              {measure.value}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>CCBHC Required Services Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { name: "Crisis Mental Health Services", available: true },
                        { name: "Screening, Assessment, and Diagnosis", available: true },
                        { name: "Patient-Centered Treatment Planning", available: true },
                        { name: "Outpatient Mental Health Services", available: true },
                        { name: "Outpatient SUD Services", available: true },
                        { name: "Primary Care Screening and Monitoring", available: true },
                        { name: "Targeted Case Management", available: true },
                        { name: "Psychiatric Rehabilitation Services", available: false },
                        { name: "Peer and Family Support Services", available: true },
                      ].map((service, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-lg ${service.available ? "bg-green-50" : "bg-red-50"}`}
                        >
                          {service.available ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${service.available ? "text-green-800" : "text-red-800"}`}>
                            {service.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="predictive">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Predictive Analytics & Machine Learning
                  </CardTitle>
                  <CardDescription>AI-powered risk stratification and outcome prediction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Treatment Dropout Risk Model */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Treatment Dropout Risk Prediction</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-red-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">High Risk</p>
                          <p className="text-3xl font-bold text-red-600">24</p>
                          <p className="text-xs text-gray-500 mt-1">{"Patients (>70% probability)"}</p>
                          <Button size="sm" variant="outline" className="mt-2 w-full bg-transparent">
                            View Patients
                          </Button>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Medium Risk</p>
                          <p className="text-3xl font-bold text-yellow-600">58</p>
                          <p className="text-xs text-gray-500 mt-1">Patients (40-70% probability)</p>
                          <Button size="sm" variant="outline" className="mt-2 w-full bg-transparent">
                            View Patients
                          </Button>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Low Risk</p>
                          <p className="text-3xl font-bold text-green-600">312</p>
                          <p className="text-xs text-gray-500 mt-1">Patients {"<"}40% probability</p>
                          <Button size="sm" variant="outline" className="mt-2 w-full bg-transparent">
                            View Patients
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Model Performance</p>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div>
                            <p className="text-xs text-gray-600">AUC-ROC</p>
                            <p className="text-lg font-bold">0.87</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Sensitivity</p>
                            <p className="text-lg font-bold">82%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Specificity</p>
                            <p className="text-lg font-bold">79%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Overdose Risk Model */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Overdose Risk Prediction</h3>
                      <div className="space-y-3">
                        {[
                          { name: "Recent relapse", weight: 0.32, impact: "High" },
                          { name: "Poly-substance use", weight: 0.28, impact: "High" },
                          { name: "Mental health comorbidity", weight: 0.18, impact: "Medium" },
                          { name: "Social isolation", weight: 0.12, impact: "Medium" },
                          { name: "Unstable housing", weight: 0.1, impact: "Low" },
                        ].map((factor, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">{factor.name}</span>
                                <span className="text-xs text-gray-500">
                                  Weight: {(factor.weight * 100).toFixed(0)}%
                                </span>
                              </div>
                              <Progress value={factor.weight * 100} className="h-2" />
                            </div>
                            <Badge
                              className={
                                factor.impact === "High"
                                  ? "bg-red-100 text-red-800"
                                  : factor.impact === "Medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }
                            >
                              {factor.impact}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Treatment Response Prediction */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Treatment Response Prediction</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Predicting optimal treatment pathways based on patient characteristics
                      </p>
                      <div className="space-y-2">
                        {[
                          { treatment: "Methadone", success_rate: 78, recommended: 145 },
                          { treatment: "Buprenorphine", success_rate: 72, recommended: 89 },
                          { treatment: "Naltrexone", success_rate: 65, recommended: 34 },
                          { treatment: "CBT + MAT", success_rate: 85, recommended: 67 },
                        ].map((treatment, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{treatment.treatment}</p>
                              <p className="text-xs text-gray-500">{treatment.recommended} patients recommended</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{treatment.success_rate}%</p>
                              <p className="text-xs text-gray-500">Predicted success</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Network Analysis & Care Coordination
                  </CardTitle>
                  <CardDescription>Social network analysis and referral pattern insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Referral Network */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Care Coordination Network</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-3">Network Density</p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Progress value={68} className="h-3" />
                            </div>
                            <span className="text-2xl font-bold">68%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Proportion of active care coordination relationships
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-3">Network Centralization</p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Progress value={42} className="h-3" />
                            </div>
                            <span className="text-2xl font-bold">42%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Degree to which referrals flow through hubs</p>
                        </div>
                      </div>
                    </div>

                    {/* Key Network Nodes */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Key Network Nodes</h3>
                      <div className="space-y-2">
                        {[
                          {
                            provider: "Primary Care Clinic A",
                            betweenness: 0.89,
                            referrals_out: 156,
                            referrals_in: 142,
                          },
                          { provider: "Mental Health Center", betweenness: 0.76, referrals_out: 98, referrals_in: 123 },
                          { provider: "Emergency Department", betweenness: 0.68, referrals_out: 234, referrals_in: 12 },
                          { provider: "Social Services", betweenness: 0.54, referrals_out: 67, referrals_in: 89 },
                        ].map((node, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium">{node.provider}</p>
                              <Badge className="bg-purple-100 text-purple-800">
                                Centrality: {(node.betweenness * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Outgoing Referrals</p>
                                <p className="font-semibold">{node.referrals_out}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Incoming Referrals</p>
                                <p className="font-semibold">{node.referrals_in}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Community Detection */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Care Communities Detected</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Algorithm identified 4 distinct care coordination communities
                      </p>
                      <div className="space-y-2">
                        {[
                          { community: "Primary Care Hub", size: 12, modularity: 0.72 },
                          { community: "Mental Health Cluster", size: 8, modularity: 0.68 },
                          { community: "Substance Use Network", size: 15, modularity: 0.81 },
                          { community: "Social Services Group", size: 6, modularity: 0.59 },
                        ].map((comm, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{comm.community}</p>
                              <p className="text-xs text-gray-500">{comm.size} providers</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">Modularity: {comm.modularity}</p>
                              <p className="text-xs text-gray-500">Community cohesion</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nlp">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Clinical Natural Language Processing
                  </CardTitle>
                  <CardDescription>AI-powered analysis of clinical documentation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Documentation Quality Analysis */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Documentation Quality Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Completeness Score</p>
                          <p className="text-3xl font-bold text-green-600">87%</p>
                          <Progress value={87} className="mt-2 h-2" />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Clinical Detail Score</p>
                          <p className="text-3xl font-bold text-blue-600">79%</p>
                          <Progress value={79} className="mt-2 h-2" />
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">Compliance Score</p>
                          <p className="text-3xl font-bold text-purple-600">92%</p>
                          <Progress value={92} className="mt-2 h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Sentiment Analysis */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Patient Sentiment Trends</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Extracted from clinical notes and patient communications
                      </p>
                      <div className="space-y-3">
                        {[
                          { sentiment: "Positive/Hopeful", count: 245, percentage: 52 },
                          { sentiment: "Neutral", count: 156, percentage: 33 },
                          { sentiment: "Negative/Distressed", count: 71, percentage: 15 },
                        ].map((item, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{item.sentiment}</span>
                              <span className="text-sm text-gray-500">
                                {item.count} notes ({item.percentage}%)
                              </span>
                            </div>
                            <Progress value={item.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Concept Extraction */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Top Clinical Concepts (Last 30 Days)</h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { term: "Anxiety", count: 342 },
                          { term: "Depression", count: 298 },
                          { term: "Substance Use", count: 267 },
                          { term: "Medication Adherence", count: 234 },
                          { term: "Family Conflict", count: 189 },
                          { term: "Employment", count: 156 },
                          { term: "Housing Instability", count: 143 },
                          { term: "Trauma", count: 128 },
                          { term: "Social Support", count: 112 },
                          { term: "Coping Skills", count: 98 },
                        ].map((concept, idx) => (
                          <Badge key={idx} variant="outline" className="text-sm">
                            {concept.term} ({concept.count})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Risk Factor Extraction */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Automated Risk Factor Extraction</h3>
                      <div className="space-y-2">
                        {[
                          { risk: "Suicidal Ideation", detected: 18, flagged: 18, action_taken: 17 },
                          { risk: "Violence/Aggression", detected: 12, flagged: 12, action_taken: 11 },
                          { risk: "Medication Non-Adherence", detected: 45, flagged: 45, action_taken: 38 },
                          { risk: "Relapse Indicators", detected: 67, flagged: 67, action_taken: 59 },
                        ].map((item, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <p className="font-medium">{item.risk}</p>
                              <Badge className="bg-red-100 text-red-800">{item.detected} detected</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                              <div>
                                <p className="text-gray-500">Auto-Flagged</p>
                                <p className="font-semibold">{item.flagged}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Action Taken</p>
                                <p className="font-semibold">{item.action_taken}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Response Rate</p>
                                <p className="font-semibold">
                                  {((item.action_taken / item.flagged) * 100).toFixed(0)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cost">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Cost-Effectiveness Analysis
                  </CardTitle>
                  <CardDescription>Economic evaluation of interventions and services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Cost per Quality-Adjusted Life Year (QALY) */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Cost-Effectiveness Ratios</h3>
                      <div className="space-y-3">
                        {[
                          {
                            intervention: "Medication-Assisted Treatment (MAT)",
                            cost_per_qaly: 15420,
                            threshold: "Highly cost-effective",
                            color: "green",
                          },
                          {
                            intervention: "Intensive Outpatient Program (IOP)",
                            cost_per_qaly: 28350,
                            threshold: "Cost-effective",
                            color: "blue",
                          },
                          {
                            intervention: "Peer Recovery Support",
                            cost_per_qaly: 8920,
                            threshold: "Highly cost-effective",
                            color: "green",
                          },
                          {
                            intervention: "Contingency Management",
                            cost_per_qaly: 18670,
                            threshold: "Highly cost-effective",
                            color: "green",
                          },
                        ].map((item, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium">{item.intervention}</p>
                              <Badge
                                className={
                                  item.color === "green" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                }
                              >
                                {item.threshold}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-600">Cost per QALY</p>
                              <p className="text-lg font-bold">${item.cost_per_qaly.toLocaleString()}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.cost_per_qaly < 50000 ? "Below $50k threshold" : "Moderate cost-effectiveness"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Return on Investment */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Return on Investment (ROI) Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            program: "Emergency Department Diversion",
                            investment: 125000,
                            savings: 487000,
                            roi: 289,
                          },
                          {
                            program: "Housing First Initiative",
                            investment: 280000,
                            savings: 620000,
                            roi: 121,
                          },
                          {
                            program: "Care Coordination Program",
                            investment: 95000,
                            savings: 245000,
                            roi: 158,
                          },
                          {
                            program: "Peer Support Services",
                            investment: 65000,
                            savings: 156000,
                            roi: 140,
                          },
                        ].map((program, idx) => (
                          <div key={idx} className="p-4 border rounded-lg">
                            <p className="font-semibold mb-2">{program.program}</p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Investment</span>
                                <span className="font-medium">${program.investment.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cost Savings</span>
                                <span className="font-medium text-green-600">${program.savings.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Net Benefit</span>
                                <span className="font-bold text-green-600">
                                  ${(program.savings - program.investment).toLocaleString()}
                                </span>
                              </div>
                              <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">ROI</span>
                                  <span className="text-2xl font-bold text-green-600">{program.roi}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Budget Impact Analysis */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Budget Impact Analysis (3-Year Projection)</h3>
                      <div className="space-y-3">
                        {[
                          { year: "Year 1", costs: 1250000, savings: 890000, net: -360000 },
                          { year: "Year 2", costs: 980000, savings: 1540000, net: 560000 },
                          { year: "Year 3", costs: 850000, savings: 1890000, net: 1040000 },
                        ].map((year, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium mb-2">{year.year}</p>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Costs</p>
                                <p className="font-semibold text-red-600">${year.costs.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Savings</p>
                                <p className="font-semibold text-green-600">${year.savings.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Net Impact</p>
                                <p className={`font-bold ${year.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  ${Math.abs(year.net).toLocaleString()}
                                  {year.net >= 0 ? " saved" : " invested"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">3-Year Cumulative Net Benefit</p>
                            <p className="text-3xl font-bold text-green-600">$1,240,000</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data-export">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-cyan-600" />
                    Research Data Export Center
                  </CardTitle>
                  <CardDescription>De-identified data exports for research and quality improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Available Data Sets</h4>
                      {[
                        {
                          name: "Patient Demographics (De-identified)",
                          records: "12,456",
                          lastUpdated: "2025-01-03",
                          access: "researcher",
                        },
                        {
                          name: "Treatment Outcomes",
                          records: "45,678",
                          lastUpdated: "2025-01-02",
                          access: "researcher",
                        },
                        {
                          name: "Quality Metrics - Monthly",
                          records: "24 months",
                          lastUpdated: "2025-01-01",
                          access: "all",
                        },
                        {
                          name: "EBP Fidelity Assessments",
                          records: "2,345",
                          lastUpdated: "2024-12-31",
                          access: "researcher",
                        },
                        {
                          name: "CCBHC Performance Measures",
                          records: "36 months",
                          lastUpdated: "2025-01-01",
                          access: "all",
                        },
                      ].map((dataset, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{dataset.name}</p>
                              <p className="text-sm text-gray-500">
                                {dataset.records} records • Updated {dataset.lastUpdated}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {dataset.access === "researcher" ? (
                              <Lock className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <Unlock className="h-4 w-4 text-green-600" />
                            )}
                            <Button size="sm">Export</Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Custom Data Request</h4>
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Data Categories</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {["Demographics", "Diagnoses", "Medications", "Encounters", "Assessments", "Outcomes"].map(
                              (cat) => (
                                <div key={cat} className="flex items-center gap-2">
                                  <Checkbox id={cat} />
                                  <label htmlFor={cat} className="text-sm">
                                    {cat}
                                  </label>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Date Range</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="date" />
                            <Input type="date" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Export Format</Label>
                          <Select defaultValue="csv">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="spss">SPSS</SelectItem>
                              <SelectItem value="sas">SAS</SelectItem>
                              <SelectItem value="stata">Stata</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                          <Shield className="h-5 w-5 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            All exports are HIPAA-compliant and 42 CFR Part 2 de-identified
                          </p>
                        </div>
                        <Button className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Generate Export
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* New Study Dialog */}
      <Dialog
        open={showNewStudyDialog}
        onOpenChange={(open) => {
          setShowNewStudyDialog(open)
          if (!open) {
            setEditingStudy(null)
            setFormData({
              title: "",
              description: "",
              study_type: "implementation",
              status: "planning",
              pi_name: "",
              pi_email: "",
              pi_phone: "",
              start_date: "",
              end_date: "",
              enrollment_target: "",
              funding_source: "",
              irb_status: "pending",
              irb_number: "",
              irb_approval_date: "",
              irb_expiration_date: "",
              funding_amount: "",
              grant_number: "",
            })
            setFormError(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudy ? "Edit Research Study" : "Create New Research Study"}</DialogTitle>
            <DialogDescription>
              {editingStudy ? "Update study information" : "Set up a new implementation, pilot, or quality improvement study"}
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">{formError}</p>
              </div>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Study Title *</Label>
              <Input
                placeholder="Enter study title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Study Type *</Label>
                <Select
                  value={formData.study_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, study_type: value as ResearchStudy["study_type"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="implementation">Implementation Science</SelectItem>
                    <SelectItem value="pilot">Pilot Study</SelectItem>
                    <SelectItem value="quality_improvement">Quality Improvement</SelectItem>
                    <SelectItem value="outcomes">Outcomes Research</SelectItem>
                    <SelectItem value="equity">Health Equity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Study Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as ResearchStudy["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="data_collection">Data Collection</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Principal Investigator *</Label>
                <Input
                  placeholder="PI Name"
                  value={formData.pi_name}
                  onChange={(e) => setFormData({ ...formData, pi_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PI Email</Label>
                <Input
                  type="email"
                  placeholder="pi@example.com"
                  value={formData.pi_email}
                  onChange={(e) => setFormData({ ...formData, pi_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>PI Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.pi_phone}
                  onChange={(e) => setFormData({ ...formData, pi_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Study description and objectives"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Enrollment Target *</Label>
                <Input
                  type="number"
                  placeholder="Target participants"
                  min="1"
                  value={formData.enrollment_target}
                  onChange={(e) => setFormData({ ...formData, enrollment_target: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Funding Source</Label>
                <Input
                  placeholder="Funding organization"
                  value={formData.funding_source}
                  onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Funding Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.funding_amount}
                  onChange={(e) => setFormData({ ...formData, funding_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Grant Number</Label>
                <Input
                  placeholder="Grant number"
                  value={formData.grant_number}
                  onChange={(e) => setFormData({ ...formData, grant_number: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>IRB Status</Label>
              <Select
                value={formData.irb_status}
                onValueChange={(value) => {
                  const newStatus = value as ResearchStudy["irb_status"]
                  setFormData((prev) => {
                    const updated = { ...prev, irb_status: newStatus }
                    // Phase 1: When status is set to "approved", require approval_date (validation will happen on submit)
                    // Phase 1: When status changes away from approved, preserve approval_date (don't delete)
                    // The approval_date is preserved automatically since we're not clearing it
                    return updated
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="exempt">Exempt</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>IRB Number</Label>
                <Input
                  placeholder="IRB-2024-001"
                  value={formData.irb_number}
                  onChange={(e) => setFormData({ ...formData, irb_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>IRB Approval Date {formData.irb_status === "approved" && <span className="text-red-500">*</span>}</Label>
                <Input
                  type="date"
                  value={formData.irb_approval_date}
                  onChange={(e) => {
                    const newApprovalDate = e.target.value
                    setFormData((prev) => {
                      const updated = { ...prev, irb_approval_date: newApprovalDate }
                      const today = new Date().toISOString().split('T')[0]
                      const isFutureDate = newApprovalDate && newApprovalDate > today
                      
                      // Phase 1: Auto-set status to "approved" when approval date is set (if currently pending AND date is not in future)
                      // Don't auto-set to approved if date is in the future (allows planning scenarios)
                      if (newApprovalDate && prev.irb_status === "pending" && !isFutureDate) {
                        updated.irb_status = "approved"
                      }
                      // Phase 1: Auto-set status to "pending" when approval date is cleared (if currently approved)
                      else if (!newApprovalDate && prev.irb_status === "approved") {
                        updated.irb_status = "pending"
                      }
                      // If future date is set, keep current status (don't auto-change to approved)
                      // This handles: user changes approved → pending, then sets future date
                      return updated
                    })
                  }}
                />
                {formData.irb_status === "approved" && !formData.irb_approval_date && (
                  <p className="text-xs text-red-500">Approval date is required when status is "approved"</p>
                )}
                {formData.irb_approval_date && formData.irb_approval_date > new Date().toISOString().split('T')[0] && formData.irb_status === "approved" && (
                  <p className="text-xs text-red-500">Approval date cannot be in the future when status is "approved"</p>
                )}
                {formData.irb_approval_date && formData.irb_approval_date > new Date().toISOString().split('T')[0] && formData.irb_status !== "approved" && (
                  <p className="text-xs text-blue-600">Info: Future approval date allowed for planning. Status will remain "{formData.irb_status}"</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>IRB Expiration Date</Label>
                <Input
                  type="date"
                  value={formData.irb_expiration_date}
                  onChange={(e) => setFormData({ ...formData, irb_expiration_date: e.target.value })}
                />
                {formData.irb_approval_date && formData.irb_expiration_date && 
                 formData.irb_expiration_date <= formData.irb_approval_date && (
                  <p className="text-xs text-red-500">Expiration date must be after approval date</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewStudyDialog(false)
                setEditingStudy(null)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateStudy} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingStudy ? "Updating..." : "Creating..."}
                </>
              ) : editingStudy ? (
                "Update Study"
              ) : (
                "Create Study"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showViewDetailsDialog} onOpenChange={(open) => {
        setShowViewDetailsDialog(open)
        // Clean up state when dialog closes to prevent data leakage between studies
        if (!open) {
          setParticipants([])
          setStudyDetails(null)
          setSelectedStudy(null)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Study Details</DialogTitle>
            <DialogDescription>Comprehensive information about the research study</DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : studyDetails ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-500">Title</Label>
                  <p className="text-lg font-medium">{studyDetails.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-500">Study Type</Label>
                  <Badge className="mt-1">{studyDetails.study_type.replace("_", " ")}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-500">Status</Label>
                  <Badge className={getStatusColor(studyDetails.status)}>{studyDetails.status.replace("_", " ")}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-500">IRB Status</Label>
                  <Badge className={getStatusColor(studyDetails.irb_status)} variant="outline">{studyDetails.irb_status}</Badge>
                </div>
              </div>

              {studyDetails.description && (
                <div>
                  <Label className="text-sm font-semibold text-gray-500">Description</Label>
                  <p className="mt-1 text-sm">{studyDetails.description}</p>
                </div>
              )}

              {/* Principal Investigator */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Principal Investigator</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="min-w-0">
                    <Label className="text-sm font-semibold text-gray-500">Name</Label>
                    <p className="mt-1 break-words">{studyDetails.pi_name}</p>
                  </div>
                  <div className="min-w-0">
                    <Label className="text-sm font-semibold text-gray-500">Email</Label>
                    <p className="mt-1 break-all break-words text-sm overflow-wrap-anywhere">{studyDetails.pi_email || "N/A"}</p>
                  </div>
                  <div className="min-w-0">
                    <Label className="text-sm font-semibold text-gray-500">Phone</Label>
                    <p className="mt-1 break-words whitespace-nowrap">{studyDetails.pi_phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Start Date</Label>
                    <p className="mt-1">{formatDateForDisplay(studyDetails.start_date || null)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">End Date</Label>
                    <p className="mt-1">{formatDateForDisplay(studyDetails.end_date || null)}</p>
                  </div>
                </div>
              </div>

              {/* Enrollment */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Enrollment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Current Enrollment</Label>
                    <p className="mt-1 text-2xl font-bold">{studyDetails.current_enrollment}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Enrollment Target</Label>
                    <p className="mt-1 text-2xl font-bold">{studyDetails.enrollment_target}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress
                    value={(studyDetails.current_enrollment / studyDetails.enrollment_target) * 100}
                    className="h-3"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {Math.round((studyDetails.current_enrollment / studyDetails.enrollment_target) * 100)}% complete
                  </p>
                </div>
              </div>

              {/* IRB Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">IRB Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">IRB Number</Label>
                    <p className="mt-1">{studyDetails.irb_number || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Approval Date</Label>
                    <p className="mt-1">{studyDetails.irb_approval_date ? new Date(studyDetails.irb_approval_date).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Expiration Date</Label>
                    <p className="mt-1">{studyDetails.irb_expiration_date ? new Date(studyDetails.irb_expiration_date).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Funding */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Funding</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Funding Source</Label>
                    <p className="mt-1">{studyDetails.funding_source || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Funding Amount</Label>
                    <p className="mt-1">{studyDetails.funding_amount ? `$${parseFloat(String(studyDetails.funding_amount)).toLocaleString()}` : "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Grant Number</Label>
                    <p className="mt-1">{studyDetails.grant_number || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Participants ({participants.length})</h3>
                  {studyDetails && (() => {
                    const today = new Date().toISOString().split('T')[0]
                    const statusValid = ['active', 'data_collection'].includes(studyDetails.status)
                    const irbValid = studyDetails.irb_status === 'approved'
                    const dateValid = today >= studyDetails.start_date && today <= studyDetails.end_date
                    const capacityValid = studyDetails.current_enrollment < studyDetails.enrollment_target
                    const canEnroll = statusValid && irbValid && dateValid && capacityValid
                    
                    return canEnroll ? (
                      <Button onClick={handleOpenEnrollDialog} size="sm">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Enroll Patient
                      </Button>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {!statusValid && (
                          <span className="block">Status must be "active" or "data_collection" (currently: {studyDetails.status})</span>
                        )}
                        {!irbValid && (
                          <span className="block">IRB must be "approved" (currently: {studyDetails.irb_status})</span>
                        )}
                        {!dateValid && (
                          <span className="block">Current date must be within study timeline ({formatDateForDisplay(studyDetails.start_date)} - {formatDateForDisplay(studyDetails.end_date)})</span>
                        )}
                        {!capacityValid && (
                          <span className="block">Enrollment capacity reached ({studyDetails.current_enrollment}/{studyDetails.enrollment_target})</span>
                        )}
                      </div>
                    )
                  })()}
                </div>
                {participants.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {participants.map((p: any, idx: number) => (
                      <div key={p.id || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Participant {idx + 1}</p>
                          <p className="text-xs text-gray-500">Enrolled: {new Date(p.enrolled_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                        <Badge variant="outline">{p.enrollment_status}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenParticipantDetail(p)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenParticipantStatusDialog(p)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="mb-2 text-sm">No participants enrolled yet</p>
                    {studyDetails && (() => {
                      const today = new Date().toISOString().split('T')[0]
                      const statusValid = ['active', 'data_collection'].includes(studyDetails.status)
                      const irbValid = studyDetails.irb_status === 'approved'
                      const dateValid = today >= studyDetails.start_date && today <= studyDetails.end_date
                      const capacityValid = studyDetails.current_enrollment < studyDetails.enrollment_target
                      const canEnroll = statusValid && irbValid && dateValid && capacityValid
                      
                      return canEnroll ? (
                        <Button onClick={handleOpenEnrollDialog} size="sm" variant="outline">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Enroll First Participant
                        </Button>
                      ) : (
                        <div className="text-xs space-y-1 mt-2">
                          <p className="text-sm font-medium mb-2">Study is not accepting enrollments. Requirements:</p>
                          {!statusValid && (
                            <p className="text-red-600">✗ Status must be "active" or "data_collection" (currently: {studyDetails.status})</p>
                          )}
                          {!irbValid && (
                            <p className="text-red-600">✗ IRB must be "approved" (currently: {studyDetails.irb_status})</p>
                          )}
                          {!dateValid && (
                            <p className="text-red-600">✗ Current date must be within study timeline ({formatDateForDisplay(studyDetails.start_date)} - {formatDateForDisplay(studyDetails.end_date)})</p>
                          )}
                          {!capacityValid && (
                            <p className="text-red-600">✗ Enrollment capacity reached ({studyDetails.current_enrollment}/{studyDetails.enrollment_target})</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Created At</Label>
                    <p className="mt-1">{studyDetails.created_at ? new Date(studyDetails.created_at).toLocaleString() : "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Last Updated</Label>
                    <p className="mt-1">{studyDetails.updated_at ? new Date(studyDetails.updated_at).toLocaleString() : "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No study details available</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Data Dashboard Dialog */}
      <Dialog open={showDataDashboardDialog} onOpenChange={(open) => {
        setShowDataDashboardDialog(open)
        // Clean up state when dialog closes to prevent data leakage between studies
        if (!open) {
          setParticipants([])
          setStudyDetails(null)
          setSelectedStudy(null)
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
            <DialogTitle>Data Dashboard - {selectedStudy?.title}</DialogTitle>
            <DialogDescription>Analytics and visualizations for the research study</DialogDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/research/automate", { method: "POST" })
                    const data = await response.json()
                    if (response.ok) {
                      let description = data.message || "Automation completed."
                      
                      // Add details about changes if any
                      if (data.total_updates > 0) {
                        const details: string[] = []
                        if (data.updated > 0) {
                          details.push(`${data.updated} study status${data.updated !== 1 ? "es" : ""} updated`)
                        }
                        if (data.irb_updated > 0) {
                          details.push(`${data.irb_updated} IRB status${data.irb_updated !== 1 ? "es" : ""} updated`)
                        }
                        if (details.length > 0) {
                          description += ` (${details.join(", ")})`
                        }
                      }
                      
                      toast({
                        title: "Automation Complete",
                        description,
                      })
                      // Refresh study details
                      if (selectedStudy) {
                        handleDataDashboard(selectedStudy)
                        fetchStudies() // Refresh studies list to show updated statuses
                      }
                    } else {
                      toast({
                        variant: "destructive",
                        title: "Automation Error",
                        description: data.message || "Failed to run automation.",
                      })
                    }
                  } catch (err) {
                    toast({
                      variant: "destructive",
                      title: "Automation Error",
                      description: "Failed to run automation.",
                    })
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Automation
              </Button>
            </div>
          </DialogHeader>
          {loadingParticipants ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : studyDetails ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Participants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{participants.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Enrolled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {participants.filter((p: any) => p.enrollment_status === "enrolled").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {participants.filter((p: any) => p.enrollment_status === "completed").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Consent Obtained</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {participants.filter((p: any) => p.consent_obtained === true).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enrollment Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Progress</CardTitle>
                  <CardDescription>Current enrollment vs. target</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Progress</span>
                      <span className="text-sm font-medium">
                        {studyDetails.current_enrollment} / {studyDetails.enrollment_target}
                      </span>
                    </div>
                    <Progress
                      value={(studyDetails.current_enrollment / studyDetails.enrollment_target) * 100}
                      className="h-4"
                    />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Remaining</p>
                        <p className="text-lg font-semibold">
                          {studyDetails.enrollment_target - studyDetails.current_enrollment} participants
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Completion Rate</p>
                        <p className="text-lg font-semibold">
                          {Math.round((studyDetails.current_enrollment / studyDetails.enrollment_target) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enrollment Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["enrolled", "withdrawn", "completed", "lost_to_followup"].map((status) => {
                      const count = participants.filter((p: any) => p.enrollment_status === status).length
                      const percentage = participants.length > 0 ? (count / participants.length) * 100 : 0
                      // Format status display name
                      const statusDisplayName = status === "lost_to_followup" 
                        ? "Lost to Follow-up" 
                        : status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{statusDisplayName}</span>
                            <span className="font-medium">{count} ({Math.round(percentage)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Study Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Start Date</p>
                        <p className="text-sm text-gray-500">{formatDateForDisplay(studyDetails.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">End Date</p>
                        <p className="text-sm text-gray-500">{formatDateForDisplay(studyDetails.end_date)}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Study Duration</p>
                      <p className="text-lg font-semibold">
                        {Math.ceil((new Date(studyDetails.end_date).getTime() - new Date(studyDetails.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Days Remaining</p>
                      <p className="text-lg font-semibold">
                        {Math.max(0, Math.ceil((new Date(studyDetails.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Consent Rate */}
              {participants.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Consent Rate</CardTitle>
                    <CardDescription>Percentage of participants with consent obtained</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Consent Obtained</span>
                        <span className="text-sm font-medium">
                          {participants.filter((p: any) => p.consent_obtained === true).length} / {participants.length} (
                          {participants.length > 0
                            ? Math.round(
                                (participants.filter((p: any) => p.consent_obtained === true).length /
                                  participants.length) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <Progress
                        value={
                          participants.length > 0
                            ? (participants.filter((p: any) => p.consent_obtained === true).length /
                                participants.length) *
                              100
                            : 0
                        }
                        className="h-4"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Participants List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Participants List</CardTitle>
                      <CardDescription>All enrolled participants in this study</CardDescription>
                    </div>
                    {studyDetails && (() => {
                      const today = new Date().toISOString().split('T')[0]
                      const canEnroll = 
                        ['active', 'data_collection'].includes(studyDetails.status) &&
                        studyDetails.irb_status === 'approved' &&
                        today >= studyDetails.start_date &&
                        today <= studyDetails.end_date &&
                        studyDetails.current_enrollment < studyDetails.enrollment_target
                      
                      return canEnroll ? (
                        <Button onClick={handleOpenEnrollDialog} size="sm">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Enroll Patient
                        </Button>
                      ) : null
                    })()}
                  </div>
                </CardHeader>
                <CardContent>
                  {participants.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {participants.map((p: any, idx: number) => (
                        <div key={p.id || idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <p className="font-medium">Participant {idx + 1}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span>Enrolled: {new Date(p.enrolled_date).toLocaleDateString()}</span>
                              {p.consent_obtained && (
                                <span className="text-green-600">✓ Consent Obtained</span>
                              )}
                              {p.consent_date && (
                                <span>Consent Date: {new Date(p.consent_date).toLocaleDateString()}</span>
                              )}
                              {p.withdrawal_date && (
                                <span className="text-red-600">Withdrawn: {new Date(p.withdrawal_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                          <Badge variant="outline">{p.enrollment_status}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenParticipantDetail(p)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenParticipantStatusDialog(p)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-2">No participants enrolled yet</p>
                      {studyDetails && (() => {
                        const today = new Date().toISOString().split('T')[0]
                        const canEnroll = 
                          ['active', 'data_collection'].includes(studyDetails.status) &&
                          studyDetails.irb_status === 'approved' &&
                          today >= studyDetails.start_date &&
                          today <= studyDetails.end_date &&
                          studyDetails.current_enrollment < studyDetails.enrollment_target
                        
                        return canEnroll ? (
                          <Button onClick={handleOpenEnrollDialog} size="sm" variant="outline">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Enroll First Participant
                          </Button>
                        ) : (
                          <p className="text-sm">Study is not accepting enrollments at this time</p>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enroll Patient in Research Study</DialogTitle>
            <DialogDescription>
              Complete the form below to enroll a patient
            </DialogDescription>
          </DialogHeader>

          {studyDetails && (
            <div className="space-y-4">
              {/* Prominent Study Association Banner */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Microscope className="h-6 w-6 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-teal-900 text-lg">
                      Enrolling in: {studyDetails.title}
                    </p>
                    <p className="text-sm text-teal-700 mt-1">
                      This patient will be enrolled exclusively in this study. Their enrollment data will only be visible within this study&apos;s participant list.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-teal-700 border-teal-300">
                        {studyDetails.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="text-teal-700 border-teal-300">
                        IRB: {studyDetails.irb_status}
                      </Badge>
                      <Badge variant="outline" className="text-teal-700 border-teal-300">
                        {studyDetails.current_enrollment}/{studyDetails.enrollment_target} enrolled
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Selection */}
              <div className="space-y-2">
                <Label>Patient *</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Search patients by name or phone..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                  />
                  <Select
                    value={enrollmentFormData.patient_id}
                    onValueChange={(value) => setEnrollmentFormData({ ...enrollmentFormData, patient_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select a patient"} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.length > 0 ? (
                        patients.map((patient) => {
                          const dob = patient.date_of_birth 
                            ? new Date(patient.date_of_birth).toLocaleDateString()
                            : "N/A"
                          return (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.first_name} {patient.last_name} (DOB: {dob})
                            </SelectItem>
                          )
                        })
                      ) : (
                        <SelectItem value="no-results" disabled>
                          {patientSearchTerm ? "No patients found" : "Start typing to search"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Enrollment Date */}
              <div className="space-y-2">
                <Label>Enrollment Date *</Label>
                <Input
                  type="date"
                  value={enrollmentFormData.enrolled_date}
                  onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, enrolled_date: e.target.value })}
                />
              </div>

              {/* Consent Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consent-obtained"
                    checked={enrollmentFormData.consent_obtained}
                    onCheckedChange={(checked) => {
                      setEnrollmentFormData({
                        ...enrollmentFormData,
                        consent_obtained: checked === true,
                        consent_date: checked === true && !enrollmentFormData.consent_date
                          ? new Date().toISOString().split('T')[0]
                          : enrollmentFormData.consent_date,
                      })
                    }}
                  />
                  <Label htmlFor="consent-obtained" className="font-semibold">
                    Consent Obtained *
                  </Label>
                </div>

                {enrollmentFormData.consent_obtained && (
                  <>
                    <div className="space-y-2">
                      <Label>Consent Date *</Label>
                      <Input
                        type="date"
                        value={enrollmentFormData.consent_date}
                        onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, consent_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Consent Document (Optional)</Label>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setConsentFile(file)
                              // Auto-upload file
                              handleUploadConsentFile(file)
                            }
                          }}
                          disabled={uploadingConsent}
                        />
                        {uploadingConsent && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading document...
                          </div>
                        )}
                        {enrollmentFormData.consent_document_url && !uploadingConsent && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Document uploaded successfully
                          </div>
                        )}
                        {enrollmentFormData.consent_document_url && (
                          <div className="text-xs text-gray-500">
                            <a
                              href={enrollmentFormData.consent_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View uploaded document
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Or enter URL manually:
                      </div>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={enrollmentFormData.consent_document_url}
                        onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, consent_document_url: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Error Message */}
              {enrollmentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{enrollmentError}</p>
                </div>
              )}

              {/* Dialog Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowEnrollDialog(false)}
                  disabled={enrollingPatient}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEnrollPatient}
                  disabled={enrollingPatient}
                >
                  {enrollingPatient ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enroll Patient
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Format Dialog */}
      <Dialog open={showExportFormatDialog} onOpenChange={setShowExportFormatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Research Study Data</DialogTitle>
            <DialogDescription>
              Choose the format for exporting {selectedStudyForExport?.title || "this study"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              className="w-full justify-start h-auto py-4"
              onClick={() => selectedStudyForExport && exportToExcel(selectedStudyForExport)}
              disabled={exporting || !selectedStudyForExport}
            >
              <FileSpreadsheet className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Export to Excel (.xlsx)</div>
                <div className="text-xs text-gray-500 font-normal">
                  Multiple sheets with study info, statistics, and participants
                </div>
              </div>
            </Button>

            <Button
              className="w-full justify-start h-auto py-4"
              variant="outline"
              onClick={() => selectedStudyForExport && exportToPDF(selectedStudyForExport)}
              disabled={exporting || !selectedStudyForExport}
            >
              <FileText className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Export to PDF Report</div>
                <div className="text-xs text-gray-500 font-normal">
                  Formatted report for IRB submissions and documentation
                </div>
              </div>
            </Button>
          </div>

          {exporting && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Generating export...</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowExportFormatDialog(false)
                setSelectedStudyForExport(null)
              }}
              disabled={exporting}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EBP Dialog */}
      <Dialog
        open={showEbpDialog}
        onOpenChange={(open) => {
          setShowEbpDialog(open)
          if (!open) {
            setEditingEbp(null)
            setEbpFormData({
              name: "",
              category: "Counseling",
              description: "",
              outcomes_tracked: [],
              total_staff: "",
            })
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEbp ? "Edit Evidence-Based Practice" : "Create New Evidence-Based Practice"}</DialogTitle>
            <DialogDescription>
              {editingEbp ? "Update EBP information" : "Add a new evidence-based practice to track"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>EBP Name *</Label>
              <Input
                placeholder="Enter EBP name (e.g., Cognitive Behavioral Therapy)"
                value={ebpFormData.name}
                onChange={(e) => setEbpFormData({ ...ebpFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={ebpFormData.category}
                onValueChange={(value) =>
                  setEbpFormData({ ...ebpFormData, category: value as "Counseling" | "Behavioral" | "Medical" | "Organizational" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Counseling">Counseling</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Organizational">Organizational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the evidence-based practice, its evidence base, and implementation requirements"
                rows={4}
                value={ebpFormData.description}
                onChange={(e) => setEbpFormData({ ...ebpFormData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Total Staff</Label>
              <Input
                type="number"
                placeholder="Total number of staff"
                min="0"
                value={ebpFormData.total_staff}
                onChange={(e) => setEbpFormData({ ...ebpFormData, total_staff: e.target.value })}
              />
              <p className="text-xs text-gray-500">Total number of staff members in your organization</p>
            </div>

            <div className="space-y-2">
              <Label>Outcomes Tracked</Label>
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600 mb-2">Select outcomes that will be tracked for this EBP:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Treatment Retention",
                    "Symptom Reduction",
                    "Functional Improvement",
                    "Quality of Life",
                    "Patient Satisfaction",
                    "Cost-Effectiveness",
                    "Adherence Rate",
                    "Relapse Prevention",
                  ].map((outcome) => (
                    <div key={outcome} className="flex items-center gap-2">
                      <Checkbox
                        id={`outcome-${outcome}`}
                        checked={ebpFormData.outcomes_tracked.includes(outcome)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEbpFormData({
                              ...ebpFormData,
                              outcomes_tracked: [...ebpFormData.outcomes_tracked, outcome],
                            })
                          } else {
                            setEbpFormData({
                              ...ebpFormData,
                              outcomes_tracked: ebpFormData.outcomes_tracked.filter((o) => o !== outcome),
                            })
                          }
                        }}
                      />
                      <label htmlFor={`outcome-${outcome}`} className="text-sm cursor-pointer">
                        {outcome}
                      </label>
                    </div>
                  ))}
                </div>
                {ebpFormData.outcomes_tracked.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">Selected outcomes:</p>
                    <div className="flex flex-wrap gap-1">
                      {ebpFormData.outcomes_tracked.map((outcome) => (
                        <Badge key={outcome} variant="secondary" className="text-xs">
                          {outcome}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowEbpDialog(false)
                setEditingEbp(null)
              }}
              disabled={submittingEbp}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEbp} disabled={submittingEbp}>
              {submittingEbp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingEbp ? "Updating..." : "Creating..."}
                </>
              ) : editingEbp ? (
                "Update EBP"
              ) : (
                "Create EBP"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fidelity Assessments Dialog */}
      <Dialog open={showFidelityDialog} onOpenChange={setShowFidelityDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fidelity Assessments - {selectedEbp?.name}</DialogTitle>
            <DialogDescription>View fidelity assessment records for this evidence-based practice</DialogDescription>
          </DialogHeader>
          {loadingEbpDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : fidelityAssessments.length > 0 ? (
            <div className="space-y-4">
              {fidelityAssessments.map((assessment: any, idx: number) => (
                <Card key={assessment.id || idx}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Assessment Date</Label>
                        <p className="font-medium">{assessment.assessment_date || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Fidelity Score</Label>
                        <p className="font-medium text-lg">{assessment.fidelity_score}%</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Assessment Type</Label>
                        <p className="font-medium">{assessment.assessment_type || "N/A"}</p>
                      </div>
                      {assessment.notes && (
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500">Notes</Label>
                          <p className="text-sm">{assessment.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No fidelity assessments found for this EBP</p>
              {selectedEbp && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setFidelityFormData({
                      assessment_date: new Date().toISOString().split('T')[0],
                      assessment_type: "standard",
                      fidelity_score: "",
                      notes: "",
                    })
                    setShowCreateFidelityDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Assessment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Training Records Dialog */}
      <Dialog open={showTrainingDialog} onOpenChange={setShowTrainingDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Training Records - {selectedEbp?.name}</DialogTitle>
                <DialogDescription>View staff training records for this evidence-based practice</DialogDescription>
              </div>
              {selectedEbp && (
                <Button
                  size="sm"
                  onClick={() => {
                    setTrainingFormData({
                      staff_id: "",
                      status: "pending",
                      training_date: new Date().toISOString().split('T')[0],
                      certification_date: "",
                      certification_expires_date: "",
                      certificate_url: "",
                    })
                    fetchStaff()
                    setShowCreateTrainingDialog(true)
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign Staff
                </Button>
              )}
            </div>
          </DialogHeader>
          {loadingEbpDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : trainingRecords.length > 0 ? (
            <div className="space-y-4">
              {trainingRecords.map((record: any, idx: number) => (
                <Card key={record.id || idx}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Staff Member</Label>
                        <p className="font-medium">{record.staff_name || record.staff_id || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Training Date</Label>
                        <p className="font-medium">{record.training_date || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Status</Label>
                        <Badge variant="outline">{record.status || "N/A"}</Badge>
                      </div>
                      {record.certification_date && (
                        <div>
                          <Label className="text-xs text-gray-500">Certification Date</Label>
                          <p className="font-medium">{record.certification_date}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No training records found for this EBP</p>
              {selectedEbp && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setTrainingFormData({
                      staff_id: "",
                      status: "pending",
                      training_date: new Date().toISOString().split('T')[0],
                      certification_date: "",
                      certification_expires_date: "",
                      certificate_url: "",
                    })
                    fetchStaff()
                    setShowCreateTrainingDialog(true)
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign First Staff Member
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Outcomes Dialog */}
      <Dialog open={showOutcomesDialog} onOpenChange={setShowOutcomesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Outcomes Report - {selectedEbp?.name}</DialogTitle>
                <DialogDescription>View patient outcomes tracked for this evidence-based practice</DialogDescription>
              </div>
              {selectedEbp && (
                <Button
                  size="sm"
                  onClick={() => {
                    setOutcomeFormData({
                      patient_id: "",
                      outcome_type: "",
                      outcome_value: "",
                      outcome_unit: "",
                      measurement_date: new Date().toISOString().split('T')[0],
                      notes: "",
                    })
                    setEbpPatientSearchTerm("")
                    fetchEbpPatients("")
                    setShowCreateOutcomeDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Outcome
                </Button>
              )}
            </div>
          </DialogHeader>
          {loadingEbpDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : outcomes.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Outcome Type</th>
                      <th className="text-left p-3 font-medium">Value</th>
                      <th className="text-left p-3 font-medium">Unit</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outcomes.map((outcome: any, idx: number) => (
                      <tr key={outcome.id || idx} className="border-b hover:bg-gray-50">
                        <td className="p-3">{outcome.outcome_type || "N/A"}</td>
                        <td className="p-3 font-medium">{outcome.outcome_value ?? "N/A"}</td>
                        <td className="p-3 text-gray-500">{outcome.outcome_unit || "N/A"}</td>
                        <td className="p-3 text-gray-500">{outcome.measurement_date || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No outcomes data found for this EBP</p>
              {selectedEbp && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setOutcomeFormData({
                      patient_id: "",
                      outcome_type: "",
                      outcome_value: "",
                      outcome_unit: "",
                      measurement_date: new Date().toISOString().split('T')[0],
                      notes: "",
                    })
                    setEbpPatientSearchTerm("")
                    fetchEbpPatients("")
                    setShowCreateOutcomeDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Outcome
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Fidelity Assessment Dialog */}
      <Dialog open={showCreateFidelityDialog} onOpenChange={setShowCreateFidelityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Fidelity Assessment - {selectedEbp?.name}</DialogTitle>
            <DialogDescription>Record a new fidelity assessment for this evidence-based practice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assessment Date *</Label>
                <Input
                  type="date"
                  value={fidelityFormData.assessment_date}
                  onChange={(e) => setFidelityFormData({ ...fidelityFormData, assessment_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assessment Type *</Label>
                <Select
                  value={fidelityFormData.assessment_type}
                  onValueChange={(value) =>
                    setFidelityFormData({ ...fidelityFormData, assessment_type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="spot_check">Spot Check</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    <SelectItem value="self_assessment">Self Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fidelity Score * (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="85.5"
                value={fidelityFormData.fidelity_score}
                onChange={(e) => setFidelityFormData({ ...fidelityFormData, fidelity_score: e.target.value })}
              />
              <p className="text-xs text-gray-500">Enter a score between 0 and 100</p>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={4}
                placeholder="Additional notes about this assessment..."
                value={fidelityFormData.notes}
                onChange={(e) => setFidelityFormData({ ...fidelityFormData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCreateFidelityDialog(false)}
              disabled={submittingFidelity}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFidelity} disabled={submittingFidelity}>
              {submittingFidelity ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Assessment"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Training Record Dialog */}
      <Dialog 
        open={showCreateTrainingDialog} 
        onOpenChange={(open) => {
          setShowCreateTrainingDialog(open)
          if (!open) {
            // Reset form when dialog closes
            setTrainingFormData({
              staff_id: "",
              status: "pending",
              training_date: new Date().toISOString().split('T')[0],
              certification_date: "",
              certification_expires_date: "",
              certificate_url: "",
            })
            setCertificateFile(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign/Train Staff - {selectedEbp?.name}</DialogTitle>
            <DialogDescription>Assign a staff member to this EBP and record their training status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Staff Member *</Label>
              <Select
                value={trainingFormData.staff_id}
                onValueChange={(value) => setTrainingFormData({ ...trainingFormData, staff_id: value })}
                disabled={loadingStaff}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingStaff ? "Loading staff..." : "Select staff member"} />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.length > 0 ? (
                    staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.first_name} {staff.last_name} {staff.email ? `(${staff.email})` : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-staff" disabled>
                      {loadingStaff ? "Loading..." : "No staff members found"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Training Status *</Label>
              <Select
                value={trainingFormData.status}
                onValueChange={(value) =>
                  setTrainingFormData({ ...trainingFormData, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="trained">Trained</SelectItem>
                  <SelectItem value="certified">Certified</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Training Date</Label>
                <Input
                  type="date"
                  value={trainingFormData.training_date}
                  onChange={(e) => setTrainingFormData({ ...trainingFormData, training_date: e.target.value })}
                />
              </div>
              {trainingFormData.status === "certified" && (
                <div className="space-y-2">
                  <Label>Certification Date</Label>
                  <Input
                    type="date"
                    value={trainingFormData.certification_date}
                    onChange={(e) =>
                      setTrainingFormData({ ...trainingFormData, certification_date: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
            {trainingFormData.status === "certified" && (
              <div className="space-y-2">
                <Label>Certification Expires Date</Label>
                <Input
                  type="date"
                  value={trainingFormData.certification_expires_date}
                  onChange={(e) =>
                    setTrainingFormData({ ...trainingFormData, certification_expires_date: e.target.value })
                  }
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Certificate (Optional)</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setCertificateFile(file)
                        // Auto-upload file
                        handleUploadCertificateFile(file)
                      }
                    }}
                    disabled={uploadingCertificate}
                    className="flex-1"
                  />
                </div>
                {uploadingCertificate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading certificate...
                  </div>
                )}
                {trainingFormData.certificate_url && !uploadingCertificate && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Certificate uploaded successfully
                  </div>
                )}
                {trainingFormData.certificate_url && (
                  <div className="text-xs text-gray-500">
                    <a
                      href={trainingFormData.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View uploaded certificate
                    </a>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Or enter URL manually:
                </div>
              <Input
                type="url"
                placeholder="https://..."
                value={trainingFormData.certificate_url}
                onChange={(e) => setTrainingFormData({ ...trainingFormData, certificate_url: e.target.value })}
              />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCreateTrainingDialog(false)}
              disabled={submittingTraining}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTraining} disabled={submittingTraining}>
              {submittingTraining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Assign Staff"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Patient Delivery Dialog */}
      <Dialog open={showCreateDeliveryDialog} onOpenChange={setShowCreateDeliveryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Patient Delivery - {selectedEbp?.name}</DialogTitle>
            <DialogDescription>Record when this EBP was delivered to a patient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search patients by name or phone..."
                  value={ebpPatientSearchTerm}
                  onChange={(e) => setEbpPatientSearchTerm(e.target.value)}
                />
                <Select
                  value={deliveryFormData.patient_id}
                  onValueChange={(value) => setDeliveryFormData({ ...deliveryFormData, patient_id: value })}
                  disabled={loadingEbpPatients}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingEbpPatients ? "Loading patients..." : "Select a patient"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ebpPatients.length > 0 ? (
                      ebpPatients.map((patient) => {
                        const dob = patient.date_of_birth
                          ? new Date(patient.date_of_birth).toLocaleDateString()
                          : "N/A"
                        return (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.first_name} {patient.last_name} (DOB: {dob})
                          </SelectItem>
                        )
                      })
                    ) : (
                      <SelectItem value="no-results" disabled>
                        {ebpPatientSearchTerm ? "No patients found" : "Start typing to search"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delivery Date *</Label>
                <Input
                  type="date"
                  value={deliveryFormData.delivery_date}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivery_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Type *</Label>
                <Select
                  value={deliveryFormData.delivery_type}
                  onValueChange={(value) =>
                    setDeliveryFormData({ ...deliveryFormData, delivery_type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">Session</SelectItem>
                    <SelectItem value="intervention">Intervention</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 min-w-0">
                <Label>Delivered By</Label>
                <Select
                  value={deliveryFormData.delivered_by || undefined}
                  onValueChange={(value) => setDeliveryFormData({ ...deliveryFormData, delivered_by: value || "" })}
                  disabled={loadingStaff}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingStaff ? "Loading staff..." : "Select staff member (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.length > 0 ? (
                      staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name} {staff.role ? `(${staff.role})` : ""}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-staff" disabled>
                        No staff members available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Link to Encounter (Optional)</Label>
                <Select
                  value={deliveryFormData.encounter_id || undefined}
                  onValueChange={(value) => setDeliveryFormData({ ...deliveryFormData, encounter_id: value || "" })}
                  disabled={!deliveryFormData.patient_id || loadingEbpEncounters}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue 
                      placeholder={
                        !deliveryFormData.patient_id 
                          ? "Select patient first" 
                          : loadingEbpEncounters 
                          ? "Loading encounters..." 
                          : "Select encounter (optional)"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {ebpEncounters.length > 0 ? (
                      ebpEncounters.map((encounter) => {
                        const encDate = encounter.encounter_date 
                          ? new Date(encounter.encounter_date).toLocaleDateString()
                          : "Unknown date"
                        return (
                          <SelectItem key={encounter.id} value={encounter.id}>
                            {encounter.visit_reason || encounter.encounter_type || "Encounter"} - {encDate}
                            {encounter.provider_name ? ` (${encounter.provider_name})` : ""}
                          </SelectItem>
                        )
                      })
                    ) : (
                      <SelectItem value="no-encounters" disabled>
                        {deliveryFormData.patient_id 
                          ? "No recent encounters found" 
                          : "Select a patient first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {deliveryFormData.patient_id && ebpEncounters.length === 0 && !loadingEbpEncounters && (
                  <p className="text-xs text-gray-500 mt-1">
                    No completed encounters found for this patient in the last 90 days
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                placeholder="Additional notes about this delivery..."
                value={deliveryFormData.notes}
                onChange={(e) => setDeliveryFormData({ ...deliveryFormData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCreateDeliveryDialog(false)}
              disabled={submittingDelivery}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDelivery} disabled={submittingDelivery}>
              {submittingDelivery ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Delivery"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Outcome Dialog */}
      <Dialog open={showCreateOutcomeDialog} onOpenChange={setShowCreateOutcomeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Outcome - {selectedEbp?.name}</DialogTitle>
            <DialogDescription>Record a patient outcome measurement for this evidence-based practice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search patients by name or phone..."
                  value={ebpPatientSearchTerm}
                  onChange={(e) => setEbpPatientSearchTerm(e.target.value)}
                />
                <Select
                  value={outcomeFormData.patient_id}
                  onValueChange={(value) => setOutcomeFormData({ ...outcomeFormData, patient_id: value })}
                  disabled={loadingEbpPatients}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingEbpPatients ? "Loading patients..." : "Select a patient"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ebpPatients.length > 0 ? (
                      ebpPatients.map((patient) => {
                        const dob = patient.date_of_birth
                          ? new Date(patient.date_of_birth).toLocaleDateString()
                          : "N/A"
                        return (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.first_name} {patient.last_name} (DOB: {dob})
                          </SelectItem>
                        )
                      })
                    ) : (
                      <SelectItem value="no-results" disabled>
                        {ebpPatientSearchTerm ? "No patients found" : "Start typing to search"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Outcome Type *</Label>
              <Select
                value={outcomeFormData.outcome_type}
                onValueChange={(value) => setOutcomeFormData({ ...outcomeFormData, outcome_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome type" />
                </SelectTrigger>
                <SelectContent>
                  {selectedEbp?.outcomes_tracked && Array.isArray(selectedEbp.outcomes_tracked) && selectedEbp.outcomes_tracked.length > 0 ? (
                    selectedEbp.outcomes_tracked.map((outcome) => (
                      <SelectItem key={outcome} value={outcome}>
                        {outcome}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Treatment Retention">Treatment Retention</SelectItem>
                      <SelectItem value="Symptom Reduction">Symptom Reduction</SelectItem>
                      <SelectItem value="Functional Improvement">Functional Improvement</SelectItem>
                      <SelectItem value="Quality of Life">Quality of Life</SelectItem>
                      <SelectItem value="Patient Satisfaction">Patient Satisfaction</SelectItem>
                      <SelectItem value="Cost-Effectiveness">Cost-Effectiveness</SelectItem>
                      <SelectItem value="Adherence Rate">Adherence Rate</SelectItem>
                      <SelectItem value="Relapse Prevention">Relapse Prevention</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Outcome Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="85.5"
                  value={outcomeFormData.outcome_value}
                  onChange={(e) => setOutcomeFormData({ ...outcomeFormData, outcome_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  placeholder="percentage, score, days, etc."
                  value={outcomeFormData.outcome_unit}
                  onChange={(e) => setOutcomeFormData({ ...outcomeFormData, outcome_unit: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Measurement Date *</Label>
              <Input
                type="date"
                value={outcomeFormData.measurement_date}
                onChange={(e) => setOutcomeFormData({ ...outcomeFormData, measurement_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                placeholder="Additional notes about this outcome..."
                value={outcomeFormData.notes}
                onChange={(e) => setOutcomeFormData({ ...outcomeFormData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCreateOutcomeDialog(false)}
              disabled={submittingOutcome}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateOutcome} disabled={submittingOutcome}>
              {submittingOutcome ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Outcome"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Participant Status Update Dialog */}
      <Dialog open={showParticipantStatusDialog} onOpenChange={setShowParticipantStatusDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Participant Status</DialogTitle>
            <DialogDescription>
              Update the enrollment status for this participant
            </DialogDescription>
          </DialogHeader>

          {selectedParticipant && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enrollment Status *</Label>
                <Select
                  value={participantStatusFormData.enrollment_status}
                  onValueChange={(value: any) =>
                    setParticipantStatusFormData({
                      ...participantStatusFormData,
                      enrollment_status: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="lost_to_followup">Lost to Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {participantStatusFormData.enrollment_status === "withdrawn" && (
                <>
                  <div className="space-y-2">
                    <Label>Withdrawal Date *</Label>
                    <Input
                      type="date"
                      value={participantStatusFormData.withdrawal_date}
                      onChange={(e) =>
                        setParticipantStatusFormData({
                          ...participantStatusFormData,
                          withdrawal_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Withdrawal Reason *</Label>
                    <Textarea
                      rows={4}
                      placeholder="Enter the reason for withdrawal..."
                      value={participantStatusFormData.withdrawal_reason}
                      onChange={(e) =>
                        setParticipantStatusFormData({
                          ...participantStatusFormData,
                          withdrawal_reason: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {participantStatusError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{participantStatusError}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowParticipantStatusDialog(false)
                setSelectedParticipant(null)
                setParticipantStatusError(null)
              }}
              disabled={updatingParticipant}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateParticipantStatus} disabled={updatingParticipant}>
              {updatingParticipant ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trends Dialog */}
      <Dialog open={showTrendsDialog} onOpenChange={setShowTrendsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trend Analysis - {selectedEbp?.name}</DialogTitle>
            <DialogDescription>View trends for fidelity, adoption, deliveries, and outcomes over time</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Label>Time Period:</Label>
              <Select value={trendPeriod} onValueChange={(value: any) => {
                setTrendPeriod(value)
                if (selectedEbp) {
                  handleViewTrends(selectedEbp)
                }
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 Month</SelectItem>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingTrends ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : trendData ? (
              <div className="space-y-6">
                {/* Fidelity Trend */}
                {trendData.fidelity && trendData.fidelity.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Fidelity Score Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData.fidelity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} name="Fidelity Score" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Adoption Trend */}
                {trendData.adoption && trendData.adoption.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Adoption Trend (Staff Training)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={trendData.adoption}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="trained" fill="#82ca9d" name="Trained Staff" />
                          <Bar dataKey="total" fill="#8884d8" name="Total Assigned" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Delivery Trend */}
                {trendData.deliveries && trendData.deliveries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Patient Delivery Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={trendData.deliveries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#ffc658" name="Total Deliveries" />
                          <Bar dataKey="uniquePatients" fill="#ff7300" name="Unique Patients" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Outcome Trends */}
                {trendData.outcomes && Object.keys(trendData.outcomes).length > 0 && (
                  <div className="space-y-4">
                    {Object.keys(trendData.outcomes).map((outcomeType) => (
                      trendData.outcomes[outcomeType].length > 0 && (
                        <Card key={outcomeType}>
                          <CardHeader>
                            <CardTitle>Outcome Trend: {outcomeType}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={trendData.outcomes[outcomeType]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} name="Average Value" />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )
                    ))}
                  </div>
                )}

                {(!trendData.fidelity || trendData.fidelity.length === 0) &&
                 (!trendData.adoption || trendData.adoption.length === 0) &&
                 (!trendData.deliveries || trendData.deliveries.length === 0) &&
                 (!trendData.outcomes || Object.keys(trendData.outcomes).length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    No trend data available for the selected period
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Failed to load trend data
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowTrendsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comparison Dialog */}
      <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>EBP Comparison</DialogTitle>
            <DialogDescription>Compare selected evidence-based practices side by side</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedEbpsForComparison.length >= 2 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Metric</th>
                      {selectedEbpsForComparison.map((ebpId) => {
                        const ebp = ebps.find((e) => e.id === ebpId)
                        return (
                          <th key={ebpId} className="text-left p-2 font-semibold">
                            {ebp?.name || "Unknown"}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Category</td>
                      {selectedEbpsForComparison.map((ebpId: string) => {
                        const ebp = ebps.find((e) => e.id === ebpId)
                        return <td key={ebpId} className="p-2">{ebp?.category || "N/A"}</td>
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Adoption Rate (%)</td>
                      {selectedEbpsForComparison.map((ebpId: string) => {
                        const ebp = ebps.find((e) => e.id === ebpId)
                        return <td key={ebpId} className="p-2">{ebp?.adoption_rate?.toFixed(1) || "0.0"}%</td>
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Fidelity Score (%)</td>
                      {selectedEbpsForComparison.map((ebpId: string) => {
                        const ebp = ebps.find((e) => e.id === ebpId)
                        return <td key={ebpId} className="p-2">{ebp?.fidelity_score?.toFixed(1) || "0.0"}%</td>
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Sustainability Score (%)</td>
                      {selectedEbpsForComparison.map((ebpId: string) => {
                        const ebp = ebps.find((e) => e.id === ebpId)
                        return <td key={ebpId} className="p-2">{ebp?.sustainability_score?.toFixed(1) || "0.0"}%</td>
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Total Staff</td>
                      {selectedEbpsForComparison.map((ebpId: string) => {
                        const ebp = ebps.find((e) => e.id === ebpId)
                        return <td key={ebpId} className="p-2">{ebp?.total_staff || 0}</td>
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Trained Staff</td>
                      {selectedEbpsForComparison.map((ebpId: string) => {
                        const ebp = ebps.find((e) => e.id === ebpId)
                        return <td key={ebpId} className="p-2">{ebp?.trained_staff || 0}</td>
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Last Fidelity Review</td>
                      {selectedEbpsForComparison.map((ebpId: string) => {
                        const ebp = ebps.find((e) => e.id === ebpId)
                        return (
                          <td key={ebpId} className="p-2">
                            {ebp?.last_fidelity_review
                              ? new Date(ebp.last_fidelity_review).toLocaleDateString()
                              : "Never"}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Status</td>
                      {selectedEbpsForComparison.map((ebpId: string) => {
                        const ebp = ebps.find((e) => e.id === ebpId)
                        return (
                          <td key={ebpId} className="p-2">
                            <Badge variant={ebp?.is_active !== false ? "default" : "secondary"}>
                              {ebp?.is_active !== false ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Please select at least 2 EBPs to compare
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setShowComparisonDialog(false)
              setSelectedEbpsForComparison([])
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Participant Detail Dialog */}
      <Dialog open={showParticipantDetailDialog} onOpenChange={setShowParticipantDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Participant Details</DialogTitle>
            <DialogDescription>
              Complete information for this study participant
            </DialogDescription>
          </DialogHeader>

          {loadingParticipantDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : participantDetailData ? (
            <div className="space-y-6">
              {/* Patient Information */}
              {participantDetailData.patient && (
                <div>
                  <h3 className="font-semibold mb-3">Patient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-500">Name</Label>
                      <p className="mt-1">
                        {participantDetailData.patient.first_name} {participantDetailData.patient.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-500">Date of Birth</Label>
                      <p className="mt-1">
                        {participantDetailData.patient.date_of_birth
                          ? new Date(participantDetailData.patient.date_of_birth).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    {participantDetailData.patient.phone && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-500">Phone</Label>
                        <p className="mt-1">{participantDetailData.patient.phone}</p>
                      </div>
                    )}
                    {participantDetailData.patient.email && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-500">Email</Label>
                        <p className="mt-1">{participantDetailData.patient.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enrollment Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Enrollment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Enrollment Status</Label>
                    <p className="mt-1">
                      <Badge variant="outline">{participantDetailData.enrollment_status}</Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Enrolled Date</Label>
                    <p className="mt-1">
                      {new Date(participantDetailData.enrolled_date).toLocaleDateString()}
                    </p>
                  </div>
                  {participantDetailData.withdrawal_date && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-500">Withdrawal Date</Label>
                      <p className="mt-1">
                        {new Date(participantDetailData.withdrawal_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {participantDetailData.withdrawal_reason && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-semibold text-gray-500">Withdrawal Reason</Label>
                      <p className="mt-1">{participantDetailData.withdrawal_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Consent Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Consent Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Consent Obtained</Label>
                    <p className="mt-1">
                      {participantDetailData.consent_obtained ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </p>
                  </div>
                  {participantDetailData.consent_date && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-500">Consent Date</Label>
                      <p className="mt-1">
                        {new Date(participantDetailData.consent_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {participantDetailData.consent_document_url && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-semibold text-gray-500">Consent Document</Label>
                      <p className="mt-1">
                        <a
                          href={participantDetailData.consent_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {participantDetailData.consent_document_url}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Created At</Label>
                    <p className="mt-1">
                      {participantDetailData.created_at
                        ? new Date(participantDetailData.created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Last Updated</Label>
                    <p className="mt-1">
                      {participantDetailData.updated_at
                        ? new Date(participantDetailData.updated_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedParticipantForDetail) {
                      handleOpenParticipantStatusDialog(selectedParticipantForDetail)
                      setShowParticipantDetailDialog(false)
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No participant data available</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Quality Metric Dialog */}
      <Dialog open={showAddMetricDialog} onOpenChange={(open) => {
        setShowAddMetricDialog(open)
        if (!open) resetMetricForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Quality Metric</DialogTitle>
            <DialogDescription>Create a new quality metric to track</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {metricFormError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {metricFormError}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Metric Name *</Label>
                <Input
                  placeholder="e.g., Treatment Retention (90-day)"
                  value={newMetricForm.name}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="e.g., RET90"
                  value={newMetricForm.code}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, code: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this metric measures..."
                value={newMetricForm.description}
                onChange={(e) => setNewMetricForm({ ...newMetricForm, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newMetricForm.category}
                  onValueChange={(v) => setNewMetricForm({ ...newMetricForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outcomes">Outcomes</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="ccbhc">CCBHC</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                    <SelectItem value="patient_experience">Patient Experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reporting Period</Label>
                <Select
                  value={newMetricForm.reporting_period}
                  onValueChange={(v) => setNewMetricForm({ ...newMetricForm, reporting_period: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Target Value *</Label>
                <Input
                  type="number"
                  placeholder="80"
                  value={newMetricForm.target_value}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, target_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Benchmark Value</Label>
                <Input
                  type="number"
                  placeholder="75"
                  value={newMetricForm.benchmark_value}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, benchmark_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  placeholder="%"
                  value={newMetricForm.unit}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, unit: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warning Threshold</Label>
                <Input
                  type="number"
                  placeholder="70"
                  value={newMetricForm.warning_threshold}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, warning_threshold: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Critical Threshold</Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={newMetricForm.critical_threshold}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, critical_threshold: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Source</Label>
                <Input
                  placeholder="e.g., EHR, Claims, Assessments"
                  value={newMetricForm.data_source}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, data_source: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Benchmark Source</Label>
                <Input
                  placeholder="e.g., SAMHSA, HEDIS"
                  value={newMetricForm.benchmark_source}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, benchmark_source: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Calculation Method</Label>
              <Textarea
                placeholder="Describe how this metric is calculated..."
                value={newMetricForm.calculation_method}
                onChange={(e) => setNewMetricForm({ ...newMetricForm, calculation_method: e.target.value })}
              />
            </div>
            
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="higher_is_better"
                  checked={newMetricForm.higher_is_better}
                  onCheckedChange={(checked) => setNewMetricForm({ ...newMetricForm, higher_is_better: !!checked })}
                />
                <Label htmlFor="higher_is_better">Higher is Better</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_ccbhc_required"
                  checked={newMetricForm.is_ccbhc_required}
                  onCheckedChange={(checked) => setNewMetricForm({ ...newMetricForm, is_ccbhc_required: !!checked })}
                />
                <Label htmlFor="is_ccbhc_required">CCBHC Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_mips_measure"
                  checked={newMetricForm.is_mips_measure}
                  onCheckedChange={(checked) => setNewMetricForm({ ...newMetricForm, is_mips_measure: !!checked })}
                />
                <Label htmlFor="is_mips_measure">MIPS Measure</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddMetricDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMetric} disabled={submittingMetric}>
              {submittingMetric && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Metric
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Quality Metric Dialog */}
      <Dialog open={showEditMetricDialog} onOpenChange={(open) => {
        setShowEditMetricDialog(open)
        if (!open) {
          resetMetricForm()
          setSelectedMetric(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quality Metric</DialogTitle>
            <DialogDescription>Update the quality metric configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {metricFormError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {metricFormError}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Metric Name *</Label>
                <Input
                  placeholder="e.g., Treatment Retention (90-day)"
                  value={newMetricForm.name}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={selectedMetric?.code || ""}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this metric measures..."
                value={newMetricForm.description}
                onChange={(e) => setNewMetricForm({ ...newMetricForm, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newMetricForm.category}
                  onValueChange={(v) => setNewMetricForm({ ...newMetricForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outcomes">Outcomes</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="ccbhc">CCBHC</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                    <SelectItem value="patient_experience">Patient Experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reporting Period</Label>
                <Select
                  value={newMetricForm.reporting_period}
                  onValueChange={(v) => setNewMetricForm({ ...newMetricForm, reporting_period: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Target Value *</Label>
                <Input
                  type="number"
                  placeholder="80"
                  value={newMetricForm.target_value}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, target_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Benchmark Value</Label>
                <Input
                  type="number"
                  placeholder="75"
                  value={newMetricForm.benchmark_value}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, benchmark_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  placeholder="%"
                  value={newMetricForm.unit}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, unit: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warning Threshold</Label>
                <Input
                  type="number"
                  placeholder="70"
                  value={newMetricForm.warning_threshold}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, warning_threshold: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Critical Threshold</Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={newMetricForm.critical_threshold}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, critical_threshold: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Source</Label>
                <Input
                  placeholder="e.g., EHR, Claims, Assessments"
                  value={newMetricForm.data_source}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, data_source: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Benchmark Source</Label>
                <Input
                  placeholder="e.g., SAMHSA, HEDIS"
                  value={newMetricForm.benchmark_source}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, benchmark_source: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Calculation Method</Label>
              <Textarea
                placeholder="Describe how this metric is calculated..."
                value={newMetricForm.calculation_method}
                onChange={(e) => setNewMetricForm({ ...newMetricForm, calculation_method: e.target.value })}
              />
            </div>
            
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_higher_is_better"
                  checked={newMetricForm.higher_is_better}
                  onCheckedChange={(checked) => setNewMetricForm({ ...newMetricForm, higher_is_better: !!checked })}
                />
                <Label htmlFor="edit_higher_is_better">Higher is Better</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_ccbhc_required"
                  checked={newMetricForm.is_ccbhc_required}
                  onCheckedChange={(checked) => setNewMetricForm({ ...newMetricForm, is_ccbhc_required: !!checked })}
                />
                <Label htmlFor="edit_is_ccbhc_required">CCBHC Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_mips_measure"
                  checked={newMetricForm.is_mips_measure}
                  onCheckedChange={(checked) => setNewMetricForm({ ...newMetricForm, is_mips_measure: !!checked })}
                />
                <Label htmlFor="edit_is_mips_measure">MIPS Measure</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditMetricDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMetric} disabled={submittingMetric}>
              {submittingMetric && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Metric Detail Dialog */}
      <Dialog open={showMetricDetailDialog} onOpenChange={(open) => {
        setShowMetricDetailDialog(open)
        if (!open) {
          setSelectedMetric(null)
          setMetricDetailData(null)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMetric?.name || "Metric Details"}</DialogTitle>
            <DialogDescription>
              {selectedMetric?.code && <span className="mr-2">[{selectedMetric.code}]</span>}
              {selectedMetric?.description || "View historical data and performance trends"}
            </DialogDescription>
          </DialogHeader>
          
          {loadingMetricDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading metric details...</span>
            </div>
          ) : metricDetailData ? (
            <div className="space-y-6 py-4">
              {/* Current Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Current Value</p>
                  <p className="text-2xl font-bold">
                    {metricDetailData.metric.current_value !== null 
                      ? `${metricDetailData.metric.current_value}${metricDetailData.metric.unit || '%'}`
                      : "—"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Target</p>
                  <p className="text-2xl font-bold">
                    {metricDetailData.metric.target_value}{metricDetailData.metric.unit || '%'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Benchmark</p>
                  <p className="text-2xl font-bold">
                    {metricDetailData.metric.benchmark_value !== null 
                      ? `${metricDetailData.metric.benchmark_value}${metricDetailData.metric.unit || '%'}`
                      : "—"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Trend</p>
                  <div className="flex items-center">
                    {getTrendIcon(metricDetailData.metric.trend)}
                    <span className="ml-2 text-lg font-medium">
                      {metricDetailData.metric.trend_percentage !== undefined 
                        ? `${metricDetailData.metric.trend_percentage > 0 ? '+' : ''}${metricDetailData.metric.trend_percentage}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Historical Trend Chart */}
              {metricDetailData.historical_data && metricDetailData.historical_data.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Historical Trend (Last 12 Months)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metricDetailData.historical_data.map((s: any) => ({
                      date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                      value: s.current_value,
                      target: metricDetailData.metric.target_value,
                      benchmark: metricDetailData.metric.benchmark_value,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        strokeWidth={2} 
                        name="Actual Value"
                        dot={{ fill: '#8884d8' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#82ca9d" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        name="Target"
                        dot={false}
                      />
                      {metricDetailData.metric.benchmark_value && (
                        <Line 
                          type="monotone" 
                          dataKey="benchmark" 
                          stroke="#ffc658" 
                          strokeWidth={2} 
                          strokeDasharray="3 3"
                          name="Benchmark"
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Metric Configuration */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Metric Configuration</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium capitalize">{metricDetailData.metric.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reporting Period</p>
                    <p className="font-medium capitalize">{metricDetailData.metric.reporting_period}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Data Source</p>
                    <p className="font-medium">{metricDetailData.metric.data_source || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Higher is Better</p>
                    <p className="font-medium">{metricDetailData.metric.higher_is_better !== false ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Warning Threshold</p>
                    <p className="font-medium">
                      {metricDetailData.metric.warning_threshold !== null 
                        ? `${metricDetailData.metric.warning_threshold}${metricDetailData.metric.unit || '%'}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Critical Threshold</p>
                    <p className="font-medium">
                      {metricDetailData.metric.critical_threshold !== null 
                        ? `${metricDetailData.metric.critical_threshold}${metricDetailData.metric.unit || '%'}`
                        : "N/A"}
                    </p>
                  </div>
                </div>
                {metricDetailData.metric.calculation_method && (
                  <div className="mt-4">
                    <p className="text-gray-500 text-sm">Calculation Method</p>
                    <p className="text-sm mt-1">{metricDetailData.metric.calculation_method}</p>
                  </div>
                )}
              </div>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {metricDetailData.metric.is_ccbhc_required && (
                  <Badge className="bg-blue-100 text-blue-800">CCBHC Required</Badge>
                )}
                {metricDetailData.metric.is_mips_measure && (
                  <Badge className="bg-purple-100 text-purple-800">MIPS Measure</Badge>
                )}
                {metricDetailData.metric.is_active ? (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                )}
              </div>
              
              {/* Linked Entities */}
              {metricDetailData.linked_entities && metricDetailData.linked_entities.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Linked to this Metric</h3>
                  <div className="space-y-3">
                    {metricDetailData.linked_entities
                      .filter((link: any) => link.entity_details)
                      .map((link: any) => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {link.linked_entity_type === "ebp" ? (
                              <Lightbulb className="h-5 w-5 text-amber-500" />
                            ) : link.linked_entity_type === "research_study" ? (
                              <Microscope className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Building2 className="h-5 w-5 text-purple-500" />
                            )}
                            <div>
                              <p className="font-medium">
                                {link.entity_details?.name || link.entity_details?.title || "Unknown"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Badge variant="outline" className="text-xs">
                                  {link.linked_entity_type === "ebp" ? "Evidence-Based Practice" : 
                                   link.linked_entity_type === "research_study" ? "Research Study" : 
                                   link.linked_entity_type}
                                </Badge>
                                <span>•</span>
                                <span className="capitalize">{link.relationship_type}</span>
                                {link.impact_weight && link.impact_weight !== 1 && (
                                  <>
                                    <span>•</span>
                                    <span>Weight: {link.impact_weight}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {link.linked_entity_type === "ebp" && link.entity_details?.adoption_rate !== undefined && (
                            <div className="text-right">
                              <p className="text-sm font-medium">{link.entity_details.adoption_rate}%</p>
                              <p className="text-xs text-gray-500">Adoption</p>
                            </div>
                          )}
                          {link.linked_entity_type === "research_study" && link.entity_details?.status && (
                            <Badge variant="outline" className="capitalize">
                              {link.entity_details.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                  {metricDetailData.links_summary && (
                    <div className="mt-4 pt-4 border-t flex gap-4 text-sm text-gray-500">
                      <span>Total Links: {metricDetailData.links_summary.total_links}</span>
                      {metricDetailData.links_summary.by_type.ebp > 0 && (
                        <span>EBPs: {metricDetailData.links_summary.by_type.ebp}</span>
                      )}
                      {metricDetailData.links_summary.by_type.research_study > 0 && (
                        <span>Studies: {metricDetailData.links_summary.by_type.research_study}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No metric data available
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            {selectedMetric && (
              <Button variant="outline" onClick={() => {
                setShowMetricDetailDialog(false)
                handleEditMetric(selectedMetric)
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Metric
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowMetricDetailDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}
