"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Lock, BarChart3, Download } from "lucide-react"

interface ComplianceItem {
  category: string
  status: "compliant" | "warning" | "violation"
  score: number
  description: string
  lastChecked: string
  actionRequired?: string
}

export function DEAComplianceDashboard() {
  const [complianceData, setComplianceData] = useState<ComplianceItem[]>([])
  const [overallScore, setOverallScore] = useState(0)

  useEffect(() => {
    // Mock compliance data
    const mockData: ComplianceItem[] = [
      {
        category: "Schedule II Records",
        status: "compliant",
        score: 100,
        description: "All Schedule II records properly separated and secured",
        lastChecked: "2024-12-20",
      },
      {
        category: "Inventory Management",
        status: "compliant",
        score: 95,
        description: "Perpetual inventory maintained with accurate counts",
        lastChecked: "2024-12-20",
      },
      {
        category: "Form 222 Compliance",
        status: "warning",
        score: 75,
        description: "1 pending Form 222 requires completion",
        lastChecked: "2024-12-20",
        actionRequired: "Complete Form 222 for Hikma Pharmaceuticals acquisition",
      },
      {
        category: "Disposal Documentation",
        status: "violation",
        score: 40,
        description: "Expired batch disposal overdue for Form 41",
        lastChecked: "2024-12-01",
        actionRequired: "Submit Form 41 for Batch B-2023-045 within 7 days",
      },
      {
        category: "Security & Storage",
        status: "compliant",
        score: 100,
        description: "Vault storage meets all DEA security requirements",
        lastChecked: "2024-12-15",
      },
      {
        category: "Staff Training",
        status: "compliant",
        score: 90,
        description: "All staff completed required DEA training",
        lastChecked: "2024-11-30",
      },
    ]

    setComplianceData(mockData)
    const avgScore = mockData.reduce((sum, item) => sum + item.score, 0) / mockData.length
    setOverallScore(Math.round(avgScore))
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "violation":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "text-green-600 bg-green-50 border-green-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "violation":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const criticalIssues = complianceData.filter((item) => item.status === "violation")
  const warningIssues = complianceData.filter((item) => item.status === "warning")

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Overall DEA Compliance Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold">{overallScore}%</span>
                <Badge
                  className={
                    overallScore >= 90
                      ? "bg-green-100 text-green-800"
                      : overallScore >= 75
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {overallScore >= 90 ? "Excellent" : overallScore >= 75 ? "Needs Attention" : "Critical"}
                </Badge>
              </div>
              <Progress value={overallScore} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {criticalIssues.length} critical issues, {warningIssues.length} warnings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Critical Compliance Issues</span>
            </CardTitle>
            <CardDescription className="text-red-700">
              These violations require immediate attention to maintain DEA compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalIssues.map((issue, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-red-900">{issue.category}</h4>
                      <p className="text-sm text-red-700 mt-1">{issue.description}</p>
                      {issue.actionRequired && (
                        <p className="text-sm font-medium text-red-800 mt-2">Action Required: {issue.actionRequired}</p>
                      )}
                    </div>
                    <Badge className="bg-red-100 text-red-800">Violation</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {complianceData.map((item, index) => (
          <Card key={index} className={`border ${getStatusColor(item.status)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center space-x-2">
                  {getStatusIcon(item.status)}
                  <span>{item.category}</span>
                </CardTitle>
                <div className="text-right">
                  <div className="text-lg font-bold">{item.score}%</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">{item.description}</p>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Last checked: {item.lastChecked}</span>
                <Badge variant="outline" className="text-xs">
                  {item.status}
                </Badge>
              </div>
              {item.actionRequired && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <strong>Action Required:</strong> {item.actionRequired}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common DEA inspection tasks and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
              <FileText className="h-6 w-6" />
              <span className="text-sm">View Inventory</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Acquisition Log</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
              <Lock className="h-6 w-6" />
              <span className="text-sm">Security Check</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
              <Download className="h-6 w-6" />
              <span className="text-sm">Export Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
