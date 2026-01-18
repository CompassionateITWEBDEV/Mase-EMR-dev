"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertCircle,
  Plus,
  Search,
  Send,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth?: string
  phone?: string
}

interface Pharmacy {
  id: string
  name: string
  address?: string
  phone?: string
  fax?: string
  accepts_e_prescribing?: boolean
}

interface Medication {
  id: string
  name: string
  strength?: string
  form?: string
}

interface Prescription {
  id: string
  patientName: string
  patient_id: string
  medicationName: string
  medication_id: string
  strength: string
  quantity: number
  daysSupply: number
  refills: number
  status: "pending" | "sent" | "filled" | "cancelled"
  prescribedDate: string
  pharmacyName?: string
  directions?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function EPrescribingDashboard() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewPrescriptionOpen, setIsNewPrescriptionOpen] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const { data, error, isLoading, mutate } = useSWR("/api/prescriptions", fetcher)
  const prescriptions: Prescription[] = data?.prescriptions || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "sent":
        return <Send className="h-4 w-4 text-blue-500" />
      case "filled":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "filled":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSendPrescription = async (id: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/prescriptions/${id}/send`, {
        method: "POST",
      })
      if (response.ok) {
        toast({ title: "Prescription sent", description: "Successfully transmitted to pharmacy" })
        mutate()
      } else {
        toast({ title: "Error", description: "Failed to send prescription", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error sending prescription:", error)
      toast({ title: "Error", description: "Failed to send prescription", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeletePrescription = async () => {
    if (!selectedPrescription) return
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/prescriptions?id=${selectedPrescription.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast({ title: "Prescription deleted", description: "Successfully removed" })
        setIsDeleteDialogOpen(false)
        setSelectedPrescription(null)
        mutate()
      } else {
        toast({ title: "Error", description: "Failed to delete prescription", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error deleting prescription:", error)
      toast({ title: "Error", description: "Failed to delete prescription", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.medicationName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const pendingCount = prescriptions.filter((p) => p.status === "pending").length
  const sentCount = prescriptions.filter((p) => p.status === "sent").length
  const filledCount = prescriptions.filter((p) => p.status === "filled").length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting transmission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentCount}</div>
            <p className="text-xs text-muted-foreground">Transmitted to pharmacy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filled Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filledCount}</div>
            <p className="text-xs text-muted-foreground">Picked up by patients</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prescriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="formulary">Drug Formulary</TabsTrigger>
          <TabsTrigger value="interactions">Drug Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prescription Management</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => mutate()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Dialog open={isNewPrescriptionOpen} onOpenChange={setIsNewPrescriptionOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Prescription
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Prescription</DialogTitle>
                      </DialogHeader>
                      <NewPrescriptionForm
                        onClose={() => setIsNewPrescriptionOpen(false)}
                        onSuccess={() => {
                          setIsNewPrescriptionOpen(false)
                          mutate()
                          toast({ title: "Prescription created", description: "Successfully added new prescription" })
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search prescriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredPrescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No prescriptions found</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchTerm ? "Try adjusting your search" : "Create a new prescription to get started"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Strength</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pharmacy</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrescriptions.map((prescription) => (
                      <TableRow key={prescription.id}>
                        <TableCell className="font-medium">{prescription.patientName}</TableCell>
                        <TableCell>{prescription.medicationName}</TableCell>
                        <TableCell>{prescription.strength}</TableCell>
                        <TableCell>{prescription.quantity}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(prescription.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(prescription.status)}
                              <span className="capitalize">{prescription.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{prescription.pharmacyName || "Not assigned"}</TableCell>
                        <TableCell>{new Date(prescription.prescribedDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPrescription(prescription)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {prescription.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPrescription(prescription)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSendPrescription(prescription.id)}
                                  disabled={isProcessing}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Send
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPrescription(prescription)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulary">
          <DrugFormularyTab />
        </TabsContent>

        <TabsContent value="interactions">
          <DrugInteractionsTab />
        </TabsContent>
      </Tabs>

      {/* View Prescription Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedPrescription.status)}>{selectedPrescription.status}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Medication</Label>
                  <p className="font-medium">{selectedPrescription.medicationName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Strength</Label>
                  <p className="font-medium">{selectedPrescription.strength || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{selectedPrescription.quantity}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Days Supply</Label>
                  <p className="font-medium">{selectedPrescription.daysSupply || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Refills</Label>
                  <p className="font-medium">{selectedPrescription.refills}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pharmacy</Label>
                  <p className="font-medium">{selectedPrescription.pharmacyName || "Not assigned"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Directions</Label>
                  <p className="font-medium">{selectedPrescription.directions || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prescribed Date</Label>
                  <p className="font-medium">{new Date(selectedPrescription.prescribedDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Prescription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prescription</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <EditPrescriptionForm
              prescription={selectedPrescription}
              onClose={() => setIsEditDialogOpen(false)}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedPrescription(null)
                mutate()
                toast({ title: "Prescription updated", description: "Successfully saved changes" })
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prescription</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this prescription for {selectedPrescription?.patientName}?</p>
          <p className="text-sm text-muted-foreground">
            {selectedPrescription?.medicationName} - {selectedPrescription?.strength}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePrescription} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewPrescriptionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    patientId: "",
    medicationName: "",
    strength: "",
    dosageForm: "",
    quantity: "",
    daysSupply: "30",
    directions: "",
    refills: "0",
    pharmacyId: "",
    pharmacyName: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadingPharmacies, setLoadingPharmacies] = useState(true)
  const [patientSearch, setPatientSearch] = useState("")

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch("/api/patients")
        if (response.ok) {
          const data = await response.json()
          setPatients(data.patients || [])
        }
      } catch (error) {
        console.error("Error fetching patients:", error)
      } finally {
        setLoadingPatients(false)
      }
    }

    const fetchPharmacies = async () => {
      try {
        const response = await fetch("/api/pharmacies?is_active=true")
        if (response.ok) {
          const data = await response.json()
          setPharmacies(data.pharmacies || [])
        }
      } catch (error) {
        console.error("Error fetching pharmacies:", error)
      } finally {
        setLoadingPharmacies(false)
      }
    }

    const fetchMedications = async () => {
      try {
        const response = await fetch("/api/medications")
        if (response.ok) {
          const data = await response.json()
          setMedications(data.medications || [])
        }
      } catch (error) {
        console.error("Error fetching medications:", error)
      }
    }

    fetchPatients()
    fetchPharmacies()
    fetchMedications()
  }, [])

  const filteredPatients = patients.filter(
    (p) => patientSearch === "" || `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.patientId || !formData.medicationName || !formData.quantity) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const selectedPatient = patients.find((p) => p.id === formData.patientId)
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: formData.patientId,
          patient_name: selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "",
          medication_name: formData.medicationName,
          strength: formData.strength,
          quantity: Number.parseInt(formData.quantity) || 0,
          days_supply: Number.parseInt(formData.daysSupply) || 30,
          directions: formData.directions,
          refills: Number.parseInt(formData.refills) || 0,
          pharmacy_id: formData.pharmacyId || null,
          pharmacy_name: formData.pharmacyName,
          status: "pending",
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to create prescription")
      }
    } catch (error) {
      console.error("Error creating prescription:", error)
      alert("Failed to create prescription")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patient">Patient *</Label>
          {loadingPatients ? (
            <Skeleton className="h-10 w-full" />
          ) : patients.length === 0 ? (
            <div className="text-sm text-muted-foreground p-2 border rounded">
              No patients found. Please add patients first.
            </div>
          ) : (
            <Select
              value={formData.patientId}
              onValueChange={(value) => setFormData({ ...formData, patientId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="mb-2"
                  />
                </div>
                {filteredPatients.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No matching patients</div>
                ) : (
                  filteredPatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                      {patient.date_of_birth && ` (DOB: ${new Date(patient.date_of_birth).toLocaleDateString()})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <Label htmlFor="medication">Medication *</Label>
          <Select
            value={formData.medicationName}
            onValueChange={(value) => {
              const med = medications.find((m) => m.name === value)
              setFormData({
                ...formData,
                medicationName: value,
                strength: med?.strength || "",
                dosageForm: med?.form || "",
              })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select medication" />
            </SelectTrigger>
            <SelectContent>
              {medications.length > 0 ? (
                medications.map((med) => (
                  <SelectItem key={med.id} value={med.name}>
                    {med.name} {med.strength && `- ${med.strength}`}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="Methadone">Methadone</SelectItem>
                  <SelectItem value="Buprenorphine">Buprenorphine</SelectItem>
                  <SelectItem value="Buprenorphine/Naloxone">Buprenorphine/Naloxone (Suboxone)</SelectItem>
                  <SelectItem value="Naltrexone">Naltrexone</SelectItem>
                  <SelectItem value="Naltrexone ER">Naltrexone ER (Vivitrol)</SelectItem>
                  <SelectItem value="Clonidine">Clonidine</SelectItem>
                  <SelectItem value="Gabapentin">Gabapentin</SelectItem>
                  <SelectItem value="Hydroxyzine">Hydroxyzine</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="strength">Strength</Label>
          <Input
            id="strength"
            value={formData.strength}
            onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
            placeholder="e.g., 50mg"
          />
        </div>

        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="30"
          />
        </div>

        <div>
          <Label htmlFor="daysSupply">Days Supply</Label>
          <Input
            id="daysSupply"
            type="number"
            value={formData.daysSupply}
            onChange={(e) => setFormData({ ...formData, daysSupply: e.target.value })}
            placeholder="30"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="directions">Directions for Use</Label>
        <Textarea
          id="directions"
          value={formData.directions}
          onChange={(e) => setFormData({ ...formData, directions: e.target.value })}
          placeholder="Take 1 tablet by mouth daily"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="refills">Refills</Label>
          <Select value={formData.refills} onValueChange={(value) => setFormData({ ...formData, refills: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="pharmacy">Pharmacy</Label>
          {loadingPharmacies ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={formData.pharmacyId}
              onValueChange={(value) => {
                const pharmacy = pharmacies.find((p) => p.id === value)
                setFormData({
                  ...formData,
                  pharmacyId: value,
                  pharmacyName: pharmacy?.name || "",
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pharmacy" />
              </SelectTrigger>
              <SelectContent>
                {pharmacies.length > 0 ? (
                  pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                      {pharmacy.address && ` - ${pharmacy.address}`}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="cvs">CVS Pharmacy</SelectItem>
                    <SelectItem value="walgreens">Walgreens</SelectItem>
                    <SelectItem value="riteaid">Rite Aid</SelectItem>
                    <SelectItem value="walmart">Walmart Pharmacy</SelectItem>
                    <SelectItem value="onsite">On-site Dispensary</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.patientId || !formData.medicationName}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Prescription"
          )}
        </Button>
      </div>
    </form>
  )
}

function EditPrescriptionForm({
  prescription,
  onClose,
  onSuccess,
}: {
  prescription: Prescription
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    medicationName: prescription.medicationName || "",
    strength: prescription.strength || "",
    quantity: prescription.quantity?.toString() || "",
    daysSupply: prescription.daysSupply?.toString() || "30",
    directions: prescription.directions || "",
    refills: prescription.refills?.toString() || "0",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/prescriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: prescription.id,
          medication_name: formData.medicationName,
          strength: formData.strength,
          quantity: Number.parseInt(formData.quantity) || 0,
          days_supply: Number.parseInt(formData.daysSupply) || 30,
          directions: formData.directions,
          refills: Number.parseInt(formData.refills) || 0,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to update prescription")
      }
    } catch (error) {
      console.error("Error updating prescription:", error)
      alert("Failed to update prescription")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Patient</Label>
          <Input value={prescription.patientName} disabled />
        </div>
        <div>
          <Label htmlFor="medication">Medication</Label>
          <Input
            id="medication"
            value={formData.medicationName}
            onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="strength">Strength</Label>
          <Input
            id="strength"
            value={formData.strength}
            onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="daysSupply">Days Supply</Label>
          <Input
            id="daysSupply"
            type="number"
            value={formData.daysSupply}
            onChange={(e) => setFormData({ ...formData, daysSupply: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="directions">Directions</Label>
        <Textarea
          id="directions"
          value={formData.directions}
          onChange={(e) => setFormData({ ...formData, directions: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="refills">Refills</Label>
        <Select value={formData.refills} onValueChange={(value) => setFormData({ ...formData, refills: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="5">5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}

function DrugFormularyTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const { data, isLoading } = useSWR("/api/medications", fetcher)
  const medications = data?.medications || []

  const commonMedications = [
    {
      name: "Methadone",
      category: "Opioid Agonist",
      schedule: "II",
      forms: ["Oral Solution", "Tablet", "Dispersible Tablet"],
    },
    {
      name: "Buprenorphine",
      category: "Partial Opioid Agonist",
      schedule: "III",
      forms: ["Sublingual Tablet", "Film", "Injection"],
    },
    {
      name: "Buprenorphine/Naloxone",
      category: "Partial Opioid Agonist",
      schedule: "III",
      forms: ["Sublingual Film", "Sublingual Tablet"],
    },
    {
      name: "Naltrexone",
      category: "Opioid Antagonist",
      schedule: "Non-controlled",
      forms: ["Tablet", "Extended-Release Injection"],
    },
    { name: "Clonidine", category: "Alpha-2 Agonist", schedule: "Non-controlled", forms: ["Tablet", "Patch"] },
    {
      name: "Gabapentin",
      category: "Anticonvulsant",
      schedule: "V (some states)",
      forms: ["Capsule", "Tablet", "Solution"],
    },
    {
      name: "Hydroxyzine",
      category: "Antihistamine",
      schedule: "Non-controlled",
      forms: ["Tablet", "Capsule", "Solution"],
    },
    { name: "Trazodone", category: "Antidepressant", schedule: "Non-controlled", forms: ["Tablet"] },
  ]

  const filteredMedications = commonMedications.filter(
    (med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drug Formulary</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medication</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Available Forms</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedications.map((med, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{med.name}</TableCell>
                <TableCell>{med.category}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      med.schedule.includes("II")
                        ? "destructive"
                        : med.schedule.includes("III")
                          ? "default"
                          : "secondary"
                    }
                  >
                    {med.schedule}
                  </Badge>
                </TableCell>
                <TableCell>{med.forms.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function DrugInteractionsTab() {
  const [drug1, setDrug1] = useState("")
  const [drug2, setDrug2] = useState("")
  const [checkResult, setCheckResult] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  const handleCheckInteraction = async () => {
    if (!drug1 || !drug2) return

    setIsChecking(true)

    // Simulate interaction check
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const interactions: Record<string, any> = {
      "methadone-benzodiazepines": {
        severity: "major",
        description:
          "Concurrent use of opioids with benzodiazepines may result in profound sedation, respiratory depression, coma, and death.",
        recommendation: "Avoid concurrent use. If necessary, limit dosages and duration.",
      },
      "buprenorphine-benzodiazepines": {
        severity: "major",
        description: "Concurrent use may result in profound sedation, respiratory depression, coma, and death.",
        recommendation: "Avoid concurrent use. Consider alternatives.",
      },
      "methadone-naltrexone": {
        severity: "contraindicated",
        description: "Naltrexone will block the effects of methadone and may precipitate withdrawal.",
        recommendation: "Do not use concurrently. Wait appropriate washout period.",
      },
    }

    const key = `${drug1.toLowerCase()}-${drug2.toLowerCase()}`
    const reverseKey = `${drug2.toLowerCase()}-${drug1.toLowerCase()}`

    setCheckResult(
      interactions[key] ||
        interactions[reverseKey] || {
          severity: "none",
          description: "No significant interaction found between these medications.",
          recommendation: "Standard monitoring recommended.",
        },
    )

    setIsChecking(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drug Interaction Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Drug 1</Label>
            <Select value={drug1} onValueChange={setDrug1}>
              <SelectTrigger>
                <SelectValue placeholder="Select first drug" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="methadone">Methadone</SelectItem>
                <SelectItem value="buprenorphine">Buprenorphine</SelectItem>
                <SelectItem value="naltrexone">Naltrexone</SelectItem>
                <SelectItem value="benzodiazepines">Benzodiazepines</SelectItem>
                <SelectItem value="gabapentin">Gabapentin</SelectItem>
                <SelectItem value="clonidine">Clonidine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Drug 2</Label>
            <Select value={drug2} onValueChange={setDrug2}>
              <SelectTrigger>
                <SelectValue placeholder="Select second drug" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="methadone">Methadone</SelectItem>
                <SelectItem value="buprenorphine">Buprenorphine</SelectItem>
                <SelectItem value="naltrexone">Naltrexone</SelectItem>
                <SelectItem value="benzodiazepines">Benzodiazepines</SelectItem>
                <SelectItem value="gabapentin">Gabapentin</SelectItem>
                <SelectItem value="clonidine">Clonidine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleCheckInteraction} disabled={!drug1 || !drug2 || isChecking}>
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Interaction"
          )}
        </Button>

        {checkResult && (
          <div
            className={`p-4 rounded-lg border ${
              checkResult.severity === "contraindicated"
                ? "bg-red-50 border-red-200"
                : checkResult.severity === "major"
                  ? "bg-orange-50 border-orange-200"
                  : checkResult.severity === "moderate"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {checkResult.severity === "contraindicated" || checkResult.severity === "major" ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : checkResult.severity === "moderate" ? (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <span className="font-semibold capitalize">{checkResult.severity} Interaction</span>
            </div>
            <p className="text-sm mb-2">{checkResult.description}</p>
            <p className="text-sm font-medium">Recommendation: {checkResult.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
