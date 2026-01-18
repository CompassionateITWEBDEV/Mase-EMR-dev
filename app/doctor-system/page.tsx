"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/rbac-hooks"
import { Send, Pill, ClipboardCheck, CheckCircle, Plus, Search, Fingerprint, Lock, TrendingUp, TrendingDown, Activity, Scale, Loader2, XCircle } from "lucide-react"

interface MedicationOrderRequest {
  id: string
  patient_id: string
  patient_name: string
  patient_dob?: string
  patient_client_number?: string
  order_type: "increase" | "decrease" | "hold" | "taper" | "split"
  current_dose_mg: number
  requested_dose_mg: number
  clinical_justification: string
  physician_id: string
  nurse_id: string
  nurse_name: string
  nurse_employee_id?: string
  status: string
  physician_review_notes?: string
  reviewed_at?: string
  created_at: string
}

interface Patient {
  id: string
  first_name: string
  last_name: string
  mrn?: string
  phone?: string
  email?: string
  date_of_birth?: string
  client_number?: string
}

export default function DoctorSystemPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [treatmentPlanDialogOpen, setTreatmentPlanDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false)
  const [referralDialogOpen, setReferralDialogOpen] = useState(false)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [signatureMethod, setSignatureMethod] = useState("pin")
  const [pinValue, setPinValue] = useState("")
  
  // Order management state
  const [orders, setOrders] = useState<MedicationOrderRequest[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<MedicationOrderRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [processingOrder, setProcessingOrder] = useState(false)

  // Fetch orders - fetch ALL pending orders regardless of physician
  // This allows physicians to see all pending requests that need review
  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      // Fetch all pending orders without filtering by physician_id
      // This ensures orders submitted to any physician are visible for review
      const response = await fetch(`/api/medication-order-requests?status=pending_physician_review`)
      const data = await response.json()

      console.log("[Physician Dashboard] Fetched orders:", {
        success: response.ok,
        ordersCount: data.orders?.length || 0,
        debug: data.debug,
        error: data.error
      })

      if (response.ok) {
        setOrders(data.orders || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch orders",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoadingOrders(false)
    }
  }

  // Search patients from database using API route
  const searchPatients = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(term)}&limit=10`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search patients")
      }

      const data = await response.json()
      setSearchResults(data.patients || [])
    } catch (err) {
      console.error("Error searching patients:", err)
      setSearchResults([])
      toast({
        title: "Search Error",
        description: err instanceof Error ? err.message : "Failed to search patients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Handle patient selection from search results
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientData(patient)
    setSelectedPatient(patient.id)
    setSearchResults([])
    setSearchQuery(`${patient.first_name} ${patient.last_name}`)
    toast({
      title: "Patient Selected",
      description: `Selected: ${patient.first_name} ${patient.last_name}`,
    })
  }

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

  // Fetch orders on mount and when user changes
  useEffect(() => {
    fetchOrders()
    // Refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Approve order
  const approveOrder = async () => {
    if (!selectedOrder || !pinValue) {
      toast({
        title: "Signature Required",
        description: "Please enter your PIN to approve the order",
        variant: "destructive",
      })
      return
    }

    if (pinValue.length !== 4 || !/^\d+$/.test(pinValue)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4 digits",
        variant: "destructive",
      })
      return
    }

    setProcessingOrder(true)
    try {
      const response = await fetch("/api/medication-order-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          status: "approved",
          physician_signature: pinValue,
          physician_review_notes: reviewNotes.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Order Approved",
          description: `Order for ${selectedOrder.patient_name} has been approved`,
        })
        setSignatureDialogOpen(false)
        setSelectedOrder(null)
        setPinValue("")
        setReviewNotes("")
        fetchOrders()
      } else {
        throw new Error(data.error || "Failed to approve order")
      }
    } catch (error: any) {
      console.error("Error approving order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to approve order",
        variant: "destructive",
      })
    } finally {
      setProcessingOrder(false)
    }
  }

  // Deny order
  const denyOrder = async () => {
    if (!selectedOrder || !reviewNotes.trim()) {
      toast({
        title: "Review Notes Required",
        description: "Please provide reason for denial",
        variant: "destructive",
      })
      return
    }

    setProcessingOrder(true)
    try {
      const response = await fetch("/api/medication-order-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          status: "denied",
          physician_review_notes: reviewNotes.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Order Denied",
          description: `Order for ${selectedOrder.patient_name} has been denied`,
        })
        setSignatureDialogOpen(false)
        setSelectedOrder(null)
        setReviewNotes("")
        fetchOrders()
      } else {
        throw new Error(data.error || "Failed to deny order")
      }
    } catch (error: any) {
      console.error("Error denying order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to deny order",
        variant: "destructive",
      })
    } finally {
      setProcessingOrder(false)
    }
  }

  // Get order type icon
  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case "increase":
        return <TrendingUp className="h-3 w-3 mr-1" />
      case "decrease":
        return <TrendingDown className="h-3 w-3 mr-1" />
      case "taper":
        return <Activity className="h-3 w-3 mr-1" />
      case "split":
        return <Scale className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  // Get order type badge variant
  const getOrderTypeVariant = (type: string): "default" | "destructive" | "secondary" => {
    switch (type) {
      case "increase":
        return "default"
      case "decrease":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const pendingCount = orders.length

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
                <h1 className="text-3xl font-bold text-gray-900">Physician Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Medical treatment planning, orders, prescriptions, and MAPS integration
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setTreatmentPlanDialogOpen(true)} className="bg-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Treatment Plan
                </Button>
                <Button onClick={() => setPrescriptionDialogOpen(true)} variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  E-Prescribe
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
                  <div className="space-y-2 relative">
                    <Label>Search Patient</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or MRN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="border rounded-lg divide-y max-h-64 overflow-y-auto mt-2 absolute z-10 bg-white w-full shadow-lg">
                        {searchResults.map((patient) => (
                          <div
                            key={patient.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleSelectPatient(patient)}
                          >
                            <p className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {patient.phone && `Phone: ${patient.phone}`}
                              {patient.phone && patient.mrn && " • "}
                              {patient.mrn && `MRN: ${patient.mrn}`}
                              {!patient.phone && !patient.mrn && `ID: ${patient.id.slice(0, 8)}`}
                              {patient.date_of_birth && ` • DOB: ${new Date(patient.date_of_birth).toLocaleDateString()}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4 mt-2">
                        No patients found matching "{searchQuery}"
                      </div>
                    )}

                    {selectedPatientData && (
                      <div className="mt-2 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                        <p className="text-sm font-medium text-cyan-900">
                          Selected: {selectedPatientData.first_name} {selectedPatientData.last_name}
                        </p>
                        {selectedPatientData.mrn && (
                          <p className="text-xs text-cyan-700">MRN: {selectedPatientData.mrn}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>My Patient Panel</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from your panel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient1">Sarah Johnson - Follow-up Due</SelectItem>
                        <SelectItem value="patient2">Michael Chen - New Order</SelectItem>
                        <SelectItem value="patient3">Emily Davis - Medication Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="orders" className="space-y-4">
              <TabsList>
                <TabsTrigger value="orders">Order Queue</TabsTrigger>
                <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
              </TabsList>

              {/* Order Queue Tab */}
              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-cyan-600" />
                        <CardTitle>Pending Medication Orders</CardTitle>
                        <Badge variant="destructive" className="ml-2">
                          {pendingCount} Pending
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchOrders}
                        disabled={loadingOrders}
                      >
                        {loadingOrders ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Refresh"
                        )}
                      </Button>
                    </div>
                    <CardDescription>Review and sign medication orders from nursing staff</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingOrders ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No pending orders</p>
                        <p className="text-sm mt-1">All orders have been reviewed</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div key={order.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="font-semibold text-lg">{order.patient_name}</div>
                                <div className="text-sm text-gray-600">
                                  Requested by {order.nurse_name}
                                  {order.nurse_employee_id && ` (${order.nurse_employee_id})`}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(order.created_at).toLocaleString()}
                                </div>
                              </div>
                              <Badge variant={getOrderTypeVariant(order.order_type)}>
                                {getOrderTypeIcon(order.order_type)}
                                {order.order_type.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                              <div>
                                <span className="text-gray-600">Current Dose:</span>
                                <span className="ml-2 font-medium">{order.current_dose_mg}mg</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Requested Dose:</span>
                                <span className="ml-2 font-medium text-cyan-600">
                                  {order.requested_dose_mg}mg
                                </span>
                              </div>
                            </div>
                            <div className="text-sm mb-3">
                              <span className="text-gray-600">Clinical Justification:</span>
                              <p className="mt-1 bg-gray-50 p-3 rounded">{order.clinical_justification}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setReviewNotes("")
                                  setPinValue("")
                                  setSignatureDialogOpen(true)
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve & Sign
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setReviewNotes("")
                                  setPinValue("")
                                  setSignatureDialogOpen(true)
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Deny
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Treatment Plans Tab */}
              <TabsContent value="treatment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Treatment Plans</CardTitle>
                    <CardDescription>Create and manage comprehensive medical treatment plans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          patient: "Sarah Johnson",
                          diagnosis: "Opioid Use Disorder",
                          plan: "MAT with Methadone 80mg daily",
                          status: "active",
                        },
                        {
                          patient: "Michael Chen",
                          diagnosis: "Opioid Use Disorder",
                          plan: "MAT with Buprenorphine 16mg daily",
                          status: "active",
                        },
                      ].map((plan, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{plan.patient}</div>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Diagnosis:</strong> {plan.diagnosis}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Treatment:</strong> {plan.plan}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              View Full Plan
                            </Button>
                            <Button size="sm" variant="outline">
                              Modify
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent value="prescriptions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Pill className="w-5 h-5 text-cyan-600" />
                          E-Prescribing & MAPS Integration
                        </CardTitle>
                        <CardDescription>Electronic prescribing with PDMP/MAPS monitoring</CardDescription>
                      </div>
                      <Button onClick={() => setPrescriptionDialogOpen(true)} className="bg-cyan-600">
                        <Plus className="w-4 h-4 mr-2" />
                        New Prescription
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          patient: "Sarah Johnson",
                          medication: "Methadone 80mg",
                          pharmacy: "Main Street Pharmacy",
                          status: "active",
                          lastFill: "3 days ago",
                        },
                        {
                          patient: "Michael Chen",
                          medication: "Buprenorphine 16mg",
                          pharmacy: "Care Pharmacy",
                          status: "active",
                          lastFill: "1 week ago",
                        },
                      ].map((rx, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold">{rx.patient}</div>
                              <div className="text-sm text-gray-600">{rx.medication}</div>
                            </div>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Pharmacy:</strong> {rx.pharmacy}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <strong>Last Fill:</strong> {rx.lastFill}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Check MAPS/PDMP
                            </Button>
                            <Button size="sm" variant="outline">
                              Modify
                            </Button>
                            <Button size="sm" variant="outline">
                              Discontinue
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Referrals Tab */}
              <TabsContent value="referrals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Specialist Referrals</CardTitle>
                      <Button onClick={() => setReferralDialogOpen(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        New Referral
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          patient: "Sarah Johnson",
                          specialty: "Psychiatry",
                          reason: "Anxiety disorder management",
                          status: "pending",
                        },
                        {
                          patient: "Michael Chen",
                          specialty: "Pain Management",
                          reason: "Chronic back pain",
                          status: "scheduled",
                        },
                      ].map((referral, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{referral.patient}</div>
                            <Badge variant={referral.status === "scheduled" ? "default" : "secondary"}>
                              {referral.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Specialty:</strong> {referral.specialty}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Reason:</strong> {referral.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={(open) => {
        setSignatureDialogOpen(open)
        if (!open) {
          setSelectedOrder(null)
          setReviewNotes("")
          setPinValue("")
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder ? `Review Order - ${selectedOrder.order_type.toUpperCase()}` : "Sign Medical Order"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? "Review the order request and approve or deny with your signature"
                : "Authenticate using PIN or biometric verification"}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Patient Information</h4>
                <p>
                  <strong>Name:</strong> {selectedOrder.patient_name}
                </p>
                {selectedOrder.patient_client_number && (
                  <p>
                    <strong>Client #:</strong> {selectedOrder.patient_client_number}
                  </p>
                )}
                <p>
                  <strong>Order Type:</strong> {selectedOrder.order_type.toUpperCase()}
                </p>
                <p>
                  <strong>Current Dose:</strong> {selectedOrder.current_dose_mg}mg →{" "}
                  <strong className="text-cyan-600">{selectedOrder.requested_dose_mg}mg</strong>
                </p>
                <p>
                  <strong>Submitted by:</strong> {selectedOrder.nurse_name}
                </p>
                <p>
                  <strong>Submitted:</strong> {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Clinical Justification</Label>
                <div className="bg-gray-50 p-3 rounded text-sm">{selectedOrder.clinical_justification}</div>
              </div>

              <div className="space-y-2">
                <Label>Physician Review Notes (Optional for approval, required for denial)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add your clinical assessment and rationale..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={signatureMethod === "pin" ? "default" : "outline"}
                onClick={() => setSignatureMethod("pin")}
                className="flex-1"
              >
                <Lock className="w-4 h-4 mr-2" />
                PIN
              </Button>
              <Button
                variant={signatureMethod === "fingerprint" ? "default" : "outline"}
                onClick={() => setSignatureMethod("fingerprint")}
                className="flex-1"
                disabled
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                Fingerprint
              </Button>
            </div>

            {signatureMethod === "pin" && (
              <div>
                <Label>Enter 4-Digit PIN</Label>
                <Input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
            )}

            {signatureMethod === "fingerprint" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Fingerprint className="w-24 h-24 text-cyan-600 mb-4" />
                <p className="text-center text-gray-600">Place your finger on the scanner to authenticate</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSignatureDialogOpen(false)
                setSelectedOrder(null)
                setReviewNotes("")
                setPinValue("")
              }}
              disabled={processingOrder}
            >
              Cancel
            </Button>
            {selectedOrder && (
              <Button
                variant="destructive"
                onClick={denyOrder}
                disabled={processingOrder || !reviewNotes.trim()}
              >
                {processingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Deny Order
                  </>
                )}
              </Button>
            )}
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={selectedOrder ? approveOrder : () => {}}
              disabled={processingOrder || !pinValue || pinValue.length !== 4}
            >
              {processingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {selectedOrder ? "Approve & Sign Order" : "Approve & Sign Order"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Other dialogs can be added as needed */}
    </div>
  )
}
