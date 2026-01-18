"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building2,
  Users,
  AlertTriangle,
  MapPin,
  FileText,
  Download,
  Search,
  Send,
  Calendar,
  Award,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Lightbulb,
  BarChart3,
  Activity,
} from "lucide-react"

export default function StateOversightDashboard() {
  const [searchTerm, setSearchTerm] = useState("")

  const clinics = [
    {
      id: 1,
      name: "Wayne County Recovery Center",
      county: "Wayne",
      type: "OTP",
      status: "active",
      compliance: 94.5,
      quality: 92.3,
      patients: 487,
      staff: 42,
      lastSubmission: "2024-01-10",
      alerts: 2,
    },
    {
      id: 2,
      name: "Oakland Behavioral Health",
      county: "Oakland",
      type: "CCBHC",
      status: "active",
      compliance: 98.2,
      quality: 96.1,
      patients: 612,
      staff: 58,
      lastSubmission: "2024-01-12",
      alerts: 0,
    },
    {
      id: 3,
      name: "Macomb Treatment Services",
      county: "Macomb",
      type: "OTP",
      status: "probation",
      compliance: 78.4,
      quality: 81.2,
      patients: 324,
      staff: 28,
      lastSubmission: "2024-01-05",
      alerts: 8,
    },
    {
      id: 4,
      name: "Kent County FQHC",
      county: "Kent",
      type: "FQHC",
      status: "active",
      compliance: 91.8,
      quality: 89.6,
      patients: 556,
      staff: 51,
      lastSubmission: "2024-01-11",
      alerts: 1,
    },
    {
      id: 5,
      name: "Washtenaw Recovery Alliance",
      county: "Washtenaw",
      type: "Private",
      status: "active",
      compliance: 88.7,
      quality: 87.4,
      patients: 298,
      staff: 34,
      lastSubmission: "2024-01-09",
      alerts: 3,
    },
  ]

  const monthlyTrends = [
    { month: "Jul", patients: 1834, overdoses: 47, compliance: 87.2 },
    { month: "Aug", patients: 1956, overdoses: 42, compliance: 88.5 },
    { month: "Sep", patients: 2089, overdoses: 38, compliance: 89.8 },
    { month: "Oct", patients: 2156, overdoses: 35, compliance: 90.3 },
    { month: "Nov", patients: 2234, overdoses: 31, compliance: 91.1 },
    { month: "Dec", patients: 2277, overdoses: 28, compliance: 91.2 },
  ]

  const clinicTypes = [
    { type: "OTP", count: 2, color: "bg-blue-500" },
    { type: "CCBHC", count: 1, color: "bg-green-500" },
    { type: "FQHC", count: 1, color: "bg-purple-500" },
    { type: "Private", count: 1, color: "bg-orange-500" },
  ]

  const reportingCompliance = [
    { system: "MiOFR", submitted: 5, total: 5, percentage: 100 },
    { system: "SUDORS", submitted: 5, total: 5, percentage: 100 },
    { system: "DOSE-SYS", submitted: 4, total: 5, percentage: 80 },
    { system: "MiPHY", submitted: 5, total: 5, percentage: 100 },
    { system: "Mi-SUTWA", submitted: 3, total: 5, percentage: 60 },
    { system: "MiTracking", submitted: 4, total: 5, percentage: 80 },
    { system: "NIDA Research", submitted: 5, total: 5, percentage: 100 },
  ]
  // </CHANGE>

  const stateMetrics = {
    totalClinics: clinics.length,
    activeClinics: clinics.filter((c) => c.status === "active").length,
    totalPatients: clinics.reduce((sum, c) => sum + c.patients, 0),
    avgCompliance: (clinics.reduce((sum, c) => sum + c.compliance, 0) / clinics.length).toFixed(1),
    overdosesPrevented: 1247,
    environmentalAlerts: 12,
  }

  const environmentalCorrelations = {
    leadExposure: {
      counties: ["Wayne", "Genesee", "Saginaw"],
      avgSUDRate: 42.3,
      stateAvg: 28.7,
      correlation: 0.68,
      description: "Counties with elevated blood lead levels (>5 µg/dL) show 47% higher SUD rates",
    },
    airQuality: {
      counties: ["Wayne", "Oakland", "Macomb"],
      avgSUDRate: 38.9,
      stateAvg: 28.7,
      correlation: 0.52,
      description: "Poor air quality (AQI >100) correlates with increased mental health and substance use",
    },
    waterContaminants: {
      counties: ["Genesee", "Monroe"],
      avgSUDRate: 44.1,
      stateAvg: 28.7,
      correlation: 0.71,
      description: "PFAS/chemical contamination areas show 54% higher opioid use rates",
    },
  }

  const filteredClinics = clinics.filter((clinic) => clinic.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const getMaxValue = (data: number[]) => Math.max(...data)
  // </CHANGE>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Michigan State Oversight Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitoring {stateMetrics.totalClinics} registered MASE clinics (scalable to any number)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Broadcast Alert
            </Button>
          </div>
        </div>
      </div>

      {/* State Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clinics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stateMetrics.totalClinics}</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2 this quarter</span>
                </div>
                {/* </CHANGE> */}
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Patients Served</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stateMetrics.totalPatients.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12.3% vs last month</span>
                </div>
                {/* </CHANGE> */}
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-3xl font-bold">{stateMetrics.avgCompliance}%</div>
                <Progress value={Number.parseFloat(stateMetrics.avgCompliance)} className="mt-2 h-2" />
              </div>
              <Shield className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overdoses Prevented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stateMetrics.overdosesPrevented}</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-18% vs last year</span>
                </div>
                {/* </CHANGE> */}
              </div>
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Activity className="w-8 h-8 text-emerald-500" />
              <div className="flex items-end gap-0.5 h-12">
                {monthlyTrends.map((month, idx) => (
                  <div
                    key={idx}
                    className="bg-emerald-500 w-2 rounded-t"
                    style={{ height: `${(month.compliance / 100) * 100}%` }}
                    title={`${month.month}: ${month.compliance}%`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* </CHANGE> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Clinic Type Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Clinic Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clinicTypes.map((item) => (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.type}</span>
                    <span className="text-gray-600">{item.count} clinics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`${item.color} h-3 rounded-full`}
                        style={{ width: `${(item.count / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{((item.count / 5) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Surveillance Reporting Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Surveillance Reporting Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportingCompliance.map((system) => (
                <div key={system.system} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{system.system}</span>
                    <span className="text-gray-600">
                      {system.submitted}/{system.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${system.percentage === 100 ? "bg-green-500" : system.percentage >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${system.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{system.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Patient Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Patient Enrollment Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-1 h-32 border-b border-l border-gray-200 pl-2 pb-2">
                {monthlyTrends.map((month, idx) => {
                  const maxPatients = getMaxValue(monthlyTrends.map((m) => m.patients))
                  const height = (month.patients / maxPatients) * 100
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="bg-blue-500 hover:bg-blue-600 w-full rounded-t transition-all cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${month.month}: ${month.patients} patients`}
                      />
                      <span className="text-xs text-gray-600">{month.month}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Jul 2023</span>
                <span className="font-semibold text-green-600">+24.1% growth</span>
                <span>Dec 2023</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdose Prevention Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Overdose Prevention Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-1 h-32 border-b border-l border-gray-200 pl-2 pb-2">
                {monthlyTrends.map((month, idx) => {
                  const maxOverdoses = getMaxValue(monthlyTrends.map((m) => m.overdoses))
                  const height = (month.overdoses / maxOverdoses) * 100
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="bg-rose-500 hover:bg-rose-600 w-full rounded-t transition-all cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${month.month}: ${month.overdoses} overdoses`}
                      />
                      <span className="text-xs text-gray-600">{month.month}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Jul 2023</span>
                <span className="font-semibold text-green-600">-40.4% reduction</span>
                <span>Dec 2023</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* </CHANGE> */}

      <Tabs defaultValue="clinics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="clinics">Clinics</TabsTrigger>
          <TabsTrigger value="actions">
            Actions
            <Badge variant="destructive" className="ml-1 text-xs">
              8
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="communication">Comms</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="practices">Best Practices</TabsTrigger>
        </TabsList>

        {/* Tab 1: Clinic Monitor */}
        <TabsContent value="clinics">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Clinic Performance Monitor</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search clinics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredClinics.map((clinic) => (
                  <div key={clinic.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{clinic.name}</div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {clinic.county} County
                          </span>
                          <Badge variant="outline">{clinic.type}</Badge>
                          <Badge
                            variant={clinic.status === "active" ? "default" : "destructive"}
                            className={clinic.status === "active" ? "bg-green-100 text-green-800" : ""}
                          >
                            {clinic.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Compliance</div>
                          <div className="font-semibold">{clinic.compliance}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Patients</div>
                          <div className="font-semibold">{clinic.patients}</div>
                        </div>
                        {clinic.alerts > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-semibold">{clinic.alerts}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Actions & CAPs */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Corrective Action Plans & Interventions</CardTitle>
              <CardDescription>Send actions, schedule audits, track remediation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  clinic: "Macomb Treatment Services",
                  issue: "Late SUDORS submissions (3 consecutive)",
                  action: "Implement automated submission reminders",
                  deadline: "2024-02-15",
                  progress: 60,
                },
                {
                  clinic: "Genesee Recovery Center",
                  issue: "Workforce gaps - 4 vacant counselor positions",
                  action: "Provide recruitment support",
                  deadline: "2024-03-01",
                  progress: 30,
                },
              ].map((cap, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{cap.clinic}</div>
                      <div className="text-sm text-red-600 mt-1">{cap.issue}</div>
                    </div>
                    <Button size="sm">Send Reminder</Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Action:</strong> {cap.action}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Deadline: {cap.deadline}</span>
                    <div className="flex-1" />
                    <span className="text-sm font-medium">{cap.progress}% complete</span>
                  </div>
                  <Progress value={cap.progress} className="h-2" />
                </div>
              ))}
              <Button className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Issue New Corrective Action Plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Custom Reports */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports & Analytics</CardTitle>
              <CardDescription>Generate and schedule automated reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Quarterly Compliance Report", type: "Compliance", scheduled: "Monthly" },
                  { name: "Workforce Assessment (Mi-SUTWA)", type: "Workforce", scheduled: "Quarterly" },
                  { name: "Surveillance Data Summary", type: "Public Health", scheduled: "Weekly" },
                ].map((report, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="font-semibold text-gray-900">{report.name}</div>
                    <Badge variant="outline" className="mt-2">
                      {report.type}
                    </Badge>
                    <div className="text-xs text-gray-600 mt-2">Scheduled: {report.scheduled}</div>
                    <Button size="sm" className="w-full mt-3">
                      <Download className="w-3 h-3 mr-1" />
                      Generate Now
                    </Button>
                  </div>
                ))}
              </div>
              <Button className="w-full bg-transparent" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Create Custom Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Communication Hub */}
        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle>Communication Hub</CardTitle>
              <CardDescription>Broadcast alerts and direct messaging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <label className="font-semibold">Broadcast to All Clinics</label>
                <Textarea placeholder="Enter your message..." className="min-h-[100px]" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Message priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent - Emergency Alert</SelectItem>
                    <SelectItem value="high">High - Policy Update</SelectItem>
                    <SelectItem value="normal">Normal - General Announcement</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send to All {stateMetrics.totalClinics} Clinics
                </Button>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Recent Communications</h3>
                {[
                  {
                    subject: "Fentanyl surge alert - Wayne County",
                    date: "2024-01-15",
                    acknowledged: 5,
                    total: 5,
                  },
                  {
                    subject: "Mi-SUTWA Q1 reporting deadline reminder",
                    date: "2024-01-12",
                    acknowledged: 4,
                    total: 5,
                  },
                ].map((msg, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div className="font-medium text-sm">{msg.subject}</div>
                      <div className="text-xs text-gray-500">{msg.date}</div>
                    </div>
                    <Badge>
                      {msg.acknowledged}/{msg.total} acknowledged
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Performance Management */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Management</CardTitle>
              <CardDescription>Set benchmarks and track improvement plans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-green-50">
                  <Award className="w-6 h-6 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-900">2</div>
                  <div className="text-sm text-gray-600">Top Performers</div>
                </div>
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <TrendingUp className="w-6 h-6 text-yellow-600 mb-2" />
                  <div className="text-2xl font-bold text-yellow-900">2</div>
                  <div className="text-sm text-gray-600">Needs Improvement</div>
                </div>
                <div className="border rounded-lg p-4 bg-red-50">
                  <AlertTriangle className="w-6 h-6 text-red-600 mb-2" />
                  <div className="text-2xl font-bold text-red-900">1</div>
                  <div className="text-sm text-gray-600">Critical Intervention</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">State Benchmarks</h3>
                <div className="space-y-2">
                  {[
                    { metric: "Compliance Score", target: "≥ 90%", current: "91.2%" },
                    { metric: "Quality Score", target: "≥ 85%", current: "89.1%" },
                    { metric: "Surveillance Reporting", target: "100% on-time", current: "94%" },
                  ].map((benchmark, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">{benchmark.metric}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Target: {benchmark.target}</span>
                        <span className="text-sm font-semibold">Current: {benchmark.current}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Resource Allocation */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Allocation</CardTitle>
              <CardDescription>Track funding, grants, and resource distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <DollarSign className="w-6 h-6 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">$47.3M</div>
                  <div className="text-sm text-gray-600">Total Funding Distributed</div>
                </div>
                <div className="border rounded-lg p-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600 mb-2" />
                  <div className="text-2xl font-bold">8,934</div>
                  <div className="text-sm text-gray-600">Naloxone Kits Distributed</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Priority Recommendations</h3>
                <div className="space-y-2">
                  {[
                    { clinic: "Macomb Treatment Services", need: "Workforce Development", amount: "$125K" },
                    { clinic: "Genesee Recovery Center", need: "Infrastructure Upgrade", amount: "$200K" },
                  ].map((rec, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <div className="font-medium text-sm">{rec.clinic}</div>
                        <div className="text-xs text-gray-500">{rec.need}</div>
                      </div>
                      <Badge>{rec.amount}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Compliance Enforcement */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Enforcement</CardTitle>
              <CardDescription>Violations, sanctions, and investigations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-red-50">
                  <div className="text-2xl font-bold text-red-900">6</div>
                  <div className="text-sm text-gray-600">Active Violations</div>
                </div>
                <div className="border rounded-lg p-4 bg-orange-50">
                  <div className="text-2xl font-bold text-orange-900">2</div>
                  <div className="text-sm text-gray-600">Active Sanctions</div>
                </div>
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <div className="text-2xl font-bold text-yellow-900">3</div>
                  <div className="text-sm text-gray-600">Open Investigations</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Recent Enforcement Actions</h3>
                {[
                  {
                    clinic: "Macomb Treatment Services",
                    violation: "Late SUDORS submissions",
                    action: "Probation",
                    date: "2024-01-08",
                  },
                  {
                    clinic: "Livingston Recovery",
                    violation: "Incomplete workforce data",
                    action: "Warning issued",
                    date: "2024-01-05",
                  },
                ].map((enforcement, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div className="font-medium text-sm">{enforcement.clinic}</div>
                      <div className="text-xs text-gray-500">{enforcement.violation}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">{enforcement.action}</Badge>
                      <div className="text-xs text-gray-500 mt-1">{enforcement.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 8: Best Practices */}
        <TabsContent value="practices">
          <Card>
            <CardHeader>
              <CardTitle>Best Practices & Innovation</CardTitle>
              <CardDescription>Highlight top performers and share success stories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Featured Innovation</span>
                </div>
                <div className="font-semibold">Oakland Behavioral Health</div>
                <div className="text-sm text-gray-600 mt-1">
                  Implemented peer recovery specialist program - 98% retention rate
                </div>
                <Button size="sm" className="mt-3 bg-transparent" variant="outline">
                  View Case Study
                </Button>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Recognized Excellence</h3>
                {[
                  {
                    clinic: "Oakland Behavioral Health",
                    achievement: "Recovery Friendly Workplace Certification",
                    date: "2024-01-10",
                  },
                  {
                    clinic: "Kent County FQHC",
                    achievement: "100% Mi-SUTWA Compliance (4 consecutive quarters)",
                    date: "2024-01-08",
                  },
                ].map((recognition, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{recognition.clinic}</div>
                      <div className="text-xs text-gray-500">{recognition.achievement}</div>
                    </div>
                    <div className="text-xs text-gray-500">{recognition.date}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
