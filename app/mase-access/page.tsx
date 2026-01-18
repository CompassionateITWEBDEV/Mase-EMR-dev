"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Heart,
  Shield,
  Users,
  BookOpen,
  Phone,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Home,
  Scale,
  Baby,
  Briefcase,
  Clock,
  MapPin,
  AlertTriangle,
  QrCode,
  Send,
  Eye,
  UserPlus,
  Filter,
  Search,
  Download,
  PhoneCall,
  ChevronRight,
  Lock,
  HelpCircle,
  Pill,
  FileText,
  Fingerprint,
  TestTube,
  Stethoscope,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ConsentForm {
  id: string
  title: string
  description: string
  category: "treatment" | "testing" | "privacy"
  required: boolean
  content: string
  acknowledgments: string[]
}

interface OutreachLead {
  id: string
  created_at: string
  source: string
  referral_type: string
  urgency: string
  status: "new" | "contacted" | "scheduled" | "converted" | "closed"
  contact_method?: string
  contact_info?: string
  preferred_time?: string
  concerns: string[]
  treatment_goals: string[]
  notes?: string
  assigned_to?: string
}

export default function MASEAccessPage() {
  const [activeTab, setActiveTab] = useState("home")
  const [screeningStep, setScreeningStep] = useState(1)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [leadFilter, setLeadFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [consentStep, setConsentStep] = useState(1)
  const [signedConsents, setSignedConsents] = useState<Record<string, boolean>>({})
  const [consentSignature, setConsentSignature] = useState("")
  const [consentDate, setConsentDate] = useState("")
  const [witnessName, setWitnessName] = useState("")
  const [patientInitials, setPatientInitials] = useState("")

  const consentForms: ConsentForm[] = [
    {
      id: "consent-to-treat",
      title: "Consent to Treatment",
      description: "Authorization to receive medication-assisted treatment (MAT) services",
      category: "treatment",
      required: true,
      content: `CONSENT TO TREATMENT FOR OPIOID USE DISORDER

I, the undersigned patient, hereby voluntarily consent to receive treatment for Opioid Use Disorder at this facility. I understand and agree to the following:

1. NATURE OF TREATMENT
I understand that I will be receiving Medication-Assisted Treatment (MAT), which may include medications such as Methadone, Buprenorphine (Suboxone/Subutex), or Naltrexone (Vivitrol), along with counseling and behavioral therapies.

2. BENEFITS AND RISKS
I understand that MAT has been shown to:
• Reduce illicit opioid use
• Decrease risk of overdose death
• Reduce criminal activity
• Improve social functioning
• Support long-term recovery

I also understand that treatment may involve certain risks including:
• Side effects from medications
• Physical dependence on treatment medications
• Risk of overdose if medications are misused
• Potential drug interactions

3. ALTERNATIVES
I have been informed of alternative treatment options including:
• Medication-free recovery programs
• Residential treatment programs
• Intensive outpatient programs
• Support groups (NA, AA, SMART Recovery)

4. PATIENT RESPONSIBILITIES
I agree to:
• Attend all scheduled appointments
• Take medications only as prescribed
• Participate in required counseling sessions
• Submit to drug screening as required
• Inform staff of any changes in my health or medications
• Not use illicit substances during treatment
• Follow all program rules and policies

5. CONFIDENTIALITY
I understand that my treatment records are protected under federal law (42 CFR Part 2) and cannot be disclosed without my written consent, except in limited circumstances permitted by law.

6. VOLUNTARY PARTICIPATION
I understand that my participation in treatment is voluntary and that I may withdraw from treatment at any time. However, I understand the risks of abrupt discontinuation and agree to discuss any concerns with my treatment team.`,
      acknowledgments: [
        "I have read and understand the information above",
        "I have had the opportunity to ask questions",
        "I voluntarily consent to treatment",
        "I understand the risks and benefits of treatment",
        "I agree to follow program rules and policies",
      ],
    },
    {
      id: "uds-consent",
      title: "Urine Drug Screen (UDS) Consent",
      description: "Authorization for drug testing during treatment",
      category: "testing",
      required: true,
      content: `CONSENT FOR URINE DRUG SCREENING

I, the undersigned patient, hereby consent to submit to urine drug screening (UDS) as part of my treatment program. I understand and agree to the following:

1. PURPOSE OF TESTING
Drug screening is an essential part of medication-assisted treatment. Testing helps:
• Monitor treatment progress and medication compliance
• Ensure patient safety
• Identify potential substance use issues early
• Adjust treatment plans as needed
• Meet regulatory requirements

2. TESTING PROCEDURES
I understand that:
• I may be asked to provide a urine sample at any scheduled or random appointment
• Collection may be directly observed to ensure sample integrity
• Samples will be tested for opioids, amphetamines, benzodiazepines, cocaine, THC, and other substances
• Positive results may require confirmation testing at an outside laboratory
• I must disclose all prescription and over-the-counter medications before testing

3. USE OF RESULTS
I understand that drug screen results:
• Will be documented in my medical record
• Will be reviewed by my treatment team
• May affect my treatment plan, including take-home medication privileges
• Will NOT be shared with law enforcement without my consent or court order
• Are protected under 42 CFR Part 2 confidentiality regulations`,
      acknowledgments: [
        "I consent to random and scheduled urine drug screening",
        "I understand testing may be directly observed",
        "I will disclose all medications before testing",
        "I understand how results will be used",
        "I understand the consequences of positive results or refusal",
      ],
    },
    {
      id: "pregnancy-test-consent",
      title: "Pregnancy Test Consent",
      description: "Authorization for pregnancy testing (for patients of childbearing potential)",
      category: "testing",
      required: false,
      content: `CONSENT FOR PREGNANCY TESTING

I, the undersigned patient, hereby consent to pregnancy testing as part of my treatment intake and ongoing care. I understand and agree to the following:

1. PURPOSE OF TESTING
Pregnancy testing is important because:
• Certain medications require dose adjustments during pregnancy
• Pregnancy affects treatment planning and monitoring
• Pregnant patients receive specialized prenatal support
• Some medications may require evaluation during pregnancy
• Early identification allows for optimal care coordination

2. TESTING PROCEDURES
I understand that:
• A urine pregnancy test will be performed during intake
• Additional testing may occur during treatment as clinically indicated
• A positive result may be confirmed with blood testing
• Results will be available within minutes for rapid tests

3. IF PREGNANCY IS DETECTED
If I am pregnant, I understand that:
• I will receive information about pregnancy-safe treatment options
• My medication dosage may need adjustment
• I will be referred to prenatal care if not already established
• I will receive education about medication use during pregnancy
• My baby will be monitored for Neonatal Abstinence Syndrome (NAS), which is treatable
• I will NOT be discharged from treatment due to pregnancy
• Specialized counseling and support services are available

4. CONFIDENTIALITY
I understand that:
• My pregnancy status is protected health information
• Results will only be shared with my treatment team
• Information will not be disclosed without my consent
• 42 CFR Part 2 protections apply to pregnancy-related information

5. PREGNANCY DURING TREATMENT
If I become pregnant during treatment:
• I should notify my treatment team immediately
• My medication and treatment plan will be reviewed
• I will receive referrals to appropriate prenatal services
• Continued treatment during pregnancy is recommended and safe

6. SPECIAL CONSIDERATIONS
I understand that:
• Methadone and Buprenorphine are safe during pregnancy
• Stopping treatment abruptly can cause serious harm to the fetus
• Pregnant patients may qualify for priority services
• Breastfeeding considerations will be discussed if applicable`,
      acknowledgments: [
        "I consent to pregnancy testing during intake and as needed",
        "I understand the importance of testing for treatment planning",
        "I will notify staff if I become pregnant during treatment",
        "I understand pregnancy does not disqualify me from treatment",
        "I understand the special care available for pregnant patients",
      ],
    },
    {
      id: "release-of-information",
      title: "Release of Information",
      description: "Authorization to share specific information with other healthcare providers",
      category: "privacy",
      required: false,
      content: `RELEASE OF INFORMATION FOR CONTINUITY OF CARE

I, the undersigned patient, hereby authorize MASE Access to disclose specific protected health information (PHI) to the following designated healthcare provider(s) for the purpose of coordinating my treatment and ensuring continuity of care.

1. PATIENT AUTHORIZATION
I understand that this authorization is voluntary and that I may revoke it at any time by providing written notice to MASE Access. Revocation will not affect information already released prior to the notification.

2. INFORMATION TO BE DISCLOSED
I authorize the release of the following information:
* Brief summary of current treatment plan
* Medication names and dosages
* Appointment dates and attendance
* Drug screening results (if applicable)
* Emergency contact information (if needed for medical emergencies)

3. PURPOSE OF DISCLOSURE
This information will be used for:
* Coordinating care with other healthcare providers
* Ensuring medication safety and avoiding drug interactions
* Facilitating referrals to specialists
* Emergency medical situations

4. RECIPIENTS
Information may be disclosed to:
* Primary care physicians
* Specialists (as needed for my care)
* Emergency departments (in emergency situations)
* Pharmacies (for medication verification)

5. EXPIRATION
This authorization will expire one year from the date of signature, unless I revoke it earlier in writing.

6. MY RIGHTS
I understand that:
* I have the right to revoke this authorization at any time
* I have the right to request a copy of this authorization
* I have the right to refuse to sign this authorization
* Refusal to sign may affect coordination of care but will not affect my treatment at MASE Access`,
      acknowledgments: [
        "I understand this authorization is voluntary",
        "I understand what information will be disclosed",
        "I understand the purpose of disclosure",
        "I understand my right to revoke this authorization",
        "I authorize the release of information as described above",
      ],
    },
  ]

  // Anonymous screening form state
  const [screeningData, setScreeningData] = useState({
    readinessLevel: "",
    primaryConcern: "",
    substanceHistory: [] as string[],
    treatmentGoals: [] as string[],
    specialNeeds: [] as string[],
    contactRequested: false,
    contactMethod: "",
    contactInfo: "",
    preferredTime: "",
    additionalNotes: "",
  })

  // Referral form state
  const [referralData, setReferralData] = useState({
    referralType: "",
    organizationName: "",
    referrerName: "",
    referrerContact: "",
    urgencyLevel: "",
    generalConcern: "",
    additionalInfo: "",
  })

  // Sample outreach leads for admin dashboard
  const [leads] = useState<OutreachLead[]>([
    {
      id: "OL-001",
      created_at: "2025-01-08T10:30:00Z",
      source: "anonymous_screening",
      referral_type: "Self",
      urgency: "high",
      status: "new",
      contact_method: "phone",
      contact_info: "(555) 123-****",
      preferred_time: "morning",
      concerns: ["opioid_use", "withdrawal_fear"],
      treatment_goals: ["stability", "employment"],
      notes: "Ready to start treatment, concerned about withdrawal",
    },
    {
      id: "OL-002",
      created_at: "2025-01-08T09:15:00Z",
      source: "community_referral",
      referral_type: "Hospital",
      urgency: "urgent",
      status: "contacted",
      contact_method: "phone",
      contact_info: "(555) 987-****",
      concerns: ["overdose_history", "homeless"],
      treatment_goals: ["housing", "stability"],
    },
  ])

  const filteredLeads = leads.filter((lead) => {
    if (leadFilter !== "all" && lead.status !== leadFilter) return false
    if (searchQuery && !lead.id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      new: { bg: "#dbeafe", text: "#1d4ed8" },
      contacted: { bg: "#fef3c7", text: "#d97706" },
      scheduled: { bg: "#d1fae5", text: "#059669" },
      converted: { bg: "#dcfce7", text: "#16a34a" },
      closed: { bg: "#f3f4f6", text: "#6b7280" },
    }
    const style = styles[status] || styles.new
    return (
      <Badge style={{ backgroundColor: style.bg, color: style.text }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      urgent: { bg: "#fecaca", text: "#dc2626" },
      high: { bg: "#fed7aa", text: "#ea580c" },
      medium: { bg: "#fef08a", text: "#ca8a04" },
      low: { bg: "#d1fae5", text: "#059669" },
    }
    const style = styles[urgency] || styles.medium
    return (
      <Badge style={{ backgroundColor: style.bg, color: style.text }}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Badge>
    )
  }

  const handleScreeningSubmit = async () => {
    try {
      const response = await fetch("/api/community-outreach/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screening_type: "general",
          responses: screeningData,
          total_score: 0,
          severity_level: "moderate",
          recommendations: [],
          resources_provided: [],
          follow_up_requested: screeningData.contactRequested,
          follow_up_email: screeningData.contactMethod === "email" ? screeningData.contactInfo : undefined,
          follow_up_phone: screeningData.contactMethod === "phone" ? screeningData.contactInfo : undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to submit screening")

      toast.success("Screening submitted successfully. If you requested contact, our team will reach out within 24 hours.")
      setScreeningStep(1)
      setScreeningData({
        readinessLevel: "",
        primaryConcern: "",
        substanceHistory: [],
        treatmentGoals: [],
        specialNeeds: [],
        contactRequested: false,
        contactMethod: "",
        contactInfo: "",
        preferredTime: "",
        additionalNotes: "",
      })
      setActiveTab("home")
    } catch (error: any) {
      console.error("[MASE Access] Error submitting screening:", error)
      toast.error("Failed to submit screening. Please try again.")
    }
  }

  const getConsentProgress = () => {
    const requiredForms = consentForms.filter((f) => f.required)
    const signedRequired = requiredForms.filter((f) => signedConsents[f.id])
    if (requiredForms.length === 0) return 100
    return Math.round((signedRequired.length / requiredForms.length) * 100)
  }

  const allRequiredSigned = () => {
    return consentForms.filter((f) => f.required).every((f) => signedConsents[f.id])
  }

  const handleConsentSign = (formId: string) => {
    if (!consentSignature || !consentDate || !patientInitials) {
      toast.error("Please complete all required fields: signature, date, and initials")
      return
    }
    setSignedConsents((prev) => ({ ...prev, [formId]: true }))
    toast.success("Consent form signed successfully")
  }

  const handleReferralSubmit = async () => {
    try {
      const response = await fetch("/api/community-outreach/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referral_type: referralData.referralType,
          referrer_organization: referralData.organizationName,
          referrer_name: referralData.referrerName,
          referrer_phone: referralData.referrerContact,
          urgency_level: referralData.urgencyLevel,
          primary_concerns: [referralData.generalConcern],
          additional_concerns: referralData.additionalInfo,
        }),
      })

      if (!response.ok) throw new Error("Failed to submit referral")

      toast.success("Referral submitted successfully. Our team will follow up within 24-48 hours.")
      setReferralData({
        referralType: "",
        organizationName: "",
        referrerName: "",
        referrerContact: "",
        urgencyLevel: "",
        generalConcern: "",
        additionalInfo: "",
      })
      setActiveTab("home")
    } catch (error: any) {
      console.error("[MASE Access] Error submitting referral:", error)
      toast.error("Failed to submit referral. Please try again.")
    }
  }

  // Admin Dashboard View
  if (showAdminDashboard) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button variant="ghost" onClick={() => setShowAdminDashboard(false)} className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Public View
              </Button>
              <h1 className="text-2xl font-bold text-foreground">MASE Access - Outreach Dashboard</h1>
              <p className="text-muted-foreground">Manage incoming outreach leads and referrals</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {leads.filter((l) => l.status === "new").length} New Leads
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: "New", count: leads.filter((l) => l.status === "new").length, color: "#3b82f6" },
              { label: "Contacted", count: leads.filter((l) => l.status === "contacted").length, color: "#f59e0b" },
              { label: "Scheduled", count: leads.filter((l) => l.status === "scheduled").length, color: "#10b981" },
              { label: "Converted", count: leads.filter((l) => l.status === "converted").length, color: "#22c55e" },
              { label: "This Week", count: leads.length, color: "#6366f1" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="text-2xl font-bold" style={{ color: stat.color }}>
                      {stat.count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={leadFilter} onValueChange={setLeadFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Leads</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ID..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>Outreach Leads</CardTitle>
              <CardDescription>
                Review and manage incoming leads from anonymous screenings and community referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-mono">{lead.id}</TableCell>
                      <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lead.source === "anonymous_screening" ? "Screening" : "Referral"}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.referral_type}</TableCell>
                      <TableCell>{getUrgencyBadge(lead.urgency)}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{lead.assigned_to || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Lead Details - {lead.id}</DialogTitle>
                                <DialogDescription>Review lead information and update status</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Status</Label>
                                    <Select defaultValue={lead.status}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="contacted">Contacted</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="converted">Converted to Intake</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Assign To</Label>
                                    <Select defaultValue={lead.assigned_to || ""}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select staff member" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="sarah">Sarah Johnson, LCSW</SelectItem>
                                        <SelectItem value="mike">Mike Chen, Intake Coordinator</SelectItem>
                                        <SelectItem value="lisa">Lisa Wong, Peer Support</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <Label>Concerns</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {lead.concerns.map((concern) => (
                                      <Badge key={concern} variant="secondary">
                                        {concern.replace(/_/g, " ")}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Label>Treatment Goals</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {lead.treatment_goals.map((goal) => (
                                      <Badge key={goal} variant="outline">
                                        {goal.replace(/_/g, " ")}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                {lead.contact_info && (
                                  <div>
                                    <Label>Contact Information</Label>
                                    <p className="text-sm mt-1">
                                      {lead.contact_method}: {lead.contact_info}
                                      {lead.preferred_time && ` (Preferred: ${lead.preferred_time})`}
                                    </p>
                                  </div>
                                )}
                                {lead.notes && (
                                  <div>
                                    <Label>Notes</Label>
                                    <p className="text-sm mt-1 text-muted-foreground">{lead.notes}</p>
                                  </div>
                                )}
                                <div>
                                  <Label>Add Note</Label>
                                  <Textarea placeholder="Add follow-up notes..." />
                                </div>
                                <div className="flex justify-between pt-4">
                                  <Button variant="outline">
                                    <PhoneCall className="h-4 w-4 mr-2" />
                                    Log Call
                                  </Button>
                                  <div className="flex gap-2">
                                    <Button variant="outline">Save Changes</Button>
                                    <Button className="bg-teal-600 hover:bg-teal-700">
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Convert to Intake
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {lead.contact_info && (
                            <Button variant="ghost" size="sm">
                              <PhoneCall className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Public-Facing View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-600">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">MASE Access</h1>
                <p className="text-sm text-muted-foreground">Community Outreach & Recovery Gateway</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <a href="tel:18007326837">
                  <Phone className="h-4 w-4 mr-2" />
                  1-800-RECOVERY
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdminDashboard(true)}>
                Staff Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="home">
              <Home className="h-4 w-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="screening">
              <HelpCircle className="h-4 w-4 mr-2" />
              Screening
            </TabsTrigger>
            <TabsTrigger value="education">
              <BookOpen className="h-4 w-4 mr-2" />
              Education
            </TabsTrigger>
            <TabsTrigger value="referral">
              <Users className="h-4 w-4 mr-2" />
              Referral
            </TabsTrigger>
            <TabsTrigger value="consent-forms">
              <FileText className="h-4 w-4 mr-2" />
              Consent Forms
            </TabsTrigger>
            <TabsTrigger value="provider-portal" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Provider Portal
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-700">
                <Shield className="h-3 w-3 mr-1" />
                100% Confidential
              </Badge>
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Confidential Access to Opioid Recovery Support
              </h2>
              <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
                Take the first step toward recovery. Learn about treatment options, check your eligibility anonymously,
                or connect someone you care about with help. Your privacy is protected.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveTab("education")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-blue-100">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Learn About Treatment</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand your options. Get facts about medication-assisted treatment, what to expect, and your
                    rights.
                  </p>
                  <Button variant="ghost" className="mt-4">
                    Explore Resources
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-teal-600"
                onClick={() => setActiveTab("screening")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-teal-100">
                    <CheckCircle2 className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Check Eligibility Anonymously</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete a brief, private screening to see if treatment might be right for you. No personal info
                    required.
                  </p>
                  <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
                    Start Screening
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveTab("referral")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-pink-100">
                    <Users className="h-8 w-8 text-pink-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Refer Someone for Help</h3>
                  <p className="text-sm text-muted-foreground">
                    Healthcare providers, family members, or community partners can submit confidential referrals.
                  </p>
                  <Button variant="ghost" className="mt-4">
                    Make a Referral
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Trust Indicators */}
            <div className="grid md:grid-cols-4 gap-4 mb-12">
              {[
                { icon: Lock, label: "HIPAA Protected", desc: "Your information is secure" },
                { icon: Shield, label: "42 CFR Part 2", desc: "Extra privacy protections" },
                { icon: Clock, label: "24/7 Support", desc: "Help when you need it" },
                { icon: Heart, label: "Judgment-Free", desc: "We're here to help" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-4 rounded-lg bg-card">
                  <item.icon className="h-8 w-8 text-teal-600" />
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <Card className="bg-slate-900 text-white">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <p className="text-4xl font-bold text-teal-400">15,000+</p>
                    <p className="text-slate-300">Lives Changed Through Treatment</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-teal-400">270+</p>
                    <p className="text-slate-300">Partner Clinics Nationwide</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-teal-400">98%</p>
                    <p className="text-slate-300">Patient Satisfaction Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Screening Tab */}
          <TabsContent value="screening">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-green-600" />
                    <Badge className="bg-green-100 text-green-700">Anonymous & Confidential</Badge>
                  </div>
                  <CardTitle>Anonymous Pre-Intake Screening</CardTitle>
                  <CardDescription>
                    This screening is completely private. No identifying information is required unless you choose to
                    request contact.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Progress Indicator */}
                  <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Step {screeningStep} of 4</span>
                      <span className="text-muted-foreground">{screeningStep * 25}% Complete</span>
                    </div>
                    <Progress value={screeningStep * 25} className="h-2" />
                    <div className="flex justify-between mt-2">
                      {["Readiness", "Concerns", "Goals", "Contact"].map((step, idx) => (
                        <span
                          key={step}
                          className={`text-xs ${idx + 1 <= screeningStep ? "text-teal-600" : "text-muted-foreground"}`}
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step 1: Readiness */}
                  {screeningStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base">How would you describe your current situation?</Label>
                        <p className="text-sm mb-3 text-muted-foreground">
                          There are no wrong answers. This helps us understand how we might help.
                        </p>
                        <div className="space-y-3">
                          {[
                            { value: "ready", label: "I'm ready to make a change and want help now" },
                            { value: "exploring", label: "I'm exploring my options and learning about treatment" },
                            { value: "curious", label: "I'm just curious about what's available" },
                            { value: "supporting", label: "I'm looking for information to help someone else" },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                screeningData.readinessLevel === option.value
                                  ? "border-teal-600 bg-teal-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => setScreeningData({ ...screeningData, readinessLevel: option.value })}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    screeningData.readinessLevel === option.value
                                      ? "border-teal-600"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {screeningData.readinessLevel === option.value && (
                                    <div className="w-3 h-3 rounded-full bg-teal-600" />
                                  )}
                                </div>
                                <span>{option.label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Concerns/Substance History */}
                  {screeningStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base">What concerns bring you here today?</Label>
                        <p className="text-sm mb-3 text-muted-foreground">
                          Select all that apply. This information is not diagnostic.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: "opioid_use", label: "Opioid or painkiller use" },
                            { value: "withdrawal_fear", label: "Fear of withdrawal" },
                            { value: "previous_treatment", label: "Previous treatment didn't work" },
                            { value: "family_concerns", label: "Family/relationship concerns" },
                            { value: "health_issues", label: "Health problems" },
                            { value: "work_problems", label: "Work/employment issues" },
                            { value: "legal_issues", label: "Legal situation" },
                            { value: "other", label: "Other concerns" },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                screeningData.substanceHistory.includes(option.value)
                                  ? "border-teal-600 bg-teal-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => {
                                const updated = screeningData.substanceHistory.includes(option.value)
                                  ? screeningData.substanceHistory.filter((v) => v !== option.value)
                                  : [...screeningData.substanceHistory, option.value]
                                setScreeningData({ ...screeningData, substanceHistory: updated })
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox checked={screeningData.substanceHistory.includes(option.value)} />
                                <span className="text-sm">{option.label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Treatment Goals */}
                  {screeningStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base">What are your goals for treatment?</Label>
                        <p className="text-sm mb-3 text-muted-foreground">
                          Select what's most important to you. Treatment is individualized to your needs.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: "stability", label: "Feel stable and in control", icon: Heart },
                            { value: "employment", label: "Maintain or find employment", icon: Briefcase },
                            { value: "family", label: "Repair family relationships", icon: Users },
                            { value: "health", label: "Improve my health", icon: Heart },
                            { value: "housing", label: "Secure stable housing", icon: Home },
                            { value: "legal", label: "Address legal requirements", icon: Scale },
                            { value: "pregnancy", label: "Pregnancy-safe care", icon: Baby },
                            { value: "stop_using", label: "Stop using opioids", icon: Pill },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                screeningData.treatmentGoals.includes(option.value)
                                  ? "border-teal-600 bg-teal-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => {
                                const updated = screeningData.treatmentGoals.includes(option.value)
                                  ? screeningData.treatmentGoals.filter((v) => v !== option.value)
                                  : [...screeningData.treatmentGoals, option.value]
                                setScreeningData({ ...screeningData, treatmentGoals: updated })
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <option.icon className="h-4 w-4 text-teal-600" />
                                <span className="text-sm">{option.label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-base">Do you have any special needs?</Label>
                        <p className="text-sm mb-3 text-muted-foreground">
                          Optional - helps us prepare for your visit
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Wheelchair accessible",
                            "Interpreter needed",
                            "Childcare concerns",
                            "Transportation help",
                            "Mental health support",
                          ].map((need) => (
                            <Badge
                              key={need}
                              variant={screeningData.specialNeeds.includes(need) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                const updated = screeningData.specialNeeds.includes(need)
                                  ? screeningData.specialNeeds.filter((n) => n !== need)
                                  : [...screeningData.specialNeeds, need]
                                setScreeningData({ ...screeningData, specialNeeds: updated })
                              }}
                            >
                              {need}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Contact (Optional) */}
                  {screeningStep === 4 && (
                    <div className="space-y-6">
                      <div className="p-4 rounded-lg bg-green-50">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">
                              Based on your answers, treatment may be a good option for you.
                            </p>
                            <p className="text-sm text-green-700">
                              Would you like us to reach out to discuss next steps?
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-base">Would you like us to contact you?</Label>
                        <p className="text-sm mb-3 text-muted-foreground">
                          Completely optional. Your screening is already saved anonymously.
                        </p>
                        <div className="space-y-3">
                          <div
                            className={`p-4 rounded-lg border-2 cursor-pointer ${
                              screeningData.contactRequested ? "border-teal-600 bg-teal-50" : "border-gray-200"
                            }`}
                            onClick={() => setScreeningData({ ...screeningData, contactRequested: true })}
                          >
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5 text-teal-600" />
                              <div>
                                <p className="font-medium">Yes, please contact me</p>
                                <p className="text-sm text-muted-foreground">
                                  A caring staff member will reach out within 24 hours
                                </p>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`p-4 rounded-lg border-2 cursor-pointer ${
                              !screeningData.contactRequested ? "border-teal-600 bg-teal-50" : "border-gray-200"
                            }`}
                            onClick={() => setScreeningData({ ...screeningData, contactRequested: false })}
                          >
                            <div className="flex items-center gap-3">
                              <Shield className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">No thanks, keep it anonymous</p>
                                <p className="text-sm text-muted-foreground">
                                  You can always call us when you're ready
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {screeningData.contactRequested && (
                        <div className="space-y-4 p-4 rounded-lg bg-muted">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>How should we contact you?</Label>
                              <Select
                                value={screeningData.contactMethod}
                                onValueChange={(v) => setScreeningData({ ...screeningData, contactMethod: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="phone">Phone Call</SelectItem>
                                  <SelectItem value="text">Text Message</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Best time to reach you?</Label>
                              <Select
                                value={screeningData.preferredTime}
                                onValueChange={(v) => setScreeningData({ ...screeningData, preferredTime: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                                  <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                                  <SelectItem value="evening">Evening (5pm-8pm)</SelectItem>
                                  <SelectItem value="anytime">Anytime</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>Contact Information</Label>
                            <Input
                              placeholder={
                                screeningData.contactMethod === "email" ? "your@email.com" : "(555) 123-4567"
                              }
                              value={screeningData.contactInfo}
                              onChange={(e) => setScreeningData({ ...screeningData, contactInfo: e.target.value })}
                            />
                            <p className="text-xs mt-1 text-muted-foreground">
                              This information is protected by federal privacy laws (42 CFR Part 2)
                            </p>
                          </div>
                          <div>
                            <Label>Anything else you'd like us to know? (Optional)</Label>
                            <Textarea
                              placeholder="Any questions or concerns..."
                              value={screeningData.additionalNotes}
                              onChange={(e) => setScreeningData({ ...screeningData, additionalNotes: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setScreeningStep(Math.max(1, screeningStep - 1))}
                      disabled={screeningStep === 1}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    {screeningStep < 4 ? (
                      <Button
                        onClick={() => setScreeningStep(screeningStep + 1)}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button onClick={handleScreeningSubmit} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Screening
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Community Referral Gateway</CardTitle>
                  <CardDescription>
                    Submit a confidential referral for treatment services. Patient name is not required at this stage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base">I am a...</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {[
                        { value: "hospital", label: "Hospital/ER", icon: Building2 },
                        { value: "shelter", label: "Shelter/Housing", icon: Home },
                        { value: "court", label: "Court/Probation", icon: Scale },
                        { value: "family", label: "Family Member", icon: Users },
                        { value: "healthcare", label: "Healthcare Provider", icon: Heart },
                        { value: "self", label: "Self-Referral", icon: UserPlus },
                      ].map((type) => (
                        <div
                          key={type.value}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            referralData.referralType === type.value
                              ? "border-teal-600 bg-teal-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setReferralData({ ...referralData, referralType: type.value })}
                        >
                          <div className="flex items-center gap-3">
                            <type.icon className="h-5 w-5 text-teal-600" />
                            <span>{type.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {referralData.referralType && referralData.referralType !== "self" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Organization Name*</Label>
                          <Input
                            placeholder="e.g., ABC Medical Center"
                            value={referralData.organizationName}
                            onChange={(e) => setReferralData({ ...referralData, organizationName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Your Name*</Label>
                          <Input
                            placeholder="Your full name"
                            value={referralData.referrerName}
                            onChange={(e) => setReferralData({ ...referralData, referrerName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Information*</Label>
                        <Input
                          placeholder="Phone or email"
                          value={referralData.referrerContact}
                          onChange={(e) => setReferralData({ ...referralData, referrerContact: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Urgency Level*</Label>
                    <Select
                      value={referralData.urgencyLevel}
                      onValueChange={(v) => setReferralData({ ...referralData, urgencyLevel: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent - Immediate attention needed</SelectItem>
                        <SelectItem value="high">High - Within 24-48 hours</SelectItem>
                        <SelectItem value="medium">Medium - Within a week</SelectItem>
                        <SelectItem value="low">Low - Routine referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Concern*</Label>
                    <Textarea
                      placeholder="Brief description of the primary concern or reason for referral..."
                      value={referralData.generalConcern}
                      onChange={(e) => setReferralData({ ...referralData, generalConcern: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Information (Optional)</Label>
                    <Textarea
                      placeholder="Any additional details that would help us assist this person..."
                      value={referralData.additionalInfo}
                      onChange={(e) => setReferralData({ ...referralData, additionalInfo: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleReferralSubmit}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    disabled={!referralData.referralType || !referralData.urgencyLevel || !referralData.generalConcern}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Referral
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Consent Forms Tab */}
          <TabsContent value="consent-forms" className="space-y-6 mt-6">
            <Card className="border-l-4 border-l-green-600">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Required Consent Forms</CardTitle>
                    <CardDescription>
                      Complete and sign all required consent forms to proceed with treatment
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Consent Progress</span>
                    <span className="font-semibold">{getConsentProgress()}%</span>
                  </div>
                  <Progress value={getConsentProgress()} className="h-2" />
                </div>

                <div className="space-y-4">
                  {consentForms.map((form) => (
                    <Card
                      key={form.id}
                      className={`border-2 ${signedConsents[form.id] ? "border-green-500" : "border-gray-200"}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${signedConsents[form.id] ? "bg-green-100" : "bg-gray-100"}`}
                            >
                              {form.category === "treatment" && (
                                <Heart className={`h-5 w-5 ${signedConsents[form.id] ? "text-green-600" : "text-gray-600"}`} />
                              )}
                              {form.category === "testing" && (
                                <TestTube className={`h-5 w-5 ${signedConsents[form.id] ? "text-green-600" : "text-gray-600"}`} />
                              )}
                              {form.category === "privacy" && (
                                <Lock className={`h-5 w-5 ${signedConsents[form.id] ? "text-green-600" : "text-gray-600"}`} />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{form.title}</CardTitle>
                                {form.required && <Badge className="bg-yellow-100 text-yellow-700">Required</Badge>}
                                {signedConsents[form.id] && (
                                  <Badge className="bg-green-100 text-green-700">Signed</Badge>
                                )}
                              </div>
                              <CardDescription>{form.description}</CardDescription>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant={signedConsents[form.id] ? "outline" : "default"}>
                                {signedConsents[form.id] ? "View" : "Sign"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{form.title}</DialogTitle>
                                <DialogDescription>{form.description}</DialogDescription>
                              </DialogHeader>

                              <div className="space-y-6 mt-4">
                                <div className="p-4 rounded-lg border bg-muted">
                                  <pre className="whitespace-pre-wrap text-sm font-sans">{form.content}</pre>
                                </div>

                                <div className="space-y-3">
                                  <Label className="text-base font-semibold">Patient Acknowledgments:</Label>
                                  {form.acknowledgments.map((ack, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted">
                                      <Checkbox
                                        id={`${form.id}-ack-${index}`}
                                        className="mt-1"
                                        disabled={signedConsents[form.id]}
                                        defaultChecked={signedConsents[form.id]}
                                      />
                                      <Label htmlFor={`${form.id}-ack-${index}`} className="text-sm leading-relaxed cursor-pointer">
                                        {ack}
                                      </Label>
                                    </div>
                                  ))}
                                </div>

                                {!signedConsents[form.id] && (
                                  <>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`${form.id}-initials`}>Patient Initials*</Label>
                                        <Input
                                          id={`${form.id}-initials`}
                                          placeholder="e.g., JD"
                                          value={patientInitials}
                                          onChange={(e) => setPatientInitials(e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`${form.id}-date`}>Date*</Label>
                                        <Input
                                          id={`${form.id}-date`}
                                          type="date"
                                          value={consentDate}
                                          onChange={(e) => setConsentDate(e.target.value)}
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor={`${form.id}-signature`}>Full Name (Electronic Signature)*</Label>
                                      <Input
                                        id={`${form.id}-signature`}
                                        placeholder="Type your full legal name"
                                        value={consentSignature}
                                        onChange={(e) => setConsentSignature(e.target.value)}
                                        className="text-lg"
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        By typing your name, you agree that this constitutes a legal electronic signature.
                                      </p>
                                    </div>

                                    {form.id === "consent-to-treat" && (
                                      <div className="space-y-2">
                                        <Label htmlFor="witness-name">Witness Name (Optional)</Label>
                                        <Input
                                          id="witness-name"
                                          placeholder="Staff member name"
                                          value={witnessName}
                                          onChange={(e) => setWitnessName(e.target.value)}
                                        />
                                      </div>
                                    )}

                                    <Button onClick={() => handleConsentSign(form.id)} className="w-full bg-green-600 hover:bg-green-700">
                                      <Fingerprint className="h-4 w-4 mr-2" />
                                      Sign Consent Form
                                    </Button>
                                  </>
                                )}

                                {signedConsents[form.id] && (
                                  <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                                    <div className="flex items-center gap-2 text-green-700">
                                      <CheckCircle2 className="h-5 w-5" />
                                      <span className="font-semibold">Consent form signed successfully</span>
                                    </div>
                                    <p className="text-sm mt-2 text-green-600">Signature: {consentSignature}</p>
                                    <p className="text-sm text-green-600">Date: {consentDate}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {allRequiredSigned() && (
                  <div className="p-6 rounded-lg border-2 bg-green-50 border-green-200">
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-green-900">All Required Consents Completed!</h3>
                        <p className="text-sm text-green-700 mt-1">
                          You have completed all required consent forms. You may now proceed with the intake process.
                        </p>
                        <Button className="mt-4 bg-green-600 hover:bg-green-700">
                          Proceed to Intake
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Education Center</h2>
                <p className="text-muted-foreground">
                  Get the facts about medication-assisted treatment. Knowledge is power on the path to recovery.
                </p>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Pill className="h-5 w-5 text-teal-600" />
                      What Is Medication-Assisted Treatment (MAT)?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground space-y-3">
                    <p>
                      Medication-Assisted Treatment (MAT) combines FDA-approved medications with counseling and
                      behavioral therapies to treat opioid use disorders. It's the gold standard for opioid addiction
                      treatment, recommended by major health organizations including SAMHSA and the American Society of
                      Addiction Medicine.
                    </p>
                    <p>
                      <strong>Common medications include:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>
                        <strong>Methadone:</strong> Reduces cravings and withdrawal symptoms, taken daily at a clinic
                      </li>
                      <li>
                        <strong>Buprenorphine (Suboxone):</strong> Can be prescribed by certified providers
                      </li>
                      <li>
                        <strong>Naltrexone (Vivitrol):</strong> Blocks the effects of opioids, given as monthly
                        injection
                      </li>
                    </ul>
                    <p>
                      MAT has been shown to decrease opioid use, reduce overdose deaths, decrease criminal activity, and
                      improve social functioning.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-teal-600" />
                      Myths vs. Facts About Treatment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground space-y-4">
                    <div className="p-3 rounded-lg bg-red-50">
                      <p className="font-medium text-red-700">MYTH: "You're just trading one addiction for another"</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50">
                      <p className="font-medium text-green-700">
                        FACT: MAT medications stabilize brain chemistry, allowing people to function normally, work, and
                        maintain relationships. Unlike illicit opioid use, MAT is controlled, legal, and part of
                        comprehensive treatment.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-teal-600" />
                      Privacy, HIPAA, and 42 CFR Part 2
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground space-y-3">
                    <p>
                      Your privacy is protected by federal law. Substance use treatment records have even stronger
                      protections than regular medical records.
                    </p>
                    <p>
                      <strong>42 CFR Part 2 provides:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Your records cannot be shared without your written consent</li>
                      <li>Information cannot be used against you in legal proceedings (with limited exceptions)</li>
                      <li>Your employer cannot access your treatment information</li>
                      <li>Insurance companies have strict limitations on which they can see</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Provider Portal Tab */}
          <TabsContent value="provider-portal" className="space-y-6 mt-6">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>External Provider Transfer Portal</CardTitle>
                    <CardDescription>
                      Secure portal for healthcare providers to submit patient transfer documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border bg-blue-50">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-900">For Healthcare Providers</h4>
                      <p className="text-sm text-blue-700">
                        If you are a healthcare provider transferring a patient to our facility, please complete the
                        form below. Your secure submission helps ensure seamless care transitions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider-facility">Your Facility Name*</Label>
                      <Input id="provider-facility" placeholder="ABC Medical Center" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-npi">Facility NPI*</Label>
                      <Input id="provider-npi" placeholder="1234567890" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider-name">Your Name*</Label>
                      <Input id="provider-name" placeholder="Dr. Jane Smith" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-title">Title/Credentials*</Label>
                      <Input id="provider-title" placeholder="MD, Medical Director" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer-reason">Reason for Transfer*</Label>
                    <Textarea id="transfer-reason" placeholder="Brief clinical summary and reason for transfer..." rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label>Attach Transfer Documents*</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        Treatment summary, medication orders, UDS results, discharge summary
                      </p>
                      <Button variant="outline" className="mt-3">
                        Select Files
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-yellow-50 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                      <div className="space-y-3 flex-1">
                        <h4 className="font-semibold text-yellow-900">HIPAA & 42 CFR Part 2 Compliance</h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Checkbox id="provider-hipaa" />
                            <Label htmlFor="provider-hipaa" className="text-sm leading-relaxed cursor-pointer text-yellow-900">
                              I confirm that I have obtained valid patient consent to disclose this protected health
                              information under HIPAA and 42 CFR Part 2 regulations
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Transfer Documents Securely
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Community Events & Narcan Access</h2>
                <p className="text-muted-foreground">
                  Free community events, Narcan distribution, and overdose prevention resources
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-teal-600" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        title: "Community Recovery Fair",
                        date: "January 15, 2025",
                        time: "10:00 AM - 2:00 PM",
                        location: "Downtown Community Center",
                        type: "education",
                      },
                      {
                        title: "Narcan Training & Distribution",
                        date: "January 18, 2025",
                        time: "1:00 PM - 4:00 PM",
                        location: "Public Library - Main Branch",
                        type: "narcan",
                      },
                    ].map((event, idx) => (
                      <div key={idx} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="text-sm">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-sm">{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="text-sm">{event.location}</span>
                            </div>
                          </div>
                          <Badge variant={event.type === "narcan" ? "destructive" : "secondary"}>
                            {event.type === "narcan" ? "Narcan" : "Education"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Narcan (Naloxone) Saves Lives
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-red-900">
                      Narcan is a life-saving medication that can reverse an opioid overdose. It's safe, easy to use,
                      and available free at many locations.
                    </p>

                    <div className="p-4 rounded-lg bg-white">
                      <h4 className="font-medium mb-2">Get Free Narcan:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Any MASE clinic during business hours
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Local pharmacies (no prescription needed)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Community distribution events
                        </li>
                      </ul>
                    </div>

                    <Button className="w-full" variant="destructive">
                      <QrCode className="h-4 w-4 mr-2" />
                      Find Narcan Near Me
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="text-center">
                <CardContent className="py-8">
                  <h3 className="text-xl font-semibold mb-4">Scan for Help</h3>
                  <p className="mb-6 text-muted-foreground">
                    Print and share these QR codes in your community. They link directly to our confidential screening.
                  </p>
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <QrCode className="h-24 w-24 text-teal-600" />
                      </div>
                      <p className="text-sm font-medium">Get Help Now</p>
                    </div>
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <QrCode className="h-24 w-24 text-red-600" />
                      </div>
                      <p className="text-sm font-medium">Find Narcan</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-6">
                    <Download className="h-4 w-4 mr-2" />
                    Download Printable Materials
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-3">MASE Access</h4>
              <p className="text-sm text-muted-foreground">
                Community Outreach & Recovery Gateway. Part of the MASE EMR ecosystem.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Crisis Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>National Helpline: 1-800-662-4357</li>
                <li>Crisis Text Line: Text HOME to 741741</li>
                <li>Suicide Prevention: 988</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:underline">
                    Find a Clinic
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Treatment FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Phone: 1-800-RECOVERY</li>
                <li>Email: access@mase.com</li>
                <li>24/7 Crisis Line: 988</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
