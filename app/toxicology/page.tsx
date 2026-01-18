"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  FlaskConical,
  Plus,
  FileCheck,
  Clock,
  Search,
  Building2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Eye,
  TestTube,
  Printer,
  RefreshCw,
  Settings,
  Loader2,
} from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ToxicologyPage() {
  const { toast } = useToast()
  const { data, error, isLoading, mutate } = useSWR("/api/toxicology", fetcher)
  const { data: labsData, mutate: mutateLabs } = useSWR("/api/toxicology?action=labs", fetcher)
  const { data: ordersData, mutate: mutateOrders } = useSWR("/api/toxicology?action=orders", fetcher)

  const [activeTab, setActiveTab] = useState("orders")
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog states
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [newLabOpen, setNewLabOpen] = useState(false)
  const [collectSpecimenOpen, setCollectSpecimenOpen] = useState(false)
  const [enterResultsOpen, setEnterResultsOpen] = useState(false)
  const [viewOrderOpen, setViewOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // New Order form
  const [orderForm, setOrderForm] = useState({
    patientId: "",
    providerId: "",
    labId: "",
    collectionMethod: "Urine",
    testPanel: "",
    substancesToTest: [] as string[],
    reasonForTesting: "routine",
    urgency: "Routine",
  })

  // New Lab form
  const [labForm, setLabForm] = useState({
    labName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cliaNumber: "",
    samhsaCertified: false,
    capAccredited: false,
    turnaroundHours: 24,
    testPanelsOffered: [] as string[],
  })

  // Collection form
  const [collectionForm, setCollectionForm] = useState({
    specimenId: "",
    temperatureCheck: true,
    specimenIntegrity: "Valid",
    observedCollection: false,
    cocNumber: "",
    staffId: "",
  })

  // Results form
  const [resultsForm, setResultsForm] = useState({
    overallResult: "Negative",
    results: [] as any[],
  })

  const testPanels = [
    { id: "5-panel", name: "5-Panel Standard", substances: ["THC", "Cocaine", "Opiates", "PCP", "Amphetamines"] },
    {
      id: "10-panel",
      name: "10-Panel Extended",
      substances: [
        "THC",
        "Cocaine",
        "Opiates",
        "PCP",
        "Amphetamines",
        "Barbiturates",
        "Benzodiazepines",
        "Methadone",
        "Propoxyphene",
        "Methaqualone",
      ],
    },
    {
      id: "12-panel",
      name: "12-Panel Comprehensive",
      substances: [
        "THC",
        "Cocaine",
        "Opiates",
        "PCP",
        "Amphetamines",
        "Barbiturates",
        "Benzodiazepines",
        "Methadone",
        "Oxycodone",
        "MDMA",
        "Buprenorphine",
        "Fentanyl",
      ],
    },
    {
      id: "opioid-panel",
      name: "Opioid Specific Panel",
      substances: ["Opiates", "Oxycodone", "Methadone", "Buprenorphine", "Fentanyl", "Tramadol"],
    },
    {
      id: "mat-panel",
      name: "MAT Monitoring Panel",
      substances: [
        "Methadone",
        "Buprenorphine",
        "Naltrexone",
        "Opiates",
        "Benzodiazepines",
        "Cocaine",
        "Amphetamines",
        "THC",
      ],
    },
  ]

  const handleCreateOrder = async () => {
    if (!orderForm.patientId || !orderForm.providerId || !orderForm.testPanel) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const panel = testPanels.find((p) => p.id === orderForm.testPanel)
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-order",
          patientId: orderForm.patientId,
          providerId: orderForm.providerId,
          labId: orderForm.labId || null,
          collectionMethod: orderForm.collectionMethod,
          testPanel: panel?.name || orderForm.testPanel,
          substancesToTest: panel?.substances || [],
          reasonForTesting: orderForm.reasonForTesting,
          urgency: orderForm.urgency,
        }),
      })

      if (!res.ok) throw new Error("Failed to create order")

      toast({ title: "Success", description: "Drug screen order created successfully" })
      setNewOrderOpen(false)
      setOrderForm({
        patientId: "",
        providerId: "",
        labId: "",
        collectionMethod: "Urine",
        testPanel: "",
        substancesToTest: [],
        reasonForTesting: "routine",
        urgency: "Routine",
      })
      mutate()
      mutateOrders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to create order", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateLab = async () => {
    if (!labForm.labName || !labForm.cliaNumber) {
      toast({ title: "Error", description: "Lab name and CLIA number are required", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-lab",
          ...labForm,
        }),
      })

      if (!res.ok) throw new Error("Failed to create lab")

      toast({ title: "Success", description: "Lab added successfully" })
      setNewLabOpen(false)
      setLabForm({
        labName: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        cliaNumber: "",
        samhsaCertified: false,
        capAccredited: false,
        turnaroundHours: 24,
        testPanelsOffered: [],
      })
      mutateLabs()
    } catch (err) {
      toast({ title: "Error", description: "Failed to create lab", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCollectSpecimen = async () => {
    if (!selectedOrder || !collectionForm.specimenId) {
      toast({ title: "Error", description: "Specimen ID is required", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record-collection",
          orderId: selectedOrder.id,
          ...collectionForm,
        }),
      })

      if (!res.ok) throw new Error("Failed to record collection")

      toast({ title: "Success", description: "Specimen collection recorded" })
      setCollectSpecimenOpen(false)
      setCollectionForm({
        specimenId: "",
        temperatureCheck: true,
        specimenIntegrity: "Valid",
        observedCollection: false,
        cocNumber: "",
        staffId: "",
      })
      mutate()
      mutateOrders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to record collection", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnterResults = async () => {
    if (!selectedOrder || resultsForm.results.length === 0) {
      toast({ title: "Error", description: "Please enter results", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enter-results",
          orderId: selectedOrder.id,
          overallResult: resultsForm.overallResult,
          results: resultsForm.results,
        }),
      })

      if (!res.ok) throw new Error("Failed to enter results")

      toast({ title: "Success", description: "Results entered successfully" })
      setEnterResultsOpen(false)
      setResultsForm({ overallResult: "Negative", results: [] })
      mutate()
      mutateOrders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to enter results", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const openCollectSpecimen = (order: any) => {
    setSelectedOrder(order)
    setCollectionForm({
      specimenId: `SPEC-${Date.now()}`,
      temperatureCheck: true,
      specimenIntegrity: "Valid",
      observedCollection: false,
      cocNumber: `COC-${Date.now()}`,
      staffId: "",
    })
    setCollectSpecimenOpen(true)
  }

  const openEnterResults = (order: any) => {
    setSelectedOrder(order)
    const substances = order.substances_to_test || ["THC", "Cocaine", "Opiates", "PCP", "Amphetamines"]
    setResultsForm({
      overallResult: "Negative",
      results: substances.map((s: string) => ({
        substance: s,
        substanceClass: s,
        result: "Negative",
        cutoffLevel: "50 ng/mL",
        concentration: "",
        confirmationRequired: false,
      })),
    })
    setEnterResultsOpen(true)
  }

  const openViewOrder = (order: any) => {
    setSelectedOrder(order)
    setViewOrderOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      collected: "bg-blue-100 text-blue-800",
      "in-lab": "bg-purple-100 text-purple-800",
      resulted: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>
  }

  const getResultBadge = (result: string) => {
    if (result === "Negative")
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Negative
        </Badge>
      )
    if (result === "Positive")
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Positive
        </Badge>
      )
    return <Badge className="bg-gray-100 text-gray-800">{result}</Badge>
  }

  const filteredOrders = (ordersData?.orders || []).filter((order: any) => {
    if (!searchTerm) return true
    const patientName = `${order.patients?.first_name || ""} ${order.patients?.last_name || ""}`.toLowerCase()
    const orderNum = (order.order_number || "").toLowerCase()
    return patientName.includes(searchTerm.toLowerCase()) || orderNum.includes(searchTerm.toLowerCase())
  })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Toxicology Lab Integration</h1>
              <p className="text-sm text-muted-foreground">Drug Screening Orders & Results Management</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  mutate()
                  mutateOrders()
                  mutateLabs()
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => setNewOrderOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Drug Screen
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Collection</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats?.pending || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting specimen</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Laboratory</CardTitle>
                <FlaskConical className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats?.collected || 0}</div>
                <p className="text-xs text-muted-foreground">In processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Results Ready</CardTitle>
                <FileCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats?.resulted || 0}</div>
                <p className="text-xs text-muted-foreground">Completed tests</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Labs Connected</CardTitle>
                <Building2 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{labsData?.labs?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active integrations</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="orders">
                <ClipboardList className="mr-2 h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="results">
                <TestTube className="mr-2 h-4 w-4" />
                Results
              </TabsTrigger>
              <TabsTrigger value="labs">
                <Building2 className="mr-2 h-4 w-4" />
                Labs
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Drug Screen Orders</CardTitle>
                      <CardDescription>Manage toxicology test orders</CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders found</p>
                      <Button className="mt-4" onClick={() => setNewOrderOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Order
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Test Panel</TableHead>
                          <TableHead>Order Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>
                              {order.patients?.first_name} {order.patients?.last_name}
                            </TableCell>
                            <TableCell>{order.test_panel}</TableCell>
                            <TableCell>
                              {order.order_date ? new Date(order.order_date).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{order.overall_result ? getResultBadge(order.overall_result) : "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openViewOrder(order)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {order.status === "pending" && (
                                  <Button size="sm" variant="outline" onClick={() => openCollectSpecimen(order)}>
                                    Collect
                                  </Button>
                                )}
                                {(order.status === "collected" || order.status === "in-lab") && (
                                  <Button size="sm" variant="outline" onClick={() => openEnterResults(order)}>
                                    Results
                                  </Button>
                                )}
                                {order.status === "resulted" && (
                                  <Button size="sm" variant="ghost">
                                    <Printer className="h-4 w-4" />
                                  </Button>
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

            {/* Results Tab */}
            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                  <CardDescription>View and review completed drug screen results</CardDescription>
                </CardHeader>
                <CardContent>
                  {(ordersData?.orders || []).filter((o: any) => o.status === "resulted").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No results available yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Test Panel</TableHead>
                          <TableHead>Collection Date</TableHead>
                          <TableHead>Result Date</TableHead>
                          <TableHead>Overall Result</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(ordersData?.orders || [])
                          .filter((o: any) => o.status === "resulted")
                          .map((order: any) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.order_number}</TableCell>
                              <TableCell>
                                {order.patients?.first_name} {order.patients?.last_name}
                              </TableCell>
                              <TableCell>{order.test_panel}</TableCell>
                              <TableCell>
                                {order.collection_date ? new Date(order.collection_date).toLocaleDateString() : "-"}
                              </TableCell>
                              <TableCell>
                                {order.result_received_date
                                  ? new Date(order.result_received_date).toLocaleDateString()
                                  : "-"}
                              </TableCell>
                              <TableCell>{getResultBadge(order.overall_result)}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={() => openViewOrder(order)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Labs Tab */}
            <TabsContent value="labs">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Connected Laboratories</CardTitle>
                      <CardDescription>Manage toxicology lab integrations</CardDescription>
                    </div>
                    <Button onClick={() => setNewLabOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Lab
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(labsData?.labs || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No laboratories configured</p>
                      <Button className="mt-4" onClick={() => setNewLabOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Lab
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {(labsData?.labs || []).map((lab: any) => (
                        <Card key={lab.id} className="border">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{lab.lab_name}</CardTitle>
                              <Badge
                                className={lab.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100"}
                              >
                                {lab.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <p>
                              <span className="text-muted-foreground">Contact:</span> {lab.contact_name || "-"}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Phone:</span> {lab.phone || "-"}
                            </p>
                            <p>
                              <span className="text-muted-foreground">CLIA #:</span> {lab.clia_number || "-"}
                            </p>
                            <div className="flex gap-2 pt-2">
                              {lab.samhsa_certified && <Badge variant="outline">SAMHSA Certified</Badge>}
                              {lab.cap_accredited && <Badge variant="outline">CAP Accredited</Badge>}
                            </div>
                            <p>
                              <span className="text-muted-foreground">Turnaround:</span>{" "}
                              {lab.average_turnaround_hours || 24} hours
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Toxicology Settings</CardTitle>
                  <CardDescription>Configure default settings for drug screening</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Default Test Panels</h3>
                    <div className="grid gap-3">
                      {testPanels.map((panel) => (
                        <div key={panel.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1 font-medium">{panel.name}</div>
                          <Badge variant="outline">{panel.substances.length} substances</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Chain of Custody Settings</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Default Collection Method</Label>
                        <Select defaultValue="Urine">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Urine">Urine</SelectItem>
                            <SelectItem value="Oral Fluid">Oral Fluid</SelectItem>
                            <SelectItem value="Hair">Hair</SelectItem>
                            <SelectItem value="Blood">Blood</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Require Observed Collection</Label>
                        <Select defaultValue="clinical">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always</SelectItem>
                            <SelectItem value="clinical">Clinical Decision</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Order Dialog */}
      <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Drug Screen Order</DialogTitle>
            <DialogDescription>Create a new toxicology test order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={orderForm.patientId} onValueChange={(v) => setOrderForm({ ...orderForm, patientId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {(data?.patients || []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ordering Provider *</Label>
              <Select value={orderForm.providerId} onValueChange={(v) => setOrderForm({ ...orderForm, providerId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {(data?.providers || []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      Dr. {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Test Panel *</Label>
              <Select value={orderForm.testPanel} onValueChange={(v) => setOrderForm({ ...orderForm, testPanel: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test panel" />
                </SelectTrigger>
                <SelectContent>
                  {testPanels.map((panel) => (
                    <SelectItem key={panel.id} value={panel.id}>
                      {panel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Collection Method</Label>
                <Select
                  value={orderForm.collectionMethod}
                  onValueChange={(v) => setOrderForm({ ...orderForm, collectionMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urine">Urine</SelectItem>
                    <SelectItem value="Oral Fluid">Oral Fluid</SelectItem>
                    <SelectItem value="Hair">Hair</SelectItem>
                    <SelectItem value="Blood">Blood</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select value={orderForm.urgency} onValueChange={(v) => setOrderForm({ ...orderForm, urgency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="STAT">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason for Testing</Label>
              <Select
                value={orderForm.reasonForTesting}
                onValueChange={(v) => setOrderForm({ ...orderForm, reasonForTesting: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine Monitoring</SelectItem>
                  <SelectItem value="admission">Admission Screening</SelectItem>
                  <SelectItem value="random">Random Testing</SelectItem>
                  <SelectItem value="for-cause">For Cause</SelectItem>
                  <SelectItem value="post-incident">Post-Incident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(labsData?.labs || []).length > 0 && (
              <div className="space-y-2">
                <Label>Send to Lab (Optional)</Label>
                <Select
                  value={orderForm.labId}
                  onValueChange={(v) => setOrderForm({ ...orderForm, labId: v === "in-house" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-house">In-house testing</SelectItem>
                    {(labsData?.labs || []).map((lab: any) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.lab_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOrderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Lab Dialog */}
      <Dialog open={newLabOpen} onOpenChange={setNewLabOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Toxicology Lab</DialogTitle>
            <DialogDescription>Configure a new laboratory for drug screening</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lab Name *</Label>
              <Input value={labForm.labName} onChange={(e) => setLabForm({ ...labForm, labName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={labForm.contactName}
                  onChange={(e) => setLabForm({ ...labForm, contactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={labForm.phone} onChange={(e) => setLabForm({ ...labForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={labForm.email}
                onChange={(e) => setLabForm({ ...labForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CLIA Number *</Label>
              <Input
                value={labForm.cliaNumber}
                onChange={(e) => setLabForm({ ...labForm, cliaNumber: e.target.value })}
                placeholder="e.g., 12D3456789"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turnaround (hours)</Label>
                <Input
                  type="number"
                  value={labForm.turnaroundHours}
                  onChange={(e) => setLabForm({ ...labForm, turnaroundHours: Number.parseInt(e.target.value) || 24 })}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="samhsa"
                  checked={labForm.samhsaCertified}
                  onCheckedChange={(c) => setLabForm({ ...labForm, samhsaCertified: c === true })}
                />
                <Label htmlFor="samhsa">SAMHSA Certified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cap"
                  checked={labForm.capAccredited}
                  onCheckedChange={(c) => setLabForm({ ...labForm, capAccredited: c === true })}
                />
                <Label htmlFor="cap">CAP Accredited</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLabOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLab} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Lab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Specimen Dialog */}
      <Dialog open={collectSpecimenOpen} onOpenChange={setCollectSpecimenOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Collect Specimen</DialogTitle>
            <DialogDescription>Record specimen collection for order {selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Specimen ID *</Label>
              <Input
                value={collectionForm.specimenId}
                onChange={(e) => setCollectionForm({ ...collectionForm, specimenId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Chain of Custody #</Label>
              <Input
                value={collectionForm.cocNumber}
                onChange={(e) => setCollectionForm({ ...collectionForm, cocNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Specimen Integrity</Label>
              <Select
                value={collectionForm.specimenIntegrity}
                onValueChange={(v) => setCollectionForm({ ...collectionForm, specimenIntegrity: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Valid">Valid - Normal</SelectItem>
                  <SelectItem value="Dilute">Dilute</SelectItem>
                  <SelectItem value="Substituted">Substituted</SelectItem>
                  <SelectItem value="Adulterated">Adulterated</SelectItem>
                  <SelectItem value="Invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temp"
                  checked={collectionForm.temperatureCheck}
                  onCheckedChange={(c) => setCollectionForm({ ...collectionForm, temperatureCheck: c === true })}
                />
                <Label htmlFor="temp">Temperature in Range (90-100°F)</Label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="observed"
                checked={collectionForm.observedCollection}
                onCheckedChange={(c) => setCollectionForm({ ...collectionForm, observedCollection: c === true })}
              />
              <Label htmlFor="observed">Observed Collection</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectSpecimenOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCollectSpecimen} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enter Results Dialog */}
      <Dialog open={enterResultsOpen} onOpenChange={setEnterResultsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Test Results</DialogTitle>
            <DialogDescription>Enter results for order {selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Overall Result</Label>
              <Select
                value={resultsForm.overallResult}
                onValueChange={(v) => setResultsForm({ ...resultsForm, overallResult: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Negative">Negative</SelectItem>
                  <SelectItem value="Positive">Positive</SelectItem>
                  <SelectItem value="Invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Individual Substance Results</Label>
              {resultsForm.results.map((result, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1 font-medium">{result.substance}</div>
                  <Select
                    value={result.result}
                    onValueChange={(v) => {
                      const newResults = [...resultsForm.results]
                      newResults[idx] = { ...newResults[idx], result: v }
                      setResultsForm({ ...resultsForm, results: newResults })
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                    </SelectContent>
                  </Select>
                  {result.result === "Positive" && (
                    <Input
                      className="w-32"
                      placeholder="Concentration"
                      value={result.concentration}
                      onChange={(e) => {
                        const newResults = [...resultsForm.results]
                        newResults[idx] = { ...newResults[idx], concentration: e.target.value }
                        setResultsForm({ ...resultsForm, results: newResults })
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnterResultsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnterResults} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewOrderOpen} onOpenChange={setViewOrderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order #{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">
                    {selectedOrder.patients?.first_name} {selectedOrder.patients?.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Test Panel</Label>
                  <p className="font-medium">{selectedOrder.test_panel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Collection Method</Label>
                  <p className="font-medium">{selectedOrder.collection_method}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-medium">
                    {selectedOrder.order_date ? new Date(selectedOrder.order_date).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Collection Date</Label>
                  <p className="font-medium">
                    {selectedOrder.collection_date ? new Date(selectedOrder.collection_date).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>
              {selectedOrder.overall_result && (
                <div className="pt-4 border-t">
                  <Label className="text-muted-foreground">Overall Result</Label>
                  <div className="mt-1">{getResultBadge(selectedOrder.overall_result)}</div>
                </div>
              )}
              {selectedOrder.results && selectedOrder.results.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Individual Results</Label>
                  <div className="space-y-1">
                    {selectedOrder.results.map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{r.substance_name}</span>
                        {getResultBadge(r.result)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOrderOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
