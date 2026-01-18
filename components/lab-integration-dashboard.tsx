"use client"
import { useState, useCallback } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  AlertCircle,
  Plus,
  Search,
  Send,
  FileText,
  Clock,
  CheckCircle,
  Beaker,
  TrendingUp,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
  Trash2,
  Edit,
  TestTube,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"

interface LabOrder {
  id: string
  patientName: string
  patientId: string
  testNames: string[]
  orderDate: string
  status: "pending" | "sent" | "collected" | "resulted" | "cancelled"
  priority: "stat" | "urgent" | "routine"
  labName: string
  collectionDate?: string
}

interface LabResult {
  id: string
  patientName: string
  patientId: string
  testName: string
  result: string
  referenceRange: string
  units?: string
  abnormalFlag?: string
  resultDate: string
  status: "preliminary" | "final" | "corrected"
}

interface Patient {
  id: string
  first_name: string
  last_name: string
}

// Define LabInterface interface
interface LabInterface {
  id: string
  lab_name: string
  lab_code: string
  connection_type: string
  hl7_endpoint: string
  api_endpoint: string
  api_key: string
  username: string
  password: string
  is_active: boolean
  connection_status: string
  last_connection_test: string
  supports_orders: boolean
  supports_results: boolean
  supports_oru: boolean
  supports_orm: boolean
  notes: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function LabIntegrationDashboard() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [isNewInterfaceOpen, setIsNewInterfaceOpen] = useState(false)
  const [isEditInterfaceOpen, setIsEditInterfaceOpen] = useState(false)
  const [isTestConnectionOpen, setIsTestConnectionOpen] = useState(false)
  const [selectedInterface, setSelectedInterface] = useState<LabInterface | null>(null)
  const [labInterfaces, setLabInterfaces] = useState<LabInterface[]>([])
  const [isLoadingInterfaces, setIsLoadingInterfaces] = useState(true)
  const [newInterface, setNewInterface] = useState({
    lab_name: "",
    lab_code: "",
    connection_type: "hl7",
    hl7_endpoint: "",
    api_endpoint: "",
    api_key: "",
    username: "",
    password: "",
    supports_orders: true,
    supports_results: true,
    supports_oru: true,
    supports_orm: true,
    notes: "",
  })
  const [testResults, setTestResults] = useState<{
    status: string
    message: string
    latency?: number
  } | null>(null)

  const { data, error, isLoading, mutate } = useSWR<{
    orders: LabOrder[]
    results: LabResult[]
    patients: Patient[]
  }>("/api/lab", fetcher)

  const labOrders = data?.orders || []
  const labResults = data?.results || []
  const patients = data?.patients || []

  const fetchLabInterfaces = useCallback(async () => {
    setIsLoadingInterfaces(true)
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("lab_interfaces").select("*").order("lab_name")

      if (error) throw error
      setLabInterfaces(data || [])
    } catch (error) {
      console.error("Error fetching lab interfaces:", error)
      // If table doesn't exist, show empty state
      setLabInterfaces([])
    } finally {
      setIsLoadingInterfaces(false)
    }
  }, [])

  // Fetch interfaces on mount
  useState(() => {
    fetchLabInterfaces()
  })

  const handleAddInterface = async () => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("lab_interfaces").insert({
        ...newInterface,
        is_active: true,
        connection_status: "pending",
      })

      if (error) throw error

      toast({ title: "Success", description: "Lab interface added successfully" })
      setIsNewInterfaceOpen(false)
      setNewInterface({
        lab_name: "",
        lab_code: "",
        connection_type: "hl7",
        hl7_endpoint: "",
        api_endpoint: "",
        api_key: "",
        username: "",
        password: "",
        supports_orders: true,
        supports_results: true,
        supports_oru: true,
        supports_orm: true,
        notes: "",
      })
      fetchLabInterfaces()
    } catch (error) {
      toast({ title: "Error", description: "Failed to add lab interface", variant: "destructive" })
    }
  }

  const handleUpdateInterface = async () => {
    if (!selectedInterface) return

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("lab_interfaces")
        .update({
          lab_name: selectedInterface.lab_name,
          lab_code: selectedInterface.lab_code,
          connection_type: selectedInterface.connection_type,
          hl7_endpoint: selectedInterface.hl7_endpoint,
          api_endpoint: selectedInterface.api_endpoint,
          api_key: selectedInterface.api_key,
          username: selectedInterface.username,
          password: selectedInterface.password,
          supports_orders: selectedInterface.supports_orders,
          supports_results: selectedInterface.supports_results,
          supports_oru: selectedInterface.supports_oru,
          supports_orm: selectedInterface.supports_orm,
          notes: selectedInterface.notes,
          is_active: selectedInterface.is_active,
        })
        .eq("id", selectedInterface.id)

      if (error) throw error

      toast({ title: "Success", description: "Lab interface updated successfully" })
      setIsEditInterfaceOpen(false)
      fetchLabInterfaces()
    } catch (error) {
      toast({ title: "Error", description: "Failed to update lab interface", variant: "destructive" })
    }
  }

  const handleDeleteInterface = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lab interface?")) return

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("lab_interfaces").delete().eq("id", id)

      if (error) throw error

      toast({ title: "Success", description: "Lab interface deleted successfully" })
      fetchLabInterfaces()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete lab interface", variant: "destructive" })
    }
  }

  const handleTestConnection = async (labInterface: LabInterface) => {
    setSelectedInterface(labInterface)
    setIsTestConnectionOpen(true)
    setTestResults(null)

    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock test result
    const success = Math.random() > 0.3
    setTestResults({
      status: success ? "success" : "failed",
      message: success
        ? "Connection successful. HL7 handshake completed."
        : "Connection failed. Unable to reach endpoint.",
      latency: success ? Math.floor(Math.random() * 200) + 50 : undefined,
    })

    // Update connection status in database
    try {
      const supabase = createBrowserClient()
      await supabase
        .from("lab_interfaces")
        .update({
          connection_status: success ? "connected" : "failed",
          last_connection_test: new Date().toISOString(),
        })
        .eq("id", labInterface.id)

      fetchLabInterfaces()
    } catch (error) {
      console.error("Error updating connection status:", error)
    }
  }

  const handleToggleActive = async (labInterface: LabInterface) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("lab_interfaces")
        .update({ is_active: !labInterface.is_active })
        .eq("id", labInterface.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Interface ${labInterface.is_active ? "disabled" : "enabled"} successfully`,
      })
      fetchLabInterfaces()
    } catch (error) {
      toast({ title: "Error", description: "Failed to update interface status", variant: "destructive" })
    }
  }

  const handleSendOrder = useCallback(
    async (orderId: string) => {
      try {
        const response = await fetch("/api/lab", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: orderId, type: "order", status: "sent" }),
        })

        if (!response.ok) throw new Error("Failed to send order")

        toast({ title: "Success", description: "Lab order sent successfully" })
        mutate()
      } catch (error) {
        toast({ title: "Error", description: "Failed to send lab order", variant: "destructive" })
      }
    },
    [toast, mutate],
  )

  const handleReviewResult = useCallback(
    async (resultId: string) => {
      try {
        const response = await fetch("/api/lab", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: resultId, type: "result", status: "final" }),
        })

        if (!response.ok) throw new Error("Failed to review result")

        toast({ title: "Success", description: "Result marked as reviewed" })
        mutate()
      } catch (error) {
        toast({ title: "Error", description: "Failed to review result", variant: "destructive" })
      }
    },
    [toast, mutate],
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "sent":
        return <Send className="h-4 w-4 text-blue-500" />
      case "collected":
        return <Beaker className="h-4 w-4 text-purple-500" />
      case "resulted":
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
      case "collected":
        return "bg-purple-100 text-purple-800"
      case "resulted":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat":
        return "bg-red-100 text-red-800"
      case "urgent":
        return "bg-orange-100 text-orange-800"
      case "routine":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredOrders = labOrders.filter(
    (order) =>
      order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.testNames.some((test) => test.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const filteredResults = labResults.filter(
    (result) =>
      result.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.testName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const pendingOrders = labOrders.filter((o) => o.status === "pending").length
  const sentOrders = labOrders.filter((o) => o.status === "sent").length
  const collectedOrders = labOrders.filter((o) => o.status === "collected").length
  const resultedOrders = labOrders.filter((o) => o.status === "resulted").length
  const activeInterfaces = labInterfaces.filter((i) => i.is_active).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Failed to load lab data</h3>
          <p className="text-muted-foreground mb-4">There was an error loading the lab integration data.</p>
          <Button onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting transmission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Orders</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentOrders}</div>
            <p className="text-xs text-muted-foreground">Transmitted to lab</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <Beaker className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectedOrders}</div>
            <p className="text-xs text-muted-foreground">Specimens collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Results Available</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultedOrders}</div>
            <p className="text-xs text-muted-foreground">Ready for review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Interfaces</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInterfaces}</div>
            <p className="text-xs text-muted-foreground">Lab connections</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => mutate()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Lab Orders</TabsTrigger>
          <TabsTrigger value="results">Lab Results</TabsTrigger>
          <TabsTrigger value="interfaces">Lab Interfaces</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lab Orders</CardTitle>
                <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Lab Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Lab Order</DialogTitle>
                    </DialogHeader>
                    <NewLabOrderForm
                      patients={patients}
                      // Pass only active interfaces that support orders
                      labInterfaces={labInterfaces.filter((i) => i.is_active && i.supports_orders)}
                      onClose={() => setIsNewOrderOpen(false)}
                      onSuccess={() => {
                        setIsNewOrderOpen(false)
                        mutate()
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search lab orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No lab orders found</h3>
                  <p className="text-muted-foreground">Create a new lab order to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Tests</TableHead>
                      <TableHead>Lab</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Collection Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.patientName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.testNames.map((test, index) => (
                              <div key={index} className="text-sm">
                                {test}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{order.labName}</TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(order.priority)}>{order.priority.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          {order.collectionDate ? new Date(order.collectionDate).toLocaleDateString() : "Not collected"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                            {order.status === "pending" && (
                              <Button size="sm" onClick={() => handleSendOrder(order.id)}>
                                <Send className="h-4 w-4 mr-1" />
                                Send
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

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lab Results</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search lab results..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No lab results found</h3>
                  <p className="text-muted-foreground">Results will appear here once labs are processed.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Reference Range</TableHead>
                      <TableHead>Flag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Result Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.patientName}</TableCell>
                        <TableCell>{result.testName}</TableCell>
                        <TableCell className="font-mono">
                          {result.result}{" "}
                          {result.units && <span className="text-muted-foreground">{result.units}</span>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{result.referenceRange}</TableCell>
                        <TableCell>
                          {result.abnormalFlag && <Badge variant="destructive">{result.abnormalFlag}</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              result.status === "final"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {result.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {result.resultDate ? new Date(result.resultDate).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                            {result.status !== "final" && (
                              <Button size="sm" onClick={() => handleReviewResult(result.id)}>
                                Review
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

        <TabsContent value="interfaces">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lab Interface Configuration</CardTitle>
                  <CardDescription>Configure and manage connections to laboratory information systems</CardDescription>
                </div>
                <Dialog open={isNewInterfaceOpen} onOpenChange={setIsNewInterfaceOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lab Interface
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Lab Interface</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Lab Name *</Label>
                          <Input
                            value={newInterface.lab_name}
                            onChange={(e) => setNewInterface({ ...newInterface, lab_name: e.target.value })}
                            placeholder="e.g., LabCorp, Quest Diagnostics"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Lab Code *</Label>
                          <Input
                            value={newInterface.lab_code}
                            onChange={(e) => setNewInterface({ ...newInterface, lab_code: e.target.value })}
                            placeholder="e.g., LABCORP, QUEST"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Connection Type</Label>
                        <Select
                          value={newInterface.connection_type}
                          onValueChange={(value) => setNewInterface({ ...newInterface, connection_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hl7">HL7 v2.x (MLLP)</SelectItem>
                            <SelectItem value="hl7_fhir">HL7 FHIR</SelectItem>
                            <SelectItem value="rest_api">REST API</SelectItem>
                            <SelectItem value="sftp">SFTP File Transfer</SelectItem>
                            <SelectItem value="direct">Direct Connect</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(newInterface.connection_type === "hl7" || newInterface.connection_type === "hl7_fhir") && (
                        <div className="space-y-2">
                          <Label>HL7 Endpoint</Label>
                          <Input
                            value={newInterface.hl7_endpoint}
                            onChange={(e) => setNewInterface({ ...newInterface, hl7_endpoint: e.target.value })}
                            placeholder="mllp://lab.example.com:2575"
                          />
                        </div>
                      )}

                      {(newInterface.connection_type === "rest_api" || newInterface.connection_type === "hl7_fhir") && (
                        <>
                          <div className="space-y-2">
                            <Label>API Endpoint</Label>
                            <Input
                              value={newInterface.api_endpoint}
                              onChange={(e) => setNewInterface({ ...newInterface, api_endpoint: e.target.value })}
                              placeholder="https://api.lab.com/v1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>API Key</Label>
                            <Input
                              type="password"
                              value={newInterface.api_key}
                              onChange={(e) => setNewInterface({ ...newInterface, api_key: e.target.value })}
                              placeholder="Enter API key"
                            />
                          </div>
                        </>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input
                            value={newInterface.username}
                            onChange={(e) => setNewInterface({ ...newInterface, username: e.target.value })}
                            placeholder="Interface username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={newInterface.password}
                            onChange={(e) => setNewInterface({ ...newInterface, password: e.target.value })}
                            placeholder="Interface password"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Supported Features</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={newInterface.supports_orders}
                              onCheckedChange={(checked) =>
                                setNewInterface({ ...newInterface, supports_orders: checked })
                              }
                            />
                            <Label>Send Lab Orders (ORM)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={newInterface.supports_results}
                              onCheckedChange={(checked) =>
                                setNewInterface({ ...newInterface, supports_results: checked })
                              }
                            />
                            <Label>Receive Results (ORU)</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={newInterface.notes}
                          onChange={(e) => setNewInterface({ ...newInterface, notes: e.target.value })}
                          placeholder="Additional configuration notes..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsNewInterfaceOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddInterface} disabled={!newInterface.lab_name || !newInterface.lab_code}>
                        Add Interface
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInterfaces ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : labInterfaces.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Lab Interfaces Configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Add a lab interface to enable bi-directional lab order and result exchange.
                  </p>
                  <Button onClick={() => setIsNewInterfaceOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Interface
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {labInterfaces.map((labInterface) => (
                    <Card key={labInterface.id} className={!labInterface.is_active ? "opacity-60" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-2 rounded-full ${
                                labInterface.connection_status === "connected"
                                  ? "bg-green-100"
                                  : labInterface.connection_status === "failed"
                                    ? "bg-red-100"
                                    : "bg-yellow-100"
                              }`}
                            >
                              {labInterface.connection_status === "connected" ? (
                                <Wifi className="h-5 w-5 text-green-600" />
                              ) : labInterface.connection_status === "failed" ? (
                                <WifiOff className="h-5 w-5 text-red-600" />
                              ) : (
                                <Activity className="h-5 w-5 text-yellow-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{labInterface.lab_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {labInterface.lab_code} • {labInterface.connection_type.toUpperCase()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {labInterface.supports_orders && (
                                <Badge variant="outline" className="text-xs">
                                  Orders
                                </Badge>
                              )}
                              {labInterface.supports_results && (
                                <Badge variant="outline" className="text-xs">
                                  Results
                                </Badge>
                              )}
                            </div>

                            <Badge
                              className={
                                labInterface.connection_status === "connected"
                                  ? "bg-green-100 text-green-800"
                                  : labInterface.connection_status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {labInterface.connection_status === "connected"
                                ? "Connected"
                                : labInterface.connection_status === "failed"
                                  ? "Failed"
                                  : "Pending"}
                            </Badge>

                            <Switch
                              checked={labInterface.is_active}
                              onCheckedChange={() => handleToggleActive(labInterface)}
                            />

                            <div className="flex items-center space-x-1">
                              <Button variant="outline" size="sm" onClick={() => handleTestConnection(labInterface)}>
                                <TestTube className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedInterface(labInterface)
                                  setIsEditInterfaceOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteInterface(labInterface.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {labInterface.last_connection_test && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Last tested: {new Date(labInterface.last_connection_test).toLocaleString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Interface Dialog */}
      <Dialog open={isEditInterfaceOpen} onOpenChange={setIsEditInterfaceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab Interface</DialogTitle>
          </DialogHeader>
          {selectedInterface && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lab Name *</Label>
                  <Input
                    value={selectedInterface.lab_name}
                    onChange={(e) => setSelectedInterface({ ...selectedInterface, lab_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lab Code *</Label>
                  <Input
                    value={selectedInterface.lab_code}
                    onChange={(e) => setSelectedInterface({ ...selectedInterface, lab_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Connection Type</Label>
                <Select
                  value={selectedInterface.connection_type}
                  onValueChange={(value) => setSelectedInterface({ ...selectedInterface, connection_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hl7">HL7 v2.x (MLLP)</SelectItem>
                    <SelectItem value="hl7_fhir">HL7 FHIR</SelectItem>
                    <SelectItem value="rest_api">REST API</SelectItem>
                    <SelectItem value="sftp">SFTP File Transfer</SelectItem>
                    <SelectItem value="direct">Direct Connect</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>HL7 Endpoint</Label>
                <Input
                  value={selectedInterface.hl7_endpoint || ""}
                  onChange={(e) => setSelectedInterface({ ...selectedInterface, hl7_endpoint: e.target.value })}
                  placeholder="mllp://lab.example.com:2575"
                />
              </div>

              <div className="space-y-2">
                <Label>API Endpoint</Label>
                <Input
                  value={selectedInterface.api_endpoint || ""}
                  onChange={(e) => setSelectedInterface({ ...selectedInterface, api_endpoint: e.target.value })}
                  placeholder="https://api.lab.com/v1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={selectedInterface.username || ""}
                    onChange={(e) => setSelectedInterface({ ...selectedInterface, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={selectedInterface.password || ""}
                    onChange={(e) => setSelectedInterface({ ...selectedInterface, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Supported Features</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedInterface.supports_orders}
                      onCheckedChange={(checked) =>
                        setSelectedInterface({ ...selectedInterface, supports_orders: checked })
                      }
                    />
                    <Label>Send Lab Orders (ORM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedInterface.supports_results}
                      onCheckedChange={(checked) =>
                        setSelectedInterface({ ...selectedInterface, supports_results: checked })
                      }
                    />
                    <Label>Receive Results (ORU)</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={selectedInterface.notes || ""}
                  onChange={(e) => setSelectedInterface({ ...selectedInterface, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditInterfaceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateInterface}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Connection Dialog */}
      <Dialog open={isTestConnectionOpen} onOpenChange={setIsTestConnectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Connection - {selectedInterface?.lab_name}</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            {testResults === null ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Testing connection...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {testResults.status === "success" ? (
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                )}
                <h3
                  className={`text-lg font-medium ${testResults.status === "success" ? "text-green-600" : "text-red-600"}`}
                >
                  {testResults.status === "success" ? "Connection Successful" : "Connection Failed"}
                </h3>
                <p className="text-muted-foreground text-center mt-2">{testResults.message}</p>
                {testResults.latency && (
                  <p className="text-sm text-muted-foreground mt-2">Latency: {testResults.latency}ms</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTestConnectionOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewLabOrderForm({
  patients,
  labInterfaces,
  onClose,
  onSuccess,
}: {
  patients: Patient[]
  labInterfaces: LabInterface[]
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    patientId: "",
    labId: "", // Store the selected lab interface ID
    labName: "", // Store the selected lab interface name
    testNames: [] as string[],
    testCodes: [] as string[],
    priority: "routine",
    specimenType: "",
    collectionMethod: "",
    notes: "",
  })
  const [testInput, setTestInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const commonTests = [
    { name: "Complete Blood Count (CBC)", code: "CBC" },
    { name: "Comprehensive Metabolic Panel", code: "CMP" },
    { name: "Basic Metabolic Panel", code: "BMP" },
    { name: "Lipid Panel", code: "LIPID" },
    { name: "Thyroid Stimulating Hormone", code: "TSH" },
    { name: "Hemoglobin A1c", code: "HBA1C" },
    { name: "Urinalysis", code: "UA" },
    { name: "Urine Drug Screen", code: "UDS" },
    { name: "Liver Function Panel", code: "LFT" },
    { name: "Hepatitis Panel", code: "HEP" },
    { name: "HIV Screening", code: "HIV" },
    { name: "Vitamin D Level", code: "VITD" },
  ]

  const handleAddTest = (test: { name: string; code: string }) => {
    if (!formData.testNames.includes(test.name)) {
      setFormData({
        ...formData,
        testNames: [...formData.testNames, test.name],
        testCodes: [...formData.testCodes, test.code],
      })
    }
  }

  const handleRemoveTest = (index: number) => {
    setFormData({
      ...formData,
      testNames: formData.testNames.filter((_, i) => i !== index),
      testCodes: formData.testCodes.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async () => {
    if (!formData.patientId || formData.testNames.length === 0) {
      toast({ title: "Error", description: "Please select a patient and at least one test", variant: "destructive" })
      return
    }

    // Ensure a lab is selected if it's required
    if (labInterfaces.length > 0 && !formData.labId) {
      toast({ title: "Error", description: "Please select a laboratory", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order",
          patientId: formData.patientId,
          labName: formData.labName, // Use the stored labName
          testNames: formData.testNames,
          testCodes: formData.testCodes,
          priority: formData.priority,
          specimenType: formData.specimenType,
          notes: formData.notes,
        }),
      })

      if (!response.ok) throw new Error("Failed to create order")

      toast({ title: "Success", description: "Lab order created successfully" })
      onSuccess()
    } catch (error) {
      toast({ title: "Error", description: "Failed to create lab order", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Patient *</Label>
        <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
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

      <div className="space-y-2">
        <Label>Lab *</Label>
        <Select
          value={formData.labId}
          onValueChange={(value) => {
            const lab = labInterfaces.find((l) => l.id === value)
            setFormData({ ...formData, labId: value, labName: lab?.lab_name || "" })
          }}
          // Disable the select if no active interfaces support orders
          disabled={labInterfaces.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select laboratory" />
          </SelectTrigger>
          <SelectContent>
            {labInterfaces.length > 0 ? (
              labInterfaces.map((lab) => (
                <SelectItem key={lab.id} value={lab.id}>
                  {lab.lab_name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="manual" disabled>
                No active lab interfaces with order support
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {labInterfaces.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Configure an active lab interface with order support in the Lab Interfaces tab first.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tests *</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.testNames.map((test, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {test}
              <button onClick={() => handleRemoveTest(index)} className="ml-1 hover:text-destructive">
                ×
              </button>
            </Badge>
          ))}
        </div>
        <Select onValueChange={(value) => handleAddTest(commonTests.find((t) => t.code === value)!)}>
          <SelectTrigger>
            <SelectValue placeholder="Add test from common tests" />
          </SelectTrigger>
          <SelectContent>
            {commonTests.map((test) => (
              <SelectItem key={test.code} value={test.code}>
                {test.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="stat">STAT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Specimen Type</Label>
          <Select
            value={formData.specimenType}
            onValueChange={(value) => setFormData({ ...formData, specimenType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blood">Blood</SelectItem>
              <SelectItem value="urine">Urine</SelectItem>
              <SelectItem value="serum">Serum</SelectItem>
              <SelectItem value="plasma">Plasma</SelectItem>
              <SelectItem value="swab">Swab</SelectItem>
              <SelectItem value="stool">Stool</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional instructions or clinical information..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || (labInterfaces.length === 0 && formData.labId === "")}>
          {isSubmitting ? "Creating..." : "Create Lab Order"}
        </Button>
      </div>
    </div>
  )
}
