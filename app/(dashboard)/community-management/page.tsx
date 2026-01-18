"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Users,
  UserPlus,
  FileText,
  Send,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  Download,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

const Loading = () => null

export default function CommunityManagementPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const searchParams = useSearchParams()

  // Mock data for community outreach metrics
  const metrics = {
    totalLeads: 247,
    newProviderRegistrations: 34,
    screeningSubmissions: 156,
    referralRequests: 87,
    pendingFollowups: 23,
    conversionRate: 64.2,
  }

  // Mock provider registrations
  const providerRegistrations = [
    {
      id: "PR-001",
      organizationName: "Hope Recovery Center",
      providerName: "Dr. Sarah Johnson",
      providerType: "Outpatient Treatment",
      email: "sjohnson@hoperecovery.org",
      phone: "(313) 555-0123",
      registeredDate: "2024-01-15",
      status: "pending_verification",
      npiNumber: "1234567890",
    },
    {
      id: "PR-002",
      organizationName: "Wellness Counseling Services",
      providerName: "Michael Chen, LMSW",
      providerType: "Mental Health Counseling",
      email: "mchen@wellnesscounseling.com",
      phone: "(313) 555-0456",
      registeredDate: "2024-01-14",
      status: "approved",
      npiNumber: "0987654321",
    },
    {
      id: "PR-003",
      organizationName: "Bridge House Detroit",
      providerName: "Angela Martinez",
      providerType: "Residential Treatment",
      email: "amartinez@bridgehouse.org",
      phone: "(313) 555-0789",
      registeredDate: "2024-01-13",
      status: "pending_verification",
      npiNumber: "5647382910",
    },
  ]

  // Mock screening submissions
  const screeningSubmissions = [
    {
      id: "SC-001",
      patientName: "John D.",
      age: 34,
      zipCode: "48201",
      riskLevel: "HIGH",
      screeningType: "DAST-10",
      score: 8,
      submittedDate: "2024-01-15 10:30 AM",
      status: "needs_followup",
      phone: "(313) 555-1111",
      email: "johnd@email.com",
    },
    {
      id: "SC-002",
      patientName: "Maria S.",
      age: 28,
      zipCode: "48202",
      riskLevel: "MODERATE",
      screeningType: "PHQ-9",
      score: 12,
      submittedDate: "2024-01-15 09:15 AM",
      status: "contacted",
      phone: "(313) 555-2222",
      email: "marias@email.com",
    },
    {
      id: "SC-003",
      patientName: "Robert K.",
      age: 42,
      zipCode: "48203",
      riskLevel: "CRITICAL",
      screeningType: "AUDIT-C",
      score: 9,
      submittedDate: "2024-01-14 04:45 PM",
      status: "needs_followup",
      phone: "(313) 555-3333",
      email: "robertk@email.com",
    },
  ]

  // Mock referral requests
  const referralRequests = [
    {
      id: "REF-001",
      patientName: "Lisa M.",
      age: 31,
      referringOrg: "St. John Hospital ER",
      serviceNeeded: "MAT Program",
      urgency: "urgent",
      submittedDate: "2024-01-15 11:20 AM",
      status: "pending_assignment",
      insurance: "Medicaid",
      phone: "(313) 555-4444",
    },
    {
      id: "REF-002",
      patientName: "David P.",
      age: 45,
      referringOrg: "Wayne County Courts",
      serviceNeeded: "Outpatient Counseling",
      urgency: "routine",
      submittedDate: "2024-01-15 08:30 AM",
      status: "assigned",
      insurance: "Blue Cross",
      phone: "(313) 555-5555",
    },
    {
      id: "REF-003",
      patientName: "Jennifer W.",
      age: 26,
      referringOrg: "Detroit Recovery Center",
      serviceNeeded: "Residential Treatment",
      urgency: "urgent",
      submittedDate: "2024-01-14 02:15 PM",
      status: "pending_assignment",
      insurance: "Uninsured",
      phone: "(313) 555-6666",
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending_verification: { color: "bg-yellow-100 text-yellow-800", label: "Pending Verification" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      needs_followup: { color: "bg-red-100 text-red-800", label: "Needs Follow-up" },
      contacted: { color: "bg-blue-100 text-blue-800", label: "Contacted" },
      pending_assignment: { color: "bg-orange-100 text-orange-800", label: "Pending Assignment" },
      assigned: { color: "bg-purple-100 text-purple-800", label: "Assigned" },
    }
    const config = variants[status] || { color: "bg-gray-100 text-gray-800", label: status }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "bg-red-600 text-white",
      HIGH: "bg-orange-500 text-white",
      MODERATE: "bg-yellow-500 text-white",
      LOW: "bg-green-500 text-white",
    }
    return <Badge className={colors[risk] || "bg-gray-500 text-white"}>{risk}</Badge>
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Community Outreach Management</h1>
            <p className="text-muted-foreground">Monitor all leads, registrations, screenings, and referrals</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics.totalLeads}</div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-green-600 mt-1">+18% this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics.newProviderRegistrations}</div>
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-green-600 mt-1">+12 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Screenings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics.screeningSubmissions}</div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-green-600 mt-1">+23% this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics.referralRequests}</div>
                <Send className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-orange-600 mt-1">15 pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics.pendingFollowups}</div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-red-600 mt-1">Action required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-green-600 mt-1">+5.2% vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different lead types */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="providers">Provider Registrations ({providerRegistrations.length})</TabsTrigger>
            <TabsTrigger value="screenings">Screening Submissions ({screeningSubmissions.length})</TabsTrigger>
            <TabsTrigger value="referrals">Referral Requests ({referralRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest community outreach interactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { type: "provider", name: "Hope Recovery Center", time: "5 mins ago", icon: UserPlus },
                    { type: "screening", name: "John D. - HIGH risk", time: "12 mins ago", icon: AlertCircle },
                    { type: "referral", name: "Lisa M. - MAT urgent", time: "25 mins ago", icon: Send },
                    { type: "screening", name: "Maria S. - MODERATE", time: "1 hour ago", icon: FileText },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 border rounded">
                      <activity.icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Follow-ups</CardTitle>
                  <CardDescription>High-priority leads requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {screeningSubmissions
                    .filter((s) => s.riskLevel === "CRITICAL" || s.riskLevel === "HIGH")
                    .map((screening) => (
                      <div key={screening.id} className="flex items-center gap-4 p-4 border border-red-200 rounded bg-red-50">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{screening.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {screening.screeningType} Score: {screening.score}
                          </p>
                        </div>
                        {getRiskBadge(screening.riskLevel)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(screening)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                        </Button>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Provider Registrations</CardTitle>
                    <CardDescription>Community providers requesting network access</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search providers..."
                        className="pl-8 w-[250px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {providerRegistrations.map((provider) => (
                    <div key={provider.id} className="flex items-center gap-4 p-4 border rounded hover:bg-accent">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{provider.organizationName}</h4>
                          {getStatusBadge(provider.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {provider.providerName} • {provider.providerType}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {provider.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {provider.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {provider.registeredDate}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(provider)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {provider.status === "pending_verification" && (
                          <>
                            <Button size="sm" variant="default" onClick={() => alert("Provider approved!")}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="screenings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Screening Submissions</CardTitle>
                    <CardDescription>Patient self-assessments from community portal</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search screenings..."
                        className="pl-8 w-[250px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {screeningSubmissions.map((screening) => (
                    <div key={screening.id} className="flex items-center gap-4 p-4 border rounded hover:bg-accent">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{screening.patientName}</h4>
                          {getRiskBadge(screening.riskLevel)}
                          {getStatusBadge(screening.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {screening.screeningType} Score: {screening.score}/10 • Age {screening.age}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {screening.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {screening.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {screening.zipCode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {screening.submittedDate}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(screening)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        {screening.status === "needs_followup" && (
                          <Button size="sm" variant="default" onClick={() => alert("Follow-up initiated!")}>
                            <Phone className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                        )}
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Referral Requests</CardTitle>
                    <CardDescription>Incoming referrals from community partners</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search referrals..."
                        className="pl-8 w-[250px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {referralRequests.map((referral) => (
                    <div key={referral.id} className="flex items-center gap-4 p-4 border rounded hover:bg-accent">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{referral.patientName}</h4>
                          <Badge className={referral.urgency === "urgent" ? "bg-red-600" : "bg-blue-600"}>
                            {referral.urgency}
                          </Badge>
                          {getStatusBadge(referral.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {referral.serviceNeeded} • Referred by: {referral.referringOrg}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Age {referral.age}</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {referral.phone}
                          </span>
                          <span>Insurance: {referral.insurance}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {referral.submittedDate}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(referral)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        {referral.status === "pending_assignment" && (
                          <Button size="sm" variant="default" onClick={() => alert("Referral assigned!")}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Details Modal */}
        {showDetailsModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailsModal(false)}>
            <Card className="w-full max-w-2xl m-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowDetailsModal(false)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded overflow-auto">{JSON.stringify(selectedItem, null, 2)}</pre>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1">Take Action</Button>
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Suspense>
  )
}
