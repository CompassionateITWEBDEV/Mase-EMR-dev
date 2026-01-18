"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Clock, Activity, Plus, Search, TrendingUp } from "lucide-react"

export default function PeerRecoveryPage() {
  const [selectedPatient, setSelectedPatient] = useState("")
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false)
  const [progressNotesDialogOpen, setProgressNotesDialogOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Peer Recovery Department</h1>
                <p className="text-gray-600 mt-1">
                  Peer support compliance tracking, wellness checks, and recovery notes
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setNoteDialogOpen(true)} className="bg-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recovery Note
                </Button>
                <Button onClick={() => setAssessmentDialogOpen(true)} variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Wellness Check
                </Button>
                <Button onClick={() => setProgressNotesDialogOpen(true)} variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  Progress Notes
                </Button>
              </div>
            </div>

            {/* Patient Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Select Patient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Search Patient</Label>
                    <Input placeholder="Search by name..." />
                  </div>
                  <div>
                    <Label>Assigned Peer Support Group</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from your group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient1">Sarah Johnson - Active</SelectItem>
                        <SelectItem value="patient2">Michael Chen - Check-in Due</SelectItem>
                        <SelectItem value="patient3">Emily Davis - Follow-up Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="compliance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="compliance">Compliance Checks</TabsTrigger>
                <TabsTrigger value="wellness">Wellness Assessments</TabsTrigger>
                <TabsTrigger value="notes">Recovery Notes</TabsTrigger>
                <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
                <TabsTrigger value="progress-notes">Progress Notes</TabsTrigger>
              </TabsList>

              {/* Compliance Checks Tab */}
              <TabsContent value="compliance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Required Compliance Items</CardTitle>
                    <CardDescription>Track patient compliance with program requirements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { item: "Weekly Peer Support Meeting", status: "completed", date: "Completed today" },
                        { item: "Monthly UDS Test", status: "due", date: "Due in 3 days" },
                        { item: "Counseling Session", status: "completed", date: "Completed yesterday" },
                        { item: "Treatment Plan Review", status: "overdue", date: "Overdue by 2 days" },
                      ].map((check) => (
                        <div key={check.item} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {check.status === "completed" ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : check.status === "overdue" ? (
                              <Clock className="w-5 h-5 text-red-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-600" />
                            )}
                            <div>
                              <div className="font-medium">{check.item}</div>
                              <div
                                className={`text-sm ${check.status === "completed" ? "text-green-600" : check.status === "overdue" ? "text-red-600" : "text-amber-600"}`}
                              >
                                {check.date}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              check.status === "completed"
                                ? "default"
                                : check.status === "overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {check.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wellness Assessments Tab */}
              <TabsContent value="wellness" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Wellness Checks</CardTitle>
                    <CardDescription>Track patient wellness and recovery progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          date: "Today, 11:00 AM",
                          mood: "Positive",
                          cravings: "None",
                          concerns: "None reported",
                          support: "Strong",
                        },
                        {
                          date: "3 days ago",
                          mood: "Mixed",
                          cravings: "Mild",
                          concerns: "Work stress",
                          support: "Moderate",
                        },
                      ].map((check, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{check.date}</span>
                            <Badge variant="outline">Wellness Check</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Mood:</span>
                              <span className="ml-2 font-medium">{check.mood}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Cravings:</span>
                              <span className="ml-2 font-medium">{check.cravings}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Support System:</span>
                              <span className="ml-2 font-medium">{check.support}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Concerns:</span>
                              <span className="ml-2 font-medium">{check.concerns}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recovery Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Peer Recovery Notes</CardTitle>
                    <CardDescription>Document peer support interactions and observations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          date: "Today, 2:30 PM",
                          type: "Support Session",
                          content:
                            "Had a productive peer support session. Patient shared progress with maintaining boundaries...",
                        },
                        {
                          date: "Yesterday",
                          type: "Phone Check-in",
                          content: "Brief phone check-in. Patient reported feeling positive about recent progress...",
                        },
                      ].map((note, idx) => (
                        <div key={idx} className="p-4 border rounded-lg bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{note.type}</Badge>
                            <span className="text-sm text-gray-500">{note.date}</span>
                          </div>
                          <p className="text-sm text-gray-700">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Progress Tracking Tab */}
              <TabsContent value="progress" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                        Recovery Milestones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { milestone: "30 Days Clean", achieved: true, date: "2 weeks ago" },
                          { milestone: "90 Days Clean", achieved: false, target: "In 60 days" },
                          { milestone: "Completed Peer Support Training", achieved: true, date: "Last month" },
                          { milestone: "Return to Work", achieved: false, target: "In progress" },
                        ].map((item) => (
                          <div key={item.milestone} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              {item.achieved ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Clock className="w-5 h-5 text-gray-400" />
                              )}
                              <div>
                                <div className="font-medium">{item.milestone}</div>
                                <div className="text-sm text-gray-600">{item.achieved ? item.date : item.target}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-600" />
                        Engagement Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Meeting Attendance</span>
                            <span className="text-sm text-gray-600">95%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: "95%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Program Compliance</span>
                            <span className="text-sm text-gray-600">88%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-cyan-600 h-2 rounded-full" style={{ width: "88%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Wellness Check-ins</span>
                            <span className="text-sm text-gray-600">100%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: "100%" }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Progress Notes Tab */}
              <TabsContent value="progress-notes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Peer Recovery Progress Notes</CardTitle>
                    <CardDescription>Document patient progress in peer recovery program</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Note Date</Label>
                      <Input type="datetime-local" />
                    </div>
                    <div>
                      <Label>Recovery Progress Summary</Label>
                      <Textarea
                        rows={6}
                        placeholder="Document patient's progress in recovery, milestones achieved, challenges faced..."
                      />
                    </div>
                    <div>
                      <Label>Peer Support Interventions</Label>
                      <Textarea
                        rows={4}
                        placeholder="Document peer support interventions provided, techniques used..."
                      />
                    </div>
                    <div>
                      <Label>Recovery Goals Progress</Label>
                      <Textarea rows={3} placeholder="Update on progress toward recovery goals..." />
                    </div>
                    <Button className="w-full bg-cyan-600">Save Progress Note</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Recovery Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Peer Recovery Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Note Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_session">Support Session</SelectItem>
                  <SelectItem value="phone_checkin">Phone Check-in</SelectItem>
                  <SelectItem value="crisis_intervention">Crisis Intervention</SelectItem>
                  <SelectItem value="referral">Referral Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note Content</Label>
              <Textarea placeholder="Document peer support interaction..." rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-cyan-600">Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wellness Assessment Dialog */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wellness Check Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Mood</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="negative">Negative/Struggling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Craving Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Support System Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strong">Strong support</SelectItem>
                  <SelectItem value="moderate">Moderate support</SelectItem>
                  <SelectItem value="limited">Limited support</SelectItem>
                  <SelectItem value="none">No support identified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Concerns or Risk Factors</Label>
              <Textarea placeholder="Document any concerns, risk factors, or areas needing attention..." rows={4} />
            </div>
            <div>
              <Label>Action Plan</Label>
              <Textarea placeholder="Document action steps or referrals..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssessmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-cyan-600">Save Assessment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Notes Dialog */}
      <Dialog open={progressNotesDialogOpen} onOpenChange={setProgressNotesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Progress Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Note Date</Label>
              <Input type="datetime-local" />
            </div>
            <div>
              <Label>Recovery Progress Summary</Label>
              <Textarea
                rows={6}
                placeholder="Document patient's progress in recovery, milestones achieved, challenges faced..."
              />
            </div>
            <div>
              <Label>Peer Support Interventions</Label>
              <Textarea rows={4} placeholder="Document peer support interventions provided, techniques used..." />
            </div>
            <div>
              <Label>Recovery Goals Progress</Label>
              <Textarea rows={3} placeholder="Update on progress toward recovery goals..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-cyan-600">Save Progress Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
