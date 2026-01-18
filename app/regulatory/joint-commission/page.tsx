"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Building,
  FileCheck,
  Users,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Download,
  Search,
  Star,
  Target,
  Clipboard,
  Plus,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"

interface AccreditationStandard {
  id: string
  category: string
  standard: string
  description: string
  status: "met" | "partial" | "not_met" | "not_applicable"
  score: number
  lastReviewed: string
  evidence?: string[]
  findings?: string | null
  recommendations?: string | null
}

interface QualityMeasure {
  id: string
  measure: string
  target: number
  current: number
  trend: "improving" | "stable" | "declining"
  lastUpdated: string
  category: "patient_safety" | "clinical_quality" | "patient_experience"
}

interface PatientSafetyEvent {
  id: string
  date: string
  type: string
  severity: "low" | "moderate" | "high" | "sentinel"
  description: string
  status: "reported" | "investigating" | "resolved"
  rootCause?: string
  actions?: string[]
}

interface DocumentationStatus {
  policies: { name: string; status: string }[]
  training: { name: string; completion: number }[]
}

interface JointCommissionData {
  facilityInfo: {
    name: string
    accreditationStatus: string
    accreditationExpiry: string
    lastSurvey: string
    nextSurvey: string
    programType: string
    bedCount: number
    administrator: string
    medicalDirector: string
  }
  accreditationStandards: AccreditationStandard[]
  qualityMeasures: QualityMeasure[]
  safetyEvents: PatientSafetyEvent[]
  documentationStatus: DocumentationStatus
  surveyReadiness: {
    score: number
    criticalItems: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function JointCommissionPortalPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("standards")
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    type: "",
    severity: "low",
    description: "",
    rootCause: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<JointCommissionData>("/api/joint-commission", fetcher)

  const handleReportEvent = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/joint-commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      })
      if (response.ok) {
        setNewEvent({ type: "", severity: "low", description: "", rootCause: "" })
        setIsReportDialogOpen(false)
        mutate()
      }
    } catch (err) {
      console.error("Error reporting event:", err)
    } finally {
      setIsSubmitting(false)
    }
  }, [newEvent, mutate])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "met":
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "partial":
      case "investigating":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "not_met":
      case "reported":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "met":
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Met</Badge>
      case "partial":
      case "investigating":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
      case "not_met":
      case "reported":
        return <Badge className="bg-red-100 text-red-800">Not Met</Badge>
      case "not_applicable":
        return <Badge variant="outline">N/A</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <span className="text-green-600">↗</span>
      case "declining":
        return <span className="text-red-600">↘</span>
      default:
        return <span className="text-muted-foreground">→</span>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "sentinel":
        return <Badge className="bg-red-600 text-white">Sentinel Event</Badge>
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case "moderate":
        return <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
      case "low":
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getDocStatusBadge = (status: string) => {
    switch (status) {
      case "current":
        return <Badge className="bg-green-100 text-green-800">Current</Badge>
      case "review_due":
        return <Badge className="bg-yellow-100 text-yellow-800">Review Due</Badge>
      case "outdated":
        return <Badge className="bg-red-100 text-red-800">Outdated</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTrainingBadge = (completion: number) => {
    if (completion >= 95) {
      return <Badge className="bg-green-100 text-green-800">{completion}% Complete</Badge>
    } else if (completion >= 80) {
      return <Badge className="bg-yellow-100 text-yellow-800">{completion}% Complete</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">{completion}% Complete</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Joint Commission data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
            <CardDescription>Unable to load Joint Commission data. Please try again later.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => mutate()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { facilityInfo, accreditationStandards, qualityMeasures, safetyEvents, documentationStatus, surveyReadiness } =
    data

  const overallComplianceScore =
    accreditationStandards.length > 0
      ? Math.round(accreditationStandards.reduce((sum, std) => sum + std.score, 0) / accreditationStandards.length)
      : 0

  const filteredStandards = accreditationStandards.filter((std) => {
    const matchesCategory = selectedCategory === "all" || std.category === selectedCategory
    const matchesSearch =
      std.standard.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = [...new Set(accreditationStandards.map((s) => s.category))]

  return (
    <div className="min-h-screen bg-background">
      {/* Joint Commission Header */}
      <div className="bg-emerald-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-emerald-800" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Joint Commission Survey Portal</h1>
                <p className="text-emerald-200">Accreditation Standards & Quality Measures</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-200">Surveyor Access</p>
              <p className="font-medium">JC-67890 • Surveyor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Facility Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Facility Accreditation Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Facility Name</Label>
                <p className="font-medium">{facilityInfo.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Accreditation Status</Label>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{facilityInfo.accreditationStatus}</p>
                  <Badge className="bg-green-100 text-green-800">Current</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Program Type</Label>
                <p className="font-medium">{facilityInfo.programType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Next Survey</Label>
                <p className="font-medium">{facilityInfo.nextSurvey}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Administrator</Label>
                <p className="font-medium">{facilityInfo.administrator}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Medical Director</Label>
                <p className="font-medium">{facilityInfo.medicalDirector}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Survey</Label>
                <p className="font-medium">{facilityInfo.lastSurvey}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Accreditation Expires</Label>
                <p className="font-medium">{facilityInfo.accreditationExpiry}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{overallComplianceScore}%</div>
              <Progress value={overallComplianceScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">Accreditation standards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Standards Not Met</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {accreditationStandards.filter((s) => s.status === "not_met").length}
              </div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Measures</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {qualityMeasures.filter((m) => m.current >= m.target).length}/{qualityMeasures.length}
              </div>
              <p className="text-xs text-muted-foreground">Meeting targets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Events (30d)</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{safetyEvents.length}</div>
              <p className="text-xs text-muted-foreground">
                {safetyEvents.filter((e) => e.status === "resolved").length} resolved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="standards">Standards</TabsTrigger>
            <TabsTrigger value="quality">Quality Measures</TabsTrigger>
            <TabsTrigger value="safety">Patient Safety</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="reports">Survey Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="standards" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <CardTitle>Accreditation Standards</CardTitle>
                    <CardDescription>Joint Commission standards compliance assessment</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search standards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStandards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No standards found matching your criteria</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredStandards.map((standard) => (
                      <div key={standard.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {getStatusIcon(standard.status)}
                              <h4 className="font-medium">{standard.standard}</h4>
                              {getStatusBadge(standard.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{standard.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span>Score: {standard.score}%</span>
                              <span>Last reviewed: {format(new Date(standard.lastReviewed), "MMM dd, yyyy")}</span>
                              <Badge variant="outline">{standard.category}</Badge>
                            </div>
                            {standard.findings && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-sm font-medium text-yellow-800">Findings:</p>
                                <p className="text-sm text-yellow-700">{standard.findings}</p>
                              </div>
                            )}
                            {standard.recommendations && (
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm font-medium text-blue-800">Recommendations:</p>
                                <p className="text-sm text-blue-700">{standard.recommendations}</p>
                              </div>
                            )}
                            {standard.evidence && (
                              <div className="mt-2">
                                <p className="text-sm font-medium">Evidence:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {standard.evidence.map((item, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {item}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold">{standard.score}%</div>
                              <Progress value={standard.score} className="w-20 mt-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Performance Measures</CardTitle>
                <CardDescription>Key performance indicators and quality metrics from real data</CardDescription>
              </CardHeader>
              <CardContent>
                {qualityMeasures.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No quality measures available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {qualityMeasures.map((measure) => (
                      <Card key={measure.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{measure.measure}</CardTitle>
                            <Badge variant="outline">{measure.category.replace(/_/g, " ")}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Current</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold">
                                  {measure.category === "patient_safety" ? measure.current : `${measure.current}%`}
                                </span>
                                {getTrendIcon(measure.trend)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Target</span>
                              <span className="font-medium">
                                {measure.category === "patient_safety" ? `≤${measure.target}` : `${measure.target}%`}
                              </span>
                            </div>
                            <Progress
                              value={
                                measure.category === "patient_safety"
                                  ? Math.max(0, 100 - (measure.current / measure.target) * 100)
                                  : (measure.current / measure.target) * 100
                              }
                              className="h-2"
                            />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Last updated: {format(new Date(measure.lastUpdated), "MMM dd")}</span>
                              <Badge
                                className={
                                  (
                                    measure.category === "patient_safety"
                                      ? measure.current <= measure.target
                                      : measure.current >= measure.target
                                  )
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {(
                                  measure.category === "patient_safety"
                                    ? measure.current <= measure.target
                                    : measure.current >= measure.target
                                )
                                  ? "Meeting Target"
                                  : "Below Target"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Patient Safety Events</CardTitle>
                    <CardDescription>Safety event reporting and root cause analysis</CardDescription>
                  </div>
                  <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Report Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Report Safety Event</DialogTitle>
                        <DialogDescription>
                          Document a new patient safety event for tracking and analysis
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Event Type</Label>
                          <Input
                            value={newEvent.type}
                            onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                            placeholder="e.g., Medication Error, Patient Fall"
                          />
                        </div>
                        <div>
                          <Label>Severity</Label>
                          <Select
                            value={newEvent.severity}
                            onValueChange={(value) => setNewEvent({ ...newEvent, severity: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="sentinel">Sentinel Event</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            placeholder="Describe what happened..."
                          />
                        </div>
                        <div>
                          <Label>Root Cause (if known)</Label>
                          <Textarea
                            value={newEvent.rootCause}
                            onChange={(e) => setNewEvent({ ...newEvent, rootCause: e.target.value })}
                            placeholder="What caused this event?"
                          />
                        </div>
                        <Button
                          onClick={handleReportEvent}
                          disabled={isSubmitting || !newEvent.type || !newEvent.description}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Report"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {safetyEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No safety events reported in the last 30 days</p>
                    <p className="text-sm mt-2">This is a positive indicator of patient safety</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safetyEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{format(new Date(event.date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{event.type}</TableCell>
                          <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                          <TableCell className="max-w-xs truncate">{event.description}</TableCell>
                          <TableCell>{getStatusBadge(event.status)}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Safety Event Details</DialogTitle>
                                  <DialogDescription>
                                    {event.type} - {format(new Date(event.date), "MMMM dd, yyyy")}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label className="font-medium">Description</Label>
                                    <p className="text-sm mt-1">{event.description}</p>
                                  </div>
                                  {event.rootCause && (
                                    <div>
                                      <Label className="font-medium">Root Cause</Label>
                                      <p className="text-sm mt-1">{event.rootCause}</p>
                                    </div>
                                  )}
                                  {event.actions && event.actions.length > 0 && (
                                    <div>
                                      <Label className="font-medium">Corrective Actions</Label>
                                      <ul className="text-sm mt-1 space-y-1">
                                        {event.actions.map((action, index) => (
                                          <li key={index} className="flex items-start space-x-2">
                                            <span>•</span>
                                            <span>{action}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentation Review</CardTitle>
                <CardDescription>Policy documents and evidence for accreditation standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Policies & Procedures</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {documentationStatus.policies.map((policy, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{policy.name}</span>
                          {getDocStatusBadge(policy.status)}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Training Records</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {documentationStatus.training.map((training, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{training.name}</span>
                          {getTrainingBadge(training.completion)}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Survey Reports</CardTitle>
                  <CardDescription>Generate comprehensive reports for Joint Commission review</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Accreditation Readiness Report
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Quality Measures Dashboard
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Heart className="h-4 w-4 mr-2" />
                    Patient Safety Summary
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Staff Competency Report
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Clipboard className="h-4 w-4 mr-2" />
                    Policy Compliance Review
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Survey Preparation</CardTitle>
                  <CardDescription>Tools and checklists for survey readiness</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <h4 className="font-medium text-emerald-800 mb-2">Survey Readiness Score</h4>
                    <div className="flex items-center space-x-2">
                      <Progress value={surveyReadiness.score} className="flex-1" />
                      <span className="font-bold text-emerald-800">{surveyReadiness.score}%</span>
                    </div>
                    <p className="text-sm text-emerald-700 mt-2">
                      {surveyReadiness.criticalItems > 0
                        ? `${surveyReadiness.criticalItems} critical item${surveyReadiness.criticalItems > 1 ? "s" : ""} need${surveyReadiness.criticalItems === 1 ? "s" : ""} attention before next survey`
                        : "All standards met - Ready for survey"}
                    </p>
                  </div>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Survey Preparation Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
