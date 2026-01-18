"use client"

import { useState } from "react"
import { AlertTriangle, Clock, FileText, Shield, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RegulatoryPortal() {
  const [deaStatus] = useState({
    registrationNumber: "FR1234567",
    expirationDate: "2025-06-30",
    complianceStatus: "compliant",
    lastAuditDate: "2024-11-15",
    nextAuditDue: "2025-11-15",
    redFlagsCount: 0,
  })

  const [updates] = useState([
    {
      id: 1,
      type: "policy_change",
      title: "New Take-Home Guidelines Effective",
      description: "Updated dosing regulations for patients on maintenance therapy",
      effectiveDate: "2025-02-01",
      deadline: "2025-01-15",
      impactLevel: "high",
      status: "acknowledged",
    },
    {
      id: 2,
      type: "enforcement_action",
      title: "Enhanced Diversion Controls Required",
      description: "Mandatory implementation of biometric verification for high-risk patients",
      effectiveDate: "2025-03-01",
      deadline: "2025-02-15",
      impactLevel: "critical",
      status: "pending_review",
    },
  ])

  const [diversionMetrics] = useState({
    totalBottlesTracked: 1247,
    bottlesMissing: 3,
    tamperedBottles: 1,
    complianceRate: 99.7,
    biometricVerificationRate: 98.5,
    gpsComplianceRate: 97.2,
  })

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Regulatory Compliance Portal</h1>
        <p className="text-gray-600">DEA, State Board, and SAMHSA Regulatory Tracking & Management</p>
      </div>

      {/* DEA Compliance Dashboard */}
      <div className="grid gap-4">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              DEA Registration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600">Registration Number</p>
                <p className="font-mono font-bold">{deaStatus.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expiration Date</p>
                <p className="font-bold text-green-600">{deaStatus.expirationDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Compliance Status</p>
                <Badge className="bg-green-100 text-green-800 capitalize">{deaStatus.complianceStatus}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Audit</p>
                <p className="font-bold">{deaStatus.lastAuditDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Audit Due</p>
                <p className="font-bold text-orange-600">{deaStatus.nextAuditDue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Red Flags</p>
                <p className="text-2xl font-bold text-green-600">{deaStatus.redFlagsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="updates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="updates">Regulatory Updates</TabsTrigger>
          <TabsTrigger value="diversion">Diversion Control</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Regulatory Updates */}
        <TabsContent value="updates" className="space-y-4">
          {updates.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {update.impactLevel === "critical" ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-orange-600" />
                      )}
                      <CardTitle className="text-base">{update.title}</CardTitle>
                    </div>
                    <CardDescription>{update.description}</CardDescription>
                  </div>
                  <Badge variant={update.status === "acknowledged" ? "default" : "destructive"}>{update.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Effective Date</p>
                    <p className="font-bold">{update.effectiveDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deadline</p>
                    <p className="font-bold text-red-600">{update.deadline}</p>
                  </div>
                </div>
                {update.status !== "acknowledged" && (
                  <Button size="sm" className="w-full">
                    Acknowledge Update
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Diversion Control Metrics */}
        <TabsContent value="diversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                Diversion Control Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Total Bottles Tracked</p>
                  <p className="text-2xl font-bold text-blue-600">{diversionMetrics.totalBottlesTracked}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-sm text-gray-600">Missing Bottles</p>
                  <p className="text-2xl font-bold text-red-600">{diversionMetrics.bottlesMissing}</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-4">
                  <p className="text-sm text-gray-600">Tampered Bottles</p>
                  <p className="text-2xl font-bold text-orange-600">{diversionMetrics.tamperedBottles}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-gray-600">Overall Compliance</p>
                  <p className="text-2xl font-bold text-green-600">{diversionMetrics.complianceRate}%</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm text-gray-600">Biometric Verification</p>
                  <p className="text-2xl font-bold text-purple-600">{diversionMetrics.biometricVerificationRate}%</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-4">
                  <p className="text-sm text-gray-600">GPS Compliance</p>
                  <p className="text-2xl font-bold text-indigo-600">{diversionMetrics.gpsComplianceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                Regulatory Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-6">
                Audit trail of all regulatory compliance actions and updates
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
