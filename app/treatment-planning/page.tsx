"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, Plus, Trash2, FileCheck } from "lucide-react"
import { toast } from "sonner"

export default function TreatmentPlanningPage() {
  const [goals, setGoals] = useState([{ id: 1, goal: "", objectives: [""], interventions: [""] }])

  const addGoal = () => {
    setGoals([...goals, { id: goals.length + 1, goal: "", objectives: [""], interventions: [""] }])
  }

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
          <Button onClick={() => toast.success("Treatment plan created and sent for patient signature")}>
            <FileCheck className="mr-2 h-4 w-4" />
            Complete & Get Patient Signature
          </Button>
        </div>
      </div>
    </div>
  )
}
