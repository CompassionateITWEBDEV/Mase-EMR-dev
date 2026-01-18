"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  DollarSign,
  FileText,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Users,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Stethoscope,
  Download,
  Send,
  Plus,
  FileSpreadsheet,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DualEligibleData {
  dualEligibleCount: number
  dualEligiblePatients: Array<{
    id: string
    name: string
    dob: string
    insurances: Array<{
      payerName: string
      networkType: string
      policyNumber: string
      priority: number
    }>
  }>
  pendingClaims: Array<{
    id: string
    claimNumber: string
    patientName: string
    payerName: string
    status: string
    totalCharges: number
    submissionDate: string
  }>
}

interface OTPBillingData {
  weeklyBundleRevenue: number
  revenueChange: number
  bundleStats: {
    methadoneFullBundles: { count: number; revenue: number; rateCode: string; hcpcs: string }
    buprenorphineFullBundles: { count: number; revenue: number; rateCode: string; hcpcs: string }
    takehomeBundles: { count: number; revenue: number; rateCodes: string }
  }
  qualifyingServices: {
    medicationAdministration: number
    individualCounseling: number
    groupCounseling: number
    toxicologyTesting: number
  }
  rateCodes: Array<{
    code: string
    description: string
    hcpcs: string
    facilityType: string
    rate: number
  }>
  pendingClaimsCount: number
  icd10Summary: Array<{
    code: string
    count: number
    description: string
    patientCount: number
  }>
  vitalsTrending: Array<{
    patientName: string
    current: {
      systolic_bp: number | string
      diastolic_bp: number | string
      heart_rate: number | string
      temperature: number | string
      weight: number | string
      date: string
    }
    previous?: {
      systolic_bp: number | string
      diastolic_bp: number | string
      heart_rate: number | string
      temperature: number | string
      weight: number | string
    }
    trends: {
      bpTrend: "up" | "down" | "stable"
      hrTrend: "up" | "down" | "stable"
      weightTrend: "up" | "down" | "stable"
    }
  }>
}

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth?: string
}

export default function OTPBillingPage() {
  const { toast } = useToast()

  const {
    data: dualData,
    error: dualError,
    isLoading: dualLoading,
    mutate: mutateDual,
  } = useSWR<DualEligibleData>("/api/dual-eligible", fetcher)

  const {
    data: billingData,
    error: billingError,
    isLoading: billingLoading,
    mutate: mutateBilling,
  } = useSWR<OTPBillingData>("/api/otp-billing", fetcher)

  const [processingCrossover, setProcessingCrossover] = useState<string | null>(null)
  const [processingAll, setProcessingAll] = useState(false)

  const [showReportsDialog, setShowReportsDialog] = useState(false)
  const [showCreateClaimDialog, setShowCreateClaimDialog] = useState(false)
  const [showBundleDetailsDialog, setShowBundleDetailsDialog] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportType, setReportType] = useState("weekly-summary")
  const [reportDateRange, setReportDateRange] = useState({ start: "", end: "" })

  const [newClaim, setNewClaim] = useState({
    patientId: "",
    serviceDate: new Date().toISOString().split("T")[0],
    bundleType: "methadone-full",
    rateCode: "7969",
    hcpcs: "G2067",
    primaryPayer: "",
    secondaryPayer: "",
    notes: "",
  })

  const [patients, setPatients] = useState<Patient[]>([])
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [patientSearch, setPatientSearch] = useState("")

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setPatientsLoading(true)
        console.log("[v0] Fetching patients for OTP billing...")
        const response = await fetch("/api/patients")
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Patients API response:", data)
          const patientList = Array.isArray(data) ? data : data.patients || []
          console.log("[v0] Setting patients:", patientList.length)
          setPatients(patientList)
        } else {
          console.error("[v0] Failed to fetch patients:", response.status)
        }
      } catch (error) {
        console.error("[v0] Error fetching patients:", error)
      } finally {
        setPatientsLoading(false)
      }
    }
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
    return fullName.includes(patientSearch.toLowerCase())
  })

  const handleProcessCrossover = async (claimId: string) => {
    setProcessingCrossover(claimId)
    try {
      const response = await fetch("/api/dual-eligible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process_crossover", claimId }),
      })
      if (response.ok) {
        toast({ title: "Success", description: "Crossover claim processed successfully" })
        mutateDual()
      } else {
        toast({ title: "Error", description: "Failed to process crossover", variant: "destructive" })
      }
    } catch (err) {
      console.error("Error processing crossover:", err)
      toast({ title: "Error", description: "Failed to process crossover", variant: "destructive" })
    } finally {
      setProcessingCrossover(null)
    }
  }

  const handleProcessAllCrossovers = async () => {
    if (!dualData?.pendingClaims || dualData.pendingClaims.length === 0) {
      toast({ title: "No Claims", description: "No pending crossover claims to process" })
      return
    }

    setProcessingAll(true)
    let successCount = 0
    let failCount = 0

    for (const claim of dualData.pendingClaims) {
      try {
        const response = await fetch("/api/dual-eligible", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "process_crossover", claimId: claim.id }),
        })
        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    toast({
      title: "Batch Processing Complete",
      description: `${successCount} claims processed successfully, ${failCount} failed`,
    })
    mutateDual()
    setProcessingAll(false)
  }

  const handleGenerateReport = async () => {
    setGeneratingReport(true)

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const reportData = {
      type: reportType,
      dateRange: reportDateRange,
      generatedAt: new Date().toISOString(),
      data: billingData,
    }

    // Create downloadable report
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dual-eligible-report-${reportType}-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({ title: "Report Generated", description: "Your report has been downloaded" })
    setGeneratingReport(false)
    setShowReportsDialog(false)
  }

  const handleCreateBundleClaim = async () => {
    try {
      const response = await fetch("/api/insurance-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: newClaim.patientId,
          service_date: newClaim.serviceDate,
          claim_type: "bundle",
          payer_name: newClaim.primaryPayer,
          notes: `${newClaim.bundleType} - Rate Code: ${newClaim.rateCode}, HCPCS: ${newClaim.hcpcs}. ${newClaim.notes}`,
          total_charges: billingData?.rateCodes?.find((r) => r.code === newClaim.rateCode)?.rate || 247.5,
          status: "pending",
        }),
      })

      if (response.ok) {
        toast({ title: "Claim Created", description: "Bundle claim has been created successfully" })
        setShowCreateClaimDialog(false)
        setNewClaim({
          patientId: "",
          serviceDate: new Date().toISOString().split("T")[0],
          bundleType: "methadone-full",
          rateCode: "7969",
          hcpcs: "G2067",
          primaryPayer: "",
          secondaryPayer: "",
          notes: "",
        })
        mutateBilling()
      } else {
        toast({ title: "Error", description: "Failed to create claim", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to create claim", variant: "destructive" })
    }
  }

  const handleViewBundleDetails = (bundleType: string) => {
    setSelectedBundle(bundleType)
    setShowBundleDetailsDialog(true)
  }

  const handleRefreshAll = () => {
    mutateDual()
    mutateBilling()
  }

  // Get bundle details for dialog
  const getBundleDetails = () => {
    if (!selectedBundle || !billingData) return null

    switch (selectedBundle) {
      case "methadone":
        return {
          title: "Methadone Full Bundle Details",
          rateCode: billingData.bundleStats?.methadoneFullBundles?.rateCode,
          hcpcs: billingData.bundleStats?.methadoneFullBundles?.hcpcs,
          count: billingData.bundleStats?.methadoneFullBundles?.count,
          revenue: billingData.bundleStats?.methadoneFullBundles?.revenue,
          rate: 247.5,
          services: [
            "Daily observed dosing",
            "Individual counseling (minimum 1x/month)",
            "Group counseling (minimum 2x/month)",
            "Toxicology testing (minimum 8x/year)",
            "Medical evaluation and monitoring",
          ],
        }
      case "buprenorphine":
        return {
          title: "Buprenorphine Full Bundle Details",
          rateCode: billingData.bundleStats?.buprenorphineFullBundles?.rateCode,
          hcpcs: billingData.bundleStats?.buprenorphineFullBundles?.hcpcs,
          count: billingData.bundleStats?.buprenorphineFullBundles?.count,
          revenue: billingData.bundleStats?.buprenorphineFullBundles?.revenue,
          rate: 235.75,
          services: [
            "Daily or supervised dosing",
            "Individual counseling (minimum 1x/month)",
            "Group counseling (minimum 2x/month)",
            "Toxicology testing (minimum 8x/year)",
            "Medical evaluation and monitoring",
          ],
        }
      case "takehome":
        return {
          title: "Take-Home Bundle Details",
          rateCode: billingData.bundleStats?.takehomeBundles?.rateCodes,
          hcpcs: "G2078/G2079",
          count: billingData.bundleStats?.takehomeBundles?.count,
          revenue: billingData.bundleStats?.takehomeBundles?.revenue,
          rate: 87.38,
          services: [
            "Weekly take-home medication dispensing",
            "Monthly counseling requirement",
            "Periodic toxicology testing",
            "Callback compliance monitoring",
            "Take-home eligibility assessment",
          ],
        }
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">OTP Billing & Rate Codes</h1>
              <p className="text-muted-foreground">
                OASAS Bundle billing, rate codes, and APG management for Opioid Treatment Programs
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateClaimDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Claim
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={billingLoading || dualLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${billingLoading || dualLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleViewBundleDetails("methadone")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Bundle Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${(billingData?.weeklyBundleRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span
                        className={
                          billingData?.revenueChange && billingData.revenueChange >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {billingData?.revenueChange && billingData.revenueChange >= 0 ? "+" : ""}
                        {billingData?.revenueChange || 0}%
                      </span>{" "}
                      from last week
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dualeligibles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {dualLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{dualData?.dualEligibleCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Require Medicare first billing</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{billingData?.pendingClaimsCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Awaiting processing</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bundle Rate</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">$247.50</div>
                    <p className="text-xs text-muted-foreground">Full bundle (7969/G2067)</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Billing Tabs */}
          <Tabs defaultValue="bundle" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="bundle">Bundle Billing</TabsTrigger>
              <TabsTrigger value="dual-eligible">Dual Eligible</TabsTrigger>
              <TabsTrigger value="special-cases">Special Cases</TabsTrigger>
              <TabsTrigger value="rate-codes">Rate Codes</TabsTrigger>
              <TabsTrigger value="icd10">ICD-10 Codes</TabsTrigger>
              <TabsTrigger value="vitals">Vitals Trending</TabsTrigger>
            </TabsList>

            <TabsContent value="bundle">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Bundle Status</CardTitle>
                    <CardDescription>Current week bundle billing overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {billingLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleViewBundleDetails("methadone")}
                        >
                          <div>
                            <p className="font-medium">Full Bundles (Methadone)</p>
                            <p className="text-sm text-muted-foreground">
                              Rate Code {billingData?.bundleStats?.methadoneFullBundles?.rateCode} /{" "}
                              {billingData?.bundleStats?.methadoneFullBundles?.hcpcs}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {billingData?.bundleStats?.methadoneFullBundles?.count || 0}
                            </p>
                            <p className="text-sm text-green-600">
                              $
                              {(billingData?.bundleStats?.methadoneFullBundles?.revenue || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleViewBundleDetails("buprenorphine")}
                        >
                          <div>
                            <p className="font-medium">Full Bundles (Buprenorphine)</p>
                            <p className="text-sm text-muted-foreground">
                              Rate Code {billingData?.bundleStats?.buprenorphineFullBundles?.rateCode} /{" "}
                              {billingData?.bundleStats?.buprenorphineFullBundles?.hcpcs}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {billingData?.bundleStats?.buprenorphineFullBundles?.count || 0}
                            </p>
                            <p className="text-sm text-green-600">
                              $
                              {(billingData?.bundleStats?.buprenorphineFullBundles?.revenue || 0).toLocaleString(
                                "en-US",
                                { minimumFractionDigits: 2 },
                              )}
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleViewBundleDetails("takehome")}
                        >
                          <div>
                            <p className="font-medium">Take-Home Bundles</p>
                            <p className="text-sm text-muted-foreground">
                              Rate Codes {billingData?.bundleStats?.takehomeBundles?.rateCodes}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{billingData?.bundleStats?.takehomeBundles?.count || 0}</p>
                            <p className="text-sm text-green-600">
                              $
                              {(billingData?.bundleStats?.takehomeBundles?.revenue || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Qualifying Services This Week</CardTitle>
                    <CardDescription>Services included in bundle billing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {billingLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 bg-green-50 rounded">
                          <span>Medication Administration</span>
                          <Badge variant="default">
                            {billingData?.qualifyingServices?.medicationAdministration || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between p-2 bg-green-50 rounded">
                          <span>Individual Counseling</span>
                          <Badge variant="default">{billingData?.qualifyingServices?.individualCounseling || 0}</Badge>
                        </div>
                        <div className="flex justify-between p-2 bg-green-50 rounded">
                          <span>Group Counseling</span>
                          <Badge variant="default">{billingData?.qualifyingServices?.groupCounseling || 0}</Badge>
                        </div>
                        <div className="flex justify-between p-2 bg-green-50 rounded">
                          <span>Toxicology Testing</span>
                          <Badge variant="default">{billingData?.qualifyingServices?.toxicologyTesting || 0}</Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="dual-eligible">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Dual Eligible Medicare/Medicaid Workflow</CardTitle>
                    <CardDescription>
                      Special billing procedures for patients with both Medicare and Medicaid coverage
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => mutateDual()} disabled={dualLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${dualLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Dual Eligible Billing Requirements</h4>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                          <li>{"•"} Submit claim to Medicare first using G codes</li>
                          <li>{"•"} Crossover to Medicaid using bundle rate codes</li>
                          <li>{"•"} Submit separate APG claim for non-bundle services with zero-fill Medicare info</li>
                          <li>{"•"} Medicare Advantage plans require manual crossover</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Pending Dual Eligible Claims</h4>
                    {dualLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : !dualData?.pendingClaims || dualData.pendingClaims.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No pending dual eligible claims</p>
                        <p className="text-sm">All crossovers have been processed</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dualData.pendingClaims.map((claim) => (
                          <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">Patient: {claim.patientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {claim.payerName} - Claim #{claim.claimNumber || "Pending"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Charges: ${claim.totalCharges?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <Badge variant="destructive">Dual Eligible</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcessCrossover(claim.id)}
                                disabled={processingCrossover === claim.id}
                              >
                                {processingCrossover === claim.id ? "Processing..." : "Process Crossover"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleProcessAllCrossovers}
                      disabled={processingAll || !dualData?.pendingClaims?.length}
                    >
                      {processingAll ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Process All Medicare Crossovers
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowReportsDialog(true)}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      View Dual Eligible Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="special-cases">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Special Billing Scenarios</CardTitle>
                    <CardDescription>
                      FQHC, CCBHC, Guest Dosing, and Skilled Nursing Facility billing rules
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">FQHC Billing Rules</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <ul className="text-sm space-y-1">
                            <li>{"•"} Cannot bill 1671 rate code + bundle same week</li>
                            <li>{"•"} Can choose weekly 1671 OR bundle billing</li>
                            <li>{"•"} APG opt-out FQHCs: Use 1671 or bundle (not both)</li>
                            <li>{"•"} Dual eligibles: Bill Medicare bundles first</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">CCBHC Billing Rules</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <ul className="text-sm space-y-1">
                            <li>{"•"} Medication administration carved out of 1147 rate</li>
                            <li>{"•"} Can bill bundle for OTP services</li>
                            <li>{"•"} Follow standard dual eligible procedures</li>
                            <li>{"•"} Non-OTP services use CCBHC rate</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Guest Dosing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <ul className="text-sm space-y-1">
                            <li>{"•"} Cannot use bundle billing</li>
                            <li>{"•"} Bill APG for medication administration only</li>
                            <li>{"•"} Requires guest dosing agreement on file</li>
                            <li>{"•"} Home clinic responsible for primary billing</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Skilled Nursing Facility</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <ul className="text-sm space-y-1">
                            <li>{"•"} Bill Medicare Part A during covered stay</li>
                            <li>{"•"} Use APG after Part A exhausted</li>
                            <li>{"•"} Coordinate with SNF billing department</li>
                            <li>{"•"} Document medical necessity for OTP services</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rate-codes">
              <Card>
                <CardHeader>
                  <CardTitle>OASAS OTP Rate Codes Reference</CardTitle>
                  <CardDescription>Current Medicaid rate codes for bundle billing</CardDescription>
                </CardHeader>
                <CardContent>
                  {billingLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Rate Code</th>
                            <th className="text-left p-2">Description</th>
                            <th className="text-left p-2">HCPCS</th>
                            <th className="text-left p-2">Facility Type</th>
                            <th className="text-right p-2">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingData?.rateCodes?.map((rateCode) => (
                            <tr key={`${rateCode.code}-${rateCode.facilityType}`} className="border-b">
                              <td className="p-2 font-mono">{rateCode.code}</td>
                              <td className="p-2">{rateCode.description}</td>
                              <td className="p-2 font-mono">{rateCode.hcpcs}</td>
                              <td className="p-2">{rateCode.facilityType}</td>
                              <td className="p-2 text-right">${rateCode.rate.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="icd10">
              <Card>
                <CardHeader>
                  <CardTitle>ICD-10 Diagnosis Codes for OTP/MAT</CardTitle>
                  <CardDescription>
                    Most frequently used diagnosis codes for Opioid Treatment Program billing and documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {billingLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : !billingData?.icd10Summary || billingData.icd10Summary.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No ICD-10 codes recorded yet</p>
                      <p className="text-sm">Codes will appear as assessments are documented</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {billingData.icd10Summary.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-mono">
                                {item.code}
                              </Badge>
                              <Badge variant="secondary">{item.count} uses</Badge>
                            </div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground">{item.patientCount} patients</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{item.count}</div>
                            <p className="text-xs text-muted-foreground">Total uses</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Common OTP/MAT ICD-10 Codes</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-800">
                      <div>
                        <strong>F11.20</strong> - Opioid dependence, uncomplicated
                      </div>
                      <div>
                        <strong>F11.21</strong> - Opioid dependence, in remission
                      </div>
                      <div>
                        <strong>F11.23</strong> - Opioid dependence with withdrawal
                      </div>
                      <div>
                        <strong>F11.10</strong> - Opioid abuse, uncomplicated
                      </div>
                      <div>
                        <strong>Z79.891</strong> - Long term use of opiate analgesic
                      </div>
                      <div>
                        <strong>F41.1</strong> - Generalized anxiety disorder
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vitals">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Vitals Trending for OTP</CardTitle>
                  <CardDescription>
                    Monitor vital signs trends to support clinical decision-making and patient safety
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {billingLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : !billingData?.vitalsTrending || billingData.vitalsTrending.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No vitals data available</p>
                      <p className="text-sm">Vitals will appear as they are recorded during patient encounters</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {billingData.vitalsTrending.map((patient: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{patient.patientName}</h4>
                              <p className="text-xs text-muted-foreground">
                                Last measured: {new Date(patient.current.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Blood Pressure */}
                            <div className="p-3 bg-accent/50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-muted-foreground">Blood Pressure</p>
                                {patient.trends.bpTrend === "up" && <TrendingUp className="h-4 w-4 text-red-500" />}
                                {patient.trends.bpTrend === "down" && (
                                  <TrendingDown className="h-4 w-4 text-green-500" />
                                )}
                                {patient.trends.bpTrend === "stable" && <Minus className="h-4 w-4 text-gray-400" />}
                              </div>
                              <div className="text-lg font-bold">
                                {patient.current.systolic_bp || "—"}/{patient.current.diastolic_bp || "—"}
                              </div>
                              {patient.previous && (
                                <p className="text-xs text-muted-foreground">
                                  Was: {patient.previous.systolic_bp || "—"}/{patient.previous.diastolic_bp || "—"}
                                </p>
                              )}
                            </div>

                            {/* Heart Rate */}
                            <div className="p-3 bg-accent/50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-muted-foreground">Heart Rate</p>
                                {patient.trends.hrTrend === "up" && <TrendingUp className="h-4 w-4 text-orange-500" />}
                                {patient.trends.hrTrend === "down" && (
                                  <TrendingDown className="h-4 w-4 text-blue-500" />
                                )}
                                {patient.trends.hrTrend === "stable" && <Minus className="h-4 w-4 text-gray-400" />}
                              </div>
                              <div className="text-lg font-bold">{patient.current.heart_rate || "—"} bpm</div>
                              {patient.previous && (
                                <p className="text-xs text-muted-foreground">Was: {patient.previous.heart_rate} bpm</p>
                              )}
                            </div>

                            {/* Temperature */}
                            <div className="p-3 bg-accent/50 rounded-lg">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Temperature</p>
                              <div className="text-lg font-bold">{patient.current.temperature || "—"}°F</div>
                              {patient.previous && (
                                <p className="text-xs text-muted-foreground">Was: {patient.previous.temperature}°F</p>
                              )}
                            </div>

                            {/* Weight */}
                            <div className="p-3 bg-accent/50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-muted-foreground">Weight</p>
                                {patient.trends.weightTrend === "up" && (
                                  <TrendingUp className="h-4 w-4 text-orange-500" />
                                )}
                                {patient.trends.weightTrend === "down" && (
                                  <TrendingDown className="h-4 w-4 text-blue-500" />
                                )}
                                {patient.trends.weightTrend === "stable" && <Minus className="h-4 w-4 text-gray-400" />}
                              </div>
                              <div className="text-lg font-bold">{patient.current.weight || "—"} lbs</div>
                              {patient.previous && (
                                <p className="text-xs text-muted-foreground">Was: {patient.previous.weight} lbs</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Clinical Monitoring for OTP</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Monitor for signs of methadone toxicity (low BP, slow HR, respiratory depression)</li>
                      <li>• Watch for cardiac QT prolongation (EKG recommended for doses {">"}100mg)</li>
                      <li>• Track weight changes that may affect dosing requirements</li>
                      <li>• Regular vital signs required per SAMHSA OTP guidelines</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Dual Eligible Report</DialogTitle>
            <DialogDescription>Generate reports for dual eligible patients and crossover claims</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly-summary">Weekly Summary</SelectItem>
                  <SelectItem value="monthly-summary">Monthly Summary</SelectItem>
                  <SelectItem value="pending-crossovers">Pending Crossovers</SelectItem>
                  <SelectItem value="processed-claims">Processed Claims</SelectItem>
                  <SelectItem value="patient-list">Dual Eligible Patient List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={reportDateRange.start}
                  onChange={(e) => setReportDateRange((prev) => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={reportDateRange.end}
                  onChange={(e) => setReportDateRange((prev) => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport} disabled={generatingReport}>
              {generatingReport ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateClaimDialog} onOpenChange={setShowCreateClaimDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Bundle Claim</DialogTitle>
            <DialogDescription>Create a new OTP bundle claim for billing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Replace the Patient ID input */}
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select
                value={newClaim.patientId}
                onValueChange={(value) => setNewClaim((prev) => ({ ...prev, patientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={patientsLoading ? "Loading patients..." : "Select patient"} />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search patients..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredPatients.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {patientsLoading ? "Loading..." : "No patients found"}
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                        {patient.date_of_birth && (
                          <span className="text-muted-foreground ml-2">
                            (DOB: {new Date(patient.date_of_birth).toLocaleDateString()})
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service Date</Label>
              <Input
                type="date"
                value={newClaim.serviceDate}
                onChange={(e) => setNewClaim((prev) => ({ ...prev, serviceDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bundle Type</Label>
              <Select
                value={newClaim.bundleType}
                onValueChange={(value) => {
                  const rateMapping: Record<string, { rateCode: string; hcpcs: string }> = {
                    "methadone-full": { rateCode: "7969", hcpcs: "G2067" },
                    "methadone-takehome": { rateCode: "7970", hcpcs: "G2078" },
                    "buprenorphine-full": { rateCode: "7971", hcpcs: "G2068" },
                    "buprenorphine-takehome": { rateCode: "7972", hcpcs: "G2079" },
                  }
                  setNewClaim((prev) => ({
                    ...prev,
                    bundleType: value,
                    rateCode: rateMapping[value]?.rateCode || "7969",
                    hcpcs: rateMapping[value]?.hcpcs || "G2067",
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="methadone-full">Methadone Full Bundle (7969/G2067)</SelectItem>
                  <SelectItem value="methadone-takehome">Methadone Take-Home (7970/G2078)</SelectItem>
                  <SelectItem value="buprenorphine-full">Buprenorphine Full Bundle (7971/G2068)</SelectItem>
                  <SelectItem value="buprenorphine-takehome">Buprenorphine Take-Home (7972/G2079)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary Payer</Label>
              <Input
                placeholder="Enter primary payer"
                value={newClaim.primaryPayer}
                onChange={(e) => setNewClaim((prev) => ({ ...prev, primaryPayer: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={newClaim.notes}
                onChange={(e) => setNewClaim((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateClaimDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBundleClaim}>Create Claim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBundleDetailsDialog} onOpenChange={setShowBundleDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{getBundleDetails()?.title || "Bundle Details"}</DialogTitle>
            <DialogDescription>Detailed information about this bundle type</DialogDescription>
          </DialogHeader>
          {getBundleDetails() && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Rate Code</p>
                  <p className="font-mono font-bold">{getBundleDetails()?.rateCode}</p>
                </div>
                <div className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">HCPCS Code</p>
                  <p className="font-mono font-bold">{getBundleDetails()?.hcpcs}</p>
                </div>
                <div className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="font-bold text-lg">{getBundleDetails()?.count || 0} bundles</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="font-bold text-lg text-green-600">
                    ${(getBundleDetails()?.revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Included Services</h4>
                <ul className="text-sm space-y-1">
                  {getBundleDetails()?.services.map((service, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Rate:</strong> ${getBundleDetails()?.rate?.toFixed(2)} per bundle (Freestanding facility)
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBundleDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
