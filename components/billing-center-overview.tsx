"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  TrendingUp,
  FileCheck,
  CreditCard,
  AlertTriangle,
  Calendar,
  Users,
  Building2,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ClaimSummary {
  totalCharges: number
  totalPaid: number
  pendingAmount: number
  pendingCount: number
  paidCount: number
  totalCount: number
  collectionRate: string
}

interface Claim {
  id: string
  claimNumber: string
  patientName: string
  payerName: string
  totalCharges: number
  status: string
  serviceDate: string
}

export function BillingCenterOverview() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useSWR("/api/claims", fetcher)
  const { data: billingData } = useSWR("/api/otp-billing", fetcher)
  const { data: priorAuthData } = useSWR("/api/prior-auth", fetcher)
  const { data: eligibilityData } = useSWR("/api/eligibility", fetcher)

  const [showAppealsDialog, setShowAppealsDialog] = useState(false)
  const [showPriorAuthDialog, setShowPriorAuthDialog] = useState(false)
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [showAdvancedEligibilityDialog, setShowAdvancedEligibilityDialog] = useState(false)

  const claims: Claim[] = data?.claims || []
  const summary: ClaimSummary = data?.summary || {}
  const payers = data?.payers || []

  // Calculate real stats
  const monthlyRevenue = summary.totalPaid || 0
  const monthlyTarget = 163000
  const revenueProgress = monthlyTarget > 0 ? Math.round((monthlyRevenue / monthlyTarget) * 100) : 0
  const revenueChange = billingData?.revenueChange || 0

  const submittedClaims = claims.filter(
    (c) => c.status === "submitted" || c.status === "pending" || c.status === "paid" || c.status === "denied",
  ).length
  const approvedClaims = claims.filter((c) => c.status === "paid").length
  const deniedClaims = claims.filter((c) => c.status === "denied").length
  const pendingClaims = claims.filter((c) => c.status === "pending" || c.status === "submitted").length
  const approvalRate = submittedClaims > 0 ? ((approvedClaims / submittedClaims) * 100).toFixed(1) : "0"

  // A/R aging calculation
  const now = new Date()
  const arAging = {
    ar0to30: 0,
    ar31to60: 0,
    ar61to90: 0,
    ar90plus: 0,
  }

  claims
    .filter((c) => c.status === "pending" || c.status === "submitted")
    .forEach((claim) => {
      const serviceDate = new Date(claim.serviceDate)
      const daysDiff = Math.floor((now.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff <= 30) arAging.ar0to30 += claim.totalCharges
      else if (daysDiff <= 60) arAging.ar31to60 += claim.totalCharges
      else if (daysDiff <= 90) arAging.ar61to90 += claim.totalCharges
      else arAging.ar90plus += claim.totalCharges
    })

  const totalAR = arAging.ar0to30 + arAging.ar31to60 + arAging.ar61to90 + arAging.ar90plus

  // Appeals needed
  const appealsNeeded = claims.filter((c) => c.status === "denied")

  // Prior auths expiring (simulated as we don't have expiration data here)
  const expiringAuths = priorAuthData?.pendingAuths || 0

  // Patients needing verification
  const needsVerification = eligibilityData?.pendingVerifications || 0

  // Recent claims
  const recentClaims = claims.slice(0, 4)

  // Payer performance
  const payerPerformance = payers.slice(0, 4).map((payer: any) => {
    const payerClaims = claims.filter((c) => c.payerName === payer.payer_name)
    const payerRevenue = payerClaims.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.totalCharges, 0)
    const payerApproved = payerClaims.filter((c) => c.status === "paid").length
    const payerTotal = payerClaims.length
    const payerApprovalRate = payerTotal > 0 ? ((payerApproved / payerTotal) * 100).toFixed(0) : "0"

    return {
      name: payer.payer_name,
      revenue: payerRevenue,
      claims: payerTotal,
      approvalRate: payerApprovalRate,
    }
  })

  const handleAppealClaim = async (claimId: string) => {
    try {
      await fetch("/api/claims", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: claimId, action: "appeal" }),
      })
      toast({ title: "Appeal Initiated", description: "Claim has been marked for appeal" })
      mutate()
    } catch (error) {
      toast({ title: "Error", description: "Failed to initiate appeal", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Advanced Eligibility Verification System</h3>
                <p className="text-sm text-muted-foreground">
                  Batch verification, history tracking, and downloadable reports
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAdvancedEligibilityDialog(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Open Advanced Verification →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div className="text-3xl font-bold mb-2">${monthlyRevenue.toLocaleString()}</div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className={`h-4 w-4 ${revenueChange >= 0 ? "text-green-500" : "text-red-500"}`} />
                  <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                    {revenueChange >= 0 ? "+" : ""}
                    {revenueChange}%
                  </span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
                <Progress value={revenueProgress} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {revenueProgress}% of monthly target (${monthlyTarget.toLocaleString()})
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Claims Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Submitted:</span>
                    <Badge variant="default">{submittedClaims}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Approved:</span>
                    <Badge variant="default">{approvedClaims}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Denied:</span>
                    <Badge variant="destructive">{deniedClaims}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending:</span>
                    <Badge variant="secondary">{pendingClaims}</Badge>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Approval Rate:</span>
                    <span
                      className={`font-medium ${Number(approvalRate) >= 85 ? "text-green-600" : "text-yellow-600"}`}
                    >
                      {approvalRate}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Outstanding A/R
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="text-3xl font-bold mb-2">${totalAR.toLocaleString()}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>0-30 days:</span>
                    <span className="font-medium">${arAging.ar0to30.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>31-60 days:</span>
                    <span className="font-medium">${arAging.ar31to60.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>61-90 days:</span>
                    <span className="font-medium">${arAging.ar61to90.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>90+ days:</span>
                    <span className={`font-medium ${arAging.ar90plus > 0 ? "text-red-600" : ""}`}>
                      ${arAging.ar90plus.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Claims Activity</CardTitle>
              <CardDescription>Latest claim submissions and updates</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentClaims.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="h-8 w-8 mx-auto mb-2" />
                <p>No recent claims</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentClaims.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{claim.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {claim.payerName} • {claim.claimNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          claim.status === "paid" ? "default" : claim.status === "denied" ? "destructive" : "secondary"
                        }
                      >
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </Badge>
                      <p className="text-sm text-muted-foreground">${claim.totalCharges.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts & Action Items</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Appeals Alert */}
              <div
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  appealsNeeded.length > 0
                    ? "border-red-200 bg-red-50 hover:bg-red-100"
                    : "border-green-200 bg-green-50"
                }`}
                onClick={() => appealsNeeded.length > 0 && setShowAppealsDialog(true)}
              >
                <AlertTriangle
                  className={`h-5 w-5 mt-0.5 ${appealsNeeded.length > 0 ? "text-red-500" : "text-green-500"}`}
                />
                <div className="flex-1">
                  <p className={`font-medium ${appealsNeeded.length > 0 ? "text-red-900" : "text-green-900"}`}>
                    {appealsNeeded.length > 0 ? `${appealsNeeded.length} Claims Require Appeal` : "No Appeals Needed"}
                  </p>
                  <p className={`text-sm ${appealsNeeded.length > 0 ? "text-red-700" : "text-green-700"}`}>
                    {appealsNeeded.length > 0
                      ? "Denied claims with appeal deadline approaching"
                      : "All claims are in good standing"}
                  </p>
                  {appealsNeeded.length > 0 && (
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                      Review Appeals
                    </Button>
                  )}
                </div>
              </div>

              {/* Prior Auths Alert */}
              <div
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  expiringAuths > 0
                    ? "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                    : "border-green-200 bg-green-50"
                }`}
                onClick={() => expiringAuths > 0 && setShowPriorAuthDialog(true)}
              >
                <Calendar className={`h-5 w-5 mt-0.5 ${expiringAuths > 0 ? "text-yellow-500" : "text-green-500"}`} />
                <div className="flex-1">
                  <p className={`font-medium ${expiringAuths > 0 ? "text-yellow-900" : "text-green-900"}`}>
                    {expiringAuths > 0 ? "Prior Auths Expiring" : "Prior Auths Up to Date"}
                  </p>
                  <p className={`text-sm ${expiringAuths > 0 ? "text-yellow-700" : "text-green-700"}`}>
                    {expiringAuths > 0
                      ? `${expiringAuths} prior authorizations expire within 30 days`
                      : "No expiring authorizations"}
                  </p>
                  {expiringAuths > 0 && (
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                      Review Prior Auths
                    </Button>
                  )}
                </div>
              </div>

              {/* Verification Alert */}
              <div
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  needsVerification > 0
                    ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                    : "border-green-200 bg-green-50"
                }`}
                onClick={() => needsVerification > 0 && setShowAdvancedEligibilityDialog(true)}
              >
                <Users className={`h-5 w-5 mt-0.5 ${needsVerification > 0 ? "text-blue-500" : "text-green-500"}`} />
                <div className="flex-1">
                  <p className={`font-medium ${needsVerification > 0 ? "text-blue-900" : "text-green-900"}`}>
                    {needsVerification > 0 ? "Insurance Verification Needed" : "Verifications Complete"}
                  </p>
                  <p className={`text-sm ${needsVerification > 0 ? "text-blue-700" : "text-green-700"}`}>
                    {needsVerification > 0
                      ? `${needsVerification} patients need eligibility verification`
                      : "All patient eligibility verified"}
                  </p>
                  {needsVerification > 0 && (
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                      Advanced Verification System →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payer Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Payer Performance</CardTitle>
          <CardDescription>Revenue and approval rates by insurance payer</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : payerPerformance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2" />
              <p>No payer data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {payerPerformance.map((payer, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span className="font-medium truncate">{payer.name}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-medium">${payer.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Claims:</span>
                        <span>{payer.claims}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Approval Rate:</span>
                        <span className={Number(payer.approvalRate) >= 85 ? "text-green-600" : "text-yellow-600"}>
                          {payer.approvalRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appeals Dialog */}
      <Dialog open={showAppealsDialog} onOpenChange={setShowAppealsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claims Requiring Appeal</DialogTitle>
            <DialogDescription>Review and initiate appeals for denied claims</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {appealsNeeded.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{claim.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {claim.payerName} • {claim.claimNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">${claim.totalCharges.toFixed(2)}</span>
                  <Button size="sm" onClick={() => handleAppealClaim(claim.id)}>
                    Appeal
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Eligibility Dialog */}
      <Dialog open={showAdvancedEligibilityDialog} onOpenChange={setShowAdvancedEligibilityDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Patient Eligibility System</DialogTitle>
            <DialogDescription>
              Comprehensive eligibility verification, batch checking, historical tracking, and reporting
            </DialogDescription>
          </DialogHeader>
          <AdvancedEligibilitySystem />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdvancedEligibilitySystem() {
  const [activeTab, setActiveTab] = useState("verify")
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [reportFormat, setReportFormat] = useState("pdf")

  // Mock data - in production, this would come from your API
  const patientsNeedingVerification = [
    {
      id: "1",
      name: "John Doe",
      dob: "1985-03-15",
      insuranceName: "Blue Cross Blue Shield",
      memberId: "ABC123456",
      lastVerified: "2024-09-15",
      status: "expired",
      priority: "high",
    },
    {
      id: "2",
      name: "Jane Smith",
      dob: "1990-07-22",
      insuranceName: "Aetna",
      memberId: "XYZ789012",
      lastVerified: "2024-10-01",
      status: "pending",
      priority: "medium",
    },
    {
      id: "3",
      name: "Michael Johnson",
      dob: "1978-11-30",
      insuranceName: "United Healthcare",
      memberId: "UHC456789",
      lastVerified: null,
      status: "never_verified",
      priority: "high",
    },
  ]

  const handleBatchVerify = async () => {
    // toast({
    //   title: "Batch Verification Started",
    //   description: `Verifying eligibility for ${selectedPatients.length} patients...`,
    // })
    // In production, call your batch verification API here
  }

  const handleExportReport = async (format: string) => {
    // toast({
    //   title: "Generating Report",
    //   description: `Creating ${format.toUpperCase()} report with verification data...`,
    // })
    // In production, call your report generation API here
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="verify">Verify Patients</TabsTrigger>
          <TabsTrigger value="history">Verification History</TabsTrigger>
          <TabsTrigger value="reports">Generate Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Verify Patients Tab */}
        <TabsContent value="verify" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">All Patients</option>
                <option value="expired">Expired Only</option>
                <option value="never_verified">Never Verified</option>
                <option value="pending">Pending</option>
              </select>
              <Badge variant="secondary">{patientsNeedingVerification.length} patients</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  selectedPatients.length === patientsNeedingVerification.length
                    ? setSelectedPatients([])
                    : setSelectedPatients(patientsNeedingVerification.map((p) => p.id))
                }
              >
                {selectedPatients.length === patientsNeedingVerification.length ? "Deselect All" : "Select All"}
              </Button>
              <Button onClick={handleBatchVerify} disabled={selectedPatients.length === 0}>
                Verify Selected ({selectedPatients.length})
              </Button>
            </div>
          </div>

          <div className="border rounded-lg divide-y">
            {patientsNeedingVerification.map((patient) => (
              <div key={patient.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedPatients.includes(patient.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPatients([...selectedPatients, patient.id])
                    } else {
                      setSelectedPatients(selectedPatients.filter((id) => id !== patient.id))
                    }
                  }}
                  className="w-4 h-4"
                />
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">DOB: {patient.dob}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{patient.insuranceName}</p>
                    <p className="text-sm text-muted-foreground">{patient.memberId}</p>
                  </div>
                  <div>
                    <Badge
                      variant={
                        patient.status === "expired"
                          ? "destructive"
                          : patient.status === "never_verified"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {patient.status.replace("_", " ")}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {patient.lastVerified ? `Last: ${patient.lastVerified}` : "Never verified"}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Badge variant={patient.priority === "high" ? "destructive" : "secondary"}>
                      {patient.priority}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Verify Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Verification History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification History</CardTitle>
              <CardDescription>View past eligibility verification attempts and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    date: "2024-12-29",
                    patient: "John Doe",
                    payer: "Blue Cross Blue Shield",
                    result: "Active",
                    copay: "$20",
                    deductible: "$500/$1500",
                  },
                  {
                    date: "2024-12-28",
                    patient: "Jane Smith",
                    payer: "Aetna",
                    result: "Active",
                    copay: "$25",
                    deductible: "$200/$1000",
                  },
                  {
                    date: "2024-12-27",
                    patient: "Michael Johnson",
                    payer: "United Healthcare",
                    result: "Inactive",
                    copay: "N/A",
                    deductible: "N/A",
                  },
                ].map((record, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="grid grid-cols-3 gap-4 flex-1">
                      <div>
                        <p className="font-medium">{record.patient}</p>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                      <div>
                        <p className="text-sm">{record.payer}</p>
                        <Badge variant={record.result === "Active" ? "default" : "destructive"}>{record.result}</Badge>
                      </div>
                      <div className="text-sm">
                        <p>Copay: {record.copay}</p>
                        <p>Deductible: {record.deductible}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Eligibility Reports</CardTitle>
              <CardDescription>Export comprehensive eligibility verification data in multiple formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <select className="w-full border rounded-md px-3 py-2">
                    <option>Eligibility Status Summary</option>
                    <option>Verification History (Last 30 Days)</option>
                    <option>Expired Verifications</option>
                    <option>Coverage Details by Payer</option>
                    <option>Copay & Deductible Summary</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <select className="w-full border rounded-md px-3 py-2">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                    <option>Current Year</option>
                    <option>Custom Range</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {["pdf", "excel", "csv", "json"].map((format) => (
                    <Button
                      key={format}
                      variant={reportFormat === format ? "default" : "outline"}
                      onClick={() => setReportFormat(format)}
                      className="w-full"
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Include in Report</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Patient Demographics",
                    "Insurance Information",
                    "Coverage Details",
                    "Copay Amounts",
                    "Deductible Status",
                    "Out-of-Pocket Limits",
                    "Prior Authorization Status",
                    "Verification Dates",
                  ].map((item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleExportReport(reportFormat)}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Generate & Download Report
                </Button>
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Schedule Automatic Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Verification Settings</CardTitle>
              <CardDescription>Configure automatic verification and notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="font-medium">Enable Automatic Verification</span>
                </label>
                <p className="text-sm text-muted-foreground ml-6">
                  Automatically verify eligibility for new patients and scheduled appointments
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Re-verification Frequency</label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option>Every 30 Days</option>
                  <option>Every 60 Days</option>
                  <option>Every 90 Days</option>
                  <option>Before Each Appointment</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="font-medium">Alert Staff When Verification Expires</span>
                </label>
                <p className="text-sm text-muted-foreground ml-6">Send notifications 7 days before expiration</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="font-medium">Block Appointments Without Active Coverage</span>
                </label>
                <p className="text-sm text-muted-foreground ml-6">
                  Prevent scheduling if eligibility verification is expired or inactive
                </p>
              </div>

              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
