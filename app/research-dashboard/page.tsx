"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Database,
  FileBarChart,
  TrendingUp,
  Users,
  Shield,
  Download,
  Plus,
  Search,
  Target,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lightbulb,
  BookOpen,
  Heart,
  Activity,
  Zap,
  Award,
  Building2,
  ArrowRight,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  Clock,
  DollarSign,
} from "lucide-react"

interface ResearchStudy {
  id: string
  title: string
  type: "implementation" | "pilot" | "quality_improvement" | "outcomes" | "equity"
  status: "planning" | "active" | "data_collection" | "analysis" | "completed"
  pi_name: string
  start_date: string
  end_date: string
  enrollment_target: number
  current_enrollment: number
  irb_status: "pending" | "approved" | "exempt"
  funding_source: string
  description: string
}

interface EvidenceBasedPractice {
  id: string
  name: string
  category: string
  adoption_rate: number
  fidelity_score: number
  sustainability_score: number
  trained_staff: number
  total_staff: number
  last_fidelity_review: string
  outcomes_tracked: string[]
}

interface QualityMetric {
  id: string
  name: string
  category: string
  current_value: number
  target_value: number
  trend: "up" | "down" | "stable"
  benchmark: number
  data_source: string
}

interface SUDMedicationDevelopment {
  id: string
  medication_name: string
  development_stage: "discovery" | "preclinical" | "phase_1" | "phase_2" | "phase_3" | "fda_review" | "approved"
  target_indication: string
  mechanism_of_action: string
  lead_researcher: string
  sponsor: string
  fda_ind_number?: string
  enrollment_status: {
    target: number
    current: number
  }
  primary_endpoints: string[]
  efficacy_data?: any
  safety_data?: any
  regulatory_milestones: any[]
}

interface ClinicalTrial {
  id: string
  title: string
  phase: string
  status: "Enrolling" | "Active" | "Completed"
  n_enrolled: number
  n_target: number
  primary_outcome: string
  secondary_outcomes: string[]
  eligibility: string
  intervention: string
  sites: number
  principal_investigator: string
  regulatory_status: string
}

interface OverdosePreventionStudy {
  id: string
  study_name: string
  study_type: string
  status: "Active" | "Data Collection" | "Completed"
  participants: number
  overdose_reversals_documented?: number
  lives_saved?: number
  kits_distributed?: number
  training_sessions?: number
  community_partners?: number
  behavior_change_rate?: number
  strips_distributed?: number
  key_findings: string
}

// Mock CCBHC certification data
const ccbhcCertificationDataState = {
  certification_status: "Active" as string,
  last_audit_date: "2025-12-15",
  next_audit_due: "2026-12-15",
  overall_compliance_score: 94,

  // Core Service Requirements
  core_services: {
    crisis_services_24_7: { compliant: true, score: 100, notes: "24/7 crisis line operational" },
    screening_assessment: { compliant: true, score: 98, notes: "Comprehensive screening process" },
    outpatient_services: { compliant: true, score: 95, notes: "Individual & group therapy available" },
    outpatient_clinic_primary_care: { compliant: true, score: 92, notes: "Integrated primary care" },
    care_coordination: { compliant: true, score: 96, notes: "Care coordinators assigned to all patients" },
    targeted_case_management: { compliant: true, score: 93, notes: "Case management for high-need patients" },
    psychiatric_rehabilitation: { compliant: true, score: 89, notes: "Skills training & rehabilitation" },
    peer_support: { compliant: true, score: 97, notes: "Certified peer specialists on staff" },
    family_support: { compliant: true, score: 91, notes: "Family psychoeducation & support groups" },
  },

  // Access & Availability
  access_metrics: {
    same_day_access_available: true,
    walk_ins_accepted: true,
    two_four_hour_crisis_response: true, // Corrected key name
    avg_wait_time_days: 0.5,
    accepts_all_payers: true,
    sliding_scale_available: true,
    no_wrong_door_policy: true,
    patients_turned_away_30_days: 0,
  },

  // Care Coordination & Integration
  care_coordination_metrics: {
    patients_with_care_coordinator: 892,
    total_patients: 918,
    percentage_with_coordinator: 97,
    community_partnerships_active: 45,
    successful_referrals_completed: 234,
    pending_referrals: 12,
    care_coordination_meetings_30_days: 67,
  },

  // Quality Measures
  quality_outcomes: {
    follow_up_within_7_days_discharge: 89,
    employment_education_engagement: 56,
    stable_housing: 78,
    screening_for_tobacco_use: 94,
    depression_screening: 96,
    screening_for_sud: 98,
    initiation_engagement_sud_treatment: 82,
  },

  // Staffing Requirements
  staffing_compliance: {
    designated_collaborating_organization: true,
    psychiatric_consultant_available: true,
    licensed_prescriber_on_staff: true,
    licensed_clinical_staff_ratio_met: true,
    peer_specialists_employed: true,
    care_coordinators_employed: true,
    staff_training_compliance: 96,
  },
}

// Mock data for fallback
const mockStudiesData: ResearchStudy[] = [
  {
    id: "1",
    title: "Implementation of Contingency Management in OTP Settings",
    type: "implementation",
    status: "active",
    pi_name: "Dr. Sarah Chen",
    start_date: "2025-01-15",
    end_date: "2026-01-15",
    enrollment_target: 200,
    current_enrollment: 145,
    irb_status: "approved",
    funding_source: "SAMHSA",
    description:
      "Evaluating the adoption and sustainability of contingency management protocols in community-based OTP settings.",
  },
  {
    id: "2",
    title: "CCBHC Quality Improvement Initiative",
    type: "quality_improvement",
    status: "data_collection",
    pi_name: "Dr. Michael Thompson",
    start_date: "2024-09-01",
    end_date: "2025-09-01",
    enrollment_target: 500,
    current_enrollment: 423,
    irb_status: "exempt",
    funding_source: "State CCBHC Grant",
    description: "Continuous quality improvement program tracking CCBHC performance measures and patient outcomes.",
  },
  {
    id: "3",
    title: "Health Equity in MAT Access",
    type: "equity",
    status: "active",
    pi_name: "Dr. Angela Martinez",
    start_date: "2025-02-01",
    end_date: "2026-02-01",
    enrollment_target: 300,
    current_enrollment: 89,
    irb_status: "approved",
    funding_source: "NIH HEAL Initiative",
    description:
      "Examining disparities in medication-assisted treatment access and outcomes across demographic groups.",
  },
  {
    id: "4",
    title: "Telehealth Integration Pilot",
    type: "pilot",
    status: "completed",
    pi_name: "Dr. James Wilson",
    start_date: "2024-06-01",
    end_date: "2024-12-31",
    enrollment_target: 100,
    current_enrollment: 98,
    irb_status: "approved",
    funding_source: "Internal",
    description: "Pilot study evaluating telehealth integration for counseling services in OTP settings.",
  },
]

// Mock evidence-based practices
const mockEbps: EvidenceBasedPractice[] = [
  {
    id: "1",
    name: "Motivational Interviewing (MI)",
    category: "Counseling",
    adoption_rate: 87,
    fidelity_score: 78,
    sustainability_score: 85,
    trained_staff: 45,
    total_staff: 52,
    last_fidelity_review: "2025-01-10",
    outcomes_tracked: ["Treatment retention", "Patient satisfaction", "Substance use reduction"],
  },
  {
    id: "2",
    name: "Contingency Management",
    category: "Behavioral",
    adoption_rate: 65,
    fidelity_score: 72,
    sustainability_score: 68,
    trained_staff: 28,
    total_staff: 52,
    last_fidelity_review: "2024-12-15",
    outcomes_tracked: ["UDS results", "Attendance", "Treatment completion"],
  },
  {
    id: "3",
    name: "Cognitive Behavioral Therapy (CBT)",
    category: "Counseling",
    adoption_rate: 92,
    fidelity_score: 84,
    sustainability_score: 90,
    trained_staff: 48,
    total_staff: 52,
    last_fidelity_review: "2025-01-05",
    outcomes_tracked: ["Depression scores", "Anxiety scores", "Coping skills"],
  },
  {
    id: "4",
    name: "Trauma-Informed Care",
    category: "Organizational",
    adoption_rate: 78,
    fidelity_score: 71,
    sustainability_score: 82,
    trained_staff: 52,
    total_staff: 52,
    last_fidelity_review: "2024-11-20",
    outcomes_tracked: ["Staff knowledge", "Patient safety", "Re-traumatization rates"],
  },
  {
    id: "5",
    name: "Medication-Assisted Treatment (MAT)",
    category: "Medical",
    adoption_rate: 100,
    fidelity_score: 95,
    sustainability_score: 98,
    trained_staff: 12,
    total_staff: 12,
    last_fidelity_review: "2025-01-02",
    outcomes_tracked: ["Retention", "Overdose prevention", "Viral suppression"],
  },
]

// Mock quality metrics
const mockQualityMetrics: QualityMetric[] = [
  {
    id: "1",
    name: "Treatment Retention (90-day)",
    category: "Outcomes",
    current_value: 72,
    target_value: 80,
    trend: "up",
    benchmark: 75,
    data_source: "EHR",
  },
  {
    id: "2",
    name: "Follow-up After ED Visit",
    category: "CCBHC",
    current_value: 68,
    target_value: 75,
    trend: "up",
    benchmark: 70,
    data_source: "Claims",
  },
  {
    id: "3",
    name: "Depression Remission Rate",
    category: "Outcomes",
    current_value: 45,
    target_value: 50,
    trend: "stable",
    benchmark: 48,
    data_source: "PHQ-9",
  },
  {
    id: "4",
    name: "Initiation of MAT",
    category: "Access",
    current_value: 89,
    target_value: 95,
    trend: "up",
    benchmark: 85,
    data_source: "EHR",
  },
  {
    id: "5",
    name: "Screening for SDoH",
    category: "CCBHC",
    current_value: 82,
    target_value: 90,
    trend: "up",
    benchmark: 80,
    data_source: "EHR",
  },
  {
    id: "6",
    name: "Care Coordination Rate",
    category: "Integration",
    current_value: 65,
    target_value: 80,
    trend: "down",
    benchmark: 70,
    data_source: "EHR",
  },
]

// Mock health system metrics
const mockHealthSystemMetrics = [
  {
    id: "1",
    category: "HIV/AIDS Monitoring",
    metrics: [
      { name: "HIV-related Mortality Rate", current: 2.3, target: 1.5, unit: "per 100k", trend: "down" },
      { name: "HIV-related Morbidity Rate", current: 15.2, target: 12.0, unit: "per 100k", trend: "down" },
      { name: "Viral Suppression Rate", current: 82, target: 90, unit: "%", trend: "up" },
      { name: "Linkage to Care <30 days", current: 71, target: 85, unit: "%", trend: "up" },
      { name: "Retention in Care (12mo)", current: 74, target: 85, unit: "%", trend: "stable" },
    ],
  },
  {
    id: "2",
    category: "Vital Statistics System",
    metrics: [
      { name: "Birth Registration Completeness", current: 94, target: 98, unit: "%", trend: "up" },
      { name: "Death Registration Completeness", current: 88, target: 95, unit: "%", trend: "up" },
      { name: "Natality Data Quality Score", current: 87, target: 95, unit: "%", trend: "up" },
      { name: "Mortality Data Quality Score", current: 85, target: 95, unit: "%", trend: "up" },
      { name: "Vital Events Processing Time", current: 12, target: 7, unit: "days", trend: "down" },
    ],
  },
  {
    id: "3",
    category: "Outbreak Detection & Response",
    metrics: [
      { name: "Disease Surveillance Coverage", current: 92, target: 98, unit: "%", trend: "up" },
      { name: "Outbreak Detection Time", current: 3.2, target: 2.0, unit: "days", trend: "down" },
      { name: "Contact Tracing Completion", current: 78, target: 90, unit: "%", trend: "up" },
      { name: "Emergency Response Readiness", current: 83, target: 95, unit: "%", trend: "up" },
      { name: "Reportable Disease Compliance", current: 89, target: 98, unit: "%", trend: "up" },
    ],
  },
  {
    id: "4",
    category: "Health Information System (HIS)",
    metrics: [
      { name: "EMR System Interoperability", current: 76, target: 95, unit: "%", trend: "up" },
      { name: "Data Quality Index", current: 82, target: 90, unit: "%", trend: "up" },
      { name: "System Integration Score", current: 71, target: 85, unit: "%", trend: "up" },
      { name: "Real-time Data Availability", current: 88, target: 95, unit: "%", trend: "up" },
      { name: "Cross-facility Data Exchange", current: 69, target: 85, unit: "%", trend: "up" },
    ],
  },
  {
    id: "5",
    category: "Patient-Centered Care",
    metrics: [
      { name: "Unique Patient Identification", current: 97, target: 100, unit: "%", trend: "up" },
      { name: "Longitudinal Record Completeness", current: 84, target: 95, unit: "%", trend: "up" },
      { name: "Cross-setting Care Continuity", current: 72, target: 90, unit: "%", trend: "up" },
      { name: "Border Region Coordination", current: 68, target: 80, unit: "%", trend: "up" },
      { name: "Community-Facility Integration", current: 73, target: 85, unit: "%", trend: "up" },
    ],
  },
]

// Mock specialty programs
const mockSpecialtyPrograms = [
  {
    id: "1",
    specialty: "Opioid Treatment Program (OTP)",
    services: ["MAT", "Counseling", "Medical Services", "Dosing", "UDS"],
    patients: 847,
    outcomes: { retention: 78, viralSuppression: 82, negativeUDS: 71 },
    compliance: "SAMHSA Certified",
  },
  {
    id: "2",
    specialty: "Certified Community Behavioral Health Clinic (CCBHC)",
    services: ["Crisis", "Screening", "Therapy", "Peer Support", "Care Coordination"],
    patients: 1523,
    outcomes: { followUpED: 68, screeningComplete: 92, coordinationRate: 74 },
    compliance: "CCBHC Certified",
  },
  {
    id: "3",
    specialty: "County Health Department",
    services: ["Immunizations", "STI/HIV Testing", "TB Control", "CHW Services", "Environmental"],
    patients: 3214,
    outcomes: { immunizationRate: 89, screeningCoverage: 82, outbreakControl: 95 },
    compliance: "State Accredited",
  },
  {
    id: "4",
    specialty: "Primary Care (FQHC)",
    services: ["Primary Care", "Dental", "Pharmacy", "Behavioral Health Integration"],
    patients: 4892,
    outcomes: { chronicDiseaseControl: 73, preventiveScreening: 84, patientSatisfaction: 88 },
    compliance: "HRSA Compliant",
  },
  {
    id: "5",
    specialty: "Maternal & Child Health",
    services: ["Prenatal Care", "WIC", "Home Visiting", "Immunizations", "Development Screening"],
    patients: 1067,
    outcomes: { prenatalCare: 87, birthOutcomes: 92, childDevelopment: 81 },
    compliance: "Title V Compliant",
  },
  {
    id: "6",
    specialty: "Rehabilitation Services",
    services: ["Physical Therapy", "Occupational Therapy", "Speech Therapy", "Home Exercise Programs"],
    patients: 534,
    outcomes: { functionalGain: 78, goalAchievement: 82, patientCompliance: 76 },
    compliance: "CARF Accredited",
  },
  {
    id: "7",
    specialty: "Communicable Disease Control",
    services: ["HIV/AIDS", "TB", "STI", "Hepatitis", "COVID-19"],
    patients: 892,
    outcomes: { linkageToCare: 84, treatmentCompletion: 78, outbreakContainment: 93 },
    compliance: "CDC Standards",
  },
]

// Mock outbreak alerts
const mockOutbreakAlerts = [
  {
    id: "1",
    disease: "Influenza A",
    status: "Monitoring",
    casesReported: 23,
    threshold: 50,
    trend: "Increasing",
    lastUpdate: "2 hours ago",
    severity: "Low",
  },
  {
    id: "2",
    disease: "Hepatitis A",
    status: "Active Investigation",
    casesReported: 8,
    threshold: 5,
    trend: "Cluster Detected",
    lastUpdate: "30 minutes ago",
    severity: "High",
  },
  {
    id: "3",
    disease: "COVID-19 Variant",
    status: "Monitoring",
    casesReported: 12,
    threshold: 20,
    trend: "Stable",
    lastUpdate: "1 hour ago",
    severity: "Medium",
  },
]

// Mock SUD medication development data
const mockSudMedicationsData: SUDMedicationDevelopment[] = [
  {
    id: "1",
    medication_name: "Naloxone Extended-Release Injectable",
    development_stage: "phase_3",
    target_indication: "Opioid Overdose Prevention",
    mechanism_of_action: "Mu-opioid receptor antagonist with extended duration",
    lead_researcher: "Dr. Maria Rodriguez",
    sponsor: "NIH HEAL Initiative",
    fda_ind_number: "IND-145892",
    enrollment_status: { target: 500, current: 423 },
    primary_endpoints: ["Overdose reversal rate", "Duration of effect", "Safety profile"],
    efficacy_data: { success_rate: 94, mean_duration_hours: 72 },
    safety_data: { adverse_events: 12, serious_adverse_events: 2 },
    regulatory_milestones: [
      { milestone: "IND Submission", date: "2024-03-15", status: "completed" },
      { milestone: "Phase 3 Initiation", date: "2024-08-01", status: "completed" },
      { milestone: "NDA Submission", date: "2026-06-01", status: "planned" },
    ],
  },
  {
    id: "2",
    medication_name: "Buprenorphine + Naltrexone Combination",
    development_stage: "phase_2",
    target_indication: "Opioid + Alcohol Co-morbid SUD",
    mechanism_of_action: "Partial opioid agonist with opioid antagonist for dual treatment",
    lead_researcher: "Dr. James Patterson",
    sponsor: "SAMHSA + Private Partnership",
    fda_ind_number: "IND-148723",
    enrollment_status: { target: 200, current: 156 },
    primary_endpoints: ["Dual abstinence rate", "Craving scores", "Treatment retention"],
    regulatory_milestones: [
      { milestone: "IND Submission", date: "2024-11-20", status: "completed" },
      { milestone: "Phase 2 Enrollment", date: "2025-01-15", status: "in_progress" },
    ],
  },
  {
    id: "3",
    medication_name: "Implantable Naltrexone Device",
    development_stage: "preclinical",
    target_indication: "Long-term Opioid Relapse Prevention",
    mechanism_of_action: "Continuous-release subcutaneous implant for 6-month duration",
    lead_researcher: "Dr. Sarah Chen",
    sponsor: "Internal R&D + NIH Grant",
    enrollment_status: { target: 0, current: 0 },
    primary_endpoints: ["Steady-state plasma levels", "Device integrity", "Biocompatibility"],
    regulatory_milestones: [
      { milestone: "Preclinical Design", date: "2024-06-01", status: "completed" },
      { milestone: "Animal Studies", date: "2025-03-01", status: "in_progress" },
      { milestone: "IND Submission", date: "2026-01-01", status: "planned" },
    ],
  },
]

// Mock clinical trials data
const mockClinicalTrialsData: ClinicalTrial[] = [
  {
    id: "CT-2025-001",
    title: "Efficacy of Contingency Management for Stimulant Use Disorder",
    phase: "Phase 3",
    status: "Enrolling",
    n_enrolled: 234,
    n_target: 400,
    primary_outcome: "Negative UDS at 12 weeks",
    secondary_outcomes: ["Treatment retention", "Quality of life", "Employment status"],
    eligibility: "Adults 18-65 with cocaine or methamphetamine use disorder",
    intervention: "CM with escalating rewards vs. standard care",
    sites: 8,
    principal_investigator: "Dr. Angela Martinez",
    regulatory_status: "IRB Approved, FDA IND Active",
  },
  {
    id: "CT-2025-002",
    title: "Novel GABA-B Agonist for Alcohol Withdrawal Management",
    phase: "Phase 2",
    status: "Active",
    n_enrolled: 89,
    n_target: 120,
    primary_outcome: "CIWA-Ar score reduction",
    secondary_outcomes: ["Seizure incidence", "Adverse events", "Patient comfort scores"],
    eligibility: "Adults with alcohol use disorder undergoing medically-supervised withdrawal",
    intervention: "Investigational GABA-B agonist vs. standard benzodiazepine protocol",
    sites: 4,
    principal_investigator: "Dr. Michael Thompson",
    regulatory_status: "IRB Approved, IND #147923",
  },
]

// Mock overdose prevention studies
const mockOverdosePreventionStudies: OverdosePreventionStudy[] = [
  {
    id: "OD-001",
    study_name: "Community Naloxone Distribution Impact Study",
    study_type: "Implementation Science",
    status: "Active",
    participants: 1247,
    overdose_reversals_documented: 342,
    lives_saved: 342,
    kits_distributed: 2890,
    training_sessions: 156,
    community_partners: 23,
    key_findings: "78% reduction in fatal overdoses in intervention communities vs. control",
  },
  {
    id: "OD-002",
    study_name: "Fentanyl Test Strip Effectiveness in Harm Reduction",
    study_type: "Behavioral Intervention",
    status: "Data Collection",
    participants: 567,
    behavior_change_rate: 82,
    strips_distributed: 5600,
    key_findings: "82% of participants modified drug use behavior after positive fentanyl test",
  },
]

export default function ResearchDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewStudyDialog, setShowNewStudyDialog] = useState(false)
  const [showDataExportDialog, setShowDataExportDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch research data from APIs
  const [studies, setStudies] = useState<ResearchStudy[]>([])
  const [sudMedications, setSudMedications] = useState<SUDMedicationDevelopment[]>([])
  const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>([])
  const [ccbhcCompliance, setCcbhcCompliance] = useState<any>(null)
  const [healthSystemMetrics, setHealthSystemMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch all data in parallel
        const [studiesRes, medsRes, trialsRes, ccbhcRes, metricsRes] = await Promise.all([
          fetch("/api/research/studies"),
          fetch("/api/research/sud-medications"),
          fetch("/api/research/clinical-trials"),
          fetch("/api/research/ccbhc-compliance"),
          fetch("/api/research/health-system-metrics"),
        ])

        const [studiesData, medsData, trialsData, ccbhcData, metricsData] = await Promise.all([
          studiesRes.json(),
          medsRes.json(),
          trialsRes.json(),
          ccbhcRes.json(),
          metricsRes.json(),
        ])

        if (studiesData?.studies) {
          setStudies(studiesData.studies)
        } else {
          setStudies(mockStudiesData)
        }

        if (medsData?.medications) {
          setSudMedications(medsData.medications)
        } else {
          setSudMedications(mockSudMedicationsData)
        }

        if (trialsData?.trials) {
          setClinicalTrials(trialsData.trials)
        } else {
          setClinicalTrials(mockClinicalTrialsData)
        }

        if (ccbhcData && !ccbhcData.error) {
          setCcbhcCompliance(ccbhcData)
        } else {
          setCcbhcCompliance(ccbhcCertificationDataState)
        }

        if (metricsData && !metricsData.error) {
          setHealthSystemMetrics(metricsData)
        } else {
          setHealthSystemMetrics(mockHealthSystemMetrics)
        }
      } catch (error) {
        console.error("[v0] Error fetching research data:", error)
        // Fallback to mock data on error
        loadMockData()
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const loadMockData = () => {
    // Set mock data as fallback
    setStudies(mockStudiesData)
    setSudMedications(mockSudMedicationsData)
    setClinicalTrials(mockClinicalTrialsData)
    setCcbhcCompliance(ccbhcCertificationDataState)
    setHealthSystemMetrics(mockHealthSystemMetrics)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return "bg-green-100 text-green-800"
      case "data_collection":
        return "bg-blue-100 text-blue-800"
      case "planning":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "analysis":
        return "bg-purple-100 text-purple-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      default:
        return <ArrowRight className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader
          title="Research & Public Health Data Science Center"
          subtitle="Health Information System | Outbreak Detection | Vital Statistics | Learning Health System"
        />

        <main className="p-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">HIV Monitoring</p>
                    <p className="text-2xl font-bold text-gray-900">82%</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Viral suppression rate</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Vital Registry</p>
                    <p className="text-2xl font-bold text-gray-900">94%</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Registration completeness</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Outbreak Detection</p>
                    <p className="text-2xl font-bold text-gray-900">3.2d</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Average detection time</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">HIS Integration</p>
                    <p className="text-2xl font-bold text-gray-900">76%</p>
                  </div>
                  <Database className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Interoperability score</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Patients</p>
                    <p className="text-2xl font-bold text-gray-900">12,969</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Across 7 specialties</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="hiv-monitoring">HIV Monitoring</TabsTrigger>
              <TabsTrigger value="vital-registry">Vital Registry</TabsTrigger>
              <TabsTrigger value="outbreak">Outbreak Detection</TabsTrigger>
              <TabsTrigger value="his">Health Info System</TabsTrigger>
              <TabsTrigger value="specialties">Specialty Programs</TabsTrigger>
              <TabsTrigger value="studies">Research Studies</TabsTrigger>
              <TabsTrigger value="ebp">Evidence-Based Practices</TabsTrigger>
              <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
              <TabsTrigger value="equity">Health Equity</TabsTrigger>
              <TabsTrigger value="ccbhc">CCBHC Compliance</TabsTrigger>
              <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
              <TabsTrigger value="network">Network Analysis</TabsTrigger>
              <TabsTrigger value="nlp">Clinical NLP</TabsTrigger>
              <TabsTrigger value="cost">Cost-Effectiveness</TabsTrigger>
              <TabsTrigger value="data-export">Data Export</TabsTrigger>
              <TabsTrigger value="sud-medications">SUD Medications</TabsTrigger>
              <TabsTrigger value="clinical-trials">Clinical Trials</TabsTrigger>
              <TabsTrigger value="overdose-prevention">Overdose Prevention</TabsTrigger>
              <TabsTrigger value="comorbid-research">Co-morbid SUD</TabsTrigger>
              <TabsTrigger value="regulatory-pathways">Regulatory Pathways</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex justify-center items-center min-h-[50vh]">
                <p>Loading data...</p>
              </div>
            ) : (
              <>
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Learning Health System Cycle */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <RefreshCw className="h-5 w-5 text-cyan-600" />
                          Learning Health System Cycle
                        </CardTitle>
                        <CardDescription>Continuous improvement through data-driven insights</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-3 bg-cyan-50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold">
                              1
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Data Collection</p>
                              <p className="text-sm text-gray-500">Real-time EHR data aggregation</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                          <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                              2
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Analysis & Insights</p>
                              <p className="text-sm text-gray-500">AI-powered pattern recognition</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                          <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                              3
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Knowledge Generation</p>
                              <p className="text-sm text-gray-500">Evidence synthesis and best practices</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                          </div>
                          <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                              4
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Implementation</p>
                              <p className="text-sm text-gray-500">Practice changes and quality improvement</p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Implementation Science Framework */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-600" />
                          Implementation Science Metrics
                        </CardTitle>
                        <CardDescription>RE-AIM Framework Assessment</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Reach</span>
                              <span className="text-sm text-gray-500">78%</span>
                            </div>
                            <Progress value={78} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">% of eligible patients receiving EBPs</p>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Effectiveness</span>
                              <span className="text-sm text-gray-500">72%</span>
                            </div>
                            <Progress value={72} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">Patient outcome improvement rate</p>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Adoption</span>
                              <span className="text-sm text-gray-500">84%</span>
                            </div>
                            <Progress value={84} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">% of staff trained in EBPs</p>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Implementation</span>
                              <span className="text-sm text-gray-500">76%</span>
                            </div>
                            <Progress value={76} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">Fidelity to EBP protocols</p>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Maintenance</span>
                              <span className="text-sm text-gray-500">82%</span>
                            </div>
                            <Progress value={82} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">Long-term sustainability score</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Research Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-green-600" />
                          Recent Research Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            {
                              action: "New participant enrolled",
                              study: "CM Implementation Study",
                              time: "2 hours ago",
                            },
                            {
                              action: "Data collection milestone reached",
                              study: "CCBHC QI Initiative",
                              time: "5 hours ago",
                            },
                            { action: "Fidelity review completed", study: "CBT Protocol", time: "1 day ago" },
                            { action: "Quarterly report generated", study: "Health Equity in MAT", time: "2 days ago" },
                            { action: "IRB amendment approved", study: "Telehealth Pilot", time: "3 days ago" },
                          ].map((activity, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{activity.action}</p>
                                <p className="text-xs text-gray-500">{activity.study}</p>
                              </div>
                              <span className="text-xs text-gray-400">{activity.time}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                            onClick={() => setShowNewStudyDialog(true)}
                          >
                            <Plus className="h-5 w-5" />
                            <span className="text-sm">New Study</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                            onClick={() => setShowDataExportDialog(true)}
                          >
                            <Download className="h-5 w-5" />
                            <span className="text-sm">Export Data</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                          >
                            <FileBarChart className="h-5 w-5" />
                            <span className="text-sm">Generate Report</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                          >
                            <BookOpen className="h-5 w-5" />
                            <span className="text-sm">EBP Library</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="studies">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Research Studies</CardTitle>
                          <CardDescription>Implementation, pilot, and quality improvement studies</CardDescription>
                        </div>
                        <Button onClick={() => setShowNewStudyDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          New Study
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search studies..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="data_collection">Data Collection</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        {studies.map((study) => (
                          <div key={study.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{study.title}</h3>
                                  <Badge className={getStatusColor(study.status)}>
                                    {study.status.replace("_", " ")}
                                  </Badge>
                                  <Badge variant="outline">{study.type.replace("_", " ")}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{study.description}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">PI:</span>
                                    <p className="font-medium">{study.pi_name}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Funding:</span>
                                    <p className="font-medium">{study.funding_source}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">IRB Status:</span>
                                    <Badge className={getStatusColor(study.irb_status)} variant="outline">
                                      {study.irb_status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Timeline:</span>
                                    <p className="font-medium">
                                      {study.start_date} - {study.end_date}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Enrollment Progress</span>
                                <span className="text-sm font-medium">
                                  {study.current_enrollment} / {study.enrollment_target}
                                </span>
                              </div>
                              <Progress
                                value={(study.current_enrollment / study.enrollment_target) * 100}
                                className="h-2"
                              />
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                              <Button size="sm" variant="outline">
                                Data Dashboard
                              </Button>
                              <Button size="sm" variant="outline">
                                Export Data
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ebp">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Evidence-Based Practices Tracker</CardTitle>
                          <CardDescription>Monitor adoption, fidelity, and sustainability of EBPs</CardDescription>
                        </div>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add EBP
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockEbps.map((ebp) => (
                          <div key={ebp.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{ebp.name}</h3>
                                <Badge variant="outline" className="mt-1">
                                  {ebp.category}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Last Fidelity Review</p>
                                <p className="font-medium">{ebp.last_fidelity_review}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-gray-500">Adoption Rate</span>
                                  <span className="text-sm font-medium">{ebp.adoption_rate}%</span>
                                </div>
                                <Progress value={ebp.adoption_rate} className="h-2" />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-gray-500">Fidelity Score</span>
                                  <span className="text-sm font-medium">{ebp.fidelity_score}%</span>
                                </div>
                                <Progress value={ebp.fidelity_score} className="h-2" />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-gray-500">Sustainability</span>
                                  <span className="text-sm font-medium">{ebp.sustainability_score}%</span>
                                </div>
                                <Progress value={ebp.sustainability_score} className="h-2" />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <span className="text-gray-500">Trained Staff: </span>
                                <span className="font-medium">
                                  {ebp.trained_staff}/{ebp.total_staff}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {ebp.outcomes_tracked.map((outcome, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {outcome}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                              <Button size="sm" variant="outline">
                                Fidelity Assessment
                              </Button>
                              <Button size="sm" variant="outline">
                                Training Records
                              </Button>
                              <Button size="sm" variant="outline">
                                Outcomes Report
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quality">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Quality Metrics & Outcomes</CardTitle>
                          <CardDescription>Track performance against benchmarks and targets</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <FileBarChart className="h-4 w-4 mr-2" />
                            Generate Report
                          </Button>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Metric
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">Metric</th>
                              <th className="text-left p-3 font-medium">Category</th>
                              <th className="text-center p-3 font-medium">Current</th>
                              <th className="text-center p-3 font-medium">Target</th>
                              <th className="text-center p-3 font-medium">Benchmark</th>
                              <th className="text-center p-3 font-medium">Trend</th>
                              <th className="text-center p-3 font-medium">Status</th>
                              <th className="text-center p-3 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mockQualityMetrics.map((metric) => (
                              <tr key={metric.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                  <p className="font-medium">{metric.name}</p>
                                  <p className="text-xs text-gray-500">Source: {metric.data_source}</p>
                                </td>
                                <td className="p-3">
                                  <Badge variant="outline">{metric.category}</Badge>
                                </td>
                                <td className="p-3 text-center font-bold">{metric.current_value}%</td>
                                <td className="p-3 text-center">{metric.target_value}%</td>
                                <td className="p-3 text-center text-gray-500">{metric.benchmark}%</td>
                                <td className="p-3 text-center">{getTrendIcon(metric.trend)}</td>
                                <td className="p-3 text-center">
                                  {metric.current_value >= metric.target_value ? (
                                    <Badge className="bg-green-100 text-green-800">Met</Badge>
                                  ) : metric.current_value >= metric.benchmark ? (
                                    <Badge className="bg-yellow-100 text-yellow-800">Near Target</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800">Below</Badge>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <Button size="sm" variant="ghost">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="equity">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-600" />
                          Health Equity Dashboard
                        </CardTitle>
                        <CardDescription>Monitor disparities across demographic groups</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              <span className="font-medium text-red-800">Identified Disparities</span>
                            </div>
                            <ul className="text-sm text-red-700 space-y-1">
                              <li>• 15% lower retention rate for Hispanic/Latino patients</li>
                              <li>• Rural patients have 23% longer wait times for appointments</li>
                              <li>• Black patients have 12% fewer take-home privileges</li>
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium">Treatment Retention by Race/Ethnicity</h4>
                            {[
                              { group: "White", rate: 74, benchmark: 72 },
                              { group: "Black/African American", rate: 68, benchmark: 72 },
                              { group: "Hispanic/Latino", rate: 61, benchmark: 72 },
                              { group: "Asian", rate: 78, benchmark: 72 },
                              { group: "Other/Multi-racial", rate: 70, benchmark: 72 },
                            ].map((item) => (
                              <div key={item.group}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">{item.group}</span>
                                  <span
                                    className={`text-sm font-medium ${item.rate < item.benchmark ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {item.rate}%
                                  </span>
                                </div>
                                <div className="relative">
                                  <Progress value={item.rate} className="h-2" />
                                  <div
                                    className="absolute top-0 w-0.5 h-2 bg-gray-800"
                                    style={{ left: `${item.benchmark}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                            <p className="text-xs text-gray-500 mt-2">Black line indicates 72% benchmark</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Equity Improvement Initiatives</CardTitle>
                        <CardDescription>Active programs to address disparities</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            {
                              title: "Culturally Adapted Counseling Program",
                              status: "active",
                              target_group: "Hispanic/Latino",
                              start_date: "2025-01-01",
                              progress: 35,
                            },
                            {
                              title: "Telehealth Expansion for Rural Access",
                              status: "active",
                              target_group: "Rural Communities",
                              start_date: "2024-10-01",
                              progress: 68,
                            },
                            {
                              title: "Peer Support Worker Diversity Initiative",
                              status: "planning",
                              target_group: "Black/African American",
                              start_date: "2025-04-01",
                              progress: 15,
                            },
                          ].map((initiative, idx) => (
                            <div key={idx} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">{initiative.title}</h4>
                                  <p className="text-sm text-gray-500">Target: {initiative.target_group}</p>
                                </div>
                                <Badge className={getStatusColor(initiative.status)}>{initiative.status}</Badge>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-500">Progress</span>
                                <span className="text-sm font-medium">{initiative.progress}%</span>
                              </div>
                              <Progress value={initiative.progress} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="ccbhc" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        CCBHC Certification Compliance
                      </CardTitle>
                      <CardDescription>
                        Tracking compliance with Certified Community Behavioral Health Clinic (CCBHC) certification
                        criteria
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Certification Status */}
                      <div className="grid grid-cols-4 gap-4">
                        <Card className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-500">Overall Compliance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {ccbhcCompliance?.overall_compliance_score ||
                                    ccbhcCertificationDataState.overall_compliance_score}
                                  %
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {ccbhcCompliance?.certification_status ||
                                  ccbhcCertificationDataState.certification_status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Last Audit</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {new Date(
                                ccbhcCompliance?.last_audit_date || ccbhcCertificationDataState.last_audit_date,
                              ).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Next Audit Due</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {new Date(
                                ccbhcCompliance?.next_audit_due || ccbhcCertificationDataState.next_audit_due,
                              ).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Care Coordinators</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {ccbhcCompliance?.care_coordination_metrics?.percentage_with_coordinator ||
                                ccbhcCertificationDataState.care_coordination_metrics.percentage_with_coordinator}
                              %
                            </p>
                            <p className="text-xs text-gray-500">
                              {ccbhcCompliance?.care_coordination_metrics?.patients_with_care_coordinator ||
                                ccbhcCertificationDataState.care_coordination_metrics
                                  .patients_with_care_coordinator}{" "}
                              of{" "}
                              {ccbhcCompliance?.care_coordination_metrics?.total_patients ||
                                ccbhcCertificationDataState.care_coordination_metrics.total_patients}{" "}
                              patients
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Core Service Requirements */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Core Service Requirements</h3>
                        <div className="space-y-2">
                          {Object.entries(
                            ccbhcCompliance?.core_services || ccbhcCertificationDataState.core_services,
                          ).map(([key, service]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                {service.compliant ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-red-600" />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </p>
                                  <p className="text-sm text-gray-500">{service.notes}</p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={`${
                                  service.score >= 95
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : service.score >= 85
                                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {service.score}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Access & Availability */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Access & Availability (Ability to Pay)</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <p className="text-sm font-medium">Same-Day Access</p>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">
                                {ccbhcCompliance?.access_metrics?.same_day_access_available ||
                                ccbhcCertificationDataState.access_metrics.same_day_access_available
                                  ? "✓"
                                  : "✗"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Avg wait:{" "}
                                {ccbhcCompliance?.access_metrics?.avg_wait_time_days ||
                                  ccbhcCertificationDataState.access_metrics.avg_wait_time_days}{" "}
                                days
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                                <p className="text-sm font-medium">Sliding Scale</p>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">
                                {ccbhcCompliance?.access_metrics?.sliding_scale_available ||
                                ccbhcCertificationDataState.access_metrics.sliding_scale_available
                                  ? "Available"
                                  : "Not Available"}
                              </p>
                              <p className="text-xs text-gray-500">Accepts all payers + uninsured</p>
                            </CardContent>
                          </Card>

                          <Card className="border-l-4 border-l-orange-500">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-orange-600" />
                                <p className="text-sm font-medium">No Wrong Door</p>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">
                                {ccbhcCompliance?.access_metrics?.patients_turned_away_30_days ||
                                  ccbhcCertificationDataState.access_metrics.patients_turned_away_30_days}
                              </p>
                              <p className="text-xs text-gray-500">Patients turned away (30 days)</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Quality Outcomes */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Quality Outcomes</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(
                            ccbhcCompliance?.quality_outcomes || ccbhcCertificationDataState.quality_outcomes,
                          ).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                              <p className="text-sm text-gray-700">
                                {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      value >= 85 ? "bg-green-600" : value >= 70 ? "bg-yellow-600" : "bg-red-600"
                                    }`}
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-12 text-right">{value}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Care Coordination */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Care Coordination & Community Integration</h3>
                        <div className="grid grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-gray-500">Active Partnerships</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {ccbhcCompliance?.care_coordination_metrics?.community_partnerships_active ||
                                  ccbhcCertificationDataState.care_coordination_metrics.community_partnerships_active}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-gray-500">Successful Referrals</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {ccbhcCompliance?.care_coordination_metrics?.successful_referrals_completed ||
                                  ccbhcCertificationDataState.care_coordination_metrics.successful_referrals_completed}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-gray-500">Pending Referrals</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {ccbhcCompliance?.care_coordination_metrics?.pending_referrals ||
                                  ccbhcCertificationDataState.care_coordination_metrics.pending_referrals}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-gray-500">Coord. Meetings (30d)</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {ccbhcCompliance?.care_coordination_metrics?.care_coordination_meetings_30_days ||
                                  ccbhcCertificationDataState.care_coordination_metrics
                                    .care_coordination_meetings_30_days}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="predictive">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        Predictive Analytics & Machine Learning
                      </CardTitle>
                      <CardDescription>AI-powered risk stratification and outcome prediction</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Treatment Dropout Risk Model */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Treatment Dropout Risk Prediction</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-red-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600">High Risk</p>
                              <p className="text-3xl font-bold text-red-600">24</p>
                              <p className="text-xs text-gray-500 mt-1">{"Patients (>70% probability)"}</p>
                              <Button size="sm" variant="outline" className="mt-2 w-full bg-transparent">
                                View Patients
                              </Button>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600">Medium Risk</p>
                              <p className="text-3xl font-bold text-yellow-600">58</p>
                              <p className="text-xs text-gray-500 mt-1">Patients (40-70% probability)</p>
                              <Button size="sm" variant="outline" className="mt-2 w-full bg-transparent">
                                View Patients
                              </Button>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600">Low Risk</p>
                              <p className="text-3xl font-bold text-green-600">312</p>
                              <p className="text-xs text-gray-500 mt-1">Patients {"<"}40% probability</p>
                              <Button size="sm" variant="outline" className="mt-2 w-full bg-transparent">
                                View Patients
                              </Button>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Model Performance</p>
                            <div className="grid grid-cols-3 gap-4 mt-2">
                              <div>
                                <p className="text-xs text-gray-600">AUC-ROC</p>
                                <p className="text-lg font-bold">0.87</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Sensitivity</p>
                                <p className="text-lg font-bold">82%</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Specificity</p>
                                <p className="text-lg font-bold">79%</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Overdose Risk Model */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Overdose Risk Prediction</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Predicting optimal treatment pathways based on patient characteristics
                          </p>
                          <div className="space-y-3">
                            {[
                              { name: "Recent relapse", weight: 0.32, impact: "High" },
                              { name: "Poly-substance use", weight: 0.28, impact: "High" },
                              { name: "Mental health comorbidity", weight: 0.18, impact: "Medium" },
                              { name: "Social isolation", weight: 0.12, impact: "Medium" },
                              { name: "Unstable housing", weight: 0.1, impact: "Low" },
                            ].map((factor, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">{factor.name}</span>
                                    <span className="text-xs text-gray-500">
                                      Weight: {(factor.weight * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <Progress value={factor.weight * 100} className="h-2" />
                                </div>
                                <Badge
                                  className={
                                    factor.impact === "High"
                                      ? "bg-red-100 text-red-800"
                                      : factor.impact === "Medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }
                                >
                                  {factor.impact}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Treatment Response Prediction */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Treatment Response Prediction</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Predicting optimal treatment pathways based on patient characteristics
                          </p>
                          <div className="space-y-2">
                            {[
                              { treatment: "Methadone", success_rate: 78, recommended: 145 },
                              { treatment: "Buprenorphine", success_rate: 72, recommended: 89 },
                              { treatment: "Naltrexone", success_rate: 65, recommended: 34 },
                              { treatment: "CBT + MAT", success_rate: 85, recommended: 67 },
                            ].map((treatment, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium">{treatment.treatment}</p>
                                  <p className="text-xs text-gray-500">{treatment.recommended} patients recommended</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">{treatment.success_rate}%</p>
                                  <p className="text-xs text-gray-500">Predicted success</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="network">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        Network Analysis & Care Coordination
                      </CardTitle>
                      <CardDescription>Social network analysis and referral pattern insights</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Referral Network */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Care Coordination Network</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-3">Network Density</p>
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <Progress value={68} className="h-3" />
                                </div>
                                <span className="text-2xl font-bold">68%</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Proportion of active care coordination relationships
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-3">Network Centralization</p>
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <Progress value={42} className="h-3" />
                                </div>
                                <span className="text-2xl font-bold">42%</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Degree to which referrals flow through hubs</p>
                            </div>
                          </div>
                        </div>

                        {/* Key Network Nodes */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Key Network Nodes</h3>
                          <div className="space-y-2">
                            {[
                              {
                                provider: "Primary Care Clinic A",
                                betweenness: 0.89,
                                referrals_out: 156,
                                referrals_in: 142,
                              },
                              {
                                provider: "Mental Health Center",
                                betweenness: 0.76,
                                referrals_out: 98,
                                referrals_in: 123,
                              },
                              {
                                provider: "Emergency Department",
                                betweenness: 0.68,
                                referrals_out: 234,
                                referrals_in: 12,
                              },
                              { provider: "Social Services", betweenness: 0.54, referrals_out: 67, referrals_in: 89 },
                            ].map((node, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <p className="font-medium">{node.provider}</p>
                                  <Badge className="bg-purple-100 text-purple-800">
                                    Centrality: {(node.betweenness * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-500">Outgoing Referrals</p>
                                    <p className="font-semibold">{node.referrals_out}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Incoming Referrals</p>
                                    <p className="font-semibold">{node.referrals_in}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Community Detection */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Care Communities Detected</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Algorithm identified 4 distinct care coordination communities
                          </p>
                          <div className="space-y-2">
                            {[
                              { community: "Primary Care Hub", size: 12, modularity: 0.72 },
                              { community: "Mental Health Cluster", size: 8, modularity: 0.68 },
                              { community: "Substance Use Network", size: 15, modularity: 0.81 },
                              { community: "Social Services Group", size: 6, modularity: 0.59 },
                            ].map((comm, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{comm.community}</p>
                                  <p className="text-xs text-gray-500">{comm.size} providers</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">Modularity: {comm.modularity}</p>
                                  <p className="text-xs text-gray-500">Community cohesion</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="nlp">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Clinical Natural Language Processing
                      </CardTitle>
                      <CardDescription>AI-powered analysis of clinical documentation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Documentation Quality Analysis */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Documentation Quality Metrics</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-600">Completeness Score</p>
                              <p className="text-3xl font-bold text-green-600">87%</p>
                              <Progress value={87} className="mt-2 h-2" />
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-gray-600">Clinical Detail Score</p>
                              <p className="text-3xl font-bold text-blue-600">79%</p>
                              <Progress value={79} className="mt-2 h-2" />
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <p className="text-sm text-gray-600">Compliance Score</p>
                              <p className="text-3xl font-bold text-purple-600">92%</p>
                              <Progress value={92} className="mt-2 h-2" />
                            </div>
                          </div>
                        </div>

                        {/* Sentiment Analysis */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Patient Sentiment Trends</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Extracted from clinical notes and patient communications
                          </p>
                          <div className="space-y-3">
                            {[
                              { sentiment: "Positive/Hopeful", count: 245, percentage: 52 },
                              { sentiment: "Neutral", count: 156, percentage: 33 },
                              { sentiment: "Negative/Distressed", count: 71, percentage: 15 },
                            ].map((item, idx) => (
                              <div key={idx}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{item.sentiment}</span>
                                  <span className="text-sm text-gray-500">
                                    {item.count} notes ({item.percentage}%)
                                  </span>
                                </div>
                                <Progress value={item.percentage} className="h-2" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Clinical Concept Extraction */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Top Clinical Concepts (Last 30 Days)</h3>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { term: "Anxiety", count: 342 },
                              { term: "Depression", count: 298 },
                              { term: "Substance Use", count: 267 },
                              { term: "Medication Adherence", count: 234 },
                              { term: "Family Conflict", count: 189 },
                              { term: "Employment", count: 156 },
                              { term: "Housing Instability", count: 143 },
                              { term: "Trauma", count: 128 },
                              { term: "Social Support", count: 112 },
                              { term: "Coping Skills", count: 98 },
                            ].map((concept, idx) => (
                              <Badge key={idx} variant="outline" className="text-sm">
                                {concept.term} ({concept.count})
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Risk Factor Extraction */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Automated Risk Factor Extraction</h3>
                          <div className="space-y-2">
                            {[
                              { risk: "Suicidal Ideation", detected: 18, flagged: 18, action_taken: 17 },
                              { risk: "Violence/Aggression", detected: 12, flagged: 12, action_taken: 11 },
                              { risk: "Medication Non-Adherence", detected: 45, flagged: 45, action_taken: 38 },
                              { risk: "Relapse Indicators", detected: 67, flagged: 67, action_taken: 59 },
                            ].map((item, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <p className="font-medium">{item.risk}</p>
                                  <Badge className="bg-red-100 text-red-800">{item.detected} detected</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                                  <div>
                                    <p className="text-gray-500">Auto-Flagged</p>
                                    <p className="font-semibold">{item.flagged}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Action Taken</p>
                                    <p className="font-semibold">{item.action_taken}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Response Rate</p>
                                    <p className="font-semibold">
                                      {((item.action_taken / item.flagged) * 100).toFixed(0)}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cost">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Cost-Effectiveness Analysis
                      </CardTitle>
                      <CardDescription>Economic evaluation of interventions and services</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Cost per Quality-Adjusted Life Year (QALY) */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Cost-Effectiveness Ratios</h3>
                          <div className="space-y-3">
                            {[
                              {
                                intervention: "Medication-Assisted Treatment (MAT)",
                                cost_per_qaly: 15420,
                                threshold: "Highly cost-effective",
                                color: "green",
                              },
                              {
                                intervention: "Intensive Outpatient Program (IOP)",
                                cost_per_qaly: 28350,
                                threshold: "Cost-effective",
                                color: "blue",
                              },
                              {
                                intervention: "Peer Recovery Support",
                                cost_per_qaly: 8920,
                                threshold: "Highly cost-effective",
                                color: "green",
                              },
                              {
                                intervention: "Contingency Management",
                                cost_per_qaly: 18670,
                                threshold: "Highly cost-effective",
                                color: "green",
                              },
                            ].map((item, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="font-medium">{item.intervention}</p>
                                  <Badge
                                    className={
                                      item.color === "green"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                    }
                                  >
                                    {item.threshold}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className="text-sm text-gray-600">Cost per QALY</p>
                                  <p className="text-lg font-bold">${item.cost_per_qaly.toLocaleString()}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.cost_per_qaly < 50000 ? "Below $50k threshold" : "Moderate cost-effectiveness"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Return on Investment */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Return on Investment (ROI) Analysis</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              {
                                program: "Emergency Department Diversion",
                                investment: 125000,
                                savings: 487000,
                                roi: 289,
                              },
                              {
                                program: "Housing First Initiative",
                                investment: 280000,
                                savings: 620000,
                                roi: 121,
                              },
                              {
                                program: "Care Coordination Program",
                                investment: 95000,
                                savings: 245000,
                                roi: 158,
                              },
                              {
                                program: "Peer Support Services",
                                investment: 65000,
                                savings: 156000,
                                roi: 140,
                              },
                            ].map((program, idx) => (
                              <div key={idx} className="p-4 border rounded-lg">
                                <p className="font-semibold mb-2">{program.program}</p>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Investment</span>
                                    <span className="font-medium">${program.investment.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Cost Savings</span>
                                    <span className="font-medium text-green-600">
                                      ${program.savings.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Net Benefit</span>
                                    <span className="font-bold text-green-600">
                                      ${(program.savings - program.investment).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">ROI</span>
                                      <span className="text-2xl font-bold text-green-600">{program.roi}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Budget Impact Analysis */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Budget Impact Analysis (3-Year Projection)</h3>
                          <div className="space-y-3">
                            {[
                              { year: "Year 1", costs: 1250000, savings: 890000, net: -360000 },
                              { year: "Year 2", costs: 980000, savings: 1540000, net: 560000 },
                              { year: "Year 3", costs: 850000, savings: 1890000, net: 1040000 },
                            ].map((year, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium mb-2">{year.year}</p>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Costs</p>
                                    <p className="font-semibold text-red-600">${year.costs.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Savings</p>
                                    <p className="font-semibold text-green-600">${year.savings.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Net Impact</p>
                                    <p className={`font-bold ${year.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                                      ${Math.abs(year.net).toLocaleString()}
                                      {year.net >= 0 ? " saved" : " invested"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold">3-Year Cumulative Net Benefit</p>
                                <p className="text-3xl font-bold text-green-600">$1,240,000</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="data-export">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-cyan-600" />
                        Research Data Export Center
                      </CardTitle>
                      <CardDescription>De-identified data exports for research and quality improvement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium">Available Data Sets</h4>
                          {[
                            {
                              name: "Patient Demographics (De-identified)",
                              records: "12,456",
                              lastUpdated: "2025-01-03",
                              access: "researcher",
                            },
                            {
                              name: "Treatment Outcomes",
                              records: "45,678",
                              lastUpdated: "2025-01-02",
                              access: "researcher",
                            },
                            {
                              name: "Quality Metrics - Monthly",
                              records: "24 months",
                              lastUpdated: "2025-01-01",
                              access: "all",
                            },
                            {
                              name: "EBP Fidelity Assessments",
                              records: "2,345",
                              lastUpdated: "2024-12-31",
                              access: "researcher",
                            },
                            {
                              name: "CCBHC Performance Measures",
                              records: "36 months",
                              lastUpdated: "2025-01-01",
                              access: "all",
                            },
                          ].map((dataset, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium">{dataset.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {dataset.records} records • Updated {dataset.lastUpdated}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {dataset.access === "researcher" ? (
                                  <Lock className="h-4 w-4 text-yellow-600" />
                                ) : (
                                  <Unlock className="h-4 w-4 text-green-600" />
                                )}
                                <Button size="sm">Export</Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium">Custom Data Request</h4>
                          <div className="border rounded-lg p-4 space-y-4">
                            <div className="space-y-2">
                              <Label>Data Categories</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  "Demographics",
                                  "Diagnoses",
                                  "Medications",
                                  "Encounters",
                                  "Assessments",
                                  "Outcomes",
                                ].map((cat) => (
                                  <div key={cat} className="flex items-center gap-2">
                                    <Checkbox id={cat} />
                                    <label htmlFor={cat} className="text-sm">
                                      {cat}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Date Range</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Input type="date" />
                                <Input type="date" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Export Format</Label>
                              <Select defaultValue="csv">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="csv">CSV</SelectItem>
                                  <SelectItem value="json">JSON</SelectItem>
                                  <SelectItem value="spss">SPSS</SelectItem>
                                  <SelectItem value="sas">SAS</SelectItem>
                                  <SelectItem value="stata">Stata</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                              <Shield className="h-5 w-5 text-yellow-600" />
                              <p className="text-sm text-yellow-800">
                                All exports are HIPAA-compliant and 42 CFR Part 2 de-identified
                              </p>
                            </div>
                            <Button className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Generate Export
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sud-medications">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-purple-600" />
                          SUD Medication Development Pipeline
                        </CardTitle>
                        <CardDescription>
                          Discovery, preclinical, and clinical development of novel medications for substance use
                          disorders
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-5 gap-4 mb-6">
                          {[
                            { stage: "Discovery", count: 3, color: "bg-gray-500" },
                            { stage: "Preclinical", count: 1, color: "bg-blue-500" },
                            { stage: "Phase 1", count: 2, color: "bg-cyan-500" },
                            { stage: "Phase 2", count: 1, color: "bg-yellow-500" },
                            { stage: "Phase 3", count: 1, color: "bg-green-500" },
                          ].map((stage) => (
                            <div key={stage.stage} className="text-center">
                              <div className={`${stage.color} text-white rounded-lg p-4 mb-2`}>
                                <div className="text-3xl font-bold">{stage.count}</div>
                                <div className="text-sm">{stage.stage}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          {sudMedications.map((med) => (
                            <Card key={med.id} className="border-l-4 border-l-purple-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-semibold text-lg">{med.medication_name}</h3>
                                    <p className="text-sm text-gray-600">{med.target_indication}</p>
                                  </div>
                                  <Badge
                                    className={
                                      med.development_stage === "phase_3"
                                        ? "bg-green-100 text-green-800"
                                        : med.development_stage === "phase_2"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-blue-100 text-blue-800"
                                    }
                                  >
                                    {med.development_stage.replace("_", " ").toUpperCase()}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500">Mechanism of Action</p>
                                    <p className="text-sm">{med.mechanism_of_action}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Lead Researcher</p>
                                    <p className="text-sm">{med.lead_researcher}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Sponsor</p>
                                    <p className="text-sm">{med.sponsor}</p>
                                  </div>
                                  {med.fda_ind_number && (
                                    <div>
                                      <p className="text-xs text-gray-500">FDA IND Number</p>
                                      <p className="text-sm font-mono">{med.fda_ind_number}</p>
                                    </div>
                                  )}
                                </div>

                                {med.enrollment_status.target > 0 && (
                                  <div className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>Enrollment Progress</span>
                                      <span>
                                        {med.enrollment_status.current} / {med.enrollment_status.target}
                                      </span>
                                    </div>
                                    <Progress
                                      value={(med.enrollment_status.current / med.enrollment_status.target) * 100}
                                    />
                                  </div>
                                )}

                                <div className="mb-3">
                                  <p className="text-xs text-gray-500 mb-1">Primary Endpoints</p>
                                  <div className="flex flex-wrap gap-2">
                                    {med.primary_endpoints.map((endpoint, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {endpoint}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {med.efficacy_data && (
                                  <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 rounded-lg mb-3">
                                    <div>
                                      <p className="text-xs text-gray-600">Success Rate</p>
                                      <p className="text-lg font-semibold text-green-700">
                                        {med.efficacy_data.success_rate}%
                                      </p>
                                    </div>
                                    {med.efficacy_data.mean_duration_hours && (
                                      <div>
                                        <p className="text-xs text-gray-600">Mean Duration</p>
                                        <p className="text-lg font-semibold text-green-700">
                                          {med.efficacy_data.mean_duration_hours}h
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div>
                                  <p className="text-xs text-gray-500 mb-2">Regulatory Milestones</p>
                                  <div className="space-y-2">
                                    {med.regulatory_milestones.map((milestone, idx) => (
                                      <div key={idx} className="flex items-center gap-3">
                                        {milestone.status === "completed" ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : milestone.status === "in_progress" ? (
                                          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                                        ) : (
                                          <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                                        )}
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{milestone.milestone}</p>
                                          <p className="text-xs text-gray-500">{milestone.date}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="clinical-trials">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Active Clinical Trials
                        </CardTitle>
                        <CardDescription>
                          Multi-site clinical trials evaluating interventions for substance use disorders
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {clinicalTrials.map((trial) => (
                            <Card key={trial.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="font-mono">
                                        {trial.id}
                                      </Badge>
                                      <Badge
                                        className={
                                          trial.status === "Enrolling"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-blue-100 text-blue-800"
                                        }
                                      >
                                        {trial.status}
                                      </Badge>
                                    </div>
                                    <h3 className="font-semibold text-lg">{trial.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{trial.phase}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Enrollment</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                      {trial.n_enrolled}/{trial.n_target}
                                    </p>
                                    <Progress value={(trial.n_enrolled / trial.n_target) * 100} className="mt-2" />
                                  </div>
                                  <div className="bg-purple-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Sites</p>
                                    <p className="text-2xl font-bold text-purple-700">{trial.sites}</p>
                                  </div>
                                  <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">PI</p>
                                    <p className="text-sm font-semibold text-green-700">
                                      {trial.principal_investigator}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-gray-500">Intervention</p>
                                    <p className="text-sm">{trial.intervention}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Primary Outcome</p>
                                    <p className="text-sm font-medium">{trial.primary_outcome}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Secondary Outcomes</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {trial.secondary_outcomes.map((outcome, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {outcome}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Eligibility</p>
                                    <p className="text-sm">{trial.eligibility}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Regulatory Status</p>
                                    <Badge variant="outline" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      {trial.regulatory_status}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="overdose-prevention">
                  <div className="space-y-6">
                    <Card className="border-t-4 border-t-red-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-600" />
                          Overdose Prevention Research & Interventions
                        </CardTitle>
                        <CardDescription>
                          Evidence-based interventions and implementation science studies focused on reducing opioid
                          overdose deaths
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                          <Card className="bg-red-50 border-red-200">
                            <CardContent className="p-4 text-center">
                              <p className="text-3xl font-bold text-red-700">342</p>
                              <p className="text-sm text-gray-600">Lives Saved</p>
                              <p className="text-xs text-gray-500 mt-1">Documented overdose reversals</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4 text-center">
                              <p className="text-3xl font-bold text-blue-700">2,890</p>
                              <p className="text-sm text-gray-600">Naloxone Kits</p>
                              <p className="text-xs text-gray-500 mt-1">Distributed to community</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-4 text-center">
                              <p className="text-3xl font-bold text-green-700">82%</p>
                              <p className="text-sm text-gray-600">Behavior Change</p>
                              <p className="text-xs text-gray-500 mt-1">After fentanyl test strip use</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-purple-50 border-purple-200">
                            <CardContent className="p-4 text-center">
                              <p className="text-3xl font-bold text-purple-700">78%</p>
                              <p className="text-sm text-gray-600">Mortality Reduction</p>
                              <p className="text-xs text-gray-500 mt-1">In intervention communities</p>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="space-y-4">
                          {mockOverdosePreventionStudies.map((study) => (
                            <Card key={study.id} className="border-l-4 border-l-red-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-semibold text-lg">{study.study_name}</h3>
                                    <Badge variant="outline" className="mt-1">
                                      {study.study_type}
                                    </Badge>
                                  </div>
                                  <Badge
                                    className={
                                      study.status === "Active"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                    }
                                  >
                                    {study.status}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-3">
                                  {study.overdose_reversals_documented && (
                                    <div className="bg-red-50 p-3 rounded-lg">
                                      <p className="text-xs text-gray-600">Overdose Reversals</p>
                                      <p className="text-2xl font-bold text-red-700">
                                        {study.overdose_reversals_documented}
                                      </p>
                                    </div>
                                  )}
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-600">Participants</p>
                                    <p className="text-2xl font-bold text-blue-700">{study.participants}</p>
                                  </div>
                                  {study.behavior_change_rate && (
                                    <div className="bg-green-50 p-3 rounded-lg">
                                      <p className="text-xs text-gray-600">Behavior Change</p>
                                      <p className="text-2xl font-bold text-green-700">{study.behavior_change_rate}%</p>
                                    </div>
                                  )}
                                </div>

                                <div className="bg-yellow-50 p-3 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">Key Findings</p>
                                  <p className="text-sm font-medium">{study.key_findings}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="comorbid-research">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-orange-600" />
                          Co-morbid SUD Treatment Research
                        </CardTitle>
                        <CardDescription>
                          Medications and interventions for patients with multiple substance use disorders and
                          co-occurring conditions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="border-l-4 border-l-orange-500">
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-3">Opioid + Alcohol Co-morbidity</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Active Studies</span>
                                  <span className="font-semibold">3</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Total Participants</span>
                                  <span className="font-semibold">467</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Dual Abstinence Rate</span>
                                  <span className="font-semibold text-green-600">62%</span>
                                </div>
                              </div>
                              <Badge className="mt-3 bg-orange-100 text-orange-800">High Priority</Badge>
                            </CardContent>
                          </Card>

                          <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-3">SUD + Mental Health</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Active Studies</span>
                                  <span className="font-semibold">5</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Total Participants</span>
                                  <span className="font-semibold">892</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Integrated Treatment Success</span>
                                  <span className="font-semibold text-green-600">74%</span>
                                </div>
                              </div>
                              <Badge className="mt-3 bg-purple-100 text-purple-800">NIMH Partnership</Badge>
                            </CardContent>
                          </Card>

                          <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-3">SUD + Chronic Pain</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Active Studies</span>
                                  <span className="font-semibold">2</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Total Participants</span>
                                  <span className="font-semibold">234</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Pain + Addiction Improvement</span>
                                  <span className="font-semibold text-green-600">68%</span>
                                </div>
                              </div>
                              <Badge className="mt-3 bg-blue-100 text-blue-800">NIH HEAL</Badge>
                            </CardContent>
                          </Card>

                          <Card className="border-l-4 border-l-red-500">
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-3">SUD + Infectious Disease</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Active Studies</span>
                                  <span className="font-semibold">4</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Total Participants</span>
                                  <span className="font-semibold">678</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Viral Suppression + Recovery</span>
                                  <span className="font-semibold text-green-600">81%</span>
                                </div>
                              </div>
                              <Badge className="mt-3 bg-red-100 text-red-800">CDC Partnership</Badge>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="regulatory-pathways">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          FDA Regulatory Pathways & Approvals
                        </CardTitle>
                        <CardDescription>
                          Track medications through FDA review process toward clinical adoption
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-6">
                          <h3 className="font-semibold mb-3">Regulatory Timeline</h3>
                          <div className="relative">
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            <div className="space-y-4">
                              {[
                                {
                                  stage: "IND Submission",
                                  medications: 3,
                                  avgTime: "30-60 days",
                                  color: "bg-blue-500",
                                  status: "Active",
                                },
                                {
                                  stage: "Phase 1 Trials",
                                  medications: 2,
                                  avgTime: "6-12 months",
                                  color: "bg-cyan-500",
                                  status: "In Progress",
                                },
                                {
                                  stage: "Phase 2 Trials",
                                  medications: 1,
                                  avgTime: "1-2 years",
                                  color: "bg-yellow-500",
                                  status: "In Progress",
                                },
                                {
                                  stage: "Phase 3 Trials",
                                  medications: 1,
                                  avgTime: "2-4 years",
                                  color: "bg-orange-500",
                                  status: "In Progress",
                                },
                                {
                                  stage: "NDA Submission",
                                  medications: 0,
                                  avgTime: "10 months review",
                                  color: "bg-purple-500",
                                  status: "Planned",
                                },
                                {
                                  stage: "FDA Approval",
                                  medications: 0,
                                  avgTime: "Post-approval",
                                  color: "bg-green-500",
                                  status: "Target",
                                },
                              ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                  <div
                                    className={`${item.color} h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-2xl z-10`}
                                  >
                                    {item.medications}
                                  </div>
                                  <div className="flex-1 bg-white p-4 rounded-lg border">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-semibold">{item.stage}</h4>
                                        <p className="text-sm text-gray-600">Timeline: {item.avgTime}</p>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={
                                          item.status === "Active" || item.status === "In Progress"
                                            ? "border-green-500 text-green-700"
                                            : "border-gray-300"
                                        }
                                      >
                                        {item.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Card className="bg-green-50">
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                              <Award className="h-5 w-5 text-green-600" />
                              Fast Track to Clinical Adoption
                            </h3>
                            <p className="text-sm text-gray-700 mb-3">
                              Accelerated pathways for high-impact SUD interventions with strong preliminary data
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-600">Fast Track Designations</p>
                                <p className="text-2xl font-bold text-green-700">2</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Breakthrough Therapy</p>
                                <p className="text-2xl font-bold text-green-700">1</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Priority Review</p>
                                <p className="text-2xl font-bold text-green-700">0</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="hiv-monitoring">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-600" />
                          HIV-Related Mortality & Morbidity
                        </CardTitle>
                        <CardDescription>Monitoring health outcomes to reduce HIV-related mortality</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {healthSystemMetrics?.metrics
                            .filter((m) => m.name.includes("Mortality") || m.name.includes("Morbidity"))
                            .map((metric, idx) => (
                              <div key={idx}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{metric.name}</span>
                                  <span className="text-sm text-gray-500">
                                    {metric.current}
                                    {metric.unit} / {metric.target}
                                    {metric.unit}
                                  </span>
                                </div>
                                <Progress value={(metric.current / metric.target) * 100} className="h-2" />
                                <div className="flex items-center gap-1 mt-1">
                                  {getTrendIcon(metric.trend)}
                                  <span className="text-xs text-gray-500">{metric.trend}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>HIV Care Continuum (90-90-90 Targets)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Diagnosed (90% target)</span>
                              <span className="text-sm text-gray-500">87%</span>
                            </div>
                            <Progress value={87} className="h-3" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">On Treatment (90% target)</span>
                              <span className="text-sm text-gray-500">74%</span>
                            </div>
                            <Progress value={74} className="h-3" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Virally Suppressed (90% target)</span>
                              <span className="text-sm text-gray-500">82%</span>
                            </div>
                            <Progress value={82} className="h-3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Patient Data Monitoring & Reporting</CardTitle>
                        <CardDescription>Real-time patient and health services data tracking</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Active HIV Patients</p>
                            <p className="text-2xl font-bold text-blue-900">892</p>
                            <p className="text-xs text-gray-500 mt-1">+23 this month</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Newly Linked to Care</p>
                            <p className="text-2xl font-bold text-green-900">47</p>
                            <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600">ART Adherence Rate</p>
                            <p className="text-2xl font-bold text-purple-900">85%</p>
                            <p className="text-xs text-gray-500 mt-1">Target: 90%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="vital-registry">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          National Vital Registry System
                        </CardTitle>
                        <CardDescription>
                          Monitoring natality and mortality through improved vital statistics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {healthSystemMetrics?.metrics
                            .filter(
                              (m) =>
                                m.name.includes("Registration") ||
                                m.name.includes("Quality Score") ||
                                m.name.includes("Processing Time"),
                            )
                            .map((metric, idx) => (
                              <div key={idx}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{metric.name}</span>
                                  <span className="text-sm text-gray-500">
                                    {metric.current}
                                    {metric.unit}
                                  </span>
                                </div>
                                <Progress value={metric.current} className="h-2" />
                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex items-center gap-1">
                                    {getTrendIcon(metric.trend)}
                                    <span className="text-xs text-gray-500">{metric.trend}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">Target: {metric.target}%</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Real-Time Vital Events Processing</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-600">Births Registered (MTD)</p>
                              <p className="text-2xl font-bold text-green-900">3,241</p>
                              <p className="text-xs text-gray-500 mt-1">Within 48 hours: 94%</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-gray-600">Deaths Registered (MTD)</p>
                              <p className="text-2xl font-bold text-blue-900">1,087</p>
                              <p className="text-xs text-gray-500 mt-1">With cause: 88%</p>
                            </div>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm font-medium mb-2">Vital Statistics Data Quality Index</p>
                            <Progress value={86} className="h-3 mb-1" />
                            <p className="text-xs text-gray-500">86% overall quality score (Target: 95%)</p>
                          </div>
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-2">Integration Status</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">PHC Integration</span>
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Hospital Integration</span>
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Border Region Sync</span>
                                <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Reliable Vital Statistics Generation</CardTitle>
                        <CardDescription>
                          Generating evidence-based data for public health interventions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-3xl font-bold text-gray-900">3.2</p>
                            <p className="text-sm text-gray-600 mt-1">Infant Mortality Rate</p>
                            <p className="text-xs text-gray-500">(per 1,000 live births)</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-3xl font-bold text-gray-900">78.4</p>
                            <p className="text-sm text-gray-600 mt-1">Life Expectancy</p>
                            <p className="text-xs text-gray-500">(years at birth)</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-3xl font-bold text-gray-900">12.8</p>
                            <p className="text-sm text-gray-600 mt-1">Crude Birth Rate</p>
                            <p className="text-xs text-gray-500">(per 1,000 population)</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-3xl font-bold text-gray-900">8.4</p>
                            <p className="text-sm text-gray-600 mt-1">Crude Death Rate</p>
                            <p className="text-xs text-gray-500">(per 1,000 population)</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="outbreak">
                  <div className="grid grid-cols-1 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          Disease Outbreak Detection & Response
                        </CardTitle>
                        <CardDescription>
                          Early detection system for reportable conditions and disease outbreaks
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockOutbreakAlerts.map((alert) => (
                            <div
                              key={alert.id}
                              className={`p-4 rounded-lg border-l-4 ${
                                alert.severity === "High"
                                  ? "bg-red-50 border-l-red-500"
                                  : alert.severity === "Medium"
                                    ? "bg-orange-50 border-l-orange-500"
                                    : "bg-yellow-50 border-l-yellow-500"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">{alert.disease}</h4>
                                    <Badge
                                      className={`${
                                        alert.severity === "High"
                                          ? "bg-red-100 text-red-800"
                                          : alert.severity === "Medium"
                                            ? "bg-orange-100 text-orange-800"
                                            : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {alert.severity} Priority
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4 mt-2">
                                    <div>
                                      <p className="text-xs text-gray-500">Status</p>
                                      <p className="text-sm font-medium">{alert.status}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Cases / Threshold</p>
                                      <p className="text-sm font-medium">
                                        {alert.casesReported} / {alert.threshold}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Trend</p>
                                      <p className="text-sm font-medium">{alert.trend}</p>
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">Last updated: {alert.lastUpdate}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Outbreak Response Capacity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {healthSystemMetrics?.metrics
                              .filter(
                                (m) =>
                                  m.name.includes("Response") ||
                                  m.name.includes("Coverage") ||
                                  m.name.includes("Readiness"),
                              )
                              .map((metric, idx) => (
                                <div key={idx}>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">{metric.name}</span>
                                    <span className="text-sm text-gray-500">
                                      {metric.current}
                                      {metric.unit}
                                    </span>
                                  </div>
                                  <Progress value={metric.current} className="h-2" />
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Coordinated Disease Monitoring</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Real-Time Surveillance Active</span>
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">45 reportable conditions monitored</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Automated Alert System</span>
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Threshold-based notifications enabled</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Evidence-Based Response Protocols</span>
                                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">CDC and WHO guidelines integrated</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="his">
                  <div className="grid grid-cols-1 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-purple-600" />
                          Health Information System (HIS) Reengineering
                        </CardTitle>
                        <CardDescription>
                          Leveraging innovative EMR technologies for integrated patient-centered care
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3">System Integration Metrics</h4>
                            <div className="space-y-4">
                              {healthSystemMetrics?.metrics
                                .filter((m) => m.category === "Health Information System (HIS)")
                                .map((metric, idx) => (
                                  <div key={idx}>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-sm font-medium">{metric.name}</span>
                                      <span className="text-sm text-gray-500">
                                        {metric.current}
                                        {metric.unit}
                                      </span>
                                    </div>
                                    <Progress value={metric.current} className="h-2" />
                                  </div>
                                ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-3">Patient-Centered Integration</h4>
                            <div className="space-y-4">
                              {healthSystemMetrics?.metrics
                                .filter((m) => m.category === "Patient-Centered Care")
                                .map((metric, idx) => (
                                  <div key={idx}>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-sm font-medium">{metric.name}</span>
                                      <span className="text-sm text-gray-500">
                                        {metric.current}
                                        {metric.unit}
                                      </span>
                                    </div>
                                    <Progress value={metric.current} className="h-2" />
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Continuum of Care Across Settings</CardTitle>
                        <CardDescription>
                          Seamless care coordination from facility to community to border regions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg text-center">
                            <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm font-medium">Facility-Based Care</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">8,234</p>
                            <p className="text-xs text-gray-500">Active patients</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg text-center">
                            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-medium">Community Services</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">3,241</p>
                            <p className="text-xs text-gray-500">CHW encounters</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg text-center">
                            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-sm font-medium">Border Region Coordination</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">1,524</p>
                            <p className="text-xs text-gray-500">Cross-border patients</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Quality Assurance & Evaluation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-semibold mb-3">Quality Assurance Programs</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Clinical Quality Measures</span>
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Patient Safety Indicators</span>
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Process Improvement Tracking</span>
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-3">Intervention Effectiveness Evaluation</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Treatment Outcomes Analysis</span>
                                <Badge className="bg-blue-100 text-blue-800">Monthly</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Population Health Impact</span>
                                <Badge className="bg-blue-100 text-blue-800">Quarterly</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Cost-Effectiveness Studies</span>
                                <Badge className="bg-blue-100 text-blue-800">Annual</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="specialties">
                  <div className="grid grid-cols-1 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-cyan-600" />
                          Comprehensive Specialty Programs
                        </CardTitle>
                        <CardDescription>All specialties with integrated health information systems</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockSpecialtyPrograms.map((program) => (
                            <div key={program.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{program.specialty}</h4>
                                  <Badge className="mt-1">{program.compliance}</Badge>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Active Patients</p>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {program.patients.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Services Offered</p>
                                  <div className="flex flex-wrap gap-1">
                                    {program.services.map((service, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {service}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Key Outcomes</p>
                                  <div className="space-y-1">
                                    {Object.entries(program.outcomes).map(([key, value], idx) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-600 capitalize">
                                          {key.replace(/([A-Z])/g, " $1").trim()}:
                                        </span>
                                        <span className="font-medium">{value}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* New Study Dialog */}
                <Dialog open={showNewStudyDialog} onOpenChange={setShowNewStudyDialog}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Research Study</DialogTitle>
                      <DialogDescription>
                        Set up a new implementation, pilot, or quality improvement study
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Study Title</Label>
                        <Input placeholder="Enter study title" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Study Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="implementation">Implementation Science</SelectItem>
                              <SelectItem value="pilot">Pilot Study</SelectItem>
                              <SelectItem value="quality_improvement">Quality Improvement</SelectItem>
                              <SelectItem value="outcomes">Outcomes Research</SelectItem>
                              <SelectItem value="equity">Health Equity</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Principal Investigator</Label>
                          <Input placeholder="PI Name" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Study description and objectives" rows={3} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input type="date" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Enrollment Target</Label>
                          <Input type="number" placeholder="Target participants" />
                        </div>
                        <div className="space-y-2">
                          <Label>Funding Source</Label>
                          <Input placeholder="Funding organization" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>IRB Status</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="exempt">Exempt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewStudyDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setShowNewStudyDialog(false)}>Create Study</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  )
}
