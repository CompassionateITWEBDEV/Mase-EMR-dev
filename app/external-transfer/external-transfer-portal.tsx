"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { upload } from "@vercel/blob/client"
import {
  Building2,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  User,
  Pill,
  FileCheck,
  Send,
  Lock,
  Info,
} from "lucide-react"
import { useSearchParams } from "next/navigation"

interface UploadedDoc {
  id: string
  name: string
  url: string
  type: string
  size: number
}

export default function ExternalTransferPortal() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [formData, setFormData] = useState({
    sending_facility_name: "",
    sending_facility_address: "",
    sending_facility_phone: "",
    sending_facility_fax: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    patient_name: "",
    patient_dob: "",
    patient_ssn_last4: "",
    transfer_reason: "",
    current_medication: "",
    current_dose: "",
    last_dose_date: "",
    treatment_start_date: "",
    diagnosis_codes: "",
    special_instructions: "",
    consent_confirmed: false,
    hipaa_acknowledged: false,
    cfr_part2_acknowledged: false,
  })

  const documentTypes = [
    { id: "demographics", label: "Demographics & Insurance", required: true },
    { id: "medication_orders", label: "Medication Orders", required: true },
    { id: "dosing_history", label: "Dosing History (Last 30 days)", required: true },
    { id: "uds_results", label: "UDS Results", required: false },
    { id: "treatment_plan", label: "Treatment Plan", required: false },
    { id: "progress_notes", label: "Progress Notes", required: false },
    { id: "lab_results", label: "Lab Results", required: false },
    { id: "discharge_summary", label: "Discharge Summary", required: false },
    { id: "photo_id", label: "Photo ID Copy", required: false },
    { id: "other", label: "Other Documents", required: false },
  ]

  useEffect(() => {
    // Validate token
    if (token) {
      try {
        const decoded = atob(token)
        const [patientId, timestamp] = decoded.split(":")
        // Check if token is less than 7 days old
        const tokenAge = Date.now() - Number.parseInt(timestamp)
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        setIsValidToken(tokenAge < sevenDays && patientId.length > 0)
      } catch {
        setIsValidToken(false)
      }
    } else {
      setIsValidToken(false)
    }
    setLoading(false)
  }, [token])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingFile(true)
    try {
      for (const file of Array.from(files)) {
        const blob = await upload(`transfer-documents/${Date.now()}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload-document",
        })

        setUploadedDocs((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            name: file.name,
            url: blob.url,
            type: file.type,
            size: file.size,
          },
        ])
      }

      toast({
        title: "Documents Uploaded",
        description: `${files.length} document(s) uploaded successfully`,
      })
    } catch (err) {
      console.error("Upload error:", err)
      toast({
        title: "Upload Failed",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeDocument = (id: string) => {
    setUploadedDocs((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.sending_facility_name ||
      !formData.contact_person ||
      !formData.patient_name ||
      !formData.patient_dob
    ) {
      toast({
        title: "Missing Required Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!formData.consent_confirmed || !formData.hipaa_acknowledged || !formData.cfr_part2_acknowledged) {
      toast({
        title: "Consent Required",
        description: "Please acknowledge all consent statements",
        variant: "destructive",
      })
      return
    }

    if (uploadedDocs.length === 0) {
      toast({
        title: "Documents Required",
        description: "Please upload at least one transfer document",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      // Decode token to get patient ID
      let patientId = null
      if (token) {
        try {
          const decoded = atob(token)
          patientId = decoded.split(":")[0]
        } catch {}
      }

      // Create transfer request record
      const { error } = await supabase.from("fax_inbox").insert({
        fax_number: formData.sending_facility_fax || "external_portal",
        sender_fax_number: formData.sending_facility_phone,
        document_type: "transfer_documents",
        file_url: uploadedDocs[0]?.url || "",
        page_count: uploadedDocs.length,
        status: "pending",
        patient_id: patientId,
        processed_by_ai: false,
        ai_extracted_data: {
          patient_name: formData.patient_name,
          patient_dob: formData.patient_dob,
          facility_name: formData.sending_facility_name,
          contact_person: formData.contact_person,
          contact_email: formData.contact_email,
          transfer_reason: formData.transfer_reason,
          current_medication: formData.current_medication,
          current_dose: formData.current_dose,
          documents: uploadedDocs,
        },
        notes: formData.special_instructions,
      })

      if (error) throw error

      setSubmitted(true)
      toast({
        title: "Transfer Request Submitted",
        description: "Your transfer documents have been submitted successfully",
      })
    } catch (err) {
      console.error("Submission error:", err)
      toast({
        title: "Submission Failed",
        description: "Failed to submit transfer request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground">
              This transfer portal link is invalid or has expired. Please contact the receiving facility for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-green-700 mb-2">Transfer Request Submitted</h2>
            <p className="text-muted-foreground mb-4">
              Your transfer documents have been securely submitted. The receiving facility will process your request and
              contact you if additional information is needed.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h3 className="font-medium text-green-800 mb-2">Submission Summary</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Patient: {formData.patient_name}</li>
                <li>• Sending Facility: {formData.sending_facility_name}</li>
                <li>• Documents Uploaded: {uploadedDocs.length}</li>
                <li>• Submitted: {new Date().toLocaleString()}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Building2 className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Secure Patient Transfer Portal</h1>
              <p className="text-sm text-muted-foreground">Submit transfer documents securely</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Security Notice */}
        <Card className="border-cyan-200 bg-cyan-50/50">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-cyan-800">Secure & HIPAA Compliant</h3>
                <p className="text-sm text-cyan-700">
                  All documents are encrypted during transfer and stored securely in compliance with HIPAA and 42 CFR
                  Part 2 regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sending Facility Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Sending Facility Information
            </CardTitle>
            <CardDescription>Enter your facility details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Facility Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter facility name"
                  value={formData.sending_facility_name}
                  onChange={(e) => setFormData({ ...formData, sending_facility_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Facility Phone</Label>
                <Input
                  placeholder="(555) 123-4567"
                  value={formData.sending_facility_phone}
                  onChange={(e) => setFormData({ ...formData, sending_facility_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Facility Fax</Label>
                <Input
                  placeholder="(555) 123-4568"
                  value={formData.sending_facility_fax}
                  onChange={(e) => setFormData({ ...formData, sending_facility_fax: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Facility Address</Label>
                <Input
                  placeholder="Full address"
                  value={formData.sending_facility_address}
                  onChange={(e) => setFormData({ ...formData, sending_facility_address: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Contact Person</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Contact name"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@facility.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
            <CardDescription>Information about the patient being transferred</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  Patient Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Full name"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.patient_dob}
                  onChange={(e) => setFormData({ ...formData, patient_dob: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SSN (Last 4 digits)</Label>
                <Input
                  placeholder="XXXX"
                  maxLength={4}
                  value={formData.patient_ssn_last4}
                  onChange={(e) => setFormData({ ...formData, patient_ssn_last4: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason for Transfer</Label>
              <Select
                value={formData.transfer_reason}
                onValueChange={(value) => setFormData({ ...formData, transfer_reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relocation">Patient Relocation</SelectItem>
                  <SelectItem value="closer_facility">Closer to Home/Work</SelectItem>
                  <SelectItem value="insurance_change">Insurance Change</SelectItem>
                  <SelectItem value="program_completion">Program Completion</SelectItem>
                  <SelectItem value="clinical_need">Clinical Need</SelectItem>
                  <SelectItem value="patient_request">Patient Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Current Treatment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Current Treatment Information
            </CardTitle>
            <CardDescription>Current medication and treatment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Medication</Label>
                <Select
                  value={formData.current_medication}
                  onValueChange={(value) => setFormData({ ...formData, current_medication: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="methadone">Methadone</SelectItem>
                    <SelectItem value="suboxone">Suboxone (Buprenorphine/Naloxone)</SelectItem>
                    <SelectItem value="buprenorphine">Buprenorphine</SelectItem>
                    <SelectItem value="vivitrol">Vivitrol (Naltrexone)</SelectItem>
                    <SelectItem value="sublocade">Sublocade</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current Dose (mg)</Label>
                <Input
                  placeholder="e.g., 80"
                  value={formData.current_dose}
                  onChange={(e) => setFormData({ ...formData, current_dose: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Dose Date</Label>
                <Input
                  type="date"
                  value={formData.last_dose_date}
                  onChange={(e) => setFormData({ ...formData, last_dose_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Treatment Start Date</Label>
                <Input
                  type="date"
                  value={formData.treatment_start_date}
                  onChange={(e) => setFormData({ ...formData, treatment_start_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Diagnosis Codes (ICD-10)</Label>
              <Input
                placeholder="e.g., F11.20, F14.20"
                value={formData.diagnosis_codes}
                onChange={(e) => setFormData({ ...formData, diagnosis_codes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transfer Documents
            </CardTitle>
            <CardDescription>Upload required transfer documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document Checklist */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Required Documents Checklist
              </h4>
              <div className="grid md:grid-cols-2 gap-2">
                {documentTypes.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <div className={`h-2 w-2 rounded-full ${doc.required ? "bg-red-500" : "bg-gray-300"}`} />
                    <span className={doc.required ? "font-medium" : ""}>
                      {doc.label}
                      {doc.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, JPG, PNG (max 10MB each)</p>
              </label>
              {uploadingFile && (
                <div className="mt-4 flex items-center justify-center gap-2 text-cyan-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Documents ({uploadedDocs.length})</h4>
                {uploadedDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-cyan-600" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{(doc.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Special Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Special Instructions or Notes</Label>
              <Textarea
                placeholder="Any additional information the receiving facility should know..."
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Consent & Acknowledgments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Consent & Acknowledgments
            </CardTitle>
            <CardDescription>Required acknowledgments for transfer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={formData.consent_confirmed}
                onCheckedChange={(checked) => setFormData({ ...formData, consent_confirmed: checked as boolean })}
              />
              <label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                <span className="font-medium">Patient Consent Confirmed</span>
                <span className="text-red-500 ml-1">*</span>
                <p className="text-muted-foreground mt-1">
                  I confirm that the patient has provided written consent for the release of their treatment records to
                  the receiving facility.
                </p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="hipaa"
                checked={formData.hipaa_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, hipaa_acknowledged: checked as boolean })}
              />
              <label htmlFor="hipaa" className="text-sm leading-relaxed cursor-pointer">
                <span className="font-medium">HIPAA Acknowledgment</span>
                <span className="text-red-500 ml-1">*</span>
                <p className="text-muted-foreground mt-1">
                  I acknowledge that this transfer complies with HIPAA regulations and the minimum necessary standard
                  for information disclosure.
                </p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="cfr"
                checked={formData.cfr_part2_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, cfr_part2_acknowledged: checked as boolean })}
              />
              <label htmlFor="cfr" className="text-sm leading-relaxed cursor-pointer">
                <span className="font-medium">42 CFR Part 2 Acknowledgment</span>
                <span className="text-red-500 ml-1">*</span>
                <p className="text-muted-foreground mt-1">
                  I acknowledge that these records are protected by federal confidentiality rules (42 CFR Part 2) and
                  that proper consent has been obtained for this disclosure.
                </p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pb-8">
          <Button size="lg" onClick={handleSubmit} disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Transfer Request
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
