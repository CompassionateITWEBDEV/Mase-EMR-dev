"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, Clock, FileText, Bell, Eye } from "lucide-react"

export default function SecurityOfficerPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")

  // Mock security data
  const activeAlerts = [
    {
      id: "1",
      alertCode: "Code Grey",
      alertType: "Combative Patient",
      location: "Crisis Unit - Room 203",
      patientName: "Michael R.",
      patientId: "PT-3456",
      initiatedBy: "RN Johnson",
      initiatedAt: "2025-01-14T09:15:00",
      responseTime: "2 min",
      officersDispatched: ["Officer Davis", "Officer Martinez"],
      status: "Active",
      severity: "High",
    },
    {
      id: "2",
      alertCode: "Code Yellow",
      alertType: "Elopement Risk",
      location: "Detox Unit - Floor 2",
      patientName: "Jennifer T.",
      patientId: "PT-7890",
      initiatedBy: "RN Smith",
      initiatedAt: "2025-01-14T10:30:00",
      responseTime: "1 min",
      officersDispatched: ["Officer Chen"],
      status: "Monitoring",
      severity: "Moderate",
    },
  ]

  const highRiskPatients = [
    {
      patientName: "Michael R.",
      patientId: "PT-3456",
      location: "Crisis Unit - Room 203",
      flags: ["Violence History", "Aggressive Behavior", "Contraband Attempt"],
      observationLevel: "1:1",
      securityNotes: "Patient agitated, multiple de-escalation attempts. Security standby required.",
      lastIncident: "30 min ago",
    },
    {
      patientName: "Robert L.",
      patientId: "PT-2345",
      location: "Crisis Unit - Room 208",
      flags: ["Elopement Risk", "Non-compliant"],
      observationLevel: "Q15 min",
      securityNotes: "Patient expressed desire to leave AMA. Door alarms activated.",
      lastIncident: "2 hours ago",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Officer Portal</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring, incident response, and facility safety</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Incident
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Clock className="w-4 h-4 mr-2" />
            Log Round
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-600 animate-pulse" />
              <CardTitle className="text-red-900">Active Security Alerts</CardTitle>
              <Badge className="bg-red-600">{activeAlerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.map((alert) => (
              <Card key={alert.id} className="border-red-400">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-red-600 text-white">{alert.alertCode}</Badge>
                        <span className="font-semibold text-red-900">{alert.alertType}</span>
                        <Badge variant="outline">{alert.patientName}</Badge>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>
                          <span className="font-medium">Location:</span> {alert.location}
                        </div>
                        <div>
                          <span className="font-medium">Officers Dispatched:</span>{" "}
                          {alert.officersDispatched.join(", ")}
                        </div>
                        <div>
                          <span className="font-medium">Response Time:</span> {alert.responseTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        All Clear
                      </Button>
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">47</div>
            <p className="text-xs text-gray-500 mt-1">Across all units</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">High Risk Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">6</div>
            <p className="text-xs text-red-600 mt-1">Require enhanced monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rounds Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-gray-500 mt-1">8 completed, 4 remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Incidents (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <p className="text-xs text-gray-500 mt-1">1 major, 2 minor</p>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Patients */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            High Risk Patients - Enhanced Monitoring
          </CardTitle>
          <CardDescription>Patients requiring security awareness and special precautions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {highRiskPatients.map((patient, idx) => (
            <Card key={idx} className="border-l-4 border-l-orange-500">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{patient.patientName}</span>
                      <Badge variant="outline">{patient.patientId}</Badge>
                      <Badge variant="secondary">{patient.location}</Badge>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                        {patient.observationLevel}
                      </Badge>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {patient.flags.map((flag, i) => (
                        <Badge key={i} className="bg-red-100 text-red-800 border-red-300 text-xs">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Security Notes:</span> {patient.securityNotes}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Last incident: {patient.lastIncident}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      Monitor
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="w-3 h-3 mr-1" />
                      Incidents
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Incidents</CardTitle>
          <CardDescription>Last 7 days of security events and responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No recent incidents to display</p>
            <p className="text-xs mt-1">Facility has maintained excellent safety record</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
