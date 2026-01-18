"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, GraduationCap, AlertTriangle, TrendingUp, Download, FileText, BarChart3 } from "lucide-react"

export default function MiSUTWAPortal() {
  const workforceMetrics = {
    totalProviders: 3247,
    vacantPositions: 412,
    avgTimeToFill: 78,
    trainingCompliance: 87.3,
    certificationRate: 92.1,
    retentionRate: 76.4,
  }

  const criticalGaps = [
    { role: "MAT Prescribers", shortage: 89, severity: "critical", region: "Upper Peninsula" },
    { role: "Peer Recovery Specialists", shortage: 134, severity: "high", region: "Northern Michigan" },
    { role: "Bilingual Counselors", shortage: 67, severity: "high", region: "Southeast Michigan" },
    { role: "Crisis Counselors", shortage: 45, severity: "moderate", region: "West Michigan" },
  ]

  const trainingNeeds = [
    { topic: "MAT/MOUD Training", enrolled: 234, completed: 178, compliance: 76, target: 90 },
    { topic: "Trauma-Informed Care", enrolled: 456, completed: 423, compliance: 93, target: 85 },
    { topic: "42 CFR Part 2", enrolled: 389, completed: 367, compliance: 94, target: 95 },
    { topic: "Cultural Competency", enrolled: 301, completed: 245, compliance: 81, target: 85 },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Mi-SUTWA Portal</h1>
            <p className="text-muted-foreground">Michigan Substance Use Disorder Treatment Workforce Assessment</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Quarterly Report
          </Button>
        </div>

        {/* Metrics Bar */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{workforceMetrics.totalProviders}</div>
              <p className="text-muted-foreground text-xs">Across all clinics</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vacant Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-red-600">{workforceMetrics.vacantPositions}</div>
              <p className="text-muted-foreground text-xs">12.7% vacancy rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Time to Fill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{workforceMetrics.avgTimeToFill} days</div>
              <p className="text-muted-foreground text-xs">Target: 45 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Training Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-green-600">{workforceMetrics.trainingCompliance}%</div>
              <p className="text-muted-foreground text-xs">Above target</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Certification Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{workforceMetrics.certificationRate}%</div>
              <p className="text-muted-foreground text-xs">State-licensed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-yellow-600">{workforceMetrics.retentionRate}%</div>
              <p className="text-muted-foreground text-xs">12-month retention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="gaps" className="space-y-4">
          <TabsList>
            <TabsTrigger value="gaps">Workforce Gaps</TabsTrigger>
            <TabsTrigger value="training">Training Needs</TabsTrigger>
            <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
            <TabsTrigger value="reports">Reports & Data</TabsTrigger>
          </TabsList>

          {/* Workforce Gaps Tab */}
          <TabsContent value="gaps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Critical Workforce Shortages by Role</CardTitle>
                <CardDescription>Identified gaps requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {criticalGaps.map((gap, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className={`h-5 w-5 ${gap.severity === "critical" ? "text-red-600" : gap.severity === "high" ? "text-orange-500" : "text-yellow-600"}`} />
                        <div>
                          <p className="font-semibold">{gap.role}</p>
                          <p className="text-muted-foreground text-sm">{gap.region}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={gap.severity === "critical" ? "destructive" : "secondary"}>
                          {gap.shortage} positions short
                        </Badge>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Needs Tab */}
          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Completion & Compliance</CardTitle>
                <CardDescription>Statewide training needs and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {trainingNeeds.map((training, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{training.topic}</p>
                          <p className="text-muted-foreground text-sm">
                            {training.completed} of {training.enrolled} completed ({training.compliance}% compliance)
                          </p>
                        </div>
                        <Badge variant={training.compliance >= training.target ? "default" : "destructive"}>
                          Target: {training.target}%
                        </Badge>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${training.compliance >= training.target ? "bg-green-600" : "bg-yellow-600"}`}
                          style={{ width: `${training.compliance}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recruitment Tab */}
          <TabsContent value="recruitment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recruitment Pipeline & Strategies</CardTitle>
                <CardDescription>Workforce development initiatives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Active Job Postings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="font-bold text-3xl">187</div>
                        <p className="text-muted-foreground text-sm">Across 42 clinics</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Candidates in Pipeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="font-bold text-3xl">523</div>
                        <p className="text-muted-foreground text-sm">Various stages</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Scholarships Active</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="font-bold text-3xl">89</div>
                        <p className="text-muted-foreground text-sm">HRSA funded</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports & Data Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quarterly Reports & Data Exports</CardTitle>
                <CardDescription>Download standardized Mi-SUTWA assessment reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="mr-2 h-4 w-4" />
                    Q1 2025 Workforce Assessment Report (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Statewide Training Completion Data (Excel)
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="mr-2 h-4 w-4" />
                    Provider Credential Matrix (CSV)
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Training Needs Assessment (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
