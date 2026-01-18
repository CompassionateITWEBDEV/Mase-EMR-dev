"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pill, Plus, Search, AlertTriangle, User, Edit, Calendar, XCircle, Trash2, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth/rbac-hooks"
import { RoleGuard } from "@/components/auth/role-guard"
import { PERMISSIONS } from "@/lib/auth/roles"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface PatientMedication {
  id: string
  patient_id: string
  patient_name: string
  medication_name: string
  generic_name?: string
  dosage: string
  frequency: string
  route: string
  start_date: string
  end_date?: string
  prescribed_by: string
  prescriber_name: string
  medication_type: "regular" | "prn" | "controlled"
  ndc_number?: string
  pharmacy_name?: string
  pharmacy_phone?: string
  refills_remaining: number
  status: "active" | "discontinued" | "completed"
  notes?: string
  created_at: string
  updated_at: string
}

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface MedicationInteraction {
  medication1: string
  medication2: string
  severity: "minor" | "moderate" | "major"
  description: string
}

export default function MedicationsPage() {
  const [activeTab, setActiveTab] = useState("active")
  const [medications, setMedications] = useState<PatientMedication[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<PatientMedication | null>(null)
  const [discontinueReason, setDiscontinueReason] = useState("")
  const [interactions, setInteractions] = useState<MedicationInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const { user, hasPermission } = useAuth()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [newMedication, setNewMedication] = useState({
    patient_id: "",
    medication_name: "",
    generic_name: "",
    dosage: "",
    frequency: "",
    route: "oral",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    medication_type: "regular" as const,
    ndc_number: "",
    pharmacy_name: "",
    pharmacy_phone: "",
    refills_remaining: 0,
    notes: "",
  })

  const loadPatients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .order("last_name", { ascending: true })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error("Error loading patients:", error)
    }
  }, [supabase])

  const loadMedications = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("patient_medications")
        .select(`
          *,
          patient:patients(id, first_name, last_name)
        `)
        .order("created_at", { ascending: false })

      if (selectedPatient !== "all") {
        query = query.eq("patient_id", selectedPatient)
      }

      const { data, error } = await query

      if (error) {
        // Check if it's a "table doesn't exist" error
        if (error.message?.includes("does not exist") || error.code === "42P01") {
          console.error("Table patient_medications does not exist. Please run the database migration.")
          toast({
            title: "Database Setup Required",
            description: "The medications table hasn't been created yet. Please run the database migration script.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      // Transform data to match frontend interface
      const transformedMedications = (data || []).map((med: any) => ({
        ...med,
        patient_name: med.patient ? `${med.patient.first_name} ${med.patient.last_name}` : "Unknown",
        prescriber_name: med.prescribed_by || "Unknown",
      }))

      setMedications(transformedMedications)
    } catch (error: any) {
      console.error("Error loading medications:", error?.message || error)
      toast({
        title: "Error",
        description: error?.message || "Failed to load medications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, selectedPatient, toast])

  const checkInteractions = useCallback(async () => {
    if (selectedPatient === "all") {
      setInteractions([])
      return
    }
    try {
      const response = await fetch(`/api/medications/interactions?patient_id=${selectedPatient}`)
      if (response.ok) {
        const data = await response.json()
        setInteractions(data.interactions || [])
      }
    } catch (error) {
      console.error("Error checking interactions:", error)
    }
  }, [selectedPatient])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  useEffect(() => {
    loadMedications()
    checkInteractions()
  }, [loadMedications, checkInteractions])

  const handleAddMedication = async () => {
    if (!hasPermission(PERMISSIONS.MEDICATIONS_WRITE)) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to add medications",
        variant: "destructive",
      })
      return
    }

    if (!newMedication.patient_id || !newMedication.medication_name || !newMedication.dosage) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("patient_medications").insert([
        {
          patient_id: newMedication.patient_id,
          medication_name: newMedication.medication_name,
          generic_name: newMedication.generic_name || null,
          dosage: newMedication.dosage,
          frequency: newMedication.frequency,
          route: newMedication.route,
          start_date: newMedication.start_date,
          end_date: newMedication.end_date || null,
          medication_type: newMedication.medication_type,
          ndc_number: newMedication.ndc_number || null,
          pharmacy_name: newMedication.pharmacy_name || null,
          pharmacy_phone: newMedication.pharmacy_phone || null,
          refills_remaining: newMedication.refills_remaining,
          notes: newMedication.notes || null,
          status: "active",
          prescribed_by: user?.id,
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Medication added successfully",
      })

      loadMedications()
      setShowAddDialog(false)
      resetNewMedication()
    } catch (error) {
      console.error("Failed to add medication:", error)
      toast({
        title: "Error",
        description: "Failed to add medication",
        variant: "destructive",
      })
    }
  }

  const handleEditMedication = async () => {
    if (!selectedMedication) return

    if (!hasPermission(PERMISSIONS.MEDICATIONS_WRITE)) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to edit medications",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("patient_medications")
        .update({
          medication_name: selectedMedication.medication_name,
          generic_name: selectedMedication.generic_name || null,
          dosage: selectedMedication.dosage,
          frequency: selectedMedication.frequency,
          route: selectedMedication.route,
          start_date: selectedMedication.start_date,
          end_date: selectedMedication.end_date || null,
          medication_type: selectedMedication.medication_type,
          ndc_number: selectedMedication.ndc_number || null,
          pharmacy_name: selectedMedication.pharmacy_name || null,
          pharmacy_phone: selectedMedication.pharmacy_phone || null,
          refills_remaining: selectedMedication.refills_remaining,
          notes: selectedMedication.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedMedication.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Medication updated successfully",
      })

      loadMedications()
      setShowEditDialog(false)
      setSelectedMedication(null)
    } catch (error) {
      console.error("Failed to update medication:", error)
      toast({
        title: "Error",
        description: "Failed to update medication",
        variant: "destructive",
      })
    }
  }

  const handleDiscontinueMedication = async () => {
    if (!selectedMedication || !discontinueReason) return

    if (!hasPermission(PERMISSIONS.MEDICATIONS_WRITE)) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to discontinue medications",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("patient_medications")
        .update({
          status: "discontinued",
          end_date: new Date().toISOString().split("T")[0],
          notes: selectedMedication.notes
            ? `${selectedMedication.notes}\n\nDiscontinued: ${discontinueReason}`
            : `Discontinued: ${discontinueReason}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedMedication.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Medication discontinued successfully",
      })

      loadMedications()
      setShowDiscontinueDialog(false)
      setSelectedMedication(null)
      setDiscontinueReason("")
    } catch (error) {
      console.error("Failed to discontinue medication:", error)
      toast({
        title: "Error",
        description: "Failed to discontinue medication",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMedication = async () => {
    if (!selectedMedication) return

    if (!hasPermission(PERMISSIONS.MEDICATIONS_WRITE)) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to delete medications",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("patient_medications").delete().eq("id", selectedMedication.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Medication deleted successfully",
      })

      loadMedications()
      setShowDeleteDialog(false)
      setSelectedMedication(null)
    } catch (error) {
      console.error("Failed to delete medication:", error)
      toast({
        title: "Error",
        description: "Failed to delete medication",
        variant: "destructive",
      })
    }
  }

  const resetNewMedication = () => {
    setNewMedication({
      patient_id: "",
      medication_name: "",
      generic_name: "",
      dosage: "",
      frequency: "",
      route: "oral",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      medication_type: "regular",
      ndc_number: "",
      pharmacy_name: "",
      pharmacy_phone: "",
      refills_remaining: 0,
      notes: "",
    })
  }

  const filteredMedications = medications.filter((med) => {
    const matchesSearch =
      med.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTab =
      activeTab === "active"
        ? med.status === "active"
        : activeTab === "discontinued"
          ? med.status === "discontinued"
          : activeTab === "prn"
            ? med.medication_type === "prn"
            : true

    const matchesPatient = selectedPatient === "all" || med.patient_id === selectedPatient

    return matchesSearch && matchesTab && matchesPatient
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Medication Management</h1>
              <p className="text-muted-foreground">Manage patient medications and prescriptions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadMedications}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <RoleGuard requiredPermissions={[PERMISSIONS.MEDICATIONS_WRITE]}>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Medication
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Medication</DialogTitle>
                      <DialogDescription>{"Add a new medication to a patient's medication list"}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="patient">Patient *</Label>
                          <Select
                            value={newMedication.patient_id}
                            onValueChange={(value) => setNewMedication((prev) => ({ ...prev, patient_id: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {patients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.first_name} {patient.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="medication-type">Medication Type</Label>
                          <Select
                            value={newMedication.medication_type}
                            onValueChange={(value: any) =>
                              setNewMedication((prev) => ({ ...prev, medication_type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="prn">PRN (As Needed)</SelectItem>
                              <SelectItem value="controlled">Controlled Substance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="medication-name">Medication Name *</Label>
                          <Input
                            id="medication-name"
                            value={newMedication.medication_name}
                            onChange={(e) => setNewMedication((prev) => ({ ...prev, medication_name: e.target.value }))}
                            placeholder="Brand name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="generic-name">Generic Name</Label>
                          <Input
                            id="generic-name"
                            value={newMedication.generic_name}
                            onChange={(e) => setNewMedication((prev) => ({ ...prev, generic_name: e.target.value }))}
                            placeholder="Generic name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="dosage">Dosage *</Label>
                          <Input
                            id="dosage"
                            value={newMedication.dosage}
                            onChange={(e) => setNewMedication((prev) => ({ ...prev, dosage: e.target.value }))}
                            placeholder="e.g., 10mg"
                          />
                        </div>
                        <div>
                          <Label htmlFor="frequency">Frequency</Label>
                          <Select
                            value={newMedication.frequency}
                            onValueChange={(value) => setNewMedication((prev) => ({ ...prev, frequency: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Once daily">Once daily</SelectItem>
                              <SelectItem value="Twice daily">Twice daily</SelectItem>
                              <SelectItem value="Three times daily">Three times daily</SelectItem>
                              <SelectItem value="Four times daily">Four times daily</SelectItem>
                              <SelectItem value="As needed">As needed</SelectItem>
                              <SelectItem value="Every other day">Every other day</SelectItem>
                              <SelectItem value="Weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="route">Route</Label>
                          <Select
                            value={newMedication.route}
                            onValueChange={(value) => setNewMedication((prev) => ({ ...prev, route: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="oral">Oral</SelectItem>
                              <SelectItem value="injection">Injection</SelectItem>
                              <SelectItem value="topical">Topical</SelectItem>
                              <SelectItem value="inhalation">Inhalation</SelectItem>
                              <SelectItem value="sublingual">Sublingual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-date">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={newMedication.start_date}
                            onChange={(e) => setNewMedication((prev) => ({ ...prev, start_date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date">End Date (Optional)</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={newMedication.end_date}
                            onChange={(e) => setNewMedication((prev) => ({ ...prev, end_date: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pharmacy">Pharmacy Name</Label>
                          <Input
                            id="pharmacy"
                            value={newMedication.pharmacy_name}
                            onChange={(e) => setNewMedication((prev) => ({ ...prev, pharmacy_name: e.target.value }))}
                            placeholder="Pharmacy name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="refills">Refills Remaining</Label>
                          <Input
                            id="refills"
                            type="number"
                            min="0"
                            value={newMedication.refills_remaining}
                            onChange={(e) =>
                              setNewMedication((prev) => ({
                                ...prev,
                                refills_remaining: Number.parseInt(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newMedication.notes}
                          onChange={(e) => setNewMedication((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes or instructions..."
                        />
                      </div>

                      <Button onClick={handleAddMedication} className="w-full">
                        Add Medication
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </RoleGuard>
            </div>
          </div>

          {/* Drug Interactions Alert */}
          {interactions.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Drug Interaction Alerts</div>
                {interactions.map((interaction, index) => (
                  <div key={index} className="text-sm">
                    <Badge
                      variant={
                        interaction.severity === "major"
                          ? "destructive"
                          : interaction.severity === "moderate"
                            ? "secondary"
                            : "outline"
                      }
                      className="mr-2"
                    >
                      {interaction.severity}
                    </Badge>
                    {interaction.medication1} + {interaction.medication2}: {interaction.description}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters - Patient dropdown from database */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search medications, patients, or generic names..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active Medications</TabsTrigger>
              <TabsTrigger value="prn">PRN Medications</TabsTrigger>
              <TabsTrigger value="discontinued">Discontinued</TabsTrigger>
              <TabsTrigger value="all">All Medications</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin opacity-50" />
                    <p className="text-muted-foreground">Loading medications...</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredMedications.map((medication) => (
                    <Card key={medication.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Pill className="w-5 h-5" />
                              {medication.medication_name}
                              {medication.generic_name && medication.generic_name !== medication.medication_name && (
                                <span className="text-sm text-muted-foreground">({medication.generic_name})</span>
                              )}
                            </CardTitle>
                            <CardDescription>
                              <User className="w-4 h-4 inline mr-1" />
                              {medication.patient_name}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                medication.medication_type === "controlled"
                                  ? "destructive"
                                  : medication.medication_type === "prn"
                                    ? "secondary"
                                    : "default"
                              }
                            >
                              {medication.medication_type.toUpperCase()}
                            </Badge>
                            <Badge variant={medication.status === "active" ? "default" : "secondary"}>
                              {medication.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm font-medium">Dosage & Frequency</div>
                            <div className="text-sm text-muted-foreground">
                              {medication.dosage} • {medication.frequency} • {medication.route}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Duration</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {medication.start_date} {medication.end_date && `- ${medication.end_date}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Pharmacy & Refills</div>
                            <div className="text-sm text-muted-foreground">
                              {medication.pharmacy_name || "No pharmacy"} • {medication.refills_remaining} refills left
                            </div>
                          </div>
                        </div>

                        {medication.notes && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <div className="text-sm font-medium mb-1">Notes</div>
                            <div className="text-sm text-muted-foreground">{medication.notes}</div>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-4">
                          <div className="text-xs text-muted-foreground">
                            Added: {new Date(medication.created_at).toLocaleDateString()}
                            {medication.ndc_number && ` • NDC: ${medication.ndc_number}`}
                          </div>
                          <div className="flex gap-2">
                            <RoleGuard requiredPermissions={[PERMISSIONS.MEDICATIONS_WRITE]}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMedication(medication)
                                  setShowEditDialog(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              {medication.status === "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMedication(medication)
                                    setShowDiscontinueDialog(true)
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Discontinue
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 bg-transparent"
                                onClick={() => {
                                  setSelectedMedication(medication)
                                  setShowDeleteDialog(true)
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </RoleGuard>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredMedications.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No medications found matching your criteria</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
            <DialogDescription>Update medication details</DialogDescription>
          </DialogHeader>
          {selectedMedication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Medication Name</Label>
                  <Input
                    value={selectedMedication.medication_name}
                    onChange={(e) =>
                      setSelectedMedication((prev) => (prev ? { ...prev, medication_name: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>Generic Name</Label>
                  <Input
                    value={selectedMedication.generic_name || ""}
                    onChange={(e) =>
                      setSelectedMedication((prev) => (prev ? { ...prev, generic_name: e.target.value } : null))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Dosage</Label>
                  <Input
                    value={selectedMedication.dosage}
                    onChange={(e) =>
                      setSelectedMedication((prev) => (prev ? { ...prev, dosage: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={selectedMedication.frequency}
                    onValueChange={(value) =>
                      setSelectedMedication((prev) => (prev ? { ...prev, frequency: value } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                      <SelectItem value="Every other day">Every other day</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Route</Label>
                  <Select
                    value={selectedMedication.route}
                    onValueChange={(value) =>
                      setSelectedMedication((prev) => (prev ? { ...prev, route: value } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oral">Oral</SelectItem>
                      <SelectItem value="injection">Injection</SelectItem>
                      <SelectItem value="topical">Topical</SelectItem>
                      <SelectItem value="inhalation">Inhalation</SelectItem>
                      <SelectItem value="sublingual">Sublingual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={selectedMedication.start_date}
                    onChange={(e) =>
                      setSelectedMedication((prev) => (prev ? { ...prev, start_date: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={selectedMedication.end_date || ""}
                    onChange={(e) =>
                      setSelectedMedication((prev) => (prev ? { ...prev, end_date: e.target.value } : null))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pharmacy Name</Label>
                  <Input
                    value={selectedMedication.pharmacy_name || ""}
                    onChange={(e) =>
                      setSelectedMedication((prev) => (prev ? { ...prev, pharmacy_name: e.target.value } : null))
                    }
                  />
                </div>
                <div>
                  <Label>Refills Remaining</Label>
                  <Input
                    type="number"
                    min="0"
                    value={selectedMedication.refills_remaining}
                    onChange={(e) =>
                      setSelectedMedication((prev) =>
                        prev ? { ...prev, refills_remaining: Number.parseInt(e.target.value) || 0 } : null,
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={selectedMedication.notes || ""}
                  onChange={(e) => setSelectedMedication((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditMedication}>Save Changes</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscontinueDialog} onOpenChange={setShowDiscontinueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discontinue Medication</DialogTitle>
            <DialogDescription>
              Discontinue {selectedMedication?.medication_name} for {selectedMedication?.patient_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for Discontinuation *</Label>
              <Textarea
                value={discontinueReason}
                onChange={(e) => setDiscontinueReason(e.target.value)}
                placeholder="Enter reason for discontinuing this medication..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscontinueDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDiscontinueMedication} disabled={!discontinueReason}>
              Discontinue Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medication</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {selectedMedication?.medication_name} for{" "}
              {selectedMedication?.patient_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMedication}>
              Delete Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
