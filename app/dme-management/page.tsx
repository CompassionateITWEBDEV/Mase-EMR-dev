"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Package,
  Plus,
  Truck,
  Building2,
  FileCheck,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DMEManagementPage() {
  const { data, error, isLoading, mutate: refreshData } = useSWR("/api/dme", fetcher)
  const { data: suppliersData, mutate: refreshSuppliers } = useSWR("/api/dme?action=suppliers", fetcher)
  const { data: ordersData, mutate: refreshOrders } = useSWR("/api/dme?action=orders", fetcher)
  const { data: integrationData } = useSWR("/api/dme/integrations", fetcher)

  const [newSupplierOpen, setNewSupplierOpen] = useState(false)
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [viewOrderOpen, setViewOrderOpen] = useState(false)
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const [deleteOrderOpen, setDeleteOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // New Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    supplierName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    npi: "",
    specialties: [] as string[],
  })

  // New Order Form
  const [orderForm, setOrderForm] = useState({
    patientId: "",
    providerId: "",
    supplierId: "",
    urgency: "Routine",
    equipmentCategory: "",
    equipmentName: "",
    hcpcsCode: "",
    quantity: 1,
    rentalOrPurchase: "Purchase",
    diagnosisCodes: "",
    clinicalIndication: "",
    priorAuthRequired: false,
    deliveryAddress: "",
  })

  const handleCreateSupplier = async () => {
    if (!supplierForm.supplierName) {
      toast.error("Please enter supplier name")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/dme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-supplier",
          ...supplierForm,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("DME supplier added successfully")
        setNewSupplierOpen(false)
        refreshSuppliers()
        setSupplierForm({
          supplierName: "",
          contactName: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          state: "",
          zip: "",
          npi: "",
          specialties: [],
        })
      } else {
        toast.error(result.error || "Failed to add supplier")
      }
    } catch (error) {
      console.error("[v0] Error creating supplier:", error)
      toast.error("Failed to add supplier")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!orderForm.patientId || !orderForm.providerId || !orderForm.equipmentName) {
      toast.error("Please fill in all required fields (Patient, Provider, Equipment)")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/dme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-order",
          ...orderForm,
          diagnosisCodes: orderForm.diagnosisCodes
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("DME order created successfully")
        setNewOrderOpen(false)
        refreshOrders()
        refreshData()
        setOrderForm({
          patientId: "",
          providerId: "",
          supplierId: "",
          urgency: "Routine",
          equipmentCategory: "",
          equipmentName: "",
          hcpcsCode: "",
          quantity: 1,
          rentalOrPurchase: "Purchase",
          diagnosisCodes: "",
          clinicalIndication: "",
          priorAuthRequired: false,
          deliveryAddress: "",
        })
      } else {
        toast.error(result.error || "Failed to create order")
      }
    } catch (error) {
      console.error("[v0] Error creating order:", error)
      toast.error("Failed to create order")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string, deliveryStatus?: string) => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/dme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-status",
          orderId,
          status,
          deliveryStatus,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Order status updated")
        refreshOrders()
        refreshData()
        setEditOrderOpen(false)
      } else {
        toast.error(result.error || "Failed to update order")
      }
    } catch (error) {
      console.error("[v0] Error updating order:", error)
      toast.error("Failed to update order")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/dme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-order",
          orderId: selectedOrder.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Order deleted successfully")
        setDeleteOrderOpen(false)
        setSelectedOrder(null)
        refreshOrders()
        refreshData()
      } else {
        toast.error(result.error || "Failed to delete order")
      }
    } catch (error) {
      console.error("[v0] Error deleting order:", error)
      toast.error("Failed to delete order")
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading)
    return (
      <div className="flex h-screen">
        <DashboardSidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p>Loading DME data...</p>
          </div>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="flex h-screen">
        <DashboardSidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="mb-4">Error loading DME data</p>
            <Button onClick={() => refreshData()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )

  const stats = data?.stats || { pending: 0, in_process: 0, delivered: 0, total: 0 }
  const patients = data?.patients || []
  const providers = data?.providers || []
  const suppliers = suppliersData?.suppliers || []
  const orders = ordersData?.orders || []

  // Filter orders by search term
  const filteredOrders = orders.filter((order: any) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    const patientName = `${order.patients?.first_name || ""} ${order.patients?.last_name || ""}`.toLowerCase()
    return (
      patientName.includes(searchLower) ||
      order.equipment_name?.toLowerCase().includes(searchLower) ||
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.hcpcs_code?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge className="bg-blue-500">
            <Package className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        )
      case "shipped":
        return (
          <Badge className="bg-orange-500">
            <Truck className="mr-1 h-3 w-3" />
            Shipped
          </Badge>
        )
      case "delivered":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Delivered
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">DME Management</h1>
              <p className="text-muted-foreground">Durable Medical Equipment Orders & Suppliers</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refreshData()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Dialog open={newSupplierOpen} onOpenChange={setNewSupplierOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Building2 className="mr-2 h-4 w-4" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add DME Supplier</DialogTitle>
                    <DialogDescription>Register a new durable medical equipment supplier</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Supplier Name *</Label>
                        <Input
                          value={supplierForm.supplierName}
                          onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })}
                          placeholder="ABC Medical Equipment"
                        />
                      </div>
                      <div>
                        <Label>Contact Name</Label>
                        <Input
                          value={supplierForm.contactName}
                          onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                          placeholder="John Smith"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                          placeholder="contact@supplier.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        value={supplierForm.address}
                        onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>City</Label>
                        <Input
                          value={supplierForm.city}
                          onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          value={supplierForm.state}
                          onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })}
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <Label>ZIP</Label>
                        <Input
                          value={supplierForm.zip}
                          onChange={(e) => setSupplierForm({ ...supplierForm, zip: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>NPI Number</Label>
                      <Input
                        value={supplierForm.npi}
                        onChange={(e) => setSupplierForm({ ...supplierForm, npi: e.target.value })}
                        placeholder="1234567890"
                      />
                    </div>
                    <Button onClick={handleCreateSupplier} disabled={submitting}>
                      {submitting ? "Adding..." : "Add Supplier"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New DME Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create DME Order</DialogTitle>
                    <DialogDescription>Order durable medical equipment for a patient</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Patient *</Label>
                        <Select
                          value={orderForm.patientId}
                          onValueChange={(v) => setOrderForm({ ...orderForm, patientId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">No patients found</div>
                            ) : (
                              patients.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.first_name} {p.last_name}{" "}
                                  {p.date_of_birth && `(DOB: ${new Date(p.date_of_birth).toLocaleDateString()})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Ordering Provider *</Label>
                        <Select
                          value={orderForm.providerId}
                          onValueChange={(v) => setOrderForm({ ...orderForm, providerId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">No providers found</div>
                            ) : (
                              providers.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.first_name} {p.last_name}
                                  {p.license_type && `, ${p.license_type}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>DME Supplier</Label>
                        <Select
                          value={orderForm.supplierId}
                          onValueChange={(v) => setOrderForm({ ...orderForm, supplierId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">No suppliers - add one first</div>
                            ) : (
                              suppliers.map((s: any) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.supplier_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Urgency</Label>
                        <Select
                          value={orderForm.urgency}
                          onValueChange={(v) => setOrderForm({ ...orderForm, urgency: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Routine">Routine</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Equipment Category</Label>
                        <Select
                          value={orderForm.equipmentCategory}
                          onValueChange={(v) => setOrderForm({ ...orderForm, equipmentCategory: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mobility">Mobility (Walker, Wheelchair)</SelectItem>
                            <SelectItem value="Respiratory">Respiratory (Nebulizer, Oxygen)</SelectItem>
                            <SelectItem value="Diabetic">Diabetic Supplies</SelectItem>
                            <SelectItem value="CPAP">CPAP/BiPAP</SelectItem>
                            <SelectItem value="Wound Care">Wound Care</SelectItem>
                            <SelectItem value="Hospital Bed">Hospital Bed</SelectItem>
                            <SelectItem value="Orthotic">Orthotic/Prosthetic</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Rental or Purchase</Label>
                        <Select
                          value={orderForm.rentalOrPurchase}
                          onValueChange={(v) => setOrderForm({ ...orderForm, rentalOrPurchase: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Purchase">Purchase</SelectItem>
                            <SelectItem value="Rental">Rental</SelectItem>
                            <SelectItem value="Rent-to-Own">Rent-to-Own</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Equipment Name *</Label>
                      <Input
                        value={orderForm.equipmentName}
                        onChange={(e) => setOrderForm({ ...orderForm, equipmentName: e.target.value })}
                        placeholder="e.g., Standard Wheelchair, Portable Oxygen Concentrator"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>HCPCS Code</Label>
                        <Input
                          value={orderForm.hcpcsCode}
                          onChange={(e) => setOrderForm({ ...orderForm, hcpcsCode: e.target.value })}
                          placeholder="E.g., E0601, K0001"
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={orderForm.quantity}
                          onChange={(e) =>
                            setOrderForm({ ...orderForm, quantity: Number.parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Diagnosis Codes (ICD-10)</Label>
                      <Input
                        value={orderForm.diagnosisCodes}
                        onChange={(e) => setOrderForm({ ...orderForm, diagnosisCodes: e.target.value })}
                        placeholder="E.g., M79.3, Z96.641 (comma separated)"
                      />
                    </div>

                    <div>
                      <Label>Clinical Indication / Medical Necessity</Label>
                      <Textarea
                        value={orderForm.clinicalIndication}
                        onChange={(e) => setOrderForm({ ...orderForm, clinicalIndication: e.target.value })}
                        placeholder="Describe the medical necessity for this equipment..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Delivery Address</Label>
                      <Input
                        value={orderForm.deliveryAddress}
                        onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
                        placeholder="Patient's delivery address"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priorAuth"
                        checked={orderForm.priorAuthRequired}
                        onCheckedChange={(checked) =>
                          setOrderForm({ ...orderForm, priorAuthRequired: checked === true })
                        }
                      />
                      <Label htmlFor="priorAuth">Prior Authorization Required</Label>
                    </div>

                    <Button onClick={handleCreateOrder} disabled={submitting} className="w-full">
                      {submitting ? "Creating Order..." : "Create DME Order"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In Process</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.in_process}</div>
                <p className="text-xs text-muted-foreground">Being prepared</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.delivered}</div>
                <p className="text-xs text-muted-foreground">Completed orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">DME Orders</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>DME Orders</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No DME orders yet. Click "New DME Order" to create one.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Equipment</TableHead>
                          <TableHead>HCPCS</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Order Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                            <TableCell>
                              {order.patients ? `${order.patients.first_name} ${order.patients.last_name}` : "Unknown"}
                            </TableCell>
                            <TableCell>{order.equipment_name}</TableCell>
                            <TableCell>{order.hcpcs_code || "-"}</TableCell>
                            <TableCell>{order.dme_suppliers?.supplier_name || "Not assigned"}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setViewOrderOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setEditOrderOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setDeleteOrderOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
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

            <TabsContent value="suppliers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>DME Suppliers</CardTitle>
                  <CardDescription>Registered durable medical equipment suppliers</CardDescription>
                </CardHeader>
                <CardContent>
                  {suppliers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No suppliers registered. Click "Add Supplier" to add one.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier Name</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>NPI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suppliers.map((supplier: any) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                            <TableCell>{supplier.contact_name || "-"}</TableCell>
                            <TableCell>{supplier.phone || "-"}</TableCell>
                            <TableCell>{supplier.email || "-"}</TableCell>
                            <TableCell>
                              {supplier.city && supplier.state ? `${supplier.city}, ${supplier.state}` : "-"}
                            </TableCell>
                            <TableCell>{supplier.npi || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* View Order Dialog */}
      <Dialog open={viewOrderOpen} onOpenChange={setViewOrderOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">
                    {selectedOrder.patients
                      ? `${selectedOrder.patients.first_name} ${selectedOrder.patients.last_name}`
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Provider</Label>
                  <p className="font-medium">
                    {selectedOrder.providers
                      ? `${selectedOrder.providers.first_name} ${selectedOrder.providers.last_name}`
                      : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Equipment</Label>
                  <p className="font-medium">{selectedOrder.equipment_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">HCPCS Code</Label>
                  <p className="font-medium">{selectedOrder.hcpcs_code || "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedOrder.equipment_category || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{selectedOrder.quantity}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Rental/Purchase</Label>
                  <p className="font-medium">{selectedOrder.rental_or_purchase}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Urgency</Label>
                  <p className="font-medium">{selectedOrder.urgency}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Clinical Indication</Label>
                <p className="font-medium">{selectedOrder.clinical_indication || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Delivery Address</Label>
                <p className="font-medium">{selectedOrder.delivery_address || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prior Auth Required</Label>
                  <p className="font-medium">{selectedOrder.prior_auth_required ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Status Dialog */}
      <Dialog open={editOrderOpen} onOpenChange={setEditOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>Change the status of order {selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4">
              <div>
                <Label>Current Status</Label>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div>
                <Label>New Status</Label>
                <Select
                  defaultValue={selectedOrder.status}
                  onValueChange={(value) => handleUpdateOrderStatus(selectedOrder.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Order Confirmation Dialog */}
      <Dialog open={deleteOrderOpen} onOpenChange={setDeleteOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order {selectedOrder?.order_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOrderOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
