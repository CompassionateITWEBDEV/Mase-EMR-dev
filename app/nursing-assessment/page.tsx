"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Stethoscope, Syringe, Beaker, ClipboardCheck, FileText } from "lucide-react"

export default function NursingAssessmentPage() {
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  // Mock patient data
  const patients = [
    { id: "1", name: "Sarah Johnson", mrn: "MRN001", dob: "1985-03-15" },
    { id: "2", name: "Michael Thompson", mrn: "OTP-000001", dob: "1978-11-22" },
  ]

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader />
        <main className="p-6 mt-16">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Nursing Assessment (SAMHSA & 42 CFR Compliant)</h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive RN assessment including Hep/TB testing, blood work, and UDS collection
              </p>
            </div>

            {/* Patient Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Select Patient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or MRN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {filteredPatients.length > 0 && searchQuery && (
                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatient(patient.id)
                            setSearchQuery("")
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">
                            MRN: {patient.mrn} • DOB: {patient.dob}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedPatient && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{patients.find((p) => p.id === selectedPatient)?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          MRN: {patients.find((p) => p.id === selectedPatient)?.mrn}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPatient("")}>
                        Change Patient
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedPatient && (
              <Tabs defaultValue="rn-intake" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="rn-intake">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    RN Intake
                  </TabsTrigger>
                  <TabsTrigger value="hep-tb-tests">
                    <Syringe className="h-4 w-4 mr-2" />
                    Hep/TB Tests
                  </TabsTrigger>
                  <TabsTrigger value="blood-work">
                    <Beaker className="h-4 w-4 mr-2" />
                    Blood Work
                  </TabsTrigger>
                  <TabsTrigger value="uds-collection">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    UDS Collection
                  </TabsTrigger>
                  <TabsTrigger value="results">
                    <FileText className="h-4 w-4 mr-2" />
                    Results Review
                  </TabsTrigger>
                </TabsList>

                {/* RN Intake Assessment */}
                <TabsContent value="rn-intake">
                  <Card>
                    <CardHeader>
                      <CardTitle>Full RN Intake Assessment</CardTitle>
                      <CardDescription>Comprehensive nursing assessment per SAMHSA guidelines</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Vital Signs */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Vital Signs</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Blood Pressure</Label>
                            <div className="flex gap-2">
                              <Input placeholder="Systolic" />
                              <Input placeholder="Diastolic" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Heart Rate (bpm)</Label>
                            <Input type="number" placeholder="72" />
                          </div>
                          <div className="space-y-2">
                            <Label>Temperature (°F)</Label>
                            <Input type="number" step="0.1" placeholder="98.6" />
                          </div>
                          <div className="space-y-2">
                            <Label>Respiratory Rate</Label>
                            <Input type="number" placeholder="16" />
                          </div>
                          <div className="space-y-2">
                            <Label>O2 Saturation (%)</Label>
                            <Input type="number" placeholder="98" />
                          </div>
                          <div className="space-y-2">
                            <Label>Weight (lbs)</Label>
                            <Input type="number" placeholder="165" />
                          </div>
                          <div className="space-y-2">
                            <Label>Height (inches)</Label>
                            <Input type="number" placeholder="68" />
                          </div>
                          <div className="space-y-2">
                            <Label>BMI (auto-calc)</Label>
                            <Input disabled placeholder="25.1" />
                          </div>
                        </div>
                      </div>

                      {/* Physical Examination */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Physical Examination</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>General Appearance</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="well-appearing">Well-appearing</SelectItem>
                                <SelectItem value="ill-appearing">Ill-appearing</SelectItem>
                                <SelectItem value="distressed">Distressed</SelectItem>
                                <SelectItem value="lethargic">Lethargic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Mental Status</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alert-oriented">Alert & Oriented x4</SelectItem>
                                <SelectItem value="confused">Confused</SelectItem>
                                <SelectItem value="agitated">Agitated</SelectItem>
                                <SelectItem value="sedated">Sedated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Skin Condition</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="intact">Intact, no lesions</SelectItem>
                                <SelectItem value="track-marks">Track marks present</SelectItem>
                                <SelectItem value="rash">Rash/lesions present</SelectItem>
                                <SelectItem value="bruising">Bruising present</SelectItem>
                                <SelectItem value="jaundiced">Jaundiced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Respiratory</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="clear">Clear bilateral breath sounds</SelectItem>
                                <SelectItem value="wheezing">Wheezing</SelectItem>
                                <SelectItem value="crackles">Crackles</SelectItem>
                                <SelectItem value="diminished">Diminished breath sounds</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Additional Physical Exam Notes</Label>
                          <Textarea rows={4} placeholder="Document any additional findings..." />
                        </div>
                      </div>

                      {/* Pain Assessment */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Pain Assessment</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Pain Level (0-10)</Label>
                            <Input type="number" min="0" max="10" placeholder="0" />
                          </div>
                          <div className="space-y-2">
                            <Label>Pain Location</Label>
                            <Input placeholder="e.g., Lower back, abdomen" />
                          </div>
                          <div className="space-y-2">
                            <Label>Pain Character</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sharp">Sharp</SelectItem>
                                <SelectItem value="dull">Dull/aching</SelectItem>
                                <SelectItem value="burning">Burning</SelectItem>
                                <SelectItem value="cramping">Cramping</SelectItem>
                                <SelectItem value="throbbing">Throbbing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Medical History */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Medical History</h3>
                        <div className="space-y-2">
                          <Label>Chronic Conditions</Label>
                          <Textarea rows={3} placeholder="List chronic medical conditions..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Current Medications</Label>
                          <Textarea rows={3} placeholder="List all current medications..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Allergies</Label>
                          <Textarea rows={2} placeholder="List drug allergies and reactions..." />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1">
                          <FileText className="mr-2 h-4 w-4" />
                          Save Assessment
                        </Button>
                        <Button variant="outline">
                          <Stethoscope className="mr-2 h-4 w-4" />
                          Sign & Lock
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Hepatitis & TB Testing */}
                <TabsContent value="hep-tb-tests">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Hepatitis Testing</CardTitle>
                        <CardDescription>
                          Order and track Hepatitis A, B, C testing per SAMHSA requirements
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Hepatitis A</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Order test..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not-ordered">Not Ordered</SelectItem>
                                <SelectItem value="ordered">Ordered</SelectItem>
                                <SelectItem value="collected">Specimen Collected</SelectItem>
                                <SelectItem value="sent">Sent to Lab</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Hepatitis B</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Order test..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not-ordered">Not Ordered</SelectItem>
                                <SelectItem value="ordered">Ordered</SelectItem>
                                <SelectItem value="collected">Specimen Collected</SelectItem>
                                <SelectItem value="sent">Sent to Lab</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Hepatitis C</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Order test..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not-ordered">Not Ordered</SelectItem>
                                <SelectItem value="ordered">Ordered</SelectItem>
                                <SelectItem value="collected">Specimen Collected</SelectItem>
                                <SelectItem value="sent">Sent to Lab</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Collection Date/Time</Label>
                          <Input type="datetime-local" />
                        </div>

                        <div className="space-y-2">
                          <Label>Collected By (RN)</Label>
                          <Input placeholder="Nurse name" />
                        </div>

                        <Button className="w-full">
                          <Syringe className="mr-2 h-4 w-4" />
                          Submit Hepatitis Test Orders
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>TB Screening</CardTitle>
                        <CardDescription>Tuberculosis screening per 42 CFR requirements</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>TB Test Type</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select test type..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ppd">PPD (Tuberculin Skin Test)</SelectItem>
                                <SelectItem value="quantiferon">QuantiFERON-TB Gold</SelectItem>
                                <SelectItem value="tspot">T-SPOT.TB</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Test Status</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ordered">Ordered</SelectItem>
                                <SelectItem value="administered">Administered</SelectItem>
                                <SelectItem value="pending-read">Pending Read (PPD)</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Administration Date/Time</Label>
                          <Input type="datetime-local" />
                        </div>

                        <div className="space-y-2">
                          <Label>PPD Read Date (48-72 hours)</Label>
                          <Input type="datetime-local" />
                        </div>

                        <div className="space-y-2">
                          <Label>Administered By</Label>
                          <Input placeholder="Nurse name" />
                        </div>

                        <Button className="w-full">
                          <Syringe className="mr-2 h-4 w-4" />
                          Submit TB Test Order
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Blood Work */}
                <TabsContent value="blood-work">
                  <Card>
                    <CardHeader>
                      <CardTitle>Blood Work Orders</CardTitle>
                      <CardDescription>Comprehensive blood work panel for intake assessment</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="font-semibold">Standard OTP Panels</h3>
                          <div className="space-y-2">
                            {[
                              "Complete Blood Count (CBC)",
                              "Comprehensive Metabolic Panel (CMP)",
                              "Liver Function Tests (LFTs)",
                              "Lipid Panel",
                              "TSH (Thyroid)",
                              "HIV Test",
                              "Pregnancy Test (if applicable)",
                            ].map((test) => (
                              <label key={test} className="flex items-center gap-2">
                                <input type="checkbox" className="rounded" />
                                <span className="text-sm">{test}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-semibold">Additional Tests</h3>
                          <div className="space-y-2">
                            {[
                              "Vitamin D",
                              "B12",
                              "Folate",
                              "Iron Panel",
                              "A1C (Diabetes)",
                              "RPR (Syphilis)",
                              "Other STI Panel",
                            ].map((test) => (
                              <label key={test} className="flex items-center gap-2">
                                <input type="checkbox" className="rounded" />
                                <span className="text-sm">{test}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Collection Date/Time</Label>
                        <Input type="datetime-local" />
                      </div>

                      <div className="space-y-2">
                        <Label>Phlebotomist</Label>
                        <Input placeholder="Name of person drawing blood" />
                      </div>

                      <div className="space-y-2">
                        <Label>Lab Order Number</Label>
                        <Input placeholder="Lab requisition number" />
                      </div>

                      <div className="space-y-2">
                        <Label>Additional Notes</Label>
                        <Textarea rows={3} placeholder="Fasting status, patient cooperation, etc..." />
                      </div>

                      <Button className="w-full">
                        <Beaker className="mr-2 h-4 w-4" />
                        Submit Blood Work Orders
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* UDS Collection */}
                <TabsContent value="uds-collection">
                  <Card>
                    <CardHeader>
                      <CardTitle>Urine Drug Screen Collection</CardTitle>
                      <CardDescription>Log instant cup results and send for confirmation testing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Collection Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Collection Date/Time</Label>
                          <Input type="datetime-local" />
                        </div>
                        <div className="space-y-2">
                          <Label>Collected By</Label>
                          <Input placeholder="Collector name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Specimen ID</Label>
                          <Input placeholder="Unique specimen identifier" />
                        </div>
                        <div className="space-y-2">
                          <Label>Observed Collection?</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes - Direct observation</SelectItem>
                              <SelectItem value="no">No - Unobserved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Temperature Check */}
                      <div className="space-y-2">
                        <Label>Specimen Temperature (°F)</Label>
                        <Input type="number" step="0.1" placeholder="90-100°F" />
                      </div>

                      {/* Instant Cup Results */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          Instant Cup Results
                          <Badge>Point-of-Care</Badge>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            "Amphetamines",
                            "Methamphetamines",
                            "Cocaine",
                            "THC (Marijuana)",
                            "Opiates",
                            "Oxycodone",
                            "Methadone",
                            "Buprenorphine",
                            "Benzodiazepines",
                            "Barbiturates",
                            "PCP",
                            "MDMA (Ecstasy)",
                          ].map((drug) => (
                            <div key={drug} className="space-y-2">
                              <Label className="text-sm">{drug}</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Result..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="negative">Negative</SelectItem>
                                  <SelectItem value="positive">Positive</SelectItem>
                                  <SelectItem value="invalid">Invalid</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pregnancy Test */}
                      <div className="space-y-2">
                        <Label className="text-lg font-semibold">Urine Pregnancy Test (if applicable)</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select result..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-applicable">Not Applicable</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="invalid">Invalid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Send for Confirmation */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Confirmation Testing</h3>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span>Send specimen for GC/MS confirmation testing</span>
                          </label>
                          <div className="space-y-2 ml-6">
                            <Label>Lab Name</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select lab..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="quest">Quest Diagnostics</SelectItem>
                                <SelectItem value="labcorp">LabCorp</SelectItem>
                                <SelectItem value="local">Local Reference Lab</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 ml-6">
                            <Label>Chain of Custody Number</Label>
                            <Input placeholder="COC tracking number" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Additional Notes</Label>
                        <Textarea rows={3} placeholder="Document any issues, dilution, adulteration concerns..." />
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1">
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Save UDS Results
                        </Button>
                        <Button variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          Print COC Form
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Results Review */}
                <TabsContent value="results">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Hepatitis Results Review</CardTitle>
                        <CardDescription>Return visit to review and document Hepatitis test results</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Hepatitis A Result</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select result..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="immune">Immune (vaccinated)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Hepatitis B Result</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select result..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="negative">Negative (susceptible)</SelectItem>
                                <SelectItem value="immune">Immune (vaccinated/recovered)</SelectItem>
                                <SelectItem value="acute">Acute infection</SelectItem>
                                <SelectItem value="chronic">Chronic infection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Hepatitis C Result</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select result..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                                <SelectItem value="positive-antibody">Positive Antibody (needs RNA test)</SelectItem>
                                <SelectItem value="positive-rna">Positive RNA (active infection)</SelectItem>
                                <SelectItem value="cleared">Cleared infection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Result Reviewed By</Label>
                          <Input placeholder="RN or Provider name" />
                        </div>

                        <div className="space-y-2">
                          <Label>Patient Counseling/Education Provided</Label>
                          <Textarea
                            rows={4}
                            placeholder="Document counseling provided regarding results, treatment options, prevention..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Referrals/Follow-up Actions</Label>
                          <Textarea
                            rows={3}
                            placeholder="Referral to infectious disease, vaccination recommendations, etc..."
                          />
                        </div>

                        <Button className="w-full">
                          <FileText className="mr-2 h-4 w-4" />
                          Document Results Review
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>TB Test Reading</CardTitle>
                        <CardDescription>PPD skin test reading (48-72 hours post-administration)</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Induration Size (mm)</Label>
                            <Input type="number" placeholder="Measure in millimeters" />
                          </div>
                          <div className="space-y-2">
                            <Label>Interpretation</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="negative">Negative</SelectItem>
                                <SelectItem value="positive">Positive (≥5mm high risk / ≥10mm standard)</SelectItem>
                                <SelectItem value="indeterminate">Indeterminate - retest</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Read By (RN)</Label>
                          <Input placeholder="Nurse name" />
                        </div>

                        <div className="space-y-2">
                          <Label>Read Date/Time</Label>
                          <Input type="datetime-local" />
                        </div>

                        <div className="space-y-2">
                          <Label>Clinical Notes</Label>
                          <Textarea rows={3} placeholder="Document findings, patient risk factors, follow-up plan..." />
                        </div>

                        <Button className="w-full">
                          <FileText className="mr-2 h-4 w-4" />
                          Document TB Reading
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
