"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Building2,
  Send,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Network,
  Shield,
  Heart,
  Home,
  Search,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

export default function CollaborationDashboard() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [externalProviders, setExternalProviders] = useState<any[]>([])
  const [collaborationNotes, setCollaborationNotes] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [dcoOrganizations, setDcoOrganizations] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])

  // New referral state
  const [showNewReferral, setShowNewReferral] = useState(false)
  const [newReferral, setNewReferral] = useState({
    patientId: "",
    externalProviderId: "",
    referralType: "consultation",
    referralReason: "",
    clinicalInformation: "",
    diagnosisCodes: "",
    urgency: "routine",
    preferredDate: "",
  })

  // New collaboration note state
  const [showNewNote, setShowNewNote] = useState(false)
  const [newNote, setNewNote] = useState({
    patientId: "",
    externalProviderId: "",
    noteType: "consultation",
    subject: "",
    noteContent: "",
    isUrgent: false,
    requiresResponse: false,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load collaboration data
      const [collabRes, notesRes, referralsRes, dcoRes] = await Promise.all([
        fetch("/api/provider-collaboration"),
        fetch("/api/provider-collaboration?type=collaboration-notes"),
        fetch("/api/provider-collaboration?type=referrals"),
        fetch("/api/ccbhc/dco-organizations"),
      ])

      const collabData = await collabRes.json()
      const notesData = await notesRes.json()
      const referralsData = await referralsRes.json()
      const dcoData = await dcoRes.json()

      setMetrics(collabData.metrics)
      setExternalProviders(collabData.externalProviders || [])
      setPatients(collabData.patients || [])
      setCollaborationNotes(notesData.notes || [])
      setReferrals(referralsData.referrals || [])
      setDcoOrganizations(dcoData.organizations || [])
    } catch (error) {
      console.error("[v0] Error loading collaboration data:", error)
      toast({
        title: "Error Loading Data",
        description: "Failed to load collaboration dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReferral = async () => {
    try {
      const response = await fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-referral",
          ...newReferral,
          referringProviderId: "current-user-id", // Would come from auth
          diagnosisCodes: newReferral.diagnosisCodes.split(",").map((c) => c.trim()),
        }),
      })

      if (response.ok) {
        toast({
          title: "Referral Created",
          description: "Referral sent to external provider successfully",
        })
        setShowNewReferral(false)
        loadDashboardData()
        setNewReferral({
          patientId: "",
          externalProviderId: "",
          referralType: "consultation",
          referralReason: "",
          clinicalInformation: "",
          diagnosisCodes: "",
          urgency: "routine",
          preferredDate: "",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create referral",
        variant: "destructive",
      })
    }
  }

  const handleSendNote = async () => {
    try {
      const response = await fetch("/api/provider-collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-note",
          ...newNote,
          internalProviderId: "current-user-id", // Would come from auth
        }),
      })

      if (response.ok) {
        toast({
          title: "Note Sent",
          description: "Collaboration note sent successfully",
        })
        setShowNewNote(false)
        loadDashboardData()
        setNewNote({
          patientId: "",
          externalProviderId: "",
          noteType: "consultation",
          subject: "",
          noteContent: "",
          isUrgent: false,
          requiresResponse: false,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send note",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading collaboration network...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community Collaboration Network</h1>
          <p className="text-muted-foreground">Integrated EMR & community outreach provider collaboration system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/community-outreach" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Community Portal
            </a>
          </Button>
          <Dialog open={showNewReferral} onOpenChange={setShowNewReferral}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                New Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Community Referral</DialogTitle>
                <DialogDescription>Refer patient to external community provider or DCO</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select
                    value={newReferral.patientId}
                    onValueChange={(v) => setNewReferral({ ...newReferral, patientId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>External Provider / DCO</Label>
                  <Select
                    value={newReferral.externalProviderId}
                    onValueChange={(v) => setNewReferral({ ...newReferral, externalProviderId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {externalProviders.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.provider_name} - {p.organization_name}
                        </SelectItem>
                      ))}
                      {dcoOrganizations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          [DCO] {d.organization_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Referral Type</Label>
                  <Select
                    value={newReferral.referralType}
                    onValueChange={(v) => setNewReferral({ ...newReferral, referralType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="treatment">Treatment</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="case_management">Case Management</SelectItem>
                      <SelectItem value="housing">Housing Support</SelectItem>
                      <SelectItem value="employment">Employment Services</SelectItem>
                      <SelectItem value="legal">Legal Aid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select
                    value={newReferral.urgency}
                    onValueChange={(v) => setNewReferral({ ...newReferral, urgency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="stat">STAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Referral Reason</Label>
                  <Textarea
                    value={newReferral.referralReason}
                    onChange={(e) => setNewReferral({ ...newReferral, referralReason: e.target.value })}
                    placeholder="Brief reason for referral"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Clinical Information</Label>
                  <Textarea
                    value={newReferral.clinicalInformation}
                    onChange={(e) => setNewReferral({ ...newReferral, clinicalInformation: e.target.value })}
                    placeholder="Relevant clinical information for the external provider"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Diagnosis Codes (comma-separated)</Label>
                  <Input
                    value={newReferral.diagnosisCodes}
                    onChange={(e) => setNewReferral({ ...newReferral, diagnosisCodes: e.target.value })}
                    placeholder="F10.20, F31.1, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preferred Appointment Date</Label>
                  <Input
                    type="date"
                    value={newReferral.preferredDate}
                    onChange={(e) => setNewReferral({ ...newReferral, preferredDate: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreateReferral} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Referral
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Partners</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalPartners || 0}</div>
            <p className="text-xs text-muted-foreground">Including {dcoOrganizations.length} DCOs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Authorizations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeAuthorizations || 0}</div>
            <p className="text-xs text-muted-foreground">Patient data sharing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.unreadMessages || 0}</div>
            <p className="text-xs text-muted-foreground">Collaboration notes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="external-providers">External Providers</TabsTrigger>
          <TabsTrigger value="dco-network">DCO Network</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="community-outreach">Community Outreach</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrated Community Network</CardTitle>
              <CardDescription>
                The EMR collaboration system is fully integrated with the community outreach portal, enabling seamless
                care coordination across the entire behavioral health ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center">
                    <Building2 className="mr-2 h-5 w-5 text-primary" />
                    EMR Provider Collaboration
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-7">
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      External provider referrals
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      Secure clinical messaging
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      Patient data sharing authorizations
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      Chart documentation integration
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      HIPAA-compliant communication
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center">
                    <Heart className="mr-2 h-5 w-5 text-primary" />
                    Community Outreach Integration
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-7">
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      DCO (Designated Collaborating Organization) network
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      Anonymous screening portal
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      Community resource referrals
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      External provider portal access
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                      Shelter, food bank, and resource locators
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">How It Works Together</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Unified Patient Journey</div>
                      <div>
                        External providers submit referrals via the public portal, which are received directly in the
                        EMR workflow
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Bidirectional Communication</div>
                      <div>
                        Internal staff can refer patients to DCO partners for housing, employment, legal aid, and other
                        social services
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Compliance Built-In</div>
                      <div>
                        All communications follow 42 CFR Part 2 and HIPAA requirements with audit logging and patient
                        consent management
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.slice(0, 5).map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {ref.patients?.first_name} {ref.patients?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">To: {ref.external_providers?.provider_name}</div>
                    </div>
                    <Badge variant={ref.status === "completed" ? "default" : "secondary"}>{ref.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Collaboration Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {collaborationNotes.slice(0, 5).map((note) => (
                  <div key={note.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="space-y-1 flex-1">
                      <div className="text-sm font-medium">{note.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        From: {note.providers?.first_name} {note.providers?.last_name}
                      </div>
                    </div>
                    {!note.is_read && (
                      <Badge variant="default" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="external-providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Provider Network</CardTitle>
              <CardDescription>Community providers and organizations in the collaboration network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {externalProviders.map((provider) => (
                  <div key={provider.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{provider.provider_name}</div>
                        <div className="text-sm text-muted-foreground">{provider.organization_name}</div>
                      </div>
                      <Badge variant={provider.is_active ? "default" : "secondary"}>
                        {provider.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.provider_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.specialty}</span>
                      </div>
                      {provider.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{provider.phone}</span>
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{provider.email}</span>
                        </div>
                      )}
                    </div>

                    {provider.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span>
                          {provider.address}, {provider.city}, {provider.state} {provider.zip_code}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewReferral({ ...newReferral, externalProviderId: provider.id })
                          setShowNewReferral(true)
                        }}
                      >
                        <Send className="mr-2 h-3 w-3" />
                        Send Referral
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewNote({ ...newNote, externalProviderId: provider.id })
                          setShowNewNote(true)
                        }}
                      >
                        <MessageSquare className="mr-2 h-3 w-3" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dco-network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Designated Collaborating Organizations (DCO)</CardTitle>
              <CardDescription>CCBHC-certified community partners for comprehensive care coordination</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dcoOrganizations.map((dco) => (
                  <div key={dco.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {dco.organization_name}
                          {dco.mou_signed && (
                            <Badge variant="default" className="text-xs">
                              MOU Signed
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{dco.organization_type}</div>
                      </div>
                      <Badge variant={dco.is_active ? "default" : "secondary"}>
                        {dco.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {dco.services_offered && (
                      <div className="flex flex-wrap gap-2">
                        {(dco.services_offered as string[]).map((service, idx) => (
                          <Badge key={idx} variant="outline">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Referrals Sent</div>
                        <div className="font-semibold">{dco.referrals_sent_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Completed</div>
                        <div className="font-semibold">{dco.referrals_completed_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Response</div>
                        <div className="font-semibold">{dco.average_response_time_days || 0} days</div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setNewReferral({ ...newReferral, externalProviderId: dco.id })
                          setShowNewReferral(true)
                        }}
                      >
                        <Send className="mr-2 h-3 w-3" />
                        Refer Patient
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Referrals</CardTitle>
              <CardDescription>Outbound and inbound referral management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((ref) => (
                  <div key={ref.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">
                          {ref.patients?.first_name} {ref.patients?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ref.referral_type} - {ref.external_providers?.provider_name}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            ref.urgency === "stat" ? "destructive" : ref.urgency === "urgent" ? "default" : "secondary"
                          }
                        >
                          {ref.urgency}
                        </Badge>
                        <Badge
                          variant={
                            ref.status === "completed" ? "default" : ref.status === "pending" ? "secondary" : "outline"
                          }
                        >
                          {ref.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-sm">{ref.referral_reason}</div>

                    {ref.external_provider_response && (
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <div className="font-medium mb-1">External Provider Response:</div>
                        <div>{ref.external_provider_response}</div>
                      </div>
                    )}

                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Created: {new Date(ref.created_at).toLocaleDateString()}</span>
                      {ref.response_received_at && (
                        <span>• Response: {new Date(ref.response_received_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Collaboration Messages</h2>
              <p className="text-muted-foreground">Secure clinical communication with external providers</p>
            </div>
            <Dialog open={showNewNote} onOpenChange={setShowNewNote}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Collaboration Note</DialogTitle>
                  <DialogDescription>Send a secure message to an external provider</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Select value={newNote.patientId} onValueChange={(v) => setNewNote({ ...newNote, patientId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.first_name} {p.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>External Provider</Label>
                    <Select
                      value={newNote.externalProviderId}
                      onValueChange={(v) => setNewNote({ ...newNote, externalProviderId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {externalProviders.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.provider_name} - {p.organization_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Message Type</Label>
                    <Select value={newNote.noteType} onValueChange={(v) => setNewNote({ ...newNote, noteType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation Request</SelectItem>
                        <SelectItem value="update">Patient Update</SelectItem>
                        <SelectItem value="coordination">Care Coordination</SelectItem>
                        <SelectItem value="discharge">Discharge Planning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={newNote.subject}
                      onChange={(e) => setNewNote({ ...newNote, subject: e.target.value })}
                      placeholder="Message subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={newNote.noteContent}
                      onChange={(e) => setNewNote({ ...newNote, noteContent: e.target.value })}
                      placeholder="Enter your message"
                      rows={6}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newNote.isUrgent}
                        onChange={(e) => setNewNote({ ...newNote, isUrgent: e.target.checked })}
                        className="rounded"
                      />
                      Mark as urgent
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newNote.requiresResponse}
                        onChange={(e) => setNewNote({ ...newNote, requiresResponse: e.target.checked })}
                        className="rounded"
                      />
                      Requires response
                    </label>
                  </div>

                  <Button onClick={handleSendNote} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {collaborationNotes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{note.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          Patient: {note.patients?.first_name} {note.patients?.last_name}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {note.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                        {!note.is_read && <Badge>Unread</Badge>}
                        <Badge variant="outline">{note.note_type}</Badge>
                      </div>
                    </div>

                    <div className="text-sm">{note.note_content}</div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        From: {note.providers?.first_name} {note.providers?.last_name} →{" "}
                        {note.external_providers?.provider_name}
                      </span>
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>

                    {note.requires_response && !note.is_read && (
                      <Button size="sm" variant="outline">
                        <MessageSquare className="mr-2 h-3 w-3" />
                        Reply
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community-outreach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Outreach Integration</CardTitle>
              <CardDescription>How the community portal connects with the EMR collaboration system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="bg-primary/10 rounded-full p-3 w-fit">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div className="font-semibold">Anonymous Screening</div>
                  <div className="text-sm text-muted-foreground">
                    Public can complete PHQ-9, GAD-7, and other assessments anonymously through the community portal
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="bg-primary/10 rounded-full p-3 w-fit">
                    <ExternalLink className="h-6 w-6 text-primary" />
                  </div>
                  <div className="font-semibold">External Referrals</div>
                  <div className="text-sm text-muted-foreground">
                    Primary care, ER, and community providers can submit referrals directly through the portal
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="bg-primary/10 rounded-full p-3 w-fit">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div className="font-semibold">Resource Locators</div>
                  <div className="text-sm text-muted-foreground">
                    Integrated shelter, food bank, and narcan distribution site finders for holistic care
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Portal Access Links</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <a href="/community-outreach" target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Community Outreach Portal (Public)
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <a href="/external-transfer" target="_blank" rel="noreferrer">
                      <Send className="mr-2 h-4 w-4" />
                      External Provider Referral Portal
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <a href="/public/screening" target="_blank" rel="noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Anonymous Mental Health Screening
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
