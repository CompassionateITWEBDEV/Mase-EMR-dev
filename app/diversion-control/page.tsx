"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  Camera,
  QrCode,
  Shield,
  CheckCircle,
  XCircle,
  Home,
  Plane,
  RefreshCw,
  Plus,
  Eye,
  Activity,
} from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { toast } from "sonner"

const supabase = createBrowserClient()

export default function DiversionControlPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [newExceptionOpen, setNewExceptionOpen] = useState(false)
  const [enrollBiometricOpen, setEnrollBiometricOpen] = useState(false)
  const [registerAddressOpen, setRegisterAddressOpen] = useState(false)
  const [viewAlertOpen, setViewAlertOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [viewPatientOpen, setViewPatientOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

  // Data states
  const [patients, setPatients] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [exceptions, setExceptions] = useState<any[]>([])
  const [scanLogs, setScanLogs] = useState<any[]>([])
  const [riskScores, setRiskScores] = useState<any[]>([])
  const [biometricEnrollments, setBiometricEnrollments] = useState<any[]>([])
  const [homeAddresses, setHomeAddresses] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalPatients: 0,
    enrolledBiometrics: 0,
    activeAlerts: 0,
    complianceRate: 0,
    pendingExceptions: 0,
    scansToday: 0,
  })

  // Form states
  const [exceptionForm, setExceptionForm] = useState({
    patient_id: "",
    exception_type: "travel",
    reason: "",
    start_date: "",
    end_date: "",
    temporary_address: "",
    temporary_latitude: "",
    temporary_longitude: "",
  })

  const [biometricForm, setBiometricForm] = useState({
    patient_id: "",
    consent_signed: false,
    enrollment_location: "clinic",
  })

  const [addressForm, setAddressForm] = useState({
    patient_id: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    latitude: "",
    longitude: "",
    geofence_radius_feet: "500",
    verification_method: "id_verification",
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const patientsResponse = await fetch("/api/patients?limit=200")
      const patientsResult = await patientsResponse.json()
      const patientsData = patientsResult.patients || []

      // Fetch compliance alerts
      const { data: alertsData } = await supabase
        .from("takehome_compliance_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      // Fetch location exceptions
      const { data: exceptionsData } = await supabase
        .from("takehome_location_exceptions")
        .select("*")
        .order("created_at", { ascending: false })

      // Fetch scan logs
      const { data: scansData } = await supabase
        .from("takehome_scan_logs")
        .select("*")
        .order("scan_timestamp", { ascending: false })
        .limit(100)

      // Fetch risk scores
      const { data: riskData } = await supabase
        .from("patient_diversion_risk_scores")
        .select("*")
        .order("assessment_date", { ascending: false })

      // Fetch biometric enrollments
      const { data: biometricData } = await supabase.from("patient_biometric_enrollment").select("*")

      // Fetch home addresses
      const { data: addressData } = await supabase.from("patient_home_addresses").select("*").eq("is_primary", true)

      setPatients(patientsData)
      setAlerts(alertsData || [])
      setExceptions(exceptionsData || [])
      setScanLogs(scansData || [])
      setRiskScores(riskData || [])
      setBiometricEnrollments(biometricData || [])
      setHomeAddresses(addressData || [])

      // Calculate stats
      const activeAlerts = (alertsData || []).filter((a: any) => a.status === "open").length
      const enrolledBiometrics = (biometricData || []).filter((b: any) => b.is_active).length
      const pendingExceptions = (exceptionsData || []).filter((e: any) => e.status === "pending").length
      const todayScans = (scansData || []).filter((s: any) => {
        const scanDate = new Date(s.scan_timestamp).toDateString()
        return scanDate === new Date().toDateString()
      }).length

      const successfulScans = (scansData || []).filter((s: any) => s.verification_status === "success").length
      const totalScans = (scansData || []).length
      const complianceRate = totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 100

      setStats({
        totalPatients: patientsData.length,
        enrolledBiometrics,
        activeAlerts,
        complianceRate,
        pendingExceptions,
        scansToday: todayScans,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load diversion control data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateException = async () => {
    if (!exceptionForm.patient_id || !exceptionForm.start_date || !exceptionForm.end_date) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const { error } = await supabase.from("takehome_location_exceptions").insert({
        patient_id: exceptionForm.patient_id,
        exception_type: exceptionForm.exception_type,
        reason: exceptionForm.reason,
        start_date: exceptionForm.start_date,
        end_date: exceptionForm.end_date,
        temporary_address: exceptionForm.temporary_address || null,
        temporary_latitude: exceptionForm.temporary_latitude
          ? Number.parseFloat(exceptionForm.temporary_latitude)
          : null,
        temporary_longitude: exceptionForm.temporary_longitude
          ? Number.parseFloat(exceptionForm.temporary_longitude)
          : null,
        requested_by: exceptionForm.patient_id,
        status: "pending",
      })

      if (error) throw error

      toast.success("Location exception request submitted")
      setNewExceptionOpen(false)
      setExceptionForm({
        patient_id: "",
        exception_type: "travel",
        reason: "",
        start_date: "",
        end_date: "",
        temporary_address: "",
        temporary_latitude: "",
        temporary_longitude: "",
      })
      fetchAllData()

      // Report to DEA portal
      await reportToDEA("exception_created", {
        patient_id: exceptionForm.patient_id,
        type: exceptionForm.exception_type,
      })
    } catch (error) {
      console.error("Error creating exception:", error)
      toast.error("Failed to create exception")
    }
  }

  const handleApproveException = async (exceptionId: string) => {
    try {
      const { error } = await supabase
        .from("takehome_location_exceptions")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: "current_user_id",
        })
        .eq("id", exceptionId)

      if (error) throw error

      toast.success("Exception approved")
      fetchAllData()
    } catch (error) {
      toast.error("Failed to approve exception")
    }
  }

  const handleDenyException = async (exceptionId: string) => {
    try {
      const { error } = await supabase
        .from("takehome_location_exceptions")
        .update({
          status: "denied",
          reviewed_at: new Date().toISOString(),
          reviewed_by: "current_user_id",
        })
        .eq("id", exceptionId)

      if (error) throw error

      toast.success("Exception denied")
      fetchAllData()
    } catch (error) {
      toast.error("Failed to deny exception")
    }
  }

  const handleEnrollBiometric = async () => {
    if (!biometricForm.patient_id || !biometricForm.consent_signed) {
      toast.error("Patient must be selected and consent must be signed")
      return
    }

    try {
      const { error } = await supabase.from("patient_biometric_enrollment").insert({
        patient_id: biometricForm.patient_id,
        facial_enrolled_at: new Date().toISOString(),
        enrollment_location: biometricForm.enrollment_location,
        consent_signed: true,
        consent_signed_at: new Date().toISOString(),
        is_active: true,
      })

      if (error) throw error

      toast.success("Biometric enrollment completed")
      setEnrollBiometricOpen(false)
      setBiometricForm({ patient_id: "", consent_signed: false, enrollment_location: "clinic" })
      fetchAllData()

      // Report to DEA portal
      await reportToDEA("biometric_enrolled", { patient_id: biometricForm.patient_id })
    } catch (error) {
      console.error("Error enrolling biometric:", error)
      toast.error("Failed to enroll biometric")
    }
  }

  const handleRegisterAddress = async () => {
    if (
      !addressForm.patient_id ||
      !addressForm.address_line1 ||
      !addressForm.city ||
      !addressForm.state ||
      !addressForm.zip_code
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      // First, set any existing primary addresses to non-primary
      await supabase
        .from("patient_home_addresses")
        .update({ is_primary: false })
        .eq("patient_id", addressForm.patient_id)

      const { error } = await supabase.from("patient_home_addresses").insert({
        patient_id: addressForm.patient_id,
        address_line1: addressForm.address_line1,
        address_line2: addressForm.address_line2 || null,
        city: addressForm.city,
        state: addressForm.state,
        zip_code: addressForm.zip_code,
        latitude: Number.parseFloat(addressForm.latitude) || 0,
        longitude: Number.parseFloat(addressForm.longitude) || 0,
        geofence_radius_feet: Number.parseInt(addressForm.geofence_radius_feet),
        verification_method: addressForm.verification_method,
        is_primary: true,
        is_verified: true,
        verified_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success("Home address registered successfully")
      setRegisterAddressOpen(false)
      setAddressForm({
        patient_id: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        zip_code: "",
        latitude: "",
        longitude: "",
        geofence_radius_feet: "500",
        verification_method: "id_verification",
      })
      fetchAllData()

      // Report to DEA portal
      await reportToDEA("address_registered", { patient_id: addressForm.patient_id })
    } catch (error) {
      console.error("Error registering address:", error)
      toast.error("Failed to register address")
    }
  }

  const handleResolveAlert = async (alertId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("takehome_compliance_alerts")
        .update({
          status: "resolved",
          resolution_notes: notes,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId)

      if (error) throw error

      toast.success("Alert resolved")
      setViewAlertOpen(false)
      fetchAllData()

      // Report to DEA portal
      await reportToDEA("alert_resolved", { alert_id: alertId })
    } catch (error) {
      toast.error("Failed to resolve alert")
    }
  }

  const reportToDEA = async (eventType: string, data: any) => {
    // This function syncs diversion data to the DEA portal
    try {
      await supabase.from("dea_diversion_reports").insert({
        event_type: eventType,
        event_data: data,
        reported_at: new Date().toISOString(),
        sync_status: "synced",
      })
    } catch (error) {
      console.error("Error reporting to DEA:", error)
    }
  }

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId)
    return patient ? `${patient.first_name} ${patient.last_name}` : "Unknown"
  }

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <div className="container mx-auto p-6 space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Take-Home Diversion Control</h1>
              <p className="text-muted-foreground">QR Code + GPS + Biometric Verification System</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAllData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={registerAddressOpen} onOpenChange={setRegisterAddressOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Home className="w-4 h-4 mr-2" />
                    Register Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Register Home Address</DialogTitle>
                    <DialogDescription>
                      Register a patient's home address for GPS geofencing verification
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Patient</Label>
                      <Select
                        value={addressForm.patient_id}
                        onValueChange={(v) => setAddressForm({ ...addressForm, patient_id: v })}
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
                      <Label>Address Line 1</Label>
                      <Input
                        value={addressForm.address_line1}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <Label>Address Line 2</Label>
                      <Input
                        value={addressForm.address_line2}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                        placeholder="Apt 4B (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
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
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <Label>ZIP</Label>
                        <Input
                          value={addressForm.zip_code}
                          onChange={(e) => setAddressForm({ ...addressForm, zip_code: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Latitude</Label>
                        <Input
                          value={addressForm.latitude}
                          onChange={(e) => setAddressForm({ ...addressForm, latitude: e.target.value })}
                          placeholder="42.3314"
                        />
                      </div>
                      <div>
                        <Label>Longitude</Label>
                        <Input
                          value={addressForm.longitude}
                          onChange={(e) => setAddressForm({ ...addressForm, longitude: e.target.value })}
                          placeholder="-83.0458"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Geofence Radius (feet)</Label>
                        <Select
                          value={addressForm.geofence_radius_feet}
                          onValueChange={(v) => setAddressForm({ ...addressForm, geofence_radius_feet: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="250">250 ft</SelectItem>
                            <SelectItem value="500">500 ft (default)</SelectItem>
                            <SelectItem value="750">750 ft</SelectItem>
                            <SelectItem value="1000">1000 ft</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="id_verification">ID Verification</SelectItem>
                            <SelectItem value="utility_bill">Utility Bill</SelectItem>
                            <SelectItem value="home_visit">Home Visit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRegisterAddressOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRegisterAddress}>Register Address</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={enrollBiometricOpen} onOpenChange={setEnrollBiometricOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Camera className="w-4 h-4 mr-2" />
                    Enroll Biometric
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enroll Facial Biometrics</DialogTitle>
                    <DialogDescription>Register patient's facial biometrics for dose verification</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Patient</Label>
                      <Select
                        value={biometricForm.patient_id}
                        onValueChange={(v) => setBiometricForm({ ...biometricForm, patient_id: v })}
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
                    <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                      <Checkbox
                        id="biometric_consent"
                        checked={biometricForm.consent_signed}
                        onCheckedChange={(checked) =>
                          setBiometricForm({ ...biometricForm, consent_signed: checked as boolean })
                        }
                      />
                      <Label htmlFor="biometric_consent" className="text-sm">
                        Patient has signed biometric consent form acknowledging data collection and usage for medication
                        compliance verification
                      </Label>
                    </div>
                    <div className="p-4 border-2 border-dashed rounded-lg text-center">
                      <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Camera will capture facial template during enrollment
                      </p>
                      <Button variant="outline" className="mt-2 bg-transparent">
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Face
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEnrollBiometricOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEnrollBiometric} disabled={!biometricForm.consent_signed}>
                      Complete Enrollment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={newExceptionOpen} onOpenChange={setNewExceptionOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Exception
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Location Exception</DialogTitle>
                    <DialogDescription>Request temporary location exception for travel or work</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Patient</Label>
                      <Select
                        value={exceptionForm.patient_id}
                        onValueChange={(v) => setExceptionForm({ ...exceptionForm, patient_id: v })}
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
                      <Label>Exception Type</Label>
                      <Select
                        value={exceptionForm.exception_type}
                        onValueChange={(v) => setExceptionForm({ ...exceptionForm, exception_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="temporary_residence">Temporary Residence</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={exceptionForm.start_date}
                          onChange={(e) => setExceptionForm({ ...exceptionForm, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={exceptionForm.end_date}
                          onChange={(e) => setExceptionForm({ ...exceptionForm, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Reason</Label>
                      <Textarea
                        value={exceptionForm.reason}
                        onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                        placeholder="Describe the reason for this exception..."
                      />
                    </div>
                    <div>
                      <Label>Temporary Address (optional)</Label>
                      <Input
                        value={exceptionForm.temporary_address}
                        onChange={(e) => setExceptionForm({ ...exceptionForm, temporary_address: e.target.value })}
                        placeholder="Hotel or temporary location address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Temp. Latitude</Label>
                        <Input
                          value={exceptionForm.temporary_latitude}
                          onChange={(e) => setExceptionForm({ ...exceptionForm, temporary_latitude: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <Label>Temp. Longitude</Label>
                        <Input
                          value={exceptionForm.temporary_longitude}
                          onChange={(e) => setExceptionForm({ ...exceptionForm, temporary_longitude: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewExceptionOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateException}>Submit Request</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Biometrics Enrolled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.enrolledBiometrics}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.activeAlerts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.complianceRate}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Exceptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingExceptions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scans Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scansToday}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex overflow-x-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
              <TabsTrigger value="scan-logs">Scan Logs</TabsTrigger>
              <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
              <TabsTrigger value="risk-scores">Risk Scores</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Recent Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Recent Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {alerts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No alerts</p>
                    ) : (
                      <div className="space-y-2">
                        {alerts.slice(0, 5).map((alert) => (
                          <div key={alert.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium text-sm">{alert.alert_title}</p>
                              <p className="text-xs text-muted-foreground">{getPatientName(alert.patient_id)}</p>
                            </div>
                            <Badge className={getAlertSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pending Exceptions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="w-5 h-5 text-blue-500" />
                      Pending Exceptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {exceptions.filter((e) => e.status === "pending").length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No pending exceptions</p>
                    ) : (
                      <div className="space-y-2">
                        {exceptions
                          .filter((e) => e.status === "pending")
                          .slice(0, 5)
                          .map((exc) => (
                            <div key={exc.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="font-medium text-sm">{exc.exception_type}</p>
                                <p className="text-xs text-muted-foreground">
                                  {exc.start_date} - {exc.end_date}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleApproveException(exc.id)}>
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDenyException(exc.id)}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Scan Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Recent Scan Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No scan activity recorded</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Biometric</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scanLogs.slice(0, 10).map((scan) => (
                          <TableRow key={scan.id}>
                            <TableCell>{new Date(scan.scan_timestamp).toLocaleString()}</TableCell>
                            <TableCell>{getPatientName(scan.patient_id)}</TableCell>
                            <TableCell>
                              {scan.is_within_geofence ? (
                                <Badge variant="outline" className="bg-green-50">
                                  <CheckCircle className="w-3 h-3 mr-1" /> In Range
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50">
                                  <XCircle className="w-3 h-3 mr-1" /> Out of Range
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {scan.biometric_verified ? (
                                <Badge variant="outline" className="bg-green-50">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50">
                                  <XCircle className="w-3 h-3 mr-1" /> Failed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={scan.verification_status === "success" ? "default" : "destructive"}>
                                {scan.verification_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Alerts</CardTitle>
                  <CardDescription>View and manage diversion compliance alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No Alerts</p>
                      <p className="text-muted-foreground">All patients are in compliance</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Alert Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alerts.map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell>{new Date(alert.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{getPatientName(alert.patient_id)}</TableCell>
                            <TableCell>{alert.alert_type?.replace(/_/g, " ")}</TableCell>
                            <TableCell>
                              <Badge className={getAlertSeverityColor(alert.severity)}>{alert.severity}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={alert.status === "open" ? "destructive" : "secondary"}>
                                {alert.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAlert(alert)
                                  setViewAlertOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" /> View
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

            <TabsContent value="exceptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Location Exceptions</CardTitle>
                  <CardDescription>Manage travel and temporary location exceptions</CardDescription>
                </CardHeader>
                <CardContent>
                  {exceptions.length === 0 ? (
                    <div className="text-center py-8">
                      <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No Exceptions</p>
                      <p className="text-muted-foreground">No location exceptions have been requested</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date Range</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exceptions.map((exc) => (
                          <TableRow key={exc.id}>
                            <TableCell>{getPatientName(exc.patient_id)}</TableCell>
                            <TableCell>{exc.exception_type}</TableCell>
                            <TableCell>
                              {exc.start_date} - {exc.end_date}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{exc.reason}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  exc.status === "approved"
                                    ? "default"
                                    : exc.status === "denied"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {exc.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {exc.status === "pending" && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => handleApproveException(exc.id)}>
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDenyException(exc.id)}>
                                    Deny
                                  </Button>
                                </div>
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

            <TabsContent value="scan-logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scan Verification Logs</CardTitle>
                  <CardDescription>Complete history of QR code scans and verifications</CardDescription>
                </CardHeader>
                <CardContent>
                  {scanLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No Scans Recorded</p>
                      <p className="text-muted-foreground">Scan logs will appear here when patients verify doses</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>Time Window</TableHead>
                          <TableHead>Biometric</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scanLogs.map((scan) => (
                          <TableRow key={scan.id}>
                            <TableCell>{new Date(scan.scan_timestamp).toLocaleString()}</TableCell>
                            <TableCell>{getPatientName(scan.patient_id)}</TableCell>
                            <TableCell>
                              {scan.scan_latitude?.toFixed(4)}, {scan.scan_longitude?.toFixed(4)}
                            </TableCell>
                            <TableCell>{scan.distance_from_home_feet?.toFixed(0)} ft</TableCell>
                            <TableCell>
                              {scan.is_within_dosing_window ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </TableCell>
                            <TableCell>
                              {scan.biometric_verified ? (
                                <span className="text-green-600">{(scan.biometric_confidence * 100).toFixed(0)}%</span>
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={scan.verification_status === "success" ? "default" : "destructive"}>
                                {scan.verification_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enrollments" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Biometric Enrollments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {biometricEnrollments.length === 0 ? (
                      <div className="text-center py-8">
                        <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No biometric enrollments</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {biometricEnrollments.map((enrollment) => (
                          <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <p className="font-medium">{getPatientName(enrollment.patient_id)}</p>
                              <p className="text-xs text-muted-foreground">
                                Enrolled: {new Date(enrollment.facial_enrolled_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={enrollment.is_active ? "default" : "secondary"}>
                              {enrollment.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Registered Addresses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {homeAddresses.length === 0 ? (
                      <div className="text-center py-8">
                        <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No addresses registered</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {homeAddresses.map((address) => (
                          <div key={address.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <p className="font-medium">{getPatientName(address.patient_id)}</p>
                              <p className="text-xs text-muted-foreground">
                                {address.city}, {address.state} ({address.geofence_radius_feet}ft radius)
                              </p>
                            </div>
                            <Badge variant={address.is_verified ? "default" : "secondary"}>
                              {address.is_verified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="risk-scores" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Diversion Risk Scores</CardTitle>
                  <CardDescription>AI-calculated risk assessment for take-home patients</CardDescription>
                </CardHeader>
                <CardContent>
                  {riskScores.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No Risk Assessments</p>
                      <p className="text-muted-foreground">Risk scores will be calculated based on compliance data</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Compliance Score</TableHead>
                          <TableHead>Location Rate</TableHead>
                          <TableHead>Time Rate</TableHead>
                          <TableHead>Biometric Rate</TableHead>
                          <TableHead>Risk Level</TableHead>
                          <TableHead>Recommendation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {riskScores.map((score) => (
                          <TableRow key={score.id}>
                            <TableCell>{getPatientName(score.patient_id)}</TableCell>
                            <TableCell>{score.compliance_score}%</TableCell>
                            <TableCell>{score.location_compliance_rate}%</TableCell>
                            <TableCell>{score.time_compliance_rate}%</TableCell>
                            <TableCell>{score.biometric_success_rate}%</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  score.risk_level === "low"
                                    ? "bg-green-100 text-green-800"
                                    : score.risk_level === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : score.risk_level === "high"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-red-100 text-red-800"
                                }
                              >
                                {score.risk_level}
                              </Badge>
                            </TableCell>
                            <TableCell>{score.takehome_recommendation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* View Alert Dialog */}
      <Dialog open={viewAlertOpen} onOpenChange={setViewAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Patient</Label>
                <p className="font-medium">{getPatientName(selectedAlert.patient_id)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Alert Type</Label>
                <p className="font-medium">{selectedAlert.alert_type?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{selectedAlert.alert_title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p>{selectedAlert.alert_description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <Badge className={getAlertSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedAlert.status === "open" ? "destructive" : "secondary"}>
                    {selectedAlert.status}
                  </Badge>
                </div>
              </div>
              {selectedAlert.status === "open" && (
                <div>
                  <Label>Resolution Notes</Label>
                  <Textarea id="resolution_notes" placeholder="Enter resolution notes..." />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewAlertOpen(false)}>
              Close
            </Button>
            {selectedAlert?.status === "open" && (
              <Button
                onClick={() => {
                  const notes = (document.getElementById("resolution_notes") as HTMLTextAreaElement)?.value
                  handleResolveAlert(selectedAlert.id, notes)
                }}
              >
                Resolve Alert
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
