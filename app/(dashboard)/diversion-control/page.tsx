"use client"

import { useState } from "react"
import { AlertTriangle, Eye, MapPin, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DiversionControl() {
  const [bottles] = useState([
    {
      id: 1,
      bottleNumber: "BOT-001-2025",
      patientName: "John Smith",
      medication: "Methadone 10mg/ml",
      quantity: 120,
      dispensedDate: "2025-01-10",
      status: "consumed",
      biometricVerified: true,
      biometricConfidence: 98.5,
      gpsVerified: true,
      sealVerified: true,
      complianceScore: 100,
    },
    {
      id: 2,
      bottleNumber: "BOT-002-2025",
      patientName: "Jane Doe",
      medication: "Buprenorphine 8mg",
      quantity: 112,
      dispensedDate: "2025-01-08",
      status: "in_transit",
      biometricVerified: false,
      biometricConfidence: 0,
      gpsVerified: true,
      sealVerified: true,
      complianceScore: 75,
      alert: "Biometric verification pending",
    },
    {
      id: 3,
      bottleNumber: "BOT-003-2025",
      patientName: "Michael Johnson",
      medication: "Methadone 10mg/ml",
      quantity: 120,
      dispensedDate: "2025-01-05",
      status: "missing",
      biometricVerified: true,
      biometricConfidence: 97.2,
      gpsVerified: false,
      sealVerified: false,
      complianceScore: 0,
      alert: "Bottle missing - Callback required",
    },
  ])

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Diversion Control & Bottle Tracking</h1>
        <p className="text-gray-600">Real-time medication bottle tracking with GPS & biometric verification</p>
      </div>

      <Tabs defaultValue="bottles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bottles">Active Bottles</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Violations</TabsTrigger>
          <TabsTrigger value="gps">GPS Tracking</TabsTrigger>
        </TabsList>

        {/* Active Bottles */}
        <TabsContent value="bottles" className="space-y-4">
          {bottles.map((bottle) => (
            <Card key={bottle.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-base">{bottle.bottleNumber}</CardTitle>
                    <CardDescription>{bottle.patientName}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      bottle.status === "consumed"
                        ? "default"
                        : bottle.status === "in_transit"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {bottle.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-bold">{bottle.medication}</p>
                  <p className="text-sm text-gray-600">
                    Dispensed: {bottle.dispensedDate} | Qty: {bottle.quantity}ml
                  </p>
                </div>

                {/* Verification Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={bottle.biometricVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Facial: {bottle.biometricVerified ? `${bottle.biometricConfidence}%` : "Pending"}
                  </Badge>
                  <Badge className={bottle.gpsVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    <MapPin className="mr-1 h-3 w-3" />
                    GPS: {bottle.gpsVerified ? "Verified" : "Failed"}
                  </Badge>
                  <Badge className={bottle.sealVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    <Shield className="mr-1 h-3 w-3" />
                    Seal: {bottle.sealVerified ? "Intact" : "Broken"}
                  </Badge>
                </div>

                {/* Alert */}
                {bottle.alert && (
                  <div className="rounded-lg bg-red-50 p-3 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">{bottle.alert}</p>
                    </div>
                  </div>
                )}

                {/* Compliance Score */}
                <div>
                  <p className="text-sm text-gray-600">Compliance Score</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          bottle.complianceScore === 100
                            ? "bg-green-600"
                            : bottle.complianceScore >= 75
                              ? "bg-yellow-600"
                              : "bg-red-600"
                        }`}
                        style={{ width: `${bottle.complianceScore}%` }}
                      />
                    </div>
                    <span className="font-bold">{bottle.complianceScore}%</span>
                  </div>
                </div>

                {bottle.status === "missing" && (
                  <Button className="w-full bg-red-600 hover:bg-red-700">Schedule Callback</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="space-y-4">
          {bottles
            .filter((b) => b.alert)
            .map((bottle) => (
              <Card key={bottle.id} className="border-red-200 bg-red-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-base text-red-900">{bottle.alert}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    {bottle.bottleNumber} - {bottle.patientName}
                  </p>
                  <Button size="sm">Take Action</Button>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* GPS Tracking */}
        <TabsContent value="gps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GPS Tracking Map</CardTitle>
              <CardDescription>Real-time location tracking for dispensed medication bottles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Interactive map integration coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
