"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  User,
  FileText,
  Camera,
  Smartphone,
  Shield,
  Heart,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Phone,
  Mail,
  CreditCard,
  Stethoscope,
  Loader2,
  Search,
  Plus,
  Save,
  AlertTriangle,
  Pill,
  Activity,
  Upload,
  Eye,
  FileImage,
  FileCheck,
  Trash2,
  Send,
  Building2,
  Fan as Fax,
  Globe,
  Copy,
  QrCode,
  Download,
  ExternalLink,
  Inbox,
  SendHorizontal,
} from "lucide-react"
import { upload } from "@vercel/blob/client"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  email: string
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  insurance_provider: string
  insurance_id: string
}

interface OrientationItem {
  id: number
  title: string
  description: string
  icon: any
}

interface UploadedDocument {
  id: string
  type: string
  fileName: string
  fileUrl: string
  uploadedAt: string
  status: "pending" | "verified" | "rejected"
  notes?: string
}

interface ReleaseOfInformation {
  id: string
  patient_id: string
  requesting_facility: string
  facility_contact: string
  facility_phone: string
  facility_fax: string
  facility_email: string
  purpose: string
  information_types: string[]
  effective_date: string
  expiration_date: string
  status: "pending" | "signed" | "expired" | "revoked"
  signed_at?: string
  signed_by?: string
  created_at: string
}

interface ExternalTransferRequest {
  id: string
  patient_name: string
  patient_dob: string
  sending_facility: string
  contact_person: string
  contact_phone: string
  contact_email: string
  transfer_reason: string
  documents: { name: string; url: string; type: string }[]
  status: "pending" | "received" | "processed" | "rejected"
  submitted_at: string
  notes?: string
}

export default function PatientIntake() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [completedItems, setCompletedItems] = useState<number[]>([])
  const [orientationProgress, setOrientationProgress] = useState(0)

  // PMP state
  const [pmpLoading, setPmpLoading] = useState(false)
  const [pmpResults, setPmpResults] = useState<any>(null)
  const [pmpConfig, setPmpConfig] = useState<any>(null)

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null)
  const [documentPreview, setDocumentPreview] = useState<string | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const [releaseOfInfoForms, setReleaseOfInfoForms] = useState<ReleaseOfInformation[]>([])
  const [newReleaseForm, setNewReleaseForm] = useState({
    requesting_facility: "",
    facility_contact: "",
    facility_phone: "",
    facility_fax: "",
    facility_email: "",
    purpose: "transfer",
    information_types: [] as string[],
    effective_date: new Date().toISOString().split("T")[0],
    expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  })
  const [showReleaseForm, setShowReleaseForm] = useState(false)
  const [externalTransfers, setExternalTransfers] = useState<ExternalTransferRequest[]>([])
  const [transferPortalLink, setTransferPortalLink] = useState("")
  const [faxNumber, setFaxNumber] = useState("")
  const [sendingFax, setSendingFax] = useState(false)

  const { toast } = useToast()
  const supabase = createBrowserClient()

  // Clinical Assessment Form State
  const [assessmentData, setAssessmentData] = useState({
    primary_substance: "",
    duration_of_use: "",
    medical_history: "",
    mental_health_screening: "",
    social_determinants: "",
  })

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    phone: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    insurance_provider: "",
    insurance_id: "",
    gender: "",
  })

  // Documentation Status
  const [documentationStatus, setDocumentationStatus] = useState({
    consent_for_treatment: "pending",
    hipaa_authorization: "pending",
    financial_agreement: "pending",
    emergency_contact_form: "pending",
    photo_id_verification: "pending",
    insurance_card_copy: "pending",
    hhn_enrollment: "pending",
    patient_handbook_receipt: "pending",
  })

  const documentTypes = [
    { id: "photo_id", label: "Photo ID (Driver's License/State ID)", icon: FileImage, required: true },
    { id: "insurance_card_front", label: "Insurance Card (Front)", icon: CreditCard, required: true },
    { id: "insurance_card_back", label: "Insurance Card (Back)", icon: CreditCard, required: false },
    { id: "transfer_packet", label: "Transfer Documents/Records", icon: FileText, required: false },
    { id: "prior_auth", label: "Prior Authorization", icon: FileCheck, required: false },
    { id: "medical_records", label: "Medical Records", icon: FileText, required: false },
    { id: "consent_forms", label: "Signed Consent Forms", icon: FileCheck, required: false },
    { id: "other", label: "Other Documents", icon: FileText, required: false },
  ]

  const informationTypes = [
    { id: "demographics", label: "Demographics & Contact Information" },
    { id: "insurance", label: "Insurance Information" },
    { id: "medical_history", label: "Medical History" },
    { id: "medications", label: "Medication List & Dosing History" },
    { id: "lab_results", label: "Laboratory Results" },
    { id: "uds_results", label: "Urine Drug Screen Results" },
    { id: "treatment_plans", label: "Treatment Plans" },
    { id: "progress_notes", label: "Progress Notes" },
    { id: "assessments", label: "Clinical Assessments (ASAM, etc.)" },
    { id: "discharge_summary", label: "Discharge Summary" },
    { id: "substance_use", label: "Substance Use Records (42 CFR Part 2)" },
    { id: "mental_health", label: "Mental Health Records" },
  ]

  useEffect(() => {
    loadPMPConfig()
  }, [])

  const loadPMPConfig = async () => {
    const { data } = await supabase.from("pdmp_config").select("*").single()

    if (data) {
      setPmpConfig(data)
    }
  }

  const runPMPCheck = async (patient: Patient) => {
    if (!pmpConfig?.is_active || !pmpConfig?.auto_check_controlled_rx) {
      return // PMP not configured or auto-check disabled
    }

    setPmpLoading(true)
    setPmpResults(null)

    try {
      const response = await fetch("/api/pmp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          dob: patient.date_of_birth,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPmpResults(result)

        if (result.alertLevel === "critical" || result.alertLevel === "high") {
          toast({
            title: "PMP Alert",
            description: `High-risk prescription history detected for this patient`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "PMP Check Complete",
            description: `${result.prescriptionCount || 0} controlled substance prescriptions found`,
          })
        }
      }
    } catch (err) {
      console.error("Error running PMP check:", err)
      toast({
        title: "PMP Check Failed",
        description: "Could not query PMP database. Please check manually.",
        variant: "destructive",
      })
    } finally {
      setPmpLoading(false)
    }
  }

  // Search patients from database
  const searchPatients = async (term: string) => {
    if (!term || term.length < 2) {
      setPatients([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(10)

      if (error) throw error
      setPatients(data || [])
    } catch (err) {
      console.error("Error searching patients:", err)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  const createNewPatient = async () => {
    if (!newPatient.first_name || !newPatient.last_name || !newPatient.date_of_birth) {
      toast({
        title: "Missing Fields",
        description: "Please fill in required fields: First Name, Last Name, and Date of Birth",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create patient")
      }

      const data = await response.json()

      setSelectedPatient(data)
      setShowNewPatientForm(false)
      setNewPatient({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        phone: "",
        email: "",
        address: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        insurance_provider: "",
        insurance_id: "",
        gender: "",
      })

      toast({ title: "Success", description: "Patient created successfully" })

      // Auto-run PMP check for new patient
      await runPMPCheck(data)
    } catch (err) {
      console.error("Error creating patient:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create patient. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Save orientation progress
  const saveOrientationProgress = async () => {
    if (!selectedPatient) return

    setSaving(true)
    try {
      // Save to patient_chart_items or create an intake record
      const { error } = await supabase.from("otp_admissions").upsert({
        patient_id: selectedPatient.id,
        admission_date: new Date().toISOString().split("T")[0],
        status: orientationProgress === 100 ? "active" : "pending_orientation",
        program_type: "OTP",
        medication: assessmentData.primary_substance || "pending",
      })

      if (error) throw error
      toast({ title: "Success", description: "Progress saved successfully!" })
    } catch (err) {
      console.error("Error saving progress:", err)
      toast({ title: "Error", description: "Failed to save progress", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Complete intake
  const completeIntake = async () => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Please select a patient first", variant: "destructive" })
      return
    }

    if (orientationProgress < 100) {
      const confirm = window.confirm("Orientation is not complete. Are you sure you want to finish?")
      if (!confirm) return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from("otp_admissions").upsert({
        patient_id: selectedPatient.id,
        admission_date: new Date().toISOString().split("T")[0],
        status: "active",
        program_type: "OTP",
        primary_substance: assessmentData.primary_substance,
        medication: "pending_evaluation",
      })

      if (error) throw error
      toast({ title: "Success", description: "Intake completed! Patient is now active." })

      // Reset form
      setSelectedPatient(null)
      setCompletedItems([])
      setOrientationProgress(0)
      setPmpResults(null)
      setAssessmentData({
        primary_substance: "",
        duration_of_use: "",
        medical_history: "",
        mental_health_screening: "",
        social_determinants: "",
      })
      setUploadedDocuments([]) // Reset documents
    } catch (err) {
      console.error("Error completing intake:", err)
      toast({ title: "Error", description: "Failed to complete intake", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleItemComplete = (itemId: number) => {
    if (!completedItems.includes(itemId)) {
      const newCompleted = [...completedItems, itemId]
      setCompletedItems(newCompleted)
      setOrientationProgress((newCompleted.length / orientationChecklist.length) * 100)
    } else {
      const newCompleted = completedItems.filter((id) => id !== itemId)
      setCompletedItems(newCompleted)
      setOrientationProgress((newCompleted.length / orientationChecklist.length) * 100)
    }
  }

  const updateDocStatus = (doc: keyof typeof documentationStatus, status: string) => {
    setDocumentationStatus((prev) => ({ ...prev, [doc]: status }))
  }

  const handleDocumentUpload = async (documentType: string, file: File) => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select or create a patient first",
        variant: "destructive",
      })
      return
    }

    setUploadingDocument(documentType)

    try {
      // Upload to Vercel Blob
      const blob = await upload(`patient-documents/${selectedPatient.id}/${documentType}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload-document",
      })

      // Save document reference to database
      const { data, error } = await supabase
        .from("ai_document_processing")
        .insert({
          patient_id: selectedPatient.id,
          document_type: documentType,
          file_url: blob.url,
          processing_status: "pending",
          source_type: "intake",
        })
        .select()
        .single()

      if (error) throw error

      const newDoc: UploadedDocument = {
        id: data.id,
        type: documentType,
        fileName: file.name,
        fileUrl: blob.url,
        uploadedAt: new Date().toISOString(),
        status: "pending",
      }

      setUploadedDocuments((prev) => [...prev.filter((d) => d.type !== documentType), newDoc])

      // Update documentation status
      if (documentType === "photo_id") {
        updateDocStatus("photo_id_verification", "completed")
      } else if (documentType.includes("insurance")) {
        updateDocStatus("insurance_card_copy", "completed")
      }

      toast({
        title: "Document Uploaded",
        description: `${file.name} has been uploaded successfully`,
      })
    } catch (err) {
      console.error("Error uploading document:", err)
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingDocument(null)
    }
  }

  const loadPatientDocuments = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from("ai_document_processing")
        .select("*")
        .eq("patient_id", patientId)
        .eq("source_type", "intake")
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        const docs: UploadedDocument[] = data.map((doc) => ({
          id: doc.id,
          type: doc.document_type,
          fileName: doc.file_url.split("/").pop() || "document",
          fileUrl: doc.file_url,
          uploadedAt: doc.created_at,
          status:
            doc.processing_status === "completed"
              ? "verified"
              : doc.processing_status === "failed"
                ? "rejected"
                : "pending",
        }))
        setUploadedDocuments(docs)
      }
    } catch (err) {
      console.error("Error loading documents:", err)
    }
  }

  const handleDeleteDocument = async (docId: string, docType: string) => {
    try {
      const { error } = await supabase.from("ai_document_processing").delete().eq("id", docId)

      if (error) throw error

      setUploadedDocuments((prev) => prev.filter((d) => d.id !== docId))

      toast({
        title: "Document Deleted",
        description: "Document has been removed",
      })
    } catch (err) {
      console.error("Error deleting document:", err)
      toast({
        title: "Delete Failed",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (selectedPatient) {
      loadPatientDocuments(selectedPatient.id)
      loadExternalTransfers()
      generateTransferPortalLink()
    }
  }, [selectedPatient])

  const orientationChecklist: OrientationItem[] = [
    {
      id: 1,
      title: "Introduction and Welcome",
      description: "Greet patient and provide program overview",
      icon: Users,
    },
    {
      id: 2,
      title: "Program Overview",
      description: "Explain services, treatment phases, and expectations",
      icon: FileText,
    },
    { id: 3, title: "Facility Tour", description: "Show key areas and emergency exits", icon: MapPin },
    { id: 4, title: "Patient ID Card", description: "Issue identification card with photo", icon: Camera },
    {
      id: 5,
      title: "Rights and Responsibilities",
      description: "Review HIPAA rights and patient responsibilities",
      icon: Shield,
    },
    { id: 6, title: "Grievance Procedure", description: "Explain complaint process and HHN filing", icon: AlertCircle },
    {
      id: 7,
      title: "HHN Orientation",
      description: "Set up HomeHealthNotify app and demonstrate features",
      icon: Smartphone,
    },
    {
      id: 8,
      title: "Medication Education",
      description: "Discuss MAT options, benefits, and safety",
      icon: Stethoscope,
    },
    { id: 9, title: "Drug Screening Policy", description: "Review testing procedures and protocols", icon: Heart },
    {
      id: 10,
      title: "Treatment Schedule",
      description: "Provide appointment schedule and attendance policy",
      icon: Calendar,
    },
    { id: 11, title: "Safety Procedures", description: "Review emergency protocols and EAP codes", icon: Shield },
    { id: 12, title: "Support Services", description: "Explain case management and peer support", icon: Users },
    { id: 13, title: "Confidentiality Forms", description: "Review and sign consent forms", icon: FileText },
    { id: 14, title: "Educational Programs", description: "Discuss available workshops and training", icon: FileText },
    {
      id: 15,
      title: "Financial Information",
      description: "Review payment arrangements and insurance",
      icon: CreditCard,
    },
    { id: 16, title: "Patient Handbook", description: "Provide handbook and review key sections", icon: FileText },
    { id: 17, title: "Telehealth Options", description: "Explain remote appointment availability", icon: Phone },
    {
      id: 18,
      title: "Take-Home Monitoring",
      description: "Review eligibility and HHN video requirements",
      icon: Smartphone,
    },
    { id: 19, title: "Contact Information", description: "Provide key contacts and after-hours support", icon: Mail },
    {
      id: 20,
      title: "Follow-Up Planning",
      description: "Schedule next appointments and confirm understanding",
      icon: Calendar,
    },
  ]

  const selectPatient = async (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchTerm("")
    setPatients([])

    // Load existing documents
    await loadPatientDocuments(patient.id)

    // Load release of information forms
    await loadReleaseOfInfoForms(patient.id)

    // Generate transfer portal link
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const token = btoa(`${patient.id}:${Date.now()}`)
    setTransferPortalLink(`${baseUrl}/external-transfer?token=${token}`)

    // Auto-run PMP check
    await runPMPCheck(patient)
  }

  const getPMPAlertBadge = (alertLevel: string) => {
    switch (alertLevel) {
      case "critical":
        return <Badge variant="destructive">Critical Risk</Badge>
      case "high":
        return <Badge className="bg-orange-500">High Risk</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">Medium Risk</Badge>
      case "low":
        return <Badge className="bg-green-500">Low Risk</Badge>
      default:
        return <Badge variant="secondary">No Alerts</Badge>
    }
  }

  const createReleaseOfInfo = async () => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient first",
        variant: "destructive",
      })
      return
    }

    if (!newReleaseForm.requesting_facility || newReleaseForm.information_types.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide facility name and select information types",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from("patient_sharing_authorizations")
        .insert({
          patient_id: selectedPatient.id,
          authorization_type: "release_of_information",
          purpose: newReleaseForm.purpose,
          information_types: {
            facility_name: newReleaseForm.requesting_facility,
            facility_contact: newReleaseForm.facility_contact,
            facility_phone: newReleaseForm.facility_phone,
            facility_fax: newReleaseForm.facility_fax,
            facility_email: newReleaseForm.facility_email,
            types: newReleaseForm.information_types,
          },
          effective_date: newReleaseForm.effective_date,
          expiration_date: newReleaseForm.expiration_date,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Release of Information Created",
        description: "The authorization form has been created and is ready for signature",
      })

      setShowReleaseForm(false)
      setNewReleaseForm({
        requesting_facility: "",
        facility_contact: "",
        facility_phone: "",
        facility_fax: "",
        facility_email: "",
        purpose: "transfer",
        information_types: [],
        effective_date: new Date().toISOString().split("T")[0],
        expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      })

      // Reload release forms
      loadReleaseOfInfoForms(selectedPatient.id)
    } catch (err) {
      console.error("Error creating release of information:", err)
      toast({
        title: "Error",
        description: "Failed to create release of information",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const loadReleaseOfInfoForms = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from("patient_sharing_authorizations")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        const forms: ReleaseOfInformation[] = data.map((item) => ({
          id: item.id,
          patient_id: item.patient_id,
          requesting_facility: item.information_types?.facility_name || "",
          facility_contact: item.information_types?.facility_contact || "",
          facility_phone: item.information_types?.facility_phone || "",
          facility_fax: item.information_types?.facility_fax || "",
          facility_email: item.information_types?.facility_email || "",
          purpose: item.purpose || "transfer",
          information_types: item.information_types?.types || [],
          effective_date: item.effective_date,
          expiration_date: item.expiration_date,
          status: item.is_active
            ? new Date(item.expiration_date) < new Date()
              ? "expired"
              : item.signed_consent_url
                ? "signed"
                : "pending"
            : "revoked",
          signed_at: item.created_at,
          created_at: item.created_at,
        }))
        setReleaseOfInfoForms(forms)
      }
    } catch (err) {
      console.error("Error loading release of information forms:", err)
    }
  }

  const generateTransferPortalLink = () => {
    if (!selectedPatient) return
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const token = btoa(`${selectedPatient.id}:${Date.now()}`)
    setTransferPortalLink(`${baseUrl}/external-transfer?token=${token}`)
  }

  const sendFaxRequest = async () => {
    if (!selectedPatient || !faxNumber) {
      toast({
        title: "Missing Information",
        description: "Please select a patient and enter a fax number",
        variant: "destructive",
      })
      return
    }

    setSendingFax(true)
    try {
      const { error } = await supabase.from("fax_outbox").insert({
        recipient_fax_number: faxNumber,
        recipient_name: newReleaseForm.requesting_facility || "Transfer Request",
        patient_id: selectedPatient.id,
        document_type: "transfer_request",
        notes: `Transfer document request for patient ${selectedPatient.first_name} ${selectedPatient.last_name}`,
        status: "pending",
      })

      if (error) throw error

      toast({
        title: "Fax Request Sent",
        description: "Transfer document request has been queued for faxing",
      })
      setFaxNumber("")
    } catch (err) {
      console.error("Error sending fax:", err)
      toast({
        title: "Fax Failed",
        description: "Failed to send fax request",
        variant: "destructive",
      })
    } finally {
      setSendingFax(false)
    }
  }

  const loadExternalTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from("fax_inbox")
        .select("*")
        .eq("document_type", "transfer_documents")
        .order("received_at", { ascending: false })
        .limit(20)

      if (error) throw error

      if (data) {
        const transfers: ExternalTransferRequest[] = data.map((item) => ({
          id: item.id,
          patient_name: item.ai_extracted_data?.patient_name || "Unknown",
          patient_dob: item.ai_extracted_data?.patient_dob || "",
          sending_facility: item.ai_extracted_data?.facility_name || item.sender_fax_number,
          contact_person: item.ai_extracted_data?.contact_person || "",
          contact_phone: item.sender_fax_number || "",
          contact_email: "",
          transfer_reason: item.ai_extracted_data?.transfer_reason || "",
          documents: [{ name: "Transfer Document", url: item.file_url, type: "fax" }],
          status: item.status === "processed" ? "processed" : item.status === "assigned" ? "received" : "pending",
          submitted_at: item.received_at,
          notes: item.notes,
        }))
        setExternalTransfers(transfers)
      }
    } catch (err) {
      console.error("Error loading external transfers:", err)
    }
  }

  // Load external transfers on mount
  useEffect(() => {
    loadExternalTransfers()
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <div className="flex-1 ml-64">
        <div className="border-b bg-card/50">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Patient Intake & Orientation</h1>
                <p className="text-muted-foreground">Comprehensive intake process with patient orientation checklist</p>
              </div>
              <div className="flex items-center gap-2">
                {pmpConfig?.is_active && (
                  <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                    <Activity className="mr-1 h-3 w-3" />
                    PMP Auto-Check Enabled
                  </Badge>
                )}
                <Badge variant="outline" className="px-3 py-1">
                  <Clock className="mr-1 h-3 w-3" />
                  Est. 45-60 minutes
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveOrientationProgress}
                  disabled={saving || !selectedPatient}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Progress
                </Button>
                <Button size="sm" onClick={completeIntake} disabled={saving || !selectedPatient}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Complete Intake
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Selection/Information Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Patient Search Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Find or Add Patient
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {loading && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Search Results */}
                  {patients.length > 0 && !selectedPatient && (
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {patients.map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => selectPatient(patient)}
                        >
                          <p className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{patient.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchTerm.length >= 2 && patients.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground text-center py-2">No patients found</p>
                  )}

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {showNewPatientForm ? "Cancel" : "Add New Patient"}
                  </Button>
                </CardContent>
              </Card>

              {/* New Patient Form */}
              {showNewPatientForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>New Patient Registration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name *</Label>
                        <Input
                          value={newPatient.first_name}
                          onChange={(e) => setNewPatient((prev) => ({ ...prev, first_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name *</Label>
                        <Input
                          value={newPatient.last_name}
                          onChange={(e) => setNewPatient((prev) => ({ ...prev, last_name: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Input
                        type="date"
                        value={newPatient.date_of_birth}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={newPatient.gender}
                        onValueChange={(value) => setNewPatient((prev) => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newPatient.email}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={newPatient.address}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact Name</Label>
                      <Input
                        value={newPatient.emergency_contact_name}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact Phone</Label>
                      <Input
                        value={newPatient.emergency_contact_phone}
                        onChange={(e) =>
                          setNewPatient((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Insurance Provider</Label>
                      <Input
                        value={newPatient.insurance_provider}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, insurance_provider: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Insurance ID</Label>
                      <Input
                        value={newPatient.insurance_id}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, insurance_id: e.target.value }))}
                      />
                    </div>
                    <Button className="w-full" onClick={createNewPatient} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Create Patient
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Selected Patient Info */}
              {selectedPatient && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-lg">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">DOB: {selectedPatient.date_of_birth}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(null)
                          setPmpResults(null)
                          setUploadedDocuments([]) // Clear documents when patient changes
                        }}
                      >
                        Change
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Phone:</strong> {selectedPatient.phone || "N/A"}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedPatient.email || "N/A"}
                      </p>
                      <p>
                        <strong>Insurance:</strong> {selectedPatient.insurance_provider || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedPatient && (
                <Card
                  className={
                    pmpResults?.alertLevel === "critical" || pmpResults?.alertLevel === "high" ? "border-red-500" : ""
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      PMP Check Results
                    </CardTitle>
                    <CardDescription>Prescription Monitoring Program data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pmpLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Querying PMP database...</span>
                      </div>
                    ) : pmpResults ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          {getPMPAlertBadge(pmpResults.alertLevel)}
                          <span className="text-sm text-muted-foreground">
                            {pmpResults.prescriptionCount || 0} Rx found
                          </span>
                        </div>

                        {pmpResults.redFlags && pmpResults.redFlags.length > 0 && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              Red Flags
                            </h4>
                            <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                              {pmpResults.redFlags.map((flag: string, i: number) => (
                                <li key={i}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {pmpResults.prescriptions && pmpResults.prescriptions.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Recent Controlled Substances:</h4>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {pmpResults.prescriptions.slice(0, 5).map((rx: any, i: number) => (
                                <div key={i} className="text-xs p-2 bg-muted/50 rounded">
                                  <p className="font-medium">{rx.medication_name}</p>
                                  <p className="text-muted-foreground">
                                    {rx.fill_date} - {rx.prescriber_name}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(!pmpResults.prescriptions || pmpResults.prescriptions.length === 0) && (
                          <div className="text-center py-4 text-muted-foreground">
                            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                            <p className="text-sm">No controlled substances found</p>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={() => runPMPCheck(selectedPatient)}
                          disabled={pmpLoading}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Re-run PMP Check
                        </Button>
                      </div>
                    ) : pmpConfig?.is_active ? (
                      <div className="text-center py-4">
                        <Button variant="outline" onClick={() => runPMPCheck(selectedPatient)} disabled={pmpLoading}>
                          <Activity className="h-4 w-4 mr-2" />
                          Run PMP Check
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm">PMP not configured</p>
                        <p className="text-xs">Configure in PMP Dashboard</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Orientation Progress */}
              {selectedPatient && (
                <Card>
                  <CardHeader>
                    <CardTitle>Orientation Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {completedItems.length} of {orientationChecklist.length} items
                        </span>
                        <span>{Math.round(orientationProgress)}%</span>
                      </div>
                      <Progress value={orientationProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {!selectedPatient ? (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select a Patient to Begin</h3>
                    <p>Search for an existing patient or add a new one to start the intake process.</p>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="demographics" className="space-y-4">
                  <TabsList className="grid grid-cols-7 w-full">
                    <TabsTrigger value="demographics">Demographics</TabsTrigger>
                    <TabsTrigger value="clinical">Clinical</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="release">Release of Info</TabsTrigger>
                    <TabsTrigger value="external-transfer">External Transfer</TabsTrigger>
                    <TabsTrigger value="orientation">Orientation</TabsTrigger>
                    <TabsTrigger value="documentation">Documentation</TabsTrigger>
                  </TabsList>

                  {/* Existing TabsContent for demographics, clinical, documents, orientation, documentation */}
                  <TabsContent value="demographics">
                    {/* This tab is intentionally left blank as demographics are displayed in the sidebar */}
                  </TabsContent>
                  <TabsContent value="clinical">
                    <Card>
                      <CardHeader>
                        <CardTitle>Clinical Assessment</CardTitle>
                        <CardDescription>Initial clinical evaluation</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Primary Substance</Label>
                          <Select
                            value={assessmentData.primary_substance}
                            onValueChange={(v) => setAssessmentData((prev) => ({ ...prev, primary_substance: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary substance" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="opioids">Opioids</SelectItem>
                              <SelectItem value="heroin">Heroin</SelectItem>
                              <SelectItem value="fentanyl">Fentanyl</SelectItem>
                              <SelectItem value="alcohol">Alcohol</SelectItem>
                              <SelectItem value="benzodiazepines">Benzodiazepines</SelectItem>
                              <SelectItem value="stimulants">Stimulants</SelectItem>
                              <SelectItem value="cannabis">Cannabis</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration of Use</Label>
                          <Select
                            value={assessmentData.duration_of_use}
                            onValueChange={(v) => setAssessmentData((prev) => ({ ...prev, duration_of_use: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="less_than_1_year">Less than 1 year</SelectItem>
                              <SelectItem value="1_3_years">1-3 years</SelectItem>
                              <SelectItem value="3_5_years">3-5 years</SelectItem>
                              <SelectItem value="5_10_years">5-10 years</SelectItem>
                              <SelectItem value="more_than_10_years">More than 10 years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Medical History</Label>
                          <Textarea
                            placeholder="Enter relevant medical history..."
                            value={assessmentData.medical_history}
                            onChange={(e) =>
                              setAssessmentData((prev) => ({ ...prev, medical_history: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mental Health Screening Notes</Label>
                          <Textarea
                            placeholder="Enter mental health screening notes..."
                            value={assessmentData.mental_health_screening}
                            onChange={(e) =>
                              setAssessmentData((prev) => ({ ...prev, mental_health_screening: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Social Determinants of Health</Label>
                          <Textarea
                            placeholder="Housing, employment, support system..."
                            value={assessmentData.social_determinants}
                            onChange={(e) =>
                              setAssessmentData((prev) => ({ ...prev, social_determinants: e.target.value }))
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="h-5 w-5 text-teal-600" />
                          Patient Document Upload
                        </CardTitle>
                        <CardDescription>
                          Upload patient identification, insurance cards, and transfer documents
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!selectedPatient ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Please select a patient first to upload documents</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Document Upload Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {documentTypes.map((docType) => {
                                const uploadedDoc = uploadedDocuments.find((d) => d.type === docType.id)
                                const isUploading = uploadingDocument === docType.id
                                const DocIcon = docType.icon

                                return (
                                  <div
                                    key={docType.id}
                                    className={`border rounded-lg p-4 transition-colors ${
                                      uploadedDoc
                                        ? "border-green-200 bg-green-50/50"
                                        : docType.required
                                          ? "border-orange-200 bg-orange-50/30"
                                          : "border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <DocIcon
                                          className={`h-5 w-5 ${uploadedDoc ? "text-green-600" : "text-gray-500"}`}
                                        />
                                        <div>
                                          <p className="font-medium text-sm">{docType.label}</p>
                                          {docType.required && !uploadedDoc && (
                                            <span className="text-xs text-orange-600">Required</span>
                                          )}
                                        </div>
                                      </div>
                                      {uploadedDoc && (
                                        <Badge
                                          variant={
                                            uploadedDoc.status === "verified"
                                              ? "default"
                                              : uploadedDoc.status === "rejected"
                                                ? "destructive"
                                                : "secondary"
                                          }
                                          className="text-xs"
                                        >
                                          {uploadedDoc.status === "verified" && (
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                          )}
                                          {uploadedDoc.status}
                                        </Badge>
                                      )}
                                    </div>

                                    {uploadedDoc ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <FileCheck className="h-4 w-4 text-green-600" />
                                          <span className="truncate flex-1">{uploadedDoc.fileName}</span>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                            onClick={() => window.open(uploadedDoc.fileUrl, "_blank")}
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteDocument(uploadedDoc.id, docType.id)}
                                          >
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <input
                                          type="file"
                                          ref={(el) => {
                                            fileInputRefs.current[docType.id] = el
                                          }}
                                          className="hidden"
                                          accept="image/*,.pdf"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleDocumentUpload(docType.id, file)
                                          }}
                                        />
                                        <Button
                                          variant="outline"
                                          className="w-full bg-transparent"
                                          disabled={isUploading}
                                          onClick={() => fileInputRefs.current[docType.id]?.click()}
                                        >
                                          {isUploading ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Uploading...
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="h-4 w-4 mr-2" />
                                              Upload File
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            {/* Upload Progress Summary */}
                            <Card className="bg-gray-50">
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Document Upload Progress</span>
                                  <span className="text-sm text-muted-foreground">
                                    {
                                      uploadedDocuments.filter((d) =>
                                        documentTypes.find((dt) => dt.id === d.type && dt.required),
                                      ).length
                                    }{" "}
                                    / {documentTypes.filter((d) => d.required).length} required
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    (uploadedDocuments.filter((d) =>
                                      documentTypes.find((dt) => dt.id === d.type && dt.required),
                                    ).length /
                                      documentTypes.filter((d) => d.required).length) *
                                    100
                                  }
                                  className="h-2"
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {documentTypes
                                    .filter((d) => d.required)
                                    .map((docType) => {
                                      const uploaded = uploadedDocuments.find((d) => d.type === docType.id)
                                      return (
                                        <Badge
                                          key={docType.id}
                                          variant={uploaded ? "default" : "secondary"}
                                          className={uploaded ? "bg-green-100 text-green-800" : ""}
                                        >
                                          {uploaded ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                                          {docType.label.split("(")[0].trim()}
                                        </Badge>
                                      )
                                    })}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Camera Capture Option */}
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Camera className="h-4 w-4" />
                                  Quick Capture
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Use your device camera to quickly capture ID and insurance cards
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    className="flex-1 bg-transparent"
                                    onClick={() => {
                                      const input = document.createElement("input")
                                      input.type = "file"
                                      input.accept = "image/*"
                                      input.capture = "environment"
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0]
                                        if (file) handleDocumentUpload("photo_id", file)
                                      }
                                      input.click()
                                    }}
                                  >
                                    <Camera className="h-4 w-4 mr-2" />
                                    Capture Photo ID
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="flex-1 bg-transparent"
                                    onClick={() => {
                                      const input = document.createElement("input")
                                      input.type = "file"
                                      input.accept = "image/*"
                                      input.capture = "environment"
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0]
                                        if (file) handleDocumentUpload("insurance_card_front", file)
                                      }
                                      input.click()
                                    }}
                                  >
                                    <Camera className="h-4 w-4 mr-2" />
                                    Capture Insurance
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="release" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-blue-600" />
                              Consent to Release of Information
                            </CardTitle>
                            <CardDescription>
                              Create authorization forms to legally request and receive patient transfer records from
                              other facilities
                            </CardDescription>
                          </div>
                          <Button onClick={() => setShowReleaseForm(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Release Authorization
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* 42 CFR Part 2 Notice */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-amber-800">42 CFR Part 2 Compliance Notice</h4>
                              <p className="text-sm text-amber-700 mt-1">
                                Federal law (42 CFR Part 2) requires specific patient consent before disclosing
                                substance use disorder treatment records. All release authorizations must include the
                                prohibition on redisclosure statement.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* New Release Form */}
                        {showReleaseForm && (
                          <Card className="border-blue-200 bg-blue-50/50">
                            <CardHeader>
                              <CardTitle className="text-lg">New Release of Information Authorization</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Requesting Facility Name *</Label>
                                  <Input
                                    placeholder="Enter facility name"
                                    value={newReleaseForm.requesting_facility}
                                    onChange={(e) =>
                                      setNewReleaseForm({ ...newReleaseForm, requesting_facility: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Contact Person</Label>
                                  <Input
                                    placeholder="Contact name"
                                    value={newReleaseForm.facility_contact}
                                    onChange={(e) =>
                                      setNewReleaseForm({ ...newReleaseForm, facility_contact: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Phone Number</Label>
                                  <Input
                                    placeholder="(555) 123-4567"
                                    value={newReleaseForm.facility_phone}
                                    onChange={(e) =>
                                      setNewReleaseForm({ ...newReleaseForm, facility_phone: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Fax Number</Label>
                                  <Input
                                    placeholder="(555) 123-4568"
                                    value={newReleaseForm.facility_fax}
                                    onChange={(e) =>
                                      setNewReleaseForm({ ...newReleaseForm, facility_fax: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Email Address</Label>
                                  <Input
                                    type="email"
                                    placeholder="records@facility.com"
                                    value={newReleaseForm.facility_email}
                                    onChange={(e) =>
                                      setNewReleaseForm({ ...newReleaseForm, facility_email: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Purpose of Release</Label>
                                  <Select
                                    value={newReleaseForm.purpose}
                                    onValueChange={(value) => setNewReleaseForm({ ...newReleaseForm, purpose: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="transfer">Patient Transfer</SelectItem>
                                      <SelectItem value="continuity_of_care">Continuity of Care</SelectItem>
                                      <SelectItem value="referral">Referral</SelectItem>
                                      <SelectItem value="coordination">Care Coordination</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Effective Date</Label>
                                  <Input
                                    type="date"
                                    value={newReleaseForm.effective_date}
                                    onChange={(e) =>
                                      setNewReleaseForm({ ...newReleaseForm, effective_date: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Expiration Date</Label>
                                  <Input
                                    type="date"
                                    value={newReleaseForm.expiration_date}
                                    onChange={(e) =>
                                      setNewReleaseForm({ ...newReleaseForm, expiration_date: e.target.value })
                                    }
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Information to Release *</Label>
                                <div className="grid md:grid-cols-2 gap-2 mt-2">
                                  {informationTypes.map((type) => (
                                    <div key={type.id} className="flex items-center gap-2">
                                      <Checkbox
                                        id={type.id}
                                        checked={newReleaseForm.information_types.includes(type.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setNewReleaseForm({
                                              ...newReleaseForm,
                                              information_types: [...newReleaseForm.information_types, type.id],
                                            })
                                          } else {
                                            setNewReleaseForm({
                                              ...newReleaseForm,
                                              information_types: newReleaseForm.information_types.filter(
                                                (t) => t !== type.id,
                                              ),
                                            })
                                          }
                                        }}
                                      />
                                      <label htmlFor={type.id} className="text-sm">
                                        {type.label}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 42 CFR Part 2 Consent Language */}
                              <div className="bg-white border rounded-lg p-4 space-y-3">
                                <h4 className="font-medium">Required 42 CFR Part 2 Consent Language</h4>
                                <div className="text-sm text-muted-foreground space-y-2">
                                  <p>
                                    I understand that my alcohol and/or drug treatment records are protected under
                                    federal regulations governing Confidentiality of Substance Use Disorder Patient
                                    Records, 42 CFR Part 2, and cannot be disclosed without my written consent unless
                                    otherwise provided for in the regulations.
                                  </p>
                                  <p>
                                    I also understand that I may revoke this consent at any time except to the extent
                                    that action has been taken in reliance on it, and that in any event this consent
                                    expires automatically as specified above.
                                  </p>
                                  <p className="font-medium text-foreground">
                                    PROHIBITION ON REDISCLOSURE: This information has been disclosed to you from records
                                    protected by federal confidentiality rules (42 CFR Part 2). The federal rules
                                    prohibit you from making any further disclosure of this information unless further
                                    disclosure is expressly permitted by the written consent of the person to whom it
                                    pertains or as otherwise permitted by 42 CFR Part 2.
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowReleaseForm(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={createReleaseOfInfo} disabled={saving}>
                                  {saving ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Creating...
                                    </>
                                  ) : (
                                    <>
                                      <FileCheck className="mr-2 h-4 w-4" />
                                      Create Authorization
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Existing Release Forms */}
                        <div className="space-y-4">
                          <h3 className="font-medium">Active Release Authorizations</h3>
                          {releaseOfInfoForms.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                              <p>No release authorizations on file</p>
                              <p className="text-sm">
                                Create a new authorization to request records from another facility
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {releaseOfInfoForms.map((form) => (
                                <div
                                  key={form.id}
                                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{form.requesting_facility}</span>
                                      <Badge
                                        variant={
                                          form.status === "signed"
                                            ? "default"
                                            : form.status === "pending"
                                              ? "secondary"
                                              : "destructive"
                                        }
                                      >
                                        {form.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Purpose: {form.purpose} | Expires: {form.expiration_date}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Information: {form.information_types.join(", ")}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                      <Eye className="mr-1 h-3 w-3" />
                                      View
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Download className="mr-1 h-3 w-3" />
                                      Print
                                    </Button>
                                    {form.facility_fax && (
                                      <Button variant="outline" size="sm">
                                        <Send className="mr-1 h-3 w-3" />
                                        Fax Request
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="external-transfer" className="space-y-6">
                    {/* Transfer Portal Link */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-green-600" />
                          External Provider Transfer Portal
                        </CardTitle>
                        <CardDescription>
                          Share this link with other facilities to allow them to submit transfer documents directly
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <Label className="text-sm font-medium text-green-800">Secure Transfer Portal Link</Label>
                          <div className="flex gap-2 mt-2">
                            <Input value={transferPortalLink} readOnly className="bg-white font-mono text-sm" />
                            <Button
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(transferPortalLink)
                                toast({ title: "Link Copied", description: "Transfer portal link copied to clipboard" })
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" onClick={generateTransferPortalLink}>
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-green-700 mt-2">
                            This link allows other providers to securely submit transfer documents for this patient
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Fax Request Section */}
                          <Card className="border-blue-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Fax className="h-4 w-4" />
                                Request via Fax
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="space-y-2">
                                <Label>Destination Fax Number</Label>
                                <Input
                                  placeholder="(555) 123-4567"
                                  value={faxNumber}
                                  onChange={(e) => setFaxNumber(e.target.value)}
                                />
                              </div>
                              <Button className="w-full" onClick={sendFaxRequest} disabled={sendingFax}>
                                {sendingFax ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <SendHorizontal className="mr-2 h-4 w-4" />
                                    Send Fax Request
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>

                          {/* Email Request Section */}
                          <Card className="border-purple-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Request via Email
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm text-muted-foreground">
                                Send a secure email with the transfer portal link to the sending facility
                              </p>
                              <Button
                                className="w-full bg-transparent"
                                variant="outline"
                                onClick={() => {
                                  const subject = encodeURIComponent(
                                    `Transfer Documents Request - ${selectedPatient?.first_name} ${selectedPatient?.last_name}`,
                                  )
                                  const body = encodeURIComponent(
                                    `Please submit transfer documents using this secure link: ${transferPortalLink}`,
                                  )
                                  window.open(`mailto:?subject=${subject}&body=${body}`)
                                }}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Open Email Client
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Incoming Transfer Documents */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Inbox className="h-5 w-5 text-blue-600" />
                              Incoming Transfer Documents
                            </CardTitle>
                            <CardDescription>
                              Documents received via fax, email, or the external transfer portal
                            </CardDescription>
                          </div>
                          <Button variant="outline" onClick={loadExternalTransfers}>
                            <Loader2 className="mr-2 h-4 w-4" />
                            Refresh
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {externalTransfers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p>No incoming transfer documents</p>
                            <p className="text-sm">
                              Share the transfer portal link or fax number with sending facilities
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {externalTransfers.map((transfer) => (
                              <div
                                key={transfer.id}
                                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{transfer.sending_facility}</span>
                                      <Badge
                                        variant={
                                          transfer.status === "processed"
                                            ? "default"
                                            : transfer.status === "received"
                                              ? "secondary"
                                              : "outline"
                                        }
                                      >
                                        {transfer.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm">
                                      Patient: {transfer.patient_name}{" "}
                                      {transfer.patient_dob && `(DOB: ${transfer.patient_dob})`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Received: {new Date(transfer.submitted_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {transfer.documents.map((doc, idx) => (
                                      <Button key={idx} variant="outline" size="sm" asChild>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="mr-1 h-3 w-3" />
                                          View
                                        </a>
                                      </Button>
                                    ))}
                                    <Button variant="default" size="sm">
                                      <FileCheck className="mr-1 h-3 w-3" />
                                      Process
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Our Fax Number for Receiving */}
                    <Card className="border-cyan-200 bg-cyan-50/50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium flex items-center gap-2">
                              <Fax className="h-4 w-4" />
                              Our Fax Number for Transfer Documents
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Provide this number to sending facilities for faxing transfer records
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-mono font-bold text-cyan-700">(555) 987-6543</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText("5559876543")
                                toast({ title: "Copied", description: "Fax number copied to clipboard" })
                              }}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="orientation">
                    <Card>
                      <CardHeader>
                        <CardTitle>Orientation Checklist</CardTitle>
                        <CardDescription>Complete each item as you progress through orientation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {orientationChecklist.map((item) => {
                            const Icon = item.icon
                            const isCompleted = completedItems.includes(item.id)
                            return (
                              <div
                                key={item.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  isCompleted ? "bg-green-50 border-green-200" : "hover:bg-muted/50"
                                }`}
                                onClick={() => handleItemComplete(item.id)}
                              >
                                <Checkbox checked={isCompleted} onCheckedChange={() => handleItemComplete(item.id)} />
                                <Icon
                                  className={`h-5 w-5 mt-0.5 ${isCompleted ? "text-green-600" : "text-muted-foreground"}`}
                                />
                                <div className="flex-1">
                                  <p className={`font-medium ${isCompleted ? "text-green-700" : ""}`}>
                                    {item.id}. {item.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                                {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="documentation">
                    <Card>
                      <CardHeader>
                        <CardTitle>Required Documentation</CardTitle>
                        <CardDescription>Track completion of required forms</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(documentationStatus).map(([key, status]) => (
                            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="capitalize">{key.replace(/_/g, " ")}</span>
                              <Select
                                value={status}
                                onValueChange={(v) => updateDocStatus(key as keyof typeof documentationStatus, v)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="na">N/A</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Summary Tab */}
                  <TabsContent value="summary">
                    <Card>
                      <CardHeader>
                        <CardTitle>Intake Summary</CardTitle>
                        <CardDescription>Review before completing intake</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Patient</h4>
                            <p>
                              {selectedPatient.first_name} {selectedPatient.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">DOB: {selectedPatient.date_of_birth}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Primary Substance</h4>
                            <p>{assessmentData.primary_substance || "Not specified"}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Orientation Progress</h4>
                          <Progress value={orientationProgress} className="h-2 mb-1" />
                          <p className="text-sm text-muted-foreground">
                            {completedItems.length} of {orientationChecklist.length} items completed
                          </p>
                        </div>

                        {pmpResults && (
                          <div>
                            <h4 className="font-medium mb-2">PMP Status</h4>
                            <div className="flex items-center gap-2">
                              {getPMPAlertBadge(pmpResults.alertLevel)}
                              <span className="text-sm text-muted-foreground">
                                {pmpResults.prescriptionCount || 0} controlled substance prescriptions
                              </span>
                            </div>
                            {pmpResults.redFlags && pmpResults.redFlags.length > 0 && (
                              <p className="text-sm text-red-600 mt-1">
                                {pmpResults.redFlags.length} red flag(s) detected
                              </p>
                            )}
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium mb-2">Documentation Status</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(documentationStatus).map(([key, status]) => (
                              <Badge key={key} variant={status === "completed" ? "default" : "secondary"}>
                                {key.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button className="w-full" onClick={completeIntake} disabled={saving}>
                          {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Complete Intake & Activate Patient
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
