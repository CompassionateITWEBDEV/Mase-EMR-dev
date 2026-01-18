"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Target, TrendingUp, Award, AlertCircle, Download, CheckCircle2, Plus, RefreshCw, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function QualityDashboardPage() {
  const { toast } = useToast()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedSpecialty, setSelectedSpecialty] = useState("all")
  const [isAddMeasureOpen, setIsAddMeasureOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [newMeasure, setNewMeasure] = useState({
    measure_id: "",
    measure_name: "",
    measure_type: "process",
    specialty: "Behavioral Health",
    description: "",
    numerator_criteria: "",
    denominator_criteria: "",
  })

  const {
    data: qualityData,
    isLoading,
    mutate,
  } = useSWR(`/api/quality-measures?year=${selectedYear}&specialty=${selectedSpecialty}`, fetcher)

  const measures = qualityData?.measures || []

  // Calculate overall statistics
  const totalMeasures = measures.length
  const measuresReporting = measures.filter((m: any) => m.denominator > 0).length
  const measuresMeetingGoal = measures.filter((m: any) => m.performance_rate >= 75).length
  const avgPerformance =
    measures.length > 0
      ? (measures.reduce((sum: number, m: any) => sum + (m.performance_rate || 0), 0) / measures.length).toFixed(1)
      : "0.0"

  const handleAddMeasure = async () => {
    try {
      const res = await fetch("/api/quality-measures/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMeasure),
      })
      if (!res.ok) throw new Error("Failed to add measure")

      toast({ title: "Measure Added", description: "Quality measure has been added." })
      setIsAddMeasureOpen(false)
      setNewMeasure({
        measure_id: "",
        measure_name: "",
        measure_type: "process",
        specialty: "Behavioral Health",
        description: "",
        numerator_criteria: "",
        denominator_criteria: "",
      })
      mutate()
    } catch (error) {
      toast({ title: "Error", description: "Failed to add measure.", variant: "destructive" })
    }
  }

  const handleExportQRDA = () => {
    const qrdaData = {
      reportType: "QRDA-III",
      reportingPeriod: selectedYear,
      generatedAt: new Date().toISOString(),
      measures: measures.map((m: any) => ({
        measureId: m.measure_id,
        measureName: m.measure_name,
        performanceRate: m.performance_rate,
        numerator: m.numerator,
        denominator: m.denominator,
        dataCompleteness: m.data_completeness,
      })),
    }

    const blob = new Blob([JSON.stringify(qrdaData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `QRDA-III-${selectedYear}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({ title: "Export Complete", description: "QRDA-III report has been exported." })
    setIsExportOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <div className="lg:pl-64">
        <DashboardHeader />

        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">MIPS Quality Dashboard</h1>
              <p className="text-muted-foreground">Track quality measures and value-based care performance</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="Behavioral Health">Behavioral Health</SelectItem>
                  <SelectItem value="Primary Care">Primary Care</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="OB/GYN">OB/GYN</SelectItem>
                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                  <SelectItem value="Podiatry">Podiatry</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Button variant="outline" onClick={() => setIsAddMeasureOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Measure
              </Button>

              <Button onClick={() => setIsExportOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export QRDA
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Measures</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalMeasures}</div>
                    <p className="text-xs text-muted-foreground">{measuresReporting} actively reporting</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avgPerformance}%</div>
                    <p className="text-xs text-muted-foreground">Across all measures</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Meeting Goal</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{measuresMeetingGoal}</div>
                    <p className="text-xs text-muted-foreground">Measures ≥75% performance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Data Completeness</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {measures.filter((m: any) => m.meets_data_completeness).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Measures meeting 75% threshold</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Measures Table */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Measures Performance</CardTitle>
              <CardDescription>MIPS 2025 requires reporting 6 measures including 1 outcome measure</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : measures.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Quality Measures</h3>
                  <p className="text-muted-foreground">Add quality measures to start tracking performance.</p>
                  <Button className="mt-4" onClick={() => setIsAddMeasureOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Measure
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {measures.map((measure: any) => (
                    <div key={measure.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{measure.measure_name}</h3>
                            <Badge variant="outline">{measure.measure_id}</Badge>
                            <Badge variant={measure.measure_type === "outcome" ? "default" : "secondary"}>
                              {measure.measure_type}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{measure.description}</p>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold">{measure.performance_rate || 0}%</div>
                          <div className="text-xs text-muted-foreground">
                            {measure.numerator || 0} / {measure.denominator || 0} patients
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span>Performance Rate</span>
                            <span className="font-medium">{measure.performance_rate || 0}%</span>
                          </div>
                          <Progress value={measure.performance_rate || 0} />
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span>Data Completeness</span>
                            <span className="font-medium">{measure.data_completeness || 0}%</span>
                          </div>
                          <Progress
                            value={measure.data_completeness || 0}
                            className={measure.meets_data_completeness ? "" : "bg-red-100"}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        {measure.meets_minimum ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Meets minimum cases
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Needs {Math.max(20 - (measure.denominator || 0), 0)} more cases
                          </Badge>
                        )}

                        {measure.meets_data_completeness ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Meets data completeness
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Below 75% threshold
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Measure Dialog */}
      <Dialog open={isAddMeasureOpen} onOpenChange={setIsAddMeasureOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Quality Measure</DialogTitle>
            <DialogDescription>Add a new MIPS quality measure to track</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Measure ID</Label>
                <Input
                  placeholder="e.g., CMS128v12"
                  value={newMeasure.measure_id}
                  onChange={(e) => setNewMeasure({ ...newMeasure, measure_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Measure Type</Label>
                <Select
                  value={newMeasure.measure_type}
                  onValueChange={(v) => setNewMeasure({ ...newMeasure, measure_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="process">Process</SelectItem>
                    <SelectItem value="outcome">Outcome</SelectItem>
                    <SelectItem value="structure">Structure</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Measure Name</Label>
              <Input
                placeholder="e.g., Depression Remission at 12 Months"
                value={newMeasure.measure_name}
                onChange={(e) => setNewMeasure({ ...newMeasure, measure_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Select
                value={newMeasure.specialty}
                onValueChange={(v) => setNewMeasure({ ...newMeasure, specialty: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Behavioral Health">Behavioral Health</SelectItem>
                  <SelectItem value="Primary Care">Primary Care</SelectItem>
                  <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the quality measure..."
                value={newMeasure.description}
                onChange={(e) => setNewMeasure({ ...newMeasure, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Numerator Criteria</Label>
              <Textarea
                placeholder="Patients who meet the performance criteria..."
                value={newMeasure.numerator_criteria}
                onChange={(e) => setNewMeasure({ ...newMeasure, numerator_criteria: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Denominator Criteria</Label>
              <Textarea
                placeholder="Initial population of eligible patients..."
                value={newMeasure.denominator_criteria}
                onChange={(e) => setNewMeasure({ ...newMeasure, denominator_criteria: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMeasureOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMeasure}>Add Measure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export QRDA Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export QRDA Report</DialogTitle>
            <DialogDescription>Generate a QRDA-III quality report for CMS submission</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Report Summary</h4>
              <div className="space-y-1 text-sm">
                <p>Reporting Year: {selectedYear}</p>
                <p>Total Measures: {totalMeasures}</p>
                <p>Measures Meeting Goal: {measuresMeetingGoal}</p>
                <p>Average Performance: {avgPerformance}%</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will generate a QRDA-III formatted report suitable for submission to CMS for MIPS reporting.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportQRDA}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
