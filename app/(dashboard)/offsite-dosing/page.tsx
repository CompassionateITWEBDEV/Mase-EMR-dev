"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Building2,
  Package,
  Truck,
  ClipboardCheck,
  AlertTriangle,
  Plus,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  QrCode,
  Video,
  ShoppingCart,
  FileCheck,
  Shield,
  Camera,
} from "lucide-react"

export default function OffsiteDosing() {
  const [activeTab, setActiveTab] = useState("overview")
  const [locations, setLocations] = useState<any[]>([])
  const [activeKits, setActiveKits] = useState<any[]>([])
  const [pendingAdministrations, setPendingAdministrations] = useState<any[]>([])
  const [dispensingLog, setDispensingLog] = useState<any[]>([])
  const [stats, setStats] = useState({
    activeLocations: 8,
    activeKits: 15,
    todayDoses: 42,
    administeredToday: 38,
    missedToday: 2,
    inTransit: 3,
  })

  useEffect(() => {
    // Fetch data
    fetchLocations()
    fetchActiveKits()
    fetchPendingAdministrations()
    fetchDispensingLog()
  }, [])

  const fetchLocations = async () => {
    // Mock data - replace with actual API call
    setLocations([
      {
        id: "1",
        facility_name: "Sunrise Senior Living",
        facility_type: "nursing_home",
        city: "Springfield",
        state: "IL",
        active_patients: 5,
        status: "active",
        contact_person_name: "Mary Johnson, RN",
        phone: "(555) 123-4567",
      },
      {
        id: "2",
        facility_name: "Riverside Rehabilitation Center",
        facility_type: "inpatient_facility",
        city: "Riverside",
        state: "IL",
        active_patients: 3,
        status: "active",
        contact_person_name: "David Chen, NP",
        phone: "(555) 234-5678",
      },
    ])
  }

  const fetchActiveKits = async () => {
    // Mock data
    setActiveKits([
      {
        id: "1",
        kit_number: "KIT-2024-001",
        patient_name: "Johnson, Robert",
        location_name: "Sunrise Senior Living",
        medication: "Methadone 10mg/ml",
        number_of_bottles: 7,
        start_date: "2024-01-14",
        end_date: "2024-01-20",
        kit_status: "in_use",
        doses_administered: 12,
        doses_remaining: 2,
        next_dose: "2024-01-15 08:00",
      },
      {
        id: "2",
        kit_number: "KIT-2024-002",
        patient_name: "Smith, Patricia",
        location_name: "Sunrise Senior Living",
        medication: "Buprenorphine 8mg",
        number_of_bottles: 7,
        start_date: "2024-01-13",
        end_date: "2024-01-19",
        kit_status: "in_transit",
        transported_by: "Nurse Williams",
        departed_at: "2024-01-14 07:30",
      },
    ])
  }

  const fetchPendingAdministrations = async () => {
    // Mock data
    setPendingAdministrations([
      {
        id: "1",
        patient_name: "Johnson, Robert",
        medication: "Methadone 40mg",
        scheduled_time: "08:00",
        location_name: "Sunrise Senior Living",
        status: "pending",
      },
      {
        id: "2",
        patient_name: "Smith, Patricia",
        medication: "Buprenorphine 8mg",
        scheduled_time: "08:30",
        location_name: "Sunrise Senior Living",
        status: "pending",
      },
    ])
  }

  const fetchDispensingLog = async () => {
    setDispensingLog([
      {
        id: "1",
        timestamp: "2024-01-15 08:05",
        patient_name: "Johnson, Robert",
        medication: "Methadone 40mg",
        facility_name: "Sunrise Senior Living",
        facility_nurse: "Mary Johnson, RN",
        qr_code_scanned: true,
        biometric_verified: true,
        biometric_confidence: 97.8,
        gps_verified: true,
        notes: "Patient tolerated dose well. No adverse effects observed.",
        verified_by_otp_staff: false,
      },
      {
        id: "2",
        timestamp: "2024-01-15 08:35",
        patient_name: "Smith, Patricia",
        medication: "Buprenorphine 8mg",
        facility_name: "Sunrise Senior Living",
        facility_nurse: "Mary Johnson, RN",
        qr_code_scanned: true,
        biometric_verified: true,
        biometric_confidence: 98.2,
        gps_verified: true,
        notes: "Patient reports improved craving control.",
        verified_by_otp_staff: true,
      },
    ])
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Off-Site Dosing Management</h1>
        <p className="text-muted-foreground">Manage medication delivery to nursing homes and inpatient facilities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLocations}</div>
            <p className="text-xs text-muted-foreground">Nursing homes & facilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Kits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeKits}</div>
            <p className="text-xs text-muted-foreground">In facilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">En route to facilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Doses</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayDoses}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.administeredToday}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.administeredToday / stats.todayDoses) * 100).toFixed(0)}% completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.missedToday}</div>
            <p className="text-xs text-muted-foreground">Missed/Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="locations">
            <Building2 className="mr-2 h-4 w-4" />
            Facilities
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders & Resources
          </TabsTrigger>
          <TabsTrigger value="kits">
            <Package className="mr-2 h-4 w-4" />
            Medication Kits
          </TabsTrigger>
          <TabsTrigger value="telehealth">
            <Video className="mr-2 h-4 w-4" />
            Telehealth
          </TabsTrigger>
          <TabsTrigger value="dispensing">
            <QrCode className="mr-2 h-4 w-4" />
            Dispensing Log
          </TabsTrigger>
          <TabsTrigger value="verification">
            <FileCheck className="mr-2 h-4 w-4" />
            Note Verification
          </TabsTrigger>
          <TabsTrigger value="diversion">
            <Shield className="mr-2 h-4 w-4" />
            Diversion Sync
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pending Administrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Today's Pending Administrations
                </CardTitle>
                <CardDescription>Doses scheduled for today at facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingAdministrations.map((dose) => (
                    <div key={dose.id} className="flex items-start justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <div className="font-medium">{dose.patient_name}</div>
                        <div className="text-sm text-muted-foreground">{dose.medication}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {dose.location_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-amber-600">
                          <Clock className="mr-1 h-3 w-3" />
                          {dose.scheduled_time}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Kits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Active Medication Kits
                </CardTitle>
                <CardDescription>Kits currently at facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeKits
                    .filter((kit) => kit.kit_status === "in_use")
                    .map((kit) => (
                      <div key={kit.id} className="flex items-start justify-between rounded-lg border p-3">
                        <div className="space-y-1">
                          <div className="font-medium">{kit.kit_number}</div>
                          <div className="text-sm">{kit.patient_name}</div>
                          <div className="text-sm text-muted-foreground">{kit.medication}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {kit.location_name}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="outline" className="text-green-600">
                            In Use
                          </Badge>
                          <div className="text-xs text-muted-foreground">{kit.doses_remaining} doses left</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* In Transit Kits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Kits In Transit
              </CardTitle>
              <CardDescription>Medication being transported to facilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeKits
                  .filter((kit) => kit.kit_status === "in_transit")
                  .map((kit) => (
                    <div
                      key={kit.id}
                      className="flex items-start justify-between rounded-lg border border-amber-200 bg-amber-50 p-3"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{kit.kit_number}</div>
                        <div className="text-sm">{kit.patient_name}</div>
                        <div className="text-sm text-muted-foreground">{kit.medication}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          To: {kit.location_name}
                        </div>
                        <div className="text-xs text-amber-700">Transported by: {kit.transported_by}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className="bg-amber-500">
                          <Truck className="mr-1 h-3 w-3" />
                          In Transit
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Departed: {new Date(kit.departed_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facilities Tab */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search facilities..." className="pl-8" />
              </div>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Facility
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {locations.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{location.facility_name}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {location.facility_type.replace("_", " ").toUpperCase()}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {location.city}, {location.state}
                    </span>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium">Contact</div>
                    <div className="text-muted-foreground">{location.contact_person_name}</div>
                    <div className="text-muted-foreground">{location.phone}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">Active Patients</div>
                    <div className="font-semibold">{location.active_patients}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Package className="mr-2 h-4 w-4" />
                      New Kit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* New Order Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Submit New Order
                </CardTitle>
                <CardDescription>Request medication kits or supplies for facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label>Facility</Label>
                    <select className="w-full rounded-md border p-2">
                      <option>Sunrise Senior Living</option>
                      <option>Riverside Rehabilitation Center</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Order Type</Label>
                    <select className="w-full rounded-md border p-2">
                      <option>New Medication Kit</option>
                      <option>Bottle Replacement</option>
                      <option>Naloxone Supply</option>
                      <option>Disposal Container</option>
                      <option>QR Code Labels</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Patient (if applicable)</Label>
                    <Input placeholder="Search patient..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity/Details</Label>
                    <Input placeholder="e.g., 7 bottles for weekly supply" />
                  </div>

                  <div className="space-y-2">
                    <Label>Requested Delivery Date</Label>
                    <Input type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label>Special Instructions</Label>
                    <Textarea placeholder="Any special requirements or notes..." />
                  </div>

                  <Button className="w-full">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Submit Order
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Pending Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Orders</CardTitle>
                <CardDescription>Orders awaiting processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      id: "ORD-001",
                      facility: "Sunrise Senior Living",
                      type: "New Medication Kit",
                      patient: "Johnson, Robert",
                      requested: "2024-01-14",
                      delivery: "2024-01-16",
                      status: "preparing",
                    },
                    {
                      id: "ORD-002",
                      facility: "Riverside Rehabilitation",
                      type: "Naloxone Supply",
                      requested: "2024-01-13",
                      delivery: "2024-01-15",
                      status: "approved",
                    },
                  ].map((order) => (
                    <div key={order.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{order.id}</div>
                          <div className="text-sm text-muted-foreground">{order.type}</div>
                        </div>
                        <Badge className={order.status === "approved" ? "bg-green-500" : "bg-amber-500"}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {order.facility}
                        </div>
                        {order.patient && <div>Patient: {order.patient}</div>}
                        <div>Delivery: {order.delivery}</div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          Track
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kits" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Medication Kits Management</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Kit
            </Button>
          </div>

          {/* Active Kits */}
          <Card>
            <CardHeader>
              <CardTitle>Active Medication Kits</CardTitle>
              <CardDescription>Pre-dispensed medication kits currently in use at facilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeKits.map((kit) => (
                  <div key={kit.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold">{kit.kit_number}</h3>
                          <Badge variant={kit.kit_status === "in_use" ? "default" : "secondary"}>
                            {kit.kit_status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{kit.patient_name}</p>
                        <p className="text-sm text-muted-foreground">{kit.location_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{kit.medication}</p>
                        <p className="text-xs text-muted-foreground">{kit.number_of_bottles} bottles</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Duration</p>
                        <p className="font-medium">{kit.start_date} to {kit.end_date}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Progress</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(kit.doses_administered / (kit.doses_administered + kit.doses_remaining)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-medium text-xs">{kit.doses_administered}/{kit.doses_administered + kit.doses_remaining}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Next Dose</p>
                        <p className="font-medium">{kit.next_dose}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        <FileCheck className="mr-1 h-4 w-4" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <QrCode className="mr-1 h-4 w-4" />
                        Print Labels
                      </Button>
                      <Button size="sm" variant="outline">
                        <ShoppingCart className="mr-1 h-4 w-4" />
                        Request Callback
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Kit Inventory Status */}
          <Card>
            <CardHeader>
              <CardTitle>Kit Inventory Status</CardTitle>
              <CardDescription>Available bottles and supplies for kit preparation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="h-8 w-8 text-blue-500" />
                    <Badge>In Stock</Badge>
                  </div>
                  <p className="text-2xl font-bold">247</p>
                  <p className="text-sm text-muted-foreground">Available Bottles</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Truck className="h-8 w-8 text-orange-500" />
                    <Badge variant="secondary">In Transit</Badge>
                  </div>
                  <p className="text-2xl font-bold">18</p>
                  <p className="text-sm text-muted-foreground">Kits in Transport</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    <Badge variant="destructive">Low Stock</Badge>
                  </div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Items Need Reorder</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telehealth" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Schedule Telehealth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Schedule Telehealth Consultation
                </CardTitle>
                <CardDescription>Remote consultations with facility staff or patients</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label>Consultation Type</Label>
                    <select className="w-full rounded-md border p-2">
                      <option>Patient Assessment</option>
                      <option>Dose Adjustment Review</option>
                      <option>Facility Nurse Consultation</option>
                      <option>Crisis Intervention</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Facility</Label>
                    <select className="w-full rounded-md border p-2">
                      <option>Sunrise Senior Living</option>
                      <option>Riverside Rehabilitation Center</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Input placeholder="Search patient..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for Consultation</Label>
                    <Textarea placeholder="Brief description..." />
                  </div>

                  <Button className="w-full">
                    <Video className="mr-2 h-4 w-4" />
                    Schedule Consultation
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Upcoming Consultations */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Consultations</CardTitle>
                <CardDescription>Scheduled telehealth sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      id: "1",
                      type: "Patient Assessment",
                      patient: "Johnson, Robert",
                      facility: "Sunrise Senior Living",
                      date: "2024-01-15",
                      time: "14:00",
                      provider: "Dr. Sarah Miller",
                    },
                    {
                      id: "2",
                      type: "Dose Adjustment Review",
                      patient: "Smith, Patricia",
                      facility: "Sunrise Senior Living",
                      date: "2024-01-16",
                      time: "10:30",
                      provider: "Dr. Michael Chen",
                    },
                  ].map((consult) => (
                    <div key={consult.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{consult.type}</div>
                          <div className="text-sm text-muted-foreground">{consult.patient}</div>
                        </div>
                        <Badge className="bg-blue-500">
                          <Video className="mr-1 h-3 w-3" />
                          Video
                        </Badge>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <div>
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {consult.facility}
                        </div>
                        <div>
                          {consult.date} at {consult.time}
                        </div>
                        <div>Provider: {consult.provider}</div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Video className="mr-2 h-3 w-3" />
                          Join Call
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dispensing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* QR Code Scanner Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Scan QR Code
                </CardTitle>
                <CardDescription>Facility nurses: Scan bottle QR code to document dispensing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
                  <div className="text-center space-y-2">
                    <Camera className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">Position QR code in camera view</p>
                  </div>
                </div>
                <Button className="w-full">
                  <QrCode className="mr-2 h-4 w-4" />
                  Activate Scanner
                </Button>
                <div className="text-xs text-muted-foreground">Or manually enter bottle number below</div>
                <Input placeholder="BOT-001-2025" />
                <Button variant="outline" className="w-full bg-transparent">
                  Manual Entry
                </Button>
              </CardContent>
            </Card>

            {/* Dispensing Log List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Today's Dispensing Log</CardTitle>
                <CardDescription>Documented medication administrations at facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dispensingLog.map((log) => (
                    <div
                      key={log.id}
                      className={`rounded-lg border p-3 space-y-2 ${
                        log.verified_by_otp_staff ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{log.patient_name}</div>
                          <div className="text-sm text-muted-foreground">{log.medication}</div>
                        </div>
                        <Badge className={log.verified_by_otp_staff ? "bg-green-500" : "bg-amber-500"}>
                          {log.verified_by_otp_staff ? "Verified" : "Pending Verification"}
                        </Badge>
                      </div>

                      <div className="text-xs space-y-1">
                        <div>
                          <Clock className="inline h-3 w-3 mr-1" />
                          {log.timestamp}
                        </div>
                        <div>
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {log.facility_name}
                        </div>
                        <div>Facility Nurse: {log.facility_nurse}</div>
                      </div>

                      {/* Verification Badges */}
                      <div className="flex flex-wrap gap-2">
                        {log.qr_code_scanned && (
                          <Badge variant="outline" className="text-green-600">
                            <QrCode className="mr-1 h-3 w-3" />
                            QR Scanned
                          </Badge>
                        )}
                        {log.biometric_verified && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Biometric {log.biometric_confidence}%
                          </Badge>
                        )}
                        {log.gps_verified && (
                          <Badge variant="outline" className="text-green-600">
                            <MapPin className="mr-1 h-3 w-3" />
                            GPS Verified
                          </Badge>
                        )}
                      </div>

                      {log.notes && (
                        <div className="text-sm bg-white rounded p-2 border">
                          <div className="font-medium text-xs text-muted-foreground mb-1">Nurse Notes:</div>
                          {log.notes}
                        </div>
                      )}

                      {!log.verified_by_otp_staff && (
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <FileCheck className="mr-2 h-3 w-3" />
                          Verify & Approve
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Facility Nurse Note Verification
              </CardTitle>
              <CardDescription>Review and verify documentation from facility nurses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dispensingLog
                  .filter((log) => !log.verified_by_otp_staff)
                  .map((log) => (
                    <Card key={log.id} className="border-amber-200 bg-amber-50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{log.patient_name}</CardTitle>
                            <CardDescription>{log.medication}</CardDescription>
                          </div>
                          <Badge className="bg-amber-500">Awaiting Verification</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Facility</div>
                            <div className="text-muted-foreground">{log.facility_name}</div>
                          </div>
                          <div>
                            <div className="font-medium">Facility Nurse</div>
                            <div className="text-muted-foreground">{log.facility_nurse}</div>
                          </div>
                          <div>
                            <div className="font-medium">Administration Time</div>
                            <div className="text-muted-foreground">{log.timestamp}</div>
                          </div>
                          <div>
                            <div className="font-medium">Verification Status</div>
                            <div className="flex gap-1">
                              {log.qr_code_scanned && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                              {log.biometric_verified && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                              {log.gps_verified && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-white p-3 border">
                          <div className="font-medium text-sm mb-2">Facility Nurse Documentation:</div>
                          <div className="text-sm text-muted-foreground">{log.notes}</div>
                        </div>

                        <div className="space-y-2">
                          <Label>OTP Staff Verification Notes</Label>
                          <Textarea placeholder="Add any verification notes or observations..." />
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1 bg-green-600">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve & Verify
                          </Button>
                          <Button variant="outline" className="flex-1 bg-transparent">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Flag for Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {dispensingLog.filter((log) => !log.verified_by_otp_staff).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>All facility nurse notes have been verified</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Diversion Control Integration
              </CardTitle>
              <CardDescription>Sync offsite dosing data with diversion control system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-medium text-blue-900">Real-Time Sync Active</div>
                    <div className="text-sm text-blue-700">
                      All offsite dispensing logs are automatically synced with the diversion control system
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Bottles Tracked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">15</div>
                    <p className="text-xs text-muted-foreground">Active at facilities</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Compliance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">98.5%</div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">2</div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Diversion Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        id: "1",
                        type: "warning",
                        message: "Biometric verification pending for BOT-002-2025",
                        timestamp: "2024-01-15 09:15",
                        facility: "Sunrise Senior Living",
                      },
                      {
                        id: "2",
                        type: "success",
                        message: "All doses administered on schedule at Riverside Rehabilitation",
                        timestamp: "2024-01-15 08:45",
                        facility: "Riverside Rehabilitation Center",
                      },
                    ].map((event) => (
                      <div
                        key={event.id}
                        className={`rounded-lg border p-3 ${
                          event.type === "warning" ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {event.type === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          )}
                          <div className="flex-1 space-y-1">
                            <div className="text-sm">{event.message}</div>
                            <div className="text-xs text-muted-foreground">
                              {event.facility} • {event.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full bg-transparent">
                <Shield className="mr-2 h-4 w-4" />
                View Full Diversion Control Dashboard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transport">
          <div className="space-y-4">
            {/* Active Transports */}
            <Card>
              <CardHeader>
                <CardTitle>Active Transports</CardTitle>
                <CardDescription>Real-time tracking of medication deliveries with chain of custody</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: "TRN-001",
                      driver: "Michael Johnson",
                      destination: "Sunrise Senior Living",
                      kits: 2,
                      status: "en_route",
                      departure: "08:45 AM",
                      eta: "09:30 AM",
                      temperature: "72°F",
                      location: "2.3 miles away",
                    },
                    {
                      id: "TRN-002",
                      driver: "Sarah Martinez",
                      destination: "Riverside Rehabilitation",
                      kits: 1,
                      status: "at_facility",
                      departure: "07:30 AM",
                      eta: "Arrived",
                      temperature: "70°F",
                      location: "On-site",
                    },
                  ].map((transport) => (
                    <div key={transport.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Truck className="h-8 w-8 text-blue-600" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{transport.id}</h3>
                              <Badge variant={transport.status === "en_route" ? "default" : "secondary"}>
                                {transport.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Driver: {transport.driver}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <MapPin className="mr-1 h-4 w-4" />
                          Track Live
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Destination</p>
                          <p className="font-medium">{transport.destination}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Kits</p>
                          <p className="font-medium">{transport.kits} medication kits</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Temperature</p>
                          <p className="font-medium flex items-center gap-1">
                            {transport.temperature}
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">ETA</p>
                          <p className="font-medium">{transport.eta}</p>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-blue-50 rounded flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-900">{transport.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chain of Custody Log */}
            <Card>
              <CardHeader>
                <CardTitle>Chain of Custody Records</CardTitle>
                <CardDescription>Complete audit trail of medication transfers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      time: "08:45 AM",
                      action: "Transport Started",
                      person: "Michael Johnson (Driver)",
                      location: "Main Clinic",
                      signature: "✓ Verified",
                    },
                    {
                      time: "08:40 AM",
                      action: "Kits Loaded",
                      person: "Sarah Chen, RN (Dispensing)",
                      location: "Main Clinic",
                      signature: "✓ Verified",
                    },
                    {
                      time: "08:35 AM",
                      action: "Temperature Check",
                      person: "Automated System",
                      location: "Transport Container",
                      signature: "72°F - Within Range",
                    },
                    {
                      time: "08:30 AM",
                      action: "Kit Preparation Complete",
                      person: "Sarah Chen, RN",
                      location: "Dispensing Room",
                      signature: "✓ Verified",
                    },
                  ].map((record, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded">
                      <div className="flex-shrink-0 w-16 text-sm text-muted-foreground">{record.time}</div>
                      <div className="flex-1">
                        <p className="font-medium">{record.action}</p>
                        <p className="text-sm text-muted-foreground">{record.person} • {record.location}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline">{record.signature}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transport History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { id: "TRN-000", date: "Jan 14, 2025", facility: "Highland Care Center", kits: 3, status: "completed" },
                    { id: "TRN-999", date: "Jan 13, 2025", facility: "Oak Ridge Nursing", kits: 2, status: "completed" },
                    { id: "TRN-998", date: "Jan 12, 2025", facility: "Riverside Rehabilitation", kits: 1, status: "completed" },
                  ].map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{delivery.id}</p>
                          <p className="text-sm text-muted-foreground">{delivery.date} • {delivery.facility}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{delivery.kits} kits</span>
                        <Button size="sm" variant="outline">View Report</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
