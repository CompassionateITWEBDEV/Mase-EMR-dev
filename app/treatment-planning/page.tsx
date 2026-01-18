"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Target, Plus, Trash2, FileCheck, Brain, Info, User, Loader2 } from "lucide-react"
import { toast } from "sonner"

// ASAM Level options with full descriptions
const ASAM_LEVELS = [
  { value: "0.5", label: "Level 0.5 - Early Intervention" },
  { value: "1.0", label: "Level 1.0 - Outpatient Services (OTP MAT)" },
  { value: "2.1", label: "Level 2.1 - Intensive Outpatient (IOP)" },
  { value: "2.5", label: "Level 2.5 - Partial Hospitalization (PHP)" },
  { value: "3.1", label: "Level 3.1 - Clinically Managed Low-Intensity Residential" },
  { value: "3.3", label: "Level 3.3 - Clinically Managed High-Intensity Residential" },
  { value: "3.5", label: "Level 3.5 - Clinically Managed High-Intensity Residential" },
  { value: "3.7", label: "Level 3.7 - Medically Monitored Intensive Inpatient" },
  { value: "4.0", label: "Level 4.0 - Medically Managed Intensive Inpatient" },
]

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface ASAMAssessment {
  id: string
  created_at: string
  recommended_level: string | null
}

function TreatmentPlanningContent() {
  const searchParams = useSearchParams()
  const levelFromUrl = searchParams.get("level")
  const patientIdFromUrl = searchParams.get("patientId")

  const [goals, setGoals] = useState([{ id: 1, goal: "", objectives: [""], interventions: [""] }])
  const [asamLevel, setAsamLevel] = useState(levelFromUrl || "")
  const [patient, setPatient] = useState<Patient | null>(null)
  const [latestASAM, setLatestASAM] = useState<ASAMAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [prefillSource, setPrefillSource] = useState<"url" | "fetched" | null>(null)

  // Fetch patient and latest ASAM assessment
  useEffect(() => {
    const fetchData = async () => {
      if (!patientIdFromUrl) return

      setIsLoading(true)
      try {
        // Fetch patient info
        const patientRes = await fetch(`/api/patients/${patientIdFromUrl}`)
        if (patientRes.ok) {
          const patientData = await patientRes.json()
          setPatient(patientData.patient || patientData)
        }

        // Fetch latest ASAM assessment
        const asamRes = await fetch(`/api/assessments/asam?patient_id=${patientIdFromUrl}`)
        if (asamRes.ok) {
          const asamData = await asamRes.json()
          if (asamData.assessments && asamData.assessments.length > 0) {
            const latest = asamData.assessments[0] // Already sorted by created_at desc
            setLatestASAM(latest)

            // If no level from URL, use the latest assessment
            if (!levelFromUrl && latest.recommended_level) {
              setAsamLevel(latest.recommended_level)
              setPrefillSource("fetched")
            }
          }
        }

        // If level came from URL, mark it
        if (levelFromUrl) {
          setPrefillSource("url")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [patientIdFromUrl, levelFromUrl])

  const addGoal = () => {
    setGoals([...goals, { id: goals.length + 1, goal: "", objectives: [""], interventions: [""] }])
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const getLevelBadgeVariant = (level: string): "default" | "secondary" | "destructive" => {
    const numLevel = parseFloat(level)
    if (numLevel >= 3.7) return "destructive"
    if (numLevel >= 2.5) return "default"
    return "secondary"
  }

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Initial Treatment Plan</h1>
          <p className="text-muted-foreground">Create individualized treatment plan based on ASAM assessment</p>
        </div>

        {/* Patient Info Banner */}
        {patient && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Creating treatment plan for{" "}
                <strong>
                  {patient.first_name} {patient.last_name}
                </strong>
              </span>
              {latestASAM && (
                <Badge variant="outline" className="ml-2">
                  Latest ASAM: {formatDate(latestASAM.created_at)}
                </Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* ASAM Pre-fill notification */}
        {prefillSource && asamLevel && (
          <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
            <Brain className="h-4 w-4 text-purple-600" />
            <AlertDescription className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <span>
                ASAM Level{" "}
                <Badge variant={getLevelBadgeVariant(asamLevel)} className="mx-1">
                  {asamLevel}
                </Badge>
                {prefillSource === "url"
                  ? "pre-filled from intake assessment"
                  : `pre-filled from assessment on ${latestASAM ? formatDate(latestASAM.created_at) : "record"}`}
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Patient & Program Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                ASAM Level of Care
                {prefillSource && (
                  <Badge variant="outline" className="text-xs">
                    Pre-filled
                  </Badge>
                )}
              </Label>
              <Select value={asamLevel} onValueChange={setAsamLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {ASAM_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary Counselor</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Assign counselor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counselor1">John Smith, LCADC</SelectItem>
                  <SelectItem value="counselor2">Sarah Johnson, LCSW</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Treatment Start Date</Label>
              <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <Label>Anticipated Length of Treatment</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="ongoing">Ongoing/Long-term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Treatment Goals & Objectives
              </div>
              <Button onClick={addGoal} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {goals.map((goal, idx) => (
              <div key={goal.id} className="border-l-4 border-blue-500 pl-4 space-y-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold">Goal #{idx + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => setGoals(goals.filter((g) => g.id !== goal.id))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label>Measurable Goal Statement</Label>
                  <Input placeholder="e.g., Achieve abstinence from opioids for 90 consecutive days" />
                </div>
                <div>
                  <Label>Objectives (Steps to achieve goal)</Label>
                  <Textarea placeholder="List specific, measurable objectives..." rows={3} />
                </div>
                <div>
                  <Label>Interventions & Services</Label>
                  <Textarea
                    placeholder="MAT, individual counseling (1x/week), group therapy (2x/week), case management..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Date</Label>
                    <Input type="date" />
                  </div>
                  <div>
                    <Label>Review Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Plan Schedule</CardTitle>
            <CardDescription>
              {asamLevel && (
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Recommended services based on ASAM Level {asamLevel}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Individual Counseling Frequency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1xweek">1x per week (SAMHSA minimum)</SelectItem>
                  <SelectItem value="2xweek">2x per week</SelectItem>
                  <SelectItem value="1xmonth">1x per month (reduced frequency)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Group Counseling Frequency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2xweek">2x per week (SAMHSA minimum)</SelectItem>
                  <SelectItem value="3xweek">3x per week</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Case Management</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select if needed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - Monthly</SelectItem>
                  <SelectItem value="intensive">Yes - Weekly (Intensive)</SelectItem>
                  <SelectItem value="no">Not needed at this time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Peer Recovery Support</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select if needed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - As needed</SelectItem>
                  <SelectItem value="weekly">Yes - Weekly check-ins</SelectItem>
                  <SelectItem value="no">Not requested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={() => toast.success("Treatment plan created and sent for patient signature")}>
            <FileCheck className="mr-2 h-4 w-4" />
            Complete & Get Patient Signature
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TreatmentPlanningPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-8 ml-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TreatmentPlanningContent />
    </Suspense>
  )
}
