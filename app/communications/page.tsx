"use client"

import { useState } from "react"
import useSWR from "swr"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { TeamNotifications } from "@/components/team-notifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageSquare,
  Send,
  Phone,
  Video,
  Bell,
  Search,
  Plus,
  Users,
  AlertTriangle,
  Megaphone,
  PhoneCall,
  VideoIcon,
} from "lucide-react"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const DEFAULT_PROVIDER = {
  id: "00000000-0000-0000-0000-000000000001",
  first_name: "Demo",
  last_name: "Provider",
  email: "demo@example.com",
  role: "physician",
}

export default function CommunicationsPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/communications", fetcher)
  const [provider] = useState(DEFAULT_PROVIDER)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [replyMessage, setReplyMessage] = useState("")

  // New Message Dialog State
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [newMessage, setNewMessage] = useState({
    subject: "",
    message: "",
    priority: "normal",
    message_type: "general",
    patient_id: "",
    recipients: [] as string[],
  })

  // Announcement Dialog State
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    priority: "normal",
  })

  // Emergency Alert Dialog State
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false)
  const [emergencyAlert, setEmergencyAlert] = useState({
    message: "",
    priority: "high",
    affected_areas: [] as string[],
  })

  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false)
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [callInProgress, setCallInProgress] = useState(false)

  const [sendingMessage, setSendingMessage] = useState(false)

  const handleSelectConversation = async (msg: any) => {
    setSelectedConversation(msg)

    // Mark as read if unread
    if (!msg.is_read) {
      try {
        await fetch("/api/communications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "mark_read",
            message_id: msg.id,
          }),
        })
        mutate()
      } catch (error) {
        console.error("Failed to mark as read:", error)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.subject.trim() || !newMessage.message.trim()) {
      toast.error("Please enter a subject and message")
      return
    }

    setSendingMessage(true)
    try {
      const response = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          sender_id: provider.id,
          patient_id: newMessage.patient_id && newMessage.patient_id !== "no-patient" ? newMessage.patient_id : null,
          subject: newMessage.subject,
          message: newMessage.message,
          priority: newMessage.priority,
          message_type: newMessage.message_type,
          recipients: newMessage.recipients,
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      toast.success("Message sent successfully")
      setIsNewMessageOpen(false)
      setNewMessage({
        subject: "",
        message: "",
        priority: "normal",
        message_type: "general",
        patient_id: "",
        recipients: [],
      })
      mutate()
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      toast.error("Please enter a title and message")
      return
    }

    setSendingMessage(true)
    try {
      const response = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_announcement",
          ...newAnnouncement,
        }),
      })

      if (!response.ok) throw new Error("Failed to create announcement")

      toast.success("Announcement created successfully")
      setIsAnnouncementOpen(false)
      setNewAnnouncement({ title: "", message: "", priority: "normal" })
      mutate()
    } catch (error) {
      toast.error("Failed to create announcement")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleCreateEmergencyAlert = async () => {
    if (!emergencyAlert.message.trim()) {
      toast.error("Please enter an emergency message")
      return
    }

    setSendingMessage(true)
    try {
      const response = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_emergency_alert",
          created_by: `${provider.first_name} ${provider.last_name}`,
          ...emergencyAlert,
        }),
      })

      if (!response.ok) throw new Error("Failed to create emergency alert")

      toast.success("Emergency alert sent successfully")
      setIsEmergencyOpen(false)
      setEmergencyAlert({ message: "", priority: "high", affected_areas: [] })
      mutate()
    } catch (error) {
      toast.error("Failed to create emergency alert")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return

    setSendingMessage(true)
    try {
      const response = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          sender_id: provider.id,
          patient_id: selectedConversation.patient_id,
          subject: `Re: ${selectedConversation.subject || "Message"}`,
          message: replyMessage,
          priority: "normal",
          message_type: "general",
          recipients: selectedConversation.sender_id ? [selectedConversation.sender_id] : [],
        }),
      })

      if (!response.ok) throw new Error("Failed to send reply")

      toast.success("Reply sent successfully")
      setReplyMessage("")
      mutate()
    } catch (error) {
      toast.error("Failed to send reply")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleStartCall = () => {
    setCallInProgress(true)
    toast.success("Initiating voice call...")
    // Simulate call connection
    setTimeout(() => {
      setCallInProgress(false)
      toast.info("Call ended")
      setIsCallDialogOpen(false)
    }, 3000)
  }

  const handleStartVideoCall = () => {
    setCallInProgress(true)
    toast.success("Initiating video call...")
    // Simulate call connection
    setTimeout(() => {
      setCallInProgress(false)
      toast.info("Video call ended")
      setIsVideoDialogOpen(false)
    }, 3000)
  }

  const toggleRecipient = (recipientId: string) => {
    setNewMessage((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(recipientId)
        ? prev.recipients.filter((id) => id !== recipientId)
        : [...prev.recipients, recipientId],
    }))
  }

  const messages = data?.messages || []
  const announcements = data?.announcements || []
  const emergencyAlerts = data?.emergencyAlerts || []
  const patients = data?.patients || []
  const providers = data?.providers || []

  const filteredMessages = messages.filter((msg: any) => {
    if (!searchQuery) return true
    const patientName = `${msg.patients?.first_name || ""} ${msg.patients?.last_name || ""}`.toLowerCase()
    const subject = (msg.subject || "").toLowerCase()
    return patientName.includes(searchQuery.toLowerCase()) || subject.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Communications</h1>
              <p className="text-muted-foreground">Team collaboration and secure messaging hub</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href="/care-teams">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Teams
                </a>
              </Button>
              <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                    <DialogDescription>Send a secure message to team members or about a patient case</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                          value={newMessage.priority}
                          onValueChange={(value) => setNewMessage((prev) => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Message Type</Label>
                        <Select
                          value={newMessage.message_type}
                          onValueChange={(value) => setNewMessage((prev) => ({ ...prev, message_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="clinical">Clinical Update</SelectItem>
                            <SelectItem value="urgent">Urgent Care</SelectItem>
                            <SelectItem value="handoff">Care Handoff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Related Patient (Optional)</Label>
                      <Select
                        value={newMessage.patient_id || "no-patient"}
                        onValueChange={(value) =>
                          setNewMessage((prev) => ({
                            ...prev,
                            patient_id: value === "no-patient" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-patient">No patient</SelectItem>
                          {patients.map((patient: any) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.first_name} {patient.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject *</Label>
                      <Input
                        value={newMessage.subject}
                        onChange={(e) => setNewMessage((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder="Enter message subject"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Message *</Label>
                      <Textarea
                        value={newMessage.message}
                        onChange={(e) => setNewMessage((prev) => ({ ...prev, message: e.target.value }))}
                        placeholder="Enter your message"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recipients</Label>
                      <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                        {providers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No providers available</p>
                        ) : (
                          providers.map((prov: any) => (
                            <div key={prov.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={prov.id}
                                checked={newMessage.recipients.includes(prov.id)}
                                onCheckedChange={() => toggleRecipient(prov.id)}
                              />
                              <label htmlFor={prov.id} className="text-sm cursor-pointer">
                                {prov.first_name} {prov.last_name} ({prov.role || "Staff"})
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendMessage} disabled={sendingMessage}>
                      <Send className="mr-2 h-4 w-4" />
                      {sendingMessage ? "Sending..." : "Send Message"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="messages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="team-notifications">Team Notifications</TabsTrigger>
              <TabsTrigger value="care-teams">My Care Teams</TabsTrigger>
              <TabsTrigger value="messages">
                Direct Messages
                {data?.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {data.unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
            </TabsList>

            <TabsContent value="team-notifications" className="space-y-6">
              <TeamNotifications providerId={provider.id} />
            </TabsContent>

            <TabsContent value="care-teams" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    My Care Teams
                  </CardTitle>
                  <CardDescription>Quick access to patient care teams you are assigned to</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No care teams found yet.</p>
                      <Button variant="outline" className="mt-4 bg-transparent" asChild>
                        <a href="/care-teams">Browse Care Teams</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Direct Messages</span>
                      <Badge variant="secondary">{filteredMessages.length}</Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search conversations..."
                        className="flex-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : filteredMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-transparent"
                          onClick={() => setIsNewMessageOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Send First Message
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredMessages.map((msg: any) => (
                          <div
                            key={msg.id}
                            onClick={() => handleSelectConversation(msg)}
                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedConversation?.id === msg.id ? "bg-accent border-primary" : "hover:bg-accent/50"
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {msg.patients?.first_name?.[0] || msg.sender?.first_name?.[0] || "M"}
                                {msg.patients?.last_name?.[0] || msg.sender?.last_name?.[0] || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {msg.patients
                                  ? `${msg.patients.first_name} ${msg.patients.last_name}`
                                  : msg.sender
                                    ? `${msg.sender.first_name} ${msg.sender.last_name}`
                                    : "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {msg.subject || msg.message?.substring(0, 50)}
                              </p>
                            </div>
                            {!msg.is_read && (
                              <Badge variant="destructive" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    {selectedConversation ? (
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {selectedConversation.patients?.first_name?.[0] || "M"}
                              {selectedConversation.patients?.last_name?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {selectedConversation.patients
                                ? `${selectedConversation.patients.first_name} ${selectedConversation.patients.last_name}`
                                : "Team Message"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedConversation.subject || "No subject"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Voice Call</DialogTitle>
                                <DialogDescription>
                                  Start a voice call with{" "}
                                  {selectedConversation.patients
                                    ? `${selectedConversation.patients.first_name} ${selectedConversation.patients.last_name}`
                                    : "this contact"}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-6 text-center">
                                {callInProgress ? (
                                  <div className="space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto animate-pulse">
                                      <PhoneCall className="h-10 w-10 text-green-600" />
                                    </div>
                                    <p className="text-lg font-medium">Calling...</p>
                                    <p className="text-sm text-muted-foreground">Connecting to secure line</p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                                      <Phone className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      This will initiate a HIPAA-compliant voice call
                                    </p>
                                  </div>
                                )}
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCallDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleStartCall} disabled={callInProgress}>
                                  <Phone className="mr-2 h-4 w-4" />
                                  {callInProgress ? "Connecting..." : "Start Call"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Video className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Video Call</DialogTitle>
                                <DialogDescription>
                                  Start a video call with{" "}
                                  {selectedConversation.patients
                                    ? `${selectedConversation.patients.first_name} ${selectedConversation.patients.last_name}`
                                    : "this contact"}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-6 text-center">
                                {callInProgress ? (
                                  <div className="space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
                                      <VideoIcon className="h-10 w-10 text-blue-600" />
                                    </div>
                                    <p className="text-lg font-medium">Connecting Video...</p>
                                    <p className="text-sm text-muted-foreground">Setting up secure video connection</p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                                      <Video className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      This will initiate a HIPAA-compliant video call
                                    </p>
                                  </div>
                                )}
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleStartVideoCall} disabled={callInProgress}>
                                  <Video className="mr-2 h-4 w-4" />
                                  {callInProgress ? "Connecting..." : "Start Video Call"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardTitle>
                    ) : (
                      <CardTitle>Select a conversation</CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedConversation ? (
                      <>
                        <div className="h-96 border rounded-lg p-4 space-y-4 overflow-y-auto">
                          <div className="flex justify-start">
                            <div className="bg-muted p-3 rounded-lg max-w-md">
                              <p className="text-sm">{selectedConversation.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(selectedConversation.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Type your reply..."
                            className="flex-1"
                            rows={2}
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                          />
                          <Button onClick={handleSendReply} disabled={sendingMessage || !replyMessage.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="h-96 border rounded-lg p-4 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select a conversation to view messages</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="announcements" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>System Announcements</CardTitle>
                      <CardDescription>Important updates and notices</CardDescription>
                    </div>
                    <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Megaphone className="mr-2 h-4 w-4" />
                          Create Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Announcement</DialogTitle>
                          <DialogDescription>Broadcast an announcement to all team members</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                              value={newAnnouncement.priority}
                              onValueChange={(value) => setNewAnnouncement((prev) => ({ ...prev, priority: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                              value={newAnnouncement.title}
                              onChange={(e) => setNewAnnouncement((prev) => ({ ...prev, title: e.target.value }))}
                              placeholder="Enter announcement title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Message *</Label>
                            <Textarea
                              value={newAnnouncement.message}
                              onChange={(e) => setNewAnnouncement((prev) => ({ ...prev, message: e.target.value }))}
                              placeholder="Enter announcement message"
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAnnouncementOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateAnnouncement} disabled={sendingMessage}>
                            {sendingMessage ? "Creating..." : "Create Announcement"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No announcements yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => setIsAnnouncementOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Announcement
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((announcement: any) => (
                        <div key={announcement.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{announcement.title}</h4>
                            <div className="flex gap-2">
                              {announcement.priority === "high" && <Badge variant="destructive">High Priority</Badge>}
                              <Badge variant="outline">{new Date(announcement.created_at).toLocaleDateString()}</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{announcement.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emergency" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-destructive">Emergency Communications</CardTitle>
                      <CardDescription>Critical alerts and emergency protocols</CardDescription>
                    </div>
                    <Dialog open={isEmergencyOpen} onOpenChange={setIsEmergencyOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Create Emergency Alert
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-destructive">Create Emergency Alert</DialogTitle>
                          <DialogDescription>This will immediately notify all staff members</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                              value={emergencyAlert.priority}
                              onValueChange={(value) => setEmergencyAlert((prev) => ({ ...prev, priority: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Emergency Message *</Label>
                            <Textarea
                              value={emergencyAlert.message}
                              onChange={(e) => setEmergencyAlert((prev) => ({ ...prev, message: e.target.value }))}
                              placeholder="Describe the emergency situation"
                              rows={4}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Affected Areas</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {["Dispensing", "Lobby", "Counseling", "Medical", "All Areas"].map((area) => (
                                <div key={area} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`area-${area}`}
                                    checked={emergencyAlert.affected_areas.includes(area)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEmergencyAlert((prev) => ({
                                          ...prev,
                                          affected_areas: [...prev.affected_areas, area],
                                        }))
                                      } else {
                                        setEmergencyAlert((prev) => ({
                                          ...prev,
                                          affected_areas: prev.affected_areas.filter((a) => a !== area),
                                        }))
                                      }
                                    }}
                                  />
                                  <label htmlFor={`area-${area}`} className="text-sm cursor-pointer">
                                    {area}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsEmergencyOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleCreateEmergencyAlert} disabled={sendingMessage}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            {sendingMessage ? "Sending..." : "Send Emergency Alert"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
                    <h4 className="font-medium text-destructive mb-2">Emergency Contact Protocol</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      For immediate patient safety concerns, use the emergency alert system above.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          toast.success("Dialing 911...")
                        }}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Emergency Services (911)
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEmergencyOpen(true)}>
                        <Bell className="mr-2 h-4 w-4" />
                        Alert Team
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Emergency Alerts</h4>
                    {isLoading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : emergencyAlerts.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
                        No recent emergency alerts
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {emergencyAlerts.map((alert: any) => (
                          <div key={alert.id} className="p-3 border border-destructive/50 rounded-lg bg-destructive/5">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <span className="font-medium text-destructive">{alert.priority?.toUpperCase()}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(alert.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm mt-2">{alert.message}</p>
                            {alert.affected_areas?.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {alert.affected_areas.map((area: string) => (
                                  <Badge key={area} variant="outline" className="text-xs">
                                    {area}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Created by: {alert.created_by}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
