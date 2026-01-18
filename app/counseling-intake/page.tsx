"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Brain, ClipboardCheck, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function CounselingIntakePage() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [asamLevel, setAsamLevel] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search patients from database using API route
  const searchPatients = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(term)}&limit=10`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search patients")
      }

      const data = await response.json()
      setSearchResults(data.patients || [])
    } catch (err) {
      console.error("Error searching patients:", err)
      setSearchResults([])
      toast.error(err instanceof Error ? err.message : "Failed to search patients. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  // Handle patient selection from search results
  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient)
    setSearchResults([])
    setSearchQuery("")
  }

  // Debounced search on input change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPatients(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSubmitIntake = () => {
    toast.success("Counseling intake completed and added to Intake Queue")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <div className="flex-1 p-8">
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
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Input 
                  placeholder="Search by name, client number, or DOB..." 
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button onClick={() => searchPatients(searchQuery)} disabled={isSearching || !searchQuery}>
                Search
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedPatient && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <p className="font-medium">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {patient.phone || patient.mrn || `ID: ${patient.id.slice(0, 8)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Patient Info */}
            {selectedPatient && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPatient.phone && `Phone: ${selectedPatient.phone}`}
                      {selectedPatient.mrn && ` • MRN: ${selectedPatient.mrn}`}
                      {selectedPatient.date_of_birth && ` • DOB: ${new Date(selectedPatient.date_of_birth).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null)
                      setSearchQuery("")
                      setSearchResults([])
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intake Form */}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  ASAM Level of Care Determination
                </CardTitle>
                <CardDescription>Complete ASAM 6-Dimension assessment for level of care placement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dimension 1 */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <Label className="text-lg font-semibold">
                    Dimension 1: Acute Intoxication & Withdrawal Potential
                  </Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select severity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - No risk</SelectItem>
                      <SelectItem value="1">1 - Minimal risk</SelectItem>
                      <SelectItem value="2">2 - Moderate risk</SelectItem>
                      <SelectItem value="3">3 - Severe risk requiring medical supervision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimension 2 */}
                <div className="border-l-4 border-green-500 pl-4">
                  <Label className="text-lg font-semibold">Dimension 2: Biomedical Conditions & Complications</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select severity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - No issues</SelectItem>
                      <SelectItem value="1">1 - Stable chronic conditions</SelectItem>
                      <SelectItem value="2">2 - Requires monitoring</SelectItem>
                      <SelectItem value="3">3 - Requires intensive medical management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimension 3 */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <Label className="text-lg font-semibold">
                    Dimension 3: Emotional/Behavioral/Cognitive Conditions
                  </Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select severity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - No issues</SelectItem>
                      <SelectItem value="1">1 - Stable mental health condition</SelectItem>
                      <SelectItem value="2">2 - Co-occurring disorder requiring treatment</SelectItem>
                      <SelectItem value="3">3 - Severe psychiatric condition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimension 4 */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <Label className="text-lg font-semibold">Dimension 4: Readiness to Change</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select stage of change" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="precontemplation">Precontemplation - Not ready</SelectItem>
                      <SelectItem value="contemplation">Contemplation - Considering change</SelectItem>
                      <SelectItem value="preparation">Preparation - Ready to change</SelectItem>
                      <SelectItem value="action">Action - Actively changing</SelectItem>
                      <SelectItem value="maintenance">Maintenance - Sustaining change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimension 5 */}
                <div className="border-l-4 border-red-500 pl-4">
                  <Label className="text-lg font-semibold">Dimension 5: Relapse/Continued Use Potential</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Low risk</SelectItem>
                      <SelectItem value="1">1 - Moderate risk</SelectItem>
                      <SelectItem value="2">2 - High risk without structure</SelectItem>
                      <SelectItem value="3">3 - Unable to control use without intensive support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimension 6 */}
                <div className="border-l-4 border-pink-500 pl-4">
                  <Label className="text-lg font-semibold">Dimension 6: Recovery/Living Environment</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select environment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Supportive environment</SelectItem>
                      <SelectItem value="1">1 - Minimal support</SelectItem>
                      <SelectItem value="2">2 - High-risk environment</SelectItem>
                      <SelectItem value="3">3 - Dangerous/unsafe environment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ASAM Level Recommendation */}
                <div className="bg-muted p-4 rounded-lg">
                  <Label className="text-lg font-semibold mb-2 block">Recommended ASAM Level of Care</Label>
                  <Select onValueChange={setAsamLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommended level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">Level 0.5 - Early Intervention</SelectItem>
                      <SelectItem value="1.0">Level 1.0 - Outpatient Services</SelectItem>
                      <SelectItem value="2.1">Level 2.1 - Intensive Outpatient (IOP)</SelectItem>
                      <SelectItem value="2.5">Level 2.5 - Partial Hospitalization (PHP)</SelectItem>
                      <SelectItem value="3.1">Level 3.1 - Clinically Managed Low-Intensity Residential</SelectItem>
                      <SelectItem value="3.3">
                        Level 3.3 - Clinically Managed Population-Specific High-Intensity Residential
                      </SelectItem>
                      <SelectItem value="3.5">Level 3.5 - Clinically Managed High-Intensity Residential</SelectItem>
                      <SelectItem value="3.7">Level 3.7 - Medically Monitored Intensive Inpatient</SelectItem>
                      <SelectItem value="4.0">Level 4.0 - Medically Managed Intensive Inpatient</SelectItem>
                    </SelectContent>
                  </Select>
                  {asamLevel && (
                    <Badge className="mt-2" variant="outline">
                      {asamLevel === "1.0" && "OTP MAT Program Eligible"}
                      {asamLevel === "2.1" && "IOP + MAT Recommended"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={handleSubmitIntake}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Complete Intake & Add to Queue
          </Button>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
