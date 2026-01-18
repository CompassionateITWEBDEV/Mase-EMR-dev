"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { FeatureGate } from "@/components/feature-gate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
} from "lucide-react"

interface ResearchStudy {
  id: string
  title: string
  type: "implementation" | "pilot" | "quality_improvement" | "outcomes" | "equity"
  status: "planning" | "active" | "data_collection" | "analysis" | "completed"
  pi_name: string
  start_date: string
  end_date: string
  enrollment_target: number
  current_enrollment: number
  irb_status: "pending" | "approved" | "exempt"
  funding_source: string
  description: string
}

interface EvidenceBasedPractice {
  id: string
  name: string
  category: string
  adoption_rate: number
  fidelity_score: number
  sustainability_score: number
  trained_staff: number
  total_staff: number
  last_fidelity_review: string
  outcomes_tracked: string[]
}

interface QualityMetric {
  id: string
  name: string
  category: string
  current_value: number
  target_value: number
  trend: "up" | "down" | "stable"
  benchmark: number
  data_source: string
}

export default function ResearchDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewStudyDialog, setShowNewStudyDialog] = useState(false)
  const [showDataExportDialog, setShowDataExportDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Mock research studies
  const [studies] = useState<ResearchStudy[]>([
    {
      id: "1",
      title: "Implementation of Contingency Management in OTP Settings",
      type: "implementation",
      status: "active",
      pi_name: "Dr. Sarah Chen",
      start_date: "2025-01-15",
      end_date: "2026-01-15",
      enrollment_target: 200,
      current_enrollment: 145,
      irb_status: "approved",
      funding_source: "SAMHSA",
      description:
        "Evaluating the adoption and sustainability of contingency management protocols in community-based OTP settings.",
    },
    {
      id: "2",
      title: "CCBHC Quality Improvement Initiative",
      type: "quality_improvement",
      status: "data_collection",
      pi_name: "Dr. Michael Thompson",
      start_date: "2024-09-01",
      end_date: "2025-09-01",
      enrollment_target: 500,
      current_enrollment: 423,
      irb_status: "exempt",
      funding_source: "State CCBHC Grant",
      description: "Continuous quality improvement program tracking CCBHC performance measures and patient outcomes.",
    },
    {
      id: "3",
      title: "Health Equity in MAT Access",
      type: "equity",
      status: "active",
      pi_name: "Dr. Angela Martinez",
      start_date: "2025-02-01",
      end_date: "2026-02-01",
      enrollment_target: 300,
      current_enrollment: 89,
      irb_status: "approved",
      funding_source: "NIH HEAL Initiative",
      description:
        "Examining disparities in medication-assisted treatment access and outcomes across demographic groups.",
    },
    {
      id: "4",
      title: "Telehealth Integration Pilot",
      type: "pilot",
      status: "completed",
      pi_name: "Dr. James Wilson",
      start_date: "2024-06-01",
      end_date: "2024-12-31",
      enrollment_target: 100,
      current_enrollment: 98,
      irb_status: "approved",
      funding_source: "Internal",
      description: "Pilot study evaluating telehealth integration for counseling services in OTP settings.",
    },
  ])

  // Mock evidence-based practices
  const [ebps] = useState<EvidenceBasedPractice[]>([
    {
      id: "1",
      name: "Motivational Interviewing (MI)",
      category: "Counseling",
      adoption_rate: 87,
      fidelity_score: 78,
      sustainability_score: 85,
      trained_staff: 45,
      total_staff: 52,
      last_fidelity_review: "2025-01-10",
      outcomes_tracked: ["Treatment retention", "Patient satisfaction", "Substance use reduction"],
    },
    {
      id: "2",
      name: "Contingency Management",
      category: "Behavioral",
      adoption_rate: 65,
      fidelity_score: 72,
      sustainability_score: 68,
      trained_staff: 28,
      total_staff: 52,
      last_fidelity_review: "2024-12-15",
      outcomes_tracked: ["UDS results", "Attendance", "Treatment completion"],
    },
    {
      id: "3",
      name: "Cognitive Behavioral Therapy (CBT)",
      category: "Counseling",
      adoption_rate: 92,
      fidelity_score: 84,
      sustainability_score: 90,
      trained_staff: 48,
      total_staff: 52,
      last_fidelity_review: "2025-01-05",
      outcomes_tracked: ["Depression scores", "Anxiety scores", "Coping skills"],
    },
    {
      id: "4",
      name: "Trauma-Informed Care",
      category: "Organizational",
      adoption_rate: 78,
      fidelity_score: 71,
      sustainability_score: 82,
      trained_staff: 52,
      total_staff: 52,
      last_fidelity_review: "2024-11-20",
      outcomes_tracked: ["Staff knowledge", "Patient safety", "Re-traumatization rates"],
    },
    {
      id: "5",
      name: "Medication-Assisted Treatment (MAT)",
      category: "Medical",
      adoption_rate: 100,
      fidelity_score: 95,
      sustainability_score: 98,
      trained_staff: 12,
      total_staff: 12,
      last_fidelity_review: "2025-01-02",
      outcomes_tracked: ["Retention", "Overdose prevention", "Viral suppression"],
    },
  ])

  // Mock quality metrics
  const [qualityMetrics] = useState<QualityMetric[]>([
    {
      id: "1",
      name: "Treatment Retention (90-day)",
      category: "Outcomes",
      current_value: 72,
      target_value: 80,
      trend: "up",
      benchmark: 75,
      data_source: "EHR",
    },
    {
      id: "2",
      name: "Follow-up After ED Visit",
      category: "CCBHC",
      current_value: 68,
      target_value: 75,
      trend: "up",
      benchmark: 70,
      data_source: "Claims",
    },
    {
      id: "3",
      name: "Depression Remission Rate",
      category: "Outcomes",
      current_value: 45,
      target_value: 50,
      trend: "stable",
      benchmark: 48,
      data_source: "PHQ-9",
    },
    {
      id: "4",
      name: "Initiation of MAT",
      category: "Access",
      current_value: 89,
      target_value: 95,
      trend: "up",
      benchmark: 85,
      data_source: "EHR",
    },
    {
      id: "5",
      name: "Screening for SDoH",
      category: "CCBHC",
      current_value: 82,
      target_value: 90,
      trend: "up",
      benchmark: 80,
      data_source: "EHR",
    },
    {
      id: "6",
      name: "Care Coordination Rate",
      category: "Integration",
      current_value: 65,
      target_value: 80,
      trend: "down",
      benchmark: 70,
      data_source: "EHR",
    },
  ])

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

  return (
    <FeatureGate feature="research-dashboard">
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 lg:ml-64">
        <DashboardHeader
          title="Research & Data Science Dashboard"
          description="Implementation science, quality improvement, and learning health system"
        />

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
                <p className="text-xs text-gray-500 mt-2">2 implementation, 1 equity</p>
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
                    <p className="text-2xl font-bold text-gray-900">4/6</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">67% meeting targets</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Research Participants</p>
                    <p className="text-2xl font-bold text-gray-900">755</p>
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
                    <Button onClick={() => setShowNewStudyDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Study
                    </Button>
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
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="data_collection">Data Collection</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    {studies.map((study) => (
                      <div key={study.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{study.title}</h3>
                              <Badge className={getStatusColor(study.status)}>{study.status.replace("_", " ")}</Badge>
                              <Badge variant="outline">{study.type.replace("_", " ")}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{study.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">PI:</span>
                                <p className="font-medium">{study.pi_name}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Funding:</span>
                                <p className="font-medium">{study.funding_source}</p>
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
                                  {study.start_date} - {study.end_date}
                                </p>
                              </div>
                            </div>
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
                            value={(study.current_enrollment / study.enrollment_target) * 100}
                            className="h-2"
                          />
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            Data Dashboard
                          </Button>
                          <Button size="sm" variant="outline">
                            Export Data
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add EBP
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ebps.map((ebp) => (
                      <div key={ebp.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{ebp.name}</h3>
                            <Badge variant="outline" className="mt-1">
                              {ebp.category}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Last Fidelity Review</p>
                            <p className="font-medium">{ebp.last_fidelity_review}</p>
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
                            {ebp.outcomes_tracked.map((outcome, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {outcome}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline">
                            Fidelity Assessment
                          </Button>
                          <Button size="sm" variant="outline">
                            Training Records
                          </Button>
                          <Button size="sm" variant="outline">
                            Outcomes Report
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Quality Metrics & Outcomes</CardTitle>
                      <CardDescription>Track performance against benchmarks and targets</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <FileBarChart className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Metric
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Metric</th>
                          <th className="text-left p-3 font-medium">Category</th>
                          <th className="text-center p-3 font-medium">Current</th>
                          <th className="text-center p-3 font-medium">Target</th>
                          <th className="text-center p-3 font-medium">Benchmark</th>
                          <th className="text-center p-3 font-medium">Trend</th>
                          <th className="text-center p-3 font-medium">Status</th>
                          <th className="text-center p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qualityMetrics.map((metric) => (
                          <tr key={metric.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <p className="font-medium">{metric.name}</p>
                              <p className="text-xs text-gray-500">Source: {metric.data_source}</p>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{metric.category}</Badge>
                            </td>
                            <td className="p-3 text-center font-bold">{metric.current_value}%</td>
                            <td className="p-3 text-center">{metric.target_value}%</td>
                            <td className="p-3 text-center text-gray-500">{metric.benchmark}%</td>
                            <td className="p-3 text-center">{getTrendIcon(metric.trend)}</td>
                            <td className="p-3 text-center">
                              {metric.current_value >= metric.target_value ? (
                                <Badge className="bg-green-100 text-green-800">Met</Badge>
                              ) : metric.current_value >= metric.benchmark ? (
                                <Badge className="bg-yellow-100 text-yellow-800">Near Target</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Below</Badge>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="equity">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      Health Equity Dashboard
                    </CardTitle>
                    <CardDescription>Monitor disparities across demographic groups</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">Identified Disparities</span>
                        </div>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>• 15% lower retention rate for Hispanic/Latino patients</li>
                          <li>• Rural patients have 23% longer wait times for appointments</li>
                          <li>• Black patients have 12% fewer take-home privileges</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Treatment Retention by Race/Ethnicity</h4>
                        {[
                          { group: "White", rate: 74, benchmark: 72 },
                          { group: "Black/African American", rate: 68, benchmark: 72 },
                          { group: "Hispanic/Latino", rate: 61, benchmark: 72 },
                          { group: "Asian", rate: 78, benchmark: 72 },
                          { group: "Other/Multi-racial", rate: 70, benchmark: 72 },
                        ].map((item) => (
                          <div key={item.group}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{item.group}</span>
                              <span
                                className={`text-sm font-medium ${item.rate < item.benchmark ? "text-red-600" : "text-green-600"}`}
                              >
                                {item.rate}%
                              </span>
                            </div>
                            <div className="relative">
                              <Progress value={item.rate} className="h-2" />
                              <div
                                className="absolute top-0 w-0.5 h-2 bg-gray-800"
                                style={{ left: `${item.benchmark}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-gray-500 mt-2">Black line indicates 72% benchmark</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Equity Improvement Initiatives</CardTitle>
                    <CardDescription>Active programs to address disparities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          title: "Culturally Adapted Counseling Program",
                          status: "active",
                          target_group: "Hispanic/Latino",
                          start_date: "2025-01-01",
                          progress: 35,
                        },
                        {
                          title: "Telehealth Expansion for Rural Access",
                          status: "active",
                          target_group: "Rural Communities",
                          start_date: "2024-10-01",
                          progress: 68,
                        },
                        {
                          title: "Peer Support Worker Diversity Initiative",
                          status: "planning",
                          target_group: "Black/African American",
                          start_date: "2025-04-01",
                          progress: 15,
                        },
                      ].map((initiative, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{initiative.title}</h4>
                              <p className="text-sm text-gray-500">Target: {initiative.target_group}</p>
                            </div>
                            <Badge className={getStatusColor(initiative.status)}>{initiative.status}</Badge>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-500">Progress</span>
                            <span className="text-sm font-medium">{initiative.progress}%</span>
                          </div>
                          <Progress value={initiative.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
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
      <Dialog open={showNewStudyDialog} onOpenChange={setShowNewStudyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Research Study</DialogTitle>
            <DialogDescription>Set up a new implementation, pilot, or quality improvement study</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Study Title</Label>
              <Input placeholder="Enter study title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Study Type</Label>
                <Select>
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
                <Label>Principal Investigator</Label>
                <Input placeholder="PI Name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Study description and objectives" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Enrollment Target</Label>
                <Input type="number" placeholder="Target participants" />
              </div>
              <div className="space-y-2">
                <Label>Funding Source</Label>
                <Input placeholder="Funding organization" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>IRB Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="exempt">Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewStudyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowNewStudyDialog(false)}>Create Study</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </FeatureGate>
  )
}
