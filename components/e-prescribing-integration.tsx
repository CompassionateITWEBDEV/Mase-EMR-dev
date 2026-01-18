"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  RefreshCw,
  Shield,
  Clock,
  Activity,
} from "lucide-react"

interface EPrescribingStatus {
  isConnected: boolean
  provider: string
  lastSync: string
  pendingTransmissions: number
  failedTransmissions: number
  certificateExpiry: string
  systemVersion: string
}

interface TransmissionLog {
  id: string
  prescription_id: string
  patient_name: string
  medication: string
  pharmacy: string
  status: "success" | "failed" | "pending" | "retry"
  timestamp: string
  error_message?: string
  retry_count: number
}

export function EPrescribingIntegration() {
  const [status, setStatus] = useState<EPrescribingStatus | null>(null)
  const [transmissionLogs, setTransmissionLogs] = useState<TransmissionLog[]>([])
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadStatus()
    loadTransmissionLogs()
  }, [])

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/e-prescribing/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
      }
    } catch (error) {
      console.error("[v0] Error loading e-prescribing status:", error)
    }
  }

  const loadTransmissionLogs = async () => {
    try {
      const response = await fetch("/api/e-prescribing/transmissions")
      if (response.ok) {
        const data = await response.json()
        setTransmissionLogs(data.transmissions || [])
      }
    } catch (error) {
      console.error("[v0] Error loading transmission logs:", error)
    }
  }

  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    try {
      await loadStatus()
      await loadTransmissionLogs()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRetryTransmission = async (transmissionId: string) => {
    try {
      const response = await fetch(`/api/e-prescribing/retry/${transmissionId}`, {
        method: "POST",
      })

      if (response.ok) {
        loadTransmissionLogs()
      }
    } catch (error) {
      console.error("Failed to retry transmission:", error)
    }
  }

  const getStatusIcon = (status: TransmissionLog["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "retry":
        return <RefreshCw className="w-4 h-4 text-blue-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: TransmissionLog["status"]) => {
    switch (status) {
      case "success":
        return "default"
      case "failed":
        return "destructive"
      case "pending":
        return "secondary"
      case "retry":
        return "outline"
      default:
        return "outline"
    }
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Loading e-prescribing status...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {status.isConnected ? (
                  <Wifi className="w-5 h-5 text-green-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
                E-Prescribing System Status
              </CardTitle>
              <CardDescription>
                Connected to {status.provider} • Last sync: {new Date(status.lastSync).toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefreshStatus} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>E-Prescribing Settings</DialogTitle>
                    <DialogDescription>Configure e-prescribing system settings</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="provider">Provider Network</Label>
                      <Input id="provider" value={status.provider} readOnly />
                    </div>
                    <div>
                      <Label htmlFor="version">System Version</Label>
                      <Input id="version" value={status.systemVersion} readOnly />
                    </div>
                    <div>
                      <Label htmlFor="certificate">Certificate Expiry</Label>
                      <Input id="certificate" value={status.certificateExpiry} readOnly />
                    </div>
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        E-prescribing settings are managed by your system administrator. Contact IT support for
                        configuration changes.
                      </AlertDescription>
                    </Alert>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className={`text-2xl font-bold ${status.isConnected ? "text-green-600" : "text-red-600"}`}>
                {status.isConnected ? "Online" : "Offline"}
              </div>
              <div className="text-sm text-muted-foreground">Connection Status</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{status.pendingTransmissions}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{status.failedTransmissions}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{status.systemVersion}</div>
              <div className="text-sm text-muted-foreground">Version</div>
            </div>
          </div>

          {status.failedTransmissions > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {status.failedTransmissions} prescription transmission(s) failed. Review the transmission log and retry
                as needed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Transmission Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transmissions</CardTitle>
          <CardDescription>E-prescribing transmission history and status</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Transmissions</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="success">Successful</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {transmissionLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="font-medium">
                        {log.patient_name} - {log.medication}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        To: {log.pharmacy} • {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.error_message && <div className="text-sm text-red-600 mt-1">{log.error_message}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(log.status)}>{log.status}</Badge>
                    {log.retry_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Retry {log.retry_count}
                      </Badge>
                    )}
                    {log.status === "failed" && (
                      <Button size="sm" variant="outline" onClick={() => handleRetryTransmission(log.id)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {transmissionLogs
                .filter((log) => log.status === "pending")
                .map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="font-medium">
                          {log.patient_name} - {log.medication}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          To: {log.pharmacy} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(log.status)}>{log.status}</Badge>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="failed" className="space-y-4">
              {transmissionLogs
                .filter((log) => log.status === "failed")
                .map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="font-medium">
                          {log.patient_name} - {log.medication}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          To: {log.pharmacy} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                        {log.error_message && <div className="text-sm text-red-600 mt-1">{log.error_message}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(log.status)}>{log.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleRetryTransmission(log.id)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="success" className="space-y-4">
              {transmissionLogs
                .filter((log) => log.status === "success")
                .map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="font-medium">
                          {log.patient_name} - {log.medication}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          To: {log.pharmacy} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(log.status)}>{log.status}</Badge>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
