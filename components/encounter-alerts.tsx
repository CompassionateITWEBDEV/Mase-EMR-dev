"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle, Bell, CheckCircle, Clock, Calendar, User, X, Eye, Target, Zap } from "lucide-react"

// Mock data for encounter alerts
const encounterAlerts = [
  {
    id: 1,
    patientName: "Sarah Johnson",
    patientId: "P001",
    encounterId: "E001",
    alertType: "assessment_due",
    alertMessage: "C-SSRS Suicide Risk Assessment is overdue by 2 days",
    severity: "critical",
    dueDate: "2024-01-13",
    isAcknowledged: false,
    createdAt: "2024-01-15T08:00:00Z",
    requiresImmediate: true,
    estimatedTime: 15,
    lastAssessment: "2024-01-01",
  },
  {
    id: 2,
    patientName: "Michael Chen",
    patientId: "P002",
    encounterId: "E002",
    alertType: "high_risk_score",
    alertMessage: "PHQ-9 score of 18 indicates severe depression - requires immediate attention",
    severity: "critical",
    dueDate: null,
    isAcknowledged: false,
    createdAt: "2024-01-15T10:30:00Z",
    requiresImmediate: true,
    score: "18/27",
    riskLevel: "Severe Depression",
  },
  {
    id: 3,
    patientName: "Emily Rodriguez",
    patientId: "P003",
    encounterId: "E003",
    alertType: "assessment_due",
    alertMessage: "GAD-7 Anxiety Assessment due today",
    severity: "high",
    dueDate: "2024-01-15",
    isAcknowledged: false,
    createdAt: "2024-01-15T06:00:00Z",
    requiresImmediate: false,
    estimatedTime: 5,
    lastAssessment: "2024-01-08",
  },
  {
    id: 4,
    patientName: "David Wilson",
    patientId: "P004",
    encounterId: "E004",
    alertType: "missing_documentation",
    alertMessage: "Progress note missing for encounter on 01/14/2024",
    severity: "medium",
    dueDate: "2024-01-16",
    isAcknowledged: false,
    createdAt: "2024-01-15T12:00:00Z",
    requiresImmediate: false,
    encounterDate: "2024-01-14",
  },
  {
    id: 5,
    patientName: "Lisa Thompson",
    patientId: "P005",
    encounterId: "E005",
    alertType: "assessment_due",
    alertMessage: "COWS Assessment due in 2 days",
    severity: "medium",
    dueDate: "2024-01-17",
    isAcknowledged: true,
    createdAt: "2024-01-15T14:00:00Z",
    requiresImmediate: false,
    estimatedTime: 10,
    lastAssessment: "2024-01-10",
  },
  {
    id: 6,
    patientName: "Robert Garcia",
    patientId: "P006",
    encounterId: "E006",
    alertType: "medication_review",
    alertMessage: "Medication review due - patient on multiple psychotropics",
    severity: "high",
    dueDate: "2024-01-16",
    isAcknowledged: false,
    createdAt: "2024-01-15T16:00:00Z",
    requiresImmediate: false,
    medicationCount: 4,
  },
]

const severityConfig = {
  critical: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-600",
  },
  high: {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Bell,
    iconColor: "text-orange-600",
  },
  medium: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    iconColor: "text-yellow-600",
  },
  low: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Bell,
    iconColor: "text-blue-600",
  },
}

export function EncounterAlerts() {
  const [alerts, setAlerts] = useState(encounterAlerts)
  const [selectedAlert, setSelectedAlert] = useState<(typeof encounterAlerts)[0] | null>(null)

  const acknowledgeAlert = (alertId: number) => {
    setAlerts(alerts.map((alert) => (alert.id === alertId ? { ...alert, isAcknowledged: true } : alert)))
  }

  const dismissAlert = (alertId: number) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId))
  }

  const criticalAlerts = alerts.filter((alert) => alert.severity === "critical" && !alert.isAcknowledged)
  const highAlerts = alerts.filter((alert) => alert.severity === "high" && !alert.isAcknowledged)
  const unacknowledgedCount = alerts.filter((alert) => !alert.isAcknowledged).length

  return (
    <div className="space-y-4">
      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Alerts Require Immediate Attention</AlertTitle>
          <AlertDescription className="text-red-700">
            {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? "s" : ""} need
            {criticalAlerts.length === 1 ? "s" : ""} immediate action.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highAlerts.length}</div>
            <p className="text-xs text-muted-foreground">High priority alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unacknowledgedCount}</div>
            <p className="text-xs text-muted-foreground">Need acknowledgment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig]
          const IconComponent = config.icon
          const isOverdue = alert.dueDate && new Date(alert.dueDate) < new Date()

          return (
            <Card key={alert.id} className={`${config.color} ${alert.isAcknowledged ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <IconComponent className={`h-5 w-5 mt-0.5 ${config.iconColor}`} />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{alert.alertMessage}</h4>
                        {alert.requiresImmediate && (
                          <Badge variant="destructive" className="text-xs">
                            IMMEDIATE
                          </Badge>
                        )}
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            OVERDUE
                          </Badge>
                        )}
                        {alert.isAcknowledged && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ACKNOWLEDGED
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            {alert.patientName} ({alert.patientId})
                          </span>
                        </div>
                        {alert.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {new Date(alert.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {alert.estimatedTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{alert.estimatedTime} min</span>
                          </div>
                        )}
                      </div>
                      {alert.score && (
                        <div className="text-sm font-medium">
                          Score: {alert.score} - {alert.riskLevel}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedAlert(alert)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Alert Details</DialogTitle>
                          <DialogDescription>Complete information about this encounter alert</DialogDescription>
                        </DialogHeader>
                        {selectedAlert && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Patient Information</h4>
                                <div className="space-y-1 text-sm">
                                  <div>
                                    <strong>Name:</strong> {selectedAlert.patientName}
                                  </div>
                                  <div>
                                    <strong>Patient ID:</strong> {selectedAlert.patientId}
                                  </div>
                                  <div>
                                    <strong>Encounter ID:</strong> {selectedAlert.encounterId}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Alert Information</h4>
                                <div className="space-y-1 text-sm">
                                  <div>
                                    <strong>Type:</strong> {selectedAlert.alertType.replace("_", " ")}
                                  </div>
                                  <div>
                                    <strong>Severity:</strong> {selectedAlert.severity}
                                  </div>
                                  <div>
                                    <strong>Created:</strong> {new Date(selectedAlert.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Alert Message</h4>
                              <p className="text-sm">{selectedAlert.alertMessage}</p>
                            </div>
                            {selectedAlert.lastAssessment && (
                              <div>
                                <h4 className="font-semibold mb-2">Last Assessment</h4>
                                <p className="text-sm">{new Date(selectedAlert.lastAssessment).toLocaleDateString()}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button>Take Action</Button>
                              <Button variant="outline">View Patient Chart</Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    {!alert.isAcknowledged && (
                      <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => dismissAlert(alert.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {alerts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground">All encounter alerts have been addressed. Great work!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
