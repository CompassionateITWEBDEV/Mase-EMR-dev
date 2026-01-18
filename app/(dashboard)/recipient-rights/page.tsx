"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Clock, CheckCircle2, FileText, Mail, User, Calendar, Eye, Search, Filter } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

export default function RecipientRightsPage() {
  const [activeTab, setActiveTab] = useState("active")
  const [complaints, setComplaints] = useState<any[]>([])
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true)
        const supabase = createBrowserClient()

        const { data, error } = await supabase
          .from("recipient_rights_complaints")
          .select("*")
          .order("complaint_date", { ascending: false })

        if (error) {
          console.error("Error fetching complaints:", error)
          return
        }

        const transformedComplaints = data.map((c: any) => ({
          id: c.id,
          complaintNumber: c.complaint_number,
          complaintDate: new Date(c.complaint_date).toLocaleDateString(),
          patientName: c.complainant_name || "Anonymous",
          isAnonymous: c.is_anonymous,
          category: c.complaint_category,
          type: c.complaint_type,
          description: c.complaint_description,
          status: c.investigation_status,
          priority: c.priority,
          severity: c.severity,
          assignedOfficer: c.assigned_officer_id || "Unassigned",
          incidentDate: c.incident_date,
          daysOpen: Math.floor((new Date().getTime() - new Date(c.complaint_date).getTime()) / (1000 * 60 * 60 * 24)),
          resolutionDate: c.resolution_date,
          rightsViolationConfirmed: c.rights_violation_confirmed,
        }))

        setComplaints(transformedComplaints)
      } catch (error) {
        console.error("Error in fetchComplaints:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [])

  useEffect(() => {
    let filtered = complaints
    if (activeTab === "active") {
      filtered = complaints.filter((c) => c.status !== "resolved" && c.status !== "closed")
    } else if (activeTab === "resolved") {
      filtered = complaints.filter((c) => c.status === "resolved" || c.status === "closed")
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((c) => c.category === filterCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredComplaints(filtered)
  }, [activeTab, complaints, searchTerm, filterCategory])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b"
      case "assigned":
        return "#3b82f6"
      case "investigating":
        return "#8b5cf6"
      case "resolved":
        return "#10b981"
      case "closed":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "#dc2626"
      case "high":
        return "#f59e0b"
      case "normal":
        return "#3b82f6"
      case "low":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#f8fafc" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#0f172a" }}>
              Recipient Rights Management
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Investigate and resolve patient rights complaints confidentially
            </p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Shield className="mr-1 h-4 w-4" />
            Confidential
          </Badge>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                    Active Complaints
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "#0f172a" }}>
                    {complaints.filter((c) => c.status !== "resolved" && c.status !== "closed").length}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#fef3c7" }}
                >
                  <Clock className="h-6 w-6" style={{ color: "#d97706" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                    Under Investigation
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "#0f172a" }}>
                    {complaints.filter((c) => c.status === "investigating").length}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#ddd6fe" }}
                >
                  <Eye className="h-6 w-6" style={{ color: "#7c3aed" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                    Resolved This Month
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "#0f172a" }}>
                    {
                      complaints.filter((c) => {
                        if (!c.resolutionDate) return false
                        const resDate = new Date(c.resolutionDate)
                        const now = new Date()
                        return resDate.getMonth() === now.getMonth() && resDate.getFullYear() === now.getFullYear()
                      }).length
                    }
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#d1fae5" }}
                >
                  <CheckCircle2 className="h-6 w-6" style={{ color: "#10b981" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                    Avg Resolution Time
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "#0f172a" }}>
                    {(() => {
                      const resolved = complaints.filter((c) => c.resolutionDate)
                      if (resolved.length === 0) return "N/A"
                      const avg = resolved.reduce((acc, c) => acc + c.daysOpen, 0) / resolved.length
                      return `${avg.toFixed(1)} days`
                    })()}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#dbeafe" }}
                >
                  <Calendar className="h-6 w-6" style={{ color: "#3b82f6" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Complaint Management</CardTitle>
            <CardDescription>Review, investigate, and resolve recipient rights complaints</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="active">
                  <Clock className="mr-2 h-4 w-4" />
                  Active ({complaints.filter((c) => c.status !== "resolved" && c.status !== "closed").length})
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Resolved ({complaints.filter((c) => c.status === "resolved" || c.status === "closed").length})
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <FileText className="mr-2 h-4 w-4" />
                  Reports
                </TabsTrigger>
              </TabsList>

              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#94a3b8" }} />
                  <Input
                    placeholder="Search by complaint #, patient name, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="rights_violation">Rights Violation</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="abuse">Abuse</SelectItem>
                    <SelectItem value="discrimination">Discrimination</SelectItem>
                    <SelectItem value="confidentiality">Confidentiality</SelectItem>
                    <SelectItem value="medication">Medication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <TabsContent value="active" className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto mb-4 animate-spin" style={{ color: "#cbd5e1" }} />
                    <p style={{ color: "#64748b" }}>Loading complaints...</p>
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
                    <p style={{ color: "#64748b" }}>No active complaints found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredComplaints.map((complaint) => (
                      <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold" style={{ color: "#0f172a" }}>
                                  {complaint.complaintNumber}
                                </h3>
                                <Badge
                                  variant="outline"
                                  style={{
                                    borderColor: getStatusColor(complaint.status),
                                    color: getStatusColor(complaint.status),
                                  }}
                                >
                                  {complaint.status}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  style={{
                                    borderColor: getPriorityColor(complaint.priority),
                                    color: getPriorityColor(complaint.priority),
                                  }}
                                >
                                  {complaint.priority}
                                </Badge>
                                {complaint.isAnonymous && (
                                  <Badge variant="secondary">
                                    <User className="mr-1 h-3 w-3" />
                                    Anonymous
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm" style={{ color: "#64748b" }}>
                                {complaint.description.length > 120
                                  ? complaint.description.substring(0, 120) + "..."
                                  : complaint.description}
                              </p>

                              <div className="flex items-center gap-4 text-sm" style={{ color: "#94a3b8" }}>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Filed: {complaint.complaintDate}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Officer: {complaint.assignedOfficer}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {complaint.daysOpen} days open
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedComplaint(complaint)
                                setViewDialogOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resolved" className="space-y-4">
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: "#10b981" }} />
                  <p style={{ color: "#64748b" }}>View resolved and closed complaints</p>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
                  <p style={{ color: "#64748b" }}>Generate compliance reports</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Complaint Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedComplaint?.complaintNumber}</DialogTitle>
            <DialogDescription>Confidential Recipient Rights Complaint Details</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-6">
              {/* Status Section */}
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  style={{
                    borderColor: getStatusColor(selectedComplaint.status),
                    color: getStatusColor(selectedComplaint.status),
                  }}
                >
                  {selectedComplaint.status}
                </Badge>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: getPriorityColor(selectedComplaint.priority),
                    color: getPriorityColor(selectedComplaint.priority),
                  }}
                >
                  {selectedComplaint.priority} priority
                </Badge>
                <Badge variant="secondary">{selectedComplaint.severity} severity</Badge>
              </div>

              {/* Complainant Info */}
              <div>
                <h3 className="font-semibold mb-2">Complainant Information</h3>
                <div className="grid gap-2 text-sm">
                  <div>
                    <span style={{ color: "#64748b" }}>Name: </span>
                    <span style={{ color: "#0f172a" }}>{selectedComplaint.patientName}</span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Filed: </span>
                    <span style={{ color: "#0f172a" }}>{selectedComplaint.complaintDate}</span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Assigned Officer: </span>
                    <span style={{ color: "#0f172a" }}>{selectedComplaint.assignedOfficer}</span>
                  </div>
                </div>
              </div>

              {/* Incident Details */}
              <div>
                <h3 className="font-semibold mb-2">Incident Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span style={{ color: "#64748b" }}>Date of Incident: </span>
                    <span style={{ color: "#0f172a" }}>{selectedComplaint.incidentDate}</span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Category: </span>
                    <span style={{ color: "#0f172a" }}>{selectedComplaint.category}</span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Type: </span>
                    <span style={{ color: "#0f172a" }}>{selectedComplaint.type}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Complaint Description</h3>
                <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Investigation Actions */}
              {selectedComplaint.status !== "resolved" && (
                <div className="flex gap-2 pt-4 border-t" style={{ borderColor: "#e2e8f0" }}>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Add Investigation Note
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Complainant
                  </Button>
                  <Button variant="outline" size="sm">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Resolve Complaint
                  </Button>
                </div>
              )}

              {/* Resolution Info */}
              {selectedComplaint.status === "resolved" && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#d1fae5" }}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: "#059669" }} />
                    <div>
                      <p className="font-medium" style={{ color: "#065f46" }}>
                        Complaint Resolved
                      </p>
                      <p className="text-sm mt-1" style={{ color: "#047857" }}>
                        Resolved on {selectedComplaint.resolutionDate}
                        {selectedComplaint.rightsViolationConfirmed && " • Rights violation confirmed"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
