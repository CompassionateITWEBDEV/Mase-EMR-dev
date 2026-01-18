"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, AlertTriangle, Clock, Loader2 } from "lucide-react"
import Link from "next/link"

interface PatientStats {
  totalPatients: number
  activePatients: number
  highRiskPatients: number
  pendingAssessments: number
}

interface RecentPatient {
  id: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

export function PatientOverview() {
  const [stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    activePatients: 0,
    highRiskPatients: 0,
    pendingAssessments: 0,
  })
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/dashboard/stats")
        if (!response.ok) throw new Error("Failed to fetch stats")

        const data = await response.json()
        setStats(data.stats)
        setRecentPatients(data.recentPatients || [])

        console.log("[v0] Patient overview loaded successfully")
      } catch (err) {
        console.error("[v0] Error loading patient overview:", err)
        setError("Failed to load patient data")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const patientStats = [
    {
      title: "Total Patients",
      value: stats.totalPatients.toString(),
      icon: Users,
      change: "From database",
      changeType: "neutral",
    },
    {
      title: "Active Treatment",
      value: stats.activePatients.toString(),
      icon: UserCheck,
      change: "Currently active",
      changeType: "positive",
    },
    {
      title: "High Risk",
      value: stats.highRiskPatients.toString(),
      icon: AlertTriangle,
      change: "Active holds",
      changeType: stats.highRiskPatients > 0 ? "negative" : "positive",
    },
    {
      title: "Pending Assessments",
      value: stats.pendingAssessments.toString(),
      icon: Clock,
      change: "Awaiting completion",
      changeType: "neutral",
    },
  ]

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="mt-4" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {patientStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                  <p
                    className={`text-xs ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                          ? "text-red-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Patients</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPatients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No patients found. Add patients to see them here.</p>
          ) : (
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-card-foreground">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">ID: {patient.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">Active</Badge>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Updated {new Date(patient.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/patients/${patient.id}`}>
                      <Button size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
