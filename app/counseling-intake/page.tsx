"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Brain, ClipboardCheck, Search, Package } from "lucide-react"
import { toast } from "sonner"

export default function CounselingIntakePage() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [asamLevel, setAsamLevel] = useState("")

  const handleSubmitIntake = () => {
    toast.success("Counseling intake completed and added to Intake Queue")
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
            <div className="flex gap-4">
              <div className="flex-1">
                <Input placeholder="Search by name, client number, or DOB..." />
              </div>
              <Button>Search</Button>
            </div>
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
            <TabsTrigger value="progress">Progress Notes</TabsTrigger>
            <TabsTrigger value="peer-tasks">Peer Recovery Tasks</TabsTrigger>
            <TabsTrigger value="case-tasks">Case Management</TabsTrigger>
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

          {/* Progress Notes Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Counseling Progress Notes</CardTitle>
                <CardDescription>Document ongoing counseling sessions and patient progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Session Date/Time</Label>
                  <Input type="datetime-local" />
                </div>
                <div>
                  <Label>Session Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Counseling</SelectItem>
                      <SelectItem value="group">Group Therapy</SelectItem>
                      <SelectItem value="family">Family Session</SelectItem>
                      <SelectItem value="crisis">Crisis Intervention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Progress Notes</Label>
                  <Textarea
                    rows={8}
                    placeholder="Document session content, patient progress, interventions used, and clinical observations..."
                  />
                </div>
                <div>
                  <Label>Treatment Plan Updates</Label>
                  <Textarea rows={4} placeholder="Note any updates to treatment goals or plan..." />
                </div>
                <Button className="w-full">Save Progress Note</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Peer Recovery Task Assignment Tab */}
          <TabsContent value="peer-tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assign Tasks to Peer Recovery</CardTitle>
                <CardDescription>Create and track tasks for peer recovery specialists</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Task Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wellness">Wellness Check</SelectItem>
                      <SelectItem value="support">Support Session</SelectItem>
                      <SelectItem value="crisis">Crisis Follow-up</SelectItem>
                      <SelectItem value="compliance">Compliance Check</SelectItem>
                      <SelectItem value="outreach">Community Outreach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign To Peer Specialist</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select peer specialist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peer1">John Martinez - Peer Recovery Specialist</SelectItem>
                      <SelectItem value="peer2">Maria Garcia - Peer Recovery Specialist</SelectItem>
                      <SelectItem value="peer3">David Lee - Senior Peer Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Task Description</Label>
                  <Textarea rows={4} placeholder="Describe what needs to be done and any specific instructions..." />
                </div>
                <Button className="w-full">Assign Task</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Tasks Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      task: "Weekly wellness check",
                      assignedTo: "John Martinez",
                      status: "completed",
                      date: "2 days ago",
                    },
                    {
                      task: "Crisis follow-up session",
                      assignedTo: "Maria Garcia",
                      status: "in-progress",
                      date: "Due today",
                    },
                    {
                      task: "Community resource referral",
                      assignedTo: "David Lee",
                      status: "pending",
                      date: "Due in 3 days",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.task}</div>
                        <div className="text-sm text-gray-600">Assigned to: {item.assignedTo}</div>
                        <div className="text-xs text-gray-500">{item.date}</div>
                      </div>
                      <Badge
                        variant={
                          item.status === "completed"
                            ? "default"
                            : item.status === "in-progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Case Management Task Assignment Tab */}
          <TabsContent value="case-tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Request Resources & Case Management Support
                </CardTitle>
                <CardDescription>Submit resource requests and assign tasks to case management team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Request Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="housing">Housing Assistance</SelectItem>
                      <SelectItem value="transportation">Transportation Voucher</SelectItem>
                      <SelectItem value="employment">Employment Resources</SelectItem>
                      <SelectItem value="food">Food/Nutrition Assistance</SelectItem>
                      <SelectItem value="legal">Legal Aid Referral</SelectItem>
                      <SelectItem value="insurance">Insurance/Benefits Enrollment</SelectItem>
                      <SelectItem value="childcare">Childcare Services</SelectItem>
                      <SelectItem value="medical">Medical Care Coordination</SelectItem>
                      <SelectItem value="financial">Financial Assistance</SelectItem>
                      <SelectItem value="education">Education/Training Programs</SelectItem>
                      <SelectItem value="other">Other Resource</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign To Case Manager</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select case manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm1">Jennifer Brown - Senior Case Manager</SelectItem>
                      <SelectItem value="cm2">Michael Thompson - Case Manager</SelectItem>
                      <SelectItem value="cm3">Lisa Chen - Resource Coordinator</SelectItem>
                      <SelectItem value="cm4">Robert Wilson - Benefits Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Urgency Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine - Within 2 weeks</SelectItem>
                      <SelectItem value="soon">Soon - Within 1 week</SelectItem>
                      <SelectItem value="urgent">Urgent - Within 48 hours</SelectItem>
                      <SelectItem value="emergency">Emergency - Same day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Completion Date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Patient Current Situation</Label>
                  <Textarea
                    rows={3}
                    placeholder="Describe patient's current circumstances and barriers to treatment..."
                  />
                </div>
                <div>
                  <Label>Specific Request Details</Label>
                  <Textarea
                    rows={4}
                    placeholder="Provide detailed information about the resource needed, eligibility requirements, or any documentation needed..."
                  />
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
                  <input type="checkbox" id="follow-up" className="mt-1" />
                  <label htmlFor="follow-up" className="text-sm">
                    Notify me when this request is fulfilled or requires additional information
                  </label>
                </div>
                <Button className="w-full">Submit Resource Request</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Resource Requests</CardTitle>
                <CardDescription>Track status of submitted case management requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      request: "Housing assistance referral",
                      assignedTo: "Jennifer Brown",
                      status: "completed",
                      date: "Completed 5 days ago",
                      urgency: "urgent",
                    },
                    {
                      request: "Transportation vouchers (monthly)",
                      assignedTo: "Michael Thompson",
                      status: "in-progress",
                      date: "Started 2 days ago",
                      urgency: "routine",
                    },
                    {
                      request: "Food bank enrollment",
                      assignedTo: "Lisa Chen",
                      status: "pending",
                      date: "Submitted today",
                      urgency: "soon",
                    },
                    {
                      request: "Medicaid application assistance",
                      assignedTo: "Robert Wilson",
                      status: "waiting-info",
                      date: "Needs documentation",
                      urgency: "urgent",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{item.request}</div>
                          <div className="text-sm text-gray-600">Case Manager: {item.assignedTo}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.date}</div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge
                            variant={
                              item.status === "completed"
                                ? "default"
                                : item.status === "in-progress"
                                  ? "secondary"
                                  : item.status === "waiting-info"
                                    ? "outline"
                                    : "outline"
                            }
                          >
                            {item.status === "waiting-info" ? "Needs Info" : item.status}
                          </Badge>
                          {item.urgency === "urgent" && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm">
                          Send Message
                        </Button>
                      </div>
                    </div>
                  ))}
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
  )
}
