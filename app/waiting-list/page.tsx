"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Phone, UserPlus, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface WaitlistEntry {
  id: string
  patient_name: string
  patient_phone: string
  appointment_type: string
  priority: string
  preferred_date: string
  preferred_time: string
  added_date: string
  status: string
  notes: string
  provider_preference?: string
}

export default function WaitingListPage() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [filter, setFilter] = useState("all")
  const [newEntry, setNewEntry] = useState({
    patient_name: "",
    patient_phone: "",
    appointment_type: "New Patient Intake",
    priority: "standard",
    preferred_date: "",
    preferred_time: "morning",
    provider_preference: "",
    notes: "",
  })

  useEffect(() => {
    fetchWaitlist()
  }, [filter])

  const fetchWaitlist = async () => {
    try {
      const supabase = createClient()
      let query = supabase.from("appointment_waitlist").select("*").order("added_date", { ascending: false })

      if (filter !== "all") {
        query = query.eq("status", filter)
      }

      const { data, error } = await query

      if (error) throw error
      setWaitlist(data || [])
    } catch (error) {
      console.error("Error fetching waitlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToWaitlist = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("appointment_waitlist").insert([
        {
          ...newEntry,
          added_date: new Date().toISOString(),
          status: "waiting",
        },
      ])

      if (error) throw error

      setShowAddDialog(false)
      setNewEntry({
        patient_name: "",
        patient_phone: "",
        appointment_type: "New Patient Intake",
        priority: "standard",
        preferred_date: "",
        preferred_time: "morning",
        provider_preference: "",
        notes: "",
      })
      fetchWaitlist()
    } catch (error) {
      console.error("Error adding to waitlist:", error)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("appointment_waitlist")
        .update({ status, scheduled_date: status === "scheduled" ? new Date().toISOString() : null })
        .eq("id", id)

      if (error) throw error
      fetchWaitlist()
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default"
      case "contacted":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader />
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Waiting List</h1>
              <p className="text-gray-500 mt-1">Manage patient appointment requests</p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add to Waitlist
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Waiting</CardDescription>
                <CardTitle className="text-2xl">{waitlist.filter((w) => w.status === "waiting").length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Contacted</CardDescription>
                <CardTitle className="text-2xl">{waitlist.filter((w) => w.status === "contacted").length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Scheduled</CardDescription>
                <CardTitle className="text-2xl">{waitlist.filter((w) => w.status === "scheduled").length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Urgent Priority</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  {waitlist.filter((w) => w.priority === "urgent" && w.status === "waiting").length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
              All
            </Button>
            <Button variant={filter === "waiting" ? "default" : "outline"} onClick={() => setFilter("waiting")}>
              Waiting
            </Button>
            <Button variant={filter === "contacted" ? "default" : "outline"} onClick={() => setFilter("contacted")}>
              Contacted
            </Button>
            <Button variant={filter === "scheduled" ? "default" : "outline"} onClick={() => setFilter("scheduled")}>
              Scheduled
            </Button>
          </div>

          {/* Waitlist Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Preferred Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {waitlist.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{entry.patient_name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {entry.patient_phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{entry.appointment_type}</td>
                        <td className="px-6 py-4">
                          <Badge variant={getPriorityColor(entry.priority)}>{entry.priority}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {entry.preferred_date || "Flexible"}
                          </div>
                          <div className="text-xs text-gray-500">{entry.preferred_time}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(entry.added_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusColor(entry.status)}>{entry.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {entry.status === "waiting" && (
                              <Button size="sm" variant="outline" onClick={() => updateStatus(entry.id, "contacted")}>
                                Contact
                              </Button>
                            )}
                            {entry.status === "contacted" && (
                              <Button size="sm" onClick={() => updateStatus(entry.id, "scheduled")}>
                                Schedule
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add to Waitlist Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Patient to Waiting List</DialogTitle>
            <DialogDescription>Enter patient information and appointment preferences</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Patient Name</Label>
              <Input
                value={newEntry.patient_name}
                onChange={(e) => setNewEntry({ ...newEntry, patient_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={newEntry.patient_phone}
                onChange={(e) => setNewEntry({ ...newEntry, patient_phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label>Appointment Type</Label>
              <Select
                value={newEntry.appointment_type}
                onValueChange={(value) => setNewEntry({ ...newEntry, appointment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Patient Intake">New Patient Intake</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Counseling">Counseling</SelectItem>
                  <SelectItem value="Medication Management">Medication Management</SelectItem>
                  <SelectItem value="Assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={newEntry.priority}
                onValueChange={(value) => setNewEntry({ ...newEntry, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Date</Label>
              <Input
                type="date"
                value={newEntry.preferred_date}
                onChange={(e) => setNewEntry({ ...newEntry, preferred_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Preferred Time</Label>
              <Select
                value={newEntry.preferred_time}
                onValueChange={(value) => setNewEntry({ ...newEntry, preferred_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                  <SelectItem value="evening">Evening (5pm-8pm)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Provider Preference (Optional)</Label>
              <Input
                value={newEntry.provider_preference}
                onChange={(e) => setNewEntry({ ...newEntry, provider_preference: e.target.value })}
                placeholder="Dr. Smith"
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                placeholder="Additional information or special requests..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addToWaitlist}>Add to Waitlist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
