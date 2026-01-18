"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Brain, User, Search, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { ASAMAssessmentForm, type ASAMAssessmentData } from "@/components/asam-assessment-form"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  client_number?: string
}

interface PreviousASAM {
  id: string
  created_at: string
  dimensions: {
    dimension1: number | null
    dimension2: number | null
    dimension3: number | null
    dimension4: string | null
    dimension5: number | null
    dimension6: number | null
  }
  recommended_level: string | null
}

function ASAMAssessmentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const patientIdFromUrl = searchParams.get("patientId")

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [asamData, setAsamData] = useState<ASAMAssessmentData | null>(null)
  const [assessmentCompleted, setAssessmentCompleted] = useState(false)
  const [previousASAM, setPreviousASAM] = useState<PreviousASAM | null>(null)
  const [loadingPrevious, setLoadingPrevious] = useState(false)

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch("/api/patients")
        if (response.ok) {
          const data = await response.json()
          setPatients(data.patients || [])
        }
      } catch (error) {
        console.error("Error fetching patients:", error)
      }
    }
    fetchPatients()
  }, [])

  // Fetch patient from URL param
  useEffect(() => {
    const fetchPatientFromUrl = async () => {
      if (!patientIdFromUrl) return

      try {
        const response = await fetch(`/api/patients/${patientIdFromUrl}`)
        if (response.ok) {
          const data = await response.json()
          setSelectedPatient(data.patient || data)
        }
      } catch (error) {
        console.error("Error fetching patient:", error)
      }
    }
    fetchPatientFromUrl()
  }, [patientIdFromUrl])

  // Fetch previous ASAM when patient is selected
  useEffect(() => {
    const fetchPreviousASAM = async () => {
      if (!selectedPatient) return

      setLoadingPrevious(true)
      try {
        const response = await fetch(`/api/assessments/asam?patient_id=${selectedPatient.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.assessments && data.assessments.length > 0) {
            setPreviousASAM(data.assessments[0])
          } else {
            setPreviousASAM(null)
          }
        }
      } catch (error) {
        console.error("Error fetching previous ASAM:", error)
      } finally {
        setLoadingPrevious(false)
      }
    }
    fetchPreviousASAM()
  }, [selectedPatient])

  // Filter patients based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients([])
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = patients.filter((p) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
      const clientNum = p.client_number?.toLowerCase() || ""
      return fullName.includes(query) || clientNum.includes(query) || p.id.includes(query)
    })
    setFilteredPatients(filtered.slice(0, 10))
  }, [searchQuery, patients])

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchQuery("")
    setFilteredPatients([])
    setAssessmentCompleted(false)
  }

  const handleASAMChange = useCallback((data: ASAMAssessmentData) => {
    setAsamData(data)
  }, [])

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first")
      return
    }

    if (!asamData || !asamData.recommendedLevel) {
      toast.error("Please complete the ASAM assessment")
      return
    }

    const { dimensions } = asamData
    if (
      dimensions.dimension1 === null ||
      dimensions.dimension2 === null ||
      dimensions.dimension3 === null ||
      dimensions.dimension4 === null ||
      dimensions.dimension5 === null ||
      dimensions.dimension6 === null
    ) {
      toast.error("Please complete all ASAM dimensions")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/assessments/asam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          dimensions: asamData.dimensions,
          recommended_level: asamData.recommendedLevel,
          suggested_level: asamData.suggestedLevel,
          suggestion_overridden: asamData.suggestionOverridden,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save ASAM assessment")
      }

      setAssessmentCompleted(true)
      toast.success("ASAM assessment saved successfully!")
    } catch (error) {
      console.error("Error saving assessment:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save assessment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateTreatmentPlan = () => {
    if (selectedPatient && asamData?.recommendedLevel) {
      router.push(
        `/treatment-planning?patientId=${selectedPatient.id}&level=${asamData.recommendedLevel}`
      )
    }
  }

  const handleViewPatientChart = () => {
    if (selectedPatient) {
      router.push(`/patient-chart?patientId=${selectedPatient.id}`)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            ASAM Criteria Assessment
          </h1>
          <p className="text-muted-foreground">
            Complete a standalone ASAM 6-dimension assessment for level of care determination
          </p>
        </div>

        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Patient Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  <div>
                    <p className="font-medium">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      DOB: {selectedPatient.date_of_birth}
                      {selectedPatient.client_number && ` • Client #${selectedPatient.client_number}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPatient(null)
                    setAssessmentCompleted(false)
                    setPreviousASAM(null)
                  }}
                >
                  Change Patient
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Search by name, client number, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {filteredPatients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg">
                        <ScrollArea className="max-h-60">
                          {filteredPatients.map((patient) => (
                            <button
                              key={patient.id}
                              className="w-full text-left p-3 hover:bg-accent transition-colors"
                              onClick={() => handlePatientSelect(patient)}
                            >
                              <p className="font-medium">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                DOB: {patient.date_of_birth}
                                {patient.client_number && ` • #${patient.client_number}`}
                              </p>
                            </button>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
                {searchQuery && filteredPatients.length === 0 && (
                  <p className="text-sm text-muted-foreground">No patients found matching your search</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previous Assessment Info */}
        {selectedPatient && !assessmentCompleted && (
          <>
            {loadingPrevious ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Loading previous assessments...</AlertDescription>
              </Alert>
            ) : previousASAM ? (
              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <Brain className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  Previous ASAM assessment on {formatDate(previousASAM.created_at)}
                  {previousASAM.recommended_level && (
                    <Badge variant="outline" className="ml-2">
                      Level {previousASAM.recommended_level}
                    </Badge>
                  )}
                  <span className="text-sm block mt-1 text-blue-700 dark:text-blue-300">
                    This will create a new re-assessment for comparison.
                  </span>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  No previous ASAM assessments found for this patient. This will be their initial assessment.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Success State */}
        {assessmentCompleted && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Assessment Completed Successfully
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ASAM assessment saved for {selectedPatient?.first_name} {selectedPatient?.last_name}
                    {asamData?.recommendedLevel && ` • Level ${asamData.recommendedLevel}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={handleViewPatientChart}>
                  View Patient Chart
                </Button>
                <Button onClick={handleCreateTreatmentPlan}>
                  Create Treatment Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ASAM Form */}
        {selectedPatient && !assessmentCompleted && (
          <>
            <ASAMAssessmentForm
              onChange={handleASAMChange}
              initialData={
                previousASAM
                  ? {
                      dimensions: previousASAM.dimensions,
                      recommendedLevel: null, // Don't pre-fill the level for re-assessments
                    }
                  : undefined
              }
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Save ASAM Assessment
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ASAMAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-8 ml-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ASAMAssessmentContent />
    </Suspense>
  )
}
