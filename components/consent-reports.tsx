"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, TrendingUp, AlertTriangle } from "lucide-react"

interface ConsentReportsProps {
  data: {
    categoryCompletion: Array<{
      category: string
      completion: number
      total: number
    }>
    statusDistribution: Array<{
      name: string
      value: number
      color: string
    }>
    metrics: {
      overallCompletionRate: number
      totalForms: number
      pendingSignatures: number
      completedToday: number
    }
  } | null
  isLoading: boolean
  error: Error | null
}

export function ConsentReports({ data, isLoading, error }: ConsentReportsProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Reports</h3>
          <p className="text-muted-foreground text-center">Failed to load report data. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const categoryCompletion = data?.categoryCompletion || []
  const statusDistribution = data?.statusDistribution || []
  const metrics = data?.metrics || { overallCompletionRate: 0, totalForms: 0, pendingSignatures: 0, completedToday: 0 }

  const complianceMetrics = [
    {
      metric: "Overall Completion Rate",
      value: `${metrics.overallCompletionRate}%`,
      change: "+0%",
      trend: "up" as const,
      description: "Average completion across all forms",
    },
    {
      metric: "Total Forms",
      value: metrics.totalForms.toString(),
      change: "0",
      trend: "up" as const,
      description: "Active form templates",
    },
    {
      metric: "Pending Signatures",
      value: metrics.pendingSignatures.toString(),
      change: "0",
      trend: "up" as const,
      description: "Awaiting patient action",
    },
    {
      metric: "Completed Forms",
      value: metrics.completedToday.toString(),
      change: "0",
      trend: "up" as const,
      description: "Total completed",
    },
  ]

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      metrics,
      categoryCompletion,
      statusDistribution,
    }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `consent-forms-report-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Consent Forms Analytics</h2>
          <p className="text-muted-foreground">Comprehensive reporting and compliance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="30days">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {complianceMetrics.map((metric) => (
          <Card key={metric.metric}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate by Category</CardTitle>
            <CardDescription>Form completion percentages across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryCompletion.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No category data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryCompletion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completion" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Status Distribution</CardTitle>
            <CardDescription>Current status of all consent forms</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 || statusDistribution.every((s) => s.value === 0) ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No status data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution.filter((s) => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution
                      .filter((s) => s.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Category Analysis</CardTitle>
          <CardDescription>In-depth analysis of form completion by category</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryCompletion.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No category data available</div>
          ) : (
            <div className="space-y-4">
              {categoryCompletion.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{category.category}</div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round((category.completion / 100) * category.total)} of {category.total} patients completed
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Progress value={category.completion} className="w-32" />
                    <div className="text-right">
                      <div className="font-medium">{category.completion}%</div>
                      <div className="text-sm text-muted-foreground">completion</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
