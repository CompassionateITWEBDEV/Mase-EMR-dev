"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, FileCheck, DollarSign, TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ClearinghouseDashboard() {
  const { data, error, isLoading } = useSWR("/api/clearinghouse", fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load clearinghouse data</p>
        </CardContent>
      </Card>
    )
  }

  const { stats, connections, transactions, batches, eras } = data || {}
  const primaryConnection = connections?.[0]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims Submitted Today</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.claimsSubmittedToday || 0}</div>
            <p className="text-xs text-muted-foreground">From {batches?.length || 0} batches</p>
            <Progress value={Math.min((stats?.claimsSubmittedToday || 0) * 2, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.acceptanceRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Based on recent batches</p>
            <Progress value={stats?.acceptanceRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ERA Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats?.eraPaymentsToday || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats?.erasProcessedToday || 0} ERAs processed today</p>
            <Progress value={Math.min((stats?.eraPaymentsToday || 0) / 500, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data?.metrics?.average_response_time_ms || 2300) / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">Clearinghouse response</p>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Clearinghouse Connection Status</CardTitle>
          <CardDescription>Real-time status of clearinghouse connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {primaryConnection ? (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${primaryConnection.connection_status === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                  />
                  <div>
                    <p className="font-medium">{primaryConnection.clearinghouse_name}</p>
                    <p className="text-sm text-muted-foreground">Primary clearinghouse</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={primaryConnection.connection_status === "connected" ? "default" : "destructive"}>
                    {primaryConnection.connection_status === "connected" ? "Connected" : "Disconnected"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {primaryConnection.is_production ? "Production" : "Test"} Mode
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-900">No Clearinghouse Configured</p>
                    <p className="text-sm text-yellow-700">Go to Configuration to set up a connection</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">837 Claims</span>
                </div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground">Submission enabled</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">835 ERA</span>
                </div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground">Auto-download enabled</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">270/271 Eligibility</span>
                </div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground">Real-time enabled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent EDI Transactions</CardTitle>
            <CardDescription>Latest clearinghouse activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 4).map(
                  (txn: {
                    id: string
                    transaction_type: string
                    transmission_status: string
                    file_name: string
                    created_at: string
                  }) => (
                    <div key={txn.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {txn.transmission_status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : txn.transmission_status === "pending" ? (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{txn.transaction_type}</p>
                        <p className="text-sm text-muted-foreground">{txn.file_name || "Transaction"}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(txn.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ),
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts & Action Items</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {batches?.filter((b: { batch_status: string }) => b.batch_status === "pending").length > 0 && (
                <div className="flex items-start gap-3 p-3 border rounded-lg border-yellow-200 bg-yellow-50">
                  <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900">Pending Acknowledgments</p>
                    <p className="text-sm text-yellow-700">
                      {batches?.filter((b: { batch_status: string }) => b.batch_status === "pending").length} batches
                      awaiting response
                    </p>
                  </div>
                </div>
              )}

              {batches?.filter((b: { batch_status: string }) => b.batch_status === "rejected").length > 0 && (
                <div className="flex items-start gap-3 p-3 border rounded-lg border-red-200 bg-red-50">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">Rejected Claims</p>
                    <p className="text-sm text-red-700">
                      {batches?.filter((b: { batch_status: string }) => b.batch_status === "rejected").length} batches
                      need correction
                    </p>
                  </div>
                </div>
              )}

              {eras?.filter((e: { processing_status: string }) => e.processing_status === "pending").length > 0 && (
                <div className="flex items-start gap-3 p-3 border rounded-lg border-blue-200 bg-blue-50">
                  <DollarSign className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Unposted ERAs</p>
                    <p className="text-sm text-blue-700">
                      {eras?.filter((e: { processing_status: string }) => e.processing_status === "pending").length}{" "}
                      ERAs ready for posting
                    </p>
                  </div>
                </div>
              )}

              {!batches?.some(
                (b: { batch_status: string }) => b.batch_status === "pending" || b.batch_status === "rejected",
              ) &&
                !eras?.some((e: { processing_status: string }) => e.processing_status === "pending") && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg border-green-200 bg-green-50">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">All Clear</p>
                      <p className="text-sm text-green-700">No pending action items</p>
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance Metrics</CardTitle>
          <CardDescription>Clearinghouse transaction statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">Claims Submitted</p>
              <p className="text-3xl font-bold">
                {batches?.reduce((sum: number, b: { total_claims: number }) => sum + (b.total_claims || 0), 0) || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">Clean Claim Rate</p>
              <p className="text-3xl font-bold">{stats?.acceptanceRate || 0}%</p>
              <p className="text-xs text-green-600 mt-1">Based on recent data</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">ERAs Processed</p>
              <p className="text-3xl font-bold">{eras?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                $
                {eras
                  ?.reduce(
                    (sum: number, e: { total_payment_amount: number }) => sum + Number(e.total_payment_amount || 0),
                    0,
                  )
                  .toLocaleString() || 0}{" "}
                total
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">Avg Days to Payment</p>
              <p className="text-3xl font-bold">14.2</p>
              <p className="text-xs text-green-600 mt-1">Industry benchmark</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
