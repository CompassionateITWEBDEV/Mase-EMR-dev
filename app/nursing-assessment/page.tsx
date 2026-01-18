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
import { Search, Stethoscope, Syringe, Beaker, ClipboardCheck, FileText, Loader2 } from "lucide-react"
import { usePatientSearch } from "@/hooks/use-patients"
import type { Patient } from "@/types/patient"

export default function NursingAssessmentPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Use the patient search hook
  const { data: searchResults, isLoading: isSearching, error: searchError } = usePatientSearch(
    searchQuery,
    searchQuery.length > 0
  )

  const filteredPatients = searchResults?.patients || []

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
                      id="patient-search"
                      name="patient-search"
                      placeholder="Search by name or MRN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {searchError && (
                    <div className="text-sm text-destructive p-2 border border-destructive rounded">
                      Error searching patients: {searchError.message}
                    </div>
                  )}

                  {searchQuery && !isSearching && filteredPatients.length === 0 && (
                    <div className="text-sm text-muted-foreground p-2 border rounded">
                      No patients found matching "{searchQuery}"
                    </div>
                  )}

                  {filteredPatients.length > 0 && searchQuery && (
                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatient(patient)
                            setSearchQuery("")
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                        >
                          <div className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {patient.mrn && `MRN: ${patient.mrn}`}
                            {patient.mrn && patient.date_of_birth && " • "}
                            {patient.date_of_birth && `DOB: ${new Date(patient.date_of_birth).toLocaleDateString()}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedPatient && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedPatient.mrn && `MRN: ${selectedPatient.mrn}`}
                          {selectedPatient.mrn && selectedPatient.date_of_birth && " • "}
                          {selectedPatient.date_of_birth && `DOB: ${new Date(selectedPatient.date_of_birth).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                        Change Patient
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedPatient && selectedPatient.id && (
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
                            <Label htmlFor="blood-pressure-systolic">Blood Pressure</Label>
                            <div className="flex gap-2">
                              <Input id="blood-pressure-systolic" name="blood-pressure-systolic" placeholder="Systolic" />
                              <Input id="blood-pressure-diastolic" name="blood-pressure-diastolic" placeholder="Diastolic" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="heart-rate">Heart Rate (bpm)</Label>
                            <Input id="heart-rate" name="heart-rate" type="number" placeholder="72" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="temperature">Temperature (°F)</Label>
                            <Input id="temperature" name="temperature" type="number" step="0.1" placeholder="98.6" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="respiratory-rate">Respiratory Rate</Label>
                            <Input id="respiratory-rate" name="respiratory-rate" type="number" placeholder="16" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="o2-saturation">O2 Saturation (%)</Label>
                            <Input id="o2-saturation" name="o2-saturation" type="number" placeholder="98" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="weight">Weight (lbs)</Label>
                            <Input id="weight" name="weight" type="number" placeholder="165" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="height">Height (inches)</Label>
                            <Input id="height" name="height" type="number" placeholder="68" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bmi">BMI (auto-calc)</Label>
                            <Input id="bmi" name="bmi" disabled placeholder="25.1" />
                          </div>
                        </div>
                      </div>

                      {/* Physical Examination */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Physical Examination</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="general-appearance">General Appearance</Label>
                            <Select name="general-appearance">
                              <SelectTrigger id="general-appearance">
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
                            <Label htmlFor="mental-status">Mental Status</Label>
                            <Select name="mental-status">
                              <SelectTrigger id="mental-status">
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
                            <Label htmlFor="skin-condition">Skin Condition</Label>
                            <Select name="skin-condition">
                              <SelectTrigger id="skin-condition">
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
                            <Label htmlFor="respiratory">Respiratory</Label>
                            <Select name="respiratory">
                              <SelectTrigger id="respiratory">
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
                          <Label htmlFor="physical-exam-notes">Additional Physical Exam Notes</Label>
                          <Textarea id="physical-exam-notes" name="physical-exam-notes" rows={4} placeholder="Document any additional findings..." />
                        </div>
                      </div>

                      {/* Pain Assessment */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Pain Assessment</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="pain-level">Pain Level (0-10)</Label>
                            <Input id="pain-level" name="pain-level" type="number" min="0" max="10" placeholder="0" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pain-location">Pain Location</Label>
                            <Input id="pain-location" name="pain-location" placeholder="e.g., Lower back, abdomen" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pain-character">Pain Character</Label>
                            <Select name="pain-character">
                              <SelectTrigger id="pain-character">
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
                          <Label htmlFor="chronic-conditions">Chronic Conditions</Label>
                          <Textarea id="chronic-conditions" name="chronic-conditions" rows={3} placeholder="List chronic medical conditions..." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="current-medications">Current Medications</Label>
                          <Textarea id="current-medications" name="current-medications" rows={3} placeholder="List all current medications..." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="allergies">Allergies</Label>
                          <Textarea id="allergies" name="allergies" rows={2} placeholder="List drug allergies and reactions..." />
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
                            <Label htmlFor="hepatitis-a">Hepatitis A</Label>
                            <Select name="hepatitis-a">
                              <SelectTrigger id="hepatitis-a">
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
                            <Label htmlFor="hepatitis-b">Hepatitis B</Label>
                            <Select name="hepatitis-b">
                              <SelectTrigger id="hepatitis-b">
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
                            <Label htmlFor="hepatitis-c">Hepatitis C</Label>
                            <Select name="hepatitis-c">
                              <SelectTrigger id="hepatitis-c">
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
                          <Label htmlFor="hep-collection-datetime">Collection Date/Time</Label>
                          <Input id="hep-collection-datetime" name="hep-collection-datetime" type="datetime-local" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hep-collected-by">Collected By (RN)</Label>
                          <Input id="hep-collected-by" name="hep-collected-by" placeholder="Nurse name" />
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
                            <Label htmlFor="tb-test-type">TB Test Type</Label>
                            <Select name="tb-test-type">
                              <SelectTrigger id="tb-test-type">
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
                            <Label htmlFor="tb-test-status">Test Status</Label>
                            <Select name="tb-test-status">
                              <SelectTrigger id="tb-test-status">
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
                          <Label htmlFor="tb-administration-datetime">Administration Date/Time</Label>
                          <Input id="tb-administration-datetime" name="tb-administration-datetime" type="datetime-local" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tb-ppd-read-date">PPD Read Date (48-72 hours)</Label>
                          <Input id="tb-ppd-read-date" name="tb-ppd-read-date" type="datetime-local" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tb-administered-by">Administered By</Label>
                          <Input id="tb-administered-by" name="tb-administered-by" placeholder="Nurse name" />
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
                                <input 
                                  type="checkbox" 
                                  id={`standard-test-${test.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                                  name={`standard-test-${test.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                                  className="rounded" 
                                />
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
                                <input 
                                  type="checkbox" 
                                  id={`additional-test-${test.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                                  name={`additional-test-${test.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                                  className="rounded" 
                                />
                                <span className="text-sm">{test}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="blood-collection-datetime">Collection Date/Time</Label>
                        <Input id="blood-collection-datetime" name="blood-collection-datetime" type="datetime-local" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phlebotomist">Phlebotomist</Label>
                        <Input id="phlebotomist" name="phlebotomist" placeholder="Name of person drawing blood" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lab-order-number">Lab Order Number</Label>
                        <Input id="lab-order-number" name="lab-order-number" placeholder="Lab requisition number" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="blood-notes">Additional Notes</Label>
                        <Textarea id="blood-notes" name="blood-notes" rows={3} placeholder="Fasting status, patient cooperation, etc..." />
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
                          <Label htmlFor="uds-collection-datetime">Collection Date/Time</Label>
                          <Input id="uds-collection-datetime" name="uds-collection-datetime" type="datetime-local" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="uds-collected-by">Collected By</Label>
                          <Input id="uds-collected-by" name="uds-collected-by" placeholder="Collector name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specimen-id">Specimen ID</Label>
                          <Input id="specimen-id" name="specimen-id" placeholder="Unique specimen identifier" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="observed-collection">Observed Collection?</Label>
                          <Select name="observed-collection">
                            <SelectTrigger id="observed-collection">
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
                        <Label htmlFor="specimen-temperature">Specimen Temperature (°F)</Label>
                        <Input id="specimen-temperature" name="specimen-temperature" type="number" step="0.1" placeholder="90-100°F" />
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
                          ].map((drug) => {
                            const drugId = drug.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
                            return (
                              <div key={drug} className="space-y-2">
                                <Label htmlFor={`uds-${drugId}`} className="text-sm">{drug}</Label>
                                <Select name={`uds-${drugId}`}>
                                  <SelectTrigger id={`uds-${drugId}`}>
                                    <SelectValue placeholder="Result..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="negative">Negative</SelectItem>
                                    <SelectItem value="positive">Positive</SelectItem>
                                    <SelectItem value="invalid">Invalid</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pregnancy Test */}
                      <div className="space-y-2">
                        <Label htmlFor="pregnancy-test" className="text-lg font-semibold">Urine Pregnancy Test (if applicable)</Label>
                        <Select name="pregnancy-test">
                          <SelectTrigger id="pregnancy-test">
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
                            <input 
                              type="checkbox" 
                              id="send-for-confirmation"
                              name="send-for-confirmation"
                              className="rounded" 
                            />
                            <span>Send specimen for GC/MS confirmation testing</span>
                          </label>
                          <div className="space-y-2 ml-6">
                            <Label htmlFor="confirmation-lab-name">Lab Name</Label>
                            <Select name="confirmation-lab-name">
                              <SelectTrigger id="confirmation-lab-name">
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
                            <Label htmlFor="chain-of-custody">Chain of Custody Number</Label>
                            <Input id="chain-of-custody" name="chain-of-custody" placeholder="COC tracking number" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="uds-notes">Additional Notes</Label>
                        <Textarea id="uds-notes" name="uds-notes" rows={3} placeholder="Document any issues, dilution, adulteration concerns..." />
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
                            <Label htmlFor="hep-a-result">Hepatitis A Result</Label>
                            <Select name="hep-a-result">
                              <SelectTrigger id="hep-a-result">
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
                            <Label htmlFor="hep-b-result">Hepatitis B Result</Label>
                            <Select name="hep-b-result">
                              <SelectTrigger id="hep-b-result">
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
                            <Label htmlFor="hep-c-result">Hepatitis C Result</Label>
                            <Select name="hep-c-result">
                              <SelectTrigger id="hep-c-result">
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
                          <Label htmlFor="result-reviewed-by">Result Reviewed By</Label>
                          <Input id="result-reviewed-by" name="result-reviewed-by" placeholder="RN or Provider name" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="patient-counseling">Patient Counseling/Education Provided</Label>
                          <Textarea
                            id="patient-counseling"
                            name="patient-counseling"
                            rows={4}
                            placeholder="Document counseling provided regarding results, treatment options, prevention..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="referrals-followup">Referrals/Follow-up Actions</Label>
                          <Textarea
                            id="referrals-followup"
                            name="referrals-followup"
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
                            <Label htmlFor="tb-induration-size">Induration Size (mm)</Label>
                            <Input id="tb-induration-size" name="tb-induration-size" type="number" placeholder="Measure in millimeters" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tb-interpretation">Interpretation</Label>
                            <Select name="tb-interpretation">
                              <SelectTrigger id="tb-interpretation">
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
                          <Label htmlFor="tb-read-by">Read By (RN)</Label>
                          <Input id="tb-read-by" name="tb-read-by" placeholder="Nurse name" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tb-read-datetime">Read Date/Time</Label>
                          <Input id="tb-read-datetime" name="tb-read-datetime" type="datetime-local" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tb-clinical-notes">Clinical Notes</Label>
                          <Textarea id="tb-clinical-notes" name="tb-clinical-notes" rows={3} placeholder="Document findings, patient risk factors, follow-up plan..." />
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
