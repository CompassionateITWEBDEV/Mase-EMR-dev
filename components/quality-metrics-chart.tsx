"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import { TrendingUp, TrendingDown, ArrowRight, Target } from "lucide-react"

// Types
interface QualityMetric {
  id: string
  name: string
  code?: string
  category: string
  current_value: number | null
  target_value: number
  benchmark_value?: number
  trend?: "up" | "down" | "stable" | null
  trend_percentage?: number
  historical_data?: Array<{ snapshot_date: string; current_value: number }>
}

interface CategoryPerformance {
  category: string
  meeting_target: number
  near_target: number
  below_target: number
  total: number
  average: number
}

// Colors for categories
const CATEGORY_COLORS: Record<string, string> = {
  outcomes: "#8884d8",
  access: "#82ca9d",
  ccbhc: "#ffc658",
  integration: "#ff7300",
  safety: "#dc2626",
  efficiency: "#0088fe",
  patient_experience: "#00C49F",
}

const STATUS_COLORS = {
  meeting_target: "#22c55e",
  near_target: "#eab308",
  below_target: "#ef4444",
}

// Helper function to get trend icon
function getTrendIcon(trend: string | null | undefined) {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-green-600" />
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-600" />
    default:
      return <ArrowRight className="h-4 w-4 text-gray-600" />
  }
}

// Multi-metric Trend Chart
interface MultiMetricTrendChartProps {
  metrics: QualityMetric[]
  title?: string
  description?: string
}

export function MultiMetricTrendChart({ metrics, title, description }: MultiMetricTrendChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    metrics.slice(0, 3).map(m => m.id)
  )

  // Combine historical data from all selected metrics
  const chartData = (() => {
    const dateMap: Record<string, any> = {}
    
    metrics
      .filter(m => selectedMetrics.includes(m.id))
      .forEach(metric => {
        (metric.historical_data || []).forEach(point => {
          const date = new Date(point.snapshot_date).toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit' 
          })
          if (!dateMap[date]) {
            dateMap[date] = { date }
          }
          dateMap[date][metric.code || metric.id] = point.current_value
        })
      })
    
    return Object.values(dateMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  })()

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    )
  }

  const lineColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#dc2626", "#0088fe"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Quality Metrics Trends"}</CardTitle>
        <CardDescription>{description || "Compare multiple metrics over time"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {metrics.map((metric, index) => (
            <Badge
              key={metric.id}
              variant={selectedMetrics.includes(metric.id) ? "default" : "outline"}
              className="cursor-pointer"
              style={{
                backgroundColor: selectedMetrics.includes(metric.id) 
                  ? lineColors[index % lineColors.length] 
                  : undefined,
              }}
              onClick={() => toggleMetric(metric.id)}
            >
              {metric.code || metric.name.slice(0, 20)}
            </Badge>
          ))}
        </div>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {metrics
                .filter(m => selectedMetrics.includes(m.id))
                .map((metric, index) => (
                  <Line
                    key={metric.id}
                    type="monotone"
                    dataKey={metric.code || metric.id}
                    stroke={lineColors[index % lineColors.length]}
                    strokeWidth={2}
                    name={metric.name}
                    dot={{ fill: lineColors[index % lineColors.length] }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No historical data available for selected metrics
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Category Performance Bar Chart
interface CategoryPerformanceChartProps {
  metrics: QualityMetric[]
  title?: string
}

export function CategoryPerformanceChart({ metrics, title }: CategoryPerformanceChartProps) {
  // Calculate performance by category
  const categoryData: CategoryPerformance[] = (() => {
    const categories: Record<string, CategoryPerformance> = {}
    
    metrics.forEach(metric => {
      if (!categories[metric.category]) {
        categories[metric.category] = {
          category: metric.category,
          meeting_target: 0,
          near_target: 0,
          below_target: 0,
          total: 0,
          average: 0,
        }
      }
      
      const cat = categories[metric.category]
      cat.total++
      
      if (metric.current_value !== null && metric.current_value !== undefined) {
        const higherIsBetter = true // Default assumption
        const meetsTarget = higherIsBetter 
          ? metric.current_value >= metric.target_value
          : metric.current_value <= metric.target_value
        
        const benchmark = metric.benchmark_value ?? metric.target_value * 0.9
        const nearTarget = higherIsBetter
          ? metric.current_value >= benchmark
          : metric.current_value <= benchmark
        
        if (meetsTarget) {
          cat.meeting_target++
        } else if (nearTarget) {
          cat.near_target++
        } else {
          cat.below_target++
        }
        
        cat.average = ((cat.average * (cat.total - 1)) + metric.current_value) / cat.total
      }
    })
    
    return Object.values(categories).map(cat => ({
      ...cat,
      category: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      average: Math.round(cat.average * 10) / 10,
    }))
  })()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Performance by Category"}</CardTitle>
      </CardHeader>
      <CardContent>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="meeting_target" stackId="a" fill={STATUS_COLORS.meeting_target} name="Meeting Target" />
              <Bar dataKey="near_target" stackId="a" fill={STATUS_COLORS.near_target} name="Near Target" />
              <Bar dataKey="below_target" stackId="a" fill={STATUS_COLORS.below_target} name="Below Target" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No category data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Benchmark Comparison Radar Chart
interface BenchmarkRadarChartProps {
  metrics: QualityMetric[]
  title?: string
}

export function BenchmarkRadarChart({ metrics, title }: BenchmarkRadarChartProps) {
  // Filter metrics with both current value and benchmark
  const radarData = metrics
    .filter(m => m.current_value !== null && m.benchmark_value !== null)
    .slice(0, 8) // Limit to 8 for readability
    .map(m => ({
      metric: m.code || m.name.slice(0, 15),
      current: m.current_value || 0,
      target: m.target_value,
      benchmark: m.benchmark_value || 0,
    }))

  if (radarData.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Benchmark Comparison"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            Need at least 3 metrics with benchmarks for radar chart
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Benchmark Comparison"}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar
              name="Current"
              dataKey="current"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.5}
            />
            <Radar
              name="Target"
              dataKey="target"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.3}
            />
            <Radar
              name="Benchmark"
              dataKey="benchmark"
              stroke="#ffc658"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Status Distribution Pie Chart
interface StatusDistributionChartProps {
  metrics: QualityMetric[]
  title?: string
}

export function StatusDistributionChart({ metrics, title }: StatusDistributionChartProps) {
  // Calculate status distribution
  const statusCounts = { meeting_target: 0, near_target: 0, below_target: 0, no_data: 0 }
  
  metrics.forEach(metric => {
    if (metric.current_value === null || metric.current_value === undefined) {
      statusCounts.no_data++
      return
    }
    
    const higherIsBetter = true
    const meetsTarget = higherIsBetter 
      ? metric.current_value >= metric.target_value
      : metric.current_value <= metric.target_value
    
    const benchmark = metric.benchmark_value ?? metric.target_value * 0.9
    const nearTarget = higherIsBetter
      ? metric.current_value >= benchmark
      : metric.current_value <= benchmark
    
    if (meetsTarget) {
      statusCounts.meeting_target++
    } else if (nearTarget) {
      statusCounts.near_target++
    } else {
      statusCounts.below_target++
    }
  })

  const pieData = [
    { name: "Meeting Target", value: statusCounts.meeting_target, fill: STATUS_COLORS.meeting_target },
    { name: "Near Target", value: statusCounts.near_target, fill: STATUS_COLORS.near_target },
    { name: "Below Target", value: statusCounts.below_target, fill: STATUS_COLORS.below_target },
  ].filter(d => d.value > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Status Distribution"}</CardTitle>
      </CardHeader>
      <CardContent>
        {pieData.length > 0 ? (
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No metrics data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Metric Comparison Table with Sparklines
interface MetricSparklineTableProps {
  metrics: QualityMetric[]
}

export function MetricSparklineTable({ metrics }: MetricSparklineTableProps) {
  // Simple sparkline component
  const Sparkline = ({ data }: { data: number[] }) => {
    if (data.length < 2) return <span className="text-gray-400">—</span>
    
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const width = 60
    const height = 20
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    }).join(" ")
    
    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke="#8884d8"
          strokeWidth="1.5"
        />
      </svg>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metrics Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Metric</th>
                <th className="text-center p-2">Current</th>
                <th className="text-center p-2">Target</th>
                <th className="text-center p-2">Trend</th>
                <th className="text-center p-2">Sparkline</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(metric => (
                <tr key={metric.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <p className="font-medium">{metric.name}</p>
                    <p className="text-xs text-gray-500">{metric.category}</p>
                  </td>
                  <td className="p-2 text-center font-bold">
                    {metric.current_value !== null ? `${metric.current_value}%` : "—"}
                  </td>
                  <td className="p-2 text-center">{metric.target_value}%</td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center">
                      {getTrendIcon(metric.trend)}
                      {metric.trend_percentage !== undefined && (
                        <span className={`text-xs ml-1 ${
                          (metric.trend_percentage || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(metric.trend_percentage || 0) > 0 ? '+' : ''}
                          {metric.trend_percentage}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <Sparkline 
                      data={(metric.historical_data || []).map(h => h.current_value)} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Export all components
export {
  getTrendIcon,
  CATEGORY_COLORS,
  STATUS_COLORS,
}

