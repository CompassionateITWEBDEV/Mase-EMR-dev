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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Home, Briefcase, Phone, MapPin, Send, Clock, AlertCircle, Plus, Search, Package, Users } from "lucide-react"

export default function CaseManagementPage() {
  const [selectedPatient, setSelectedPatient] = useState("")
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [referralDialogOpen, setReferralDialogOpen] = useState(false)
  const [progressDialogOpen, setProgressDialogOpen] = useState(false)

  const [resourceForm, setResourceForm] = useState({
    service: "",
    urgency: "normal",
    reason: "",
    notes: "",
  })

  const [noteForm, setNoteForm] = useState({
    noteType: "case_note",
    content: "",
  })

  const [referralForm, setReferralForm] = useState({
    referralType: "",
    provider: "",
    reason: "",
    priority: "normal",
  })

  const [progressForm, setProgressForm] = useState({
    noteDate: "",
    progressSummary: "",
    servicesCoordinationUpdate: "",
    nextSteps: "",
  })

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
                <h1 className="text-3xl font-bold text-gray-900">Case Management & Resource Center</h1>
                <p className="text-gray-600 mt-1">Coordinate patient resources, referrals, and community connections</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setResourceDialogOpen(true)} className="bg-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Request Resource
                </Button>
                <Button onClick={() => setReferralDialogOpen(true)} variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  Create Referral
                </Button>
                <Button onClick={() => setProgressDialogOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Progress Note
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
                    <Input placeholder="Search by name or ID..." />
                  </div>
                  <div>
                    <Label>Assigned Caseload</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from your caseload" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient1">Sarah Johnson - Active</SelectItem>
                        <SelectItem value="patient2">Michael Chen - High Priority</SelectItem>
                        <SelectItem value="patient3">Emily Davis - Follow-up Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="resources" className="space-y-4">
              <TabsList>
                <TabsTrigger value="resources">Resource Requests</TabsTrigger>
                <TabsTrigger value="referrals">Community Referrals</TabsTrigger>
                <TabsTrigger value="notes">Case Notes</TabsTrigger>
                <TabsTrigger value="services">Active Services</TabsTrigger>
                <TabsTrigger value="progress">Progress Notes</TabsTrigger>
              </TabsList>

              {/* Resource Requests Tab */}
              <TabsContent value="resources" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { service: "Housing Assistance", icon: Home, status: "pending", urgency: "high" },
                    { service: "Employment Services", icon: Briefcase, status: "active", urgency: "normal" },
                    { service: "Transportation", icon: MapPin, status: "completed", urgency: "low" },
                  ].map((request) => (
                    <Card key={request.service}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <request.icon className="w-5 h-5 text-cyan-600" />
                            <CardTitle className="text-base">{request.service}</CardTitle>
                          </div>
                          <Badge
                            variant={
                              request.status === "completed"
                                ? "default"
                                : request.status === "active"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Requested: 2 days ago</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle
                              className={`w-4 h-4 ${request.urgency === "high" ? "text-red-500" : "text-gray-500"}`}
                            />
                            <span className={request.urgency === "high" ? "text-red-600 font-medium" : "text-gray-600"}>
                              {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)} Priority
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full mt-4 bg-transparent" size="sm">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Community Referrals Tab */}
              <TabsContent value="referrals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Referrals</CardTitle>
                    <CardDescription>Track community provider referrals and their status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          provider: "Hope Housing Services",
                          service: "Permanent Supportive Housing",
                          status: "scheduled",
                        },
                        { provider: "Workforce Development Center", service: "Job Training", status: "contacted" },
                        { provider: "Family Support Network", service: "Parenting Classes", status: "completed" },
                      ].map((referral) => (
                        <div
                          key={referral.provider}
                          className="p-4 border rounded-lg flex items-center justify-between hover:bg-gray-50"
                        >
                          <div>
                            <div className="font-medium">{referral.provider}</div>
                            <div className="text-sm text-gray-600">{referral.service}</div>
                          </div>
                          <Badge
                            variant={referral.status === "completed" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {referral.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Case Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Case Management Notes</CardTitle>
                      <Button onClick={() => setNoteDialogOpen(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          date: "Today, 10:30 AM",
                          type: "Phone Contact",
                          content:
                            "Spoke with patient regarding housing application. Patient is waiting for approval...",
                        },
                        {
                          date: "Yesterday, 2:15 PM",
                          type: "Service Coordination",
                          content: "Coordinated with employment services. Patient scheduled for interview next week...",
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

              {/* Active Services Tab */}
              <TabsContent value="services" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-cyan-600" />
                        Available Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          "Housing Assistance",
                          "Employment Services",
                          "Transportation",
                          "Food Assistance",
                          "Legal Aid",
                          "Family Services",
                        ].map((service) => (
                          <div key={service} className="p-3 border rounded hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{service}</span>
                              <Button variant="ghost" size="sm">
                                Request
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-600" />
                        Community Partners
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="p-3 border rounded">
                          <div className="font-medium">Hope Housing Services</div>
                          <div className="text-gray-600">Housing & Shelter</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Phone className="w-4 h-4" />
                            <span>(555) 123-4567</span>
                          </div>
                        </div>
                        <div className="p-3 border rounded">
                          <div className="font-medium">Workforce Development</div>
                          <div className="text-gray-600">Employment Training</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Phone className="w-4 h-4" />
                            <span>(555) 234-5678</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Progress Notes Tab */}
              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Management Progress Notes</CardTitle>
                    <CardDescription>Document ongoing case management progress and interventions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Note Date</Label>
                      <Input type="datetime-local" />
                    </div>
                    <div>
                      <Label>Progress Summary</Label>
                      <Textarea
                        rows={6}
                        placeholder="Document patient progress toward case management goals, services utilized, barriers addressed..."
                      />
                    </div>
                    <div>
                      <Label>Services Coordination Update</Label>
                      <Textarea
                        rows={4}
                        placeholder="Document coordination with community providers, referral status, resource connections..."
                      />
                    </div>
                    <div>
                      <Label>Next Steps</Label>
                      <Textarea rows={3} placeholder="Plan for upcoming case management activities..." />
                    </div>
                    <Button className="w-full bg-cyan-600">Save Progress Note</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Resource Request Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Resource or Service</DialogTitle>
            <DialogDescription>Submit a resource request for your patient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Type</Label>
              <Select
                value={resourceForm.service}
                onValueChange={(v) => setResourceForm({ ...resourceForm, service: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="housing">Housing Assistance</SelectItem>
                  <SelectItem value="employment">Employment Services</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="food">Food Assistance</SelectItem>
                  <SelectItem value="legal">Legal Aid</SelectItem>
                  <SelectItem value="medical">Medical Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Urgency Level</Label>
              <Select
                value={resourceForm.urgency}
                onValueChange={(v) => setResourceForm({ ...resourceForm, urgency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Within a month</SelectItem>
                  <SelectItem value="normal">Normal - Within 2 weeks</SelectItem>
                  <SelectItem value="high">High - Within a week</SelectItem>
                  <SelectItem value="urgent">Urgent - Immediate need</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason for Request</Label>
              <Textarea
                placeholder="Describe why this service is needed..."
                value={resourceForm.reason}
                onChange={(e) => setResourceForm({ ...resourceForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResourceDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-cyan-600">Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Case Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Case Management Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Note Type</Label>
              <Select value={noteForm.noteType} onValueChange={(v) => setNoteForm({ ...noteForm, noteType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="case_note">Case Note</SelectItem>
                  <SelectItem value="phone_contact">Phone Contact</SelectItem>
                  <SelectItem value="home_visit">Home Visit</SelectItem>
                  <SelectItem value="service_coordination">Service Coordination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note Content</Label>
              <Textarea
                placeholder="Enter case management notes..."
                rows={6}
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              />
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

      {/* Progress Note Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Progress Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Note Date</Label>
              <Input
                type="datetime-local"
                value={progressForm.noteDate}
                onChange={(e) => setProgressForm({ ...progressForm, noteDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Progress Summary</Label>
              <Textarea
                rows={6}
                placeholder="Document patient progress toward case management goals, services utilized, barriers addressed..."
                value={progressForm.progressSummary}
                onChange={(e) => setProgressForm({ ...progressForm, progressSummary: e.target.value })}
              />
            </div>
            <div>
              <Label>Services Coordination Update</Label>
              <Textarea
                rows={4}
                placeholder="Document coordination with community providers, referral status, resource connections..."
                value={progressForm.servicesCoordinationUpdate}
                onChange={(e) => setProgressForm({ ...progressForm, servicesCoordinationUpdate: e.target.value })}
              />
            </div>
            <div>
              <Label>Next Steps</Label>
              <Textarea
                rows={3}
                placeholder="Plan for upcoming case management activities..."
                value={progressForm.nextSteps}
                onChange={(e) => setProgressForm({ ...progressForm, nextSteps: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-cyan-600">Save Progress Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
