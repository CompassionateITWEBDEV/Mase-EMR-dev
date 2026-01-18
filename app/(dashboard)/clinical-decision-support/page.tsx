"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertTriangle,
  Activity,
  Shield,
  Target,
  Users,
  Calendar,
  ClipboardList,
  Brain,
  Stethoscope,
  FileText,
} from "lucide-react"

export default function ClinicalDecisionSupportPage() {
  const [selectedPatient, setSelectedPatient] = useState("patient-001")
  const [surveillanceAlerts, setSurveillanceAlerts] = useState<any[]>([])
  const [riskFactors, setRiskFactors] = useState<any[]>([])

  // Mock patient with integrated surveillance data
  const patientData = {
    id: "patient-001",
    name: "John Smith",
    age: 34,
    diagnosis: "Opioid Use Disorder",
    currentMAT: "Buprenorphine 16mg/4mg daily",
    takeHomeStatus: "Phase 2 (3 take-homes/week)",
    county: "Wayne County",
    zipCode: "48201",

    // Integrated Surveillance Insights
    surveillanceInsights: {
      sviScore: 0.82, // High vulnerability
      sviRank: "High Risk",
      countyOverdoseRate: 31.2, // per 100k
      stateOverdoseRate: 28.7,
      odmapSpikes: 2, // Recent spikes in area
      fentanylPrevalence: "89%", // In county deaths
      iduHospitalizations: 156, // County YTD
      youthSubstanceUse: "Above state average", // MiPHY data
      predictedRisk: {
        thirtyDay: 0.34, // 34% risk
        sixtyDay: 0.47,
        ninetyDay: 0.58,
        riskLevel: "HIGH",
      },
    },
  }

  useEffect(() => {
    // Load surveillance-driven alerts
    setSurveillanceAlerts([
      {
        id: 1,
        type: "ODMAP",
        severity: "urgent",
        title: "Overdose Spike Alert",
        description: "3 overdoses reported in patient's ZIP code in past 48 hours. Fentanyl confirmed in 2 cases.",
        action: "Increase naloxone supply, review safety plan",
        dataSource: "ODMAP Real-Time",
      },
      {
        id: 2,
        type: "SVI",
        severity: "warning",
        title: "High Social Vulnerability",
        description:
          "Patient resides in area with SVI score 0.82 (top 20% vulnerable). Housing instability and transportation barriers common.",
        action: "Assess social determinants, consider care coordination referral",
        dataSource: "CDC/ATSDR SVI",
      },
      {
        id: 3,
        type: "PREDICTIVE",
        severity: "warning",
        title: "Elevated Overdose Risk",
        description:
          "AI model predicts 34% probability of overdose event in next 30 days based on local trends + patient factors.",
        action: "Consider increased monitoring, reduce take-home privileges",
        dataSource: "MASE Predictive Analytics",
      },
    ])

    setRiskFactors([
      {
        factor: "Geographic Risk",
        score: "High",
        rationale: "Lives in county with overdose rate 31.2/100k vs state 28.7/100k",
        intervention: "Enhanced naloxone education",
      },
      {
        factor: "Fentanyl Exposure",
        score: "Very High",
        rationale: "89% of county overdose deaths involve fentanyl",
        intervention: "Fentanyl test strips, overdose prevention counseling",
      },
      {
        factor: "Social Vulnerability",
        score: "High",
        rationale: "SVI 0.82 - housing cost burden, no vehicle, below poverty",
        intervention: "Connect to housing resources, transportation assistance",
      },
      {
        factor: "IDU Risk",
        score: "Moderate",
        rationale: "County has 156 IDU-related hospitalizations YTD",
        intervention: "Assess for injection use, offer HCV/HIV screening",
      },
    ])
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clinical Decision Support</h1>
              <p className="text-sm text-gray-600">Surveillance-Driven Clinical Intelligence</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Activity className="mr-1 h-3 w-3" />
              Live Surveillance Data
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Patient Context Bar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{patientData.name}</CardTitle>
                <CardDescription>
                  Age {patientData.age} • {patientData.diagnosis}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={
                    patientData.surveillanceInsights.predictedRisk.riskLevel === "HIGH" ? "destructive" : "secondary"
                  }
                >
                  {patientData.surveillanceInsights.predictedRisk.riskLevel} RISK
                </Badge>
                <Badge variant="outline">{patientData.county}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Current MAT</p>
                <p className="font-medium">{patientData.currentMAT}</p>
              </div>
              <div>
                <p className="text-gray-600">Take-Home Status</p>
                <p className="font-medium">{patientData.takeHomeStatus}</p>
              </div>
              <div>
                <p className="text-gray-600">SVI Score</p>
                <p className="font-medium text-orange-600">{patientData.surveillanceInsights.sviScore} (High)</p>
              </div>
              <div>
                <p className="text-gray-600">30-Day OD Risk</p>
                <p className="font-medium text-red-600">
                  {(patientData.surveillanceInsights.predictedRisk.thirtyDay * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Surveillance Alerts */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Active Surveillance Alerts ({surveillanceAlerts.length})
          </h2>

          {surveillanceAlerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.severity === "urgent" ? "destructive" : "default"}
              className="border-l-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2">
                    {alert.title}
                    <Badge variant="outline" className="text-xs">
                      {alert.dataSource}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2">{alert.description}</AlertDescription>
                  <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Recommended Action:
                    </p>
                    <p className="text-sm text-blue-800 mt-1">{alert.action}</p>
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>

        {/* Clinical Decision Tabs */}
        <Tabs defaultValue="encounter" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="encounter">Point of Care</TabsTrigger>
            <TabsTrigger value="poc">Plan of Care</TabsTrigger>
            <TabsTrigger value="risk">Risk Stratification</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
          </TabsList>

          {/* Point of Care Decisions */}
          <TabsContent value="encounter" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Today's Encounter - Surveillance-Informed Decisions
                </CardTitle>
                <CardDescription>How to use surveillance data during this visit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {/* Decision 1: Naloxone */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 rounded">
                        <Shield className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Naloxone Supply Assessment</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Surveillance Data:</strong> ODMAP shows 3 overdoses in patient's ZIP in 48hrs.
                          Fentanyl confirmed in 2 cases.
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-green-900">✓ Clinical Action:</p>
                          <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4 list-disc">
                            <li>Verify patient has adequate naloxone supply (recommend 2+ doses)</li>
                            <li>Review overdose response with patient and family</li>
                            <li>Discuss fentanyl contamination risk in local supply</li>
                            <li>Document naloxone education in encounter note</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decision 2: Take-Home Assessment */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded">
                        <Calendar className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Take-Home Medication Decision</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Surveillance Data:</strong> AI predicts 34% overdose risk next 30 days. High fentanyl
                          prevalence (89%) in county.
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-orange-900">⚠ Clinical Action:</p>
                          <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4 list-disc">
                            <li>
                              <strong>Consider maintaining Phase 2</strong> (do not advance to Phase 3 yet)
                            </li>
                            <li>Assess for recent substance use or high-risk behaviors</li>
                            <li>Review safe storage and diversion prevention</li>
                            <li>Schedule follow-up in 1 week vs 2 weeks</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decision 3: Screening */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <ClipboardList className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Infectious Disease Screening</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Surveillance Data:</strong> IDU surveillance shows 156 hospitalizations in county YTD.
                          $1.5B in complications.
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-blue-900">✓ Clinical Action:</p>
                          <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4 list-disc">
                            <li>Assess for any injection drug use (current or past)</li>
                            <li>Order HCV antibody if not tested in past 12 months</li>
                            <li>Order HIV screening per CDC guidelines</li>
                            <li>Provide SSP (Syringe Services Program) information</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decision 4: Social Support */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Social Determinants Assessment</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Surveillance Data:</strong> SVI 0.82 indicates housing cost burden, no vehicle,
                          limited English proficiency in area.
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-purple-900">✓ Clinical Action:</p>
                          <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4 list-disc">
                            <li>Screen for housing stability and food security</li>
                            <li>Refer to care coordinator if SDOH barriers identified</li>
                            <li>Assess transportation access for appointments</li>
                            <li>Connect to community resources via findhelp.org</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan of Care Tab */}
          <TabsContent value="poc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Surveillance-Informed Plan of Care
                </CardTitle>
                <CardDescription>How surveillance data shapes treatment planning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
                    <h3 className="font-semibold text-blue-900">Treatment Intensity Decision</h3>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>SUDORS Data:</strong> 67.5% of fatal overdoses had intervention opportunities missed in
                      prior 30 days.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Clinical Decision:</strong> Increase visit frequency from bi-weekly to weekly given
                      elevated risk profile. Add group counseling 2x/week. Consider IOP referral if instability
                      continues.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded">
                    <h3 className="font-semibold text-green-900">Peer Support Referral</h3>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>SVI Data:</strong> High social vulnerability (0.82) correlates with 2.3x higher dropout
                      rates.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Clinical Decision:</strong> Refer to peer recovery coach for wraparound support. Connect
                      to housing assistance program. Schedule care coordination meeting with CCBHC team.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 border-l-4 border-purple-600 rounded">
                    <h3 className="font-semibold text-purple-900">Family Education & Prevention</h3>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>MiPHY Data:</strong> Youth in patient's county show 19.3% marijuana use (above state
                      18.8%), 7.1% rx drug misuse.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Clinical Decision:</strong> Patient has 2 teenage children. Provide family education on
                      substance use prevention. Connect to community youth programs. Discuss safe medication storage.
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 border-l-4 border-orange-600 rounded">
                    <h3 className="font-semibold text-orange-900">Crisis Safety Planning</h3>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Predictive AI:</strong> 58% probability of overdose event in next 90 days based on trends
                      + patient factors.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Clinical Decision:</strong> Update safety plan with patient. Ensure emergency contacts
                      have naloxone training. Add 988 Lifeline to crisis resources. Schedule psychiatry consult for
                      comorbid depression.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Stratification Tab */}
          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Integrated Risk Assessment
                </CardTitle>
                <CardDescription>Multi-source surveillance risk factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskFactors.map((risk, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{risk.factor}</h3>
                            <Badge
                              variant={
                                risk.score === "Very High"
                                  ? "destructive"
                                  : risk.score === "High"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {risk.score}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{risk.rationale}</p>
                          <p className="text-sm font-medium text-blue-600 mt-2">→ {risk.intervention}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interventions Tab */}
          <TabsContent value="interventions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Surveillance-Driven Interventions
                </CardTitle>
                <CardDescription>Population-level data informing individual care</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-semibold mb-2">✓ Completed Today</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Naloxone supply verified (4 doses provided)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        HCV screening ordered (last test 18 months ago)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Housing stability assessment completed
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold mb-2">⏳ Pending</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        Care coordinator referral submitted
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        Peer recovery coach assignment in progress
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        Psychiatry consult scheduled for next week
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold mb-2">📋 Recommended Next Steps</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Follow-up in 1 week (vs standard 2 weeks)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Family education session on youth substance use prevention
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Community resource packet (housing, food, transportation)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Data Sources Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Surveillance Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <p className="font-semibold">Real-Time Alerts</p>
                <p className="text-gray-600">ODMAP, MiHIN</p>
              </div>
              <div>
                <p className="font-semibold">Population Health</p>
                <p className="text-gray-600">MiOFR, SUDORS, DOSE-SYS</p>
              </div>
              <div>
                <p className="font-semibold">Community Context</p>
                <p className="text-gray-600">CDC SVI, MiPHY, IDU Surveillance</p>
              </div>
              <div>
                <p className="font-semibold">Predictive Analytics</p>
                <p className="text-gray-600">MASE AI + Integrated Data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
