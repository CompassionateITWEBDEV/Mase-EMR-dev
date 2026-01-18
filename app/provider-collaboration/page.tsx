"use client"

import { useState } from "react"
import useSWR from "swr"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Building2,
  MessageSquare,
  Send,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Shield,
  CheckCircle2,
  RefreshCw,
  Handshake,
  ClipboardList,
  UserPlus,
  FileCheck,
  ArrowRight,
  Stethoscope,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProviderCollaborationPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog states
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [sendNoteOpen, setSendNoteOpen] = useState(false)
  const [createAuthOpen, setCreateAuthOpen] = useState(false)
  const [createReferralOpen, setCreateReferralOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any>(null)

  // New states for response review
  const [responseReviewOpen, setResponseReviewOpen] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<any>(null)
  const [respondToReferralOpen, setRespondToReferralOpen] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState<any>(null)

  // Form states
  const [providerForm, setProviderForm] = useState({
    organizationName: "",
    providerName: "",
    providerType: "",
    npiNumber: "",
    specialty: "",
    email: "",
    phone: "",
    fax: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  })

  const [noteForm, setNoteForm] = useState({
    patientId: "",
    externalProviderId: "",
    noteType: "care_coordination",
    subject: "",
    noteContent: "",
    isUrgent: false,
    requiresResponse: false,
  })

  const [authForm, setAuthForm] = useState({
    patientId: "",
    externalProviderId: "",
    authorizationType: "limited",
    purpose: "",
    informationTypes: [] as string[],
    effectiveDate: new Date().toISOString().split("T")[0],
    expirationDate: "",
  })

  const [referralForm, setReferralForm] = useState({
    patientId: "",
    externalProviderId: "",
    referralType: "",
    referralReason: "",
    clinicalInformation: "",
    urgency: "routine",
    preferredDate: "",
  })

  // Fetch data
  const { data, error, isLoading, mutate } = useSWR("/api/provider-collaboration", fetcher)
  const { data: notesData, mutate: mutateNotes } = useSWR(
    "/api/provider-collaboration?type=collaboration-notes",
    fetcher,
  )
  const { data: referralsData, mutate: mutateReferrals } = useSWR("/api/provider-collaboration?type=referrals", fetcher)
  const { data: authsData, mutate: mutateAuths } = useSWR("/api/provider-collaboration?type=authorizations", fetcher)

  const { data: pendingResponsesData, mutate: mutatePendingResponses } = useSWR(
    "/api/provider-collaboration?action=get-pending-responses",
    () =>
      fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-pending-responses" }),
      }).then((r) => r.json()),
  )

  // Handlers
  const handleAddProvider = async () => {
    try {
      const response = await fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-provider", ...providerForm }),
      })
      if (response.ok) {
        toast.success("Community provider added successfully!")
        setAddProviderOpen(false)
        setProviderForm({
          organizationName: "",
          providerName: "",
          providerType: "",
          npiNumber: "",
          specialty: "",
          email: "",
          phone: "",
          fax: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          notes: "",
        })
        mutate()
      }
    } catch (err) {
      toast.error("Failed to add provider")
    }
  }

  const handleSendNote = async () => {
    try {
      const response = await fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-note", ...noteForm }),
      })
      if (response.ok) {
        toast.success("Collaboration note sent successfully!")
        setSendNoteOpen(false)
        setNoteForm({
          patientId: "",
          externalProviderId: "",
          noteType: "care_coordination",
          subject: "",
          noteContent: "",
          isUrgent: false,
          requiresResponse: false,
        })
        mutateNotes()
      }
    } catch (err) {
      toast.error("Failed to send note")
    }
  }

  const handleCreateAuth = async () => {
    try {
      const response = await fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-authorization", ...authForm }),
      })
      if (response.ok) {
        toast.success("Patient authorization created (42 CFR Part 2 compliant)")
        setCreateAuthOpen(false)
        setAuthForm({
          patientId: "",
          externalProviderId: "",
          authorizationType: "limited",
          purpose: "",
          informationTypes: [],
          effectiveDate: new Date().toISOString().split("T")[0],
          expirationDate: "",
        })
        mutateAuths()
        mutate()
      }
    } catch (err) {
      toast.error("Failed to create authorization")
    }
  }

  const handleCreateReferral = async () => {
    try {
      const response = await fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-referral", ...referralForm }),
      })
      if (response.ok) {
        toast.success("Referral created successfully!")
        setCreateReferralOpen(false)
        setReferralForm({
          patientId: "",
          externalProviderId: "",
          referralType: "",
          referralReason: "",
          clinicalInformation: "",
          urgency: "routine",
          preferredDate: "",
        })
        mutateReferrals()
        mutate()
      }
    } catch (err) {
      toast.error("Failed to create referral")
    }
  }

  const handleUpdateReferralStatus = async (referralId: string, status: string) => {
    try {
      await fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-referral-status", referralId, status }),
      })
      toast.success("Referral status updated")
      mutateReferrals()
      mutate()
    } catch (err) {
      toast.error("Failed to update status")
    }
  }

  const handleSubmitResponse = async (referralId: string, response: string, attachments?: any[]) => {
    try {
      const res = await fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-referral-response",
          referralId,
          response,
          attachments,
        }),
      })
      if (res.ok) {
        toast.success("Response submitted successfully!")
        setRespondToReferralOpen(false)
        mutateReferrals()
        mutatePendingResponses()
      }
    } catch (err) {
      toast.error("Failed to submit response")
    }
  }

  const handleReviewResponse = async (referralId: string, reviewStatus: string, importToChart: boolean) => {
    try {
      const res = await fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review-referral-response",
          referralId,
          reviewStatus,
          reviewerId: "current-user-id", // Replace with actual user ID
          importToChart,
        }),
      })
      if (res.ok) {
        toast.success(
          reviewStatus === "approved"
            ? importToChart
              ? "Response approved and imported to patient chart!"
              : "Response approved!"
            : "Response marked for revision",
        )
        setResponseReviewOpen(false)
        mutatePendingResponses()
        mutateReferrals()
        mutate()
      }
    } catch (err) {
      toast.error("Failed to review response")
    }
  }

  const metrics = data?.metrics || { totalPartners: 0, activeAuthorizations: 0, pendingReferrals: 0, unreadMessages: 0 }
  const externalProviders = data?.externalProviders || []
  const patients = data?.patients || []
  const internalProviders = data?.internalProviders || []

  const filteredProviders = externalProviders.filter(
    (p: any) =>
      p.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const informationTypeOptions = [
    { id: "demographics", label: "Demographics" },
    { id: "treatment_plan", label: "Treatment Plan" },
    { id: "medications", label: "Medications (MAT)" },
    { id: "lab_results", label: "Lab Results" },
    { id: "assessments", label: "Assessments" },
    { id: "progress_notes", label: "Progress Notes" },
    { id: "discharge_summary", label: "Discharge Summary" },
  ]

  const pendingResponses = pendingResponsesData?.pendingResponses || []

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Handshake className="h-8 w-8 text-primary" />
                Provider Collaboration Portal
              </h1>
              <p className="text-muted-foreground">Coordinate care with community providers, PCPs, and specialists</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={addProviderOpen} onOpenChange={setAddProviderOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Community Provider
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Community Provider</DialogTitle>
                    <DialogDescription>Register a new collaborating provider or community partner</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organization Name *</Label>
                      <Input
                        value={providerForm.organizationName}
                        onChange={(e) => setProviderForm({ ...providerForm, organizationName: e.target.value })}
                        placeholder="Community Health Center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provider Name *</Label>
                      <Input
                        value={providerForm.providerName}
                        onChange={(e) => setProviderForm({ ...providerForm, providerName: e.target.value })}
                        placeholder="Dr. Jane Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provider Type *</Label>
                      <Select
                        value={providerForm.providerType}
                        onValueChange={(v) => setProviderForm({ ...providerForm, providerType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcp">Primary Care Physician</SelectItem>
                          <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                          <SelectItem value="psychologist">Psychologist</SelectItem>
                          <SelectItem value="counselor">Counselor/Therapist</SelectItem>
                          <SelectItem value="social_worker">Social Worker</SelectItem>
                          <SelectItem value="case_manager">Case Manager</SelectItem>
                          <SelectItem value="specialist">Medical Specialist</SelectItem>
                          <SelectItem value="hospital">Hospital/ER</SelectItem>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="lab">Laboratory</SelectItem>
                          <SelectItem value="housing">Housing Services</SelectItem>
                          <SelectItem value="employment">Employment Services</SelectItem>
                          <SelectItem value="legal">Legal Services</SelectItem>
                          <SelectItem value="peer_support">Peer Support Organization</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Input
                        value={providerForm.specialty}
                        onChange={(e) => setProviderForm({ ...providerForm, specialty: e.target.value })}
                        placeholder="Addiction Medicine"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NPI Number</Label>
                      <Input
                        value={providerForm.npiNumber}
                        onChange={(e) => setProviderForm({ ...providerForm, npiNumber: e.target.value })}
                        placeholder="1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={providerForm.email}
                        onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
                        placeholder="provider@organization.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={providerForm.phone}
                        onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fax</Label>
                      <Input
                        value={providerForm.fax}
                        onChange={(e) => setProviderForm({ ...providerForm, fax: e.target.value })}
                        placeholder="(555) 123-4568"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={providerForm.address}
                        onChange={(e) => setProviderForm({ ...providerForm, address: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={providerForm.city}
                        onChange={(e) => setProviderForm({ ...providerForm, city: e.target.value })}
                        placeholder="Detroit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={providerForm.state}
                        onChange={(e) => setProviderForm({ ...providerForm, state: e.target.value })}
                        placeholder="MI"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ZIP Code</Label>
                      <Input
                        value={providerForm.zipCode}
                        onChange={(e) => setProviderForm({ ...providerForm, zipCode: e.target.value })}
                        placeholder="48201"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={providerForm.notes}
                        onChange={(e) => setProviderForm({ ...providerForm, notes: e.target.value })}
                        placeholder="Additional notes about this provider..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddProviderOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddProvider}
                      disabled={
                        !providerForm.organizationName || !providerForm.providerName || !providerForm.providerType
                      }
                    >
                      Add Provider
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Community Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{metrics.totalPartners}</div>
                )}
                <p className="text-xs text-muted-foreground">Active collaborators</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Active Authorizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{metrics.activeAuthorizations}</div>
                )}
                <p className="text-xs text-muted-foreground">42 CFR Part 2 compliant</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-orange-500" />
                  Pending Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{metrics.pendingReferrals}</div>
                )}
                <p className="text-xs text-muted-foreground">Awaiting response</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  Unread Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{metrics.unreadMessages}</div>
                )}
                <p className="text-xs text-muted-foreground">Care coordination notes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-amber-500" />
                  Pending Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{pendingResponses.length}</div>
                )}
                <p className="text-xs text-muted-foreground">Awaiting staff review</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="providers">Partners</TabsTrigger>
              <TabsTrigger value="notes">Collaboration Notes</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="authorizations">Authorizations</TabsTrigger>
              <TabsTrigger value="responses">
                Response Review
                {pendingResponses.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingResponses.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common collaboration tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start bg-transparent"
                      variant="outline"
                      onClick={() => setSendNoteOpen(true)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Collaboration Note
                    </Button>
                    <Button
                      className="w-full justify-start bg-transparent"
                      variant="outline"
                      onClick={() => setCreateReferralOpen(true)}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Create Referral
                    </Button>
                    <Button
                      className="w-full justify-start bg-transparent"
                      variant="outline"
                      onClick={() => setCreateAuthOpen(true)}
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Create Patient Authorization
                    </Button>
                    <Button
                      className="w-full justify-start bg-transparent"
                      variant="outline"
                      onClick={() => setAddProviderOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Community Provider
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest collaboration updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      {notesData?.notes?.slice(0, 5).map((note: any) => (
                        <div key={note.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                          <div className={`p-2 rounded-full ${note.is_urgent ? "bg-red-100" : "bg-blue-100"}`}>
                            <MessageSquare className={`h-4 w-4 ${note.is_urgent ? "text-red-600" : "text-blue-600"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{note.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {note.external_providers?.organization_name} •{" "}
                              {new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!note.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      )) || <p className="text-sm text-muted-foreground">No recent activity</p>}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Pending Referrals */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Pending Referrals</CardTitle>
                    <CardDescription>Referrals awaiting response or action</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {referralsData?.referrals
                        ?.filter((r: any) => r.status === "pending")
                        .slice(0, 5)
                        .map((referral: any) => (
                          <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-full ${referral.urgency === "urgent" ? "bg-red-100" : "bg-gray-100"}`}
                              >
                                <Stethoscope
                                  className={`h-4 w-4 ${referral.urgency === "urgent" ? "text-red-600" : "text-gray-600"}`}
                                />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {referral.patients?.first_name} {referral.patients?.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {referral.referral_type} → {referral.external_providers?.organization_name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={referral.urgency === "urgent" ? "destructive" : "outline"}>
                                {referral.urgency}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateReferralStatus(referral.id, "scheduled")}
                              >
                                Mark Scheduled
                              </Button>
                            </div>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">No pending referrals</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Partners Tab */}
            <TabsContent value="providers" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search community providers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProviders.map((provider: any) => (
                  <Card key={provider.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{provider.organization_name}</CardTitle>
                          <CardDescription>{provider.provider_name}</CardDescription>
                        </div>
                        <Badge variant={provider.is_verified ? "default" : "secondary"}>
                          {provider.is_verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.provider_type?.replace("_", " ").toUpperCase()}</span>
                        {provider.specialty && <span className="text-muted-foreground">• {provider.specialty}</span>}
                      </div>
                      {provider.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{provider.phone}</span>
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{provider.email}</span>
                        </div>
                      )}
                      {provider.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {provider.city}, {provider.state}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            setNoteForm({ ...noteForm, externalProviderId: provider.id })
                            setSendNoteOpen(true)
                          }}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send Note
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            setReferralForm({ ...referralForm, externalProviderId: provider.id })
                            setCreateReferralOpen(true)
                          }}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Refer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredProviders.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No community providers found</p>
                    <Button className="mt-4" onClick={() => setAddProviderOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Provider
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Collaboration Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Collaboration Notes</h3>
                <Button onClick={() => setSendNoteOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </div>
              <div className="space-y-3">
                {notesData?.notes?.map((note: any) => (
                  <Card key={note.id} className={note.is_urgent ? "border-red-200" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{note.subject}</h4>
                            {note.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                            {!note.is_read && <Badge variant="secondary">Unread</Badge>}
                            <Badge variant="outline">{note.note_type?.replace("_", " ")}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {note.external_providers?.organization_name} • {note.patients?.first_name}{" "}
                            {note.patients?.last_name}
                          </p>
                          <p className="text-sm line-clamp-2">{note.note_content}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || <p className="text-sm text-muted-foreground">No collaboration notes</p>}
              </div>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Provider Referrals</h3>
                <Button onClick={() => setCreateReferralOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Referral
                </Button>
              </div>
              <div className="space-y-3">
                {referralsData?.referrals?.map((referral: any) => (
                  <Card key={referral.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{referral.referral_type}</h4>
                            <Badge
                              variant={
                                referral.status === "completed"
                                  ? "default"
                                  : referral.status === "pending"
                                    ? "secondary"
                                    : referral.status === "scheduled"
                                      ? "outline"
                                      : "destructive"
                              }
                            >
                              {referral.status}
                            </Badge>
                            <Badge variant={referral.urgency === "urgent" ? "destructive" : "outline"}>
                              {referral.urgency}
                            </Badge>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">
                              {referral.patients?.first_name} {referral.patients?.last_name}
                            </span>
                            {" → "}
                            <span>{referral.external_providers?.organization_name}</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{referral.referral_reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {referral.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateReferralStatus(referral.id, "scheduled")}
                              >
                                Scheduled
                              </Button>
                              <Button size="sm" onClick={() => handleUpdateReferralStatus(referral.id, "completed")}>
                                Complete
                              </Button>
                            </>
                          )}
                          {referral.status === "scheduled" && (
                            <Button size="sm" onClick={() => handleUpdateReferralStatus(referral.id, "completed")}>
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || <p className="text-sm text-muted-foreground">No referrals</p>}
              </div>
            </TabsContent>

            {/* Authorizations Tab */}
            <TabsContent value="authorizations" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Patient Authorizations</h3>
                  <p className="text-sm text-muted-foreground">42 CFR Part 2 compliant information sharing consents</p>
                </div>
                <Button onClick={() => setCreateAuthOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Authorization
                </Button>
              </div>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">42 CFR Part 2 Compliance</h4>
                      <p className="text-sm text-amber-700">
                        All patient information sharing requires explicit written consent per federal regulations.
                        Authorizations must specify the recipient, purpose, and types of information being disclosed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-3">
                {authsData?.authorizations?.map((auth: any) => (
                  <Card key={auth.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">
                              {auth.patients?.first_name} {auth.patients?.last_name}
                            </h4>
                            <Badge variant={auth.authorization_type === "full" ? "default" : "secondary"}>
                              {auth.authorization_type}
                            </Badge>
                          </div>
                          <p className="text-sm">
                            Authorized to:{" "}
                            <span className="font-medium">{auth.external_providers?.organization_name}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">{auth.purpose}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Valid: {new Date(auth.effective_date).toLocaleDateString()}
                            {auth.expiration_date && ` - ${new Date(auth.expiration_date).toLocaleDateString()}`}
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                )) || <p className="text-sm text-muted-foreground">No active authorizations</p>}
              </div>
            </TabsContent>

            {/* Response Review Tab */}
            <TabsContent value="responses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>External Provider Responses - Pending Review</CardTitle>
                  <CardDescription>
                    Review responses from community providers and import to patient charts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingResponses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending responses to review</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingResponses.map((response: any) => (
                        <Card key={response.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">
                                  {response.patients?.first_name} {response.patients?.last_name}
                                </CardTitle>
                                <CardDescription>
                                  {response.referral_type} • From {response.external_providers?.provider_name} (
                                  {response.external_providers?.organization_name})
                                </CardDescription>
                              </div>
                              <Badge variant="outline">
                                {new Date(response.response_received_at).toLocaleDateString()}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Original Referral Reason:</Label>
                              <p className="text-sm text-muted-foreground mt-1">{response.referral_reason}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">External Provider Response:</Label>
                              <div className="mt-2 p-4 bg-muted rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{response.external_provider_response}</p>
                              </div>
                            </div>
                            {response.response_attachments && (
                              <div>
                                <Label className="text-sm font-medium">Attachments:</Label>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {JSON.stringify(response.response_attachments)}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => {
                                  setSelectedResponse(response)
                                  setResponseReviewOpen(true)
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Review & Import to Chart
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleReviewResponse(response.id, "needs_revision", false)}
                              >
                                Request Revision
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Send Note Dialog */}
          <Dialog open={sendNoteOpen} onOpenChange={setSendNoteOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Collaboration Note</DialogTitle>
                <DialogDescription>Send a secure care coordination note to a community provider</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient *</Label>
                  <Select value={noteForm.patientId} onValueChange={(v) => setNoteForm({ ...noteForm, patientId: v })}>
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
                  <Label>Community Provider *</Label>
                  <Select
                    value={noteForm.externalProviderId}
                    onValueChange={(v) => setNoteForm({ ...noteForm, externalProviderId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {externalProviders.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.organization_name} - {p.provider_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Note Type</Label>
                  <Select value={noteForm.noteType} onValueChange={(v) => setNoteForm({ ...noteForm, noteType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="care_coordination">Care Coordination</SelectItem>
                      <SelectItem value="consultation">Consultation Request</SelectItem>
                      <SelectItem value="treatment_update">Treatment Update</SelectItem>
                      <SelectItem value="referral">Referral Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input
                    value={noteForm.subject}
                    onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                    placeholder="Brief subject line"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    value={noteForm.noteContent}
                    onChange={(e) => setNoteForm({ ...noteForm, noteContent: e.target.value })}
                    placeholder="Enter your message..."
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={noteForm.isUrgent}
                      onCheckedChange={(c) => setNoteForm({ ...noteForm, isUrgent: !!c })}
                    />
                    <Label className="text-sm">Mark as Urgent</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={noteForm.requiresResponse}
                      onCheckedChange={(c) => setNoteForm({ ...noteForm, requiresResponse: !!c })}
                    />
                    <Label className="text-sm">Requires Response</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendNoteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendNote}
                  disabled={
                    !noteForm.patientId || !noteForm.externalProviderId || !noteForm.subject || !noteForm.noteContent
                  }
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Authorization Dialog */}
          <Dialog open={createAuthOpen} onOpenChange={setCreateAuthOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Patient Authorization</DialogTitle>
                <DialogDescription>42 CFR Part 2 compliant consent for information sharing</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient *</Label>
                  <Select value={authForm.patientId} onValueChange={(v) => setAuthForm({ ...authForm, patientId: v })}>
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
                  <Label>Authorize Disclosure To *</Label>
                  <Select
                    value={authForm.externalProviderId}
                    onValueChange={(v) => setAuthForm({ ...authForm, externalProviderId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {externalProviders.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.organization_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Authorization Type</Label>
                  <Select
                    value={authForm.authorizationType}
                    onValueChange={(v) => setAuthForm({ ...authForm, authorizationType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Disclosure</SelectItem>
                      <SelectItem value="limited">Limited Disclosure</SelectItem>
                      <SelectItem value="emergency_only">Emergency Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Purpose of Disclosure *</Label>
                  <Textarea
                    value={authForm.purpose}
                    onChange={(e) => setAuthForm({ ...authForm, purpose: e.target.value })}
                    placeholder="Describe the purpose of this disclosure..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Information Types to Disclose</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {informationTypeOptions.map((option) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={authForm.informationTypes.includes(option.id)}
                          onCheckedChange={(c) => {
                            if (c) {
                              setAuthForm({ ...authForm, informationTypes: [...authForm.informationTypes, option.id] })
                            } else {
                              setAuthForm({
                                ...authForm,
                                informationTypes: authForm.informationTypes.filter((t) => t !== option.id),
                              })
                            }
                          }}
                        />
                        <Label className="text-sm">{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Effective Date *</Label>
                    <Input
                      type="date"
                      value={authForm.effectiveDate}
                      onChange={(e) => setAuthForm({ ...authForm, effectiveDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <Input
                      type="date"
                      value={authForm.expirationDate}
                      onChange={(e) => setAuthForm({ ...authForm, expirationDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateAuthOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAuth}
                  disabled={!authForm.patientId || !authForm.externalProviderId || !authForm.purpose}
                >
                  Create Authorization
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Referral Dialog */}
          <Dialog open={createReferralOpen} onOpenChange={setCreateReferralOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Provider Referral</DialogTitle>
                <DialogDescription>Refer a patient to a community provider or specialist</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient *</Label>
                  <Select
                    value={referralForm.patientId}
                    onValueChange={(v) => setReferralForm({ ...referralForm, patientId: v })}
                  >
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
                  <Label>Refer To *</Label>
                  <Select
                    value={referralForm.externalProviderId}
                    onValueChange={(v) => setReferralForm({ ...referralForm, externalProviderId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {externalProviders.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.organization_name} - {p.provider_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Referral Type *</Label>
                  <Select
                    value={referralForm.referralType}
                    onValueChange={(v) => setReferralForm({ ...referralForm, referralType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary_care">Primary Care</SelectItem>
                      <SelectItem value="psychiatry">Psychiatry</SelectItem>
                      <SelectItem value="mental_health">Mental Health Counseling</SelectItem>
                      <SelectItem value="medical_specialist">Medical Specialist</SelectItem>
                      <SelectItem value="dental">Dental Care</SelectItem>
                      <SelectItem value="housing">Housing Services</SelectItem>
                      <SelectItem value="employment">Employment Services</SelectItem>
                      <SelectItem value="social_services">Social Services</SelectItem>
                      <SelectItem value="peer_support">Peer Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason for Referral *</Label>
                  <Textarea
                    value={referralForm.referralReason}
                    onChange={(e) => setReferralForm({ ...referralForm, referralReason: e.target.value })}
                    placeholder="Describe the reason for this referral..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Clinical Information</Label>
                  <Textarea
                    value={referralForm.clinicalInformation}
                    onChange={(e) => setReferralForm({ ...referralForm, clinicalInformation: e.target.value })}
                    placeholder="Relevant clinical information to share..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Urgency</Label>
                    <Select
                      value={referralForm.urgency}
                      onValueChange={(v) => setReferralForm({ ...referralForm, urgency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergent">Emergent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Date</Label>
                    <Input
                      type="date"
                      value={referralForm.preferredDate}
                      onChange={(e) => setReferralForm({ ...referralForm, preferredDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateReferralOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateReferral}
                  disabled={
                    !referralForm.patientId ||
                    !referralForm.externalProviderId ||
                    !referralForm.referralType ||
                    !referralForm.referralReason
                  }
                >
                  Create Referral
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Response Review Dialog */}
          <Dialog open={responseReviewOpen} onOpenChange={setResponseReviewOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Review External Provider Response</DialogTitle>
                <DialogDescription>
                  Review and approve this response to import it into the patient's chart as a progress note
                </DialogDescription>
              </DialogHeader>
              {selectedResponse && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Patient</Label>
                      <p className="text-sm font-medium">
                        {selectedResponse.patients?.first_name} {selectedResponse.patients?.last_name}
                      </p>
                    </div>
                    <div>
                      <Label>External Provider</Label>
                      <p className="text-sm font-medium">{selectedResponse.external_providers?.provider_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedResponse.external_providers?.organization_name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Referral Type</Label>
                    <p className="text-sm">{selectedResponse.referral_type}</p>
                  </div>
                  <div>
                    <Label>Original Referral Reason</Label>
                    <p className="text-sm">{selectedResponse.referral_reason}</p>
                  </div>
                  <div>
                    <Label>External Provider Response</Label>
                    <ScrollArea className="h-[200px] p-4 border rounded-md bg-muted">
                      <p className="text-sm whitespace-pre-wrap">{selectedResponse.external_provider_response}</p>
                    </ScrollArea>
                  </div>
                  <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Import to Patient Chart</p>
                        <p className="text-xs text-muted-foreground">
                          This will create a new progress note in the patient's chart with the external provider's
                          response. The note will be tagged as a consultation and linked to this referral.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setResponseReviewOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReviewResponse(selectedResponse.id, "needs_revision", false)
                  }}
                >
                  Request Revision
                </Button>
                <Button
                  onClick={() => {
                    handleReviewResponse(selectedResponse.id, "approved", true)
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve & Import to Chart
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
