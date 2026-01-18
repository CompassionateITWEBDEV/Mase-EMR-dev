"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileCheck, Dumbbell, AlertTriangle, TrendingUp, Eye, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function RehabilitationPage() {
  const [newProgramOpen, setNewProgramOpen] = useState(false)
  const [viewProgramOpen, setViewProgramOpen] = useState(false)
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [logComplianceOpen, setLogComplianceOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [complianceLogs, setComplianceLogs] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [rtmSessions, setRtmSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newProgram, setNewProgram] = useState({
    patient_id: "",
    therapist_id: "",
    program_name: "",
    diagnosis_codes: "",
    start_date: new Date().toISOString().slice(0, 10),
    duration_weeks: 4,
    frequency: "2x daily",
    program_goals: "",
    special_instructions: "",
  })
  const [newExercise, setNewExercise] = useState({
    exercise_name: "",
    exercise_category: "",
    body_part: "",
    description: "",
    instructions: "",
    difficulty_level: "moderate",
    duration_minutes: 10,
    equipment_needed: "",
  })
  const [complianceLog, setComplianceLog] = useState({
    program_id: "",
    patient_id: "",
    log_date: new Date().toISOString().slice(0, 10),
    exercises_completed: true,
    pain_level: 3,
    difficulty_rating: 3,
    duration_minutes: 20,
    notes: "",
  })

  const supabase = createBrowserClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load patients
      const { data: patientsData } = await supabase
        .from("patients")
        .select("id, first_name, last_name, date_of_birth")
        .order("last_name")
      setPatients(patientsData || [])

      // Load providers/therapists
      const { data: providersData } = await supabase
        .from("providers")
        .select("id, first_name, last_name, license_type")
        .order("last_name")
      setProviders(providersData || [])

      // Load HEP programs
      const { data: programsData } = await supabase
        .from("hep_programs")
        .select(`
          *,
          patients(first_name, last_name),
          providers:therapist_id(first_name, last_name)
        `)
        .order("created_at", { ascending: false })
      setPrograms(programsData || [])

      // Load exercises
      const { data: exercisesData } = await supabase
        .from("hep_exercises")
        .select("*")
        .eq("is_active", true)
        .order("exercise_name")
      setExercises(exercisesData || [])

      // Load compliance logs
      const { data: logsData } = await supabase
        .from("hep_patient_logs")
        .select(`
          *,
          patients(first_name, last_name),
          hep_programs(program_name)
        `)
        .order("log_date", { ascending: false })
        .limit(50)
      setComplianceLogs(logsData || [])

      // Load alerts
      const { data: alertsData } = await supabase
        .from("hep_compliance_alerts")
        .select(`
          *,
          patients(first_name, last_name),
          hep_programs(program_name)
        `)
        .eq("is_acknowledged", false)
        .order("created_at", { ascending: false })
      setAlerts(alertsData || [])

      // Load RTM sessions
      const { data: rtmData } = await supabase
        .from("rtm_billing_sessions")
        .select(`
          *,
          patients(first_name, last_name),
          hep_programs(program_name)
        `)
        .order("service_month", { ascending: false })
        .limit(20)
      setRtmSessions(rtmData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load rehabilitation data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProgram = async () => {
    if (!newProgram.patient_id || !newProgram.program_name) {
      toast.error("Please select a patient and enter a program name")
      return
    }

    try {
      const endDate = new Date(newProgram.start_date)
      endDate.setDate(endDate.getDate() + newProgram.duration_weeks * 7)

      const { error } = await supabase.from("hep_programs").insert({
        patient_id: newProgram.patient_id,
        therapist_id: newProgram.therapist_id || null,
        program_name: newProgram.program_name,
        diagnosis_codes: newProgram.diagnosis_codes
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        start_date: newProgram.start_date,
        end_date: endDate.toISOString().slice(0, 10),
        duration_weeks: newProgram.duration_weeks,
        frequency: newProgram.frequency,
        program_goals: newProgram.program_goals,
        special_instructions: newProgram.special_instructions,
        status: "active",
      })

      if (error) throw error

      toast.success("HEP program created successfully!")
      setNewProgramOpen(false)
      setNewProgram({
        patient_id: "",
        therapist_id: "",
        program_name: "",
        diagnosis_codes: "",
        start_date: new Date().toISOString().slice(0, 10),
        duration_weeks: 4,
        frequency: "2x daily",
        program_goals: "",
        special_instructions: "",
      })
      loadData()
    } catch (error) {
      console.error("Error creating program:", error)
      toast.error("Failed to create HEP program")
    }
  }

  const handleAddExercise = async () => {
    if (!newExercise.exercise_name || !newExercise.exercise_category) {
      toast.error("Please enter exercise name and category")
      return
    }

    try {
      const { error } = await supabase.from("hep_exercises").insert({
        ...newExercise,
        equipment_needed: newExercise.equipment_needed
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
        is_active: true,
      })

      if (error) throw error

      toast.success("Exercise added to library!")
      setAddExerciseOpen(false)
      setNewExercise({
        exercise_name: "",
        exercise_category: "",
        body_part: "",
        description: "",
        instructions: "",
        difficulty_level: "moderate",
        duration_minutes: 10,
        equipment_needed: "",
      })
      loadData()
    } catch (error) {
      console.error("Error adding exercise:", error)
      toast.error("Failed to add exercise")
    }
  }

  const handleLogCompliance = async () => {
    if (!complianceLog.program_id) {
      toast.error("Please select a program")
      return
    }

    try {
      const program = programs.find((p) => p.id === complianceLog.program_id)

      const { error } = await supabase.from("hep_patient_logs").insert({
        program_id: complianceLog.program_id,
        patient_id: program?.patient_id,
        log_date: complianceLog.log_date,
        completed: complianceLog.exercises_completed,
        pain_level: complianceLog.pain_level,
        difficulty_rating: complianceLog.difficulty_rating,
        duration_minutes: complianceLog.duration_minutes,
        notes: complianceLog.notes,
      })

      if (error) throw error

      toast.success("Compliance logged successfully!")
      setLogComplianceOpen(false)
      setComplianceLog({
        program_id: "",
        patient_id: "",
        log_date: new Date().toISOString().slice(0, 10),
        exercises_completed: true,
        pain_level: 3,
        difficulty_rating: 3,
        duration_minutes: 20,
        notes: "",
      })
      loadData()
    } catch (error) {
      console.error("Error logging compliance:", error)
      toast.error("Failed to log compliance")
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("hep_compliance_alerts")
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId)

      if (error) throw error

      toast.success("Alert acknowledged")
      loadData()
    } catch (error) {
      console.error("Error acknowledging alert:", error)
      toast.error("Failed to acknowledge alert")
    }
  }

  const handleUpdateProgramStatus = async (programId: string, status: string) => {
    try {
      const { error } = await supabase.from("hep_programs").update({ status }).eq("id", programId)

      if (error) throw error

      toast.success(`Program ${status === "completed" ? "completed" : "updated"}!`)
      loadData()
    } catch (error) {
      console.error("Error updating program:", error)
      toast.error("Failed to update program")
    }
  }

  const stats = {
    activePrograms: programs.filter((p) => p.status === "active").length,
    completedPrograms: programs.filter((p) => p.status === "completed").length,
    pendingAlerts: alerts.length,
    rtmRevenue: rtmSessions.reduce((sum, s) => {
      let amount = 0
      if (s.cpt_98975_billed) amount += 19.5
      if (s.cpt_98976_billed) amount += 50.77
      if (s.cpt_98977_billed) amount += 50.77
      if (s.cpt_98980_billed) amount += 61.98
      if (s.cpt_98981_billed) amount += 50.25
      return sum + amount
    }, 0),
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Rehabilitation & Home Exercise Programs</h1>
              <p className="text-muted-foreground">PT, OT, Speech Therapy with RTM Billing</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Dialog open={newProgramOpen} onOpenChange={setNewProgramOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create HEP Program
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Home Exercise Program</DialogTitle>
                    <DialogDescription>Set up a new HEP for remote therapeutic monitoring</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Patient *</Label>
                      <Select
                        value={newProgram.patient_id}
                        onValueChange={(v) => setNewProgram({ ...newProgram, patient_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.first_name} {p.last_name} - DOB: {p.date_of_birth}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Therapist</Label>
                      <Select
                        value={newProgram.therapist_id}
                        onValueChange={(v) => setNewProgram({ ...newProgram, therapist_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select therapist" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.first_name} {p.last_name} - {p.license_type || "Provider"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Program Name *</Label>
                      <Input
                        value={newProgram.program_name}
                        onChange={(e) => setNewProgram({ ...newProgram, program_name: e.target.value })}
                        placeholder="Post-op Knee Rehab Protocol"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={newProgram.start_date}
                          onChange={(e) => setNewProgram({ ...newProgram, start_date: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Duration (weeks)</Label>
                        <Input
                          type="number"
                          value={newProgram.duration_weeks}
                          onChange={(e) =>
                            setNewProgram({ ...newProgram, duration_weeks: Number.parseInt(e.target.value) || 4 })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Frequency</Label>
                      <Select
                        value={newProgram.frequency}
                        onValueChange={(v) => setNewProgram({ ...newProgram, frequency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1x daily">1x daily</SelectItem>
                          <SelectItem value="2x daily">2x daily</SelectItem>
                          <SelectItem value="3x daily">3x daily</SelectItem>
                          <SelectItem value="3x per week">3x per week</SelectItem>
                          <SelectItem value="5x per week">5x per week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Diagnosis Codes (comma separated)</Label>
                      <Input
                        value={newProgram.diagnosis_codes}
                        onChange={(e) => setNewProgram({ ...newProgram, diagnosis_codes: e.target.value })}
                        placeholder="M25.561, M17.11"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Program Goals</Label>
                      <Textarea
                        value={newProgram.program_goals}
                        onChange={(e) => setNewProgram({ ...newProgram, program_goals: e.target.value })}
                        placeholder="Improve knee ROM to 120 degrees, reduce pain to 2/10, return to ADLs"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Special Instructions</Label>
                      <Textarea
                        value={newProgram.special_instructions}
                        onChange={(e) => setNewProgram({ ...newProgram, special_instructions: e.target.value })}
                        placeholder="Stop if pain exceeds 5/10, ice after exercises"
                      />
                    </div>
                    <Button onClick={handleCreateProgram}>Create Program</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active HEP Programs</CardTitle>
                <Dumbbell className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.activePrograms}</div>
                <p className="text-xs text-muted-foreground">With RTM monitoring</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Programs</CardTitle>
                <FileCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.completedPrograms}</div>
                <p className="text-xs text-muted-foreground">Total completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.pendingAlerts}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RTM Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${loading ? "..." : stats.rtmRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Billable this period</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="programs" className="space-y-4">
            <TabsList>
              <TabsTrigger value="programs">HEP Programs</TabsTrigger>
              <TabsTrigger value="exercises">Exercise Library</TabsTrigger>
              <TabsTrigger value="compliance">Patient Compliance</TabsTrigger>
              <TabsTrigger value="rtm">RTM Billing</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="programs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Home Exercise Programs</CardTitle>
                  <CardDescription>Monitor patient progress and compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center py-4 text-muted-foreground">Loading programs...</p>
                  ) : programs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Program</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Therapist</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programs.map((program) => (
                          <TableRow key={program.id}>
                            <TableCell className="font-medium">{program.program_name}</TableCell>
                            <TableCell>
                              {program.patients?.first_name} {program.patients?.last_name}
                            </TableCell>
                            <TableCell>
                              {program.providers?.first_name} {program.providers?.last_name || "Unassigned"}
                            </TableCell>
                            <TableCell>{program.duration_weeks} weeks</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  program.status === "active"
                                    ? "default"
                                    : program.status === "completed"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {program.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProgram(program)
                                    setViewProgramOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {program.status === "active" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleUpdateProgramStatus(program.id, "completed")}
                                  >
                                    <FileCheck className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      No HEP programs found. Click "Create HEP Program" to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exercises" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Exercise Library</CardTitle>
                    <CardDescription>Pre-built exercises with instructions</CardDescription>
                  </div>
                  <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Exercise
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Exercise to Library</DialogTitle>
                        <DialogDescription>Create a new exercise for HEP programs</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Exercise Name *</Label>
                          <Input
                            value={newExercise.exercise_name}
                            onChange={(e) => setNewExercise({ ...newExercise, exercise_name: e.target.value })}
                            placeholder="Quad Sets"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Category *</Label>
                            <Select
                              value={newExercise.exercise_category}
                              onValueChange={(v) => setNewExercise({ ...newExercise, exercise_category: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="strengthening">Strengthening</SelectItem>
                                <SelectItem value="stretching">Stretching</SelectItem>
                                <SelectItem value="balance">Balance</SelectItem>
                                <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                                <SelectItem value="functional">Functional</SelectItem>
                                <SelectItem value="speech">Speech Therapy</SelectItem>
                                <SelectItem value="occupational">Occupational Therapy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Body Part</Label>
                            <Select
                              value={newExercise.body_part}
                              onValueChange={(v) => setNewExercise({ ...newExercise, body_part: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="knee">Knee</SelectItem>
                                <SelectItem value="hip">Hip</SelectItem>
                                <SelectItem value="shoulder">Shoulder</SelectItem>
                                <SelectItem value="back">Back</SelectItem>
                                <SelectItem value="neck">Neck</SelectItem>
                                <SelectItem value="ankle">Ankle</SelectItem>
                                <SelectItem value="wrist">Wrist</SelectItem>
                                <SelectItem value="full-body">Full Body</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Description</Label>
                          <Textarea
                            value={newExercise.description}
                            onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                            placeholder="Brief description of the exercise"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Instructions</Label>
                          <Textarea
                            value={newExercise.instructions}
                            onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })}
                            placeholder="Step-by-step instructions"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Difficulty</Label>
                            <Select
                              value={newExercise.difficulty_level}
                              onValueChange={(v) => setNewExercise({ ...newExercise, difficulty_level: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Duration (min)</Label>
                            <Input
                              type="number"
                              value={newExercise.duration_minutes}
                              onChange={(e) =>
                                setNewExercise({
                                  ...newExercise,
                                  duration_minutes: Number.parseInt(e.target.value) || 10,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Equipment Needed (comma separated)</Label>
                          <Input
                            value={newExercise.equipment_needed}
                            onChange={(e) => setNewExercise({ ...newExercise, equipment_needed: e.target.value })}
                            placeholder="Resistance band, yoga mat"
                          />
                        </div>
                        <Button onClick={handleAddExercise}>Add Exercise</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center py-4 text-muted-foreground">Loading exercises...</p>
                  ) : exercises.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {exercises.map((exercise) => (
                        <Card key={exercise.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{exercise.exercise_name}</CardTitle>
                            <CardDescription>
                              {exercise.exercise_category} • {exercise.body_part || "General"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {exercise.description || "No description"}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <Badge variant="outline">{exercise.difficulty_level || "Moderate"}</Badge>
                              <Badge variant="secondary">{exercise.duration_minutes || 10} min</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      No exercises in library. Click "Add Exercise" to create one.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Patient Compliance Tracking</CardTitle>
                    <CardDescription>Real-time monitoring of patient adherence</CardDescription>
                  </div>
                  <Dialog open={logComplianceOpen} onOpenChange={setLogComplianceOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Log Compliance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Log Patient Compliance</DialogTitle>
                        <DialogDescription>Record patient exercise completion</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Program *</Label>
                          <Select
                            value={complianceLog.program_id}
                            onValueChange={(v) => setComplianceLog({ ...complianceLog, program_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                              {programs
                                .filter((p) => p.status === "active")
                                .map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.program_name} - {p.patients?.first_name} {p.patients?.last_name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={complianceLog.log_date}
                            onChange={(e) => setComplianceLog({ ...complianceLog, log_date: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={complianceLog.exercises_completed}
                            onCheckedChange={(c) => setComplianceLog({ ...complianceLog, exercises_completed: !!c })}
                          />
                          <Label>Exercises Completed</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Pain Level (0-10)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              value={complianceLog.pain_level}
                              onChange={(e) =>
                                setComplianceLog({ ...complianceLog, pain_level: Number.parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Difficulty (1-5)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={complianceLog.difficulty_rating}
                              onChange={(e) =>
                                setComplianceLog({
                                  ...complianceLog,
                                  difficulty_rating: Number.parseInt(e.target.value) || 3,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={complianceLog.duration_minutes}
                            onChange={(e) =>
                              setComplianceLog({
                                ...complianceLog,
                                duration_minutes: Number.parseInt(e.target.value) || 20,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={complianceLog.notes}
                            onChange={(e) => setComplianceLog({ ...complianceLog, notes: e.target.value })}
                            placeholder="Any notes about the session"
                          />
                        </div>
                        <Button onClick={handleLogCompliance}>Save Log</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center py-4 text-muted-foreground">Loading logs...</p>
                  ) : complianceLogs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Program</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Pain Level</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complianceLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{log.log_date}</TableCell>
                            <TableCell>
                              {log.patients?.first_name} {log.patients?.last_name}
                            </TableCell>
                            <TableCell>{log.hep_programs?.program_name}</TableCell>
                            <TableCell>
                              <Badge variant={log.completed ? "default" : "destructive"}>
                                {log.completed ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.pain_level}/10</TableCell>
                            <TableCell>{log.duration_minutes} min</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      No compliance logs yet. Click "Log Compliance" to record patient activity.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rtm" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Remote Therapeutic Monitoring (RTM) Billing</CardTitle>
                  <CardDescription>CPT Codes: 98975, 98976, 98977, 98980, 98981</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <h4 className="font-semibold">98975 - Initial Setup</h4>
                      <p className="text-sm text-muted-foreground">RTM device setup, patient education (one-time)</p>
                      <p className="mt-2 text-lg font-bold text-green-600">$19.50</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h4 className="font-semibold">98977 - Monthly Monitoring</h4>
                      <p className="text-sm text-muted-foreground">16+ days data, 30 min treatment mgmt</p>
                      <p className="mt-2 text-lg font-bold text-green-600">$50.77</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h4 className="font-semibold">98980 - Interactive Contact</h4>
                      <p className="text-sm text-muted-foreground">First 20 min of interactive communication</p>
                      <p className="mt-2 text-lg font-bold text-green-600">$61.98</p>
                    </div>
                  </div>

                  {rtmSessions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Program</TableHead>
                          <TableHead>CPT Codes Billed</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rtmSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{session.service_month}</TableCell>
                            <TableCell>
                              {session.patients?.first_name} {session.patients?.last_name}
                            </TableCell>
                            <TableCell>{session.hep_programs?.program_name}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {session.cpt_98975_billed && <Badge variant="outline">98975</Badge>}
                                {session.cpt_98976_billed && <Badge variant="outline">98976</Badge>}
                                {session.cpt_98977_billed && <Badge variant="outline">98977</Badge>}
                                {session.cpt_98980_billed && <Badge variant="outline">98980</Badge>}
                                {session.cpt_98981_billed && <Badge variant="outline">98981</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={session.billing_status === "billed" ? "default" : "secondary"}>
                                {session.billing_status || "pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      No RTM billing sessions yet. Create HEP programs and log compliance to generate billable sessions.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Alerts</CardTitle>
                  <CardDescription>Patients requiring therapist attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center py-4 text-muted-foreground">Loading alerts...</p>
                  ) : alerts.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <AlertTriangle
                              className={`h-5 w-5 ${alert.severity === "high" ? "text-red-500" : "text-orange-500"}`}
                            />
                            <div>
                              <p className="text-sm font-medium">{alert.alert_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {alert.patients?.first_name} {alert.patients?.last_name} -{" "}
                                {alert.hep_programs?.program_name}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleAcknowledgeAlert(alert.id)}>
                            Acknowledge
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-sm text-muted-foreground">No pending alerts</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* View Program Dialog */}
      <Dialog open={viewProgramOpen} onOpenChange={setViewProgramOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Program Details</DialogTitle>
          </DialogHeader>
          {selectedProgram && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Program Name</Label>
                  <p className="font-medium">{selectedProgram.program_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <Badge>{selectedProgram.status}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p>
                    {selectedProgram.patients?.first_name} {selectedProgram.patients?.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Therapist</Label>
                  <p>
                    {selectedProgram.providers?.first_name} {selectedProgram.providers?.last_name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p>{selectedProgram.start_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p>{selectedProgram.duration_weeks} weeks</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Frequency</Label>
                  <p>{selectedProgram.frequency}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Diagnosis Codes</Label>
                  <p>{selectedProgram.diagnosis_codes?.join(", ") || "None"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Goals</Label>
                <p className="text-sm">{selectedProgram.program_goals || "No goals specified"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Special Instructions</Label>
                <p className="text-sm">{selectedProgram.special_instructions || "None"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
