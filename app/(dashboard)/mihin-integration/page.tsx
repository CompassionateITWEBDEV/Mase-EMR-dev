"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Network,
  Upload,
  Download,
  CheckCircle,
  FileText,
  Activity,
  Shield,
  Key,
  Database,
  TrendingUp,
  RefreshCw,
  Send,
} from "lucide-react"

export default function MiHINIntegrationPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const connectionStatus = {
    status: "connected",
    participantId: "MASE-BH-EMR-001",
    organizationName: "MASE Behavioral Health EMR",
    connectionType: "Direct + FHIR API",
    directAddress: "providers@mase-bh.mihin.org",
    certificateExpiration: "2026-12-31",
    connectivityTestPassed: true,
    lastTest: "2 hours ago",
    productionReady: true,
    goLiveDate: "2024-01-15",
  }

  const submissionMetrics = {
    today: 247,
    thisWeek: 1653,
    thisMonth: 6842,
    successRate: 99.3,
    avgResponseTime: 1.2, // seconds
  }

  const dataFlows = [
    {
      category: "Opioid Surveillance",
      submissions: 3096,
      lastSync: "1 hour ago",
      status: "active",
      destinations: ["MODA Dashboard", "CDC SUDORS", "DOSE-SYS"],
      outcomesCaptured: ["Overdose prevention", "Naloxone reversals", "Treatment retention"],
    },
    {
      category: "Clinical Quality Measures",
      submissions: 1847,
      lastSync: "3 hours ago",
      status: "active",
      destinations: ["HEDIS", "UDS", "CCBHC Reporting"],
      outcomesCaptured: ["Care coordination rate", "Treatment engagement", "Follow-up completion"],
    },
    {
      category: "Immunization Registry",
      submissions: 892,
      lastSync: "12 hours ago",
      status: "active",
      destinations: ["MCIR (Michigan Care Improvement Registry)"],
      outcomesCaptured: ["Vaccination coverage rates", "Series completion"],
    },
    {
      category: "Syndromic Surveillance",
      submissions: 428,
      lastSync: "30 minutes ago",
      status: "active",
      destinations: ["MDSS (Michigan Disease Surveillance System)"],
      outcomesCaptured: ["Outbreak detection", "Disease trends"],
    },
    {
      category: "Prescription Monitoring",
      submissions: 1579,
      lastSync: "2 hours ago",
      status: "active",
      destinations: ["MAPS (Michigan Automated Prescription System)"],
      outcomesCaptured: ["Opioid prescribing patterns", "Doctor shopping prevention"],
    },
  ]

  const workflowOutcomes = [
    {
      workflow: "MAT Admission & Retention",
      patientsTracked: 486,
      outcomesMeasured: ["30-day retention", "90-day retention", "Dose stabilization", "UDS compliance"],
      avgImprovement: 67.3,
      submittedToState: true,
    },
    {
      workflow: "Crisis Intervention & 988 Linkage",
      patientsTracked: 124,
      outcomesMeasured: [
        "Crisis stabilization",
        "Hospitalization prevented",
        "Safety plan completion",
        "Follow-up engagement",
      ],
      avgImprovement: 82.1,
      submittedToState: true,
    },
    {
      workflow: "Takehome Diversion Prevention",
      patientsTracked: 312,
      outcomesMeasured: [
        "Callback completion rate",
        "Biometric compliance",
        "Dosing adherence",
        "Risk score reduction",
      ],
      avgImprovement: 91.7,
      submittedToState: true,
    },
    {
      workflow: "Care Coordination (CCBHC)",
      patientsTracked: 728,
      outcomesMeasured: ["Successful linkages", "Warm handoffs", "Community referral completion", "Housing stability"],
      avgImprovement: 74.6,
      submittedToState: true,
    },
  ]

  const providerValueProp = [
    {
      title: "Automated State Reporting",
      description: "All MODA, SUDORS, DOSE-SYS submissions happen automatically from your clinical workflows",
      icon: Upload,
      benefit: "Zero administrative burden",
    },
    {
      title: "Real-Time Surveillance Integration",
      description: "Your clinical data flows instantly to Michigan's opioid surveillance infrastructure",
      icon: Activity,
      benefit: "Contribute to public health",
    },
    {
      title: "Outcomes That Matter",
      description: "Track patient-level outcomes that feed state quality reporting and funding justification",
      icon: TrendingUp,
      benefit: "Demonstrate impact",
    },
    {
      title: "Interoperability Built-In",
      description: "Direct messaging, FHIR APIs, and CCDAs work seamlessly with MiHIN participants",
      icon: Network,
      benefit: "No IT infrastructure needed",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Network className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">MiHIN Integration Dashboard</h1>
              <p className="text-muted-foreground">
                Michigan Health Information Network - Statewide Data Utility Connection
              </p>
            </div>
          </div>
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Production Active
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground border-l-4 border-blue-600 pl-3 py-2 bg-blue-50/50">
          MASE operationalizes provider-level workflows and captures outcomes that plug directly into Michigan's
          interoperability infrastructure
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submissions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{submissionMetrics.today}</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Auto-submitted
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{submissionMetrics.thisWeek.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">Records shared</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{submissionMetrics.successRate}%</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Excellent
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{submissionMetrics.avgResponseTime}s</div>
            <div className="text-sm text-muted-foreground mt-1">Network latency</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Live</div>
            <div className="text-sm text-muted-foreground mt-1">{connectionStatus.lastTest}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data-flows">Data Flows</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="value-prop">Provider Value</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle>MiHIN Connection Status</CardTitle>
                <CardDescription>Your organization's state network integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Participant ID</span>
                  <span className="font-mono text-sm font-semibold">{connectionStatus.participantId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Organization Name</span>
                  <span className="text-sm font-semibold">{connectionStatus.organizationName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Connection Type</span>
                  <Badge>{connectionStatus.connectionType}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Direct Address</span>
                  <span className="font-mono text-sm">{connectionStatus.directAddress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Certificate Valid Until</span>
                  <span className="text-sm">{connectionStatus.certificateExpiration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Production Status</span>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Live Since {connectionStatus.goLiveDate}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your MiHIN integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Network Connectivity
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Pending Data
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Submission Logs
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Compliance Reports
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Manage Certificates & Keys
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Strategic Positioning */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                How MASE Operationalizes Michigan's Health Data Utility
              </CardTitle>
              <CardDescription>The bridge between clinical workflows and state infrastructure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providerValueProp.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg border bg-white">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        {item.benefit}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Flows Tab */}
        <TabsContent value="data-flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Data Flows to Michigan State Systems</CardTitle>
              <CardDescription>
                Real-time data submission from MASE workflows to state reporting systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataFlows.map((flow, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {flow.category}
                          <Badge variant="default" className="bg-green-600">
                            <Activity className="h-3 w-3 mr-1" />
                            {flow.status}
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {flow.submissions.toLocaleString()} records submitted • Last sync: {flow.lastSync}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Destinations:</p>
                      <div className="flex flex-wrap gap-2">
                        {flow.destinations.map((dest, i) => (
                          <Badge key={i} variant="outline">
                            {dest}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Outcomes Captured:</p>
                      <div className="flex flex-wrap gap-2">
                        {flow.outcomesCaptured.map((outcome, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {outcome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outcomes Tab */}
        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Workflow Outcomes Feeding State Infrastructure</CardTitle>
              <CardDescription>
                Measurable patient outcomes from MASE workflows that support Michigan's data-driven policy decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowOutcomes.map((workflow, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{workflow.workflow}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {workflow.patientsTracked} patients tracked
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{workflow.avgImprovement}%</div>
                        <p className="text-xs text-muted-foreground">Avg improvement</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Measured Outcomes:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {workflow.outcomesMeasured.map((measure, i) => (
                          <div key={i} className="text-xs p-2 bg-gray-50 rounded border">
                            <CheckCircle className="h-3 w-3 text-green-600 inline mr-1" />
                            {measure}
                          </div>
                        ))}
                      </div>
                    </div>

                    {workflow.submittedToState && (
                      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                        <Upload className="h-3 w-3" />
                        Outcomes automatically submitted to Michigan DHHS and included in state quality reporting
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Connection Configuration</CardTitle>
                <CardDescription>Technical settings for MiHIN connectivity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>MiHIN Participant ID</Label>
                  <Input value={connectionStatus.participantId} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Direct Address</Label>
                  <Input value={connectionStatus.directAddress} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Connection Type</Label>
                  <Input value={connectionStatus.connectionType} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Certificate Expiration</Label>
                  <Input value={connectionStatus.certificateExpiration} readOnly />
                </div>
                <Button className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Renew Certificate
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Regulatory compliance checks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="text-sm">HIPAA Compliant</span>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="text-sm">42 CFR Part 2 Compliant</span>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="text-sm">MiHIN Connectivity Test</span>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Passed
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="text-sm">Encryption Enabled</span>
                  <Badge variant="default" className="bg-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    AES-256
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="text-sm">Production Ready</span>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Certified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Provider Value Prop Tab */}
        <TabsContent value="value-prop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Why MASE + MiHIN Makes Michigan Providers More Effective</CardTitle>
              <CardDescription>
                MASE is positioned as the operational layer that captures real clinical work and feeds Michigan's health
                data utility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Value Proposition 1 */}
                <div className="border-l-4 border-blue-600 pl-4 py-2">
                  <h3 className="font-bold text-lg mb-2">Zero Administrative Burden for State Reporting</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Every dose dispensed, every UDS collected, every counseling session, every crisis intervention—it
                    all flows automatically to MODA, SUDORS, DOSE-SYS, and Michigan DHHS without staff lifting a finger.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Auto-submit to MODA</Badge>
                    <Badge variant="secondary">Auto-submit to SUDORS</Badge>
                    <Badge variant="secondary">Auto-submit to DOSE-SYS</Badge>
                    <Badge variant="secondary">Auto-submit to Vital Statistics</Badge>
                  </div>
                </div>

                {/* Value Proposition 2 */}
                <div className="border-l-4 border-purple-600 pl-4 py-2">
                  <h3 className="font-bold text-lg mb-2">Real-Time Surveillance Participation</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your overdose reports, naloxone reversals, and crisis interventions feed Michigan's real-time ODMAP
                    alerts and outbreak detection. You contribute to protecting the entire state.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">ODMAP Real-Time Alerts</Badge>
                    <Badge variant="secondary">Outbreak Detection</Badge>
                    <Badge variant="secondary">Resource Allocation</Badge>
                  </div>
                </div>

                {/* Value Proposition 3 */}
                <div className="border-l-4 border-green-600 pl-4 py-2">
                  <h3 className="font-bold text-lg mb-2">Outcomes That Justify Funding</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Track patient-level outcomes (retention rates, housing stability, employment, crisis stabilization)
                    that feed state quality dashboards. Demonstrate your clinic's impact with data.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Treatment Retention</Badge>
                    <Badge variant="secondary">Housing Stability</Badge>
                    <Badge variant="secondary">Crisis Stabilization</Badge>
                    <Badge variant="secondary">Employment Outcomes</Badge>
                  </div>
                </div>

                {/* Value Proposition 4 */}
                <div className="border-l-4 border-orange-600 pl-4 py-2">
                  <h3 className="font-bold text-lg mb-2">Interoperability Without IT Infrastructure</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Seamlessly share patient records with hospitals, specialists, and community providers through
                    MiHIN's statewide network. No servers to maintain, no HL7 experts needed—it just works.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Direct Messaging</Badge>
                    <Badge variant="secondary">CCDA Documents</Badge>
                    <Badge variant="secondary">FHIR APIs</Badge>
                    <Badge variant="secondary">Lab Results</Badge>
                    <Badge variant="secondary">Referrals</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
