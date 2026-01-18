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

interface Document {
  id: string
  document_type: "assessment" | "progress_note"
  patient_name: string
  provider_name: string
  created_at: string
  assessment_type?: string
  note_type?: string
  chief_complaint?: string
  history_present_illness?: string
  mental_status_exam?: any
  risk_assessment?: any
  diagnosis_codes?: string[]
  treatment_plan?: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
}

interface ViewDocumentDialogProps {
  children: React.ReactNode
  document: Document
}

export function ViewDocumentDialog({ children, document }: ViewDocumentDialogProps) {
  const [open, setOpen] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {document.document_type === "assessment" ? "Clinical Assessment" : "Progress Note"}
            <Badge variant="outline">
              {document.document_type === "assessment" ? document.assessment_type : document.note_type}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Patient: {document.patient_name} • Provider: {document.provider_name} • {formatDate(document.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {document.document_type === "assessment" ? (
            <>
              {document.chief_complaint && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Chief Complaint</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{document.chief_complaint}</p>
                  </CardContent>
                </Card>
              )}

              {document.history_present_illness && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">History of Present Illness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{document.history_present_illness}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {document.mental_status_exam && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mental Status Exam</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-3 rounded">
                        {JSON.stringify(document.mental_status_exam, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {document.risk_assessment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-3 rounded">
                        {JSON.stringify(document.risk_assessment, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>

              {document.diagnosis_codes && document.diagnosis_codes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Diagnosis Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {document.diagnosis_codes.map((code, index) => (
                        <Badge key={index} variant="secondary">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {document.treatment_plan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Treatment Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{document.treatment_plan}</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              {document.subjective && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Subjective</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{document.subjective}</p>
                  </CardContent>
                </Card>
              )}

              {document.objective && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Objective</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{document.objective}</p>
                  </CardContent>
                </Card>
              )}

              {document.assessment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{document.assessment}</p>
                  </CardContent>
                </Card>
              )}

              {document.plan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{document.plan}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
