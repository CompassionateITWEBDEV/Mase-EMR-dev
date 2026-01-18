"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Camera,
  Scale,
  User,
  FileText,
  Shield,
  RefreshCw,
  RotateCcw,
  Box,
  AlertTriangle,
  Plus,
} from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TakehomeOrder {
  id: number
  patient_id: number
  patient_name: string
  days: number
  daily_dose_mg: number
  start_date: string
  end_date: string
  risk_level: string
  status: string
  created_at: string
}

interface Patient {
  id: string | number
  name: string
}

export default function TakeHomePage() {
  const [activeTab, setActiveTab] = useState("orders")
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedDays, setSelectedDays] = useState("")
  const [selectedRisk, setSelectedRisk] = useState("")
  const [returnBottleUid, setReturnBottleUid] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [newKitOpen, setNewKitOpen] = useState(false)
  const [newReturnOpen, setNewReturnOpen] = useState(false)
  const [inspectionData, setInspectionData] = useState({
    seal_intact: true,
    residue_ml_est: 0,
    notes: "",
    outcome: "ok",
  })

  // Kit creation state
  const [kitData, setKitData] = useState({
    patient_id: "",
    days: "7",
    seal_batch: "",
    bottles: [] as { bottle_uid: string; dose_mg: number; day_date: string }[],
  })

  // Fetch data using SWR
  const { data: ordersData, error: ordersError, mutate: mutateOrders } = useSWR("/api/takehome/orders", fetcher)
  const { data: patientsData } = useSWR("/api/takehome/patients", fetcher)
  const { data: kitsData, mutate: mutateKits } = useSWR("/api/takehome/kits", fetcher)
  const { data: holdsData, mutate: mutateHolds } = useSWR("/api/takehome/holds", fetcher)
  const { data: returnsData, mutate: mutateReturns } = useSWR("/api/takehome/returns/intake", fetcher)

  const orders: TakehomeOrder[] = ordersData?.orders || []
  const patients: Patient[] = patientsData?.patients || []
  const kits = kitsData?.kits || []
  const holds = holdsData?.holds || []
  const returns = returnsData?.returns || []

  const isLoading = !ordersData && !ordersError

  const createTakehomeOrder = async () => {
    if (!selectedPatient || !selectedDays || !selectedRisk) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/takehome/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient,
          days: Number.parseInt(selectedDays),
          risk_level: selectedRisk,
          start_date: new Date().toISOString().split("T")[0],
          daily_dose_mg: 80,
        }),
      })

      if (response.ok) {
        mutateOrders()
        setNewOrderOpen(false)
        setSelectedPatient("")
        setSelectedDays("")
        setSelectedRisk("")
        toast.success("Take-home order created successfully")
      }
    } catch (error) {
      console.error("[v0] Order creation failed:", error)
      toast.error("Failed to create order")
    } finally {
      setIsCreating(false)
    }
  }

  const issueKit = async (orderId: number) => {
    try {
      const response = await fetch(`/api/takehome/kits/${orderId}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        mutateKits()
        mutateOrders()
        toast.success("Kit issued successfully")
      }
    } catch (error) {
      console.error("[v0] Kit issuance failed:", error)
      toast.error("Failed to issue kit")
    }
  }

  const createKit = async () => {
    if (!kitData.patient_id || !kitData.days) return

    setIsCreating(true)
    try {
      // Generate bottles for the kit
      const days = Number.parseInt(kitData.days)
      const bottles = []
      const startDate = new Date()

      for (let i = 0; i < days; i++) {
        const dayDate = new Date(startDate)
        dayDate.setDate(dayDate.getDate() + i)
        bottles.push({
          bottle_uid: `BTL-${Date.now()}-${i + 1}`,
          dose_mg: 80,
          day_date: dayDate.toISOString().split("T")[0],
        })
      }

      const response = await fetch("/api/takehome/kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: kitData.patient_id,
          days,
          seal_batch: kitData.seal_batch || `SB-${new Date().getFullYear()}-${Date.now()}`,
          bottles,
        }),
      })

      if (response.ok) {
        mutateKits()
        setNewKitOpen(false)
        setKitData({ patient_id: "", days: "7", seal_batch: "", bottles: [] })
        toast.success("Kit created successfully")
      }
    } catch (error) {
      console.error("[v0] Kit creation failed:", error)
      toast.error("Failed to create kit")
    } finally {
      setIsCreating(false)
    }
  }

  const handleReturnIntake = async () => {
    if (!returnBottleUid) {
      toast.error("Please enter a bottle UID")
      return
    }

    try {
      const response = await fetch("/api/takehome/returns/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bottle_uid: returnBottleUid,
          ...inspectionData,
        }),
      })

      if (response.ok) {
        mutateKits()
        mutateReturns()
        setReturnBottleUid("")
        setInspectionData({
          seal_intact: true,
          residue_ml_est: 0,
          notes: "",
          outcome: "ok",
        })
        setNewReturnOpen(false)
        toast.success("Return processed successfully")
      }
    } catch (error) {
      console.error("[v0] Return intake failed:", error)
      toast.error("Failed to process return")
    }
  }

  const clearHold = async (holdId: string, notes: string) => {
    try {
      const response = await fetch("/api/takehome/holds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: holdId,
          action: "clear",
          notes,
          cleared_by: "Counselor",
        }),
      })

      if (response.ok) {
        mutateHolds()
        toast.success("Hold cleared successfully")
      }
    } catch (error) {
      console.error("[v0] Failed to clear hold:", error)
      toast.error("Failed to clear hold")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Take-Home Management</h1>
              <p className="text-muted-foreground">Manage take-home methadone orders, kits, returns, and compliance</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  mutateOrders()
                  mutateKits()
                  mutateHolds()
                  mutateReturns()
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Dialog open={newReturnOpen} onOpenChange={setNewReturnOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Record Return
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Bottle Return</DialogTitle>
                    <DialogDescription>Process a returned take-home bottle</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bottle_uid">Bottle UID</Label>
                      <Input
                        id="bottle_uid"
                        value={returnBottleUid}
                        onChange={(e) => setReturnBottleUid(e.target.value)}
                        placeholder="Scan or enter bottle UID"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="seal_intact"
                        checked={inspectionData.seal_intact}
                        onCheckedChange={(checked) =>
                          setInspectionData({ ...inspectionData, seal_intact: checked as boolean })
                        }
                      />
                      <Label htmlFor="seal_intact">Seal Intact</Label>
                    </div>
                    <div>
                      <Label htmlFor="residue">Residue (ml)</Label>
                      <Input
                        id="residue"
                        type="number"
                        value={inspectionData.residue_ml_est}
                        onChange={(e) =>
                          setInspectionData({
                            ...inspectionData,
                            residue_ml_est: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="outcome">Outcome</Label>
                      <Select
                        value={inspectionData.outcome}
                        onValueChange={(value) => setInspectionData({ ...inspectionData, outcome: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ok">OK - Normal Return</SelectItem>
                          <SelectItem value="tampered">Tampered - Investigation Required</SelectItem>
                          <SelectItem value="missing">Missing Doses</SelectItem>
                          <SelectItem value="damaged">Damaged Container</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={inspectionData.notes}
                        onChange={(e) => setInspectionData({ ...inspectionData, notes: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                    <Button className="w-full" onClick={handleReturnIntake}>
                      Process Return
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={newKitOpen} onOpenChange={setNewKitOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Box className="w-4 h-4 mr-2" />
                    New Kit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Take-Home Kit</DialogTitle>
                    <DialogDescription>Prepare a new take-home medication kit for a patient</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="kit_patient">Patient</Label>
                      <Select
                        value={kitData.patient_id}
                        onValueChange={(value) => setKitData({ ...kitData, patient_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No patients found
                            </SelectItem>
                          ) : (
                            patients.map((patient) => (
                              <SelectItem key={patient.id} value={String(patient.id)}>
                                {patient.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="kit_days">Number of Days</Label>
                      <Select value={kitData.days} onValueChange={(value) => setKitData({ ...kitData, days: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select days" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="2">2 days</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="6">6 days (Sunday)</SelectItem>
                          <SelectItem value="7">7 days (Weekly)</SelectItem>
                          <SelectItem value="13">13 days (Bi-weekly)</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="27">27 days (Monthly)</SelectItem>
                          <SelectItem value="28">28 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="seal_batch">Seal Batch Number</Label>
                      <Input
                        id="seal_batch"
                        value={kitData.seal_batch}
                        onChange={(e) => setKitData({ ...kitData, seal_batch: e.target.value })}
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <Button className="w-full" onClick={createKit} disabled={!kitData.patient_id || isCreating}>
                      {isCreating ? "Creating..." : "Create Kit"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Package className="w-4 h-4 mr-2" />
                    New Order
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Take-Home Order</DialogTitle>
                    <DialogDescription>Create a new take-home methadone order for a patient</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="patient">Patient</Label>
                      <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No patients found
                            </SelectItem>
                          ) : (
                            patients.map((patient) => (
                              <SelectItem key={patient.id} value={String(patient.id)}>
                                {patient.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="days">Days</Label>
                      <Select value={selectedDays} onValueChange={setSelectedDays}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select days" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="28">28 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="risk">Risk Level</Label>
                      <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full"
                      onClick={createTakehomeOrder}
                      disabled={!selectedPatient || !selectedDays || !selectedRisk || isCreating}
                    >
                      {isCreating ? "Creating..." : "Create Order"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Issued Kits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kits.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Holds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{holds.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{returns.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="kits">Kits</TabsTrigger>
              <TabsTrigger value="returns">Returns</TabsTrigger>
              <TabsTrigger value="holds">Compliance Holds</TabsTrigger>
              <TabsTrigger value="intake">Return Intake</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              {isLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-10 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Take-Home Orders</p>
                    <p className="text-muted-foreground">Create a new order to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <User className="w-5 h-5" />
                              {order.patient_name}
                            </CardTitle>
                            <CardDescription>
                              {order.days} days - {order.daily_dose_mg}mg daily - {order.start_date} to {order.end_date}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                order.risk_level === "high"
                                  ? "destructive"
                                  : order.risk_level === "low"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {order.risk_level} risk
                            </Badge>
                            <Badge variant={order.status === "active" ? "default" : "secondary"}>{order.status}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Created: {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          {order.status === "pending" && (
                            <Button onClick={() => issueKit(order.id)}>
                              <Package className="w-4 h-4 mr-2" />
                              Issue Kit
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="kits" className="space-y-4">
              {kits.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Box className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Kits Issued</p>
                    <p className="text-muted-foreground">Create a new kit to see it here</p>
                    <Button className="mt-4" onClick={() => setNewKitOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Kit
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {kits.map((kit: any) => (
                    <Card key={kit.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Box className="w-5 h-5" />
                            Kit #{kit.id} - {kit.patient_name}
                          </CardTitle>
                          <Badge variant={kit.status === "issued" ? "default" : "secondary"}>{kit.status}</Badge>
                        </div>
                        <CardDescription>
                          Issued: {new Date(kit.issue_time).toLocaleString()} | Seal Batch: {kit.seal_batch}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Doses ({kit.doses?.length || 0} bottles):</div>
                          <div className="grid gap-2 max-h-48 overflow-y-auto">
                            {kit.doses?.map((dose: any) => (
                              <div
                                key={dose.id}
                                className="flex items-center justify-between p-2 border rounded text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{dose.day_date}</span>
                                  <span className="text-muted-foreground">
                                    {dose.dose_mg}mg ({dose.dose_ml}ml)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      dose.status === "returned"
                                        ? "default"
                                        : dose.status === "dispensed"
                                          ? "secondary"
                                          : "outline"
                                    }
                                  >
                                    {dose.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground font-mono">{dose.bottle_uid}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="returns" className="space-y-4">
              {returns.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <RotateCcw className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Returns Recorded</p>
                    <p className="text-muted-foreground">Process a return to see it here</p>
                    <Button className="mt-4" onClick={() => setNewReturnOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Record Return
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {returns.map((ret: any) => (
                    <Card key={ret.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5" />
                            Return #{ret.id}
                          </CardTitle>
                          <Badge variant={ret.type === "return" ? "default" : "secondary"}>{ret.type}</Badge>
                        </div>
                        <CardDescription>
                          {new Date(ret.at_time).toLocaleString()} | Processed by: {ret.by_user}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Quantity:</span> {ret.qty_ml}ml
                            </div>
                          </div>
                          {ret.reason && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Notes:</span> {ret.reason}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="holds" className="space-y-4">
              {holds.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Compliance Holds</p>
                    <p className="text-muted-foreground">All patients are in good standing</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {holds.map((hold: any) => (
                    <Card key={hold.id} className="border-red-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-5 h-5" />
                            Compliance Hold - {hold.patient_name}
                          </CardTitle>
                          <Badge variant="destructive">{hold.status}</Badge>
                        </div>
                        <CardDescription>
                          Reason: {hold.reason_code?.replace("_", " ")} - Opened:{" "}
                          {new Date(hold.opened_time).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <div>Opened by: {hold.opened_by}</div>
                            {hold.requires_counselor && (
                              <div className="text-amber-600 font-medium">Counselor clearance required</div>
                            )}
                            {hold.reason && <div className="text-muted-foreground mt-1">{hold.reason}</div>}
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Clear Hold
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Clear Compliance Hold</DialogTitle>
                                  <DialogDescription>Document clearance for {hold.patient_name}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="clearance_notes">Clearance Notes</Label>
                                    <Textarea
                                      id="clearance_notes"
                                      placeholder="Document the reason for clearing this hold..."
                                    />
                                  </div>
                                  <Button
                                    className="w-full"
                                    onClick={() => {
                                      const notes = (document.getElementById("clearance_notes") as HTMLTextAreaElement)
                                        ?.value
                                      clearHold(hold.id, notes)
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Clear Hold
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="intake" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Bottle Return Intake Station
                  </CardTitle>
                  <CardDescription>Scan and inspect returned take-home bottles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="scan_bottle">Scan Bottle UID</Label>
                        <div className="flex gap-2">
                          <Input
                            id="scan_bottle"
                            value={returnBottleUid}
                            onChange={(e) => setReturnBottleUid(e.target.value)}
                            placeholder="Scan barcode or enter UID"
                          />
                          <Button variant="outline">
                            <Camera className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="intake_seal_intact"
                          checked={inspectionData.seal_intact}
                          onCheckedChange={(checked) =>
                            setInspectionData({ ...inspectionData, seal_intact: checked as boolean })
                          }
                        />
                        <Label htmlFor="intake_seal_intact">Tamper-evident seal intact</Label>
                      </div>

                      <div>
                        <Label htmlFor="intake_residue">Estimated Residue (ml)</Label>
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-muted-foreground" />
                          <Input
                            id="intake_residue"
                            type="number"
                            step="0.1"
                            value={inspectionData.residue_ml_est}
                            onChange={(e) =>
                              setInspectionData({
                                ...inspectionData,
                                residue_ml_est: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="intake_outcome">Inspection Outcome</Label>
                        <Select
                          value={inspectionData.outcome}
                          onValueChange={(value) => setInspectionData({ ...inspectionData, outcome: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ok">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                OK - Normal Return
                              </div>
                            </SelectItem>
                            <SelectItem value="tampered">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                Tampered - Investigation Required
                              </div>
                            </SelectItem>
                            <SelectItem value="missing">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Missing Doses
                              </div>
                            </SelectItem>
                            <SelectItem value="damaged">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-orange-500" />
                                Damaged Container
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="intake_notes">Notes</Label>
                        <Textarea
                          id="intake_notes"
                          value={inspectionData.notes}
                          onChange={(e) => setInspectionData({ ...inspectionData, notes: e.target.value })}
                          placeholder="Additional observations..."
                        />
                      </div>

                      <Button className="w-full" onClick={handleReturnIntake} disabled={!returnBottleUid}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Intake
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <Alert>
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>
                          Inspect each bottle carefully. Report any signs of tampering, unusual residue levels, or
                          damage immediately.
                        </AlertDescription>
                      </Alert>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Inspection Checklist</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Verify bottle UID matches patient record</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Check tamper-evident seal integrity</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Measure and record residue level</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Inspect for signs of tampering or damage</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Document any abnormalities</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
