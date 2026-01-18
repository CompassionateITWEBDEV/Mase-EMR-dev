"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  FileText,
  Calendar,
  BarChart3,
  ClipboardList,
  Home,
  Dumbbell,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Play,
  Search,
  Plus,
  Eye,
  DollarSign,
  CreditCard,
  FileCheck,
  Brain,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { toast } from "@/hooks/use-toast"

interface User {
  name: string
  role: string
  license: string
  specialty: string
}

interface Patient {
  id: string
  name: string
  diagnosis: string
  therapyType: "PT" | "OT" | "SLP"
  sessionsCompleted: number
  totalSessions: number
  nextAppointment: string
  hepCompliance: number
  status: "active" | "on-hold" | "discharged"
}

interface Appointment {
  id: string
  time: string
  patientName: string
  therapyType: "PT" | "OT" | "SLP"
  visitType: string
  status: "scheduled" | "checked-in" | "in-progress" | "completed"
}

interface HEPProgram {
  id: string
  patientName: string
  programName: string
  exercises: number
  compliance: number
  lastCompleted: string
  rtmEligible: boolean
}

interface BillingCode {
  code: string
  description: string
  rate: number
  modifier?: string
}

interface ClaimItem {
  id: string
  patientName: string
  dateOfService: string
  codes: string[]
  amount: number
  status: "pending" | "submitted" | "paid" | "denied"
  payer: string
}

// Sample billing codes for PT/OT/SLP
const billingCodes: BillingCode[] = [
  { code: "97110", description: "Therapeutic Exercise", rate: 45 },
  { code: "97112", description: "Neuromuscular Re-education", rate: 48 },
  { code: "97116", description: "Gait Training", rate: 42 },
  { code: "97140", description: "Manual Therapy", rate: 52 },
  { code: "97530", description: "Therapeutic Activities", rate: 46 },
  { code: "97535", description: "Self-Care/Home Management", rate: 44 },
  { code: "97542", description: "Wheelchair Management", rate: 40 },
  { code: "97750", description: "Physical Performance Test", rate: 55 },
  { code: "97760", description: "Orthotic Management", rate: 48 },
  { code: "97761", description: "Prosthetic Training", rate: 50 },
  { code: "97763", description: "Orthotic/Prosthetic Checkout", rate: 45 },
  { code: "92507", description: "Speech Treatment", rate: 65 },
  { code: "92508", description: "Group Speech Treatment", rate: 35 },
  { code: "92526", description: "Oral Function Treatment", rate: 58 },
  { code: "92610", description: "Swallowing Evaluation", rate: 120 },
  { code: "97161", description: "PT Eval - Low Complexity", rate: 95 },
  { code: "97162", description: "PT Eval - Moderate Complexity", rate: 115 },
  { code: "97163", description: "PT Eval - High Complexity", rate: 145 },
  { code: "97165", description: "OT Eval - Low Complexity", rate: 90 },
  { code: "97166", description: "OT Eval - Moderate Complexity", rate: 110 },
  { code: "97167", description: "OT Eval - High Complexity", rate: 140 },
  { code: "98975", description: "RTM Initial Setup", rate: 22 },
  { code: "98977", description: "RTM Device Supply", rate: 55 },
  { code: "98980", description: "RTM Treatment Mgmt (20 min)", rate: 50 },
  { code: "98981", description: "RTM Treatment Mgmt (additional 20 min)", rate: 40 },
]

export default function PTOTDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [patientSearch, setPatientSearch] = useState("")
  const [billingSearch, setBillingSearch] = useState("")
  const [selectedBillingFilter, setSelectedBillingFilter] = useState("all")
  const [showAddClaimDialog, setShowAddClaimDialog] = useState(false)

  // Sample data
  const [patients] = useState<Patient[]>([
    {
      id: "1",
      name: "John Smith",
      diagnosis: "Rotator Cuff Repair",
      therapyType: "PT",
      sessionsCompleted: 8,
      totalSessions: 12,
      nextAppointment: "Today 2:00 PM",
      hepCompliance: 85,
      status: "active",
    },
    {
      id: "2",
      name: "Mary Johnson",
      diagnosis: "Carpal Tunnel Syndrome",
      therapyType: "OT",
      sessionsCompleted: 5,
      totalSessions: 10,
      nextAppointment: "Tomorrow 10:00 AM",
      hepCompliance: 92,
      status: "active",
    },
    {
      id: "3",
      name: "Robert Davis",
      diagnosis: "CVA - Left Hemiparesis",
      therapyType: "PT",
      sessionsCompleted: 15,
      totalSessions: 20,
      nextAppointment: "Today 3:30 PM",
      hepCompliance: 78,
      status: "active",
    },
    {
      id: "4",
      name: "Susan Wilson",
      diagnosis: "Aphasia",
      therapyType: "SLP",
      sessionsCompleted: 6,
      totalSessions: 16,
      nextAppointment: "Wed 9:00 AM",
      hepCompliance: 88,
      status: "active",
    },
    {
      id: "5",
      name: "James Brown",
      diagnosis: "Total Knee Replacement",
      therapyType: "PT",
      sessionsCompleted: 4,
      totalSessions: 8,
      nextAppointment: "Today 4:00 PM",
      hepCompliance: 95,
      status: "active",
    },
  ])

  const [appointments] = useState<Appointment[]>([
    {
      id: "1",
      time: "9:00 AM",
      patientName: "John Smith",
      therapyType: "PT",
      visitType: "Follow-up",
      status: "completed",
    },
    {
      id: "2",
      time: "10:00 AM",
      patientName: "Mary Johnson",
      therapyType: "OT",
      visitType: "Initial Eval",
      status: "completed",
    },
    {
      id: "3",
      time: "11:00 AM",
      patientName: "Robert Davis",
      therapyType: "PT",
      visitType: "Follow-up",
      status: "in-progress",
    },
    {
      id: "4",
      time: "2:00 PM",
      patientName: "Susan Wilson",
      therapyType: "SLP",
      visitType: "Follow-up",
      status: "checked-in",
    },
    {
      id: "5",
      time: "3:00 PM",
      patientName: "James Brown",
      therapyType: "PT",
      visitType: "Follow-up",
      status: "scheduled",
    },
    {
      id: "6",
      time: "4:00 PM",
      patientName: "Linda Martinez",
      therapyType: "OT",
      visitType: "Re-evaluation",
      status: "scheduled",
    },
  ])

  const [hepPrograms] = useState<HEPProgram[]>([
    {
      id: "1",
      patientName: "John Smith",
      programName: "Shoulder Strengthening",
      exercises: 8,
      compliance: 85,
      lastCompleted: "2 hours ago",
      rtmEligible: true,
    },
    {
      id: "2",
      patientName: "Mary Johnson",
      programName: "Hand Therapy Exercises",
      exercises: 12,
      compliance: 92,
      lastCompleted: "Yesterday",
      rtmEligible: true,
    },
    {
      id: "3",
      patientName: "Robert Davis",
      programName: "Balance & Gait Training",
      exercises: 6,
      compliance: 78,
      lastCompleted: "3 days ago",
      rtmEligible: true,
    },
    {
      id: "4",
      patientName: "James Brown",
      programName: "Knee ROM Exercises",
      exercises: 10,
      compliance: 95,
      lastCompleted: "Today",
      rtmEligible: true,
    },
  ])

  const [claims] = useState<ClaimItem[]>([
    {
      id: "1",
      patientName: "John Smith",
      dateOfService: "2025-01-28",
      codes: ["97110", "97140", "97530"],
      amount: 143,
      status: "submitted",
      payer: "Blue Cross",
    },
    {
      id: "2",
      patientName: "Mary Johnson",
      dateOfService: "2025-01-28",
      codes: ["97165", "97535"],
      amount: 134,
      status: "pending",
      payer: "Aetna",
    },
    {
      id: "3",
      patientName: "Robert Davis",
      dateOfService: "2025-01-27",
      codes: ["97110", "97116", "97112"],
      amount: 135,
      status: "paid",
      payer: "Medicare",
    },
    {
      id: "4",
      patientName: "Susan Wilson",
      dateOfService: "2025-01-27",
      codes: ["92507", "92526"],
      amount: 123,
      status: "paid",
      payer: "UnitedHealth",
    },
    {
      id: "5",
      patientName: "James Brown",
      dateOfService: "2025-01-26",
      codes: ["97161", "97110"],
      amount: 140,
      status: "denied",
      payer: "Cigna",
    },
  ])

  useEffect(() => {
    // Check for PT/OT session
    const ptotSession = localStorage.getItem("ptot_session")
    if (ptotSession) {
      try {
        const session = JSON.parse(ptotSession)
        setUser(session)
      } catch {
        router.push("/auth/pt-ot-login")
      }
    } else {
      router.push("/auth/pt-ot-login")
    }
    setLoading(false)
  }, [router])

  const getTherapyBadgeColor = (type: string) => {
    switch (type) {
      case "PT":
        return "bg-blue-100 text-blue-800"
      case "OT":
        return "bg-green-100 text-green-800"
      case "SLP":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "checked-in":
        return <Badge className="bg-yellow-100 text-yellow-800">Checked In</Badge>
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "denied":
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(patientSearch.toLowerCase()),
  )

  const filteredClaims = claims.filter((c) => {
    const matchesSearch = c.patientName.toLowerCase().includes(billingSearch.toLowerCase())
    const matchesFilter = selectedBillingFilter === "all" || c.status === selectedBillingFilter
    return matchesSearch && matchesFilter
  })

  const filteredBillingCodes = billingCodes.filter(
    (c) =>
      c.code.toLowerCase().includes(billingSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(billingSearch.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <div className="lg:pl-64">
        <DashboardHeader />

        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Rehabilitation Portal</h1>
                <p className="text-muted-foreground">
                  Welcome, {user.name} • {user.role} • {user.license}
                </p>
              </div>
            </div>
          </div>

          {/* Main Tabs - Added Billing and AI Coach tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-8 w-full max-w-5xl">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Patients
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="hep" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                HEP/RTM
              </TabsTrigger>
              <TabsTrigger value="documentation" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentation
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="ai-coach" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Coach
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Today's Patients</p>
                        <p className="text-2xl font-bold">8</p>
                        <p className="text-xs text-green-600">2 completed</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Caseload</p>
                        <p className="text-2xl font-bold">24</p>
                        <p className="text-xs text-muted-foreground">5 pending discharge</p>
                      </div>
                      <Activity className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">HEP Compliance</p>
                        <p className="text-2xl font-bold">87%</p>
                        <p className="text-xs text-green-600">↑ 3% this week</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">RTM Revenue</p>
                        <p className="text-2xl font-bold">$2,450</p>
                        <p className="text-xs text-muted-foreground">This month</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Schedule & Alerts */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Today's Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {appointments.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium w-20">{apt.time}</div>
                          <div>
                            <p className="font-medium">{apt.patientName}</p>
                            <p className="text-sm text-muted-foreground">{apt.visitType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTherapyBadgeColor(apt.therapyType)}>{apt.therapyType}</Badge>
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Compliance Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg border-amber-200 bg-amber-50">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Low HEP Compliance</span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">Robert Davis - 78% (below 80% threshold)</p>
                    </div>
                    <div className="p-3 border rounded-lg border-red-200 bg-red-50">
                      <div className="flex items-center gap-2 text-red-800">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Authorization Expiring</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">Mary Johnson - 2 visits remaining</p>
                    </div>
                    <div className="p-3 border rounded-lg border-blue-200 bg-blue-50">
                      <div className="flex items-center gap-2 text-blue-800">
                        <FileCheck className="h-4 w-4" />
                        <span className="font-medium">Progress Note Due</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">James Brown - 30-day progress note required</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button onClick={() => setActiveTab("patients")}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Patient
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("documentation")}>
                      <FileText className="h-4 w-4 mr-2" />
                      New Note
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("hep")}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Create HEP
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("billing")}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Submit Claim
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/ai-coaching")}>
                      <Brain className="h-4 w-4 mr-2" />
                      AI Coaching
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patients Tab */}
            <TabsContent value="patients" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Patient</th>
                        <th className="text-left p-4 font-medium">Diagnosis</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Progress</th>
                        <th className="text-left p-4 font-medium">HEP Compliance</th>
                        <th className="text-left p-4 font-medium">Next Appt</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{patient.name}</td>
                          <td className="p-4 text-muted-foreground">{patient.diagnosis}</td>
                          <td className="p-4">
                            <Badge className={getTherapyBadgeColor(patient.therapyType)}>{patient.therapyType}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(patient.sessionsCompleted / patient.totalSessions) * 100}
                                className="w-20"
                              />
                              <span className="text-sm">
                                {patient.sessionsCompleted}/{patient.totalSessions}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Progress value={patient.hepCompliance} className="w-16" />
                              <span className="text-sm">{patient.hepCompliance}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm">{patient.nextAppointment}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule - {new Date().toLocaleDateString()}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-medium w-24">{apt.time}</div>
                        <div>
                          <p className="font-medium">{apt.patientName}</p>
                          <p className="text-sm text-muted-foreground">{apt.visitType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getTherapyBadgeColor(apt.therapyType)}>{apt.therapyType}</Badge>
                        {getStatusBadge(apt.status)}
                        {apt.status === "scheduled" || apt.status === "checked-in" ? (
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Start Session
                          </Button>
                        ) : apt.status === "in-progress" ? (
                          <Button size="sm" variant="outline">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* HEP/RTM Tab */}
            <TabsContent value="hep" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Home Exercise Programs & RTM</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create HEP
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {hepPrograms.map((hep) => (
                  <Card key={hep.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{hep.patientName}</CardTitle>
                        {hep.rtmEligible && <Badge className="bg-green-100 text-green-800">RTM Eligible</Badge>}
                      </div>
                      <CardDescription>{hep.programName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Exercises: {hep.exercises}</span>
                          <span>Last completed: {hep.lastCompleted}</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Compliance</span>
                            <span className={hep.compliance >= 80 ? "text-green-600" : "text-amber-600"}>
                              {hep.compliance}%
                            </span>
                          </div>
                          <Progress value={hep.compliance} />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <FileText className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {hep.rtmEligible && (
                            <Button size="sm" className="flex-1">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Bill RTM
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="documentation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Documentation Templates</CardTitle>
                  <CardDescription>Select a template to create a new note</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: "Initial Evaluation", icon: FileCheck, desc: "Comprehensive initial assessment" },
                      { name: "Daily Note", icon: FileText, desc: "Session documentation" },
                      { name: "Progress Note", icon: TrendingUp, desc: "30-day progress summary" },
                      { name: "Re-evaluation", icon: Activity, desc: "Periodic re-assessment" },
                      { name: "Discharge Summary", icon: CheckCircle2, desc: "Treatment completion" },
                      { name: "RTM Note", icon: DollarSign, desc: "Remote monitoring documentation" },
                    ].map((template) => (
                      <Card key={template.name} className="cursor-pointer hover:border-primary transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <template.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-sm text-muted-foreground">{template.desc}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Billing & Claims</h2>
                <Dialog open={showAddClaimDialog} onOpenChange={setShowAddClaimDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Claim
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Claim</DialogTitle>
                      <DialogDescription>Enter claim details for billing submission</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Patient</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {patients.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Service</Label>
                          <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>CPT Codes</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing codes" />
                          </SelectTrigger>
                          <SelectContent>
                            {billingCodes.slice(0, 10).map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.code} - {c.description} (${c.rate})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea placeholder="Additional billing notes..." />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddClaimDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          toast({
                            title: "Claim Created",
                            description: "Claim has been saved and is ready for submission.",
                          })
                          setShowAddClaimDialog(false)
                        }}
                      >
                        Create Claim
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Billing Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Claims</p>
                        <p className="text-2xl font-bold">12</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Submitted</p>
                        <p className="text-2xl font-bold">28</p>
                      </div>
                      <FileCheck className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Paid This Month</p>
                        <p className="text-2xl font-bold">$18,450</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Denied</p>
                        <p className="text-2xl font-bold">3</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* CPT Code Library */}
                <Card>
                  <CardHeader>
                    <CardTitle>CPT Code Library</CardTitle>
                    <CardDescription>PT/OT/SLP billing codes with rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search codes..."
                          value={billingSearch}
                          onChange={(e) => setBillingSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredBillingCodes.map((code) => (
                        <div
                          key={code.code}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-mono font-medium">{code.code}</p>
                            <p className="text-sm text-muted-foreground">{code.description}</p>
                          </div>
                          <Badge variant="outline">${code.rate}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Claims */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Recent Claims</CardTitle>
                        <CardDescription>Latest billing submissions</CardDescription>
                      </div>
                      <Select value={selectedBillingFilter} onValueChange={setSelectedBillingFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="denied">Denied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredClaims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{claim.patientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {claim.dateOfService} • {claim.codes.join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">${claim.amount}</span>
                            {getStatusBadge(claim.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-coach" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI Clinical Coach
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered assistance for treatment planning, documentation, and clinical decision support
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => router.push("/ai-coaching")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Documentation Assistant</p>
                            <p className="text-sm text-muted-foreground">Generate clinical notes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => router.push("/ai-coaching")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Treatment Planner</p>
                            <p className="text-sm text-muted-foreground">Evidence-based recommendations</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => router.push("/ai-coaching")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Outcome Predictor</p>
                            <p className="text-sm text-muted-foreground">Functional outcome forecasts</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Button className="w-full" onClick={() => router.push("/ai-coaching")}>
                    <Brain className="h-4 w-4 mr-2" />
                    Open Full AI Coaching Dashboard
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Productivity Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Units per Day</span>
                      <span className="font-bold">24.5</span>
                    </div>
                    <Progress value={82} />
                    <div className="flex items-center justify-between">
                      <span>Documentation Compliance</span>
                      <span className="font-bold">96%</span>
                    </div>
                    <Progress value={96} />
                    <div className="flex items-center justify-between">
                      <span>Patient Satisfaction</span>
                      <span className="font-bold">4.8/5</span>
                    </div>
                    <Progress value={96} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Traditional Billing</span>
                      <span className="font-bold text-green-600">$45,230</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>RTM Revenue</span>
                      <span className="font-bold text-green-600">$8,450</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                      <span className="font-medium">Total MTD</span>
                      <span className="font-bold text-lg">$53,680</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
