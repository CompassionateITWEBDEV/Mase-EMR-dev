"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FileText, Calendar, Pill, Activity, ClipboardList, Home, AlertCircle } from "lucide-react"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
}

interface CreateDischargeSummaryDialogProps {
  children: React.ReactNode
  providerId: string
  patients: Patient[]
  preselectedPatientId?: string
}

export function CreateDischargeSummaryDialog({
  children,
  providerId,
  patients,
  preselectedPatientId,
}: CreateDischargeSummaryDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPatientData, setLoadingPatientData] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    patientId: preselectedPatientId || "",
    admissionDate: "",
    dischargeDate: new Date().toISOString().split("T")[0],
    admissionDiagnosis: "",
    reasonForAdmission: "",
    treatmentSummary: "",
    medicationsAtAdmission: "",
    medicationsAtDischarge: "",
    proceduresPerformed: "",
    therapiesProvided: "",
    clinicalCourse: "",
    responseToTreatment: "",
    complications: "",
    dischargeDiagnosis: "",
    diagnosisCodes: "",
    finalMentalStatusExam: "",
    finalRiskAssessment: "",
    functionalStatus: "",
    dischargeDisposition: "home",
    dischargeCondition: "improved",
    followUpAppointments: "",
    followUpProvider: "",
    followUpDate: "",
    dischargeInstructions: "",
    medicationInstructions: "",
    activityRestrictions: "",
    dietRecommendations: "",
    warningSigns: "",
    emergencyContactInfo: "",
    aftercarePlan: "",
    referrals: "",
    communityResources: "",
    supportSystemNotes: "",
    patientEducationProvided: "",
    familyInvolvement: "",
    barriersToDischarge: "",
    specialConsiderations: "",
  })

  // Auto-populate data when patient is selected
  useEffect(() => {
    if (formData.patientId && open) {
      loadPatientData(formData.patientId)
    }
     
  }, [formData.patientId, open])

  const loadPatientData = async (patientId: string) => {
    setLoadingPatientData(true)
    try {
      const supabase = createClient()

      // Fetch patient's latest assessment
      const { data: assessments } = await supabase
        .from("assessments")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)

      // Fetch patient's medications
      const { data: medications } = await supabase
        .from("patient_medications")
        .select("*")
        .eq("patient_id", patientId)
        .eq("status", "active")

      // Fetch patient's treatment plan
      const { data: treatmentPlans } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)

      // Auto-populate fields
      if (assessments && assessments.length > 0) {
        const latestAssessment = assessments[0]
        setFormData((prev) => ({
          ...prev,
          admissionDiagnosis: latestAssessment.diagnosis_codes?.join(", ") || "",
          reasonForAdmission: latestAssessment.chief_complaint || "",
          finalMentalStatusExam: latestAssessment.mental_status_exam
            ? JSON.stringify(latestAssessment.mental_status_exam, null, 2)
            : "",
          finalRiskAssessment: latestAssessment.risk_assessment
            ? JSON.stringify(latestAssessment.risk_assessment, null, 2)
            : "",
        }))
      }

      if (medications && medications.length > 0) {
        const medList = medications.map((med) => `${med.medication_name} ${med.dosage} ${med.frequency}`).join("\n")
        setFormData((prev) => ({
          ...prev,
          medicationsAtAdmission: medList,
          medicationsAtDischarge: medList,
        }))
      }

      if (treatmentPlans && treatmentPlans.length > 0) {
        const plan = treatmentPlans[0]
        setFormData((prev) => ({
          ...prev,
          treatmentSummary: JSON.stringify(plan.interventions, null, 2),
          aftercarePlan: JSON.stringify(plan.goals, null, 2),
        }))
      }

      toast.success("Patient data loaded successfully")
    } catch (error) {
      console.error("Error loading patient data:", error)
      toast.error("Failed to load patient data")
    } finally {
      setLoadingPatientData(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("discharge_summaries").insert({
        patient_id: formData.patientId,
        provider_id: providerId,
        admission_date: formData.admissionDate,
        discharge_date: formData.dischargeDate,
        admission_diagnosis: formData.admissionDiagnosis,
        reason_for_admission: formData.reasonForAdmission,
        treatment_summary: formData.treatmentSummary,
        medications_at_admission: formData.medicationsAtAdmission
          ? JSON.parse(`{"medications": ${JSON.stringify(formData.medicationsAtAdmission.split("\n"))}}`)
          : null,
        medications_at_discharge: formData.medicationsAtDischarge
          ? JSON.parse(`{"medications": ${JSON.stringify(formData.medicationsAtDischarge.split("\n"))}}`)
          : null,
        procedures_performed: formData.proceduresPerformed
          ? JSON.parse(`{"procedures": ${JSON.stringify(formData.proceduresPerformed.split("\n"))}}`)
          : null,
        therapies_provided: formData.therapiesProvided
          ? JSON.parse(`{"therapies": ${JSON.stringify(formData.therapiesProvided.split("\n"))}}`)
          : null,
        clinical_course: formData.clinicalCourse,
        response_to_treatment: formData.responseToTreatment,
        complications: formData.complications,
        discharge_diagnosis: formData.dischargeDiagnosis,
        diagnosis_codes: formData.diagnosisCodes ? formData.diagnosisCodes.split(",").map((code) => code.trim()) : [],
        final_mental_status_exam: formData.finalMentalStatusExam ? JSON.parse(formData.finalMentalStatusExam) : null,
        final_risk_assessment: formData.finalRiskAssessment ? JSON.parse(formData.finalRiskAssessment) : null,
        functional_status: formData.functionalStatus,
        discharge_disposition: formData.dischargeDisposition,
        discharge_condition: formData.dischargeCondition,
        follow_up_appointments: formData.followUpAppointments
          ? JSON.parse(`{"appointments": ${JSON.stringify(formData.followUpAppointments.split("\n"))}}`)
          : null,
        follow_up_provider: formData.followUpProvider,
        follow_up_date: formData.followUpDate || null,
        discharge_instructions: formData.dischargeInstructions,
        medication_instructions: formData.medicationInstructions,
        activity_restrictions: formData.activityRestrictions,
        diet_recommendations: formData.dietRecommendations,
        warning_signs: formData.warningSigns,
        emergency_contact_info: formData.emergencyContactInfo,
        aftercare_plan: formData.aftercarePlan,
        referrals: formData.referrals
          ? JSON.parse(`{"referrals": ${JSON.stringify(formData.referrals.split("\n"))}}`)
          : null,
        community_resources: formData.communityResources
          ? JSON.parse(`{"resources": ${JSON.stringify(formData.communityResources.split("\n"))}}`)
          : null,
        support_system_notes: formData.supportSystemNotes,
        patient_education_provided: formData.patientEducationProvided,
        family_involvement: formData.familyInvolvement,
        barriers_to_discharge: formData.barriersToDischarge,
        special_considerations: formData.specialConsiderations,
        status: "draft",
      })

      if (error) throw error

      toast.success("Discharge summary created successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating discharge summary:", error)
      toast.error("Failed to create discharge summary")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Discharge Summary
          </DialogTitle>
          <DialogDescription>
            Complete comprehensive discharge documentation for patient transition of care
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="admission" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="admission">Admission</TabsTrigger>
              <TabsTrigger value="treatment">Treatment</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="discharge">Discharge</TabsTrigger>
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="aftercare">Aftercare</TabsTrigger>
            </TabsList>

            {/* Admission Tab */}
            <TabsContent value="admission" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Admission Information
                  </CardTitle>
                  <CardDescription>Patient admission details and initial presentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                              {patient.first_name} {patient.last_name} (DOB:{" "}
                              {new Date(patient.date_of_birth).toLocaleDateString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Auto-Load Patient Data</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => formData.patientId && loadPatientData(formData.patientId)}
                        disabled={!formData.patientId || loadingPatientData}
                        className="w-full"
                      >
                        {loadingPatientData ? "Loading..." : "Load Patient Data"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admissionDate">Admission Date *</Label>
                      <Input
                        id="admissionDate"
                        type="date"
                        value={formData.admissionDate}
                        onChange={(e) => handleInputChange("admissionDate", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dischargeDate">Discharge Date *</Label>
                      <Input
                        id="dischargeDate"
                        type="date"
                        value={formData.dischargeDate}
                        onChange={(e) => handleInputChange("dischargeDate", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admissionDiagnosis">Admission Diagnosis *</Label>
                    <Input
                      id="admissionDiagnosis"
                      value={formData.admissionDiagnosis}
                      onChange={(e) => handleInputChange("admissionDiagnosis", e.target.value)}
                      placeholder="Primary diagnosis at admission"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reasonForAdmission">Reason for Admission *</Label>
                    <Textarea
                      id="reasonForAdmission"
                      value={formData.reasonForAdmission}
                      onChange={(e) => handleInputChange("reasonForAdmission", e.target.value)}
                      placeholder="Describe the presenting problem and reason for admission"
                      rows={4}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Treatment Tab */}
            <TabsContent value="treatment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Treatment Summary
                  </CardTitle>
                  <CardDescription>Overview of treatment provided during stay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="treatmentSummary">Treatment Summary *</Label>
                    <Textarea
                      id="treatmentSummary"
                      value={formData.treatmentSummary}
                      onChange={(e) => handleInputChange("treatmentSummary", e.target.value)}
                      placeholder="Comprehensive summary of treatment provided"
                      rows={5}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medicationsAtAdmission">Medications at Admission</Label>
                      <Textarea
                        id="medicationsAtAdmission"
                        value={formData.medicationsAtAdmission}
                        onChange={(e) => handleInputChange("medicationsAtAdmission", e.target.value)}
                        placeholder="One medication per line"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medicationsAtDischarge">Medications at Discharge</Label>
                      <Textarea
                        id="medicationsAtDischarge"
                        value={formData.medicationsAtDischarge}
                        onChange={(e) => handleInputChange("medicationsAtDischarge", e.target.value)}
                        placeholder="One medication per line"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="proceduresPerformed">Procedures Performed</Label>
                      <Textarea
                        id="proceduresPerformed"
                        value={formData.proceduresPerformed}
                        onChange={(e) => handleInputChange("proceduresPerformed", e.target.value)}
                        placeholder="One procedure per line"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="therapiesProvided">Therapies Provided</Label>
                      <Textarea
                        id="therapiesProvided"
                        value={formData.therapiesProvided}
                        onChange={(e) => handleInputChange("therapiesProvided", e.target.value)}
                        placeholder="One therapy per line (e.g., CBT, DBT, Group Therapy)"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinicalCourse">Clinical Course *</Label>
                    <Textarea
                      id="clinicalCourse"
                      value={formData.clinicalCourse}
                      onChange={(e) => handleInputChange("clinicalCourse", e.target.value)}
                      placeholder="Describe the patient's clinical course during treatment"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="responseToTreatment">Response to Treatment</Label>
                      <Textarea
                        id="responseToTreatment"
                        value={formData.responseToTreatment}
                        onChange={(e) => handleInputChange("responseToTreatment", e.target.value)}
                        placeholder="How did the patient respond to treatment?"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complications">Complications</Label>
                      <Textarea
                        id="complications"
                        value={formData.complications}
                        onChange={(e) => handleInputChange("complications", e.target.value)}
                        placeholder="Any complications or adverse events"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessment Tab */}
            <TabsContent value="assessment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Final Assessment
                  </CardTitle>
                  <CardDescription>Clinical assessment at time of discharge</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dischargeDiagnosis">Discharge Diagnosis *</Label>
                    <Input
                      id="dischargeDiagnosis"
                      value={formData.dischargeDiagnosis}
                      onChange={(e) => handleInputChange("dischargeDiagnosis", e.target.value)}
                      placeholder="Final diagnosis at discharge"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosisCodes">Diagnosis Codes (ICD-10)</Label>
                    <Input
                      id="diagnosisCodes"
                      value={formData.diagnosisCodes}
                      onChange={(e) => handleInputChange("diagnosisCodes", e.target.value)}
                      placeholder="Comma-separated ICD-10 codes"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="finalMentalStatusExam">Final Mental Status Exam (JSON)</Label>
                      <Textarea
                        id="finalMentalStatusExam"
                        value={formData.finalMentalStatusExam}
                        onChange={(e) => handleInputChange("finalMentalStatusExam", e.target.value)}
                        placeholder='{"appearance": "well-groomed", "mood": "euthymic"}'
                        rows={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="finalRiskAssessment">Final Risk Assessment (JSON)</Label>
                      <Textarea
                        id="finalRiskAssessment"
                        value={formData.finalRiskAssessment}
                        onChange={(e) => handleInputChange("finalRiskAssessment", e.target.value)}
                        placeholder='{"suicide_risk": "low", "violence_risk": "low"}'
                        rows={5}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="functionalStatus">Functional Status</Label>
                    <Textarea
                      id="functionalStatus"
                      value={formData.functionalStatus}
                      onChange={(e) => handleInputChange("functionalStatus", e.target.value)}
                      placeholder="Describe patient's functional abilities at discharge"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Discharge Tab */}
            <TabsContent value="discharge" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Discharge Planning
                  </CardTitle>
                  <CardDescription>Discharge disposition and follow-up arrangements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dischargeDisposition">Discharge Disposition *</Label>
                      <Select
                        value={formData.dischargeDisposition}
                        onValueChange={(value) => handleInputChange("dischargeDisposition", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="residential">Residential Treatment</SelectItem>
                          <SelectItem value="hospital">Hospital Transfer</SelectItem>
                          <SelectItem value="against-medical-advice">Against Medical Advice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dischargeCondition">Discharge Condition *</Label>
                      <Select
                        value={formData.dischargeCondition}
                        onValueChange={(value) => handleInputChange("dischargeCondition", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="improved">Improved</SelectItem>
                          <SelectItem value="stable">Stable</SelectItem>
                          <SelectItem value="unchanged">Unchanged</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followUpAppointments">Follow-up Appointments</Label>
                    <Textarea
                      id="followUpAppointments"
                      value={formData.followUpAppointments}
                      onChange={(e) => handleInputChange("followUpAppointments", e.target.value)}
                      placeholder="One appointment per line"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="followUpProvider">Follow-up Provider</Label>
                      <Input
                        id="followUpProvider"
                        value={formData.followUpProvider}
                        onChange={(e) => handleInputChange("followUpProvider", e.target.value)}
                        placeholder="Name of follow-up provider"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="followUpDate">Follow-up Date</Label>
                      <Input
                        id="followUpDate"
                        type="date"
                        value={formData.followUpDate}
                        onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Instructions Tab */}
            <TabsContent value="instructions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Discharge Instructions
                  </CardTitle>
                  <CardDescription>Patient education and safety information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dischargeInstructions">General Discharge Instructions *</Label>
                    <Textarea
                      id="dischargeInstructions"
                      value={formData.dischargeInstructions}
                      onChange={(e) => handleInputChange("dischargeInstructions", e.target.value)}
                      placeholder="General instructions for patient care after discharge"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicationInstructions">Medication Instructions</Label>
                    <Textarea
                      id="medicationInstructions"
                      value={formData.medicationInstructions}
                      onChange={(e) => handleInputChange("medicationInstructions", e.target.value)}
                      placeholder="How to take medications, side effects to watch for"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="activityRestrictions">Activity Restrictions</Label>
                      <Textarea
                        id="activityRestrictions"
                        value={formData.activityRestrictions}
                        onChange={(e) => handleInputChange("activityRestrictions", e.target.value)}
                        placeholder="Any activity limitations or restrictions"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dietRecommendations">Diet Recommendations</Label>
                      <Textarea
                        id="dietRecommendations"
                        value={formData.dietRecommendations}
                        onChange={(e) => handleInputChange("dietRecommendations", e.target.value)}
                        placeholder="Dietary recommendations or restrictions"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warningSigns">Warning Signs</Label>
                    <Textarea
                      id="warningSigns"
                      value={formData.warningSigns}
                      onChange={(e) => handleInputChange("warningSigns", e.target.value)}
                      placeholder="Signs and symptoms that require immediate medical attention"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactInfo">Emergency Contact Information</Label>
                    <Textarea
                      id="emergencyContactInfo"
                      value={formData.emergencyContactInfo}
                      onChange={(e) => handleInputChange("emergencyContactInfo", e.target.value)}
                      placeholder="Crisis hotline, emergency contacts, when to seek help"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aftercare Tab */}
            <TabsContent value="aftercare" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Aftercare Planning
                  </CardTitle>
                  <CardDescription>Continuing care and community support</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aftercarePlan">Aftercare Plan *</Label>
                    <Textarea
                      id="aftercarePlan"
                      value={formData.aftercarePlan}
                      onChange={(e) => handleInputChange("aftercarePlan", e.target.value)}
                      placeholder="Comprehensive aftercare and continuing treatment plan"
                      rows={5}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referrals">Referrals</Label>
                    <Textarea
                      id="referrals"
                      value={formData.referrals}
                      onChange={(e) => handleInputChange("referrals", e.target.value)}
                      placeholder="One referral per line (e.g., outpatient therapy, psychiatrist)"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="communityResources">Community Resources</Label>
                    <Textarea
                      id="communityResources"
                      value={formData.communityResources}
                      onChange={(e) => handleInputChange("communityResources", e.target.value)}
                      placeholder="One resource per line (e.g., support groups, housing assistance)"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportSystemNotes">Support System Notes</Label>
                    <Textarea
                      id="supportSystemNotes"
                      value={formData.supportSystemNotes}
                      onChange={(e) => handleInputChange("supportSystemNotes", e.target.value)}
                      placeholder="Family involvement, social support, living situation"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patientEducationProvided">Patient Education Provided</Label>
                    <Textarea
                      id="patientEducationProvided"
                      value={formData.patientEducationProvided}
                      onChange={(e) => handleInputChange("patientEducationProvided", e.target.value)}
                      placeholder="Topics covered in patient education"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="familyInvolvement">Family Involvement</Label>
                    <Textarea
                      id="familyInvolvement"
                      value={formData.familyInvolvement}
                      onChange={(e) => handleInputChange("familyInvolvement", e.target.value)}
                      placeholder="Family participation in treatment and discharge planning"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barriersToDischarge">Barriers to Discharge</Label>
                    <Textarea
                      id="barriersToDischarge"
                      value={formData.barriersToDischarge}
                      onChange={(e) => handleInputChange("barriersToDischarge", e.target.value)}
                      placeholder="Any identified barriers or challenges"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialConsiderations">Special Considerations</Label>
                    <Textarea
                      id="specialConsiderations"
                      value={formData.specialConsiderations}
                      onChange={(e) => handleInputChange("specialConsiderations", e.target.value)}
                      placeholder="Any special considerations or notes"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Discharge Summary"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
