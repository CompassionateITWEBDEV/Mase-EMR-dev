"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Crown,
  CreditCard,
  Check,
  Pill,
  Video,
  Beaker,
  Send,
  BarChart3,
  Brain,
  Shield,
  Users,
  MessageSquare,
  FileText,
  Building2,
  Zap,
  Settings,
  AlertTriangle,
  Package,
  Clock,
  Download,
  Sparkles,
  Menu,
  Heart,
  Baby,
  Stethoscope,
  Activity,
  Eye,
  QrCode,
  Headphones,
} from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface SubscriptionFeature {
  id: string
  name: string
  description: string
  icon: any
  category: "clinical" | "billing" | "integration" | "operations" | "advanced" | "DEA Compliance" // Added "DEA Compliance"
  enabled: boolean
  tier: "basic" | "professional" | "enterprise" | "Premium" // Added "Premium"
  monthlyPrice: number
  usageLimit?: number
  currentUsage?: number
}

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  billingCycle: "monthly" | "annual"
  features: string[]
  recommended?: boolean
}

// Define AddonFeature interface to match the new structure
interface AddonFeature {
  id: string
  name: string
  icon: any
  description: string
  tier: "basic" | "professional" | "enterprise" | "Premium"
  monthlyPrice: number
  category: "clinical" | "billing" | "integration" | "operations" | "advanced" | "DEA Compliance"
  features: string[] // Specific features for the add-on
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 299,
    billingCycle: "monthly",
    features: [
      "Patient Management",
      "Basic Documentation",
      "Appointment Scheduling",
      "Up to 5 Staff Users",
      "Email Support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 599,
    billingCycle: "monthly",
    recommended: true,
    features: [
      "Everything in Basic",
      "E-Prescribing (EPCS)",
      "Telehealth",
      "Billing & Claims",
      "Lab Integration",
      "Up to 25 Staff Users",
      "Priority Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 999,
    billingCycle: "monthly",
    features: [
      "Everything in Professional",
      "AI Clinical Assistant",
      "Advanced Analytics",
      "Multi-Location Support",
      "Custom Integrations",
      "Unlimited Staff Users",
      "Dedicated Support",
      "SLA Guarantee",
    ],
  },
]

const allFeatures: SubscriptionFeature[] = [
  // Clinical Features
  {
    id: "e-prescribing",
    name: "E-Prescribing (EPCS)",
    description: "Electronic prescribing including controlled substances",
    icon: Send,
    category: "clinical",
    enabled: true,
    tier: "professional",
    monthlyPrice: 99,
  },
  {
    id: "telehealth",
    name: "Telehealth",
    description: "Video consultations with patients",
    icon: Video,
    category: "clinical",
    enabled: true,
    tier: "professional",
    monthlyPrice: 79,
    usageLimit: 500,
    currentUsage: 234,
  },
  {
    id: "lab-integration",
    name: "Lab Integration",
    description: "Connect with lab providers for orders and results",
    icon: Beaker,
    category: "clinical",
    enabled: true,
    tier: "professional",
    monthlyPrice: 59,
  },
  {
    id: "medication-dispensing",
    name: "Medication Dispensing",
    description: "Methadone and controlled substance dispensing",
    icon: Pill,
    category: "clinical",
    enabled: true,
    tier: "basic",
    monthlyPrice: 0,
  },
  {
    id: "clinical-protocols",
    name: "Clinical Protocols",
    description: "Evidence-based treatment protocols",
    icon: FileText,
    category: "clinical",
    enabled: true,
    tier: "basic",
    monthlyPrice: 0,
  },
  // Billing Features
  {
    id: "billing-claims",
    name: "Billing & Claims",
    description: "Insurance billing and claims management",
    icon: CreditCard,
    category: "billing",
    enabled: true,
    tier: "professional",
    monthlyPrice: 149,
    usageLimit: 1000,
    currentUsage: 456,
  },
  {
    id: "clearinghouse",
    name: "Clearinghouse Integration",
    description: "Direct claims submission to clearinghouses",
    icon: Building2,
    category: "billing",
    enabled: true,
    tier: "professional",
    monthlyPrice: 79,
  },
  {
    id: "prior-auth",
    name: "Prior Authorization",
    description: "Automated prior authorization workflows",
    icon: Shield,
    enabled: false,
    tier: "enterprise",
    monthlyPrice: 99,
    category: "billing",
  },
  {
    id: "otp-bundle",
    name: "OTP Bundle Billing",
    description: "Specialized OTP billing with bundle calculator",
    icon: Package,
    category: "billing",
    enabled: true,
    tier: "professional",
    monthlyPrice: 49,
  },
  // Integration Features
  {
    id: "pmp-integration",
    name: "PMP Integration",
    description: "Prescription Monitoring Program integration",
    icon: Shield,
    category: "integration",
    enabled: true,
    tier: "professional",
    monthlyPrice: 49,
  },
  {
    id: "patient-portal",
    name: "Patient Portal",
    description: "Patient self-service portal",
    icon: Users,
    category: "integration",
    enabled: true,
    tier: "basic",
    monthlyPrice: 0,
  },
  {
    id: "mobile-check-in",
    name: "Mobile Check-In",
    description: "Patient mobile check-in and queue management",
    icon: Clock,
    category: "integration",
    enabled: true,
    tier: "professional",
    monthlyPrice: 39,
  },
  {
    id: "sms-reminders",
    name: "SMS/Email Reminders",
    description: "Automated appointment and medication reminders",
    icon: MessageSquare,
    category: "integration",
    enabled: true,
    tier: "professional",
    monthlyPrice: 29,
    usageLimit: 5000,
    currentUsage: 2340,
  },
  // Operations Features
  {
    id: "staff-management",
    name: "Staff Management",
    description: "Advanced staff roles and permissions",
    icon: Users,
    category: "operations",
    enabled: true,
    tier: "basic",
    monthlyPrice: 0,
  },
  {
    id: "multi-location",
    name: "Multi-Location Support",
    description: "Manage multiple clinic locations",
    icon: Building2,
    category: "operations",
    enabled: false,
    tier: "enterprise",
    monthlyPrice: 199,
  },
  {
    id: "workflows",
    name: "Custom Workflows",
    description: "Create and manage custom clinical workflows",
    icon: Settings,
    category: "operations",
    enabled: true,
    tier: "professional",
    monthlyPrice: 49,
  },
  // Advanced Features
  {
    id: "ai-assistant",
    name: "AI Clinical Assistant",
    description: "AI-powered documentation and decision support",
    icon: Brain,
    category: "advanced",
    enabled: false,
    tier: "enterprise",
    monthlyPrice: 199,
    usageLimit: 1000,
    currentUsage: 0,
  },
  {
    id: "advanced-analytics",
    name: "Advanced Analytics",
    description: "Comprehensive reporting and analytics dashboard",
    icon: BarChart3,
    category: "advanced",
    enabled: false,
    tier: "enterprise",
    monthlyPrice: 149,
  },
  {
    id: "predictive-insights",
    name: "Predictive Insights",
    description: "AI-powered patient outcome predictions",
    icon: Sparkles,
    category: "advanced",
    enabled: false,
    tier: "enterprise",
    monthlyPrice: 249,
  },
]

// New section for advanced add-on features
const advancedAddOnFeatures: AddonFeature[] = [
  {
    id: "takehome-diversion-control",
    name: "Take-Home Diversion Control",
    icon: QrCode,
    description:
      "QR code scanning with GPS verification, facial biometrics, and real-time compliance monitoring for take-home medications",
    tier: "Premium",
    monthlyPrice: 199,
    category: "DEA Compliance",
    features: [
      "QR Code Generation on Medication Bottles",
      "GPS Location Verification (Geofencing)",
      "Facial Biometric Authentication",
      "Real-Time Compliance Alerts (6am-11am Dosing Window)",
      "Travel Exception Workflow with Counselor Approval",
      "Automatic Callback Triggers for Non-Compliance",
      "Chain of Custody Tracking from Dispensing to Consumption",
      "Diversion Risk Scoring with AI Analysis",
      "Family/Sponsor Notification System",
      "Device Registration & Multi-Device Fraud Prevention",
    ],
  },
  // Find the advancedAddons array and add this item:
  {
    id: "it-support-dashboard",
    name: "IT Support Dashboard",
    description: "Remote screen monitoring, ticket management, diagnostics, and real-time client support tools",
    icon: Headphones, // Use the imported Headphones icon
    tier: "enterprise", // Assuming IT Support is an enterprise-level feature
    monthlyPrice: 199,
    category: "advanced", // Categorized under 'advanced' features
    features: [
      "Remote screen viewing & control",
      "Support ticket management",
      "Real-time system diagnostics",
      "Client organization monitoring",
      "Session recording & playback",
      "File transfer capabilities",
      "Live chat with clients",
      "System health monitoring",
    ],
  },
]

const medicalSpecialties = [
  {
    id: "behavioral-health",
    name: "Behavioral Health / OTP/MAT",
    icon: Pill,
    description: "Substance use disorder treatment, addiction medicine, OTP programs",
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
  },
  {
    id: "primary-care",
    name: "Primary Care / Family Medicine",
    icon: Stethoscope,
    description: "General medical practice, family medicine, internal medicine",
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
  },
  {
    id: "psychiatry",
    name: "Psychiatry / Mental Health",
    icon: Brain,
    description: "Psychiatric care, mental health treatment, therapy management",
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
  },
  {
    id: "obgyn",
    name: "OB/GYN / Women's Health",
    icon: Baby,
    description: "Obstetrics, gynecology, women's health services",
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
  },
  {
    id: "cardiology",
    name: "Cardiology",
    icon: Heart,
    description: "Cardiovascular care, heart health management",
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
  },
  {
    id: "dermatology",
    name: "Dermatology",
    icon: Eye,
    description: "Skin care, dermatological procedures, cosmetic treatments",
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
  },
  {
    id: "urgent-care",
    name: "Urgent Care / Walk-In Clinic",
    icon: Activity,
    description: "Urgent care, walk-in clinic, acute care services",
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
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    icon: Baby,
    description: "Pediatric care, child health, adolescent medicine",
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
  },
  {
    id: "podiatry",
    name: "Podiatry / Foot & Ankle",
    icon: Activity,
    description: "Podiatric medicine, diabetic foot care, biomechanics, wound care",
    features: [
      "Comprehensive Foot Exams (Vascular, Neuro, Derm)",
      "Diabetic Foot Care Management",
      "Biomechanical Assessment & Gait Analysis",
      "Wound Care Documentation (Ulcers, Pressure Injuries)",
      "Nail Procedures (Ingrown, Fungal, Surgical)",
      "Orthotic Management & DME",
      "Vascular Testing (ABI, Doppler)",
      "Neuropathy Screening (Monofilament, Vibration)",
    ],
  },
  {
    id: "physical-therapy",
    name: "Physical Therapy (PT)",
    icon: Activity,
    description: "Musculoskeletal rehabilitation, orthopedic therapy, sports medicine",
    features: [
      "Initial Evaluations & Re-evals",
      "ROM/Strength Testing",
      "Functional Mobility Assessments",
      "Gait Analysis",
      "Therapeutic Exercise Documentation",
      "Manual Therapy Techniques",
      "Modality Documentation (Ultrasound, E-Stim)",
      "Home Exercise Program Builder with RTM",
      "Remote Therapeutic Monitoring (RTM) - CPT 98975-98981",
      "Patient Compliance Tracking via App",
      "Progress Tracking with Goals",
      "PT-Specific CPT Codes (97110, 97140, 97530)",
    ],
  },
  {
    id: "occupational-therapy",
    name: "Occupational Therapy (OT)",
    icon: Heart,
    description: "ADL training, hand therapy, cognitive rehabilitation, pediatric OT",
    features: [
      "ADL/IADL Assessments",
      "Cognitive Function Testing",
      "Hand Therapy & Fine Motor",
      "Sensory Integration",
      "Pediatric Development Assessments",
      "Work Hardening Programs",
      "Adaptive Equipment Recommendations",
      "Home Safety Evaluations",
      "Home Exercise Program Builder with RTM",
      "Remote Therapeutic Monitoring (RTM)",
      "OT-Specific CPT Codes (97165, 97166, 97167)",
      "Functional Goal Tracking",
    ],
  },
  {
    id: "speech-therapy",
    name: "Speech-Language Pathology (SLP)",
    icon: MessageSquare,
    description: "Communication disorders, swallowing therapy, voice disorders",
    features: [
      "Speech Intelligibility Assessments",
      "Language Comprehension Testing",
      "Articulation & Phonology Evals",
      "Swallowing/Dysphagia Assessment (FEES, MBSS)",
      "Voice Disorder Documentation",
      "Fluency (Stuttering) Therapy",
      "Augmentative Communication (AAC)",
      "Pediatric Speech Development",
      "Cognitive-Communication Disorders",
      "SLP CPT Codes (92507, 92526, 92610)",
    ],
  },
  {
    id: "dme-orthotics",
    name: "DME & Orthotics/Prosthetics",
    icon: Package,
    description: "Durable medical equipment, orthotic devices, prosthetic services",
    features: [
      "DME Order Management (Wheelchairs, Walkers, Hospital Beds)",
      "Parachute Health Integration (ePrescribe to 3,000+ Suppliers)",
      "Verse Medical AI Ordering (Auto Medical Record Extraction)",
      "Prior Authorization Workflows",
      "Orthotic Fabrication Documentation",
      "Prosthetic Fitting & Follow-up",
      "Custom Device Measurements",
      "Insurance Eligibility Verification",
      "Supplier Network Integration",
      "Delivery Tracking & Coordination",
      "HCPCS Coding (E-codes, L-codes)",
      "Patient Training Documentation",
    ],
  },
  {
    id: "county-health",
    name: "County Health Department / Public Health",
    icon: Building2,
    description: "Public health services for counties serving 100K+ residents",
    features: [
      "WIC Program Management (Women, Infants & Children)",
      "Walk-In Immunization Clinics ($7 Admin Fee)",
      "Sexual Health Services (HIV, PrEP, STI Testing)",
      "Maternal & Child Health (Home Visiting, Prenatal Care)",
      "Communicable Disease Surveillance & Reporting",
      "TB Case Management & DOT (Directly Observed Therapy)",
      "Environmental Health Inspections (Food, Water, Septic)",
      "Family Planning Services",
      "Community Health Education & Outreach",
      "Emergency Preparedness & Response",
      "Patient Portal for County Residents",
      "State Registry Integration (Immunizations, Disease Reporting)",
    ],
  },
]

export default function SubscriptionPage() {
  const [features, setFeatures] = useState<SubscriptionFeature[]>(allFeatures)
  const [currentPlan, setCurrentPlan] = useState("professional") // Initialize with professional plan
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const [isAddOnOpen, setIsAddOnOpen] = useState(false)
  const [selectedAddOn, setSelectedAddOn] = useState<SubscriptionFeature | AddonFeature | null>(null) // Updated type
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [emrType, setEmrType] = useState<"behavioral" | "primary">("behavioral")
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(["behavioral-health"])
  const [isSavingSpecialties, setIsSavingSpecialties] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [onboardingEmail, setOnboardingEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const { toast } = useToast() // Initialize toast

  const [isPracticeOnboardingOpen, setIsPracticeOnboardingOpen] = useState(false)
  const [practiceFormData, setPracticeFormData] = useState({
    practiceName: "",
    npi: "",
    dea: "",
    stateLicense: "",
    stateLicenseState: "",
    samhsa: "",
    duns: "",
    taxId: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    specialties: [] as string[],
    addons: [] as string[], // Added for add-ons selection
  })

  const pathname = usePathname()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminStatus = localStorage.getItem("isSuperAdmin") === "true"
      setIsSuperAdmin(adminStatus)
    }
  }, [])

  // Combine all available features for toggling logic
  const allAvailableFeatures = [...allFeatures, ...advancedAddOnFeatures]

  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        if (isSuperAdmin) {
          const allSpecialtyIds = medicalSpecialties.map((s) => s.id)
          setSelectedSpecialties(allSpecialtyIds)
          // Also enable all features for super admin testing
          setFeatures((prev) => prev.map((f) => ({ ...f, enabled: true })))
          return
        }

        const response = await fetch("/api/specialty-config")
        if (response.ok) {
          const data = await response.json()
          if (data.specialties && data.specialties.length > 0) {
            const enabledIds = data.specialties.map((s: any) => s.specialty_id)
            setSelectedSpecialties(enabledIds)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading specialties:", error)
      }
    }
    loadSpecialties()
  }, [isSuperAdmin])

  const generateOnboardingLink = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    // In production, this would include actual org_id from user's context
    return `${baseUrl}/clinic-onboarding?ref=subscription`
  }

  const copyOnboardingLink = async () => {
    try {
      await navigator.clipboard.writeText(generateOnboardingLink())
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error("[v0] Failed to copy:", error)
    }
  }

  const sendOnboardingEmail = async () => {
    if (!onboardingEmail) return

    try {
      // In production, this would call an API to send the email
      setEmailSent(true)
      setTimeout(() => {
        setEmailSent(false)
        setOnboardingEmail("")
        setIsOnboardingOpen(false)
      }, 2000)
    } catch (error) {
      console.error("[v0] Send onboarding email error:", error)
    }
  }

  const handlePracticeOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // In production, this would call an API to create the organization
      console.log("[v0] Practice onboarding data:", practiceFormData)

      // Show success toast
      toast({
        title: "Practice Onboarded",
        description: `${practiceFormData.practiceName} has been successfully added to the system.`,
      })

      // Reset form and close dialog
      setPracticeFormData({
        practiceName: "",
        npi: "",
        dea: "",
        stateLicense: "",
        stateLicenseState: "",
        samhsa: "",
        duns: "",
        taxId: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        phone: "",
        email: "",
        specialties: [],
        addons: [], // Reset addons
      })
      setIsPracticeOnboardingOpen(false)
    } catch (error) {
      console.error("[v0] Practice onboarding error:", error)
      toast({
        title: "Error",
        description: "Failed to onboard practice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleFeature = (featureId: string) => {
    setFeatures((prev) =>
      prev.map((f) => {
        if (f.id === featureId) {
          const tierOrder = { basic: 0, professional: 1, enterprise: 2 }
          const currentTierLevel = tierOrder[currentPlan as keyof typeof tierOrder]
          const featureTierLevel = tierOrder[f.tier]

          if (featureTierLevel > currentTierLevel && !f.enabled) {
            // Find the feature in allAvailableFeatures to get its details
            const featureDetails = allAvailableFeatures.find((feat) => feat.id === featureId)
            setSelectedAddOn(featureDetails || f) // Use details if found, fallback to f
            setIsAddOnOpen(true)
            return f // Don't change enabled state here, it's handled by the dialog
          }

          return { ...f, enabled: !f.enabled }
        }
        return f
      }),
    )
  }

  // Function to handle enabling add-on features from the dialog
  const enableAddOnFeature = (featureId: string) => {
    setFeatures((prev) => prev.map((f) => (f.id === featureId ? { ...f, enabled: true } : f)))
    // Also update the selectedAddOn state to reflect the enabled feature if it's an add-on
    setSelectedAddOn((prev) => (prev && prev.id === featureId ? { ...prev, enabled: true } : prev))
  }

  const enabledFeatures = features.filter((f) => f.enabled)
  const disabledFeatures = features.filter((f) => !f.enabled && f.monthlyPrice > 0) // Only show paid add-ons as disabled
  const monthlyAddOns = enabledFeatures.reduce((sum, f) => sum + f.monthlyPrice, 0)
  const basePlanPrice = subscriptionPlans.find((p) => p.id === currentPlan)?.price || 0
  const totalMonthly = basePlanPrice + monthlyAddOns

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "clinical":
        return <Pill className="h-4 w-4" />
      case "billing":
        return <CreditCard className="h-4 w-4" />
      case "integration":
        return <Zap className="h-4 w-4" />
      case "operations":
        return <Settings className="h-4 w-4" />
      case "advanced":
        return <Sparkles className="h-4 w-4" />
      case "DEA Compliance": // Added case for DEA Compliance
        return <QrCode className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "basic":
        return <Badge variant="secondary">Basic</Badge>
      case "professional":
        return <Badge style={{ backgroundColor: "#0891b2", color: "white" }}>Professional</Badge>
      case "enterprise":
        return <Badge style={{ backgroundColor: "#7c3aed", color: "white" }}>Enterprise</Badge>
      case "Premium": // Added case for Premium tier
        return <Badge style={{ backgroundColor: "#f59e0b", color: "white" }}>Premium</Badge>
      default:
        return <Badge variant="outline">{tier}</Badge>
    }
  }

  const toggleSpecialty = async (specialtyId: string) => {
    const newSelection = selectedSpecialties.includes(specialtyId)
      ? selectedSpecialties.filter((id) => id !== specialtyId)
      : [...selectedSpecialties, specialtyId]

    // Don't allow removing the last specialty
    if (newSelection.length === 0) return

    setSelectedSpecialties(newSelection)

    // Save to database
    setIsSavingSpecialties(true)
    try {
      await fetch("/api/specialty-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialtyIds: newSelection }),
      })
    } catch (error) {
      console.error("[v0] Error saving specialties:", error)
    } finally {
      setIsSavingSpecialties(false)
    }
  }

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) return

    try {
      const response = await fetch("/api/subscription/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        setCurrentPlan(planId)
        toast({
          title: "Plan Updated",
          description: `Successfully switched to ${subscriptionPlans.find((p) => p.id === planId)?.name} plan`,
        })
        setIsUpgradeOpen(false)
      } else {
        throw new Error("Failed to update plan")
      }
    } catch (error) {
      console.error("[v0] Error updating plan:", error)
      toast({
        title: "Error",
        description: "Failed to update subscription plan. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <DashboardSidebar />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <DashboardHeader />

        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <main className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#1e293b" }}>
                Subscription Management
              </h1>
              <p className="text-sm md:text-base" style={{ color: "#64748b" }}>
                Manage your EMR features and subscription plan
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {isSuperAdmin && (
                <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                      <Send className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Send Onboarding Link</span>
                      <span className="sm:hidden">Onboard</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>New Clinic Onboarding</DialogTitle>
                      <DialogDescription>Share this link with new clinics to begin their EMR setup</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="link" className="mt-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="link">Copy Link</TabsTrigger>
                        <TabsTrigger value="email">Send Email</TabsTrigger>
                      </TabsList>

                      <TabsContent value="link" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Onboarding Link</label>
                          <div className="flex gap-2">
                            <input
                              readOnly
                              value={generateOnboardingLink()}
                              className="flex-1 px-3 py-2 text-xs border rounded-md bg-muted"
                            />
                            <Button size="sm" onClick={copyOnboardingLink}>
                              {copiedLink ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This link will guide new clinics through the complete setup process
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="email" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Recipient Email</label>
                          <input
                            type="email"
                            placeholder="admin@newclinic.com"
                            value={onboardingEmail}
                            onChange={(e) => setOnboardingEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                          <p className="text-sm font-medium">Email Preview:</p>
                          <p className="text-xs text-muted-foreground">Subject: Your MASE EMR Setup Link</p>
                          <p className="text-xs text-muted-foreground">
                            Welcome! Click the link below to begin setting up your clinic on MASE EMR...
                          </p>
                        </div>
                        <Button
                          className="w-full"
                          onClick={sendOnboardingEmail}
                          disabled={!onboardingEmail || emailSent}
                        >
                          {emailSent ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Sent!
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Onboarding Email
                            </>
                          )}
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              )}

              {/* Add Practice Onboarding button next to Send Onboarding Link */}
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
                onClick={() => setIsPracticeOnboardingOpen(true)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Onboard New Practice</span>
                <span className="sm:hidden">New Practice</span>
              </Button>

              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export Usage Report</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                <DialogTrigger asChild>
                  <Button style={{ backgroundColor: "#7c3aed" }} className="w-full sm:w-auto">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Choose Your Plan</DialogTitle>
                    <DialogDescription>{"Select the plan that best fits your clinic's needs"}</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                    {subscriptionPlans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`relative ${plan.recommended ? "ring-2" : ""}`}
                        style={plan.recommended ? { borderColor: "#0891b2" } : undefined}
                      >
                        {plan.recommended && (
                          <div
                            className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full"
                            style={{ backgroundColor: "#0891b2", color: "white" }}
                          >
                            Recommended
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {plan.name}
                            {currentPlan === plan.id && (
                              <Badge variant="outline" style={{ color: "#16a34a" }}>
                                Current
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="text-3xl font-bold">
                            ${plan.price}
                            <span className="text-sm font-normal" style={{ color: "#64748b" }}>
                              /month
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#16a34a" }} />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button
                            className="w-full mt-4"
                            variant={currentPlan === plan.id ? "outline" : "default"}
                            disabled={currentPlan === plan.id}
                            onClick={() => handleSelectPlan(plan.id)}
                          >
                            {currentPlan === plan.id ? "Current Plan" : "Select Plan"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                EMR Specialty Configuration
              </CardTitle>
              <CardDescription>
                Select your medical specialties to customize available features, workflows, and templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Toggle for Legacy Support */}
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg"
                style={{ backgroundColor: "#f0f9ff" }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Quick Setup</h3>
                    <Badge variant={emrType === "behavioral" ? "default" : "secondary"}>
                      {emrType === "behavioral" ? "Behavioral Health" : "Primary Care"}
                    </Badge>
                  </div>
                  <p className="text-sm" style={{ color: "#64748b" }}>
                    Quick toggle between behavioral health and primary care, or customize with multiple specialties
                    below
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium" style={{ color: "#64748b" }}>
                      Behavioral Health
                    </span>
                  </div>
                  <Switch
                    checked={emrType === "primary"}
                    onCheckedChange={(checked) => {
                      setEmrType(checked ? "primary" : "behavioral")
                      // Auto-select the corresponding specialty
                      setSelectedSpecialties(checked ? ["primary-care"] : ["behavioral-health"])
                    }}
                    className="data-[state=checked]:bg-cyan-600"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium" style={{ color: "#64748b" }}>
                      Primary Care
                    </span>
                  </div>
                </div>
              </div>

              {/* Multiple Specialty Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Active Specialties</h4>
                  <Badge variant="outline">{selectedSpecialties.length} selected</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medicalSpecialties.map((specialty) => {
                    const Icon = specialty.icon
                    const isSelected = selectedSpecialties.includes(specialty.id)

                    return (
                      <Card
                        key={specialty.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? "ring-2 ring-cyan-600 bg-cyan-50" : ""
                        }`}
                        onClick={() => toggleSpecialty(specialty.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-2 rounded-lg ${isSelected ? "bg-cyan-600" : "bg-gray-100"}`}
                                style={isSelected ? { color: "white" } : { color: "#64748b" }}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{specialty.name}</CardTitle>
                              </div>
                            </div>
                            {isSelected && <Check className="h-5 w-5 text-cyan-600" />}
                          </div>
                          <CardDescription className="text-xs">{specialty.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            {specialty.features.slice(0, 4).map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
                                <div
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: isSelected ? "#06b6d4" : "#cbd5e1" }}
                                />
                                {feature}
                              </div>
                            ))}
                            {specialty.features.length > 4 && (
                              <div className="text-xs" style={{ color: "#94a3b8" }}>
                                +{specialty.features.length - 4} more features
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Selected Specialties Summary */}
              {selectedSpecialties.length > 0 && (
                <div className="p-4 rounded-lg border-2 border-cyan-200 bg-cyan-50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-600" />
                    Your EMR is configured for:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedSpecialties.map((specId) => {
                      const specialty = medicalSpecialties.find((s) => s.id === specId)
                      if (!specialty) return null
                      const Icon = specialty.icon
                      return (
                        <div key={specId} className="flex items-center gap-2 p-2 rounded bg-white text-sm font-medium">
                          <Icon className="h-4 w-4 text-cyan-600" />
                          {specialty.name.split(" / ")[0]}
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-3 text-xs" style={{ color: "#64748b" }}>
                    All specialty-specific templates, workflows, and features are now enabled in your EMR.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Plan Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                      Current Plan
                    </p>
                    <p className="text-lg md:text-2xl font-bold capitalize">{currentPlan}</p>
                  </div>
                  <Crown className="h-6 w-6 md:h-8 md:w-8" style={{ color: "#0891b2" }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                      Monthly Cost
                    </p>
                    <p className="text-lg md:text-2xl font-bold">${totalMonthly}</p>
                  </div>
                  <CreditCard className="h-6 w-6 md:h-8 md:w-8" style={{ color: "#16a34a" }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                      Active Features
                    </p>
                    <p className="text-lg md:text-2xl font-bold">{enabledFeatures.length}</p>
                  </div>
                  <Check className="h-6 w-6 md:h-8 md:w-8" style={{ color: "#16a34a" }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                      Add-Ons Cost
                    </p>
                    <p className="text-lg md:text-2xl font-bold">${monthlyAddOns}</p>
                  </div>
                  <Package className="h-6 w-6 md:h-8 md:w-8" style={{ color: "#f59e0b" }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="inline-flex w-max md:w-auto">
                <TabsTrigger value="overview" className="text-xs md:text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="clinical" className="text-xs md:text-sm">
                  Clinical
                </TabsTrigger>
                <TabsTrigger value="billing" className="text-xs md:text-sm">
                  Billing
                </TabsTrigger>
                <TabsTrigger value="integration" className="text-xs md:text-sm">
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="operations" className="text-xs md:text-sm">
                  Operations
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs md:text-sm">
                  Advanced
                </TabsTrigger>
                <TabsTrigger value="DEA Compliance" className="text-xs md:text-sm">
                  DEA Compliance
                </TabsTrigger>
                <TabsTrigger value="usage" className="text-xs md:text-sm">
                  Usage
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Enabled Features */}
                <Card>
                  <CardHeader className="pb-2 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Check className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#16a34a" }} />
                      Enabled Features ({enabledFeatures.length})
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Features currently active in your subscription
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 md:space-y-3 max-h-72 md:max-h-96 overflow-y-auto">
                      {enabledFeatures.map((feature) => (
                        <div
                          key={feature.id}
                          className="flex items-center justify-between p-2 md:p-3 rounded-lg"
                          style={{ backgroundColor: "#f0fdf4" }}
                        >
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <feature.icon
                              className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0"
                              style={{ color: "#16a34a" }}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-sm md:text-base truncate">{feature.name}</p>
                              <p className="text-xs hidden sm:block" style={{ color: "#64748b" }}>
                                {feature.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {feature.monthlyPrice > 0 && (
                              <span className="text-xs md:text-sm hidden sm:inline" style={{ color: "#64748b" }}>
                                +${feature.monthlyPrice}/mo
                              </span>
                            )}
                            <Switch checked={feature.enabled} onCheckedChange={() => toggleFeature(feature.id)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Available Add-Ons */}
                <Card>
                  <CardHeader className="pb-2 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Package className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#64748b" }} />
                      Available Add-Ons ({disabledFeatures.length})
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">Additional features you can enable</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 md:space-y-3 max-h-72 md:max-h-96 overflow-y-auto">
                      {disabledFeatures.map((feature) => (
                        <div
                          key={feature.id}
                          className="flex items-center justify-between p-2 md:p-3 rounded-lg border"
                          style={{ borderColor: "#e2e8f0" }}
                        >
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <feature.icon
                              className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0"
                              style={{ color: "#64748b" }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                <p className="font-medium text-sm md:text-base">{feature.name}</p>
                                <span className="hidden sm:inline">{getTierBadge(feature.tier)}</span>
                              </div>
                              <p className="text-xs hidden sm:block" style={{ color: "#64748b" }}>
                                {feature.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs md:text-sm font-medium" style={{ color: "#0891b2" }}>
                              +${feature.monthlyPrice}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleFeature(feature.id)}
                              className="text-xs md:text-sm"
                            >
                              Enable
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Category-specific tabs */}
            {["clinical", "billing", "integration", "operations", "advanced"].map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <Card>
                  <CardHeader className="pb-2 md:pb-4">
                    <CardTitle className="flex items-center gap-2 capitalize text-base md:text-lg">
                      {getCategoryIcon(category)}
                      {category} Features
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Manage {category} features for your clinic
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 md:space-y-4">
                      {features
                        .filter((f) => f.category === category)
                        .map((feature) => (
                          <div
                            key={feature.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border gap-3"
                            style={{
                              borderColor: feature.enabled ? "#86efac" : "#e2e8f0",
                              backgroundColor: feature.enabled ? "#f0fdf4" : "#ffffff",
                            }}
                          >
                            <div className="flex items-start sm:items-center gap-3 md:gap-4">
                              <div
                                className="p-2 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: feature.enabled ? "#dcfce7" : "#f1f5f9" }}
                              >
                                <feature.icon
                                  className="h-5 w-5 md:h-6 md:w-6"
                                  style={{ color: feature.enabled ? "#16a34a" : "#64748b" }}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm md:text-base">{feature.name}</p>
                                  {getTierBadge(feature.tier)}
                                </div>
                                <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                                  {feature.description}
                                </p>
                                {feature.usageLimit && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>
                                        Usage: {feature.currentUsage?.toLocaleString()} /{" "}
                                        {feature.usageLimit.toLocaleString()}
                                      </span>
                                      <span>
                                        {Math.round(((feature.currentUsage || 0) / feature.usageLimit) * 100)}%
                                      </span>
                                    </div>
                                    <Progress
                                      value={((feature.currentUsage || 0) / feature.usageLimit) * 100}
                                      className="h-2"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
                              <div className="text-left sm:text-right">
                                {feature.monthlyPrice > 0 ? (
                                  <p className="font-semibold text-sm md:text-base">${feature.monthlyPrice}/mo</p>
                                ) : (
                                  <p className="text-xs md:text-sm" style={{ color: "#16a34a" }}>
                                    Included
                                  </p>
                                )}
                              </div>
                              <Switch checked={feature.enabled} onCheckedChange={() => toggleFeature(feature.id)} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            {/* Add DEA Compliance Tab */}
            <TabsContent value="DEA Compliance" className="space-y-4">
              <Card>
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 capitalize text-base md:text-lg">
                    <QrCode className="h-5 w-5" />
                    DEA Compliance Features
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Manage DEA compliance features for your clinic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {features
                      .filter((f) => f.category === "DEA Compliance")
                      .map((feature) => (
                        <div
                          key={feature.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border gap-3"
                          style={{
                            borderColor: feature.enabled ? "#86efac" : "#e2e8f0",
                            backgroundColor: feature.enabled ? "#f0fdf4" : "#ffffff",
                          }}
                        >
                          <div className="flex items-start sm:items-center gap-3 md:gap-4">
                            <div
                              className="p-2 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: feature.enabled ? "#dcfce7" : "#f1f5f9" }}
                            >
                              <feature.icon
                                className="h-5 w-5 md:h-6 md:w-6"
                                style={{ color: feature.enabled ? "#16a34a" : "#64748b" }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm md:text-base">{feature.name}</p>
                                {getTierBadge(feature.tier)}
                              </div>
                              <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                                {feature.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
                            <div className="text-left sm:text-right">
                              {feature.monthlyPrice > 0 ? (
                                <p className="font-semibold text-sm md:text-base">${feature.monthlyPrice}/mo</p>
                              ) : (
                                <p className="text-xs md:text-sm" style={{ color: "#16a34a" }}>
                                  Included
                                </p>
                              )}
                            </div>
                            <Switch checked={feature.enabled} onCheckedChange={() => toggleFeature(feature.id)} />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="text-base md:text-lg">Usage & Limits</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Monitor your feature usage and limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 md:space-y-6">
                    {features
                      .filter((f) => f.usageLimit)
                      .map((feature) => (
                        <div key={feature.id} className="space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <feature.icon className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#64748b" }} />
                              <span className="font-medium text-sm md:text-base">{feature.name}</span>
                              {!feature.enabled && (
                                <Badge variant="outline" style={{ color: "#dc2626" }} className="text-xs">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                              {feature.currentUsage?.toLocaleString()} / {feature.usageLimit?.toLocaleString()}
                            </span>
                          </div>
                          <Progress
                            value={((feature.currentUsage || 0) / (feature.usageLimit || 1)) * 100}
                            className="h-2 md:h-3"
                          />
                          {((feature.currentUsage || 0) / (feature.usageLimit || 1)) * 100 > 80 && (
                            <p className="text-xs flex items-center gap-1" style={{ color: "#f59e0b" }}>
                              <AlertTriangle className="h-3 w-3" />
                              Approaching limit - consider upgrading
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="text-base md:text-lg">Staff Users</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Active users on your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm md:text-base">
                      <span className="font-medium">Active Staff Members</span>
                      <span>18 / 25</span>
                    </div>
                    <Progress value={72} className="h-2 md:h-3" />
                    <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                      Professional plan includes up to 25 staff users
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add-On Upgrade Dialog */}
          <Dialog open={isAddOnOpen} onOpenChange={setIsAddOnOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base md:text-lg">Enable {selectedAddOn?.name}</DialogTitle>
                <DialogDescription>This feature requires an upgrade or add-on purchase</DialogDescription>
              </DialogHeader>
              {selectedAddOn && (
                <div className="py-4 space-y-4">
                  <div
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg"
                    style={{ backgroundColor: "#f1f5f9" }}
                  >
                    <selectedAddOn.icon className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" style={{ color: "#0891b2" }} />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm md:text-base">{selectedAddOn.name}</p>
                      <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                        {selectedAddOn.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm md:text-base">Required Tier</p>
                      <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                        Available in {selectedAddOn.tier} plan
                      </p>
                    </div>
                    {getTierBadge(selectedAddOn.tier)}
                  </div>
                  {/* Displaying Add-On Price */}
                  {selectedAddOn.monthlyPrice > 0 && (
                    <div className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm md:text-base">Add-On Price</p>
                        <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>
                          Monthly recurring charge
                        </p>
                      </div>
                      <p className="text-lg md:text-xl font-bold">${selectedAddOn.monthlyPrice}/mo</p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsAddOnOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (selectedAddOn) {
                      enableAddOnFeature(selectedAddOn.id) // Use the new function
                    }
                    setIsAddOnOpen(false)
                  }}
                >
                  Enable {selectedAddOn?.monthlyPrice ? `(+${selectedAddOn.monthlyPrice}/mo)` : ""}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Practice Onboarding Dialog */}
          <Dialog open={isPracticeOnboardingOpen} onOpenChange={setIsPracticeOnboardingOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Onboard New Practice</DialogTitle>
                <DialogDescription>
                  Enter practice information and credentials to configure agency setup
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePracticeOnboarding} className="space-y-6 mt-4">
                {/* Practice Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Practice Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Practice Name *</label>
                      <input
                        required
                        type="text"
                        value={practiceFormData.practiceName}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, practiceName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="ABC Mental Health Clinic"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">NPI Number *</label>
                      <input
                        required
                        type="text"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        value={practiceFormData.npi}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, npi: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="1234567890"
                      />
                      <p className="text-xs text-muted-foreground mt-1">10-digit National Provider Identifier</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">DEA Number *</label>
                      <input
                        required
                        type="text"
                        pattern="[A-Z]{2}[0-9]{7}"
                        maxLength={9}
                        value={practiceFormData.dea}
                        onChange={(e) =>
                          setPracticeFormData({ ...practiceFormData, dea: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="AB1234567"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Drug Enforcement Administration Number</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">State License Number *</label>
                      <input
                        required
                        type="text"
                        value={practiceFormData.stateLicense}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, stateLicense: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="12345678"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">License State *</label>
                      <select
                        required
                        value={practiceFormData.stateLicenseState}
                        onChange={(e) =>
                          setPracticeFormData({ ...practiceFormData, stateLicenseState: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md mt-1"
                      >
                        <option value="">Select State</option>
                        <option value="AL">Alabama</option>
                        <option value="AK">Alaska</option>
                        <option value="AZ">Arizona</option>
                        <option value="AR">Arkansas</option>
                        <option value="CA">California</option>
                        <option value="CO">Colorado</option>
                        <option value="CT">Connecticut</option>
                        <option value="DE">Delaware</option>
                        <option value="FL">Florida</option>
                        <option value="GA">Georgia</option>
                        <option value="HI">Hawaii</option>
                        <option value="ID">Idaho</option>
                        <option value="IL">Illinois</option>
                        <option value="IN">Indiana</option>
                        <option value="IA">Iowa</option>
                        <option value="KS">Kansas</option>
                        <option value="KY">Kentucky</option>
                        <option value="LA">Louisiana</option>
                        <option value="ME">Maine</option>
                        <option value="MD">Maryland</option>
                        <option value="MA">Massachusetts</option>
                        <option value="MI">Michigan</option>
                        <option value="MN">Minnesota</option>
                        <option value="MS">Mississippi</option>
                        <option value="MO">Missouri</option>
                        <option value="MT">Montana</option>
                        <option value="NE">Nebraska</option>
                        <option value="NV">Nevada</option>
                        <option value="NH">New Hampshire</option>
                        <option value="NJ">New Jersey</option>
                        <option value="NM">New Mexico</option>
                        <option value="NY">New York</option>
                        <option value="NC">North Carolina</option>
                        <option value="ND">North Dakota</option>
                        <option value="OH">Ohio</option>
                        <option value="OK">Oklahoma</option>
                        <option value="OR">Oregon</option>
                        <option value="PA">Pennsylvania</option>
                        <option value="RI">Rhode Island</option>
                        <option value="SC">South Carolina</option>
                        <option value="SD">South Dakota</option>
                        <option value="TN">Tennessee</option>
                        <option value="TX">Texas</option>
                        <option value="UT">Utah</option>
                        <option value="VT">Vermont</option>
                        <option value="VA">Virginia</option>
                        <option value="WA">Washington</option>
                        <option value="WV">West Virginia</option>
                        <option value="WI">Wisconsin</option>
                        <option value="WY">Wyoming</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">SAMHSA Number *</label>
                      <input
                        required
                        type="text"
                        value={practiceFormData.samhsa}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, samhsa: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="SAMHSA-12345"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Substance Abuse Mental Health Services Admin</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">DUNS Number (Optional)</label>
                      <input
                        type="text"
                        pattern="[0-9]{9}"
                        maxLength={9}
                        value={practiceFormData.duns}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, duns: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="123456789"
                      />
                      <p className="text-xs text-muted-foreground mt-1">9-digit Data Universal Numbering System</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tax ID (EIN) *</label>
                      <input
                        required
                        type="text"
                        pattern="[0-9]{2}-[0-9]{7}"
                        value={practiceFormData.taxId}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, taxId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="12-3456789"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Contact Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Address *</label>
                      <input
                        required
                        type="text"
                        value={practiceFormData.address}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, address: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">City *</label>
                      <input
                        required
                        type="text"
                        value={practiceFormData.city}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, city: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="Detroit"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">State *</label>
                      <select
                        required
                        value={practiceFormData.state}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, state: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                      >
                        <option value="">Select State</option>
                        <option value="MI">Michigan</option>
                        <option value="AL">Alabama</option>
                        <option value="AK">Alaska</option>
                        <option value="AZ">Arizona</option>
                        <option value="AR">Arkansas</option>
                        <option value="CA">California</option>
                        <option value="CO">Colorado</option>
                        <option value="CT">Connecticut</option>
                        <option value="DE">Delaware</option>
                        <option value="FL">Florida</option>
                        <option value="GA">Georgia</option>
                        <option value="HI">Hawaii</option>
                        <option value="ID">Idaho</option>
                        <option value="IL">Illinois</option>
                        <option value="IN">Indiana</option>
                        <option value="IA">Iowa</option>
                        <option value="KS">Kansas</option>
                        <option value="KY">Kentucky</option>
                        <option value="LA">Louisiana</option>
                        <option value="ME">Maine</option>
                        <option value="MD">Maryland</option>
                        <option value="MA">Massachusetts</option>
                        <option value="MN">Minnesota</option>
                        <option value="MS">Mississippi</option>
                        <option value="MO">Missouri</option>
                        <option value="MT">Montana</option>
                        <option value="NE">Nebraska</option>
                        <option value="NV">Nevada</option>
                        <option value="NH">New Hampshire</option>
                        <option value="NJ">New Jersey</option>
                        <option value="NM">New Mexico</option>
                        <option value="NY">New York</option>
                        <option value="NC">North Carolina</option>
                        <option value="ND">North Dakota</option>
                        <option value="OH">Ohio</option>
                        <option value="OK">Oklahoma</option>
                        <option value="OR">Oregon</option>
                        <option value="PA">Pennsylvania</option>
                        <option value="RI">Rhode Island</option>
                        <option value="SC">South Carolina</option>
                        <option value="SD">South Dakota</option>
                        <option value="TN">Tennessee</option>
                        <option value="TX">Texas</option>
                        <option value="UT">Utah</option>
                        <option value="VT">Vermont</option>
                        <option value="VA">Virginia</option>
                        <option value="WA">Washington</option>
                        <option value="WV">West Virginia</option>
                        <option value="WI">Wisconsin</option>
                        <option value="WY">Wyoming</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">ZIP Code *</label>
                      <input
                        required
                        type="text"
                        pattern="[0-9]{5}"
                        maxLength={5}
                        value={practiceFormData.zip}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, zip: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="48201"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Phone *</label>
                      <input
                        required
                        type="tel"
                        value={practiceFormData.phone}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="(313) 555-0100"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <input
                        required
                        type="email"
                        value={practiceFormData.email}
                        onChange={(e) => setPracticeFormData({ ...practiceFormData, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md mt-1"
                        placeholder="admin@practice.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Specialties Offered Section */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Specialties Offered *</label>
                  <p className="text-xs text-muted-foreground">Select all specialties this practice offers</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-4">
                    {[
                      { value: "behavioral-health", label: "Behavioral Health" },
                      { value: "otp", label: "OTP (Opioid Treatment Program)" },
                      { value: "mat", label: "MAT (Medication-Assisted Treatment)" },
                      { value: "primary-care", label: "Primary Care" },
                      { value: "psychiatry", label: "Psychiatry" },
                      { value: "obgyn", label: "OB/GYN" },
                      { value: "pediatrics", label: "Pediatrics" },
                      { value: "cardiology", label: "Cardiology" },
                      { value: "physical-therapy", label: "Physical Therapy" },
                      { value: "occupational-therapy", label: "Occupational Therapy" },
                      { value: "substance-use-disorder", label: "Substance Use Disorder" },
                      { value: "mental-health", label: "Mental Health Counseling" },
                    ].map((specialty) => (
                      <label
                        key={specialty.value}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-accent/50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={practiceFormData.specialties.includes(specialty.value)}
                          onChange={() => {
                            const updatedSpecialties = practiceFormData.specialties.includes(specialty.value)
                              ? practiceFormData.specialties.filter((s) => s !== specialty.value)
                              : [...practiceFormData.specialties, specialty.value]
                            setPracticeFormData({ ...practiceFormData, specialties: updatedSpecialties })
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm">{specialty.label}</span>
                      </label>
                    ))}
                  </div>

                  {practiceFormData.specialties.length === 0 && (
                    <p className="text-xs text-destructive">Please select at least one specialty</p>
                  )}
                </div>

                {/* Add-Ons Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Select Add-On Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose additional features to enhance your practice capabilities
                  </p>

                  {/* Clinical Add-Ons */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Clinical Features
                    </h4>
                    <div className="grid gap-3 ml-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-eprescribing"
                          checked={practiceFormData.addons?.includes("e-prescribing")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "e-prescribing"]
                                : (prev.addons || []).filter((a) => a !== "e-prescribing"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-eprescribing" className="font-normal">
                            E-Prescribing (EPCS) - $99/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Electronic prescribing including controlled substances
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-telehealth"
                          checked={practiceFormData.addons?.includes("telehealth")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "telehealth"]
                                : (prev.addons || []).filter((a) => a !== "telehealth"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-telehealth" className="font-normal">
                            Telehealth - $79/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">Video consultations with patients</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-lab"
                          checked={practiceFormData.addons?.includes("lab-integration")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "lab-integration"]
                                : (prev.addons || []).filter((a) => a !== "lab-integration"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-lab" className="font-normal">
                            Lab Integration - $59/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Connect with lab providers for orders and results
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing Add-Ons */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Billing Features
                    </h4>
                    <div className="grid gap-3 ml-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-billing"
                          checked={practiceFormData.addons?.includes("billing-claims")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "billing-claims"]
                                : (prev.addons || []).filter((a) => a !== "billing-claims"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-billing" className="font-normal">
                            Billing & Claims - $149/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">Insurance billing and claims management</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-clearinghouse"
                          checked={practiceFormData.addons?.includes("clearinghouse")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "clearinghouse"]
                                : (prev.addons || []).filter((a) => a !== "clearinghouse"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-clearinghouse" className="font-normal">
                            Clearinghouse Integration - $79/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">Direct claims submission to clearinghouses</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-otp-bundle"
                          checked={practiceFormData.addons?.includes("otp-bundle")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "otp-bundle"]
                                : (prev.addons || []).filter((a) => a !== "otp-bundle"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-otp-bundle" className="font-normal">
                            OTP Bundle Billing - $49/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Specialized OTP billing with bundle calculator
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Integration Add-Ons */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Integration Features
                    </h4>
                    <div className="grid gap-3 ml-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-pmp"
                          checked={practiceFormData.addons?.includes("pmp-integration")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "pmp-integration"]
                                : (prev.addons || []).filter((a) => a !== "pmp-integration"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-pmp" className="font-normal">
                            PMP Integration - $49/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">Prescription Monitoring Program integration</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-mobile-checkin"
                          checked={practiceFormData.addons?.includes("mobile-check-in")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "mobile-check-in"]
                                : (prev.addons || []).filter((a) => a !== "mobile-check-in"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-mobile-checkin" className="font-normal">
                            Mobile Check-In - $39/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">Patient mobile check-in and queue management</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-sms"
                          checked={practiceFormData.addons?.includes("sms-reminders")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "sms-reminders"]
                                : (prev.addons || []).filter((a) => a !== "sms-reminders"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-sms" className="font-normal">
                            SMS/Email Reminders - $29/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Automated appointment and medication reminders
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Add-Ons */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Advanced Features
                    </h4>
                    <div className="grid gap-3 ml-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-ai"
                          checked={practiceFormData.addons?.includes("ai-assistant")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "ai-assistant"]
                                : (prev.addons || []).filter((a) => a !== "ai-assistant"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-ai" className="font-normal">
                            AI Clinical Assistant - $199/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">AI-powered documentation and decision support</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-analytics"
                          checked={practiceFormData.addons?.includes("advanced-analytics")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "advanced-analytics"]
                                : (prev.addons || []).filter((a) => a !== "advanced-analytics"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-analytics" className="font-normal">
                            Advanced Analytics - $149/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Comprehensive reporting and analytics dashboard
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-diversion"
                          checked={practiceFormData.addons?.includes("takehome-diversion-control")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "takehome-diversion-control"]
                                : (prev.addons || []).filter((a) => a !== "takehome-diversion-control"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-diversion" className="font-normal">
                            Take-Home Diversion Control - $199/mo
                            <Badge variant="secondary" className="ml-2">
                              Premium
                            </Badge>
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            QR code scanning with GPS verification and facial biometrics
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addon-multi-location"
                          checked={practiceFormData.addons?.includes("multi-location")}
                          onCheckedChange={(checked) =>
                            setPracticeFormData((prev) => ({
                              ...prev,
                              addons: checked
                                ? [...(prev.addons || []), "multi-location"]
                                : (prev.addons || []).filter((a) => a !== "multi-location"),
                            }))
                          }
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor="addon-multi-location" className="font-normal">
                            Multi-Location Support - $199/mo
                          </Label>
                          <p className="text-xs text-muted-foreground">Manage multiple clinic locations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsPracticeOnboardingOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Building2 className="h-4 w-4 mr-2" />
                    Onboard Practice
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
