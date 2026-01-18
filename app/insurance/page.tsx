"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Building2, Users, FileCheck, Search, RefreshCw } from "lucide-react"
import { InsurancePayerManagement } from "@/components/insurance-payer-management"
import { PatientInsuranceManagement } from "@/components/patient-insurance-management"
import { InsuranceEligibility } from "@/components/insurance-eligibility"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function InsurancePage() {
  const { data, error, isLoading, mutate } = useSWR("/api/insurance?type=overview", fetcher)

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <main className="p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Insurance Management</h1>
                <p className="text-muted-foreground">
                  Manage insurance payers, patient coverage, and eligibility verification
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Payers</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{data?.metrics?.activePayers || 0}</div>
                      <p className="text-xs text-muted-foreground">Configured insurance companies</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Patients with Coverage</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{data?.metrics?.patientsWithCoverage || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-blue-600">{data?.metrics?.coverageRate || 0}%</span> coverage rate
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eligibility Checks</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{data?.metrics?.todayEligibilityChecks || 0}</div>
                      <p className="text-xs text-muted-foreground">{"Today's verifications"}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prior Auths Pending</CardTitle>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{data?.metrics?.pendingPriorAuths || 0}</div>
                      <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="payers" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="payers" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Insurance Payers
                </TabsTrigger>
                <TabsTrigger value="patient-insurance" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Patient Insurance
                </TabsTrigger>
                <TabsTrigger value="eligibility" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Eligibility Check
                </TabsTrigger>
                <TabsTrigger value="claims" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Claims Management
                </TabsTrigger>
              </TabsList>

              <TabsContent value="payers">
                <InsurancePayerManagement />
              </TabsContent>

              <TabsContent value="patient-insurance">
                <PatientInsuranceManagement />
              </TabsContent>

              <TabsContent value="eligibility">
                <InsuranceEligibility />
              </TabsContent>

              <TabsContent value="claims">
                <Card>
                  <CardHeader>
                    <CardTitle>Claims Management</CardTitle>
                    <CardDescription>Track and manage insurance claims</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Claims Management Coming Soon</h3>
                      <p className="text-muted-foreground">
                        Full claims tracking and management features will be available in the next update.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
