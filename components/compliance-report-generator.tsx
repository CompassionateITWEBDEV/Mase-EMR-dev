"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { FileText, Download, Shield, FileCheck, BarChart3, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { format } from "date-fns"

interface ReportTemplate {
  id: string
  name: string
  type: "dea" | "joint_commission" | "combined"
  description: string
  sections: string[]
  estimatedTime: number
  icon: React.ComponentType<any>
}

interface GeneratedReport {
  id: string
  name: string
  type: string
  generatedAt: string
  generatedBy: string
  status: "generating" | "ready" | "error"
  downloadUrl?: string
  size?: string
}

export function ComplianceReportGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [reportParameters, setReportParameters] = useState({
    dateRange: "30",
    includePatientData: false,
    includeFinancialData: false,
    customNotes: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([])
  const [showCustomDialog, setShowCustomDialog] = useState(false)

  const reportTemplates: ReportTemplate[] = [
    {
      id: "dea-complete",
      name: "Complete DEA Inspection Report",
      type: "dea",
      description: "Comprehensive report covering all DEA compliance requirements",
      sections: [
        "Facility Information & Registration",
        "Inventory Records & Reconciliation",
        "Acquisition & Form 222 Documentation",
        "Dispensing Logs & Patient Records",
        "Waste & Disposal Documentation",
        "Security & Storage Compliance",
        "Staff Training & Access Records",
      ],
      estimatedTime: 5,
      icon: Shield,
    },
    {
      id: "dea-inventory",
      name: "DEA Inventory Reconciliation",
      type: "dea",
      description: "Detailed inventory analysis and variance reporting",
      sections: [
        "Current Inventory Status",
        "Perpetual Inventory Records",
        "Biennial Inventory Documentation",
        "Variance Analysis & Explanations",
        "Batch Tracking & Expiration Management",
      ],
      estimatedTime: 3,
      icon: BarChart3,
    },
    {
      id: "jc-accreditation",
      name: "Joint Commission Accreditation Readiness",
      type: "joint_commission",
      description: "Complete accreditation standards compliance assessment",
      sections: [
        "Standards Compliance Summary",
        "Quality Measures Performance",
        "Patient Safety Events & Analysis",
        "Staff Competency Documentation",
        "Policy & Procedure Review",
        "Performance Improvement Activities",
      ],
      estimatedTime: 7,
      icon: FileCheck,
    },
    {
      id: "jc-quality",
      name: "Quality Measures Dashboard",
      type: "joint_commission",
      description: "Performance metrics and quality indicator analysis",
      sections: [
        "Clinical Quality Measures",
        "Patient Safety Indicators",
        "Patient Experience Scores",
        "Outcome Metrics & Trends",
        "Benchmark Comparisons",
      ],
      estimatedTime: 4,
      icon: BarChart3,
    },
    {
      id: "combined-compliance",
      name: "Unified Compliance Summary",
      type: "combined",
      description: "Combined DEA and Joint Commission compliance overview",
      sections: [
        "Executive Summary",
        "DEA Compliance Status",
        "Joint Commission Standards",
        "Critical Issues & Action Plans",
        "Regulatory Timeline & Deadlines",
        "Resource Requirements",
      ],
      estimatedTime: 6,
      icon: FileText,
    },
  ]

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return

    setIsGenerating(true)
    setGenerationProgress(0)

    const template = reportTemplates.find((t) => t.id === selectedTemplate)
    if (!template) return

    // Simulate report generation with progress updates
    const progressSteps = template.sections.length
    for (let i = 0; i <= progressSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setGenerationProgress((i / progressSteps) * 100)
    }

    // Create new report record
    const newReport: GeneratedReport = {
      id: `RPT-${Date.now()}`,
      name: template.name,
      type: template.type,
      generatedAt: new Date().toISOString(),
      generatedBy: "Dr. Sarah Johnson",
      status: "ready",
      downloadUrl: "#",
      size: "2.4 MB",
    }

    setRecentReports((prev) => [newReport, ...prev.slice(0, 4)])
    setIsGenerating(false)
    setGenerationProgress(0)
    setSelectedTemplate("")
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "dea":
        return <Shield className="h-4 w-4 text-blue-600" />
      case "joint_commission":
        return <FileCheck className="h-4 w-4 text-emerald-600" />
      case "combined":
        return <FileText className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "dea":
        return <Badge className="bg-blue-100 text-blue-800">DEA</Badge>
      case "joint_commission":
        return <Badge className="bg-emerald-100 text-emerald-800">Joint Commission</Badge>
      case "combined":
        return <Badge className="bg-purple-100 text-purple-800">Combined</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "generating":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Report Templates</CardTitle>
          <CardDescription>Pre-configured reports for regulatory compliance and inspections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <template.icon className="h-5 w-5" />
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </div>
                    {getTypeBadge(template.type)}
                  </div>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      <p>Estimated time: {template.estimatedTime} minutes</p>
                      <p>Sections: {template.sections.length}</p>
                    </div>
                    <div className="space-y-1">
                      {template.sections.slice(0, 3).map((section, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-center space-x-1">
                          <span>•</span>
                          <span>{section}</span>
                        </div>
                      ))}
                      {template.sections.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{template.sections.length - 3} more sections
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Parameters */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Report Parameters</CardTitle>
            <CardDescription>Configure report settings and data inclusion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Date Range</Label>
                  <Select
                    value={reportParameters.dateRange}
                    onValueChange={(value) => setReportParameters((prev) => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                      <SelectItem value="all">All available data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Data Inclusion</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="patient-data"
                        checked={reportParameters.includePatientData}
                        onCheckedChange={(checked) =>
                          setReportParameters((prev) => ({ ...prev, includePatientData: checked as boolean }))
                        }
                      />
                      <Label htmlFor="patient-data" className="text-sm">
                        Include patient-level data
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="financial-data"
                        checked={reportParameters.includeFinancialData}
                        onCheckedChange={(checked) =>
                          setReportParameters((prev) => ({ ...prev, includeFinancialData: checked as boolean }))
                        }
                      />
                      <Label htmlFor="financial-data" className="text-sm">
                        Include financial data
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-notes">Custom Notes</Label>
                  <Textarea
                    id="custom-notes"
                    placeholder="Add any specific notes or context for this report..."
                    value={reportParameters.customNotes}
                    onChange={(e) => setReportParameters((prev) => ({ ...prev, customNotes: e.target.value }))}
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleGenerateReport} disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle>Generating Report</CardTitle>
            <CardDescription>Please wait while we compile your compliance report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={generationProgress} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing compliance data...</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Previously generated compliance reports</CardDescription>
            </div>
            <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Custom Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Custom Report Builder</DialogTitle>
                  <DialogDescription>
                    Create a custom compliance report with specific sections and parameters
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Report Name</Label>
                    <Input placeholder="Enter custom report name..." />
                  </div>
                  <div>
                    <Label>Report Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dea">DEA Compliance</SelectItem>
                        <SelectItem value="joint_commission">Joint Commission</SelectItem>
                        <SelectItem value="combined">Combined Regulatory</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sections to Include</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        "Facility Information",
                        "Inventory Records",
                        "Quality Measures",
                        "Patient Safety",
                        "Staff Competency",
                        "Policy Review",
                        "Financial Data",
                        "Audit Findings",
                      ].map((section) => (
                        <div key={section} className="flex items-center space-x-2">
                          <Checkbox id={section} />
                          <Label htmlFor={section} className="text-sm">
                            {section}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowCustomDialog(false)}>Create Report</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {recentReports.length > 0 ? (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(report.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(report.type)}
                        <h4 className="font-medium">{report.name}</h4>
                        {getTypeBadge(report.type)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span>Generated: {format(new Date(report.generatedAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                        <span>By: {report.generatedBy}</span>
                        {report.size && <span>Size: {report.size}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Reports Generated</h3>
              <p className="text-muted-foreground">Generate your first compliance report using the templates above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
