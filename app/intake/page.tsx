"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  User,
  FileText,
  Camera,
  Smartphone,
  Shield,
  Heart,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Phone,
  Mail,
  CreditCard,
  Stethoscope,
  Loader2,
  Search,
  Plus,
  Save,
  AlertTriangle,
  Pill,
  Activity,
} from "lucide-react"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  email: string
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  insurance_provider: string
  insurance_id: string
}

interface OrientationItem {
  id: number
  title: string
  description: string
  icon: any
}

export default function PatientIntake() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [completedItems, setCompletedItems] = useState<number[]>([])
  const [orientationProgress, setOrientationProgress] = useState(0)

  // PMP state
  const [pmpLoading, setPmpLoading] = useState(false)
  const [pmpResults, setPmpResults] = useState<any>(null)
  const [pmpConfig, setPmpConfig] = useState<any>(null)

  const { toast } = useToast()
  const supabase = createBrowserClient()

  // Clinical Assessment Form State
  const [assessmentData, setAssessmentData] = useState({
    primary_substance: "",
    duration_of_use: "",
    medical_history: "",
    mental_health_screening: "",
    social_determinants: "",
  })

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    phone: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    insurance_provider: "",
    insurance_id: "",
    gender: "",
  })

  // Documentation Status
  const [documentationStatus, setDocumentationStatus] = useState({
    consent_for_treatment: "pending",
    hipaa_authorization: "pending",
    financial_agreement: "pending",
    emergency_contact_form: "pending",
    photo_id_verification: "pending",
    insurance_card_copy: "pending",
    hhn_enrollment: "pending",
    patient_handbook_receipt: "pending",
  })

  useEffect(() => {
    loadPMPConfig()
  }, [])

  const loadPMPConfig = async () => {
    const { data } = await supabase.from("pdmp_config").select("*").single()

    if (data) {
      setPmpConfig(data)
    }
  }

  const runPMPCheck = async (patient: Patient) => {
    if (!pmpConfig?.is_active || !pmpConfig?.auto_check_controlled_rx) {
      return // PMP not configured or auto-check disabled
    }

    setPmpLoading(true)
    setPmpResults(null)

    try {
      const response = await fetch("/api/pmp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          dob: patient.date_of_birth,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPmpResults(result)

        if (result.alertLevel === "critical" || result.alertLevel === "high") {
          toast({
            title: "PMP Alert",
            description: `High-risk prescription history detected for this patient`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "PMP Check Complete",
            description: `${result.prescriptionCount || 0} controlled substance prescriptions found`,
          })
        }
      }
    } catch (err) {
      console.error("Error running PMP check:", err)
      toast({
        title: "PMP Check Failed",
        description: "Could not query PMP database. Please check manually.",
        variant: "destructive",
      })
    } finally {
      setPmpLoading(false)
    }
  }

  // Search patients from database
  const searchPatients = async (term: string) => {
    if (!term || term.length < 2) {
      setPatients([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(10)

      if (error) throw error
      setPatients(data || [])
    } catch (err) {
      console.error("Error searching patients:", err)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  const createNewPatient = async () => {
    if (!newPatient.first_name || !newPatient.last_name || !newPatient.date_of_birth) {
      toast({
        title: "Missing Fields",
        description: "Please fill in required fields: First Name, Last Name, and Date of Birth",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create patient")
      }

      const data = await response.json()

      setSelectedPatient(data)
      setShowNewPatientForm(false)
      setNewPatient({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        phone: "",
        email: "",
        address: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        insurance_provider: "",
        insurance_id: "",
        gender: "",
      })

      toast({ title: "Success", description: "Patient created successfully" })

      // Auto-run PMP check for new patient
      await runPMPCheck(data)
    } catch (err) {
      console.error("Error creating patient:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create patient. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Save orientation progress
  const saveOrientationProgress = async () => {
    if (!selectedPatient) return

    setSaving(true)
    try {
      // Save to patient_chart_items or create an intake record
      const { error } = await supabase.from("otp_admissions").upsert({
        patient_id: selectedPatient.id,
        admission_date: new Date().toISOString().split("T")[0],
        status: orientationProgress === 100 ? "active" : "pending_orientation",
        program_type: "OTP",
        medication: assessmentData.primary_substance || "pending",
      })

      if (error) throw error
      toast({ title: "Success", description: "Progress saved successfully!" })
    } catch (err) {
      console.error("Error saving progress:", err)
      toast({ title: "Error", description: "Failed to save progress", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Complete intake
  const completeIntake = async () => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Please select a patient first", variant: "destructive" })
      return
    }

    if (orientationProgress < 100) {
      const confirm = window.confirm("Orientation is not complete. Are you sure you want to finish?")
      if (!confirm) return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from("otp_admissions").upsert({
        patient_id: selectedPatient.id,
        admission_date: new Date().toISOString().split("T")[0],
        status: "active",
        program_type: "OTP",
        primary_substance: assessmentData.primary_substance,
        medication: "pending_evaluation",
      })

      if (error) throw error
      toast({ title: "Success", description: "Intake completed! Patient is now active." })

      // Reset form
      setSelectedPatient(null)
      setCompletedItems([])
      setOrientationProgress(0)
      setPmpResults(null)
      setAssessmentData({
        primary_substance: "",
        duration_of_use: "",
        medical_history: "",
        mental_health_screening: "",
        social_determinants: "",
      })
    } catch (err) {
      console.error("Error completing intake:", err)
      toast({ title: "Error", description: "Failed to complete intake", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleItemComplete = (itemId: number) => {
    if (!completedItems.includes(itemId)) {
      const newCompleted = [...completedItems, itemId]
      setCompletedItems(newCompleted)
      setOrientationProgress((newCompleted.length / orientationChecklist.length) * 100)
    } else {
      const newCompleted = completedItems.filter((id) => id !== itemId)
      setCompletedItems(newCompleted)
      setOrientationProgress((newCompleted.length / orientationChecklist.length) * 100)
    }
  }

  const updateDocStatus = (doc: keyof typeof documentationStatus, status: string) => {
    setDocumentationStatus((prev) => ({ ...prev, [doc]: status }))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const orientationChecklist: OrientationItem[] = [
    {
      id: 1,
      title: "Introduction and Welcome",
      description: "Greet patient and provide program overview",
      icon: Users,
    },
    {
      id: 2,
      title: "Program Overview",
      description: "Explain services, treatment phases, and expectations",
      icon: FileText,
    },
    { id: 3, title: "Facility Tour", description: "Show key areas and emergency exits", icon: MapPin },
    { id: 4, title: "Patient ID Card", description: "Issue identification card with photo", icon: Camera },
    {
      id: 5,
      title: "Rights and Responsibilities",
      description: "Review HIPAA rights and patient responsibilities",
      icon: Shield,
    },
    { id: 6, title: "Grievance Procedure", description: "Explain complaint process and HHN filing", icon: AlertCircle },
    {
      id: 7,
      title: "HHN Orientation",
      description: "Set up HomeHealthNotify app and demonstrate features",
      icon: Smartphone,
    },
    {
      id: 8,
      title: "Medication Education",
      description: "Discuss MAT options, benefits, and safety",
      icon: Stethoscope,
    },
    { id: 9, title: "Drug Screening Policy", description: "Review testing procedures and protocols", icon: Heart },
    {
      id: 10,
      title: "Treatment Schedule",
      description: "Provide appointment schedule and attendance policy",
      icon: Calendar,
    },
    { id: 11, title: "Safety Procedures", description: "Review emergency protocols and EAP codes", icon: Shield },
    { id: 12, title: "Support Services", description: "Explain case management and peer support", icon: Users },
    { id: 13, title: "Confidentiality Forms", description: "Review and sign consent forms", icon: FileText },
    { id: 14, title: "Educational Programs", description: "Discuss available workshops and training", icon: FileText },
    {
      id: 15,
      title: "Financial Information",
      description: "Review payment arrangements and insurance",
      icon: CreditCard,
    },
    { id: 16, title: "Patient Handbook", description: "Provide handbook and review key sections", icon: FileText },
    { id: 17, title: "Telehealth Options", description: "Explain remote appointment availability", icon: Phone },
    {
      id: 18,
      title: "Take-Home Monitoring",
      description: "Review eligibility and HHN video requirements",
      icon: Smartphone,
    },
    { id: 19, title: "Contact Information", description: "Provide key contacts and after-hours support", icon: Mail },
    {
      id: 20,
      title: "Follow-Up Planning",
      description: "Schedule next appointments and confirm understanding",
      icon: Calendar,
    },
  ]

  const selectPatient = async (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchTerm("")
    setPatients([])

    // Auto-run PMP check
    await runPMPCheck(patient)
  }

  const getPMPAlertBadge = (alertLevel: string) => {
    switch (alertLevel) {
      case "critical":
        return <Badge variant="destructive">Critical Risk</Badge>
      case "high":
        return <Badge className="bg-orange-500">High Risk</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">Medium Risk</Badge>
      case "low":
        return <Badge className="bg-green-500">Low Risk</Badge>
      default:
        return <Badge variant="secondary">No Alerts</Badge>
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <div className="flex-1 ml-64">
        <div className="border-b bg-card/50">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Patient Intake & Orientation</h1>
                <p className="text-muted-foreground">Comprehensive intake process with patient orientation checklist</p>
              </div>
              <div className="flex items-center gap-2">
                {pmpConfig?.is_active && (
                  <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                    <Activity className="mr-1 h-3 w-3" />
                    PMP Auto-Check Enabled
                  </Badge>
                )}
                <Badge variant="outline" className="px-3 py-1">
                  <Clock className="mr-1 h-3 w-3" />
                  Est. 45-60 minutes
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveOrientationProgress}
                  disabled={saving || !selectedPatient}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Progress
                </Button>
                <Button size="sm" onClick={completeIntake} disabled={saving || !selectedPatient}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Complete Intake
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Selection/Information Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Patient Search Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Find or Add Patient
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {loading && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Search Results */}
                  {patients.length > 0 && !selectedPatient && (
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {patients.map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => selectPatient(patient)}
                        >
                          <p className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{patient.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchTerm.length >= 2 && patients.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground text-center py-2">No patients found</p>
                  )}

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {showNewPatientForm ? "Cancel" : "Add New Patient"}
                  </Button>
                </CardContent>
              </Card>

              {/* New Patient Form */}
              {showNewPatientForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>New Patient Registration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name *</Label>
                        <Input
                          value={newPatient.first_name}
                          onChange={(e) => setNewPatient((prev) => ({ ...prev, first_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name *</Label>
                        <Input
                          value={newPatient.last_name}
                          onChange={(e) => setNewPatient((prev) => ({ ...prev, last_name: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Input
                        type="date"
                        value={newPatient.date_of_birth}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={newPatient.gender}
                        onValueChange={(value) => setNewPatient((prev) => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newPatient.email}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={newPatient.address}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact Name</Label>
                      <Input
                        value={newPatient.emergency_contact_name}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact Phone</Label>
                      <Input
                        value={newPatient.emergency_contact_phone}
                        onChange={(e) =>
                          setNewPatient((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Insurance Provider</Label>
                      <Input
                        value={newPatient.insurance_provider}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, insurance_provider: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Insurance ID</Label>
                      <Input
                        value={newPatient.insurance_id}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, insurance_id: e.target.value }))}
                      />
                    </div>
                    <Button className="w-full" onClick={createNewPatient} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Create Patient
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Selected Patient Info */}
              {selectedPatient && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-lg">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">DOB: {selectedPatient.date_of_birth}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(null)
                          setPmpResults(null)
                        }}
                      >
                        Change
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Phone:</strong> {selectedPatient.phone || "N/A"}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedPatient.email || "N/A"}
                      </p>
                      <p>
                        <strong>Insurance:</strong> {selectedPatient.insurance_provider || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedPatient && (
                <Card
                  className={
                    pmpResults?.alertLevel === "critical" || pmpResults?.alertLevel === "high" ? "border-red-500" : ""
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      PMP Check Results
                    </CardTitle>
                    <CardDescription>Prescription Monitoring Program data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pmpLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Querying PMP database...</span>
                      </div>
                    ) : pmpResults ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          {getPMPAlertBadge(pmpResults.alertLevel)}
                          <span className="text-sm text-muted-foreground">
                            {pmpResults.prescriptionCount || 0} Rx found
                          </span>
                        </div>

                        {pmpResults.redFlags && pmpResults.redFlags.length > 0 && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              Red Flags
                            </h4>
                            <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                              {pmpResults.redFlags.map((flag: string, i: number) => (
                                <li key={i}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {pmpResults.prescriptions && pmpResults.prescriptions.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Recent Controlled Substances:</h4>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {pmpResults.prescriptions.slice(0, 5).map((rx: any, i: number) => (
                                <div key={i} className="text-xs p-2 bg-muted/50 rounded">
                                  <p className="font-medium">{rx.medication_name}</p>
                                  <p className="text-muted-foreground">
                                    {rx.fill_date} - {rx.prescriber_name}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(!pmpResults.prescriptions || pmpResults.prescriptions.length === 0) && (
                          <div className="text-center py-4 text-muted-foreground">
                            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                            <p className="text-sm">No controlled substances found</p>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={() => runPMPCheck(selectedPatient)}
                          disabled={pmpLoading}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Re-run PMP Check
                        </Button>
                      </div>
                    ) : pmpConfig?.is_active ? (
                      <div className="text-center py-4">
                        <Button variant="outline" onClick={() => runPMPCheck(selectedPatient)} disabled={pmpLoading}>
                          <Activity className="h-4 w-4 mr-2" />
                          Run PMP Check
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm">PMP not configured</p>
                        <p className="text-xs">Configure in PMP Dashboard</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Orientation Progress */}
              {selectedPatient && (
                <Card>
                  <CardHeader>
                    <CardTitle>Orientation Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {completedItems.length} of {orientationChecklist.length} items
                        </span>
                        <span>{Math.round(orientationProgress)}%</span>
                      </div>
                      <Progress value={orientationProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {!selectedPatient ? (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select a Patient to Begin</h3>
                    <p>Search for an existing patient or add a new one to start the intake process.</p>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="orientation" className="space-y-4">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="orientation">Orientation</TabsTrigger>
                    <TabsTrigger value="clinical">Clinical Assessment</TabsTrigger>
                    <TabsTrigger value="documentation">Documentation</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>

                  {/* Orientation Tab */}
                  <TabsContent value="orientation">
                    <Card>
                      <CardHeader>
                        <CardTitle>Orientation Checklist</CardTitle>
                        <CardDescription>Complete each item as you progress through orientation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {orientationChecklist.map((item) => {
                            const Icon = item.icon
                            const isCompleted = completedItems.includes(item.id)
                            return (
                              <div
                                key={item.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  isCompleted ? "bg-green-50 border-green-200" : "hover:bg-muted/50"
                                }`}
                                onClick={() => handleItemComplete(item.id)}
                              >
                                <Checkbox checked={isCompleted} onCheckedChange={() => handleItemComplete(item.id)} />
                                <Icon
                                  className={`h-5 w-5 mt-0.5 ${isCompleted ? "text-green-600" : "text-muted-foreground"}`}
                                />
                                <div className="flex-1">
                                  <p className={`font-medium ${isCompleted ? "text-green-700" : ""}`}>
                                    {item.id}. {item.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                                {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Clinical Assessment Tab */}
                  <TabsContent value="clinical">
                    <Card>
                      <CardHeader>
                        <CardTitle>Clinical Assessment</CardTitle>
                        <CardDescription>Initial clinical evaluation</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Primary Substance</Label>
                          <Select
                            value={assessmentData.primary_substance}
                            onValueChange={(v) => setAssessmentData((prev) => ({ ...prev, primary_substance: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary substance" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="opioids">Opioids</SelectItem>
                              <SelectItem value="heroin">Heroin</SelectItem>
                              <SelectItem value="fentanyl">Fentanyl</SelectItem>
                              <SelectItem value="alcohol">Alcohol</SelectItem>
                              <SelectItem value="benzodiazepines">Benzodiazepines</SelectItem>
                              <SelectItem value="stimulants">Stimulants</SelectItem>
                              <SelectItem value="cannabis">Cannabis</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration of Use</Label>
                          <Select
                            value={assessmentData.duration_of_use}
                            onValueChange={(v) => setAssessmentData((prev) => ({ ...prev, duration_of_use: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="less_than_1_year">Less than 1 year</SelectItem>
                              <SelectItem value="1_3_years">1-3 years</SelectItem>
                              <SelectItem value="3_5_years">3-5 years</SelectItem>
                              <SelectItem value="5_10_years">5-10 years</SelectItem>
                              <SelectItem value="more_than_10_years">More than 10 years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Medical History</Label>
                          <Textarea
                            placeholder="Enter relevant medical history..."
                            value={assessmentData.medical_history}
                            onChange={(e) =>
                              setAssessmentData((prev) => ({ ...prev, medical_history: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mental Health Screening Notes</Label>
                          <Textarea
                            placeholder="Enter mental health screening notes..."
                            value={assessmentData.mental_health_screening}
                            onChange={(e) =>
                              setAssessmentData((prev) => ({ ...prev, mental_health_screening: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Social Determinants of Health</Label>
                          <Textarea
                            placeholder="Housing, employment, support system..."
                            value={assessmentData.social_determinants}
                            onChange={(e) =>
                              setAssessmentData((prev) => ({ ...prev, social_determinants: e.target.value }))
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Documentation Tab */}
                  <TabsContent value="documentation">
                    <Card>
                      <CardHeader>
                        <CardTitle>Required Documentation</CardTitle>
                        <CardDescription>Track completion of required forms</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(documentationStatus).map(([key, status]) => (
                            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="capitalize">{key.replace(/_/g, " ")}</span>
                              <Select
                                value={status}
                                onValueChange={(v) => updateDocStatus(key as keyof typeof documentationStatus, v)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="na">N/A</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Summary Tab */}
                  <TabsContent value="summary">
                    <Card>
                      <CardHeader>
                        <CardTitle>Intake Summary</CardTitle>
                        <CardDescription>Review before completing intake</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Patient</h4>
                            <p>
                              {selectedPatient.first_name} {selectedPatient.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">DOB: {selectedPatient.date_of_birth}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Primary Substance</h4>
                            <p>{assessmentData.primary_substance || "Not specified"}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Orientation Progress</h4>
                          <Progress value={orientationProgress} className="h-2 mb-1" />
                          <p className="text-sm text-muted-foreground">
                            {completedItems.length} of {orientationChecklist.length} items completed
                          </p>
                        </div>

                        {pmpResults && (
                          <div>
                            <h4 className="font-medium mb-2">PMP Status</h4>
                            <div className="flex items-center gap-2">
                              {getPMPAlertBadge(pmpResults.alertLevel)}
                              <span className="text-sm text-muted-foreground">
                                {pmpResults.prescriptionCount || 0} controlled substance prescriptions
                              </span>
                            </div>
                            {pmpResults.redFlags && pmpResults.redFlags.length > 0 && (
                              <p className="text-sm text-red-600 mt-1">
                                {pmpResults.redFlags.length} red flag(s) detected
                              </p>
                            )}
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium mb-2">Documentation Status</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(documentationStatus).map(([key, status]) => (
                              <Badge key={key} variant={status === "completed" ? "default" : "secondary"}>
                                {key.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button className="w-full" onClick={completeIntake} disabled={saving}>
                          {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Complete Intake & Activate Patient
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
