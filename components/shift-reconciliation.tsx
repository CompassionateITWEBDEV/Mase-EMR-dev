"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, CheckCircle, Users, Calculator } from "lucide-react"

interface ShiftReconciliationProps {
  expectedVolume: number
  onComplete: (data: any) => void
}

export function ShiftReconciliation({ expectedVolume, onComplete }: ShiftReconciliationProps) {
  const [physicalCount, setPhysicalCount] = useState("")
  const [supervisor1, setSupervisor1] = useState("")
  const [supervisor2, setSupervisor2] = useState("")
  const [varianceReason, setVarianceReason] = useState("")
  const [notes, setNotes] = useState("")

  const variance = physicalCount ? Number.parseFloat(physicalCount) - expectedVolume : 0
  const variancePercent = expectedVolume > 0 ? (Math.abs(variance) / expectedVolume) * 100 : 0
  const requiresDualSign = Math.abs(variance) > 0.5 // 0.5ml threshold

  const handleSubmit = () => {
    if (requiresDualSign && (!supervisor1 || !supervisor2 || !varianceReason)) {
      alert("Variance exceeds threshold. Dual signatures and reason required.")
      return
    }

    onComplete({
      expected: expectedVolume,
      physical: Number.parseFloat(physicalCount),
      variance,
      variancePercent,
      supervisor1,
      supervisor2,
      reason: varianceReason,
      notes,
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Shift Reconciliation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Expected Volume</Label>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{expectedVolume.toFixed(1)}ml</div>
              <div className="text-xs text-blue-600">System calculated</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="physical">Physical Count</Label>
            <Input
              id="physical"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(e.target.value)}
              placeholder="Enter measured volume"
              className="text-lg"
            />
          </div>
        </div>

        {/* Variance display */}
        {physicalCount && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Variance Analysis</span>
              <Badge variant={Math.abs(variance) <= 0.5 ? "default" : "destructive"}>
                {variance > 0 ? "+" : ""}
                {variance.toFixed(2)}ml ({variancePercent.toFixed(2)}%)
              </Badge>
            </div>

            {Math.abs(variance) <= 0.5 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Variance within acceptable tolerance (±0.5ml)</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Variance exceeds tolerance. Dual signature and reason required.</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Dual signature section */}
        {requiresDualSign && (
          <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Dual Signature Required</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supervisor1">Supervisor 1 Signature</Label>
                <Input
                  id="supervisor1"
                  value={supervisor1}
                  onChange={(e) => setSupervisor1(e.target.value)}
                  placeholder="First supervisor signature"
                />
              </div>
              <div>
                <Label htmlFor="supervisor2">Supervisor 2 Signature</Label>
                <Input
                  id="supervisor2"
                  value={supervisor2}
                  onChange={(e) => setSupervisor2(e.target.value)}
                  placeholder="Second supervisor signature"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Variance Reason</Label>
              <Textarea
                id="reason"
                value={varianceReason}
                onChange={(e) => setVarianceReason(e.target.value)}
                placeholder="Explain the cause of variance..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Notes section */}
        <div>
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional observations..."
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!physicalCount || (requiresDualSign && (!supervisor1 || !supervisor2 || !varianceReason))}
          className="w-full"
        >
          Complete Shift Reconciliation
        </Button>
      </CardContent>
    </Card>
  )
}
