"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  QrCode,
  Search,
  Printer,
  CheckCircle2,
  AlertTriangle,
  User,
  Clock,
  Camera,
  Package,
  Scan,
  FileText,
  Download,
  Home,
  RefreshCw,
  MapPin,
  Fingerprint,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
}

interface PatientForDispensing {
  id: string
  name: string
  dob: string
  takehome_level: number
  medication: string
  dose: string
  last_dose: string | null
  next_pickup: string
  bottles_due: number
  home_verified: boolean
  biometric_enrolled: boolean
  compliance_score: number
  alerts: string[]
  home_address?: any
  biometric?: any
}

interface RecentDispensing {
  id: string
  patient_name: string
  time: string
  bottles: number
  medication: string
  nurse: string
  status: string
}

export default function TakeHomeBottlesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<PatientForDispensing | null>(null)
  const [showDispenseDialog, setShowDispenseDialog] = useState(false)
  const [bottlesToDispense, setBottlesToDispense] = useState<number[]>([])
  const [generatedQRCodes, setGeneratedQRCodes] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [dispensingComplete, setDispensingComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Quick Actions Dialogs
  const [showRegisterAddressDialog, setShowRegisterAddressDialog] = useState(false)
  const [showEnrollBiometricDialog, setShowEnrollBiometricDialog] = useState(false)
  const [showScanReturnDialog, setShowScanReturnDialog] = useState(false)
  const [showDispensingLogDialog, setShowDispensingLogDialog] = useState(false)

  // Form States
  const [addressPatientId, setAddressPatientId] = useState("")
  const [addressForm, setAddressForm] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    latitude: "",
    longitude: "",
    geofence_radius_feet: "500",
    verification_method: "home_visit",
  })

  const [biometricPatientId, setBiometricPatientId] = useState("")
  const [biometricForm, setBiometricForm] = useState({
    enrollment_location: "clinic",
    consent_signed: false,
  })

  const [returnBottleUid, setReturnBottleUid] = useState("")
  const [returnNotes, setReturnNotes] = useState("")

  // Data states
  const [patientsForDispensing, setPatientsForDispensing] = useState<PatientForDispensing[]>([])
  const [recentDispensing, setRecentDispensing] = useState<RecentDispensing[]>([])
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [stats, setStats] = useState({
    pendingPickups: 0,
    dispensedToday: 0,
    enrollmentIssues: 0,
    bottlesGenerated: 0,
  })

  const supabase = createBrowserClient()

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch all patients
      const { data: patients, error: patientsError } = await supabase.from("patients").select("*").order("last_name")

      if (patientsError) throw patientsError
      setAllPatients(patients || [])

      // Fetch OTP admissions with patient info
      const { data: admissions, error: admissionsError } = await supabase
        .from("otp_admissions")
        .select(`
          *,
          patients:patient_id (id, first_name, last_name, date_of_birth)
        `)
        .eq("status", "active")

      if (admissionsError) throw admissionsError

      // Fetch home addresses
      const { data: homeAddresses, error: addressError } = await supabase
        .from("patient_home_addresses")
        .select("*")
        .eq("is_primary", true)
        .eq("is_verified", true)

      // Fetch biometric enrollments
      const { data: biometrics, error: biometricError } = await supabase
        .from("patient_biometric_enrollment")
        .select("*")
        .eq("is_active", true)

      // Fetch diversion risk scores
      const { data: riskScores, error: riskError } = await supabase
        .from("patient_diversion_risk_scores")
        .select("*")
        .order("assessment_date", { ascending: false })

      // Fetch recent dispensing logs
      const { data: dispensingLogs, error: dispensingError } = await supabase
        .from("dosing_log")
        .select(`
          *,
          patients:patient_id (first_name, last_name),
          dispensed_by_staff:dispensed_by (first_name, last_name)
        `)
        .gte("dose_date", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(10)

      // Fetch QR codes generated today
      const { data: qrCodes, error: qrError } = await supabase
        .from("takehome_bottle_qr_codes")
        .select("*")
        .gte("dispensed_at", new Date().toISOString().split("T")[0])

      // Build patients for dispensing list
      const patientsWithStatus: PatientForDispensing[] = (admissions || []).map((admission: any) => {
        const patient = admission.patients
        const homeAddress = (homeAddresses || []).find((h: any) => h.patient_id === admission.patient_id)
        const biometric = (biometrics || []).find((b: any) => b.patient_id === admission.patient_id)
        const riskScore = (riskScores || []).find((r: any) => r.patient_id === admission.patient_id)

        const alerts: string[] = []
        if (!homeAddress) alerts.push("Home address not registered")
        if (!biometric) alerts.push("Biometric enrollment required")

        return {
          id: admission.patient_id,
          name: patient ? `${patient.first_name} ${patient.last_name}` : "Unknown",
          dob: patient?.date_of_birth || "",
          takehome_level: 7, // Default, could be calculated from compliance
          medication: admission.medication || "Methadone",
          dose: `${admission.initial_dose || 0}mg`,
          last_dose: null,
          next_pickup: new Date().toISOString().split("T")[0],
          bottles_due: 7, // Default based on takehome level
          home_verified: !!homeAddress,
          biometric_enrolled: !!biometric,
          compliance_score: riskScore?.compliance_score || 85,
          alerts,
          home_address: homeAddress,
          biometric,
        }
      })

      setPatientsForDispensing(patientsWithStatus)

      // Build recent dispensing list
      const recentList: RecentDispensing[] = (dispensingLogs || []).map((log: any) => ({
        id: log.id,
        patient_name: log.patients ? `${log.patients.first_name} ${log.patients.last_name}` : "Unknown",
        time: new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        bottles: 1,
        medication: `${log.medication} ${log.dose_amount}mg`,
        nurse: log.dispensed_by_staff
          ? `${log.dispensed_by_staff.first_name} ${log.dispensed_by_staff.last_name}`
          : "Staff",
        status: "complete",
      }))

      setRecentDispensing(recentList)

      // Calculate stats
      const enrollmentIssues = patientsWithStatus.filter((p) => !p.home_verified || !p.biometric_enrolled).length

      setStats({
        pendingPickups: patientsWithStatus.length,
        dispensedToday: dispensingLogs?.length || 0,
        enrollmentIssues,
        bottlesGenerated: qrCodes?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSelectPatient = (patient: PatientForDispensing) => {
    setSelectedPatient(patient)
    setBottlesToDispense(Array.from({ length: patient.bottles_due }, (_, i) => i + 1))
    setGeneratedQRCodes([])
    setDispensingComplete(false)
    setShowDispenseDialog(true)
  }

  const handleGenerateQRCodes = async () => {
    if (!selectedPatient) return

    setIsGenerating(true)

    try {
      const qrCodes = []
      const now = Date.now()

      for (let i = 0; i < bottlesToDispense.length; i++) {
        const bottleNum = bottlesToDispense[i]
        const bottleId = `BTL-${now}-${String(bottleNum).padStart(3, "0")}`
        const qrData = `MASE|${selectedPatient.id}|${selectedPatient.medication}|${selectedPatient.dose}|${bottleNum}|${now}`
        const expectedDate = new Date(Date.now() + (bottleNum - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

        // Insert QR code into database
        const { data, error } = await supabase
          .from("takehome_bottle_qr_codes")
          .insert({
            bottle_id: bottleId,
            patient_id: selectedPatient.id,
            qr_code_data: qrData,
            medication_name: selectedPatient.medication,
            dose_amount: Number.parseFloat(selectedPatient.dose.replace("mg", "")),
            dose_unit: "mg",
            bottle_number: bottleNum,
            total_bottles: bottlesToDispense.length,
            dispense_date: new Date().toISOString().split("T")[0],
            scheduled_consume_date: expectedDate,
            expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            dispensed_by: null, // Would be current user ID
            dispensed_at: new Date().toISOString(),
            status: "dispensed",
          })
          .select()
          .single()

        if (error) throw error

        qrCodes.push({
          bottle_id: bottleId,
          bottle_number: bottleNum,
          qr_data: qrData,
          expected_date: expectedDate,
          db_id: data.id,
        })
      }

      setGeneratedQRCodes(qrCodes)
      toast.success(`${qrCodes.length} QR codes generated successfully`)
    } catch (error) {
      console.error("Failed to generate QR codes:", error)
      toast.error("Failed to generate QR codes")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCompleteDispensing = async () => {
    try {
      // Record in dosing log
      await supabase.from("dosing_log").insert({
        patient_id: selectedPatient?.id,
        medication: selectedPatient?.medication,
        dose_amount: Number.parseFloat(selectedPatient?.dose.replace("mg", "") || "0"),
        dose_date: new Date().toISOString().split("T")[0],
        dose_time: new Date().toTimeString().split(" ")[0],
        notes: `Take-home dispensing: ${generatedQRCodes.length} bottles`,
      })

      setDispensingComplete(true)
      toast.success("Dispensing completed successfully")
      fetchData() // Refresh data
    } catch (error) {
      console.error("Failed to record dispensing:", error)
      toast.error("Failed to complete dispensing")
    }
  }

  const handlePrintLabels = () => {
    window.print()
  }

  const handleRegisterAddress = async () => {
    if (!addressPatientId) {
      toast.error("Please select a patient")
      return
    }

    try {
      const { error } = await supabase.from("patient_home_addresses").insert({
        patient_id: addressPatientId,
        address_line1: addressForm.address_line1,
        address_line2: addressForm.address_line2 || null,
        city: addressForm.city,
        state: addressForm.state,
        zip_code: addressForm.zip_code,
        latitude: Number.parseFloat(addressForm.latitude) || 0,
        longitude: Number.parseFloat(addressForm.longitude) || 0,
        geofence_radius_feet: Number.parseInt(addressForm.geofence_radius_feet),
        verification_method: addressForm.verification_method,
        is_verified: true,
        verified_at: new Date().toISOString(),
        is_primary: true,
        effective_date: new Date().toISOString().split("T")[0],
      })

      if (error) throw error

      toast.success("Home address registered successfully")
      setShowRegisterAddressDialog(false)
      setAddressPatientId("")
      setAddressForm({
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        zip_code: "",
        latitude: "",
        longitude: "",
        geofence_radius_feet: "500",
        verification_method: "home_visit",
      })
      fetchData()
    } catch (error) {
      console.error("Failed to register address:", error)
      toast.error("Failed to register address")
    }
  }

  const handleEnrollBiometric = async () => {
    if (!biometricPatientId) {
      toast.error("Please select a patient")
      return
    }

    if (!biometricForm.consent_signed) {
      toast.error("Patient consent is required")
      return
    }

    try {
      const { error } = await supabase.from("patient_biometric_enrollment").insert({
        patient_id: biometricPatientId,
        enrollment_location: biometricForm.enrollment_location,
        consent_signed: true,
        consent_signed_at: new Date().toISOString(),
        facial_enrolled_at: new Date().toISOString(),
        is_active: true,
        total_verifications: 0,
        failed_verifications: 0,
      })

      if (error) throw error

      toast.success("Biometric enrollment completed successfully")
      setShowEnrollBiometricDialog(false)
      setBiometricPatientId("")
      setBiometricForm({
        enrollment_location: "clinic",
        consent_signed: false,
      })
      fetchData()
    } catch (error) {
      console.error("Failed to enroll biometrics:", error)
      toast.error("Failed to enroll biometrics")
    }
  }

  const handleScanReturn = async () => {
    if (!returnBottleUid) {
      toast.error("Please enter bottle UID")
      return
    }

    try {
      // Find the bottle
      const { data: bottle, error: findError } = await supabase
        .from("takehome_bottle_qr_codes")
        .select("*")
        .eq("qr_code_data", returnBottleUid)
        .single()

      if (findError || !bottle) {
        toast.error("Bottle not found")
        return
      }

      // Update bottle status
      const { error } = await supabase
        .from("takehome_bottle_qr_codes")
        .update({
          status: "returned",
          returned_at: new Date().toISOString(),
        })
        .eq("id", bottle.id)

      if (error) throw error

      toast.success("Bottle return recorded successfully")
      setShowScanReturnDialog(false)
      setReturnBottleUid("")
      setReturnNotes("")
      fetchData()
    } catch (error) {
      console.error("Failed to record return:", error)
      toast.error("Failed to record bottle return")
    }
  }

  const filteredPatients = patientsForDispensing.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Take-Home Bottle Dispensing</h1>
            <p className="text-slate-500">Generate QR codes and dispense take-home medications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setShowDispensingLogDialog(true)}>
              <FileText className="h-4 w-4" />
              Dispensing Log
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-100">
                  <Package className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pending Pickups</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-800">{stats.pendingPickups}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Dispensed Today</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-800">{stats.dispensedToday}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Enrollment Issues</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-amber-600">{stats.enrollmentIssues}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <QrCode className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Bottles Generated</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-800">{stats.bottlesGenerated}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Patient Selection */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-cyan-600" />
                  Patients Due for Take-Home
                </CardTitle>
                <CardDescription>Select a patient to generate QR-coded bottles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No patients found with active take-home orders</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Medication</TableHead>
                        <TableHead>TH Level</TableHead>
                        <TableHead>Bottles Due</TableHead>
                        <TableHead>Compliance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-gray-500">{patient.id ? patient.id.slice(0, 8) : "N/A"}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{patient.medication}</p>
                              <p className="text-sm text-gray-500">{patient.dose}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{patient.takehome_level} days</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-lg">{patient.bottles_due}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    patient.compliance_score >= 95
                                      ? "#22c55e"
                                      : patient.compliance_score >= 85
                                        ? "#eab308"
                                        : "#ef4444",
                                }}
                              />
                              <span>{patient.compliance_score}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {patient.home_verified ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  <Home className="h-3 w-3 mr-1" />
                                  GPS
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  <Home className="h-3 w-3 mr-1" />
                                  No GPS
                                </Badge>
                              )}
                              {patient.biometric_enrolled ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  <Camera className="h-3 w-3 mr-1" />
                                  Bio
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  <Camera className="h-3 w-3 mr-1" />
                                  No Bio
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleSelectPatient(patient)}
                              className="bg-cyan-600 hover:bg-cyan-700"
                              disabled={!patient.home_verified || !patient.biometric_enrolled}
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              Dispense
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Dispensing */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-600" />
                  Recent Dispensing
                </CardTitle>
                <CardDescription>Today's take-home activity</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : recentDispensing.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No dispensing activity today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentDispensing.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{item.patient_name}</p>
                          <Badge
                            variant={item.status === "complete" ? "default" : "secondary"}
                            className={item.status === "complete" ? "bg-green-100 text-green-800" : ""}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>{item.medication}</p>
                          <p>
                            {item.bottles} bottles at {item.time}
                          </p>
                          <p>By: {item.nurse}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => setShowRegisterAddressDialog(true)}
                >
                  <Home className="h-4 w-4" />
                  Register Home Address
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => setShowEnrollBiometricDialog(true)}
                >
                  <Camera className="h-4 w-4" />
                  Enroll Biometrics
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => setShowScanReturnDialog(true)}
                >
                  <Scan className="h-4 w-4" />
                  Scan Returned Bottle
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dispense Dialog */}
        <Dialog open={showDispenseDialog} onOpenChange={setShowDispenseDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-cyan-600" />
                Generate Take-Home Bottles
              </DialogTitle>
              <DialogDescription>
                Generate QR-coded labels for {selectedPatient?.name}'s take-home medication
              </DialogDescription>
            </DialogHeader>

            {selectedPatient && (
              <div className="space-y-4">
                {/* Patient Info */}
                <div className="p-4 rounded-lg bg-slate-100">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Patient</p>
                      <p className="font-bold">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Medication</p>
                      <p className="font-bold">
                        {selectedPatient.medication} {selectedPatient.dose}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Take-Home Level</p>
                      <p className="font-bold">{selectedPatient.takehome_level} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bottles to Generate</p>
                      <p className="font-bold text-xl text-cyan-600">{bottlesToDispense.length}</p>
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Home Address Verified</p>
                        <p className="text-sm text-green-600">GPS coordinates registered</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Biometrics Enrolled</p>
                        <p className="text-sm text-green-600">Facial recognition active</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generated QR Codes */}
                {generatedQRCodes.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-cyan-600" />
                      Generated QR Codes ({generatedQRCodes.length})
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {generatedQRCodes.map((qr) => (
                        <div key={qr.bottle_id} className="p-2 border rounded text-center bg-slate-50">
                          <div className="w-12 h-12 mx-auto mb-1 border-2 border-slate-300 rounded flex items-center justify-center">
                            <QrCode className="h-8 w-8 text-slate-600" />
                          </div>
                          <p className="text-xs font-medium">Bottle #{qr.bottle_number}</p>
                          <p className="text-xs text-gray-500">{qr.expected_date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {dispensingComplete && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Dispensing Complete</AlertTitle>
                    <AlertDescription className="text-green-600">
                      {generatedQRCodes.length} bottles have been recorded. Print labels and attach to bottles.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter>
              {!dispensingComplete ? (
                <>
                  {generatedQRCodes.length === 0 ? (
                    <Button
                      onClick={handleGenerateQRCodes}
                      disabled={isGenerating}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          Generate QR Codes
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handlePrintLabels}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Labels
                      </Button>
                      <Button onClick={handleCompleteDispensing} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Dispensing
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button onClick={() => setShowDispenseDialog(false)}>Close</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Register Home Address Dialog */}
        <Dialog open={showRegisterAddressDialog} onOpenChange={setShowRegisterAddressDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-600" />
                Register Home Address
              </DialogTitle>
              <DialogDescription>Register patient's home address for GPS geofencing verification</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Select Patient</Label>
                <Select value={addressPatientId} onValueChange={setAddressPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPatients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Address Line 1</Label>
                <Input
                  value={addressForm.address_line1}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <Label>Address Line 2</Label>
                <Input
                  value={addressForm.address_line2}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                  placeholder="Apt, Suite, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>City</Label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label>ZIP Code</Label>
                  <Input
                    value={addressForm.zip_code}
                    onChange={(e) => setAddressForm({ ...addressForm, zip_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={addressForm.latitude}
                    onChange={(e) => setAddressForm({ ...addressForm, latitude: e.target.value })}
                    placeholder="42.123456"
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={addressForm.longitude}
                    onChange={(e) => setAddressForm({ ...addressForm, longitude: e.target.value })}
                    placeholder="-83.123456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Geofence Radius (feet)</Label>
                  <Input
                    type="number"
                    value={addressForm.geofence_radius_feet}
                    onChange={(e) => setAddressForm({ ...addressForm, geofence_radius_feet: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Verification Method</Label>
                  <Select
                    value={addressForm.verification_method}
                    onValueChange={(v) => setAddressForm({ ...addressForm, verification_method: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_visit">Home Visit</SelectItem>
                      <SelectItem value="utility_bill">Utility Bill</SelectItem>
                      <SelectItem value="id_verification">ID Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRegisterAddressDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRegisterAddress} className="bg-cyan-600 hover:bg-cyan-700">
                <MapPin className="h-4 w-4 mr-2" />
                Register Address
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enroll Biometrics Dialog */}
        <Dialog open={showEnrollBiometricDialog} onOpenChange={setShowEnrollBiometricDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-cyan-600" />
                Enroll Biometrics
              </DialogTitle>
              <DialogDescription>Enroll patient's facial biometrics for take-home dose verification</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Select Patient</Label>
                <Select value={biometricPatientId} onValueChange={setBiometricPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPatients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Enrollment Location</Label>
                <Select
                  value={biometricForm.enrollment_location}
                  onValueChange={(v) => setBiometricForm({ ...biometricForm, enrollment_location: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinic">Clinic</SelectItem>
                    <SelectItem value="home_visit">Home Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <Camera className="h-12 w-12 text-slate-400" />
                  <div>
                    <p className="font-medium">Facial Recognition Capture</p>
                    <p className="text-sm text-slate-500">
                      Position patient's face in frame and capture reference photo
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3 bg-transparent">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={biometricForm.consent_signed}
                  onChange={(e) => setBiometricForm({ ...biometricForm, consent_signed: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="consent" className="text-sm">
                  Patient has signed biometric consent form and agrees to facial recognition verification for take-home
                  dose compliance
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEnrollBiometricDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEnrollBiometric} className="bg-cyan-600 hover:bg-cyan-700">
                <Fingerprint className="h-4 w-4 mr-2" />
                Complete Enrollment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Scan Return Dialog */}
        <Dialog open={showScanReturnDialog} onOpenChange={setShowScanReturnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-cyan-600" />
                Scan Returned Bottle
              </DialogTitle>
              <DialogDescription>Scan or enter the QR code from a returned take-home bottle</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Bottle QR Code / UID</Label>
                <Input
                  value={returnBottleUid}
                  onChange={(e) => setReturnBottleUid(e.target.value)}
                  placeholder="Scan or enter bottle QR code"
                />
              </div>

              <div className="p-4 border-2 border-dashed rounded-lg text-center">
                <Scan className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Position QR code in front of scanner</p>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Any notes about the returned bottle..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScanReturnDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleScanReturn} className="bg-cyan-600 hover:bg-cyan-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Record Return
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dispensing Log Dialog */}
        <Dialog open={showDispensingLogDialog} onOpenChange={setShowDispensingLogDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-600" />
                Dispensing Log
              </DialogTitle>
              <DialogDescription>View all take-home dispensing activity</DialogDescription>
            </DialogHeader>

            <div className="max-h-96 overflow-y-auto">
              {recentDispensing.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No dispensing records found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Bottles</TableHead>
                      <TableHead>Nurse</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDispensing.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.time}</TableCell>
                        <TableCell>{item.patient_name}</TableCell>
                        <TableCell>{item.medication}</TableCell>
                        <TableCell>{item.bottles}</TableCell>
                        <TableCell>{item.nurse}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{item.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDispensingLogDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
