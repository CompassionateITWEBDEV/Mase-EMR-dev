"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TestTube, AlertTriangle, CheckCircle, User, Calendar } from "lucide-react"

interface UDSCollectionModalProps {
  patient: {
    id: string
    name: string
    age: number
    phone: string
    udsRequired: boolean
    pregnancyTestRequired: boolean
  }
  isOpen: boolean
  onClose: () => void
  onComplete: (results: any) => void
}

export function UDSCollectionModal({ patient, isOpen, onClose, onComplete }: UDSCollectionModalProps) {
  const [collectionStep, setCollectionStep] = useState<"collect" | "results" | "intervention">("collect")
  const [udsResults, setUdsResults] = useState({
    cocaine: "",
    opiates: "",
    thc: "",
    amphetamines: "",
    alcohol: "",
    benzodiazepines: "",
    barbiturates: "",
    methadone: "",
    buprenorphine: "",
    fentanyl: "",
  })
  const [pregnancyResult, setPregnancyResult] = useState("")
  const [collectorNotes, setCollectorNotes] = useState("")
  const [interventionRequired, setInterventionRequired] = useState(false)
  const [interventionNotes, setInterventionNotes] = useState("")

  const substanceTests = [
    { key: "cocaine", label: "Cocaine" },
    { key: "opiates", label: "Opiates" },
    { key: "thc", label: "THC (Marijuana)" },
    { key: "amphetamines", label: "Amphetamines" },
    { key: "alcohol", label: "Alcohol" },
    { key: "benzodiazepines", label: "Benzodiazepines" },
    { key: "barbiturates", label: "Barbiturates" },
    { key: "methadone", label: "Methadone" },
    { key: "buprenorphine", label: "Buprenorphine" },
    { key: "fentanyl", label: "Fentanyl" },
  ]

  const hasPositiveResults = Object.values(udsResults).some((result) => result === "positive")

  const handleResultChange = (substance: string, result: string) => {
    setUdsResults((prev) => ({ ...prev, [substance]: result }))

    // Check if intervention is needed
    if (result === "positive" && ["cocaine", "opiates", "amphetamines", "alcohol"].includes(substance)) {
      setInterventionRequired(true)
    }
  }

  const handleComplete = () => {
    const results = {
      udsResults,
      pregnancyResult,
      collectorNotes,
      interventionRequired,
      interventionNotes,
      collectedAt: new Date().toLocaleTimeString(),
      collectedBy: "Current User", // In real app, get from auth context
    }
    onComplete(results)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            UDS Collection - {patient.name}
          </DialogTitle>
          <DialogDescription>Collect and record urine drug screen and pregnancy test results</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {patient.name} ({patient.age}y)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>ID: {patient.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Step */}
          {collectionStep === "collect" && (
            <Card>
              <CardHeader>
                <CardTitle>Sample Collection</CardTitle>
                <CardDescription>Confirm sample collection and proceed to results entry</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="uds-collected" />
                    <Label htmlFor="uds-collected">UDS Sample Collected</Label>
                  </div>
                  {patient.pregnancyTestRequired && (
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pregnancy-collected" />
                      <Label htmlFor="pregnancy-collected">Pregnancy Test Sample Collected</Label>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collection-notes">Collection Notes</Label>
                  <Textarea
                    id="collection-notes"
                    placeholder="Any observations during collection..."
                    value={collectorNotes}
                    onChange={(e) => setCollectorNotes(e.target.value)}
                  />
                </div>
                <Button onClick={() => setCollectionStep("results")} className="w-full">
                  Proceed to Results Entry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results Entry Step */}
          {collectionStep === "results" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>UDS Results</CardTitle>
                  <CardDescription>Enter test results for each substance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {substanceTests.map((test) => (
                      <div key={test.key} className="space-y-2">
                        <Label htmlFor={test.key}>{test.label}</Label>
                        <Select
                          value={udsResults[test.key as keyof typeof udsResults]}
                          onValueChange={(value) => handleResultChange(test.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="negative">Negative</SelectItem>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="invalid">Invalid</SelectItem>
                            <SelectItem value="not-tested">Not Tested</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {patient.pregnancyTestRequired && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pregnancy Test Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={pregnancyResult} onValueChange={setPregnancyResult}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select pregnancy test result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="negative">Negative</SelectItem>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="invalid">Invalid</SelectItem>
                        <SelectItem value="not-tested">Not Tested</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {/* Intervention Alert */}
              {hasPositiveResults && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Intervention Required
                    </CardTitle>
                    <CardDescription>
                      Positive results detected. Intervention may be required before proceeding.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="intervention-required"
                          checked={interventionRequired}
                          onCheckedChange={(checked) => setInterventionRequired(checked as boolean)}
                        />
                        <Label htmlFor="intervention-required">Mark for intervention</Label>
                      </div>
                      {interventionRequired && (
                        <div className="space-y-2">
                          <Label htmlFor="intervention-notes">Intervention Notes</Label>
                          <Textarea
                            id="intervention-notes"
                            placeholder="Describe intervention needed or actions taken..."
                            value={interventionNotes}
                            onChange={(e) => setInterventionNotes(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCollectionStep("collect")}>
                  Back to Collection
                </Button>
                <Button onClick={handleComplete} className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete UDS Collection
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
