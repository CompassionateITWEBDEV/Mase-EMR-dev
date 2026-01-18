"use client"

import type React from "react"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Wrench,
  Eye,
  Download,
  Plus,
  Edit,
  RefreshCw,
  Play,
  ClipboardCheck,
  Package,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Hazard {
  id: number
  name: string
  category: string
  probability: number
  humanImpact: number
  propertyImpact: number
  businessImpact: number
  preparedness: number
  totalScore: number
  riskLevel: string
}

interface Equipment {
  id: number
  name: string
  type: string
  location: string
  lastCheck: string
  nextCheck: string
  status: string
  inspector: string
}

interface TrainingModule {
  id: number
  title: string
  category: string
  completionRate: number
  dueDate: string
  status: string
}

interface FacilityData {
  hazards: Hazard[]
  equipment: Equipment[]
  trainingModules: TrainingModule[]
  stats: {
    highRiskHazards: number
    moderateRiskHazards: number
    lowRiskHazards: number
    totalEquipment: number
    equipmentDueThisWeek: number
    overdueEquipment: number
    equipmentComplianceRate: number
    activeTrainingModules: number
    avgTrainingCompletion: number
    trainingDueThisMonth: number
    trainingComplianceRate: number
    lastUpdated: string
  }
}

export default function FacilityManagement() {
  const { toast } = useToast()
  const [equipmentFilter, setEquipmentFilter] = useState("all")
  const [showNewHazardDialog, setShowNewHazardDialog] = useState(false)
  const [showNewEquipmentDialog, setShowNewEquipmentDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showEditHazardDialog, setShowEditHazardDialog] = useState(false)
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null)

  const [showViewEquipmentDialog, setShowViewEquipmentDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)

  const [showEquipmentCheckDialog, setShowEquipmentCheckDialog] = useState(false)

  const [showViewTrainingDialog, setShowViewTrainingDialog] = useState(false)
  const [showEnrollTrainingDialog, setShowEnrollTrainingDialog] = useState(false)
  const [selectedTraining, setSelectedTraining] = useState<TrainingModule | null>(null)

  const [showNewTrainingDialog, setShowNewTrainingDialog] = useState(false)

  const [showComplianceReportDialog, setShowComplianceReportDialog] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<FacilityData>("/api/facility", fetcher)

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High":
        return "destructive"
      case "Moderate":
        return "secondary"
      case "Low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Good":
        return "text-green-600"
      case "Needs Restocking":
        return "text-yellow-600"
      case "Low Pressure":
        return "text-orange-600"
      case "Failed":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const handleAddHazard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await fetch("/api/facility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hazard",
          data: {
            name: formData.get("hazardName"),
            riskLevel: formData.get("riskLevel"),
            description: formData.get("description"),
            affectedAreas: formData
              .get("affectedAreas")
              ?.toString()
              .split(",")
              .map((a) => a.trim()),
          },
        }),
      })
      mutate()
      setShowNewHazardDialog(false)
      toast({ title: "Hazard assessment added successfully" })
    } catch (error) {
      console.error("Failed to add hazard:", error)
      toast({ title: "Failed to add hazard", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditHazard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedHazard) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await fetch("/api/facility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hazard",
          id: selectedHazard.id,
          data: {
            name: formData.get("hazardName"),
            category: formData.get("category"),
            probability: Number.parseInt(formData.get("probability") as string),
            humanImpact: Number.parseInt(formData.get("humanImpact") as string),
            propertyImpact: Number.parseInt(formData.get("propertyImpact") as string),
            businessImpact: Number.parseInt(formData.get("businessImpact") as string),
            preparedness: Number.parseInt(formData.get("preparedness") as string),
          },
        }),
      })
      mutate()
      setShowEditHazardDialog(false)
      setSelectedHazard(null)
      toast({ title: "Hazard updated successfully" })
    } catch (error) {
      console.error("Failed to update hazard:", error)
      toast({ title: "Failed to update hazard", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddEquipmentCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await fetch("/api/facility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "equipment_check",
          data: {
            name: formData.get("equipmentName"),
            type: formData.get("equipmentType"),
            location: formData.get("location"),
            status: formData.get("status"),
            inspector: formData.get("inspector"),
          },
        }),
      })
      mutate()
      setShowNewEquipmentDialog(false)
      toast({ title: "Equipment check recorded successfully" })
    } catch (error) {
      console.error("Failed to add equipment check:", error)
      toast({ title: "Failed to record equipment check", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePerformEquipmentCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedEquipment) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await fetch("/api/facility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "equipment_check",
          id: selectedEquipment.id,
          data: {
            status: formData.get("status"),
            inspector: formData.get("inspector"),
            notes: formData.get("notes"),
          },
        }),
      })
      mutate()
      setShowEquipmentCheckDialog(false)
      setSelectedEquipment(null)
      toast({ title: "Equipment check completed successfully" })
    } catch (error) {
      console.error("Failed to perform equipment check:", error)
      toast({ title: "Failed to complete equipment check", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportReports = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      facilityName: "MASE Behavioral Health Center",
      hazardAssessments: data?.hazards || [],
      equipmentChecks: data?.equipment || [],
      trainingModules: data?.trainingModules || [],
      statistics: data?.stats || {},
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `facility-report-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Facility report exported successfully" })
  }

  const handleEnrollTraining = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedTraining) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await fetch("/api/facility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "training_enrollment",
          data: {
            moduleId: selectedTraining.id,
            staffName: formData.get("staffName"),
            staffEmail: formData.get("staffEmail"),
            targetDate: formData.get("targetDate"),
          },
        }),
      })
      mutate()
      setShowEnrollTrainingDialog(false)
      setSelectedTraining(null)
      toast({ title: "Staff enrolled in training successfully" })
    } catch (error) {
      console.error("Failed to enroll in training:", error)
      toast({ title: "Failed to enroll in training", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTrainingModule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await fetch("/api/facility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "training_module",
          data: {
            title: formData.get("title"),
            category: formData.get("category"),
            dueDate: formData.get("dueDate"),
            description: formData.get("description"),
            ceuHours: Number.parseFloat(formData.get("ceuHours") as string) || 0,
          },
        }),
      })
      mutate()
      setShowNewTrainingDialog(false)
      toast({ title: "Training module added successfully" })
    } catch (error) {
      console.error("Failed to add training module:", error)
      toast({ title: "Failed to add training module", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateComplianceReport = async (reportType: string) => {
    try {
      const reportData = {
        reportType,
        generatedAt: new Date().toISOString(),
        data:
          reportType === "hazard"
            ? data?.hazards
            : reportType === "equipment"
              ? data?.equipment
              : data?.trainingModules,
        stats: data?.stats,
      }

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType}-compliance-report-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} compliance report generated` })
    } catch (error) {
      toast({ title: "Failed to generate report", variant: "destructive" })
    }
  }

  const filteredEquipment =
    data?.equipment?.filter((item) => {
      if (equipmentFilter === "all") return true
      return item.type.toLowerCase() === equipmentFilter
    }) || []

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="border-b bg-card/50">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Facility Management</h1>
                <p className="text-muted-foreground">
                  Comprehensive facility safety, equipment, and staff training management
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => mutate()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportReports}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Reports
                </Button>
                <Dialog open={showNewHazardDialog} onOpenChange={setShowNewHazardDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      New Assessment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Hazard Assessment</DialogTitle>
                      <DialogDescription>Create a new hazard vulnerability assessment entry.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddHazard}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="hazardName">Hazard Name</Label>
                          <Input id="hazardName" name="hazardName" placeholder="e.g., Fire/Explosion" required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="riskLevel">Risk Level</Label>
                          <Select name="riskLevel" defaultValue="medium">
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="affectedAreas">Affected Areas (comma-separated)</Label>
                          <Input
                            id="affectedAreas"
                            name="affectedAreas"
                            placeholder="e.g., Main Building, Dispensing Room"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" placeholder="Describe the hazard..." />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowNewHazardDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Adding..." : "Add Hazard"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <main className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
              Failed to load facility data. Please try again.
            </div>
          )}

          <Tabs defaultValue="hva" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="hva" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risk Assessment
              </TabsTrigger>
              <TabsTrigger value="equipment" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Equipment Checks
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Staff Training
              </TabsTrigger>
              <TabsTrigger value="newsletters" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Newsletters
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Gov Meetings
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hva" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-8 w-12 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">High Risk Hazards</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{data?.stats?.highRiskHazards || 0}</div>
                        <p className="text-xs text-muted-foreground">Require immediate attention</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Moderate Risk</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                          {data?.stats?.moderateRiskHazards || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Monitor and plan</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{data?.stats?.lowRiskHazards || 0}</div>
                        <p className="text-xs text-muted-foreground">Routine monitoring</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{data?.stats?.lastUpdated || "N/A"}</div>
                        <p className="text-xs text-muted-foreground">Annual review due</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Hazard Vulnerability Assessment (HVA)</CardTitle>
                  <CardDescription>Comprehensive risk evaluation for healthcare facility hazards</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : data?.hazards?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hazard assessments found.</p>
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => setShowNewHazardDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Assessment
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hazard</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Probability</TableHead>
                          <TableHead>Human Impact</TableHead>
                          <TableHead>Property Impact</TableHead>
                          <TableHead>Business Impact</TableHead>
                          <TableHead>Preparedness</TableHead>
                          <TableHead>Total Score</TableHead>
                          <TableHead>Risk Level</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.hazards?.map((hazard) => (
                          <TableRow key={hazard.id}>
                            <TableCell className="font-medium">{hazard.name}</TableCell>
                            <TableCell>{hazard.category}</TableCell>
                            <TableCell>{hazard.probability}</TableCell>
                            <TableCell>{hazard.humanImpact}</TableCell>
                            <TableCell>{hazard.propertyImpact}</TableCell>
                            <TableCell>{hazard.businessImpact}</TableCell>
                            <TableCell>{hazard.preparedness}</TableCell>
                            <TableCell className="font-bold">{hazard.totalScore}</TableCell>
                            <TableCell>
                              <Badge
                                variant={getRiskColor(hazard.riskLevel) as "destructive" | "secondary" | "outline"}
                              >
                                {hazard.riskLevel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedHazard(hazard)
                                  setShowEditHazardDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
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

            <TabsContent value="equipment" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-8 w-12 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{data?.stats?.totalEquipment || 0}</div>
                        <p className="text-xs text-muted-foreground">Items tracked</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                          {data?.stats?.equipmentDueThisWeek || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Inspections needed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{data?.stats?.overdueEquipment || 0}</div>
                        <p className="text-xs text-muted-foreground">Immediate attention</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {data?.stats?.equipmentComplianceRate || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">On schedule</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Safety Equipment Checks</CardTitle>
                      <CardDescription>Track and manage safety equipment inspections</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Equipment</SelectItem>
                          <SelectItem value="fire safety">Fire Safety</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="medical">Medical</SelectItem>
                        </SelectContent>
                      </Select>
                      <Dialog open={showNewEquipmentDialog} onOpenChange={setShowNewEquipmentDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Equipment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Equipment Check</DialogTitle>
                            <DialogDescription>Record a new equipment inspection.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddEquipmentCheck}>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="equipmentName">Equipment Name</Label>
                                <Input
                                  id="equipmentName"
                                  name="equipmentName"
                                  placeholder="e.g., Fire Extinguisher A1"
                                  required
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="equipmentType">Equipment Type</Label>
                                <Select name="equipmentType" defaultValue="fire safety">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fire safety">Fire Safety</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                    <SelectItem value="medical">Medical</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" name="location" placeholder="e.g., Main Hallway" required />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue="Good">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Good">Good</SelectItem>
                                    <SelectItem value="Needs Restocking">Needs Restocking</SelectItem>
                                    <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                                    <SelectItem value="Failed">Failed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="inspector">Inspector Name</Label>
                                <Input id="inspector" name="inspector" placeholder="Your name" required />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setShowNewEquipmentDialog(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Adding..." : "Add Equipment"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : filteredEquipment.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No equipment found.</p>
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => setShowNewEquipmentDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Equipment
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipment</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Last Check</TableHead>
                          <TableHead>Next Check</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Inspector</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEquipment.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.lastCheck}</TableCell>
                            <TableCell>{item.nextCheck}</TableCell>
                            <TableCell>
                              <span className={getStatusColor(item.status)}>{item.status}</span>
                            </TableCell>
                            <TableCell>{item.inspector}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEquipment(item)
                                    setShowViewEquipmentDialog(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEquipment(item)
                                    setShowEquipmentCheckDialog(true)
                                  }}
                                >
                                  <ClipboardCheck className="h-4 w-4" />
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

            <TabsContent value="training" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-8 w-12 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{data?.stats?.activeTrainingModules || 0}</div>
                        <p className="text-xs text-muted-foreground">Training programs</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {data?.stats?.avgTrainingCompletion || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Staff trained</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Due This Month</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                          {data?.stats?.trainingDueThisMonth || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Require completion</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {data?.stats?.trainingComplianceRate || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Overall compliance</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Staff Training Modules</CardTitle>
                      <CardDescription>Manage staff training and certification tracking</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewTrainingDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Module
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : data?.trainingModules?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No training modules found.</p>
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => setShowNewTrainingDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Module
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data?.trainingModules?.map((module) => (
                        <div key={module.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{module.title}</h4>
                              <p className="text-sm text-muted-foreground">{module.category}</p>
                            </div>
                            <Badge variant={module.status === "Completed" ? "outline" : "secondary"}>
                              {module.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Progress value={module.completionRate} className="h-2" />
                            </div>
                            <span className="text-sm font-medium">{module.completionRate}%</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-muted-foreground">Due: {module.dueDate}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTraining(module)
                                  setShowViewTrainingDialog(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedTraining(module)
                                  setShowEnrollTrainingDialog(true)
                                }}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Enroll Staff
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="newsletters" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Facility Newsletters</h3>
                  <p className="text-sm text-muted-foreground">Share updates, announcements, and news with staff</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Newsletter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Staff Newsletter</DialogTitle>
                      <DialogDescription>Compose and publish a newsletter for all facility staff</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="newsletter-title">Newsletter Title</Label>
                        <Input id="newsletter-title" placeholder="e.g., Monthly Updates - December 2024" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="newsletter-category">Category</Label>
                        <Select defaultValue="general">
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Announcement</SelectItem>
                            <SelectItem value="policy">Policy Update</SelectItem>
                            <SelectItem value="training">Training Notification</SelectItem>
                            <SelectItem value="compliance">Compliance Alert</SelectItem>
                            <SelectItem value="celebration">Staff Recognition</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="newsletter-content">Content</Label>
                        <Textarea
                          id="newsletter-content"
                          placeholder="Write your newsletter content here..."
                          className="min-h-[200px]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="newsletter-attachments">Attachments (optional)</Label>
                        <Input id="newsletter-attachments" type="file" multiple />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline">
                          Save Draft
                        </Button>
                        <Button type="submit">Publish Newsletter</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Monthly Safety Update - December 2024</CardTitle>
                        <CardDescription>Published on Dec 15, 2024 by Administrator</CardDescription>
                      </div>
                      <Badge>General</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Dear Team, This month we've made significant improvements to our facility safety protocols...
                    </p>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Newsletter
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                      <span className="text-xs text-muted-foreground ml-auto">243 staff members read</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>New DEA Compliance Training Requirements</CardTitle>
                        <CardDescription>Published on Dec 10, 2024 by Compliance Officer</CardDescription>
                      </div>
                      <Badge variant="secondary">Training</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      All clinical staff must complete the updated DEA compliance training module by December 31st...
                    </p>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Newsletter
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                      <span className="text-xs text-muted-foreground ml-auto">189 staff members read</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="meetings" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Government Body Meetings & Regulatory Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Track regulatory meetings, updates, and compliance deadlines
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Post Meeting/Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Post Government Body Meeting or Regulatory Update</DialogTitle>
                      <DialogDescription>Share important regulatory information with the facility</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="meeting-type">Update Type</Label>
                        <Select defaultValue="meeting">
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meeting">Government Body Meeting</SelectItem>
                            <SelectItem value="samhsa">SAMHSA Update</SelectItem>
                            <SelectItem value="dea">DEA Announcement</SelectItem>
                            <SelectItem value="state">State Regulatory Update</SelectItem>
                            <SelectItem value="obot">OBOT Guidance</SelectItem>
                            <SelectItem value="42cfr">42 CFR Part 2 Change</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="meeting-title">Title</Label>
                        <Input id="meeting-title" placeholder="e.g., SAMHSA OTP Guidelines 2025" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="meeting-date">Meeting/Effective Date</Label>
                        <Input id="meeting-date" type="date" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="meeting-agency">Regulatory Agency</Label>
                        <Input id="meeting-agency" placeholder="e.g., SAMHSA, DEA, State Opioid Authority" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="meeting-summary">Summary</Label>
                        <Textarea
                          id="meeting-summary"
                          placeholder="Provide a summary of the meeting or regulatory update..."
                          className="min-h-[150px]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="meeting-action">Action Items</Label>
                        <Textarea
                          id="meeting-action"
                          placeholder="List any action items or compliance requirements..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="meeting-deadline">Compliance Deadline (if applicable)</Label>
                        <Input id="meeting-deadline" type="date" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="meeting-attachments">Meeting Minutes / Documentation</Label>
                        <Input id="meeting-attachments" type="file" multiple />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline">
                          Save Draft
                        </Button>
                        <Button type="submit">Post Update</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>DEA Form 222 Ordering Changes - Effective Jan 1, 2025</CardTitle>
                        <CardDescription>Posted on Dec 18, 2024 • Compliance Deadline: January 1, 2025</CardDescription>
                      </div>
                      <Badge variant="destructive">Action Required</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Summary:</h4>
                      <p className="text-sm text-muted-foreground">
                        New DEA regulations require electronic submission of Form 222 for Schedule II medications
                        effective January 1, 2025. All facilities must register for CSOS (Controlled Substance Ordering
                        System) by December 31, 2024.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Action Items:</h4>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Register for CSOS account at DEA.gov</li>
                        <li>Complete staff training on electronic Form 222</li>
                        <li>Update inventory management procedures</li>
                        <li>Contact medication suppliers to confirm CSOS capability</li>
                      </ul>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Document
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download Meeting Minutes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>SAMHSA OTP Guidelines Update - Take-Home Dosing Flexibility</CardTitle>
                        <CardDescription>Posted on Dec 12, 2024 • Informational</CardDescription>
                      </div>
                      <Badge variant="secondary">Informational</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Summary:</h4>
                      <p className="text-sm text-muted-foreground">
                        SAMHSA has issued updated guidance on take-home medication dosing for stable OTP patients. The
                        new guidelines provide increased flexibility for physicians to authorize up to 14 days of
                        take-home doses for patients who meet stability criteria.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Document
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download Guidelines
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>State OAT Advisory Board Meeting Summary</CardTitle>
                        <CardDescription>Meeting Date: December 8, 2024</CardDescription>
                      </div>
                      <Badge variant="outline">Meeting</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Key Discussion Points:</h4>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Buprenorphine prescribing updates and X-waiver elimination review</li>
                        <li>State Medicaid reimbursement rate adjustments for 2025</li>
                        <li>Peer recovery specialist certification requirements</li>
                        <li>Integration of behavioral health services with primary care</li>
                      </ul>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Meeting Minutes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* The following TabsContent for "training" was a duplicate and has been removed */}

            <TabsContent value="compliance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Overall Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        ((data?.stats?.equipmentComplianceRate || 0) + (data?.stats?.trainingComplianceRate || 0)) / 2,
                      )}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">Facility-wide compliance score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Pending Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {(data?.stats?.equipmentDueThisWeek || 0) + (data?.stats?.trainingDueThisMonth || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Require attention this month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Next Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data?.stats?.lastUpdated || "N/A"}</div>
                    <p className="text-xs text-muted-foreground">Annual compliance review</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Reports</CardTitle>
                  <CardDescription>Generate and view compliance documentation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
                      onClick={() => handleGenerateComplianceReport("hazard")}
                    >
                      <Shield className="h-6 w-6" />
                      <span>HVA Report</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
                      onClick={() => handleGenerateComplianceReport("equipment")}
                    >
                      <Wrench className="h-6 w-6" />
                      <span>Equipment Inspection Report</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
                      onClick={() => handleGenerateComplianceReport("training")}
                    >
                      <Users className="h-6 w-6" />
                      <span>Training Compliance Report</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add the new training tab content here */}
            <TabsContent value="training" className="space-y-6">
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Admin & Opioid Sponsor Comments on Training
                  </CardTitle>
                  <CardDescription>
                    Administrators and opioid treatment program sponsors can provide feedback and guidance on staff
                    training
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Training Comment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Training Comment or Guidance</DialogTitle>
                        <DialogDescription>
                          Provide feedback, guidance, or requirements for staff training programs
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="comment-author-role">Your Role</Label>
                          <Select defaultValue="admin">
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Facility Administrator</SelectItem>
                              <SelectItem value="opioid-sponsor">Opioid Treatment Program Sponsor</SelectItem>
                              <SelectItem value="medical-director">Medical Director</SelectItem>
                              <SelectItem value="compliance-officer">Compliance Officer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="comment-training">Related Training Module</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select training module" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dea">DEA Compliance Training</SelectItem>
                              <SelectItem value="42cfr">42 CFR Part 2 Training</SelectItem>
                              <SelectItem value="hipaa">HIPAA Security Training</SelectItem>
                              <SelectItem value="infectious">Infectious Disease Control</SelectItem>
                              <SelectItem value="all">All Training Modules</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="comment-type">Comment Type</Label>
                          <Select defaultValue="guidance">
                            <SelectTrigger>
                              <SelectValue placeholder="Select comment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="guidance">Training Guidance</SelectItem>
                              <SelectItem value="requirement">New Requirement</SelectItem>
                              <SelectItem value="feedback">Staff Feedback</SelectItem>
                              <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                              <SelectItem value="concern">Concern</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="comment-content">Comment</Label>
                          <Textarea
                            id="comment-content"
                            placeholder="Provide your training comment or guidance..."
                            className="min-h-[150px]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="comment-priority">Priority Level</Label>
                          <Select defaultValue="medium">
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High - Immediate Action Required</SelectItem>
                              <SelectItem value="medium">Medium - Plan for Implementation</SelectItem>
                              <SelectItem value="low">Low - For Consideration</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                          <Button type="submit">Post Comment</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-red-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">DEA Compliance Training - Enhanced Requirements</CardTitle>
                            <CardDescription>Posted by Medical Director on Dec 17, 2024</CardDescription>
                          </div>
                          <Badge variant="destructive">High Priority</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          All nursing staff involved in medication dispensing must complete the enhanced DEA compliance
                          training module by December 31st. This is a new requirement from our program sponsor and is
                          mandatory for continued operation. The module covers updated Form 222 procedures, inventory
                          reconciliation, and diversion prevention protocols.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Related: DEA Compliance Training</span>
                          <span>•</span>
                          <span>Type: New Requirement</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              42 CFR Part 2 Training - Additional Resources Needed
                            </CardTitle>
                            <CardDescription>Posted by OTP Sponsor on Dec 14, 2024</CardDescription>
                          </div>
                          <Badge variant="secondary">Medium Priority</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          The current 42 CFR Part 2 training module should include more practical case studies and
                          scenarios. Staff have reported difficulty applying the concepts to real-world situations. I
                          recommend adding interactive case-based learning modules and role-playing exercises to improve
                          comprehension and retention.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Related: 42 CFR Part 2 Training</span>
                          <span>•</span>
                          <span>Type: Improvement Suggestion</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Excellent Completion Rate on HIPAA Training</CardTitle>
                            <CardDescription>Posted by Facility Administrator on Dec 10, 2024</CardDescription>
                          </div>
                          <Badge variant="outline">Positive Feedback</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          I want to commend all staff for achieving a 98% completion rate on the annual HIPAA Security
                          Training. This demonstrates our commitment to patient privacy and data security. The training
                          coordinator has done an excellent job making the content accessible and engaging.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Related: HIPAA Security Training</span>
                          <span>•</span>
                          <span>Type: Staff Feedback</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Low Stock Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">8</div>
                    <p className="text-xs text-muted-foreground">Items need reordering</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">247</div>
                    <p className="text-xs text-muted-foreground">In inventory system</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">12</div>
                    <p className="text-xs text-muted-foreground">Within 30 days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">5</div>
                    <p className="text-xs text-muted-foreground">Supply categories</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Facility Inventory Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Track medical supplies, medications, and facility equipment with automatic low stock alerts
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Inventory Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Inventory Item</DialogTitle>
                      <DialogDescription>Add a new item to facility inventory tracking</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="item-category">Category</Label>
                          <Select defaultValue="medical">
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="medical">Medical Supplies</SelectItem>
                              <SelectItem value="vaccines">Vaccines & Flu Shots</SelectItem>
                              <SelectItem value="cleaning">Cleaning Supplies</SelectItem>
                              <SelectItem value="medications">Generic Medications</SelectItem>
                              <SelectItem value="wound-care">Wound Care Supplies</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="item-name">Item Name</Label>
                          <Input id="item-name" placeholder="e.g., Influenza Vaccine" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="item-quantity">Current Quantity</Label>
                          <Input id="item-quantity" type="number" placeholder="e.g., 100" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="item-unit">Unit of Measure</Label>
                          <Select defaultValue="units">
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="units">Units</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="bottles">Bottles</SelectItem>
                              <SelectItem value="vials">Vials</SelectItem>
                              <SelectItem value="doses">Doses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="item-reorder-level">Reorder Level (Low Stock Alert)</Label>
                          <Input id="item-reorder-level" type="number" placeholder="e.g., 20" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="item-expiration">Expiration Date</Label>
                          <Input id="item-expiration" type="date" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="item-lot">Lot Number</Label>
                          <Input id="item-lot" placeholder="e.g., LOT-2024-001" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="item-location">Storage Location</Label>
                          <Input id="item-location" placeholder="e.g., Med Room Cabinet A" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="item-notes">Notes</Label>
                        <Textarea id="item-notes" placeholder="Additional information..." />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                        <Button type="submit">Add to Inventory</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Low Stock Alerts Section */}
              <Card className="border-2 border-red-200 bg-red-50/50 dark:bg-red-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Low Stock Alerts - Immediate Action Required
                  </CardTitle>
                  <CardDescription>Items below reorder level that need restocking</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Reorder Level</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-red-100/50 dark:bg-red-950/20">
                        <TableCell className="font-medium">Influenza Vaccine (Flu Shot)</TableCell>
                        <TableCell>
                          <Badge variant="outline">Vaccines</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">8 doses</span>
                        </TableCell>
                        <TableCell>25 doses</TableCell>
                        <TableCell>Refrigerator Unit A</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive">
                            Order Now
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-red-100/50 dark:bg-red-950/20">
                        <TableCell className="font-medium">Sterile Gauze Pads (4x4)</TableCell>
                        <TableCell>
                          <Badge variant="outline">Wound Care</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">12 boxes</span>
                        </TableCell>
                        <TableCell>30 boxes</TableCell>
                        <TableCell>Supply Room B</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive">
                            Order Now
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-red-100/50 dark:bg-red-950/20">
                        <TableCell className="font-medium">Hand Sanitizer (Gallon)</TableCell>
                        <TableCell>
                          <Badge variant="outline">Cleaning</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">3 gallons</span>
                        </TableCell>
                        <TableCell>15 gallons</TableCell>
                        <TableCell>Janitorial Closet</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive">
                            Order Now
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-red-100/50 dark:bg-red-950/20">
                        <TableCell className="font-medium">Acetaminophen 500mg</TableCell>
                        <TableCell>
                          <Badge variant="outline">Generic Medications</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">45 tablets</span>
                        </TableCell>
                        <TableCell>100 tablets</TableCell>
                        <TableCell>Medication Cart 2</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive">
                            Order Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Inventory by Category */}
              <Tabs defaultValue="vaccines" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="vaccines">Vaccines & Flu Shots</TabsTrigger>
                  <TabsTrigger value="cleaning">Cleaning Supplies</TabsTrigger>
                  <TabsTrigger value="medications">Generic Medications</TabsTrigger>
                  <TabsTrigger value="wound-care">Wound Care</TabsTrigger>
                  <TabsTrigger value="medical">Medical Supplies</TabsTrigger>
                </TabsList>

                <TabsContent value="vaccines" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vaccines & Flu Shots Inventory</CardTitle>
                      <CardDescription>Track vaccine stock levels and expiration dates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vaccine Name</TableHead>
                            <TableHead>Lot Number</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Expiration Date</TableHead>
                            <TableHead>Storage Temp</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Influenza Vaccine 2024-25</TableCell>
                            <TableCell>FLU-2024-A</TableCell>
                            <TableCell>
                              <Badge variant="destructive">8 doses</Badge>
                            </TableCell>
                            <TableCell>06/30/2025</TableCell>
                            <TableCell>2-8°C</TableCell>
                            <TableCell>
                              <Badge variant="destructive">Low Stock</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  Use
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Hepatitis B Vaccine</TableCell>
                            <TableCell>HEP-2024-B</TableCell>
                            <TableCell>67 doses</TableCell>
                            <TableCell>08/15/2025</TableCell>
                            <TableCell>2-8°C</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  Use
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Tetanus Vaccine (Td)</TableCell>
                            <TableCell>TET-2024-C</TableCell>
                            <TableCell>42 doses</TableCell>
                            <TableCell>11/20/2025</TableCell>
                            <TableCell>2-8°C</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  Use
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cleaning" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cleaning Supplies Inventory</CardTitle>
                      <CardDescription>Track cleaning and sanitation supplies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Reorder Level</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Hand Sanitizer (Gallon)</TableCell>
                            <TableCell>
                              <Badge variant="destructive">3</Badge>
                            </TableCell>
                            <TableCell>Gallons</TableCell>
                            <TableCell>15</TableCell>
                            <TableCell>Janitorial Closet</TableCell>
                            <TableCell>
                              <Badge variant="destructive">Low Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Disinfectant Wipes (Large Container)</TableCell>
                            <TableCell>34</TableCell>
                            <TableCell>Containers</TableCell>
                            <TableCell>20</TableCell>
                            <TableCell>Supply Room A</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Surface Disinfectant Spray</TableCell>
                            <TableCell>28</TableCell>
                            <TableCell>Bottles</TableCell>
                            <TableCell>15</TableCell>
                            <TableCell>Janitorial Closet</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Nitrile Gloves (Box of 100)</TableCell>
                            <TableCell>18</TableCell>
                            <TableCell>Boxes</TableCell>
                            <TableCell>25</TableCell>
                            <TableCell>Supply Room B</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Below Optimal</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="medications" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Generic Medications Inventory</CardTitle>
                      <CardDescription>Track over-the-counter and generic medications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Medication</TableHead>
                            <TableHead>Strength</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Expiration</TableHead>
                            <TableHead>NDC</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Acetaminophen</TableCell>
                            <TableCell>500mg</TableCell>
                            <TableCell>
                              <Badge variant="destructive">45 tablets</Badge>
                            </TableCell>
                            <TableCell>03/2026</TableCell>
                            <TableCell>00904-xxxx</TableCell>
                            <TableCell>
                              <Badge variant="destructive">Low Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Ibuprofen</TableCell>
                            <TableCell>200mg</TableCell>
                            <TableCell>287 tablets</TableCell>
                            <TableCell>07/2026</TableCell>
                            <TableCell>00113-xxxx</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Diphenhydramine</TableCell>
                            <TableCell>25mg</TableCell>
                            <TableCell>156 tablets</TableCell>
                            <TableCell>05/2026</TableCell>
                            <TableCell>00536-xxxx</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="wound-care" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Wound Care Supplies Inventory</CardTitle>
                      <CardDescription>Track wound care and first aid supplies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Reorder Level</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Sterile Gauze Pads (4x4)</TableCell>
                            <TableCell>
                              <Badge variant="destructive">12 boxes</Badge>
                            </TableCell>
                            <TableCell>Boxes (100 ct)</TableCell>
                            <TableCell>30</TableCell>
                            <TableCell>
                              <Badge variant="destructive">Low Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Adhesive Bandages (Assorted)</TableCell>
                            <TableCell>67 boxes</TableCell>
                            <TableCell>Boxes (100 ct)</TableCell>
                            <TableCell>40</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Medical Tape (1" Roll)</TableCell>
                            <TableCell>34 rolls</TableCell>
                            <TableCell>Rolls</TableCell>
                            <TableCell>25</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Triple Antibiotic Ointment</TableCell>
                            <TableCell>89 tubes</TableCell>
                            <TableCell>Tubes</TableCell>
                            <TableCell>50</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Medical Supplies Inventory</CardTitle>
                      <CardDescription>Track general medical equipment and supplies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Reorder Level</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Thermometer Probe Covers</TableCell>
                            <TableCell>234</TableCell>
                            <TableCell>Covers</TableCell>
                            <TableCell>200</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Blood Pressure Cuffs (Disposable)</TableCell>
                            <TableCell>78</TableCell>
                            <TableCell>Cuffs</TableCell>
                            <TableCell>50</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Tongue Depressors (Box)</TableCell>
                            <TableCell>45</TableCell>
                            <TableCell>Boxes (500 ct)</TableCell>
                            <TableCell>30</TableCell>
                            <TableCell>
                              <Badge variant="outline">In Stock</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
            {/* ... existing TabsContent sections ... */}
          </Tabs>
        </main>
      </div>

      <Dialog open={showEditHazardDialog} onOpenChange={setShowEditHazardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hazard Assessment</DialogTitle>
            <DialogDescription>Update hazard vulnerability scores.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditHazard}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editHazardName">Hazard Name</Label>
                <Input id="editHazardName" name="hazardName" defaultValue={selectedHazard?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editCategory">Category</Label>
                <Select name="category" defaultValue={selectedHazard?.category || "Natural"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Natural">Natural</SelectItem>
                    <SelectItem value="Technological">Technological</SelectItem>
                    <SelectItem value="Human">Human</SelectItem>
                    <SelectItem value="Hazardous Materials">Hazardous Materials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="probability">Probability (1-5)</Label>
                  <Input
                    id="probability"
                    name="probability"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={selectedHazard?.probability || 1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="humanImpact">Human Impact (1-5)</Label>
                  <Input
                    id="humanImpact"
                    name="humanImpact"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={selectedHazard?.humanImpact || 1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="propertyImpact">Property Impact (1-5)</Label>
                  <Input
                    id="propertyImpact"
                    name="propertyImpact"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={selectedHazard?.propertyImpact || 1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="businessImpact">Business Impact (1-5)</Label>
                  <Input
                    id="businessImpact"
                    name="businessImpact"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={selectedHazard?.businessImpact || 1}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preparedness">Preparedness Level (1-5)</Label>
                <Input
                  id="preparedness"
                  name="preparedness"
                  type="number"
                  min="1"
                  max="5"
                  defaultValue={selectedHazard?.preparedness || 1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditHazardDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewEquipmentDialog} onOpenChange={setShowViewEquipmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Equipment Details</DialogTitle>
            <DialogDescription>View equipment information and inspection history.</DialogDescription>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Equipment Name</Label>
                  <p className="font-medium">{selectedEquipment.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedEquipment.type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{selectedEquipment.location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className={`font-medium ${getStatusColor(selectedEquipment.status)}`}>
                    {selectedEquipment.status}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Last Check</Label>
                  <p className="font-medium">{selectedEquipment.lastCheck}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Next Check</Label>
                  <p className="font-medium">{selectedEquipment.nextCheck}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Inspector</Label>
                <p className="font-medium">{selectedEquipment.inspector}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewEquipmentDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowViewEquipmentDialog(false)
                setShowEquipmentCheckDialog(true)
              }}
            >
              Perform Check
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEquipmentCheckDialog} onOpenChange={setShowEquipmentCheckDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perform Equipment Check</DialogTitle>
            <DialogDescription>Record a new inspection for {selectedEquipment?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePerformEquipmentCheck}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="checkStatus">Status</Label>
                <Select name="status" defaultValue="Good">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Needs Restocking">Needs Restocking</SelectItem>
                    <SelectItem value="Low Pressure">Low Pressure</SelectItem>
                    <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkInspector">Inspector Name</Label>
                <Input id="checkInspector" name="inspector" placeholder="Your name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkNotes">Notes</Label>
                <Textarea id="checkNotes" name="notes" placeholder="Any observations or issues..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEquipmentCheckDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Record Check"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewTrainingDialog} onOpenChange={setShowViewTrainingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training Module Details</DialogTitle>
            <DialogDescription>View training module information and progress.</DialogDescription>
          </DialogHeader>
          {selectedTraining && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Module Title</Label>
                <p className="font-medium">{selectedTraining.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedTraining.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedTraining.status === "Completed" ? "outline" : "secondary"}>
                    {selectedTraining.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Completion Rate</Label>
                <div className="flex items-center gap-4 mt-1">
                  <Progress value={selectedTraining.completionRate} className="flex-1 h-2" />
                  <span className="font-medium">{selectedTraining.completionRate}%</span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Due Date</Label>
                <p className="font-medium">{selectedTraining.dueDate}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewTrainingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEnrollTrainingDialog} onOpenChange={setShowEnrollTrainingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Staff in Training</DialogTitle>
            <DialogDescription>Enroll a staff member in {selectedTraining?.title}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnrollTraining}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staffName">Staff Name</Label>
                <Input id="staffName" name="staffName" placeholder="Enter staff name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staffEmail">Staff Email</Label>
                <Input id="staffEmail" name="staffEmail" type="email" placeholder="staff@example.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetDate">Target Completion Date</Label>
                <Input id="targetDate" name="targetDate" type="date" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEnrollTrainingDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enrolling..." : "Enroll Staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewTrainingDialog} onOpenChange={setShowNewTrainingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Training Module</DialogTitle>
            <DialogDescription>Create a new staff training module.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTrainingModule}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="trainingTitle">Module Title</Label>
                <Input id="trainingTitle" name="title" placeholder="e.g., HIPAA Annual Training" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trainingCategory">Category</Label>
                <Select name="category" defaultValue="Compliance">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Clinical">Clinical</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Policy">Policy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trainingDueDate">Due Date</Label>
                <Input id="trainingDueDate" name="dueDate" type="date" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trainingCEU">CEU Hours</Label>
                <Input id="trainingCEU" name="ceuHours" type="number" step="0.5" placeholder="e.g., 2.0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trainingDescription">Description</Label>
                <Textarea id="trainingDescription" name="description" placeholder="Describe the training module..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewTrainingDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Module"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
