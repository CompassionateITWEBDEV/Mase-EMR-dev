"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Upload, FileBarChart, Shield, RefreshCw } from "lucide-react"

export default function CountyPIHPPortalPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">County & PIHP Portal</h1>
          <p className="text-muted-foreground">
            Prepaid Inpatient Health Plan (PIHP) integration and county reporting
          </p>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-600">
          Coming Soon
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Portal Access Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure connections to county PIHP portals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set up API credentials, portal URLs, and data mapping for seamless integration with county 
              behavioral health authorities and PIHP systems.
            </p>
            <Button variant="outline" disabled>
              Configure Portal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Data Exports</CardTitle>
            </div>
            <CardDescription>
              Schedule and manage data submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Automate required data submissions to county systems including encounter data, 
              authorization requests, and compliance reports.
            </p>
            <Button variant="outline" disabled>
              Manage Exports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Compliance Reports</CardTitle>
            </div>
            <CardDescription>
              Generate county-required reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access pre-built report templates for PIHP compliance including utilization management, 
              quality metrics, and financial reconciliation.
            </p>
            <Button variant="outline" disabled>
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg">Sync Status</CardTitle>
            </div>
            <CardDescription>
              Monitor data synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track the status of data transfers, identify sync failures, and view detailed 
              logs of all portal interactions.
            </p>
            <Button variant="outline" disabled>
              View Status
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">Feature Under Development</h3>
              <p className="text-sm text-blue-800 mt-1">
                County & PIHP portal integration is currently being developed. This feature will provide 
                automated data exchange with county behavioral health authorities and Prepaid Inpatient 
                Health Plans, streamlining compliance reporting and authorization workflows.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
