// ============================================================================
// Quality Metrics Notifications System
// ============================================================================
// Generates alerts and notifications for quality metrics based on thresholds,
// trend changes, and compliance requirements
// ============================================================================

import { createServiceClient } from "@/lib/supabase/service-role"

export type NotificationType = 
  | 'below_threshold' 
  | 'trend_change' 
  | 'missing_data' 
  | 'goal_achieved' 
  | 'benchmark_comparison'
  | 'ccbhc_alert'
  | 'mips_alert'

export type NotificationSeverity = 'info' | 'warning' | 'error'

export interface QualityMetricNotification {
  id: string
  metric_id: string
  metric_name: string
  metric_code?: string
  notification_type: NotificationType
  severity: NotificationSeverity
  title: string
  message: string
  action_required: boolean
  value?: number
  threshold?: number
  created_at: string
}

export interface NotificationSummary {
  total: number
  by_severity: {
    info: number
    warning: number
    error: number
  }
  by_type: Record<NotificationType, number>
  action_required_count: number
}

// ============================================================================
// Generate Notifications for Quality Metrics
// ============================================================================
export async function generateQualityMetricNotifications(): Promise<{
  notifications: QualityMetricNotification[]
  summary: NotificationSummary
}> {
  const supabase = createServiceClient()
  const notifications: QualityMetricNotification[] = []
  
  try {
    // Fetch all active metrics
    const { data: metrics, error: metricsError } = await supabase
      .from("research_quality_metrics")
      .select("*")
      .eq("is_active", true)

    if (metricsError || !metrics) {
      console.error("Error fetching metrics for notifications:", metricsError)
      return { notifications: [], summary: createEmptySummary() }
    }

    // Fetch latest snapshots for all metrics
    const metricIds = metrics.map(m => m.id)
    const { data: snapshots, error: snapshotsError } = await supabase
      .from("research_quality_snapshots")
      .select("*")
      .in("metric_id", metricIds)
      .order("snapshot_date", { ascending: false })

    if (snapshotsError) {
      console.error("Error fetching snapshots for notifications:", snapshotsError)
    }

    // Group snapshots by metric (get latest for each)
    const latestSnapshotByMetric: Record<string, any> = {}
    const previousSnapshotByMetric: Record<string, any> = {}
    
    if (snapshots) {
      for (const snapshot of snapshots) {
        if (!latestSnapshotByMetric[snapshot.metric_id]) {
          latestSnapshotByMetric[snapshot.metric_id] = snapshot
        } else if (!previousSnapshotByMetric[snapshot.metric_id]) {
          previousSnapshotByMetric[snapshot.metric_id] = snapshot
        }
      }
    }

    const now = new Date().toISOString()

    for (const metric of metrics) {
      const latest = latestSnapshotByMetric[metric.id]
      const previous = previousSnapshotByMetric[metric.id]
      const higherIsBetter = metric.higher_is_better !== false

      // Check for missing data
      if (!latest) {
        notifications.push({
          id: `missing-${metric.id}`,
          metric_id: metric.id,
          metric_name: metric.name,
          metric_code: metric.code,
          notification_type: 'missing_data',
          severity: 'warning',
          title: 'Missing Data',
          message: `No data recorded for "${metric.name}". Consider adding a snapshot.`,
          action_required: true,
          created_at: now,
        })
        continue
      }

      const currentValue = latest.current_value
      if (currentValue === null || currentValue === undefined) continue

      // Check for critical threshold breach
      if (metric.critical_threshold !== null) {
        const isCritical = higherIsBetter 
          ? currentValue < metric.critical_threshold
          : currentValue > metric.critical_threshold

        if (isCritical) {
          notifications.push({
            id: `critical-${metric.id}`,
            metric_id: metric.id,
            metric_name: metric.name,
            metric_code: metric.code,
            notification_type: 'below_threshold',
            severity: 'error',
            title: 'Critical Threshold Breach',
            message: `"${metric.name}" is at ${currentValue}${metric.unit}, which is ${higherIsBetter ? 'below' : 'above'} the critical threshold of ${metric.critical_threshold}${metric.unit}.`,
            action_required: true,
            value: currentValue,
            threshold: metric.critical_threshold,
            created_at: now,
          })
        }
      }

      // Check for warning threshold breach
      if (metric.warning_threshold !== null && metric.critical_threshold !== null) {
        const isWarning = higherIsBetter
          ? currentValue < metric.warning_threshold && currentValue >= metric.critical_threshold
          : currentValue > metric.warning_threshold && currentValue <= metric.critical_threshold

        if (isWarning) {
          notifications.push({
            id: `warning-${metric.id}`,
            metric_id: metric.id,
            metric_name: metric.name,
            metric_code: metric.code,
            notification_type: 'below_threshold',
            severity: 'warning',
            title: 'Warning Threshold Breach',
            message: `"${metric.name}" is at ${currentValue}${metric.unit}, approaching the critical threshold.`,
            action_required: false,
            value: currentValue,
            threshold: metric.warning_threshold,
            created_at: now,
          })
        }
      }

      // Check for significant negative trend
      if (previous && previous.current_value !== null) {
        const change = currentValue - previous.current_value
        const percentChange = (change / previous.current_value) * 100
        
        const isNegativeTrend = higherIsBetter ? percentChange < -5 : percentChange > 5

        if (isNegativeTrend) {
          notifications.push({
            id: `trend-${metric.id}`,
            metric_id: metric.id,
            metric_name: metric.name,
            metric_code: metric.code,
            notification_type: 'trend_change',
            severity: 'warning',
            title: 'Declining Performance',
            message: `"${metric.name}" has ${higherIsBetter ? 'decreased' : 'increased'} by ${Math.abs(percentChange).toFixed(1)}% from ${previous.current_value}${metric.unit} to ${currentValue}${metric.unit}.`,
            action_required: false,
            value: currentValue,
            created_at: now,
          })
        }
      }

      // Check for below benchmark
      if (metric.benchmark_value !== null) {
        const isBelowBenchmark = higherIsBetter
          ? currentValue < metric.benchmark_value
          : currentValue > metric.benchmark_value

        if (isBelowBenchmark) {
          notifications.push({
            id: `benchmark-${metric.id}`,
            metric_id: metric.id,
            metric_name: metric.name,
            metric_code: metric.code,
            notification_type: 'benchmark_comparison',
            severity: 'info',
            title: 'Below Benchmark',
            message: `"${metric.name}" at ${currentValue}${metric.unit} is ${higherIsBetter ? 'below' : 'above'} the benchmark of ${metric.benchmark_value}${metric.unit} (${metric.benchmark_source || 'industry standard'}).`,
            action_required: false,
            value: currentValue,
            threshold: metric.benchmark_value,
            created_at: now,
          })
        }
      }

      // Check CCBHC compliance
      if (metric.is_ccbhc_required && !latest.meets_target) {
        notifications.push({
          id: `ccbhc-${metric.id}`,
          metric_id: metric.id,
          metric_name: metric.name,
          metric_code: metric.code,
          notification_type: 'ccbhc_alert',
          severity: 'error',
          title: 'CCBHC Compliance Risk',
          message: `CCBHC required measure "${metric.name}" is not meeting target (${currentValue}${metric.unit} vs target ${metric.target_value}${metric.unit}).`,
          action_required: true,
          value: currentValue,
          threshold: metric.target_value,
          created_at: now,
        })
      }

      // Check MIPS compliance
      if (metric.is_mips_measure && !latest.meets_target) {
        notifications.push({
          id: `mips-${metric.id}`,
          metric_id: metric.id,
          metric_name: metric.name,
          metric_code: metric.code,
          notification_type: 'mips_alert',
          severity: 'warning',
          title: 'MIPS Measure At Risk',
          message: `MIPS measure "${metric.name}" is not meeting target, which may affect reimbursement.`,
          action_required: true,
          value: currentValue,
          threshold: metric.target_value,
          created_at: now,
        })
      }

      // Check for goal achievement
      if (latest.meets_target && previous && !previous.meets_target) {
        notifications.push({
          id: `achieved-${metric.id}`,
          metric_id: metric.id,
          metric_name: metric.name,
          metric_code: metric.code,
          notification_type: 'goal_achieved',
          severity: 'info',
          title: 'Target Achieved!',
          message: `"${metric.name}" has reached its target of ${metric.target_value}${metric.unit} (current: ${currentValue}${metric.unit}).`,
          action_required: false,
          value: currentValue,
          threshold: metric.target_value,
          created_at: now,
        })
      }
    }

    // Sort notifications by severity (error > warning > info)
    const severityOrder: Record<NotificationSeverity, number> = {
      error: 0,
      warning: 1,
      info: 2,
    }
    notifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    // Calculate summary
    const summary: NotificationSummary = {
      total: notifications.length,
      by_severity: {
        info: notifications.filter(n => n.severity === 'info').length,
        warning: notifications.filter(n => n.severity === 'warning').length,
        error: notifications.filter(n => n.severity === 'error').length,
      },
      by_type: {
        below_threshold: notifications.filter(n => n.notification_type === 'below_threshold').length,
        trend_change: notifications.filter(n => n.notification_type === 'trend_change').length,
        missing_data: notifications.filter(n => n.notification_type === 'missing_data').length,
        goal_achieved: notifications.filter(n => n.notification_type === 'goal_achieved').length,
        benchmark_comparison: notifications.filter(n => n.notification_type === 'benchmark_comparison').length,
        ccbhc_alert: notifications.filter(n => n.notification_type === 'ccbhc_alert').length,
        mips_alert: notifications.filter(n => n.notification_type === 'mips_alert').length,
      },
      action_required_count: notifications.filter(n => n.action_required).length,
    }

    return { notifications, summary }

  } catch (error) {
    console.error("Error generating quality metric notifications:", error)
    return { notifications: [], summary: createEmptySummary() }
  }
}

function createEmptySummary(): NotificationSummary {
  return {
    total: 0,
    by_severity: { info: 0, warning: 0, error: 0 },
    by_type: {
      below_threshold: 0,
      trend_change: 0,
      missing_data: 0,
      goal_achieved: 0,
      benchmark_comparison: 0,
      ccbhc_alert: 0,
      mips_alert: 0,
    },
    action_required_count: 0,
  }
}

// ============================================================================
// Get Notification Icon Helper
// ============================================================================
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'below_threshold':
      return '⚠️'
    case 'trend_change':
      return '📉'
    case 'missing_data':
      return '❓'
    case 'goal_achieved':
      return '🎉'
    case 'benchmark_comparison':
      return '📊'
    case 'ccbhc_alert':
      return '🏥'
    case 'mips_alert':
      return '💰'
    default:
      return '📌'
  }
}

// ============================================================================
// Get Severity Color Helper
// ============================================================================
export function getSeverityColor(severity: NotificationSeverity): {
  bg: string
  text: string
  border: string
} {
  switch (severity) {
    case 'error':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
      }
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
      }
    case 'info':
    default:
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
      }
  }
}

