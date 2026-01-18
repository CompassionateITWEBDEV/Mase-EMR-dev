"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { PatientList } from "@/components/patient-list"
import { PatientStats } from "@/components/patient-stats"
import { AddPatientDialog } from "@/components/add-patient-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Filter, Plus, AlertTriangle, FileText } from "lucide-react"

const DEFAULT_PROVIDER = {
  id: "00000000-0000-0000-0000-000000000001",
  first_name: "Demo",
  last_name: "Provider",
  email: "demo@example.com",
  role: "physician",
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, highRisk: 0, recentAppointments: 0 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [provider, setProvider] = useState(DEFAULT_PROVIDER)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: providerData } = await supabase.from("providers").select("*").eq("id", user.id).single()
        if (providerData) {
          setProvider(providerData)
        }
      }
    } catch (error) {
      console.log("[v0] Auth check failed, using default provider")
    }

    const { count: totalCount } = await supabase.from("patients").select("*", { count: "exact", head: true })

    const { count: activeCount } = await supabase.from("patients").select("*", { count: "exact", head: true })

    const { count: recentCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("appointment_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const { data: patientsData } = await supabase
      .from("patients")
      .select(`
        *,
        appointments(
          id,
          appointment_date,
          status,
          provider_id
        ),
        assessments(
          id,
          assessment_type,
          risk_assessment,
          created_at
        ),
        medications(
          id,
          medication_name,
          dosage,
          status
        )
      `)
      .order("created_at", { ascending: false })

    console.log("[v0] Fetched patients:", patientsData?.length || 0)

    const highRiskCount =
      patientsData?.filter((p) =>
        p.assessments?.some(
          (a: { risk_assessment?: { level?: string } }) =>
            a.risk_assessment &&
            typeof a.risk_assessment === "object" &&
            "level" in a.risk_assessment &&
            a.risk_assessment.level === "high",
        ),
      ).length || 0

    setPatients(patientsData || [])
    setStats({
      total: totalCount || 0,
      active: activeCount || 0,
      highRisk: highRiskCount,
      recentAppointments: recentCount || 0,
    })
    setLoading(false)
  }

  const handlePatientAdded = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="pl-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="text-center py-12">Loading patients...</div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                Patient Management
              </h1>
              <p className="text-muted-foreground">Comprehensive patient database and records</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <AddPatientDialog providerId={provider.id} onSuccess={handlePatientAdded}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patient
                </Button>
              </AddPatientDialog>
            </div>
          </div>

          <PatientStats stats={stats} />

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">Patient List</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <PatientList patients={patients} currentProviderId={provider.id} showFilters={showFilters} />
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                        <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
                        <p className="text-xs text-green-600">Active caseload</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Treatment</p>
                        <p className="text-2xl font-bold text-card-foreground">{stats.active}</p>
                        <p className="text-xs text-green-600">In active care</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                        <p className="text-2xl font-bold text-card-foreground">{stats.highRisk}</p>
                        <p className="text-xs text-red-600">Require attention</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
                        <p className="text-2xl font-bold text-card-foreground">{stats.recentAppointments}</p>
                        <p className="text-xs text-blue-600">This week</p>
                      </div>
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
