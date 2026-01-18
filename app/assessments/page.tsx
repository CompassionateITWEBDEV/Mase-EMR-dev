"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  User,
  TrendingUp,
  Brain,
  Heart,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const categoryIcons: Record<string, any> = {
  "Mental Health": Brain,
  "Substance Use": Heart,
  "Risk Assessment": Shield,
  "Comprehensive Assessment": ClipboardList,
  General: FileText,
}

const categoryColors: Record<string, string> = {
  "Mental Health": "bg-purple-500",
  "Substance Use": "bg-orange-500",
  "Risk Assessment": "bg-red-500",
  "Comprehensive Assessment": "bg-blue-500",
  General: "bg-gray-500",
}

export default function AssessmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [newAssessmentOpen, setNewAssessmentOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedForm, setSelectedForm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewAssessmentOpen, setViewAssessmentOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [completeAssessmentOpen, setCompleteAssessmentOpen] = useState(false)
  const [completionData, setCompletionData] = useState({
    total_score: "",
    severity_level: "",
    clinical_interpretation: "",
    recommendations: "",
  })

  const { data, error, isLoading, mutate } = useSWR("/api/assessments", fetcher, {
    refreshInterval: 30000,
  })

  const handleStartAssessment = useCallback(
    async (formId?: number) => {
      if (!selectedPatient) {
        toast.error("Please select a patient")
        return
      }
      const form = formId || selectedForm
      if (!form) {
        toast.error("Please select an assessment form")
        return
      }

      setIsSubmitting(true)
      try {
        const response = await fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_assessment",
            patient_id: selectedPatient,
            form_id: form,
            provider_id: null,
          }),
        })

        const result = await response.json()
        if (result.success) {
          toast.success("Assessment started successfully")
          setNewAssessmentOpen(false)
          setSelectedPatient("")
          setSelectedForm("")
          mutate()
        } else {
          toast.error(result.error || "Failed to start assessment")
        }
      } catch (err) {
        toast.error("Failed to start assessment")
      } finally {
        setIsSubmitting(false)
      }
    },
    [selectedPatient, selectedForm, mutate],
  )

  const handleCompleteAssessment = useCallback(async () => {
    if (!selectedAssessment) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_assessment",
          assessment_id: selectedAssessment.id,
          total_score: Number(completionData.total_score) || 0,
          severity_level: completionData.severity_level || "low",
          clinical_interpretation: completionData.clinical_interpretation,
          recommendations: completionData.recommendations,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success("Assessment completed successfully")
        setCompleteAssessmentOpen(false)
        setSelectedAssessment(null)
        setCompletionData({
          total_score: "",
          severity_level: "",
          clinical_interpretation: "",
          recommendations: "",
        })
        mutate()
      } else {
        toast.error(result.error || "Failed to complete assessment")
      }
    } catch (err) {
      toast.error("Failed to complete assessment")
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedAssessment, completionData, mutate])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; icon: any }> = {
      completed: { variant: "default", icon: CheckCircle },
      in_progress: { variant: "secondary", icon: Clock },
      scheduled: { variant: "outline", icon: Calendar },
      overdue: { variant: "destructive", icon: AlertTriangle },
    }
    const config = variants[status] || variants.scheduled
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: "default",
      moderate: "secondary",
      high: "destructive",
      pending: "outline",
    }
    return <Badge variant={variants[severity] || "outline"}>{severity || "pending"} risk</Badge>
  }

  const filteredAssessments = (data?.recentAssessments || []).filter(
    (assessment: any) =>
      assessment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.formName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 lg:pl-64 p-8">
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to load assessments</h2>
              <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
              <Button onClick={() => mutate()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Clinical Assessments</h1>
              <p className="text-muted-foreground mt-2">Standardized screening tools and clinical evaluations</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Dialog open={newAssessmentOpen} onOpenChange={setNewAssessmentOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    New Assessment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Start New Assessment</DialogTitle>
                    <DialogDescription>Select a patient and assessment type to begin</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient">Patient *</Label>
                      <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {(data?.patients || []).map((patient: any) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.first_name} {patient.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="form">Assessment Type *</Label>
                      <Select value={selectedForm} onValueChange={setSelectedForm}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assessment" />
                        </SelectTrigger>
                        <SelectContent>
                          {(data?.assessmentCatalog || []).map((form: any) => (
                            <SelectItem key={form.id} value={form.id.toString()}>
                              {form.form_name} ({form.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewAssessmentOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleStartAssessment()} disabled={isSubmitting}>
                      {isSubmitting ? "Starting..." : "Start Assessment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Assessment Types by Category */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <Skeleton className="h-8 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Object.entries(data?.categoryGroups || {}).map(([category, forms]: [string, any]) => {
                const IconComponent = categoryIcons[category] || FileText
                const colorClass = categoryColors[category] || "bg-gray-500"
                return (
                  <Card key={category} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <Badge variant="secondary">{forms.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold text-lg mb-2">{category}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {forms.length} assessment {forms.length === 1 ? "tool" : "tools"} available
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          ~
                          {Math.round(
                            forms.reduce((sum: number, f: any) => sum + (f.estimated_completion_minutes || 20), 0) /
                              forms.length,
                          )}{" "}
                          min avg
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Start
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Select {category} Assessment</DialogTitle>
                              <DialogDescription>Choose a specific assessment to administer</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Patient *</Label>
                                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select patient" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(data?.patients || []).map((patient: any) => (
                                      <SelectItem key={patient.id} value={patient.id}>
                                        {patient.first_name} {patient.last_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Assessment</Label>
                                <div className="grid gap-2">
                                  {forms.map((form: any) => (
                                    <Button
                                      key={form.id}
                                      variant="outline"
                                      className="justify-start h-auto py-3 bg-transparent"
                                      onClick={() => {
                                        if (selectedPatient) {
                                          handleStartAssessment(form.id)
                                        } else {
                                          toast.error("Please select a patient first")
                                        }
                                      }}
                                      disabled={isSubmitting}
                                    >
                                      <div className="text-left">
                                        <div className="font-medium">{form.form_name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {form.estimated_completion_minutes || 20} min •{" "}
                                          {form.description?.substring(0, 50)}...
                                        </div>
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Progress value={data?.statistics?.completionRate || 0} className="h-2" />
                      </div>
                      <span className="text-2xl font-bold">{data?.statistics?.completionRate || 0}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      {data?.statistics?.totalAssessments || 0} total assessments
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{data?.statistics?.avgScore || 0}</div>
                    <p className="text-xs text-muted-foreground mt-2">Across all assessment types</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">High Risk Cases</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-red-600">{data?.statistics?.highRiskCount || 0}</div>
                    <p className="text-xs text-muted-foreground mt-2">Requiring immediate attention</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Assessments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Assessments</CardTitle>
                  <CardDescription>Latest clinical evaluations and screenings</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredAssessments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assessments found</p>
                  <p className="text-sm">Start a new assessment to begin tracking patient evaluations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAssessments.map((assessment: any) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{assessment.formName}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{assessment.patientName}</span>
                            <span>•</span>
                            <span>{assessment.providerName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            {getStatusBadge(assessment.status)}
                            {assessment.severity_level && getSeverityBadge(assessment.severity_level)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(assessment.assessment_date).toLocaleDateString()}
                            {assessment.total_score && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Score: {assessment.total_score}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAssessment(assessment)
                            setViewAssessmentOpen(true)
                          }}
                        >
                          View
                        </Button>
                        {assessment.status === "in_progress" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAssessment(assessment)
                              setCompleteAssessmentOpen(true)
                            }}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Assessment Dialog */}
      <Dialog open={viewAssessmentOpen} onOpenChange={setViewAssessmentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assessment Details</DialogTitle>
            <DialogDescription>{selectedAssessment?.formName}</DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{selectedAssessment.patientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Provider</Label>
                  <p className="font-medium">{selectedAssessment.providerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{new Date(selectedAssessment.assessment_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedAssessment.status)}</div>
                </div>
                {selectedAssessment.total_score && (
                  <div>
                    <Label className="text-muted-foreground">Score</Label>
                    <p className="font-medium text-lg">{selectedAssessment.total_score}</p>
                  </div>
                )}
                {selectedAssessment.severity_level && (
                  <div>
                    <Label className="text-muted-foreground">Severity</Label>
                    <div className="mt-1">{getSeverityBadge(selectedAssessment.severity_level)}</div>
                  </div>
                )}
              </div>
              {selectedAssessment.clinical_interpretation && (
                <div>
                  <Label className="text-muted-foreground">Clinical Interpretation</Label>
                  <p className="mt-1 text-sm">{selectedAssessment.clinical_interpretation}</p>
                </div>
              )}
              {selectedAssessment.recommendations && (
                <div>
                  <Label className="text-muted-foreground">Recommendations</Label>
                  <p className="mt-1 text-sm">{selectedAssessment.recommendations}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Assessment Dialog */}
      <Dialog open={completeAssessmentOpen} onOpenChange={setCompleteAssessmentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Assessment</DialogTitle>
            <DialogDescription>Enter the assessment results for {selectedAssessment?.patientName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score">Total Score</Label>
                <Input
                  id="score"
                  type="number"
                  value={completionData.total_score}
                  onChange={(e) => setCompletionData((prev) => ({ ...prev, total_score: e.target.value }))}
                  placeholder="Enter score"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity Level</Label>
                <Select
                  value={completionData.severity_level}
                  onValueChange={(value) => setCompletionData((prev) => ({ ...prev, severity_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interpretation">Clinical Interpretation</Label>
              <Textarea
                id="interpretation"
                value={completionData.clinical_interpretation}
                onChange={(e) => setCompletionData((prev) => ({ ...prev, clinical_interpretation: e.target.value }))}
                placeholder="Enter clinical interpretation..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                value={completionData.recommendations}
                onChange={(e) => setCompletionData((prev) => ({ ...prev, recommendations: e.target.value }))}
                placeholder="Enter recommendations..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCompleteAssessmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteAssessment} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Complete Assessment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
