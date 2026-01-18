"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Building, Bed, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function OccupancyManagementPage() {
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedBed, setSelectedBed] = useState<any>(null)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  const { data, mutate } = useSWR("/api/occupancy", fetcher)
  const { data: patientsData } = useSWR("/api/patients?limit=100", fetcher)

  const locations = data?.locations || []
  const beds = data?.beds || []
  const stats = data?.stats || {}
  const patients = patientsData?.patients || []

  const filteredBeds = selectedLocation
    ? beds.filter((b: any) => b.facility_rooms?.location_id === selectedLocation)
    : beds

  const handleAssignBed = async () => {
    if (!selectedBed || !selectedPatient) {
      toast.error("Please select both bed and patient")
      return
    }

    try {
      const response = await fetch("/api/occupancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          bedId: selectedBed.id,
          patientId: selectedPatient,
        }),
      })

      if (!response.ok) throw new Error("Failed to assign bed")

      toast.success("Patient assigned to bed successfully")
      mutate()
      setShowAssignDialog(false)
      setSelectedBed(null)
      setSelectedPatient("")
    } catch (error) {
      toast.error("Failed to assign bed")
    }
  }

  const handleDischargeBed = async (bedId: string) => {
    try {
      const response = await fetch("/api/occupancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "discharge",
          bedId,
        }),
      })

      if (!response.ok) throw new Error("Failed to discharge")

      toast.success("Patient discharged from bed")
      mutate()
    } catch (error) {
      toast.error("Failed to discharge patient")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <div className="border-b bg-card">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building className="h-8 w-8 text-primary" />
                Occupancy Management
              </h1>
              <p className="text-muted-foreground mt-1">Track bed assignments and facility capacity</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBeds}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Occupied</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.occupied}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filter by Location</CardTitle>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({loc.location_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBeds.map((bed: any) => (
                  <Card key={bed.id} className={bed.occupied ? "border-orange-300" : "border-green-300"}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Bed className="h-4 w-4" />
                          Room {bed.facility_rooms?.room_number} - Bed {bed.bed_number}
                        </span>
                        {bed.occupied ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Occupied
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{bed.facility_rooms?.facility_locations?.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {bed.occupied && bed.patients ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">
                            {bed.patients.first_name} {bed.patients.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{bed.patients.patient_number}</div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDischargeBed(bed.id)}
                            className="w-full"
                          >
                            Discharge
                          </Button>
                        </div>
                      ) : (
                        <Dialog
                          open={showAssignDialog && selectedBed?.id === bed.id}
                          onOpenChange={(open) => {
                            setShowAssignDialog(open)
                            if (!open) setSelectedBed(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setSelectedBed(bed)} className="w-full">
                              Assign Patient
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Patient to Bed</DialogTitle>
                              <DialogDescription>
                                Room {bed.facility_rooms?.room_number} - Bed {bed.bed_number}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Select Patient</Label>
                                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose patient" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {patients.map((p: any) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.first_name} {p.last_name} - {p.patient_number}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleAssignBed} className="w-full">
                                Confirm Assignment
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
