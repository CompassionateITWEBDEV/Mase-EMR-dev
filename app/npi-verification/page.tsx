"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, UserCheck, FileCheck, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { NPIVerificationDashboard } from "@/components/npi-verification-dashboard"
import { LicenseVerificationDashboard } from "@/components/license-verification-dashboard"
import { ProviderCredentialManagement } from "@/components/provider-credential-management"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function NPIVerificationPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/provider-verification", fetcher)

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <main className="p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Provider Verification & Licensing</h1>
                <p className="text-muted-foreground">
                  NPI verification, license tracking, and provider credential management
                </p>
              </div>
              <Button variant="outline" onClick={() => mutate()} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{data?.metrics?.activeProviders || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-600">100%</span> in system
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">NPI Verified</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{data?.metrics?.verifiedNPI || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-yellow-600">{data?.metrics?.pendingNPI || 0}</span> pending
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Licenses Expiring</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{data?.metrics?.expiringLicenses || 0}</div>
                      <p className="text-xs text-muted-foreground">Next 90 days</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{data?.metrics?.complianceScore || 0}%</div>
                      <p className="text-xs text-muted-foreground">
                        <span className={data?.metrics?.complianceScore >= 90 ? "text-green-600" : "text-yellow-600"}>
                          {data?.metrics?.complianceScore >= 90 ? "Excellent" : "Needs Attention"}
                        </span>
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="npi-verification" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="npi-verification" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  NPI Verification
                </TabsTrigger>
                <TabsTrigger value="license-tracking" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  License Tracking
                </TabsTrigger>
                <TabsTrigger value="credential-management" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Credential Management
                </TabsTrigger>
              </TabsList>

              <TabsContent value="npi-verification">
                <NPIVerificationDashboard
                  npiRecords={data?.npiRecords || []}
                  providers={data?.providers || []}
                  isLoading={isLoading}
                  onRefresh={mutate}
                />
              </TabsContent>

              <TabsContent value="license-tracking">
                <LicenseVerificationDashboard
                  licenses={data?.licenses || []}
                  providers={data?.providers || []}
                  isLoading={isLoading}
                  onRefresh={mutate}
                />
              </TabsContent>

              <TabsContent value="credential-management">
                <ProviderCredentialManagement
                  licenses={data?.licenses || []}
                  npiRecords={data?.npiRecords || []}
                  providers={data?.providers || []}
                  isLoading={isLoading}
                  onRefresh={mutate}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
