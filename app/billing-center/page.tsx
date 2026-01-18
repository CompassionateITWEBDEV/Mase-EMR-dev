"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, FileCheck, TrendingUp, Building2, AlertTriangle, Package } from "lucide-react"
import { BillingCenterOverview } from "@/components/billing-center-overview"
import { ClaimsManagement } from "@/components/claims-management"
import { BillingConfiguration } from "@/components/billing-configuration"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function BillingCenterPage() {
  const { data, isLoading } = useSWR("/api/otp-billing", fetcher)

  const revenue = data?.revenue || 0
  const revenueChange = data?.revenueChange || 0
  const totalClaims =
    (data?.weeklyBilling?.fullBundle || 0) +
    (data?.weeklyBilling?.takeHomeBundle || 0) +
    (data?.weeklyBilling?.apgClaims || 0)
  const approvalRate = data?.bundleApgRatio || 0
  const pendingClaims = data?.pendingAuths || 0
  const pendingAmount = pendingClaims * 247.5
  const collectionRate = data?.collectionRate || 0
  const collectionChange = data?.collectionChange || 0

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <main className="p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Billing Center</h1>
              <p className="text-muted-foreground">
                Comprehensive billing management, claims processing, and revenue cycle management
              </p>
            </div>

            {/* Key Metrics - Now with real data */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">${revenue.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                          {revenueChange >= 0 ? "+" : ""}
                          {revenueChange}%
                        </span>{" "}
                        from last month
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Claims Submitted</CardTitle>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{totalClaims}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-blue-600">{approvalRate}%</span> approval rate
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding Claims</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{pendingClaims}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-yellow-600">${pendingAmount.toLocaleString()}</span> pending
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
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{collectionRate}%</div>
                      <p className="text-xs text-muted-foreground">
                        <span className={collectionChange >= 0 ? "text-green-600" : "text-red-600"}>
                          {collectionChange >= 0 ? "+" : ""}
                          {collectionChange}%
                        </span>{" "}
                        improvement
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="claims" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Claims Management
                </TabsTrigger>
                <TabsTrigger value="payers" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Payer Management
                </TabsTrigger>
                <TabsTrigger value="configuration" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Configuration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <BillingCenterOverview />
              </TabsContent>

              <TabsContent value="claims">
                <ClaimsManagement />
              </TabsContent>

              <TabsContent value="payers">
                <Card>
                  <CardHeader>
                    <CardTitle>Insurance Payer Management</CardTitle>
                    <CardDescription>Manage insurance payers and contracts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Payer Management</h3>
                      <p className="text-muted-foreground mb-4">
                        Access the full insurance payer management system from the Insurance menu.
                      </p>
                      <a href="/insurance" className="text-primary hover:underline">
                        Go to Insurance Management →
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="configuration">
                <BillingConfiguration />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
