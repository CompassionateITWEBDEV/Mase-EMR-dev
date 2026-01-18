"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, Users, FileText, TrendingUp, Download, Calendar } from "lucide-react"

export default function PIHPPortalDashboard() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">PIHP Portal Dashboard</h1>
            <p className="text-muted-foreground">
              Access mental health and OTP service data for your managed care population
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">OTP Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-muted-foreground">Active in treatment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">MH Encounters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,891</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Readmission Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.4%</div>
                <p className="text-xs text-green-600">-2.1% from target</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Request Data Extract
                </CardTitle>
                <CardDescription>Generate reports for quality measures and utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-transparent" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Member Roster
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Utilization Report
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Quality Measures
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Outcome Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Data Requests</CardTitle>
                <CardDescription>Track status of your data extracts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: "Q1 2025 Utilization", status: "completed", date: "Mar 15, 2025" },
                    { title: "Member Roster - March", status: "completed", date: "Mar 10, 2025" },
                    { title: "Quality Measures Report", status: "pending", date: "Mar 20, 2025" },
                  ].map((request, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground">{request.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={request.status === "completed" ? "default" : "secondary"}>
                          {request.status}
                        </Badge>
                        {request.status === "completed" && (
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">HIPAA & 42 CFR Part 2 Compliance</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    All data access is logged and monitored. Access is restricted to authorized personnel only. SUD
                    treatment information requires specific patient consent per 42 CFR Part 2.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
