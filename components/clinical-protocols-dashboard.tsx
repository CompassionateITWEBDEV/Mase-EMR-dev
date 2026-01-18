"use client"

import type React from "react"
import { useState, useCallback } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  Plus,
  Activity,
  Heart,
  TrendingUp,
  Settings,
  Trash2,
  Edit,
  RefreshCw,
  CheckCircle2,
} from "lucide-react"

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface Protocol {
  id: string
  name: string
  category: string
  description: string
  frequency: string
  protocol_steps: Array<{ step: number; action: string; timing?: string }>
  triggers: Record<string, unknown>
  is_active: boolean
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ClinicalProtocolsDashboard() {
  const { data, error, isLoading, mutate } = useSWR("/api/clinical-protocols", fetcher, {
    refreshInterval: 30000,
  })

  const [isNewCowsOpen, setIsNewCowsOpen] = useState(false)
  const [isNewCiwaOpen, setIsNewCiwaOpen] = useState(false)
  const [isNewVitalsOpen, setIsNewVitalsOpen] = useState(false)
  const [isNewProtocolOpen, setIsNewProtocolOpen] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null)

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "mild":
      case "minimal":
        return "bg-green-100 text-green-800"
      case "moderate":
      case "mild to moderate":
        return "bg-yellow-100 text-yellow-800"
      case "moderately severe":
      case "severe":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleRefresh = useCallback(() => {
    mutate()
  }, [mutate])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load clinical protocols data</span>
          </div>
          <Button onClick={handleRefresh} className="mt-4 bg-transparent" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const {
    cowsAssessments = [],
    ciwaAssessments = [],
    vitalSigns = [],
    protocols = [],
    patients = [],
    stats = {},
  } = data || {}

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">COWS Assessments</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cowsThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CIWA Assessments</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ciwaThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vitals Today</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vitalsToday || 0}</div>
            <p className="text-xs text-muted-foreground">Measurements taken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Heart Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHeartRate || "--"}</div>
            <p className="text-xs text-muted-foreground">BPM across patients</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="cows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cows">COWS Assessments</TabsTrigger>
          <TabsTrigger value="ciwa">CIWA Assessments</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          <TabsTrigger value="protocols">Protocol Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="cows" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>COWS (Clinical Opiate Withdrawal Scale)</CardTitle>
                  <CardDescription>Assess opioid withdrawal severity</CardDescription>
                </div>
                <Dialog open={isNewCowsOpen} onOpenChange={setIsNewCowsOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New COWS Assessment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>COWS Assessment</DialogTitle>
                    </DialogHeader>
                    <COWSAssessmentForm
                      patients={patients}
                      onClose={() => setIsNewCowsOpen(false)}
                      onSuccess={() => {
                        setIsNewCowsOpen(false)
                        mutate()
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {cowsAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No COWS assessments recorded yet</p>
                  <p className="text-sm">Click the button above to record a new assessment</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Total Score</TableHead>
                      <TableHead>Severity Level</TableHead>
                      <TableHead>Assessment Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cowsAssessments.map((assessment: any) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.patientName}</TableCell>
                        <TableCell className="font-mono text-lg">{assessment.totalScore}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(assessment.severityLevel)}>
                            {assessment.severityLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(assessment.assessmentDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ciwa" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CIWA (Clinical Institute Withdrawal Assessment)</CardTitle>
                  <CardDescription>Assess alcohol withdrawal severity</CardDescription>
                </div>
                <Dialog open={isNewCiwaOpen} onOpenChange={setIsNewCiwaOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New CIWA Assessment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>CIWA Assessment</DialogTitle>
                    </DialogHeader>
                    <CIWAAssessmentForm
                      patients={patients}
                      onClose={() => setIsNewCiwaOpen(false)}
                      onSuccess={() => {
                        setIsNewCiwaOpen(false)
                        mutate()
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {ciwaAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No CIWA assessments recorded yet</p>
                  <p className="text-sm">Click the button above to record a new assessment</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Total Score</TableHead>
                      <TableHead>Severity Level</TableHead>
                      <TableHead>Assessment Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ciwaAssessments.map((assessment: any) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.patientName}</TableCell>
                        <TableCell className="font-mono text-lg">{assessment.totalScore}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(assessment.severityLevel)}>
                            {assessment.severityLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(assessment.assessmentDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vital Signs</CardTitle>
                  <CardDescription>Track patient vital signs measurements</CardDescription>
                </div>
                <Dialog open={isNewVitalsOpen} onOpenChange={setIsNewVitalsOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Vitals
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Record Vital Signs</DialogTitle>
                    </DialogHeader>
                    <VitalSignsForm
                      patients={patients}
                      onClose={() => setIsNewVitalsOpen(false)}
                      onSuccess={() => {
                        setIsNewVitalsOpen(false)
                        mutate()
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {vitalSigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No vital signs recorded yet</p>
                  <p className="text-sm">Click the button above to record vitals</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Blood Pressure</TableHead>
                      <TableHead>Heart Rate</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>O2 Sat</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vitalSigns.map((vitals: any) => (
                      <TableRow key={vitals.id}>
                        <TableCell className="font-medium">{vitals.patientName}</TableCell>
                        <TableCell className="font-mono">
                          {vitals.systolicBp && vitals.diastolicBp
                            ? `${vitals.systolicBp}/${vitals.diastolicBp}`
                            : "--"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {vitals.heartRate ? `${vitals.heartRate} BPM` : "--"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {vitals.temperature ? `${vitals.temperature}°F` : "--"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : "--"}
                        </TableCell>
                        <TableCell>{new Date(vitals.measurementDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Trends
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocols">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Clinical Protocol Templates</CardTitle>
                  <CardDescription>
                    Configure and manage clinical protocols for opioid withdrawal, alcohol withdrawal, and routine
                    vitals
                  </CardDescription>
                </div>
                <Dialog open={isNewProtocolOpen} onOpenChange={setIsNewProtocolOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Protocol
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Protocol</DialogTitle>
                    </DialogHeader>
                    <ProtocolForm
                      onClose={() => setIsNewProtocolOpen(false)}
                      onSuccess={() => {
                        setIsNewProtocolOpen(false)
                        mutate()
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {protocols.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-center py-4">
                    No custom protocols configured. Use the default protocols below or create your own.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DefaultProtocolCard
                      title="Opioid Withdrawal Protocol"
                      description="COWS assessment every 4 hours with medication management based on severity score"
                      category="opioid"
                      onConfigure={() => setIsNewProtocolOpen(true)}
                    />
                    <DefaultProtocolCard
                      title="Alcohol Withdrawal Protocol"
                      description="CIWA assessment every 2 hours with seizure precautions and benzodiazepine taper"
                      category="alcohol"
                      onConfigure={() => setIsNewProtocolOpen(true)}
                    />
                    <DefaultProtocolCard
                      title="Daily Vitals Protocol"
                      description="Routine vital signs monitoring for all patients - BP, HR, Temp, O2 Sat, Weight"
                      category="vitals"
                      onConfigure={() => setIsNewProtocolOpen(true)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {protocols.map((protocol: Protocol) => (
                    <Card key={protocol.id} className={!protocol.is_active ? "opacity-60" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{protocol.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {protocol.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {protocol.is_active && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">{protocol.description}</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Frequency: {protocol.frequency || "As needed"}
                        </p>
                        {protocol.protocol_steps && protocol.protocol_steps.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-medium mb-1">Protocol Steps:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {protocol.protocol_steps.slice(0, 3).map((step, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                                  <span>{step.action}</span>
                                </li>
                              ))}
                              {protocol.protocol_steps.length > 3 && (
                                <li className="text-muted-foreground">
                                  +{protocol.protocol_steps.length - 3} more steps
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setEditingProtocol(protocol)}>
                                <Edit className="h-3 w-3 mr-1" />
                                Configure
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Protocol: {protocol.name}</DialogTitle>
                              </DialogHeader>
                              <ProtocolForm
                                protocol={protocol}
                                onClose={() => setEditingProtocol(null)}
                                onSuccess={() => {
                                  setEditingProtocol(null)
                                  mutate()
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {/* Add default protocol cards if less than 3 custom protocols */}
                  {protocols.length < 3 && (
                    <>
                      {!protocols.some((p: Protocol) => p.category === "opioid") && (
                        <DefaultProtocolCard
                          title="Opioid Withdrawal Protocol"
                          description="COWS assessment every 4 hours with medication management"
                          category="opioid"
                          onConfigure={() => setIsNewProtocolOpen(true)}
                        />
                      )}
                      {!protocols.some((p: Protocol) => p.category === "alcohol") && (
                        <DefaultProtocolCard
                          title="Alcohol Withdrawal Protocol"
                          description="CIWA assessment every 2 hours with seizure precautions"
                          category="alcohol"
                          onConfigure={() => setIsNewProtocolOpen(true)}
                        />
                      )}
                      {!protocols.some((p: Protocol) => p.category === "vitals") && (
                        <DefaultProtocolCard
                          title="Daily Vitals Protocol"
                          description="Routine vital signs monitoring for all patients"
                          category="vitals"
                          onConfigure={() => setIsNewProtocolOpen(true)}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DefaultProtocolCard({
  title,
  description,
  category,
  onConfigure,
}: {
  title: string
  description: string
  category: string
  onConfigure: () => void
}) {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Badge variant="outline" className="w-fit">
          {category}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button size="sm" onClick={onConfigure}>
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </CardContent>
    </Card>
  )
}

function ProtocolForm({
  protocol,
  onClose,
  onSuccess,
}: {
  protocol?: Protocol
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: protocol?.name || "",
    category: protocol?.category || "opioid",
    description: protocol?.description || "",
    frequency: protocol?.frequency || "Every 4 hours",
    isActive: protocol?.is_active ?? true,
    protocolSteps: protocol?.protocol_steps || [{ step: 1, action: "", timing: "" }],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addStep = () => {
    setFormData({
      ...formData,
      protocolSteps: [...formData.protocolSteps, { step: formData.protocolSteps.length + 1, action: "", timing: "" }],
    })
  }

  const removeStep = (index: number) => {
    const newSteps = formData.protocolSteps.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      protocolSteps: newSteps.map((s, i) => ({ ...s, step: i + 1 })),
    })
  }

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...formData.protocolSteps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setFormData({ ...formData, protocolSteps: newSteps })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const method = protocol ? "PUT" : "POST"
      const body = protocol ? { id: protocol.id, data: formData } : { type: "protocol", data: formData }

      const res = await fetch("/api/clinical-protocols", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSuccess()
      } else {
        alert("Failed to save protocol")
      }
    } catch (error) {
      console.error("Error saving protocol:", error)
      alert("Error saving protocol")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Protocol Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Opioid Withdrawal Management"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opioid">Opioid Withdrawal</SelectItem>
              <SelectItem value="alcohol">Alcohol Withdrawal</SelectItem>
              <SelectItem value="vitals">Vital Signs</SelectItem>
              <SelectItem value="assessment">General Assessment</SelectItem>
              <SelectItem value="medication">Medication Management</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the protocol purpose and when to use it..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frequency">Assessment Frequency</Label>
          <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Every 1 hour">Every 1 hour</SelectItem>
              <SelectItem value="Every 2 hours">Every 2 hours</SelectItem>
              <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
              <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
              <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
              <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
              <SelectItem value="Once daily">Once daily</SelectItem>
              <SelectItem value="As needed">As needed (PRN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Protocol Active</Label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Protocol Steps</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="h-4 w-4 mr-1" />
            Add Step
          </Button>
        </div>
        {formData.protocolSteps.map((step, index) => (
          <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/50">
            <span className="text-sm font-medium text-muted-foreground pt-2 w-8">{step.step}.</span>
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Action (e.g., Perform COWS assessment)"
                value={step.action}
                onChange={(e) => updateStep(index, "action", e.target.value)}
              />
              <Input
                placeholder="Timing/Trigger (e.g., If score >= 13)"
                value={step.timing || ""}
                onChange={(e) => updateStep(index, "timing", e.target.value)}
              />
            </div>
            {formData.protocolSteps.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStep(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : protocol ? "Update Protocol" : "Create Protocol"}
        </Button>
      </div>
    </form>
  )
}

function COWSAssessmentForm({
  patients,
  onClose,
  onSuccess,
}: {
  patients: Patient[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    patientId: "",
    restingPulseRate: 0,
    sweating: 0,
    restlessness: 0,
    pupilSize: 0,
    boneJointAches: 0,
    runnyNoseTearing: 0,
    giUpset: 0,
    tremor: 0,
    yawning: 0,
    anxietyIrritability: 0,
    goosefleshSkin: 0,
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const cowsItems = [
    { key: "restingPulseRate", label: "Resting Pulse Rate", description: "Pulse rate at rest" },
    { key: "sweating", label: "Sweating", description: "Over past half hour" },
    { key: "restlessness", label: "Restlessness", description: "Observation during assessment" },
    { key: "pupilSize", label: "Pupil Size", description: "Compared to normal room light" },
    { key: "boneJointAches", label: "Bone/Joint Aches", description: "If patient was having pain" },
    { key: "runnyNoseTearing", label: "Runny Nose/Tearing", description: "Not accounted for by cold" },
    { key: "giUpset", label: "GI Upset", description: "Over last half hour" },
    { key: "tremor", label: "Tremor", description: "Observation of outstretched hands" },
    { key: "yawning", label: "Yawning", description: "Observation during assessment" },
    { key: "anxietyIrritability", label: "Anxiety/Irritability", description: "Current presentation" },
    { key: "goosefleshSkin", label: "Gooseflesh Skin", description: "Observation" },
  ]

  const totalScore = Object.entries(formData).reduce(
    (sum, [key, val]) => (typeof val === "number" && key !== "patientId" ? sum + val : sum),
    0,
  )

  const getSeverityLevel = (score: number) => {
    if (score <= 12) return "Mild"
    if (score <= 24) return "Moderate"
    if (score <= 36) return "Moderately Severe"
    return "Severe"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.patientId) {
      alert("Please select a patient")
      return
    }
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/clinical-protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cows", data: formData }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        alert("Failed to save COWS assessment")
      }
    } catch (error) {
      console.error("Error saving COWS:", error)
      alert("Error saving assessment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="patient">Patient</Label>
        <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cowsItems.map((item) => (
          <div key={item.key}>
            <Label className="text-sm">{item.label}</Label>
            <p className="text-xs text-muted-foreground mb-1">{item.description}</p>
            <Select
              value={formData[item.key as keyof typeof formData]?.toString()}
              onValueChange={(value) => setFormData({ ...formData, [item.key]: Number.parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 - None</SelectItem>
                <SelectItem value="1">1 - Mild</SelectItem>
                <SelectItem value="2">2 - Moderate</SelectItem>
                <SelectItem value="3">3 - Moderately Severe</SelectItem>
                <SelectItem value="4">4 - Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total COWS Score:</span>
          <span className="text-2xl font-bold">{totalScore}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="font-medium">Severity Level:</span>
          <Badge
            className={
              totalScore <= 12
                ? "bg-green-100 text-green-800"
                : totalScore <= 24
                  ? "bg-yellow-100 text-yellow-800"
                  : totalScore <= 36
                    ? "bg-orange-100 text-orange-800"
                    : "bg-red-100 text-red-800"
            }
          >
            {getSeverityLevel(totalScore)}
          </Badge>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional observations..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Assessment"}
        </Button>
      </div>
    </form>
  )
}

function CIWAAssessmentForm({
  patients,
  onClose,
  onSuccess,
}: {
  patients: Patient[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    patientId: "",
    nauseaVomiting: 0,
    tremor: 0,
    paroxysmalSweats: 0,
    anxiety: 0,
    agitation: 0,
    tactileDisturbances: 0,
    auditoryDisturbances: 0,
    visualDisturbances: 0,
    headacheFullness: 0,
    orientation: 0,
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const ciwaItems = [
    { key: "nauseaVomiting", label: "Nausea/Vomiting", max: 7 },
    { key: "tremor", label: "Tremor", max: 7 },
    { key: "paroxysmalSweats", label: "Paroxysmal Sweats", max: 7 },
    { key: "anxiety", label: "Anxiety", max: 7 },
    { key: "agitation", label: "Agitation", max: 7 },
    { key: "tactileDisturbances", label: "Tactile Disturbances", max: 7 },
    { key: "auditoryDisturbances", label: "Auditory Disturbances", max: 7 },
    { key: "visualDisturbances", label: "Visual Disturbances", max: 7 },
    { key: "headacheFullness", label: "Headache/Fullness", max: 7 },
    { key: "orientation", label: "Orientation", max: 4 },
  ]

  const totalScore = Object.entries(formData).reduce(
    (sum, [key, val]) => (typeof val === "number" && key !== "patientId" ? sum + val : sum),
    0,
  )

  const getSeverityLevel = (score: number) => {
    if (score <= 9) return "Minimal"
    if (score <= 15) return "Mild to Moderate"
    return "Severe"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.patientId) {
      alert("Please select a patient")
      return
    }
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/clinical-protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ciwa", data: formData }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        alert("Failed to save CIWA assessment")
      }
    } catch (error) {
      console.error("Error saving CIWA:", error)
      alert("Error saving assessment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="patient">Patient</Label>
        <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ciwaItems.map((item) => (
          <div key={item.key}>
            <Label>{item.label}</Label>
            <Select
              value={formData[item.key as keyof typeof formData]?.toString()}
              onValueChange={(value) => setFormData({ ...formData, [item.key]: Number.parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: item.max + 1 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total CIWA Score:</span>
          <span className="text-2xl font-bold">{totalScore}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="font-medium">Severity Level:</span>
          <Badge
            className={
              totalScore <= 9
                ? "bg-green-100 text-green-800"
                : totalScore <= 15
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }
          >
            {getSeverityLevel(totalScore)}
          </Badge>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional observations..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Assessment"}
        </Button>
      </div>
    </form>
  )
}

function VitalSignsForm({
  patients,
  onClose,
  onSuccess,
}: {
  patients: Patient[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    patientId: "",
    systolicBp: "",
    diastolicBp: "",
    heartRate: "",
    respiratoryRate: "",
    temperature: "",
    oxygenSaturation: "",
    weight: "",
    painScale: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.patientId) {
      alert("Please select a patient")
      return
    }
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/clinical-protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vitals", data: formData }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        alert("Failed to save vital signs")
      }
    } catch (error) {
      console.error("Error saving vitals:", error)
      alert("Error saving vital signs")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="patient">Patient</Label>
        <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="systolic">Systolic BP</Label>
          <Input
            id="systolic"
            type="number"
            value={formData.systolicBp}
            onChange={(e) => setFormData({ ...formData, systolicBp: e.target.value })}
            placeholder="120"
          />
        </div>

        <div>
          <Label htmlFor="diastolic">Diastolic BP</Label>
          <Input
            id="diastolic"
            type="number"
            value={formData.diastolicBp}
            onChange={(e) => setFormData({ ...formData, diastolicBp: e.target.value })}
            placeholder="80"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="heartRate">Heart Rate</Label>
          <Input
            id="heartRate"
            type="number"
            value={formData.heartRate}
            onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
            placeholder="72"
          />
        </div>

        <div>
          <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
          <Input
            id="respiratoryRate"
            type="number"
            value={formData.respiratoryRate}
            onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
            placeholder="16"
          />
        </div>

        <div>
          <Label htmlFor="temperature">Temperature (°F)</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
            placeholder="98.6"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="oxygenSaturation">O2 Saturation (%)</Label>
          <Input
            id="oxygenSaturation"
            type="number"
            value={formData.oxygenSaturation}
            onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
            placeholder="98"
          />
        </div>

        <div>
          <Label htmlFor="weight">Weight (lbs)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="150"
          />
        </div>

        <div>
          <Label htmlFor="painScale">Pain Scale (0-10)</Label>
          <Input
            id="painScale"
            type="number"
            min="0"
            max="10"
            value={formData.painScale}
            onChange={(e) => setFormData({ ...formData, painScale: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional observations..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Vitals"}
        </Button>
      </div>
    </form>
  )
}
