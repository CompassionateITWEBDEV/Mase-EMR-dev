"use client"

import { useState, useEffect } from "react"
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
import { Home, Briefcase, Phone, MapPin, Send, Clock, AlertCircle, Plus, Search, Package, Users, Loader2, X, User, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function CaseManagementPage() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [caseloadPatients, setCaseloadPatients] = useState<any[]>([])
  const [isLoadingCaseload, setIsLoadingCaseload] = useState(false)
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [referralDialogOpen, setReferralDialogOpen] = useState(false)

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

  // Search patients from database using API route
  const searchPatients = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(term)}&limit=20`)
      
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
    toast.success(`Selected patient: ${patient.first_name} ${patient.last_name}`)
  }

  // Clear selected patient
  const handleClearPatient = () => {
    setSelectedPatient(null)
    setSearchQuery("")
    setSearchResults([])
    toast.info("Patient selection cleared")
  }

  // Fetch assigned caseload patients on component mount
  useEffect(() => {
    const fetchCaseload = async () => {
      setIsLoadingCaseload(true)
      try {
        // Fetch active patients (you can modify this to fetch actual assigned caseload)
        // For now, fetching recent active patients as a placeholder
        const response = await fetch(`/api/patients?status=active&limit=50`)
        
        if (response.ok) {
          const data = await response.json()
          setCaseloadPatients(data.patients || [])
        }
      } catch (err) {
        console.error("Error fetching caseload:", err)
      } finally {
        setIsLoadingCaseload(false)
      }
    }

    fetchCaseload()
  }, [])

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

  // Handle patient selection from caseload dropdown
  const handleCaseloadSelect = (patientId: string) => {
    const patient = caseloadPatients.find((p) => p.id === patientId)
    if (patient) {
      handleSelectPatient(patient)
    }
  }

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
                <Button 
                  onClick={() => setResourceDialogOpen(true)} 
                  className="bg-cyan-600"
                  disabled={!selectedPatient}
                  title={!selectedPatient ? "Please select a patient first" : ""}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Request Resource
                </Button>
                <Button 
                  onClick={() => setReferralDialogOpen(true)} 
                  variant="outline"
                  disabled={!selectedPatient}
                  title={!selectedPatient ? "Please select a patient first" : ""}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Create Referral
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
                <CardDescription>
                  Search and select a patient to view their case management information and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedPatient ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Search Patient Section */}
                      <div className="space-y-2">
                        <Label>Search Patient</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by first name, last name, or full name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                          {isSearching && (
                            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                          )}
                        </div>
                        {searchQuery.length > 0 && searchQuery.length < 2 && (
                          <div className="text-sm text-gray-500 py-2">
                            Type at least 2 characters to search
                          </div>
                        )}
                      </div>

                      {/* Assigned Caseload Section */}
                      <div className="space-y-2">
                        <Label>Assigned Caseload</Label>
                        {isLoadingCaseload ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          <Select
                            value={selectedPatient?.id || ""}
                            onValueChange={handleCaseloadSelect}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select from your caseload" />
                            </SelectTrigger>
                            <SelectContent>
                              {caseloadPatients.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  No patients in caseload
                                </div>
                              ) : (
                                caseloadPatients.map((patient) => (
                                  <SelectItem key={patient.id} value={patient.id}>
                                    {patient.first_name} {patient.last_name}
                                    {patient.mrn && ` - MRN: ${patient.mrn}`}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                        {caseloadPatients.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {caseloadPatients.length} patient{caseloadPatients.length !== 1 ? "s" : ""} in caseload
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Search Results - Full Width */}
                    {searchResults.length > 0 && (
                      <div className="border rounded-lg divide-y max-h-64 overflow-y-auto shadow-sm">
                        {searchResults.map((patient) => (
                          <div
                            key={patient.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleSelectPatient(patient)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-cyan-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  {patient.phone && (
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {patient.phone}
                                    </p>
                                  )}
                                  {patient.mrn && (
                                    <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
                                  )}
                                  {patient.date_of_birth && (
                                    <p className="text-sm text-gray-600">
                                      DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <CheckCircle className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">
                        No patients found matching "{searchQuery}"
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 border rounded-lg bg-cyan-50 border-cyan-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">
                            {selectedPatient.first_name} {selectedPatient.last_name}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            {selectedPatient.phone && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {selectedPatient.phone}
                              </p>
                            )}
                            {selectedPatient.mrn && (
                              <p className="text-sm text-gray-600">MRN: {selectedPatient.mrn}</p>
                            )}
                            {selectedPatient.email && (
                              <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearPatient}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!selectedPatient ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Patient Selected
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Please search and select a patient above to view their case management information, 
                      resource requests, referrals, and case notes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="resources" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="resources">Resource Requests</TabsTrigger>
                  <TabsTrigger value="referrals">Community Referrals</TabsTrigger>
                  <TabsTrigger value="notes">Case Notes</TabsTrigger>
                  <TabsTrigger value="services">Active Services</TabsTrigger>
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
                      <Button 
                        onClick={() => setNoteDialogOpen(true)} 
                        size="sm"
                        disabled={!selectedPatient}
                        title={!selectedPatient ? "Please select a patient first" : ""}
                      >
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
            </Tabs>
            )}
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
    </div>
  )
}
