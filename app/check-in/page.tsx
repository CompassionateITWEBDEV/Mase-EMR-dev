"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  ArrowRight,
  Phone,
  QrCode,
  RefreshCw,
  Volume2,
  Bell,
  Timer,
  TrendingUp,
  UserPlus,
  Coffee,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

interface QueuedPatient {
  id: string
  patientId: string
  patientNumber: string
  firstName: string
  lastName: string
  checkInTime: string
  checkInMethod: "kiosk" | "mobile" | "staff" | "walk-in"
  queuePosition: number
  estimatedWaitMinutes: number
  status: "waiting" | "called" | "with-staff" | "completed" | "left" | "return-later"
  assignedTo?: string
  serviceType: "dosing" | "counseling" | "medical" | "intake" | "group" | "uds"
  priority: "normal" | "high" | "urgent"
  notes?: string
  returnTime?: string
  mobilePhone?: string
  notificationsSent: number
  lastNotification?: string
}

interface LobbyStats {
  totalWaiting: number
  averageWaitTime: number
  longestWaitTime: number
  patientsServedToday: number
  currentServiceRate: number
  estimatedClearTime: string
}

export default function CheckInPage() {
  const [queuedPatients, setQueuedPatients] = useState<QueuedPatient[]>([])
  const [stats, setStats] = useState<LobbyStats>({
    totalWaiting: 0,
    averageWaitTime: 0,
    longestWaitTime: 0,
    patientsServedToday: 0,
    currentServiceRate: 0,
    estimatedClearTime: "",
  })
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<QueuedPatient | null>(null)
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [showManualCheckIn, setShowManualCheckIn] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState<QueuedPatient | null>(null)
  const [patientBalance, setPatientBalance] = useState<number>(0)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [paymentReference, setPaymentReference] = useState<string>("")
  const [paymentNotes, setPaymentNotes] = useState<string>("")
  const [filterService, setFilterService] = useState<string>("all")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Manual check-in form
  const [manualPatientNumber, setManualPatientNumber] = useState("")
  const [manualServiceType, setManualServiceType] = useState<string>("dosing")

  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch("/api/check-in/queue")
      if (response.ok) {
        const data = await response.json()
        setQueuedPatients(data.queue || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Error fetching queue:", error)
      // Use mock data
      const mockQueue: QueuedPatient[] = [
        {
          id: "1",
          patientId: "p1",
          patientNumber: "1001",
          firstName: "John",
          lastName: "D.",
          checkInTime: new Date(Date.now() - 45 * 60000).toISOString(),
          checkInMethod: "mobile",
          queuePosition: 1,
          estimatedWaitMinutes: 5,
          status: "waiting",
          serviceType: "dosing",
          priority: "normal",
          notificationsSent: 0,
          mobilePhone: "555-0101",
        },
        {
          id: "2",
          patientId: "p2",
          patientNumber: "1042",
          firstName: "Maria",
          lastName: "S.",
          checkInTime: new Date(Date.now() - 35 * 60000).toISOString(),
          checkInMethod: "kiosk",
          queuePosition: 2,
          estimatedWaitMinutes: 12,
          status: "waiting",
          serviceType: "dosing",
          priority: "normal",
          notificationsSent: 0,
        },
        {
          id: "3",
          patientId: "p3",
          patientNumber: "1078",
          firstName: "Robert",
          lastName: "J.",
          checkInTime: new Date(Date.now() - 25 * 60000).toISOString(),
          queuePosition: 3,
          estimatedWaitMinutes: 18,
          status: "waiting",
          serviceType: "counseling",
          priority: "high",
          notes: "Weekly counseling session",
          notificationsSent: 1,
          mobilePhone: "555-0103",
        },
        {
          id: "4",
          patientId: "p4",
          patientNumber: "1156",
          firstName: "Sarah",
          lastName: "M.",
          checkInTime: new Date(Date.now() - 15 * 60000).toISOString(),
          queuePosition: 4,
          estimatedWaitMinutes: 25,
          status: "waiting",
          serviceType: "medical",
          priority: "urgent",
          notes: "Needs physician review - dose adjustment",
          notificationsSent: 0,
        },
        {
          id: "5",
          patientId: "p5",
          patientNumber: "1203",
          firstName: "Michael",
          lastName: "T.",
          checkInTime: new Date(Date.now() - 65 * 60000).toISOString(),
          queuePosition: 5,
          estimatedWaitMinutes: 32,
          status: "return-later",
          serviceType: "dosing",
          priority: "normal",
          returnTime: new Date(Date.now() + 30 * 60000).toISOString(),
          notificationsSent: 2,
          mobilePhone: "555-0105",
        },
        {
          id: "6",
          patientId: "p6",
          patientNumber: "1089",
          firstName: "Lisa",
          lastName: "K.",
          checkInTime: new Date(Date.now() - 10 * 60000).toISOString(),
          queuePosition: 6,
          estimatedWaitMinutes: 38,
          status: "with-staff",
          assignedTo: "Nurse Williams",
          serviceType: "uds",
          priority: "normal",
          notificationsSent: 1,
        },
      ]
      setQueuedPatients(mockQueue)
      setStats({
        totalWaiting: 5,
        averageWaitTime: 28,
        longestWaitTime: 65,
        patientsServedToday: 47,
        currentServiceRate: 8.5,
        estimatedClearTime: "10:45 AM",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
    const interval = autoRefresh ? setInterval(fetchQueue, 30000) : null
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchQueue])

  function getWaitTime(checkInTime: string): number {
    return Math.round((Date.now() - new Date(checkInTime).getTime()) / 60000)
  }

  function formatWaitTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  function getStatusBadge(status: QueuedPatient["status"]) {
    switch (status) {
      case "waiting":
        return <Badge style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>Waiting</Badge>
      case "called":
        return <Badge style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>Called</Badge>
      case "with-staff":
        return <Badge style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>With Staff</Badge>
      case "completed":
        return <Badge style={{ backgroundColor: "#e5e7eb", color: "#374151" }}>Completed</Badge>
      case "left":
        return <Badge style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>Left</Badge>
      case "return-later":
        return <Badge style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}>Return Later</Badge>
    }
  }

  function getPriorityStyle(priority: QueuedPatient["priority"]) {
    switch (priority) {
      case "urgent":
        return { borderLeft: "4px solid #dc2626" }
      case "high":
        return { borderLeft: "4px solid #f59e0b" }
      default:
        return { borderLeft: "4px solid #e5e7eb" }
    }
  }

  async function callPatient(patient: QueuedPatient) {
    setSelectedPatient(patient)
    setShowCallDialog(true)
  }

  async function confirmCallPatient(staffMember: string) {
    if (!selectedPatient) return
    try {
      await fetch("/api/check-in/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId: selectedPatient.id,
          staffMember,
          sendSMS: selectedPatient.mobilePhone ? true : false,
        }),
      })
      setQueuedPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatient.id ? { ...p, status: "called" as const, assignedTo: staffMember } : p,
        ),
      )
      if (soundEnabled) {
        // Play notification sound
        const audio = new Audio("/sounds/chime.mp3")
        audio.play().catch(() => {})
      }
    } catch (error) {
      console.log("[v0] Error calling patient:", error)
    }
    setShowCallDialog(false)
    setSelectedPatient(null)
  }

  async function markReturnLater(patient: QueuedPatient, returnMinutes: number) {
    try {
      const returnTime = new Date(Date.now() + returnMinutes * 60000).toISOString()
      await fetch("/api/check-in/return-later", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId: patient.id,
          returnTime,
          sendSMS: patient.mobilePhone ? true : false,
        }),
      })
      setQueuedPatients((prev) =>
        prev.map((p) => (p.id === patient.id ? { ...p, status: "return-later" as const, returnTime } : p)),
      )
    } catch (error) {
      console.log("[v0] Error marking return later:", error)
    }
    setShowReturnDialog(false)
    setSelectedPatient(null)
  }

  async function handleManualCheckIn() {
    if (!manualPatientNumber) return
    try {
      await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientNumber: manualPatientNumber,
          serviceType: manualServiceType,
          checkInMethod: "staff",
        }),
      })
      fetchQueue()
      setManualPatientNumber("")
      setShowManualCheckIn(false)
    } catch (error) {
      console.log("[v0] Error manual check-in:", error)
    }
  }

  async function openPaymentDialog(patient: QueuedPatient) {
    setSelectedPatientForPayment(patient)
    setShowPaymentDialog(true)

    // Fetch patient balance
    try {
      const response = await fetch(`/api/patient-payments?patient_id=${patient.patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatientBalance(data.patient?.account_balance || 0)
      }
    } catch (error) {
      console.log("[v0] Error fetching balance:", error)
    }
  }

  async function processPayment() {
    if (!selectedPatientForPayment || !paymentAmount) return

    try {
      const response = await fetch("/api/patient-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatientForPayment.patientId,
          amount_paid: Number.parseFloat(paymentAmount),
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          service_date: new Date().toISOString().split("T")[0],
          service_type: selectedPatientForPayment.serviceType,
          collected_by: "current-user-id", // Replace with actual user ID
          notes: paymentNotes,
        }),
      })

      if (response.ok) {
        alert("Payment processed successfully!")
        setShowPaymentDialog(false)
        setPaymentAmount("")
        setPaymentReference("")
        setPaymentNotes("")
        fetchQueue()
      }
    } catch (error) {
      console.log("[v0] Error processing payment:", error)
      alert("Error processing payment. Please try again.")
    }
  }

  const filteredPatients =
    filterService === "all" ? queuedPatients : queuedPatients.filter((p) => p.serviceType === filterService)

  const waitingPatients = filteredPatients.filter((p) => p.status === "waiting" || p.status === "called")
  const returnLaterPatients = filteredPatients.filter((p) => p.status === "return-later")

  if (loading) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "#f8fafc" }}>
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin" style={{ color: "#0891b2" }} />
              <span className="ml-2" style={{ color: "#64748b" }}>
                Loading check-in queue...
              </span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f8fafc" }}>
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader />
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
                Patient Check-In & Lobby Queue
              </h1>
              <p style={{ color: "#64748b" }}>Real-time queue management and patient tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <span className="text-sm" style={{ color: "#64748b" }}>
                  Auto-refresh
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                <Volume2 className="h-4 w-4" style={{ color: "#64748b" }} />
              </div>
              <Button variant="outline" onClick={() => fetchQueue()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowManualCheckIn(true)} style={{ backgroundColor: "#0891b2", color: "#fff" }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Manual Check-In
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      In Lobby
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "#1e293b" }}>
                      {stats.totalWaiting}
                    </p>
                  </div>
                  <Users className="h-8 w-8" style={{ color: "#0891b2" }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Avg Wait
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "#1e293b" }}>
                      {stats.averageWaitTime}m
                    </p>
                  </div>
                  <Clock className="h-8 w-8" style={{ color: "#f59e0b" }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Longest Wait
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: stats.longestWaitTime > 60 ? "#dc2626" : "#1e293b" }}
                    >
                      {formatWaitTime(stats.longestWaitTime)}
                    </p>
                  </div>
                  <AlertCircle
                    className="h-8 w-8"
                    style={{ color: stats.longestWaitTime > 60 ? "#dc2626" : "#64748b" }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Served Today
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "#1e293b" }}>
                      {stats.patientsServedToday}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8" style={{ color: "#10b981" }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Service Rate
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "#1e293b" }}>
                      {stats.currentServiceRate}/hr
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8" style={{ color: "#8b5cf6" }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Est. Clear
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#1e293b" }}>
                      {stats.estimatedClearTime}
                    </p>
                  </div>
                  <Timer className="h-8 w-8" style={{ color: "#64748b" }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="queue" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="queue">Live Queue ({waitingPatients.length})</TabsTrigger>
                <TabsTrigger value="return-later">Return Later ({returnLaterPatients.length})</TabsTrigger>
                <TabsTrigger value="display">Lobby Display</TabsTrigger>
              </TabsList>

              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="dosing">Dosing</SelectItem>
                  <SelectItem value="counseling">Counseling</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="intake">Intake</SelectItem>
                  <SelectItem value="group">Group Session</SelectItem>
                  <SelectItem value="uds">UDS Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Live Queue */}
            <TabsContent value="queue" className="space-y-3">
              {waitingPatients.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
                    <h3 className="text-lg font-medium" style={{ color: "#1e293b" }}>
                      No patients in queue
                    </h3>
                    <p style={{ color: "#64748b" }}>Patients will appear here when they check in</p>
                  </CardContent>
                </Card>
              ) : (
                waitingPatients.map((patient, index) => (
                  <Card key={patient.id} style={getPriorityStyle(patient.priority)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Position */}
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                            style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}
                          >
                            {index + 1}
                          </div>

                          {/* Patient Info */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg" style={{ color: "#1e293b" }}>
                                #{patient.patientNumber}
                              </span>
                              <span style={{ color: "#64748b" }}>
                                {patient.firstName} {patient.lastName}
                              </span>
                              {getStatusBadge(patient.status)}
                              {patient.priority === "urgent" && (
                                <Badge style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>URGENT</Badge>
                              )}
                              {patient.priority === "high" && (
                                <Badge style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>HIGH</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: "#64748b" }}>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Waiting: {formatWaitTime(getWaitTime(patient.checkInTime))}
                              </span>
                              <span>Service: {patient.serviceType}</span>
                              <span className="flex items-center gap-1">
                                {patient.checkInMethod === "mobile" && <Phone className="h-3 w-3" />}
                                {patient.checkInMethod === "kiosk" && <QrCode className="h-3 w-3" />}
                                {patient.checkInMethod}
                              </span>
                              {patient.assignedTo && <span>With: {patient.assignedTo}</span>}
                            </div>
                            {patient.notes && (
                              <p className="text-sm mt-1" style={{ color: "#f59e0b" }}>
                                Note: {patient.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {getWaitTime(patient.checkInTime) > 60 && (
                            <Badge style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Over 1 hour
                            </Badge>
                          )}

                          {patient.status === "waiting" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPatient(patient)
                                  setShowReturnDialog(true)
                                }}
                              >
                                <Coffee className="h-4 w-4 mr-1" />
                                Return Later
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => callPatient(patient)}
                                style={{ backgroundColor: "#10b981", color: "#fff" }}
                              >
                                <Bell className="h-4 w-4 mr-1" />
                                Call Patient
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPaymentDialog(patient)}
                                style={{ borderColor: "#10b981", color: "#10b981" }}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Payment
                              </Button>
                            </>
                          )}

                          {patient.status === "called" && (
                            <Button size="sm" style={{ backgroundColor: "#0891b2", color: "#fff" }}>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Mark Arrived
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Wait time progress bar */}
                      <div className="mt-3">
                        <Progress
                          value={Math.min((getWaitTime(patient.checkInTime) / 60) * 100, 100)}
                          className="h-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Return Later */}
            <TabsContent value="return-later" className="space-y-3">
              {returnLaterPatients.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Coffee className="h-12 w-12 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
                    <h3 className="text-lg font-medium" style={{ color: "#1e293b" }}>
                      No patients returning later
                    </h3>
                  </CardContent>
                </Card>
              ) : (
                returnLaterPatients.map((patient) => (
                  <Card key={patient.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}
                          >
                            <Coffee className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold" style={{ color: "#1e293b" }}>
                                #{patient.patientNumber}
                              </span>
                              <span style={{ color: "#64748b" }}>
                                {patient.firstName} {patient.lastName}
                              </span>
                            </div>
                            <div className="text-sm" style={{ color: "#64748b" }}>
                              Return time:{" "}
                              {patient.returnTime ? new Date(patient.returnTime).toLocaleTimeString() : "N/A"}
                              <span className="ml-4">
                                Original check-in: {formatWaitTime(getWaitTime(patient.checkInTime))} ago
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {patient.mobilePhone && (
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4 mr-1" />
                              Send Reminder
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              setQueuedPatients((prev) =>
                                prev.map((p) =>
                                  p.id === patient.id ? { ...p, status: "waiting" as const, returnTime: undefined } : p,
                                ),
                              )
                            }}
                            style={{ backgroundColor: "#10b981", color: "#fff" }}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Return to Queue
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Lobby Display (for TV/Monitor) */}
            <TabsContent value="display">
              <Card>
                <CardHeader style={{ backgroundColor: "#0891b2", color: "#fff" }}>
                  <CardTitle className="text-center text-2xl">Lobby Queue Display</CardTitle>
                  <CardDescription className="text-center" style={{ color: "#e0f2fe" }}>
                    Current wait time: ~{stats.averageWaitTime} minutes | {stats.totalWaiting} patients waiting
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Now Serving */}
                    <div>
                      <h3
                        className="text-xl font-semibold mb-4 text-center"
                        style={{ color: "#10b981", borderBottom: "2px solid #10b981", paddingBottom: "8px" }}
                      >
                        NOW SERVING
                      </h3>
                      {queuedPatients
                        .filter((p) => p.status === "called" || p.status === "with-staff")
                        .map((patient) => (
                          <div
                            key={patient.id}
                            className="p-4 rounded-lg mb-3 text-center"
                            style={{ backgroundColor: "#d1fae5" }}
                          >
                            <span className="text-4xl font-bold" style={{ color: "#065f46" }}>
                              #{patient.patientNumber}
                            </span>
                            <p style={{ color: "#047857" }}>{patient.assignedTo || "Please proceed to window"}</p>
                          </div>
                        ))}
                    </div>

                    {/* Waiting */}
                    <div>
                      <h3
                        className="text-xl font-semibold mb-4 text-center"
                        style={{ color: "#1e293b", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}
                      >
                        WAITING
                      </h3>
                      {waitingPatients
                        .filter((p) => p.status === "waiting")
                        .slice(0, 8)
                        .map((patient, index) => (
                          <div
                            key={patient.id}
                            className="p-3 rounded-lg mb-2 flex items-center justify-between"
                            style={{ backgroundColor: index === 0 ? "#fef3c7" : "#f1f5f9" }}
                          >
                            <span className="text-2xl font-semibold" style={{ color: "#1e293b" }}>
                              #{patient.patientNumber}
                            </span>
                            <span style={{ color: "#64748b" }}>~{patient.estimatedWaitMinutes}min</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Call Patient Dialog */}
          <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Call Patient #{selectedPatient?.patientNumber}</DialogTitle>
                <DialogDescription>
                  The patient will be notified to proceed to the service area
                  {selectedPatient?.mobilePhone && " (SMS will be sent)"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Assign to Staff Member</Label>
                  <Select defaultValue="Window 1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Window 1">Window 1</SelectItem>
                      <SelectItem value="Window 2">Window 2</SelectItem>
                      <SelectItem value="Window 3">Window 3</SelectItem>
                      <SelectItem value="Nurse Williams">Nurse Williams</SelectItem>
                      <SelectItem value="Dr. Johnson">Dr. Johnson</SelectItem>
                      <SelectItem value="Counselor Smith">Counselor Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCallDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => confirmCallPatient("Window 1")}
                  style={{ backgroundColor: "#10b981", color: "#fff" }}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Call Patient
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Return Later Dialog */}
          <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Return Time</DialogTitle>
                <DialogDescription>
                  Patient #{selectedPatient?.patientNumber} will be notified when to return
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" onClick={() => selectedPatient && markReturnLater(selectedPatient, 30)}>
                    30 minutes
                  </Button>
                  <Button variant="outline" onClick={() => selectedPatient && markReturnLater(selectedPatient, 45)}>
                    45 minutes
                  </Button>
                  <Button variant="outline" onClick={() => selectedPatient && markReturnLater(selectedPatient, 60)}>
                    1 hour
                  </Button>
                </div>
                <p className="text-sm text-center" style={{ color: "#64748b" }}>
                  Patient will receive SMS reminder 10 minutes before return time
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Manual Check-In Dialog */}
          <Dialog open={showManualCheckIn} onOpenChange={setShowManualCheckIn}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Patient Check-In</DialogTitle>
                <DialogDescription>Enter patient number to add them to the queue</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Patient Number</Label>
                  <Input
                    placeholder="Enter patient number"
                    value={manualPatientNumber}
                    onChange={(e) => setManualPatientNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Service Type</Label>
                  <Select value={manualServiceType} onValueChange={setManualServiceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dosing">Dosing</SelectItem>
                      <SelectItem value="counseling">Counseling</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="intake">Intake</SelectItem>
                      <SelectItem value="group">Group Session</SelectItem>
                      <SelectItem value="uds">UDS Collection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowManualCheckIn(false)}>
                  Cancel
                </Button>
                <Button onClick={handleManualCheckIn} style={{ backgroundColor: "#0891b2", color: "#fff" }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle style={{ color: "#1e293b" }}>Collect Payment</DialogTitle>
                <DialogDescription>
                  Process cash or card payment for {selectedPatientForPayment?.firstName}{" "}
                  {selectedPatientForPayment?.lastName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Account Balance */}
                <Card style={{ backgroundColor: patientBalance > 0 ? "#fef3c7" : "#d1fae5" }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: "#64748b" }}>
                          Current Balance
                        </p>
                        <p className="text-3xl font-bold" style={{ color: patientBalance > 0 ? "#92400e" : "#065f46" }}>
                          ${patientBalance.toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-12 w-12" style={{ color: patientBalance > 0 ? "#92400e" : "#065f46" }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Amount */}
                <div>
                  <Label htmlFor="payment-amount">Payment Amount</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="money_order">Money Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Reference */}
                {paymentMethod !== "cash" && (
                  <div>
                    <Label htmlFor="payment-reference">
                      {paymentMethod === "check" ? "Check Number" : "Last 4 Digits / Transaction ID"}
                    </Label>
                    <Input
                      id="payment-reference"
                      placeholder={
                        paymentMethod === "check"
                          ? "Check #"
                          : paymentMethod.includes("card")
                            ? "Last 4 digits"
                            : "Reference"
                      }
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label htmlFor="payment-notes">Notes (Optional)</Label>
                  <Input
                    id="payment-notes"
                    placeholder="Add any notes about this payment"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                {/* Summary */}
                {paymentAmount && Number.parseFloat(paymentAmount) > 0 && (
                  <Card style={{ backgroundColor: "#e0f2fe" }}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Payment Amount:</span>
                          <span className="font-bold">${Number.parseFloat(paymentAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">New Balance:</span>
                          <span className="font-bold">
                            ${(patientBalance - Number.parseFloat(paymentAmount)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={!paymentAmount || Number.parseFloat(paymentAmount) <= 0}
                  style={{ backgroundColor: "#10b981", color: "#fff" }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
