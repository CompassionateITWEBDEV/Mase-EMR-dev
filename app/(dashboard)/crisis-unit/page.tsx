"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Shield, Users, Clock, FileText, Search, Eye } from "lucide-react"

export default function CrisisUnitPage() {
  const [activeTab, setActiveTab] = useState("active-patients")
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for crisis patients
  const crisisPatients = [
    {
      id: "1",
      admissionNumber: "CRISIS-2025-0089",
      patientName: "Michael R.",
      patientId: "PT-3456",
      age: 29,
      arrivalTime: "2025-01-14T03:15:00",
      hoursInUnit: 8,
      arrivalMethod: "Police Hold",
      presentingCrisis: "Suicidal Ideation",
      suicideRisk: "High",
      homicideRisk: "Low",
      observationLevel: "Q15 min",
      lastObservation: "12 min ago",
      nextObservationDue: "3 min",
      safetyPrecautions: ["1:1 observation", "Belongings secured", "Room checked"],
      currentDisposition: "Awaiting psychiatric evaluation",
      legalStatus: "Emergency Detention",
      securityAlerted: true,
    },
    {
      id: "2",
      admissionNumber: "CRISIS-2025-0090",
      patientName: "Jennifer T.",
      patientId: "PT-7890",
      age: 35,
      arrivalTime: "2025-01-14T06:30:00",
      hoursInUnit: 5,
      arrivalMethod: "EMS",
      presentingCrisis: "Psychotic Episode",
      suicideRisk: "Moderate",
      homicideRisk: "Low",
      observationLevel: "Q30 min",
      lastObservation: "18 min ago",
      nextObservationDue: "12 min",
      safetyPrecautions: ["Routine observation", "Medication compliance"],
      currentDisposition: "Medication trial in progress",
      legalStatus: "Voluntary",
      securityAlerted: false,
    },
    {
      id: "3",
      admissionNumber: "CRISIS-2025-0088",
      patientName: "Robert L.",
      patientId: "PT-2345",
      age: 47,
      arrivalTime: "2025-01-13T22:00:00",
      hoursInUnit: 13,
      arrivalMethod: "Walk-in",
      presentingCrisis: "Agitated/Aggressive",
      suicideRisk: "Low",
      homicideRisk: "Moderate",
      observationLevel: "Q15 min",
      lastObservation: "OVERDUE",
      nextObservationDue: "NOW",
      safetyPrecautions: ["Security standby", "De-escalation protocols", "PRN medications available"],
      currentDisposition: "Preparing for inpatient admission",
      legalStatus: "Voluntary",
      securityAlerted: true,
    },
  ]

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high":
      case "imminent":
        return "bg-red-100 text-red-800 border-red-300"
      case "moderate":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "low":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Behavioral Health Crisis Unit</h1>
          <p className="text-gray-600 mt-1">Crisis stabilization, safety monitoring, and psychiatric evaluation</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Crisis Admission
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">12</div>
            <p className="text-xs text-gray-500 mt-1">In crisis unit</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">4</div>
            <p className="text-xs text-red-600 mt-1">Require 1:1 observation</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Observations Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">3</div>
            <p className="text-xs text-orange-600 mt-1">1 overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Length of Stay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">18</span>
              <span className="text-sm text-gray-600">hours</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">2</span>
              <Badge variant="destructive" className="text-xs">
                Active
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Active codes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active-patients">
            <Users className="w-4 h-4 mr-2" />
            Active Patients
          </TabsTrigger>
          <TabsTrigger value="observations">
            <Eye className="w-4 h-4 mr-2" />
            Observation Schedule
          </TabsTrigger>
          <TabsTrigger value="safety-plans">
            <Shield className="w-4 h-4 mr-2" />
            Safety Plans
          </TabsTrigger>
          <TabsTrigger value="dispositions">
            <FileText className="w-4 h-4 mr-2" />
            Dispositions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active-patients" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patients by name, MRN, or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Patient Cards */}
          <div className="space-y-4">
            {crisisPatients.map((patient) => (
              <Card key={patient.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{patient.patientName}</CardTitle>
                        <Badge variant="outline">{patient.patientId}</Badge>
                        <Badge variant="outline">{patient.admissionNumber}</Badge>
                        {patient.securityAlerted && (
                          <Badge className="bg-red-600">
                            <Shield className="w-3 h-3 mr-1" />
                            Security Alerted
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        Age {patient.age} • Arrived {patient.hoursInUnit}h ago via {patient.arrivalMethod} •{" "}
                        {patient.legalStatus}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Crisis Assessment */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Presenting Crisis</div>
                        <div className="font-semibold text-gray-900">{patient.presentingCrisis}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Suicide Risk:</span>
                          <Badge className={getRiskColor(patient.suicideRisk)}>{patient.suicideRisk}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Homicide Risk:</span>
                          <Badge className={getRiskColor(patient.homicideRisk)}>{patient.homicideRisk}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Observation */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Observation Level</div>
                        <Badge variant="outline" className="text-xs">
                          {patient.observationLevel}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Last Observation</div>
                        <div className="text-sm text-gray-700">{patient.lastObservation}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Next Due</div>
                        <Badge variant={patient.lastObservation === "OVERDUE" ? "destructive" : "secondary"}>
                          <Clock className="w-3 h-3 mr-1" />
                          {patient.nextObservationDue}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Safety Precautions</div>
                        <div className="space-y-1">
                          {patient.safetyPrecautions.map((precaution, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                              {precaution}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                          <Eye className="w-3 h-3 mr-1" />
                          Log Observation
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <FileText className="w-3 h-3 mr-1" />
                          Chart
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Current Disposition */}
                  <div className="border-t pt-3 mt-3">
                    <div className="text-xs text-gray-500 mb-1">Current Disposition</div>
                    <div className="text-sm text-gray-700">{patient.currentDisposition}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="observations">
          <Card>
            <CardHeader>
              <CardTitle>Observation Schedule</CardTitle>
              <CardDescription>Track required patient observations and safety checks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Real-time observation schedule and completion tracking</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety-plans">
          <Card>
            <CardHeader>
              <CardTitle>Safety Plans</CardTitle>
              <CardDescription>Crisis safety planning and intervention documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Safety plan development and tracking</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispositions">
          <Card>
            <CardHeader>
              <CardTitle>Discharge Planning</CardTitle>
              <CardDescription>Track disposition outcomes and follow-up care</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Discharge disposition and follow-up coordination</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
