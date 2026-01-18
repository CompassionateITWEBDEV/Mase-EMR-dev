"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Activity,
  ClipboardList,
  Home,
  AlertCircle,
  Pill,
  Clock,
  Download,
  Edit,
  ArrowLeft,
  Printer,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function DischargeSummaryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSummary = useCallback(async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("discharge_summaries")
        .select(
          `
          *,
          patients!discharge_summaries_patient_id_fkey(
            id,
            first_name,
            last_name,
            date_of_birth,
            patient_number
          ),
          providers!discharge_summaries_provider_id_fkey(
            id,
            first_name,
            last_name,
            specialty
          )
        `,
        )
        .eq("id", params.id)
        .single()

      if (error) throw error
      setSummary(data)
    } catch (error) {
      console.error("Error loading discharge summary:", error)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    toast.info("PDF export feature coming soon")
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderList = (data: any, key: string) => {
    if (!data || !data[key]) return null
    const items = Array.isArray(data[key]) ? data[key] : []
    return items.map((item: string, index: number) => (
      <li key={index} className="text-sm">
        {item}
      </li>
    ))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="text-center py-12">Loading discharge summary...</div>
          </main>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Discharge summary not found</p>
              <Link href="/discharge-summaries">
                <Button className="mt-4 bg-transparent" variant="outline">
                  Back to Discharge Summaries
                </Button>
              </Link>
            </div>
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
          {/* Header with Actions */}
          <div className="flex justify-between items-start print:hidden">
            <div className="flex items-center gap-4">
              <Link href="/discharge-summaries">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                  Discharge Summary
                </h1>
                <p className="text-muted-foreground">
                  Patient: {summary.patients.first_name} {summary.patients.last_name} • Provider:{" "}
                  {summary.providers.first_name} {summary.providers.last_name}
                </p>
              </div>
              <Badge variant={summary.status === "finalized" ? "default" : "secondary"}>{summary.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              {summary.status !== "finalized" && (
                <Link href={`/discharge-summary/${summary.id}/edit`}>
                  <Button size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Print Header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">Discharge Summary</h1>
            <p className="text-sm text-muted-foreground">
              Patient: {summary.patients.first_name} {summary.patients.last_name} • Provider:{" "}
              {summary.providers.first_name} {summary.providers.last_name}
            </p>
            <p className="text-sm text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
          </div>

          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-4 w-4" />
                Admission & Discharge Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admission Date</p>
                  <p className="text-sm">{formatDate(summary.admission_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Discharge Date</p>
                  <p className="text-sm">{formatDate(summary.discharge_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Length of Stay</p>
                  <p className="text-sm">{summary.length_of_stay} days</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Admission Diagnosis</p>
                <p className="text-sm">{summary.admission_diagnosis}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Reason for Admission</p>
                <p className="text-sm leading-relaxed">{summary.reason_for_admission}</p>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-4 w-4" />
                Treatment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Treatment Overview</p>
                <p className="text-sm leading-relaxed">{summary.treatment_summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Medications at Admission</p>
                  <ul className="list-disc list-inside space-y-1">
                    {renderList(summary.medications_at_admission, "medications")}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Medications at Discharge</p>
                  <ul className="list-disc list-inside space-y-1">
                    {renderList(summary.medications_at_discharge, "medications")}
                  </ul>
                </div>
              </div>

              {summary.procedures_performed && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Procedures Performed</p>
                  <ul className="list-disc list-inside space-y-1">
                    {renderList(summary.procedures_performed, "procedures")}
                  </ul>
                </div>
              )}

              {summary.therapies_provided && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Therapies Provided</p>
                  <ul className="list-disc list-inside space-y-1">
                    {renderList(summary.therapies_provided, "therapies")}
                  </ul>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Clinical Course</p>
                <p className="text-sm leading-relaxed">{summary.clinical_course}</p>
              </div>

              {summary.response_to_treatment && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Response to Treatment</p>
                  <p className="text-sm leading-relaxed">{summary.response_to_treatment}</p>
                </div>
              )}

              {summary.complications && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Complications</p>
                  <p className="text-sm leading-relaxed">{summary.complications}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Final Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-4 w-4" />
                Final Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Discharge Diagnosis</p>
                <p className="text-sm">{summary.discharge_diagnosis}</p>
              </div>

              {summary.diagnosis_codes && summary.diagnosis_codes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Diagnosis Codes</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.diagnosis_codes.map((code: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {summary.functional_status && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Functional Status</p>
                  <p className="text-sm leading-relaxed">{summary.functional_status}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discharge Planning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-4 w-4" />
                Discharge Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Discharge Disposition</p>
                  <Badge>{summary.discharge_disposition}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Discharge Condition</p>
                  <Badge variant={summary.discharge_condition === "improved" ? "default" : "secondary"}>
                    {summary.discharge_condition}
                  </Badge>
                </div>
              </div>

              {summary.follow_up_appointments && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Follow-up Appointments</p>
                  <ul className="list-disc list-inside space-y-1">
                    {renderList(summary.follow_up_appointments, "appointments")}
                  </ul>
                </div>
              )}

              {summary.follow_up_provider && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Follow-up Provider</p>
                    <p className="text-sm">{summary.follow_up_provider}</p>
                  </div>
                  {summary.follow_up_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Follow-up Date</p>
                      <p className="text-sm">{formatDate(summary.follow_up_date)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discharge Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-4 w-4" />
                Discharge Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">General Instructions</p>
                <p className="text-sm leading-relaxed">{summary.discharge_instructions}</p>
              </div>

              {summary.medication_instructions && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Medication Instructions</p>
                  <p className="text-sm leading-relaxed">{summary.medication_instructions}</p>
                </div>
              )}

              {summary.activity_restrictions && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Activity Restrictions</p>
                  <p className="text-sm leading-relaxed">{summary.activity_restrictions}</p>
                </div>
              )}

              {summary.diet_recommendations && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Diet Recommendations</p>
                  <p className="text-sm leading-relaxed">{summary.diet_recommendations}</p>
                </div>
              )}

              {summary.warning_signs && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Warning Signs</p>
                  <p className="text-sm leading-relaxed text-destructive">{summary.warning_signs}</p>
                </div>
              )}

              {summary.emergency_contact_info && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Emergency Contact Information</p>
                  <p className="text-sm leading-relaxed">{summary.emergency_contact_info}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aftercare Planning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pill className="h-4 w-4" />
                Aftercare Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Aftercare Plan</p>
                <p className="text-sm leading-relaxed">{summary.aftercare_plan}</p>
              </div>

              {summary.referrals && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Referrals</p>
                  <ul className="list-disc list-inside space-y-1">{renderList(summary.referrals, "referrals")}</ul>
                </div>
              )}

              {summary.community_resources && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Community Resources</p>
                  <ul className="list-disc list-inside space-y-1">
                    {renderList(summary.community_resources, "resources")}
                  </ul>
                </div>
              )}

              {summary.support_system_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Support System</p>
                  <p className="text-sm leading-relaxed">{summary.support_system_notes}</p>
                </div>
              )}

              {summary.patient_education_provided && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Patient Education Provided</p>
                  <p className="text-sm leading-relaxed">{summary.patient_education_provided}</p>
                </div>
              )}

              {summary.family_involvement && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Family Involvement</p>
                  <p className="text-sm leading-relaxed">{summary.family_involvement}</p>
                </div>
              )}

              {summary.barriers_to_discharge && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Barriers to Discharge</p>
                  <p className="text-sm leading-relaxed">{summary.barriers_to_discharge}</p>
                </div>
              )}

              {summary.special_considerations && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Special Considerations</p>
                  <p className="text-sm leading-relaxed">{summary.special_considerations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-4 w-4" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDateTime(summary.created_at)}</p>
                </div>
                {summary.finalized_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Finalized</p>
                    <p className="text-sm">
                      {formatDateTime(summary.finalized_at)}
                      {summary.finalized_by_provider &&
                        ` by ${summary.finalized_by_provider.first_name} ${summary.finalized_by_provider.last_name}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
