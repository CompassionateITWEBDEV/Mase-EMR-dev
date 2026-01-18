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

        {/* Additional tabs have placeholder content */}
        <TabsContent value="inspections">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Management</CardTitle>
              <CardDescription>Schedule and track OTP program inspections and site visits</CardDescription>
            </CardHeader>
            <CardContent className="py-8 text-center text-muted-foreground">
              Inspection scheduling and tracking interface
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes">
          <Card>
            <CardHeader>
              <CardTitle>Patient Outcomes Tracking</CardTitle>
              <CardDescription>Monitor treatment effectiveness and patient success metrics</CardDescription>
            </CardHeader>
            <CardContent className="py-8 text-center text-muted-foreground">
              Patient outcome analytics and reporting
            </CardContent>
          </Card>
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
