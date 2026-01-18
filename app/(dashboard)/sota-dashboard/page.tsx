"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, AlertTriangle, CheckCircle2, Users, Pill, FileCheck, Download, Search, Filter } from "lucide-react"

export default function SOTADashboard() {
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data for SOTA oversight
  const sotaMetrics = {
    totalOTPPrograms: 47,
    activePatients: 12456,
    complianceRate: 93.6,
    pendingInspections: 8,
    diversionIncidents: 3,
    medicationDiscrepancies: 2,
  }

  const otpPrograms = [
    {
      id: 1,
      name: "Metro Detroit Recovery Center",
      dea: "RM1234567",
      census: 287,
      capacity: 300,
      compliance: 96.5,
      status: "active",
      nextInspection: "2025-03-15",
    },
    {
      id: 2,
      name: "Oakland Behavioral Health",
      dea: "RM2345678",
      census: 198,
      capacity: 250,
      compliance: 94.2,
      status: "active",
      nextInspection: "2025-04-22",
    },
    {
      id: 3,
      name: "Wayne County OTP",
      dea: "RM3456789",
      census: 156,
      capacity: 200,
      compliance: 89.7,
      status: "probation",
      nextInspection: "2025-02-10",
    },
    {
      id: 4,
      name: "Grand Rapids Treatment Services",
      dea: "RM4567890",
      census: 234,
      capacity: 275,
      compliance: 97.1,
      status: "active",
      nextInspection: "2025-05-18",
    },
    {
      id: 5,
      name: "Flint Opioid Recovery",
      dea: "RM5678901",
      census: 145,
      capacity: 180,
      compliance: 91.3,
      status: "active",
      nextInspection: "2025-03-28",
    },
  ]

  const diversionIncidents = [
    {
      id: 1,
      clinic: "Wayne County OTP",
      date: "2025-01-08",
      type: "Patient Diversion",
      medication: "Methadone 40mg",
      amount: "3 doses",
      status: "Under Investigation",
      deaReported: true,
    },
    {
      id: 2,
      clinic: "Metro Detroit Recovery Center",
      date: "2024-12-15",
      type: "Inventory Discrepancy",
      medication: "Buprenorphine",
      amount: "120mg",
      status: "Resolved",
      deaReported: false,
    },
    {
      id: 3,
      clinic: "Oakland Behavioral Health",
      date: "2024-11-22",
      type: "Take-Home Recall Failure",
      medication: "Methadone 80mg",
      amount: "7 doses",
      status: "Corrective Action",
      deaReported: true,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOTA Dashboard</h1>
          <p className="text-muted-foreground">State Opioid Treatment Authority - OTP Oversight & Compliance</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export SOTA Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OTP Programs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sotaMetrics.totalOTPPrograms}</div>
            <p className="text-xs text-muted-foreground">Licensed in Michigan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sotaMetrics.activePatients.toLocaleString()}</div>
            <p className="text-xs text-green-600">↑ 8.3% from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sotaMetrics.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">Avg across all programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
            <FileCheck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sotaMetrics.pendingInspections}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversion Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sotaMetrics.diversionIncidents}</div>
            <p className="text-xs text-muted-foreground">Active investigations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Med Discrepancies</CardTitle>
            <Pill className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{sotaMetrics.medicationDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">Flagged this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">OTP Programs</TabsTrigger>
          <TabsTrigger value="medication">Medication Accountability</TabsTrigger>
          <TabsTrigger value="diversion">Diversion Control</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="outcomes">Patient Outcomes</TabsTrigger>
          <TabsTrigger value="takehome">Take-Home Oversight</TabsTrigger>
        </TabsList>

        {/* OTP Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Licensed OTP Programs</CardTitle>
              <CardDescription>Monitor all opioid treatment programs operating in Michigan</CardDescription>
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, DEA#, or location..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {otpPrograms.map((program) => (
                  <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{program.name}</h3>
                        <Badge variant={program.status === "active" ? "default" : "destructive"}>
                          {program.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">DEA: {program.dea}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>
                          Census: {program.census}/{program.capacity}
                        </span>
                        <span>Compliance: {program.compliance}%</span>
                        <span>Next Inspection: {program.nextInspection}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medication Accountability Tab */}
        <TabsContent value="medication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication Accountability Reporting</CardTitle>
              <CardDescription>
                Track medication inventory, dispensing, and discrepancies across all OTPs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Methadone Dispensed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">248,567 mg</div>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Buprenorphine Dispensed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12,345 mg</div>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Inventory Discrepancies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">2</div>
                      <p className="text-xs text-muted-foreground">Under review</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  Detailed medication tracking charts and reports available
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diversion Control Tab */}
        <TabsContent value="diversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diversion Incidents & Investigations</CardTitle>
              <CardDescription>
                Monitor and track all diversion-related incidents requiring SOTA oversight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diversionIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{incident.clinic}</h3>
                        <Badge variant={incident.status === "Resolved" ? "default" : "destructive"}>
                          {incident.status}
                        </Badge>
                        {incident.deaReported && <Badge variant="outline">DEA Reported</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {incident.date} • {incident.type}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>{incident.medication}</span>
                        <span>Amount: {incident.amount}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Investigation
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections">
          <div className="space-y-6">
            {/* Upcoming Inspections */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Inspections</CardTitle>
                <CardDescription>Scheduled site visits and compliance reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      program: "Wayne County OTP",
                      date: "2025-02-10",
                      type: "Compliance Review",
                      inspector: "Sarah Martinez, SOTA Inspector",
                      priority: "high",
                      reason: "Follow-up on diversion incident",
                    },
                    {
                      program: "Metro Detroit Recovery Center",
                      date: "2025-03-15",
                      type: "Annual Inspection",
                      inspector: "Michael Thompson, SOTA Supervisor",
                      priority: "normal",
                      reason: "Scheduled annual review",
                    },
                    {
                      program: "Oakland Behavioral Health",
                      date: "2025-04-22",
                      type: "Site Visit",
                      inspector: "Jennifer Lee, SOTA Inspector",
                      priority: "normal",
                      reason: "New location approval",
                    },
                  ].map((inspection, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {inspection.priority === "high" ? (
                          <AlertTriangle className="h-8 w-8 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-8 w-8 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{inspection.program}</h3>
                          <Badge variant={inspection.priority === "high" ? "destructive" : "secondary"}>
                            {inspection.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Date:</strong> {inspection.date}</p>
                          <p><strong>Inspector:</strong> {inspection.inspector}</p>
                          <p><strong>Reason:</strong> {inspection.reason}</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">View Checklist</Button>
                          <Button size="sm" variant="outline">Reschedule</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inspection History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Inspection Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { program: "Flint Opioid Recovery", date: "2025-01-05", score: 96, findings: 2 },
                    { program: "Grand Rapids Treatment Services", date: "2024-12-18", score: 98, findings: 1 },
                    { program: "Oakland Behavioral Health", date: "2024-11-22", score: 94, findings: 3 },
                  ].map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{report.program}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{report.score}%</p>
                          <p className="text-xs text-muted-foreground">{report.findings} findings</p>
                        </div>
                        <Button size="sm">View Report</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="outcomes">
          <div className="space-y-6">
            {/* Statewide Outcomes Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Statewide Patient Outcomes</CardTitle>
                <CardDescription>Treatment effectiveness across all Michigan OTP programs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <p className="text-sm text-muted-foreground">Retention Rate (90 days)</p>
                    <p className="text-3xl font-bold text-green-700">73.4%</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="text-sm text-muted-foreground">Negative UDS Rate</p>
                    <p className="text-3xl font-bold text-blue-700">68.2%</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-purple-50">
                    <p className="text-sm text-muted-foreground">Employment Gained</p>
                    <p className="text-3xl font-bold text-purple-700">42.1%</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-orange-50">
                    <p className="text-sm text-muted-foreground">Housing Secured</p>
                    <p className="text-3xl font-bold text-orange-700">56.8%</p>
                  </div>
                </div>

                {/* Program-Level Outcomes */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Program Performance Comparison</h3>
                  {[
                    { name: "Metro Detroit Recovery", retention: 81, negativeUDS: 75, employment: 48 },
                    { name: "Grand Rapids Treatment", retention: 78, negativeUDS: 72, employment: 45 },
                    { name: "Oakland Behavioral", retention: 75, negativeUDS: 70, employment: 43 },
                    { name: "Flint Opioid Recovery", retention: 68, negativeUDS: 62, employment: 38 },
                    { name: "Wayne County OTP", retention: 64, negativeUDS: 58, employment: 35 },
                  ].map((program, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{program.name}</h4>
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">90-Day Retention</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${program.retention}%` }}></div>
                            </div>
                            <span className="font-semibold">{program.retention}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Negative UDS</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${program.negativeUDS}%` }}></div>
                            </div>
                            <span className="font-semibold">{program.negativeUDS}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Employment</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${program.employment}%` }}></div>
                            </div>
                            <span className="font-semibold">{program.employment}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Outcome Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-50 border-red-200 border rounded">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Wayne County OTP - Low Retention Rate</p>
                      <p className="text-sm text-red-700">64% retention rate is below state threshold of 70%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border-yellow-200 border rounded">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Flint Opioid Recovery - Employment Metrics</p>
                      <p className="text-sm text-yellow-700">Employment rate declining over last 2 quarters</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="takehome">
          <Card>
            <CardHeader>
              <CardTitle>Take-Home Medication Oversight</CardTitle>
              <CardDescription>Monitor take-home authorizations, callbacks, and compliance</CardDescription>
            </CardHeader>
            <CardContent className="py-8 text-center text-muted-foreground">
              Take-home medication monitoring dashboard
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
