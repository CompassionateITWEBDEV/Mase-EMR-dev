"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Users, Droplets } from "lucide-react"

export function BottleChangeoverDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [oldBottleId, setOldBottleId] = useState("")
  const [newBottleId, setNewBottleId] = useState("")
  const [finalVolume, setFinalVolume] = useState("")
  const [witness1Signature, setWitness1Signature] = useState("")
  const [witness2Signature, setWitness2Signature] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleChangeover = async () => {
    if (!witness1Signature || !witness2Signature || !finalVolume) {
      alert("All fields required including two witness signatures")
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/bottle/changeover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_bottle_id: oldBottleId,
          new_bottle_id: newBottleId,
          final_volume_ml: Number.parseFloat(finalVolume),
          witness1_signature: witness1Signature,
          witness2_signature: witness2Signature,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Changeover failed")
      }

      const result = await response.json()
      console.log("[v0] Bottle changeover completed:", result)

      alert(`Bottle changeover completed successfully. Variance: ${result.variance_ml}ml`)
      setIsOpen(false)

      // Reset form
      setStep(1)
      setOldBottleId("")
      setNewBottleId("")
      setFinalVolume("")
      setWitness1Signature("")
      setWitness2Signature("")
    } catch (error) {
      console.error("[v0] Changeover error:", error)
      alert(`Changeover failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <Droplets className="w-4 h-4 mr-2" />
          Bottle Changeover
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bottle Changeover - Two Person Witness Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Bottle Identification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="oldBottle">Current Bottle ID</Label>
                    <Input
                      id="oldBottle"
                      value={oldBottleId}
                      onChange={(e) => setOldBottleId(e.target.value)}
                      placeholder="Scan or enter bottle ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newBottle">New Bottle ID</Label>
                    <Input
                      id="newBottle"
                      value={newBottleId}
                      onChange={(e) => setNewBottleId(e.target.value)}
                      placeholder="Scan or enter bottle ID"
                    />
                  </div>
                </div>
                <Button onClick={() => setStep(2)} disabled={!oldBottleId || !newBottleId} className="w-full">
                  Continue to Volume Measurement
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Final Volume Measurement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Important</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Measure the exact remaining volume in the current bottle before removal. This will be used for
                    inventory reconciliation.
                  </p>
                </div>

                <div>
                  <Label htmlFor="finalVolume">Final Volume (mL)</Label>
                  <Input
                    id="finalVolume"
                    type="number"
                    step="0.1"
                    value={finalVolume}
                    onChange={(e) => setFinalVolume(e.target.value)}
                    placeholder="Enter measured volume"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!finalVolume} className="flex-1">
                    Continue to Witness Signatures
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Two-Person Witness Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="witness1">Witness 1 Signature</Label>
                    <Textarea
                      id="witness1"
                      value={witness1Signature}
                      onChange={(e) => setWitness1Signature(e.target.value)}
                      placeholder="Primary nurse signature"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="witness2">Witness 2 Signature</Label>
                    <Textarea
                      id="witness2"
                      value={witness2Signature}
                      onChange={(e) => setWitness2Signature(e.target.value)}
                      placeholder="Supervisor signature"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Changeover Summary</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>Current Bottle: {oldBottleId}</p>
                    <p>New Bottle: {newBottleId}</p>
                    <p>Final Volume: {finalVolume} mL</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleChangeover}
                    disabled={!witness1Signature || !witness2Signature || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? "Processing..." : "Complete Changeover"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
