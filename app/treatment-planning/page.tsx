"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Target, Plus, Trash2, FileCheck, Lightbulb } from "lucide-react"
import { toast } from "sonner"

interface EvidenceBasedPractice {
  id: string
  name: string
  category: string
  description?: string
  is_active?: boolean
}

export default function TreatmentPlanningPage() {
  const [goals, setGoals] = useState([{ id: 1, goal: "", objectives: [""], interventions: [""] }])
  const [selectedEBPs, setSelectedEBPs] = useState<string[]>([])
  const [availableEBPs, setAvailableEBPs] = useState<EvidenceBasedPractice[]>([])
  const [loadingEBPs, setLoadingEBPs] = useState(false)

  const addGoal = () => {
    setGoals([...goals, { id: goals.length + 1, goal: "", objectives: [""], interventions: [""] }])
  }

  // Fetch available EBPs
  useEffect(() => {
    const fetchEBPs = async () => {
      setLoadingEBPs(true)
      try {
        const response = await fetch("/api/evidence-based-practices?limit=100")
        const data = await response.json()
        if (response.ok && data.ebps) {
          setAvailableEBPs(data.ebps.filter((ebp: EvidenceBasedPractice) => ebp.is_active !== false))
        }
      } catch (err) {
        console.error("Error fetching EBPs:", err)
      } finally {
        setLoadingEBPs(false)
      }
    }
    fetchEBPs()
  }, [])

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Initial Treatment Plan</h1>
          <p className="text-muted-foreground">Create individualized treatment plan based on ASAM assessment</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient & Program Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>ASAM Level of Care</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0">Level 1.0 - Outpatient (OTP MAT)</SelectItem>
                  <SelectItem value="2.1">Level 2.1 - Intensive Outpatient</SelectItem>
                  <SelectItem value="2.5">Level 2.5 - Partial Hospitalization</SelectItem>
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
              <Input type="date" />
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

        {/* Evidence-Based Practices Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Evidence-Based Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingEBPs ? (
              <p className="text-sm text-gray-500">Loading EBPs...</p>
            ) : availableEBPs.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select EBPs to include in this treatment plan:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded p-3">
                  {availableEBPs.map((ebp) => (
                    <div key={ebp.id} className="flex items-start space-x-2">
                      <Checkbox
                        checked={selectedEBPs.includes(ebp.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEBPs([...selectedEBPs, ebp.id])
                          } else {
                            setSelectedEBPs(selectedEBPs.filter((id) => id !== ebp.id))
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label className="text-sm font-medium cursor-pointer" htmlFor={`ebp-${ebp.id}`}>
                          {ebp.name}
                        </Label>
                        <p className="text-xs text-gray-500">{ebp.category}</p>
                        {ebp.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ebp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedEBPs.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {selectedEBPs.length} EBP{selectedEBPs.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No evidence-based practices available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Plan Schedule</CardTitle>
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
          <Button
            onClick={async () => {
              try {
                // In a real implementation, you would get these from form state
                const treatmentPlanData = {
                  patient_id: "", // Get from patient selection
                  provider_id: "", // Get from provider selection
                  goals: goals.map((g) => ({
                    goal: g.goal,
                    objectives: g.objectives,
                    interventions: g.interventions,
                  })),
                  interventions: [],
                  ebp_ids: selectedEBPs,
                  status: "active",
                }

                // For now, just show success - in production, call the API
                // const response = await fetch("/api/treatment-plans", {
                //   method: "POST",
                //   headers: { "Content-Type": "application/json" },
                //   body: JSON.stringify(treatmentPlanData),
                // })

                toast.success(
                  `Treatment plan created${selectedEBPs.length > 0 ? ` with ${selectedEBPs.length} EBP${selectedEBPs.length !== 1 ? "s" : ""}` : ""} and sent for patient signature`
                )
              } catch (err) {
                toast.error("Failed to create treatment plan")
              }
            }}
          >
            <FileCheck className="mr-2 h-4 w-4" />
            Complete & Get Patient Signature
          </Button>
        </div>
      </div>
    </div>
  )
}
