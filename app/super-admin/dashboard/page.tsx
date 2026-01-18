"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Building2, Plus, Users, CreditCard, Activity, LinkIcon, Copy, Check, ExternalLink, Send } from "lucide-react"
import { useState } from "react"
import useSWR from "swr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SuperAdminDashboard() {
  const { data: organizations, mutate } = useSWR("/api/super-admin/organizations", fetcher)
  const [newOrgOpen, setNewOrgOpen] = useState(false)
  const [onboardingLinkOpen, setOnboardingLinkOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  const [formData, setFormData] = useState({
    organization_name: "",
    organization_slug: "",
    organization_type: "behavioral_health",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "MI",
    zip_code: "",
  })

  const handleCreateOrganization = async () => {
    if (!formData.organization_name || !formData.organization_slug || !formData.email) {
      console.error("[v0] Missing required fields")
      return
    }

    try {
      console.log("[v0] Creating organization with data:", formData)
      const response = await fetch("/api/super-admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newOrg = await response.json()
        console.log("[v0] Organization created successfully:", newOrg)
        setNewOrgOpen(false)
        mutate()

        window.open(`/clinic-onboarding?org_id=${newOrg.id}`, "_blank")

        setFormData({
          organization_name: "",
          organization_slug: "",
          organization_type: "behavioral_health",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "MI",
          zip_code: "",
        })
      } else {
        const error = await response.json()
        console.error("[v0] Failed to create organization:", error)
      }
    } catch (error) {
      console.error("[v0] Create organization error:", error)
    }
  }

  const generateOnboardingLink = (orgId: string, type: "onboarding" | "signup" | "invite") => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    switch (type) {
      case "onboarding":
        return `${baseUrl}/clinic-onboarding?org_id=${orgId}`
      case "signup":
        return `${baseUrl}/signup?org_id=${orgId}&ref=admin`
      case "invite":
        return `${baseUrl}/invite?org_id=${orgId}&token=${btoa(Date.now().toString())}`
      default:
        return `${baseUrl}/clinic-onboarding?org_id=${orgId}`
    }
  }

  const copyToClipboard = async (link: string, type: string) => {
    try {
      // Try modern clipboard API first
      window.focus()
      await navigator.clipboard.writeText(link)
      setCopiedLink(type)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      console.error("[v0] Failed to copy:", error)
      // Fallback to textarea method
      try {
        const textarea = document.createElement("textarea")
        textarea.value = link
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        const successful = document.execCommand("copy")
        document.body.removeChild(textarea)

        if (successful) {
          setCopiedLink(type)
          setTimeout(() => setCopiedLink(null), 2000)
        }
      } catch (fallbackError) {
        console.error("[v0] Fallback copy also failed:", fallbackError)
      }
    }
  }

  const sendEmailInvite = async () => {
    if (!selectedOrg || !inviteEmail) return

    try {
      // In production, this would call an API to send the email
      // For now, we'll simulate success
      setEmailSent(true)
      setTimeout(() => {
        setEmailSent(false)
        setInviteEmail("")
      }, 3000)
    } catch (error) {
      console.error("[v0] Send invite error:", error)
    }
  }

  const openLinkDialog = (org: any) => {
    setSelectedOrg(org)
    setOnboardingLinkOpen(true)
  }

  const stats = [
    { icon: Building2, label: "Total Clinics", value: organizations?.length || 0, color: "text-blue-600" },
    {
      icon: Users,
      label: "Total Users",
      value: organizations?.reduce((acc: number, org: { user_count: number }) => acc + org.user_count, 0) || 0,
      color: "text-green-600",
    },
    {
      icon: CreditCard,
      label: "Active Subscriptions",
      value: organizations?.filter((org: { status: string }) => org.status === "active").length || 0,
      color: "text-purple-600",
    },
    { icon: Activity, label: "System Health", value: "99.9%", color: "text-green-600" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 lg:pl-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Manager Dashboard</h1>
          <p className="text-muted-foreground">Manage organizations, subscriptions, and system settings</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Organizations List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>Manage all clinics and practices</CardDescription>
              </div>
              <Dialog open={newOrgOpen} onOpenChange={setNewOrgOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Organization
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Organization Name *</Label>
                        <Input
                          value={formData.organization_name}
                          onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                          placeholder="MASE Behavioral Health"
                          required
                        />
                      </div>
                      <div>
                        <Label>Slug (URL) *</Label>
                        <Input
                          value={formData.organization_slug}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              organization_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                            })
                          }
                          placeholder="mase-behavioral"
                          required
                        />
                      </div>
                      <div>
                        <Label>Organization Type</Label>
                        <Select
                          value={formData.organization_type}
                          onValueChange={(value) => setFormData({ ...formData, organization_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="behavioral_health">Behavioral Health</SelectItem>
                            <SelectItem value="primary_care">Primary Care</SelectItem>
                            <SelectItem value="multi_specialty">Multi-Specialty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="info@clinic.com"
                          required
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="555-0100"
                        />
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Detroit"
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="MI"
                        />
                      </div>
                      <div>
                        <Label>Zip Code</Label>
                        <Input
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                          placeholder="48201"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">* Required fields</p>
                    <Button
                      onClick={handleCreateOrganization}
                      className="w-full"
                      disabled={!formData.organization_name || !formData.organization_slug || !formData.email}
                    >
                      Create Organization
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations?.map(
                (org: {
                  id: string
                  organization_name: string
                  organization_type: string
                  status: string
                  user_count: number
                  email?: string
                }) => (
                  <Card key={org.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{org.organization_name}</CardTitle>
                          <CardDescription className="capitalize">
                            {org.organization_type.replace("_", " ")}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="sm" onClick={() => openLinkDialog(org)}>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Get Links
                          </Button>
                          <div className="text-right">
                            <div
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                org.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {org.status}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">{org.user_count} users</div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ),
              )}

              {/* Empty state */}
              {(!organizations || organizations.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No organizations yet. Create your first organization to get started.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={onboardingLinkOpen} onOpenChange={setOnboardingLinkOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Organization Links</DialogTitle>
              <DialogDescription>
                Generate and share onboarding links for {selectedOrg?.organization_name}
              </DialogDescription>
            </DialogHeader>

            {selectedOrg && (
              <Tabs defaultValue="links" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="links">Copy Links</TabsTrigger>
                  <TabsTrigger value="email">Send Email</TabsTrigger>
                </TabsList>

                <TabsContent value="links" className="space-y-4 mt-4">
                  {/* Onboarding Link */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Clinic Onboarding Link</Label>
                    <p className="text-xs text-muted-foreground">Full setup wizard for new clinics</p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={generateOnboardingLink(selectedOrg.id, "onboarding")}
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(generateOnboardingLink(selectedOrg.id, "onboarding"), "onboarding")
                        }
                      >
                        {copiedLink === "onboarding" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(generateOnboardingLink(selectedOrg.id, "onboarding"), "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Signup Link */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">User Signup Link</Label>
                    <p className="text-xs text-muted-foreground">Quick signup for staff members</p>
                    <div className="flex gap-2">
                      <Input readOnly value={generateOnboardingLink(selectedOrg.id, "signup")} className="text-xs" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generateOnboardingLink(selectedOrg.id, "signup"), "signup")}
                      >
                        {copiedLink === "signup" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(generateOnboardingLink(selectedOrg.id, "signup"), "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Invite Link */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Staff Invite Link</Label>
                    <p className="text-xs text-muted-foreground">Time-limited invite for staff</p>
                    <div className="flex gap-2">
                      <Input readOnly value={generateOnboardingLink(selectedOrg.id, "invite")} className="text-xs" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generateOnboardingLink(selectedOrg.id, "invite"), "invite")}
                      >
                        {copiedLink === "invite" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(generateOnboardingLink(selectedOrg.id, "invite"), "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Recipient Email</Label>
                    <Input
                      type="email"
                      placeholder="admin@clinic.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-sm font-medium">Email Preview:</p>
                    <p className="text-xs text-muted-foreground">Subject: Your MASE EMR Onboarding Link</p>
                    <p className="text-xs text-muted-foreground">
                      Hello, you have been invited to set up {selectedOrg.organization_name} on MASE EMR. Click the link
                      below to complete your organization setup...
                    </p>
                  </div>

                  <Button className="w-full" onClick={sendEmailInvite} disabled={!inviteEmail || emailSent}>
                    {emailSent ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Email Sent!
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
