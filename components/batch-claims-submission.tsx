"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { FileCheck, Send, CheckCircle, XCircle, AlertTriangle, Clock, Eye, Download, RefreshCw } from "lucide-react"

interface Claim {
  id: string
  claimNumber: string
  patientName: string
  payerName: string
  serviceDate: string
  totalCharges: number
  scrubbingStatus: "passed" | "failed" | "warning" | "pending"
  validationErrors: string[]
  selected: boolean
}

const mockClaims: Claim[] = [
  {
    id: "1",
    claimNumber: "CLM-2024-001",
    patientName: "Sarah Johnson",
    payerName: "Blue Cross Blue Shield",
    serviceDate: "2024-12-05",
    totalCharges: 1247.5,
    scrubbingStatus: "passed",
    validationErrors: [],
    selected: true,
  },
  {
    id: "2",
    claimNumber: "CLM-2024-002",
    patientName: "Michael Chen",
    payerName: "Aetna",
    serviceDate: "2024-12-06",
    totalCharges: 892.0,
    scrubbingStatus: "passed",
    validationErrors: [],
    selected: true,
  },
  {
    id: "3",
    claimNumber: "CLM-2024-003",
    patientName: "Emily Rodriguez",
    payerName: "UnitedHealthcare",
    serviceDate: "2024-12-07",
    totalCharges: 345.0,
    scrubbingStatus: "warning",
    validationErrors: ["Missing secondary diagnosis code"],
    selected: false,
  },
  {
    id: "4",
    claimNumber: "CLM-2024-004",
    patientName: "Robert Kim",
    payerName: "Cigna",
    serviceDate: "2024-12-08",
    totalCharges: 450.0,
    scrubbingStatus: "failed",
    validationErrors: ["Invalid NPI number", "Missing prior authorization"],
    selected: false,
  },
]

export function BatchClaimsSubmission() {
  const [claims, setClaims] = useState<Claim[]>(mockClaims)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionProgress, setSubmissionProgress] = useState(0)

  const selectedClaims = claims.filter((c) => c.selected)
  const totalCharges = selectedClaims.reduce((sum, c) => sum + c.totalCharges, 0)
  const passedClaims = claims.filter((c) => c.scrubbingStatus === "passed").length
  const failedClaims = claims.filter((c) => c.scrubbingStatus === "failed").length
  const warningClaims = claims.filter((c) => c.scrubbingStatus === "warning").length

  const handleSelectAll = (checked: boolean) => {
    setClaims(claims.map((c) => ({ ...c, selected: checked && c.scrubbingStatus === "passed" })))
  }

  const handleSelectClaim = (id: string, checked: boolean) => {
    setClaims(claims.map((c) => (c.id === id ? { ...c, selected: checked } : c)))
  }

  const handleSubmitBatch = async () => {
    setIsSubmitting(true)
    setSubmissionProgress(0)

    // Simulate batch submission progress
    const interval = setInterval(() => {
      setSubmissionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsSubmitting(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <FileCheck className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "default"
      case "failed":
        return "destructive"
      case "warning":
        return "secondary"
      case "pending":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Batch Claims Submission</h2>
          <p className="text-muted-foreground">Scrub, validate, and submit claims in batches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Scrubber
          </Button>
          <Button
            onClick={handleSubmitBatch}
            disabled={selectedClaims.length === 0 || isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Batch ({selectedClaims.length})
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Submit</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passedClaims}</div>
            <p className="text-xs text-muted-foreground">Passed scrubbing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warningClaims}</div>
            <p className="text-xs text-muted-foreground">Review recommended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedClaims}</div>
            <p className="text-xs text-muted-foreground">Requires correction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Total</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCharges.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{selectedClaims.length} claims</p>
          </CardContent>
        </Card>
      </div>

      {/* Submission Progress */}
      {isSubmitting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Submitting batch to clearinghouse...</span>
                <span>{submissionProgress}%</span>
              </div>
              <Progress value={submissionProgress} />
              <p className="text-xs text-muted-foreground">
                Processing {selectedClaims.length} claims • Estimated time: {Math.ceil((100 - submissionProgress) / 10)}{" "}
                seconds
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claims List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Claims Ready for Submission</CardTitle>
              <CardDescription>Select claims to include in batch submission</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedClaims.length === passedClaims && passedClaims > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All Passed
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id={`claim-${claim.id}`}
                  checked={claim.selected}
                  onCheckedChange={(checked) => handleSelectClaim(claim.id, checked as boolean)}
                  disabled={claim.scrubbingStatus === "failed"}
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(claim.scrubbingStatus)}
                    <h4 className="font-medium">{claim.patientName}</h4>
                    <Badge variant="outline">{claim.claimNumber}</Badge>
                    <Badge variant={getStatusColor(claim.scrubbingStatus)}>{claim.scrubbingStatus.toUpperCase()}</Badge>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3 text-sm mb-2">
                    <div>
                      <span className="font-medium">Payer:</span> {claim.payerName}
                    </div>
                    <div>
                      <span className="font-medium">Service Date:</span> {claim.serviceDate}
                    </div>
                    <div>
                      <span className="font-medium">Charges:</span> ${claim.totalCharges.toFixed(2)}
                    </div>
                  </div>

                  {claim.validationErrors.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm font-medium text-red-900 mb-1">Validation Errors:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {claim.validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  {claim.scrubbingStatus === "failed" && (
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Fix
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Batch History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Batch Submissions</CardTitle>
          <CardDescription>History of submitted claim batches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="font-medium">Batch #B2024-1208-001</p>
                  <Badge variant="default">Acknowledged</Badge>
                </div>
                <p className="text-sm text-muted-foreground">23 claims • $18,450.00 • Submitted 2 hours ago</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download 837
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <p className="font-medium">Batch #B2024-1207-003</p>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <p className="text-sm text-muted-foreground">18 claims • $14,230.00 • Submitted yesterday</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Status
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="font-medium">Batch #B2024-1207-002</p>
                  <Badge variant="default">Processed</Badge>
                </div>
                <p className="text-sm text-muted-foreground">31 claims • $24,780.00 • Submitted 2 days ago</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download 997
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
