"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building,
  Users,
  FileText,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Shield,
  FileCheck,
  Package,
  Activity,
  Clock,
  Target,
  FileOutput,
  Database,
} from "lucide-react"

export default function PIHPPortal() {
  const [selectedPIHP, setSelectedPIHP] = useState("DWIHN")

  const pihpOptions = [
    { id: "DWIHN", name: "Detroit Wayne Integrated Health Network (DWIHN)" },
    { id: "OCHN", name: "Oakland Community Health Network (OCHN)" },
  ]

  // 6 Buckets Data Structure
  const dashboardData = {
    memberEpisodes: {
      totalMembers: 1247,
      activeEpisodes: 892,
      pendingIntakes: 34,
      dischargesThisMonth: 67,
    },
    clinicalCompliance: {
      assessmentsComplete: 94.2,
      treatmentPlansUpdated: 97.8,
      dosingDocumented: 99.1,
      careCoordNotes: 88.7,
    },
    utilizationManagement: {
      activeAuthorizations: 892,
      pendingReviews: 23,
      auditPacketsReady: 847,
      denialRate: 2.3,
    },
    encounterReadiness: {
      readyForSubmission: 2847,
      missingDocumentation: 134,
      pendingValidation: 67,
      submittedThisWeek: 2691,
    },
    bhTedsReadiness: {
      admissionsReady: 98.4,
      dischargesReady: 96.7,
      validationErrors: 12,
      lastSubmission: "Mar 18, 2025",
    },
    qualityPerformance: {
      timeToIntake: 4.2,
      timeToFirstService: 6.8,
      retentionRate: 76.3,
      followUpRate: 82.1,
    },
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">
          {/* Header with PIHP Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">PIHP Portal Dashboard</h1>
                <p className="text-muted-foreground">
                  Government-grade validation and audit-ready reporting for PIHPs
                </p>
              </div>
              <select
                value={selectedPIHP}
                onChange={(e) => setSelectedPIHP(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-background"
              >
                {pihpOptions.map((pihp) => (
                  <option key={pihp.id} value={pihp.id}>
                    {pihp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 42 CFR Part 2 Compliance Banner */}
            <Card className="border-blue-600 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">42 CFR Part 2 Modernization Ready (Feb 2026)</h3>
                    <p className="text-sm text-blue-800 mt-1">
                      This portal is designed for the upcoming 42 CFR Part 2 compliance window. Single consent for TPO,
                      redisclosure tracking, and breach alignment built-in.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="dashboard">Overview</TabsTrigger>
              <TabsTrigger value="member-episodes">Member/Episodes</TabsTrigger>
              <TabsTrigger value="clinical">Clinical Compliance</TabsTrigger>
              <TabsTrigger value="um">UM/Medical Necessity</TabsTrigger>
              <TabsTrigger value="encounters">Encounters</TabsTrigger>
              <TabsTrigger value="bh-teds">BH-TEDS</TabsTrigger>
              <TabsTrigger value="quality">Quality & Performance</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB - Power BI Style Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Active Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.memberEpisodes.totalMembers}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.memberEpisodes.activeEpisodes} active episodes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Encounter Readiness
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.encounterReadiness.readyForSubmission}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.encounterReadiness.missingDocumentation} missing docs
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      BH-TEDS Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.bhTedsReadiness.admissionsReady}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.bhTedsReadiness.validationErrors} validation errors
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Retention Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.qualityPerformance.retentionRate}%</div>
                    <p className="text-xs text-green-600">Above 75% target</p>
                  </CardContent>
                </Card>
              </div>

              {/* One-Click Audit Packet Section */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    One-Click Audit Packet Generator
                  </CardTitle>
                  <CardDescription>Generate audit-ready packets for PIHP reviews in seconds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">Standard Audit Packet</h4>
                        <ul className="text-sm space-y-2 mb-4">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Treatment plan + last review
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Medical necessity rationale
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Key notes supporting billed services
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Lab confirmations
                          </li>
                        </ul>
                        <Button className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Generate Standard Packet
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">OTP-Specific Audit Packet</h4>
                        <ul className="text-sm space-y-2 mb-4">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Take-home decision trail
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Dosing documentation + attendance
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Recalls/diversion checks
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            ASAM placement logic
                          </li>
                        </ul>
                        <Button className="w-full bg-transparent" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Generate OTP Packet
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Data Quality Gatekeeper */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Data Quality Gatekeeper (Government-Grade Validation)
                  </CardTitle>
                  <CardDescription>
                    Pre-submission validation prevents rejections before they happen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <div className="text-3xl font-bold text-green-600">2,847</div>
                        <p className="text-sm text-muted-foreground mt-1">Encounters passed validation</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 text-center">
                        <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                        <div className="text-3xl font-bold text-yellow-600">12</div>
                        <p className="text-sm text-muted-foreground mt-1">BH-TEDS validation errors</p>
                        <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                          View & Fix
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 text-center">
                        <Database className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                        <div className="text-3xl font-bold text-blue-600">99.2%</div>
                        <p className="text-sm text-muted-foreground mt-1">First-pass acceptance rate</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MEMBER/EPISODES TAB */}
            <TabsContent value="member-episodes" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.memberEpisodes.totalMembers}</div>
                    <p className="text-xs text-muted-foreground">Active in your PIHP network</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Active Episodes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.memberEpisodes.activeEpisodes}</div>
                    <p className="text-xs text-muted-foreground">Referral → admission tracked</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Pending Intakes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {dashboardData.memberEpisodes.pendingIntakes}
                    </div>
                    <p className="text-xs text-muted-foreground">Require action</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Episode Milestone Tracking</CardTitle>
                  <CardDescription>
                    Track member journey: Referral → Intake → Admission → Discharge/Transfer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Demographics, payer/eligibility identifiers, and program enrollment status visible here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CLINICAL COMPLIANCE TAB */}
            <TabsContent value="clinical" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Assessments Complete</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.clinicalCompliance.assessmentsComplete}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Treatment Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.clinicalCompliance.treatmentPlansUpdated}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Dosing Documented</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.clinicalCompliance.dosingDocumented}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Care Coordination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.clinicalCompliance.careCoordNotes}%</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>OTP-Specific Documentation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Screening/assessment artifacts (bio-psycho-social, ASAM)</span>
                    <Badge className="bg-green-600">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Treatment plan + periodic reviews</span>
                    <Badge className="bg-green-600">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Dosing documentation (attendance, take-homes)</span>
                    <Badge className="bg-green-600">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Care coordination notes (referrals, labs, PCP)</span>
                    <Badge variant="secondary">88.7%</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* UTILIZATION MANAGEMENT TAB */}
            <TabsContent value="um" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Active Authorizations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.utilizationManagement.activeAuthorizations}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Pending Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {dashboardData.utilizationManagement.pendingReviews}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Audit Packets Ready</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.utilizationManagement.auditPacketsReady}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Denial Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.utilizationManagement.denialRate}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Medical Necessity Documentation</CardTitle>
                  <CardDescription>
                    Authorization requests, continued stay rationale, LOC justification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>
                    <FileOutput className="h-4 w-4 mr-2" />
                    Generate UM Audit Packet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ENCOUNTERS TAB */}
            <TabsContent value="encounters" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Ready for Submission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.encounterReadiness.readyForSubmission}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Missing Documentation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {dashboardData.encounterReadiness.missingDocumentation}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Pending Validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {dashboardData.encounterReadiness.pendingValidation}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Submitted This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.encounterReadiness.submittedThisWeek}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900">DWIHN Weekly Encounter Submission</h3>
                      <p className="text-sm text-blue-800 mt-1">
                        DWIHN requires weekly encounter submission. Service line items are automatically validated and
                        ready for your cadence.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* BH-TEDS TAB */}
            <TabsContent value="bh-teds" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Admissions Ready</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.bhTedsReadiness.admissionsReady}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Discharges Ready</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.bhTedsReadiness.dischargesReady}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Validation Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {dashboardData.bhTedsReadiness.validationErrors}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Last Submission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{dashboardData.bhTedsReadiness.lastSubmission}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-purple-900">BH-TEDS Rejection Prevention</CardTitle>
                  <CardDescription>
                    Pre-submission validation prevents DEG file rejections due to strict rules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded bg-white">
                      <span>Admission/discharge/service extract fields</span>
                      <Badge className="bg-green-600">Validated</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded bg-white">
                      <span>Internal validation checks</span>
                      <Badge className="bg-green-600">Passed</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded bg-white">
                      <span>DEG-ready output format</span>
                      <Badge className="bg-green-600">Ready</Badge>
                    </div>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download DEG-Ready File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* QUALITY & PERFORMANCE TAB */}
            <TabsContent value="quality" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Time to Intake</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.qualityPerformance.timeToIntake} days
                    </div>
                    <p className="text-xs text-muted-foreground">Target: &lt;7 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Time to First Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.qualityPerformance.timeToFirstService} days
                    </div>
                    <p className="text-xs text-muted-foreground">Target: &lt;10 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Retention Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.qualityPerformance.retentionRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">Target: &gt;75%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Follow-up Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.qualityPerformance.followUpRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">After critical events</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Block Grant Performance Measures</CardTitle>
                  <CardDescription>
                    Measures aligned to state programs and block grant expectations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Timely Access (intake/first service)</span>
                      <Badge className="bg-green-600">Meeting Target</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Retention & Engagement</span>
                      <Badge className="bg-green-600">Above Baseline</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Case Management Linkages</span>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Outcomes Tracking</span>
                      <Badge className="bg-green-600">On Track</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
