"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  Baby,
  Syringe,
  Heart,
  Activity,
  AlertTriangle,
  Bot,
  Send,
  Loader2,
  GraduationCap,
  BookOpen,
  Video,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  FileText,
} from "lucide-react"

export default function CountyHealthPage() {
  const { toast } = useToast()

  // State for data
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    wicParticipants: 0,
    immunizations: 0,
    stdVisits: 0,
    diseaseReports: 0,
    tbCases: 0,
    mchCases: 0,
    envInspections: 0,
  })

  // WIC State
  const [wicEnrollments, setWicEnrollments] = useState<any[]>([])
  const [showWicDialog, setShowWicDialog] = useState(false)
  const [wicForm, setWicForm] = useState({
    patient_id: "",
    category: "pregnant",
    due_date: "",
    income_verified: false,
    medicaid_recipient: false,
  })

  // Immunizations State
  const [vaccinations, setVaccinations] = useState<any[]>([])
  const [showVaccinationDialog, setShowVaccinationDialog] = useState(false)
  const [vaccinationForm, setVaccinationForm] = useState({
    patient_id: "",
    vaccine_name: "",
    vaccine_code: "",
    lot_number: "",
    dose_number: 1,
    administration_site: "left_arm",
  })

  // STD/Sexual Health State
  const [stiVisits, setStiVisits] = useState<any[]>([])
  const [showStiDialog, setShowStiDialog] = useState(false)
  const [stiForm, setStiForm] = useState({
    patient_id: "",
    chief_complaint: "",
    tests_ordered: [] as string[],
  })

  // MCH State
  const [mchVisits, setMchVisits] = useState<any[]>([])
  const [showMchDialog, setShowMchDialog] = useState(false)

  // Disease Tracking State
  const [diseaseReports, setDiseaseReports] = useState<any[]>([])
  const [showDiseaseDialog, setShowDiseaseDialog] = useState(false)
  const [diseaseForm, setDiseaseForm] = useState({
    patient_id: "",
    disease_name: "",
    diagnosis_date: "",
    case_status: "suspected",
  })

  // TB State
  const [tbCases, setTbCases] = useState<any[]>([])
  const [showTbDialog, setShowTbDialog] = useState(false)

  // Environmental State
  const [envInspections, setEnvInspections] = useState<any[]>([])
  const [showEnvDialog, setShowEnvDialog] = useState(false)
  const [envForm, setEnvForm] = useState({
    facility_name: "",
    facility_type: "restaurant",
    inspection_type: "routine",
  })

  // AI Coach State
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Education State
  const [educationResources, setEducationResources] = useState<any[]>([])
  const [staffModules, setStaffModules] = useState<any[]>([])

  // Patients for dropdowns
  const [patients, setPatients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchWicEnrollments(),
        fetchVaccinations(),
        fetchStiVisits(),
        fetchMchVisits(),
        fetchDiseaseReports(),
        fetchTbCases(),
        fetchEnvInspections(),
        fetchPatients(),
        fetchEducationResources(),
        fetchStaffModules(),
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/county-health?action=stats")
      const result = await response.json()
      if (result.stats) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/county-health?action=list&type=patients")
      const result = await response.json()
      setPatients(result.data || [])
    } catch (error) {
      console.error("Error fetching patients:", error)
    }
  }

  const fetchWicEnrollments = async () => {
    try {
      const response = await fetch("/api/county-health?action=list&type=wic")
      const result = await response.json()
      setWicEnrollments(result.data || [])
    } catch (error) {
      console.error("Error fetching WIC enrollments:", error)
    }
  }

  const fetchVaccinations = async () => {
    try {
      const response = await fetch("/api/county-health?action=list&type=vaccinations")
      const result = await response.json()
      setVaccinations(result.data || [])
    } catch (error) {
      console.error("Error fetching vaccinations:", error)
    }
  }

  const fetchStiVisits = async () => {
    try {
      const response = await fetch("/api/county-health?action=list&type=sti")
      const result = await response.json()
      setStiVisits(result.data || [])
    } catch (error) {
      console.error("Error fetching STI visits:", error)
    }
  }

  const fetchMchVisits = async () => {
    try {
      const response = await fetch("/api/county-health?action=list&type=mch")
      const result = await response.json()
      setMchVisits(result.data || [])
    } catch (error) {
      console.error("Error fetching MCH visits:", error)
    }
  }

  const fetchDiseaseReports = async () => {
    try {
      const response = await fetch("/api/county-health?action=list&type=disease")
      const result = await response.json()
      setDiseaseReports(result.data || [])
    } catch (error) {
      console.error("Error fetching disease reports:", error)
    }
  }

  const fetchTbCases = async () => {
    try {
      const response = await fetch("/api/county-health?action=list&type=tb")
      const result = await response.json()
      setTbCases(result.data || [])
    } catch (error) {
      console.error("Error fetching TB cases:", error)
    }
  }

  const fetchEnvInspections = async () => {
    try {
      const response = await fetch("/api/county-health?action=list&type=environmental")
      const result = await response.json()
      setEnvInspections(result.data || [])
    } catch (error) {
      console.error("Error fetching environmental inspections:", error)
    }
  }

  const fetchEducationResources = async () => {
    try {
      const response = await fetch("/api/county-health/education")
      const result = await response.json()
      setEducationResources(result.resources || [])
    } catch (error) {
      console.error("Error fetching education resources:", error)
    }
  }

  const fetchStaffModules = async () => {
    try {
      const response = await fetch("/api/county-health/staff-education")
      const result = await response.json()
      setStaffModules(result.modules || [])
    } catch (error) {
      console.error("Error fetching staff modules:", error)
    }
  }

  // WIC Functions
  const handleCreateWicEnrollment = async () => {
    if (!wicForm.patient_id) {
      toast({ title: "Error", description: "Please select a patient", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/county-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wic_enrollment",
          data: {
            patient_id: wicForm.patient_id,
            category: wicForm.category,
            due_date: wicForm.due_date || null,
            income_verified: wicForm.income_verified,
            medicaid_recipient: wicForm.medicaid_recipient,
            enrollment_date: new Date().toISOString().split("T")[0],
            status: "active",
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({ title: "Error", description: result.error || "Failed to enroll WIC participant", variant: "destructive" })
      } else {
        toast({ title: "Success", description: "WIC participant enrolled successfully" })
        setShowWicDialog(false)
        setWicForm({
          patient_id: "",
          category: "pregnant",
          due_date: "",
          income_verified: false,
          medicaid_recipient: false,
        })
        fetchWicEnrollments()
        fetchStats()
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to enroll WIC participant", variant: "destructive" })
    }
  }

  // Vaccination Functions
  const handleRecordVaccination = async () => {
    if (!vaccinationForm.patient_id || !vaccinationForm.vaccine_name) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/county-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "vaccination",
          data: {
            patient_id: vaccinationForm.patient_id,
            vaccine_name: vaccinationForm.vaccine_name,
            vaccine_code: vaccinationForm.vaccine_code,
            lot_number: vaccinationForm.lot_number,
            dose_number: vaccinationForm.dose_number,
            administration_site: vaccinationForm.administration_site,
            administration_date: new Date().toISOString().split("T")[0],
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({ title: "Error", description: result.error || "Failed to record vaccination", variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Vaccination recorded successfully" })
        setShowVaccinationDialog(false)
        setVaccinationForm({
          patient_id: "",
          vaccine_name: "",
          vaccine_code: "",
          lot_number: "",
          dose_number: 1,
          administration_site: "left_arm",
        })
        fetchVaccinations()
        fetchStats()
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to record vaccination", variant: "destructive" })
    }
  }

  // STI Visit Functions
  const handleCreateStiVisit = async () => {
    if (!stiForm.patient_id) {
      toast({ title: "Error", description: "Please select a patient", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/county-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sti_visit",
          data: {
            patient_id: stiForm.patient_id,
            visit_date: new Date().toISOString().split("T")[0],
            chief_complaint: stiForm.chief_complaint,
            tests_ordered: stiForm.tests_ordered,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({ title: "Error", description: result.error || "Failed to record STI visit", variant: "destructive" })
      } else {
        toast({ title: "Success", description: "STI clinic visit recorded" })
        setShowStiDialog(false)
        setStiForm({ patient_id: "", chief_complaint: "", tests_ordered: [] })
        fetchStiVisits()
        fetchStats()
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to record STI visit", variant: "destructive" })
    }
  }

  // Disease Report Functions
  const handleCreateDiseaseReport = async () => {
    if (!diseaseForm.patient_id || !diseaseForm.disease_name) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/county-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "disease_report",
          data: {
            patient_id: diseaseForm.patient_id,
            disease_name: diseaseForm.disease_name,
            diagnosis_date: diseaseForm.diagnosis_date || new Date().toISOString().split("T")[0],
            reported_date: new Date().toISOString().split("T")[0],
            case_status: diseaseForm.case_status,
            investigation_status: "pending",
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({ title: "Error", description: result.error || "Failed to submit disease report", variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Disease report submitted" })
        setShowDiseaseDialog(false)
        setDiseaseForm({ patient_id: "", disease_name: "", diagnosis_date: "", case_status: "suspected" })
        fetchDiseaseReports()
        fetchStats()
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit disease report", variant: "destructive" })
    }
  }

  // Environmental Inspection Functions
  const handleCreateEnvInspection = async () => {
    if (!envForm.facility_name) {
      toast({ title: "Error", description: "Please enter facility name", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/county-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "environmental_inspection",
          data: {
            facility_name: envForm.facility_name,
            facility_type: envForm.facility_type,
            inspection_type: envForm.inspection_type,
            inspection_date: new Date().toISOString().split("T")[0],
            result: "pending",
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({ title: "Error", description: result.error || "Failed to schedule inspection", variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Inspection scheduled" })
        setShowEnvDialog(false)
        setEnvForm({ facility_name: "", facility_type: "restaurant", inspection_type: "routine" })
        fetchEnvInspections()
        fetchStats()
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to schedule inspection", variant: "destructive" })
    }
  }

  // AI Coach Functions
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage = { id: Date.now(), role: "user", content: inputValue }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsAiLoading(true)

    try {
      const response = await fetch("/api/county-health/ai-coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue, programArea: "general" }),
      })
      const data = await response.json()

      const assistantMessage = { id: Date.now() + 1, role: "assistant", content: data.response }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ])
    } finally {
      setIsAiLoading(false)
    }
  }

  const filteredPatients = patients.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">County Health Department</h1>
              <p className="text-muted-foreground">Public Health Services & Population Management</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAllData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Key Statistics Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">WIC Participants</CardTitle>
                <Baby className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.wicParticipants}</div>
                <p className="text-xs text-muted-foreground">Active enrollments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Immunizations</CardTitle>
                <Syringe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.immunizations}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">STI Visits</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.stdVisits}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Disease Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.diseaseReports}</div>
                <p className="text-xs text-muted-foreground">This year</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs - Fixed layout */}
          <Tabs defaultValue="wic" className="space-y-4">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-max gap-1 p-1">
                <TabsTrigger value="wic" className="px-3">
                  WIC
                </TabsTrigger>
                <TabsTrigger value="immunizations" className="px-3">
                  Immunizations
                </TabsTrigger>
                <TabsTrigger value="std" className="px-3">
                  Sexual Health
                </TabsTrigger>
                <TabsTrigger value="mch" className="px-3">
                  MCH
                </TabsTrigger>
                <TabsTrigger value="disease" className="px-3">
                  Disease Tracking
                </TabsTrigger>
                <TabsTrigger value="tb" className="px-3">
                  TB
                </TabsTrigger>
                <TabsTrigger value="environmental" className="px-3">
                  Environmental
                </TabsTrigger>
                <TabsTrigger value="ai-coach" className="px-3">
                  AI Coach
                </TabsTrigger>
                <TabsTrigger value="education" className="px-3">
                  Education
                </TabsTrigger>
              </TabsList>
            </ScrollArea>

            {/* WIC Program Tab */}
            <TabsContent value="wic" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>WIC Program Management</CardTitle>
                    <CardDescription>Women, Infants & Children nutrition program</CardDescription>
                  </div>
                  <Button onClick={() => setShowWicDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll Participant
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Participant</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Enrollment Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wicEnrollments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No WIC enrollments found. Click "Enroll Participant" to add one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        wicEnrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">
                              {enrollment.patients?.first_name} {enrollment.patients?.last_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {enrollment.category}
                              </Badge>
                            </TableCell>
                            <TableCell>{enrollment.enrollment_date}</TableCell>
                            <TableCell>
                              <Badge className={enrollment.status === "active" ? "bg-green-500" : "bg-gray-500"}>
                                {enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Immunizations Tab */}
            <TabsContent value="immunizations" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Immunization Clinic</CardTitle>
                    <CardDescription>Walk-in vaccination services</CardDescription>
                  </div>
                  <Button onClick={() => setShowVaccinationDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Vaccination
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">
                    {["COVID-19", "Influenza", "MMR", "Hepatitis B", "Tdap"].map((vaccine) => (
                      <Badge key={vaccine} variant="outline" className="justify-center py-1">
                        {vaccine}
                      </Badge>
                    ))}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Vaccine</TableHead>
                        <TableHead>Dose</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Lot #</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vaccinations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No vaccinations recorded. Click "Record Vaccination" to add one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        vaccinations.map((vacc) => (
                          <TableRow key={vacc.id}>
                            <TableCell>
                              {vacc.patients?.first_name} {vacc.patients?.last_name}
                            </TableCell>
                            <TableCell>{vacc.vaccine_name}</TableCell>
                            <TableCell>Dose {vacc.dose_number}</TableCell>
                            <TableCell>{vacc.administration_date}</TableCell>
                            <TableCell>{vacc.lot_number || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sexual Health Tab */}
            <TabsContent value="std" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Sexual Health Services</CardTitle>
                    <CardDescription>HIV/AIDS, PrEP, nPEP, and STI testing & treatment</CardDescription>
                  </div>
                  <Button onClick={() => setShowStiDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Clinic Visit
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm font-medium text-red-900">HIV Tests</p>
                      <p className="text-2xl font-bold text-red-700 mt-1">{stats.stdVisits}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <p className="text-sm font-medium text-purple-900">STI Screenings</p>
                      <p className="text-2xl font-bold text-purple-700 mt-1">{stats.stdVisits}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">PrEP Patients</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">-</p>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Visit Date</TableHead>
                        <TableHead>Chief Complaint</TableHead>
                        <TableHead>Tests Ordered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stiVisits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No STI clinic visits recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        stiVisits.map((visit) => (
                          <TableRow key={visit.id}>
                            <TableCell>
                              {visit.patients?.first_name} {visit.patients?.last_name}
                            </TableCell>
                            <TableCell>{visit.visit_date}</TableCell>
                            <TableCell>{visit.chief_complaint || "-"}</TableCell>
                            <TableCell>{visit.tests_ordered?.join(", ") || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MCH Tab */}
            <TabsContent value="mch" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Maternal & Child Health</CardTitle>
                    <CardDescription>Home visiting, prenatal care, and family support</CardDescription>
                  </div>
                  <Button onClick={() => setShowMchDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New MCH Visit
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-pink-50 border border-pink-200">
                      <p className="text-sm font-medium text-pink-900">Prenatal</p>
                      <p className="text-2xl font-bold text-pink-700 mt-1">{stats.mchCases}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">Well-Child</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">-</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm font-medium text-green-900">Home Visits</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">-</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <p className="text-sm font-medium text-purple-900">Family Planning</p>
                      <p className="text-2xl font-bold text-purple-700 mt-1">-</p>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Visit Type</TableHead>
                        <TableHead>Visit Date</TableHead>
                        <TableHead>Home Visit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mchVisits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No MCH visits recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        mchVisits.map((visit) => (
                          <TableRow key={visit.id}>
                            <TableCell>
                              {visit.patients?.first_name} {visit.patients?.last_name}
                            </TableCell>
                            <TableCell>{visit.visit_type}</TableCell>
                            <TableCell>{visit.visit_date}</TableCell>
                            <TableCell>{visit.home_visit ? "Yes" : "No"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Disease Tracking Tab */}
            <TabsContent value="disease" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Communicable Disease Surveillance</CardTitle>
                    <CardDescription>Reportable disease tracking and investigation</CardDescription>
                  </div>
                  <Button onClick={() => setShowDiseaseDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Report Disease
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Disease</TableHead>
                        <TableHead>Diagnosis Date</TableHead>
                        <TableHead>Case Status</TableHead>
                        <TableHead>Investigation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diseaseReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No disease reports found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        diseaseReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              {report.patients?.first_name} {report.patients?.last_name}
                            </TableCell>
                            <TableCell>{report.disease_name}</TableCell>
                            <TableCell>{report.diagnosis_date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {report.case_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  report.investigation_status === "completed" ? "bg-green-500" : "bg-yellow-500"
                                }
                              >
                                {report.investigation_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TB Management Tab */}
            <TabsContent value="tb" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>TB Case Management</CardTitle>
                    <CardDescription>Tuberculosis tracking and DOT supervision</CardDescription>
                  </div>
                  <Button onClick={() => setShowTbDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New TB Case
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="p-4 mb-4 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-900">Active TB Cases</p>
                        <p className="text-2xl font-bold text-orange-700 mt-1">{stats.tbCases}</p>
                      </div>
                      <Activity className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Case Type</TableHead>
                        <TableHead>Diagnosis Date</TableHead>
                        <TableHead>DOT Required</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tbCases.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No TB cases found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        tbCases.map((tbCase) => (
                          <TableRow key={tbCase.id}>
                            <TableCell>
                              {tbCase.patients?.first_name} {tbCase.patients?.last_name}
                            </TableCell>
                            <TableCell>{tbCase.case_type}</TableCell>
                            <TableCell>{tbCase.diagnosis_date}</TableCell>
                            <TableCell>{tbCase.dot_required ? "Yes" : "No"}</TableCell>
                            <TableCell>
                              <Badge className={tbCase.status === "active" ? "bg-red-500" : "bg-green-500"}>
                                {tbCase.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Environmental Health Tab */}
            <TabsContent value="environmental" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Environmental Health Inspections</CardTitle>
                    <CardDescription>Food service, housing, and facility inspections</CardDescription>
                  </div>
                  <Button onClick={() => setShowEnvDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Inspection
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facility</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Inspection Date</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {envInspections.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No inspections found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        envInspections.map((inspection) => (
                          <TableRow key={inspection.id}>
                            <TableCell className="font-medium">{inspection.facility_name}</TableCell>
                            <TableCell>{inspection.facility_type}</TableCell>
                            <TableCell>{inspection.inspection_date}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  inspection.result === "pass"
                                    ? "bg-green-500"
                                    : inspection.result === "fail"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                }
                              >
                                {inspection.result}
                              </Badge>
                            </TableCell>
                            <TableCell>{inspection.score || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Coach Tab */}
            <TabsContent value="ai-coach" className="space-y-4">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-teal-600" />
                    Public Health AI Coach
                  </CardTitle>
                  <CardDescription>Ask questions about public health protocols and best practices</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 pr-4 mb-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <Bot className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p>
                            Ask me about WIC guidelines, immunization schedules, disease reporting, or public health
                            protocols.
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.role === "user" ? "bg-teal-600 text-white" : "bg-muted text-foreground"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))
                      )}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg px-4 py-2">
                            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask about public health protocols..."
                      disabled={isAiLoading}
                    />
                    <Button type="submit" disabled={isAiLoading || !inputValue.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Family Education Resources
                    </CardTitle>
                    <CardDescription>Patient and family education materials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {educationResources.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No education resources available.</p>
                      ) : (
                        educationResources.slice(0, 5).map((resource) => (
                          <div
                            key={resource.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              {resource.resource_type === "video" ? (
                                <Video className="h-5 w-5 text-blue-500" />
                              ) : (
                                <FileText className="h-5 w-5 text-green-500" />
                              )}
                              <div>
                                <p className="font-medium text-sm">{resource.title}</p>
                                <p className="text-xs text-muted-foreground">{resource.target_audience}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                      Staff Training Modules
                    </CardTitle>
                    <CardDescription>Required training and continuing education</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {staffModules.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No training modules available.</p>
                      ) : (
                        staffModules.slice(0, 5).map((module) => (
                          <div
                            key={module.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div>
                              <p className="font-medium text-sm">{module.module_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {module.duration_minutes} min • {module.ceu_hours} CEU
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Start
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* WIC Dialog */}
          <Dialog open={showWicDialog} onOpenChange={setShowWicDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enroll WIC Participant</DialogTitle>
                <DialogDescription>Register a new participant in the WIC program</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Patient</Label>
                  <Select value={wicForm.patient_id} onValueChange={(v) => setWicForm({ ...wicForm, patient_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} - {p.date_of_birth}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={wicForm.category} onValueChange={(v) => setWicForm({ ...wicForm, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pregnant">Pregnant Woman</SelectItem>
                      <SelectItem value="postpartum">Postpartum Woman</SelectItem>
                      <SelectItem value="breastfeeding">Breastfeeding Woman</SelectItem>
                      <SelectItem value="infant">Infant</SelectItem>
                      <SelectItem value="child">Child (1-5 years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date (if applicable)</Label>
                  <Input
                    type="date"
                    value={wicForm.due_date}
                    onChange={(e) => setWicForm({ ...wicForm, due_date: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={wicForm.income_verified}
                      onCheckedChange={(c) => setWicForm({ ...wicForm, income_verified: !!c })}
                    />
                    <Label>Income Verified</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={wicForm.medicaid_recipient}
                      onCheckedChange={(c) => setWicForm({ ...wicForm, medicaid_recipient: !!c })}
                    />
                    <Label>Medicaid Recipient</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWicDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWicEnrollment}>Enroll Participant</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Vaccination Dialog */}
          <Dialog open={showVaccinationDialog} onOpenChange={setShowVaccinationDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Vaccination</DialogTitle>
                <DialogDescription>Document a vaccine administration</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Patient</Label>
                  <Select
                    value={vaccinationForm.patient_id}
                    onValueChange={(v) => setVaccinationForm({ ...vaccinationForm, patient_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vaccine</Label>
                  <Select
                    value={vaccinationForm.vaccine_name}
                    onValueChange={(v) => setVaccinationForm({ ...vaccinationForm, vaccine_name: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vaccine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COVID-19 Pfizer">COVID-19 (Pfizer)</SelectItem>
                      <SelectItem value="COVID-19 Moderna">COVID-19 (Moderna)</SelectItem>
                      <SelectItem value="Influenza">Influenza</SelectItem>
                      <SelectItem value="MMR">MMR</SelectItem>
                      <SelectItem value="Hepatitis A">Hepatitis A</SelectItem>
                      <SelectItem value="Hepatitis B">Hepatitis B</SelectItem>
                      <SelectItem value="Tdap">Tdap</SelectItem>
                      <SelectItem value="HPV">HPV</SelectItem>
                      <SelectItem value="Pneumococcal">Pneumococcal</SelectItem>
                      <SelectItem value="Meningococcal">Meningococcal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Lot Number</Label>
                    <Input
                      value={vaccinationForm.lot_number}
                      onChange={(e) => setVaccinationForm({ ...vaccinationForm, lot_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Dose Number</Label>
                    <Select
                      value={String(vaccinationForm.dose_number)}
                      onValueChange={(v) => setVaccinationForm({ ...vaccinationForm, dose_number: Number.parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            Dose {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Administration Site</Label>
                  <Select
                    value={vaccinationForm.administration_site}
                    onValueChange={(v) => setVaccinationForm({ ...vaccinationForm, administration_site: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left_arm">Left Arm (Deltoid)</SelectItem>
                      <SelectItem value="right_arm">Right Arm (Deltoid)</SelectItem>
                      <SelectItem value="left_thigh">Left Thigh</SelectItem>
                      <SelectItem value="right_thigh">Right Thigh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVaccinationDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRecordVaccination}>Record Vaccination</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* STI Visit Dialog */}
          <Dialog open={showStiDialog} onOpenChange={setShowStiDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New STI Clinic Visit</DialogTitle>
                <DialogDescription>Record a sexual health clinic visit</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Patient</Label>
                  <Select value={stiForm.patient_id} onValueChange={(v) => setStiForm({ ...stiForm, patient_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Chief Complaint</Label>
                  <Textarea
                    value={stiForm.chief_complaint}
                    onChange={(e) => setStiForm({ ...stiForm, chief_complaint: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tests to Order</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["HIV", "Gonorrhea", "Chlamydia", "Syphilis", "Hepatitis B", "Hepatitis C"].map((test) => (
                      <div key={test} className="flex items-center gap-2">
                        <Checkbox
                          checked={stiForm.tests_ordered.includes(test)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStiForm({ ...stiForm, tests_ordered: [...stiForm.tests_ordered, test] })
                            } else {
                              setStiForm({ ...stiForm, tests_ordered: stiForm.tests_ordered.filter((t) => t !== test) })
                            }
                          }}
                        />
                        <Label>{test}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowStiDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStiVisit}>Create Visit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Disease Report Dialog */}
          <Dialog open={showDiseaseDialog} onOpenChange={setShowDiseaseDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Communicable Disease</DialogTitle>
                <DialogDescription>Submit a reportable disease notification</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Patient</Label>
                  <Select
                    value={diseaseForm.patient_id}
                    onValueChange={(v) => setDiseaseForm({ ...diseaseForm, patient_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Disease</Label>
                  <Select
                    value={diseaseForm.disease_name}
                    onValueChange={(v) => setDiseaseForm({ ...diseaseForm, disease_name: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select disease" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COVID-19">COVID-19</SelectItem>
                      <SelectItem value="Tuberculosis">Tuberculosis</SelectItem>
                      <SelectItem value="Hepatitis A">Hepatitis A</SelectItem>
                      <SelectItem value="Hepatitis B">Hepatitis B</SelectItem>
                      <SelectItem value="Hepatitis C">Hepatitis C</SelectItem>
                      <SelectItem value="Measles">Measles</SelectItem>
                      <SelectItem value="Mumps">Mumps</SelectItem>
                      <SelectItem value="Pertussis">Pertussis</SelectItem>
                      <SelectItem value="Salmonella">Salmonella</SelectItem>
                      <SelectItem value="E. coli">E. coli</SelectItem>
                      <SelectItem value="Legionella">Legionella</SelectItem>
                      <SelectItem value="Meningococcal">Meningococcal Disease</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Diagnosis Date</Label>
                  <Input
                    type="date"
                    value={diseaseForm.diagnosis_date}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, diagnosis_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Case Status</Label>
                  <Select
                    value={diseaseForm.case_status}
                    onValueChange={(v) => setDiseaseForm({ ...diseaseForm, case_status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suspected">Suspected</SelectItem>
                      <SelectItem value="probable">Probable</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDiseaseDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDiseaseReport}>Submit Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Environmental Inspection Dialog */}
          <Dialog open={showEnvDialog} onOpenChange={setShowEnvDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Inspection</DialogTitle>
                <DialogDescription>Create a new environmental health inspection</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Facility Name</Label>
                  <Input
                    value={envForm.facility_name}
                    onChange={(e) => setEnvForm({ ...envForm, facility_name: e.target.value })}
                    placeholder="Enter facility name"
                  />
                </div>
                <div>
                  <Label>Facility Type</Label>
                  <Select
                    value={envForm.facility_type}
                    onValueChange={(v) => setEnvForm({ ...envForm, facility_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="food_truck">Food Truck</SelectItem>
                      <SelectItem value="grocery_store">Grocery Store</SelectItem>
                      <SelectItem value="school_cafeteria">School Cafeteria</SelectItem>
                      <SelectItem value="daycare">Daycare</SelectItem>
                      <SelectItem value="pool">Swimming Pool</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Inspection Type</Label>
                  <Select
                    value={envForm.inspection_type}
                    onValueChange={(v) => setEnvForm({ ...envForm, inspection_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="pre_opening">Pre-Opening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEnvDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEnvInspection}>Schedule Inspection</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
