"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"
import { fetchAllPatients } from "@/lib/utils/fetch-patients"

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface CreateDocumentDialogProps {
  children: React.ReactNode
  providerId: string
  patients?: Patient[] // Make optional since we'll fetch from database
  preSelectedPatientId?: string // Optional pre-selected patient ID
  onDocumentCreated?: (document: any) => void // Callback when document is created
  autoOpen?: boolean // Auto-open the dialog when true
}

interface CreatedDocument {
  id: string
  type: "assessment" | "progress_note"
  patientName: string
  createdAt: string
  summary: string
}

export function CreateDocumentDialog({ 
  children, 
  providerId, 
  patients: initialPatients = [],
  preSelectedPatientId,
  onDocumentCreated,
  autoOpen = false
}: CreateDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [documentType, setDocumentType] = useState<"assessment" | "progress_note">("assessment")
  const [createdDocument, setCreatedDocument] = useState<CreatedDocument | null>(null)
  const [showSuccessView, setShowSuccessView] = useState(false)
  const [hasAutoOpened, setHasAutoOpened] = useState(false)
  const router = useRouter()
  
  // Auto-open the dialog if autoOpen is true and we haven't auto-opened yet
  useEffect(() => {
    if (autoOpen && !hasAutoOpened) {
      setOpen(true)
      setHasAutoOpened(true)
    }
  }, [autoOpen, hasAutoOpened])

  // Patients state - fetch from database
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)

  // Assessment form data
  const [assessmentData, setAssessmentData] = useState({
    patientId: preSelectedPatientId || "",
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
    patientId: preSelectedPatientId || "",
    noteType: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  })

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Fetch patients from database when dialog opens
  useEffect(() => {
    if (!open) return

    // Reset success view when dialog opens
    setShowSuccessView(false)
    setCreatedDocument(null)

    // Always fetch fresh patients when dialog opens
    setIsLoadingPatients(true)
    fetchAllPatients({ includeInactive: false })
      .then((fetchedPatients) => {
        setPatients(fetchedPatients)
        console.log(`[CreateDocumentDialog] Fetched ${fetchedPatients.length} patients`)
        
        // If pre-selected patient ID exists and is valid, set it in the form
        if (preSelectedPatientId) {
          const patientExists = fetchedPatients.some(p => p.id === preSelectedPatientId)
          if (patientExists) {
            setAssessmentData(prev => ({ ...prev, patientId: preSelectedPatientId }))
            setProgressNoteData(prev => ({ ...prev, patientId: preSelectedPatientId }))
          }
        }
      })
      .catch((error) => {
        console.error("[CreateDocumentDialog] Error fetching patients:", error)
        toast.error("Failed to load patients. Please try again.")
      })
      .finally(() => {
        setIsLoadingPatients(false)
      })
  }, [open, preSelectedPatientId])

  // Safe JSON parsing utility
  const safeParseJSON = (value: string): object | null => {
    if (!value || !value.trim()) return null
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  // Check if a string is valid JSON
  const isValidJSON = (value: string): boolean => {
    if (!value || !value.trim()) return true // Empty is valid (optional field)
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  }

  const handleAssessmentChange = (field: string, value: string) => {
    setAssessmentData((prev) => ({ ...prev, [field]: value }))
    // Clear validation error for this field when user types
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleProgressNoteChange = (field: string, value: string) => {
    setProgressNoteData((prev) => ({ ...prev, [field]: value }))
    // Clear validation error for this field when user types
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate assessment form
  const validateAssessmentForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!assessmentData.patientId) {
      errors.patientId = "Patient is required"
    }

    if (!assessmentData.assessmentType) {
      errors.assessmentType = "Assessment type is required"
    }

    if (!assessmentData.chiefComplaint.trim()) {
      errors.chiefComplaint = "Chief complaint is required"
    }

    // Validate JSON fields if provided
    if (assessmentData.mentalStatusExam && !isValidJSON(assessmentData.mentalStatusExam)) {
      errors.mentalStatusExam = "Invalid JSON format. Please check your JSON syntax."
    }

    if (assessmentData.riskAssessment && !isValidJSON(assessmentData.riskAssessment)) {
      errors.riskAssessment = "Invalid JSON format. Please check your JSON syntax."
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validate progress note form
  const validateProgressNoteForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!progressNoteData.patientId) {
      errors.patientId = "Patient is required"
    }

    if (!progressNoteData.noteType) {
      errors.noteType = "Note type is required"
    }

    if (!progressNoteData.subjective.trim()) {
      errors.subjective = "Subjective is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    let isValid = false
    if (documentType === "assessment") {
      isValid = validateAssessmentForm()
    } else {
      isValid = validateProgressNoteForm()
    }

    if (!isValid) {
      toast.error("Please fix the errors in the form before submitting")
      return
    }

    setIsLoading(true)

    try {
      if (documentType === "assessment") {
        // Validate required fields before API call
        if (!assessmentData.patientId) {
          throw new Error("Patient is required")
        }
        if (!providerId) {
          throw new Error("Provider ID is missing")
        }
        if (!assessmentData.assessmentType) {
          throw new Error("Assessment type is required")
        }

        // Parse JSON fields safely
        const mentalStatusExam = safeParseJSON(assessmentData.mentalStatusExam)
        const riskAssessment = safeParseJSON(assessmentData.riskAssessment)

        // Parse diagnosis codes
        const diagnosisCodes = assessmentData.diagnosisCodes
          ? assessmentData.diagnosisCodes.split(",").map((code) => code.trim()).filter((code) => code.length > 0)
          : []

        // Prepare request data
        const requestData = {
          documentType: "assessment",
          patient_id: assessmentData.patientId,
          provider_id: providerId,
          assessment_type: assessmentData.assessmentType,
          chief_complaint: assessmentData.chiefComplaint || null,
          history_present_illness: assessmentData.historyPresentIllness || null,
          mental_status_exam: mentalStatusExam,
          risk_assessment: riskAssessment,
          diagnosis_codes: diagnosisCodes.length > 0 ? diagnosisCodes : null,
          treatment_plan: assessmentData.treatmentPlan || null,
        }

        const response = await fetch("/api/clinical-documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to create assessment")
        }

        // Get patient name for success message
        const selectedPatient = patients.find(p => p.id === assessmentData.patientId)
        const patientName = selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "Patient"
        
        // Set created document info for success view
        setCreatedDocument({
          id: result.document?.id || "",
          type: "assessment",
          patientName,
          createdAt: new Date().toISOString(),
          summary: `${assessmentData.assessmentType?.replace(/_/g, " ")} - ${assessmentData.chiefComplaint?.substring(0, 100) || "No chief complaint"}${assessmentData.chiefComplaint && assessmentData.chiefComplaint.length > 100 ? "..." : ""}`
        })
        
        // Notify parent if callback provided
        if (onDocumentCreated && result.document) {
          onDocumentCreated(result.document)
        }

        toast.success("Assessment created successfully")
      } else {
        // Validate required fields before API call
        if (!progressNoteData.patientId) {
          throw new Error("Patient is required")
        }
        if (!providerId) {
          throw new Error("Provider ID is missing")
        }
        if (!progressNoteData.noteType) {
          throw new Error("Note type is required")
        }

        // Prepare request data
        const requestData = {
          documentType: "progress_note",
          patient_id: progressNoteData.patientId,
          provider_id: providerId,
          note_type: progressNoteData.noteType,
          subjective: progressNoteData.subjective || null,
          objective: progressNoteData.objective || null,
          assessment: progressNoteData.assessment || null,
          plan: progressNoteData.plan || null,
        }

        const response = await fetch("/api/clinical-documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to create progress note")
        }

        // Get patient name for success message
        const selectedPatient = patients.find(p => p.id === progressNoteData.patientId)
        const patientName = selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "Patient"
        
        // Set created document info for success view
        setCreatedDocument({
          id: result.document?.id || "",
          type: "progress_note",
          patientName,
          createdAt: new Date().toISOString(),
          summary: `${progressNoteData.noteType?.replace(/_/g, " ")} - ${progressNoteData.subjective?.substring(0, 100) || "No subjective notes"}${progressNoteData.subjective && progressNoteData.subjective.length > 100 ? "..." : ""}`
        })
        
        // Notify parent if callback provided
        if (onDocumentCreated && result.document) {
          onDocumentCreated(result.document)
        }

        toast.success("Progress note created successfully")
      }

      // Show success view instead of closing
      setShowSuccessView(true)
      router.refresh()
    } catch (error) {
      console.error("Error creating document:", error)
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes("JSON")) {
          toast.error("Invalid JSON format in one of the fields")
        } else if (error.message.includes("patient_id") || error.message.includes("Patient")) {
          toast.error("Please select a valid patient")
        } else if (error.message.includes("provider_id") || error.message.includes("Provider")) {
          toast.error("Provider information is missing")
        } else {
          toast.error(`Failed to create document: ${error.message}`)
        }
      } else {
        toast.error("Failed to create document. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form to create another document
  const handleCreateAnother = () => {
    setAssessmentData({
      patientId: preSelectedPatientId || "",
      assessmentType: "",
      chiefComplaint: "",
      historyPresentIllness: "",
      mentalStatusExam: "",
      riskAssessment: "",
      diagnosisCodes: "",
      treatmentPlan: "",
    })
    setProgressNoteData({
      patientId: preSelectedPatientId || "",
      noteType: "",
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
    })
    setValidationErrors({})
    setShowSuccessView(false)
    setCreatedDocument(null)
  }

  // Close dialog and reset
  const handleClose = () => {
    handleCreateAnother()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleCreateAnother()
      }
      setOpen(isOpen)
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {showSuccessView && createdDocument ? (
          // Success View
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Document Created Successfully
              </DialogTitle>
              <DialogDescription>
                Your clinical document has been saved and is now available in the patient's chart.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  {createdDocument.type === "assessment" ? "Clinical Assessment" : "Progress Note"} Created
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient:</span>
                    <span className="font-medium">{createdDocument.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(createdDocument.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-green-200">
                    <span className="text-gray-600">Summary:</span>
                    <p className="font-medium mt-1 capitalize">{createdDocument.summary}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> You can view this document in the patient's chart under the "Documents" tab, 
                  or in the Documentation Center where you can edit, view, or delete it.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button type="button" onClick={handleCreateAnother}>
                Create Another Document
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Form View
          <>
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
                  {isLoadingPatients ? (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading patients...</span>
                    </div>
                  ) : (
                    <Select
                      value={assessmentData.patientId}
                      onValueChange={(value) => handleAssessmentChange("patientId", value)}
                      required
                      disabled={patients.length === 0}
                    >
                      <SelectTrigger className={validationErrors.patientId ? "border-destructive" : ""}>
                        <SelectValue placeholder={patients.length === 0 ? "No patients available" : "Select patient"} />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.length === 0 ? (
                          <SelectItem value="_none" disabled>
                            No patients available
                          </SelectItem>
                        ) : (
                          patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.first_name} {patient.last_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {validationErrors.patientId && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.patientId}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assessmentType">Assessment Type *</Label>
                  <Select
                    value={assessmentData.assessmentType}
                    onValueChange={(value) => handleAssessmentChange("assessmentType", value)}
                    required
                  >
                    <SelectTrigger className={validationErrors.assessmentType ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Initial Assessment</SelectItem>
                      <SelectItem value="progress">Progress Assessment</SelectItem>
                      <SelectItem value="discharge">Discharge Assessment</SelectItem>
                      <SelectItem value="crisis">Crisis Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.assessmentType && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.assessmentType}
                    </p>
                  )}
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
                  className={validationErrors.chiefComplaint ? "border-destructive" : ""}
                />
                {validationErrors.chiefComplaint && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.chiefComplaint}
                  </p>
                )}
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
                    className={validationErrors.mentalStatusExam ? "border-destructive" : ""}
                  />
                  {validationErrors.mentalStatusExam && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.mentalStatusExam}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskAssessment">Risk Assessment (JSON)</Label>
                  <Textarea
                    id="riskAssessment"
                    placeholder='{"suicide_risk": "low", "violence_risk": "low", "level": "low"}'
                    value={assessmentData.riskAssessment}
                    onChange={(e) => handleAssessmentChange("riskAssessment", e.target.value)}
                    className={validationErrors.riskAssessment ? "border-destructive" : ""}
                  />
                  {validationErrors.riskAssessment && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.riskAssessment}
                    </p>
                  )}
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
                  {isLoadingPatients ? (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading patients...</span>
                    </div>
                  ) : (
                    <Select
                      value={progressNoteData.patientId}
                      onValueChange={(value) => handleProgressNoteChange("patientId", value)}
                      required
                      disabled={patients.length === 0}
                    >
                      <SelectTrigger className={validationErrors.patientId ? "border-destructive" : ""}>
                        <SelectValue placeholder={patients.length === 0 ? "No patients available" : "Select patient"} />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.length === 0 ? (
                          <SelectItem value="_none" disabled>
                            No patients available
                          </SelectItem>
                        ) : (
                          patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.first_name} {patient.last_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {validationErrors.patientId && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.patientId}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noteType">Note Type *</Label>
                  <Select
                    value={progressNoteData.noteType}
                    onValueChange={(value) => handleProgressNoteChange("noteType", value)}
                    required
                  >
                    <SelectTrigger className={validationErrors.noteType ? "border-destructive" : ""}>
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
                  {validationErrors.noteType && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.noteType}
                    </p>
                  )}
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
                  className={validationErrors.subjective ? "border-destructive" : ""}
                />
                {validationErrors.subjective && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.subjective}
                  </p>
                )}
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
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Document"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
