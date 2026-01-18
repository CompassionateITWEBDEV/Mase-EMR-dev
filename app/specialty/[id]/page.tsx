"use client"

import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pill,
  Stethoscope,
  Brain,
  Baby,
  Heart,
  Eye,
  Activity,
  Dumbbell,
  MessageSquare,
  FileText,
  Play,
  CheckCircle,
} from "lucide-react"

// Specialty configurations
const specialtyConfigs: Record<
  string,
  {
    name: string
    icon: any
    description: string
    color: string
    features: string[]
    workflows: { name: string; description: string }[]
    templates: { name: string; type: string }[]
    billingCodes: { code: string; description: string; fee: string }[]
  }
> = {
  "behavioral-health": {
    name: "Behavioral Health / OTP/MAT",
    icon: Pill,
    description: "Substance use disorder treatment, addiction medicine, OTP programs",
    color: "#0891b2",
    features: [
      "Methadone/Buprenorphine Dispensing",
      "COWS/CIWA Assessments",
      "OTP Bundle Billing",
      "DEA Form 222 Management",
      "Take-Home Medication Kits",
      "SAMHSA/Joint Commission Compliance",
      "Peer Recovery Support",
      "42 CFR Part 2 Compliance",
    ],
    workflows: [
      { name: "Daily Dispensing", description: "Morning medication dispensing workflow" },
      { name: "Phase Advancement", description: "Patient progression through treatment phases" },
      { name: "Take-Home Eligibility", description: "Evaluate and manage take-home privileges" },
      { name: "Callback Procedure", description: "Random callback and compliance verification" },
    ],
    templates: [
      { name: "OTP Initial Assessment", type: "Assessment" },
      { name: "COWS Scale", type: "Assessment" },
      { name: "CIWA-Ar Scale", type: "Assessment" },
      { name: "Treatment Plan Update", type: "Progress Note" },
      { name: "Discharge Summary", type: "Discharge" },
    ],
    billingCodes: [
      { code: "H0020", description: "Methadone Administration", fee: "$15.00" },
      { code: "H0033", description: "Oral Medication Administration", fee: "$12.00" },
      { code: "H0004", description: "Behavioral Health Counseling", fee: "$85.00" },
      { code: "H0005", description: "Group Counseling", fee: "$35.00" },
    ],
  },
  "primary-care": {
    name: "Primary Care / Family Medicine",
    icon: Stethoscope,
    description: "General medical practice, family medicine, internal medicine",
    color: "#059669",
    features: [
      "ICD-10 Diagnosis Coding",
      "Vitals Trending & History",
      "Preventive Care Tracking",
      "Chronic Disease Management",
      "SOAP Note Templates",
      "Physical Exam Documentation",
      "Health Maintenance Reminders",
      "Annual Wellness Visits",
    ],
    workflows: [
      { name: "New Patient Intake", description: "Complete new patient onboarding" },
      { name: "Annual Wellness Visit", description: "Comprehensive annual health assessment" },
      { name: "Chronic Care Management", description: "Monthly CCM patient follow-up" },
      { name: "Preventive Care Alerts", description: "Automated preventive care reminders" },
    ],
    templates: [
      { name: "SOAP Note", type: "Progress Note" },
      { name: "Annual Physical", type: "Assessment" },
      { name: "Chronic Care Review", type: "Progress Note" },
      { name: "Preventive Care Checklist", type: "Assessment" },
      { name: "Referral Letter", type: "Letter" },
    ],
    billingCodes: [
      { code: "99213", description: "Office Visit - Est. Patient, Low", fee: "$95.00" },
      { code: "99214", description: "Office Visit - Est. Patient, Mod", fee: "$145.00" },
      { code: "99396", description: "Preventive Visit - 40-64 years", fee: "$185.00" },
      { code: "99490", description: "Chronic Care Management", fee: "$62.00" },
    ],
  },
  psychiatry: {
    name: "Psychiatry / Mental Health",
    icon: Brain,
    description: "Psychiatric care, mental health treatment, therapy management",
    color: "#7c3aed",
    features: [
      "Mental Status Exams (MSE)",
      "PHQ-9/GAD-7 Assessments",
      "Medication Management",
      "DSM-5 Diagnosis Support",
      "Crisis Assessment Tools",
      "Therapy Session Notes",
      "Risk Assessment Protocols",
      "Collaborative Care Notes",
    ],
    workflows: [
      { name: "Psychiatric Evaluation", description: "Comprehensive initial psychiatric assessment" },
      { name: "Medication Check", description: "Follow-up medication management visit" },
      { name: "Crisis Intervention", description: "Emergency psychiatric assessment" },
      { name: "Therapy Progress", description: "Ongoing therapy session documentation" },
    ],
    templates: [
      { name: "Psychiatric Evaluation", type: "Assessment" },
      { name: "Mental Status Exam", type: "Assessment" },
      { name: "PHQ-9 Depression Screen", type: "Assessment" },
      { name: "GAD-7 Anxiety Screen", type: "Assessment" },
      { name: "Medication Management Note", type: "Progress Note" },
    ],
    billingCodes: [
      { code: "90791", description: "Psychiatric Diagnostic Evaluation", fee: "$250.00" },
      { name: "90832", description: "Psychotherapy, 30 min", fee: "$85.00" },
      { code: "90834", description: "Psychotherapy, 45 min", fee: "$125.00" },
      { code: "90837", description: "Psychotherapy, 60 min", fee: "$165.00" },
    ],
  },
  obgyn: {
    name: "OB/GYN / Women's Health",
    icon: Baby,
    description: "Obstetrics, gynecology, women's health services",
    color: "#ec4899",
    features: [
      "Prenatal Care Tracking",
      "Labor & Delivery Documentation",
      "Postpartum Follow-up",
      "Well-Woman Exams",
      "Contraception Management",
      "Pregnancy Risk Assessment",
      "Fetal Development Tracking",
      "Gynecological Procedures",
    ],
    workflows: [
      { name: "Prenatal Visit", description: "Routine prenatal care visit workflow" },
      { name: "Labor & Delivery", description: "L&D documentation and tracking" },
      { name: "Postpartum Check", description: "6-week postpartum follow-up" },
      { name: "Annual GYN Exam", description: "Annual well-woman examination" },
    ],
    templates: [
      { name: "Prenatal Visit Note", type: "Progress Note" },
      { name: "OB Initial Assessment", type: "Assessment" },
      { name: "Labor Progress Note", type: "Progress Note" },
      { name: "Postpartum Exam", type: "Assessment" },
      { name: "Pap Smear Results", type: "Lab Result" },
    ],
    billingCodes: [
      { code: "99213", description: "Office Visit - Established", fee: "$95.00" },
      { code: "59400", description: "Routine OB Care (Global)", fee: "$2,850.00" },
      { code: "58300", description: "IUD Insertion", fee: "$285.00" },
      { code: "G0101", description: "Cervical/Vaginal Cancer Screen", fee: "$45.00" },
    ],
  },
  cardiology: {
    name: "Cardiology",
    icon: Heart,
    description: "Cardiovascular care, heart health management",
    color: "#dc2626",
    features: [
      "ECG/EKG Integration",
      "Cardiac Risk Assessment",
      "Stress Test Documentation",
      "Heart Failure Management",
      "Anticoagulation Tracking",
      "Cardiac Event Monitoring",
      "Intervention Procedures",
      "Post-Cardiac Care Plans",
    ],
    workflows: [
      { name: "Cardiac Workup", description: "Complete cardiac evaluation" },
      { name: "Stress Test", description: "Exercise or pharmacologic stress testing" },
      { name: "Heart Failure Clinic", description: "CHF management and monitoring" },
      { name: "Anticoagulation Management", description: "INR monitoring and dosing" },
    ],
    templates: [
      { name: "Cardiac Consultation", type: "Assessment" },
      { name: "EKG Interpretation", type: "Lab Result" },
      { name: "Stress Test Report", type: "Procedure" },
      { name: "Heart Failure Assessment", type: "Assessment" },
      { name: "Echocardiogram Report", type: "Procedure" },
    ],
    billingCodes: [
      { code: "93000", description: "ECG Complete", fee: "$45.00" },
      { code: "93015", description: "Cardiovascular Stress Test", fee: "$175.00" },
      { code: "93306", description: "Echocardiography Complete", fee: "$285.00" },
      { code: "93458", description: "Cardiac Catheterization", fee: "$1,250.00" },
    ],
  },
  dermatology: {
    name: "Dermatology",
    icon: Eye,
    description: "Skin care, dermatological procedures, cosmetic treatments",
    color: "#f59e0b",
    features: [
      "Lesion Mapping & Tracking",
      "Biopsy Documentation",
      "Photo Documentation",
      "Cosmetic Procedure Notes",
      "Skin Cancer Screening",
      "Dermatology Coding (CPT)",
      "Treatment Progress Photos",
      "Allergy Documentation",
    ],
    workflows: [
      { name: "Skin Check", description: "Full body skin examination" },
      { name: "Biopsy Procedure", description: "Skin biopsy with pathology" },
      { name: "Acne Management", description: "Acne treatment protocol" },
      { name: "Cosmetic Consultation", description: "Aesthetic procedure evaluation" },
    ],
    templates: [
      { name: "Dermatology Exam", type: "Assessment" },
      { name: "Biopsy Report", type: "Procedure" },
      { name: "Lesion Documentation", type: "Progress Note" },
      { name: "Cosmetic Consent", type: "Consent" },
      { name: "Pathology Follow-up", type: "Lab Result" },
    ],
    billingCodes: [
      { code: "99213", description: "Office Visit - Established", fee: "$95.00" },
      { code: "11102", description: "Tangential Biopsy - Single", fee: "$125.00" },
      { code: "17000", description: "Destruction of Lesion", fee: "$85.00" },
      { code: "96372", description: "Injection - Therapeutic", fee: "$45.00" },
    ],
  },
  "urgent-care": {
    name: "Urgent Care / Walk-In Clinic",
    icon: Activity,
    description: "Urgent care, walk-in clinic, acute care services",
    color: "#0ea5e9",
    features: [
      "Fast Check-In/Queue Management",
      "Rapid Assessment Templates",
      "Work/School Excuse Notes",
      "Occupational Health Screenings",
      "Minor Procedures Documentation",
      "X-Ray/Lab Fast Track",
      "Workers Comp Integration",
      "Quick Discharge Instructions",
    ],
    workflows: [
      { name: "Fast Track Triage", description: "Rapid patient assessment" },
      { name: "Minor Injury", description: "Laceration, sprain treatment" },
      { name: "Illness Visit", description: "Acute illness evaluation" },
      { name: "DOT Physical", description: "Occupational health screening" },
    ],
    templates: [
      { name: "Urgent Care Visit", type: "Progress Note" },
      { name: "Work Excuse Note", type: "Letter" },
      { name: "School Excuse Note", type: "Letter" },
      { name: "DOT Physical Form", type: "Assessment" },
      { name: "Discharge Instructions", type: "Patient Ed" },
    ],
    billingCodes: [
      { code: "99201", description: "New Patient - Minimal", fee: "$65.00" },
      { code: "99213", description: "Established - Low", fee: "$95.00" },
      { code: "12001", description: "Simple Laceration Repair", fee: "$145.00" },
      { code: "71046", description: "Chest X-Ray 2 Views", fee: "$75.00" },
    ],
  },
  pediatrics: {
    name: "Pediatrics",
    icon: Baby,
    description: "Pediatric care, child health, adolescent medicine",
    color: "#8b5cf6",
    features: [
      "Growth Chart Tracking",
      "Immunization Schedules",
      "Developmental Milestones",
      "Well-Child Visit Templates",
      "Pediatric Dosing Calculators",
      "Parent/Guardian Communication",
      "School Health Forms",
      "Adolescent Screening (HEADSSS)",
    ],
    workflows: [
      { name: "Well-Child Visit", description: "Age-appropriate wellness check" },
      { name: "Immunization Visit", description: "Vaccine administration workflow" },
      { name: "Sick Visit", description: "Acute pediatric illness evaluation" },
      { name: "Sports Physical", description: "Pre-participation exam" },
    ],
    templates: [
      { name: "Well-Child Note", type: "Progress Note" },
      { name: "Developmental Screening", type: "Assessment" },
      { name: "Immunization Record", type: "Record" },
      { name: "School Physical Form", type: "Form" },
      { name: "ADHD Evaluation", type: "Assessment" },
    ],
    billingCodes: [
      { code: "99391", description: "Preventive - Infant", fee: "$175.00" },
      { code: "99392", description: "Preventive - 1-4 years", fee: "$175.00" },
      { code: "99393", description: "Preventive - 5-11 years", fee: "$175.00" },
      { code: "90460", description: "Immunization Admin - 1st", fee: "$25.00" },
    ],
  },
  podiatry: {
    name: "Podiatry / Foot & Ankle",
    icon: Activity,
    description: "Podiatric medicine, diabetic foot care, biomechanics, wound care",
    color: "#14b8a6",
    features: [
      "Comprehensive Foot Exams",
      "Diabetic Foot Care Management",
      "Biomechanical Assessment",
      "Wound Care Documentation",
      "Nail Procedures",
      "Orthotic Management",
      "Vascular Testing (ABI)",
      "Neuropathy Screening",
    ],
    workflows: [
      { name: "Diabetic Foot Exam", description: "Comprehensive diabetic foot assessment" },
      { name: "Wound Care Visit", description: "Chronic wound management" },
      { name: "Nail Procedure", description: "Ingrown nail treatment" },
      { name: "Orthotics Fitting", description: "Custom orthotic evaluation" },
    ],
    templates: [
      { name: "Podiatry Initial Eval", type: "Assessment" },
      { name: "Diabetic Foot Exam", type: "Assessment" },
      { name: "Wound Care Note", type: "Progress Note" },
      { name: "Nail Procedure Note", type: "Procedure" },
      { name: "Orthotics Prescription", type: "Order" },
    ],
    billingCodes: [
      { code: "99213", description: "Office Visit - Established", fee: "$95.00" },
      { code: "11721", description: "Debridement of Nails - 6+", fee: "$65.00" },
      { code: "11750", description: "Partial Nail Avulsion", fee: "$185.00" },
      { code: "G0247", description: "Diabetic Foot Exam", fee: "$45.00" },
    ],
  },
  "physical-therapy": {
    name: "Physical Therapy",
    icon: Dumbbell,
    description: "Musculoskeletal rehabilitation, orthopedic therapy, sports medicine",
    color: "#22c55e",
    features: [
      "Initial Evaluations & Re-evals",
      "ROM/Strength Testing",
      "Functional Mobility Assessments",
      "Gait Analysis",
      "Therapeutic Exercise Documentation",
      "Manual Therapy Techniques",
      "Modality Documentation",
      "Home Exercise Program Builder",
    ],
    workflows: [
      { name: "PT Evaluation", description: "Initial physical therapy assessment" },
      { name: "Treatment Session", description: "Ongoing therapy documentation" },
      { name: "Re-evaluation", description: "Progress re-assessment" },
      { name: "Discharge Planning", description: "PT discharge and HEP" },
    ],
    templates: [
      { name: "PT Initial Evaluation", type: "Assessment" },
      { name: "Daily Treatment Note", type: "Progress Note" },
      { name: "Progress Re-eval", type: "Assessment" },
      { name: "Home Exercise Program", type: "Patient Ed" },
      { name: "PT Discharge Summary", type: "Discharge" },
    ],
    billingCodes: [
      { code: "97161", description: "PT Eval - Low Complexity", fee: "$145.00" },
      { code: "97162", description: "PT Eval - Moderate", fee: "$175.00" },
      { code: "97110", description: "Therapeutic Exercise", fee: "$45.00" },
      { code: "97140", description: "Manual Therapy", fee: "$48.00" },
    ],
  },
  "occupational-therapy": {
    name: "Occupational Therapy",
    icon: Brain,
    description: "ADL training, hand therapy, cognitive rehabilitation",
    color: "#f97316",
    features: [
      "ADL Assessment & Training",
      "Hand Therapy Documentation",
      "Cognitive Rehabilitation",
      "Sensory Processing Eval",
      "Home Safety Assessment",
      "Adaptive Equipment Recommendations",
      "Work Hardening Programs",
      "Pediatric OT Services",
    ],
    workflows: [
      { name: "OT Evaluation", description: "Comprehensive OT assessment" },
      { name: "ADL Training", description: "Activities of daily living session" },
      { name: "Hand Therapy", description: "Hand/upper extremity treatment" },
      { name: "Cognitive Rehab", description: "Cognitive rehabilitation session" },
    ],
    templates: [
      { name: "OT Initial Evaluation", type: "Assessment" },
      { name: "ADL Assessment", type: "Assessment" },
      { name: "Hand Therapy Note", type: "Progress Note" },
      { name: "Home Safety Checklist", type: "Assessment" },
      { name: "Equipment Recommendation", type: "Order" },
    ],
    billingCodes: [
      { code: "97165", description: "OT Eval - Low Complexity", fee: "$145.00" },
      { code: "97166", description: "OT Eval - Moderate", fee: "$175.00" },
      { code: "97530", description: "Therapeutic Activities", fee: "$45.00" },
      { code: "97542", description: "Wheelchair Management", fee: "$48.00" },
    ],
  },
  "speech-therapy": {
    name: "Speech Therapy",
    icon: MessageSquare,
    description: "Speech-language pathology, swallowing disorders, voice therapy",
    color: "#a855f7",
    features: [
      "Speech-Language Evaluation",
      "Swallowing Assessment (FEES/MBS)",
      "Voice Therapy Documentation",
      "Cognitive-Communication",
      "AAC Device Management",
      "Pediatric Speech Services",
      "Aphasia Treatment",
      "Fluency Disorders",
    ],
    workflows: [
      { name: "SLP Evaluation", description: "Speech-language initial assessment" },
      { name: "Dysphagia Eval", description: "Swallowing assessment" },
      { name: "Therapy Session", description: "Ongoing speech therapy" },
      { name: "AAC Training", description: "Augmentative communication setup" },
    ],
    templates: [
      { name: "SLP Initial Evaluation", type: "Assessment" },
      { name: "Swallowing Study", type: "Procedure" },
      { name: "Voice Therapy Note", type: "Progress Note" },
      { name: "AAC Recommendation", type: "Order" },
      { name: "Speech Progress Report", type: "Progress Note" },
    ],
    billingCodes: [
      { code: "92521", description: "Eval of Speech Fluency", fee: "$125.00" },
      { code: "92522", description: "Eval of Speech Sound", fee: "$145.00" },
      { code: "92610", description: "Swallowing Function Eval", fee: "$165.00" },
      { code: "92507", description: "Speech Therapy", fee: "$65.00" },
    ],
  },
  chiropractic: {
    name: "Chiropractic",
    icon: Heart,
    description: "Spinal manipulation, musculoskeletal care, wellness",
    color: "#06b6d4",
    features: [
      "Spinal Examination",
      "Adjustment Documentation",
      "X-Ray Integration",
      "Posture Analysis",
      "Muscle Testing",
      "Range of Motion Assessment",
      "Treatment Plans",
      "Wellness Programs",
    ],
    workflows: [
      { name: "Initial Consultation", description: "New patient chiropractic evaluation" },
      { name: "Adjustment Visit", description: "Routine adjustment documentation" },
      { name: "Re-examination", description: "Progress re-evaluation" },
      { name: "Maintenance Care", description: "Wellness maintenance visit" },
    ],
    templates: [
      { name: "Chiropractic Exam", type: "Assessment" },
      { name: "SOAP Note - Adjustment", type: "Progress Note" },
      { name: "X-Ray Report", type: "Lab Result" },
      { name: "Treatment Plan", type: "Plan" },
      { name: "Re-exam Report", type: "Assessment" },
    ],
    billingCodes: [
      { code: "98940", description: "CMT Spinal 1-2 Regions", fee: "$45.00" },
      { code: "98941", description: "CMT Spinal 3-4 Regions", fee: "$55.00" },
      { code: "98942", description: "CMT Spinal 5 Regions", fee: "$65.00" },
      { code: "99203", description: "New Patient E/M", fee: "$125.00" },
    ],
  },
}

export default function SpecialtyPage() {
  const params = useParams()
  const specialtyId = params.id as string

  const specialty = specialtyConfigs[specialtyId]

  if (!specialty) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <DashboardHeader />
          <main className="p-6">
            <Card>
              <CardContent className="p-12 text-center">
                <h2 className="text-xl font-semibold mb-2">Specialty Not Found</h2>
                <p className="text-muted-foreground">The requested specialty "{specialtyId}" is not available.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  const Icon = specialty.icon

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader />
        <main className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: specialty.color }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{specialty.name}</h1>
                <p className="text-muted-foreground">{specialty.description}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Badge variant="outline" style={{ borderColor: specialty.color, color: specialty.color }}>
                Active Specialty
              </Badge>
              <Badge variant="secondary">{specialty.features.length} Features</Badge>
              <Badge variant="secondary">{specialty.templates.length} Templates</Badge>
            </div>
          </div>

          <Tabs defaultValue="features" className="space-y-6">
            <TabsList>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="billing">Billing Codes</TabsTrigger>
            </TabsList>

            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle>Specialty Features</CardTitle>
                  <CardDescription>Features included with this specialty module</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specialty.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <CheckCircle className="h-5 w-5" style={{ color: specialty.color }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflows">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialty.workflows.map((workflow, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      </div>
                      <CardDescription>{workflow.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Documentation Templates</CardTitle>
                  <CardDescription>Pre-built templates for this specialty</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {specialty.templates.map((template, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground">{template.type}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          Use Template
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Common Billing Codes</CardTitle>
                  <CardDescription>CPT/HCPCS codes frequently used in this specialty</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {specialty.billingCodes.map((code, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="font-mono">
                            {code.code}
                          </Badge>
                          <span>{code.description}</span>
                        </div>
                        <span className="font-medium text-green-600">{code.fee}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
