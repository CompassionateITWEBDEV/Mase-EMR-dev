"use client"

import { ComplianceReportGenerator } from "@/components/compliance-report-generator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Shield, FileCheck, BarChart3, Calendar, Download } from "lucide-react"

export default function RegulatoryReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-800" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Compliance Reporting Center</h1>
                <p className="text-slate-200">Generate comprehensive regulatory compliance reports</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-200">MASE Behavioral Health Center</p>
              <p className="font-medium">Automated Report Generation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DEA Compliance</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">83%</div>
              <p className="text-xs text-muted-foreground">1 critical issue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">JC Standards</CardTitle>
              <FileCheck className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">78%</div>
              <p className="text-xs text-muted-foreground">2 standards not met</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Inspection</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">70</div>
              <p className="text-xs text-muted-foreground">Days until state review</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Generator */}
        <ComplianceReportGenerator />

        {/* Additional Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Reporting</CardTitle>
              <CardDescription>Schedule automatic report generation for regular compliance monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Weekly DEA Summary</p>
                  <p className="text-sm text-muted-foreground">Every Monday at 8:00 AM</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Monthly JC Dashboard</p>
                  <p className="text-sm text-muted-foreground">First day of each month</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Quarterly Compliance Review</p>
                  <p className="text-sm text-muted-foreground">End of each quarter</p>
                </div>
                <Badge variant="outline">Inactive</Badge>
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                <Calendar className="h-4 w-4 mr-2" />
                Manage Schedules
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Archive</CardTitle>
              <CardDescription>Access historical compliance reports and documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reports this year</span>
                  <Badge variant="outline">156</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total storage used</span>
                  <Badge variant="outline">2.8 GB</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Retention period</span>
                  <Badge variant="outline">7 years</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Reports
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Archive
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
