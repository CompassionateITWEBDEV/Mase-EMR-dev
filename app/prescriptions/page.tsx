"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
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
import {
  FileText,
  Plus,
  Search,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Printer,
  Loader2,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

interface Prescription {
  id: string
  patient_id: string
  patient_name: string
  prescribed_by: string
  prescriber_name: string
  medication_name: string
  generic_name?: string
  dosage: string
  quantity: number
  refills: number
  directions: string
  pharmacy_name?: string
  pharmacy_address?: string
  pharmacy_phone?: string
  pharmacy_npi?: string
  prescription_number?: string
  status: "pending" | "sent" | "filled" | "cancelled" | "expired"
  prescribed_date: string
  sent_date?: string
  filled_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface Provider {
  id: string
  first_name: string
  last_name: string
  specialization?: string
}

interface Pharmacy {
  id: string
  name: string
  address: string
  phone: string
  npi: string
  fax?: string
  email?: string
  is_preferred: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PrescriptionsPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState("all")
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showPharmacyDialog, setShowPharmacyDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const { data, error, isLoading, mutate } = useSWR<{
    prescriptions: Prescription[]
    patients: Patient[]
    providers: Provider[]
  }>("/api/prescriptions", fetcher, { refreshInterval: 30000 })

  const prescriptions = data?.prescriptions || []
  const patients = data?.patients || []
  const providers = data?.providers || []

  // Local pharmacy state
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([
    {
      id: "pharm-001",
      name: "CVS Pharmacy",
      address: "123 Main St, Rochester, NY 14604",
      phone: "(555) 123-4567",
      npi: "1234567890",
      fax: "(555) 123-4568",
      email: "pharmacy@cvs.com",
      is_preferred: true,
    },
    {
      id: "pharm-002",
      name: "Walgreens",
      address: "456 Oak Ave, Rochester, NY 14605",
      phone: "(555) 987-6543",
      npi: "0987654321",
      is_preferred: true,
    },
  ])

  const [newPrescription, setNewPrescription] = useState({
    patient_id: "",
    prescribed_by: "",
    medication_name: "",
    generic_name: "",
    dosage: "",
    quantity: 30,
    refills: 0,
    directions: "",
    pharmacy_id: "",
    notes: "",
  })

  const [editPrescription, setEditPrescription] = useState<Partial<Prescription>>({})

  const [newPharmacy, setNewPharmacy] = useState({
    name: "",
    address: "",
    phone: "",
    npi: "",
    fax: "",
    email: "",
    is_preferred: false,
  })

  const handleCreatePrescription = useCallback(async () => {
    if (!newPrescription.patient_id || !newPrescription.medication_name) {
      toast({
        title: "Validation Error",
        description: "Please select a patient and enter medication name",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const selectedPharmacy = pharmacies.find((p) => p.id === newPrescription.pharmacy_id)

      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPrescription,
          prescribed_by: newPrescription.prescribed_by || providers[0]?.id,
          pharmacy_name: selectedPharmacy?.name,
          pharmacy_address: selectedPharmacy?.address,
          pharmacy_phone: selectedPharmacy?.phone,
          pharmacy_npi: selectedPharmacy?.npi,
        }),
      })

      if (response.ok) {
        mutate()
        setShowNewDialog(false)
        setNewPrescription({
          patient_id: "",
          prescribed_by: "",
          medication_name: "",
          generic_name: "",
          dosage: "",
          quantity: 30,
          refills: 0,
          directions: "",
          pharmacy_id: "",
          notes: "",
        })
        toast({
          title: "Success",
          description: "Prescription created successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to create prescription",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create prescription:", error)
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [newPrescription, pharmacies, providers, mutate, toast])

  const handleUpdatePrescription = useCallback(async () => {
    if (!selectedPrescription) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/prescriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPrescription.id,
          ...editPrescription,
        }),
      })

      if (response.ok) {
        mutate()
        setShowEditDialog(false)
        setSelectedPrescription(null)
        setEditPrescription({})
        toast({
          title: "Success",
          description: "Prescription updated successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update prescription",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update prescription:", error)
      toast({
        title: "Error",
        description: "Failed to update prescription",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedPrescription, editPrescription, mutate, toast])

  const handleDeletePrescription = useCallback(async () => {
    if (!selectedPrescription) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/prescriptions?id=${selectedPrescription.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        mutate()
        setShowDeleteDialog(false)
        setSelectedPrescription(null)
        toast({
          title: "Success",
          description: "Prescription deleted successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete prescription",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete prescription:", error)
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedPrescription, mutate, toast])

  const handleSendPrescription = useCallback(
    async (prescriptionId: string) => {
      try {
        const response = await fetch(`/api/prescriptions/${prescriptionId}/send`, {
          method: "POST",
        })

        if (response.ok) {
          mutate()
          toast({
            title: "Success",
            description: "Prescription sent successfully",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to send prescription",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to send prescription:", error)
        toast({
          title: "Error",
          description: "Failed to send prescription",
          variant: "destructive",
        })
      }
    },
    [mutate, toast],
  )

  const handleCancelPrescription = useCallback(
    async (prescriptionId: string) => {
      try {
        const response = await fetch(`/api/prescriptions/${prescriptionId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Cancelled by provider" }),
        })

        if (response.ok) {
          mutate()
          toast({
            title: "Success",
            description: "Prescription cancelled",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to cancel prescription",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to cancel prescription:", error)
        toast({
          title: "Error",
          description: "Failed to cancel prescription",
          variant: "destructive",
        })
      }
    },
    [mutate, toast],
  )

  const handleMarkFilled = useCallback(
    async (prescriptionId: string) => {
      try {
        const response = await fetch("/api/prescriptions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: prescriptionId, status: "filled" }),
        })

        if (response.ok) {
          mutate()
          toast({
            title: "Success",
            description: "Prescription marked as filled",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to update prescription",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to mark prescription as filled:", error)
        toast({
          title: "Error",
          description: "Failed to update prescription",
          variant: "destructive",
        })
      }
    },
    [mutate, toast],
  )

  const handleAddPharmacy = useCallback(async () => {
    if (!newPharmacy.name || !newPharmacy.phone) {
      toast({
        title: "Validation Error",
        description: "Please enter pharmacy name and phone",
        variant: "destructive",
      })
      return
    }

    const pharmacy: Pharmacy = {
      id: `pharm-${Date.now()}`,
      ...newPharmacy,
    }
    setPharmacies((prev) => [...prev, pharmacy])
    setShowPharmacyDialog(false)
    setNewPharmacy({
      name: "",
      address: "",
      phone: "",
      npi: "",
      fax: "",
      email: "",
      is_preferred: false,
    })
    toast({
      title: "Success",
      description: "Pharmacy added successfully",
    })
  }, [newPharmacy, toast])

  const openViewDialog = (rx: Prescription) => {
    setSelectedPrescription(rx)
    setShowViewDialog(true)
  }

  const openEditDialog = (rx: Prescription) => {
    setSelectedPrescription(rx)
    setEditPrescription({
      medication_name: rx.medication_name,
      generic_name: rx.generic_name,
      dosage: rx.dosage,
      quantity: rx.quantity,
      refills: rx.refills,
      directions: rx.directions,
      notes: rx.notes,
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (rx: Prescription) => {
    setSelectedPrescription(rx)
    setShowDeleteDialog(true)
  }

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.prescriber_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rx.prescription_number && rx.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTab = activeTab === "all" || rx.status === activeTab
    const matchesPatient = selectedPatient === "all" || rx.patient_id === selectedPatient

    return matchesSearch && matchesTab && matchesPatient
  })

  const getStatusIcon = (status: Prescription["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "sent":
        return <Send className="w-4 h-4" />
      case "filled":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      case "expired":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusVariant = (status: Prescription["status"]) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "sent":
        return "default"
      case "filled":
        return "default"
      case "cancelled":
        return "destructive"
      case "expired":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <div className="container mx-auto p-6">
            <Card className="border-destructive">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Failed to load prescriptions</h2>
                <p className="text-muted-foreground mb-4">Please try again later</p>
                <Button onClick={() => mutate()}>Retry</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Prescription Management</h1>
              <p className="text-muted-foreground">Create, send, and track electronic prescriptions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => mutate()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Dialog open={showPharmacyDialog} onOpenChange={setShowPharmacyDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    Add Pharmacy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Pharmacy</DialogTitle>
                    <DialogDescription>Add a pharmacy to the preferred pharmacy list</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pharmacy-name">Pharmacy Name</Label>
                      <Input
                        id="pharmacy-name"
                        value={newPharmacy.name}
                        onChange={(e) => setNewPharmacy((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Pharmacy name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pharmacy-address">Address</Label>
                      <Input
                        id="pharmacy-address"
                        value={newPharmacy.address}
                        onChange={(e) => setNewPharmacy((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="Full address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pharmacy-phone">Phone</Label>
                        <Input
                          id="pharmacy-phone"
                          value={newPharmacy.phone}
                          onChange={(e) => setNewPharmacy((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pharmacy-npi">NPI Number</Label>
                        <Input
                          id="pharmacy-npi"
                          value={newPharmacy.npi}
                          onChange={(e) => setNewPharmacy((prev) => ({ ...prev, npi: e.target.value }))}
                          placeholder="1234567890"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddPharmacy} className="w-full">
                      Add Pharmacy
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Prescription
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Prescription</DialogTitle>
                    <DialogDescription>Create and send an electronic prescription</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patient">Patient *</Label>
                        <Select
                          value={newPrescription.patient_id}
                          onValueChange={(value) => setNewPrescription((prev) => ({ ...prev, patient_id: value }))}
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
                        <Label htmlFor="prescriber">Prescriber</Label>
                        <Select
                          value={newPrescription.prescribed_by}
                          onValueChange={(value) => setNewPrescription((prev) => ({ ...prev, prescribed_by: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select prescriber" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                Dr. {provider.first_name} {provider.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="medication-name">Medication Name *</Label>
                        <Input
                          id="medication-name"
                          value={newPrescription.medication_name}
                          onChange={(e) => setNewPrescription((prev) => ({ ...prev, medication_name: e.target.value }))}
                          placeholder="Brand name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="generic-name">Generic Name</Label>
                        <Input
                          id="generic-name"
                          value={newPrescription.generic_name}
                          onChange={(e) => setNewPrescription((prev) => ({ ...prev, generic_name: e.target.value }))}
                          placeholder="Generic name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dosage">Dosage & Form</Label>
                      <Input
                        id="dosage"
                        value={newPrescription.dosage}
                        onChange={(e) => setNewPrescription((prev) => ({ ...prev, dosage: e.target.value }))}
                        placeholder="e.g., 10mg tablets"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={newPrescription.quantity}
                          onChange={(e) =>
                            setNewPrescription((prev) => ({
                              ...prev,
                              quantity: Number.parseInt(e.target.value) || 30,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="refills">Refills</Label>
                        <Select
                          value={newPrescription.refills.toString()}
                          onValueChange={(value) =>
                            setNewPrescription((prev) => ({ ...prev, refills: Number.parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 refills</SelectItem>
                            <SelectItem value="1">1 refill</SelectItem>
                            <SelectItem value="2">2 refills</SelectItem>
                            <SelectItem value="3">3 refills</SelectItem>
                            <SelectItem value="4">4 refills</SelectItem>
                            <SelectItem value="5">5 refills</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="pharmacy">Pharmacy</Label>
                      <Select
                        value={newPrescription.pharmacy_id}
                        onValueChange={(value) => setNewPrescription((prev) => ({ ...prev, pharmacy_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pharmacy" />
                        </SelectTrigger>
                        <SelectContent>
                          {pharmacies.map((pharmacy) => (
                            <SelectItem key={pharmacy.id} value={pharmacy.id}>
                              {pharmacy.name} {pharmacy.is_preferred && "(Preferred)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="directions">Directions for Use</Label>
                      <Textarea
                        id="directions"
                        value={newPrescription.directions}
                        onChange={(e) => setNewPrescription((prev) => ({ ...prev, directions: e.target.value }))}
                        placeholder="Take one tablet by mouth once daily..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Clinical Notes</Label>
                      <Textarea
                        id="notes"
                        value={newPrescription.notes}
                        onChange={(e) => setNewPrescription((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional clinical notes..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePrescription} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Prescription
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search prescriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({prescriptions.filter((rx) => rx.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="sent">Sent ({prescriptions.filter((rx) => rx.status === "sent").length})</TabsTrigger>
              <TabsTrigger value="filled">
                Filled ({prescriptions.filter((rx) => rx.status === "filled").length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({prescriptions.filter((rx) => rx.status === "cancelled").length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({prescriptions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredPrescriptions.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No prescriptions found</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "all"
                        ? "Create your first prescription to get started"
                        : `No ${activeTab} prescriptions`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredPrescriptions.map((rx) => (
                  <Card key={rx.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {rx.medication_name}
                            {rx.generic_name && (
                              <span className="text-sm font-normal text-muted-foreground">({rx.generic_name})</span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {rx.patient_name} • Prescribed by {rx.prescriber_name}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(rx.status)} className="flex items-center gap-1">
                          {getStatusIcon(rx.status)}
                          {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Dosage</p>
                          <p className="font-medium">{rx.dosage || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="font-medium">{rx.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Refills</p>
                          <p className="font-medium">{rx.refills}</p>
                        </div>
                      </div>

                      {rx.directions && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground">Directions</p>
                          <p className="text-sm">{rx.directions}</p>
                        </div>
                      )}

                      {rx.pharmacy_name && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">{rx.pharmacy_name}</p>
                          {rx.pharmacy_address && (
                            <p className="text-sm text-muted-foreground">{rx.pharmacy_address}</p>
                          )}
                          {rx.pharmacy_phone && <p className="text-sm text-muted-foreground">{rx.pharmacy_phone}</p>}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Prescribed: {rx.prescribed_date ? new Date(rx.prescribed_date).toLocaleDateString() : "N/A"}
                          {rx.sent_date && ` • Sent: ${new Date(rx.sent_date).toLocaleDateString()}`}
                          {rx.filled_date && ` • Filled: ${new Date(rx.filled_date).toLocaleDateString()}`}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openViewDialog(rx)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {rx.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(rx)}>
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" onClick={() => handleSendPrescription(rx.id)}>
                                <Send className="w-4 h-4 mr-1" />
                                Send
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleCancelPrescription(rx.id)}>
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {rx.status === "sent" && (
                            <Button size="sm" onClick={() => handleMarkFilled(rx.id)}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Filled
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Printer className="w-4 h-4 mr-1" />
                            Print
                          </Button>
                          {rx.status === "pending" && (
                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(rx)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* View Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Prescription Details</DialogTitle>
              </DialogHeader>
              {selectedPrescription && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Patient</Label>
                      <p className="font-medium">{selectedPrescription.patient_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Prescriber</Label>
                      <p className="font-medium">{selectedPrescription.prescriber_name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Medication</Label>
                      <p className="font-medium">{selectedPrescription.medication_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Generic Name</Label>
                      <p className="font-medium">{selectedPrescription.generic_name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Dosage</Label>
                      <p className="font-medium">{selectedPrescription.dosage || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Quantity</Label>
                      <p className="font-medium">{selectedPrescription.quantity}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Refills</Label>
                      <p className="font-medium">{selectedPrescription.refills}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Directions</Label>
                    <p className="font-medium">{selectedPrescription.directions || "N/A"}</p>
                  </div>
                  {selectedPrescription.pharmacy_name && (
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-muted-foreground">Pharmacy</Label>
                      <p className="font-medium">{selectedPrescription.pharmacy_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPrescription.pharmacy_address}</p>
                      <p className="text-sm text-muted-foreground">{selectedPrescription.pharmacy_phone}</p>
                    </div>
                  )}
                  {selectedPrescription.notes && (
                    <div>
                      <Label className="text-muted-foreground">Notes</Label>
                      <p className="font-medium">{selectedPrescription.notes}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge variant={getStatusVariant(selectedPrescription.status)}>
                        {selectedPrescription.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Prescribed Date</Label>
                      <p className="font-medium">
                        {selectedPrescription.prescribed_date
                          ? new Date(selectedPrescription.prescribed_date).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Prescription</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Medication Name</Label>
                  <Input
                    value={editPrescription.medication_name || ""}
                    onChange={(e) => setEditPrescription((prev) => ({ ...prev, medication_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Generic Name</Label>
                  <Input
                    value={editPrescription.generic_name || ""}
                    onChange={(e) => setEditPrescription((prev) => ({ ...prev, generic_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Dosage</Label>
                  <Input
                    value={editPrescription.dosage || ""}
                    onChange={(e) => setEditPrescription((prev) => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={editPrescription.quantity || 0}
                      onChange={(e) =>
                        setEditPrescription((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Refills</Label>
                    <Input
                      type="number"
                      value={editPrescription.refills || 0}
                      onChange={(e) =>
                        setEditPrescription((prev) => ({ ...prev, refills: Number.parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Directions</Label>
                  <Textarea
                    value={editPrescription.directions || ""}
                    onChange={(e) => setEditPrescription((prev) => ({ ...prev, directions: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={editPrescription.notes || ""}
                    onChange={(e) => setEditPrescription((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePrescription} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Prescription</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this prescription for{" "}
                  <strong>{selectedPrescription?.medication_name}</strong>? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeletePrescription} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
