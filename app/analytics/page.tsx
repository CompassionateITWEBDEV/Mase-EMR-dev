"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, DollarSign, Clock, AlertTriangle, Download, Filter, RefreshCw, Brain, Activity, TrendingUp, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AIAnalyticsData {
  usage: {
    total: number;
    bySpecialty: Array<{ specialtyId: string; count: number }>;
    byRole: Array<{ role: string; count: number }>;
  };
  acceptance: {
    rate: number;
    accepted: number;
    rejected: number;
    totalWithFeedback: number;
  };
  recommendations: {
    typeDistribution: Array<{ type: string; count: number; percentage: string }>;
    feedbackStats: {
      total: number;
      accepted: number;
      rejected: number;
      averageRating: number;
      helpfulCount: number;
    };
  };
  performance: {
    cacheHits: number;
    cacheHitRate: number;
  };
  costs: {
    estimatedTotal: number;
    estimatedPerRequest: number;
    totalRequests: number;
  };
  period: {
    startDate: string | null;
    endDate: string | null;
  };
}

function AIAssistantAnalyticsTab() {
  const [data, setData] = useState<AIAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [specialtyFilter, startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (specialtyFilter !== "all") {
        params.append("specialtyId", specialtyFilter);
      }
      params.append("startDate", startDate);
      params.append("endDate", endDate);

      const response = await fetch(`/api/ai-assistant/analytics?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading AI Assistant analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No AI Assistant analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">AI Assistant Analytics</h2>
        <p className="text-muted-foreground">Track AI usage, acceptance rates, and costs across specialties</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="ai-specialty">Specialty</Label>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger id="ai-specialty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="behavioral-health">Behavioral Health</SelectItem>
                  <SelectItem value="primary-care">Primary Care</SelectItem>
                  <SelectItem value="psychiatry">Psychiatry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ai-startDate">Start Date</Label>
              <Input
                id="ai-startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ai-endDate">End Date</Label>
              <Input
                id="ai-endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchAnalytics} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.usage.total}</div>
            <p className="text-xs text-muted-foreground">AI requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.acceptance.rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.acceptance.accepted} accepted / {data.acceptance.rejected} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.cacheHitRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.performance.cacheHits} cache hits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.costs.estimatedTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${data.costs.estimatedPerRequest.toFixed(4)} per request
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Specialty */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Specialty</CardTitle>
            <CardDescription>AI requests broken down by specialty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.usage.bySpecialty.length > 0 ? (
                data.usage.bySpecialty.map((item) => (
                  <div key={item.specialtyId} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {item.specialtyId.replace("-", " ")}
                    </span>
                    <span className="text-sm text-muted-foreground">{item.count} requests</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Role</CardTitle>
            <CardDescription>AI requests broken down by user role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.usage.byRole.length > 0 ? (
                data.usage.byRole.map((item) => (
                  <div key={item.role} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{item.role}</span>
                    <span className="text-sm text-muted-foreground">{item.count} requests</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Types */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendation Types</CardTitle>
          <CardDescription>Distribution of recommendation types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recommendations.typeDistribution.length > 0 ? (
              data.recommendations.typeDistribution.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {item.type.replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Statistics</CardTitle>
          <CardDescription>User feedback on AI recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Feedback</div>
              <div className="text-2xl font-bold">{data.recommendations.feedbackStats.total}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
              <div className="text-2xl font-bold">
                {data.recommendations.feedbackStats.averageRating.toFixed(1)}/5
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Helpful Count</div>
              <div className="text-2xl font-bold">
                {data.recommendations.feedbackStats.helpfulCount}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Acceptance Rate</div>
              <div className="text-2xl font-bold">
                {data.recommendations.feedbackStats.total > 0
                  ? (
                      (data.recommendations.feedbackStats.accepted /
                        data.recommendations.feedbackStats.total) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: "30",
    provider: "all",
    program: "all",
  })

  const { data, error, isLoading, mutate } = useSWR(
    `/api/analytics?dateRange=${filters.dateRange}&provider=${filters.provider}&program=${filters.program}`,
    fetcher,
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated.",
    })
  }

  const handleApplyFilters = () => {
    mutate()
    setIsFilterOpen(false)
    toast({
      title: "Filters Applied",
      description: "Analytics data has been filtered.",
    })
  }

  const handleExport = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      filters,
      data,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Export Complete",
      description: "Analytics data has been exported.",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(true)}>
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <p className="text-destructive">Failed to load analytics data. Please try again.</p>
                <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={() => mutate()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clinical">Clinical</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <Skeleton className="h-20 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                            <p className="text-2xl font-bold text-card-foreground">
                              {data?.overview?.totalPatients || 0}
                            </p>
                            <p className="text-xs text-green-600">
                              +{data?.overview?.patientGrowth || 0}% from last month
                            </p>
                          </div>
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                            <p className="text-2xl font-bold text-card-foreground">
                              {formatCurrency(data?.overview?.totalRevenue || 0)}
                            </p>
                            <p className="text-xs text-green-600">From paid claims</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Session Time</p>
                            <p className="text-2xl font-bold text-card-foreground">
                              {data?.overview?.avgSessionTime || 0}m
                            </p>
                            <p className="text-xs text-blue-600">Per appointment</p>
                          </div>
                          <Clock className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">High Risk Alerts</p>
                            <p className="text-2xl font-bold text-card-foreground">
                              {data?.overview?.highRiskAlerts || 0}
                            </p>
                            <p className="text-xs text-red-600">Unacknowledged</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Outcomes</CardTitle>
                    <CardDescription>Treatment success rates by program</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Methadone Program</span>
                            <span className="text-sm font-medium">
                              {data?.clinical?.patientOutcomes?.methadone || 0}%
                            </span>
                          </div>
                          <Progress value={data?.clinical?.patientOutcomes?.methadone || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Buprenorphine Program</span>
                            <span className="text-sm font-medium">
                              {data?.clinical?.patientOutcomes?.buprenorphine || 0}%
                            </span>
                          </div>
                          <Progress value={data?.clinical?.patientOutcomes?.buprenorphine || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Counseling Only</span>
                            <span className="text-sm font-medium">
                              {data?.clinical?.patientOutcomes?.counseling || 0}%
                            </span>
                          </div>
                          <Progress value={data?.clinical?.patientOutcomes?.counseling || 0} className="h-2" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ASAM Level Distribution</CardTitle>
                    <CardDescription>Current patient care levels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Level 1.0 - Outpatient</span>
                          <Badge variant="outline">{data?.clinical?.asamDistribution?.level1 || 0} patients</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Level 2.1 - Intensive Outpatient</span>
                          <Badge variant="outline">{data?.clinical?.asamDistribution?.level21 || 0} patients</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Level 3.1 - Residential</span>
                          <Badge variant="outline">{data?.clinical?.asamDistribution?.level31 || 0} patients</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Level 3.7 - Medically Monitored</span>
                          <Badge variant="outline">{data?.clinical?.asamDistribution?.level37 || 0} patients</Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clinical" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Treatment Retention Rates</CardTitle>
                    <CardDescription>Patient retention by treatment duration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">30 Days</span>
                            <span className="text-sm font-medium">
                              {data?.clinical?.retentionRates?.thirtyDay || 0}%
                            </span>
                          </div>
                          <Progress value={data?.clinical?.retentionRates?.thirtyDay || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">90 Days</span>
                            <span className="text-sm font-medium">
                              {data?.clinical?.retentionRates?.ninetyDay || 0}%
                            </span>
                          </div>
                          <Progress value={data?.clinical?.retentionRates?.ninetyDay || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">6 Months</span>
                            <span className="text-sm font-medium">
                              {data?.clinical?.retentionRates?.sixMonth || 0}%
                            </span>
                          </div>
                          <Progress value={data?.clinical?.retentionRates?.sixMonth || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">1 Year</span>
                            <span className="text-sm font-medium">{data?.clinical?.retentionRates?.oneYear || 0}%</span>
                          </div>
                          <Progress value={data?.clinical?.retentionRates?.oneYear || 0} className="h-2" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Assessment Trends</CardTitle>
                    <CardDescription>Patient risk levels overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">High Risk Patients</span>
                          <Badge variant="destructive">{data?.clinical?.riskAssessment?.high || 0} patients</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Medium Risk Patients</span>
                          <Badge variant="secondary">{data?.clinical?.riskAssessment?.medium || 0} patients</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Low Risk Patients</span>
                          <Badge variant="outline">{data?.clinical?.riskAssessment?.low || 0} patients</Badge>
                        </div>
                        <div className="pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Assessment Completion Rate</span>
                            <Badge variant="default">{data?.clinical?.assessmentCompletionRate || 0}%</Badge>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Payer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Medicaid</span>
                          <span className="font-medium">
                            {formatCurrency(data?.financial?.revenueByPayer?.medicaid || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Medicare</span>
                          <span className="font-medium">
                            {formatCurrency(data?.financial?.revenueByPayer?.medicare || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Private Insurance</span>
                          <span className="font-medium">
                            {formatCurrency(data?.financial?.revenueByPayer?.privateInsurance || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Self-Pay</span>
                          <span className="font-medium">
                            {formatCurrency(data?.financial?.revenueByPayer?.selfPay || 0)}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bundle vs APG Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">OTP Bundle Claims</span>
                          <span className="font-medium">{formatCurrency(data?.financial?.bundleRevenue || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">APG Claims</span>
                          <span className="font-medium">{formatCurrency(data?.financial?.apgRevenue || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Take-Home Bundles</span>
                          <span className="font-medium">{formatCurrency(data?.financial?.takeHomeRevenue || 0)}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Claims Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Paid Claims</span>
                          <Badge variant="default">{data?.financial?.claimsStatus?.paid || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Pending Claims</span>
                          <Badge variant="secondary">{data?.financial?.claimsStatus?.pending || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Denied Claims</span>
                          <Badge variant="destructive">{data?.financial?.claimsStatus?.denied || 0}</Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Metrics</CardTitle>
                    <CardDescription>Documentation and adherence rates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Documentation Completeness</span>
                            <span className="text-sm font-medium">
                              {data?.quality?.documentationCompleteness || 0}%
                            </span>
                          </div>
                          <Progress value={data?.quality?.documentationCompleteness || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Treatment Plan Adherence</span>
                            <span className="text-sm font-medium">{data?.quality?.treatmentPlanAdherence || 0}%</span>
                          </div>
                          <Progress value={data?.quality?.treatmentPlanAdherence || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Patient Satisfaction</span>
                            <span className="text-sm font-medium">{data?.quality?.patientSatisfaction || 0}%</span>
                          </div>
                          <Progress value={data?.quality?.patientSatisfaction || 0} className="h-2" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Provider Performance</CardTitle>
                    <CardDescription>Top performing providers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      data?.quality?.providerPerformance?.map((provider: any) => (
                        <div key={provider.id} className="flex items-center justify-between p-2 rounded border">
                          <div>
                            <p className="font-medium text-sm">{provider.name}</p>
                            <p className="text-xs text-muted-foreground">{provider.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{provider.successRate}%</p>
                            <p className="text-xs text-muted-foreground">{provider.caseload} cases</p>
                          </div>
                        </div>
                      )) || <p className="text-muted-foreground text-sm">No provider data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Regulatory Compliance</CardTitle>
                    <CardDescription>Current compliance status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">DEA Compliance</span>
                            <Badge variant={data?.compliance?.dea >= 95 ? "default" : "destructive"}>
                              {data?.compliance?.dea || 0}%
                            </Badge>
                          </div>
                          <Progress value={data?.compliance?.dea || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">SAMHSA Compliance</span>
                            <Badge variant={data?.compliance?.samhsa >= 95 ? "default" : "destructive"}>
                              {data?.compliance?.samhsa || 0}%
                            </Badge>
                          </div>
                          <Progress value={data?.compliance?.samhsa || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">State Licensing</span>
                            <Badge variant={data?.compliance?.stateLicensing >= 95 ? "default" : "destructive"}>
                              {data?.compliance?.stateLicensing || 0}%
                            </Badge>
                          </div>
                          <Progress value={data?.compliance?.stateLicensing || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">HIPAA Compliance</span>
                            <Badge variant={data?.compliance?.hipaa >= 95 ? "default" : "destructive"}>
                              {data?.compliance?.hipaa || 0}%
                            </Badge>
                          </div>
                          <Progress value={data?.compliance?.hipaa || 0} className="h-2" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Audit Readiness</CardTitle>
                    <CardDescription>Preparedness for regulatory audits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Documentation</span>
                            <span className="text-sm font-medium">
                              {data?.compliance?.auditReadiness?.documentation || 0}%
                            </span>
                          </div>
                          <Progress value={data?.compliance?.auditReadiness?.documentation || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Policy Adherence</span>
                            <span className="text-sm font-medium">
                              {data?.compliance?.auditReadiness?.policyAdherence || 0}%
                            </span>
                          </div>
                          <Progress value={data?.compliance?.auditReadiness?.policyAdherence || 0} className="h-2" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-assistant" className="space-y-6">
              <AIAssistantAnalyticsTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Analytics</DialogTitle>
            <DialogDescription>Apply filters to customize the analytics view</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={filters.dateRange} onValueChange={(v) => setFilters({ ...filters, dateRange: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={filters.provider} onValueChange={(v) => setFilters({ ...filters, provider: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={filters.program} onValueChange={(v) => setFilters({ ...filters, program: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="methadone">Methadone</SelectItem>
                  <SelectItem value="buprenorphine">Buprenorphine</SelectItem>
                  <SelectItem value="naltrexone">Naltrexone</SelectItem>
                  <SelectItem value="counseling">Counseling Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
