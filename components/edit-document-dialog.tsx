"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Document {
  id: string
  document_type: "assessment" | "progress_note"
  patient_id: string
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

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface EditDocumentDialogProps {
  children: React.ReactNode
  document: Document
  patients: Patient[]
}

export function EditDocumentDialog({ children, document, patients }: EditDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Initialize form data based on document type
  const [formData, setFormData] = useState(() => {
    if (document.document_type === "assessment") {
      return {
        patientId: document.patient_id,
        assessmentType: document.assessment_type || "",
        chiefComplaint: document.chief_complaint || "",
        historyPresentIllness: document.history_present_illness || "",
        mentalStatusExam: document.mental_status_exam ? JSON.stringify(document.mental_status_exam, null, 2) : "",
        riskAssessment: document.risk_assessment ? JSON.stringify(document.risk_assessment, null, 2) : "",
        diagnosisCodes: document.diagnosis_codes?.join(", ") || "",
        treatmentPlan: document.treatment_plan || "",
      }
    } else {
      return {
        patientId: document.patient_id,
        noteType: document.note_type || "",
        subjective: document.subjective || "",
        objective: document.objective || "",
        assessment: document.assessment || "",
        plan: document.plan || "",
      }
    }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      if (document.document_type === "assessment") {
        const { error } = await supabase
          .from("assessments")
          .update({
            patient_id: formData.patientId,
            assessment_type: formData.assessmentType,
            chief_complaint: formData.chiefComplaint,
            history_present_illness: formData.historyPresentIllness,
            mental_status_exam: formData.mentalStatusExam ? JSON.parse(formData.mentalStatusExam) : null,
            risk_assessment: formData.riskAssessment ? JSON.parse(formData.riskAssessment) : null,
            diagnosis_codes: formData.diagnosisCodes
              ? formData.diagnosisCodes.split(",").map((code) => code.trim())
              : [],
            treatment_plan: formData.treatmentPlan,
            updated_at: new Date().toISOString(),
          })
          .eq("id", document.id)

        if (error) throw error
        toast.success("Assessment updated successfully")
      } else {
        const { error } = await supabase
          .from("progress_notes")
          .update({
            patient_id: formData.patientId,
            note_type: formData.noteType,
            subjective: formData.subjective,
            objective: formData.objective,
            assessment: formData.assessment,
            plan: formData.plan,
            updated_at: new Date().toISOString(),
          })
          .eq("id", document.id)

        if (error) throw error
        toast.success("Progress note updated successfully")
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating document:", error)
      toast.error("Failed to update document")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {document.document_type === "assessment" ? "Assessment" : "Progress Note"}</DialogTitle>
          <DialogDescription>Update the clinical document information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {document.document_type === "assessment" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient *</Label>
                  <Select
                    value={formData.patientId}
                    onValueChange={(value) => handleInputChange("patientId", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assessmentType">Assessment Type *</Label>
                  <Select
                    value={formData.assessmentType}
                    onValueChange={(value) => handleInputChange("assessmentType", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Initial Assessment</SelectItem>
                      <SelectItem value="progress">Progress Assessment</SelectItem>
                      <SelectItem value="discharge">Discharge Assessment</SelectItem>
                      <SelectItem value="crisis">Crisis Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                <Textarea
                  id="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => handleInputChange("chiefComplaint", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="historyPresentIllness">History of Present Illness</Label>
                <Textarea
                  id="historyPresentIllness"
                  value={formData.historyPresentIllness}
                  onChange={(e) => handleInputChange("historyPresentIllness", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mentalStatusExam">Mental Status Exam (JSON)</Label>
                  <Textarea
                    id="mentalStatusExam"
                    value={formData.mentalStatusExam}
                    onChange={(e) => handleInputChange("mentalStatusExam", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskAssessment">Risk Assessment (JSON)</Label>
                  <Textarea
                    id="riskAssessment"
                    value={formData.riskAssessment}
                    onChange={(e) => handleInputChange("riskAssessment", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosisCodes">Diagnosis Codes (ICD-10, comma-separated)</Label>
                <Input
                  id="diagnosisCodes"
                  value={formData.diagnosisCodes}
                  onChange={(e) => handleInputChange("diagnosisCodes", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatmentPlan">Treatment Plan</Label>
                <Textarea
                  id="treatmentPlan"
                  value={formData.treatmentPlan}
                  onChange={(e) => handleInputChange("treatmentPlan", e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient *</Label>
                  <Select
                    value={formData.patientId}
                    onValueChange={(value) => handleInputChange("patientId", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noteType">Note Type *</Label>
                  <Select
                    value={formData.noteType}
                    onValueChange={(value) => handleInputChange("noteType", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="therapy">Therapy Session</SelectItem>
                      <SelectItem value="medication">Medication Management</SelectItem>
                      <SelectItem value="crisis">Crisis Intervention</SelectItem>
                      <SelectItem value="discharge">Discharge Planning</SelectItem>
                      <SelectItem value="group">Group Therapy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjective">Subjective *</Label>
                <Textarea
                  id="subjective"
                  value={formData.subjective}
                  onChange={(e) => handleInputChange("subjective", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Textarea
                  id="objective"
                  value={formData.objective}
                  onChange={(e) => handleInputChange("objective", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment">Assessment</Label>
                <Textarea
                  id="assessment"
                  value={formData.assessment}
                  onChange={(e) => handleInputChange("assessment", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Textarea id="plan" value={formData.plan} onChange={(e) => handleInputChange("plan", e.target.value)} />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
