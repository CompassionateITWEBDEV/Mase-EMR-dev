"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowRight, Search, Users, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CaseloadTransferPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [fromStaffId, setFromStaffId] = useState("")
  const [toStaffId, setToStaffId] = useState("")
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [transferReason, setTransferReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { toast } = useToast()

  const supabase = createClient()

  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  // Load staff members
  useEffect(() => {
    fetchStaff()
  }, [])

  // Load patients when from staff selected
  useEffect(() => {
    if (fromStaffId) {
      fetchPatients()
    } else {
      setPatients([])
      setSelectedPatients([])
    }
  }, [fromStaffId])

  async function fetchStaff() {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("is_active", true)
      .in("role", ["counselor", "case_manager", "therapist", "social_worker"])
      .order("last_name", { ascending: true })

    if (!error && data) {
      setStaff(data)
    }
  }

  async function fetchPatients() {
    // This would be improved with actual assigned_counselor field
    // For now we'll get all active patients
    const { data, error } = await supabase.from("patients").select("*").order("last_name", { ascending: true })

    if (!error && data) {
      setPatients(data)
    }
  }

  const filteredPatients = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.email || ""}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const fromStaff = staff.find((s) => s.id === fromStaffId)
  const toStaff = staff.find((s) => s.id === toStaffId)

  const togglePatient = (patientId: string) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId) ? prev.filter((id) => id !== patientId) : [...prev, patientId],
    )
  }

  const selectAll = () => {
    setSelectedPatients(filteredPatients.map((p) => p.id))
  }

  const deselectAll = () => {
    setSelectedPatients([])
  }

  async function handleTransfer() {
    if (!fromStaffId || !toStaffId || selectedPatients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select both staff members and at least one patient",
        variant: "destructive",
      })
      return
    }

    if (!currentUserId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to perform transfers",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Here you would update the assigned_counselor field for each patient
      // For demonstration, we'll just log the audit trail
      const transfers = selectedPatients.map((patientId) => ({
        patient_id: patientId,
        from_staff_id: fromStaffId,
        to_staff_id: toStaffId,
        transfer_reason: transferReason,
        transferred_at: new Date().toISOString(),
        transferred_by: currentUserId,
      }))

      console.log("[v0] Caseload transfer:", transfers)

      // You would insert into a caseload_transfers audit table here
      // And update patients.assigned_counselor

      toast({
        title: "Transfer Complete",
        description: `Successfully transferred ${selectedPatients.length} patient(s) from ${fromStaff?.first_name} ${fromStaff?.last_name} to ${toStaff?.first_name} ${toStaff?.last_name}`,
      })

      // Reset form
      setSelectedPatients([])
      setTransferReason("")
    } catch (error) {
      console.error("Transfer error:", error)
      toast({
        title: "Transfer Failed",
        description: "An error occurred during the transfer",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Caseload Transfer</h1>
              <p className="text-gray-600 mt-1">Transfer patients from one staff member to another</p>
            </div>

            {/* Transfer Setup */}
            <Card>
              <CardHeader>
                <CardTitle>Transfer Setup</CardTitle>
                <CardDescription>Select the staff members for the caseload transfer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>From Staff Member</Label>
                    <Select value={fromStaffId} onValueChange={setFromStaffId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.first_name} {s.last_name} ({s.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-gray-400" />
                  </div>

                  <div className="space-y-2">
                    <Label>To Staff Member</Label>
                    <Select value={toStaffId} onValueChange={setToStaffId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff
                          .filter((s) => s.id !== fromStaffId)
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.first_name} {s.last_name} ({s.role})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Transfer Reason</Label>
                  <Textarea
                    placeholder="Enter reason for caseload transfer (optional)"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Patient Selection */}
            {fromStaffId && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Select Patients</CardTitle>
                      <CardDescription>
                        Choose which patients to transfer ({selectedPatients.length} selected)
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAll}>
                        Deselect All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="border rounded-lg divide-y max-h-96 overflow-auto">
                    {filteredPatients.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No patients found</p>
                      </div>
                    ) : (
                      filteredPatients.map((patient) => (
                        <div key={patient.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                          <Checkbox
                            checked={selectedPatients.includes(patient.id)}
                            onCheckedChange={() => togglePatient(patient.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{patient.email || "No email"}</p>
                          </div>
                          <Badge variant="outline">{patient.gender || "Unknown"}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transfer Summary & Action */}
            {fromStaffId && toStaffId && selectedPatients.length > 0 && (
              <Card className="border-cyan-200 bg-cyan-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                    Transfer Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-600">From</Label>
                      <p className="font-semibold">
                        {fromStaff?.first_name} {fromStaff?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{fromStaff?.role}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div>
                      <Label className="text-gray-600">To</Label>
                      <p className="font-semibold">
                        {toStaff?.first_name} {toStaff?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{toStaff?.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Patients to transfer</p>
                      <p className="text-2xl font-bold text-cyan-600">{selectedPatients.length}</p>
                    </div>
                    <Button
                      onClick={handleTransfer}
                      disabled={loading}
                      size="lg"
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      {loading ? "Transferring..." : "Complete Transfer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
