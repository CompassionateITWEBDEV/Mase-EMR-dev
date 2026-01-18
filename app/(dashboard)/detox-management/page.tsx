"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Plus,
  Search,
  Pill,
  Heart,
  BarChart3,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DetoxManagementPage() {
  const [activeTab, setActiveTab] = useState("current-patients")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all")
  const [showNewAdmission, setShowNewAdmission] = useState(false)

  // Mock data for current detox patients
  const currentPatients = [
    {
      id: "1",
      admissionNumber: "DETOX-2025-0047",
      patientName: "Sarah M.",
      patientId: "PT-1234",
      age: 34,
      primarySubstance: "Alcohol",
      admissionDate: "2025-01-13T08:30:00",
      dayInDetox: 2,
      protocol: "CIWA Protocol",
      lastCIWA: 12,
      ciwaTime: "2 hours ago",
      severity: "Moderate",
      vitalSigns: { bp: "142/88", hr: "96", temp: "99.1°F", rr: "18", o2: "98%" },
      nextAssessmentDue: "30 min",
      status: "Stable",
      riskLevel: "Moderate",
    },
    {
      id: "2",
      admissionNumber: "DETOX-2025-0048",
      patientName: "James K.",
      patientId: "PT-5678",
      age: 42,
      primarySubstance: "Heroin",
      admissionDate: "2025-01-14T06:00:00",
      dayInDetox: 1,
      protocol: "COWS Protocol",
      lastCOWS: 18,
      cowsTime: "1 hour ago",
      severity: "Moderate",
      vitalSigns: { bp: "138/84", hr: "88", temp: "98.6°F", rr: "16", o2: "99%" },
      nextAssessmentDue: "OVERDUE",
      status: "Monitoring",
      riskLevel: "Moderate",
    },
    {
      id: "3",
      admissionNumber: "DETOX-2025-0046",
      patientName: "Maria G.",
      patientId: "PT-9012",
      age: 28,
      primarySubstance: "Benzodiazepines",
      admissionDate: "2025-01-12T14:00:00",
      dayInDetox: 3,
      protocol: "Benzo Taper Protocol",
      lastAssessment: "Clinical Assessment",
      assessmentTime: "4 hours ago",
      severity: "Mild",
      vitalSigns: { bp: "128/78", hr: "76", temp: "98.2°F", rr: "14", o2: "99%" },
      nextAssessmentDue: "2 hours",
      status: "Improving",
      riskLevel: "Low",
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "severe":
        return "destructive"
      case "moderate":
        return "default"
      case "mild":
      case "minimal":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high":
      case "severe":
        return "bg-red-100 text-red-800 border-red-300"
      case "moderate":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "low":
      case "mild":
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
          <h1 className="text-3xl font-bold text-gray-900">Medical Detox Management</h1>
          <p className="text-gray-600 mt-1">CIWA/COWS protocol monitoring and medical detoxification</p>
        </div>
        <Dialog open={showNewAdmission} onOpenChange={setShowNewAdmission}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              New Admission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Detox Admission</DialogTitle>
              <DialogDescription>Admit patient to medical detoxification unit</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt1">Sarah M. (PT-1234)</SelectItem>
                      <SelectItem value="pt2">James K. (PT-5678)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admission Source</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ed">Emergency Department</SelectItem>
                      <SelectItem value="direct">Direct Admission</SelectItem>
                      <SelectItem value="transfer">Transfer from Inpatient</SelectItem>
                      <SelectItem value="crisis">Crisis Unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Substance</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select substance..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alcohol">Alcohol</SelectItem>
                      <SelectItem value="opioids">Opioids (Heroin/Fentanyl)</SelectItem>
                      <SelectItem value="benzos">Benzodiazepines</SelectItem>
                      <SelectItem value="stimulants">Stimulants (Cocaine/Meth)</SelectItem>
                      <SelectItem value="polysubstance">Polysubstance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Detox Protocol</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select protocol..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ciwa">CIWA-Ar Protocol (Alcohol)</SelectItem>
                      <SelectItem value="cows">COWS Protocol (Opioid)</SelectItem>
                      <SelectItem value="benzo">Benzo Taper Protocol</SelectItem>
                      <SelectItem value="clinical">Clinical Observation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Last Use Date & Amount</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" placeholder="Last use date" />
                  <Input placeholder="Amount/frequency" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Medical History & Risk Factors</Label>
                <Textarea placeholder="Previous seizures, DTs, medical conditions..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewAdmission(false)}>
                Cancel
              </Button>
              <Button className="bg-cyan-600 hover:bg-cyan-700">Admit to Detox</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-gray-900">8</span>
              <Badge variant="secondary" className="ml-2">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2 today
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Total detox admissions</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Assessments Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-orange-900">3</span>
              <Badge variant="outline" className="ml-2 border-orange-400 text-orange-700">
                <AlertTriangle className="w-3 h-3 mr-1" />1 overdue
              </Badge>
            </div>
            <p className="text-xs text-orange-600 mt-1">CIWA/COWS assessments needed</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-red-900">2</span>
              <Badge className="ml-2 bg-red-600">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Critical
              </Badge>
            </div>
            <p className="text-xs text-red-600 mt-1">Patients requiring close monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Length of Stay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-gray-900">5.2</span>
              <Badge variant="secondary" className="ml-2">
                <TrendingDown className="w-3 h-3 mr-1" />
                -0.8 days
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Days average this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="current-patients">
            <Users className="w-4 h-4 mr-2" />
            Current Patients
          </TabsTrigger>
          <TabsTrigger value="protocols">
            <FileText className="w-4 h-4 mr-2" />
            Protocols
          </TabsTrigger>
          <TabsTrigger value="assessments">
            <Activity className="w-4 h-4 mr-2" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="medications">
            <Pill className="w-4 h-4 mr-2" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current-patients" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by patient name, MRN, or admission number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Protocols</SelectItem>
                    <SelectItem value="ciwa">CIWA (Alcohol)</SelectItem>
                    <SelectItem value="cows">COWS (Opioid)</SelectItem>
                    <SelectItem value="benzo">Benzo Taper</SelectItem>
                    <SelectItem value="clinical">Clinical Observation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Patient Cards */}
          <div className="space-y-4">
            {currentPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{patient.patientName}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {patient.patientId}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {patient.admissionNumber}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">
                        Age {patient.age} • Primary Substance: {patient.primarySubstance} • Day {patient.dayInDetox} of
                        Detox
                      </CardDescription>
                    </div>
                    <Badge className={getRiskBadgeColor(patient.riskLevel)}>{patient.riskLevel} Risk</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Protocol & Score */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Protocol</div>
                        <div className="font-semibold text-gray-900">{patient.protocol}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Last Score</div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {patient.lastCIWA || patient.lastCOWS}
                          </span>
                          <Badge variant={getSeverityColor(patient.severity)}>{patient.severity}</Badge>
                        </div>
                        <div className="text-xs text-gray-500">{patient.ciwaTime || patient.cowsTime}</div>
                      </div>
                    </div>

                    {/* Vital Signs */}
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Vital Signs</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">BP:</span>
                          <span className="font-medium">{patient.vitalSigns.bp}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">HR:</span>
                          <span className="font-medium">{patient.vitalSigns.hr} bpm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Temp:</span>
                          <span className="font-medium">{patient.vitalSigns.temp}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">O2 Sat:</span>
                          <span className="font-medium">{patient.vitalSigns.o2}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <Badge variant="outline" className="text-xs">
                          {patient.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Next Assessment</div>
                        <Badge
                          variant={patient.nextAssessmentDue === "OVERDUE" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {patient.nextAssessmentDue}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                          onClick={() => alert(`Opening ${patient.protocol} assessment for ${patient.patientName}`)}
                        >
                          <Activity className="w-3 h-3 mr-1" />
                          Assess Now
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <FileText className="w-3 h-3 mr-1" />
                          Chart
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="border-t pt-3 mt-3">
                    <div className="text-xs text-gray-500 mb-2">Recent Activity</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-cyan-600" />
                        <span>CIWA Score: 12 (Moderate) - 2 hours ago</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill className="w-3 h-3 text-green-600" />
                        <span>Librium 25mg administered - 3 hours ago</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-3 h-3 text-blue-600" />
                        <span>Vitals stable - 4 hours ago</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="protocols">
          <Card>
            <CardHeader>
              <CardTitle>Detox Protocols</CardTitle>
              <CardDescription>Evidence-based withdrawal management protocols</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: "CIWA-Ar Protocol",
                  substance: "Alcohol Withdrawal",
                  tool: "Clinical Institute Withdrawal Assessment for Alcohol",
                  frequency: "Q4H or PRN based on score",
                  medications: "Librium, Thiamine, Folic Acid, Multivitamin",
                  thresholds: "<8: Minimal, 8-15: Moderate, >15: Severe",
                },
                {
                  name: "COWS Protocol",
                  substance: "Opioid Withdrawal",
                  tool: "Clinical Opiate Withdrawal Scale",
                  frequency: "Q4-6H",
                  medications: "Buprenorphine, Clonidine, Comfort meds",
                  thresholds: "5-12: Mild, 13-24: Moderate, 25-36: Moderately Severe, >36: Severe",
                },
                {
                  name: "Benzodiazepine Taper",
                  substance: "Benzodiazepine Withdrawal",
                  tool: "Clinical Assessment + Vitals",
                  frequency: "Q4H first 48h, then Q8H",
                  medications: "Long-acting benzos, gradual taper over 7-14 days",
                  thresholds: "Seizure risk assessment, taper rate based on history",
                },
              ].map((protocol) => (
                <Card key={protocol.name} className="border-l-4 border-l-cyan-600">
                  <CardHeader>
                    <CardTitle className="text-base">{protocol.name}</CardTitle>
                    <CardDescription>{protocol.substance}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Assessment Tool:</span>
                      <span className="text-gray-600 ml-2">{protocol.tool}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Frequency:</span>
                      <span className="text-gray-600 ml-2">{protocol.frequency}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Medications:</span>
                      <span className="text-gray-600 ml-2">{protocol.medications}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Severity Thresholds:</span>
                      <span className="text-gray-600 ml-2">{protocol.thresholds}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Overview</CardTitle>
              <CardDescription>Track CIWA/COWS scores and clinical progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Select a patient to view assessment history</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle>Comfort Medication Management</CardTitle>
              <CardDescription>PRN medications for withdrawal symptom relief</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Pill className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Select a patient to manage comfort medications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Detox Unit Performance</CardTitle>
                <CardDescription>Key metrics and outcomes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Completion Rate</div>
                    <div className="text-2xl font-bold text-green-600">87%</div>
                    <div className="text-xs text-gray-500">Last 30 days</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">AMA Rate</div>
                    <div className="text-2xl font-bold text-orange-600">13%</div>
                    <div className="text-xs text-gray-500">Last 30 days</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Readmission Rate (30d)</div>
                    <div className="text-2xl font-bold text-blue-600">8%</div>
                    <div className="text-xs text-gray-500">Below benchmark</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
