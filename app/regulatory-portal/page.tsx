"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Lock, FileText, Database, CheckCircle, Download, Eye, Calendar } from "lucide-react"

export default function RegulatoryPortalPage() {
  const [accessType, setAccessType] = useState("state")

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Regulatory Affairs Data Portal</h1>
            <p className="text-gray-600 mt-1">Secure data access for state, county, and federal regulatory entities</p>
          </div>

          {/* Active Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Regulatory Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-gray-500 mt-1">2 State, 1 County</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Data Exports This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-gray-500 mt-1">Compliance reports</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="access-management" className="space-y-4">
            <TabsList>
              <TabsTrigger value="access-management">Access Management</TabsTrigger>
              <TabsTrigger value="data-requests">Data Requests</TabsTrigger>
              <TabsTrigger value="compliance-reports">Compliance Reports</TabsTrigger>
              <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="access-management" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Regulatory Entity Access Management
                  </CardTitle>
                  <CardDescription>Manage secure access for government agencies and regulatory bodies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Access Request Form */}
                  <div className="border rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Grant New Access</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Entity Type</Label>
                        <Select value={accessType} onValueChange={setAccessType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="state">State Health Department</SelectItem>
                            <SelectItem value="county">County Health Department</SelectItem>
                            <SelectItem value="samhsa">SAMHSA</SelectItem>
                            <SelectItem value="dea">DEA</SelectItem>
                            <SelectItem value="cms">CMS</SelectItem>
                            <SelectItem value="oig">OIG</SelectItem>
                            <SelectItem value="jcaho">Joint Commission</SelectItem>
                            <SelectItem value="carf">CARF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Agency Name</Label>
                        <Input placeholder="e.g., California DHCS" />
                      </div>
                      <div className="space-y-2">
                        <Label>Inspector Name</Label>
                        <Input placeholder="Full name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Inspector Email</Label>
                        <Input type="email" placeholder="email@agency.gov" />
                      </div>
                      <div className="space-y-2">
                        <Label>Access Level</Label>
                        <Select defaultValue="standard">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View Only</SelectItem>
                            <SelectItem value="standard">Standard Reports</SelectItem>
                            <SelectItem value="full">Full Data Access</SelectItem>
                            <SelectItem value="custom">Custom Dataset</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Access Duration</Label>
                        <Select defaultValue="30">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="14">14 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                            <SelectItem value="90">90 Days</SelectItem>
                            <SelectItem value="365">1 Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Access Scope</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          "Patient Demographics",
                          "Treatment Outcomes",
                          "Quality Metrics",
                          "Compliance Data",
                          "Staff Credentials",
                          "Incident Reports",
                          "Financial Data",
                          "Audit Results",
                        ].map((scope) => (
                          <div key={scope} className="flex items-center gap-2">
                            <input type="checkbox" id={scope} className="rounded" />
                            <label htmlFor={scope} className="text-sm">
                              {scope}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Lock className="h-5 w-5 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        All access is logged and monitored. Credentials will be sent via secure email.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <Shield className="h-4 w-4 mr-2" />
                        Grant Access
                      </Button>
                      <Button variant="outline">Review Later</Button>
                    </div>
                  </div>

                  {/* Active Access List */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Active Regulatory Access</h3>
                    <div className="space-y-3">
                      {[
                        {
                          entity: "California DHCS",
                          type: "State",
                          inspector: "Dr. Sarah Johnson",
                          email: "s.johnson@dhcs.ca.gov",
                          access: "Full Data Access",
                          granted: "2024-12-20",
                          expires: "2025-03-20",
                          status: "active",
                        },
                        {
                          entity: "Los Angeles County Health",
                          type: "County",
                          inspector: "Michael Chen",
                          email: "m.chen@ph.lacounty.gov",
                          access: "Standard Reports",
                          granted: "2025-01-02",
                          expires: "2025-02-01",
                          status: "active",
                        },
                        {
                          entity: "DEA",
                          type: "Federal",
                          inspector: "Agent David Martinez",
                          email: "d.martinez@dea.gov",
                          access: "Controlled Substances Only",
                          granted: "2024-12-15",
                          expires: "2025-01-15",
                          status: "active",
                        },
                      ].map((access, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{access.entity}</h4>
                                <Badge variant="outline">{access.type}</Badge>
                                <Badge
                                  className={
                                    access.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {access.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                                <p>
                                  <span className="font-medium">Inspector:</span> {access.inspector}
                                </p>
                                <p>
                                  <span className="font-medium">Access Level:</span> {access.access}
                                </p>
                                <p>
                                  <span className="font-medium">Email:</span> {access.email}
                                </p>
                                <p>
                                  <span className="font-medium">Expires:</span> {access.expires}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                Revoke
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data-requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Regulatory Data Requests
                  </CardTitle>
                  <CardDescription>Manage and fulfill data requests from regulatory entities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        id: "REQ-2025-001",
                        entity: "SAMHSA",
                        requestor: "Regional Director",
                        type: "Annual Compliance Report",
                        dateRequested: "2025-01-01",
                        dueDate: "2025-01-15",
                        status: "in_progress",
                        priority: "high",
                      },
                      {
                        id: "REQ-2025-002",
                        entity: "State Health Department",
                        requestor: "Inspector Johnson",
                        type: "42 CFR Part 2 Audit",
                        dateRequested: "2024-12-28",
                        dueDate: "2025-01-10",
                        status: "pending",
                        priority: "urgent",
                      },
                      {
                        id: "REQ-2024-089",
                        entity: "County Health",
                        requestor: "Quality Manager",
                        type: "Quarterly Outcomes Data",
                        dateRequested: "2024-12-20",
                        dueDate: "2024-12-31",
                        status: "completed",
                        priority: "normal",
                      },
                    ].map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{request.id}</h4>
                              <Badge
                                className={
                                  request.priority === "urgent"
                                    ? "bg-red-100 text-red-800"
                                    : request.priority === "high"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-blue-100 text-blue-800"
                                }
                              >
                                {request.priority}
                              </Badge>
                              <Badge
                                variant={request.status === "completed" ? "default" : "outline"}
                                className={
                                  request.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : request.status === "in_progress"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : ""
                                }
                              >
                                {request.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{request.type}</p>
                          </div>
                          <div className="flex gap-2">
                            {request.status === "completed" ? (
                              <Button size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" variant="outline">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Generate
                                </Button>
                                <Button size="sm">Fulfill</Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Entity</p>
                            <p className="font-medium">{request.entity}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Requestor</p>
                            <p className="font-medium">{request.requestor}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Requested</p>
                            <p className="font-medium">{request.dateRequested}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Due Date</p>
                            <p className="font-medium">{request.dueDate}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance-reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    Pre-Generated Compliance Reports
                  </CardTitle>
                  <CardDescription>Standard reports available for regulatory download</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        name: "42 CFR Part 2 Compliance Report",
                        description: "Privacy and confidentiality compliance",
                        frequency: "Monthly",
                        lastGenerated: "2025-01-01",
                        size: "2.4 MB",
                        format: "PDF",
                      },
                      {
                        name: "SAMHSA Performance Measures",
                        description: "National Outcome Measures (NOMs)",
                        frequency: "Quarterly",
                        lastGenerated: "2024-12-31",
                        size: "5.1 MB",
                        format: "Excel",
                      },
                      {
                        name: "DEA Controlled Substances Audit",
                        description: "Inventory and dispensing logs",
                        frequency: "Weekly",
                        lastGenerated: "2025-01-03",
                        size: "1.8 MB",
                        format: "PDF",
                      },
                      {
                        name: "State Licensing Compliance",
                        description: "Staff credentials and training records",
                        frequency: "Monthly",
                        lastGenerated: "2025-01-01",
                        size: "3.2 MB",
                        format: "PDF",
                      },
                      {
                        name: "CCBHC Quality Measures",
                        description: "All 9 required services and metrics",
                        frequency: "Monthly",
                        lastGenerated: "2025-01-01",
                        size: "4.7 MB",
                        format: "Excel",
                      },
                      {
                        name: "Medicaid Billing Compliance",
                        description: "Claims accuracy and documentation",
                        frequency: "Monthly",
                        lastGenerated: "2024-12-31",
                        size: "6.3 MB",
                        format: "Excel",
                      },
                    ].map((report, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{report.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                          </div>
                          <Badge variant="outline">{report.frequency}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Updated {report.lastGenerated}</span>
                            <span>
                              {report.size} • {report.format}
                            </span>
                          </div>
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit-log" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-indigo-600" />
                    Regulatory Access Audit Log
                  </CardTitle>
                  <CardDescription>
                    Complete audit trail of all regulatory entity access and data exports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input placeholder="Search audit log..." className="flex-1" />
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          <SelectItem value="login">Logins</SelectItem>
                          <SelectItem value="download">Downloads</SelectItem>
                          <SelectItem value="export">Data Exports</SelectItem>
                          <SelectItem value="access">Access Granted</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Date Range
                      </Button>
                    </div>
                    <div className="border rounded-lg divide-y">
                      {[
                        {
                          timestamp: "2025-01-03 14:23:15",
                          entity: "California DHCS",
                          user: "Dr. Sarah Johnson",
                          action: "Downloaded",
                          resource: "42 CFR Part 2 Compliance Report",
                          ip: "192.168.1.1",
                          status: "success",
                        },
                        {
                          timestamp: "2025-01-03 11:45:32",
                          entity: "County Health",
                          user: "Michael Chen",
                          action: "Exported",
                          resource: "De-identified Patient Demographics",
                          ip: "10.0.0.15",
                          status: "success",
                        },
                        {
                          timestamp: "2025-01-03 09:12:08",
                          entity: "DEA",
                          user: "Agent Martinez",
                          action: "Logged In",
                          resource: "Portal Access",
                          ip: "172.16.0.5",
                          status: "success",
                        },
                        {
                          timestamp: "2025-01-02 16:30:45",
                          entity: "SAMHSA",
                          user: "Regional Director",
                          action: "Generated",
                          resource: "Annual Compliance Report",
                          ip: "203.0.113.42",
                          status: "success",
                        },
                      ].map((log, idx) => (
                        <div key={idx} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-blue-100 text-blue-800">{log.action}</Badge>
                                <span className="text-sm font-medium">{log.resource}</span>
                                {log.status === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
                                <p>
                                  <span className="font-medium">Entity:</span> {log.entity}
                                </p>
                                <p>
                                  <span className="font-medium">User:</span> {log.user}
                                </p>
                                <p>
                                  <span className="font-medium">IP:</span> {log.ip}
                                </p>
                                <p>
                                  <span className="font-medium">Time:</span> {log.timestamp}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
