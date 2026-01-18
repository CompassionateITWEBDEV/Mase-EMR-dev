"use client"

import { useState, useEffect } from "react"
import {
  Monitor,
  Users,
  Headphones,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  StopCircle,
  Eye,
  RefreshCw,
  Download,
  Upload,
  Shield,
  Activity,
  Wifi,
  WifiOff,
  Database,
  Globe,
  Terminal,
  FileText,
  Search,
  Filter,
  MoreVertical,
  Send,
  Clipboard,
  MousePointer,
  Keyboard,
  Mic,
  Volume2,
  Maximize2,
  Minimize2,
  Plus,
  Edit,
  Zap,
  Server,
  Cloud,
  Timer,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Types
interface SupportTicket {
  id: string
  ticketNumber: string
  organizationId: string
  organizationName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  subject: string
  description: string
  category: "technical" | "billing" | "training" | "feature_request" | "bug" | "security"
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "in_progress" | "pending_customer" | "escalated" | "resolved" | "closed"
  assignedTo: string | null
  remoteSessionId: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  responseTime: number | null
  resolutionTime: number | null
}

interface RemoteSession {
  id: string
  ticketId: string
  organizationId: string
  organizationName: string
  clientUserId: string
  clientUserName: string
  supportAgentId: string
  supportAgentName: string
  sessionType: "view_only" | "full_control" | "assist"
  status: "requesting" | "connecting" | "active" | "paused" | "ended"
  startedAt: string
  endedAt: string | null
  duration: number
  clientSystemInfo: {
    os: string
    browser: string
    screenResolution: string
    ipAddress: string
    location: string
  }
  permissions: {
    viewScreen: boolean
    controlMouse: boolean
    controlKeyboard: boolean
    fileTransfer: boolean
    clipboard: boolean
    chat: boolean
    audio: boolean
    video: boolean
  }
  recording: boolean
  recordingUrl: string | null
}

interface Organization {
  id: string
  name: string
  subscriptionTier: string
  activeUsers: number
  lastActivity: string
  status: "online" | "offline" | "issues"
  systemHealth: {
    cpu: number
    memory: number
    storage: number
    networkLatency: number
  }
}

interface ChatMessage {
  id: string
  sessionId: string
  senderId: string
  senderName: string
  senderRole: "support" | "client"
  message: string
  timestamp: string
  type: "text" | "file" | "system"
  fileUrl?: string
  fileName?: string
}

// Mock Data
const mockTickets: SupportTicket[] = [
  {
    id: "1",
    ticketNumber: "TKT-2024-001234",
    organizationId: "org-1",
    organizationName: "Sunrise Behavioral Health",
    contactName: "Dr. Sarah Johnson",
    contactEmail: "sarah.johnson@sunrise.health",
    contactPhone: "(555) 123-4567",
    subject: "Unable to access patient records after update",
    description:
      "After the latest system update, several staff members are unable to access patient records. The error message says 'Permission Denied' even for users with admin access.",
    category: "technical",
    priority: "high",
    status: "in_progress",
    assignedTo: "John Smith",
    remoteSessionId: "session-1",
    createdAt: "2024-11-28T09:15:00Z",
    updatedAt: "2024-11-28T10:30:00Z",
    resolvedAt: null,
    responseTime: 15,
    resolutionTime: null,
  },
  {
    id: "2",
    ticketNumber: "TKT-2024-001235",
    organizationId: "org-2",
    organizationName: "Metro OTP Clinic",
    contactName: "Mike Williams",
    contactEmail: "mwilliams@metrootp.com",
    contactPhone: "(555) 234-5678",
    subject: "Methadone dispensing module not calculating doses correctly",
    description:
      "The dispensing module is showing incorrect dose calculations for patients on split doses. This is a critical issue affecting patient safety.",
    category: "bug",
    priority: "critical",
    status: "escalated",
    assignedTo: "Emily Chen",
    remoteSessionId: null,
    createdAt: "2024-11-28T08:00:00Z",
    updatedAt: "2024-11-28T09:45:00Z",
    resolvedAt: null,
    responseTime: 10,
    resolutionTime: null,
  },
  {
    id: "3",
    ticketNumber: "TKT-2024-001236",
    organizationId: "org-3",
    organizationName: "County Health Department",
    contactName: "Lisa Chen",
    contactEmail: "lchen@countyhealth.gov",
    contactPhone: "(555) 345-6789",
    subject: "Training request for new WIC module",
    description:
      "We need training for 5 staff members on the new WIC program module. Prefer to schedule for next week.",
    category: "training",
    priority: "medium",
    status: "open",
    assignedTo: null,
    remoteSessionId: null,
    createdAt: "2024-11-28T07:30:00Z",
    updatedAt: "2024-11-28T07:30:00Z",
    resolvedAt: null,
    responseTime: null,
    resolutionTime: null,
  },
  {
    id: "4",
    ticketNumber: "TKT-2024-001237",
    organizationId: "org-4",
    organizationName: "Valley Rehabilitation Center",
    contactName: "Tom Anderson",
    contactEmail: "tanderson@valleyrehab.com",
    contactPhone: "(555) 456-7890",
    subject: "Feature request: Batch print exercise handouts",
    description:
      "Would like the ability to batch print multiple patient exercise handouts at once for group therapy sessions.",
    category: "feature_request",
    priority: "low",
    status: "open",
    assignedTo: null,
    remoteSessionId: null,
    createdAt: "2024-11-27T14:20:00Z",
    updatedAt: "2024-11-27T14:20:00Z",
    resolvedAt: null,
    responseTime: null,
    resolutionTime: null,
  },
  {
    id: "5",
    ticketNumber: "TKT-2024-001238",
    organizationId: "org-1",
    organizationName: "Sunrise Behavioral Health",
    contactName: "Dr. Sarah Johnson",
    contactEmail: "sarah.johnson@sunrise.health",
    contactPhone: "(555) 123-4567",
    subject: "Billing discrepancy in November invoice",
    description:
      "Our November invoice shows charges for 50 users but we only have 35 active users. Please review and adjust.",
    category: "billing",
    priority: "medium",
    status: "pending_customer",
    assignedTo: "John Smith",
    remoteSessionId: null,
    createdAt: "2024-11-26T11:00:00Z",
    updatedAt: "2024-11-27T16:30:00Z",
    resolvedAt: null,
    responseTime: 30,
    resolutionTime: null,
  },
]

const mockOrganizations: Organization[] = [
  {
    id: "org-1",
    name: "Sunrise Behavioral Health",
    subscriptionTier: "Enterprise",
    activeUsers: 35,
    lastActivity: "2 minutes ago",
    status: "online",
    systemHealth: { cpu: 45, memory: 62, storage: 38, networkLatency: 45 },
  },
  {
    id: "org-2",
    name: "Metro OTP Clinic",
    subscriptionTier: "Professional",
    activeUsers: 18,
    lastActivity: "5 minutes ago",
    status: "issues",
    systemHealth: { cpu: 89, memory: 78, storage: 55, networkLatency: 120 },
  },
  {
    id: "org-3",
    name: "County Health Department",
    subscriptionTier: "Enterprise",
    activeUsers: 52,
    lastActivity: "1 minute ago",
    status: "online",
    systemHealth: { cpu: 32, memory: 48, storage: 72, networkLatency: 35 },
  },
  {
    id: "org-4",
    name: "Valley Rehabilitation Center",
    subscriptionTier: "Standard",
    activeUsers: 12,
    lastActivity: "15 minutes ago",
    status: "offline",
    systemHealth: { cpu: 0, memory: 0, storage: 45, networkLatency: 0 },
  },
  {
    id: "org-5",
    name: "Coastal Mental Health",
    subscriptionTier: "Professional",
    activeUsers: 24,
    lastActivity: "8 minutes ago",
    status: "online",
    systemHealth: { cpu: 55, memory: 60, storage: 28, networkLatency: 52 },
  },
]

const mockActiveSessions: RemoteSession[] = [
  {
    id: "session-1",
    ticketId: "1",
    organizationId: "org-1",
    organizationName: "Sunrise Behavioral Health",
    clientUserId: "user-123",
    clientUserName: "Dr. Sarah Johnson",
    supportAgentId: "agent-1",
    supportAgentName: "John Smith",
    sessionType: "full_control",
    status: "active",
    startedAt: "2024-11-28T10:15:00Z",
    endedAt: null,
    duration: 1845,
    clientSystemInfo: {
      os: "Windows 11 Pro",
      browser: "Chrome 119.0.6045.159",
      screenResolution: "1920x1080",
      ipAddress: "192.168.1.105",
      location: "Phoenix, AZ",
    },
    permissions: {
      viewScreen: true,
      controlMouse: true,
      controlKeyboard: true,
      fileTransfer: true,
      clipboard: true,
      chat: true,
      audio: true,
      video: false,
    },
    recording: true,
    recordingUrl: null,
  },
]

const mockChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    sessionId: "session-1",
    senderId: "agent-1",
    senderName: "John Smith",
    senderRole: "support",
    message: "Hello Dr. Johnson, I can see your screen now. Let me check the permission settings.",
    timestamp: "2024-11-28T10:16:00Z",
    type: "text",
  },
  {
    id: "msg-2",
    sessionId: "session-1",
    senderId: "user-123",
    senderName: "Dr. Sarah Johnson",
    senderRole: "client",
    message: "Thank you for connecting so quickly. The issue started right after I logged in this morning.",
    timestamp: "2024-11-28T10:17:00Z",
    type: "text",
  },
  {
    id: "msg-3",
    sessionId: "session-1",
    senderId: "agent-1",
    senderName: "John Smith",
    senderRole: "support",
    message:
      "I see the issue. It looks like your role permissions were reset during the update. I'm going to fix that now.",
    timestamp: "2024-11-28T10:20:00Z",
    type: "text",
  },
  {
    id: "msg-4",
    sessionId: "session-1",
    senderId: "system",
    senderName: "System",
    senderRole: "support",
    message: "File transferred: permission_fix_script.sql",
    timestamp: "2024-11-28T10:22:00Z",
    type: "system",
  },
]

export default function ITSupportDashboard() {
  const [activeTab, setActiveTab] = useState("tickets")
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets)
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations)
  const [activeSessions, setActiveSessions] = useState<RemoteSession[]>(mockActiveSessions)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [selectedSession, setSelectedSession] = useState<RemoteSession | null>(mockActiveSessions[0])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages)
  const [newMessage, setNewMessage] = useState("")
  const [ticketFilter, setTicketFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false)
  const [showRemoteSessionDialog, setShowRemoteSessionDialog] = useState(false)
  const [isRemoteControlActive, setIsRemoteControlActive] = useState(false)
  const [sessionTimer, setSessionTimer] = useState(1845)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Session timer
  useEffect(() => {
    if (selectedSession?.status === "active") {
      const interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [selectedSession?.status])

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white"
      case "high":
        return "bg-orange-500 text-white"
      case "medium":
        return "bg-yellow-500 text-black"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-purple-100 text-purple-800"
      case "pending_customer":
        return "bg-yellow-100 text-yellow-800"
      case "escalated":
        return "bg-red-100 text-red-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getOrgStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500"
      case "offline":
        return "text-gray-400"
      case "issues":
        return "text-red-500"
      default:
        return "text-gray-400"
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter = ticketFilter === "all" || ticket.status === ticketFilter
    const matchesSearch =
      searchQuery === "" ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const sendChatMessage = () => {
    if (!newMessage.trim() || !selectedSession) return

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: selectedSession.id,
      senderId: "agent-current",
      senderName: "You",
      senderRole: "support",
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
    }

    setChatMessages([...chatMessages, message])
    setNewMessage("")
  }

  // Stats calculations
  const openTickets = tickets.filter((t) => t.status === "open").length
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length
  const criticalTickets = tickets.filter(
    (t) => t.priority === "critical" && t.status !== "resolved" && t.status !== "closed",
  ).length
  const avgResponseTime = Math.round(
    tickets.filter((t) => t.responseTime).reduce((sum, t) => sum + (t.responseTime || 0), 0) /
      tickets.filter((t) => t.responseTime).length,
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">IT Support Dashboard</h1>
              <p className="text-sm text-gray-500">MASE EMR Technical Support Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {activeSessions.length} Active Session{activeSessions.length !== 1 ? "s" : ""}
            </Badge>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                  <DialogDescription>Create a new support ticket for a client organization.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="training">Training Request</SelectItem>
                          <SelectItem value="feature_request">Feature Request</SelectItem>
                          <SelectItem value="security">Security Concern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          <SelectItem value="john">John Smith</SelectItem>
                          <SelectItem value="emily">Emily Chen</SelectItem>
                          <SelectItem value="mike">Mike Davis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input placeholder="Brief description of the issue" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Detailed description of the issue..." rows={4} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">Create Ticket</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{openTickets}</p>
              <p className="text-xs text-gray-500">Open Tickets</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{inProgressTickets}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{criticalTickets}</p>
              <p className="text-xs text-gray-500">Critical</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{activeSessions.length}</p>
              <p className="text-xs text-gray-500">Remote Sessions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-600">{avgResponseTime || 0}m</p>
              <p className="text-xs text-gray-500">Avg Response</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {organizations.filter((o) => o.status === "online").length}
              </p>
              <p className="text-xs text-gray-500">Orgs Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Support Tickets
            </TabsTrigger>
            <TabsTrigger value="remote" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Remote Sessions
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Diagnostics
            </TabsTrigger>
          </TabsList>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="text-lg">Support Tickets</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search tickets..."
                        className="pl-9 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={ticketFilter} onValueChange={setTicketFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tickets</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="pending_customer">Pending Customer</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <TableCell className="font-mono text-sm">{ticket.ticketNumber}</TableCell>
                        <TableCell className="font-medium">{ticket.organizationName}</TableCell>
                        <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {ticket.category.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>{ticket.assignedTo || <span className="text-gray-400">Unassigned</span>}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Ticket
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Monitor className="h-4 w-4 mr-2" />
                                Start Remote Session
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Escalate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Remote Sessions Tab */}
          <TabsContent value="remote" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Remote Screen View */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">Remote Screen View</CardTitle>
                        {selectedSession && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Connected
                          </Badge>
                        )}
                      </div>
                      {selectedSession && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            <Timer className="h-3 w-3 mr-1" />
                            {formatDuration(sessionTimer)}
                          </Badge>
                          <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedSession ? (
                      <div className="space-y-4">
                        {/* Mock Screen View */}
                        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <Monitor className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                              <p className="text-gray-400 text-sm">Remote screen view of</p>
                              <p className="text-white font-medium">{selectedSession.clientUserName}</p>
                              <p className="text-gray-500 text-xs mt-1">{selectedSession.organizationName}</p>
                              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Monitor className="h-3 w-3" />
                                  {selectedSession.clientSystemInfo.screenResolution}
                                </span>
                                <span>|</span>
                                <span>{selectedSession.clientSystemInfo.os}</span>
                              </div>
                            </div>
                          </div>
                          {/* Recording indicator */}
                          {selectedSession.recording && (
                            <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                              REC
                            </div>
                          )}
                        </div>

                        {/* Control Bar */}
                        <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Button
                              variant={isRemoteControlActive ? "default" : "outline"}
                              size="sm"
                              onClick={() => setIsRemoteControlActive(!isRemoteControlActive)}
                              className={isRemoteControlActive ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              <MousePointer className="h-4 w-4 mr-2" />
                              {isRemoteControlActive ? "Control Active" : "Take Control"}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Keyboard className="h-4 w-4 mr-2" />
                              Send Keys
                            </Button>
                            <Button variant="outline" size="sm">
                              <Clipboard className="h-4 w-4 mr-2" />
                              Clipboard
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Send File
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Get File
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon">
                              <Mic className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Volume2 className="h-4 w-4" />
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                            <Button variant="outline" size="sm">
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </Button>
                            <Button variant="destructive" size="sm">
                              <StopCircle className="h-4 w-4 mr-2" />
                              End Session
                            </Button>
                          </div>
                        </div>

                        {/* Session Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-xs mb-1">Client IP</p>
                            <p className="font-mono">{selectedSession.clientSystemInfo.ipAddress}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-xs mb-1">Location</p>
                            <p>{selectedSession.clientSystemInfo.location}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-xs mb-1">Browser</p>
                            <p className="truncate">{selectedSession.clientSystemInfo.browser.split(" ")[0]}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-xs mb-1">Session Type</p>
                            <p className="capitalize">{selectedSession.sessionType.replace("_", " ")}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Monitor className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Session</h3>
                        <p className="text-gray-500 mb-4">
                          Start a remote session from a support ticket to view the client's screen.
                        </p>
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Start New Session
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Chat & Session List */}
              <div className="space-y-4">
                {/* Active Sessions List */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeSessions.length > 0 ? (
                      <div className="space-y-2">
                        {activeSessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedSession?.id === session.id
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => setSelectedSession(session)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {session.clientUserName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{session.clientUserName}</p>
                                  <p className="text-xs text-gray-500">{session.organizationName}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                                Live
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Agent: {session.supportAgentName}</span>
                              <span className="font-mono">{formatDuration(sessionTimer)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">No active sessions</p>
                    )}
                  </CardContent>
                </Card>

                {/* Chat */}
                <Card className="flex flex-col" style={{ height: "400px" }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Session Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1 px-4">
                      <div className="space-y-3 py-2">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderRole === "support" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.type === "system" ? (
                              <div className="text-xs text-gray-500 text-center w-full py-1">{msg.message}</div>
                            ) : (
                              <div
                                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                  msg.senderRole === "support"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <p className="text-xs opacity-75 mb-1">{msg.senderName}</p>
                                <p className="text-sm">{msg.message}</p>
                                <p className="text-xs opacity-50 mt-1">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                        />
                        <Button size="icon" onClick={sendChatMessage} className="bg-indigo-600 hover:bg-indigo-700">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Organizations</CardTitle>
                <CardDescription>Monitor all MASE EMR client installations and system health</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Active Users</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>CPU</TableHead>
                      <TableHead>Memory</TableHead>
                      <TableHead>Storage</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {org.status === "online" ? (
                              <Wifi className={`h-4 w-4 ${getOrgStatusColor(org.status)}`} />
                            ) : (
                              <WifiOff className={`h-4 w-4 ${getOrgStatusColor(org.status)}`} />
                            )}
                            <span className="font-medium">{org.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{org.subscriptionTier}</Badge>
                        </TableCell>
                        <TableCell>{org.activeUsers}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              org.status === "online"
                                ? "bg-green-100 text-green-800"
                                : org.status === "issues"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }
                          >
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={org.systemHealth.cpu} className="w-16 h-2" />
                            <span className={`text-xs ${org.systemHealth.cpu > 80 ? "text-red-500" : "text-gray-500"}`}>
                              {org.systemHealth.cpu}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={org.systemHealth.memory} className="w-16 h-2" />
                            <span
                              className={`text-xs ${org.systemHealth.memory > 80 ? "text-red-500" : "text-gray-500"}`}
                            >
                              {org.systemHealth.memory}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={org.systemHealth.storage} className="w-16 h-2" />
                            <span className="text-xs text-gray-500">{org.systemHealth.storage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm ${org.systemHealth.networkLatency > 100 ? "text-red-500" : "text-gray-500"}`}
                          >
                            {org.systemHealth.networkLatency}ms
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">{org.lastActivity}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Monitor className="h-4 w-4 mr-2" />
                                Start Remote Session
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Terminal className="h-4 w-4 mr-2" />
                                Run Diagnostics
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Restart Services
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diagnostics Tab */}
          <TabsContent value="diagnostics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Diagnostics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Diagnostics
                  </CardTitle>
                  <CardDescription>Run diagnostic tests on client systems</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Database Connection Test</p>
                          <p className="text-xs text-gray-500">Test database connectivity and query performance</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Run Test
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">API Health Check</p>
                          <p className="text-xs text-gray-500">Verify all API endpoints are responding</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Run Test
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Integration Status</p>
                          <p className="text-xs text-gray-500">Check all third-party integrations</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Run Test
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">Security Scan</p>
                          <p className="text-xs text-gray-500">Run security vulnerability scan</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Run Test
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Cloud className="h-5 w-5 text-cyan-500" />
                        <div>
                          <p className="font-medium">Backup Verification</p>
                          <p className="text-xs text-gray-500">Verify backup integrity and recency</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Run Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remote Commands */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Remote Commands
                  </CardTitle>
                  <CardDescription>Execute commands on client systems (admin only)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Select Organization</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations
                            .filter((o) => o.status === "online")
                            .map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Command</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select command" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clear_cache">Clear Application Cache</SelectItem>
                          <SelectItem value="restart_services">Restart Services</SelectItem>
                          <SelectItem value="sync_data">Force Data Sync</SelectItem>
                          <SelectItem value="update_config">Update Configuration</SelectItem>
                          <SelectItem value="generate_logs">Generate Debug Logs</SelectItem>
                          <SelectItem value="custom">Custom Command...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      <Play className="h-4 w-4 mr-2" />
                      Execute Command
                    </Button>
                  </div>

                  <Separator />

                  {/* Command Output */}
                  <div className="space-y-2">
                    <Label>Output</Label>
                    <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg h-48 overflow-auto">
                      <p>$ Waiting for command...</p>
                      <p className="text-gray-500">Select an organization and command to execute</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Logs */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        System Logs
                      </CardTitle>
                      <CardDescription>Real-time system logs from all client installations</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Logs</SelectItem>
                          <SelectItem value="error">Errors Only</SelectItem>
                          <SelectItem value="warning">Warnings</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-300 font-mono text-xs p-4 rounded-lg h-64 overflow-auto space-y-1">
                    <p>
                      <span className="text-gray-500">[2024-11-28 10:45:23]</span>{" "}
                      <span className="text-green-400">[INFO]</span>{" "}
                      <span className="text-blue-400">[Sunrise Behavioral]</span> User login:
                      sarah.johnson@sunrise.health
                    </p>
                    <p>
                      <span className="text-gray-500">[2024-11-28 10:45:21]</span>{" "}
                      <span className="text-yellow-400">[WARN]</span> <span className="text-blue-400">[Metro OTP]</span>{" "}
                      High CPU usage detected: 89%
                    </p>
                    <p>
                      <span className="text-gray-500">[2024-11-28 10:45:18]</span>{" "}
                      <span className="text-green-400">[INFO]</span>{" "}
                      <span className="text-blue-400">[County Health]</span> Report generated: Monthly WIC Summary
                    </p>
                    <p>
                      <span className="text-gray-500">[2024-11-28 10:45:15]</span>{" "}
                      <span className="text-red-400">[ERROR]</span> <span className="text-blue-400">[Metro OTP]</span>{" "}
                      Database query timeout: SELECT * FROM dispensing_logs...
                    </p>
                    <p>
                      <span className="text-gray-500">[2024-11-28 10:45:12]</span>{" "}
                      <span className="text-green-400">[INFO]</span>{" "}
                      <span className="text-blue-400">[Sunrise Behavioral]</span> Patient record accessed:
                      PT-2024-001234
                    </p>
                    <p>
                      <span className="text-gray-500">[2024-11-28 10:45:10]</span>{" "}
                      <span className="text-green-400">[INFO]</span>{" "}
                      <span className="text-blue-400">[Coastal Mental Health]</span> Backup completed successfully
                    </p>
                    <p>
                      <span className="text-gray-500">[2024-11-28 10:45:08]</span>{" "}
                      <span className="text-yellow-400">[WARN]</span>{" "}
                      <span className="text-blue-400">[Valley Rehab]</span> Connection lost - attempting reconnect
                    </p>
                    <p>
                      <span className="text-gray-500">[2024-11-28 10:45:05]</span>{" "}
                      <span className="text-green-400">[INFO]</span>{" "}
                      <span className="text-blue-400">[County Health]</span> New patient registered: immunization clinic
                    </p>
                    <p>
                      <span className="text-gray-500">[2024-11-28 10:45:02]</span>{" "}
                      <span className="text-green-400">[INFO]</span>{" "}
                      <span className="text-blue-400">[Sunrise Behavioral]</span> Remote session started:
                      TKT-2024-001234
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
