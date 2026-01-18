"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Search,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  FileText,
  Star,
  AlertTriangle,
  RefreshCw,
  Play,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const categories = [
  "All",
  "Comprehensive Assessment",
  "Depression",
  "Anxiety",
  "Suicide Risk",
  "PTSD/Trauma",
  "Substance Use",
  "Mental Health",
  "Risk Assessment",
  "Motivation",
]

export function AssessmentLibraryDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedForm, setSelectedForm] = useState<any | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [administerOpen, setAdministerOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assessmentNotes, setAssessmentNotes] = useState("")

  const { data, error, isLoading, mutate } = useSWR("/api/assessments", fetcher, {
    refreshInterval: 30000,
  })

  // Get assessment forms from API or use empty array
  const assessmentForms = data?.assessmentCatalog || []
  const patients = data?.patients || []
  const statistics = data?.statistics || {}

  const filteredForms = assessmentForms.filter((form: any) => {
    const matchesSearch =
      form.form_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.form_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || form.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const popularForms = assessmentForms.filter((form: any) => form.is_active)
  const totalCompletions = statistics.totalAssessments || 0

  const handleAdministerAssessment = useCallback(async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient")
      return
    }
    if (!selectedForm) {
      toast.error("No assessment form selected")
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
          form_id: selectedForm.id,
          provider_id: null,
          notes: assessmentNotes,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Assessment "${selectedForm.form_name}" started for patient`)
        setAdministerOpen(false)
        setSelectedPatient("")
        setAssessmentNotes("")
        setSelectedForm(null)
        mutate()
      } else {
        toast.error(result.error || "Failed to start assessment")
      }
    } catch (err) {
      toast.error("Failed to start assessment")
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedPatient, selectedForm, assessmentNotes, mutate])

  const handleViewDetails = (form: any) => {
    setSelectedForm(form)
    setViewDetailsOpen(true)
  }

  const handleAdministerClick = (form: any) => {
    setSelectedForm(form)
    setAdministerOpen(true)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load assessment library</h2>
          <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
          <Button onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{assessmentForms.length}</div>
                <p className="text-xs text-muted-foreground">Standardized clinical assessments</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalCompletions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all assessment forms</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{popularForms.length}</div>
                <p className="text-xs text-muted-foreground">Available for use</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{statistics.completionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Assessment completion rate</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assessment forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all-forms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-forms">All Forms</TabsTrigger>
          <TabsTrigger value="popular">Active</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="all-forms" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No assessment forms found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredForms.map((form: any) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {form.form_code || form.form_name?.substring(0, 10)}
                          {form.is_active && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium">{form.form_name}</CardDescription>
                      </div>
                      <Badge variant="secondary">{form.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {form.description?.substring(0, 100) || "Clinical assessment tool"}
                      {form.description?.length > 100 ? "..." : ""}
                    </p>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{form.estimated_completion_minutes || 15} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{form.version || "v1.0"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(form)}>
                        View Details
                      </Button>
                      <Button size="sm" onClick={() => handleAdministerClick(form)}>
                        <Play className="mr-1 h-3 w-3" />
                        Administer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popularForms.map((form: any) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow border-yellow-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {form.form_code || form.form_name?.substring(0, 10)}
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        </CardTitle>
                        <CardDescription className="text-sm font-medium">{form.form_name}</CardDescription>
                      </div>
                      <Badge variant="secondary">{form.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {form.description?.substring(0, 100) || "Clinical assessment tool"}
                    </p>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{form.estimated_completion_minutes || 15} min</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(form)}>
                        View Details
                      </Button>
                      <Button size="sm" onClick={() => handleAdministerClick(form)}>
                        <Play className="mr-1 h-3 w-3" />
                        Administer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-category" className="space-y-4">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-6 w-32 mb-3" />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-6 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            categories.slice(1).map((category) => {
              const categoryForms = assessmentForms.filter((form: any) => form.category === category)
              if (categoryForms.length === 0) return null

              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3">{category}</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    {categoryForms.map((form: any) => (
                      <Card key={form.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {form.form_code || form.form_name?.substring(0, 10)}
                                {form.is_active && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                              </CardTitle>
                              <CardDescription className="text-sm font-medium">{form.form_name}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {form.description?.substring(0, 100) || "Clinical assessment tool"}
                          </p>
                          <div className="flex items-center justify-between text-sm mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{form.estimated_completion_minutes || 15} min</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(form)}>
                              View Details
                            </Button>
                            <Button size="sm" onClick={() => handleAdministerClick(form)}>
                              <Play className="mr-1 h-3 w-3" />
                              Administer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedForm?.form_code || selectedForm?.form_name?.substring(0, 10)} - {selectedForm?.form_name}
              {selectedForm?.is_active && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            </DialogTitle>
            <DialogDescription>{selectedForm?.description}</DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Assessment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Category:</strong> {selectedForm.category}
                    </div>
                    <div>
                      <strong>Estimated Time:</strong> {selectedForm.estimated_completion_minutes || 15} minutes
                    </div>
                    <div>
                      <strong>Version:</strong> {selectedForm.version || "1.0"}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <Badge variant={selectedForm.is_active ? "default" : "secondary"}>
                        {selectedForm.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Clinical Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Scoring:</strong>{" "}
                      {selectedForm.scoring_instructions || "Standard scoring guidelines apply"}
                    </div>
                    <div>
                      <strong>Created:</strong>{" "}
                      {selectedForm.created_at ? new Date(selectedForm.created_at).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setViewDetailsOpen(false)
                    handleAdministerClick(selectedForm)
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Administer Assessment
                </Button>
                <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Administer Assessment Dialog */}
      <Dialog open={administerOpen} onOpenChange={setAdministerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Administer Assessment</DialogTitle>
            <DialogDescription>Start "{selectedForm?.form_name}" for a patient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Select Patient *</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No patients available
                    </SelectItem>
                  ) : (
                    patients.map((patient: any) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={assessmentNotes}
                onChange={(e) => setAssessmentNotes(e.target.value)}
                placeholder="Add any notes about this assessment..."
                rows={3}
              />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <strong>Assessment:</strong> {selectedForm?.form_name}
              </p>
              <p className="text-sm text-muted-foreground">
                Estimated time: {selectedForm?.estimated_completion_minutes || 15} minutes
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAdministerOpen(false)
                setSelectedPatient("")
                setAssessmentNotes("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdministerAssessment} disabled={isSubmitting || !selectedPatient}>
              {isSubmitting ? "Starting..." : "Start Assessment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
