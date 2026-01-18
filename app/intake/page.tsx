"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"

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

export default function PatientIntake() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [completedItems, setCompletedItems] = useState<number[]>([])
  const [orientationProgress, setOrientationProgress] = useState(0)
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null)

  // PMP state
  const [pmpLoading, setPmpLoading] = useState(false)
  const [pmpResults, setPmpResults] = useState<any>(null)
  const [pmpConfig, setPmpConfig] = useState<any>(null)

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

  useEffect(() => {
    loadPMPConfig()
  }, [])

  const loadPMPConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("pdmp_config")
        .select("*")
        .maybeSingle()

      if (error) {
        // Table doesn't exist or query failed - this is fine, just continue without PMP config
        // Only log if it's not a "not found" type error
        if (error.code !== "PGRST116") {
          console.warn("[v0] PDMP config query error:", error.message)
        }
        return
      }

      if (data) {
        setPmpConfig(data)
      }
    } catch (error) {
      // Silently handle errors - PMP config is optional
      // Don't log to avoid console spam
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

  // Search patients from database using API route to bypass RLS
  const searchPatients = async (term: string) => {
    if (!term || term.length < 2) {
      setPatients([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(term)}&limit=10`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search patients")
      }

      const data = await response.json()
      setPatients(data.patients || [])
    } catch (err) {
      console.error("Error searching patients:", err)
      setPatients([])
      toast({
        title: "Search Error",
        description: err instanceof Error ? err.message : "Failed to search patients. Please try again.",
        variant: "destructive",
      })
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
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient before saving progress",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/intake/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          admission_date: new Date().toISOString().split("T")[0],
          status: orientationProgress === 100 ? "active" : "pending_orientation",
          program_type: "OTP",
          primary_substance: assessmentData.primary_substance || null,
          medication: assessmentData.primary_substance || "pending",
          orientation_progress: orientationProgress,
          completed_items: completedItems,
          documentation_status: documentationStatus,
          assessment_data: assessmentData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save progress")
      }

      toast({
        title: "Success",
        description: `Progress saved successfully! ${Math.round(orientationProgress)}% complete.`,
      })
    } catch (err) {
      console.error("Error saving progress:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save progress. Please try again.",
        variant: "destructive",
      })
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
      // Use the API route to save all progress data and update admission status
      const response = await fetch("/api/intake/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          admission_date: new Date().toISOString().split("T")[0],
          status: "active", // Set to active when completing intake
          program_type: "OTP",
          primary_substance: assessmentData.primary_substance || null,
          medication: assessmentData.primary_substance || "pending_evaluation",
          orientation_progress: 100, // Ensure it's marked as complete
          completed_items: completedItems,
          documentation_status: documentationStatus,
          assessment_data: assessmentData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete intake")
      }

      toast({ 
        title: "Success", 
        description: "Intake completed! Patient is now active and will appear in the Intake Queue." 
      })

      // Dispatch event to refresh intake queue if it's open
      window.dispatchEvent(new CustomEvent<{ patientId: string; patientName: string }>("intake-completed", {
        detail: {
          patientId: selectedPatient.id,
          patientName: `${selectedPatient.first_name} ${selectedPatient.last_name}`
        }
      }))

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
      setDocumentationStatus({
        consent_for_treatment: "pending",
        hipaa_authorization: "pending",
        financial_agreement: "pending",
        emergency_contact_form: "pending",
        photo_id_verification: "pending",
        insurance_card_copy: "pending",
        hhn_enrollment: "pending",
        patient_handbook_receipt: "pending",
      })
    } catch (err) {
      console.error("Error completing intake:", err)
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "Failed to complete intake", 
        variant: "destructive" 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleItemComplete = async (itemId: number) => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient before checking items",
        variant: "destructive",
      })
      return
    }

    let newCompleted: number[]
    if (!completedItems.includes(itemId)) {
      newCompleted = [...completedItems, itemId]
    } else {
      newCompleted = completedItems.filter((id) => id !== itemId)
    }
    
    const newProgress = (newCompleted.length / orientationChecklist.length) * 100
    
    // Update state immediately for responsive UI
    setCompletedItems(newCompleted)
    setOrientationProgress(newProgress)

    // Auto-save progress in the background
    try {
      const response = await fetch("/api/intake/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          admission_date: new Date().toISOString().split("T")[0],
          status: newProgress === 100 ? "active" : "pending_orientation",
          program_type: "OTP",
          primary_substance: assessmentData.primary_substance || null,
          medication: assessmentData.primary_substance || "pending",
          orientation_progress: newProgress,
          completed_items: newCompleted,
          documentation_status: documentationStatus,
          assessment_data: assessmentData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error auto-saving progress:", errorData.error)
        // Don't show error toast for auto-save - just log it
      } else {
        console.log("[Intake] Progress auto-saved:", {
          progress: newProgress,
          items: newCompleted.length,
        })
      }
    } catch (err) {
      console.error("Error auto-saving progress:", err)
      // Silently fail for auto-save - user can manually save if needed
    }
  }

  const updateDocStatus = (doc: keyof typeof documentationStatus, status: string) => {
    setDocumentationStatus((prev) => ({ ...prev, [doc]: status }))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Policy content for each orientation checklist item
  const orientationPolicies: Record<number, string> = {
    1: `MASE EMR welcomes every patient with respect, compassion, and a commitment to delivering high-quality rehabilitation services for individuals facing substance use challenges. The purpose of MASE EMR is to provide exceptional care while protecting the dignity, self-respect, and overall well-being of every patient who enters the program. All staff members are trained in addiction treatment and remain dedicated to supporting patients through recovery in a professional, safe, and supportive environment.

MASE EMR encourages patients to engage in recovery support systems, including participation in 12-Step programs such as Alcoholics Anonymous (AA), Narcotics Anonymous (NA), Al-Anon, and Nar-Anon. MASE EMR recognizes that addiction impacts not only the individual but also families and support systems; therefore, appropriate family involvement is strongly encouraged as part of the recovery process.

MASE EMR acknowledges that recovery can be difficult, and patients are reminded that they do not have to face the process alone. The program emphasizes teamwork between patients and clinical staff, ensuring each patient receives guidance, tools, and resources needed to create a stable, long-term recovery path.

As part of enrollment, every patient is informed of their rights and responsibilities and must acknowledge understanding of the program expectations. Patients are required to attend scheduled treatment sessions, participate actively in treatment services, follow program rules and conditions, and meet weekly payment requirements when applicable. Failure to comply with treatment requirements may result in progressive compliance actions and may lead to discharge or termination from the program, particularly when prohibited behaviors occur as outlined within program discharge procedures.

MASE EMR also maintains structured program descriptions to support administrative and clinical operations and to ensure compliance with national accreditation standards. These descriptions outline treatment policies and procedures that guide staff responsibilities and promote consistent and effective care delivery throughout the organization.`,
    2: `MASE EMR is committed to supporting individuals experiencing opioid use disorder and other substance-related challenges through a structured treatment program designed to promote stabilization, recovery, and long-term wellness. During admission and orientation, all patients will receive a detailed explanation of services available, treatment phases, and the expectations required for continued participation in the program.

MASE EMR provides comprehensive services that may include medication-assisted treatment (MAT), counseling, behavioral health interventions, recovery support services, referral coordination, and ongoing monitoring to support patient progress. Each patient's treatment plan is individualized and developed collaboratively with clinical staff to address medical, psychological, behavioral, and social needs.

Patients are informed that treatment is delivered in phases, and progression through phases depends on attendance, compliance, stability, and demonstrated engagement in recovery efforts. Treatment phases are structured to support patients as they move from early stabilization toward maintenance and long-term recovery. Patients may be required to complete assessments, participate in counseling sessions, meet with medical providers, complete periodic reviews, and follow clinical recommendations throughout each phase.

MASE EMR also explains patient expectations as a standard requirement of program participation. Patients are expected to attend appointments as scheduled, comply with medication dosing procedures, participate in counseling, follow program rules and behavioral standards, provide required screening samples, and maintain respectful conduct toward staff and other patients. Patients are required to meet financial obligations when applicable and comply with treatment planning activities.

Failure to meet program expectations may result in progressive compliance actions, including treatment plan adjustments, increased supervision, restriction of privileges, or discharge, depending on the severity and frequency of noncompliance. Patients are informed that continued enrollment in the program depends on active participation and adherence to program requirements.

MASE EMR ensures that this program overview is communicated clearly, reviewed when needed, and documented in the patient's record to confirm understanding and ensure treatment transparency.`,
    3: `MASE EMR requires that every patient receiving services for the first time is provided with a facility tour during intake or as soon as practical after admission. The tour is conducted by authorized staff and is designed to help patients feel comfortable in the environment while ensuring they understand important safety procedures and facility expectations.

During the tour, staff will show the patient the main service areas, including reception and check-in areas, waiting areas, counseling rooms, medical or dosing areas (if applicable), restrooms, and any additional areas designated for patient use. Patients will also be advised of areas that are restricted or staff-only in order to maintain confidentiality, safety, and proper clinic operations.

As part of the tour, staff will clearly identify all emergency exits and explain how patients should exit the facility in the event of an emergency. Patients will be informed of the location of fire exits, evacuation routes, assembly points (if applicable), and any emergency signage that supports safe evacuation. Staff will also explain key emergency procedures, such as what to do during a fire alarm, severe weather event, or other emergency situation.

Patients will be instructed to follow staff directions during emergencies and to never block hallways, doorways, or exit routes. MASE EMR ensures that safety information is communicated in a clear and supportive manner and that patients are encouraged to ask questions during the tour.

Completion of the facility tour shall be documented in the patient record or intake checklist to confirm that the patient has been informed of key areas and emergency exit procedures.`,
    4: `MASE EMR issues a patient identification card to every enrolled patient to support accurate identification, safe service delivery, and secure access to program services. The identification card includes a patient photograph and core identifiers used to confirm the patient's identity during visits and at key service points.

As part of intake or as soon as reasonably possible after enrollment, authorized staff verify the patient's identity according to program requirements and obtain a photo for the ID card. The patient is instructed to present the ID card at check-in and whenever staff request identity confirmation for services, including clinical appointments, documentation completion, and medication-related processes when applicable.

MASE EMR maintains a consistent process for replacing lost, stolen, or damaged ID cards and for addressing any suspected misuse. Issuance of the ID card, replacements, and any identity concerns are documented in the patient's record or intake checklist to ensure accountability and continuity of operations.`,
    5: `MASE EMR is committed to protecting patient rights and ensuring each patient is informed of their responsibilities while receiving services. Patients are treated with dignity and respect and are informed of privacy and confidentiality rights in accordance with applicable laws and program standards, including HIPAA-related privacy protections where applicable.

During admission and orientation, staff review patient rights in a clear manner, including the patient's right to be informed about services, participate in treatment planning, ask questions, and voice concerns without retaliation. Staff also review patient responsibilities such as maintaining respectful behavior, providing accurate information, attending scheduled appointments, following safety rules, and cooperating with clinical recommendations and treatment planning activities.

MASE EMR confirms understanding by allowing time for patient questions and documenting acknowledgement of the Rights and Responsibilities review. When needed, staff re-educate patients on these expectations during treatment, especially when there are concerns related to compliance, conduct, attendance, or confidentiality.`,
    6: `MASE EMR provides an accessible grievance process so patients can submit complaints, concerns, or service-related issues without fear of retaliation. This process supports transparency, patient safety, and service improvement while ensuring complaints are addressed respectfully and consistently.

At orientation, patients are informed that grievances may be submitted verbally, in writing, or through HHN (HomeHealthNotify) when available. Staff explain how grievances are received, how they are reviewed, and how patients can request assistance if they need help submitting a complaint or describing their concern.

MASE EMR documents grievances according to program procedure, reviews them promptly, and communicates outcomes to the patient within established timelines. Patterns of complaints are tracked for quality improvement, and retaliation is prohibited; any concerns related to retaliation are investigated and addressed immediately.`,
    7: `MASE EMR uses HHN (HomeHealthNotify) to strengthen patient communication, improve appointment adherence, and support care coordination. Patients are introduced to HHN during orientation when HHN is part of the program workflow or the patient's plan of care.

During intake, staff assist the patient with account setup and confirm the patient can access the system using their device when possible. Staff demonstrate the core features the patient will use, such as appointment reminders, secure messaging, forms, and program notifications, and they explain how HHN supports treatment continuity.

MASE EMR reinforces expectations for privacy and appropriate use, including the importance of protecting login credentials and using secure communication practices. Completion of HHN orientation, as well as any barriers (no phone, technical limitations, declined use), is documented so the care team can provide alternatives when required.`,
    8: `MASE EMR provides medication education to ensure patients understand Medication-Assisted Treatment (MAT) options, expected benefits, and safety considerations. Education is delivered in a patient-centered manner to support informed decision-making and reduce medication-related risk.

Clinical staff review how MAT supports recovery, what patients may expect during treatment, and how medications may interact with other substances or prescriptions. Patients are educated on safe medication use, missed dose guidance (as applicable), potential side effects, overdose prevention, and safe storage practices to protect the patient and others.

MASE EMR confirms understanding by encouraging questions and using teach-back or verbal confirmation methods when appropriate. Medication education and the patient's understanding are documented in the medical record, including any written materials provided and any additional counseling needed based on risk factors.`,
    9: `MASE EMR conducts drug and toxicology screening as a clinical tool to support treatment planning, patient safety, and program integrity. Patients are informed that screening is used to guide care decisions, monitor progress, and identify support needs, not to shame or punish patients.

During orientation, staff explain screening procedures, including how samples are collected, how specimen integrity is maintained, and what the patient should expect during the screening process. Patients are informed of general screening expectations, including frequency as determined by program protocol and clinical need, and how results will be reviewed in a therapeutic and confidential manner.

MASE EMR explains that refusal to test, tampering, or adulteration may trigger clinical review and compliance actions consistent with program policy. Screening completion, results handling, and follow-up clinical actions are documented to ensure consistent application of protocol and continuity of care.`,
    10: `MASE EMR provides patients with a structured treatment schedule to promote continuity of care and consistent engagement. Patients are informed that attendance is a key part of successful treatment and that missed appointments may impact progress and service eligibility.

At orientation, staff review the patient's appointment schedule, including medical visits, counseling sessions, group participation when applicable, and support service appointments such as case management. Staff explain check-in procedures, expectations for punctuality, how to notify the clinic when rescheduling is needed, and how missed appointments are addressed.

MASE EMR documents the schedule review and patient understanding, including any accommodations or barriers such as transportation, work hours, or childcare needs. Attendance patterns are monitored, and repeated missed visits trigger follow-up planning to address barriers and support compliance with treatment expectations.`,
    11: `MASE EMR prioritizes safety by educating patients on emergency procedures and facility protocols during orientation. This includes guidance on how patients should respond during events such as fire alarms, medical emergencies, severe weather incidents, or disruptive situations.

Staff review the facility's Emergency Action Plan expectations and explain that patients must follow staff direction during emergencies. Patients are informed that emergency communication may include EAP codes or announcements and that patient cooperation is essential for safe evacuation, safe sheltering, and coordination with emergency responders.

MASE EMR documents completion of safety education and reinforces safety expectations throughout treatment as needed. Safety-related incidents, drills when applicable, and patient noncompliance with safety rules are addressed through clinical review and program procedures to maintain a safe environment for all.`,
    12: `MASE EMR informs all patients about support services available to reduce barriers to care and strengthen recovery stability. Support services may include case management, referrals, and peer support resources designed to address social needs and improve treatment engagement.

During orientation, staff explain how patients can access case management for help with healthcare coordination, community referrals, benefits navigation, transportation needs, housing resources, employment support, and other practical barriers that affect treatment participation. Patients are also informed of peer support services when available, including recovery coaching and linkage to community-based recovery resources.

MASE EMR documents the support services discussion, including whether the patient requests services and what referrals are initiated. Follow-up is incorporated into the treatment plan so services remain coordinated, measurable, and aligned with patient goals.`,
    13: `MASE EMR protects confidentiality and ensures patients understand how their information is used and shared. Patients are informed that protected health information is handled in accordance with applicable privacy laws and program standards, and that releases of information require appropriate consent unless otherwise permitted or required by law.

During orientation, staff review confidentiality and consent forms in plain language, explaining what information may be shared, the purpose of sharing, who will receive it, and how long the authorization remains valid. Patients are informed of their right to decline optional releases and of the process for revoking authorizations as permitted.

MASE EMR ensures signed consents are properly stored and retrievable in the patient record. Documentation reflects which forms were signed, declined, or deferred, and staff review confidentiality requirements again whenever care coordination needs change or new releases are requested.`,
    14: `MASE EMR offers educational programming to support recovery, wellness, and long-term stability. Patients are informed that education is an important part of treatment and can enhance coping skills, relapse prevention strategies, and understanding of recovery supports.

During orientation, staff describe available workshops and training opportunities, including topics such as relapse prevention, coping strategies, medication safety, wellness planning, recovery resources, and other skill-building sessions offered by the program. Patients are informed of participation expectations, schedules, and how educational activities may be integrated into their individualized treatment plan.

MASE EMR documents educational program orientation and records patient participation as required by program procedure. Educational participation may be reviewed during treatment planning to ensure the patient is receiving appropriate supports and to address gaps in knowledge or skills impacting recovery progress.`,
    15: `MASE EMR provides patients with clear financial information so they understand fees, insurance processes, and payment expectations. Financial transparency supports uninterrupted care and reduces confusion that can interfere with consistent participation in treatment.

During intake or early in admission, staff review insurance verification (when applicable), patient financial responsibilities, billing cycles, payment schedules, and available payment arrangement options. Patients are informed of who to contact for billing questions and how to report changes in insurance or financial circumstances.

MASE EMR documents financial discussions and any agreements made, including payment arrangements and follow-up actions. When financial barriers are identified, the program follows established procedures to provide guidance, explore options, and prevent avoidable interruptions in care while remaining consistent with policy.`,
    16: `MASE EMR provides each patient with a Patient Handbook to ensure they understand program structure, services, rules, and expectations. The handbook serves as a consistent reference for patients throughout treatment and supports accountability for both patients and staff.

At orientation, staff review key sections of the handbook with the patient, including program overview, attendance expectations, conduct standards, confidentiality practices, drug screening expectations, medication safety rules when applicable, grievance procedures, safety procedures, and discharge/termination processes. Patients are encouraged to ask questions and request clarification at any time.

MASE EMR documents handbook receipt and the review of core topics as part of the orientation process. When handbook policies are updated, patients are informed according to program procedure, and updated acknowledgments are obtained when required.`,
    17: `MASE EMR offers telehealth services when appropriate to support access to care, continuity, and convenience while maintaining clinical quality and privacy standards. Patients are informed that telehealth availability depends on clinical appropriateness, service type, program policy, and patient ability to participate safely and privately.

During orientation, staff explain which services may be offered remotely, how telehealth visits are scheduled, and the technology requirements for participation. Patients are instructed on privacy expectations, including using a private location when possible, confirming identity during remote sessions, and understanding limitations when a patient is in an unsafe or non-private environment.

MASE EMR documents telehealth education, patient eligibility, and any required consents. Staff also explain what to do if technology fails and how urgent concerns are handled, ensuring the patient understands telehealth is not a substitute for emergency care.`,
    18: `MASE EMR educates patients on take-home medication privileges and monitoring requirements to promote safety, adherence, and diversion prevention. Patients are informed that take-home eligibility is based on clinical stability, compliance, safety considerations, and program criteria, and that privileges may change based on ongoing assessment.

During orientation and ongoing treatment, staff explain the responsibilities associated with take-home medication, including safe storage, protection from theft, and prohibition against sharing or diversion. Patients are informed of reporting requirements for lost or stolen medication and the clinical review process that may follow such reports.

When HHN video monitoring is required, patients receive instruction on how to complete submissions, required timing, and compliance expectations. MASE EMR documents the education provided, the patient's understanding, and any monitoring outcomes, and the program reviews compliance regularly to determine whether monitoring should continue, increase, or decrease.`,
    19: `MASE EMR provides patients with clear contact information so they can access support, scheduling assistance, and clinical guidance when needed. Patients are informed of primary communication channels and how to reach the clinic for routine matters.

At orientation, staff provide contact information for scheduling, clinical services, counseling support when applicable, billing, and technical support related to HHN if used. Patients are informed of expected response processes, appropriate uses of messaging systems, and what information should or should not be sent through non-secure channels.

MASE EMR also reviews after-hours guidance and clarifies when patients should contact emergency services instead of the clinic. Patient receipt of contact information and understanding of after-hours expectations are documented to support safe and timely access to care.`,
    20: `MASE EMR completes follow-up planning at the conclusion of orientation to ensure continuity of care and clear next steps. Patients are provided with confirmed appointment dates and expectations so they leave intake with a structured plan for continued engagement.

Staff review upcoming appointments for medical services, counseling, case management, group sessions, and any required monitoring or screenings. The patient is encouraged to summarize key expectations such as attendance, check-in procedures, communication methods, and any immediate treatment responsibilities, so understanding is verified before the patient leaves.

MASE EMR documents follow-up planning, including scheduled appointments, patient understanding, and any identified barriers such as transportation, work conflicts, or technology limitations. When barriers are present, staff coordinate supports or adjustments according to program procedure to reduce missed visits and improve treatment success.`,
    // Add policies for other items as needed
  }

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

    // Load saved progress if it exists
    await loadSavedProgress(patient.id)

    // Auto-run PMP check
    await runPMPCheck(patient)
  }

  // Load saved progress from API
  const loadSavedProgress = async (patientId: string) => {
    try {
      const response = await fetch(`/api/intake/progress?patient_id=${patientId}`)
      
      if (!response.ok) {
        // No saved progress found, that's okay - start fresh
        return
      }

      const data = await response.json()
      
      if (data.progress) {
        const progress = data.progress
        
        // Restore orientation progress
        if (progress.orientation_progress !== undefined && progress.orientation_progress !== null) {
          setOrientationProgress(progress.orientation_progress)
        }
        
        // Restore completed checklist items
        if (progress.completed_items && Array.isArray(progress.completed_items)) {
          setCompletedItems(progress.completed_items)
        }
        
        // Restore documentation status
        if (progress.documentation_status && typeof progress.documentation_status === 'object') {
          setDocumentationStatus(progress.documentation_status)
        }
        
        // Restore assessment data
        if (progress.assessment_data && typeof progress.assessment_data === 'object') {
          setAssessmentData(progress.assessment_data)
        }
        
        console.log("[Intake] Loaded saved progress:", {
          progress: progress.orientation_progress,
          items: progress.completed_items?.length || 0,
        })
      }
    } catch (err) {
      console.error("Error loading saved progress:", err)
      // Silently fail - it's okay if there's no saved progress
    }
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
                      id="patient-search"
                      name="patient-search"
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
                        <Label htmlFor="new-patient-first-name">First Name *</Label>
                        <Input
                          id="new-patient-first-name"
                          name="first_name"
                          value={newPatient.first_name}
                          onChange={(e) => setNewPatient((prev) => ({ ...prev, first_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-patient-last-name">Last Name *</Label>
                        <Input
                          id="new-patient-last-name"
                          name="last_name"
                          value={newPatient.last_name}
                          onChange={(e) => setNewPatient((prev) => ({ ...prev, last_name: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-patient-dob">Date of Birth *</Label>
                      <Input
                        id="new-patient-dob"
                        name="date_of_birth"
                        type="date"
                        value={newPatient.date_of_birth}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-patient-gender">Gender</Label>
                      <Select
                        name="gender"
                        value={newPatient.gender}
                        onValueChange={(value) => setNewPatient((prev) => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger id="new-patient-gender">
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
                      <Label htmlFor="new-patient-phone">Phone</Label>
                      <Input
                        id="new-patient-phone"
                        name="phone"
                        type="tel"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-patient-email">Email</Label>
                      <Input
                        id="new-patient-email"
                        name="email"
                        type="email"
                        value={newPatient.email}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-patient-address">Address</Label>
                      <Textarea
                        id="new-patient-address"
                        name="address"
                        value={newPatient.address}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-patient-emergency-contact-name">Emergency Contact Name</Label>
                      <Input
                        id="new-patient-emergency-contact-name"
                        name="emergency_contact_name"
                        value={newPatient.emergency_contact_name}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-patient-emergency-contact-phone">Emergency Contact Phone</Label>
                      <Input
                        id="new-patient-emergency-contact-phone"
                        name="emergency_contact_phone"
                        type="tel"
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
                <Tabs defaultValue="orientation" className="space-y-4">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="orientation">Orientation</TabsTrigger>
                    <TabsTrigger value="clinical">Clinical Assessment</TabsTrigger>
                    <TabsTrigger value="documentation">Documentation</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>

                  {/* Orientation Tab */}
                  <TabsContent value="orientation">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Checklist - Left Side */}
                      <div className="lg:col-span-2">
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
                                const hasPolicy = orientationPolicies[item.id] !== undefined
                                return (
                                  <div
                                    key={item.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                      isCompleted ? "bg-green-50 border-green-200" : "hover:bg-muted/50"
                                    } ${selectedPolicyId === item.id ? "ring-2 ring-primary border-primary" : ""}`}
                                  >
                                    <Checkbox 
                                      checked={isCompleted} 
                                      onCheckedChange={() => handleItemComplete(item.id)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <Icon
                                      className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isCompleted ? "text-green-600" : "text-muted-foreground"}`}
                                    />
                                    <div 
                                      className={`flex-1 ${hasPolicy ? "cursor-pointer" : ""}`}
                                      onClick={(e) => {
                                        if (hasPolicy) {
                                          e.stopPropagation()
                                          setSelectedPolicyId(selectedPolicyId === item.id ? null : item.id)
                                        }
                                      }}
                                    >
                                      <p className={`font-medium ${isCompleted ? "text-green-700" : ""}`}>
                                        {item.id}. {item.title}
                                        {hasPolicy && (
                                          <FileText className="inline h-4 w-4 ml-2 text-primary" />
                                        )}
                                      </p>
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    {isCompleted && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Policy Viewer - Right Side */}
                      <div className="lg:col-span-1">
                        <Card className="sticky top-6 max-h-[calc(100vh-8rem)] flex flex-col">
                          <CardHeader className="flex-shrink-0">
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Policy
                            </CardTitle>
                            <CardDescription>
                              {selectedPolicyId 
                                ? orientationChecklist.find(item => item.id === selectedPolicyId)?.title 
                                : "Select an item to view policy"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 overflow-y-auto">
                            {selectedPolicyId && orientationPolicies[selectedPolicyId] ? (
                              <div className="prose prose-sm max-w-none">
                                <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                  {orientationPolicies[selectedPolicyId]}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">
                                  Click on a checklist item with a document icon to view its policy.
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Clinical Assessment Tab */}
                  <TabsContent value="clinical">
                    <Card>
                      <CardHeader>
                        <CardTitle>Clinical Assessment</CardTitle>
                        <CardDescription>Initial clinical evaluation</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="primary-substance">Primary Substance</Label>
                          <Select
                            name="primary_substance"
                            value={assessmentData.primary_substance}
                            onValueChange={(v) => setAssessmentData((prev) => ({ ...prev, primary_substance: v }))}
                          >
                            <SelectTrigger id="primary-substance">
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
                          <Label htmlFor="duration-of-use">Duration of Use</Label>
                          <Select
                            name="duration_of_use"
                            value={assessmentData.duration_of_use}
                            onValueChange={(v) => setAssessmentData((prev) => ({ ...prev, duration_of_use: v }))}
                          >
                            <SelectTrigger id="duration-of-use">
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
                          <Label htmlFor="medical-history">Medical History</Label>
                          <Textarea
                            id="medical-history"
                            name="medical_history"
                            placeholder="Enter relevant medical history..."
                            value={assessmentData.medical_history}
                            onChange={(e) =>
                              setAssessmentData((prev) => ({ ...prev, medical_history: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mental-health-screening">Mental Health Screening Notes</Label>
                          <Textarea
                            id="mental-health-screening"
                            name="mental_health_screening"
                            placeholder="Enter mental health screening notes..."
                            value={assessmentData.mental_health_screening}
                            onChange={(e) =>
                              setAssessmentData((prev) => ({ ...prev, mental_health_screening: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social-determinants">Social Determinants of Health</Label>
                          <Textarea
                            id="social-determinants"
                            name="social_determinants"
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

                  {/* Documentation Tab */}
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
                                name={`doc-status-${key}`}
                                value={status}
                                onValueChange={(v) => updateDocStatus(key as keyof typeof documentationStatus, v)}
                              >
                                <SelectTrigger id={`doc-status-${key}`} className="w-32">
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
                              <Badge 
                                key={key} 
                                variant={status === "completed" ? "default" : status === "na" ? "outline" : "secondary"}
                                className={status === "completed" ? "bg-teal-600" : ""}
                              >
                                {status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                                {key.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                          {Object.values(documentationStatus).filter((s) => s === "pending").length > 0 && (
                            <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              {Object.values(documentationStatus).filter((s) => s === "pending").length} document(s) still pending
                            </p>
                          )}
                        </div>

                        {/* Completion Warnings */}
                        {(orientationProgress < 100 || Object.values(documentationStatus).some((s) => s === "pending")) && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-amber-900 mb-1">Incomplete Intake Items</p>
                                <ul className="text-sm text-amber-800 space-y-1">
                                  {orientationProgress < 100 && (
                                    <li>• Orientation is not 100% complete ({Math.round(orientationProgress)}%)</li>
                                  )}
                                  {Object.values(documentationStatus).filter((s) => s === "pending").length > 0 && (
                                    <li>• {Object.values(documentationStatus).filter((s) => s === "pending").length} documentation item(s) still pending</li>
                                  )}
                                </ul>
                                <p className="text-xs text-amber-700 mt-2">
                                  You can still complete intake, but these items should be finished before the patient receives their first dose.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Ready to Complete Indicator */}
                        {orientationProgress === 100 && Object.values(documentationStatus).every((s) => s === "completed" || s === "na") && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <p className="font-medium text-green-900">
                                All intake items completed. Patient is ready to be activated.
                              </p>
                            </div>
                          </div>
                        )}

                        <Button 
                          className="w-full" 
                          onClick={completeIntake} 
                          disabled={saving || !selectedPatient}
                          size="lg"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Completing Intake...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Complete Intake & Activate Patient
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Patient will appear in the Intake Queue after completion
                        </p>
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
