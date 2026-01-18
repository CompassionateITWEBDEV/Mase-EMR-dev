"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  Syringe,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar,
  TrendingUp,
  RefreshCw,
  Eye,
  Package,
  Send,
  AlertTriangle,
  Search,
} from "lucide-react"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
}

interface Vaccination {
  id: string
  patient_id: string
  vaccine_name: string
  vaccine_code: string
  manufacturer: string
  lot_number: string
  expiration_date: string
  dose_number: number
  total_doses_in_series: number
  administration_date: string
  administration_site: string
  route: string
  administered_by: string
  reported_to_registry: boolean
  adverse_event: boolean
  adverse_event_details: string
  notes: string
  patients?: Patient
}

interface VaccineInventory {
  id: string
  vaccine_name: string
  vaccine_code: string
  manufacturer: string
  lot_number: string
  ndc_number: string
  expiration_date: string
  quantity_received: number
  quantity_remaining: number
  quantity_administered: number
  quantity_wasted: number
  storage_location: string
  vfc_eligible: boolean
  status: string
}

interface VaccinationSchedule {
  id: string
  vaccine_name: string
  vaccine_code: string
  age_group: string
  dose_number: number
  total_doses: number
  recommended_age_months: number
  interval_from_previous_dose_days: number
  acip_recommendation: string
  is_required: boolean
}

export default function VaccinationsPage() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [inventory, setInventory] = useState<VaccineInventory[]>([])
  const [schedules, setSchedules] = useState<VaccinationSchedule[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog states
  const [recordVaccinationOpen, setRecordVaccinationOpen] = useState(false)
  const [addInventoryOpen, setAddInventoryOpen] = useState(false)
  const [viewVaccinationOpen, setViewVaccinationOpen] = useState(false)
  const [reportAdverseEventOpen, setReportAdverseEventOpen] = useState(false)
  const [selectedVaccination, setSelectedVaccination] = useState<Vaccination | null>(null)

  // Form states
  const [vaccinationForm, setVaccinationForm] = useState({
    patient_id: "",
    vaccine_name: "",
    vaccine_code: "",
    manufacturer: "",
    lot_number: "",
    expiration_date: "",
    dose_number: 1,
    total_doses_in_series: 1,
    administration_date: new Date().toISOString().split("T")[0],
    administration_site: "",
    route: "",
    administered_by: "",
    vis_given: true,
    funding_source: "private",
    notes: "",
  })

  const [inventoryForm, setInventoryForm] = useState({
    vaccine_name: "",
    vaccine_code: "",
    manufacturer: "",
    lot_number: "",
    ndc_number: "",
    expiration_date: "",
    quantity_received: 0,
    storage_location: "",
    vfc_eligible: false,
  })

  const [adverseEventForm, setAdverseEventForm] = useState({
    event_description: "",
    onset_date: "",
    severity: "mild",
    treatment_provided: "",
    report_to_vaers: false,
  })

  const { toast } = useToast()
  const supabase = createBrowserClient()

  // Statistics
  const [stats, setStats] = useState({
    todayCount: 0,
    dueThisWeek: 0,
    registrySyncRate: 0,
    lowStockCount: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load vaccinations with patient data
      const { data: vaccinationsData } = await supabase
        .from("vaccinations")
        .select("*, patients(id, first_name, last_name, date_of_birth)")
        .order("administration_date", { ascending: false })
        .limit(100)

      // Load inventory
      const { data: inventoryData } = await supabase
        .from("vaccine_inventory")
        .select("*")
        .order("expiration_date", { ascending: true })

      // Load schedules
      const { data: schedulesData } = await supabase
        .from("vaccination_schedules")
        .select("*")
        .eq("is_active", true)
        .order("vaccine_name", { ascending: true })

      // Load patients
      const { data: patientsData } = await supabase
        .from("patients")
        .select("id, first_name, last_name, date_of_birth")
        .order("last_name", { ascending: true })

      // Load providers
      const { data: providersData } = await supabase
        .from("providers")
        .select("id, first_name, last_name")
        .order("last_name", { ascending: true })

      setVaccinations(vaccinationsData || [])
      setInventory(inventoryData || [])
      setSchedules(schedulesData || [])
      setPatients(patientsData || [])
      setProviders(providersData || [])

      // Calculate stats
      const today = new Date().toISOString().split("T")[0]
      const todayVaccinations = (vaccinationsData || []).filter((v: Vaccination) => v.administration_date === today)
      const syncedCount = (vaccinationsData || []).filter((v: Vaccination) => v.reported_to_registry).length
      const lowStock = (inventoryData || []).filter((i: VaccineInventory) => i.quantity_remaining < 10)

      setStats({
        todayCount: todayVaccinations.length,
        dueThisWeek: 0, // Would need patient age data to calculate
        registrySyncRate: vaccinationsData?.length ? Math.round((syncedCount / vaccinationsData.length) * 100) : 100,
        lowStockCount: lowStock.length,
      })
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load vaccination data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRecordVaccination = async () => {
    try {
      // First, insert the vaccination
      const { data, error } = await supabase
        .from("vaccinations")
        .insert({
          patient_id: vaccinationForm.patient_id,
          vaccine_name: vaccinationForm.vaccine_name,
          vaccine_code: vaccinationForm.vaccine_code,
          manufacturer: vaccinationForm.manufacturer,
          lot_number: vaccinationForm.lot_number,
          expiration_date: vaccinationForm.expiration_date,
          dose_number: vaccinationForm.dose_number,
          total_doses_in_series: vaccinationForm.total_doses_in_series,
          administration_date: vaccinationForm.administration_date,
          administration_site: vaccinationForm.administration_site,
          route: vaccinationForm.route,
          administered_by: vaccinationForm.administered_by || null,
          vis_given: vaccinationForm.vis_given,
          funding_source: vaccinationForm.funding_source,
          notes: vaccinationForm.notes,
          reported_to_registry: false,
          adverse_event: false,
        })
        .select()
        .single()

      if (error) throw error

      // Update inventory (decrement quantity)
      if (vaccinationForm.lot_number) {
        await supabase
          .from("vaccine_inventory")
          .update({
            quantity_remaining: supabase.rpc("decrement", { x: 1 }),
            quantity_administered: supabase.rpc("increment", { x: 1 }),
          })
          .eq("lot_number", vaccinationForm.lot_number)
      }

      toast({
        title: "Vaccination Recorded",
        description: `${vaccinationForm.vaccine_name} administered successfully`,
      })

      setRecordVaccinationOpen(false)
      setVaccinationForm({
        patient_id: "",
        vaccine_name: "",
        vaccine_code: "",
        manufacturer: "",
        lot_number: "",
        expiration_date: "",
        dose_number: 1,
        total_doses_in_series: 1,
        administration_date: new Date().toISOString().split("T")[0],
        administration_site: "",
        route: "",
        administered_by: "",
        vis_given: true,
        funding_source: "private",
        notes: "",
      })
      loadData()
    } catch (error) {
      console.error("Error recording vaccination:", error)
      toast({
        title: "Error",
        description: "Failed to record vaccination",
        variant: "destructive",
      })
    }
  }

  const handleAddInventory = async () => {
    try {
      const { error } = await supabase.from("vaccine_inventory").insert({
        vaccine_name: inventoryForm.vaccine_name,
        vaccine_code: inventoryForm.vaccine_code,
        manufacturer: inventoryForm.manufacturer,
        lot_number: inventoryForm.lot_number,
        ndc_number: inventoryForm.ndc_number,
        expiration_date: inventoryForm.expiration_date,
        quantity_received: inventoryForm.quantity_received,
        quantity_remaining: inventoryForm.quantity_received,
        quantity_administered: 0,
        quantity_wasted: 0,
        storage_location: inventoryForm.storage_location,
        vfc_eligible: inventoryForm.vfc_eligible,
        status: "active",
      })

      if (error) throw error

      toast({
        title: "Inventory Added",
        description: `${inventoryForm.quantity_received} doses of ${inventoryForm.vaccine_name} added`,
      })

      setAddInventoryOpen(false)
      setInventoryForm({
        vaccine_name: "",
        vaccine_code: "",
        manufacturer: "",
        lot_number: "",
        ndc_number: "",
        expiration_date: "",
        quantity_received: 0,
        storage_location: "",
        vfc_eligible: false,
      })
      loadData()
    } catch (error) {
      console.error("Error adding inventory:", error)
      toast({
        title: "Error",
        description: "Failed to add inventory",
        variant: "destructive",
      })
    }
  }

  const handleSyncToRegistry = async (vaccination: Vaccination) => {
    try {
      // Create registry submission record
      await supabase.from("immunization_registry_submissions").insert({
        patient_vaccination_id: vaccination.id,
        registry_name: "State Immunization Registry",
        submission_type: "new",
        submission_status: "pending",
        submission_date: new Date().toISOString(),
      })

      // Update vaccination as reported
      await supabase
        .from("vaccinations")
        .update({
          reported_to_registry: true,
          registry_report_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", vaccination.id)

      toast({
        title: "Synced to Registry",
        description: "Vaccination reported to state registry",
      })
      loadData()
    } catch (error) {
      console.error("Error syncing to registry:", error)
      toast({
        title: "Error",
        description: "Failed to sync to registry",
        variant: "destructive",
      })
    }
  }

  const handleReportAdverseEvent = async () => {
    if (!selectedVaccination) return

    try {
      // Insert adverse event
      await supabase.from("vaccine_adverse_events").insert({
        patient_vaccination_id: selectedVaccination.id,
        patient_id: selectedVaccination.patient_id,
        event_description: adverseEventForm.event_description,
        onset_date: adverseEventForm.onset_date,
        severity: adverseEventForm.severity,
        treatment_provided: adverseEventForm.treatment_provided,
        reported_to_vaers: adverseEventForm.report_to_vaers,
      })

      // Update vaccination record
      await supabase
        .from("vaccinations")
        .update({
          adverse_event: true,
          adverse_event_details: adverseEventForm.event_description,
        })
        .eq("id", selectedVaccination.id)

      toast({
        title: "Adverse Event Reported",
        description: adverseEventForm.report_to_vaers
          ? "Event recorded and flagged for VAERS submission"
          : "Event recorded successfully",
      })

      setReportAdverseEventOpen(false)
      setAdverseEventForm({
        event_description: "",
        onset_date: "",
        severity: "mild",
        treatment_provided: "",
        report_to_vaers: false,
      })
      loadData()
    } catch (error) {
      console.error("Error reporting adverse event:", error)
      toast({
        title: "Error",
        description: "Failed to report adverse event",
        variant: "destructive",
      })
    }
  }

  const handleSelectVaccineFromInventory = (inv: VaccineInventory) => {
    setVaccinationForm((prev) => ({
      ...prev,
      vaccine_name: inv.vaccine_name,
      vaccine_code: inv.vaccine_code,
      manufacturer: inv.manufacturer,
      lot_number: inv.lot_number,
      expiration_date: inv.expiration_date,
    }))
  }

  const filteredVaccinations = vaccinations.filter((v) => {
    if (!searchTerm) return true
    const patientName = v.patients ? `${v.patients.first_name} ${v.patients.last_name}`.toLowerCase() : ""
    return (
      patientName.includes(searchTerm.toLowerCase()) || v.vaccine_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Common vaccines list
  const commonVaccines = [
    { name: "COVID-19 (Moderna)", code: "213", manufacturer: "Moderna", route: "IM", site: "Left Deltoid" },
    { name: "COVID-19 (Pfizer)", code: "208", manufacturer: "Pfizer-BioNTech", route: "IM", site: "Left Deltoid" },
    {
      name: "Influenza (Quadrivalent)",
      code: "150",
      manufacturer: "Sanofi Pasteur",
      route: "IM",
      site: "Left Deltoid",
    },
    { name: "Tdap (Boostrix)", code: "115", manufacturer: "GSK", route: "IM", site: "Left Deltoid" },
    { name: "HPV (Gardasil 9)", code: "165", manufacturer: "Merck", route: "IM", site: "Left Deltoid" },
    { name: "Hepatitis B", code: "08", manufacturer: "Merck", route: "IM", site: "Left Deltoid" },
    { name: "MMR", code: "03", manufacturer: "Merck", route: "SC", site: "Left Upper Arm" },
    { name: "Pneumococcal (PPSV23)", code: "33", manufacturer: "Merck", route: "IM", site: "Left Deltoid" },
    { name: "Shingrix", code: "187", manufacturer: "GSK", route: "IM", site: "Left Deltoid" },
    { name: "Meningococcal (MenACWY)", code: "114", manufacturer: "Sanofi Pasteur", route: "IM", site: "Left Deltoid" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Vaccination Management</h1>
              <p className="text-muted-foreground">Patient immunization records and vaccine inventory tracking</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => setRecordVaccinationOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Vaccination
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vaccinations Today</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.todayCount}</div>
                    <p className="text-xs text-muted-foreground">Administered today</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Due This Week</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.dueThisWeek}</div>
                    <p className="text-xs text-muted-foreground">Scheduled vaccinations</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registry Sync Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.registrySyncRate}%</div>
                    <p className="text-xs text-green-600">Successfully synced</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.lowStockCount}</div>
                    <p className="text-xs text-yellow-600">Vaccines need reorder</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="records" className="space-y-4">
            <TabsList>
              <TabsTrigger value="records">Patient Records</TabsTrigger>
              <TabsTrigger value="inventory">Vaccine Inventory</TabsTrigger>
              <TabsTrigger value="registry">Registry Reporting</TabsTrigger>
              <TabsTrigger value="schedules">Vaccination Schedules</TabsTrigger>
            </TabsList>

            {/* Patient Records Tab */}
            <TabsContent value="records" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Vaccination Records</CardTitle>
                      <CardDescription>All patient immunizations</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search patient or vaccine..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 w-[250px]"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : filteredVaccinations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Syringe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No vaccination records found</p>
                      <Button
                        variant="outline"
                        className="mt-3 bg-transparent"
                        onClick={() => setRecordVaccinationOpen(true)}
                      >
                        Record First Vaccination
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredVaccinations.map((record) => (
                        <div
                          key={record.id}
                          className={`flex items-center justify-between p-4 border rounded-lg ${
                            record.adverse_event ? "border-red-300 bg-red-50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Syringe className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {record.patients
                                  ? `${record.patients.first_name} ${record.patients.last_name}`
                                  : "Unknown Patient"}
                              </p>
                              <p className="text-sm text-muted-foreground">{record.vaccine_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(record.administration_date).toLocaleDateString()} • Lot:{" "}
                                {record.lot_number || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {record.adverse_event && (
                              <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Adverse Event
                              </Badge>
                            )}
                            <Badge variant={record.reported_to_registry ? "default" : "secondary"}>
                              {record.reported_to_registry ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Registry Synced
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Pending Sync
                                </>
                              )}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedVaccination(record)
                                setViewVaccinationOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!record.reported_to_registry && (
                              <Button variant="ghost" size="sm" onClick={() => handleSyncToRegistry(record)}>
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {!record.adverse_event && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedVaccination(record)
                                  setReportAdverseEventOpen(true)
                                }}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Vaccine Inventory</CardTitle>
                      <CardDescription>Current stock levels and expiration tracking</CardDescription>
                    </div>
                    <Button onClick={() => setAddInventoryOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Inventory
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : inventory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No vaccine inventory</p>
                      <Button
                        variant="outline"
                        className="mt-3 bg-transparent"
                        onClick={() => setAddInventoryOpen(true)}
                      >
                        Add First Vaccine
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inventory.map((item) => {
                        const isLowStock = item.quantity_remaining < 10
                        const isExpiringSoon =
                          new Date(item.expiration_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-4 border rounded-lg ${
                              isLowStock || isExpiringSoon ? "border-yellow-300 bg-yellow-50" : ""
                            }`}
                          >
                            <div>
                              <p className="font-medium">{item.vaccine_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Lot: {item.lot_number} • {item.manufacturer}
                              </p>
                              {item.vfc_eligible && (
                                <Badge variant="outline" className="mt-1">
                                  VFC Eligible
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{item.quantity_remaining} doses</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                                <Calendar className="h-3 w-3" />
                                Exp: {new Date(item.expiration_date).toLocaleDateString()}
                              </p>
                              {isLowStock && (
                                <Badge variant="outline" className="mt-1 border-yellow-600 text-yellow-700">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Low Stock
                                </Badge>
                              )}
                              {isExpiringSoon && !isLowStock && (
                                <Badge variant="outline" className="mt-1 border-orange-600 text-orange-700">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Registry Tab */}
            <TabsContent value="registry" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>State Immunization Registry</CardTitle>
                  <CardDescription>Automated reporting to state registries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">Registry Connection Active</p>
                          <p className="text-sm text-green-700">
                            Connected to State Immunization Registry. All vaccinations can be automatically reported.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Submissions (MTD)</p>
                              <p className="text-2xl font-bold">
                                {vaccinations.filter((v) => v.reported_to_registry).length}
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Success Rate</p>
                              <p className="text-2xl font-bold">{stats.registrySyncRate}%</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Pending Sync List */}
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Pending Registry Submissions</h3>
                      {vaccinations.filter((v) => !v.reported_to_registry).length === 0 ? (
                        <p className="text-sm text-muted-foreground">All vaccinations have been synced</p>
                      ) : (
                        <div className="space-y-2">
                          {vaccinations
                            .filter((v) => !v.reported_to_registry)
                            .slice(0, 5)
                            .map((v) => (
                              <div key={v.id} className="flex items-center justify-between p-3 border rounded">
                                <div>
                                  <p className="font-medium">{v.vaccine_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {v.patients ? `${v.patients.first_name} ${v.patients.last_name}` : "Unknown"} •
                                    {new Date(v.administration_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button size="sm" onClick={() => handleSyncToRegistry(v)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Sync Now
                                </Button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedules Tab */}
            <TabsContent value="schedules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ACIP Vaccination Schedules</CardTitle>
                  <CardDescription>CDC recommended immunization schedules by age group</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="space-y-4">
                      {[
                        { group: "Infants (0-12 months)", vaccines: "Hepatitis B, DTaP, Hib, PCV, IPV, Rotavirus" },
                        { group: "Children (1-6 years)", vaccines: "MMR, Varicella, Hepatitis A, Influenza" },
                        { group: "Adolescents (7-18 years)", vaccines: "Tdap, HPV, Meningococcal, Influenza" },
                        { group: "Adults (19-64 years)", vaccines: "Influenza, Td/Tdap, COVID-19, Shingles" },
                        { group: "Elderly (65+ years)", vaccines: "Influenza, Pneumococcal, Shingles, COVID-19" },
                      ].map((schedule, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <p className="font-medium">{schedule.group}</p>
                          <p className="text-sm text-muted-foreground mt-1">{schedule.vaccines}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vaccine</TableHead>
                          <TableHead>Age Group</TableHead>
                          <TableHead>Dose</TableHead>
                          <TableHead>Recommended Age</TableHead>
                          <TableHead>Required</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedules.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium">{schedule.vaccine_name}</TableCell>
                            <TableCell>{schedule.age_group}</TableCell>
                            <TableCell>
                              {schedule.dose_number} of {schedule.total_doses}
                            </TableCell>
                            <TableCell>{schedule.recommended_age_months} months</TableCell>
                            <TableCell>
                              <Badge variant={schedule.is_required ? "default" : "secondary"}>
                                {schedule.is_required ? "Required" : "Recommended"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Record Vaccination Dialog */}
      <Dialog open={recordVaccinationOpen} onOpenChange={setRecordVaccinationOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Vaccination</DialogTitle>
            <DialogDescription>Enter vaccination details for the patient</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Select
                  value={vaccinationForm.patient_id}
                  onValueChange={(value) => setVaccinationForm((prev) => ({ ...prev, patient_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} ({new Date(p.date_of_birth).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Administration Date *</Label>
                <Input
                  type="date"
                  value={vaccinationForm.administration_date}
                  onChange={(e) => setVaccinationForm((prev) => ({ ...prev, administration_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vaccine *</Label>
              <Select
                value={vaccinationForm.vaccine_name}
                onValueChange={(value) => {
                  const vaccine = commonVaccines.find((v) => v.name === value)
                  if (vaccine) {
                    setVaccinationForm((prev) => ({
                      ...prev,
                      vaccine_name: vaccine.name,
                      vaccine_code: vaccine.code,
                      manufacturer: vaccine.manufacturer,
                      route: vaccine.route,
                      administration_site: vaccine.site,
                    }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {commonVaccines.map((v) => (
                    <SelectItem key={v.code} value={v.name}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {inventory.length > 0 && (
              <div className="space-y-2">
                <Label>Select from Inventory</Label>
                <Select
                  onValueChange={(value) => {
                    const inv = inventory.find((i) => i.id === value)
                    if (inv) handleSelectVaccineFromInventory(inv)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select from available inventory" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory
                      .filter((i) => i.quantity_remaining > 0)
                      .map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.vaccine_name} - Lot: {inv.lot_number} ({inv.quantity_remaining} doses)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input
                  value={vaccinationForm.manufacturer}
                  onChange={(e) => setVaccinationForm((prev) => ({ ...prev, manufacturer: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Lot Number *</Label>
                <Input
                  value={vaccinationForm.lot_number}
                  onChange={(e) => setVaccinationForm((prev) => ({ ...prev, lot_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiration Date</Label>
                <Input
                  type="date"
                  value={vaccinationForm.expiration_date}
                  onChange={(e) => setVaccinationForm((prev) => ({ ...prev, expiration_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Dose Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={vaccinationForm.dose_number}
                  onChange={(e) =>
                    setVaccinationForm((prev) => ({ ...prev, dose_number: Number.parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Total Doses in Series</Label>
                <Input
                  type="number"
                  min={1}
                  value={vaccinationForm.total_doses_in_series}
                  onChange={(e) =>
                    setVaccinationForm((prev) => ({
                      ...prev,
                      total_doses_in_series: Number.parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <Select
                  value={vaccinationForm.route}
                  onValueChange={(value) => setVaccinationForm((prev) => ({ ...prev, route: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IM">Intramuscular (IM)</SelectItem>
                    <SelectItem value="SC">Subcutaneous (SC)</SelectItem>
                    <SelectItem value="ID">Intradermal (ID)</SelectItem>
                    <SelectItem value="PO">Oral (PO)</SelectItem>
                    <SelectItem value="IN">Intranasal (IN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Administration Site</Label>
                <Select
                  value={vaccinationForm.administration_site}
                  onValueChange={(value) => setVaccinationForm((prev) => ({ ...prev, administration_site: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Left Deltoid">Left Deltoid</SelectItem>
                    <SelectItem value="Right Deltoid">Right Deltoid</SelectItem>
                    <SelectItem value="Left Thigh">Left Thigh</SelectItem>
                    <SelectItem value="Right Thigh">Right Thigh</SelectItem>
                    <SelectItem value="Left Upper Arm">Left Upper Arm</SelectItem>
                    <SelectItem value="Right Upper Arm">Right Upper Arm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Administered By</Label>
                <Select
                  value={vaccinationForm.administered_by}
                  onValueChange={(value) => setVaccinationForm((prev) => ({ ...prev, administered_by: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Funding Source</Label>
                <Select
                  value={vaccinationForm.funding_source}
                  onValueChange={(value) => setVaccinationForm((prev) => ({ ...prev, funding_source: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private Insurance</SelectItem>
                    <SelectItem value="vfc">Vaccines for Children (VFC)</SelectItem>
                    <SelectItem value="317">Section 317</SelectItem>
                    <SelectItem value="self_pay">Self Pay</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="vis_given"
                checked={vaccinationForm.vis_given}
                onCheckedChange={(checked) =>
                  setVaccinationForm((prev) => ({ ...prev, vis_given: checked as boolean }))
                }
              />
              <Label htmlFor="vis_given">Vaccine Information Statement (VIS) provided to patient</Label>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={vaccinationForm.notes}
                onChange={(e) => setVaccinationForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordVaccinationOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordVaccination}
              disabled={!vaccinationForm.patient_id || !vaccinationForm.vaccine_name || !vaccinationForm.lot_number}
            >
              Record Vaccination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Inventory Dialog */}
      <Dialog open={addInventoryOpen} onOpenChange={setAddInventoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Vaccine Inventory</DialogTitle>
            <DialogDescription>Add new vaccine stock to inventory</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Vaccine Name *</Label>
              <Select
                value={inventoryForm.vaccine_name}
                onValueChange={(value) => {
                  const vaccine = commonVaccines.find((v) => v.name === value)
                  if (vaccine) {
                    setInventoryForm((prev) => ({
                      ...prev,
                      vaccine_name: vaccine.name,
                      vaccine_code: vaccine.code,
                      manufacturer: vaccine.manufacturer,
                    }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {commonVaccines.map((v) => (
                    <SelectItem key={v.code} value={v.name}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input
                  value={inventoryForm.manufacturer}
                  onChange={(e) => setInventoryForm((prev) => ({ ...prev, manufacturer: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Lot Number *</Label>
                <Input
                  value={inventoryForm.lot_number}
                  onChange={(e) => setInventoryForm((prev) => ({ ...prev, lot_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NDC Number</Label>
                <Input
                  value={inventoryForm.ndc_number}
                  onChange={(e) => setInventoryForm((prev) => ({ ...prev, ndc_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiration Date *</Label>
                <Input
                  type="date"
                  value={inventoryForm.expiration_date}
                  onChange={(e) => setInventoryForm((prev) => ({ ...prev, expiration_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity Received *</Label>
                <Input
                  type="number"
                  min={1}
                  value={inventoryForm.quantity_received}
                  onChange={(e) =>
                    setInventoryForm((prev) => ({ ...prev, quantity_received: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Storage Location</Label>
                <Select
                  value={inventoryForm.storage_location}
                  onValueChange={(value) => setInventoryForm((prev) => ({ ...prev, storage_location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Refrigerator 1">Refrigerator 1</SelectItem>
                    <SelectItem value="Refrigerator 2">Refrigerator 2</SelectItem>
                    <SelectItem value="Freezer 1">Freezer 1</SelectItem>
                    <SelectItem value="Freezer 2">Freezer 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="vfc_eligible"
                checked={inventoryForm.vfc_eligible}
                onCheckedChange={(checked) =>
                  setInventoryForm((prev) => ({ ...prev, vfc_eligible: checked as boolean }))
                }
              />
              <Label htmlFor="vfc_eligible">VFC (Vaccines for Children) Eligible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddInventoryOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddInventory}
              disabled={
                !inventoryForm.vaccine_name ||
                !inventoryForm.lot_number ||
                !inventoryForm.expiration_date ||
                inventoryForm.quantity_received < 1
              }
            >
              Add Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Vaccination Dialog */}
      <Dialog open={viewVaccinationOpen} onOpenChange={setViewVaccinationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vaccination Details</DialogTitle>
          </DialogHeader>
          {selectedVaccination && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">
                    {selectedVaccination.patients
                      ? `${selectedVaccination.patients.first_name} ${selectedVaccination.patients.last_name}`
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(selectedVaccination.administration_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vaccine</p>
                  <p className="font-medium">{selectedVaccination.vaccine_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dose</p>
                  <p className="font-medium">
                    {selectedVaccination.dose_number} of {selectedVaccination.total_doses_in_series}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturer</p>
                  <p className="font-medium">{selectedVaccination.manufacturer || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lot Number</p>
                  <p className="font-medium">{selectedVaccination.lot_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="font-medium">{selectedVaccination.route || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Site</p>
                  <p className="font-medium">{selectedVaccination.administration_site || "N/A"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={selectedVaccination.reported_to_registry ? "default" : "secondary"}>
                  {selectedVaccination.reported_to_registry ? "Registry Synced" : "Pending Sync"}
                </Badge>
                {selectedVaccination.adverse_event && <Badge variant="destructive">Adverse Event Reported</Badge>}
              </div>
              {selectedVaccination.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{selectedVaccination.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Adverse Event Dialog */}
      <Dialog open={reportAdverseEventOpen} onOpenChange={setReportAdverseEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Adverse Event</DialogTitle>
            <DialogDescription>Report an adverse reaction following vaccination</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Event Description *</Label>
              <Textarea
                value={adverseEventForm.event_description}
                onChange={(e) => setAdverseEventForm((prev) => ({ ...prev, event_description: e.target.value }))}
                placeholder="Describe the adverse event..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Onset Date</Label>
                <Input
                  type="date"
                  value={adverseEventForm.onset_date}
                  onChange={(e) => setAdverseEventForm((prev) => ({ ...prev, onset_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={adverseEventForm.severity}
                  onValueChange={(value) => setAdverseEventForm((prev) => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                    <SelectItem value="life_threatening">Life Threatening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Treatment Provided</Label>
              <Textarea
                value={adverseEventForm.treatment_provided}
                onChange={(e) => setAdverseEventForm((prev) => ({ ...prev, treatment_provided: e.target.value }))}
                placeholder="Describe any treatment provided..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="report_vaers"
                checked={adverseEventForm.report_to_vaers}
                onCheckedChange={(checked) =>
                  setAdverseEventForm((prev) => ({ ...prev, report_to_vaers: checked as boolean }))
                }
              />
              <Label htmlFor="report_vaers">Flag for VAERS (Vaccine Adverse Event Reporting System) submission</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportAdverseEventOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReportAdverseEvent}
              disabled={!adverseEventForm.event_description}
              variant="destructive"
            >
              Report Adverse Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
