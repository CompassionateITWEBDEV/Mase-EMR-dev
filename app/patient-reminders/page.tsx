"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  Send,
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  FileText,
  Eye,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PatientRemindersPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [showSendReminder, setShowSendReminder] = useState(false)
  const [showViewTemplate, setShowViewTemplate] = useState(false)
  const [showEditTemplate, setShowEditTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchPatient, setSearchPatient] = useState("")
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const { data: patientsData } = useSWR("/api/patients", fetcher)
  const patients = patientsData?.patients || []

  const [templates, setTemplates] = useState<any[]>([])
  const [sentReminders, setSentReminders] = useState<any[]>([])
  const [pendingReminders, setPendingReminders] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    appointmentReminders: 0,
    missedCounseling: 0,
    balanceReminders: 0,
  })

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "appointment",
    channel: "both",
    subject: "",
    message: "",
    timing: "",
    is_active: true,
  })

  const [manualReminder, setManualReminder] = useState({
    patient_id: "",
    type: "appointment",
    channel: "both",
    subject: "",
    message: "",
  })

  const [settings, setSettings] = useState({
    autoAppointmentReminders: true,
    appointmentReminderTiming: "24",
    autoMissedCounseling: true,
    missedCounselingDelay: "4",
    autoBalanceReminders: true,
    balanceReminderThreshold: "50",
    smsEnabled: true,
    emailEnabled: true,
    quietHoursStart: "21:00",
    quietHoursEnd: "08:00",
  })

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("reminder_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setTemplates(data)
    }
  }

  const fetchSentReminders = async () => {
    const { data, error } = await supabase
      .from("patient_reminders")
      .select(`
        *,
        patient:patients(first_name, last_name)
      `)
      .not("sent_at", "is", null)
      .order("sent_at", { ascending: false })
      .limit(50)

    if (!error && data) {
      setSentReminders(data)
    }
  }

  const fetchPendingReminders = async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        patient:patients(id, first_name, last_name)
      `)
      .gte("appointment_date", new Date().toISOString())
      .lte("appointment_date", tomorrow.toISOString())
      .eq("status", "scheduled")
      .limit(20)

    if (!error && data) {
      const pending = data.map((apt) => ({
        id: apt.id,
        patientName: `${apt.patient?.first_name} ${apt.patient?.last_name}`,
        patientId: apt.patient?.id,
        type: "Appointment",
        reason: `${apt.appointment_type} on ${new Date(apt.appointment_date).toLocaleDateString()}`,
        scheduledFor: new Date(apt.appointment_date).toLocaleString(),
        channel: "SMS + Email",
      }))
      setPendingReminders(pending)
    }
  }

  const fetchStats = async () => {
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const { data: reminders } = await supabase
      .from("patient_reminders")
      .select("type, email_status, sms_status")
      .gte("created_at", thisMonth.toISOString())

    if (reminders) {
      const totalSent = reminders.length
      const delivered = reminders.filter((r) => r.email_status === "delivered" || r.sms_status === "delivered").length
      const failed = reminders.filter((r) => r.email_status === "failed" || r.sms_status === "failed").length
      const pending = reminders.filter((r) => r.email_status === "pending" || r.sms_status === "pending").length
      const appointmentReminders = reminders.filter((r) => r.type === "appointment").length
      const missedCounseling = reminders.filter((r) => r.type === "counseling").length
      const balanceReminders = reminders.filter((r) => r.type === "balance").length

      setStats({
        totalSent,
        delivered,
        failed,
        pending,
        appointmentReminders,
        missedCounseling,
        balanceReminders,
      })
    }
  }

  useEffect(() => {
    fetchTemplates()
    fetchSentReminders()
    fetchPendingReminders()
    fetchStats()
  }, [])

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.message) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setIsLoading(true)
    const { data, error } = await supabase
      .from("reminder_templates")
      .insert([
        {
          name: newTemplate.name,
          type: newTemplate.type,
          channel: newTemplate.channel,
          subject: newTemplate.subject,
          message: newTemplate.message,
          timing: newTemplate.timing,
          is_active: newTemplate.is_active,
        },
      ])
      .select()
      .single()

    setIsLoading(false)

    if (error) {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Template created successfully" })
      setShowNewTemplate(false)
      setNewTemplate({
        name: "",
        type: "appointment",
        channel: "both",
        subject: "",
        message: "",
        timing: "",
        is_active: true,
      })
      fetchTemplates()
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    setIsLoading(true)
    const { error } = await supabase
      .from("reminder_templates")
      .update({
        name: selectedTemplate.name,
        type: selectedTemplate.type,
        channel: selectedTemplate.channel,
        subject: selectedTemplate.subject,
        message: selectedTemplate.message,
        timing: selectedTemplate.timing,
        is_active: selectedTemplate.is_active,
      })
      .eq("id", selectedTemplate.id)

    setIsLoading(false)

    if (error) {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Template updated successfully" })
      setShowEditTemplate(false)
      fetchTemplates()
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from("reminder_templates").delete().eq("id", id)

    if (error) {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Template deleted" })
      fetchTemplates()
    }
  }

  const handleToggleTemplate = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("reminder_templates").update({ is_active: !currentStatus }).eq("id", id)

    if (!error) {
      fetchTemplates()
    }
  }

  const handleSendReminder = async () => {
    if (!manualReminder.patient_id || !manualReminder.message) {
      toast({ title: "Error", description: "Please select a patient and enter a message", variant: "destructive" })
      return
    }

    setIsLoading(true)
    const { error } = await supabase.from("patient_reminders").insert([
      {
        patient_id: manualReminder.patient_id,
        type: manualReminder.type,
        channel: manualReminder.channel,
        subject: manualReminder.subject || `${manualReminder.type} Reminder`,
        message: manualReminder.message,
        email_status: manualReminder.channel !== "sms" ? "pending" : null,
        sms_status: manualReminder.channel !== "email" ? "pending" : null,
        sent_at: new Date().toISOString(),
      },
    ])

    setIsLoading(false)

    if (error) {
      toast({ title: "Error", description: "Failed to send reminder", variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Reminder sent successfully" })
      setShowSendReminder(false)
      setManualReminder({ patient_id: "", type: "appointment", channel: "both", subject: "", message: "" })
      fetchSentReminders()
      fetchStats()
    }
  }

  const handleResendReminder = async (reminder: any) => {
    const { error } = await supabase
      .from("patient_reminders")
      .update({
        email_status: reminder.channel !== "sms" ? "pending" : null,
        sms_status: reminder.channel !== "email" ? "pending" : null,
        sent_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", reminder.id)

    if (error) {
      toast({ title: "Error", description: "Failed to resend reminder", variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Reminder queued for resend" })
      fetchSentReminders()
    }
  }

  const filteredPatients = patients.filter((p: any) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchPatient.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Patient Reminders</h1>
              <p className="text-muted-foreground">
                Manage appointment reminders, missed session alerts, and balance notifications
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSendReminder(true)}>
                <Send className="mr-2 h-4 w-4" />
                Send Manual Reminder
              </Button>
              <Button onClick={() => setShowNewTemplate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sent (This Month)</p>
                    <p className="text-2xl font-bold">{stats.totalSent}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    {stats.delivered} delivered
                  </Badge>
                  <Badge variant="outline" className="text-xs text-destructive border-destructive">
                    {stats.failed} failed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Appointment Reminders</p>
                    <p className="text-2xl font-bold">{stats.appointmentReminders}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Missed Counseling Alerts</p>
                    <p className="text-2xl font-bold">{stats.missedCounseling}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Balance Reminders</p>
                    <p className="text-2xl font-bold">{stats.balanceReminders}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">
                <Bell className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="pending">
                <Clock className="mr-2 h-4 w-4" />
                Pending ({pendingReminders.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                <FileText className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="templates">
                <MessageSquare className="mr-2 h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Upcoming Reminders
                    </CardTitle>
                    <CardDescription>Reminders scheduled to send soon</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingReminders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No pending reminders</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingReminders.slice(0, 5).map((reminder) => (
                          <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">{reminder.patientName}</p>
                                <p className="text-sm text-muted-foreground">{reminder.reason}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{reminder.channel}</Badge>
                              <p className="text-xs mt-1 text-muted-foreground">{reminder.scheduledFor}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Recent Sent
                    </CardTitle>
                    <CardDescription>Recently sent reminders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sentReminders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No sent reminders yet</p>
                    ) : (
                      <div className="space-y-3">
                        {sentReminders.slice(0, 5).map((reminder) => (
                          <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  reminder.email_status === "delivered" || reminder.sms_status === "delivered"
                                    ? "bg-green-500/10"
                                    : reminder.email_status === "failed" || reminder.sms_status === "failed"
                                      ? "bg-destructive/10"
                                      : "bg-orange-500/10"
                                }`}
                              >
                                {reminder.email_status === "delivered" || reminder.sms_status === "delivered" ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : reminder.email_status === "failed" || reminder.sms_status === "failed" ? (
                                  <XCircle className="h-5 w-5 text-destructive" />
                                ) : (
                                  <Clock className="h-5 w-5 text-orange-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {reminder.patient?.first_name} {reminder.patient?.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">{reminder.type} reminder</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  reminder.email_status === "delivered" || reminder.sms_status === "delivered"
                                    ? "default"
                                    : reminder.email_status === "failed" || reminder.sms_status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {reminder.email_status === "delivered" || reminder.sms_status === "delivered"
                                  ? "Delivered"
                                  : reminder.email_status === "failed" || reminder.sms_status === "failed"
                                    ? "Failed"
                                    : "Pending"}
                              </Badge>
                              <p className="text-xs mt-1 text-muted-foreground">
                                {new Date(reminder.sent_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Pending Tab */}
            <TabsContent value="pending" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Reminders</CardTitle>
                  <CardDescription>Reminders scheduled based on upcoming appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingReminders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending reminders</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Scheduled For</TableHead>
                          <TableHead>Channel</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingReminders.map((reminder) => (
                          <TableRow key={reminder.id}>
                            <TableCell className="font-medium">{reminder.patientName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{reminder.type}</Badge>
                            </TableCell>
                            <TableCell>{reminder.reason}</TableCell>
                            <TableCell>{reminder.scheduledFor}</TableCell>
                            <TableCell>{reminder.channel}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Reminder History</CardTitle>
                    <CardDescription>All sent reminders</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchSentReminders()
                      fetchStats()
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {sentReminders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No reminders sent yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sentReminders.map((reminder) => (
                          <TableRow key={reminder.id}>
                            <TableCell className="font-medium">
                              {reminder.patient?.first_name} {reminder.patient?.last_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{reminder.type}</Badge>
                            </TableCell>
                            <TableCell>{reminder.channel}</TableCell>
                            <TableCell>{new Date(reminder.sent_at).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  reminder.email_status === "delivered" || reminder.sms_status === "delivered"
                                    ? "default"
                                    : reminder.email_status === "failed" || reminder.sms_status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {reminder.email_status === "delivered" || reminder.sms_status === "delivered"
                                  ? "Delivered"
                                  : reminder.email_status === "failed" || reminder.sms_status === "failed"
                                    ? "Failed"
                                    : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {(reminder.email_status === "failed" || reminder.sms_status === "failed") && (
                                <Button variant="ghost" size="sm" onClick={() => handleResendReminder(reminder)}>
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Reminder Templates</CardTitle>
                    <CardDescription>Manage your reminder message templates</CardDescription>
                  </div>
                  <Button onClick={() => setShowNewTemplate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </CardHeader>
                <CardContent>
                  {templates.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No templates yet</p>
                      <Button className="mt-4" onClick={() => setShowNewTemplate(true)}>
                        Create First Template
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Timing</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {templates.map((template) => (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{template.type}</Badge>
                            </TableCell>
                            <TableCell>{template.channel}</TableCell>
                            <TableCell>{template.timing || "-"}</TableCell>
                            <TableCell>
                              <Switch
                                checked={template.is_active}
                                onCheckedChange={() => handleToggleTemplate(template.id, template.is_active)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTemplate(template)
                                    setShowViewTemplate(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTemplate(template)
                                    setShowEditTemplate(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reminder Settings</CardTitle>
                  <CardDescription>Configure automatic reminder behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Appointment Reminders</p>
                      <p className="text-sm text-muted-foreground">Automatically send reminders before appointments</p>
                    </div>
                    <Switch
                      checked={settings.autoAppointmentReminders}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoAppointmentReminders: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Missed Counseling Alerts</p>
                      <p className="text-sm text-muted-foreground">Alert patients when they miss counseling sessions</p>
                    </div>
                    <Switch
                      checked={settings.autoMissedCounseling}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoMissedCounseling: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Balance Reminders</p>
                      <p className="text-sm text-muted-foreground">Send reminders for outstanding balances</p>
                    </div>
                    <Switch
                      checked={settings.autoBalanceReminders}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoBalanceReminders: checked })}
                    />
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-medium">Communication Channels</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Email Notifications</span>
                      </div>
                      <Switch
                        checked={settings.emailEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>SMS Notifications</span>
                      </div>
                      <Switch
                        checked={settings.smsEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, smsEnabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-medium">Quiet Hours</h4>
                    <p className="text-sm text-muted-foreground">Do not send reminders during these hours</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start</Label>
                        <Input
                          type="time"
                          value={settings.quietHoursStart}
                          onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>End</Label>
                        <Input
                          type="time"
                          value={settings.quietHoursEnd}
                          onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => toast({ title: "Settings saved" })}>
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Send Manual Reminder Dialog */}
          <Dialog open={showSendReminder} onOpenChange={setShowSendReminder}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Manual Reminder</DialogTitle>
                <DialogDescription>Send a one-time reminder to a specific patient</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Search Patient</Label>
                  <Input
                    placeholder="Type to search..."
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select
                    value={manualReminder.patient_id}
                    onValueChange={(value) => setManualReminder({ ...manualReminder, patient_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPatients.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name} - DOB: {patient.date_of_birth}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reminder Type</Label>
                  <Select
                    value={manualReminder.type}
                    onValueChange={(value) => setManualReminder({ ...manualReminder, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Appointment Reminder</SelectItem>
                      <SelectItem value="counseling">Missed Counseling</SelectItem>
                      <SelectItem value="balance">Balance Due</SelectItem>
                      <SelectItem value="custom">Custom Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select
                    value={manualReminder.channel}
                    onValueChange={(value) => setManualReminder({ ...manualReminder, channel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="both">Email + SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject (for email)</Label>
                  <Input
                    value={manualReminder.subject}
                    onChange={(e) => setManualReminder({ ...manualReminder, subject: e.target.value })}
                    placeholder="Reminder from clinic"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    rows={4}
                    value={manualReminder.message}
                    onChange={(e) => setManualReminder({ ...manualReminder, message: e.target.value })}
                    placeholder="Enter your message..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendReminder(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendReminder} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Template Dialog */}
          <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>Create a reusable reminder template</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Appointment Reminder - 24 Hours"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newTemplate.type}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="counseling">Counseling</SelectItem>
                        <SelectItem value="balance">Balance</SelectItem>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select
                      value={newTemplate.channel}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, channel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="sms">SMS Only</SelectItem>
                        <SelectItem value="both">Email + SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Timing</Label>
                  <Input
                    value={newTemplate.timing}
                    onChange={(e) => setNewTemplate({ ...newTemplate, timing: e.target.value })}
                    placeholder="e.g., 24 hours before"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject (for email)</Label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    placeholder="Appointment Reminder"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    rows={4}
                    value={newTemplate.message}
                    onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                    placeholder="Hi {patient_name}, this is a reminder..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {"{patient_name}"}, {"{appointment_date}"}, {"{appointment_time}"},{" "}
                    {"{clinic_phone}"}, {"{balance_amount}"}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewTemplate(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Template Dialog */}
          <Dialog open={showViewTemplate} onOpenChange={setShowViewTemplate}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedTemplate?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline">{selectedTemplate?.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Channel</p>
                    <Badge variant="outline">{selectedTemplate?.channel}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timing</p>
                    <p className="font-medium">{selectedTemplate?.timing || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{selectedTemplate?.subject || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Message</p>
                  <div className="bg-muted p-3 rounded-lg mt-1">
                    <p className="whitespace-pre-wrap">{selectedTemplate?.message}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Template Dialog */}
          <Dialog open={showEditTemplate} onOpenChange={setShowEditTemplate}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={selectedTemplate?.name || ""}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={selectedTemplate?.type || "appointment"}
                      onValueChange={(value) => setSelectedTemplate({ ...selectedTemplate, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="counseling">Counseling</SelectItem>
                        <SelectItem value="balance">Balance</SelectItem>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select
                      value={selectedTemplate?.channel || "both"}
                      onValueChange={(value) => setSelectedTemplate({ ...selectedTemplate, channel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="sms">SMS Only</SelectItem>
                        <SelectItem value="both">Email + SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Timing</Label>
                  <Input
                    value={selectedTemplate?.timing || ""}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, timing: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={selectedTemplate?.subject || ""}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    rows={4}
                    value={selectedTemplate?.message || ""}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, message: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditTemplate(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTemplate} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
