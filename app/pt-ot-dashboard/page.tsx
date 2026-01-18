"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  FileText,
  Calendar,
  BarChart3,
  ClipboardList,
  Home,
  Dumbbell,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Play,
  Search,
  Plus,
  Eye,
  DollarSign,
  CreditCard,
  FileCheck,
  Brain,
  Loader2,
  Printer,
  Download,
  PenTool,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PTOTSidebar } from "@/components/pt-ot-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { toast } from "@/hooks/use-toast"
import { AIMovementAnalyzer } from "@/components/ai-movement-analyzer"

interface User {
  name: string
  role: string
  license: string
  specialty: string
}

// Added comprehensive patient data interfaces
interface PatientInsurance {
  insuranceName: string
  policyNumber: string
  groupNumber: string
  subscriberName: string
  relationship: string
  copay: string
  deductible: string
  deductibleMet: string
  outOfPocketMax: string
  authorizationRequired: boolean
  authNumber?: string
  authorizedVisits?: number
  visitsUsed?: number
}

interface PatientMedication {
  name: string
  dosage: string
  frequency: string
  prescribedBy: string
  startDate: string
  relevanceToTherapy: string
  precautions: string
}

interface FullPatientInfo extends Patient {
  dob: string
  age: number
  gender: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  mrn: string
  primaryInsurance: PatientInsurance
  secondaryInsurance?: PatientInsurance
  referringPhysician: string
  referringPhysicianNPI: string
  initialDiagnosis: string
  diagnosisCodes: string[]
  onsetDate: string
  surgicalHistory: string
  precautions: string[]
  currentMedications: PatientMedication[]
}

interface Patient {
  id: string
  name: string
  diagnosis: string
  therapyType: "PT" | "OT" | "SLP"
  sessionsCompleted: number
  totalSessions: number
  nextAppointment: string
  hepCompliance: number
  status: "active" | "on-hold" | "discharged"
}

interface Appointment {
  id: string
  time: string
  patientName: string
  therapyType: "PT" | "OT" | "SLP"
  visitType: string
  status: "scheduled" | "checked-in" | "in-progress" | "completed"
}

interface HEPProgram {
  id: string
  patientName: string
  programName: string
  exercises: number
  compliance: number
  lastCompleted: string
  rtmEligible: boolean
}

interface BillingCode {
  code: string
  description: string
  rate: number
  modifier?: string
}

interface ClaimItem {
  id: string
  patientName: string
  dateOfService: string
  codes: string[]
  amount: number
  status: "pending" | "submitted" | "paid" | "denied"
  payer: string
}

// Sample billing codes for PT/OT/SLP
const billingCodes: BillingCode[] = [
  { code: "97110", description: "Therapeutic Exercise", rate: 45 },
  { code: "97112", description: "Neuromuscular Re-education", rate: 48 },
  { code: "97116", description: "Gait Training", rate: 42 },
  { code: "97140", description: "Manual Therapy", rate: 52 },
  { code: "97530", description: "Therapeutic Activities", rate: 46 },
  { code: "97535", description: "Self-Care/Home Management", rate: 44 },
  { code: "97542", description: "Wheelchair Management", rate: 40 },
  { code: "97750", description: "Physical Performance Test", rate: 55 },
  { code: "97760", description: "Orthotic Management", rate: 48 },
  { code: "97761", description: "Prosthetic Training", rate: 50 },
  { code: "97763", description: "Orthotic/Prosthetic Checkout", rate: 45 },
  { code: "92507", description: "Speech Treatment", rate: 65 },
  { code: "92508", description: "Group Speech Treatment", rate: 35 },
  { code: "92526", description: "Oral Function Treatment", rate: 58 },
  { code: "92610", description: "Swallowing Evaluation", rate: 120 },
  { code: "97161", description: "PT Eval - Low Complexity", rate: 95 },
  { code: "97162", description: "PT Eval - Moderate Complexity", rate: 115 },
  { code: "97163", description: "PT Eval - High Complexity", rate: 145 },
  { code: "97165", description: "OT Eval - Low Complexity", rate: 90 },
  { code: "97166", description: "OT Eval - Moderate Complexity", rate: 110 },
  { code: "97167", description: "OT Eval - High Complexity", rate: 140 },
  { code: "98975", description: "RTM Initial Setup", rate: 22 },
  { code: "98977", description: "RTM Device Supply", rate: 55 },
  { code: "98980", description: "RTM Treatment Mgmt (20 min)", rate: 50 },
  { code: "98981", description: "RTM Treatment Mgmt (additional 20 min)", rate: 40 },
]

export default function PTOTDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [patientSearch, setPatientSearch] = useState("")
  const [billingSearch, setBillingSearch] = useState("")
  const [selectedBillingFilter, setSelectedBillingFilter] = useState("all")
  const [showAddClaimDialog, setShowAddClaimDialog] = useState(false)
  const [showCreateHEPDialog, setShowCreateHEPDialog] = useState(false)
  const [showDocumentationDialog, setShowDocumentationDialog] = useState(false)
  const [selectedDocTemplate, setSelectedDocTemplate] = useState("")

  // DOC DIALOG REFACTOR
  const [showDocDialog, setShowDocDialog] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<string>("")
  const [showAIAnalyzer, setShowAIAnalyzer] = useState(false)
  const [aiAnalyzerMode, setAIAnalyzerMode] = useState<"evaluation" | "exercise">("evaluation")
  const [currentExercise, setCurrentExercise] = useState<string>("")
  // </CHANGE>

  const [showSignVisitDialog, setShowSignVisitDialog] = useState(false)
  const [selectedVisitForSign, setSelectedVisitForSign] = useState<number | null>(null)
  const [visitSignature, setVisitSignature] = useState("")
  const [signedVisits, setSignedVisits] = useState<Set<number>>(new Set())

  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false)
  const [showEligibilityDialog, setShowEligibilityDialog] = useState(false)
  const [showPatientChartDialog, setShowPatientChartDialog] = useState(false)
  const [selectedChartPatient, setSelectedChartPatient] = useState<FullPatientInfo | null>(null) // Changed to FullPatientInfo
  const [eligibilityCheck, setEligibilityCheck] = useState({
    patientId: "",
    patientName: "",
    insuranceName: "",
    memberID: "",
    dob: "",
    eligibilityStatus: "",
    coverageActive: false,
    copay: "",
    deductible: "",
    remainingVisits: "",
    priorAuthRequired: false,
    loading: false,
  })

  // Sample data
  const [patients] = useState<FullPatientInfo[]>([
    {
      id: "1",
      name: "John Smith",
      dob: "01/15/1975",
      age: 50,
      gender: "Male",
      address: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      phone: "(555) 123-4567",
      email: "john.smith@email.com",
      emergencyContactName: "Mary Smith",
      emergencyContactPhone: "(555) 987-6543",
      emergencyContactRelation: "Spouse",
      mrn: "MRN-001-2025",
      diagnosis: "Rotator Cuff Repair",
      initialDiagnosis: "Right shoulder rotator cuff full-thickness tear, status post arthroscopic repair",
      diagnosisCodes: ["M75.121", "Z98.891"],
      onsetDate: "11/15/2024",
      surgicalHistory: "Arthroscopic rotator cuff repair 12/01/2024 by Dr. Johnson",
      precautions: [
        "No PROM > 90° abduction for 6 weeks",
        "No lifting > 5 lbs",
        "Sling immobilization except for therapy",
      ],
      therapyType: "PT",
      sessionsCompleted: 8,
      totalSessions: 12,
      nextAppointment: "Today 2:00 PM",
      hepCompliance: 85,
      status: "active",
      referringPhysician: "Dr. Sarah Johnson, MD",
      referringPhysicianNPI: "1234567890",
      primaryInsurance: {
        insuranceName: "Blue Cross Blue Shield PPO",
        policyNumber: "BCB123456789",
        groupNumber: "GRP-5566",
        subscriberName: "John Smith",
        relationship: "Self",
        copay: "$25.00 per visit",
        deductible: "$1,500 annual",
        deductibleMet: "$800",
        outOfPocketMax: "$5,000 annual",
        authorizationRequired: true,
        authNumber: "AUTH-2025-45678",
        authorizedVisits: 12,
        visitsUsed: 8,
      },
      currentMedications: [
        {
          name: "Meloxicam",
          dosage: "15 mg",
          frequency: "Once daily",
          prescribedBy: "Dr. Johnson",
          startDate: "12/01/2024",
          relevanceToTherapy: "NSAID - Anti-inflammatory for pain management",
          precautions: "May mask pain response during manual therapy; monitor for GI upset",
        },
        {
          name: "Cyclobenzaprine",
          dosage: "10 mg",
          frequency: "At bedtime",
          prescribedBy: "Dr. Johnson",
          startDate: "12/01/2024",
          relevanceToTherapy: "Muscle relaxant - May affect motor control and coordination",
          precautions: "Patient may experience drowsiness; assess balance and fall risk",
        },
        {
          name: "Oxycodone",
          dosage: "5 mg",
          frequency: "Every 6 hours as needed",
          prescribedBy: "Dr. Johnson",
          startDate: "12/01/2024",
          relevanceToTherapy: "Opioid analgesic - Affects pain perception and assessment",
          precautions: "May impair cognition; verify patient has not taken within 4 hours of therapy",
        },
      ],
    },
    {
      id: "2",
      name: "Mary Johnson",
      dob: "05/22/1968",
      age: 56,
      gender: "Female",
      address: "456 Oak Avenue",
      city: "Springfield",
      state: "IL",
      zip: "62702",
      phone: "(555) 234-5678",
      email: "mary.j@email.com",
      emergencyContactName: "Robert Johnson",
      emergencyContactPhone: "(555) 876-5432",
      emergencyContactRelation: "Husband",
      mrn: "MRN-002-2025",
      diagnosis: "Carpal Tunnel Syndrome",
      initialDiagnosis: "Bilateral carpal tunnel syndrome, right worse than left",
      diagnosisCodes: ["G56.01", "G56.02"],
      onsetDate: "09/01/2024",
      surgicalHistory: "None related to current condition",
      precautions: ["Avoid forceful gripping", "Wrist neutral positioning"],
      therapyType: "OT",
      sessionsCompleted: 5,
      totalSessions: 10,
      nextAppointment: "Tomorrow 10:00 AM",
      hepCompliance: 92,
      status: "active",
      referringPhysician: "Dr. Michael Chen, MD",
      referringPhysicianNPI: "9876543210",
      primaryInsurance: {
        insuranceName: "Aetna HMO",
        policyNumber: "AET987654321",
        groupNumber: "GRP-7788",
        subscriberName: "Robert Johnson",
        relationship: "Spouse",
        copay: "$20.00 per visit",
        deductible: "$500 annual",
        deductibleMet: "$500",
        outOfPocketMax: "$3,000 annual",
        authorizationRequired: false,
      },
      currentMedications: [
        {
          name: "Gabapentin",
          dosage: "300 mg",
          frequency: "Three times daily",
          prescribedBy: "Dr. Chen",
          startDate: "10/15/2024",
          relevanceToTherapy: "Neuropathic pain management",
          precautions: "May cause dizziness; assess for balance issues during ADL training",
        },
        {
          name: "Vitamin B6",
          dosage: "100 mg",
          frequency: "Once daily",
          prescribedBy: "Dr. Chen",
          startDate: "10/15/2024",
          relevanceToTherapy: "Nerve health support",
          precautions: "None specific to therapy",
        },
      ],
    },
    {
      id: "3",
      name: "Robert Davis",
      dob: "02/10/1980",
      age: 45,
      gender: "Male",
      address: "789 Pine Lane",
      city: "Springfield",
      state: "IL",
      zip: "62703",
      phone: "(555) 345-6789",
      email: "robert.davis@email.com",
      emergencyContactName: "Susan Davis",
      emergencyContactPhone: "(555) 765-4321",
      emergencyContactRelation: "Wife",
      mrn: "MRN-003-2025",
      diagnosis: "CVA - Left Hemiparesis",
      initialDiagnosis: "Ischemic stroke affecting right cerebral hemisphere resulting in left hemiparesis and aphasia",
      diagnosisCodes: ["I69.352", "I63.511"],
      onsetDate: "07/20/2024",
      surgicalHistory: "None",
      precautions: ["Fall risk precautions", "Monitor for swallowing difficulties", "Assist with transfers"],
      therapyType: "PT",
      sessionsCompleted: 15,
      totalSessions: 20,
      nextAppointment: "Today 3:30 PM",
      hepCompliance: 78,
      status: "active",
      referringPhysician: "Dr. Emily Carter, MD",
      referringPhysicianNPI: "1122334455",
      primaryInsurance: {
        insuranceName: "Medicare Part B",
        policyNumber: "MED777888999",
        groupNumber: "",
        subscriberName: "Robert Davis",
        relationship: "Self",
        copay: "$20.00 per therapy type",
        deductible: "$240 annual",
        deductibleMet: "$240",
        outOfPocketMax: "$5,000 annual (Part B)",
        authorizationRequired: true,
        authNumber: "MC-AUTH-2025-1010",
        authorizedVisits: 20,
        visitsUsed: 15,
      },
      currentMedications: [
        {
          name: "Aspirin",
          dosage: "81 mg",
          frequency: "Once daily",
          prescribedBy: "Dr. Carter",
          startDate: "07/25/2024",
          relevanceToTherapy: "Anticoagulant/antiplatelet",
          precautions: "Monitor for bruising, assess fall risk carefully",
        },
        {
          name: "Atorvastatin",
          dosage: "20 mg",
          frequency: "Once daily",
          prescribedBy: "Dr. Carter",
          startDate: "07/25/2024",
          relevanceToTherapy: "Cholesterol management",
          precautions: "None specific to therapy",
        },
        {
          name: "Lisinopril",
          dosage: "10 mg",
          frequency: "Once daily",
          prescribedBy: "Dr. Carter",
          startDate: "07/25/2024",
          relevanceToTherapy: "Blood pressure management",
          precautions: "Monitor for orthostatic hypotension",
        },
      ],
    },
    {
      id: "4",
      name: "Susan Wilson",
      dob: "08/30/1990",
      age: 34,
      gender: "Female",
      address: "101 Maple Drive",
      city: "Springfield",
      state: "IL",
      zip: "62704",
      phone: "(555) 456-7890",
      email: "susan.w@email.com",
      emergencyContactName: "David Wilson",
      emergencyContactPhone: "(555) 654-3210",
      emergencyContactRelation: "Brother",
      mrn: "MRN-004-2025",
      diagnosis: "Aphasia",
      initialDiagnosis: "Moderate expressive and receptive aphasia secondary to CVA",
      diagnosisCodes: ["F80.1", "I69.354"],
      onsetDate: "08/10/2024",
      surgicalHistory: "None",
      precautions: ["Use visual cues", "Allow extra time for communication", "Simplify sentence structure"],
      therapyType: "SLP",
      sessionsCompleted: 6,
      totalSessions: 16,
      nextAppointment: "Wed 9:00 AM",
      hepCompliance: 88,
      status: "active",
      referringPhysician: "Dr. Robert Green, MD",
      referringPhysicianNPI: "5555555555",
      primaryInsurance: {
        insuranceName: "UnitedHealthCare PPO",
        policyNumber: "UHC000111222",
        groupNumber: "GRP-9900",
        subscriberName: "Susan Wilson",
        relationship: "Self",
        copay: "$30.00 per visit",
        deductible: "$1,000 annual",
        deductibleMet: "$400",
        outOfPocketMax: "$4,500 annual",
        authorizationRequired: true,
        authNumber: "UHC-SPLP-4567",
        authorizedVisits: 16,
        visitsUsed: 6,
      },
      currentMedications: [
        {
          name: "Donepezil",
          dosage: "5 mg",
          frequency: "Once daily",
          prescribedBy: "Dr. Green",
          startDate: "08/15/2024",
          relevanceToTherapy: "Cognitive enhancer - May improve attention and verbal fluency",
          precautions: "None specific to therapy",
        },
      ],
    },
    {
      id: "5",
      name: "James Brown",
      dob: "11/05/1950",
      age: 74,
      gender: "Male",
      address: "321 Elm Street",
      city: "Springfield",
      state: "IL",
      zip: "62705",
      phone: "(555) 567-8901",
      email: "james.b@email.com",
      emergencyContactName: "Patricia Brown",
      emergencyContactPhone: "(555) 543-2109",
      emergencyContactRelation: "Daughter",
      mrn: "MRN-005-2025",
      diagnosis: "Total Knee Replacement",
      initialDiagnosis: "Osteoarthritis, right knee, status post total knee arthroplasty",
      diagnosisCodes: ["M17.11", "Z96.651"],
      onsetDate: "01/01/2025",
      surgicalHistory: "Right total knee arthroplasty 01/05/2025 by Dr. Lee",
      precautions: ["Weight bearing as tolerated", "Brace use as prescribed", "Monitor for infection"],
      therapyType: "PT",
      sessionsCompleted: 4,
      totalSessions: 8,
      nextAppointment: "Today 4:00 PM",
      hepCompliance: 95,
      status: "active",
      referringPhysician: "Dr. Emily Carter, MD",
      referringPhysicianNPI: "1122334455",
      primaryInsurance: {
        insuranceName: "Cigna Preferred",
        policyNumber: "CIG444555666",
        groupNumber: "GRP-1122",
        subscriberName: "James Brown",
        relationship: "Self",
        copay: "$30.00 per visit",
        deductible: "$1,200 annual",
        deductibleMet: "$200",
        outOfPocketMax: "$4,000 annual",
        authorizationRequired: true,
        authNumber: "CIG-TKR-9876",
        authorizedVisits: 8,
        visitsUsed: 4,
      },
      currentMedications: [
        {
          name: "Oxycodone/Acetaminophen",
          dosage: "5mg/325mg",
          frequency: "Every 4-6 hours as needed",
          prescribedBy: "Dr. Lee",
          startDate: "01/05/2025",
          relevanceToTherapy: "Post-operative pain control",
          precautions: "May cause drowsiness and constipation; monitor for signs of respiratory depression",
        },
        {
          name: "Enoxaparin",
          dosage: "40 mg",
          frequency: "Once daily (subcutaneous)",
          prescribedBy: "Dr. Lee",
          startDate: "01/05/2025",
          relevanceToTherapy: "DVT prophylaxis",
          precautions: "Monitor for signs of bleeding",
        },
      ],
    },
  ])

  const [appointments] = useState<Appointment[]>([
    {
      id: "1",
      time: "9:00 AM",
      patientName: "John Smith",
      therapyType: "PT",
      visitType: "Follow-up",
      status: "completed",
    },
    {
      id: "2",
      time: "10:00 AM",
      patientName: "Mary Johnson",
      therapyType: "OT",
      visitType: "Initial Eval",
      status: "completed",
    },
    {
      id: "3",
      time: "11:00 AM",
      patientName: "Robert Davis",
      therapyType: "PT",
      visitType: "Follow-up",
      status: "in-progress",
    },
    {
      id: "4",
      time: "2:00 PM",
      patientName: "Susan Wilson",
      therapyType: "SLP",
      visitType: "Follow-up",
      status: "checked-in",
    },
    {
      id: "5",
      time: "3:00 PM",
      patientName: "James Brown",
      therapyType: "PT",
      visitType: "Follow-up",
      status: "scheduled",
    },
    {
      id: "6",
      time: "4:00 PM",
      patientName: "Linda Martinez",
      therapyType: "OT",
      visitType: "Re-evaluation",
      status: "scheduled",
    },
  ])

  const [hepPrograms] = useState<HEPProgram[]>([
    {
      id: "1",
      patientName: "John Smith",
      programName: "Shoulder Strengthening",
      exercises: 8,
      compliance: 85,
      lastCompleted: "2 hours ago",
      rtmEligible: true,
    },
    {
      id: "2",
      patientName: "Mary Johnson",
      programName: "Hand Therapy Exercises",
      exercises: 12,
      compliance: 92,
      lastCompleted: "Yesterday",
      rtmEligible: true,
    },
    {
      id: "3",
      patientName: "Robert Davis",
      programName: "Balance & Gait Training",
      exercises: 6,
      compliance: 78,
      lastCompleted: "3 days ago",
      rtmEligible: true,
    },
    {
      id: "4",
      patientName: "James Brown",
      programName: "Knee ROM Exercises",
      exercises: 10,
      compliance: 95,
      lastCompleted: "Today",
      rtmEligible: true,
    },
  ])

  const [claims] = useState<ClaimItem[]>([
    {
      id: "1",
      patientName: "John Smith",
      dateOfService: "2025-01-28",
      codes: ["97110", "97140", "97530"],
      amount: 143,
      status: "submitted",
      payer: "Blue Cross",
    },
    {
      id: "2",
      patientName: "Mary Johnson",
      dateOfService: "2025-01-28",
      codes: ["97165", "97535"],
      amount: 134,
      status: "pending",
      payer: "Aetna",
    },
    {
      id: "3",
      patientName: "Robert Davis",
      dateOfService: "2025-01-27",
      codes: ["97110", "97116", "97112"],
      amount: 135,
      status: "paid",
      payer: "Medicare",
    },
    {
      id: "4",
      patientName: "Susan Wilson",
      dateOfService: "2025-01-27",
      codes: ["92507", "92526"],
      amount: 123,
      status: "paid",
      payer: "UnitedHealth",
    },
    {
      id: "5",
      patientName: "James Brown",
      dateOfService: "2025-01-26",
      codes: ["97161", "97110"],
      amount: 140,
      status: "denied",
      payer: "Cigna",
    },
  ])

  useEffect(() => {
    // Check for PT/OT session
    const ptotSession = localStorage.getItem("ptot_session")
    if (ptotSession) {
      try {
        const session = JSON.parse(ptotSession)
        setUser(session)
      } catch {
        router.push("/auth/pt-ot-login")
      }
    } else {
      router.push("/auth/pt-ot-login")
    }
    setLoading(false)
  }, [router])

  const getTherapyBadgeColor = (type: string) => {
    switch (type) {
      case "PT":
        return "bg-blue-100 text-blue-800"
      case "OT":
        return "bg-green-100 text-green-800"
      case "SLP":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "checked-in":
        return <Badge className="bg-yellow-100 text-yellow-800">Checked In</Badge>
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "denied":
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(patientSearch.toLowerCase()),
  )

  const filteredClaims = claims.filter((c) => {
    const matchesSearch = c.patientName.toLowerCase().includes(billingSearch.toLowerCase())
    const matchesFilter = selectedBillingFilter === "all" || c.status === selectedBillingFilter
    return matchesSearch && matchesFilter
  })

  const filteredBillingCodes = billingCodes.filter(
    (c) =>
      c.code.toLowerCase().includes(billingSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(billingSearch.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSidebarNavigate = (tab: string) => {
    setActiveTab(tab)
  }

  const checkEligibility = async () => {
    setEligibilityCheck({ ...eligibilityCheck, loading: true })
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setEligibilityCheck({
      ...eligibilityCheck,
      loading: false,
      eligibilityStatus: "Active",
      coverageActive: true,
      copay: "$25.00",
      deductible: "$500.00 ($200 remaining)",
      remainingVisits: "12 visits remaining",
      priorAuthRequired: false,
    })
    toast({
      title: "Eligibility Verified",
      description: "Insurance is active and covers therapy services.",
    })
  }

  const openPatientChart = (patient: FullPatientInfo) => {
    // Changed parameter type
    setSelectedChartPatient(patient)
    setShowPatientChartDialog(true)
  }

  const printDemographics = () => {
    if (!selectedChartPatient) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const demographicsHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient Demographics - ${selectedChartPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .info-item { padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; }
            .label { font-weight: bold; color: #6b7280; font-size: 14px; }
            .value { font-size: 16px; margin-top: 5px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Patient Demographics</h1>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Name</div>
              <div class="value">${selectedChartPatient.name}</div>
            </div>
            <div class="info-item">
              <div class="label">MRN</div>
              <div class="value">${selectedChartPatient.mrn}</div>
            </div>
            <div class="info-item">
              <div class="label">Date of Birth</div>
              <div class="value">${selectedChartPatient.dob}</div>
            </div>
            <div class="info-item">
              <div class="label">Primary Diagnosis</div>
              <div class="value">${selectedChartPatient.diagnosis}</div>
            </div>
            <div class="info-item">
              <div class="label">Therapy Type</div>
              <div class="value">${selectedChartPatient.therapyType}</div>
            </div>
            <div class="info-item">
              <div class="label">Insurance</div>
              <div class="value">${selectedChartPatient.primaryInsurance.insuranceName}</div>
            </div>
            <div class="info-item">
              <div class="label">Referring Physician</div>
              <div class="value">${selectedChartPatient.referringPhysician}</div>
            </div>
            <div class="info-item">
              <div class="label">Phone</div>
              <div class="value">${selectedChartPatient.phone}</div>
            </div>
            <div class="info-item">
              <div class="label">Email</div>
              <div class="value">${selectedChartPatient.email}</div>
            </div>
            <div class="info-item">
              <div class="label">Sessions</div>
              <div class="value">${selectedChartPatient.sessionsCompleted} of ${selectedChartPatient.totalSessions} completed</div>
            </div>
          </div>
          <div class="footer">
            <p>Printed on: ${new Date().toLocaleString()}</p>
            <p>Printed by: ${user?.name} (${user?.license})</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(demographicsHTML)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)

    toast({
      title: "Printing Demographics",
      description: "Demographics document has been sent to printer.",
    })
  }

  const signAndExportVisit = () => {
    if (!selectedChartPatient || selectedVisitForSign === null || !visitSignature) {
      toast({
        title: "Missing Information",
        description: "Please provide your signature to sign this visit note.",
        variant: "destructive",
      })
      return
    }

    const visitIdx = selectedVisitForSign
    const visitNumber = selectedChartPatient.sessionsCompleted - visitIdx
    const visitDate = new Date(Date.now() - visitIdx * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()

    // Mark as signed
    setSignedVisits((prev) => new Set([...prev, visitIdx]))

    // Generate PDF content
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const visitHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Visit Note #${visitNumber} - ${selectedChartPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { color: #374151; font-size: 18px; margin-top: 20px; background: #f3f4f6; padding: 8px; border-left: 4px solid #1e40af; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; }
            .section { margin: 15px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px; }
            .objective-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 10px 0; }
            .objective-item { padding: 10px; background: #f9fafb; border-radius: 4px; }
            .signature-box { margin-top: 40px; padding: 20px; border: 2px solid #1e40af; background: #eff6ff; }
            .signature { font-family: 'Brush Script MT', cursive; font-size: 24px; color: #1e40af; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            .badge { display: inline-block; padding: 4px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 12px; margin: 2px; }
          </style>
        </head>
        <body>
          <h1>Physical Therapy Visit Note</h1>
          
          <div class="header">
            <div>
              <strong>Patient:</strong> ${selectedChartPatient.name}<br>
              <strong>MRN:</strong> ${selectedChartPatient.mrn}<br>
              <strong>Diagnosis:</strong> ${selectedChartPatient.diagnosis}
            </div>
            <div style="text-align: right;">
              <strong>Visit #${visitNumber}</strong><br>
              <strong>Date:</strong> ${visitDate}<br>
              <strong>Therapy:</strong> ${selectedChartPatient.therapyType}
            </div>
          </div>
          
          <h2>Subjective</h2>
          <div class="section">
            Patient reports ${visitIdx === 0 ? "significant improvement" : "continued progress"} in pain levels and function. Pain level: ${Math.max(2, 8 - visitIdx)}/10.
          </div>
          
          <h2>Objective</h2>
          <div class="section">
            <div class="objective-grid">
              <div class="objective-item">
                <strong>Range of Motion</strong><br>
                ${80 + visitIdx * 5}° flexion
              </div>
              <div class="objective-item">
                <strong>Strength</strong><br>
                ${3 + Math.min(visitIdx * 0.5, 2)}/5 manual muscle test
              </div>
              <div class="objective-item">
                <strong>Pain Level</strong><br>
                ${Math.max(2, 8 - visitIdx)}/10 at rest
              </div>
            </div>
          </div>
          
          <h2>Assessment</h2>
          <div class="section">
            Patient demonstrating ${visitIdx === 0 ? "excellent" : "good"} progress toward functional goals. Tolerating treatment well with no adverse reactions.
          </div>
          
          <h2>Plan</h2>
          <div class="section">
            Continue current treatment plan, progress HEP exercises. Patient to continue with scheduled appointments.
          </div>
          
          <h2>Interventions & Billing</h2>
          <div class="section">
            <span class="badge">CPT: 97110 - Therapeutic Exercise</span>
            <span class="badge">CPT: 97140 - Manual Therapy</span>
            <span class="badge">Duration: 45 minutes</span>
          </div>
          
          <div class="signature-box">
            <strong>Electronically Signed:</strong><br>
            <div class="signature">${visitSignature}</div>
            <div style="margin-top: 10px;">
              <strong>${user?.name}, ${user?.role}</strong><br>
              License: ${user?.license}<br>
              Signed on: ${new Date().toLocaleString()}
            </div>
          </div>
          
          <div class="footer">
            <p><strong>CONFIDENTIAL:</strong> This document contains protected health information. Unauthorized disclosure is prohibited.</p>
            <p>Generated from MASE EMR System</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(visitHTML)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)

    setShowSignVisitDialog(false)
    setVisitSignature("")

    toast({
      title: "Visit Note Signed & Exported",
      description: `Visit #${visitNumber} has been signed and is ready to print/save as PDF.`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <PTOTSidebar userRole={user.role} specialty={user.specialty} onNavigate={handleSidebarNavigate} />

      <div className="pl-64">
        <DashboardHeader />

        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Rehabilitation Portal</h1>
                <p className="text-muted-foreground">
                  Welcome, {user.name} • {user.role} • {user.license}
                </p>
              </div>
            </div>
          </div>

          {/* Main Tabs - Added Billing and AI Coach tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-8 w-full max-w-5xl">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Patients
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="hep" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                HEP/RTM
              </TabsTrigger>
              <TabsTrigger value="documentation" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentation
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="ai-coach" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Coach
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Today's Patients</p>
                        <p className="text-2xl font-bold">8</p>
                        <p className="text-xs text-green-600">2 completed</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Caseload</p>
                        <p className="text-2xl font-bold">24</p>
                        <p className="text-xs text-muted-foreground">5 pending discharge</p>
                      </div>
                      <Activity className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">HEP Compliance</p>
                        <p className="text-2xl font-bold">87%</p>
                        <p className="text-xs text-green-600">↑ 3% this week</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">RTM Revenue</p>
                        <p className="text-2xl font-bold">$2,450</p>
                        <p className="text-xs text-muted-foreground">This month</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Schedule & Alerts */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Today's Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {appointments.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium w-20">{apt.time}</div>
                          <div>
                            <p className="font-medium">{apt.patientName}</p>
                            <p className="text-sm text-muted-foreground">{apt.visitType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTherapyBadgeColor(apt.therapyType)}>{apt.therapyType}</Badge>
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Compliance Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg border-amber-200 bg-amber-50">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Low HEP Compliance</span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">Robert Davis - 78% (below 80% threshold)</p>
                    </div>
                    <div className="p-3 border rounded-lg border-red-200 bg-red-50">
                      <div className="flex items-center gap-2 text-red-800">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Authorization Expiring</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">Mary Johnson - 2 visits remaining</p>
                    </div>
                    <div className="p-3 border rounded-lg border-blue-200 bg-blue-50">
                      <div className="flex items-center gap-2 text-blue-800">
                        <FileCheck className="h-4 w-4" />
                        <span className="font-medium">Progress Note Due</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">James Brown - 30-day progress note required</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button onClick={() => setActiveTab("patients")}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Patient
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("documentation")}>
                      <FileText className="h-4 w-4 mr-2" />
                      New Note
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("hep")}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Create HEP
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("billing")}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Submit Claim
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/ai-coaching")}>
                      <Brain className="h-4 w-4 mr-2" />
                      AI Coaching
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patients Tab */}
            <TabsContent value="patients" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Patient Management</h2>
                  <p className="text-muted-foreground">View and manage your patient caseload</p>
                </div>
                <Button onClick={() => setShowAddPatientDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </Button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {filteredPatients.map((patient) => (
                  <Card key={patient.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{patient.name}</h3>
                            <Badge className={getTherapyBadgeColor(patient.therapyType)}>{patient.therapyType}</Badge>
                            <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                              {patient.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{patient.diagnosis}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Next: {patient.nextAppointment}</span>
                            <span>
                              Progress: {patient.sessionsCompleted}/{patient.totalSessions} sessions
                            </span>
                            <span>HEP Compliance: {patient.hepCompliance}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openPatientChart(patient)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Chart
                          </Button>
                          <Button variant="outline" size="sm">
                            Schedule
                          </Button>
                          {/* CHANGE: Added AI Analysis button for therapists */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-purple-50 hover:bg-purple-100"
                            onClick={() => {
                              setSelectedChartPatient(patient) // Updated from setSelectedPatient
                              setAIAnalyzerMode("evaluation")
                              setCurrentExercise("Range of Motion Assessment")
                              setShowAIAnalyzer(true)
                            }}
                          >
                            <Activity className="h-4 w-4 mr-1" />
                            AI Analysis
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Treatment Progress</span>
                          <span>{Math.round((patient.sessionsCompleted / patient.totalSessions) * 100)}%</span>
                        </div>
                        <Progress value={(patient.sessionsCompleted / patient.totalSessions) * 100} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule - {new Date().toLocaleDateString()}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-medium w-24">{apt.time}</div>
                        <div>
                          <p className="font-medium">{apt.patientName}</p>
                          <p className="text-sm text-muted-foreground">{apt.visitType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getTherapyBadgeColor(apt.therapyType)}>{apt.therapyType}</Badge>
                        {getStatusBadge(apt.status)}
                        {apt.status === "scheduled" || apt.status === "checked-in" ? (
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Start Session
                          </Button>
                        ) : apt.status === "in-progress" ? (
                          <Button size="sm" variant="outline">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* HEP/RTM Tab */}
            <TabsContent value="hep" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Home Exercise Programs & RTM</h2>
                <div className="flex gap-2">
                  {/* CHANGE: Added AI Movement Analyzer button */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAIAnalyzerMode("evaluation")
                      setShowAIAnalyzer(true)
                    }}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    AI Movement Analysis
                  </Button>
                  <Dialog open={showCreateHEPDialog} onOpenChange={setShowCreateHEPDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create HEP
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Create Home Exercise Program</DialogTitle>
                        <DialogDescription>
                          Design a personalized HEP for your patient with RTM capabilities
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Patient</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient" />
                              </SelectTrigger>
                              <SelectContent>
                                {patients.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} - {p.diagnosis}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Program Name</Label>
                            <Input placeholder="e.g., Post-Op Shoulder Protocol" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Program Duration</Label>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Weeks</Label>
                              <Select defaultValue="8">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[4, 6, 8, 12, 16].map((w) => (
                                    <SelectItem key={w} value={w.toString()}>
                                      {w} weeks
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Frequency</Label>
                              <Select defaultValue="daily">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="3x-week">3x per week</SelectItem>
                                  <SelectItem value="5x-week">5x per week</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">RTM Eligible</Label>
                              <Select defaultValue="yes">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Exercise Library</Label>
                          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                "Pendulum Exercises",
                                "Wall Walks",
                                "External Rotation",
                                "Internal Rotation",
                                "Scapular Squeezes",
                                "Rows",
                                "Shoulder Flexion",
                                "Abduction Raises",
                                "Bicep Curls",
                                "Tricep Extensions",
                              ].map((exercise) => (
                                <div
                                  key={exercise}
                                  className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50 cursor-pointer"
                                >
                                  <input type="checkbox" id={exercise} className="rounded" />
                                  <label htmlFor={exercise} className="text-sm cursor-pointer flex-1">
                                    {exercise}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Special Instructions</Label>
                          <Textarea
                            placeholder="Add any special instructions, precautions, or modifications..."
                            rows={3}
                          />
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900">Remote Therapeutic Monitoring (RTM)</p>
                              <p className="text-sm text-blue-700 mt-1">
                                This program is eligible for RTM billing codes (98975, 98977, 98980, 98981). Patients
                                will use our mobile app to track compliance and you'll receive $50-167 per month per
                                patient in additional revenue.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateHEPDialog(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            toast({
                              title: "HEP Created",
                              description: "Home Exercise Program has been created and assigned to patient.",
                            })
                            setShowCreateHEPDialog(false)
                          }}
                        >
                          Create Program
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {hepPrograms.map((hep) => (
                  <Card key={hep.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{hep.patientName}</CardTitle>
                        {hep.rtmEligible && <Badge className="bg-green-100 text-green-800">RTM Eligible</Badge>}
                      </div>
                      <CardDescription>{hep.programName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Exercises: {hep.exercises}</span>
                          <span>Last completed: {hep.lastCompleted}</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Compliance</span>
                            <span className={hep.compliance >= 80 ? "text-green-600" : "text-amber-600"}>
                              {hep.compliance}%
                            </span>
                          </div>
                          <Progress value={hep.compliance} />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <FileText className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {hep.rtmEligible && (
                            <Button size="sm" className="flex-1">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Bill RTM
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="documentation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Documentation Templates</CardTitle>
                  <CardDescription>Select a template to create a new note</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: "Initial Evaluation", icon: FileCheck, desc: "Comprehensive initial assessment" },
                      { name: "Daily Note", icon: FileText, desc: "Session documentation" },
                      { name: "Progress Note", icon: TrendingUp, desc: "30-day progress summary" },
                      { name: "Re-evaluation", icon: Activity, desc: "Periodic re-assessment" },
                      { name: "Discharge Summary", icon: CheckCircle2, desc: "Treatment completion" },
                      { name: "RTM Note", icon: DollarSign, desc: "Remote monitoring documentation" },
                    ].map((template) => (
                      <Card
                        key={template.name}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => {
                          setSelectedDocTemplate(template.name)
                          setShowDocumentationDialog(true)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <template.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-sm text-muted-foreground">{template.desc}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Dialog open={showDocumentationDialog} onOpenChange={setShowDocumentationDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedDocTemplate}</DialogTitle>
                    <DialogDescription>Complete the documentation form below</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Patient</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} - {p.diagnosis}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Service</Label>
                        <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                      </div>
                    </div>

                    {selectedDocTemplate === "Initial Evaluation" && (
                      <>
                        <div className="space-y-2">
                          <Label>Chief Complaint</Label>
                          <Textarea placeholder="Patient's primary concern..." rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Diagnosis</Label>
                            <Input placeholder="Primary diagnosis" />
                          </div>
                          <div className="space-y-2">
                            <Label>Onset Date</Label>
                            <Input type="date" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Subjective</Label>
                          <Textarea placeholder="Patient history, symptoms, functional limitations..." rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Objective Findings</Label>
                          <Textarea
                            placeholder="ROM measurements, strength testing, special tests, gait analysis..."
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Assessment</Label>
                          <Textarea
                            placeholder="Clinical impression, prognosis, rehabilitation potential..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Plan of Care</Label>
                          <Textarea placeholder="Treatment frequency, duration, interventions, goals..." rows={3} />
                        </div>
                      </>
                    )}

                    {selectedDocTemplate === "Daily Note" && (
                      <>
                        <div className="space-y-2">
                          <Label>Subjective</Label>
                          <Textarea placeholder="Patient's report of symptoms, pain level, progress..." rows={2} />
                        </div>
                        <div className="space-y-2">
                          <Label>Interventions</Label>
                          <Textarea placeholder="Therapeutic exercises, manual therapy, modalities used..." rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Response to Treatment</Label>
                          <Textarea
                            placeholder="Patient's tolerance, improvements noted, adverse reactions..."
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Plan</Label>
                          <Textarea placeholder="Continue current plan, modifications, home program..." rows={2} />
                        </div>
                        <div className="space-y-2">
                          <Label>CPT Codes</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select billing codes" />
                            </SelectTrigger>
                            <SelectContent>
                              {billingCodes.slice(0, 10).map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {c.code} - {c.description} (${c.rate})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {selectedDocTemplate === "Progress Note" && (
                      <>
                        <div className="space-y-2">
                          <Label>Progress Summary</Label>
                          <Textarea
                            placeholder="Overall progress since last evaluation, functional improvements..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Goals Status</Label>
                          <Textarea placeholder="Progress toward each goal (Met/In Progress/Not Met)..." rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Barriers to Progress</Label>
                          <Textarea placeholder="Any factors limiting progress..." rows={2} />
                        </div>
                        <div className="space-y-2">
                          <Label>Plan Moving Forward</Label>
                          <Textarea placeholder="Continue treatment, modify goals, discharge planning..." rows={2} />
                        </div>
                      </>
                    )}

                    {!["Initial Evaluation", "Daily Note", "Progress Note"].includes(selectedDocTemplate) && (
                      <div className="space-y-2">
                        <Label>Documentation</Label>
                        <Textarea placeholder={`Complete ${selectedDocTemplate} documentation...`} rows={8} />
                      </div>
                    )}

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900">Compliance Reminder</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Ensure documentation is completed within 24 hours of service. Include medical necessity,
                            skilled services, and measurable progress toward functional goals.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowDocumentationDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="outline">Save Draft</Button>
                    <Button
                      onClick={() => {
                        toast({
                          title: "Note Completed",
                          description: `${selectedDocTemplate} has been saved and signed.`,
                        })
                        setShowDocumentationDialog(false)
                      }}
                    >
                      Sign & Complete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Billing & Claims</h2>
                  <p className="text-muted-foreground">Manage claims and check eligibility</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowEligibilityDialog(true)}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Check Eligibility
                  </Button>
                  <Button onClick={() => setShowAddClaimDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Claim
                  </Button>
                </div>
              </div>

              {/* Billing Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Claims</p>
                        <p className="text-2xl font-bold">12</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Submitted</p>
                        <p className="text-2xl font-bold">28</p>
                      </div>
                      <FileCheck className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Paid This Month</p>
                        <p className="text-2xl font-bold">$18,450</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Denied</p>
                        <p className="text-2xl font-bold">3</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* CPT Code Library */}
                <Card>
                  <CardHeader>
                    <CardTitle>CPT Code Library</CardTitle>
                    <CardDescription>PT/OT/SLP billing codes with rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search codes..."
                          value={billingSearch}
                          onChange={(e) => setBillingSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredBillingCodes.map((code) => (
                        <div
                          key={code.code}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-mono font-medium">{code.code}</p>
                            <p className="text-sm text-muted-foreground">{code.description}</p>
                          </div>
                          <Badge variant="outline">${code.rate}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Claims */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Recent Claims</CardTitle>
                        <CardDescription>Latest billing submissions</CardDescription>
                      </div>
                      <Select value={selectedBillingFilter} onValueChange={setSelectedBillingFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="denied">Denied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredClaims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{claim.patientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {claim.dateOfService} • {claim.codes.join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">${claim.amount}</span>
                            {getStatusBadge(claim.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-coach" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI Clinical Coach
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered assistance for treatment planning, documentation, and clinical decision support
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => router.push("/ai-coaching")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Documentation Assistant</p>
                            <p className="text-sm text-muted-foreground">Generate clinical notes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => router.push("/ai-coaching")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Treatment Planner</p>
                            <p className="text-sm text-muted-foreground">Evidence-based recommendations</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => router.push("/ai-coaching")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Outcome Predictor</p>
                            <p className="text-sm text-muted-foreground">Functional outcome forecasts</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Button className="w-full" onClick={() => router.push("/ai-coaching")}>
                    <Brain className="h-4 w-4 mr-2" />
                    Open Full AI Coaching Dashboard
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Productivity Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Units per Day</span>
                      <span className="font-bold">24.5</span>
                    </div>
                    <Progress value={82} />
                    <div className="flex items-center justify-between">
                      <span>Documentation Compliance</span>
                      <span className="font-bold">96%</span>
                    </div>
                    <Progress value={96} />
                    <div className="flex items-center justify-between">
                      <span>Patient Satisfaction</span>
                      <span className="font-bold">4.8/5</span>
                    </div>
                    <Progress value={96} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Traditional Billing</span>
                      <span className="font-bold text-green-600">$45,230</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>RTM Revenue</span>
                      <span className="font-bold text-green-600">$8,450</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                      <span className="font-medium">Total MTD</span>
                      <span className="font-bold text-lg">$53,680</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={showAddPatientDialog} onOpenChange={setShowAddPatientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Enter patient information and verify insurance eligibility</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input placeholder="John" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input placeholder="Smith" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>MRN</Label>
                <Input placeholder="MRN-12345" />
              </div>
            </div>
            <div>
              <Label>Primary Diagnosis</Label>
              <Input placeholder="e.g., Rotator Cuff Tear" />
            </div>
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold">Insurance Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Insurance Provider</Label>
                  <Input placeholder="Blue Cross" />
                </div>
                <div>
                  <Label>Member ID</Label>
                  <Input placeholder="ABC123456789" />
                </div>
              </div>
              <div>
                <Label>Group Number</Label>
                <Input placeholder="GRP001" />
              </div>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  setShowAddPatientDialog(false)
                  setShowEligibilityDialog(true)
                }}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Check Eligibility
              </Button>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddPatientDialog(false)}>
                Cancel
              </Button>
              <Button>Add Patient</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEligibilityDialog} onOpenChange={setShowEligibilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insurance Eligibility Check</DialogTitle>
            <DialogDescription>Verify patient insurance coverage and benefits</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Patient Name</Label>
              <Input placeholder="John Smith" />
            </div>
            <div>
              <Label>Insurance Name</Label>
              <Input placeholder="Blue Cross Blue Shield" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Member ID</Label>
                <Input placeholder="ABC123456789" />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <Label>Group Number (Optional)</Label>
              <Input placeholder="GRP001" />
            </div>

            {eligibilityCheck.loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Checking eligibility...</span>
              </div>
            )}

            {eligibilityCheck.eligibilityStatus && !eligibilityCheck.loading && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Coverage Active</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Copay:</strong> {eligibilityCheck.copay}
                  </p>
                  <p>
                    <strong>Deductible:</strong> {eligibilityCheck.deductible}
                  </p>
                  <p>
                    <strong>Remaining Visits:</strong> {eligibilityCheck.remainingVisits}
                  </p>
                  <p>
                    <strong>Prior Auth Required:</strong> {eligibilityCheck.priorAuthRequired ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEligibilityDialog(false)}>
                Close
              </Button>
              <Button onClick={checkEligibility} disabled={eligibilityCheck.loading}>
                {eligibilityCheck.loading ? "Checking..." : "Check Eligibility"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPatientChartDialog} onOpenChange={setShowPatientChartDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Chart - {selectedChartPatient?.name}</DialogTitle>
            <DialogDescription>Complete patient chart with visit history and documentation</DialogDescription>
          </DialogHeader>

          {selectedChartPatient && (
            <Tabs defaultValue="demographics" className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="demographics">Demographics</TabsTrigger>
                <TabsTrigger value="visits">Visit History</TabsTrigger>
                <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
                <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="demographics" className="space-y-6">
                <>
                  {/* Header with patient name and actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedChartPatient.name}</h3>
                      <p className="text-sm text-muted-foreground">MRN: {selectedChartPatient.mrn}</p>
                    </div>
                    <Button onClick={printDemographics} variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Print Demographics
                    </Button>
                  </div>

                  {/* Basic Demographics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Patient Demographics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">{selectedChartPatient.dob}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Age</p>
                          <p className="font-medium">{selectedChartPatient.age} years</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-medium">{selectedChartPatient.gender}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">{selectedChartPatient.address}</p>
                          <p className="font-medium">
                            {selectedChartPatient.city}, {selectedChartPatient.state} {selectedChartPatient.zip}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{selectedChartPatient.phone}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedChartPatient.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Emergency Contact */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Emergency Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{selectedChartPatient.emergencyContactName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Relationship</p>
                          <p className="font-medium">{selectedChartPatient.emergencyContactRelation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{selectedChartPatient.emergencyContactPhone}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Primary Insurance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Primary Insurance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-sm text-muted-foreground">Insurance Name</p>
                          <p className="font-semibold text-lg">{selectedChartPatient.primaryInsurance.insuranceName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Policy Number</p>
                          <p className="font-medium">{selectedChartPatient.primaryInsurance.policyNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Group Number</p>
                          <p className="font-medium">{selectedChartPatient.primaryInsurance.groupNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Subscriber</p>
                          <p className="font-medium">{selectedChartPatient.primaryInsurance.subscriberName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Relationship</p>
                          <p className="font-medium">{selectedChartPatient.primaryInsurance.relationship}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Copay</p>
                          <p className="font-medium">{selectedChartPatient.primaryInsurance.copay}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Annual Deductible</p>
                          <p className="font-medium">{selectedChartPatient.primaryInsurance.deductible}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Deductible Met</p>
                          <p className="font-medium">{selectedChartPatient.primaryInsurance.deductibleMet}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Out-of-Pocket Max</p>
                          <p className="font-medium">{selectedChartPatient.primaryInsurance.outOfPocketMax}</p>
                        </div>
                        {selectedChartPatient.primaryInsurance.authorizationRequired && (
                          <>
                            <div className="col-span-2 md:col-span-3">
                              <Badge className="bg-blue-100 text-blue-800">Prior Authorization Required</Badge>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Auth Number</p>
                              <p className="font-medium">{selectedChartPatient.primaryInsurance.authNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Authorized Visits</p>
                              <p className="font-medium">
                                {selectedChartPatient.primaryInsurance.authorizedVisits} visits
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Visits Used</p>
                              <p className="font-medium">
                                {selectedChartPatient.primaryInsurance.visitsUsed} of{" "}
                                {selectedChartPatient.primaryInsurance.authorizedVisits}
                              </p>
                              <Progress
                                value={
                                  (selectedChartPatient.primaryInsurance.visitsUsed! /
                                    selectedChartPatient.primaryInsurance.authorizedVisits!) *
                                  100
                                }
                                className="mt-2 h-2"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Initial Diagnosis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Initial Diagnosis & Referral Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Referring Physician</p>
                        <p className="font-medium">{selectedChartPatient.referringPhysician}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          NPI: {selectedChartPatient.referringPhysicianNPI}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Primary Diagnosis</p>
                        <p className="font-medium">{selectedChartPatient.initialDiagnosis}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ICD-10 Codes</p>
                        <div className="flex gap-2 mt-1">
                          {selectedChartPatient.diagnosisCodes.map((code) => (
                            <Badge key={code} variant="outline">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Onset Date</p>
                          <p className="font-medium">{selectedChartPatient.onsetDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Therapy Type</p>
                          <Badge className={getTherapyBadgeColor(selectedChartPatient.therapyType)}>
                            {selectedChartPatient.therapyType}
                          </Badge>
                        </div>
                      </div>
                      {selectedChartPatient.surgicalHistory && (
                        <div>
                          <p className="text-sm text-muted-foreground">Surgical History</p>
                          <p className="font-medium">{selectedChartPatient.surgicalHistory}</p>
                        </div>
                      )}
                      {selectedChartPatient.precautions && selectedChartPatient.precautions.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Precautions
                          </p>
                          <ul className="mt-2 space-y-1">
                            {selectedChartPatient.precautions.map((precaution, idx) => (
                              <li key={idx} className="text-sm font-medium text-amber-700 bg-amber-50 p-2 rounded">
                                • {precaution}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Current Medications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Current Medications
                      </CardTitle>
                      <CardDescription>Medications affecting therapy response and treatment planning</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedChartPatient.currentMedications.map((med, idx) => (
                          <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-base">{med.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {med.dosage} • {med.frequency}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Prescribed by {med.prescribedBy} on {med.startDate}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              <div className="bg-blue-50 p-3 rounded">
                                <p className="text-sm font-medium text-blue-900">Relevance to Therapy:</p>
                                <p className="text-sm text-blue-800 mt-1">{med.relevanceToTherapy}</p>
                              </div>
                              {med.precautions !== "None specific to therapy" && (
                                <div className="bg-amber-50 p-3 rounded flex gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-amber-900">Therapy Precautions:</p>
                                    <p className="text-sm text-amber-800 mt-1">{med.precautions}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedChartPatient.currentMedications.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No current medications documented
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              </TabsContent>

              <TabsContent value="visits" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Complete Visit History</h3>
                  <Badge>
                    {selectedChartPatient.sessionsCompleted} of {selectedChartPatient.totalSessions} visits
                  </Badge>
                </div>

                {/* Visit entries */}
                {Array.from({ length: selectedChartPatient.sessionsCompleted }).map((_, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Visit #{selectedChartPatient.sessionsCompleted - idx} - Follow-up
                          {signedVisits.has(idx) && (
                            <Badge className="ml-2 bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Signed
                            </Badge>
                          )}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {new Date(Date.now() - idx * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold">Subjective:</p>
                        <p className="text-sm">
                          Patient reports {idx === 0 ? "significant improvement" : "continued progress"} in pain levels
                          and function. Pain level: {Math.max(2, 8 - idx)}/10.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Objective:</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">ROM:</span> {80 + idx * 5}°
                          </div>
                          <div>
                            <span className="text-muted-foreground">Strength:</span> {3 + Math.min(idx * 0.5, 2)}/5
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pain:</span> {Math.max(2, 8 - idx)}/10
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Interventions:</p>
                        <p className="text-sm">Therapeutic exercise (97110), Manual therapy (97140)</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Assessment:</p>
                        <p className="text-sm">
                          Patient demonstrating {idx === 0 ? "excellent" : "good"} progress toward functional goals.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Plan:</p>
                        <p className="text-sm">Continue current treatment plan, progress HEP exercises.</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Badge variant="outline">CPT: 97110</Badge>
                        <Badge variant="outline">CPT: 97140</Badge>
                        <Badge variant="outline">45 minutes</Badge>
                      </div>
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          variant={signedVisits.has(idx) ? "outline" : "default"}
                          onClick={() => {
                            setSelectedVisitForSign(idx)
                            setShowSignVisitDialog(true)
                          }}
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          {signedVisits.has(idx) ? "Re-sign & Export" : "Sign & Export PDF"}
                        </Button>
                        {signedVisits.has(idx) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVisitForSign(idx)
                              signAndExportVisit()
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="evaluations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Initial Evaluation</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        Date.now() - selectedChartPatient.sessionsCompleted * 7 * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Chief Complaint:</p>
                      <p className="text-sm">{selectedChartPatient.initialDiagnosis}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">History:</p>
                      <p className="text-sm">
                        Patient underwent surgical repair 6 weeks ago. Currently experiencing pain and limited ROM.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Functional Limitations:</p>
                      <p className="text-sm">Unable to reach overhead, difficulty with ADLs, limited work capacity.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Short-term Goals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Increase ROM to 120°</span>
                        <div className="flex items-center gap-2">
                          <Progress value={85} className="w-24" />
                          <span className="text-xs text-muted-foreground">85%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Reduce pain to 3/10</span>
                        <div className="flex items-center gap-2">
                          <Progress value={70} className="w-24" />
                          <span className="text-xs text-muted-foreground">70%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Long-term Goals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Return to full work duties</span>
                        <div className="flex items-center gap-2">
                          <Progress value={60} className="w-24" />
                          <span className="text-xs text-muted-foreground">60%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Independent with HEP</span>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedChartPatient.hepCompliance} className="w-24" />
                          <span className="text-xs text-muted-foreground">{selectedChartPatient.hepCompliance}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Physician Referral - 01/15/2025
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Insurance Authorization - 01/16/2025
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Initial Evaluation Report
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Progress Note - Week 4
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSignVisitDialog} onOpenChange={setShowSignVisitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Visit Note</DialogTitle>
            <DialogDescription>
              Sign this visit note to export as PDF. Your electronic signature will be recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Visit Information</Label>
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <p>
                  <strong>Patient:</strong> {selectedChartPatient?.name}
                </p>
                <p>
                  <strong>Visit #:</strong>{" "}
                  {selectedVisitForSign !== null && selectedChartPatient
                    ? selectedChartPatient.sessionsCompleted - selectedVisitForSign
                    : ""}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {selectedVisitForSign !== null
                    ? new Date(Date.now() - selectedVisitForSign * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                    : ""}
                </p>
              </div>
            </div>
            <div>
              <Label>Electronic Signature *</Label>
              <Input
                placeholder="Type your full name"
                value={visitSignature}
                onChange={(e) => setVisitSignature(e.target.value)}
                className="font-serif text-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                By typing your name, you are electronically signing this document
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-blue-900">Electronic Signature Attestation:</p>
              <p className="text-blue-800 mt-1">
                I attest that the information documented in this visit note is accurate and complete. My electronic
                signature is legally binding and equivalent to my handwritten signature.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSignVisitDialog(false)}>
                Cancel
              </Button>
              <Button onClick={signAndExportVisit} disabled={!visitSignature}>
                <PenTool className="h-4 w-4 mr-2" />
                Sign & Export PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Movement Analyzer Dialog */}
      <Dialog open={showAIAnalyzer} onOpenChange={setShowAIAnalyzer}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>AI Movement Analyzer</DialogTitle>
            <DialogDescription>
              {aiAnalyzerMode === "evaluation"
                ? "Record patient movement for AI-powered evaluation and documentation"
                : "Monitor exercise form and provide real-time feedback"}
            </DialogDescription>
          </DialogHeader>
          <AIMovementAnalyzer
            exerciseName={currentExercise}
            mode={aiAnalyzerMode}
            onAnalysisComplete={(analysis) => {
              console.log("[v0] AI Analysis complete:", analysis)
              toast({
                title: "Analysis Complete",
                description: `ROM: ${analysis.rangeOfMotion}°, Quality: ${analysis.movementQuality}%, Pain: ${analysis.painIndicators}`,
              })
              setShowAIAnalyzer(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
