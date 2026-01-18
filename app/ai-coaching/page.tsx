"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { FeatureGate } from "@/components/feature-gate"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import {
  Bot,
  Send,
  GraduationCap,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Shield,
  User,
  Loader2,
  Play,
  BookOpen,
  ClipboardCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Download,
  Eye,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface TrainingModule {
  id: string
  module_code: string
  name: string
  description: string
  ceu_hours: number
  duration_minutes: number
  is_required: boolean
  frequency: string
  category: string
  regulatory_source: string
  passing_score: number
  completed?: boolean
  completedDate?: string
  certificateNumber?: string
  progress?: number
  quizScore?: number
  dueDate?: string
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  role: string
  department: string
  completionRate: number
  completedModules: number
  totalModules: number
  totalCeuEarned: number
  totalCeuRequired: number
  overdue: number
  training: TrainingModule[]
  certificates: any[]
}

interface RegulatoryUpdate {
  id: string
  title: string
  source: string
  update_type: string
  priority: string
  summary: string
  full_content?: string
  effective_date?: string
  compliance_deadline?: string
  requires_training: boolean
  acknowledgment_required: boolean
  document_url?: string
}

// Default training modules with content
const defaultTrainingModules: TrainingModule[] = [
  {
    id: "hipaa",
    module_code: "HIPAA-001",
    name: "HIPAA Privacy & Security",
    description: "Privacy and security of protected health information",
    ceu_hours: 2.0,
    duration_minutes: 120,
    is_required: true,
    frequency: "annual",
    category: "compliance",
    regulatory_source: "HHS/OCR",
    passing_score: 80,
  },
  {
    id: "42cfr",
    module_code: "42CFR-001",
    name: "42 CFR Part 2 Confidentiality",
    description: "Federal regulations protecting SUD patient records",
    ceu_hours: 3.0,
    duration_minutes: 180,
    is_required: true,
    frequency: "annual",
    category: "compliance",
    regulatory_source: "42 CFR Part 2",
    passing_score: 85,
  },
  {
    id: "joint-commission",
    module_code: "JC-001",
    name: "Joint Commission Standards",
    description: "Accreditation standards and survey preparation",
    ceu_hours: 4.0,
    duration_minutes: 240,
    is_required: true,
    frequency: "annual",
    category: "compliance",
    regulatory_source: "Joint Commission",
    passing_score: 80,
  },
  {
    id: "samhsa",
    module_code: "SAMHSA-001",
    name: "SAMHSA OTP Guidelines",
    description: "SAMHSA guidelines for Opioid Treatment Programs",
    ceu_hours: 4.0,
    duration_minutes: 240,
    is_required: true,
    frequency: "annual",
    category: "clinical",
    regulatory_source: "SAMHSA",
    passing_score: 85,
  },
  {
    id: "dea",
    module_code: "DEA-001",
    name: "DEA Controlled Substance Regulations",
    description: "DEA requirements for controlled substances",
    ceu_hours: 3.0,
    duration_minutes: 180,
    is_required: true,
    frequency: "annual",
    category: "compliance",
    regulatory_source: "DEA",
    passing_score: 85,
  },
  {
    id: "suicide-prevention",
    module_code: "SP-001",
    name: "Suicide Risk Assessment",
    description: "Columbia Protocol and suicide prevention",
    ceu_hours: 2.0,
    duration_minutes: 120,
    is_required: true,
    frequency: "annual",
    category: "clinical",
    regulatory_source: "Joint Commission",
    passing_score: 85,
  },
]

// Training content for modules
const trainingContent: Record<
  string,
  { steps: { title: string; content: string }[]; quiz: { question: string; options: string[]; correct: number }[] }
> = {
  hipaa: {
    steps: [
      {
        title: "Introduction to HIPAA",
        content:
          "The Health Insurance Portability and Accountability Act (HIPAA) was enacted in 1996 to protect sensitive patient health information. HIPAA establishes national standards for the protection of health information and applies to covered entities including healthcare providers, health plans, and healthcare clearinghouses.\n\nKey components include:\n• Privacy Rule - Protects the privacy of individually identifiable health information\n• Security Rule - Sets standards for the security of electronic protected health information\n• Breach Notification Rule - Requires notification following a breach of unsecured PHI",
      },
      {
        title: "Protected Health Information (PHI)",
        content:
          "Protected Health Information (PHI) includes any individually identifiable health information that is transmitted or maintained in any form or medium. This includes:\n\n• Names and addresses\n• Dates (birth, admission, discharge, death)\n• Phone numbers, fax numbers, email addresses\n• Social Security numbers\n• Medical record numbers\n• Health plan beneficiary numbers\n• Account numbers\n• Biometric identifiers\n• Full face photographs\n• Any other unique identifying number or code",
      },
      {
        title: "Minimum Necessary Standard",
        content:
          "The Minimum Necessary Standard requires that covered entities make reasonable efforts to limit PHI to the minimum necessary to accomplish the intended purpose.\n\nThis means:\n• Only access PHI that you need for your job\n• Only share PHI that is required for treatment, payment, or operations\n• Implement policies that limit who can access what information\n• Train workforce members on appropriate access",
      },
      {
        title: "Patient Rights Under HIPAA",
        content:
          "HIPAA gives patients important rights regarding their health information:\n\n• Right to access their medical records\n• Right to request amendments to their records\n• Right to an accounting of disclosures\n• Right to request restrictions on uses and disclosures\n• Right to confidential communications\n• Right to receive a Notice of Privacy Practices\n• Right to file a complaint if they believe their rights have been violated",
      },
      {
        title: "HIPAA Violations and Penalties",
        content:
          "HIPAA violations can result in significant penalties:\n\n• Civil penalties range from $100 to $50,000 per violation\n• Maximum annual penalty of $1.5 million per violation category\n• Criminal penalties can include fines up to $250,000 and imprisonment\n• Reputational damage to the organization\n• Loss of patient trust\n\nCommon violations include:\n• Unauthorized access to patient records\n• Improper disposal of PHI\n• Lack of safeguards\n• Failure to provide access to records",
      },
    ],
    quiz: [
      {
        question: "What does HIPAA stand for?",
        options: [
          "Health Information Privacy and Accountability Act",
          "Health Insurance Portability and Accountability Act",
          "Healthcare Information Protection and Access Act",
          "Hospital Insurance Privacy and Accountability Act",
        ],
        correct: 1,
      },
      {
        question: "Which of the following is considered PHI?",
        options: [
          "A patient's favorite color",
          "General health statistics with no identifiers",
          "A patient's medical record number",
          "The name of a hospital",
        ],
        correct: 2,
      },
      {
        question: "What is the Minimum Necessary Standard?",
        options: [
          "Keeping patient records as short as possible",
          "Limiting PHI access to what is needed for the intended purpose",
          "Using the smallest file size for electronic records",
          "Minimizing the number of staff with access to any PHI",
        ],
        correct: 1,
      },
      {
        question: "Patients have the right to:",
        options: [
          "Delete their entire medical record",
          "Request amendments to their records",
          "Access other patients' records",
          "Prevent all sharing of their information",
        ],
        correct: 1,
      },
      {
        question: "What is the maximum civil penalty per violation category annually?",
        options: ["$100,000", "$500,000", "$1.5 million", "$10 million"],
        correct: 2,
      },
    ],
  },
  "42cfr": {
    steps: [
      {
        title: "Introduction to 42 CFR Part 2",
        content:
          "42 CFR Part 2 is a federal regulation that protects the confidentiality of substance use disorder (SUD) patient records. It applies to federally assisted programs that provide SUD diagnosis, treatment, or referral for treatment.\n\nKey points:\n• More restrictive than HIPAA for SUD records\n• Requires specific patient consent for most disclosures\n• Applies to any program receiving federal assistance\n• Covers records that identify a person as having or having had an SUD",
      },
      {
        title: "Consent Requirements",
        content:
          "42 CFR Part 2 requires written patient consent for most disclosures. A valid consent must include:\n\n• Name of the patient\n• Name of the program making the disclosure\n• Name of the recipient of the information\n• Purpose of the disclosure\n• How much and what kind of information will be disclosed\n• Patient's signature and date\n• Statement that consent can be revoked\n• Date, event, or condition upon which consent expires\n• Statement prohibiting re-disclosure",
      },
      {
        title: "Exceptions to Consent",
        content:
          "There are limited exceptions where disclosure is permitted without consent:\n\n• Medical emergencies\n• Qualified Service Organization Agreements (QSOAs)\n• Crimes on program premises or against program personnel\n• Child abuse reporting (where state law requires)\n• Court orders (with specific requirements)\n• Research (with proper protocols)\n• Audit and evaluation activities",
      },
      {
        title: "Prohibition on Re-disclosure",
        content:
          "A critical component of 42 CFR Part 2 is the prohibition on re-disclosure. When you share protected information, you must include this notice:\n\n'This information has been disclosed to you from records protected by federal confidentiality rules (42 CFR Part 2). The federal rules prohibit you from making any further disclosure of information in this record that identifies a patient as having or having had a substance use disorder either directly, by reference to publicly available information, or through verification of such identification by another person unless further disclosure is expressly permitted by the written consent of the individual whose information is being disclosed or as otherwise permitted by 42 CFR Part 2.'",
      },
      {
        title: "Integration with HIPAA",
        content:
          "When both HIPAA and 42 CFR Part 2 apply, the more restrictive regulation takes precedence.\n\nKey differences:\n• 42 CFR Part 2 requires specific consent; HIPAA allows TPO disclosures\n• 42 CFR Part 2 prohibits re-disclosure; HIPAA does not\n• 42 CFR Part 2 has stricter court order requirements\n• HIEs must have patient consent for SUD records under 42 CFR Part 2\n\nRecent updates have aligned some requirements, but 42 CFR Part 2 remains more protective.",
      },
    ],
    quiz: [
      {
        question: "42 CFR Part 2 protects records related to:",
        options: ["All medical conditions", "Mental health only", "Substance use disorders", "Infectious diseases"],
        correct: 2,
      },
      {
        question: "A valid 42 CFR Part 2 consent must include:",
        options: [
          "Only the patient's signature",
          "Specific details about the disclosure and prohibition on re-disclosure",
          "Just verbal agreement",
          "Only the name of the program",
        ],
        correct: 1,
      },
      {
        question: "Which is an exception allowing disclosure without consent?",
        options: ["Family members requesting information", "Medical emergencies", "Insurance companies", "Employers"],
        correct: 1,
      },
      {
        question: "When both HIPAA and 42 CFR Part 2 apply:",
        options: [
          "HIPAA always takes precedence",
          "The organization can choose which to follow",
          "The more restrictive regulation applies",
          "Neither applies",
        ],
        correct: 2,
      },
      {
        question: "The prohibition on re-disclosure means:",
        options: [
          "Records can never be shared",
          "Recipients cannot further disclose the information",
          "Only doctors can see the records",
          "Records must be destroyed after viewing",
        ],
        correct: 1,
      },
    ],
  },
  "joint-commission": {
    steps: [
      {
        title: "Introduction to Joint Commission",
        content:
          "The Joint Commission is an independent, nonprofit organization that accredits and certifies healthcare organizations. Accreditation is voluntary but demonstrates commitment to quality and patient safety.\n\nBenefits of accreditation:\n• Recognition of commitment to quality\n• May satisfy state licensing requirements\n• Often required for Medicare/Medicaid participation\n• Improves patient confidence\n• Provides framework for continuous improvement",
      },
      {
        title: "National Patient Safety Goals",
        content:
          "The Joint Commission establishes National Patient Safety Goals (NPSGs) that focus on patient safety problems and how to solve them.\n\nKey goals include:\n• Identify patients correctly (use two identifiers)\n• Improve staff communication\n• Use medicines safely\n• Use alarms safely\n• Prevent infection\n• Identify patient safety risks\n• Prevent mistakes in surgery",
      },
      {
        title: "Documentation Standards",
        content:
          "Proper documentation is critical for Joint Commission compliance:\n\n• All entries must be dated, timed, and authenticated\n• Use approved abbreviations only\n• Document in a timely manner\n• Ensure legibility (for paper records)\n• Include all required elements for each note type\n• Maintain confidentiality\n• Store records securely\n• Retain records per regulations",
      },
      {
        title: "Medication Management",
        content:
          "Joint Commission has extensive medication management standards:\n\n• Verify patient identity before administering medication\n• Use at least two patient identifiers\n• Document all medications administered\n• Report and document adverse reactions\n• Proper storage of medications\n• Controlled substance protocols\n• Medication reconciliation at transitions of care\n• High-alert medication safeguards",
      },
      {
        title: "Survey Preparation",
        content:
          "Be prepared for unannounced surveys:\n\n• Know your organization's policies and procedures\n• Understand your role in patient safety\n• Be able to discuss how you identify patients\n• Know emergency procedures\n• Understand infection control practices\n• Be familiar with your patients' treatment plans\n• Know how to report safety concerns\n• Document consistently and completely",
      },
    ],
    quiz: [
      {
        question: "Joint Commission accreditation is:",
        options: ["Mandatory for all healthcare facilities", "Voluntary", "Only for hospitals", "Government-run"],
        correct: 1,
      },
      {
        question: "How many patient identifiers should be used?",
        options: ["One", "At least two", "Three", "As many as possible"],
        correct: 1,
      },
      {
        question: "Documentation must include:",
        options: [
          "Only the patient name",
          "Date, time, and authentication",
          "Just the medication given",
          "Only abnormal findings",
        ],
        correct: 1,
      },
      {
        question: "Medication reconciliation should occur:",
        options: ["Only at admission", "At transitions of care", "Once per year", "Only for controlled substances"],
        correct: 1,
      },
      {
        question: "Joint Commission surveys are:",
        options: ["Always scheduled in advance", "Unannounced", "Only every 5 years", "Optional"],
        correct: 1,
      },
    ],
  },
  samhsa: {
    steps: [
      {
        title: "Introduction to SAMHSA OTP Guidelines",
        content:
          "The Substance Abuse and Mental Health Services Administration (SAMHSA) oversees Opioid Treatment Programs (OTPs). All OTPs must be certified by SAMHSA and comply with federal regulations.\n\nKey requirements:\n• DEA registration for controlled substances\n• State licensure\n• SAMHSA certification\n• Compliance with 42 CFR Part 8\n• Accreditation by approved body",
      },
      {
        title: "Admission Criteria",
        content:
          "SAMHSA requires specific criteria for OTP admission:\n\n• Diagnosis of opioid use disorder (OUD)\n• One year of addiction for standard admission\n• Pregnant patients may be admitted regardless of duration\n• Previously treated patients may be readmitted\n• Patients under 18 require two documented treatment attempts\n• Informed consent must be obtained\n• Medical examination within 14 days",
      },
      {
        title: "Take-Home Medication Criteria",
        content:
          "Take-home medications are earned privileges based on:\n\n• Time in treatment\n• Absence of drug and alcohol abuse\n• Regularity of clinic attendance\n• Absence of serious behavioral problems\n• Absence of recent criminal activity\n• Stability of home environment\n• Employment or education engagement\n• Assurance of safe storage\n\nMaximum take-homes increase with time: 1 day (0-90 days), 2 days (91-180 days), 3 days (181-270 days), up to monthly supplies after 2 years.",
      },
      {
        title: "Counseling Requirements",
        content:
          "Comprehensive counseling services are required:\n\n• Initial assessment and treatment plan\n• Individualized counseling\n• Group counseling (where appropriate)\n• Family counseling (where appropriate)\n• Vocational/educational counseling\n• HIV/AIDS education and counseling\n• Regular treatment plan reviews\n• Coordination with other services",
      },
      {
        title: "Medical Director Responsibilities",
        content:
          "The Medical Director has specific responsibilities:\n\n• Oversight of all medical services\n• Dosing decisions and protocols\n• Take-home medication approvals\n• Diversion control measures\n• Staff supervision and training\n• Quality assurance activities\n• Compliance with regulations\n• Emergency protocols",
      },
    ],
    quiz: [
      {
        question: "What certifications are required for an OTP?",
        options: [
          "Only state license",
          "DEA registration, state license, and SAMHSA certification",
          "Just DEA registration",
          "Only Joint Commission accreditation",
        ],
        correct: 1,
      },
      {
        question: "Standard OTP admission requires:",
        options: [
          "No specific duration requirement",
          "One year of addiction",
          "Five years of addiction",
          "Prior treatment only",
        ],
        correct: 1,
      },
      {
        question: "Take-home medications are based on:",
        options: [
          "Patient request only",
          "Multiple criteria including time in treatment and stability",
          "Insurance status",
          "Age of patient",
        ],
        correct: 1,
      },
      {
        question: "Initial medical examination must occur within:",
        options: ["24 hours", "7 days", "14 days", "30 days"],
        correct: 2,
      },
      {
        question: "The Medical Director is responsible for:",
        options: [
          "Only administrative tasks",
          "Oversight of all medical services and dosing decisions",
          "Just hiring staff",
          "Only billing",
        ],
        correct: 1,
      },
    ],
  },
  dea: {
    steps: [
      {
        title: "DEA Registration Requirements",
        content:
          "All OTPs must maintain DEA registration for controlled substances. Requirements include:\n\n• DEA Form 224 registration\n• Separate registration for each location\n• Renewal every 3 years\n• State controlled substance license\n• Compliance with all DEA regulations\n• Designation of authorized personnel",
      },
      {
        title: "Controlled Substance Schedules",
        content:
          "DEA classifies controlled substances into schedules:\n\n• Schedule I: High abuse potential, no accepted medical use (heroin, LSD)\n• Schedule II: High abuse potential, accepted medical use (methadone, fentanyl, oxycodone)\n• Schedule III: Moderate abuse potential (buprenorphine, ketamine)\n• Schedule IV: Low abuse potential (benzodiazepines)\n• Schedule V: Lowest abuse potential (certain cough medicines)\n\nMethadone is Schedule II; buprenorphine is Schedule III.",
      },
      {
        title: "Recordkeeping Requirements",
        content:
          "DEA requires detailed records for all controlled substances:\n\n• Initial inventory\n• Biennial inventory (every 2 years)\n• Receiving records (DEA Form 222 for Schedule II)\n• Dispensing records\n• Disposal records\n• Theft/loss reporting (DEA Form 106)\n• Records retained for 2 years minimum\n• Readily retrievable for inspection",
      },
      {
        title: "Security Requirements",
        content:
          "Physical security is essential:\n\n• Secure storage in substantially constructed cabinet/safe\n• Limited access to authorized personnel only\n• Alarm systems recommended\n• Separate storage for different schedules\n• Daily reconciliation of inventory\n• Documentation of all access\n• Diversion prevention protocols\n• Background checks for employees",
      },
      {
        title: "Diversion Prevention",
        content:
          "DEA expects robust diversion prevention:\n\n• Observed dosing protocols\n• Take-home medication criteria\n• Random callbacks for take-home patients\n• Urine drug screening\n• Pill counts for take-homes\n• Serum level monitoring when indicated\n• Reporting suspected diversion\n• Staff training on diversion signs",
      },
    ],
    quiz: [
      {
        question: "DEA registration must be renewed every:",
        options: ["1 year", "2 years", "3 years", "5 years"],
        correct: 2,
      },
      {
        question: "Methadone is classified as:",
        options: ["Schedule I", "Schedule II", "Schedule III", "Schedule IV"],
        correct: 1,
      },
      {
        question: "Controlled substance records must be retained for:",
        options: ["6 months", "1 year", "2 years minimum", "10 years"],
        correct: 2,
      },
      {
        question: "DEA Form 106 is used for:",
        options: ["Registration", "Ordering Schedule II", "Reporting theft/loss", "Disposal"],
        correct: 2,
      },
      {
        question: "Diversion prevention includes:",
        options: [
          "Only observed dosing",
          "Multiple measures including callbacks and drug screening",
          "Just secure storage",
          "Only patient education",
        ],
        correct: 1,
      },
    ],
  },
  "suicide-prevention": {
    steps: [
      {
        title: "Importance of Suicide Risk Assessment",
        content:
          "Suicide prevention is a Joint Commission National Patient Safety Goal. Key points:\n\n• Suicide is a leading cause of death\n• SUD patients have elevated risk\n• Early identification saves lives\n• All staff should be trained\n• Universal screening is recommended\n• Documentation is critical",
      },
      {
        title: "Columbia Suicide Severity Rating Scale",
        content:
          "The C-SSRS is a validated screening tool:\n\n• Screens for suicidal ideation\n• Assesses intensity of ideation\n• Evaluates suicidal behavior\n• Guides clinical decision-making\n• Can be administered by trained staff\n• Should be documented in the medical record\n• Repeat screening at regular intervals",
      },
      {
        title: "Risk Factors and Warning Signs",
        content:
          "Know the risk factors:\n\n• Previous suicide attempt\n• Mental health disorders\n• Substance use disorders\n• Family history of suicide\n• Access to lethal means\n• Recent loss or stressor\n• Social isolation\n• Chronic pain or illness\n\nWarning signs:\n• Talking about wanting to die\n• Looking for ways to kill oneself\n• Talking about feeling hopeless\n• Increasing substance use\n• Withdrawing from activities\n• Giving away possessions",
      },
      {
        title: "Safety Planning",
        content:
          "Safety planning is an intervention:\n\n• Identify warning signs\n• List internal coping strategies\n• Identify social supports\n• List professional contacts\n• Reduce access to lethal means\n• Document the plan\n• Review and update regularly\n• Involve family when appropriate",
      },
      {
        title: "Documentation and Follow-up",
        content:
          "Proper documentation is essential:\n\n• Document all screening results\n• Record risk level determination\n• Note clinical decision-making\n• Document safety plan\n• Record follow-up actions\n• Note referrals made\n• Document patient/family education\n• Update at each visit",
      },
    ],
    quiz: [
      {
        question: "Suicide prevention is:",
        options: [
          "Optional for OTPs",
          "A Joint Commission National Patient Safety Goal",
          "Only for psychiatric facilities",
          "Not relevant to SUD treatment",
        ],
        correct: 1,
      },
      {
        question: "The C-SSRS assesses:",
        options: [
          "Only suicide attempts",
          "Suicidal ideation, intensity, and behavior",
          "Just depression",
          "Anxiety levels",
        ],
        correct: 1,
      },
      {
        question: "Which is a risk factor for suicide?",
        options: ["Strong social support", "Previous suicide attempt", "Regular employment", "No substance use"],
        correct: 1,
      },
      {
        question: "A safety plan should include:",
        options: [
          "Only emergency numbers",
          "Warning signs, coping strategies, and contacts",
          "Just medication list",
          "Only family information",
        ],
        correct: 1,
      },
      {
        question: "Documentation of suicide risk assessment should:",
        options: [
          "Only note if patient is suicidal",
          "Be completed only once",
          "Include all screening results and clinical decisions",
          "Not include family involvement",
        ],
        correct: 2,
      },
    ],
  },
}

export default function AICoachingPage() {
  const [activeTab, setActiveTab] = useState("coaching")
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [qaDocumentType, setQaDocumentType] = useState("soap_note")
  const [qaContent, setQaContent] = useState("")
  const [qaResult, setQaResult] = useState<any>(null)
  const [isQaLoading, setIsQaLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Training module state
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [quizMode, setQuizMode] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)

  // Certificate dialog
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null)

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedUpdate, setSelectedUpdate] = useState<RegulatoryUpdate | null>(null)

  // Fetch staff education data
  const {
    data: educationData,
    error: educationError,
    isLoading: educationLoading,
    mutate: mutateEducation,
  } = useSWR("/api/staff-education", fetcher)

  const selectedStaff = educationData?.staff?.find((s: StaffMember) => s.id === selectedStaffId)

  const trainingModules = selectedStaff?.training || educationData?.modules || defaultTrainingModules

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-select first staff member
  useEffect(() => {
    if (educationData?.staff?.length > 0 && !selectedStaffId) {
      setSelectedStaffId(educationData.staff[0].id)
    }
  }, [educationData, selectedStaffId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-coaching/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2))
                assistantContent += text
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: assistantContent } : m)),
                )
              } catch {
                // If not valid JSON, try to use raw text
                const text = line.slice(2)
                if (text && text !== "undefined") {
                  assistantContent += text
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: assistantContent } : m)),
                  )
                }
              }
            }
          }
        }
      }

      // If no content was parsed, show error
      if (!assistantContent.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: "I apologize, but I encountered an issue processing your request. Please try again." }
              : m,
          ),
        )
      }
    } catch (error) {
      console.error("Chat error:", error)
      toast.error("Failed to get AI response")
      // Add error message to chat
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "assistant" || m.content),
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQaReview = async () => {
    if (!qaContent.trim()) {
      toast.error("Please enter document content to review")
      return
    }

    setIsQaLoading(true)
    setQaResult(null)

    try {
      const response = await fetch("/api/ai-coaching/qa-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: qaDocumentType,
          documentContent: qaContent,
        }),
      })

      if (!response.ok) {
        throw new Error("QA Review request failed")
      }

      const result = await response.json()
      setQaResult(result)
      toast.success("QA Review completed")
    } catch (error) {
      console.error("QA Review failed:", error)
      toast.error("QA Review failed - please try again")
      // Set fallback result
      setQaResult({
        overallScore: 70,
        complianceLevel: "needs_improvement",
        findings: ["Unable to complete automated review", "Please try again or perform manual review"],
        recommendations: ["Retry the review", "Ensure content is properly formatted"],
        summary: "Review could not be completed. Please try again.",
      })
    } finally {
      setIsQaLoading(false)
    }
  }

  const handleStartTraining = (module: TrainingModule) => {
    setSelectedModule(module)
    setCurrentStep(0)
    setQuizMode(false)
    setQuizAnswers([])
    setQuizSubmitted(false)
    setQuizScore(0)
    setTrainingDialogOpen(true)

    // Record training start
    if (selectedStaffId) {
      fetch("/api/staff-education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_training",
          staffId: selectedStaffId,
          moduleId: module.id,
        }),
      }).catch(console.error)
    }
  }

  const handleNextStep = () => {
    const moduleContent = trainingContent[selectedModule?.id || ""] || trainingContent["hipaa"]
    if (currentStep < moduleContent.steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setQuizMode(true)
      setQuizAnswers(new Array(moduleContent.quiz.length).fill(-1))
    }
  }

  const handlePrevStep = () => {
    if (quizMode) {
      setQuizMode(false)
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers]
    newAnswers[questionIndex] = answerIndex
    setQuizAnswers(newAnswers)
  }

  const handleSubmitQuiz = async () => {
    const moduleContent = trainingContent[selectedModule?.id || ""] || trainingContent["hipaa"]
    let correct = 0
    moduleContent.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) correct++
    })
    const score = Math.round((correct / moduleContent.quiz.length) * 100)
    setQuizScore(score)
    setQuizSubmitted(true)

    // Record completion
    if (selectedStaffId && selectedModule) {
      try {
        const response = await fetch("/api/staff-education", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete_training",
            staffId: selectedStaffId,
            moduleId: selectedModule.id,
            quizScore: score,
          }),
        })
        const result = await response.json()
        if (result.passed) {
          toast.success(`Congratulations! You passed with ${score}%! Certificate: ${result.certificateNumber}`)
        } else {
          toast.error(`Score: ${score}%. Passing score is ${selectedModule.passing_score}%. Please try again.`)
        }
        mutateEducation()
      } catch (error) {
        console.error("Failed to record completion:", error)
      }
    }
  }

  const handleViewCertificate = (cert: any) => {
    setSelectedCertificate(cert)
    setCertificateDialogOpen(true)
  }

  const handleViewUpdate = (update: RegulatoryUpdate) => {
    setSelectedUpdate(update)
    setUpdateDialogOpen(true)
  }

  const handleAcknowledgeUpdate = async (updateId: string) => {
    if (!selectedStaffId) {
      toast.error("Please select a staff member first")
      return
    }

    try {
      await fetch("/api/staff-education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "acknowledge_update",
          staffId: selectedStaffId,
          updateId,
        }),
      })
      toast.success("Update acknowledged")
      mutateEducation()
      setUpdateDialogOpen(false)
    } catch (error) {
      console.error("Failed to acknowledge update:", error)
      toast.error("Failed to acknowledge update")
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>
    }
  }

  const getModuleContent = () => {
    return trainingContent[selectedModule?.id || ""] || trainingContent["hipaa"]
  }

  return (
    <FeatureGate feature="ai-assistant">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">AI Coaching & Staff Education</h1>
            <p className="text-muted-foreground mt-2">
              AI-powered coaching, regulatory compliance training, and CEU certification
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select Staff Member" />
              </SelectTrigger>
              <SelectContent>
                {educationData?.staff?.map((s: StaffMember) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {s.first_name} {s.last_name} - {s.role}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        {educationLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : selectedStaff ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{selectedStaff.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{selectedStaff.totalCeuEarned?.toFixed(1) || 0}</p>
                    <p className="text-xs text-muted-foreground">CEU Hours Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{selectedStaff.certificates?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Certificates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {selectedStaff.completedModules}/{selectedStaff.totalModules}
                    </p>
                    <p className="text-xs text-muted-foreground">Modules Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{selectedStaff.overdue || 0}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{defaultTrainingModules.length}</p>
                    <p className="text-xs text-muted-foreground">Training Modules</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {defaultTrainingModules.reduce((sum, m) => sum + m.ceu_hours, 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total CEU Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{defaultTrainingModules.filter((m) => m.is_required).length}</p>
                    <p className="text-xs text-muted-foreground">Required Modules</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-xs text-muted-foreground">Regulatory Sources</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Bot className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">AI</p>
                    <p className="text-xs text-muted-foreground">Coaching Ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="coaching" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI Coach</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Certificates</span>
            </TabsTrigger>
            <TabsTrigger value="regulatory" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Updates</span>
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Doc QA</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Coaching Tab */}
          <TabsContent value="coaching" className="space-y-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Clinical Coach
                </CardTitle>
                <CardDescription>
                  Ask questions about OTP regulations, clinical protocols, documentation, SAMHSA guidelines, Joint
                  Commission standards, and more.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4 mb-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Welcome to AI Clinical Coach</p>
                        <p className="text-sm mt-2">Ask me about:</p>
                        <div className="grid grid-cols-2 gap-2 mt-4 max-w-md mx-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setInputValue("What are the take-home medication criteria under SAMHSA guidelines?")
                            }
                          >
                            Take-home criteria
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInputValue("Explain 42 CFR Part 2 consent requirements")}
                          >
                            42 CFR Part 2
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInputValue("What are Joint Commission documentation standards?")}
                          >
                            JC Standards
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInputValue("How do I properly document a COWS assessment?")}
                          >
                            COWS Documentation
                          </Button>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {message.role === "assistant" ? (
                                <Bot className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                              <span className="text-xs font-medium">
                                {message.role === "assistant" ? "AI Coach" : "You"}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about regulations, documentation, compliance..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="education" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(trainingModules || defaultTrainingModules).map((module: TrainingModule) => (
                <Card key={module.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                        <CardDescription>{module.module_code}</CardDescription>
                      </div>
                      {module.is_required && <Badge variant="destructive">Required</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CEU Hours:</span>
                        <span className="font-medium">{module.ceu_hours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{module.duration_minutes} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Passing Score:</span>
                        <span className="font-medium">{module.passing_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="font-medium">{module.regulatory_source}</span>
                      </div>
                    </div>
                    {module.completed && (
                      <div className="mt-4 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                        {module.quizScore && (
                          <p className="text-xs text-muted-foreground mt-1">Score: {module.quizScore}%</p>
                        )}
                      </div>
                    )}
                    {module.progress && module.progress > 0 && !module.completed && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleStartTraining(module)}
                      variant={module.completed ? "outline" : "default"}
                    >
                      {module.completed ? (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Review
                        </>
                      ) : module.progress && module.progress > 0 ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Continue
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Training
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            {selectedStaff?.certificates?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedStaff.certificates.map((cert: any, idx: number) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        {cert.moduleName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Certificate #:</span>
                          <span className="font-mono">{cert.certificateNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issued:</span>
                          <span>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expires:</span>
                          <span>{cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CEU Hours:</span>
                          <span>{cert.ceuHours}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleViewCertificate(cert)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No Certificates Yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete training modules to earn certificates and CEU hours.
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab("education")}>
                    Start Training
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Regulatory Updates Tab */}
          <TabsContent value="regulatory" className="space-y-4">
            {educationData?.regulatoryUpdates?.length > 0 ? (
              <div className="space-y-4">
                {educationData.regulatoryUpdates.map((update: RegulatoryUpdate) => (
                  <Card key={update.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{update.title}</CardTitle>
                          <CardDescription>
                            {update.source} - {update.update_type}
                          </CardDescription>
                        </div>
                        {getPriorityBadge(update.priority)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{update.summary}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {update.effective_date && (
                          <div>
                            <span className="text-muted-foreground">Effective: </span>
                            <span>{new Date(update.effective_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {update.compliance_deadline && (
                          <div>
                            <span className="text-muted-foreground">Deadline: </span>
                            <span className="text-red-600 font-medium">
                              {new Date(update.compliance_deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        {update.requires_training && (
                          <Badge className="bg-blue-100 text-blue-800">Training Required</Badge>
                        )}
                        {update.acknowledgment_required && (
                          <Badge className="bg-orange-100 text-orange-800">Acknowledgment Required</Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button variant="outline" onClick={() => handleViewUpdate(update)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {update.document_url && (
                        <Button variant="outline" asChild>
                          <a href={update.document_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Source Document
                          </a>
                        </Button>
                      )}
                      {update.acknowledgment_required && (
                        <Button onClick={() => handleAcknowledgeUpdate(update.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No Regulatory Updates</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    New updates from SAMHSA, Joint Commission, DEA, and Michigan LARA will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* QA Tab */}
          <TabsContent value="qa" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document Review</CardTitle>
                  <CardDescription>
                    Paste clinical documentation for AI-powered quality review against Joint Commission standards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={qaDocumentType} onValueChange={setQaDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Document Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soap_note">SOAP Note</SelectItem>
                      <SelectItem value="progress_note">Progress Note</SelectItem>
                      <SelectItem value="intake_assessment">Intake Assessment</SelectItem>
                      <SelectItem value="treatment_plan">Treatment Plan</SelectItem>
                      <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Paste your clinical documentation here..."
                    className="min-h-[300px]"
                    value={qaContent}
                    onChange={(e) => setQaContent(e.target.value)}
                  />

                  <Button onClick={handleQaReview} disabled={isQaLoading} className="w-full">
                    {isQaLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reviewing...
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Review Documentation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>QA Results</CardTitle>
                  <CardDescription>Compliance findings and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  {qaResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">{qaResult.overallScore || 0}%</p>
                          <p className="text-sm text-muted-foreground">Overall Score</p>
                        </div>
                        <div className="flex-1">
                          <Progress value={qaResult.overallScore || 0} className="h-3" />
                        </div>
                      </div>

                      {qaResult.complianceLevel && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Compliance Level:</span>
                          <Badge
                            className={
                              qaResult.complianceLevel === "excellent"
                                ? "bg-green-100 text-green-800"
                                : qaResult.complianceLevel === "good"
                                  ? "bg-blue-100 text-blue-800"
                                  : qaResult.complianceLevel === "needs_improvement"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                            }
                          >
                            {qaResult.complianceLevel.replace("_", " ")}
                          </Badge>
                        </div>
                      )}

                      {qaResult.summary && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{qaResult.summary}</p>
                        </div>
                      )}

                      {qaResult.findings && qaResult.findings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Findings:</h4>
                          <ul className="text-sm space-y-1">
                            {qaResult.findings.map((finding: any, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <span>{typeof finding === "string" ? finding : finding.issue || finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {qaResult.recommendations && qaResult.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Recommendations:</h4>
                          <ul className="text-sm space-y-1">
                            {qaResult.recommendations.map((rec: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Submit documentation to see QA results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Training Dialog */}
      <Dialog open={trainingDialogOpen} onOpenChange={setTrainingDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {selectedModule?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedModule?.description} - {selectedModule?.ceu_hours} CEU Hours
            </DialogDescription>
          </DialogHeader>

          {selectedModule && (
            <div className="mt-4">
              {!quizMode ? (
                // Training Content
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">
                      Step {currentStep + 1} of {getModuleContent().steps.length}
                    </span>
                    <Progress
                      value={((currentStep + 1) / getModuleContent().steps.length) * 100}
                      className="w-32 h-2"
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{getModuleContent().steps[currentStep]?.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{getModuleContent().steps[currentStep]?.content}</p>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 0}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button onClick={handleNextStep}>
                      {currentStep < getModuleContent().steps.length - 1 ? (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Start Quiz
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // Quiz Mode
                <div className="space-y-6">
                  {!quizSubmitted ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium">Quiz - {getModuleContent().quiz.length} Questions</span>
                        <span className="text-sm text-muted-foreground">
                          Passing Score: {selectedModule.passing_score}%
                        </span>
                      </div>

                      {getModuleContent().quiz.map((question, qIdx) => (
                        <Card key={qIdx}>
                          <CardHeader>
                            <CardTitle className="text-base">
                              {qIdx + 1}. {question.question}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <RadioGroup
                              value={quizAnswers[qIdx]?.toString()}
                              onValueChange={(val) => handleQuizAnswer(qIdx, Number.parseInt(val))}
                            >
                              {question.options.map((option, oIdx) => (
                                <div key={oIdx} className="flex items-center space-x-2">
                                  <RadioGroupItem value={oIdx.toString()} id={`q${qIdx}-o${oIdx}`} />
                                  <Label htmlFor={`q${qIdx}-o${oIdx}`} className="cursor-pointer">
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </CardContent>
                        </Card>
                      ))}

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handlePrevStep}>
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Back to Content
                        </Button>
                        <Button onClick={handleSubmitQuiz} disabled={quizAnswers.some((a) => a === -1)}>
                          Submit Quiz
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Quiz Results
                    <div className="text-center py-8">
                      {quizScore >= selectedModule.passing_score ? (
                        <>
                          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                          <h3 className="text-2xl font-bold text-green-600">Congratulations!</h3>
                          <p className="text-lg mt-2">You passed with a score of {quizScore}%</p>
                          <p className="text-muted-foreground mt-2">You earned {selectedModule.ceu_hours} CEU hours</p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                          <h3 className="text-2xl font-bold text-red-600">Not Passed</h3>
                          <p className="text-lg mt-2">Your score: {quizScore}%</p>
                          <p className="text-muted-foreground mt-2">
                            Required passing score: {selectedModule.passing_score}%
                          </p>
                        </>
                      )}
                      <Button className="mt-6" onClick={() => setTrainingDialogOpen(false)}>
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Certificate View Dialog */}
      <Dialog open={certificateDialogOpen} onOpenChange={setCertificateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-8 rounded-lg border-4 border-double border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <Award className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200">Certificate of Completion</h2>
              <p className="text-muted-foreground mt-2">This certifies that</p>
              <p className="text-xl font-semibold mt-2">
                {selectedStaff?.first_name} {selectedStaff?.last_name}
              </p>
              <p className="text-muted-foreground mt-4">has successfully completed</p>
              <p className="text-xl font-semibold mt-2">{selectedCertificate?.moduleName}</p>
              <div className="mt-6 space-y-1 text-sm">
                <p>Certificate Number: {selectedCertificate?.certificateNumber}</p>
                <p>CEU Hours Earned: {selectedCertificate?.ceuHours}</p>
                <p>
                  Date Issued:{" "}
                  {selectedCertificate?.issuedAt ? new Date(selectedCertificate.issuedAt).toLocaleDateString() : "N/A"}
                </p>
                <p>
                  Valid Until:{" "}
                  {selectedCertificate?.expiresAt
                    ? new Date(selectedCertificate.expiresAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertificateDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedUpdate?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedUpdate?.source} - {selectedUpdate?.update_type}
            </DialogDescription>
          </DialogHeader>

          {selectedUpdate && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedUpdate.priority)}
                {selectedUpdate.requires_training && (
                  <Badge className="bg-blue-100 text-blue-800">Training Required</Badge>
                )}
                {selectedUpdate.acknowledgment_required && (
                  <Badge className="bg-orange-100 text-orange-800">Acknowledgment Required</Badge>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedUpdate.summary}</p>
                </CardContent>
              </Card>

              {selectedUpdate.full_content && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Full Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedUpdate.full_content}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedUpdate.effective_date && (
                  <div>
                    <span className="text-muted-foreground">Effective Date:</span>
                    <p className="font-medium">{new Date(selectedUpdate.effective_date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedUpdate.compliance_deadline && (
                  <div>
                    <span className="text-muted-foreground">Compliance Deadline:</span>
                    <p className="font-medium text-red-600">
                      {new Date(selectedUpdate.compliance_deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedUpdate?.document_url && (
              <Button variant="outline" asChild>
                <a href={selectedUpdate.document_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Source
                </a>
              </Button>
            )}
            {selectedUpdate?.acknowledgment_required && (
              <Button onClick={() => selectedUpdate && handleAcknowledgeUpdate(selectedUpdate.id)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Acknowledge
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </FeatureGate>
  )
}
