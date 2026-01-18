"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  Users,
  FileText,
  Download,
  Activity,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface ProductivityMetric {
  providerId: string;
  providerName: string;
  patientsSeenToday: number;
  patientsSeenWeek: number;
  assessmentsCompleted: number;
  prescriptionsWritten: number;
  billableUnits: number;
  revenueGenerated: number;
}

interface ComplianceMetric {
  category: string;
  compliant: number;
  nonCompliant: number;
  percentage: number;
}

interface ReportsData {
  productivityData: ProductivityMetric[];
  complianceData: ComplianceMetric[];
  weeklyProductivityData: { day: string; patients: number; revenue: number }[];
  revenueByServiceData: { name: string; value: number; revenue: number }[];
  providers: { id: string; first_name: string; last_name: string }[];
  financialMetrics: {
    totalRevenue: number;
    insuranceCollections: number;
    patientPayments: number;
    netRevenue: number;
    claimsAcceptanceRate: number;
    avgCollectionTime: number;
    avgClaimValue: number;
  };
  auditMetrics: {
    totalActionsToday: number;
    activeUsers: number;
    totalAuditRecords: number;
  };
  complianceActionItems: {
    labResultsPending: number;
    cowsOverdue: number;
    consentFormsNeeded: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AdvancedReportingDashboard() {
  const [dateRange, setDateRange] = useState("week");
  const [selectedProvider, setSelectedProvider] = useState("all");

  const { data, error, isLoading, mutate } = useSWR<ReportsData>(
    "/api/reports/advanced",
    fetcher
  );

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-500">Error loading reports. Please try again.</p>
        <Button onClick={() => mutate()} className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  const productivityData = data?.productivityData || [];
  const complianceData = data?.complianceData || [];
  const weeklyProductivityData = data?.weeklyProductivityData || [];
  const revenueByServiceData = data?.revenueByServiceData || [];
  const providers = data?.providers || [];
  const financialMetrics = data?.financialMetrics || {
    totalRevenue: 0,
    insuranceCollections: 0,
    patientPayments: 0,
    netRevenue: 0,
    claimsAcceptanceRate: 0,
    avgCollectionTime: 0,
    avgClaimValue: 0,
  };
  const auditMetrics = data?.auditMetrics || {
    totalActionsToday: 0,
    activeUsers: 0,
    totalAuditRecords: 0,
  };
  const complianceActionItems = data?.complianceActionItems || {
    labResultsPending: 0,
    cowsOverdue: 0,
    consentFormsNeeded: 0,
  };

  const complianceChartData = complianceData.map((item) => ({
    name: item.category,
    compliant: item.compliant,
    nonCompliant: item.nonCompliant,
  }));

  const totalPatients = productivityData.reduce(
    (sum, p) => sum + p.patientsSeenWeek,
    0
  );
  const totalRevenue = productivityData.reduce(
    (sum, p) => sum + p.revenueGenerated,
    0
  );
  const totalAssessments = productivityData.reduce(
    (sum, p) => sum + p.assessmentsCompleted,
    0
  );
  const avgCompliance =
    complianceData.length > 0
      ? Math.round(
          complianceData.reduce((sum, c) => sum + c.percentage, 0) /
            complianceData.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <Label htmlFor="dateRange">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    Dr. {provider.first_name} {provider.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssessments}</div>
            <p className="text-xs text-muted-foreground">Completed this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Rate
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompliance}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all metrics
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="productivity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="productivity">Productivity Reports</TabsTrigger>
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="productivity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Patient Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="patients" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Provider Productivity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {productivityData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No productivity data available. Data will appear as providers
                  log activity.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Patients Today</TableHead>
                      <TableHead>Patients This Week</TableHead>
                      <TableHead>Assessments</TableHead>
                      <TableHead>Prescriptions</TableHead>
                      <TableHead>Billable Units</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productivityData.map((provider) => (
                      <TableRow key={provider.providerId}>
                        <TableCell className="font-medium">
                          {provider.providerName}
                        </TableCell>
                        <TableCell>{provider.patientsSeenToday}</TableCell>
                        <TableCell>{provider.patientsSeenWeek}</TableCell>
                        <TableCell>{provider.assessmentsCompleted}</TableCell>
                        <TableCell>{provider.prescriptionsWritten}</TableCell>
                        <TableCell>{provider.billableUnits}</TableCell>
                        <TableCell>
                          ${provider.revenueGenerated.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByServiceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({
                        name,
                        percent,
                      }: {
                        name?: string;
                        percent?: number;
                      }) =>
                        `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value">
                      {revenueByServiceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Gross Revenue</span>
                    <span className="text-lg font-bold">
                      ${financialMetrics.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Insurance Collections
                    </span>
                    <span className="text-lg font-bold">
                      ${financialMetrics.insuranceCollections.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Patient Payments
                    </span>
                    <span className="text-lg font-bold">
                      ${financialMetrics.patientPayments.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium">Net Revenue</span>
                    <span className="text-xl font-bold text-green-600">
                      ${financialMetrics.netRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Billing Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {financialMetrics.claimsAcceptanceRate}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Claims Acceptance Rate
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {financialMetrics.avgCollectionTime} days
                  </div>
                  <div className="text-sm text-gray-600">
                    Average Collection Time
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${financialMetrics.avgClaimValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Average Claim Value
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="compliant" stackId="a" fill="#22c55e" />
                    <Bar dataKey="nonCompliant" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceData.map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {item.percentage >= 90 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium">
                          {item.category}
                        </span>
                      </div>
                      <Badge
                        className={
                          item.percentage >= 95
                            ? "bg-green-100 text-green-800"
                            : item.percentage >= 90
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }>
                        {item.percentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      {complianceActionItems.labResultsPending} lab results
                      pending review
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">
                      {complianceActionItems.cowsOverdue} COWS assessments
                      overdue
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    Complete
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      {complianceActionItems.consentFormsNeeded} consent forms
                      need signatures
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow Up
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {auditMetrics.totalActionsToday.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Actions Today
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {auditMetrics.activeUsers}
                  </div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {auditMetrics.totalAuditRecords.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Audit Records
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-4">Recent System Activity</h4>
                <p className="text-sm text-muted-foreground">
                  Audit trail data is being collected. View detailed logs in the
                  system administration panel.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
