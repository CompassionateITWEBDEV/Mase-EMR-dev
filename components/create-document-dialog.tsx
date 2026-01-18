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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface CreateDocumentDialogProps {
  children: React.ReactNode
  providerId: string
  patients: Patient[]
}

export function CreateDocumentDialog({ children, providerId, patients }: CreateDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [documentType, setDocumentType] = useState<"assessment" | "progress_note">("assessment")
  const router = useRouter()

  // Assessment form data
  const [assessmentData, setAssessmentData] = useState({
    patientId: "",
    assessmentType: "",
    chiefComplaint: "",
    historyPresentIllness: "",
    mentalStatusExam: "",
    riskAssessment: "",
    diagnosisCodes: "",
    treatmentPlan: "",
  })

  // Progress note form data
  const [progressNoteData, setProgressNoteData] = useState({
    patientId: "",
    noteType: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  })

  const handleAssessmentChange = (field: string, value: string) => {
    setAssessmentData((prev) => ({ ...prev, [field]: value }))
  }

  const handleProgressNoteChange = (field: string, value: string) => {
    setProgressNoteData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      if (documentType === "assessment") {
        const { error } = await supabase.from("assessments").insert({
          patient_id: assessmentData.patientId,
          provider_id: providerId,
          assessment_type: assessmentData.assessmentType,
          chief_complaint: assessmentData.chiefComplaint,
          history_present_illness: assessmentData.historyPresentIllness,
          mental_status_exam: assessmentData.mentalStatusExam ? JSON.parse(assessmentData.mentalStatusExam) : null,
          risk_assessment: assessmentData.riskAssessment ? JSON.parse(assessmentData.riskAssessment) : null,
          diagnosis_codes: assessmentData.diagnosisCodes
            ? assessmentData.diagnosisCodes.split(",").map((code) => code.trim())
            : [],
          treatment_plan: assessmentData.treatmentPlan,
        })

        if (error) throw error
        toast.success("Assessment created successfully")
      } else {
        const { error } = await supabase.from("progress_notes").insert({
          patient_id: progressNoteData.patientId,
          provider_id: providerId,
          note_type: progressNoteData.noteType,
          subjective: progressNoteData.subjective,
          objective: progressNoteData.objective,
          assessment: progressNoteData.assessment,
          plan: progressNoteData.plan,
        })

        if (error) throw error
        toast.success("Progress note created successfully")
      }

      setOpen(false)
      // Reset forms
      setAssessmentData({
        patientId: "",
        assessmentType: "",
        chiefComplaint: "",
        historyPresentIllness: "",
        mentalStatusExam: "",
        riskAssessment: "",
        diagnosisCodes: "",
        treatmentPlan: "",
      })
      setProgressNoteData({
        patientId: "",
        noteType: "",
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error creating document:", error)
      toast.error("Failed to create document")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Clinical Document</DialogTitle>
          <DialogDescription>Choose the type of document and fill in the required information.</DialogDescription>
        </DialogHeader>

        <Tabs value={documentType} onValueChange={(value) => setDocumentType(value as "assessment" | "progress_note")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assessment">Clinical Assessment</TabsTrigger>
            <TabsTrigger value="progress_note">Progress Note</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="assessment" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient *</Label>
                  <Select
                    value={assessmentData.patientId}
                    onValueChange={(value) => handleAssessmentChange("patientId", value)}
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
                    value={assessmentData.assessmentType}
                    onValueChange={(value) => handleAssessmentChange("assessmentType", value)}
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
                  placeholder="Patient's primary concern or reason for visit"
                  value={assessmentData.chiefComplaint}
                  onChange={(e) => handleAssessmentChange("chiefComplaint", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="historyPresentIllness">History of Present Illness</Label>
                <Textarea
                  id="historyPresentIllness"
                  placeholder="Detailed history of the current condition"
                  value={assessmentData.historyPresentIllness}
                  onChange={(e) => handleAssessmentChange("historyPresentIllness", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mentalStatusExam">Mental Status Exam (JSON)</Label>
                  <Textarea
                    id="mentalStatusExam"
                    placeholder='{"appearance": "well-groomed", "mood": "euthymic", "affect": "appropriate"}'
                    value={assessmentData.mentalStatusExam}
                    onChange={(e) => handleAssessmentChange("mentalStatusExam", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskAssessment">Risk Assessment (JSON)</Label>
                  <Textarea
                    id="riskAssessment"
                    placeholder='{"suicide_risk": "low", "violence_risk": "low", "level": "low"}'
                    value={assessmentData.riskAssessment}
                    onChange={(e) => handleAssessmentChange("riskAssessment", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosisCodes">Diagnosis Codes (ICD-10, comma-separated)</Label>
                <Input
                  id="diagnosisCodes"
                  placeholder="F32.9, F41.1, Z63.0"
                  value={assessmentData.diagnosisCodes}
                  onChange={(e) => handleAssessmentChange("diagnosisCodes", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatmentPlan">Treatment Plan</Label>
                <Textarea
                  id="treatmentPlan"
                  placeholder="Recommended treatment approach and interventions"
                  value={assessmentData.treatmentPlan}
                  onChange={(e) => handleAssessmentChange("treatmentPlan", e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="progress_note" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient *</Label>
                  <Select
                    value={progressNoteData.patientId}
                    onValueChange={(value) => handleProgressNoteChange("patientId", value)}
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
                    value={progressNoteData.noteType}
                    onValueChange={(value) => handleProgressNoteChange("noteType", value)}
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
                  placeholder="Patient's reported symptoms, concerns, and subjective experience"
                  value={progressNoteData.subjective}
                  onChange={(e) => handleProgressNoteChange("subjective", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Textarea
                  id="objective"
                  placeholder="Observable behaviors, test results, and clinical observations"
                  value={progressNoteData.objective}
                  onChange={(e) => handleProgressNoteChange("objective", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment">Assessment</Label>
                <Textarea
                  id="assessment"
                  placeholder="Clinical impression and analysis of patient's condition"
                  value={progressNoteData.assessment}
                  onChange={(e) => handleProgressNoteChange("assessment", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Textarea
                  id="plan"
                  placeholder="Treatment plan, interventions, and next steps"
                  value={progressNoteData.plan}
                  onChange={(e) => handleProgressNoteChange("plan", e.target.value)}
                />
              </div>
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Document"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
