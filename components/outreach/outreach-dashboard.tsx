"use client"

import { useState } from "react"
import {
  Users,
  Phone,
  Calendar,
  Clock,
  Filter,
  Search,
  MoreVertical,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  User,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ReferralDetailSheet } from "./referral-detail-sheet"

// Mock data for referrals
const mockReferrals = [
  {
    id: "REF-001",
    clientName: "Sarah Johnson",
    referralType: "self",
    status: "new",
    urgency: "urgent",
    concerns: ["Anxiety", "Depression"],
    submittedAt: "2025-01-08T10:30:00",
    email: "sarah.j@email.com",
    phone: "(555) 123-4567",
    preferredContact: "phone",
    insurance: "Private Insurance",
    lastContact: null,
    notes: [],
  },
  {
    id: "REF-002",
    clientName: "Michael Chen",
    referralType: "professional",
    referrerOrg: "Community Health Center",
    referrerName: "Dr. Lisa Wong",
    status: "contacted",
    urgency: "soon",
    concerns: ["Substance Use", "Trauma / PTSD"],
    submittedAt: "2025-01-07T14:15:00",
    email: "m.chen@email.com",
    phone: "(555) 987-6543",
    preferredContact: "email",
    insurance: "Medicaid",
    lastContact: "2025-01-08T09:00:00",
    notes: [{ date: "2025-01-08", text: "Left voicemail, will try again tomorrow" }],
  },
  {
    id: "REF-003",
    clientName: "Emily Rodriguez",
    referralType: "family",
    status: "scheduled",
    urgency: "routine",
    concerns: ["Grief / Loss", "Sleep Problems"],
    submittedAt: "2025-01-06T09:00:00",
    email: "emily.r@email.com",
    phone: "(555) 456-7890",
    preferredContact: "text",
    insurance: "Medicare",
    lastContact: "2025-01-07T11:30:00",
    appointmentDate: "2025-01-15T10:00:00",
    notes: [{ date: "2025-01-07", text: "Scheduled initial assessment for Jan 15" }],
  },
  {
    id: "REF-004",
    clientName: "James Wilson",
    referralType: "self",
    status: "no-response",
    urgency: "soon",
    concerns: ["Stress Management", "Relationship Issues"],
    submittedAt: "2025-01-04T16:45:00",
    email: "jwilson@email.com",
    phone: "(555) 321-0987",
    preferredContact: "phone",
    insurance: "Uninsured / Self-Pay",
    lastContact: "2025-01-07T14:00:00",
    notes: [
      { date: "2025-01-05", text: "Called, no answer" },
      { date: "2025-01-06", text: "Sent email follow-up" },
      { date: "2025-01-07", text: "Third attempt, no response" },
    ],
  },
  {
    id: "REF-005",
    clientName: "Maria Santos",
    referralType: "professional",
    referrerOrg: "Local School District",
    referrerName: "Counselor Amy Park",
    status: "completed",
    urgency: "urgent",
    concerns: ["Anxiety", "Eating Concerns"],
    submittedAt: "2025-01-03T11:20:00",
    email: "msantos@email.com",
    phone: "(555) 654-3210",
    preferredContact: "phone",
    insurance: "Private Insurance",
    lastContact: "2025-01-05T10:00:00",
    appointmentDate: "2025-01-08T14:00:00",
    notes: [{ date: "2025-01-05", text: "Converted to active patient, assigned to Dr. Thompson" }],
  },
]

const statusConfig = {
  new: { label: "New", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700", icon: Phone },
  scheduled: { label: "Scheduled", color: "bg-green-100 text-green-700", icon: Calendar },
  "no-response": { label: "No Response", color: "bg-orange-100 text-orange-700", icon: XCircle },
  completed: { label: "Completed", color: "bg-teal-100 text-teal-700", icon: CheckCircle2 },
}

const urgencyConfig = {
  routine: { label: "Routine", color: "text-muted-foreground" },
  soon: { label: "Soon", color: "text-yellow-600" },
  urgent: { label: "Urgent", color: "text-red-600" },
}

export function OutreachDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedReferral, setSelectedReferral] = useState<(typeof mockReferrals)[0] | null>(null)

  const stats = {
    total: mockReferrals.length,
    new: mockReferrals.filter((r) => r.status === "new").length,
    pending: mockReferrals.filter((r) => ["contacted", "no-response"].includes(r.status)).length,
    scheduled: mockReferrals.filter((r) => r.status === "scheduled").length,
  }

  const filteredReferrals = mockReferrals.filter((referral) => {
    const matchesSearch =
      referral.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community Outreach</h1>
          <p className="text-sm text-muted-foreground">Manage incoming referrals and outreach follow-ups</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New (Today)</p>
                <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Follow-up</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-3xl font-bold text-green-600">{stats.scheduled}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Incoming Referrals</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search referrals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="no-response">No Response</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredReferrals.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No referrals found matching your criteria.</p>
              </div>
            ) : (
              filteredReferrals.map((referral) => {
                const status = statusConfig[referral.status as keyof typeof statusConfig]
                const urgency = urgencyConfig[referral.urgency as keyof typeof urgencyConfig]
                const StatusIcon = status.icon

                return (
                  <div
                    key={referral.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        {referral.referralType === "professional" ? (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{referral.clientName}</span>
                          <span className="text-xs text-muted-foreground">{referral.id}</span>
                          <span className={cn("text-xs font-medium", urgency.color)}>{urgency.label}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatDate(referral.submittedAt)}</span>
                          <span>•</span>
                          <span>{referral.concerns.slice(0, 2).join(", ")}</span>
                          {referral.concerns.length > 2 && <span>+{referral.concerns.length - 2} more</span>}
                        </div>
                        {referral.referralType === "professional" && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Referred by: {referral.referrerName} ({referral.referrerOrg})
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("shrink-0", status.color)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedReferral(referral)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedReferral(referral)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedReferral(referral)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Add Note</DropdownMenuItem>
                            <DropdownMenuItem>Update Status</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Schedule Appointment</DropdownMenuItem>
                            <DropdownMenuItem>Convert to Patient</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral Detail Sheet */}
      <ReferralDetailSheet referral={selectedReferral} onClose={() => setSelectedReferral(null)} />
    </div>
  )
}
