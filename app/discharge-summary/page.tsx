"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { CreateDischargeSummaryDialog } from "@/components/create-discharge-summary-dialog"
import { ViewDischargeSummaryDialog } from "@/components/view-discharge-summary-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileText, Calendar, User, Eye, Clock } from "lucide-react"
import { toast } from "sonner"

export default function DischargeSummaryPage() {
  const [summaries, setSummaries] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [providerId, setProviderId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Use a default provider ID if no user is logged in
      const currentProviderId = user?.id || "00000000-0000-0000-0000-000000000000"
      setProviderId(currentProviderId)

      // Fetch discharge summaries with patient and provider info
      const { data: summariesData, error: summariesError } = await supabase
        .from("discharge_summaries")
        .select(
          `
          *,
          patients!discharge_summaries_patient_id_fkey(
            id,
            first_name,
            last_name
          ),
          providers!discharge_summaries_provider_id_fkey(
            id,
            first_name,
            last_name
          ),
          finalized_by_provider:providers!discharge_summaries_finalized_by_fkey(
            id,
            first_name,
            last_name
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (summariesError) {
        console.error("[v0] Error fetching summaries:", summariesError)
        throw summariesError
      }

      // Transform data
      const transformedSummaries = summariesData?.map((summary) => ({
        ...summary,
        patient_name: `${summary.patients.first_name} ${summary.patients.last_name}`,
        provider_name: `${summary.providers.first_name} ${summary.providers.last_name}`,
        finalized_by_name: summary.finalized_by_provider
          ? `${summary.finalized_by_provider.first_name} ${summary.finalized_by_provider.last_name}`
          : null,
      }))

      setSummaries(transformedSummaries || [])

      // Fetch patients for creating new summaries
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("id, first_name, last_name, date_of_birth")
        .order("first_name")

      if (patientsError) {
        console.error("[v0] Error fetching patients:", patientsError)
        throw patientsError
      }
      setPatients(patientsData || [])
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast.error("Failed to load discharge summaries")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter summaries
  const filteredSummaries = summaries.filter((summary) => {
    const matchesSearch =
      searchTerm === "" ||
      summary.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.discharge_diagnosis.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || summary.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const stats = {
    total: summaries.length,
    draft: summaries.filter((s) => s.status === "draft").length,
    pendingReview: summaries.filter((s) => s.status === "pending-review").length,
    finalized: summaries.filter((s) => s.status === "finalized").length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="text-center py-12">Loading discharge summaries...</div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                Discharge Summaries
              </h1>
              <p className="text-muted-foreground">Comprehensive discharge documentation and transition of care</p>
            </div>
            <CreateDischargeSummaryDialog providerId={providerId} patients={patients}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Discharge Summary
              </Button>
            </CreateDischargeSummaryDialog>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Summaries</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Draft</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats.draft}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats.pendingReview}</p>
                  </div>
                  <Eye className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Finalized</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats.finalized}</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by patient, provider, or diagnosis..."
                className="max-w-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending-review">Pending Review</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discharge Summaries List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Discharge Summaries
                <Badge variant="secondary">{filteredSummaries.length} summaries</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSummaries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No discharge summaries found matching your criteria.
                  </div>
                ) : (
                  filteredSummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">Discharge Summary - {summary.patient_name}</h3>
                            <Badge
                              variant={
                                summary.status === "finalized"
                                  ? "default"
                                  : summary.status === "pending-review"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {summary.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{summary.patient_name}</span>
                            </div>
                            <span>•</span>
                            <span>{summary.provider_name}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(summary.admission_date).toLocaleDateString()} -{" "}
                                {new Date(summary.discharge_date).toLocaleDateString()}
                              </span>
                            </div>
                            <span>•</span>
                            <span>{summary.length_of_stay} days</span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              <strong>Discharge Diagnosis:</strong> {summary.discharge_diagnosis}
                            </span>
                            <span>
                              <strong>Disposition:</strong> {summary.discharge_disposition}
                            </span>
                            <span>
                              <strong>Condition:</strong> {summary.discharge_condition}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <ViewDischargeSummaryDialog summary={summary}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </ViewDischargeSummaryDialog>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
