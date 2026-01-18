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

// Mock patient data - in real app this would come from database
const patientData = {
  id: "PT-2024-001",
  name: "Sarah Johnson",
  age: 34,
  dateOfBirth: "1989-03-15",
  gender: "Female",
  phone: "(555) 123-4567",
  email: "sarah.johnson@email.com",
  address: "123 Main St, Rochester, NY 14604",
  emergencyContact: {
    name: "John Johnson",
    relationship: "Spouse",
    phone: "(555) 123-4568",
  },
  insurance: {
    primary: "Medicaid",
    memberId: "MCD123456789",
    groupNumber: "GRP001",
    effectiveDate: "2024-01-01",
    copay: "$0",
  },
  program: {
    type: "Methadone",
    startDate: "2023-06-15",
    currentDose: "80mg",
    frequency: "Daily",
    provider: "Dr. Smith",
    pharmacy: "MASE Pharmacy",
  },
  asam: {
    currentLevel: "2.1",
    assessmentDate: "2024-01-01",
    nextAssessment: "2024-07-01",
    criteria: {
      dimension1: "Moderate",
      dimension2: "Low",
      dimension3: "Moderate",
      dimension4: "Low",
      dimension5: "Moderate",
      dimension6: "Low",
    },
  },
  riskLevel: "Low",
  status: "Active",
  alerts: ["Appointment Due"],
  tags: ["Stable", "Compliant"],
  customFields: [
    { label: "Housing Status", value: "Stable Housing" },
    { label: "Employment", value: "Part-time" },
    { label: "Transportation", value: "Own Vehicle" },
  ],
}

export default function PatientChartPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {patientData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                  {patientData.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{patientData.id}</Badge>
                  <Badge
                    variant={
                      patientData.riskLevel === "High"
                        ? "destructive"
                        : patientData.riskLevel === "Medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {patientData.riskLevel} Risk
                  </Badge>
                  <Badge variant={patientData.status === "Active" ? "default" : "secondary"}>
                    {patientData.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {patientData.age}y • {patientData.gender} • {patientData.program.type} Program
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
          {patientData.alerts.length > 0 && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">Active Alerts</span>
                  <div className="flex gap-1 ml-2">
                    {patientData.alerts.map((alert, index) => (
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
                        <Input value={patientData.name} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input value={patientData.dateOfBirth} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Input value={patientData.gender} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input value={`${patientData.age} years`} readOnly />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={patientData.phone} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input value={patientData.email} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={patientData.address} readOnly />
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
                      <Input value={patientData.emergencyContact.name} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input value={patientData.emergencyContact.relationship} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={patientData.emergencyContact.phone} readOnly />
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {patientData.customFields.map((field, index) => (
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
                      <Input value={patientData.insurance.primary} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Member ID</Label>
                      <Input value={patientData.insurance.memberId} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Group Number</Label>
                      <Input value={patientData.insurance.groupNumber} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Effective Date</Label>
                      <Input value={patientData.insurance.effectiveDate} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Copay</Label>
                      <Input value={patientData.insurance.copay} readOnly />
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
                    <span>Current Medication Program</span>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Adjust Dose
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Program Type</Label>
                      <Input value={patientData.program.type} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input value={patientData.program.startDate} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Dose</Label>
                      <Input value={patientData.program.currentDose} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Input value={patientData.program.frequency} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Prescribing Provider</Label>
                      <Input value={patientData.program.provider} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Dispensing Pharmacy</Label>
                      <Input value={patientData.program.pharmacy} readOnly />
                    </div>
                  </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Current ASAM Level</Label>
                      <Input value={patientData.asam.currentLevel} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Assessment Date</Label>
                      <Input value={patientData.asam.assessmentDate} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Assessment Due</Label>
                      <Input value={patientData.asam.nextAssessment} readOnly />
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <h4 className="font-medium">ASAM Dimensions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                        <span className="text-sm">Dimension 1: Acute Intoxication</span>
                        <Badge variant="secondary">{patientData.asam.criteria.dimension1}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                        <span className="text-sm">Dimension 2: Biomedical Conditions</span>
                        <Badge variant="outline">{patientData.asam.criteria.dimension2}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                        <span className="text-sm">Dimension 3: Emotional/Behavioral</span>
                        <Badge variant="secondary">{patientData.asam.criteria.dimension3}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                        <span className="text-sm">Dimension 4: Readiness to Change</span>
                        <Badge variant="outline">{patientData.asam.criteria.dimension4}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                        <span className="text-sm">Dimension 5: Relapse Potential</span>
                        <Badge variant="secondary">{patientData.asam.criteria.dimension5}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                        <span className="text-sm">Dimension 6: Recovery Environment</span>
                        <Badge variant="outline">{patientData.asam.criteria.dimension6}</Badge>
                      </div>
                    </div>
                  </div>
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
                    {patientData.alerts.map((alert, index) => (
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
                    ))}

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
                      {patientData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant={
                            tag.includes("Risk") || tag === "Crisis"
                              ? "destructive"
                              : tag === "Stable" || tag === "Compliant"
                                ? "default"
                                : "secondary"
                          }
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <X className="h-3 w-3 cursor-pointer" />
                        </Badge>
                      ))}
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
                  {[
                    { name: "Informed Consent for MAT", status: "Completed", date: "2024-01-15", required: true },
                    { name: "HIPAA Authorization", status: "Completed", date: "2024-01-15", required: true },
                    { name: "Methadone Treatment Consent", status: "Completed", date: "2024-01-15", required: true },
                    { name: "Urine Testing Consent", status: "Completed", date: "2024-01-15", required: true },
                    { name: "Take-Home Medication Agreement", status: "Pending", date: null, required: true },
                    { name: "Photography/Recording Consent", status: "Declined", date: "2024-01-15", required: false },
                    { name: "Research Participation", status: "Not Started", date: null, required: false },
                  ].map((consent, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            consent.status === "Completed"
                              ? "bg-green-500"
                              : consent.status === "Pending"
                                ? "bg-yellow-500"
                                : consent.status === "Declined"
                                  ? "bg-red-500"
                                  : "bg-gray-300"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{consent.name}</span>
                            {consent.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Status: {consent.status} {consent.date && `• Signed: ${consent.date}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        {consent.status !== "Completed" && (
                          <Button size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            {consent.status === "Not Started" ? "Start" : "Complete"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
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
                    {[
                      { name: "Driver License", type: "ID", date: "2024-01-15", size: "2.1 MB" },
                      { name: "Court Order - Treatment", type: "Legal", date: "2024-01-10", size: "1.8 MB" },
                      { name: "Previous Treatment Records", type: "Medical", date: "2024-01-08", size: "5.2 MB" },
                      { name: "Insurance Card", type: "Insurance", date: "2024-01-15", size: "0.8 MB" },
                    ].map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.type} • {doc.date} • {doc.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dose History Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: "Dose Adjustment Log - Q1 2024", date: "2024-03-31", size: "1.2 MB" },
                      { name: "Take-Home Schedule", date: "2024-01-15", size: "0.5 MB" },
                      { name: "Medication Administration Record", date: "2024-01-01", size: "3.1 MB" },
                    ].map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Pill className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.date} • {doc.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
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
        </main>
      </div>
    </div>
  )
}
