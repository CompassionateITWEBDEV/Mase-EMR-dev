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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
• Are protected under 42 CFR Part 2 confidentiality regulations

4. CONSEQUENCES
I understand that:
• Positive results for illicit substances may result in treatment modifications
• Tampering with or refusing to provide a sample may be treated as a positive result
• Repeated positive results may affect my phase level and privileges
• Results are used therapeutically, not punitively

5. CHAIN OF CUSTODY
For confirmation testing, I understand that:
• A chain of custody form will be completed
• I may be asked to initial the sample seal
• The laboratory will follow strict handling procedures
• I may request a split sample for independent testing

6. MY RIGHTS
I have the right to:
• Receive an explanation of my results
• Request confirmation testing
• Discuss any concerns about testing procedures
• Know what substances are being tested`,
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
* Current medication-assisted treatment (MAT) regimen and dosage
* Recent urine drug screen (UDS) results (if applicable)
* Diagnosis related to Opioid Use Disorder
* Any specific information mutually agreed upon by the patient and provider for treatment coordination

3. RECIPIENT INFORMATION
* Provider Name: [To be filled by patient/staff]
* Facility Name: [To be filled by patient/staff]
* Address: [To be filled by patient/staff]
* Phone Number: [To be filled by patient/staff]
* Fax Number: [To be filled by patient/staff]

4. PURPOSE OF DISCLOSURE
Continuity of care and treatment coordination with the designated healthcare provider.

5. EXPIRATION
This authorization will expire automatically upon the completion of my treatment at MASE Access, or upon written revocation, whichever occurs first.

6. CONFIDENTIALITY NOTICE
I understand that information disclosed under this authorization may be subject to re-disclosure by the recipient and may no longer be protected by federal privacy laws (HIPAA, 42 CFR Part 2).`,
      acknowledgments: [
        "I have read and understand this Release of Information form",
        "I understand my right to revoke this authorization",
        "I authorize the release of the specified information",
        "I understand that the disclosed information may no longer be protected by federal law after disclosure",
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
      treatment_goals: ["housing", "recovery"],
      assigned_to: "Sarah Johnson, LCSW",
    },
    {
      id: "OL-003",
      created_at: "2025-01-07T14:45:00Z",
      source: "community_referral",
      referral_type: "Court/Probation",
      urgency: "medium",
      status: "scheduled",
      contact_info: "(555) 456-****",
      concerns: ["legal_requirement"],
      treatment_goals: ["compliance", "recovery"],
      assigned_to: "Mike Chen, Intake Coordinator",
    },
    {
      id: "OL-004",
      created_at: "2025-01-07T11:20:00Z",
      source: "anonymous_screening",
      referral_type: "Self",
      urgency: "low",
      status: "converted",
      concerns: ["family_pressure", "health_concerns"],
      treatment_goals: ["family_relationships", "health"],
    },
    {
      id: "OL-005",
      created_at: "2025-01-06T16:00:00Z",
      source: "community_referral",
      referral_type: "Family",
      urgency: "high",
      status: "new",
      contact_method: "email",
      contact_info: "family***@email.com",
      concerns: ["loved_one_struggling"],
      treatment_goals: ["get_help_for_family"],
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

  const handleScreeningSubmit = () => {
    // In production, this would submit to API
    alert("Thank you for completing the screening. If you requested contact, our team will reach out within 24 hours.")
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
  }

  const handleReferralSubmit = () => {
    alert("Thank you for your referral. Our team will follow up within 24-48 hours.")
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
  }

  // Added handler for signing consent forms
  const handleConsentSign = (formId: string) => {
    if (!consentSignature || !consentDate || !patientInitials) {
      alert("Please complete all required fields: signature, date, and initials")
      return
    }
    // In a real app, you'd want to validate acknowledgments too.
    setSignedConsents((prev) => ({ ...prev, [formId]: true }))
  }

  // Added helper to calculate consent progress
  const getConsentProgress = () => {
    const requiredForms = consentForms.filter((f) => f.required)
    const signedRequired = requiredForms.filter((f) => signedConsents[f.id])
    if (requiredForms.length === 0) return 100 // Avoid division by zero if no required forms
    return Math.round((signedRequired.length / requiredForms.length) * 100)
  }

  // Added helper to check if all required forms are signed
  const allRequiredSigned = () => {
    return consentForms.filter((f) => f.required).every((f) => signedConsents[f.id])
  }

  // Admin Dashboard View
  if (showAdminDashboard) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-7xl mx-auto">
          {/* Admin Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button variant="ghost" onClick={() => setShowAdminDashboard(false)} className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Public View
              </Button>
              <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                MASE Access - Outreach Dashboard
              </h1>
              <p style={{ color: "#64748b" }}>Manage incoming outreach leads and referrals</p>
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
                    <span style={{ color: "#64748b" }}>{stat.label}</span>
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
                  <Filter className="h-4 w-4" style={{ color: "#64748b" }} />
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#64748b" }} />
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
                      <TableCell>{lead.assigned_to || <span style={{ color: "#9ca3af" }}>Unassigned</span>}</TableCell>
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
                                    <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                                      {lead.notes}
                                    </p>
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
                                    <Button style={{ backgroundColor: "#0891b2" }}>
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
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#0891b2" }}
              >
                <Heart className="h-6 w-6" style={{ color: "#ffffff" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#0f172a" }}>
                  MASE Access
                </h1>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Community Outreach & Recovery Gateway
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                1-800-RECOVERY
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
        {/* Changed TabsList to include consent-forms and provider-portal tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto px-4 py-6">
          <TabsList className="grid w-full grid-cols-7 mb-6" style={{ backgroundColor: "#f1f5f9" }}>
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

          {/* HOME TAB */}
          <TabsContent value="home">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <Badge className="mb-4" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
                <Shield className="h-3 w-3 mr-1" />
                100% Confidential
              </Badge>
              <h2 className="text-4xl font-bold mb-4" style={{ color: "#0f172a" }}>
                Confidential Access to Opioid Recovery Support
              </h2>
              <p className="text-xl max-w-2xl mx-auto" style={{ color: "#64748b" }}>
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
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: "#dbeafe" }}
                  >
                    <BookOpen className="h-8 w-8" style={{ color: "#3b82f6" }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "#0f172a" }}>
                    Learn About Treatment
                  </h3>
                  <p className="text-sm" style={{ color: "#64748b" }}>
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
                className="hover:shadow-lg transition-shadow cursor-pointer border-2"
                style={{ borderColor: "#0891b2" }}
                onClick={() => setActiveTab("screening")}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: "#cffafe" }}
                  >
                    <CheckCircle2 className="h-8 w-8" style={{ color: "#0891b2" }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "#0f172a" }}>
                    Check Eligibility Anonymously
                  </h3>
                  <p className="text-sm" style={{ color: "#64748b" }}>
                    Complete a brief, private screening to see if treatment might be right for you. No personal info
                    required.
                  </p>
                  <Button className="mt-4" style={{ backgroundColor: "#0891b2" }}>
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
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: "#fce7f3" }}
                  >
                    <Users className="h-8 w-8" style={{ color: "#ec4899" }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "#0f172a" }}>
                    Refer Someone for Help
                  </h3>
                  <p className="text-sm" style={{ color: "#64748b" }}>
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
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-4 rounded-lg"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  <item.icon className="h-8 w-8" style={{ color: "#0891b2" }} />
                  <div>
                    <p className="font-medium" style={{ color: "#0f172a" }}>
                      {item.label}
                    </p>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <Card style={{ backgroundColor: "#0f172a" }}>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <p className="text-4xl font-bold" style={{ color: "#22d3ee" }}>
                      15,000+
                    </p>
                    <p style={{ color: "#94a3b8" }}>Lives Changed Through Treatment</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold" style={{ color: "#22d3ee" }}>
                      270+
                    </p>
                    <p style={{ color: "#94a3b8" }}>Partner Clinics Nationwide</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold" style={{ color: "#22d3ee" }}>
                      98%
                    </p>
                    <p style={{ color: "#94a3b8" }}>Patient Satisfaction Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SCREENING TAB */}
          <TabsContent value="screening">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Lock className="h-5 w-5" style={{ color: "#16a34a" }} />
                    <Badge style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Anonymous & Confidential</Badge>
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
                      <span style={{ color: "#64748b" }}>Step {screeningStep} of 4</span>
                      <span style={{ color: "#64748b" }}>{screeningStep * 25}% Complete</span>
                    </div>
                    <Progress value={screeningStep * 25} className="h-2" />
                    <div className="flex justify-between mt-2">
                      {["Readiness", "Concerns", "Goals", "Contact"].map((step, idx) => (
                        <span
                          key={step}
                          className="text-xs"
                          style={{ color: idx + 1 <= screeningStep ? "#0891b2" : "#94a3b8" }}
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
                        <p className="text-sm mb-3" style={{ color: "#64748b" }}>
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
                                  ? "border-cyan-600 bg-cyan-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => setScreeningData({ ...screeningData, readinessLevel: option.value })}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    screeningData.readinessLevel === option.value
                                      ? "border-cyan-600"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {screeningData.readinessLevel === option.value && (
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#0891b2" }} />
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
                        <p className="text-sm mb-3" style={{ color: "#64748b" }}>
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
                                  ? "border-cyan-600 bg-cyan-50"
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
                        <p className="text-sm mb-3" style={{ color: "#64748b" }}>
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
                                  ? "border-cyan-600 bg-cyan-50"
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
                                <option.icon className="h-4 w-4" style={{ color: "#0891b2" }} />
                                <span className="text-sm">{option.label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-base">Do you have any special needs?</Label>
                        <p className="text-sm mb-3" style={{ color: "#64748b" }}>
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
                      <div className="p-4 rounded-lg" style={{ backgroundColor: "#f0fdf4" }}>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: "#16a34a" }} />
                          <div>
                            <p className="font-medium" style={{ color: "#166534" }}>
                              Based on your answers, treatment may be a good option for you.
                            </p>
                            <p className="text-sm" style={{ color: "#166534" }}>
                              Would you like us to reach out to discuss next steps?
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-base">Would you like us to contact you?</Label>
                        <p className="text-sm mb-3" style={{ color: "#64748b" }}>
                          Completely optional. Your screening is already saved anonymously.
                        </p>
                        <div className="space-y-3">
                          <div
                            className={`p-4 rounded-lg border-2 cursor-pointer ${
                              screeningData.contactRequested ? "border-cyan-600 bg-cyan-50" : "border-gray-200"
                            }`}
                            onClick={() => setScreeningData({ ...screeningData, contactRequested: true })}
                          >
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5" style={{ color: "#0891b2" }} />
                              <div>
                                <p className="font-medium">Yes, please contact me</p>
                                <p className="text-sm" style={{ color: "#64748b" }}>
                                  A caring staff member will reach out within 24 hours
                                </p>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`p-4 rounded-lg border-2 cursor-pointer ${
                              !screeningData.contactRequested ? "border-cyan-600 bg-cyan-50" : "border-gray-200"
                            }`}
                            onClick={() => setScreeningData({ ...screeningData, contactRequested: false })}
                          >
                            <div className="flex items-center gap-3">
                              <Shield className="h-5 w-5" style={{ color: "#64748b" }} />
                              <div>
                                <p className="font-medium">No thanks, keep it anonymous</p>
                                <p className="text-sm" style={{ color: "#64748b" }}>
                                  You can always call us when you're ready
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {screeningData.contactRequested && (
                        <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: "#f8fafc" }}>
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
                            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
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
                        style={{ backgroundColor: "#0891b2" }}
                      >
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button onClick={handleScreeningSubmit} style={{ backgroundColor: "#16a34a" }}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Screening
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EDUCATION TAB */}
          <TabsContent value="education">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2" style={{ color: "#0f172a" }}>
                  Education Center
                </h2>
                <p style={{ color: "#64748b" }}>
                  Get the facts about medication-assisted treatment. Knowledge is power on the path to recovery.
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="what-is-mat" className="bg-white rounded-lg border px-4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Pill className="h-5 w-5" style={{ color: "#0891b2" }} />
                      <span>What Is Medication-Assisted Treatment (MAT)?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 space-y-3">
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
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="myths" className="bg-white rounded-lg border px-4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5" style={{ color: "#0891b2" }} />
                      <span>Myths vs. Facts About Treatment</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 space-y-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#fef2f2" }}>
                      <p className="font-medium" style={{ color: "#dc2626" }}>
                        MYTH: "You're just trading one addiction for another"
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#f0fdf4" }}>
                      <p className="font-medium" style={{ color: "#16a34a" }}>
                        FACT: MAT medications stabilize brain chemistry, allowing people to function normally, work, and
                        maintain relationships. Unlike illicit opioid use, MAT is controlled, legal, and part of
                        comprehensive treatment.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#fef2f2" }}>
                      <p className="font-medium" style={{ color: "#dc2626" }}>
                        MYTH: "Methadone treatment is forever"
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#f0fdf4" }}>
                      <p className="font-medium" style={{ color: "#16a34a" }}>
                        FACT: Treatment duration varies by individual. Some people taper off medications successfully,
                        while others benefit from longer-term treatment. There's no "one size fits all" - you and your
                        treatment team determine what's best for you.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#fef2f2" }}>
                      <p className="font-medium" style={{ color: "#dc2626" }}>
                        MYTH: "Everyone will know I'm in treatment"
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#f0fdf4" }}>
                      <p className="font-medium" style={{ color: "#16a34a" }}>
                        FACT: Your treatment is protected by the strictest federal privacy laws (42 CFR Part 2). Your
                        employer, insurance company, and even family cannot access your records without your explicit
                        consent.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="working" className="bg-white rounded-lg border px-4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5" style={{ color: "#0891b2" }} />
                      <span>Working While in Treatment</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 space-y-3">
                    <p>
                      Thousands of people successfully maintain employment while in MAT. In fact, employment outcomes
                      are one of the best indicators of successful recovery.
                    </p>
                    <p>
                      <strong>What you should know:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Your treatment is confidential and employers cannot require disclosure</li>
                      <li>MAT medications don't impair cognitive function when taken as prescribed</li>
                      <li>Clinics offer flexible hours including early morning dosing for workers</li>
                      <li>Take-home privileges reduce the frequency of clinic visits over time</li>
                      <li>The Americans with Disabilities Act protects people in MAT from discrimination</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pregnancy" className="bg-white rounded-lg border px-4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Baby className="h-5 w-5" style={{ color: "#0891b2" }} />
                      <span>Pregnancy & Opioid Treatment</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 space-y-3">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: "#fef3c7" }}>
                      <p className="font-medium" style={{ color: "#92400e" }}>
                        If you are pregnant and using opioids, getting treatment is the safest choice for you and your
                        baby.
                      </p>
                    </div>
                    <p>
                      Medication-assisted treatment during pregnancy is the standard of care recommended by major
                      medical organizations including ACOG (American College of Obstetricians and Gynecologists).
                    </p>
                    <p>
                      <strong>Key facts:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Methadone and buprenorphine are safe and effective during pregnancy</li>
                      <li>Treatment reduces risk of preterm birth, low birth weight, and stillbirth</li>
                      <li>Babies may need monitoring for Neonatal Abstinence Syndrome (NAS), which is treatable</li>
                      <li>You will NOT lose custody simply for being in treatment</li>
                      <li>Our clinics provide specialized prenatal coordination</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="takehome" className="bg-white rounded-lg border px-4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Home className="h-5 w-5" style={{ color: "#0891b2" }} />
                      <span>Take-Home Dosing Explained</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 space-y-3">
                    <p>
                      As you progress in treatment, you may earn the privilege of take-home doses, reducing your
                      required clinic visits from daily to weekly or even monthly.
                    </p>
                    <p>
                      <strong>How it works:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Initial phase: Daily observed dosing at the clinic</li>
                      <li>After demonstrating stability: Earn 1-2 take-home doses per week</li>
                      <li>Continued progress: Up to 2 weeks of take-homes at a time</li>
                      <li>Take-homes come in secure, labeled bottles with QR codes</li>
                      <li>Our mobile app helps you track your doses and stay compliant</li>
                    </ul>
                    <p>
                      Take-home privileges are based on time in treatment, negative drug screens, counseling attendance,
                      and overall stability. Your counselor will work with you on your individual plan.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="privacy" className="bg-white rounded-lg border px-4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5" style={{ color: "#0891b2" }} />
                      <span>Privacy, HIPAA, and 42 CFR Part 2</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 space-y-3">
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
                      <li>Even if subpoenaed, the clinic cannot release your records without your consent</li>
                    </ul>
                    <p>
                      <strong>You control who knows about your treatment.</strong> We take your privacy seriously and
                      will explain your rights during the intake process.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* REFERRAL TAB */}
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
                              ? "border-cyan-600 bg-cyan-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setReferralData({ ...referralData, referralType: type.value })}
                        >
                          <div className="flex items-center gap-3">
                            <type.icon className="h-5 w-5" style={{ color: "#0891b2" }} />
                            <span>{type.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {referralData.referralType && referralData.referralType !== "self" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Organization Name (Optional)</Label>
                          <Input
                            placeholder="e.g., City General Hospital"
                            value={referralData.organizationName}
                            onChange={(e) => setReferralData({ ...referralData, organizationName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Your Name (Optional)</Label>
                          <Input
                            placeholder="For follow-up questions"
                            value={referralData.referrerName}
                            onChange={(e) => setReferralData({ ...referralData, referrerName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Contact Information (Optional)</Label>
                        <Input
                          placeholder="Phone or email for follow-up"
                          value={referralData.referrerContact}
                          onChange={(e) => setReferralData({ ...referralData, referrerContact: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Urgency Level</Label>
                    <Select
                      value={referralData.urgencyLevel}
                      onValueChange={(v) => setReferralData({ ...referralData, urgencyLevel: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent - Immediate need (overdose risk, withdrawal)</SelectItem>
                        <SelectItem value="high">High - Within 24-48 hours</SelectItem>
                        <SelectItem value="medium">Medium - Within 1 week</SelectItem>
                        <SelectItem value="low">Low - Information/planning stage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>General Concern</Label>
                    <p className="text-sm mb-2" style={{ color: "#64748b" }}>
                      No patient name needed. Describe the situation in general terms.
                    </p>
                    <Textarea
                      placeholder="e.g., Individual presenting at ER with opioid withdrawal symptoms, expressed interest in treatment..."
                      rows={4}
                      value={referralData.generalConcern}
                      onChange={(e) => setReferralData({ ...referralData, generalConcern: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Additional Information (Optional)</Label>
                    <Textarea
                      placeholder="Any other relevant details..."
                      rows={2}
                      value={referralData.additionalInfo}
                      onChange={(e) => setReferralData({ ...referralData, additionalInfo: e.target.value })}
                    />
                  </div>

                  <div className="p-4 rounded-lg" style={{ backgroundColor: "#f0fdf4" }}>
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 mt-0.5" style={{ color: "#16a34a" }} />
                      <p className="text-sm" style={{ color: "#166534" }}>
                        This referral is confidential. No patient chart will be created until the individual contacts us
                        directly and provides consent. We comply with HIPAA and 42 CFR Part 2.
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    style={{ backgroundColor: "#0891b2" }}
                    onClick={handleReferralSubmit}
                    disabled={!referralData.referralType || !referralData.urgencyLevel || !referralData.generalConcern}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Referral
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONSENT FORMS TAB */}
          <TabsContent value="consent-forms" className="space-y-6 mt-6">
            {/* Consent Forms Section */}
            <Card className="border-l-4" style={{ borderLeftColor: "#10b981" }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: "#d1fae5" }}>
                    <FileText className="h-5 w-5" style={{ color: "#059669" }} />
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
                {/* Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#64748b" }}>Consent Progress</span>
                    <span className="font-semibold" style={{ color: "#0f172a" }}>
                      {getConsentProgress()}%
                    </span>
                  </div>
                  <Progress value={getConsentProgress()} className="h-2" />
                </div>

                {/* Consent Forms List */}
                <div className="space-y-4">
                  {consentForms.map((form) => (
                    <Card
                      key={form.id}
                      className="border-2"
                      style={{ borderColor: signedConsents[form.id] ? "#10b981" : "#e2e8f0" }}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${signedConsents[form.id] ? "bg-green-100" : "bg-gray-100"}`}
                            >
                              {form.category === "treatment" && (
                                <Heart
                                  className="h-5 w-5"
                                  style={{ color: signedConsents[form.id] ? "#059669" : "#64748b" }}
                                />
                              )}
                              {form.category === "testing" && (
                                <TestTube
                                  className="h-5 w-5"
                                  style={{ color: signedConsents[form.id] ? "#059669" : "#64748b" }}
                                />
                              )}
                              {form.category === "privacy" && (
                                <Lock
                                  className="h-5 w-5"
                                  style={{ color: signedConsents[form.id] ? "#059669" : "#64748b" }}
                                />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{form.title}</CardTitle>
                                {form.required && (
                                  <Badge style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>Required</Badge>
                                )}
                                {signedConsents[form.id] && (
                                  <Badge style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Signed</Badge>
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

                              {/* Consent Content */}
                              <div className="space-y-6 mt-4">
                                <div className="p-4 rounded-lg border space-y-3" style={{ backgroundColor: "#f8fafc" }}>
                                  <pre
                                    className="whitespace-pre-wrap text-sm"
                                    style={{ fontFamily: "inherit", color: "#334155" }}
                                  >
                                    {form.content}
                                  </pre>
                                </div>

                                {/* Acknowledgments */}
                                <div className="space-y-3">
                                  <Label className="text-base font-semibold">Patient Acknowledgments:</Label>
                                  {form.acknowledgments.map((ack, index) => (
                                    <div
                                      key={index}
                                      className="flex items-start gap-3 p-3 rounded-lg border"
                                      style={{ backgroundColor: "#f8fafc" }}
                                    >
                                      <Checkbox
                                        id={`${form.id}-ack-${index}`}
                                        className="mt-1"
                                        disabled={signedConsents[form.id]}
                                        defaultChecked={signedConsents[form.id]}
                                      />
                                      <Label
                                        htmlFor={`${form.id}-ack-${index}`}
                                        className="text-sm leading-relaxed cursor-pointer"
                                      >
                                        {ack}
                                      </Label>
                                    </div>
                                  ))}
                                </div>

                                {!signedConsents[form.id] && (
                                  <>
                                    {/* Signature Fields */}
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
                                        style={{ fontFamily: "'Brush Script MT', cursive" }}
                                      />
                                      <p className="text-xs" style={{ color: "#64748b" }}>
                                        By typing your name, you agree that this constitutes a legal electronic
                                        signature.
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

                                    <Button
                                      onClick={() => handleConsentSign(form.id)}
                                      className="w-full"
                                      style={{ backgroundColor: "#10b981" }}
                                    >
                                      <Fingerprint className="h-4 w-4 mr-2" />
                                      Sign Consent Form
                                    </Button>
                                  </>
                                )}

                                {signedConsents[form.id] && (
                                  <div
                                    className="p-4 rounded-lg border"
                                    style={{ backgroundColor: "#d1fae5", borderColor: "#10b981" }}
                                  >
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

                {/* Submit Button */}
                {allRequiredSigned() && (
                  <div
                    className="p-6 rounded-lg border-2"
                    style={{ backgroundColor: "#d1fae5", borderColor: "#10b981" }}
                  >
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-green-900">All Required Consents Completed!</h3>
                        <p className="text-sm text-green-700 mt-1">
                          You have completed all required consent forms. You may now proceed with the intake process.
                        </p>
                        <Button className="mt-4" style={{ backgroundColor: "#10b981" }}>
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

          {/* PROVIDER PORTAL TAB */}
          <TabsContent value="provider-portal" className="space-y-6 mt-6">
            {/* Provider Portal Section */}
            <Card className="border-l-4" style={{ borderLeftColor: "#3b82f6" }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: "#dbeafe" }}>
                    <Building2 className="h-5 w-5" style={{ color: "#2563eb" }} />
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
                {/* Instructions */}
                <div className="p-4 rounded-lg border" style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 flex-shrink-0" style={{ color: "#2563eb" }} />
                    <div className="space-y-2">
                      <h4 className="font-semibold" style={{ color: "#1e40af" }}>
                        For Healthcare Providers
                      </h4>
                      <p className="text-sm" style={{ color: "#1e3a8a" }}>
                        If you are a healthcare provider transferring a patient to our facility, please complete the
                        form below. Your secure submission helps ensure seamless care transitions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Provider Transfer Submission Form */}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider-phone">Contact Phone*</Label>
                      <Input id="provider-phone" type="tel" placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-email">Contact Email*</Label>
                      <Input id="provider-email" type="email" placeholder="provider@facility.com" />
                    </div>
                  </div>

                  <div className="h-px" style={{ backgroundColor: "#e2e8f0" }} />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient-name-transfer">Patient Full Name*</Label>
                      <Input id="patient-name-transfer" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-dob-transfer">Patient Date of Birth*</Label>
                      <Input id="patient-dob-transfer" type="date" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer-reason">Reason for Transfer*</Label>
                    <Textarea
                      id="transfer-reason"
                      placeholder="Brief clinical summary and reason for transfer..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current-medications">Current Medications*</Label>
                    <Textarea
                      id="current-medications"
                      placeholder="List current medications, including MAT dosing if applicable..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-dose">Current MAT Dose (if applicable)</Label>
                      <Input id="current-dose" placeholder="e.g., 80mg Methadone daily" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-dose-date">Last Dose Date</Label>
                      <Input id="last-dose-date" type="date" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additional-info">Additional Clinical Information</Label>
                    <Textarea
                      id="additional-info"
                      placeholder="Lab results, UDS results, recent assessments, etc..."
                      rows={3}
                    />
                  </div>

                  {/* Document Upload */}
                  <div className="space-y-2">
                    <Label>Attach Transfer Documents*</Label>
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center"
                      style={{ borderColor: "#cbd5e1", backgroundColor: "#f8fafc" }}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: "#94a3b8" }} />
                      <p className="text-sm font-medium" style={{ color: "#334155" }}>
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                        Treatment summary, medication orders, UDS results, discharge summary
                      </p>
                      <Button variant="outline" className="mt-3 bg-transparent">
                        Select Files
                      </Button>
                    </div>
                  </div>

                  {/* HIPAA Acknowledgment */}
                  <div
                    className="p-4 rounded-lg border space-y-3"
                    style={{ backgroundColor: "#fef3c7", borderColor: "#fcd34d" }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "#d97706" }} />
                      <div className="space-y-3 flex-1">
                        <h4 className="font-semibold" style={{ color: "#92400e" }}>
                          HIPAA & 42 CFR Part 2 Compliance
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Checkbox id="provider-hipaa" />
                            <Label
                              htmlFor="provider-hipaa"
                              className="text-sm leading-relaxed cursor-pointer"
                              style={{ color: "#78350f" }}
                            >
                              I confirm that I have obtained valid patient consent to disclose this protected health
                              information under HIPAA and 42 CFR Part 2 regulations
                            </Label>
                          </div>
                          <div className="flex items-start gap-2">
                            <Checkbox id="provider-verification" />
                            <Label
                              htmlFor="provider-verification"
                              className="text-sm leading-relaxed cursor-pointer"
                              style={{ color: "#78350f" }}
                            >
                              I am an authorized representative of the facility listed above and all information
                              provided is accurate to the best of my knowledge
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" style={{ backgroundColor: "#3b82f6" }}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Transfer Documents Securely
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EVENTS TAB */}
          <TabsContent value="events">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2" style={{ color: "#0f172a" }}>
                  Community Events & Narcan Access
                </h2>
                <p style={{ color: "#64748b" }}>
                  Free community events, Narcan distribution, and overdose prevention resources
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" style={{ color: "#0891b2" }} />
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
                      {
                        title: "Family Support Group",
                        date: "January 20, 2025",
                        time: "6:00 PM - 7:30 PM",
                        location: "MASE Clinic - Conference Room",
                        type: "support",
                      },
                    ].map((event, idx) => (
                      <div key={idx} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium" style={{ color: "#0f172a" }}>
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1" style={{ color: "#64748b" }}>
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="text-sm">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2" style={{ color: "#64748b" }}>
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-sm">{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2" style={{ color: "#64748b" }}>
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="text-sm">{event.location}</span>
                            </div>
                          </div>
                          <Badge variant={event.type === "narcan" ? "destructive" : "secondary"}>
                            {event.type === "narcan" ? "Narcan" : event.type === "support" ? "Support" : "Education"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Narcan Access */}
                <Card style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: "#dc2626" }}>
                      <AlertTriangle className="h-5 w-5" />
                      Narcan (Naloxone) Saves Lives
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p style={{ color: "#7f1d1d" }}>
                      Narcan is a life-saving medication that can reverse an opioid overdose. It's safe, easy to use,
                      and available free at many locations.
                    </p>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: "#ffffff" }}>
                      <h4 className="font-medium mb-2" style={{ color: "#0f172a" }}>
                        Get Free Narcan:
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
                          Any MASE clinic during business hours
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
                          Local pharmacies (no prescription needed)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
                          Community distribution events
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
                          Health department offices
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

              {/* QR Code Section */}
              <Card className="text-center">
                <CardContent className="py-8">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: "#0f172a" }}>
                    Scan for Help
                  </h3>
                  <p className="mb-6" style={{ color: "#64748b" }}>
                    Print and share these QR codes in your community. They link directly to our confidential screening.
                  </p>
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <QrCode className="h-24 w-24" style={{ color: "#0891b2" }} />
                      </div>
                      <p className="text-sm font-medium">Get Help Now</p>
                    </div>
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <QrCode className="h-24 w-24" style={{ color: "#dc2626" }} />
                      </div>
                      <p className="text-sm font-medium">Find Narcan</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-6 bg-transparent">
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
      <footer className="border-t mt-12 py-8" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-3" style={{ color: "#0f172a" }}>
                MASE Access
              </h4>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Community Outreach & Recovery Gateway. Part of the MASE EMR ecosystem.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: "#0f172a" }}>
                Crisis Resources
              </h4>
              <ul className="space-y-2 text-sm" style={{ color: "#64748b" }}>
                <li>National Helpline: 1-800-662-4357</li>
                <li>Crisis Text Line: Text HOME to 741741</li>
                <li>Suicide Prevention: 988</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: "#0f172a" }}>
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm" style={{ color: "#64748b" }}>
                <li>
                  <a href="#" className="hover:underline">
                    Find a Clinic
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Treatment FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: "#0f172a" }}>
                Contact
              </h4>
              <ul className="space-y-2 text-sm" style={{ color: "#64748b" }}>
                <li>24/7 Hotline: 1-800-RECOVERY</li>
                <li>Email: access@mase-emr.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm" style={{ color: "#94a3b8", borderColor: "#e2e8f0" }}>
            <p>
              © 2025 MASE Access. Protected by HIPAA and 42 CFR Part 2. This is an education-first, non-promotional
              resource.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
