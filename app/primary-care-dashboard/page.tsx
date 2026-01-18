"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
  HeartPulse,
  DollarSign,
  FileText,
  ClipboardList,
  Brain,
  AlertTriangle,
  Lightbulb,
  Pill,
  CheckCircle,
  Plus,
  Target,
  GraduationCap,
  Printer,
  Sparkles,
  Info,
} from "lucide-react"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PrimaryCareDashboardPage() {
  const [stats, setStats] = useState({
    todayAppointments: 12,
    pendingResults: 8,
    qualityMetrics: 94,
    chronicCareManagement: 45,
  })

  const [todaySchedule] = useState([
    { time: "9:00 AM", patient: "Sarah Johnson", type: "Annual Physical", duration: "45 min" },
    { time: "9:45 AM", patient: "Michael Chen", type: "Follow-up Diabetes", duration: "30 min" },
    { time: "10:15 AM", patient: "Emily Rodriguez", type: "Hypertension Check", duration: "20 min" },
    { time: "11:00 AM", patient: "David Thompson", type: "New Patient Intake", duration: "60 min" },
  ])

  const [alerts] = useState([
    { patient: "John Smith", message: "Abnormal lab results - CBC", priority: "high", time: "30 min ago" },
    { patient: "Lisa Anderson", message: "Overdue mammogram screening", priority: "medium", time: "2 hours ago" },
    { patient: "Robert Wilson", message: "BP medication refill needed", priority: "low", time: "4 hours ago" },
  ])

  const [primaryCareCPTCodes] = useState([
    // Office Visits - Established Patient
    { code: "99211", description: "Office visit - minimal", rate: 45, category: "Office Visit" },
    { code: "99212", description: "Office visit - straightforward", rate: 75, category: "Office Visit" },
    { code: "99213", description: "Office visit - low complexity", rate: 110, category: "Office Visit" },
    { code: "99214", description: "Office visit - moderate complexity", rate: 165, category: "Office Visit" },
    { code: "99215", description: "Office visit - high complexity", rate: 210, category: "Office Visit" },
    // Office Visits - New Patient
    { code: "99202", description: "New patient - straightforward", rate: 95, category: "New Patient" },
    { code: "99203", description: "New patient - low complexity", rate: 135, category: "New Patient" },
    { code: "99204", description: "New patient - moderate complexity", rate: 185, category: "New Patient" },
    { code: "99205", description: "New patient - high complexity", rate: 245, category: "New Patient" },
    // Preventive Care
    { code: "99385", description: "Initial preventive visit 18-39 years", rate: 175, category: "Preventive" },
    { code: "99386", description: "Initial preventive visit 40-64 years", rate: 185, category: "Preventive" },
    { code: "99387", description: "Initial preventive visit 65+ years", rate: 195, category: "Preventive" },
    { code: "99395", description: "Periodic preventive visit 18-39 years", rate: 150, category: "Preventive" },
    { code: "99396", description: "Periodic preventive visit 40-64 years", rate: 160, category: "Preventive" },
    { code: "99397", description: "Periodic preventive visit 65+ years", rate: 170, category: "Preventive" },
    // Chronic Care Management
    { code: "99490", description: "Chronic care management - 20 min", rate: 42, category: "CCM" },
    { code: "99439", description: "CCM add-on - each additional 20 min", rate: 38, category: "CCM" },
    { code: "99487", description: "Complex CCM - 60 min", rate: 93, category: "CCM" },
    { code: "99489", description: "Complex CCM add-on - 30 min", rate: 46, category: "CCM" },
    // Annual Wellness Visit
    { code: "G0438", description: "Annual wellness visit - initial", rate: 172, category: "Wellness" },
    { code: "G0439", description: "Annual wellness visit - subsequent", rate: 115, category: "Wellness" },
    // Transitional Care Management
    { code: "99495", description: "TCM - moderate complexity", rate: 165, category: "TCM" },
    { code: "99496", description: "TCM - high complexity", rate: 235, category: "TCM" },
  ])

  const [assessmentTools] = useState([
    { name: "PHQ-9", description: "Patient Health Questionnaire - Depression", questions: 9, time: "5 min" },
    { name: "GAD-7", description: "Generalized Anxiety Disorder Scale", questions: 7, time: "3 min" },
    { name: "AUDIT-C", description: "Alcohol Use Screening", questions: 3, time: "2 min" },
    { name: "DAST-10", description: "Drug Abuse Screening Test", questions: 10, time: "5 min" },
    { name: "MMSE", description: "Mini-Mental State Examination", questions: 11, time: "10 min" },
    { name: "MoCA", description: "Montreal Cognitive Assessment", questions: 13, time: "10 min" },
    { name: "Fall Risk Assessment", description: "Fall Risk Screening Tool", questions: 12, time: "8 min" },
    { name: "Cardiovascular Risk", description: "ASCVD Risk Calculator", questions: 8, time: "5 min" },
    { name: "Diabetes Risk", description: "ADA Diabetes Risk Test", questions: 7, time: "3 min" },
    { name: "Nutrition Screening", description: "Mini Nutritional Assessment", questions: 6, time: "4 min" },
  ])

  const [billingFilter, setBillingFilter] = useState("all")
  const [selectedPatientForBilling, setSelectedPatientForBilling] = useState("")
  const [selectedCPT, setSelectedCPT] = useState("")

  const [selectedPatientForAI, setSelectedPatientForAI] = useState("")
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<any>(null)
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  const analyzePatientChart = async (patientId: string) => {
    setAiAnalysisLoading(true)
    setAiRecommendations(null) // Clear previous recommendations
    try {
      // Simulate fetching data
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate network delay

      // In a real app, this would fetch from an API:
      // const response = await fetch(`/api/ai-clinical-assistant`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ patientId }),
      // })
      // const data = await response.json()

      // Dummy data for demonstration
      const dummyData = {
        summary:
          "67-year-old male with poorly controlled Type 2 Diabetes (A1C 9.2%), hypertension, and hyperlipidemia. Recent labs show declining renal function (eGFR 54). Currently on metformin, lisinopril, and atorvastatin. Patient reports increased fatigue and nocturia over past 3 months.",
        riskAlerts: [
          {
            type: "destructive",
            message:
              "Critical: Declining renal function with current metformin dose. Consider dose adjustment or alternative therapy.",
          },
          {
            type: "warning",
            message:
              "Warning: Blood pressure trending up over last 3 visits (avg 152/88). May need medication titration.",
          },
          { type: "info", message: "Preventive: Due for annual diabetic retinal exam and foot screening." },
        ],
        recommendations: [
          {
            category: "Diabetes Management",
            color: "border-blue-500",
            text: "Consider adding GLP-1 agonist (semaglutide 0.5mg weekly) for improved glycemic control and renal protection. Evidence: SUSTAIN-6 trial showed 39% reduction in progression of diabetic kidney disease.",
          },
          {
            category: "Hypertension Optimization",
            color: "border-green-500",
            text: "Increase lisinopril from 10mg to 20mg daily. Target BP &lt;130/80 in diabetic patients per ADA/ACC guidelines.",
          },
          {
            category: "Medication Safety",
            color: "border-purple-500",
            text: "Reduce metformin to 500mg BID or discontinue if eGFR continues to decline below 45. Consider switching to DPP-4 inhibitor as alternative.",
          },
        ],
        drugInteractions: {
          status: "no_major",
          message:
            "No major interactions detected. Current medication regimen is compatible. Monitoring renal function recommended with ACE-inhibitor and metformin combination.",
        },
        labOrders: [
          {
            test: "Comprehensive Metabolic Panel",
            reason: "Monitor renal function and electrolytes",
            urgency: "This week",
          },
          { test: "HbA1c", reason: "Assess glycemic control over 3 months", urgency: "Today" },
          { test: "Lipid Panel", reason: "Due for annual lipid monitoring", urgency: "Next 30 days" },
          {
            test: "Urine Microalbumin/Creatinine Ratio",
            reason: "Screen for diabetic nephropathy progression",
            urgency: "This week",
          },
        ],
        differentialDiagnosis: [
          { diagnosis: "Diabetic Nephropathy", probability: "Primary", type: "destructive" },
          { diagnosis: "Uncontrolled Diabetes with Complications", probability: "High Probability", type: "default" },
          { diagnosis: "Anemia of Chronic Kidney Disease", probability: "Consider", type: "outline" },
          { diagnosis: "Sleep Apnea (contributing to fatigue)", probability: "Rule Out", type: "outline" },
        ],
        preventiveGaps: [
          { measure: "Diabetic Eye Exam", status: "overdue", days: 45, action: "Schedule ophthalmology" },
          { measure: "Diabetic Foot Exam", status: "due", days: 7, action: "Complete today" },
          {
            measure: "Pneumococcal Vaccine",
            status: "needed",
            days: null,
            action: "Administer if no contraindications",
          },
          { measure: "Colorectal Cancer Screening", status: "current", days: null, action: "Up to date" },
        ],
        educationTopics: [
          "Signs and symptoms of hypoglycemia",
          "Importance of medication adherence",
          "Dietary modifications for diabetes and CKD",
          "Home blood pressure monitoring",
          "Foot care for diabetic patients",
        ],
      }
      setAiRecommendations(dummyData)
    } catch (error) {
      console.error("Error analyzing patient:", error)
      // Handle error appropriately, e.g., show a toast notification
    } finally {
      setAiAnalysisLoading(false)
    }
  }

  return (
    <>
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <HeartPulse className="h-8 w-8 text-indigo-600" />
              Primary Care Dashboard
            </h1>
            <p className="text-muted-foreground">Family Medicine & Internal Medicine Practice</p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-8 lg:w-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
              <TabsTrigger value="chronic-care">Chronic Care</TabsTrigger>
              <TabsTrigger value="preventive">Preventive Care</TabsTrigger>
              <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger> {/* Added AI Assistant Tab Trigger */}
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                    <p className="text-xs text-muted-foreground">4 completed, 8 remaining</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingResults}</div>
                    <p className="text-xs text-muted-foreground">Labs, imaging, consultations</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quality Metrics</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.qualityMetrics}%</div>
                    <p className="text-xs text-muted-foreground">MIPS/HEDIS compliance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CCM Patients</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.chronicCareManagement}</div>
                    <p className="text-xs text-muted-foreground">Active chronic care mgmt</p>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Today's Schedule
                  </CardTitle>
                  <CardDescription>Upcoming appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todaySchedule.map((appt, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-muted-foreground">{appt.time}</div>
                          <div>
                            <div className="font-semibold">{appt.patient}</div>
                            <div className="text-sm text-muted-foreground">{appt.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{appt.duration}</Badge>
                          <Button size="sm">Start Visit</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Clinical Alerts
                  </CardTitle>
                  <CardDescription>Items requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.map((alert, index) => (
                      <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Badge
                            variant={
                              alert.priority === "high"
                                ? "destructive"
                                : alert.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {alert.priority}
                          </Badge>
                          <div>
                            <div className="font-semibold">{alert.patient}</div>
                            <div className="text-sm text-muted-foreground">{alert.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patients Tab */}
            <TabsContent value="patients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Panel</CardTitle>
                  <CardDescription>Your assigned primary care patients</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Patient list with filters and search coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Schedule</CardTitle>
                  <CardDescription>Weekly calendar view</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Full schedule calendar view coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Primary Care Billing</h2>
                  <p className="text-muted-foreground">CPT codes and charge capture</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Create Claim
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Claim</DialogTitle>
                      <DialogDescription>Select patient and CPT codes for billing</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Patient</Label>
                        <Select value={selectedPatientForBilling} onValueChange={setSelectedPatientForBilling}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="patient1">Sarah Johnson</SelectItem>
                            <SelectItem value="patient2">Michael Chen</SelectItem>
                            <SelectItem value="patient3">Emily Rodriguez</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>CPT Code</Label>
                        <Select value={selectedCPT} onValueChange={setSelectedCPT}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select CPT code" />
                          </SelectTrigger>
                          <SelectContent>
                            {primaryCareCPTCodes.map((cpt) => (
                              <SelectItem key={cpt.code} value={cpt.code}>
                                {cpt.code} - {cpt.description} (${cpt.rate})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Service</Label>
                        <Input type="date" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button>Submit Claim</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Billing Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Charges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$2,340</div>
                    <p className="text-xs text-muted-foreground">16 encounters</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$45,600</div>
                    <p className="text-xs text-muted-foreground">312 encounters</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CCM Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$1,890</div>
                    <p className="text-xs text-muted-foreground">45 patients</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg RVU/Day</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18.4</div>
                    <p className="text-xs text-muted-foreground text-green-600">+12% vs last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* CPT Code Library */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Primary Care CPT Code Library</CardTitle>
                      <CardDescription>Common billing codes and reimbursement rates</CardDescription>
                    </div>
                    <Select value={billingFilter} onValueChange={setBillingFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Office Visit">Office Visits</SelectItem>
                        <SelectItem value="New Patient">New Patient</SelectItem>
                        <SelectItem value="Preventive">Preventive Care</SelectItem>
                        <SelectItem value="CCM">Chronic Care Management</SelectItem>
                        <SelectItem value="Wellness">Annual Wellness Visit</SelectItem>
                        <SelectItem value="TCM">Transitional Care</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {primaryCareCPTCodes
                      .filter((cpt) => billingFilter === "all" || cpt.category === billingFilter)
                      .map((cpt) => (
                        <div
                          key={cpt.code}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="font-mono">
                              {cpt.code}
                            </Badge>
                            <div>
                              <div className="font-semibold">{cpt.description}</div>
                              <div className="text-sm text-muted-foreground">{cpt.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">${cpt.rate}</div>
                            <div className="text-xs text-muted-foreground">Medicare Rate</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessments" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Clinical Assessment Tools</h2>
                  <p className="text-muted-foreground">Standardized screening and evaluation instruments</p>
                </div>
                <Button>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Start Assessment
                </Button>
              </div>

              {/* Assessment Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-xs text-muted-foreground">Total assessments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Positive Screens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">23</div>
                    <p className="text-xs text-muted-foreground">Requiring follow-up</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">94%</div>
                    <p className="text-xs text-muted-foreground text-green-600">Above target</p>
                  </CardContent>
                </Card>
              </div>

              {/* Assessment Tools Library */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Assessment Tools</CardTitle>
                  <CardDescription>Evidence-based screening instruments for primary care</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {assessmentTools.map((tool, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{tool.name}</CardTitle>
                              <CardDescription className="mt-1">{tool.description}</CardDescription>
                            </div>
                            <Button size="sm" variant="outline">
                              <FileText className="mr-2 h-4 w-4" />
                              Start
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <ClipboardList className="h-4 w-4" />
                              {tool.questions} questions
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {tool.time}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Assessments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Assessments</CardTitle>
                  <CardDescription>Completed screenings from the past 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold">Sarah Johnson - PHQ-9</div>
                          <div className="text-sm text-muted-foreground">Score: 12 (Moderate Depression)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Follow-up Needed</Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold">Michael Chen - AUDIT-C</div>
                          <div className="text-sm text-muted-foreground">Score: 2 (Low Risk)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Normal</Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold">Emily Rodriguez - GAD-7</div>
                          <div className="text-sm text-muted-foreground">Score: 15 (Moderate Anxiety)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Follow-up Needed</Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quality Metrics Tab */}
            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics & MIPS</CardTitle>
                  <CardDescription>Performance measures and value-based care</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-semibold">Diabetes HbA1c Control</div>
                        <div className="text-sm text-muted-foreground">Percentage with HbA1c &lt; 8%</div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">87%</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-semibold">Hypertension Control</div>
                        <div className="text-sm text-muted-foreground">BP &lt; 140/90</div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">92%</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-semibold">Colorectal Cancer Screening</div>
                        <div className="text-sm text-muted-foreground">Age 50-75 screened</div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">78%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chronic Care Tab */}
            <TabsContent value="chronic-care" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chronic Care Management (CCM)</CardTitle>
                  <CardDescription>99490, 99439, 99487 billing opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">CCM patient tracking and time logging coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preventive Care Tab */}
            <TabsContent value="preventive" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preventive Care & Screenings</CardTitle>
                  <CardDescription>Age and gender-appropriate health maintenance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Preventive care tracking dashboard coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Clinical Assistant Tab */}
            <TabsContent value="ai-assistant" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">AI Clinical Assistant</h2>
                  <p className="text-muted-foreground">Intelligent chart analysis and clinical decision support</p>
                </div>
                <Button onClick={() => setShowAIAssistant(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Analysis
                </Button>
              </div>

              {/* Patient Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Patient for Analysis</CardTitle>
                  <CardDescription>
                    AI will analyze the complete patient chart and provide recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Select value={selectedPatientForAI} onValueChange={setSelectedPatientForAI}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patient1">John Doe - DOB: 03/15/1985</SelectItem>
                          <SelectItem value="patient2">Jane Smith - DOB: 07/22/1990</SelectItem>
                          <SelectItem value="patient3">Michael Johnson - DOB: 11/30/1978</SelectItem>
                          <SelectItem value="patient4">Emily Williams - DOB: 05/18/1995</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => selectedPatientForAI && analyzePatientChart(selectedPatientForAI)}
                        disabled={!selectedPatientForAI || aiAnalysisLoading}
                      >
                        {aiAnalysisLoading ? "Analyzing..." : "Analyze Chart"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Recommendations Display */}
              {aiRecommendations && (
                <>
                  {/* Clinical Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-500" />
                        AI-Generated Clinical Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="text-sm text-muted-foreground">
                          Based on comprehensive chart review including medical history, medications, lab results, vital
                          signs, and recent encounters.
                        </p>
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <p>{aiRecommendations.summary}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Alerts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Risk Alerts & Clinical Warnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiRecommendations.riskAlerts.map((alert: any, index: number) => (
                          <Alert key={index} variant={alert.type}>
                            {alert.type === "destructive" && <AlertCircle className="h-4 w-4" />}
                            {alert.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                            {alert.type === "info" && <Info className="h-4 w-4" />}
                            <AlertDescription>
                              <p dangerouslySetInnerHTML={{ __html: alert.message }} />
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Treatment Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Evidence-Based Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {aiRecommendations.recommendations.map((rec: any, index: number) => (
                          <div key={index} className={`border-l-4 ${rec.color} pl-4`}>
                            <h4 className="font-semibold"></h4>
                            <p className="text-sm text-muted-foreground mt-1">{rec.text}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Drug Interactions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-orange-500" />
                        Drug Interaction Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div
                          className={`flex items-start gap-2 p-3 rounded-lg ${
                            aiRecommendations.drugInteractions.status === "no_major" ? "bg-green-50" : "bg-red-50"
                          }`}
                        >
                          {aiRecommendations.drugInteractions.status === "no_major" ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          )}
                          <div>
                            <p
                              className={`font-medium text-sm ${
                                aiRecommendations.drugInteractions.status === "no_major"
                                  ? "text-green-800"
                                  : "text-red-800"
                              }`}
                            >
                              {aiRecommendations.drugInteractions.status === "no_major"
                                ? "No major interactions detected"
                                : "Major Interactions Detected"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {aiRecommendations.drugInteractions.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lab Order Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Recommended Lab Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiRecommendations.labOrders.map((lab: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{lab.test}</p>
                              <p className="text-sm text-muted-foreground">{lab.reason}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{lab.urgency}</Badge>
                              <Button size="sm" variant="ghost" className="ml-2">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Differential Diagnosis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        Differential Diagnosis Considerations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          Based on symptoms: increased fatigue, nocturia, declining renal function
                        </p>
                        <div className="space-y-2">
                          {aiRecommendations.differentialDiagnosis.map((dd: any, index: number) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-2 border rounded ${
                                dd.type === "destructive"
                                  ? "bg-red-50 border-red-200"
                                  : dd.type === "default"
                                    ? "bg-blue-50 border-blue-200"
                                    : dd.type === "outline"
                                      ? "bg-gray-50 border-gray-200"
                                      : ""
                              }`}
                            >
                              <span className="font-medium">{dd.diagnosis}</span>
                              <Badge
                                variant={
                                  dd.type === "destructive"
                                    ? "destructive"
                                    : dd.type === "default"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {dd.probability}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preventive Care Gaps */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-teal-500" />
                        Quality Measures & Preventive Care Gaps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aiRecommendations.preventiveGaps.map((item: any, index: number) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              item.status === "overdue"
                                ? "bg-red-50"
                                : item.status === "due"
                                  ? "bg-yellow-50"
                                  : "bg-green-50"
                            }`}
                          >
                            <div>
                              <p className="font-medium">{item.measure}</p>
                              <p className="text-sm text-muted-foreground">{item.action}</p>
                            </div>
                            <Badge
                              variant={
                                item.status === "overdue"
                                  ? "destructive"
                                  : item.status === "due"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {item.status}
                              {item.days && ` (${item.days}d)`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Patient Education */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-pink-500" />
                        Patient Education Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aiRecommendations.educationTopics.map((topic: string, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{topic}</span>
                            <Button size="sm" variant="outline">
                              <Printer className="h-3 w-3 mr-1" />
                              Print
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  )
}
