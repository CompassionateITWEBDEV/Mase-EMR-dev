"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, CheckCircle, XCircle, Clock, AlertTriangle, Pill, Loader2 } from "lucide-react"
import useSWR from "swr"

interface EligibilityResult {
  status: "active" | "inactive" | "pending" | "expired"
  planName: string
  memberId: string
  groupNumber: string
  copay: string
  deductible: string
  outOfPocketMax: string
  mentalHealthCoverage: boolean
  substanceAbuseCoverage: boolean
  priorAuthRequired: boolean
  effectiveDate: string
  terminationDate?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function InsuranceEligibility() {
  const { data: patientsData } = useSWR("/api/insurance?type=patients", fetcher)
  const { data: patientInsuranceData } = useSWR("/api/insurance?type=patient-insurance", fetcher)

  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null)
  const [pmpResults, setPmpResults] = useState<{
    hasActiveRx: boolean
    controlledSubstances: string[]
    lastFilled: string
    prescribingProvider: string
    riskScore: string
  } | null>(null)

  const patients = patientsData?.patients || []
  const patientInsurance = patientInsuranceData?.patientInsurance || []

  const handleEligibilityCheck = async () => {
    if (!selectedPatientId) return

    setIsChecking(true)
    setEligibilityResult(null)
    setPmpResults(null)

    try {
      // Find patient's insurance
      const insurance = patientInsurance.find(
        (ins: { patient_id: string; is_active: boolean }) => ins.patient_id === selectedPatientId && ins.is_active,
      )

      if (insurance) {
        // Create eligibility request
        await fetch("/api/insurance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "eligibility-check",
            patientId: selectedPatientId,
            payerId: insurance.payer_id,
            patientInsuranceId: insurance.id,
            copayAmount: insurance.copay_amount,
            deductibleAmount: insurance.deductible_amount,
            deductibleRemaining: insurance.deductible_amount - (insurance.deductible_met_amount || 0),
          }),
        })

        setEligibilityResult({
          status: insurance.is_active ? "active" : "inactive",
          planName: insurance.insurance_payers?.payer_name || "Unknown Plan",
          memberId: insurance.policy_number,
          groupNumber: insurance.group_number || "N/A",
          copay: `$${insurance.copay_amount || 0}`,
          deductible: `$${insurance.deductible_amount || 0} / $${(insurance.deductible_amount || 0) - (insurance.deductible_met_amount || 0)} remaining`,
          outOfPocketMax: `$${insurance.out_of_pocket_max || 0} / $${(insurance.out_of_pocket_max || 0) - (insurance.out_of_pocket_met || 0)} remaining`,
          mentalHealthCoverage: true,
          substanceAbuseCoverage: true,
          priorAuthRequired: insurance.insurance_payers?.prior_auth_required || false,
          effectiveDate: insurance.effective_date,
          terminationDate: insurance.termination_date,
        })

        // Simulate PMP check
        setPmpResults({
          hasActiveRx: false,
          controlledSubstances: [],
          lastFilled: "No records found",
          prescribingProvider: "N/A",
          riskScore: "Low",
        })
      } else {
        setEligibilityResult({
          status: "inactive",
          planName: "No active coverage found",
          memberId: "N/A",
          groupNumber: "N/A",
          copay: "N/A",
          deductible: "N/A",
          outOfPocketMax: "N/A",
          mentalHealthCoverage: false,
          substanceAbuseCoverage: false,
          priorAuthRequired: false,
          effectiveDate: "N/A",
        })
      }
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "inactive":
      case "expired":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Insurance Eligibility Verification
          </CardTitle>
          <CardDescription>
            Verify patient insurance coverage and benefits. PMP monitoring is automatically included.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="patientId">Select Patient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient: { id: string; first_name: string; last_name: string }) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleEligibilityCheck}
                disabled={!selectedPatientId || isChecking}
                className="bg-primary hover:bg-primary/90"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Verify Coverage
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {eligibilityResult && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(eligibilityResult.status)}
                Coverage Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={eligibilityResult.status === "active" ? "default" : "destructive"}>
                    {eligibilityResult.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Plan:</span>
                  <span className="text-sm">{eligibilityResult.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Member ID:</span>
                  <span className="text-sm font-mono">{eligibilityResult.memberId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Group:</span>
                  <span className="text-sm font-mono">{eligibilityResult.groupNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Effective Date:</span>
                  <span className="text-sm">{eligibilityResult.effectiveDate}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Coverage Details</h4>
                <div className="flex justify-between">
                  <span className="text-sm">Copay:</span>
                  <span className="text-sm font-medium">{eligibilityResult.copay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Deductible:</span>
                  <span className="text-sm">{eligibilityResult.deductible}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Out-of-Pocket Max:</span>
                  <span className="text-sm">{eligibilityResult.outOfPocketMax}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Behavioral Health Coverage</h4>
                <div className="flex justify-between">
                  <span className="text-sm">Mental Health:</span>
                  <Badge variant={eligibilityResult.mentalHealthCoverage ? "default" : "secondary"}>
                    {eligibilityResult.mentalHealthCoverage ? "Covered" : "Not Covered"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Substance Abuse:</span>
                  <Badge variant={eligibilityResult.substanceAbuseCoverage ? "default" : "secondary"}>
                    {eligibilityResult.substanceAbuseCoverage ? "Covered" : "Not Covered"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Prior Auth Required:</span>
                  <Badge variant={eligibilityResult.priorAuthRequired ? "destructive" : "default"}>
                    {eligibilityResult.priorAuthRequired ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {pmpResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  PMP Aware Monitoring
                  <Badge variant="outline" className="ml-auto">
                    Michigan MAPS
                  </Badge>
                </CardTitle>
                <CardDescription>Prescription monitoring data from michigan.pmpaware.net</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Active Prescriptions:</span>
                    <Badge variant={pmpResults.hasActiveRx ? "destructive" : "default"}>
                      {pmpResults.hasActiveRx ? "Yes" : "None"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Risk Score:</span>
                    <Badge
                      variant={
                        pmpResults.riskScore === "High"
                          ? "destructive"
                          : pmpResults.riskScore === "Medium"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {pmpResults.riskScore}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Last Filled:</span>
                    <span className="text-sm">{pmpResults.lastFilled}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Current Controlled Substances</h4>
                  {pmpResults.controlledSubstances.length > 0 ? (
                    pmpResults.controlledSubstances.map((med, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{med}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No controlled substances on record</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Prescribing Provider:</span>
                    <span className="text-sm">{pmpResults.prescribingProvider}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Pill className="mr-2 h-4 w-4" />
                    View Full PMP Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
