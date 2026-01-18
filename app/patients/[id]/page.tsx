import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Calendar, FileText, Phone, CreditCard, Pill, Brain, Plus, Edit, X } from "lucide-react"
import { headers } from "next/headers"

type PatientRecord = {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  insurance_provider?: string | null
  insurance_id?: string | null
  status?: string | null
  risk_level?: string | null
  program_type?: string | null
}

type PatientInsuranceRecord = {
  id: string
  policy_number: string
  group_number?: string | null
  effective_date?: string | null
  termination_date?: string | null
  copay_amount?: number | null
  is_primary?: boolean | null
  status?: string | null
  coverage_level?: string | null
  payer?: {
    payer_name?: string | null
    payer_id?: string | null
  } | null
}

type PatientMedicationRecord = {
  id: string
  medication_name: string
  dosage: string
  frequency: string
  route?: string | null
  start_date: string
  end_date?: string | null
  status?: string | null
}

type PatientApiResponse = {
  patient: PatientRecord | null
  insurance: PatientInsuranceRecord[]
  medications: PatientMedicationRecord[]
  error?: string
}

const formatDate = (value?: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString()
}

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return ""
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

const calculateAge = (dateOfBirth?: string | null) => {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

const fetchPatientData = async (id: string): Promise<PatientApiResponse> => {
  const headerList = headers()
  const protocol = headerList.get("x-forwarded-proto") ?? "http"
  const host = headerList.get("host")
  const baseUrl = host ? `${protocol}://${host}` : ""

  try {
    const response = await fetch(`${baseUrl}/api/patients/${id}`, { cache: "no-store" })
    if (!response.ok) {
      const message = response.status === 404 ? "Patient not found" : "Unable to load patient data"
      return { patient: null, insurance: [], medications: [], error: message }
    }
    const data = (await response.json()) as PatientApiResponse
    return {
      patient: data.patient ?? null,
      insurance: data.insurance ?? [],
      medications: data.medications ?? [],
      error: data.error,
    }
  } catch (error) {
    console.error("Failed to fetch patient data:", error)
    return { patient: null, insurance: [], medications: [], error: "Unable to load patient data" }
  }
}

export default async function PatientChartPage({ params }: { params: { id: string } }) {
  const { patient, insurance, medications, error } = await fetchPatientData(params.id)
  const patientName = patient ? `${patient.first_name} ${patient.last_name}`.trim() : "Unknown Patient"
  const patientAge = calculateAge(patient?.date_of_birth)
  const primaryInsurance = insurance.find((entry) => entry.is_primary) ?? insurance[0]
  const alerts: string[] = []
  const tags: string[] = []
  const customFields: Array<{ label: string; value: string }> = []

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          {error || !patient ? (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle>Patient Chart</CardTitle>
                <CardDescription>
                  {error ? "We could not load this patient record." : "No patient record found for this ID."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm">{error ?? "Try returning to the patient list and selecting another record."}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {patientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                  {patientName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{patient.id}</Badge>
                  {patient.risk_level && (
                    <Badge variant={patient.risk_level === "High" ? "destructive" : "outline"}>
                      {patient.risk_level} Risk
                    </Badge>
                  )}
                  {patient.status && (
                    <Badge variant={patient.status === "Active" ? "default" : "secondary"}>{patient.status}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  {patientAge !== null ? `${patientAge}y` : "Age unavailable"} •{" "}
                  {patient.gender || "Gender not specified"} •{" "}
                  {patient.program_type ? `${patient.program_type} Program` : "Program not specified"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button size="sm">
                <FileText className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </div>
              </div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">Active Alerts</span>
                  <div className="flex gap-1 ml-2">
                    {alerts.map((alert, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {alert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="demographics" className="space-y-6">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
              <TabsTrigger value="medication">Medication</TabsTrigger>
              <TabsTrigger value="asam">ASAM Criteria</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & Tags</TabsTrigger>
              <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
              <TabsTrigger value="consents">Consents</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="demographics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Personal Information</span>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={patientName} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input value={formatDate(patient.date_of_birth)} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Input value={patient.gender || ""} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input value={patientAge !== null ? `${patientAge} years` : ""} readOnly />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={patient.phone || ""} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input value={patient.email || ""} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={patient.address || ""} readOnly />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input value={patient.emergency_contact_name || ""} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input value="Not provided" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={patient.emergency_contact_phone || ""} readOnly />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Custom Fields</span>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customFields.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {customFields.map((field, index) => (
                        <div key={index} className="space-y-2">
                          <Label>{field.label}</Label>
                          <div className="flex gap-2">
                            <Input value={field.value} readOnly className="flex-1" />
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No custom fields recorded.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Insurance Information</span>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Insurance</Label>
                      <Input
                        value={primaryInsurance?.payer?.payer_name || patient.insurance_provider || ""}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Member ID</Label>
                      <Input value={primaryInsurance?.policy_number || patient.insurance_id || ""} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Group Number</Label>
                      <Input value={primaryInsurance?.group_number || ""} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Effective Date</Label>
                      <Input value={formatDate(primaryInsurance?.effective_date)} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Copay</Label>
                      <Input value={formatCurrency(primaryInsurance?.copay_amount)} readOnly />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Verify Eligibility
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      View Claims
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Current Medications</span>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Adjust Dose
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {medications.length > 0 ? (
                    <div className="space-y-3">
                      {medications.map((medication) => (
                        <div
                          key={medication.id}
                          className="flex flex-col gap-2 rounded-lg border border-border p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{medication.medication_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {medication.dosage} • {medication.frequency} • {medication.route || "Route N/A"}
                              </p>
                            </div>
                            {medication.status && <Badge variant="outline">{medication.status}</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Started {formatDate(medication.start_date)}
                            {medication.end_date ? ` • Ends ${formatDate(medication.end_date)}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active medications on record.</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Pill className="mr-2 h-4 w-4" />
                      Dose History
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      PMP Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="asam" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>ASAM Criteria Assessment</span>
                    <Button variant="outline" size="sm">
                      <Brain className="mr-2 h-4 w-4" />
                      New Assessment
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">No ASAM assessments have been recorded yet.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Active Alerts</span>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Alert
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.length > 0 ? (
                      alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-sm">{alert}</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No active alerts on record.</p>
                    )}

                    <div className="space-y-2 mt-4">
                      <Label>Add New Alert</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="suicide-risk">Suicide Risk</SelectItem>
                          <SelectItem value="relapse-risk">Relapse Risk</SelectItem>
                          <SelectItem value="violence-risk">Violence Risk</SelectItem>
                          <SelectItem value="non-compliance">Non-compliance</SelectItem>
                          <SelectItem value="missed-appointment">Missed Appointment</SelectItem>
                          <SelectItem value="dose-adjustment">Dose Adjustment Needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Patient Tags</span>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Tag
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {tags.length > 0 ? (
                        tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X className="h-3 w-3 cursor-pointer" />
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags assigned.</p>
                      )}
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label>Add New Tag</Label>
                      <div className="flex gap-2">
                        <Input placeholder="Enter custom tag..." className="flex-1" />
                        <Button size="sm">Add</Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Quick Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          Stable
                        </Button>
                        <Button variant="outline" size="sm">
                          High Risk
                        </Button>
                        <Button variant="outline" size="sm">
                          Pregnant
                        </Button>
                        <Button variant="outline" size="sm">
                          Peer Support
                        </Button>
                        <Button variant="outline" size="sm">
                          Crisis
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Notes</CardTitle>
                  <CardDescription>Recent documentation and progress notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No clinical notes available</p>
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>OTP Consent Forms</span>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Consent
                    </Button>
                  </CardTitle>
                  <CardDescription>Required consent forms for OTP treatment program</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">No consent forms on record yet.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Patient Documents</span>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Document
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dose History Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">No dose history documents uploaded yet.</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Upload New Document</CardTitle>
                  <CardDescription>
                    Upload patient documents, court orders, transfer records, or other relevant files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">Identification</SelectItem>
                          <SelectItem value="legal">Legal Document</SelectItem>
                          <SelectItem value="medical">Medical Record</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="transfer">Transfer Document</SelectItem>
                          <SelectItem value="dose-history">Dose History</SelectItem>
                          <SelectItem value="court-order">Court Order</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Document Name</Label>
                      <Input placeholder="Enter document name..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>File Upload</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
                      <Button variant="outline" size="sm">
                        Choose Files
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full">Upload Document</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient History</CardTitle>
                  <CardDescription>Treatment timeline and significant events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No history records available</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
          )}
        </main>
      </div>
    </div>
  )
}
