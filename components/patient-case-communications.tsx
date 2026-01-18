"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { MessageSquare, Send, Users, AlertTriangle, Plus } from "lucide-react"
import { toast } from "sonner"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  email: string
}

interface Provider {
  id: string
  first_name: string
  last_name: string
  role: string
  specialty?: string
}

interface CareTeamMember {
  id: string
  role: string
  permissions: any
  providers: Provider
}

interface CareTeam {
  id: string
  team_name: string
  primary_provider_id: string
  care_team_members: CareTeamMember[]
}

interface Communication {
  id: string
  sender_id: string
  message_type: string
  subject: string
  message: string
  priority: string
  created_at: string
  is_read: boolean
  parent_message_id?: string
  providers: Provider
  communication_recipients: Array<{
    recipient_id: string
    is_read: boolean
    read_at: string
    providers: Provider
  }>
}

interface PatientCaseCommunicationsProps {
  patient: Patient
  careTeam: CareTeam | null
  currentProvider: Provider
}

export function PatientCaseCommunications({ patient, careTeam, currentProvider }: PatientCaseCommunicationsProps) {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [newMessage, setNewMessage] = useState({
    subject: "",
    message: "",
    priority: "normal",
    messageType: "general",
    recipients: [] as string[],
  })

  const supabase = createClient()

  const fetchCommunications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("case_communications")
        .select(`
          *,
          providers(
            id,
            first_name,
            last_name,
            specialty
          ),
          communication_recipients(
            recipient_id,
            is_read,
            read_at,
            providers(
              id,
              first_name,
              last_name,
              role
            )
          )
        `)
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCommunications(data || [])
    } catch (error) {
      console.error("Error fetching communications:", error)
    } finally {
      setLoading(false)
    }
  }, [patient.id, supabase])

  useEffect(() => {
    fetchCommunications()
  }, [fetchCommunications])

  const sendMessage = async () => {
    if (!newMessage.subject.trim() || !newMessage.message.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      // Insert the communication
      const { data: communication, error: commError } = await supabase
        .from("case_communications")
        .insert({
          patient_id: patient.id,
          care_team_id: careTeam?.id,
          sender_id: currentProvider.id,
          message_type: newMessage.messageType,
          subject: newMessage.subject,
          message: newMessage.message,
          priority: newMessage.priority,
        })
        .select()
        .single()

      if (commError) throw commError

      // Add recipients
      if (newMessage.recipients.length > 0) {
        const recipients = newMessage.recipients.map((recipientId) => ({
          communication_id: communication.id,
          recipient_id: recipientId,
        }))

        const { error: recipientError } = await supabase.from("communication_recipients").insert(recipients)

        if (recipientError) throw recipientError
      }

      // Create notifications for recipients
      if (newMessage.recipients.length > 0) {
        const notifications = newMessage.recipients.map((recipientId) => ({
          patient_id: patient.id,
          care_team_id: careTeam?.id,
          recipient_id: recipientId,
          sender_id: currentProvider.id,
          notification_type: "case_message",
          title: `New message: ${newMessage.subject}`,
          message: `${currentProvider.first_name} ${currentProvider.last_name} sent a message about ${patient.first_name} ${patient.last_name}`,
          priority: newMessage.priority,
          action_url: `/patients/${patient.id}/communications`,
        }))

        await supabase.from("team_notifications").insert(notifications)
      }

      toast.success("Message sent successfully")
      setIsNewMessageOpen(false)
      setNewMessage({
        subject: "",
        message: "",
        priority: "normal",
        messageType: "general",
        recipients: [],
      })
      fetchCommunications()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  const markAsRead = async (communicationId: string) => {
    try {
      await supabase
        .from("communication_recipients")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("communication_id", communicationId)
        .eq("recipient_id", currentProvider.id)

      fetchCommunications()
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case "normal":
        return <Badge variant="secondary">Normal</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "clinical_note":
        return <MessageSquare className="h-4 w-4 text-primary" />
      case "medication_update":
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case "risk_alert":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />
    }
  }

  const filteredCommunications = communications.filter((comm) => {
    const matchesPriority = selectedPriority === "all" || comm.priority === selectedPriority
    const matchesType = selectedType === "all" || comm.message_type === selectedType
    return matchesPriority && matchesType
  })

  if (loading) {
    return <div className="flex justify-center p-8">Loading communications...</div>
  }

  return (
    <div className="space-y-6">
      {/* Care Team Overview */}
      {careTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Care Team: {careTeam.team_name}
            </CardTitle>
            <CardDescription>
              {"Team members collaborating on"} {patient.first_name}
              {"'s care"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {careTeam.care_team_members.map((member) => (
                <div key={member.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {member.providers.first_name[0]}
                      {member.providers.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.providers.first_name} {member.providers.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.providers.role} • {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Communication Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="clinical_note">Clinical Note</SelectItem>
              <SelectItem value="medication_update">Medication Update</SelectItem>
              <SelectItem value="risk_alert">Risk Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Team Message</DialogTitle>
              <DialogDescription>
                Send a message to care team members about {patient.first_name} {patient.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
                    value={newMessage.messageType}
                    onValueChange={(value) => setNewMessage((prev) => ({ ...prev, messageType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="clinical_note">Clinical Note</SelectItem>
                      <SelectItem value="medication_update">Medication Update</SelectItem>
                      <SelectItem value="risk_alert">Risk Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter message subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your message"
                  rows={4}
                />
              </div>
              {careTeam && (
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {careTeam.care_team_members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={member.providers.id}
                          checked={newMessage.recipients.includes(member.providers.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewMessage((prev) => ({
                                ...prev,
                                recipients: [...prev.recipients, member.providers.id],
                              }))
                            } else {
                              setNewMessage((prev) => ({
                                ...prev,
                                recipients: prev.recipients.filter((id) => id !== member.providers.id),
                              }))
                            }
                          }}
                        />
                        <label htmlFor={member.providers.id} className="text-sm">
                          {member.providers.first_name} {member.providers.last_name} ({member.providers.role})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendMessage}>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Communications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Case Communications
            <Badge variant="secondary">{filteredCommunications.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCommunications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No communications found. Start a conversation with the care team.
              </div>
            ) : (
              filteredCommunications.map((comm) => (
                <div key={comm.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comm.providers.first_name[0]}
                          {comm.providers.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getMessageTypeIcon(comm.message_type)}
                          <h4 className="font-medium">{comm.subject}</h4>
                          {getPriorityBadge(comm.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From: {comm.providers.first_name} {comm.providers.last_name} ({comm.providers.role})
                        </p>
                        <p className="text-sm text-muted-foreground">{new Date(comm.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pl-11">
                    <p className="text-sm">{comm.message}</p>
                    {comm.communication_recipients.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Recipients:</p>
                        <div className="flex flex-wrap gap-2">
                          {comm.communication_recipients.map((recipient) => (
                            <Badge
                              key={recipient.recipient_id}
                              variant={recipient.is_read ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {recipient.providers.first_name} {recipient.providers.last_name}
                              {recipient.is_read && <span className="ml-1">✓</span>}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
