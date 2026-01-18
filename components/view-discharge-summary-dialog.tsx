"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Activity, ClipboardList, Home, AlertCircle, Pill, FileText, Clock } from "lucide-react"

interface DischargeSummary {
  id: string
  patient_name: string
  provider_name: string
  admission_date: string
  discharge_date: string
  length_of_stay: number
  admission_diagnosis: string
  reason_for_admission: string
  treatment_summary: string
  medications_at_admission: any
  medications_at_discharge: any
  procedures_performed: any
  therapies_provided: any
  clinical_course: string
  response_to_treatment: string
  complications: string
  discharge_diagnosis: string
  diagnosis_codes: string[]
  final_mental_status_exam: any
  final_risk_assessment: any
  functional_status: string
  discharge_disposition: string
  discharge_condition: string
  follow_up_appointments: any
  follow_up_provider: string
  follow_up_date: string
  discharge_instructions: string
  medication_instructions: string
  activity_restrictions: string
  diet_recommendations: string
  warning_signs: string
  emergency_contact_info: string
  aftercare_plan: string
  referrals: any
  community_resources: any
  support_system_notes: string
  patient_education_provided: string
  family_involvement: string
  barriers_to_discharge: string
  special_considerations: string
  status: string
  created_at: string
  finalized_at: string
  finalized_by_name: string
}

interface ViewDischargeSummaryDialogProps {
  children: React.ReactNode
  summary: DischargeSummary
}

export function ViewDischargeSummaryDialog({ children, summary }: ViewDischargeSummaryDialogProps) {
  const [open, setOpen] = useState(false)

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Discharge Summary
            <Badge variant={summary.status === "finalized" ? "default" : "secondary"}>{summary.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Patient: {summary.patient_name} • Provider: {summary.provider_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                    {summary.diagnosis_codes.map((code, index) => (
                      <Badge key={index} variant="secondary">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {summary.final_mental_status_exam && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Final Mental Status Exam</p>
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-3 rounded">
                      {JSON.stringify(summary.final_mental_status_exam, null, 2)}
                    </pre>
                  </div>
                )}

                {summary.final_risk_assessment && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Final Risk Assessment</p>
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-3 rounded">
                      {JSON.stringify(summary.final_risk_assessment, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

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
                      {summary.finalized_by_name && ` by ${summary.finalized_by_name}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
