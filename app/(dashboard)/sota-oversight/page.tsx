"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  Shield,
  MapPin,
  Calendar,
  Download,
  Search,
  Filter,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function SOTAOversightDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")

  // Mock data for OTP clinics
  const otpClinics = [
    {
      id: 1,
      name: "Metro Detroit OTP",
      county: "Wayne",
      license: "OTP-001-MI",
      patients: 487,
      dailyDoses: 425,
      takeHomeRate: 62,
      complianceScore: 98.2,
      diversionAlerts: 0,
      status: "compliant",
      lastInspection: "2024-12-15",
      nextInspection: "2025-03-15",
    },
    {
      id: 2,
      name: "Grand Rapids Treatment Center",
      county: "Kent",
      license: "OTP-015-MI",
      patients: 312,
      dailyDoses: 290,
      takeHomeRate: 58,
      complianceScore: 95.8,
      diversionAlerts: 1,
      status: "compliant",
      lastInspection: "2024-11-20",
      nextInspection: "2025-02-20",
    },
    {
      id: 3,
      name: "Flint Recovery Services",
      county: "Genesee",
      license: "OTP-023-MI",
      patients: 298,
      dailyDoses: 275,
      takeHomeRate: 52,
      complianceScore: 92.3,
      diversionAlerts: 2,
      status: "watch",
      lastInspection: "2024-10-05",
      nextInspection: "2025-01-05",
    },
    {
      id: 4,
      name: "Ann Arbor Opioid Treatment",
      county: "Washtenaw",
      license: "OTP-032-MI",
      patients: 223,
      dailyDoses: 198,
      takeHomeRate: 67,
      complianceScore: 97.5,
      diversionAlerts: 0,
      status: "compliant",
      lastInspection: "2025-01-02",
      nextInspection: "2025-04-02",
    },
    {
      id: 5,
      name: "Lansing MAT Clinic",
      county: "Ingham",
      license: "OTP-041-MI",
      patients: 189,
      dailyDoses: 175,
      takeHomeRate: 45,
      complianceScore: 89.1,
      diversionAlerts: 3,
      status: "investigation",
      lastInspection: "2024-12-10",
      nextInspection: "2025-01-10",
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOTA Oversight Dashboard</h1>
          <p className="text-muted-foreground">State Opioid Treatment Authority - Michigan OTP Monitoring</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export SOTA Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licensed OTPs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">5 active across Michigan</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-green-600">
                42 Compliant
              </Badge>
              <Badge variant="outline" className="text-yellow-600">
                3 Watch
              </Badge>
              <Badge variant="outline" className="text-red-600">
                2 Investigation
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total OTP Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18,947</div>
            <p className="text-xs text-green-600">+8.3% from last quarter</p>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">Average census: 403 patients/OTP</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DEA Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.7%</div>
            <p className="text-xs text-muted-foreground">Statewide average compliance</p>
            <div className="mt-2">
              <Progress value={94.7} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversion Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-red-600">Active investigations</p>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">12 resolved this month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="clinics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clinics">OTP Clinics</TabsTrigger>
          <TabsTrigger value="dea">DEA Compliance</TabsTrigger>
          <TabsTrigger value="diversion">Diversion Control</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="licensing">Licensing</TabsTrigger>
          <TabsTrigger value="reports">SOTA Reports</TabsTrigger>
        </TabsList>

        {/* OTP Clinics Tab */}
        <TabsContent value="clinics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Licensed OTP Facilities</CardTitle>
              <CardDescription>Monitor all state-licensed Opioid Treatment Programs</CardDescription>
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by clinic name, license, or county..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {otpClinics.map((clinic) => (
                  <Card key={clinic.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{clinic.name}</h3>
                            <Badge
                              variant={
                                clinic.status === "compliant"
                                  ? "default"
                                  : clinic.status === "watch"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {clinic.status === "compliant" ? (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 mr-1" />
                              )}
                              {clinic.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {clinic.county} County
                            </span>
                            <span>License: {clinic.license}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{clinic.complianceScore}%</div>
                          <div className="text-xs text-muted-foreground">Compliance Score</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <div className="text-sm font-medium">{clinic.patients}</div>
                          <div className="text-xs text-muted-foreground">Total Patients</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{clinic.dailyDoses}</div>
                          <div className="text-xs text-muted-foreground">Daily Doses</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{clinic.takeHomeRate}%</div>
                          <div className="text-xs text-muted-foreground">Take-Home Rate</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            {clinic.diversionAlerts}
                            {clinic.diversionAlerts > 0 && <AlertTriangle className="h-3 w-3 text-red-600" />}
                          </div>
                          <div className="text-xs text-muted-foreground">Diversion Alerts</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last Inspection: {clinic.lastInspection} | Next Due: {clinic.nextInspection}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Inspection Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEA Compliance Tab */}
        <TabsContent value="dea" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DEA Regulatory Compliance</CardTitle>
              <CardDescription>Monitor federal DEA requirements and controlled substance regulations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">DEA Registration Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">47/47</div>
                    <p className="text-xs text-green-600">100% Current Registrations</p>
                    <div className="mt-2 text-xs text-muted-foreground">3 renewals due Q1 2025</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Form 222 Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">98.9%</div>
                    <p className="text-xs text-green-600">Proper documentation</p>
                    <div className="mt-2 text-xs text-muted-foreground">1,247 orders processed</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Inventory Audits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">96.4%</div>
                    <p className="text-xs text-green-600">Audit compliance</p>
                    <div className="mt-2 text-xs text-muted-foreground">8 pending reviews</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Upcoming DEA Inspections</h3>
                <div className="space-y-2">
                  {[
                    { clinic: "Lansing MAT Clinic", date: "2025-01-10", type: "Routine", risk: "high" },
                    { clinic: "Flint Recovery Services", date: "2025-01-05", type: "Follow-up", risk: "medium" },
                    { clinic: "Metro Detroit OTP", date: "2025-03-15", type: "Routine", risk: "low" },
                  ].map((inspection, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{inspection.clinic}</div>
                        <div className="text-sm text-muted-foreground">{inspection.type} Inspection</div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            inspection.risk === "high"
                              ? "destructive"
                              : inspection.risk === "medium"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {inspection.risk.toUpperCase()} RISK
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">{inspection.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diversion Control Tab */}
        <TabsContent value="diversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication Diversion Control</CardTitle>
              <CardDescription>Monitor take-home medication compliance and diversion prevention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">6</div>
                    <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Bottle GPS Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2,847</div>
                    <p className="text-xs text-muted-foreground">Active tracked bottles</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Biometric Verifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18,234</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Diversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0.8%</div>
                    <p className="text-xs text-green-600">Below 2% threshold</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Active Diversion Investigations</h3>
                <div className="space-y-2">
                  {[
                    {
                      id: "DIV-2025-001",
                      clinic: "Lansing MAT Clinic",
                      patient: "Patient #4872",
                      issue: "Multiple missed callbacks",
                      severity: "High",
                      opened: "2025-01-08",
                    },
                    {
                      id: "DIV-2025-002",
                      clinic: "Flint Recovery Services",
                      patient: "Patient #3291",
                      issue: "GPS geofence violations",
                      severity: "High",
                      opened: "2025-01-06",
                    },
                    {
                      id: "DIV-2024-287",
                      clinic: "Grand Rapids Treatment Center",
                      patient: "Patient #5614",
                      issue: "Bottle seal tampering detected",
                      severity: "Medium",
                      opened: "2024-12-29",
                    },
                  ].map((investigation, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{investigation.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {investigation.clinic} - {investigation.patient}
                        </div>
                        <div className="text-sm mt-1">{investigation.issue}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={investigation.severity === "High" ? "destructive" : "secondary"}>
                          {investigation.severity}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">Opened: {investigation.opened}</div>
                        <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                          Review Case
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SOTA Inspection Schedule</CardTitle>
              <CardDescription>State oversight inspections and compliance reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                All OTPs require annual inspections. High-risk facilities may be inspected quarterly.
              </div>
              <Button className="mb-4">Schedule New Inspection</Button>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Upcoming Inspections (Next 30 Days)</h3>
                  <div className="space-y-2">
                    {otpClinics.slice(0, 3).map((clinic) => (
                      <div key={clinic.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{clinic.name}</div>
                          <div className="text-sm text-muted-foreground">License: {clinic.license}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{clinic.nextInspection}</div>
                          <Badge variant="outline">Scheduled</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licensing Tab */}
        <TabsContent value="licensing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OTP Licensing Management</CardTitle>
              <CardDescription>State licenses, certifications, and accreditation tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active Licenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">47</div>
                    <p className="text-xs text-green-600">All current and valid</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Renewals Due (90 days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">5</div>
                    <p className="text-xs text-yellow-600">Renewal applications pending</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">New Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2</div>
                    <p className="text-xs text-muted-foreground">Under review</p>
                  </CardContent>
                </Card>
              </div>

              <Button>Review License Applications</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOTA Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SOTA Regulatory Reports</CardTitle>
              <CardDescription>Generate compliance reports for state and federal oversight</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    name: "Quarterly OTP Compliance Report",
                    description: "Comprehensive compliance metrics for all licensed OTPs",
                    frequency: "Quarterly",
                    lastGenerated: "2024-10-01",
                  },
                  {
                    name: "DEA Form 222 Summary",
                    description: "Controlled substance ordering documentation",
                    frequency: "Monthly",
                    lastGenerated: "2025-01-01",
                  },
                  {
                    name: "Diversion Control Analysis",
                    description: "Take-home medication tracking and diversion prevention",
                    frequency: "Monthly",
                    lastGenerated: "2025-01-01",
                  },
                  {
                    name: "Patient Census Report",
                    description: "Statewide OTP patient enrollment and demographics",
                    frequency: "Monthly",
                    lastGenerated: "2025-01-01",
                  },
                  {
                    name: "Inspection Summary Report",
                    description: "SOTA inspection findings and corrective actions",
                    frequency: "Quarterly",
                    lastGenerated: "2024-10-01",
                  },
                  {
                    name: "License Renewal Tracking",
                    description: "Upcoming license expirations and renewal status",
                    frequency: "Monthly",
                    lastGenerated: "2025-01-01",
                  },
                ].map((report, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <div>Frequency: {report.frequency}</div>
                          <div>Last Generated: {report.lastGenerated}</div>
                        </div>
                        <Button size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Generate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
