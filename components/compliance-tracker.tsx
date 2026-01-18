"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

interface ComplianceMetric {
  category: string
  score: number
  status: "excellent" | "good" | "needs-attention"
  details: string
}

interface RecentAudit {
  date: string
  type: string
  result: string
  score: string
}

export function ComplianceTracker() {
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetric[]>([])
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/dashboard/compliance")
        if (!response.ok) {
          throw new Error("Failed to fetch compliance data")
        }

        const data = await response.json()
        setComplianceMetrics(data.complianceMetrics || [])
        setRecentAudits(data.recentAudits || [])
      } catch (err) {
        console.error("[v0] Error loading compliance tracker:", err)
        setError("Failed to load compliance data")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Compliance Tracker</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading compliance data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Compliance Tracker</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state if no data
  const hasData = complianceMetrics.length > 0 || recentAudits.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 font-[family-name:var(--font-work-sans)]">
          <Shield className="h-5 w-5 text-primary" />
          <span>Compliance Tracker</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No compliance data available</p>
            <p className="text-sm mt-1">Compliance metrics will appear as data is recorded</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {complianceMetrics.map((metric) => (
                <div key={metric.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">{metric.category}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{metric.score}%</span>
                      {metric.status === "excellent" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : metric.status === "needs-attention" ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <Progress value={metric.score} className="h-2" />
                  <p className="text-xs text-muted-foreground">{metric.details}</p>
                </div>
              ))}
            </div>

            {recentAudits.length > 0 && (
              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-card-foreground mb-3">Recent Audits</h4>
                <div className="space-y-2">
                  {recentAudits.map((audit, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-card-foreground">{audit.type}</p>
                        <p className="text-muted-foreground">{audit.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            audit.result === "Passed"
                              ? "default"
                              : audit.result === "Action Required"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {audit.result}
                        </Badge>
                        <p className="text-muted-foreground mt-1">{audit.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
