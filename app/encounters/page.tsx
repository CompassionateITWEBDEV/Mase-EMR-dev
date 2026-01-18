"use client"

import { useState, useEffect, useRef } from "react"
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

  // Encounter form state
  const [encounterTab, setEncounterTab] = useState("chief-complaint")
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedProvider, setSelectedProvider] = useState("")
  const [encounterType, setEncounterType] = useState("")
  const [chiefComplaint, setChiefComplaint] = useState("")

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

  // Save encounter
  const saveEncounter = async (status: "draft" | "signed" = "draft") => {
    if (!selectedPatient || !selectedProvider) {
      toast.error("Please select a patient and provider")
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

      if (!response.ok) throw new Error("Failed to save encounter")

      const result = await response.json()
      toast.success(status === "signed" ? "Encounter signed and saved" : "Encounter saved as draft")
      setShowNewEncounter(false)
      mutate()

      // Reset form
      resetEncounterForm()
    } catch (error) {
      toast.error("Failed to save encounter")
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
  const patients = data?.patients || []
  const providers = data?.providers || []
  const stats = data?.stats || { todayCount: 0, inProgress: 0, completed: 0, pendingNotes: 0 }

  const filteredEncounters = encounters.filter((enc: any) => {
    const matchesSearch =
      enc.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enc.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || enc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const encounterTypes = encounterTypesBySpecialty[selectedSpecialty] || encounterTypesBySpecialty["primary-care"]
  const examTemplate = physicalExamBySpecialty[selectedSpecialty] || physicalExamBySpecialty["primary-care"]

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
                      <Button
                        key={template.id}
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(template.id)
                          }}
                          className="ml-1"
                        >
                          {isFavorite ? (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-3 w-3" />
                          )}
                        </button>
                      </Button>
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
                              <DropdownMenuItem onClick={() => setSelectedEncounter(encounter)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
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
                              <DropdownMenuItem>
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
            <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  New Patient Encounter
                  <Badge variant="outline" className="ml-2">
                    {selectedSpecialty.replace("-", " ")}
                  </Badge>
                </DialogTitle>
                <DialogDescription>Complete clinical documentation with AI-assisted charting</DialogDescription>
              </DialogHeader>

              <Tabs
                value={encounterTab}
                onValueChange={setEncounterTab}
                className="flex-1 overflow-hidden flex flex-col"
              >
                <TabsList className="grid grid-cols-8 w-full">
                  <TabsTrigger value="chief-complaint">CC/HPI</TabsTrigger>
                  <TabsTrigger value="vitals">Vitals</TabsTrigger>
                  <TabsTrigger value="ros">ROS</TabsTrigger>
                  <TabsTrigger value="exam">Physical Exam</TabsTrigger>
                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                  <TabsTrigger value="plan">Plan</TabsTrigger>
                  <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 pr-4">
                  {/* Chief Complaint / HPI Tab */}
                  <TabsContent value="chief-complaint" className="space-y-4 mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Patient *</Label>
                        <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.first_name} {p.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Provider *</Label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                          <SelectTrigger>
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
                      <div className="space-y-2">
                        <Label>Encounter Type *</Label>
                        <Select value={encounterType} onValueChange={setEncounterType}>
                          <SelectTrigger>
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Chief Complaint</Label>
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
                        onChange={(e) => handleSmartText(e.target.value, setChiefComplaint)}
                        placeholder="Enter chief complaint... (Use .shortcuts for quick text)"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Shortcuts: .cc .hx .dx .rx .wnl .nad .aox3 .rrr .cta .sntnd
                      </p>
                    </div>

                    {/* HPI Builder */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clipboard className="h-4 w-4" />
                          History of Present Illness (HPI) Builder
                        </CardTitle>
                        <CardDescription>Complete 4+ elements for detailed HPI documentation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                              value={hpiElements.location}
                              onChange={(e) => setHpiElements((prev) => ({ ...prev, location: e.target.value }))}
                              placeholder="e.g., Right lower quadrant"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quality</Label>
                            <Input
                              value={hpiElements.quality}
                              onChange={(e) => setHpiElements((prev) => ({ ...prev, quality: e.target.value }))}
                              placeholder="e.g., Sharp, dull, burning"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Severity (1-10)</Label>
                            <Input
                              value={hpiElements.severity}
                              onChange={(e) => setHpiElements((prev) => ({ ...prev, severity: e.target.value }))}
                              placeholder="e.g., 7"
                              type="number"
                              min="1"
                              max="10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration</Label>
                            <Input
                              value={hpiElements.duration}
                              onChange={(e) => setHpiElements((prev) => ({ ...prev, duration: e.target.value }))}
                              placeholder="e.g., 3 days"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Timing</Label>
                            <Input
                              value={hpiElements.timing}
                              onChange={(e) => setHpiElements((prev) => ({ ...prev, timing: e.target.value }))}
                              placeholder="e.g., Constant, intermittent"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Context</Label>
                            <Input
                              value={hpiElements.context}
                              onChange={(e) => setHpiElements((prev) => ({ ...prev, context: e.target.value }))}
                              placeholder="e.g., After eating"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Modifying Factors</Label>
                            <Input
                              value={hpiElements.modifyingFactors}
                              onChange={(e) =>
                                setHpiElements((prev) => ({ ...prev, modifyingFactors: e.target.value }))
                              }
                              placeholder="e.g., Worse with movement"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Associated Signs/Symptoms</Label>
                            <Input
                              value={hpiElements.associatedSigns}
                              onChange={(e) => setHpiElements((prev) => ({ ...prev, associatedSigns: e.target.value }))}
                              placeholder="e.g., Nausea, fever"
                            />
                          </div>
                        </div>

                        {generateHPIText() && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <Label className="text-sm font-medium">Generated HPI:</Label>
                            <p className="text-sm mt-1">{generateHPIText()}</p>
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
                        onChange={(e) => handleSmartText(e.target.value, setSubjective)}
                        placeholder="Additional history, patient statements..."
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  {/* Vitals Tab */}
                  <TabsContent value="vitals" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Vital Signs
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-red-500" />
                              Blood Pressure
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Systolic"
                                value={vitals.systolic_bp || ""}
                                onChange={(e) =>
                                  setVitals((prev) => ({
                                    ...prev,
                                    systolic_bp: Number.parseInt(e.target.value) || null,
                                  }))
                                }
                              />
                              <span className="self-center">/</span>
                              <Input
                                type="number"
                                placeholder="Diastolic"
                                value={vitals.diastolic_bp || ""}
                                onChange={(e) =>
                                  setVitals((prev) => ({
                                    ...prev,
                                    diastolic_bp: Number.parseInt(e.target.value) || null,
                                  }))
                                }
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
                              value={vitals.heart_rate || ""}
                              onChange={(e) =>
                                setVitals((prev) => ({ ...prev, heart_rate: Number.parseInt(e.target.value) || null }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Wind className="h-4 w-4 text-blue-500" />
                              Respiratory Rate
                            </Label>
                            <Input
                              type="number"
                              value={vitals.respiratory_rate || ""}
                              onChange={(e) =>
                                setVitals((prev) => ({
                                  ...prev,
                                  respiratory_rate: Number.parseInt(e.target.value) || null,
                                }))
                              }
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
                                value={vitals.temperature || ""}
                                onChange={(e) =>
                                  setVitals((prev) => ({
                                    ...prev,
                                    temperature: Number.parseFloat(e.target.value) || null,
                                  }))
                                }
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
                              value={vitals.oxygen_saturation || ""}
                              onChange={(e) =>
                                setVitals((prev) => ({
                                  ...prev,
                                  oxygen_saturation: Number.parseInt(e.target.value) || null,
                                }))
                              }
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
                                value={vitals.weight || ""}
                                onChange={(e) =>
                                  setVitals((prev) => ({ ...prev, weight: Number.parseFloat(e.target.value) || null }))
                                }
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
                                onChange={(e) =>
                                  setVitals((prev) => ({
                                    ...prev,
                                    height_feet: Number.parseInt(e.target.value) || null,
                                  }))
                                }
                                className="w-16"
                              />
                              <span className="self-center">'</span>
                              <Input
                                type="number"
                                placeholder="in"
                                value={vitals.height_inches ?? ""}
                                onChange={(e) =>
                                  setVitals((prev) => ({
                                    ...prev,
                                    height_inches: Number.parseInt(e.target.value) || null,
                                  }))
                                }
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
                                onChange={(e) =>
                                  setVitals((prev) => ({
                                    ...prev,
                                    pain_scale: Number.parseInt(e.target.value) || null,
                                  }))
                                }
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
                  </TabsContent>

                  {/* ROS Tab */}
                  <TabsContent value="ros" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Review of Systems</h3>
                        <p className="text-sm text-muted-foreground">
                          Check positive findings. Unchecked items are assumed negative.
                        </p>
                      </div>
                      <Button variant="outline" onClick={setAllRosToNormal}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Set All Normal
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {reviewOfSystemsCategories.map((category) => (
                        <Card key={category.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{category.label}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {category.items.map((item) => {
                                const isChecked = rosFindings[category.id]?.checked?.includes(item) || false
                                return (
                                  <Button
                                    key={item}
                                    variant={isChecked ? "default" : "outline"}
                                    size="sm"
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
                              placeholder="Additional notes..."
                              value={rosFindings[category.id]?.notes || ""}
                              onChange={(e) =>
                                setRosFindings((prev) => ({
                                  ...prev,
                                  [category.id]: {
                                    ...prev[category.id],
                                    notes: e.target.value,
                                  },
                                }))
                              }
                              rows={2}
                              className="text-sm"
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Physical Exam Tab */}
                  <TabsContent value="exam" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Physical Examination</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedSpecialty.replace("-", " ")} examination template
                        </p>
                      </div>
                      <Button variant="outline" onClick={setAllExamToNormal}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Set All Normal
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {examTemplate.map((section) => (
                        <Card key={section.section}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">{section.section}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs">Normal</Label>
                                <Switch
                                  checked={examFindings[section.section]?.normal || false}
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
                          <CardContent>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {section.findings.map((finding) => {
                                const isSelected = examFindings[section.section]?.findings?.includes(finding) || false
                                return (
                                  <Badge
                                    key={finding}
                                    variant={isSelected ? "default" : "outline"}
                                    className="cursor-pointer"
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
                                  </Badge>
                                )
                              })}
                            </div>
                            <Textarea
                              placeholder="Examination findings..."
                              value={examFindings[section.section]?.notes || ""}
                              onChange={(e) =>
                                setExamFindings((prev) => ({
                                  ...prev,
                                  [section.section]: {
                                    ...prev[section.section],
                                    notes: e.target.value,
                                    findings: prev[section.section]?.findings || [],
                                    normal: false,
                                  },
                                }))
                              }
                              rows={2}
                              className="text-sm"
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Objective Notes</Label>
                      <Textarea
                        value={objective}
                        onChange={(e) => handleSmartText(e.target.value, setObjective)}
                        placeholder="Additional examination findings, lab results..."
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  {/* Assessment Tab */}
                  <TabsContent value="assessment" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <Label>Clinical Assessment</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleVoiceDictation("assessment")}>
                          <Mic className="h-4 w-4 mr-1" />
                          Dictate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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
                    />
                  </TabsContent>

                  {/* Plan Tab */}
                  <TabsContent value="plan" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <Label>Treatment Plan</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleVoiceDictation("plan")}>
                          <Mic className="h-4 w-4 mr-1" />
                          Dictate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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
                    />
                  </TabsContent>

                  {/* Diagnoses Tab */}
                  <TabsContent value="diagnoses" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Search ICD-10 Diagnosis Codes</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by code or description..."
                          value={diagnosisSearch}
                          onChange={(e) => {
                            setDiagnosisSearch(e.target.value)
                            searchDiagnosis(e.target.value)
                          }}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {diagnosisResults.length > 0 && (
                      <Card>
                        <CardContent className="p-2">
                          <ScrollArea className="h-[200px]">
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
                          </ScrollArea>
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
                  </TabsContent>

                  {/* Review Tab */}
                  <TabsContent value="review" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Encounter Summary</CardTitle>
                        <CardDescription>Review before signing</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">SUBJECTIVE</h4>
                          <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
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
                          <h4 className="font-medium mb-2">OBJECTIVE</h4>
                          <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                            {generateObjectiveText() || "Not documented"}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">ASSESSMENT</h4>
                          <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
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
                          <h4 className="font-medium mb-2">PLAN</h4>
                          <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                            {plan || "Not documented"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              <DialogFooter className="flex justify-between border-t pt-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowNewEncounter(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={resetEncounterForm}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => saveEncounter("draft")} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Draft
                  </Button>
                  <Button onClick={() => saveEncounter("signed")} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                    Sign & Complete
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
