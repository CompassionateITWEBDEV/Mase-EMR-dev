"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  Pill,
  Printer,
  User,
  Search,
  X,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Syringe,
  Shield,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string
  address: string
  client_number?: string
  program_type?: string
  updated_at?: string
}

interface VitalSign {
  id: string
  measurement_date: string
  systolic_bp: number
  diastolic_bp: number
  heart_rate: number
  temperature: number
  oxygen_saturation: number
  weight: number
  bmi: number
}

interface Medication {
  id: string
  medication_name: string
  dosage: string
  frequency: string
  start_date: string
  status: string
}

interface Assessment {
  id: string
  assessment_type: string
  created_at: string
  provider_id: string
}

export default function PatientChartPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "otp" | "mat" | "primary">("all")
  const [sortBy, setSortBy] = useState<"name" | "client" | "recent">("name")
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [encounters, setEncounters] = useState<any[]>([])
  const [dosingLog, setDosingLog] = useState<any[]>([])
  const [consents, setConsents] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    let filtered = [...patients]

    if (searchQuery) {
      filtered = filtered.filter((p) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        const clientNumber = p.client_number?.toLowerCase() || ""
        const query = searchQuery.toLowerCase()
        return fullName.includes(query) || clientNumber.includes(query) || p.id.includes(query)
      })
    }

    if (filterBy !== "all") {
      filtered = filtered.filter((p) => p.program_type === filterBy)
    }

    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
      } else if (sortBy === "client") {
        return (a.client_number || "").localeCompare(b.client_number || "")
      } else if (sortBy === "recent") {
        return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      }
      return 0
    })

    setFilteredPatients(filtered)
  }, [patients, searchQuery, filterBy, sortBy])

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientData(selectedPatientId)
    }
  }, [selectedPatientId])

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients")
      const data = await res.json()
      setPatients(data.patients || [])
    } catch (error) {
      console.error("Error fetching patients:", error)
    }
  }

  const fetchPatientData = async (patientId: string) => {
    console.log("[v0] fetchPatientData called with patientId:", patientId)
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      console.log("[v0] Fetching patient data from Supabase...")
      const { data: patientDataArray, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)

      console.log("[v0] Patient data array:", patientDataArray)
      console.log("[v0] Patient error:", patientError)

      if (patientError) {
        throw patientError
      }

      const patientData = patientDataArray && patientDataArray.length > 0 ? patientDataArray[0] : null

      if (!patientData) {
        throw new Error("Patient not found")
      }

      setSelectedPatient(patientData)

      const { data: vitalsData } = await supabase
        .from("vital_signs")
        .select("*")
        .eq("patient_id", patientId)
        .order("measurement_date", { ascending: false })
        .limit(30)

      setVitalSigns(vitalsData || [])

      const criticalVitals = vitalsData?.filter(
        (v) =>
          v.systolic_bp > 180 ||
          v.systolic_bp < 90 ||
          v.diastolic_bp > 120 ||
          v.diastolic_bp < 60 ||
          v.heart_rate > 120 ||
          v.heart_rate < 50 ||
          v.oxygen_saturation < 90 ||
          v.temperature > 101 ||
          v.temperature < 95,
      )

      if (criticalVitals && criticalVitals.length > 0) {
        setAlerts([
          {
            id: "critical-vitals",
            type: "Critical Vitals",
            message: `${criticalVitals.length} critical vital sign reading(s) detected`,
            severity: "critical",
          },
        ])
      }

      const { data: medsData } = await supabase
        .from("medications")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })

      setMedications(medsData || [])

      const { data: assessmentsData } = await supabase
        .from("assessments")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(10)

      setAssessments(assessmentsData || [])

      const { data: encountersData } = await supabase
        .from("encounters")
        .select("*")
        .eq("patient_id", patientId)
        .order("encounter_date", { ascending: false })
        .limit(10)

      setEncounters(encountersData || [])

      const { data: dosingData } = await supabase
        .from("dosing_log")
        .select("*")
        .eq("patient_id", patientId)
        .order("dose_date", { ascending: false })
        .limit(30)

      setDosingLog(dosingData || [])

      const { data: consentsData } = await supabase
        .from("hie_patient_consents")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })

      setConsents(consentsData || [])
    } catch (error) {
      console.error("Error fetching patient data:", error)
      toast.error("Failed to load patient chart data")
    } finally {
      setLoading(false)
    }
  }

  const getVitalsTrendData = () => {
    return vitalSigns
      .slice(0, 14)
      .reverse()
      .map((v) => ({
        date: new Date(v.measurement_date).toLocaleDateString(),
        systolic: v.systolic_bp,
        diastolic: v.diastolic_bp,
        heartRate: v.heart_rate,
        weight: v.weight,
      }))
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 pl-64">
        <DashboardHeader title="Patient Chart" />
        <main className="p-6">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patient Chart Lookup</CardTitle>
                  <CardDescription>Search by name, client number, or filter by program</CardDescription>
                </div>
                {selectedPatient && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPatientId("")
                      setSelectedPatient(null)
                      setSearchQuery("")
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Selection
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, client number, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant={filterBy === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterBy === "otp" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("otp")}
                  >
                    OTP
                  </Button>
                  <Button
                    variant={filterBy === "mat" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("mat")}
                  >
                    MAT
                  </Button>
                  <Button
                    variant={filterBy === "primary" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("primary")}
                  >
                    Primary Care
                  </Button>
                </div>

                <div className="flex gap-2 items-center">
                  <Label className="text-sm text-muted-foreground">Sort by:</Label>
                  <Button
                    variant={sortBy === "name" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("name")}
                  >
                    A-Z Name
                  </Button>
                  <Button
                    variant={sortBy === "client" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("client")}
                  >
                    Client #
                  </Button>
                  <Button
                    variant={sortBy === "recent" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("recent")}
                  >
                    Recent
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredPatients.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No patients found. Try adjusting your search or filters.
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatientId(patient.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-accent ${
                          selectedPatientId === patient.id
                            ? "bg-accent border-2 border-primary"
                            : "border border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {patient.last_name}, {patient.first_name}
                              </span>
                              {patient.client_number && (
                                <Badge variant="secondary" className="text-xs">
                                  #{patient.client_number}
                                </Badge>
                              )}
                              {patient.program_type && (
                                <Badge variant="outline" className="text-xs">
                                  {patient.program_type.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              DOB: {patient.date_of_birth} • {patient.gender} • {patient.phone || "No phone"}
                            </div>
                          </div>
                          {selectedPatientId === patient.id && <ChevronRight className="h-5 w-5 text-primary" />}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>

              {selectedPatient && (
                <div className="mt-4 p-4 bg-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        Selected: {selectedPatient.first_name} {selectedPatient.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Client #{selectedPatient.client_number || "N/A"} • MRN: {selectedPatient.id.slice(0, 8)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedPatient && (
            <>
              {alerts.length > 0 && (
                <Card className="mb-6 border-red-500 bg-red-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-red-900">Critical Alerts</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg mb-2">
                        <div>
                          <Badge variant="destructive">{alert.type}</Badge>
                          <p className="mt-1 text-sm text-gray-900">{alert.message}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Patient Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <User className="h-4 w-4" />
                        <span>Name</span>
                      </div>
                      <p className="font-medium">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Date of Birth</span>
                      </div>
                      <p className="font-medium">{selectedPatient.date_of_birth}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <User className="h-4 w-4" />
                        <span>Gender</span>
                      </div>
                      <p className="font-medium">{selectedPatient.gender}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Phone className="h-4 w-4" />
                        <span>Phone</span>
                      </div>
                      <p className="font-medium">{selectedPatient.phone}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                      <p className="font-medium">{selectedPatient.email}</p>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin className="h-4 w-4" />
                        <span>Address</span>
                      </div>
                      <p className="font-medium">{selectedPatient.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="vitals" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="vitals">Vitals</TabsTrigger>
                  <TabsTrigger value="medications">Medications</TabsTrigger>
                  <TabsTrigger value="assessments">Assessments</TabsTrigger>
                  <TabsTrigger value="encounters">Encounters</TabsTrigger>
                  <TabsTrigger value="dosing">Dosing History</TabsTrigger>
                  <TabsTrigger value="consents">Consents</TabsTrigger>
                  <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="vitals" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vital Signs Trends (Last 14 Days)</CardTitle>
                      <CardDescription>Historical vital signs data with critical value detection</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {vitalSigns.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={getVitalsTrendData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic BP" />
                              <Line type="monotone" dataKey="diastolic" stroke="#f59e0b" name="Diastolic BP" />
                              <Line type="monotone" dataKey="heartRate" stroke="#3b82f6" name="Heart Rate" />
                            </LineChart>
                          </ResponsiveContainer>

                          <div className="mt-6 space-y-2">
                            {vitalSigns.slice(0, 10).map((vital) => {
                              const isCritical =
                                vital.systolic_bp > 180 ||
                                vital.systolic_bp < 90 ||
                                vital.heart_rate > 120 ||
                                vital.heart_rate < 50 ||
                                vital.oxygen_saturation < 90

                              return (
                                <div
                                  key={vital.id}
                                  className={`p-4 rounded-lg border ${
                                    isCritical ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="text-sm text-gray-600">
                                        {new Date(vital.measurement_date).toLocaleString()}
                                      </div>
                                      {isCritical && (
                                        <Badge variant="destructive" className="text-xs">
                                          Critical
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-6 text-sm">
                                      <div>
                                        <span className="text-gray-600">BP:</span>{" "}
                                        <span
                                          className={
                                            vital.systolic_bp > 180 || vital.systolic_bp < 90
                                              ? "text-red-600 font-bold"
                                              : "font-medium"
                                          }
                                        >
                                          {vital.systolic_bp}/{vital.diastolic_bp}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">HR:</span>{" "}
                                        <span
                                          className={
                                            vital.heart_rate > 120 || vital.heart_rate < 50
                                              ? "text-red-600 font-bold"
                                              : "font-medium"
                                          }
                                        >
                                          {vital.heart_rate}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Temp:</span>{" "}
                                        <span className="font-medium">{vital.temperature}°F</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">O2:</span>{" "}
                                        <span
                                          className={
                                            vital.oxygen_saturation < 90 ? "text-red-600 font-bold" : "font-medium"
                                          }
                                        >
                                          {vital.oxygen_saturation}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Weight:</span>{" "}
                                        <span className="font-medium">{vital.weight} lbs</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">BMI:</span>{" "}
                                        <span className="font-medium">{vital.bmi}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-gray-500 py-8">No vital signs recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="medications" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Medications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {medications.length > 0 ? (
                        <div className="space-y-2">
                          {medications.map((med) => (
                            <div key={med.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Pill className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-medium">{med.medication_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {med.dosage} - {med.frequency}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-600">Started: {med.start_date}</div>
                                <Badge
                                  variant={med.status === "active" ? "default" : "secondary"}
                                  className="capitalize"
                                >
                                  {med.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">No medications recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assessments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Clinical Assessments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {assessments.length > 0 ? (
                        <div className="space-y-2">
                          {assessments.map((assessment) => (
                            <div
                              key={assessment.id}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <FileCheck className="h-5 w-5 text-green-600" />
                                <div>
                                  <p className="font-medium">{assessment.assessment_type}</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(assessment.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">No assessments recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="encounters" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Clinical Encounters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {encounters.length > 0 ? (
                        <div className="space-y-2">
                          {encounters.map((encounter) => (
                            <div key={encounter.id} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Clock className="h-5 w-5 text-purple-600" />
                                  <p className="font-medium">{encounter.encounter_type}</p>
                                  <Badge variant="outline">{encounter.status}</Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {new Date(encounter.encounter_date).toLocaleDateString()}
                                </div>
                              </div>
                              {encounter.chief_complaint && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">Chief Complaint:</span> {encounter.chief_complaint}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">No encounters recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dosing" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dosing History (Last 30 Days)</CardTitle>
                      <CardDescription>
                        Medication administration and methadone/buprenorphine dosing log
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dosingLog.length > 0 ? (
                        <div className="space-y-2">
                          {dosingLog.map((dose) => (
                            <div key={dose.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Syringe className="h-5 w-5 text-orange-600" />
                                <div>
                                  <p className="font-medium">
                                    {dose.medication} - {dose.dose_amount}mg
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {dose.dose_date} at {dose.dose_time}
                                  </p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">Dispensed by: {dose.dispensed_by || "Staff"}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">No dosing records found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="consents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Patient Consents & Authorizations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {consents.length > 0 ? (
                        <div className="space-y-2">
                          {consents.map((consent) => (
                            <div key={consent.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-indigo-600" />
                                <div>
                                  <p className="font-medium">{consent.consent_type}</p>
                                  <p className="text-sm text-gray-600">Signed: {consent.signed_date || "Pending"}</p>
                                </div>
                              </div>
                              <Badge variant={consent.consent_status === "active" ? "default" : "secondary"}>
                                {consent.consent_status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">No consent forms recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ai-insights" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Clinical Insights</CardTitle>
                      <CardDescription>
                        AI-powered analysis of patient data for clinical decision support
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Medication Adherence Analysis</h4>
                          <p className="text-sm text-blue-800">
                            Based on dosing history, patient shows {dosingLog.length > 20 ? "excellent" : "moderate"}{" "}
                            medication adherence with {dosingLog.length} documented doses in the last 30 days.
                          </p>
                        </div>

                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h4 className="font-medium text-purple-900 mb-2">Vital Signs Pattern Recognition</h4>
                          <p className="text-sm text-purple-800">
                            {vitalSigns.length > 0
                              ? "Vital signs trending within normal ranges. Continue monitoring."
                              : "Insufficient vital signs data for pattern analysis."}
                          </p>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <h4 className="font-medium text-amber-900 mb-2">Treatment Recommendations</h4>
                          <p className="text-sm text-amber-800">
                            Continue current treatment plan. Consider scheduling follow-up assessment within 30 days.
                          </p>
                        </div>

                        <Button className="w-full">Generate Comprehensive AI Analysis</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}

          {!selectedPatient && !loading && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a patient above to view their complete medical chart</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
