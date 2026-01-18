"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClipboardCheck, Search, User, CheckCircle2, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ASAMAssessmentForm, type ASAMAssessmentData } from "@/components/asam-assessment-form"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  client_number?: string
}

export default function CounselingIntakePage() {
  const router = useRouter()
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [asamData, setAsamData] = useState<ASAMAssessmentData | null>(null)
  const [intakeCompleted, setIntakeCompleted] = useState(false)
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null)

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
    setFilteredPatients(filtered.slice(0, 10)) // Limit to 10 results
  }, [searchQuery, patients])

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchQuery("")
    setFilteredPatients([])
  }

  const handleASAMChange = useCallback((data: ASAMAssessmentData) => {
    setAsamData(data)
  }, [])

  const handleSubmitIntake = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first")
      return
    }

    if (!asamData || !asamData.recommendedLevel) {
      toast.error("Please complete the ASAM assessment")
      return
    }

    // Validate all dimensions are filled
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

      const result = await response.json()
      setSavedAssessmentId(result.assessment?.id)
      setIntakeCompleted(true)
      
      toast.success("Counseling intake completed and ASAM assessment saved!")
    } catch (error) {
      console.error("Error saving intake:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save intake")
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

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Counseling Intake</h1>
          <p className="text-muted-foreground">Complete initial counseling intake assessment</p>
        </div>

        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Patient Lookup
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
                <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
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

        {/* Success State */}
        {intakeCompleted && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Intake Completed Successfully
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ASAM assessment saved for {selectedPatient?.first_name} {selectedPatient?.last_name}
                    {asamData?.recommendedLevel && ` • Level ${asamData.recommendedLevel}`}
                  </p>
                </div>
                <Button onClick={handleCreateTreatmentPlan}>
                  Create Treatment Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Intake Form */}
        {selectedPatient && !intakeCompleted && (
          <Tabs defaultValue="presenting">
            <TabsList>
              <TabsTrigger value="presenting">Presenting Problem</TabsTrigger>
              <TabsTrigger value="substance">Substance Use History</TabsTrigger>
              <TabsTrigger value="mental">Mental Health</TabsTrigger>
              <TabsTrigger value="asam">ASAM Criteria</TabsTrigger>
              <TabsTrigger value="goals">Treatment Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="presenting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Presenting Problem & Chief Complaint</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Chief Complaint</Label>
                    <Textarea placeholder="What brings you in today? How can we help?" rows={4} />
                  </div>
                  <div>
                    <Label>Reason for Seeking Treatment</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self-referral</SelectItem>
                        <SelectItem value="court">Court-ordered</SelectItem>
                        <SelectItem value="family">Family pressure</SelectItem>
                        <SelectItem value="employment">Employment requirement</SelectItem>
                        <SelectItem value="health">Health concerns</SelectItem>
                        <SelectItem value="financial">Financial problems</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Previous Treatment Episodes</Label>
                    <Input type="number" placeholder="Number of previous treatment attempts" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="substance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Substance Use History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Primary Substance of Abuse</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary substance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opioids">Opioids (Heroin, Fentanyl, Rx Opioids)</SelectItem>
                        <SelectItem value="alcohol">Alcohol</SelectItem>
                        <SelectItem value="cocaine">Cocaine/Crack</SelectItem>
                        <SelectItem value="methamphetamine">Methamphetamine</SelectItem>
                        <SelectItem value="cannabis">Cannabis/Marijuana</SelectItem>
                        <SelectItem value="benzos">Benzodiazepines</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Age of First Use</Label>
                    <Input type="number" placeholder="Age when first used" />
                  </div>
                  <div>
                    <Label>Route of Administration</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="How substance is used" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iv">Intravenous (IV)</SelectItem>
                        <SelectItem value="snorting">Intranasal (Snorting)</SelectItem>
                        <SelectItem value="smoking">Smoking/Vaping</SelectItem>
                        <SelectItem value="oral">Oral</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Current Frequency of Use</Label>
                    <Textarea placeholder="Describe frequency, amount, and pattern of use..." rows={3} />
                  </div>
                  <div>
                    <Label>Last Use Date</Label>
                    <Input type="date" />
                  </div>
                  <div>
                    <Label>Withdrawal Symptoms Experienced</Label>
                    <Textarea placeholder="List any withdrawal symptoms..." rows={3} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mental" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mental Health History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Current Mental Health Diagnosis</Label>
                    <Textarea placeholder="List any current mental health diagnoses..." rows={2} />
                  </div>
                  <div>
                    <Label>History of Psychiatric Hospitalization</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No</SelectItem>
                        <SelectItem value="once">Yes - once</SelectItem>
                        <SelectItem value="multiple">Yes - multiple times</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Current Psychiatric Medications</Label>
                    <Textarea placeholder="List current psychiatric medications..." rows={2} />
                  </div>
                  <div>
                    <Label>Suicidal Ideation</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="passive">Passive thoughts</SelectItem>
                        <SelectItem value="active">Active thoughts</SelectItem>
                        <SelectItem value="plan">Active with plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Trauma History</Label>
                    <Textarea
                      placeholder="Document any trauma history (childhood, domestic violence, etc.)..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="asam" className="space-y-4">
              <ASAMAssessmentForm onChange={handleASAMChange} />
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Initial Treatment Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Short-Term Goals (30-60 days)</Label>
                    <Textarea placeholder="List measurable short-term goals..." rows={4} />
                  </div>
                  <div>
                    <Label>Long-Term Goals (6-12 months)</Label>
                    <Textarea placeholder="List measurable long-term goals..." rows={4} />
                  </div>
                  <div>
                    <Label>Barriers to Treatment</Label>
                    <Textarea
                      placeholder="Identify potential barriers (transportation, housing, employment, etc.)..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Support System</Label>
                    <Textarea placeholder="Describe patient's support system and resources..." rows={3} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Action Buttons */}
        {selectedPatient && !intakeCompleted && (
          <div className="flex justify-end gap-4">
            <Button variant="outline">Save Draft</Button>
            <Button onClick={handleSubmitIntake} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Complete Intake & Save ASAM
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
