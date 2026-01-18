"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Video, Mic, Clock, FileText, Edit, Check, Phone, X, Users } from "lucide-react"
import { TelehealthSession } from "@/components/telehealth-session"
import { AutoDictationPanel } from "@/components/auto-dictation-panel"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ActiveSession {
  id: string
  patient: string
  patientId: string
  provider: string
  providerId: string
  startTime: Date
  type: "telehealth" | "in-person" | "audio"
  status: "in-progress" | "recording"
  appointmentId?: string
}

export function TelehealthDashboard() {
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)
  const [showAudioSessionDialog, setShowAudioSessionDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedProvider, setSelectedProvider] = useState("")
  const [sessionType, setSessionType] = useState("Individual Therapy")
  const [isStarting, setIsStarting] = useState(false)

  const { data, error, isLoading, mutate } = useSWR("/api/telehealth", fetcher, {
    refreshInterval: 30000,
  })

  const startSession = async (type: "telehealth" | "audio", appointmentData?: any) => {
    setIsStarting(true)
    try {
      const patientId = appointmentData?.patientId || selectedPatient
      const providerId = appointmentData?.providerId || selectedProvider

      if (!patientId || !providerId) {
        alert("Please select a patient and provider")
        setIsStarting(false)
        return
      }

      const response = await fetch("/api/telehealth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_session",
          patientId,
          providerId,
          sessionType: appointmentData?.type || sessionType,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const patient = data?.patients?.find((p: any) => p.id === patientId)
        const provider = data?.providers?.find((p: any) => p.id === providerId)

        const newSession: ActiveSession = {
          id: result.session.id,
          patient: patient ? `${patient.first_name} ${patient.last_name}` : appointmentData?.patient || "Patient",
          patientId,
          provider: provider ? `${provider.first_name} ${provider.last_name}` : appointmentData?.provider || "Provider",
          providerId,
          startTime: new Date(),
          type: type === "audio" ? "audio" : "telehealth",
          status: "in-progress",
          appointmentId: appointmentData?.id,
        }

        setActiveSessions((prev) => [...prev, newSession])
        setActiveSession(result.session.id)
        setShowNewSessionDialog(false)
        setShowAudioSessionDialog(false)
        setSelectedPatient("")
        setSelectedProvider("")
        mutate()
      }
    } catch (err) {
      console.error("Error starting session:", err)
      alert("Failed to start session")
    } finally {
      setIsStarting(false)
    }
  }

  const endSession = async (sessionId: string) => {
    const session = activeSessions.find((s) => s.id === sessionId)
    if (!session) return

    const duration = Math.round((new Date().getTime() - session.startTime.getTime()) / 60000)

    try {
      await fetch("/api/telehealth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end_session",
          appointmentId: sessionId,
          duration,
        }),
      })

      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSession === sessionId) {
        setActiveSession(null)
      }
      mutate()
    } catch (err) {
      console.error("Error ending session:", err)
    }
  }

  const getSessionDuration = (startTime: Date) => {
    const minutes = Math.round((new Date().getTime() - startTime.getTime()) / 60000)
    return `${minutes} min`
  }

  if (error) {
    return <div className="p-6 text-center text-destructive">Failed to load telehealth data. Please try again.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Telehealth & Session Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage virtual and in-person sessions with AI-powered documentation
          </p>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowNewSessionDialog(true)}>
            <Video className="mr-2 h-4 w-4" />
            Start Session
          </Button>
          <Button variant="outline" onClick={() => setShowAudioSessionDialog(true)}>
            <Mic className="mr-2 h-4 w-4" />
            Audio Only
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions">Active Sessions ({activeSessions.length})</TabsTrigger>
          <TabsTrigger value="appointments">Upcoming</TabsTrigger>
          <TabsTrigger value="dictation">Auto-Dictation</TabsTrigger>
          <TabsTrigger value="recordings">Session History</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Active Sessions</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Start a new session using the buttons above or from an upcoming appointment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {activeSessions.map((session) => (
                <Card key={session.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.patient}</CardTitle>
                      <Badge
                        variant={
                          session.type === "telehealth" ? "default" : session.type === "audio" ? "outline" : "secondary"
                        }
                      >
                        {session.type === "telehealth" ? "Virtual" : session.type === "audio" ? "Audio" : "In-Person"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Provider: {session.provider} • Started:{" "}
                      {session.startTime.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        Duration: {getSessionDuration(session.startTime)}
                      </span>
                      <Badge variant={session.status === "recording" ? "destructive" : "default"}>
                        {session.status === "recording" ? "Recording" : "In Progress"}
                      </Badge>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => setActiveSession(session.id)} className="flex-1">
                        {session.type === "audio" ? (
                          <Phone className="mr-2 h-4 w-4" />
                        ) : (
                          <Video className="mr-2 h-4 w-4" />
                        )}
                        {activeSession === session.id ? "View Session" : "Join Session"}
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Notes
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => endSession(session.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeSession && <TelehealthSession sessionId={activeSession} onClose={() => setActiveSession(null)} />}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Appointments</CardTitle>
              <CardDescription>Scheduled telehealth and in-person sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data?.appointments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No appointments scheduled for today.</div>
              ) : (
                <div className="space-y-4">
                  {data?.appointments?.map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            appointment.status === "in-progress"
                              ? "bg-green-500"
                              : appointment.status === "waiting"
                                ? "bg-yellow-500"
                                : "bg-primary"
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium">{appointment.patient}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.time} • {appointment.type}
                          </p>
                          <p className="text-sm text-muted-foreground">{appointment.provider}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startSession("telehealth", appointment)}
                          disabled={activeSessions.some((s) => s.appointmentId === appointment.id)}
                        >
                          <Video className="mr-2 h-4 w-4" />
                          {activeSessions.some((s) => s.appointmentId === appointment.id) ? "In Session" : "Start"}
                        </Button>
                        <Button size="sm" variant="ghost">
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dictation">
          <AutoDictationPanel />
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Recordings & Transcripts</CardTitle>
              <CardDescription>Review and edit AI-generated documentation</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-56" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data?.appointments?.filter((a: any) => a.status === "completed").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No completed sessions to review yet.</div>
              ) : (
                <div className="space-y-4">
                  {data?.appointments
                    ?.filter((a: any) => a.status === "completed")
                    .map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Session with {session.patient}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.time} • {session.duration} minutes • {session.provider}
                            </p>
                            <p className="text-sm text-muted-foreground">Status: Pending Review</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Review
                          </Button>
                          <Button size="sm">
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Telehealth Session</DialogTitle>
            <DialogDescription>Select a patient and provider to start a video session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {data?.patients?.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {data?.providers?.map((provider: any) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.first_name} {provider.last_name} ({provider.role || "Provider"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual Therapy">Individual Therapy</SelectItem>
                  <SelectItem value="Group Therapy">Group Therapy</SelectItem>
                  <SelectItem value="Medication Management">Medication Management</SelectItem>
                  <SelectItem value="Assessment">Assessment</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => startSession("telehealth")} disabled={isStarting}>
              {isStarting ? "Starting..." : "Start Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio Session Dialog */}
      <Dialog open={showAudioSessionDialog} onOpenChange={setShowAudioSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Audio-Only Session</DialogTitle>
            <DialogDescription>Select a patient and provider to start an audio-only session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {data?.patients?.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {data?.providers?.map((provider: any) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.first_name} {provider.last_name} ({provider.role || "Provider"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone Consultation">Phone Consultation</SelectItem>
                  <SelectItem value="Crisis Call">Crisis Call</SelectItem>
                  <SelectItem value="Follow-up Call">Follow-up Call</SelectItem>
                  <SelectItem value="Medication Check">Medication Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAudioSessionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => startSession("audio")} disabled={isStarting}>
              <Phone className="mr-2 h-4 w-4" />
              {isStarting ? "Starting..." : "Start Audio Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
