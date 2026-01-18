"use client"

import React, { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import {
  Stethoscope,
  Plus,
  Search,
  Calendar,
  Clock,
  Activity,
  Printer,
  CheckCircle,
  AlertTriangle,
  FileText,
  X,
  Eye,
  Mic,
  MicOff,
  Star,
  StarOff,
  Sparkles,
  Brain,
  Copy,
  Save,
  RefreshCw,
  Clipboard,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Scale,
  Ruler,
  Gauge,
  MoreVertical,
  Edit,
  Lock,
  Download,
  Baby,
  ScanFace,
  Footprints,
} from "lucide-react"
import { toast } from "sonner"
import { generateEncounterPDF } from "@/lib/utils/generate-encounter-pdf"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface VitalSigns {
  systolic_bp: number | null
  diastolic_bp: number | null
  heart_rate: number | null
  respiratory_rate: number | null
  temperature: number | null
  temperature_site: string
  oxygen_saturation: number | null
  weight: number | null
  weight_unit: string
  height_feet: number | null
  height_inches: number | null
  bmi: number | null
  pain_scale: number | null
  pain_location?: string
  notes?: string
}

interface DiagnosisCode {
  code: string
  description: string
  type: "primary" | "secondary"
}

interface Medication {
  id: string
  medication_name: string
  generic_name: string
  dosage: string
  frequency: string
  route: string
  status: string
  start_date: string
  prescribed_by: string
}

interface HPIElement {
  location: string
  quality: string
  severity: string
  duration: string
  timing: string
  context: string
  modifyingFactors: string
  associatedSigns: string
}

// Encounter types by specialty
const encounterTypesBySpecialty: Record<string, { value: string; label: string }[]> = {
  "primary-care": [
    { value: "new_patient", label: "New Patient Visit" },
    { value: "established", label: "Established Patient Visit" },
    { value: "annual_physical", label: "Annual Physical/Wellness" },
    { value: "follow_up", label: "Follow-Up Visit" },
    { value: "chronic_care", label: "Chronic Care Management" },
    { value: "preventive", label: "Preventive Care Visit" },
    { value: "medicare_wellness", label: "Medicare Annual Wellness" },
  ],
  "behavioral-health": [
    { value: "initial_eval", label: "Initial Psychiatric Evaluation" },
    { value: "med_management", label: "Medication Management" },
    { value: "therapy_session", label: "Therapy Session" },
    { value: "crisis_intervention", label: "Crisis Intervention" },
    { value: "group_therapy", label: "Group Therapy" },
    { value: "intake_assessment", label: "Intake Assessment" },
  ],
  obgyn: [
    { value: "prenatal", label: "Prenatal Visit" },
    { value: "postpartum", label: "Postpartum Visit" },
    { value: "annual_gyn", label: "Annual GYN Exam" },
    { value: "problem_visit", label: "Problem Visit" },
    { value: "labor_delivery", label: "Labor & Delivery" },
    { value: "ultrasound", label: "Ultrasound Visit" },
  ],
  cardiology: [
    { value: "cardiac_consult", label: "Cardiac Consultation" },
    { value: "follow_up", label: "Follow-Up Visit" },
    { value: "stress_test", label: "Stress Test" },
    { value: "ecg", label: "ECG/EKG" },
    { value: "echo", label: "Echocardiogram" },
    { value: "cath_pre", label: "Pre-Cath Evaluation" },
  ],
  pediatrics: [
    { value: "well_child", label: "Well Child Visit" },
    { value: "sick_visit", label: "Sick Visit" },
    { value: "immunization", label: "Immunization Visit" },
    { value: "sports_physical", label: "Sports Physical" },
    { value: "adhd_eval", label: "ADHD Evaluation" },
    { value: "newborn", label: "Newborn Visit" },
  ],
  podiatry: [
    { value: "routine_foot", label: "Routine Foot Care" },
    { value: "diabetic_foot", label: "Diabetic Foot Exam" },
    { value: "nail_procedure", label: "Nail Procedure" },
    { value: "wound_care", label: "Wound Care" },
    { value: "orthotics", label: "Orthotics Fitting" },
    { value: "surgical_consult", label: "Surgical Consultation" },
  ],
  dermatology: [
    { value: "skin_check", label: "Full Body Skin Check" },
    { value: "acne", label: "Acne Treatment" },
    { value: "biopsy", label: "Skin Biopsy" },
    { value: "cosmetic", label: "Cosmetic Consultation" },
    { value: "mohs", label: "Mohs Surgery" },
    { value: "phototherapy", label: "Phototherapy" },
  ],
  "urgent-care": [
    { value: "acute_illness", label: "Acute Illness" },
    { value: "minor_injury", label: "Minor Injury" },
    { value: "laceration", label: "Laceration Repair" },
    { value: "xray", label: "X-Ray Visit" },
    { value: "work_injury", label: "Work Injury" },
    { value: "drug_screen", label: "Drug Screening" },
  ],
}

// Review of Systems categories with quick-select normal/abnormal
const reviewOfSystemsCategories = [
  {
    id: "constitutional",
    label: "Constitutional",
    items: ["Fever", "Chills", "Fatigue", "Weight loss", "Weight gain", "Night sweats", "Malaise"],
    normalText: "Denies fever, chills, fatigue, or weight changes.",
  },
  {
    id: "heent",
    label: "HEENT",
    items: ["Headache", "Vision changes", "Hearing loss", "Tinnitus", "Sore throat", "Nasal congestion", "Epistaxis"],
    normalText: "Denies headache, vision or hearing changes, sore throat, or nasal symptoms.",
  },
  {
    id: "cardiovascular",
    label: "Cardiovascular",
    items: ["Chest pain", "Palpitations", "Edema", "Dyspnea on exertion", "Orthopnea", "Claudication", "Syncope"],
    normalText: "Denies chest pain, palpitations, edema, or dyspnea.",
  },
  {
    id: "respiratory",
    label: "Respiratory",
    items: ["Cough", "Shortness of breath", "Wheezing", "Hemoptysis", "Sputum production", "Sleep apnea"],
    normalText: "Denies cough, shortness of breath, wheezing, or hemoptysis.",
  },
  {
    id: "gastrointestinal",
    label: "Gastrointestinal",
    items: [
      "Nausea",
      "Vomiting",
      "Diarrhea",
      "Constipation",
      "Abdominal pain",
      "Blood in stool",
      "Dysphagia",
      "Heartburn",
    ],
    normalText: "Denies nausea, vomiting, diarrhea, constipation, or abdominal pain.",
  },
  {
    id: "genitourinary",
    label: "Genitourinary",
    items: ["Dysuria", "Frequency", "Urgency", "Hematuria", "Incontinence", "Flank pain", "Discharge"],
    normalText: "Denies dysuria, frequency, urgency, hematuria, or incontinence.",
  },
  {
    id: "musculoskeletal",
    label: "Musculoskeletal",
    items: ["Joint pain", "Muscle pain", "Back pain", "Stiffness", "Swelling", "Limited ROM", "Weakness"],
    normalText: "Denies joint pain, muscle pain, back pain, stiffness, or weakness.",
  },
  {
    id: "neurological",
    label: "Neurological",
    items: ["Dizziness", "Numbness", "Tingling", "Tremor", "Seizures", "Memory changes", "Gait disturbance"],
    normalText: "Denies dizziness, numbness, tingling, tremor, seizures, or memory changes.",
  },
  {
    id: "psychiatric",
    label: "Psychiatric",
    items: ["Depression", "Anxiety", "Sleep disturbance", "Mood changes", "Suicidal ideation", "Hallucinations"],
    normalText: "Denies depression, anxiety, sleep disturbance, or mood changes. No SI/HI.",
  },
  {
    id: "skin",
    label: "Integumentary",
    items: ["Rash", "Itching", "Lesions", "Hair loss", "Nail changes", "Bruising", "Wounds"],
    normalText: "Denies rash, itching, lesions, hair loss, or nail changes.",
  },
  {
    id: "endocrine",
    label: "Endocrine",
    items: ["Heat intolerance", "Cold intolerance", "Polydipsia", "Polyuria", "Polyphagia", "Tremor"],
    normalText: "Denies heat/cold intolerance, polydipsia, polyuria, or polyphagia.",
  },
  {
    id: "hematologic",
    label: "Hematologic/Lymphatic",
    items: ["Easy bruising", "Bleeding", "Lymphadenopathy", "Anemia symptoms", "Transfusion history"],
    normalText: "Denies easy bruising, bleeding, or lymphadenopathy.",
  },
  {
    id: "allergic",
    label: "Allergic/Immunologic",
    items: ["Seasonal allergies", "Drug allergies", "Food allergies", "Frequent infections", "HIV risk factors"],
    normalText: "Denies seasonal allergies, drug allergies, or frequent infections.",
  },
]

// Physical exam templates by specialty
const physicalExamBySpecialty: Record<string, { section: string; findings: string[]; normalText: string }[]> = {
  "primary-care": [
    {
      section: "General",
      findings: ["Alert", "Oriented", "No acute distress", "Well-nourished", "Well-developed"],
      normalText: "Alert and oriented, no acute distress. Well-nourished, well-developed.",
    },
    {
      section: "HEENT",
      findings: ["PERRLA", "EOMI", "TMs clear", "Oropharynx clear", "Neck supple", "No LAD"],
      normalText: "PERRLA, EOMI. TMs clear bilaterally. Oropharynx clear, no erythema. Neck supple, no LAD.",
    },
    {
      section: "Cardiovascular",
      findings: ["RRR", "No murmurs", "No gallops", "No rubs", "Pulses 2+ bilateral"],
      normalText: "Regular rate and rhythm. No murmurs, gallops, or rubs. Pulses 2+ bilateral.",
    },
    {
      section: "Respiratory",
      findings: ["CTA bilateral", "No wheezes", "No rales", "No rhonchi", "Normal effort"],
      normalText: "Clear to auscultation bilaterally. No wheezes, rales, or rhonchi. Normal respiratory effort.",
    },
    {
      section: "Abdomen",
      findings: ["Soft", "Non-tender", "Non-distended", "BS+", "No masses", "No HSM"],
      normalText: "Soft, non-tender, non-distended. Bowel sounds present. No masses or hepatosplenomegaly.",
    },
    {
      section: "Extremities",
      findings: ["No edema", "No cyanosis", "No clubbing", "Full ROM", "Strength 5/5"],
      normalText: "No edema, cyanosis, or clubbing. Full range of motion. Strength 5/5 all extremities.",
    },
    {
      section: "Neurological",
      findings: ["A&Ox3", "CN II-XII intact", "Reflexes 2+", "Sensation intact", "Gait normal"],
      normalText:
        "Alert and oriented x3. Cranial nerves II-XII intact. Reflexes 2+ symmetric. Sensation intact. Gait normal.",
    },
    {
      section: "Skin",
      findings: ["Warm", "Dry", "Intact", "No rashes", "No lesions"],
      normalText: "Warm, dry, intact. No rashes or lesions noted.",
    },
  ],
  cardiology: [
    {
      section: "General",
      findings: ["Alert", "Comfortable at rest", "No acute distress"],
      normalText: "Alert, comfortable at rest, no acute distress.",
    },
    {
      section: "Cardiovascular",
      findings: ["RRR", "S1/S2 normal", "No S3/S4", "No murmurs", "No JVD", "PMI nondisplaced"],
      normalText: "Regular rate and rhythm. S1/S2 normal. No S3, S4, murmurs, or rubs. No JVD. PMI nondisplaced.",
    },
    {
      section: "Peripheral Vascular",
      findings: ["Pulses 2+ bilateral", "No bruits", "No edema", "Warm extremities", "Cap refill <2s"],
      normalText:
        "Pulses 2+ bilateral. No carotid or femoral bruits. No peripheral edema. Extremities warm with capillary refill <2 seconds.",
    },
    {
      section: "Respiratory",
      findings: ["CTA bilateral", "No crackles", "No wheezes", "Normal effort"],
      normalText: "Clear to auscultation bilaterally. No crackles or wheezes. Normal respiratory effort.",
    },
    {
      section: "Abdomen",
      findings: ["Soft", "Non-tender", "No hepatomegaly", "No ascites"],
      normalText: "Soft, non-tender. No hepatomegaly or ascites.",
    },
  ],
  podiatry: [
    {
      section: "Vascular",
      findings: ["DP pulse 2+", "PT pulse 2+", "Cap refill <3s", "No edema", "Hair growth present"],
      normalText:
        "Dorsalis pedis and posterior tibial pulses 2+ bilaterally. Capillary refill <3 seconds. No edema. Hair growth present.",
    },
    {
      section: "Neurological",
      findings: ["Monofilament intact", "Vibration sense intact", "Proprioception intact", "Reflexes 2+"],
      normalText:
        "10g monofilament sensation intact at all sites. Vibration sense and proprioception intact. Reflexes 2+ bilaterally.",
    },
    {
      section: "Dermatological",
      findings: ["Skin intact", "No ulcers", "No calluses", "No fissures", "Nails normal"],
      normalText:
        "Skin intact without ulceration. No excessive calluses or fissures. Nails normal thickness and color.",
    },
    {
      section: "Musculoskeletal",
      findings: ["ROM intact", "No deformities", "Gait normal", "No tenderness", "Arches normal"],
      normalText:
        "Full range of motion. No structural deformities. Gait normal. No point tenderness. Arches within normal limits.",
    },
  ],
  obgyn: [
    {
      section: "General",
      findings: ["Alert", "Comfortable", "No acute distress"],
      normalText: "Alert, comfortable, no acute distress.",
    },
    {
      section: "Abdomen",
      findings: ["Soft", "Non-tender", "Gravid/Non-gravid", "FHT present", "Fundal height appropriate"],
      normalText:
        "Abdomen soft, non-tender. Fundal height appropriate for gestational age. FHT present and reassuring.",
    },
    {
      section: "Pelvic",
      findings: [
        "Normal external genitalia",
        "Vagina normal",
        "Cervix normal",
        "Uterus normal size",
        "Adnexa non-tender",
      ],
      normalText:
        "External genitalia normal. Vagina without discharge. Cervix appears normal. Uterus normal size, non-tender. Adnexa non-tender bilaterally.",
    },
    {
      section: "Breast",
      findings: ["No masses", "No tenderness", "No discharge", "No skin changes"],
      normalText: "No masses, tenderness, or discharge. No skin changes.",
    },
  ],
  pediatrics: [
    {
      section: "General",
      findings: ["Alert", "Active", "Interactive", "Well-appearing", "Age-appropriate development"],
      normalText: "Alert, active, and interactive. Well-appearing child with age-appropriate development.",
    },
    {
      section: "Growth",
      findings: ["Weight percentile", "Height percentile", "Head circumference percentile", "BMI percentile"],
      normalText: "Growth parameters appropriate for age.",
    },
    {
      section: "HEENT",
      findings: ["Normocephalic", "AF soft/flat", "PERRLA", "TMs clear", "Oropharynx clear"],
      normalText:
        "Normocephalic, anterior fontanelle soft and flat (if applicable). PERRLA. TMs clear. Oropharynx clear.",
    },
    {
      section: "Cardiovascular",
      findings: ["RRR", "No murmurs", "Normal pulses", "No cyanosis"],
      normalText: "Regular rate and rhythm. No murmurs. Normal peripheral pulses. No cyanosis.",
    },
    {
      section: "Respiratory",
      findings: ["CTA bilateral", "No retractions", "No stridor", "No wheezing"],
      normalText: "Clear to auscultation bilaterally. No retractions, stridor, or wheezing.",
    },
    {
      section: "Abdomen",
      findings: ["Soft", "Non-tender", "No masses", "No HSM"],
      normalText: "Soft, non-tender, non-distended. No masses or hepatosplenomegaly.",
    },
    {
      section: "Skin",
      findings: ["No rashes", "No birthmarks", "Good turgor"],
      normalText: "No rashes or concerning lesions. Good skin turgor.",
    },
    {
      section: "Neuro/Development",
      findings: ["Appropriate milestones", "Normal tone", "Normal reflexes"],
      normalText: "Meeting developmental milestones. Normal muscle tone and reflexes.",
    },
  ],
}

// Note templates for quick selection
const noteTemplates = [
  { id: "soap", name: "SOAP Note", icon: FileText, specialty: "all" },
  { id: "hpi", name: "HPI Builder", icon: Clipboard, specialty: "all" },
  { id: "well_child", name: "Well Child", icon: Baby, specialty: "pediatrics" },
  { id: "prenatal", name: "Prenatal", icon: Heart, specialty: "obgyn" },
  { id: "diabetic_foot", name: "Diabetic Foot", icon: Footprints, specialty: "podiatry" },
  { id: "cardiac", name: "Cardiac Consult", icon: Activity, specialty: "cardiology" },
  { id: "psych_eval", name: "Psych Evaluation", icon: Brain, specialty: "behavioral-health" },
  { id: "skin_exam", name: "Skin Exam", icon: ScanFace, specialty: "dermatology" },
]

// Smart text shortcuts that auto-expand
const smartTextShortcuts: Record<string, string> = {
  ".wnl": "Within normal limits",
  ".nad": "No acute distress",
  ".aox3": "Alert and oriented x3",
  ".rrr": "Regular rate and rhythm, no murmurs, gallops, or rubs",
  ".cta": "Clear to auscultation bilaterally, no wheezes, rales, or rhonchi",
  ".sntnd": "Soft, non-tender, non-distended, positive bowel sounds",
  ".noe": "No edema, cyanosis, or clubbing",
  ".perrla": "Pupils equal, round, reactive to light and accommodation",
  ".neg": "Negative",
  ".pos": "Positive",
  ".bil": "Bilateral",
  ".prn": "As needed",
  ".bid": "Twice daily",
  ".tid": "Three times daily",
  ".qd": "Once daily",
  ".fu": "Follow up",
  ".rtc": "Return to clinic",
  ".wt": `Weight: [WEIGHT] lbs`,
  ".bp": `Blood pressure: [BP]`,
  ".cc": `Chief complaint: `,
  ".hx": `History: `,
  ".dx": `Diagnosis: `,
  ".rx": `Prescription: `,
  ".pt": "[PATIENT_NAME]",
  ".age": "[PATIENT_AGE]",
  ".dob": "[PATIENT_DOB]",
  ".today": new Date().toLocaleDateString(),
  ".now": new Date().toLocaleTimeString(),
}

export default function EncountersPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/encounters", fetcher, {
    refreshInterval: 30000,
  })

  // Core state
  const [selectedSpecialty, setSelectedSpecialty] = useState("primary-care")
  const [showNewEncounter, setShowNewEncounter] = useState(false)
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("encounters")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isSaving, setIsSaving] = useState(false)

  // View Details and Edit Note state
  const [showViewDetails, setShowViewDetails] = useState(false)
  const [showEditNote, setShowEditNote] = useState(false)
  const [encounterDetails, setEncounterDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [editingNote, setEditingNote] = useState<{
    subjective: string
    objective: string
    assessment: string
    plan: string
    noteId?: string
  }>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  })
  const [editingVitals, setEditingVitals] = useState<VitalSigns>({
    systolic_bp: null,
    diastolic_bp: null,
    heart_rate: null,
    respiratory_rate: null,
    temperature: null,
    temperature_site: "oral",
    oxygen_saturation: null,
    weight: null,
    weight_unit: "lbs",
    height_feet: null,
    height_inches: null,
    bmi: null,
    pain_scale: null,
    pain_location: "",
    notes: "",
  })
  const [savingNote, setSavingNote] = useState(false)
  const [noteMetadata, setNoteMetadata] = useState<{
    last_edited_at: string | null
    last_edited_by: string | null
    edit_count: number
    original_created_at: string | null
    canEdit: boolean
    daysRemaining: number | null
    nextEditDate: string | null
    lastEditorName: string | null
  } | null>(null)

  // Encounter form state
  const [encounterTab, setEncounterTab] = useState("chief-complaint")
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedProvider, setSelectedProvider] = useState("")
  const [encounterType, setEncounterType] = useState("")
  const [chiefComplaint, setChiefComplaint] = useState("")
  const [patientSearchQuery, setPatientSearchQuery] = useState("")
  const [patientValidationError, setPatientValidationError] = useState("")

  // HPI Builder state
  const [hpiElements, setHpiElements] = useState<HPIElement>({
    location: "",
    quality: "",
    severity: "",
    duration: "",
    timing: "",
    context: "",
    modifyingFactors: "",
    associatedSigns: "",
  })

  // Vital signs state
  const [vitals, setVitals] = useState<VitalSigns>({
    systolic_bp: null,
    diastolic_bp: null,
    heart_rate: null,
    respiratory_rate: null,
    temperature: null,
    temperature_site: "oral",
    oxygen_saturation: null,
    weight: null,
    weight_unit: "lbs",
    height_feet: null,
    height_inches: null,
    bmi: null,
    pain_scale: null,
    pain_location: "",
    notes: "",
  })

  // ROS state
  const [rosFindings, setRosFindings] = useState<Record<string, { checked: string[]; notes: string }>>({})
  const [allRosNormal, setAllRosNormal] = useState(false)

  // Physical exam state
  const [examFindings, setExamFindings] = useState<
    Record<string, { findings: string[]; notes: string; normal: boolean }>
  >({})
  const [allExamNormal, setAllExamNormal] = useState(false)

  // SOAP notes state
  const [subjective, setSubjective] = useState("")
  const [objective, setObjective] = useState("")
  const [assessment, setAssessment] = useState("")
  const [plan, setPlan] = useState("")

  // Diagnosis state
  const [diagnoses, setDiagnoses] = useState<DiagnosisCode[]>([])
  const [diagnosisSearch, setDiagnosisSearch] = useState("")
  const [diagnosisResults, setDiagnosisResults] = useState<any[]>([])

  // Voice dictation state
  const [isListening, setIsListening] = useState(false)
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  // Template favorites
  const [favoriteTemplates, setFavoriteTemplates] = useState<string[]>([])

  // AI assist state
  const [isAiProcessing, setIsAiProcessing] = useState(false)

  // Calculate BMI when weight/height changes
  useEffect(() => {
    if (vitals.weight && vitals.height_feet !== null && vitals.height_inches !== null) {
      const weightKg = vitals.weight_unit === "lbs" ? vitals.weight * 0.453592 : vitals.weight
      const heightM = (vitals.height_feet * 12 + vitals.height_inches) * 0.0254
      if (heightM > 0) {
        const calculatedBmi = weightKg / (heightM * heightM)
        setVitals((prev) => ({ ...prev, bmi: Math.round(calculatedBmi * 10) / 10 }))
      }
    }
  }, [vitals.weight, vitals.weight_unit, vitals.height_feet, vitals.height_inches])

  // Calculate BMI for editing vitals when weight or height changes
  useEffect(() => {
    if (editingVitals.weight && editingVitals.height_feet !== null && editingVitals.height_inches !== null) {
      const weightKg = editingVitals.weight_unit === "lbs" ? editingVitals.weight * 0.453592 : editingVitals.weight
      const heightM = (editingVitals.height_feet * 12 + editingVitals.height_inches) * 0.0254
      if (heightM > 0) {
        const calculatedBmi = weightKg / (heightM * heightM)
        setEditingVitals((prev) => ({ ...prev, bmi: Math.round(calculatedBmi * 10) / 10 }))
      }
    }
  }, [editingVitals.weight, editingVitals.weight_unit, editingVitals.height_feet, editingVitals.height_inches])

  // Auto-update Objective field when editing vitals change (only when Edit Note dialog is open)
  useEffect(() => {
    if (!showEditNote) return // Only update when Edit Note dialog is open
    
    // Check if any vitals have values
    const hasVitals = editingVitals.systolic_bp !== null || 
                      editingVitals.diastolic_bp !== null ||
                      editingVitals.heart_rate !== null ||
                      editingVitals.respiratory_rate !== null ||
                      editingVitals.temperature !== null ||
                      editingVitals.oxygen_saturation !== null ||
                      editingVitals.weight !== null ||
                      (editingVitals.height_feet !== null && editingVitals.height_inches !== null) ||
                      editingVitals.pain_scale !== null

    if (!hasVitals) return // Don't update if no vitals

    // Generate new vitals text
    let vitalsText = "VITAL SIGNS:\n"
    if (editingVitals.systolic_bp && editingVitals.diastolic_bp) 
      vitalsText += `BP: ${editingVitals.systolic_bp}/${editingVitals.diastolic_bp} mmHg\n`
    if (editingVitals.heart_rate) vitalsText += `HR: ${editingVitals.heart_rate} bpm\n`
    if (editingVitals.respiratory_rate) vitalsText += `RR: ${editingVitals.respiratory_rate}/min\n`
    if (editingVitals.temperature) 
      vitalsText += `Temp: ${editingVitals.temperature}°F (${editingVitals.temperature_site || "oral"})\n`
    if (editingVitals.oxygen_saturation) vitalsText += `O2 Sat: ${editingVitals.oxygen_saturation}%\n`
    if (editingVitals.weight) vitalsText += `Weight: ${editingVitals.weight} ${editingVitals.weight_unit}\n`
    if (editingVitals.height_feet !== null && editingVitals.height_inches !== null) {
      vitalsText += `Height: ${editingVitals.height_feet}'${editingVitals.height_inches}"\n`
    }
    if (editingVitals.bmi) vitalsText += `BMI: ${editingVitals.bmi}\n`
    if (editingVitals.pain_scale !== null)
      vitalsText += `Pain: ${editingVitals.pain_scale}/10${editingVitals.pain_location ? ` (${editingVitals.pain_location})` : ""}\n`

    // Update objective with new vitals, preserving other content
    setEditingNote(prev => {
      const currentObjective = prev.objective || ""
      
      // Check if there's already a VITAL SIGNS section
      const vitalsRegex = /VITAL SIGNS:[\s\S]*?(?=\n\nPHYSICAL EXAMINATION:|\n\n[A-Z]|$)/
      
      let newObjective: string
      if (vitalsRegex.test(currentObjective)) {
        // Replace existing VITAL SIGNS section
        newObjective = currentObjective.replace(vitalsRegex, vitalsText.trim())
      } else {
        // Prepend vitals to the beginning, preserving existing content
        const existingContent = currentObjective.trim()
        if (existingContent) {
          // Check if existing content starts with PHYSICAL EXAMINATION
          if (existingContent.startsWith("PHYSICAL EXAMINATION:")) {
            newObjective = vitalsText + "\n" + existingContent
          } else {
            newObjective = vitalsText + "\n" + existingContent
          }
        } else {
          newObjective = vitalsText
        }
      }
      
      return { ...prev, objective: newObjective }
    })
  }, [
    showEditNote,
    editingVitals.systolic_bp,
    editingVitals.diastolic_bp,
    editingVitals.heart_rate,
    editingVitals.respiratory_rate,
    editingVitals.temperature,
    editingVitals.temperature_site,
    editingVitals.oxygen_saturation,
    editingVitals.weight,
    editingVitals.weight_unit,
    editingVitals.height_feet,
    editingVitals.height_inches,
    editingVitals.bmi,
    editingVitals.pain_scale,
    editingVitals.pain_location
  ])

  // Initialize voice recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("")

        if (activeVoiceField) {
          switch (activeVoiceField) {
            case "chiefComplaint":
              setChiefComplaint((prev) => prev + " " + transcript)
              break
            case "subjective":
              setSubjective((prev) => prev + " " + transcript)
              break
            case "objective":
              setObjective((prev) => prev + " " + transcript)
              break
            case "assessment":
              setAssessment((prev) => prev + " " + transcript)
              break
            case "plan":
              setPlan((prev) => prev + " " + transcript)
              break
          }
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }
    }

    // Load favorite templates from localStorage
    const savedFavorites = localStorage.getItem("favoriteNoteTemplates")
    if (savedFavorites) {
      setFavoriteTemplates(JSON.parse(savedFavorites))
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [activeVoiceField])

  // Toggle voice dictation
  const toggleVoiceDictation = (field: string) => {
    if (!recognitionRef.current) {
      toast.error("Voice dictation not supported in this browser")
      return
    }

    if (isListening && activeVoiceField === field) {
      recognitionRef.current.stop()
      setIsListening(false)
      setActiveVoiceField(null)
    } else {
      if (isListening) {
        recognitionRef.current.stop()
      }
      setActiveVoiceField(field)
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Smart text expansion
  const handleSmartText = (text: string, setter: (val: string) => void) => {
    let expandedText = text
    Object.entries(smartTextShortcuts).forEach(([shortcut, expansion]) => {
      expandedText = expandedText.replace(new RegExp(shortcut.replace(".", "\\."), "gi"), expansion)
    })
    setter(expandedText)
  }

  // Toggle template favorite
  const toggleFavorite = (templateId: string) => {
    setFavoriteTemplates((prev) => {
      const newFavorites = prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId]
      localStorage.setItem("favoriteNoteTemplates", JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  // Set all ROS to normal
  const setAllRosToNormal = () => {
    const normalRos: Record<string, { checked: string[]; notes: string }> = {}
    reviewOfSystemsCategories.forEach((cat) => {
      normalRos[cat.id] = { checked: [], notes: cat.normalText }
    })
    setRosFindings(normalRos)
    setAllRosNormal(true)
    toast.success("All Review of Systems set to normal")
  }

  // Set all exam findings to normal
  const setAllExamToNormal = () => {
    const examTemplate = physicalExamBySpecialty[selectedSpecialty] || physicalExamBySpecialty["primary-care"]
    const normalExam: Record<string, { findings: string[]; notes: string; normal: boolean }> = {}
    examTemplate.forEach((section) => {
      normalExam[section.section] = { findings: section.findings, notes: section.normalText, normal: true }
    })
    setExamFindings(normalExam)
    setAllExamNormal(true)
    toast.success("All Physical Exam findings set to normal")
  }

  // Generate HPI from elements
  const generateHPIText = () => {
    const parts = []
    if (hpiElements.location) parts.push(`Location: ${hpiElements.location}`)
    if (hpiElements.quality) parts.push(`Quality: ${hpiElements.quality}`)
    if (hpiElements.severity) parts.push(`Severity: ${hpiElements.severity}/10`)
    if (hpiElements.duration) parts.push(`Duration: ${hpiElements.duration}`)
    if (hpiElements.timing) parts.push(`Timing: ${hpiElements.timing}`)
    if (hpiElements.context) parts.push(`Context: ${hpiElements.context}`)
    if (hpiElements.modifyingFactors) parts.push(`Modifying factors: ${hpiElements.modifyingFactors}`)
    if (hpiElements.associatedSigns) parts.push(`Associated signs/symptoms: ${hpiElements.associatedSigns}`)

    return parts.join(". ") + (parts.length > 0 ? "." : "")
  }

  // Generate objective section from vitals and exam
  const generateObjectiveText = () => {
    let text = "VITAL SIGNS:\n"
    if (vitals.systolic_bp && vitals.diastolic_bp) text += `BP: ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg\n`
    if (vitals.heart_rate) text += `HR: ${vitals.heart_rate} bpm\n`
    if (vitals.respiratory_rate) text += `RR: ${vitals.respiratory_rate}/min\n`
    if (vitals.temperature) text += `Temp: ${vitals.temperature}°F (${vitals.temperature_site})\n`
    if (vitals.oxygen_saturation) text += `O2 Sat: ${vitals.oxygen_saturation}%\n`
    if (vitals.weight) text += `Weight: ${vitals.weight} ${vitals.weight_unit}\n`
    if (vitals.height_feet !== null && vitals.height_inches !== null) {
      text += `Height: ${vitals.height_feet}'${vitals.height_inches}"\n`
    }
    if (vitals.bmi) text += `BMI: ${vitals.bmi}\n`
    if (vitals.pain_scale !== null)
      text += `Pain: ${vitals.pain_scale}/10${vitals.pain_location ? ` (${vitals.pain_location})` : ""}\n`

    text += "\nPHYSICAL EXAMINATION:\n"
    Object.entries(examFindings).forEach(([section, data]) => {
      text += `${section}: ${data.notes}\n`
    })

    return text
  }

  // Generate objective vitals section from editingVitals (for Edit Progress Note dialog)
  const generateEditingObjectiveVitals = () => {
    let text = "VITAL SIGNS:\n"
    if (editingVitals.systolic_bp && editingVitals.diastolic_bp) 
      text += `BP: ${editingVitals.systolic_bp}/${editingVitals.diastolic_bp} mmHg\n`
    if (editingVitals.heart_rate) text += `HR: ${editingVitals.heart_rate} bpm\n`
    if (editingVitals.respiratory_rate) text += `RR: ${editingVitals.respiratory_rate}/min\n`
    if (editingVitals.temperature) 
      text += `Temp: ${editingVitals.temperature}°F (${editingVitals.temperature_site || "oral"})\n`
    if (editingVitals.oxygen_saturation) text += `O2 Sat: ${editingVitals.oxygen_saturation}%\n`
    if (editingVitals.weight) text += `Weight: ${editingVitals.weight} ${editingVitals.weight_unit}\n`
    if (editingVitals.height_feet !== null && editingVitals.height_inches !== null) {
      text += `Height: ${editingVitals.height_feet}'${editingVitals.height_inches}"\n`
    }
    if (editingVitals.bmi) text += `BMI: ${editingVitals.bmi}\n`
    if (editingVitals.pain_scale !== null)
      text += `Pain: ${editingVitals.pain_scale}/10${editingVitals.pain_location ? ` (${editingVitals.pain_location})` : ""}\n`

    return text
  }

  // Check if any editing vitals have values
  const hasEditingVitals = () => {
    return editingVitals.systolic_bp !== null || 
           editingVitals.diastolic_bp !== null ||
           editingVitals.heart_rate !== null ||
           editingVitals.respiratory_rate !== null ||
           editingVitals.temperature !== null ||
           editingVitals.oxygen_saturation !== null ||
           editingVitals.weight !== null ||
           (editingVitals.height_feet !== null && editingVitals.height_inches !== null) ||
           editingVitals.pain_scale !== null
  }

  // Update objective field with vitals while preserving other content
  const updateObjectiveWithVitals = (currentObjective: string) => {
    if (!hasEditingVitals()) return currentObjective
    
    const vitalsText = generateEditingObjectiveVitals()
    
    // Check if there's already a VITAL SIGNS section
    const vitalsRegex = /VITAL SIGNS:[\s\S]*?(?=\n\n[A-Z]|\n\nPHYSICAL|$)/
    
    if (vitalsRegex.test(currentObjective)) {
      // Replace existing VITAL SIGNS section
      return currentObjective.replace(vitalsRegex, vitalsText.trim())
    } else {
      // Prepend vitals to the beginning, preserving existing content
      const existingContent = currentObjective.trim()
      if (existingContent) {
        // Check if existing content starts with PHYSICAL EXAMINATION
        if (existingContent.startsWith("PHYSICAL EXAMINATION:")) {
          return vitalsText + "\n" + existingContent
        }
        return vitalsText + "\n" + existingContent
      }
      return vitalsText
    }
  }

  // Search ICD-10 codes
  const searchDiagnosis = async (query: string) => {
    if (query.length < 2) {
      setDiagnosisResults([])
      return
    }

    try {
      const response = await fetch(`/api/encounters/icd10?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      setDiagnosisResults(data.codes || [])
    } catch (error) {
      console.error("Error searching ICD-10:", error)
    }
  }

  // AI-enhance note content
  const aiEnhanceNote = async (content: string, section: string) => {
    setIsAiProcessing(true)
    try {
      const response = await fetch("/api/clinical-notes/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteContent: content,
          noteType: encounterType,
          action: "enhance",
        }),
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader available")

      let enhanced = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        enhanced += new TextDecoder().decode(value)
      }

      // Update the appropriate section
      switch (section) {
        case "subjective":
          setSubjective(enhanced)
          break
        case "objective":
          setObjective(enhanced)
          break
        case "assessment":
          setAssessment(enhanced)
          break
        case "plan":
          setPlan(enhanced)
          break
      }
      toast.success(`${section} enhanced with AI`)
    } catch (error) {
      toast.error("Failed to enhance note with AI")
    } finally {
      setIsAiProcessing(false)
    }
  }

  // Handle Sign & Complete button click
  const handleSignAndComplete = () => {
    // Validate required fields before signing
    if (!selectedPatient) {
      setPatientValidationError("Patient selection is required")
      toast.error("Please select a patient before signing the encounter")
      // Stay on current tab if on vitals, otherwise go to first tab
      if (encounterTab !== "vitals") {
        setEncounterTab("chief-complaint")
      }
      return
    }
    
    if (!selectedProvider) {
      toast.error("Please select a provider before signing the encounter")
      setEncounterTab("chief-complaint")
      return
    }
    
    if (!encounterType) {
      toast.error("Please select an encounter type before signing")
      setEncounterTab("chief-complaint")
      return
    }
    
    if (!chiefComplaint.trim()) {
      toast.error("Please enter a chief complaint before signing")
      setEncounterTab("chief-complaint")
      return
    }
    
    // Proceed with signing
    saveEncounter("signed")
  }

  // Handle Chief Complaint input change
  const handleChiefComplaintChange = (value: string) => {
    handleSmartText(value, setChiefComplaint)
  }

  // Handle HPI Location input change
  const handleHPILocationChange = (value: string) => {
    setHpiElements((prev) => ({ ...prev, location: value }))
  }

  // Handle HPI Quality input change
  const handleHPIQualityChange = (value: string) => {
    setHpiElements((prev) => ({ ...prev, quality: value }))
  }

  // Handle HPI Severity input change with validation
  const handleHPISeverityChange = (value: string) => {
    const numValue = Number.parseInt(value)
    if (value === "" || (numValue >= 1 && numValue <= 10)) {
      setHpiElements((prev) => ({ ...prev, severity: value }))
    }
  }

  // Handle HPI Duration input change
  const handleHPIDurationChange = (value: string) => {
    setHpiElements((prev) => ({ ...prev, duration: value }))
  }

  // Handle HPI Timing input change
  const handleHPITimingChange = (value: string) => {
    setHpiElements((prev) => ({ ...prev, timing: value }))
  }

  // Handle HPI Context input change
  const handleHPIContextChange = (value: string) => {
    setHpiElements((prev) => ({ ...prev, context: value }))
  }

  // Handle HPI Modifying Factors input change
  const handleHPIModifyingFactorsChange = (value: string) => {
    setHpiElements((prev) => ({ ...prev, modifyingFactors: value }))
  }

  // Handle HPI Associated Signs/Symptoms input change
  const handleHPIAssociatedSignsChange = (value: string) => {
    setHpiElements((prev) => ({ ...prev, associatedSigns: value }))
  }

  // Handle Additional Subjective Notes input change
  const handleSubjectiveNotesChange = (value: string) => {
    handleSmartText(value, setSubjective)
  }

  // Save encounter
  const saveEncounter = async (status: "draft" | "signed" = "draft") => {
    // Clear previous validation errors
    setPatientValidationError("")
    
    if (!selectedPatient) {
      setPatientValidationError("Patient selection is required")
      toast.error("Please select a patient to create an encounter")
      return
    }
    
    if (!selectedProvider) {
      toast.error("Please select a provider")
      return
    }

    setIsSaving(true)
    try {
      // Compile the full subjective section
      const fullSubjective = `CHIEF COMPLAINT: ${chiefComplaint}\n\nHISTORY OF PRESENT ILLNESS:\n${generateHPIText()}\n\nREVIEW OF SYSTEMS:\n${Object.entries(
        rosFindings,
      )
        .map(([cat, data]) => `${cat}: ${data.notes}`)
        .join("\n")}\n\n${subjective}`

      const response = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient,
          provider_id: selectedProvider,
          encounter_type: encounterType,
          specialty: selectedSpecialty,
          chief_complaint: chiefComplaint,
          visit_reason: encounterType,
          vitals,
          subjective: fullSubjective,
          objective: generateObjectiveText() + "\n" + objective,
          assessment:
            assessment +
            "\n\nDIAGNOSES:\n" +
            diagnoses.map((d) => `${d.code} - ${d.description} (${d.type})`).join("\n"),
          plan,
          diagnoses,
          status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Failed to save encounter"
        const errorDetails = errorData.details ? ` Details: ${errorData.details}` : ""
        const errorHint = errorData.hint ? ` Hint: ${errorData.hint}` : ""
        throw new Error(`${errorMessage}${errorDetails}${errorHint}`)
      }

      const result = await response.json()
      toast.success(status === "signed" ? "Encounter signed and saved" : "Encounter saved as draft")
      setShowNewEncounter(false)
      
      // Force refresh of encounters list with revalidation
      await mutate(undefined, { revalidate: true })
      
      // Reset form
      resetEncounterForm()
    } catch (error) {
      console.error("Error saving encounter:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save encounter")
    } finally {
      setIsSaving(false)
    }
  }

  // Reset encounter form
  const resetEncounterForm = () => {
    setSelectedPatient("")
    setSelectedProvider("")
    setEncounterType("")
    setChiefComplaint("")
    setPatientSearchQuery("")
    setPatientValidationError("")
    setHpiElements({
      location: "",
      quality: "",
      severity: "",
      duration: "",
      timing: "",
      context: "",
      modifyingFactors: "",
      associatedSigns: "",
    })
    setVitals({
      systolic_bp: null,
      diastolic_bp: null,
      heart_rate: null,
      respiratory_rate: null,
      temperature: null,
      temperature_site: "oral",
      oxygen_saturation: null,
      weight: null,
      weight_unit: "lbs",
      height_feet: null,
      height_inches: null,
      bmi: null,
      pain_scale: null,
      pain_location: "",
      notes: "",
    })
    setRosFindings({})
    setExamFindings({})
    setSubjective("")
    setObjective("")
    setAssessment("")
    setPlan("")
    setDiagnoses([])
    setAllRosNormal(false)
    setAllExamNormal(false)
    setEncounterTab("chief-complaint")
  }

  const encounters = data?.encounters || []
  const allPatients = data?.patients || []
  const providers = data?.providers || []
  const stats = data?.stats || { todayCount: 0, inProgress: 0, completed: 0, pendingNotes: 0 }

  // Filter patients based on search query (name, MRN, or client number)
  const patients = allPatients.filter((p: any) => {
    if (!patientSearchQuery) return true
    const query = patientSearchQuery.toLowerCase()
    const fullName = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase()
    const mrn = (p.mrn || "").toLowerCase()
    const clientNumber = (p.client_number || "").toLowerCase()
    return (
      fullName.includes(query) ||
      mrn.includes(query) ||
      clientNumber.includes(query)
    )
  })

  const filteredEncounters = encounters.filter((enc: any) => {
    const matchesSearch =
      enc.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enc.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase())
    // Match status - handle both "completed" and "signed" as completed
    const matchesStatus = 
      statusFilter === "all" || 
      enc.status === statusFilter ||
      (statusFilter === "completed" && (enc.status === "completed" || enc.status === "signed"))
    return matchesSearch && matchesStatus
  })

  const encounterTypes = encounterTypesBySpecialty[selectedSpecialty] || encounterTypesBySpecialty["primary-care"]
  const examTemplate = physicalExamBySpecialty[selectedSpecialty] || physicalExamBySpecialty["primary-care"]

  // Handle View Details
  const handleViewDetails = async (encounter: any) => {
    setSelectedEncounter(encounter)
    setLoadingDetails(true)
    setShowViewDetails(true)
    
    try {
      const response = await fetch(`/api/encounters/${encounter.id}`)
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.error || `Failed to fetch encounter details (${response.status})`
        console.error("API Error:", errorMessage, data)
        toast.error(errorMessage)
        return
      }
      
      setEncounterDetails(data)
    } catch (error: any) {
      console.error("Error fetching encounter details:", error)
      toast.error(error.message || "Failed to load encounter details")
    } finally {
      setLoadingDetails(false)
    }
  }

  // Handle Edit Note
  const handleEditNote = async (encounter: any) => {
    setSelectedEncounter(encounter)
    setLoadingDetails(true)
    setShowEditNote(true)
    setNoteMetadata(null)
    
    try {
      const response = await fetch(`/api/encounters/${encounter.id}`)
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.error || `Failed to fetch encounter details (${response.status})`
        console.error("API Error:", errorMessage, data)
        toast.error(errorMessage)
        return
      }
      
      // Extract progress note or initialize empty
      if (data.encounterNote) {
        setEditingNote({
          subjective: data.encounterNote.subjective || "",
          objective: data.encounterNote.objective || "",
          assessment: data.encounterNote.assessment || "",
          plan: data.encounterNote.plan || "",
          noteId: data.encounterNote.id,
        })

        // Load most recent vital signs for this encounter/patient
        if (data.vitals && data.vitals.length > 0) {
          const latestVitals = data.vitals[0]
          setEditingVitals({
            systolic_bp: latestVitals.systolic_bp || null,
            diastolic_bp: latestVitals.diastolic_bp || null,
            heart_rate: latestVitals.heart_rate || null,
            respiratory_rate: latestVitals.respiratory_rate || null,
            temperature: latestVitals.temperature || null,
            temperature_site: latestVitals.temperature_site || "oral",
            oxygen_saturation: latestVitals.oxygen_saturation || null,
            weight: latestVitals.weight || null,
            weight_unit: latestVitals.weight_unit || "lbs",
            height_feet: latestVitals.height_feet || null,
            height_inches: latestVitals.height_inches || null,
            bmi: latestVitals.bmi || null,
            pain_scale: latestVitals.pain_scale || null,
            pain_location: latestVitals.pain_location || "",
            notes: latestVitals.notes || "",
          })
        } else {
          // Reset to empty if no vitals found
          setEditingVitals({
            systolic_bp: null,
            diastolic_bp: null,
            heart_rate: null,
            respiratory_rate: null,
            temperature: null,
            temperature_site: "oral",
            oxygen_saturation: null,
            weight: null,
            weight_unit: "lbs",
            height_feet: null,
            height_inches: null,
            bmi: null,
            pain_scale: null,
            pain_location: "",
            notes: "",
          })
        }

        // Check cooldown and set metadata
        const lastEdited = data.encounterNote.last_edited_at
        const editCount = data.encounterNote.edit_count || 0
        const originalCreated = data.encounterNote.original_created_at || data.encounterNote.created_at

        let canEdit = true
        let daysRemaining: number | null = null
        let nextEditDate: string | null = null

        if (lastEdited) {
          const lastEditedDate = new Date(lastEdited)
          const now = new Date()
          const daysSinceEdit = (now.getTime() - lastEditedDate.getTime()) / (1000 * 60 * 60 * 24)

          if (daysSinceEdit < 10) {
            canEdit = false
            daysRemaining = Math.ceil(10 - daysSinceEdit)
            const nextDate = new Date(lastEditedDate)
            nextDate.setDate(nextDate.getDate() + 10)
            nextEditDate = nextDate.toISOString()
          }
        }

        // Fetch last editor name if available
        let lastEditorName: string | null = null
        if (data.encounterNote.last_edited_by) {
          try {
            const staffResponse = await fetch(`/api/staff/${data.encounterNote.last_edited_by}`)
            if (staffResponse.ok) {
              const staffData = await staffResponse.json()
              lastEditorName = `${staffData.first_name} ${staffData.last_name}`
            }
          } catch (e) {
            // Silently fail - editor name is optional
          }
        }

        setNoteMetadata({
          last_edited_at: lastEdited,
          last_edited_by: data.encounterNote.last_edited_by,
          edit_count: editCount,
          original_created_at: originalCreated,
          canEdit,
          daysRemaining,
          nextEditDate,
          lastEditorName,
        })
      } else {
        setEditingNote({
          subjective: "",
          objective: "",
          assessment: "",
          plan: "",
        })
        // Load most recent vital signs if available
        if (data.vitals && data.vitals.length > 0) {
          const latestVitals = data.vitals[0]
          setEditingVitals({
            systolic_bp: latestVitals.systolic_bp || null,
            diastolic_bp: latestVitals.diastolic_bp || null,
            heart_rate: latestVitals.heart_rate || null,
            respiratory_rate: latestVitals.respiratory_rate || null,
            temperature: latestVitals.temperature || null,
            temperature_site: latestVitals.temperature_site || "oral",
            oxygen_saturation: latestVitals.oxygen_saturation || null,
            weight: latestVitals.weight || null,
            weight_unit: latestVitals.weight_unit || "lbs",
            height_feet: latestVitals.height_feet || null,
            height_inches: latestVitals.height_inches || null,
            bmi: latestVitals.bmi || null,
            pain_scale: latestVitals.pain_scale || null,
            pain_location: latestVitals.pain_location || "",
            notes: latestVitals.notes || "",
          })
        } else {
          setEditingVitals({
            systolic_bp: null,
            diastolic_bp: null,
            heart_rate: null,
            respiratory_rate: null,
            temperature: null,
            temperature_site: "oral",
            oxygen_saturation: null,
            weight: null,
            weight_unit: "lbs",
            height_feet: null,
            height_inches: null,
            bmi: null,
            pain_scale: null,
            pain_location: "",
            notes: "",
          })
        }
        setNoteMetadata({
          last_edited_at: null,
          last_edited_by: null,
          edit_count: 0,
          original_created_at: null,
          canEdit: true,
          daysRemaining: null,
          nextEditDate: null,
          lastEditorName: null,
        })
      }
    } catch (error: any) {
      console.error("Error fetching encounter details:", error)
      toast.error(error.message || "Failed to load encounter note")
    } finally {
      setLoadingDetails(false)
    }
  }

  // Handle Export PDF
  const handleExportPDF = async (encounter: any) => {
    toast.loading("Generating PDF...", { id: "pdf-export" })
    
    try {
      const response = await fetch(`/api/encounters/${encounter.id}`)
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.error || `Failed to fetch encounter details (${response.status})`
        console.error("API Error:", errorMessage, data)
        toast.error(errorMessage, { id: "pdf-export" })
        return
      }
      
      // Generate and download PDF
      generateEncounterPDF(data)
      toast.success("PDF exported successfully", { id: "pdf-export" })
    } catch (error: any) {
      console.error("Error exporting PDF:", error)
      toast.error(error.message || "Failed to export PDF", { id: "pdf-export" })
    }
  }

  // Handle Save Note
  const handleSaveNote = async () => {
    if (!selectedEncounter) return
    
    // Check cooldown before attempting save
    if (noteMetadata && !noteMetadata.canEdit) {
      const nextDate = noteMetadata.nextEditDate
        ? new Date(noteMetadata.nextEditDate).toLocaleDateString()
        : "later"
      toast.error(
        `Note cannot be edited until ${nextDate}. This note was last edited ${noteMetadata.daysRemaining} day${noteMetadata.daysRemaining !== 1 ? "s" : ""} ago.`
      )
      return
    }
    
    setSavingNote(true)
    try {
      // Check if at least one vital sign value is present
      const hasVitals = editingVitals.systolic_bp !== null ||
                       editingVitals.diastolic_bp !== null ||
                       editingVitals.heart_rate !== null ||
                       editingVitals.respiratory_rate !== null ||
                       editingVitals.temperature !== null ||
                       editingVitals.oxygen_saturation !== null ||
                       editingVitals.weight !== null ||
                       editingVitals.height_feet !== null ||
                       editingVitals.height_inches !== null ||
                       editingVitals.pain_scale !== null;

      // Ensure objective includes the latest vitals text before saving
      const objectiveWithVitals = hasVitals 
        ? updateObjectiveWithVitals(editingNote.objective) 
        : editingNote.objective

      const requestBody = {
        patient_id: selectedEncounter.patient_id,
        provider_id: selectedEncounter.provider_id,
        note: {
          subjective: editingNote.subjective,
          objective: objectiveWithVitals,
          assessment: editingNote.assessment,
          plan: editingNote.plan,
        },
        noteId: editingNote.noteId, // Include noteId if updating existing note
        // Include vital signs if any are provided
        vitals: hasVitals ? editingVitals : undefined,
      }

      console.log('Saving note with vitals:', {
        hasVitals,
        vitals: hasVitals ? editingVitals : 'none',
        patientId: selectedEncounter.patient_id
      })

      const response = await fetch(`/api/encounters/${selectedEncounter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        // Handle cooldown error specifically
        if (response.status === 403 && responseData.cooldown_active) {
          const nextDate = responseData.next_edit_date
            ? new Date(responseData.next_edit_date).toLocaleDateString()
            : "later"
          toast.error(
            responseData.message || `Note cannot be edited until ${nextDate}. This note was last edited ${responseData.days_since_edit} day${responseData.days_since_edit !== 1 ? "s" : ""} ago.`
          )
          // Update metadata to reflect cooldown
          if (noteMetadata) {
            setNoteMetadata({
              ...noteMetadata,
              canEdit: false,
              daysRemaining: responseData.days_remaining,
              nextEditDate: responseData.next_edit_date,
            })
          }
          return
        }
        
        // Handle migration-related errors
        if (responseData.error?.includes("encounter_note_alerts") || responseData.error?.includes("migration")) {
          toast.warning("Note saved successfully, but alert system may not be fully configured. Please ensure migration 024_encounter_note_enhancements.sql has been run.")
          setShowEditNote(false)
          setNoteMetadata(null)
          mutate() // Refresh encounter list
          return
        }
        
        throw new Error(responseData.error || "Failed to save note")
      }

      // Check if vitals were saved
      const vitalsSaved = responseData.vitalsSaved || false
      
      if (vitalsSaved) {
        toast.success("Note and vital signs saved successfully. Vital signs will appear in the Patient Vitals tab.")
      } else {
        toast.success("Note saved successfully. An alert has been created in the Patient Chart Encounter Notes tab.")
      }
      
      setShowEditNote(false)
      setNoteMetadata(null)
      mutate() // Refresh encounter list
      
      // Trigger refresh of Patient Chart if it's open (works across browser tabs)
      if (selectedEncounter?.patient_id) {
        console.log('Dispatching patient-data-updated event for patient:', selectedEncounter.patient_id, 'vitalsSaved:', vitalsSaved);
        
        // Use setTimeout to ensure the event is dispatched after the response is processed
        setTimeout(() => {
          const eventData = { 
            patientId: selectedEncounter.patient_id, 
            vitalsUpdated: vitalsSaved,
            timestamp: Date.now(),
            hasVitalsInRequest: hasVitals
          };
          
          console.log('=== SENDING VITALS UPDATE NOTIFICATION ===');
          console.log('Patient ID:', selectedEncounter.patient_id);
          console.log('Vitals saved to database:', vitalsSaved);
          console.log('Vitals included in request:', hasVitals);
          console.log('Event data:', eventData);
          
          // Dispatch custom event for same-tab communication
          const event = new CustomEvent('patient-data-updated', { detail: eventData });
          window.dispatchEvent(event);
          console.log('Event dispatched (same tab)');
          
          // Use BroadcastChannel for cross-tab communication
          try {
            const channel = new BroadcastChannel('patient-vitals-channel');
            channel.postMessage(eventData);
            console.log('BroadcastChannel message sent (cross-tab)');
            channel.close();
          } catch (e) {
            console.log('BroadcastChannel not supported, using localStorage fallback');
            // Fallback to localStorage for older browsers
            localStorage.setItem('patient-vitals-update', JSON.stringify(eventData));
          }
          
          console.log('=== NOTIFICATION SENT ===');
        }, 100);
      }
    } catch (error: any) {
      console.error("Error saving note:", error)
      toast.error(error.message || "Failed to save note")
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Patient Encounters</h1>
              <p className="text-muted-foreground">Comprehensive clinical documentation and charting</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary-care">Primary Care</SelectItem>
                  <SelectItem value="behavioral-health">Behavioral Health</SelectItem>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="obgyn">OB/GYN</SelectItem>
                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="podiatry">Podiatry</SelectItem>
                  <SelectItem value="dermatology">Dermatology</SelectItem>
                  <SelectItem value="urgent-care">Urgent Care</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowNewEncounter(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Encounter
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Encounters</p>
                    <p className="text-2xl font-bold">{stats.todayCount}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Notes</p>
                    <p className="text-2xl font-bold">{stats.pendingNotes}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Templates */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Quick Templates</CardTitle>
                <Badge variant="outline">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {noteTemplates
                  .filter((t) => t.specialty === "all" || t.specialty === selectedSpecialty)
                  .sort((a, b) => {
                    const aFav = favoriteTemplates.includes(a.id) ? -1 : 1
                    const bFav = favoriteTemplates.includes(b.id) ? -1 : 1
                    return aFav - bFav
                  })
                  .map((template) => {
                    const Icon = template.icon
                    const isFavorite = favoriteTemplates.includes(template.id)
                    return (
                      <div
                        key={template.id}
                        className="inline-flex items-center gap-2"
                      >
                        <Button
                          variant={isFavorite ? "default" : "outline"}
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            setShowNewEncounter(true)
                            // Pre-fill template
                          }}
                        >
                          <Icon className="h-4 w-4" />
                          {template.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(template.id)
                          }}
                        >
                          {isFavorite ? (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Encounters List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Encounters</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search encounters..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-[250px]"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredEncounters.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">No encounters found</h3>
                  <p className="text-muted-foreground mb-4">Start a new encounter to begin documenting</p>
                  <Button onClick={() => setShowNewEncounter(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Encounter
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Chief Complaint</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEncounters.map((encounter: any) => (
                      <TableRow key={encounter.id}>
                        <TableCell className="font-medium">{encounter.patient_name}</TableCell>
                        <TableCell>
                          {new Date(encounter.encounter_date).toLocaleDateString()}{" "}
                          {new Date(encounter.encounter_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{encounter.encounter_type?.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{encounter.chief_complaint}</TableCell>
                        <TableCell>{encounter.provider_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              encounter.status === "completed"
                                ? "default"
                                : encounter.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {encounter.status?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(encounter)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditNote(encounter)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Note
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy to New
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportPDF(encounter)}>
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* New Encounter Dialog */}
          <Dialog open={showNewEncounter} onOpenChange={setShowNewEncounter}>
            <DialogContent className="!w-[95vw] !max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
              <DialogHeader className="shrink-0 px-8 py-6 border-b bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3">
                        New Patient Encounter
                        <Badge variant="outline" className="text-sm font-medium capitalize px-3 py-1">
                          {selectedSpecialty.replace("-", " ")}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="text-base mt-1">
                        Complete clinical documentation with AI-assisted charting
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1.5 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Auto-saving
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <Tabs
                value={encounterTab}
                onValueChange={setEncounterTab}
                className="flex-1 overflow-hidden flex flex-col min-h-0"
              >
                <div className="shrink-0 px-8 py-4 bg-muted/30 border-b">
                  <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-muted/50 p-1.5 gap-1 w-auto">
                    <TabsTrigger 
                      value="chief-complaint" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      CC/HPI
                    </TabsTrigger>
                    <TabsTrigger 
                      value="vitals" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Vitals
                    </TabsTrigger>
                    <TabsTrigger 
                      value="ros" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <Clipboard className="h-4 w-4 mr-2" />
                      ROS
                    </TabsTrigger>
                    <TabsTrigger 
                      value="exam" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <ScanFace className="h-4 w-4 mr-2" />
                      Physical Exam
                    </TabsTrigger>
                    <TabsTrigger 
                      value="assessment" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Assessment
                    </TabsTrigger>
                    <TabsTrigger 
                      value="plan" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Plan
                    </TabsTrigger>
                    <TabsTrigger 
                      value="diagnoses" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Diagnoses
                    </TabsTrigger>
                    <TabsTrigger 
                      value="review" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Review
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Chief Complaint / HPI Tab */}
                <TabsContent value="chief-complaint" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-6 p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="patient-select" className="text-sm font-semibold">
                          Patient <span className="text-destructive">*</span>
                        </Label>
                        <div className="space-y-3">
                          <Input
                            id="patient-search"
                            placeholder="Search by name, MRN, or client number..."
                            value={patientSearchQuery}
                            onChange={(e) => {
                              setPatientSearchQuery(e.target.value)
                              setPatientValidationError("")
                            }}
                            className={`h-11 ${patientValidationError ? "border-destructive ring-destructive/20 ring-2" : ""}`}
                          />
                          <Select
                            value={selectedPatient}
                            onValueChange={(value) => {
                              setSelectedPatient(value)
                              setPatientValidationError("")
                              setPatientSearchQuery("") // Clear search when patient is selected
                            }}
                          >
                            <SelectTrigger
                              id="patient-select"
                              className={`h-11 ${patientValidationError ? "border-destructive ring-destructive/20 ring-2" : ""}`}
                            >
                              <SelectValue placeholder="Select patient from list below" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {patients.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                  {patientSearchQuery
                                    ? "No patients found matching your search"
                                    : "No patients available"}
                                </div>
                              ) : (
                                patients.map((p: any) => {
                                  const patientNumber = p.client_number || p.mrn || ""
                                  const displayName = `${p.first_name} ${p.last_name}`
                                  return (
                                    <SelectItem key={p.id} value={p.id}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{displayName}</span>
                                        {patientNumber && (
                                          <span className="text-xs text-muted-foreground">
                                            {p.client_number ? `Client #: ${p.client_number}` : `MRN: ${p.mrn}`}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  )
                                })
                              )}
                            </SelectContent>
                          </Select>
                          {patientValidationError && (
                            <p className="text-sm text-destructive flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4" />
                              {patientValidationError}
                            </p>
                          )}
                          {selectedPatient && (
                            <div className="text-xs text-muted-foreground">
                              Selected: {allPatients.find((p: any) => p.id === selectedPatient)?.first_name}{" "}
                              {allPatients.find((p: any) => p.id === selectedPatient)?.last_name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Provider <span className="text-destructive">*</span></Label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                Dr. {p.first_name} {p.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Encounter Type <span className="text-destructive">*</span></Label>
                        <Select value={encounterType} onValueChange={setEncounterType}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {encounterTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Chief Complaint</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVoiceDictation("chiefComplaint")}
                          className={isListening && activeVoiceField === "chiefComplaint" ? "text-red-500" : ""}
                        >
                          {isListening && activeVoiceField === "chiefComplaint" ? (
                            <MicOff className="h-4 w-4 mr-1" />
                          ) : (
                            <Mic className="h-4 w-4 mr-1" />
                          )}
                          {isListening && activeVoiceField === "chiefComplaint" ? "Stop" : "Dictate"}
                        </Button>
                      </div>
                      <Textarea
                        value={chiefComplaint}
                        onChange={(e) => handleChiefComplaintChange(e.target.value)}
                        placeholder="Enter chief complaint... (Use .shortcuts for quick text)"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Shortcuts: .cc .hx .dx .rx .wnl .nad .aox3 .rrr .cta .sntnd
                      </p>
                    </div>

                    {/* HPI Builder */}
                    <Card className="border-2 shadow-sm">
                      <CardHeader className="pb-4 bg-muted/30">
                        <CardTitle className="text-lg font-semibold flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                            <Clipboard className="h-4 w-4 text-primary" />
                          </div>
                          History of Present Illness (HPI) Builder
                        </CardTitle>
                        <CardDescription className="text-sm">Complete 4+ elements for detailed HPI documentation</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Location</Label>
                            <Input
                              value={hpiElements.location}
                              onChange={(e) => handleHPILocationChange(e.target.value)}
                              placeholder="e.g., Right lower quadrant"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Quality</Label>
                            <Input
                              value={hpiElements.quality}
                              onChange={(e) => handleHPIQualityChange(e.target.value)}
                              placeholder="e.g., Sharp, dull, burning"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Severity (1-10)</Label>
                            <Input
                              value={hpiElements.severity}
                              onChange={(e) => handleHPISeverityChange(e.target.value)}
                              placeholder="e.g., 7"
                              type="number"
                              min="1"
                              max="10"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Duration</Label>
                            <Input
                              value={hpiElements.duration}
                              onChange={(e) => handleHPIDurationChange(e.target.value)}
                              placeholder="e.g., 3 days"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Timing</Label>
                            <Input
                              value={hpiElements.timing}
                              onChange={(e) => handleHPITimingChange(e.target.value)}
                              placeholder="e.g., Constant, intermittent"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Context</Label>
                            <Input
                              value={hpiElements.context}
                              onChange={(e) => handleHPIContextChange(e.target.value)}
                              placeholder="e.g., After eating"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Modifying Factors</Label>
                            <Input
                              value={hpiElements.modifyingFactors}
                              onChange={(e) => handleHPIModifyingFactorsChange(e.target.value)}
                              placeholder="e.g., Worse with movement"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Associated Signs/Symptoms</Label>
                            <Input
                              value={hpiElements.associatedSigns}
                              onChange={(e) => handleHPIAssociatedSignsChange(e.target.value)}
                              placeholder="e.g., Nausea, fever"
                              className="h-10"
                            />
                          </div>
                        </div>

                        {generateHPIText() && (
                          <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <Label className="text-sm font-semibold text-primary">Generated HPI:</Label>
                            <p className="text-sm mt-2 text-foreground/80 leading-relaxed">{generateHPIText()}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Additional Subjective Notes</Label>
                        <Button variant="ghost" size="sm" onClick={() => toggleVoiceDictation("subjective")}>
                          <Mic className="h-4 w-4 mr-1" />
                          Dictate
                        </Button>
                      </div>
                      <Textarea
                        value={subjective}
                        onChange={(e) => handleSubjectiveNotesChange(e.target.value)}
                        placeholder="Additional history, patient statements..."
                        rows={4}
                      />
                    </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Vitals Tab */}
                <TabsContent value="vitals" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-6 p-8">
                    {/* Patient Selection */}
                    <div className="space-y-3">
                      <Label htmlFor="vitals-patient-select" className="text-sm font-semibold">
                        Patient <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={selectedPatient}
                        onValueChange={(value) => {
                          setSelectedPatient(value)
                          setPatientValidationError("")
                        }}
                      >
                        <SelectTrigger
                          id="vitals-patient-select"
                          className={`h-11 ${patientValidationError ? "border-destructive ring-destructive/20 ring-2" : ""}`}
                        >
                          <SelectValue placeholder="Select patient..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {allPatients.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No patients available
                            </div>
                          ) : (
                            allPatients.map((p: any) => {
                              const patientNumber = p.client_number || p.mrn || ""
                              const displayName = `${p.first_name} ${p.last_name}`
                              return (
                                <SelectItem key={p.id} value={p.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{displayName}</span>
                                    {patientNumber && (
                                      <span className="text-xs text-muted-foreground">
                                        {p.client_number ? `Client #: ${p.client_number}` : `MRN: ${p.mrn}`}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              )
                            })
                          )}
                        </SelectContent>
                      </Select>
                      {patientValidationError && (
                        <p className="text-sm text-destructive flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" />
                          {patientValidationError}
                        </p>
                      )}
                      {selectedPatient && (
                        <div className="text-xs text-muted-foreground">
                          Selected: {allPatients.find((p: any) => p.id === selectedPatient)?.first_name}{" "}
                          {allPatients.find((p: any) => p.id === selectedPatient)?.last_name}
                        </div>
                      )}
                    </div>

                    <Card className="border-2 shadow-sm">
                      <CardHeader className="pb-4 bg-muted/30">
                        <CardTitle className="text-lg font-semibold flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                            <Activity className="h-4 w-4 text-primary" />
                          </div>
                          Vital Signs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-red-500" />
                              Blood Pressure
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Systolic"
                                value={vitals.systolic_bp ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setVitals((prev) => ({
                                    ...prev,
                                    systolic_bp: value === "" ? null : Number.parseInt(value) || null,
                                  }))
                                }}
                              />
                              <span className="self-center">/</span>
                              <Input
                                type="number"
                                placeholder="Diastolic"
                                value={vitals.diastolic_bp ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setVitals((prev) => ({
                                    ...prev,
                                    diastolic_bp: value === "" ? null : Number.parseInt(value) || null,
                                  }))
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-pink-500" />
                              Heart Rate (bpm)
                            </Label>
                            <Input
                              type="number"
                              value={vitals.heart_rate ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                setVitals((prev) => ({
                                  ...prev,
                                  heart_rate: value === "" ? null : Number.parseInt(value) || null,
                                }))
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Wind className="h-4 w-4 text-blue-500" />
                              Respiratory Rate
                            </Label>
                            <Input
                              type="number"
                              value={vitals.respiratory_rate ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                setVitals((prev) => ({
                                  ...prev,
                                  respiratory_rate: value === "" ? null : Number.parseInt(value) || null,
                                }))
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Thermometer className="h-4 w-4 text-orange-500" />
                              Temperature (°F)
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.1"
                                value={vitals.temperature ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setVitals((prev) => ({
                                    ...prev,
                                    temperature: value === "" ? null : Number.parseFloat(value) || null,
                                  }))
                                }}
                              />
                              <Select
                                value={vitals.temperature_site}
                                onValueChange={(v) => setVitals((prev) => ({ ...prev, temperature_site: v }))}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="oral">Oral</SelectItem>
                                  <SelectItem value="tympanic">Tympanic</SelectItem>
                                  <SelectItem value="axillary">Axillary</SelectItem>
                                  <SelectItem value="rectal">Rectal</SelectItem>
                                  <SelectItem value="temporal">Temporal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Droplets className="h-4 w-4 text-cyan-500" />
                              O2 Saturation (%)
                            </Label>
                            <Input
                              type="number"
                              value={vitals.oxygen_saturation ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                setVitals((prev) => ({
                                  ...prev,
                                  oxygen_saturation: value === "" ? null : Number.parseInt(value) || null,
                                }))
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Scale className="h-4 w-4 text-green-500" />
                              Weight
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.1"
                                value={vitals.weight ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setVitals((prev) => ({
                                    ...prev,
                                    weight: value === "" ? null : Number.parseFloat(value) || null,
                                  }))
                                }}
                              />
                              <Select
                                value={vitals.weight_unit}
                                onValueChange={(v) => setVitals((prev) => ({ ...prev, weight_unit: v }))}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lbs">lbs</SelectItem>
                                  <SelectItem value="kg">kg</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Ruler className="h-4 w-4 text-purple-500" />
                              Height
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="ft"
                                value={vitals.height_feet ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setVitals((prev) => ({
                                    ...prev,
                                    height_feet: value === "" ? null : Number.parseInt(value) || null,
                                  }))
                                }}
                                className="w-16"
                              />
                              <span className="self-center">'</span>
                              <Input
                                type="number"
                                placeholder="in"
                                value={vitals.height_inches ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setVitals((prev) => ({
                                    ...prev,
                                    height_inches: value === "" ? null : Number.parseInt(value) || null,
                                  }))
                                }}
                                className="w-16"
                              />
                              <span className="self-center">"</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Gauge className="h-4 w-4 text-indigo-500" />
                              BMI (calculated)
                            </Label>
                            <Input type="number" value={vitals.bmi || ""} readOnly className="bg-muted" />
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Pain Scale (0-10)</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                value={vitals.pain_scale ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setVitals((prev) => ({
                                    ...prev,
                                    pain_scale: value === "" ? null : Number.parseInt(value) || null,
                                  }))
                                }}
                                className="w-20"
                              />
                              <Input
                                placeholder="Pain location"
                                value={vitals.pain_location || ""}
                                onChange={(e) => setVitals((prev) => ({ ...prev, pain_location: e.target.value }))}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Vital Signs Notes</Label>
                            <Input
                              value={vitals.notes || ""}
                              onChange={(e) => setVitals((prev) => ({ ...prev, notes: e.target.value }))}
                              placeholder="Additional notes..."
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* ROS Tab */}
                <TabsContent value="ros" className="flex-1 overflow-hidden mt-0 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-8">
                    <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4 border">
                      <div>
                        <h3 className="text-lg font-semibold">Review of Systems</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Check positive findings. Unchecked items are assumed negative.
                        </p>
                      </div>
                      <Button variant="outline" onClick={setAllRosToNormal} className="h-10 px-4">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Set All Normal
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {reviewOfSystemsCategories.map((category) => {
                        const categoryFindings = rosFindings[category.id] || { checked: [], notes: "" }
                        return (
                          <Card key={category.id} className="border shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3 bg-muted/20">
                              <CardTitle className="text-sm font-semibold">{category.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="flex flex-wrap gap-2 mb-4">
                                {category.items.map((item) => {
                                  const isChecked = categoryFindings.checked?.includes(item) || false
                                  return (
                                    <Button
                                      key={item}
                                      variant={isChecked ? "default" : "outline"}
                                      size="sm"
                                      type="button"
                                      onClick={() => {
                                        setRosFindings((prev) => {
                                          const current = prev[category.id] || { checked: [], notes: "" }
                                          const newChecked = isChecked
                                            ? current.checked.filter((i) => i !== item)
                                            : [...current.checked, item]
                                          return {
                                            ...prev,
                                            [category.id]: {
                                              ...current,
                                              checked: newChecked,
                                              notes:
                                                newChecked.length > 0
                                                  ? `Positive for: ${newChecked.join(", ")}. Denies other ${category.label.toLowerCase()} symptoms.`
                                                  : category.normalText,
                                            },
                                          }
                                        })
                                        setAllRosNormal(false)
                                      }}
                                    >
                                      {item}
                                    </Button>
                                  )
                                })}
                              </div>
                              <Textarea
                                placeholder={category.normalText}
                                value={categoryFindings.notes || ""}
                                onChange={(e) =>
                                  setRosFindings((prev) => ({
                                    ...prev,
                                    [category.id]: {
                                      checked: prev[category.id]?.checked || [],
                                      notes: e.target.value,
                                    },
                                  }))
                                }
                                rows={2}
                                className="text-sm resize-y"
                              />
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Physical Exam Tab */}
                <TabsContent value="exam" className="flex-1 overflow-hidden mt-0 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-8">
                    <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4 border">
                      <div>
                        <h3 className="text-lg font-semibold">Physical Examination</h3>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {selectedSpecialty.replace("-", " ")} examination template
                        </p>
                      </div>
                      <Button variant="outline" onClick={setAllExamToNormal} type="button" className="h-10 px-4">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Set All Normal
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {examTemplate.map((section) => {
                        const sectionFindings = examFindings[section.section] || {
                          findings: [],
                          notes: "",
                          normal: false,
                        }
                        return (
                          <Card key={section.section} className="border shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold">{section.section}</CardTitle>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs font-medium">Normal</Label>
                                  <Switch
                                    checked={sectionFindings.normal || false}
                                    onCheckedChange={(checked) => {
                                      setExamFindings((prev) => ({
                                        ...prev,
                                        [section.section]: {
                                          findings: checked ? section.findings : [],
                                          notes: checked ? section.normalText : "",
                                          normal: checked,
                                        },
                                      }))
                                      setAllExamNormal(false)
                                    }}
                                  />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="flex flex-wrap gap-2 mb-4">
                                {section.findings.map((finding) => {
                                  const isSelected = sectionFindings.findings?.includes(finding) || false
                                  return (
                                    <Button
                                      key={finding}
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      type="button"
                                      onClick={() => {
                                        setExamFindings((prev) => {
                                          const current = prev[section.section] || {
                                            findings: [],
                                            notes: "",
                                            normal: false,
                                          }
                                          const newFindings = isSelected
                                            ? current.findings.filter((f) => f !== finding)
                                            : [...current.findings, finding]
                                          return {
                                            ...prev,
                                            [section.section]: {
                                              ...current,
                                              findings: newFindings,
                                              normal: false,
                                            },
                                          }
                                        })
                                        setAllExamNormal(false)
                                      }}
                                    >
                                      {finding}
                                    </Button>
                                  )
                                })}
                              </div>
                              <Textarea
                                placeholder={section.normalText || "Examination findings..."}
                                value={sectionFindings.notes || ""}
                                onChange={(e) =>
                                  setExamFindings((prev) => {
                                    const current = prev[section.section] || {
                                      findings: [],
                                      notes: "",
                                      normal: false,
                                    }
                                    return {
                                      ...prev,
                                      [section.section]: {
                                        ...current,
                                        notes: e.target.value,
                                        normal: false,
                                      },
                                    }
                                  })
                                }
                                rows={2}
                                className="text-sm resize-y"
                              />
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Objective Notes</Label>
                      <Textarea
                        value={objective}
                        onChange={(e) => handleSmartText(e.target.value, setObjective)}
                        placeholder="Additional examination findings, lab results..."
                        rows={3}
                        className="resize-y"
                      />
                    </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Assessment Tab */}
                <TabsContent value="assessment" className="flex-1 overflow-hidden mt-0 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-8">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Clinical Assessment</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          type="button"
                          onClick={() => toggleVoiceDictation("assessment")}
                          className={isListening && activeVoiceField === "assessment" ? "text-red-500" : ""}
                        >
                          {isListening && activeVoiceField === "assessment" ? (
                            <MicOff className="h-4 w-4 mr-1" />
                          ) : (
                            <Mic className="h-4 w-4 mr-1" />
                          )}
                          {isListening && activeVoiceField === "assessment" ? "Stop" : "Dictate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => aiEnhanceNote(assessment, "assessment")}
                          disabled={isAiProcessing}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Enhance
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={assessment}
                      onChange={(e) => handleSmartText(e.target.value, setAssessment)}
                      placeholder="Clinical impressions, diagnosis rationale, differential diagnoses..."
                      rows={8}
                      className="resize-y"
                    />
                    </div>
                  </div>
                </TabsContent>

                {/* Plan Tab */}
                <TabsContent value="plan" className="flex-1 overflow-hidden mt-0 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-8">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Treatment Plan</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          type="button"
                          onClick={() => toggleVoiceDictation("plan")}
                          className={isListening && activeVoiceField === "plan" ? "text-red-500" : ""}
                        >
                          {isListening && activeVoiceField === "plan" ? (
                            <MicOff className="h-4 w-4 mr-1" />
                          ) : (
                            <Mic className="h-4 w-4 mr-1" />
                          )}
                          {isListening && activeVoiceField === "plan" ? "Stop" : "Dictate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => aiEnhanceNote(plan, "plan")}
                          disabled={isAiProcessing}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Enhance
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={plan}
                      onChange={(e) => handleSmartText(e.target.value, setPlan)}
                      placeholder="Treatment plan, medications, follow-up instructions, referrals..."
                      rows={8}
                      className="resize-y"
                    />
                    </div>
                  </div>
                </TabsContent>

                {/* Diagnoses Tab */}
                <TabsContent value="diagnoses" className="flex-1 overflow-hidden mt-0 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-8">
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">Search ICD-10 Diagnosis Codes</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by code or description..."
                          value={diagnosisSearch}
                          onChange={(e) => {
                            setDiagnosisSearch(e.target.value)
                            searchDiagnosis(e.target.value)
                          }}
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>

                    {diagnosisResults.length > 0 && (
                      <Card>
                        <CardContent className="p-2">
                          <div className="max-h-[200px] overflow-y-auto">
                            {diagnosisResults.map((code: any) => (
                              <div
                                key={code.code}
                                className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                                onClick={() => {
                                  if (!diagnoses.find((d) => d.code === code.code)) {
                                    setDiagnoses((prev) => [
                                      ...prev,
                                      {
                                        code: code.code,
                                        description: code.description,
                                        type: diagnoses.length === 0 ? "primary" : "secondary",
                                      },
                                    ])
                                  }
                                  setDiagnosisSearch("")
                                  setDiagnosisResults([])
                                }}
                              >
                                <div>
                                  <span className="font-mono font-medium">{code.code}</span>
                                  <span className="ml-2 text-sm">{code.description}</span>
                                </div>
                                <Plus className="h-4 w-4" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-2">
                      <Label>Selected Diagnoses</Label>
                      {diagnoses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No diagnoses added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {diagnoses.map((dx, idx) => (
                            <div key={dx.code} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant={dx.type === "primary" ? "default" : "secondary"}>
                                  {dx.type === "primary" ? "Primary" : "Secondary"}
                                </Badge>
                                <span className="font-mono">{dx.code}</span>
                                <span>{dx.description}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={() => {
                                    setDiagnoses((prev) =>
                                      prev.map((d, i) => ({
                                        ...d,
                                        type: i === idx ? "primary" : "secondary",
                                      })),
                                    )
                                  }}
                                  disabled={dx.type === "primary"}
                                >
                                  Set Primary
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  type="button"
                                  onClick={() => setDiagnoses((prev) => prev.filter((_, i) => i !== idx))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review" className="flex-1 overflow-hidden mt-0 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-8">
                    <Card className="border-2 shadow-sm">
                      <CardHeader className="pb-4 bg-muted/30">
                        <CardTitle className="text-xl font-semibold flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          Encounter Summary
                        </CardTitle>
                        <CardDescription className="text-sm">Review all information before signing</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div>
                          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            SUBJECTIVE
                          </h4>
                          <div className="p-4 bg-muted/50 rounded-xl text-sm whitespace-pre-wrap leading-relaxed border">
                            <strong>Chief Complaint:</strong> {chiefComplaint || "Not documented"}
                            {generateHPIText() && (
                              <>
                                {"\n\n"}
                                <strong>HPI:</strong> {generateHPIText()}
                              </>
                            )}
                            {subjective && (
                              <>
                                {"\n\n"}
                                <strong>Additional Notes:</strong> {subjective}
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            OBJECTIVE
                          </h4>
                          <div className="p-4 bg-muted/50 rounded-xl text-sm whitespace-pre-wrap leading-relaxed border">
                            {generateObjectiveText() || "Not documented"}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            ASSESSMENT
                          </h4>
                          <div className="p-4 bg-muted/50 rounded-xl text-sm whitespace-pre-wrap leading-relaxed border">
                            {assessment || "Not documented"}
                            {diagnoses.length > 0 && (
                              <>
                                {"\n\n"}
                                <strong>Diagnoses:</strong>
                                {diagnoses.map((dx) => `\n• ${dx.code} - ${dx.description} (${dx.type})`).join("")}
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            PLAN
                          </h4>
                          <div className="p-4 bg-muted/50 rounded-xl text-sm whitespace-pre-wrap leading-relaxed border">
                            {plan || "Not documented"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex justify-between items-center border-t px-8 py-5 bg-muted/30 shrink-0">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewEncounter(false)}
                    className="h-11 px-5"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetEncounterForm}
                    className="h-11 px-5"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Form
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => saveEncounter("draft")} 
                    disabled={isSaving}
                    className="h-11 px-6"
                  >
                    {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save as Draft
                  </Button>
                  <Button 
                    onClick={handleSignAndComplete} 
                    disabled={isSaving}
                    className="h-11 px-6 bg-primary hover:bg-primary/90 shadow-md"
                  >
                    {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Sign & Complete
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Details Dialog */}
          <Dialog open={showViewDetails} onOpenChange={setShowViewDetails}>
            <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
              <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Encounter Details
                </DialogTitle>
                <DialogDescription>View comprehensive encounter information</DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-y-auto px-6">
                {loadingDetails ? (
                  <div className="space-y-4 py-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : encounterDetails ? (
                  <div className="space-y-4 py-4">
                    {/* Patient Information */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Patient Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</Label>
                            <p className="font-medium text-sm">
                              {encounterDetails.encounter?.patients
                                ? `${encounterDetails.encounter.patients.first_name} ${encounterDetails.encounter.patients.last_name}`
                                : "Unknown"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date of Birth</Label>
                            <p className="font-medium text-sm">
                              {encounterDetails.encounter?.patients?.date_of_birth
                                ? new Date(encounterDetails.encounter.patients.date_of_birth).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gender</Label>
                            <p className="font-medium text-sm">{encounterDetails.encounter?.patients?.gender || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</Label>
                            <p className="font-medium text-sm">{encounterDetails.encounter?.patients?.phone || "N/A"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Encounter Information */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Encounter Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date/Time</Label>
                            <p className="font-medium text-sm">
                              {encounterDetails.encounter?.appointment_date
                                ? new Date(encounterDetails.encounter.appointment_date).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
                            <div>
                              <Badge variant="outline" className="text-xs">
                                {encounterDetails.encounter?.appointment_type?.replace(/_/g, " ") || "N/A"}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provider</Label>
                            <p className="font-medium text-sm">
                              {encounterDetails.encounter?.providers
                                ? `Dr. ${encounterDetails.encounter.providers.first_name} ${encounterDetails.encounter.providers.last_name}`
                                : "Unknown Provider"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                            <div>
                              <Badge
                                variant={
                                  encounterDetails.encounter?.status === "completed"
                                    ? "default"
                                    : encounterDetails.encounter?.status === "in_progress"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {encounterDetails.encounter?.status?.replace(/_/g, " ") || "N/A"}
                              </Badge>
                            </div>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chief Complaint</Label>
                            <p className="font-medium text-sm">
                              {encounterDetails.encounter?.notes || "No chief complaint recorded"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Progress Note */}
                    {encounterDetails.encounterNote && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Progress Note (SOAP)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {encounterDetails.encounterNote.subjective && (
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subjective</Label>
                              <div className="max-h-[250px] w-full rounded-md border border-border/50 bg-muted p-4 overflow-y-auto">
                                <div className="text-sm whitespace-pre-wrap">
                                  {encounterDetails.encounterNote.subjective}
                                </div>
                              </div>
                            </div>
                          )}
                          {encounterDetails.encounterNote.objective && (
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Objective</Label>
                              <div className="max-h-[250px] w-full rounded-md border border-border/50 bg-muted p-4 overflow-y-auto">
                                <div className="text-sm whitespace-pre-wrap">
                                  {encounterDetails.encounterNote.objective}
                                </div>
                              </div>
                            </div>
                          )}
                          {encounterDetails.encounterNote.assessment && (
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assessment</Label>
                              <div className="max-h-[250px] w-full rounded-md border border-border/50 bg-muted p-4 overflow-y-auto">
                                <div className="text-sm whitespace-pre-wrap">
                                  {encounterDetails.encounterNote.assessment}
                                </div>
                              </div>
                            </div>
                          )}
                          {encounterDetails.encounterNote.plan && (
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan</Label>
                              <div className="max-h-[250px] w-full rounded-md border border-border/50 bg-muted p-4 overflow-y-auto">
                                <div className="text-sm whitespace-pre-wrap">
                                  {encounterDetails.encounterNote.plan}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Vital Signs */}
                    {encounterDetails.vitals && encounterDetails.vitals.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Vital Signs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {encounterDetails.vitals.slice(0, 1).map((vital: any, idx: number) => (
                              <React.Fragment key={`vital-${idx}`}>
                                {vital.systolic_bp && vital.diastolic_bp && (
                                  <div key={`bp-${idx}`} className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Blood Pressure</Label>
                                    <p className="font-medium text-sm">
                                      {vital.systolic_bp}/{vital.diastolic_bp} mmHg
                                    </p>
                                  </div>
                                )}
                                {vital.heart_rate && (
                                  <div key={`hr-${idx}`} className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Heart Rate</Label>
                                    <p className="font-medium text-sm">{vital.heart_rate} bpm</p>
                                  </div>
                                )}
                                {vital.temperature && (
                                  <div key={`temp-${idx}`} className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Temperature</Label>
                                    <p className="font-medium text-sm">{vital.temperature}°F</p>
                                  </div>
                                )}
                                {vital.weight && (
                                  <div key={`weight-${idx}`} className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weight</Label>
                                    <p className="font-medium text-sm">
                                      {vital.weight} {vital.weight_unit || "lbs"}
                                    </p>
                                  </div>
                                )}
                                {vital.oxygen_saturation && (
                                  <div key={`o2-${idx}`} className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">O2 Saturation</Label>
                                    <p className="font-medium text-sm">{vital.oxygen_saturation}%</p>
                                  </div>
                                )}
                                {vital.respiratory_rate && (
                                  <div key={`rr-${idx}`} className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Respiratory Rate</Label>
                                    <p className="font-medium text-sm">{vital.respiratory_rate} /min</p>
                                  </div>
                                )}
                                {vital.bmi && (
                                  <div key={`bmi-${idx}`} className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">BMI</Label>
                                    <p className="font-medium text-sm">{vital.bmi}</p>
                                  </div>
                                )}
                                {vital.pain_scale !== null && vital.pain_scale !== undefined && (
                                  <div key={`pain-${idx}`} className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pain Scale</Label>
                                    <p className="font-medium text-sm">{vital.pain_scale}/10</p>
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Medications */}
                    {encounterDetails.medications && encounterDetails.medications.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Active Medications</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {encounterDetails.medications.map((med: any) => (
                              <div key={med.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                  <p className="font-medium text-sm">{med.medication_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {med.dosage} {med.frequency} - {med.route}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Assessments */}
                    {encounterDetails.assessments && encounterDetails.assessments.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Assessments</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {encounterDetails.assessments.slice(0, 3).map((assessment: any) => (
                              <div key={assessment.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <p className="text-sm font-medium mb-2">{assessment.assessment_type || "Assessment"}</p>
                                {assessment.diagnosis_codes && assessment.diagnosis_codes.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {assessment.diagnosis_codes.map((code: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {code}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No encounter details available</div>
                )}
              </div>
              <DialogFooter className="shrink-0 border-t px-6 py-4">
                <Button variant="outline" onClick={() => setShowViewDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Note Dialog */}
          <Dialog open={showEditNote} onOpenChange={setShowEditNote}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Progress Note
                </DialogTitle>
                <DialogDescription>Edit the SOAP note for this encounter</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 min-h-0">
                {loadingDetails ? (
                  <div className="space-y-4 py-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    {/* Cooldown Warning Banner */}
                    {noteMetadata && !noteMetadata.canEdit && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-yellow-900 mb-1">Edit Cooldown Active</h4>
                            <p className="text-sm text-yellow-800">
                              This note was last edited {noteMetadata.daysRemaining} day{noteMetadata.daysRemaining !== 1 ? "s" : ""} ago. 
                              You can edit again on {noteMetadata.nextEditDate ? new Date(noteMetadata.nextEditDate).toLocaleDateString() : "a future date"}.
                            </p>
                            <p className="text-xs text-yellow-700 mt-2">
                              Note: Admin and Super Admin users can bypass this restriction.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Edit History */}
                    {noteMetadata && noteMetadata.edit_count > 0 && (
                      <div className="bg-muted border rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            {noteMetadata.last_edited_at && (
                              <p className="text-muted-foreground">
                                Last edited: {new Date(noteMetadata.last_edited_at).toLocaleString()}
                                {noteMetadata.lastEditorName && ` by ${noteMetadata.lastEditorName}`}
                              </p>
                            )}
                            <p className="text-muted-foreground">
                              Total edits: {noteMetadata.edit_count}
                            </p>
                            {noteMetadata.original_created_at && (
                              <p className="text-muted-foreground">
                                Original created: {new Date(noteMetadata.original_created_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          {noteMetadata.canEdit && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Edit Available
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="subjective">Subjective</Label>
                      <Textarea
                        id="subjective"
                        placeholder="Enter subjective information..."
                        value={editingNote.subjective}
                        onChange={(e) => setEditingNote({ ...editingNote, subjective: e.target.value })}
                        className="mt-2 min-h-[100px]"
                        disabled={noteMetadata ? !noteMetadata.canEdit : false}
                      />
                    </div>
                    <div>
                      <Label htmlFor="objective">Objective</Label>
                      <Textarea
                        id="objective"
                        placeholder="Enter objective findings..."
                        value={editingNote.objective}
                        onChange={(e) => setEditingNote({ ...editingNote, objective: e.target.value })}
                        className="mt-2 min-h-[100px]"
                        disabled={noteMetadata ? !noteMetadata.canEdit : false}
                      />
                    </div>
                    <div>
                      <Label htmlFor="assessment">Assessment</Label>
                      <Textarea
                        id="assessment"
                        placeholder="Enter assessment..."
                        value={editingNote.assessment}
                        onChange={(e) => setEditingNote({ ...editingNote, assessment: e.target.value })}
                        className="mt-2 min-h-[100px]"
                        disabled={noteMetadata ? !noteMetadata.canEdit : false}
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan">Plan</Label>
                      <Textarea
                        id="plan"
                        placeholder="Enter treatment plan..."
                        value={editingNote.plan}
                        onChange={(e) => setEditingNote({ ...editingNote, plan: e.target.value })}
                        className="mt-2 min-h-[100px]"
                        disabled={noteMetadata ? !noteMetadata.canEdit : false}
                      />
                    </div>

                    {/* Vital Signs Section */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Vital Signs
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Updates will appear in Patient Vitals tab
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Blood Pressure</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Systolic"
                              value={editingVitals.systolic_bp ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                setEditingVitals((prev) => ({
                                  ...prev,
                                  systolic_bp: value === "" ? null : Number.parseInt(value) || null,
                                }))
                              }}
                              disabled={noteMetadata ? !noteMetadata.canEdit : false}
                              className="text-sm"
                            />
                            <span className="self-center text-sm">/</span>
                            <Input
                              type="number"
                              placeholder="Diastolic"
                              value={editingVitals.diastolic_bp ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                setEditingVitals((prev) => ({
                                  ...prev,
                                  diastolic_bp: value === "" ? null : Number.parseInt(value) || null,
                                }))
                              }}
                              disabled={noteMetadata ? !noteMetadata.canEdit : false}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Heart Rate (bpm)</Label>
                          <Input
                            type="number"
                            placeholder="HR"
                            value={editingVitals.heart_rate ?? ""}
                            onChange={(e) => {
                              const value = e.target.value
                              setEditingVitals((prev) => ({
                                ...prev,
                                heart_rate: value === "" ? null : Number.parseInt(value) || null,
                              }))
                            }}
                            disabled={noteMetadata ? !noteMetadata.canEdit : false}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Respiratory Rate (/min)</Label>
                          <Input
                            type="number"
                            placeholder="RR"
                            value={editingVitals.respiratory_rate ?? ""}
                            onChange={(e) => {
                              const value = e.target.value
                              setEditingVitals((prev) => ({
                                ...prev,
                                respiratory_rate: value === "" ? null : Number.parseInt(value) || null,
                              }))
                            }}
                            disabled={noteMetadata ? !noteMetadata.canEdit : false}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Temperature (°F)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Temp"
                            value={editingVitals.temperature ?? ""}
                            onChange={(e) => {
                              const value = e.target.value
                              setEditingVitals((prev) => ({
                                ...prev,
                                temperature: value === "" ? null : Number.parseFloat(value) || null,
                              }))
                            }}
                            disabled={noteMetadata ? !noteMetadata.canEdit : false}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">O2 Saturation (%)</Label>
                          <Input
                            type="number"
                            placeholder="O2 Sat"
                            value={editingVitals.oxygen_saturation ?? ""}
                            onChange={(e) => {
                              const value = e.target.value
                              setEditingVitals((prev) => ({
                                ...prev,
                                oxygen_saturation: value === "" ? null : Number.parseInt(value) || null,
                              }))
                            }}
                            disabled={noteMetadata ? !noteMetadata.canEdit : false}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Weight ({editingVitals.weight_unit})</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Weight"
                            value={editingVitals.weight ?? ""}
                            onChange={(e) => {
                              const value = e.target.value
                              setEditingVitals((prev) => ({
                                ...prev,
                                weight: value === "" ? null : Number.parseFloat(value) || null,
                              }))
                            }}
                            disabled={noteMetadata ? !noteMetadata.canEdit : false}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Height</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Feet"
                              value={editingVitals.height_feet ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                setEditingVitals((prev) => ({
                                  ...prev,
                                  height_feet: value === "" ? null : Number.parseInt(value) || null,
                                }))
                              }}
                              disabled={noteMetadata ? !noteMetadata.canEdit : false}
                              className="text-sm"
                            />
                            <Input
                              type="number"
                              placeholder="Inches"
                              value={editingVitals.height_inches ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                setEditingVitals((prev) => ({
                                  ...prev,
                                  height_inches: value === "" ? null : Number.parseInt(value) || null,
                                }))
                              }}
                              disabled={noteMetadata ? !noteMetadata.canEdit : false}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Pain Scale (0-10)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            placeholder="Pain"
                            value={editingVitals.pain_scale ?? ""}
                            onChange={(e) => {
                              const value = e.target.value
                              setEditingVitals((prev) => ({
                                ...prev,
                                pain_scale: value === "" ? null : Number.parseInt(value) || null,
                              }))
                            }}
                            disabled={noteMetadata ? !noteMetadata.canEdit : false}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="shrink-0 border-t pt-4 px-6 pb-6 bg-background">
                <Button variant="outline" onClick={() => setShowEditNote(false)} disabled={savingNote}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveNote} 
                  disabled={savingNote || (noteMetadata ? !noteMetadata.canEdit : false)}
                >
                  {savingNote ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Note
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
