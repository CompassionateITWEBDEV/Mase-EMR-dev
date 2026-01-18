"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Activity,
  Calendar,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

interface AnalyticsData {
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

export default function AIAssistantAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
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
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="flex-1 lg:pl-64 p-6">
          <div>Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="flex-1 lg:pl-64 p-6">
          <div>No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 lg:pl-64 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track AI usage, acceptance rates, and costs across specialties
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger id="specialty">
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
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchAnalytics} className="w-full">
                  <Activity className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

        {/* Usage by Specialty */}
        <Card className="mb-6">
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
        <Card className="mb-6">
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

        {/* Recommendation Types */}
        <Card className="mb-6">
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
    </div>
  );
}
