"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import useSWR from "swr"
import {
  Syringe,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  Shield,
  Activity,
  User,
  Droplets,
  CheckCircle,
  XCircle,
  Scan,
  RotateCcw,
  Trash2,
  FlaskConical,
  RefreshCw,
} from "lucide-react"

interface DoseOrder {
  id: number
  patient_id: number
  patient_name: string
  mrn: string
  daily_dose_mg: number
  max_takehome: number
  prescriber_id: string
  status: "active" | "inactive" | "discontinued"
  start_date: string
  stop_date?: string
  dob?: string
}

interface Bottle {
  id: number
  lot_number: string
  expiration_date: string
  current_volume_ml: number
  initial_volume_ml: number
  concentration_mg_ml: number
  status: string
}

interface Device {
  id: number
  name: string
  location: string
  status: "online" | "offline" | "calibrating"
  last_calibration: string
}

interface DoseEvent {
  id: number
  patient_name: string
  dispensed_mg: number
  dispensed_ml: number
  outcome: string
  time: string
  by_user: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DispensingPage() {
  const [selectedOrder, setSelectedOrder] = useState<DoseOrder | null>(null)
  const [dispensingInProgress, setDispensingInProgress] = useState(false)
  const [dispenseAmount, setDispenseAmount] = useState("")
  const [witnessSignature, setWitnessSignature] = useState("")
  const [dispenseNotes, setDispenseNotes] = useState("")

  const [showBottleOnboarding, setShowBottleOnboarding] = useState(false)
  const [showShiftCount, setShowShiftCount] = useState(false)
  const [showWastage, setShowWastage] = useState(false)
  const [showBottleChangeover, setShowBottleChangeover] = useState(false)
  const [nurseAuthenticated, setNurseAuthenticated] = useState(false)
  const [nurseBadge, setNurseBadge] = useState("")
  const [nursePIN, setNursePIN] = useState("")
  const [mfaVerified, setMfaVerified] = useState(false)

  const [newBottle, setNewBottle] = useState({
    lotNumber: "",
    expDate: "",
    startVolume: "",
    concentration: "10",
    deviceLocation: "",
    verifier1: "",
    verifier2: "",
  })

  const [shiftCount, setShiftCount] = useState({
    openingVolume: "",
    closingVolume: "",
    physicalCount: "",
    variance: 0,
    varianceReason: "",
    supervisor1: "",
    supervisor2: "",
  })

  const [wastage, setWastage] = useState({
    volume: "",
    reason: "",
    witness1: "",
    witness2: "",
  })

  const { data: ordersData, error: ordersError, mutate: mutateOrders } = useSWR("/api/dispensing/orders", fetcher)
  const { data: bottlesData, error: bottlesError } = useSWR("/api/dispensing/bottles", fetcher)
  const { data: devicesData, error: devicesError } = useSWR("/api/dispensing/devices", fetcher)
  const { data: eventsData, mutate: mutateEvents } = useSWR("/api/dispensing/events", fetcher)

  const activeOrders: DoseOrder[] = ordersData?.orders || []
  const activeBottles: Bottle[] = bottlesData?.bottles || []
  const devices: Device[] = devicesData?.devices || []
  const recentEvents: DoseEvent[] = eventsData?.events || []
  const currentDevice = devices[0]

  const isLoading = !ordersData && !ordersError

  const handleNurseAuth = () => {
    if (nurseBadge && nursePIN) {
      setNurseAuthenticated(true)
    }
  }

  const handleDispense = async (order: DoseOrder) => {
    if (!nurseAuthenticated || !mfaVerified) {
      alert("MFA authentication required for dose execution")
      return
    }

    if (!witnessSignature) {
      alert("Witness signature required")
      return
    }

    setSelectedOrder(order)
    setDispensingInProgress(true)

    try {
      const response = await fetch("/api/dose/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: order.patient_id,
          order_id: order.id,
          requested_mg: order.daily_dose_mg,
          witness_signature: witnessSignature,
          notes: dispenseNotes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Dose dispensed successfully: ${order.daily_dose_mg}mg`)
        mutateOrders()
        mutateEvents()
      } else {
        alert(`Dispense failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Dispense error:", error)
      alert("Failed to dispense dose")
    } finally {
      setDispensingInProgress(false)
      setSelectedOrder(null)
      setWitnessSignature("")
      setDispenseNotes("")
    }
  }

  const handleBottleOnboarding = async () => {
    if (!newBottle.verifier1 || !newBottle.verifier2) {
      alert("Two-person verification required")
      return
    }

    try {
      const response = await fetch("/api/dispensing/bottles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lot_number: newBottle.lotNumber,
          expiration_date: newBottle.expDate,
          initial_volume_ml: Number.parseFloat(newBottle.startVolume),
          concentration_mg_ml: Number.parseFloat(newBottle.concentration),
          verifier1: newBottle.verifier1,
          verifier2: newBottle.verifier2,
        }),
      })

      if (response.ok) {
        alert("Bottle onboarded successfully!")
        setShowBottleOnboarding(false)
        setNewBottle({
          lotNumber: "",
          expDate: "",
          startVolume: "",
          concentration: "10",
          deviceLocation: "",
          verifier1: "",
          verifier2: "",
        })
      }
    } catch (error) {
      alert("Failed to onboard bottle")
    }
  }

  const handleShiftCount = () => {
    const opening = Number.parseFloat(shiftCount.openingVolume) || 0
    const closing = Number.parseFloat(shiftCount.closingVolume) || 0
    const physical = Number.parseFloat(shiftCount.physicalCount) || 0
    const computed = opening - closing
    const variance = physical - computed

    if (Math.abs(variance) > 5.0) {
      if (!shiftCount.varianceReason || !shiftCount.supervisor1 || !shiftCount.supervisor2) {
        alert("Variance exceeds tolerance. Reason and two signatures required.")
        return
      }
    }

    alert("Shift count recorded successfully!")
    setShowShiftCount(false)
  }

  const handleWastage = async () => {
    if (!wastage.witness1 || !wastage.witness2) {
      alert("Two witness signatures required for wastage")
      return
    }

    try {
      const response = await fetch("/api/dispensing/wastage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volume_ml: Number.parseFloat(wastage.volume),
          reason: wastage.reason,
          witness1: wastage.witness1,
          witness2: wastage.witness2,
        }),
      })

      if (response.ok) {
        alert("Wastage recorded successfully!")
        setShowWastage(false)
        setWastage({ volume: "", reason: "", witness1: "", witness2: "" })
      }
    } catch (error) {
      alert("Failed to record wastage")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto py-6 px-4 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Methadone Dispensing</h1>
              <p className="text-muted-foreground">Manage dose orders and monitor dispensing device</p>
            </div>
            <div className="flex items-center space-x-2">
              {nurseAuthenticated && mfaVerified ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <User className="w-3 h-3 mr-1" />
                  Authenticated + MFA
                </Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setMfaVerified(true)}>
                  <Shield className="w-4 h-4 mr-2" />
                  Complete MFA
                </Button>
              )}

              {currentDevice?.status === "online" ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Wifi className="w-3 h-3 mr-1" />
                  Device Online
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Device Offline
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowBottleOnboarding(true)}>
              <Scan className="w-4 h-4 mr-2" />
              Bottle Onboarding
            </Button>
            <Button variant="outline" onClick={() => setShowShiftCount(true)}>
              <Clock className="w-4 h-4 mr-2" />
              Shift Count
            </Button>
            <Button variant="outline" onClick={() => setShowWastage(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Record Wastage
            </Button>
            <Button variant="outline" onClick={() => setShowBottleChangeover(true)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Bottle Changeover
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeOrders.length}</div>
                <p className="text-xs text-muted-foreground">Pending today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doses Dispensed</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentEvents.length}</div>
                <p className="text-xs text-muted-foreground">Today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bottles</CardTitle>
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeBottles.length}</div>
                <p className="text-xs text-muted-foreground">In use</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Device Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{currentDevice?.status || "Unknown"}</div>
                <p className="text-xs text-muted-foreground">{currentDevice?.name || "No device"}</p>
              </CardContent>
            </Card>
          </div>

          {!nurseAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle>Nurse Authentication</CardTitle>
                <CardDescription>Authenticate to enable dispensing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Badge ID</Label>
                    <Input
                      value={nurseBadge}
                      onChange={(e) => setNurseBadge(e.target.value)}
                      placeholder="Enter badge ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PIN</Label>
                    <Input
                      type="password"
                      value={nursePIN}
                      onChange={(e) => setNursePIN(e.target.value)}
                      placeholder="Enter PIN"
                    />
                  </div>
                </div>
                <Button onClick={handleNurseAuth}>Authenticate</Button>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">Dose Orders</TabsTrigger>
              <TabsTrigger value="history">Recent Dispensing</TabsTrigger>
              <TabsTrigger value="bottles">Bottle Inventory</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : activeOrders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Syringe className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active dose orders</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="space-y-1">
                          <p className="font-semibold">{order.patient_name}</p>
                          <p className="text-sm text-muted-foreground">MRN: {order.mrn}</p>
                          <Badge variant="outline">{order.daily_dose_mg}mg daily</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="space-y-2">
                            <Input
                              placeholder="Witness signature"
                              value={selectedOrder?.id === order.id ? witnessSignature : ""}
                              onChange={(e) => {
                                setSelectedOrder(order)
                                setWitnessSignature(e.target.value)
                              }}
                              className="w-48"
                            />
                          </div>
                          <Button
                            onClick={() => handleDispense(order)}
                            disabled={!nurseAuthenticated || !mfaVerified || dispensingInProgress}
                          >
                            {dispensingInProgress && selectedOrder?.id === order.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Dispensing...
                              </>
                            ) : (
                              <>
                                <Syringe className="w-4 h-4 mr-2" />
                                Dispense
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {recentEvents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No recent dispensing events</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {recentEvents.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{event.patient_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.dispensed_mg}mg ({event.dispensed_ml}ml) - {event.by_user}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.outcome === "success" ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              {event.outcome}
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.time).toLocaleTimeString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bottles" className="space-y-4">
              {activeBottles.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active bottles</p>
                    <Button className="mt-4" onClick={() => setShowBottleOnboarding(true)}>
                      <Scan className="w-4 h-4 mr-2" />
                      Onboard New Bottle
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeBottles.map((bottle) => (
                    <Card key={bottle.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">Lot: {bottle.lot_number}</CardTitle>
                        <CardDescription>
                          Expires: {new Date(bottle.expiration_date).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Volume Remaining</span>
                            <span>
                              {bottle.current_volume_ml}ml / {bottle.initial_volume_ml}ml
                            </span>
                          </div>
                          <Progress value={(bottle.current_volume_ml / bottle.initial_volume_ml) * 100} />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Concentration</span>
                          <span>{bottle.concentration_mg_ml}mg/ml</span>
                        </div>
                        <Badge variant={bottle.status === "active" ? "default" : "secondary"}>{bottle.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="devices" className="space-y-4">
              {devices.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No devices configured</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {devices.map((device) => (
                    <Card key={device.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {device.status === "online" ? (
                            <Wifi className="w-5 h-5 text-green-500" />
                          ) : (
                            <WifiOff className="w-5 h-5 text-red-500" />
                          )}
                          {device.name}
                        </CardTitle>
                        <CardDescription>{device.location}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Status</span>
                            <Badge variant={device.status === "online" ? "default" : "destructive"}>
                              {device.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Last Calibration</span>
                            <span>{new Date(device.last_calibration).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Bottle Onboarding Dialog */}
          <Dialog open={showBottleOnboarding} onOpenChange={setShowBottleOnboarding}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bottle Onboarding</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Lot Number</Label>
                    <Input
                      value={newBottle.lotNumber}
                      onChange={(e) => setNewBottle({ ...newBottle, lotNumber: e.target.value })}
                      placeholder="Scan or enter lot number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <Input
                      type="date"
                      value={newBottle.expDate}
                      onChange={(e) => setNewBottle({ ...newBottle, expDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Starting Volume (ml)</Label>
                    <Input
                      type="number"
                      value={newBottle.startVolume}
                      onChange={(e) => setNewBottle({ ...newBottle, startVolume: e.target.value })}
                      placeholder="Enter volume"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Concentration (mg/ml)</Label>
                    <Select
                      value={newBottle.concentration}
                      onValueChange={(v) => setNewBottle({ ...newBottle, concentration: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 mg/ml</SelectItem>
                        <SelectItem value="40">40 mg/ml</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Verifier 1 Signature</Label>
                    <Input
                      value={newBottle.verifier1}
                      onChange={(e) => setNewBottle({ ...newBottle, verifier1: e.target.value })}
                      placeholder="First verifier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Verifier 2 Signature</Label>
                    <Input
                      value={newBottle.verifier2}
                      onChange={(e) => setNewBottle({ ...newBottle, verifier2: e.target.value })}
                      placeholder="Second verifier"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBottleOnboarding(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBottleOnboarding}>Complete Onboarding</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Shift Count Dialog */}
          <Dialog open={showShiftCount} onOpenChange={setShowShiftCount}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Shift Count</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Opening Volume (ml)</Label>
                    <Input
                      type="number"
                      value={shiftCount.openingVolume}
                      onChange={(e) => setShiftCount({ ...shiftCount, openingVolume: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Closing Volume (ml)</Label>
                    <Input
                      type="number"
                      value={shiftCount.closingVolume}
                      onChange={(e) => setShiftCount({ ...shiftCount, closingVolume: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Physical Count (ml)</Label>
                    <Input
                      type="number"
                      value={shiftCount.physicalCount}
                      onChange={(e) => setShiftCount({ ...shiftCount, physicalCount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Variance Reason (if applicable)</Label>
                  <Textarea
                    value={shiftCount.varianceReason}
                    onChange={(e) => setShiftCount({ ...shiftCount, varianceReason: e.target.value })}
                    placeholder="Explain any variance"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Supervisor 1 Signature</Label>
                    <Input
                      value={shiftCount.supervisor1}
                      onChange={(e) => setShiftCount({ ...shiftCount, supervisor1: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supervisor 2 Signature</Label>
                    <Input
                      value={shiftCount.supervisor2}
                      onChange={(e) => setShiftCount({ ...shiftCount, supervisor2: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowShiftCount(false)}>
                  Cancel
                </Button>
                <Button onClick={handleShiftCount}>Submit Count</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Wastage Dialog */}
          <Dialog open={showWastage} onOpenChange={setShowWastage}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Wastage</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Wastage Volume (ml)</Label>
                  <Input
                    type="number"
                    value={wastage.volume}
                    onChange={(e) => setWastage({ ...wastage, volume: e.target.value })}
                    placeholder="Enter volume wasted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason for Wastage</Label>
                  <Textarea
                    value={wastage.reason}
                    onChange={(e) => setWastage({ ...wastage, reason: e.target.value })}
                    placeholder="Describe reason for wastage"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Witness 1 Signature</Label>
                    <Input
                      value={wastage.witness1}
                      onChange={(e) => setWastage({ ...wastage, witness1: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Witness 2 Signature</Label>
                    <Input
                      value={wastage.witness2}
                      onChange={(e) => setWastage({ ...wastage, witness2: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWastage(false)}>
                  Cancel
                </Button>
                <Button onClick={handleWastage}>Record Wastage</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bottle Changeover Dialog */}
          <Dialog open={showBottleChangeover} onOpenChange={setShowBottleChangeover}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bottle Changeover</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Ensure all dispensing is complete before changing bottles. Record final volume of outgoing bottle.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  Follow the bottle changeover procedure to swap the current bottle with a new one. This requires
                  two-person verification.
                </p>
                <Button onClick={() => setShowBottleOnboarding(true)} className="w-full">
                  Start Changeover Process
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBottleChangeover(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
