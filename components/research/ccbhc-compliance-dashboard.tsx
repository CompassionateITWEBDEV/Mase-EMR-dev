"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, CheckCircle2, AlertTriangle, Clock, Users, TrendingUp, FileText, Calendar } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Skeleton } from "@/components/ui/skeleton"

interface CCBHCComplianceData {
  audit: {
    id: string
    audit_date: string
    audit_type: string
    overall_compliance_score: number
    certification_status: string
    areas_of_strength?: string
    areas_needing_improvement?: string
    next_audit_due?: string
  } | null
  serviceCompliance: Array<{
    id: string
    service_name: string
    service_category: string
    compliance_status: string
    compliance_score: number
    last_audit_date?: string
    next_audit_due?: string
  }>
  careCoordination: {
    total_patients: number
    patients_with_coordinator: number
    total_coordination_events: number
  }
  qualityOutcomes: Array<{
    id: string
    measure_name: string
    measure_category: string
    rate: number
    benchmark_rate?: number
    performance_status?: string
  }>
}

export function CCBHCComplianceDashboard() {
  const [data, setData] = useState<CCBHCComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/research/ccbhc-compliance")
        if (!response.ok) {
          throw new Error("Failed to fetch CCBHC compliance data")
        }
        const result = await response.json()
        setData(result)
      } catch (err: any) {
        console.error("[CCBHC Compliance] Error fetching data:", err)
        setError(err.message || "Failed to load compliance data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Data</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No compliance data available
          </CardContent>
        </Card>
      </div>
    )
  }

  const { audit, serviceCompliance, careCoordination, qualityOutcomes } = data

  const getComplianceStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "compliant":
      case "certified":
        return "bg-green-100 text-green-800 border-green-200"
      case "partial":
      case "provisional":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "non_compliant":
      case "non_certified":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPerformanceStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "exceeds":
        return "bg-green-100 text-green-800"
      case "meets":
        return "bg-blue-100 text-blue-800"
      case "below":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const overallScore = audit?.overall_compliance_score || 0
  const coordinationRate =
    careCoordination.total_patients > 0
      ? Math.round((careCoordination.patients_with_coordinator / careCoordination.total_patients) * 100)
      : 0

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader
        title="CCBHC Compliance Dashboard"
        description="Certified Community Behavioral Health Clinic Compliance Tracking & Reporting"
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Compliance</p>
                <p className="text-2xl font-bold">{overallScore}%</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Care Coordination</p>
                <p className="text-2xl font-bold">{coordinationRate}%</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {careCoordination.patients_with_coordinator} of {careCoordination.total_patients} patients
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coordination Events</p>
                <p className="text-2xl font-bold">{careCoordination.total_coordination_events}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Services Tracked</p>
                <p className="text-2xl font-bold">{serviceCompliance.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Core services compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Audit */}
      {audit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Latest Certification Audit
                </CardTitle>
                <CardDescription>
                  Audit Date: {new Date(audit.audit_date).toLocaleDateString()} • Type: {audit.audit_type}
                </CardDescription>
              </div>
              <Badge className={getComplianceStatusColor(audit.certification_status)}>
                {audit.certification_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Compliance Score</span>
                  <span className="text-2xl font-bold">{audit.overall_compliance_score}%</span>
                </div>
                <Progress value={audit.overall_compliance_score} className="h-2" />
              </div>
              {audit.next_audit_due && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Next Audit Due:</span>
                  <span className="font-medium">
                    {new Date(audit.next_audit_due).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {audit.areas_of_strength && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-sm text-green-900 mb-1">Areas of Strength</h4>
                <p className="text-sm text-green-800">{audit.areas_of_strength}</p>
              </div>
            )}
            {audit.areas_needing_improvement && (
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-sm text-yellow-900 mb-1">Areas Needing Improvement</h4>
                <p className="text-sm text-yellow-800">{audit.areas_needing_improvement}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Service Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Core Services Compliance</CardTitle>
          <CardDescription>Compliance status for required CCBHC core services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceCompliance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No service compliance data available</p>
            ) : (
              serviceCompliance.map((service) => (
                <div key={service.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{service.service_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {service.service_category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge className={getComplianceStatusColor(service.compliance_status)}>
                            {service.compliance_status}
                          </Badge>
                        </div>
                        {service.compliance_score !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Score:</span>
                            <span className="font-semibold">{service.compliance_score}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {service.compliance_status.toLowerCase() === "compliant" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                    )}
                  </div>
                  {service.compliance_score !== null && (
                    <Progress value={service.compliance_score} className="h-2" />
                  )}
                  {service.last_audit_date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last audit: {new Date(service.last_audit_date).toLocaleDateString()}
                      {service.next_audit_due &&
                        ` • Next audit: ${new Date(service.next_audit_due).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quality Outcomes */}
      {qualityOutcomes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Outcome Measures</CardTitle>
            <CardDescription>Performance on CCBHC quality measures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityOutcomes.map((measure) => (
                <div key={measure.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{measure.measure_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {measure.measure_category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Rate: </span>
                          <span className="font-semibold">{measure.rate.toFixed(1)}%</span>
                        </div>
                        {measure.benchmark_rate && (
                          <div>
                            <span className="text-sm text-muted-foreground">Benchmark: </span>
                            <span className="font-medium">{measure.benchmark_rate.toFixed(1)}%</span>
                          </div>
                        )}
                        {measure.performance_status && (
                          <Badge className={getPerformanceStatusColor(measure.performance_status)}>
                            {measure.performance_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={measure.rate}
                    className="h-2"
                    {...(measure.benchmark_rate && {
                      // Visual indicator for benchmark
                      style: {
                        background: `linear-gradient(to right, 
                          hsl(var(--primary)) 0%, 
                          hsl(var(--primary)) ${measure.rate}%, 
                          hsl(var(--muted)) ${measure.rate}%, 
                          hsl(var(--muted)) 100%)`,
                      },
                    })}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
