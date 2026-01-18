"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pill, AlertTriangle, CheckCircle, XCircle, Plus, FileText, Clock, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MedicationItem {
  id: string
  medication_name: string
  dosage: string
  frequency: string
  route: string
  source: "home" | "hospital" | "provider" | "pharmacy"
  verified: boolean
  action: "continue" | "discontinue" | "modify" | "new" | "pending"
  notes?: string
}

interface ReconciliationSession {
  id: string
  patient_id: string
  patient_name: string
  session_type: "admission" | "discharge" | "transfer" | "routine"
  created_by: string
  created_at: string
  status: "in_progress" | "completed" | "reviewed"
  medications: MedicationItem[]
}

interface MedicationReconciliationProps {
  patientId: string
  patientName: string
  onClose: () => void
}

export function MedicationReconciliation({ patientId, patientName, onClose }: MedicationReconciliationProps) {
  const [session, setSession] = useState<ReconciliationSession | null>(null)
  const [showNewMedDialog, setShowNewMedDialog] = useState(false)
  const [reconciliationNotes, setReconciliationNotes] = useState("")
  const { toast } = useToast()

  const loadReconciliationSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/medication-reconciliation?patient_id=${patientId}&status=in_progress`)
      if (response.ok) {
        const data = await response.json()
        // Get the most recent session
        if (data.sessions && data.sessions.length > 0) {
          setSession(data.sessions[0])
        }
      }
    } catch (error) {
      console.error("[v0] Error loading reconciliation session:", error)
    }
  }, [patientId])

  useEffect(() => {
    loadReconciliationSession()
  }, [loadReconciliationSession])

  const updateMedicationAction = (medicationId: string, action: MedicationItem["action"]) => {
    if (!session) return

    setSession({
      ...session,
      medications: session.medications.map((med) => (med.id === medicationId ? { ...med, action } : med)),
    })
  }

  const toggleVerification = (medicationId: string) => {
    if (!session) return

    setSession({
      ...session,
      medications: session.medications.map((med) =>
        med.id === medicationId ? { ...med, verified: !med.verified } : med,
      ),
    })
  }

  const completeReconciliation = async () => {
    if (!session) return

    const unverifiedMeds = session.medications.filter((med) => !med.verified)
    if (unverifiedMeds.length > 0) {
      toast({
        title: "Verification Required",
        description: `Please verify all ${unverifiedMeds.length} unverified medication(s) before completing reconciliation`,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/medication-reconciliation/${session.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reconciled_medications: session.medications,
          notes: reconciliationNotes,
        }),
      })

      if (response.ok) {
        setSession({ ...session, status: "completed" })
        toast({
          title: "Reconciliation Complete",
          description: "Medication reconciliation has been completed successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to complete medication reconciliation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to complete reconciliation:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while completing reconciliation",
        variant: "destructive",
      })
    }
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Loading medication reconciliation...</p>
        </CardContent>
      </Card>
    )
  }

  const getActionBadgeVariant = (action: MedicationItem["action"]) => {
    switch (action) {
      case "continue":
        return "default"
      case "discontinue":
        return "destructive"
      case "modify":
        return "secondary"
      case "new":
        return "default"
      default:
        return "outline"
    }
  }

  const getSourceIcon = (source: MedicationItem["source"]) => {
    switch (source) {
      case "home":
        return "🏠"
      case "hospital":
        return "🏥"
      case "provider":
        return "👨‍⚕️"
      case "pharmacy":
        return "💊"
      default:
        return "📋"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Medication Reconciliation
              </CardTitle>
              <CardDescription>
                {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)} reconciliation for{" "}
                {patientName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                {session.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(session.created_at).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            <User className="w-4 h-4 inline mr-1" />
            Created by {session.created_by} • {session.medications.length} medications to review
          </div>

          {session.medications.filter((med) => !med.verified).length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {session.medications.filter((med) => !med.verified).length} medications require verification before
                completing reconciliation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="review" className="space-y-4">
        <TabsList>
          <TabsTrigger value="review">Review Medications</TabsTrigger>
          <TabsTrigger value="summary">Reconciliation Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          {session.medications.map((medication) => (
            <Card key={medication.id} className={!medication.verified ? "border-amber-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getSourceIcon(medication.source)}</span>
                      <div>
                        <div className="font-medium">{medication.medication_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {medication.dosage} • {medication.frequency} • {medication.route}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {medication.source}
                      </Badge>
                      <Badge variant={getActionBadgeVariant(medication.action)}>
                        {medication.action.replace("_", " ")}
                      </Badge>
                    </div>

                    {medication.notes && (
                      <div className="text-sm text-muted-foreground bg-muted p-2 rounded mt-2">{medication.notes}</div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`verified-${medication.id}`}
                        checked={medication.verified}
                        onCheckedChange={() => toggleVerification(medication.id)}
                      />
                      <Label htmlFor={`verified-${medication.id}`} className="text-sm">
                        Verified
                      </Label>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant={medication.action === "continue" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateMedicationAction(medication.id, "continue")}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={medication.action === "modify" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateMedicationAction(medication.id, "modify")}
                      >
                        <FileText className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={medication.action === "discontinue" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => updateMedicationAction(medication.id, "discontinue")}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="border-dashed">
            <CardContent className="p-4">
              <Dialog open={showNewMedDialog} onOpenChange={setShowNewMedDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Medication
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Medication</DialogTitle>
                    <DialogDescription>
                      Add a medication that was not captured in the initial reconciliation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This functionality would include medication search, dosage selection, and verification workflow.
                    </p>
                    <Button onClick={() => setShowNewMedDialog(false)}>Close</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {session.medications.filter((med) => med.action === "continue").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Continue</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {session.medications.filter((med) => med.action === "modify").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Modify</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {session.medications.filter((med) => med.action === "discontinue").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Discontinue</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {session.medications.filter((med) => med.action === "new").length}
                  </div>
                  <div className="text-sm text-muted-foreground">New</div>
                </div>
              </div>

              <div>
                <Label htmlFor="reconciliation-notes">Reconciliation Notes</Label>
                <Textarea
                  id="reconciliation-notes"
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  placeholder="Document any significant findings, patient concerns, or clinical decisions..."
                  rows={4}
                />
              </div>

              {session.status !== "completed" && (
                <Button onClick={completeReconciliation} className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Reconciliation
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
