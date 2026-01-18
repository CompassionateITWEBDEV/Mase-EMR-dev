"use client"

import { useState, useEffect } from "react"
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
import { toast } from "sonner"

interface Referral {
  id: string
  referral_number?: string
  referral_type: string
  client_first_name?: string
  client_last_name?: string
  referrer_name?: string
  referrer_organization?: string
  status: string
  urgency_level: string
  primary_concerns?: string[]
  created_at: string
  client_email?: string
  client_phone?: string
  referrer_email?: string
  referrer_phone?: string
  notes_count?: number
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700", icon: Phone },
  scheduled: { label: "Scheduled", color: "bg-green-100 text-green-700", icon: Calendar },
  "no-response": { label: "No Response", color: "bg-orange-100 text-orange-700", icon: XCircle },
  completed: { label: "Completed", color: "bg-teal-100 text-teal-700", icon: CheckCircle2 },
}

const urgencyConfig: Record<string, { label: string; color: string }> = {
  routine: { label: "Routine", color: "text-muted-foreground" },
  soon: { label: "Soon", color: "text-yellow-600" },
  urgent: { label: "Urgent", color: "text-red-600" },
}

export function OutreachDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReferrals()
  }, [])

  const fetchReferrals = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/community-outreach/referrals")
      if (!response.ok) throw new Error("Failed to fetch referrals")
      const data = await response.json()
      setReferrals(data.referrals || [])
    } catch (error: any) {
      console.error("[Outreach Dashboard] Error fetching referrals:", error)
      toast.error("Failed to load referrals")
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: referrals.length,
    new: referrals.filter((r) => r.status === "new").length,
    pending: referrals.filter((r) => ["contacted", "no-response"].includes(r.status)).length,
    scheduled: referrals.filter((r) => r.status === "scheduled").length,
  }

  const filteredReferrals = referrals.filter((referral) => {
    const clientName = `${referral.client_first_name || ""} ${referral.client_last_name || ""}`.trim()
    const matchesSearch =
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (referral.referral_number || referral.id).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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

  const getClientName = (referral: Referral) => {
    if (referral.client_first_name || referral.client_last_name) {
      return `${referral.client_first_name || ""} ${referral.client_last_name || ""}`.trim()
    }
    return "Unknown Client"
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community Outreach</h1>
          <p className="text-sm text-muted-foreground">Manage incoming referrals and outreach follow-ups</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={fetchReferrals}>
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Refresh
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
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
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
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or referral number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="no-response">No Response</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referrals ({filteredReferrals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading referrals...</div>
          ) : filteredReferrals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No referrals found</div>
          ) : (
            <div className="space-y-2">
              {filteredReferrals.map((referral) => {
                const StatusIcon = statusConfig[referral.status]?.icon || AlertCircle
                const statusStyle = statusConfig[referral.status] || statusConfig.new
                const urgencyStyle = urgencyConfig[referral.urgency_level] || urgencyConfig.routine

                return (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{getClientName(referral)}</h3>
                        <Badge style={{ backgroundColor: statusStyle.color.split(" ")[0], color: statusStyle.color.split(" ")[1] }}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusStyle.label}
                        </Badge>
                        <span className={cn("text-xs font-medium", urgencyStyle.color)}>
                          {urgencyStyle.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">
                          {referral.referral_number || `REF-${referral.id.slice(-8)}`}
                        </span>
                        {referral.referrer_organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {referral.referrer_organization}
                          </span>
                        )}
                        {referral.referrer_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {referral.referrer_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(referral.created_at)}
                        </span>
                      </div>
                      {referral.primary_concerns && referral.primary_concerns.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {referral.primary_concerns.slice(0, 3).map((concern, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {concern}
                            </Badge>
                          ))}
                          {referral.primary_concerns.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{referral.primary_concerns.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Phone className="mr-2 h-4 w-4" />
                          Contact
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Add Note</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
