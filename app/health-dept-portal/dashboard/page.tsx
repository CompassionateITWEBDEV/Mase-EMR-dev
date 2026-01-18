"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Syringe, AlertTriangle, FileBarChart, TrendingUp, Download, Shield } from "lucide-react"

export default function HealthDeptPortalDashboard() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Health Department Portal</h1>
            <p className="text-muted-foreground">
              Access immunization records, disease surveillance, and public health reporting
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Immunizations (MTD)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3,847</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Coverage Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.3%</div>
                <p className="text-xs text-green-600">Above target (85%)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Reportable Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">Requiring follow-up</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registry Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.8%</div>
                <p className="text-xs text-green-600">Successfully synced</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5" />
                  Generate Reports
                </CardTitle>
                <CardDescription>Public health surveillance and coverage reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-transparent" variant="outline">
                  <Syringe className="mr-2 h-4 w-4" />
                  Immunization Coverage
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Disease Surveillance
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Outbreak Tracking
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Vaccine Inventory
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Generated public health reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: "Weekly Immunization Summary", status: "completed", date: "Mar 18, 2025" },
                    { title: "Flu Vaccination Campaign", status: "completed", date: "Mar 15, 2025" },
                    { title: "Monthly Disease Surveillance", status: "generating", date: "Mar 20, 2025" },
                  ].map((report, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.status === "completed" ? "default" : "secondary"}>{report.status}</Badge>
                        {report.status === "completed" && (
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

          {/* Public Health Notice */}
          <Card className="border-teal-200 bg-teal-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-teal-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-teal-900">Public Health Data Access</h3>
                  <p className="text-sm text-teal-800 mt-1">
                    Access to patient immunization records is authorized under public health statutes. All access is
                    audited. Data is automatically reported to state immunization registries as required by law.
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
