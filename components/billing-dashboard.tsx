"use client"

import { useState } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, FileCheck, CreditCard, Pill, Package, RefreshCw, AlertTriangle } from "lucide-react"
import { InsuranceEligibility } from "./insurance-eligibility"
import { PriorAuthorization } from "./prior-authorization"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface BillingData {
  revenue: number
  revenueChange: number
  bundleClaims: number
  bundleApgRatio: number
  priorAuths: number
  pendingAuths: number
  collectionRate: number
  collectionChange: number
  weeklyBilling: {
    fullBundle: number
    takeHomeBundle: number
    apgClaims: number
    dualEligible: number
  }
  rateCodeDistribution: {
    methadoneFull: number
    buprenorphineFull: number
    methadoneTakeHome: number
    buprenorphineTakeHome: number
  }
  recentClaims: Array<{
    id: string
    patientName: string
    weekOf: string
    description: string
    claimType: string
    amount: number
    isMedicareMedicaid?: boolean
  }>
}

interface PMPData {
  systemStatus: string
  todayChecks: number
  highRiskAlerts: number
  newPrescriptions: number
  recentAlerts: Array<{
    id: string
    patientName: string
    message: string
    severity: string
  }>
}

interface SpecialtyData {
  specialties: Array<{
    specialty_id: string
  }>
}

export function BillingDashboard() {
  const router = useRouter()
  const {
    data: billingData,
    isLoading: billingLoading,
    mutate: mutateBilling,
  } = useSWR<BillingData>("/api/otp-billing", fetcher)
  const { data: pmpData, isLoading: pmpLoading, mutate: mutatePMP } = useSWR<PMPData>("/api/pmp", fetcher)
  const { data: specialtyData } = useSWR<SpecialtyData>("/api/specialty-config", fetcher)
  const activeSpecialties = specialtyData?.specialties?.map((s) => s.specialty_id) || []
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcessWeeklyClaims = async () => {
    setIsProcessing(true)
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessing(false)
    mutateBilling()
  }

  const handleBundleCalculator = () => {
    router.push("/bundle-calculator")
  }

  const handleDualEligibleWorkflow = () => {
    router.push("/otp-billing")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Insurance Management</h1>
        <p className="text-muted-foreground">
          Comprehensive billing, insurance verification, and OTP bundle management
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {billingLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">${(billingData?.revenue || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      billingData?.revenueChange && billingData.revenueChange >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {billingData?.revenueChange && billingData.revenueChange >= 0 ? "+" : ""}
                    {billingData?.revenueChange || 0}%
                  </span>{" "}
                  from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OTP Bundle Claims</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {billingLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{billingData?.bundleClaims || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-blue-600">{billingData?.bundleApgRatio || 0}%</span> bundle vs APG ratio
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prior Auths</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {billingLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{billingData?.priorAuths || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-yellow-600">{billingData?.pendingAuths || 0} pending</span> review
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {billingLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{billingData?.collectionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      billingData?.collectionChange && billingData.collectionChange >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {billingData?.collectionChange && billingData.collectionChange >= 0 ? "+" : ""}
                    {billingData?.collectionChange || 0}%
                  </span>{" "}
                  improvement
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="otp-billing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="otp-billing" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            OTP Billing
          </TabsTrigger>
          <TabsTrigger value="eligibility" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Insurance Eligibility
          </TabsTrigger>
          <TabsTrigger value="prior-auth" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Prior Authorization
          </TabsTrigger>
          <TabsTrigger value="pmp" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            PMP Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="otp-billing">
          <div className="space-y-6">
            {/* OTP Bundle vs APG Decision Engine */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  OTP Bundle Billing Engine
                </CardTitle>
                <CardDescription>OASAS-compliant bundle vs APG billing decision support</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{"This Week's Billing Summary"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {billingLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-6 w-full" />
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm">Full Bundle Claims:</span>
                            <Badge variant="default">{billingData?.weeklyBilling?.fullBundle || 0}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Take-Home Bundle Claims:</span>
                            <Badge variant="secondary">{billingData?.weeklyBilling?.takeHomeBundle || 0}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">APG Claims:</span>
                            <Badge variant="outline">{billingData?.weeklyBilling?.apgClaims || 0}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Dual Eligible Claims:</span>
                            <Badge variant="destructive">{billingData?.weeklyBilling?.dualEligible || 0}</Badge>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rate Code Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {billingLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-5 w-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>7969/7973 (Methadone Full):</span>
                            <span className="font-medium">{billingData?.rateCodeDistribution?.methadoneFull || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>7971/7975 (Buprenorphine Full):</span>
                            <span className="font-medium">
                              {billingData?.rateCodeDistribution?.buprenorphineFull || 0}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>7970/7974 (Methadone Take-Home):</span>
                            <span className="font-medium">
                              {billingData?.rateCodeDistribution?.methadoneTakeHome || 0}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>7972/7976 (Buprenorphine Take-Home):</span>
                            <span className="font-medium">
                              {billingData?.rateCodeDistribution?.buprenorphineTakeHome || 0}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleProcessWeeklyClaims}
                    disabled={isProcessing}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    {isProcessing ? "Processing..." : "Process Weekly Claims"}
                  </Button>
                  <Button variant="outline" onClick={handleBundleCalculator}>
                    Bundle vs APG Calculator
                  </Button>
                  <Button variant="outline" onClick={handleDualEligibleWorkflow}>
                    Dual Eligible Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Qualifying Services Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Qualifying Services for Bundle Billing</CardTitle>
                <CardDescription>Track services that qualify for OTP bundle reimbursement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">Bundle Qualifying Services</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Individual Counseling</li>
                      <li>• Group Counseling</li>
                      <li>• Medication Administration/Observation</li>
                      <li>• Medication Management</li>
                      <li>• Brief Treatment</li>
                      <li>• Presumptive Toxicology Testing</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-600">APG Required Services</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Admission Assessment</li>
                      <li>• Periodic Assessments</li>
                      <li>• Psychiatric Evaluation</li>
                      <li>• Peer Services</li>
                      <li>• Smoking Cessation</li>
                      <li>• Unrelated Medical Visits</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-purple-600">Special Billing Rules</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Guest Dosing: APG Only</li>
                      <li>• Fentanyl Confirmatory (80354): Direct Lab Billing</li>
                      <li>• FQHC: Cannot bill 1671 + Bundle same week</li>
                      <li>• CCBHC: Med Admin carved out of 1147</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Claims Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent OTP Claims Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !billingData?.recentClaims || billingData.recentClaims.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent claims activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {billingData.recentClaims.map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">
                            {claim.patientName} - {claim.weekOf}
                          </p>
                          <p className="text-sm text-muted-foreground">{claim.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              claim.claimType === "Full Bundle"
                                ? "default"
                                : claim.claimType === "Take-Home"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {claim.claimType}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {claim.isMedicareMedicaid ? "Medicare → Medicaid" : `$${claim.amount.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {activeSpecialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialty-Specific Billing Codes</CardTitle>
                  <CardDescription>Common CPT codes for your active specialties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeSpecialties.includes("podiatry") && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Podiatry CPT Codes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>11055 - Paring/Cutting Corn</span>
                            <span className="font-medium">$42</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>11056 - 2-4 Lesions</span>
                            <span className="font-medium">$55</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>11720 - Debridement Nail</span>
                            <span className="font-medium">$38</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>29540 - Strapping Ankle</span>
                            <span className="font-medium">$48</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeSpecialties.includes("obgyn") && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">OB/GYN CPT Codes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>99213 - Office Visit Est</span>
                            <span className="font-medium">$112</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>76805 - Ultrasound OB</span>
                            <span className="font-medium">$245</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>88141 - Pap Smear</span>
                            <span className="font-medium">$48</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>59400 - OB Care Total</span>
                            <span className="font-medium">$4,200</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeSpecialties.includes("psychiatry") && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Psychiatry CPT Codes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>90791 - Psych Diagnostic</span>
                            <span className="font-medium">$180</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>90832 - Therapy 30 min</span>
                            <span className="font-medium">$85</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>90834 - Therapy 45 min</span>
                            <span className="font-medium">$125</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>90863 - Pharmacologic</span>
                            <span className="font-medium">$95</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeSpecialties.includes("cardiology") && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Cardiology CPT Codes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>93000 - ECG Complete</span>
                            <span className="font-medium">$48</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>93306 - Echo Complete</span>
                            <span className="font-medium">$420</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>93015 - Stress Test</span>
                            <span className="font-medium">$285</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>93224 - Holter Monitor</span>
                            <span className="font-medium">$195</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeSpecialties.includes("dermatology") && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Dermatology CPT Codes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>11100 - Skin Biopsy</span>
                            <span className="font-medium">$125</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>17000 - Destruction Lesion</span>
                            <span className="font-medium">$145</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>11400 - Excision Lesion</span>
                            <span className="font-medium">$165</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>96910 - Phototherapy</span>
                            <span className="font-medium">$75</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeSpecialties.includes("pediatrics") && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Pediatrics CPT Codes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>99381 - Well Child New</span>
                            <span className="font-medium">$165</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>99391 - Well Child Est</span>
                            <span className="font-medium">$145</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>90460 - Immunization</span>
                            <span className="font-medium">$28</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>96110 - Dev Screen</span>
                            <span className="font-medium">$32</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeSpecialties.includes("urgent-care") && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Urgent Care CPT Codes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>99281 - ED Visit Level 1</span>
                            <span className="font-medium">$85</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>99282 - ED Visit Level 2</span>
                            <span className="font-medium">$135</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>99283 - ED Visit Level 3</span>
                            <span className="font-medium">$195</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>99284 - ED Visit Level 4</span>
                            <span className="font-medium">$310</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="eligibility">
          <InsuranceEligibility />
        </TabsContent>

        <TabsContent value="prior-auth">
          <PriorAuthorization />
        </TabsContent>

        <TabsContent value="pmp">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Michigan PMP Aware Integration
                </CardTitle>
                <CardDescription>
                  Direct integration with michigan.pmpaware.net for prescription monitoring
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => mutatePMP()}>
                <RefreshCw className={`h-4 w-4 mr-2 ${pmpLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{"Today's Activity"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pmpLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${pmpData?.systemStatus === "online" ? "bg-green-500" : "bg-red-500"}`}
                          ></div>
                          <span className="text-sm">
                            {pmpData?.systemStatus === "online"
                              ? "Connected to Michigan MAPS"
                              : "Connection Unavailable"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Last sync: just now</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">PMP Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pmpLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-5 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>PMP Checks Today:</span>
                          <span className="font-medium">{pmpData?.todayChecks || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>High Risk Alerts:</span>
                          <Badge variant="destructive" className="text-xs">
                            {pmpData?.highRiskAlerts || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>New Prescriptions:</span>
                          <span className="font-medium">{pmpData?.newPrescriptions || 0}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent High-Risk Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  {pmpLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : !pmpData?.recentAlerts || pmpData.recentAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p>No high-risk alerts at this time</p>
                      <p className="text-sm">All patients are within normal monitoring parameters</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pmpData.recentAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{alert.patientName}</p>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                          </div>
                          <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                            {alert.severity === "critical" ? "High Risk" : "Medium Risk"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button className="bg-primary hover:bg-primary/90" onClick={() => router.push("/pmp")}>
                  <Pill className="mr-2 h-4 w-4" />
                  Open Full PMP Dashboard
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://michigan.pmpaware.net" target="_blank" rel="noopener noreferrer">
                    View Michigan MAPS Portal
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
