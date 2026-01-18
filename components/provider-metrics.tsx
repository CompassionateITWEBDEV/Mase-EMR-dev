"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, FileText, Clock, AlertTriangle, Loader2 } from "lucide-react"

interface Provider {
  id: string
  first_name: string
  last_name: string
  role: string
  specialization: string
}

interface ProductivityMetric {
  id: string
  provider_id: string
  patients_seen: number
  assessments_completed: number
  documentation_time: number
  metric_date: string
}

export function ProviderMetrics() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [metrics, setMetrics] = useState<ProductivityMetric[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/dashboard/metrics")
        if (!response.ok) throw new Error("Failed to fetch metrics")

        const data = await response.json()
        setProviders(data.providers || [])
        setMetrics(data.productivityMetrics || [])

        console.log("[v0] Provider metrics loaded successfully")
      } catch (err) {
        console.error("[v0] Error loading provider metrics:", err)
        setError("Failed to load provider metrics")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Calculate aggregate metrics
  const totalPatientsSeen = metrics.reduce((sum, m) => sum + (m.patients_seen || 0), 0)
  const totalAssessments = metrics.reduce((sum, m) => sum + (m.assessments_completed || 0), 0)
  const avgDocTime =
    metrics.length > 0
      ? Math.round(metrics.reduce((sum, m) => sum + (m.documentation_time || 0), 0) / metrics.length)
      : 0

  const teamMetrics = [
    {
      title: "Patients Seen",
      value: totalPatientsSeen,
      target: 100,
      icon: Users,
    },
    {
      title: "Assessments",
      value: totalAssessments,
      target: 50,
      icon: FileText,
    },
    {
      title: "Avg Doc Time",
      value: avgDocTime,
      target: 20,
      icon: Clock,
      unit: "min",
    },
  ]

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Provider Metrics</span>
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Provider Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Provider Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {teamMetrics.map((metric) => (
            <div key={metric.title} className="text-center space-y-2">
              <metric.icon className="h-6 w-6 mx-auto text-primary" />
              <div>
                <p className="text-2xl font-bold text-card-foreground">
                  {metric.value}
                  {metric.unit || ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Target: {metric.target}
                  {metric.unit || ""}
                </p>
              </div>
              <p className="text-xs font-medium text-card-foreground">{metric.title}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="font-medium text-card-foreground mb-4">Team Members</h4>
          {providers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No providers found. Add providers to see metrics.</p>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-card-foreground">
                        {provider.first_name} {provider.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {provider.role} {provider.specialization && `• ${provider.specialization}`}
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
