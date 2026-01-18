"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  AlertTriangle,
  Award,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  Target,
  Building2,
  GraduationCap,
  Heart,
  Send,
  BarChart3,
  Shield,
} from "lucide-react"

export default function MichiganWorkforcePage() {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock workforce data - in production, fetch from michigan_workforce_assessment table
  const workforceData = {
    totalStaff: 247,
    vacantPositions: 8,
    turnoverRate: 12.3,
    avgTimeToHire: 45,
    licensesExpiring90Days: 15,
    trainingOverdue: 42,
    recoveryFriendlyCertified: true,
    certificationExpires: "2025-03-15",
    peerSpecialists: 28,
    livedExperienceStaff: 35,
    staffWithMATTraining: 156,
    staffWith42CFRTraining: 189,
    complianceRate: 94.2,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Michigan SUD Workforce Assessment</h1>
            <p className="text-slate-600 mt-1">
              Mi-SUTWA Infrastructure Reporting & Recovery Friendly Workplace Initiative
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-green-600 text-white">MPHI Aligned</Badge>
              <Badge className="bg-blue-600 text-white">MDHHS Compatible</Badge>
              <Badge className="bg-purple-600 text-white">State Export Ready</Badge>
            </div>
          </div>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-5 w-5" />
            Export to State
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Workforce</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{workforceData.totalStaff}</div>
              <p className="text-xs opacity-80 mt-1">Active employees</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Infrastructure Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{workforceData.vacantPositions}</div>
              <p className="text-xs opacity-80 mt-1">{workforceData.avgTimeToHire} days avg to hire</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Recovery Friendly</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{workforceData.peerSpecialists}</div>
              <p className="text-xs opacity-80 mt-1">
                Peer specialists + {workforceData.livedExperienceStaff} lived experience
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Compliance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{workforceData.complianceRate}%</div>
              <p className="text-xs opacity-80 mt-1">Training & credentialing current</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gaps">Infrastructure Gaps</TabsTrigger>
            <TabsTrigger value="recovery">Recovery Friendly</TabsTrigger>
            <TabsTrigger value="competencies">SUD Competencies</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="exports">State Exports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workforce Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Workforce Capacity Summary
                  </CardTitle>
                  <CardDescription>Current staffing levels across all departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: "Clinical Services", count: 85, target: 90, gap: 5 },
                      { category: "Nursing", count: 42, target: 45, gap: 3 },
                      { category: "Case Management", count: 35, target: 35, gap: 0 },
                      { category: "Peer Services", count: 28, target: 30, gap: 2 },
                      { category: "Administration", count: 32, target: 32, gap: 0 },
                      { category: "Support Services", count: 25, target: 28, gap: 3 },
                    ].map((dept, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium text-sm">{dept.category}</p>
                          <p className="text-xs text-slate-600">Target: {dept.target} staff</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{dept.count}</p>
                            <p className="text-xs text-slate-500">Current</p>
                          </div>
                          {dept.gap > 0 ? (
                            <Badge variant="destructive" className="w-16">
                              -{dept.gap} Gap
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 w-16">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Met
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Mi-SUTWA Export Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Send className="h-5 w-5 mr-2 text-green-600" />
                    Mi-SUTWA Reporting Status
                  </CardTitle>
                  <CardDescription>Michigan SUD Treatment Workforce Assessment readiness</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-green-900">Export Ready</h3>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">Workforce metrics</span>
                          <Badge className="bg-green-600">Complete</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">Credentialing data</span>
                          <Badge className="bg-green-600">Complete</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">Training compliance</span>
                          <Badge className="bg-green-600">Complete</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">Gap analysis</span>
                          <Badge className="bg-green-600">Complete</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Recent Exports</h4>
                      {[
                        {
                          date: "2024-01-01",
                          type: "Mi-SUTWA Q4 2023",
                          status: "Confirmed",
                          conf: "MI-SUTWA-2024-001",
                        },
                        {
                          date: "2023-10-01",
                          type: "Mi-SUTWA Q3 2023",
                          status: "Confirmed",
                          conf: "MI-SUTWA-2023-004",
                        },
                        {
                          date: "2023-07-01",
                          type: "Mi-SUTWA Q2 2023",
                          status: "Confirmed",
                          conf: "MI-SUTWA-2023-003",
                        },
                      ].map((exp, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs border-b pb-2 last:border-0"
                        >
                          <div>
                            <p className="font-medium">{exp.type}</p>
                            <p className="text-slate-500">{exp.conf}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-700 text-xs mb-1">{exp.status}</Badge>
                            <p className="text-slate-500">{exp.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Q1 2024 Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MASE Workforce Infrastructure Advantage */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900">
                  <Target className="h-6 w-6 mr-2" />
                  MASE Workforce Infrastructure Advantage
                </CardTitle>
                <CardDescription>
                  How MASE operationalizes Michigan's workforce assessment and recovery-friendly workplace priorities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      icon: GraduationCap,
                      title: "Training Infrastructure",
                      description:
                        "Comprehensive training library with CEU tracking makes staff development measurable and reportable",
                      metric: "42 modules, 100% compliance tracking",
                    },
                    {
                      icon: Shield,
                      title: "Credential Tracking",
                      description:
                        "Automated license verification and renewal alerts ensure workforce compliance is export-ready",
                      metric: "Real-time verification, 90-day expiration alerts",
                    },
                    {
                      icon: Clock,
                      title: "Facial Biometric Time Clock",
                      description:
                        "Precise workforce utilization data with GPS verification for accurate productivity reporting",
                      metric: "98.5% verification rate, automated payroll",
                    },
                    {
                      icon: Heart,
                      title: "Recovery Friendly Policies",
                      description:
                        "Built-in peer specialist workflows and recovery accommodation tracking aligns with MPHI initiative",
                      metric: "28 peer specialists, lived experience integration",
                    },
                    {
                      icon: AlertTriangle,
                      title: "Gap Identification",
                      description: "Automated gap detection for staffing, training, and infrastructure challenges",
                      metric: "13 gaps identified, 8 in resolution",
                    },
                    {
                      icon: Send,
                      title: "State Export Ready",
                      description: "One-click export to Mi-SUTWA, MPHI dashboards, and MDHHS reporting formats",
                      metric: "CSV, JSON, XLSX, FHIR compatible",
                    },
                  ].map((feature, idx) => (
                    <div
                      key={idx}
                      className="border border-blue-200 bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <feature.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                          <p className="text-sm text-slate-600 mb-2">{feature.description}</p>
                          <p className="text-xs font-medium text-blue-600">{feature.metric}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Infrastructure Gaps Tab */}
          <TabsContent value="gaps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Workforce Infrastructure Gaps
                </CardTitle>
                <CardDescription>Identified challenges requiring state support or intervention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      category: "Staffing",
                      gap: "Difficulty recruiting MAT-waivered prescribers",
                      severity: "critical",
                      impact: "Limits patient capacity by 30 patients/month",
                      solution: "State loan repayment program, telehealth prescriber network",
                      cost: 125000,
                      timeline: "6-9 months",
                      stateSupport: true,
                    },
                    {
                      category: "Training",
                      gap: "Limited access to 42 CFR Part 2 training in rural areas",
                      severity: "high",
                      impact: "58 staff need certification, compliance risk",
                      solution: "Virtual training platform, MDHHS partnership",
                      cost: 15000,
                      timeline: "2-3 months",
                      stateSupport: true,
                    },
                    {
                      category: "Technology",
                      gap: "No integrated biometric time tracking for CHW field staff",
                      severity: "medium",
                      impact: "Payroll accuracy, billable hour verification",
                      solution: "MASE biometric module implementation",
                      cost: 8500,
                      timeline: "1 month",
                      stateSupport: false,
                    },
                    {
                      category: "Facility",
                      gap: "Inadequate medication storage for expanded OTP capacity",
                      severity: "high",
                      impact: "DEA compliance risk, limited takehome capacity",
                      solution: "Secure storage room renovation, DEA inspection",
                      cost: 45000,
                      timeline: "3-4 months",
                      stateSupport: true,
                    },
                    {
                      category: "Compliance",
                      gap: "Manual diversion monitoring lacks real-time GPS tracking",
                      severity: "critical",
                      impact: "State callback delays, regulatory audit findings",
                      solution: "MASE GPS bottle tracking with facial biometrics",
                      cost: 12000,
                      timeline: "2 weeks",
                      stateSupport: false,
                    },
                  ].map((gap, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      style={{
                        borderColor:
                          gap.severity === "critical" ? "#dc2626" : gap.severity === "high" ? "#ea580c" : "#eab308",
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="font-semibold"
                            style={{
                              borderColor:
                                gap.severity === "critical"
                                  ? "#dc2626"
                                  : gap.severity === "high"
                                    ? "#ea580c"
                                    : "#eab308",
                              color:
                                gap.severity === "critical"
                                  ? "#dc2626"
                                  : gap.severity === "high"
                                    ? "#ea580c"
                                    : "#eab308",
                            }}
                          >
                            {gap.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary">{gap.category}</Badge>
                        </div>
                        {gap.stateSupport && (
                          <Badge className="bg-purple-100 text-purple-700 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            State Support Needed
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-900 mb-2">{gap.gap}</h3>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-600 font-medium">Impact: </span>
                          <span className="text-slate-800">{gap.impact}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 font-medium">Proposed Solution: </span>
                          <span className="text-slate-800">{gap.solution}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-xs text-slate-600">Est. Cost</p>
                              <p className="font-semibold text-slate-900">${gap.cost.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Timeline</p>
                              <p className="font-semibold text-slate-900">{gap.timeline}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recovery Friendly Workplace Tab */}
          <TabsContent value="recovery" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Certification Status */}
              <Card className="border-2 border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-900">
                    <Award className="h-5 w-5 mr-2" />
                    Recovery Friendly Workplace Certification
                  </CardTitle>
                  <CardDescription>MPHI & MDHHS Recovery Friendly Workplace Initiative</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-green-900">Certification Status</span>
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Certified
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-xs text-slate-600 mb-1">Certification Date</p>
                        <p className="font-semibold text-green-900">March 15, 2023</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-xs text-slate-600 mb-1">Expires</p>
                        <p className="font-semibold text-green-900">March 15, 2025</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <h4 className="font-semibold text-sm mb-3">Certification Requirements Met</h4>
                      <div className="space-y-2">
                        {[
                          "Peer specialists employed and integrated",
                          "Recovery support policies documented",
                          "Stigma-reduction training completed",
                          "Accommodation procedures established",
                          "Leadership buy-in demonstrated",
                          "Community partnership active",
                        ].map((req, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-slate-700">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700 mt-4">
                      <FileText className="h-4 w-4 mr-2" />
                      View Certification
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recovery Workforce Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Recovery Workforce Composition
                  </CardTitle>
                  <CardDescription>Staff with lived experience and recovery support roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-600">{workforceData.peerSpecialists}</p>
                        <p className="text-sm text-slate-600 mt-1">Peer Recovery Specialists</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-purple-600">{workforceData.livedExperienceStaff}</p>
                        <p className="text-sm text-slate-600 mt-1">Staff w/ Lived Experience</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t">
                      <h4 className="font-semibold text-sm">Active Recovery Support Initiatives</h4>
                      {[
                        { name: "Peer Support Integration", staff: 28, impact: "High", status: "Active" },
                        { name: "Recovery Accommodation Program", staff: 12, impact: "Medium", status: "Active" },
                        { name: "Stigma Reduction Training", staff: 247, impact: "High", status: "Completed" },
                        { name: "Recovery-Focused Supervision", staff: 35, impact: "Medium", status: "Active" },
                      ].map((initiative, idx) => (
                        <div key={idx} className="flex items-center justify-between border rounded-lg p-3">
                          <div>
                            <p className="font-medium text-sm">{initiative.name}</p>
                            <p className="text-xs text-slate-600">{initiative.staff} staff involved</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={initiative.impact === "High" ? "default" : "secondary"} className="text-xs">
                              {initiative.impact}
                            </Badge>
                            <Badge className="bg-green-100 text-green-700 text-xs">{initiative.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SUD Competencies Tab */}
          <TabsContent value="competencies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                  SUD-Specific Workforce Competencies
                </CardTitle>
                <CardDescription>
                  Specialized training and credentials for substance use disorder treatment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      competency: "MAT/MOUD Training",
                      trained: 156,
                      total: 247,
                      percentage: 63.2,
                      description: "Medication-Assisted Treatment prescribing and management",
                      required: "Clinical staff, nurses, case managers",
                    },
                    {
                      competency: "42 CFR Part 2 Compliance",
                      trained: 189,
                      total: 247,
                      percentage: 76.5,
                      description: "Confidentiality of substance use treatment records",
                      required: "All staff with patient contact",
                    },
                    {
                      competency: "Trauma-Informed Care",
                      trained: 231,
                      total: 247,
                      percentage: 93.5,
                      description: "Understanding trauma's role in addiction and recovery",
                      required: "All clinical and direct care staff",
                    },
                    {
                      competency: "Harm Reduction Principles",
                      trained: 198,
                      total: 247,
                      percentage: 80.2,
                      description: "Evidence-based harm reduction strategies and naloxone distribution",
                      required: "Clinical, peer support, outreach staff",
                    },
                    {
                      competency: "Motivational Interviewing",
                      trained: 142,
                      total: 247,
                      percentage: 57.5,
                      description: "Client-centered counseling approach for behavior change",
                      required: "Counselors, case managers, peer specialists",
                    },
                    {
                      competency: "Co-Occurring Disorders",
                      trained: 167,
                      total: 247,
                      percentage: 67.6,
                      description: "Integrated treatment for mental health and SUD",
                      required: "Clinical staff, case managers",
                    },
                  ].map((comp, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{comp.competency}</h3>
                          <p className="text-sm text-slate-600 mb-2">{comp.description}</p>
                          <p className="text-xs text-blue-600 font-medium">Required for: {comp.required}</p>
                        </div>
                        <Badge
                          variant={comp.percentage >= 80 ? "default" : "secondary"}
                          className={comp.percentage >= 80 ? "bg-green-600" : "bg-orange-500 text-white"}
                        >
                          {comp.percentage.toFixed(1)}%
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Staff Trained</span>
                          <span className="font-semibold">
                            {comp.trained} / {comp.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${comp.percentage}%`,
                              backgroundColor: comp.percentage >= 80 ? "#16a34a" : "#ea580c",
                            }}
                          />
                        </div>
                      </div>

                      {comp.percentage < 80 && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2 text-xs text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{comp.total - comp.trained} staff need training</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Workforce Compliance Metrics
                  </CardTitle>
                  <CardDescription>Credentialing, licensing, and training compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-green-900">Overall Compliance Score</span>
                        <span className="text-3xl font-bold text-green-600">{workforceData.complianceRate}%</span>
                      </div>
                      <p className="text-xs text-green-700">Exceeds state minimum of 90%</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-xs text-slate-600 mb-1">Licenses Current</p>
                        <p className="text-2xl font-bold text-blue-600">232</p>
                        <p className="text-xs text-slate-500">94% of staff</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-orange-200">
                        <p className="text-xs text-slate-600 mb-1">Expiring Soon</p>
                        <p className="text-2xl font-bold text-orange-600">{workforceData.licensesExpiring90Days}</p>
                        <p className="text-xs text-slate-500">Within 90 days</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-xs text-slate-600 mb-1">Background Checks</p>
                        <p className="text-2xl font-bold text-green-600">247</p>
                        <p className="text-xs text-slate-500">100% current</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-red-200">
                        <p className="text-xs text-slate-600 mb-1">Training Overdue</p>
                        <p className="text-2xl font-bold text-red-600">{workforceData.trainingOverdue}</p>
                        <p className="text-xs text-slate-500">Requires action</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <h4 className="font-semibold text-sm mb-3">Compliance Alerts</h4>
                      <div className="space-y-2">
                        {[
                          {
                            alert: "15 licenses expiring in next 90 days",
                            action: "Schedule renewals",
                            priority: "high",
                          },
                          {
                            alert: "42 staff overdue for annual compliance training",
                            action: "Assign modules",
                            priority: "critical",
                          },
                          {
                            alert: "3 background checks pending review",
                            action: "HR review required",
                            priority: "medium",
                          },
                          {
                            alert: "8 staff need updated I-9 verification",
                            action: "Schedule I-9 audit",
                            priority: "high",
                          },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between border rounded-lg p-3 text-sm">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{item.alert}</p>
                              <p className="text-xs text-slate-600 mt-1">{item.action}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                item.priority === "critical"
                                  ? "border-red-500 text-red-700"
                                  : item.priority === "high"
                                    ? "border-orange-500 text-orange-700"
                                    : "border-yellow-500 text-yellow-700"
                              }
                            >
                              {item.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MASE Compliance Infrastructure */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    MASE Compliance Infrastructure
                  </CardTitle>
                  <CardDescription>How MASE makes workforce compliance measurable</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        feature: "Automated License Tracking",
                        description: "Real-time state board verification with 90/60/30-day expiration alerts",
                        icon: Award,
                      },
                      {
                        feature: "Training Library & CEU Tracking",
                        description: "42 MASE-built training modules with automatic compliance scoring",
                        icon: GraduationCap,
                      },
                      {
                        feature: "Background Check Management",
                        description: "FCRA-compliant tracking with automatic renewal reminders",
                        icon: Shield,
                      },
                      {
                        feature: "Facial Biometric Time Clock",
                        description: "Precise workforce utilization data for productivity and billing reporting",
                        icon: Clock,
                      },
                      {
                        feature: "Onboarding Workflow",
                        description: "Structured 45-day onboarding with task completion tracking",
                        icon: CheckCircle2,
                      },
                      {
                        feature: "One-Click State Export",
                        description: "Export workforce data to Mi-SUTWA, MPHI, MDHHS in required formats",
                        icon: Send,
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 border rounded-lg p-3 bg-white">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <item.icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900">{item.feature}</h4>
                          <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* State Exports Tab */}
          <TabsContent value="exports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="h-5 w-5 mr-2 text-blue-600" />
                  Michigan State Workforce Data Exports
                </CardTitle>
                <CardDescription>Export-ready workforce data for state reporting requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Export Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        type: "Mi-SUTWA Quarterly",
                        description: "Michigan SUD Treatment Workforce Assessment",
                        icon: FileText,
                        frequency: "Quarterly",
                        lastExport: "2024-01-01",
                        status: "Due: April 1, 2024",
                      },
                      {
                        type: "MPHI Dashboard",
                        description: "Michigan Public Health Institute Workforce Metrics",
                        icon: BarChart3,
                        frequency: "Monthly",
                        lastExport: "2024-01-01",
                        status: "Due: February 1, 2024",
                      },
                      {
                        type: "MDHHS Report",
                        description: "Michigan Dept of Health & Human Services Staffing Report",
                        icon: Building2,
                        frequency: "Annual",
                        lastExport: "2023-07-01",
                        status: "Next: July 1, 2024",
                      },
                    ].map((exp, idx) => (
                      <Card key={idx} className="border-2 hover:border-blue-300 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <exp.icon className="h-8 w-8 text-blue-600" />
                            <Badge variant="outline">{exp.frequency}</Badge>
                          </div>
                          <CardTitle className="text-base mt-2">{exp.type}</CardTitle>
                          <CardDescription className="text-xs">{exp.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">Last Export:</span>
                              <span className="font-semibold">{exp.lastExport}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">{exp.status.includes("Due") ? "Due:" : "Next:"}</span>
                              <span className="font-semibold text-orange-600">
                                {exp.status.replace("Due: ", "").replace("Next: ", "")}
                              </span>
                            </div>
                            <Button className="w-full mt-3" size="sm">
                              <Download className="h-3 w-3 mr-2" />
                              Generate Export
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Export History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Export History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          {
                            date: "2024-01-01",
                            type: "Mi-SUTWA Q4 2023",
                            format: "XLSX",
                            records: 247,
                            status: "Confirmed",
                            conf: "MI-SUTWA-2024-001",
                          },
                          {
                            date: "2024-01-01",
                            type: "MPHI Dashboard December",
                            format: "JSON",
                            records: 247,
                            status: "Confirmed",
                            conf: "MPHI-2024-012",
                          },
                          {
                            date: "2023-12-01",
                            type: "MPHI Dashboard November",
                            format: "JSON",
                            records: 235,
                            status: "Confirmed",
                            conf: "MPHI-2023-011",
                          },
                          {
                            date: "2023-10-01",
                            type: "Mi-SUTWA Q3 2023",
                            format: "XLSX",
                            records: 229,
                            status: "Confirmed",
                            conf: "MI-SUTWA-2023-004",
                          },
                        ].map((exp, idx) => (
                          <div key={idx} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{exp.type}</p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {exp.date} • {exp.records} records • {exp.format}
                              </p>
                              <p className="text-xs text-blue-600 mt-1 font-mono">{exp.conf}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {exp.status}
                              </Badge>
                              <Button size="sm" variant="ghost">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
