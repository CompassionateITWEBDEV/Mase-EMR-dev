"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart,
} from "recharts"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
  Brain,
  AlertCircle,
  CheckCircle,
  FileText,
  BarChart3,
  GraduationCap,
  Syringe,
  Shield,
  Radio,
  Heart,
  Baby,
  Wind,
  Droplet,
  Home,
  Flame,
} from "lucide-react"

const COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  moderate: "#eab308",
  low: "#22c55e",
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  purple: "#9333ea",
  pink: "#ec4899",
  air: "#06b6d4", // Cyan for air quality
  water: "#0077b6", // Blue for water quality
  housing: "#d97706", // Orange for housing
  toxic: "#7f1d1a", // Red for toxic releases
}

export default function MichiganSurveillancePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [selectedCounty, setSelectedCounty] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [showAlertDetails, setShowAlertDetails] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseDeployed, setResponseDeployed] = useState(false)

  const modaHistoricalTrends = [
    { year: "1999", deaths: 280, rate: 5.1, milestone: "Rise in Opioid Prescriptions" },
    { year: "2000", deaths: 340, rate: 6.2, milestone: "Rise in Opioid Prescriptions" },
    { year: "2005", deaths: 580, rate: 9.8, milestone: "" },
    { year: "2010", deaths: 720, rate: 11.9, milestone: "Rise in Heroin Use" },
    { year: "2013", deaths: 1020, rate: 14.8, milestone: "Fentanyl Emergence" },
    { year: "2015", deaths: 1580, rate: 20.3, milestone: "Rise in Opioid/Stimulant Co-Use" },
    { year: "2017", deaths: 2456, rate: 28.1, milestone: "" },
    { year: "2018", deaths: 2620, rate: 29.5, milestone: "" },
    { year: "2019", deaths: 2718, rate: 30.2, milestone: "" },
    { year: "2020", deaths: 3096, rate: 33.6, milestone: "Peak Year" },
    { year: "2021", deaths: 2998, rate: 31.8, milestone: "" },
    { year: "2022", deaths: 2931, rate: 30.9, milestone: "" },
    { year: "2023", deaths: 2931, rate: 29.4, milestone: "" },
    { year: "2024", deaths: 1877, rate: 18.3, milestone: "Preliminary Data" },
  ]

  const sudorsInterventionData = {
    totalDeaths: 53336,
    withInterventionOpportunity: 67.5,
    circumstances: [
      { name: "Current SUD Treatment", percent: 6.8 },
      { name: "Witnessed Overdose", percent: 8.1 },
      { name: "Mental Health Diagnosis", percent: 31.0 },
      { name: "Potential Bystander Present", percent: 44.1 },
      { name: "Prior Overdose", percent: 12.8 },
      { name: "Recently Released from Institution", percent: 9.0 },
    ],
  }

  const substanceBreakdown = [
    { name: "Illegally-Made Fentanyls", value: 67.1, count: 1893, color: COLORS.critical },
    { name: "Methamphetamine", value: 42.3, count: 1193, color: COLORS.high },
    { name: "Cocaine", value: 28.7, count: 810, color: COLORS.moderate },
    { name: "Heroin", value: 8.9, count: 251, color: COLORS.primary },
    { name: "Prescription Opioids", value: 18.6, count: 525, color: COLORS.secondary },
  ]

  const countyRiskLevels = [
    { county: "Wayne", risk: "high", score: 87, overdoses: 682, rate: 37.0, predicted: 720, trend: "stable" },
    { county: "Oakland", risk: "moderate", score: 64, overdoses: 315, rate: 24.0, predicted: 330, trend: "down" },
    { county: "Macomb", risk: "high", score: 71, overdoses: 428, rate: 30.6, predicted: 450, trend: "up" },
    { county: "Kent", risk: "moderate", score: 58, overdoses: 245, rate: 22.3, predicted: 260, trend: "down" },
    { county: "Genesee", risk: "high", score: 82, overdoses: 198, rate: 33.4, predicted: 215, trend: "up" },
    { county: "Washtenaw", risk: "moderate", score: 52, overdoses: 142, rate: 20.9, predicted: 150, trend: "stable" },
    { county: "Kalamazoo", risk: "moderate", score: 61, overdoses: 128, rate: 26.0, predicted: 135, trend: "up" },
    { county: "Saginaw", risk: "high", score: 74, overdoses: 156, rate: 32.8, predicted: 168, trend: "up" },
  ]

  const michiganVitalStats = {
    lifeExpectancy: 75.7,
    infantMortality: 6.09,
    fertilityRate: 52.2,
    teenBirthRate: 10.9,
    marriageRate: 5.0,
    divorceRate: 2.2,
    leadingCauseOfDeath: "Heart disease",
    overdoseRank: 2, // Second leading cause among preventable deaths
  }

  const monthlyOverdoses2024 = [
    { month: "Jan", fatal: 4420, nonfatal: 12800, predicted: 4500 },
    { month: "Feb", fatal: 4180, nonfatal: 12200, predicted: 4300 },
    { month: "Mar", fatal: 4560, nonfatal: 13100, predicted: 4600 },
    { month: "Apr", fatal: 4380, nonfatal: 12600, predicted: 4450 },
    { month: "May", fatal: 4720, nonfatal: 13400, predicted: 4800 },
    { month: "Jun", fatal: 4510, nonfatal: 13000, predicted: 4600 },
    { month: "Jul", fatal: 4890, nonfatal: 13800, predicted: 4950 },
    { month: "Aug", fatal: 4650, nonfatal: 13200, predicted: 4700 },
    { month: "Sep", fatal: 4420, nonfatal: 12700, predicted: 4500 },
    { month: "Oct", fatal: 4380, nonfatal: 12600, predicted: 4450 },
    { month: "Nov", fatal: 4240, nonfatal: 12300, predicted: 4350 },
    { month: "Dec", fatal: 3996, nonfatal: 11800, predicted: 4100 },
  ]

  const demographicData = {
    bySex: [
      { category: "Male", rate: 34.4, percent: 70.3 },
      { category: "Female", rate: 14.4, percent: 29.7 },
    ],
    byAge: [
      { category: "<15", rate: 0.4, percent: 0.1 },
      { category: "15-24", rate: 7.4, percent: 5.8 },
      { category: "25-34", rate: 30.5, percent: 22.3 },
      { category: "35-44", rate: 46.6, percent: 25.7 },
      { category: "45-54", rate: 44.0, percent: 20.4 },
      { category: "55-64", rate: 41.1, percent: 18.2 },
      { category: "65+", rate: 12.5, percent: 7.5 },
    ],
    byRace: [
      { category: "White NH", rate: 23.3, percent: 62.7 },
      { category: "Black NH", rate: 21.6, percent: 18.4 },
      { category: "AI/AN NH", rate: 52.7, percent: 1.8 },
      { category: "Hispanic", rate: 18.6, percent: 12.3 },
      { category: "Asian NH", rate: 3.8, percent: 2.1 },
      { category: "Multi-race NH", rate: 40.9, percent: 2.4 },
      { category: "NH/PI NH", rate: 19.9, percent: 0.3 },
    ],
  }

  const polysubstanceCombinations = [
    { name: "Fentanyls only", percent: 20.0 },
    { name: "Fentanyls + Cocaine", percent: 15.7 },
    { name: "Fentanyls + Meth", percent: 14.6 },
    { name: "Meth only", percent: 12.2 },
    { name: "Cocaine only", percent: 8.3 },
    { name: "Other combinations", percent: 29.2 },
  ]

  const aiPredictions = {
    next30Days: {
      predictedOverdoses: 248,
      confidenceInterval: [225, 271],
      riskLevel: "high",
      accuracy: 86.7,
    },
    riskFactors: [
      { factor: "Fentanyl + Xylazine Co-Use", weight: 34.2, trend: "increasing" },
      { factor: "Polysubstance Use", weight: 28.4, trend: "increasing" },
      { factor: "Treatment Access Gap", weight: 16.8, trend: "stable" },
      { factor: "Naloxone Distribution", weight: 12.3, trend: "improving" },
      { factor: "Social Vulnerability Index", weight: 8.3, trend: "worsening" },
    ],
    recommendations: [
      "Increase fentanyl test strip distribution in Wayne, Genesee, and Macomb counties",
      "Expand MOUD treatment slots by 20% in high-risk counties",
      "Enhanced xylazine education for first responders and healthcare providers",
      "Targeted naloxone distribution to AI/AN and Black communities (highest rates)",
      "Implement peer recovery support in counties with >30 per 100K rate",
      "Strengthen polysubstance use treatment protocols",
    ],
  }

  const reportingCompliance = {
    miofr: { submitted: 2847, pending: 84, compliance: 97.1, lastUpdate: "2 days ago" },
    sudors: { submitted: 2931, pending: 0, compliance: 100.0, lastUpdate: "Real-time" },
    doseSys: { submitted: 18420, pending: 180, compliance: 99.0, lastUpdate: "1 day ago" },
    vitalStats: { submitted: 2931, pending: 0, compliance: 100.0, lastUpdate: "Monthly" },
  }

  const miphyYouthData = [
    { year: 2024, county: "Alcona", alcohol: 12.8, marijuana: 10.4, prescriptionDrugs: 2.6, easeAccessAlcohol: 46.5 },
    { year: 2022, county: "Alcona", alcohol: 13.6, marijuana: 10.8, prescriptionDrugs: 0.0, easeAccessAlcohol: 63.2 },
    { year: 2020, county: "Alcona", alcohol: 31.9, marijuana: 19.3, prescriptionDrugs: 2.4, easeAccessAlcohol: 66.3 },
    { year: 2018, county: "Alcona", alcohol: 19.3, marijuana: 10.8, prescriptionDrugs: 0.0, easeAccessAlcohol: 65.3 },
  ]

  const iduData = {
    totalHospitalizations: 221000,
    totalDeaths: 5000,
    totalCostsBillion: 1.5,
    avgCostPerHospitalization: 103020,
    avgLengthOfStay: 6.7,
    endocarditisHospitalizations: 4034,
    sepsisHospitalizations: 4800,
    hepatitisCHospitalizations: 2968,
    hivHospitalizations: 1729,
    sterilesSyringesDistributed: 2500000,
    sspProgramsActive: 12,
    costPerSyringe: 0.09,
    preventionSavings: 1.2, // billion
  }

  const sviData = [
    {
      county: "Wayne",
      overallScore: 85.4,
      category: "very_high",
      socioeconomic: 82.3,
      household: 71.2,
      minority: 92.5,
      housing: 78.6,
      opioidRiskWeight: 37.0,
    },
    {
      county: "Oakland",
      overallScore: 41.2,
      category: "moderate",
      socioeconomic: 38.5,
      household: 45.2,
      minority: 41.2,
      housing: 39.9,
      opioidRiskWeight: 24.0,
    },
    {
      county: "Macomb",
      overallScore: 58.7,
      category: "high",
      socioeconomic: 62.1,
      household: 55.3,
      minority: 38.9,
      housing: 67.2,
      opioidRiskWeight: 30.6,
    },
    {
      county: "Genesee",
      overallScore: 72.4,
      category: "very_high",
      socioeconomic: 75.8,
      household: 68.2,
      minority: 64.5,
      housing: 81.1,
      opioidRiskWeight: 33.4,
    },
  ]

  const odmapAlerts = [
    {
      id: "ODMAP-MI-001",
      county: "Wayne",
      city: "Detroit",
      zipCode: "48201",
      level: "critical",
      overdoses: 12,
      timeframe: "24 hours",
      fatal: 3,
      substance: "Fentanyl with xylazine (tranq)",
      percentAboveBaseline: 185,
      status: "active",
      timestamp: "1 hour ago",
      naloxoneDeployed: 9,
    },
    {
      id: "ODMAP-MI-002",
      county: "Genesee",
      city: "Flint",
      zipCode: "48503",
      level: "warning",
      overdoses: 7,
      timeframe: "24 hours",
      fatal: 1,
      substance: "Suspected fentanyl + methamphetamine",
      percentAboveBaseline: 112,
      status: "monitoring",
      timestamp: "4 hours ago",
      naloxoneDeployed: 6,
    },
    {
      id: "ODMAP-MI-003",
      county: "Macomb",
      city: "Warren",
      zipCode: "48089",
      level: "warning",
      overdoses: 5,
      timeframe: "12 hours",
      fatal: 0,
      substance: "Polysubstance (fentanyl + cocaine)",
      percentAboveBaseline: 94,
      status: "monitoring",
      timestamp: "8 hours ago",
      naloxoneDeployed: 5,
    },
  ]

  // New: MiTracking Environmental Health Data
  const mitrackingData = {
    leadExposure: {
      title: "Childhood Lead Exposure",
      description: "Prevalence of elevated blood lead levels in children under 6",
      data: [
        { county: "Wayne", prevalence: 6.8, risk: "high" },
        { county: "Macomb", prevalence: 4.2, risk: "moderate" },
        { county: "Genesee", prevalence: 5.5, risk: "high" },
        { county: "Saginaw", prevalence: 3.9, risk: "moderate" },
        { county: "Oakland", prevalence: 3.1, risk: "low" },
        { county: "Kent", prevalence: 2.5, risk: "low" },
      ],
      correlationWithSUD: 0.45, // Example correlation coefficient
    },
    airQuality: {
      title: "Air Quality Index (AQI)",
      description: "Average daily AQI for fine particulate matter (PM2.5)",
      data: [
        { county: "Wayne", avgAqi: 55, risk: "moderate" },
        { county: "Genesee", avgAqi: 58, risk: "moderate" },
        { county: "Macomb", avgAqi: 52, risk: "low" },
        { county: "Saginaw", avgAqi: 50, risk: "low" },
        { county: "Oakland", avgAqi: 48, risk: "low" },
        { county: "Kent", avgAqi: 45, risk: "low" },
      ],
      correlationWithSUD: 0.32,
    },
    waterQuality: {
      title: "Water Contamination Events",
      description: "Number of advisories or violations related to drinking water quality per year",
      data: [
        { county: "Wayne", events: 15, risk: "high" },
        { county: "Genesee", events: 12, risk: "moderate" },
        { county: "Macomb", events: 8, risk: "low" },
        { county: "Saginaw", events: 6, risk: "low" },
        { county: "Oakland", events: 4, risk: "low" },
        { county: "Kent", events: 3, risk: "low" },
      ],
      correlationWithSUD: 0.28,
    },
    housingConditions: {
      title: "Substandard Housing",
      description: "Percentage of housing units with critical structural issues",
      data: [
        { county: "Wayne", substandard: 18.2, risk: "high" },
        { county: "Macomb", substandard: 11.5, risk: "moderate" },
        { county: "Genesee", substandard: 14.8, risk: "high" },
        { county: "Saginaw", substandard: 9.5, risk: "moderate" },
        { county: "Oakland", substandard: 7.1, risk: "low" },
        { county: "Kent", substandard: 5.9, risk: "low" },
      ],
      correlationWithSUD: 0.41,
    },
    toxicReleases: {
      title: "Toxic Release Inventory (TRI)",
      description: "Total TRI releases per county (lbs)",
      data: [
        { county: "Wayne", releases: 250000, risk: "high" },
        { county: "Macomb", releases: 120000, risk: "moderate" },
        { county: "Genesee", releases: 95000, risk: "moderate" },
        { county: "Oakland", releases: 50000, risk: "low" },
        { county: "Kent", releases: 40000, risk: "low" },
        { county: "Saginaw", releases: 150000, risk: "high" },
      ],
      correlationWithSUD: 0.38,
    },
  }

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, any> = {
      critical: { variant: "destructive", label: "Critical" },
      high: { variant: "destructive", label: "High Risk" },
      moderate: { variant: "default", label: "Moderate" },
      low: { variant: "secondary", label: "Low Risk" },
    }
    const config = variants[risk] || variants.moderate
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" />
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Michigan Opioid Surveillance & Reporting System</h1>
          <p className="text-muted-foreground mt-1">
            Integrated MiOFR, CDC SUDORS, DOSE-SYS, MiPHY, SVI, IDU, ODMAP, and Vital Statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLoading(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export MODA Report
          </Button>
        </div>
      </div>

      {/* Key Metrics - Updated with actual Michigan 2024 data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">2024 Overdose Deaths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,877</div>
            <div className="flex items-center text-sm mt-2">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">36% decrease</span>
              <span className="text-muted-foreground ml-1">from 2023</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdose Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">18.3</div>
            <div className="flex items-center text-sm mt-2">
              <span className="text-muted-foreground">per 100K residents</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Intervention Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">67.5%</div>
            <div className="flex items-center text-sm mt-2">
              <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-orange-600">SUDORS data</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Prediction (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">248</div>
            <div className="flex items-center text-sm mt-2">
              <Brain className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-purple-600">86.7% accuracy</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">HIGH</div>
            <div className="flex items-center text-sm mt-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-orange-600">Action needed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="moda">
            <FileText className="h-4 w-4 mr-1" />
            MODA
          </TabsTrigger>
          <TabsTrigger value="sudors">
            <BarChart3 className="h-4 w-4 mr-1" />
            SUDORS
          </TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="miphy">
            <GraduationCap className="h-4 w-4 mr-1" />
            Youth
          </TabsTrigger>
          <TabsTrigger value="idu">
            <Syringe className="h-4 w-4 mr-1" />
            IDU
          </TabsTrigger>
          <TabsTrigger value="svi">
            <Shield className="h-4 w-4 mr-1" />
            SVI
          </TabsTrigger>
          <TabsTrigger value="odmap">
            <Radio className="h-4 w-4 mr-1" />
            ODMAP
          </TabsTrigger>
          <TabsTrigger value="mitracking">
            <Wind className="h-4 w-4 mr-1" />
            Environment
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Trends 2024 */}
            <Card>
              <CardHeader>
                <CardTitle>2024 Monthly Overdose Trends</CardTitle>
                <CardDescription>National SUDORS data with Michigan predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyOverdoses2024}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="fatal" fill={COLORS.critical} name="Fatal Overdoses" />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="AI Predicted"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Polysubstance Combinations */}
            <Card>
              <CardHeader>
                <CardTitle>Polysubstance Combinations (SUDORS 2024)</CardTitle>
                <CardDescription>Most common opioid and stimulant combinations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={polysubstanceCombinations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="percent" fill={COLORS.primary} name="Percent of Deaths" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Michigan Vital Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Michigan Vital Statistics (CDC Stats of the States)</CardTitle>
              <CardDescription>Key health metrics for Michigan residents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div className="text-sm text-muted-foreground">Life Expectancy</div>
                  </div>
                  <div className="text-2xl font-bold">{michiganVitalStats.lifeExpectancy}</div>
                  <div className="text-xs text-muted-foreground">years (2021)</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Baby className="h-5 w-5 text-blue-500" />
                    <div className="text-sm text-muted-foreground">Infant Mortality</div>
                  </div>
                  <div className="text-2xl font-bold">{michiganVitalStats.infantMortality}</div>
                  <div className="text-xs text-muted-foreground">per 1,000 births</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Fertility Rate</div>
                  <div className="text-2xl font-bold">{michiganVitalStats.fertilityRate}</div>
                  <div className="text-xs text-muted-foreground">per 1,000 females 15-44</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Teen Birth Rate</div>
                  <div className="text-2xl font-bold">{michiganVitalStats.teenBirthRate}</div>
                  <div className="text-xs text-muted-foreground">per 1,000 females 15-19</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Marriage Rate</div>
                  <div className="text-2xl font-bold">{michiganVitalStats.marriageRate}</div>
                  <div className="text-xs text-muted-foreground">per 1,000</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Divorce Rate</div>
                  <div className="text-2xl font-bold">{michiganVitalStats.divorceRate}</div>
                  <div className="text-xs text-muted-foreground">per 1,000</div>
                </div>
                <div className="p-4 border rounded-lg bg-red-50">
                  <div className="text-sm text-muted-foreground mb-2">Leading Cause</div>
                  <div className="text-lg font-bold text-red-600">{michiganVitalStats.leadingCauseOfDeath}</div>
                  <div className="text-xs text-muted-foreground">Overdose rank: #{michiganVitalStats.overdoseRank}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Michigan Data Reporting Compliance</CardTitle>
              <CardDescription>Real-time integration with state and federal surveillance systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">MiOFR</h3>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold mb-1">{reportingCompliance.miofr.submitted}</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {reportingCompliance.miofr.pending} pending • {reportingCompliance.miofr.compliance}% compliance
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Michigan Opioid Fatality Report</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${reportingCompliance.miofr.compliance}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Updated: {reportingCompliance.miofr.lastUpdate}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">CDC SUDORS</h3>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold mb-1">{reportingCompliance.sudors.submitted}</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {reportingCompliance.sudors.pending} pending • {reportingCompliance.sudors.compliance}% compliance
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Fatal Overdose Surveillance</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${reportingCompliance.sudors.compliance}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Updated: {reportingCompliance.sudors.lastUpdate}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">DOSE-SYS</h3>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold mb-1">{reportingCompliance.doseSys.submitted}</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {reportingCompliance.doseSys.pending} pending • {reportingCompliance.doseSys.compliance}% compliance
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Nonfatal ED Visits</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${reportingCompliance.doseSys.compliance}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Updated: {reportingCompliance.doseSys.lastUpdate}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Vital Statistics</h3>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold mb-1">{reportingCompliance.vitalStats.submitted}</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {reportingCompliance.vitalStats.pending} pending • {reportingCompliance.vitalStats.compliance}%
                    compliance
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Death Certificates</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${reportingCompliance.vitalStats.compliance}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Updated: {reportingCompliance.vitalStats.lastUpdate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODA Tab - Michigan Historical Data */}
        <TabsContent value="moda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Michigan Overdose Data to Action (MODA) - Historical Trends</CardTitle>
              <CardDescription>
                Overdose deaths per 100,000 residents: Michigan vs United States (1999-2024)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={modaHistoricalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis label={{ value: "Rate per 100K", angle: -90, position: "insideLeft" }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-bold">{data.year}</p>
                            <p className="text-sm">Deaths: {data.deaths}</p>
                            <p className="text-sm">Rate: {data.rate} per 100K</p>
                            {data.milestone && (
                              <p className="text-xs text-orange-600 mt-1 font-semibold">{data.milestone}</p>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke={COLORS.critical}
                    strokeWidth={3}
                    name="Michigan Rate"
                    dot={{ fill: COLORS.critical, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Key Milestones */}
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-lg mb-3">Key Epidemic Milestones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                    <div className="font-semibold text-blue-900">2000: Rise in Opioid Prescriptions</div>
                    <div className="text-sm text-blue-700">Rate increased from 5.1 to 6.2 per 100K</div>
                  </div>
                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                    <div className="font-semibold text-yellow-900">2010: Rise in Heroin Use</div>
                    <div className="text-sm text-yellow-700">Shift from prescription opioids to heroin</div>
                  </div>
                  <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                    <div className="font-semibold text-orange-900">2013: Fentanyl Emergence</div>
                    <div className="text-sm text-orange-700">Illegally-made fentanyls enter supply</div>
                  </div>
                  <div className="p-3 border-l-4 border-red-500 bg-red-50">
                    <div className="font-semibold text-red-900">2015: Opioid/Stimulant Co-Use</div>
                    <div className="text-sm text-red-700">Polysubstance epidemic accelerates</div>
                  </div>
                </div>
                <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div className="font-bold text-red-900 text-lg">2020: Peak Year - 3,096 Deaths</div>
                  </div>
                  <div className="text-sm text-red-700">
                    Highest overdose death rate in Michigan history (33.6 per 100K). COVID-19 pandemic disrupted
                    treatment and harm reduction services.
                  </div>
                </div>
                <div className="p-4 border-2 border-green-500 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div className="font-bold text-green-900 text-lg">
                      2024: Significant Decline - 1,877 Deaths (Preliminary)
                    </div>
                  </div>
                  <div className="text-sm text-green-700">
                    39% reduction from peak. Rate: 18.3 per 100K. Attributed to expanded MOUD, naloxone distribution,
                    and harm reduction efforts.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* County-Level Data */}
          <Card>
            <CardHeader>
              <CardTitle>County Risk Assessment (2024)</CardTitle>
              <CardDescription>Overdose rates and predictive risk scores by Michigan county</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {countyRiskLevels.map((county) => (
                  <div key={county.county} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-lg">{county.county} County</h3>
                        {getRiskBadge(county.risk)}
                        {getTrendIcon(county.trend)}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Risk Score</div>
                        <div className="text-2xl font-bold">{county.score}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-muted-foreground">2024 Deaths</div>
                        <div className="text-lg font-semibold">{county.overdoses}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Rate per 100K</div>
                        <div className="text-lg font-semibold">{county.rate}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">AI Prediction</div>
                        <div className="text-lg font-semibold text-purple-600">{county.predicted}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Trend</div>
                        <div className="text-lg font-semibold capitalize">{county.trend}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUDORS Tab - Federal Surveillance Data */}
        <TabsContent value="sudors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CDC SUDORS Dashboard - Fatal Overdose Data (2024)</CardTitle>
              <CardDescription>State Unintentional Drug Overdose Reporting System - National Data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key SUDORS Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Total Overdose Deaths (43 jurisdictions)</div>
                  <div className="text-4xl font-bold text-red-600">
                    {sudorsInterventionData.totalDeaths.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Final data for 2024</div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">With Intervention Opportunity</div>
                  <div className="text-4xl font-bold text-orange-600">
                    {sudorsInterventionData.withInterventionOpportunity}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {Math.round(
                      (sudorsInterventionData.totalDeaths * sudorsInterventionData.withInterventionOpportunity) / 100,
                    ).toLocaleString()}{" "}
                    deaths could have been prevented
                  </div>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Opioid Involvement</div>
                  <div className="text-4xl font-bold text-purple-600">73.4%</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Stimulants: 65.1% (increasing polysubstance use)
                  </div>
                </div>
              </div>

              {/* Substances Involved */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Substances Involved in Overdose Deaths (SUDORS 2024)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={substanceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                    <YAxis label={{ value: "Percent of Deaths", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.primary} name="Percent Involved">
                      {substanceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Demographics - Who Died */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Demographics of Overdose Deaths (SUDORS 2024)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* By Sex */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">By Sex</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={demographicData.bySex}>
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="rate" fill={COLORS.primary} name="Rate per 100K" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Males: 70.3% of deaths • Rate 2.4x higher than females
                    </div>
                  </div>

                  {/* By Age */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">By Age Group</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={demographicData.byAge}>
                        <XAxis dataKey="category" angle={-15} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="rate" fill={COLORS.high} name="Rate per 100K" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Peak age: 35-44 years (25.7% of deaths, rate 46.6 per 100K)
                    </div>
                  </div>

                  {/* By Race/Ethnicity */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">By Race/Ethnicity</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={demographicData.byRace} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="category" type="category" width={80} />
                        <Tooltip />
                        <Bar dataKey="rate" fill={COLORS.moderate} name="Rate per 100K" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Highest rate: AI/AN (52.7 per 100K) - 2.3x national average
                    </div>
                  </div>
                </div>
              </div>

              {/* Intervention Opportunities */}
              <div className="p-4 border-2 border-orange-500 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                  <h3 className="font-bold text-lg text-orange-900">
                    Potential Intervention Opportunities (67.5% of deaths)
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {sudorsInterventionData.circumstances.map((circ) => (
                    <div key={circ.name} className="p-3 bg-white border rounded">
                      <div className="text-2xl font-bold text-orange-600">{circ.percent}%</div>
                      <div className="text-sm text-gray-700 mt-1">{circ.name}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-white rounded border-l-4 border-orange-600">
                  <div className="font-semibold text-orange-900 mb-1">Clinical Implications:</div>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>44.1% had a potential bystander present - naloxone education critical</li>
                    <li>31.0% had mental health diagnosis - integrated treatment needed</li>
                    <li>12.8% had prior overdose - enhanced follow-up protocols</li>
                    <li>Only 6.8% in current SUD treatment - massive treatment gap</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Predictive Analytics Dashboard</CardTitle>
                  <CardDescription>Machine learning predictions for next 30 days</CardDescription>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  86.7% Accuracy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prediction Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Predicted Overdoses</div>
                  <div className="text-3xl font-bold text-purple-600">248</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    CI: {aiPredictions.next30Days.confidenceInterval[0]} -{" "}
                    {aiPredictions.next30Days.confidenceInterval[1]}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                  <div className="text-3xl font-bold text-orange-600 uppercase">
                    {aiPredictions.next30Days.riskLevel}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Immediate action recommended</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Model Accuracy</div>
                  <div className="text-3xl font-bold text-blue-600">{aiPredictions.next30Days.accuracy}%</div>
                  <div className="text-xs text-muted-foreground mt-2">Based on 12-month historical data</div>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contributing Risk Factors (Weighted)</h3>
                <div className="space-y-3">
                  {aiPredictions.riskFactors.map((factor, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{factor.factor}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{factor.weight}%</span>
                          {getTrendIcon(factor.trend)}
                          <Badge variant="outline" className="text-xs">
                            {factor.trend}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${factor.weight * 3}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div>
                <h3 className="text-lg font-semibold mb-4">AI-Generated Recommendations</h3>
                <div className="space-y-2">
                  {aiPredictions.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-white">
                      <div className="mt-0.5">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{rec}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Implement
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Analysis Tab */}
        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>County-Level Risk Assessment</CardTitle>
              <CardDescription>Geographic distribution of overdose risk across Michigan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {countyRiskLevels.map((county) => (
                  <div key={county.county} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{county.county} County</h3>
                          <p className="text-sm text-muted-foreground">Rate: {county.rate} per 100K</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getTrendIcon(county.trend)}
                        {getRiskBadge(county.risk)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Current (2024)</div>
                        <div className="font-bold text-lg">{county.overdoses}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Predicted (30d)</div>
                        <div className="font-bold text-lg text-purple-600">{county.predicted}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Change</div>
                        <div className="font-bold text-lg">
                          +{((county.predicted / county.overdoses - 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            county.risk === "high"
                              ? "bg-red-500"
                              : county.risk === "moderate"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${county.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* State Reporting Tab */}
        <TabsContent value="reporting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>State & Federal Reporting Compliance</CardTitle>
              <CardDescription>Track submissions to MiOFR, DOSE-SYS, and Vital Statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="default" className="h-24 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Generate MiOFR Report</span>
                  </Button>
                  <Button variant="default" className="h-24 flex-col">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span>Submit to DOSE-SYS</span>
                  </Button>
                  <Button variant="default" className="h-24 flex-col">
                    <Calendar className="h-6 w-6 mb-2" />
                    <span>Vital Statistics Sync</span>
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Recent Submissions</h3>
                  <div className="space-y-3">
                    {[
                      {
                        system: "MiOFR",
                        date: "2026-01-14",
                        cases: 18,
                        status: "Accepted",
                        confirmation: "MIOFR-2026-0114-001",
                      },
                      {
                        system: "CDC DOSE-SYS",
                        date: "2026-01-13",
                        cases: 124,
                        status: "Accepted",
                        confirmation: "CDC-DOSE-20260113-MI",
                      },
                      {
                        system: "Vital Statistics",
                        date: "2026-01-12",
                        cases: 4,
                        status: "Pending",
                        confirmation: "VS-MI-202601-PEND",
                      },
                    ].map((submission, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle
                            className={`h-5 w-5 ${
                              submission.status === "Accepted" ? "text-green-500" : "text-yellow-500"
                            }`}
                          />
                          <div>
                            <div className="font-medium">{submission.system}</div>
                            <div className="text-sm text-muted-foreground">
                              {submission.cases} cases • {submission.date}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={submission.status === "Accepted" ? "secondary" : "default"}>
                            {submission.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">{submission.confirmation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patient Risk Tab */}
        <TabsContent value="patient-risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient-Level Overdose Risk Screening</CardTitle>
              <CardDescription>AI-powered risk assessment for clinical decision support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-1">Automated Risk Screening Available</h3>
                      <p className="text-sm text-blue-700">
                        The system automatically calculates overdose risk scores for all patients receiving opioid
                        therapy using PDMP data, prescription history, and clinical factors. High-risk patients are
                        flagged for provider review.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Very High Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">23</div>
                      <p className="text-sm text-muted-foreground mt-1">Immediate intervention recommended</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">High Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">67</div>
                      <p className="text-sm text-muted-foreground mt-1">Enhanced monitoring needed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Moderate Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-600">142</div>
                      <p className="text-sm text-muted-foreground mt-1">Standard precautions</p>
                    </CardContent>
                  </Card>
                </div>

                <Button className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  View All High-Risk Patients
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="miphy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Michigan Profile for Healthy Youth (MiPHY)</CardTitle>
              <CardDescription>Youth substance use trends by county and grade level - High school data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Substance Use Trends - Alcona County</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={miphyYouthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis label={{ value: "Percent (%)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="alcohol"
                          stroke="#f97316"
                          name="Alcohol Use Past 30 Days"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="marijuana"
                          stroke="#22c55e"
                          name="Marijuana Use Past 30 Days"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="prescriptionDrugs"
                          stroke="#ef4444"
                          name="Prescription Drug Misuse"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Ease of Access to Substances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={miphyYouthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis label={{ value: "Percent (%)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="easeAccessAlcohol" fill="#f97316" name="Easy Access to Alcohol" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Alcohol Use (2024)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">12.8%</div>
                    <div className="text-xs text-muted-foreground mt-1">Past 30 days</div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Marijuana Use (2024)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">10.4%</div>
                    <div className="text-xs text-muted-foreground mt-1">Past 30 days</div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Rx Drug Misuse (2024)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">2.6%</div>
                    <div className="text-xs text-muted-foreground mt-1">Past 30 days</div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Parental Disapproval</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">92.3%</div>
                    <div className="text-xs text-muted-foreground mt-1">Alcohol use</div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Prevention Insights
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>
                      <strong>Declining trend:</strong> Alcohol use decreased from 31.9% (2020) to 12.8% (2024) in
                      Alcona County high schools
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>
                      <strong>Positive indicator:</strong> 92.3% of parents disapprove of alcohol use, showing strong
                      family protective factors
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                    <span>
                      <strong>Action needed:</strong> 46.5% report easy access to alcohol - enhanced retailer compliance
                      checks recommended
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="idu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Infectious Sequelae of Injection Drug Use (IDU)</CardTitle>
              <CardDescription>
                Michigan hospitalizations, deaths, and healthcare costs from injection drug use complications
                (2016-2022)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">IDU Hospitalizations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">221,000</div>
                    <div className="text-xs text-muted-foreground mt-1">2016-2022</div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Deaths from IDU</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">5,000</div>
                    <div className="text-xs text-muted-foreground mt-1">2016-2022</div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Total Healthcare Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">$1.5B</div>
                    <div className="text-xs text-muted-foreground mt-1">2016-2022</div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Avg Cost Per Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">$103K</div>
                    <div className="text-xs text-muted-foreground mt-1">Per hospitalization</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Hospitalizations by Condition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { condition: "Endocarditis", count: 4034, color: "#ef4444" },
                        { condition: "Sepsis/Bacteremia", count: 4800, color: "#f97316" },
                        { condition: "Skin/Soft Tissue Infections", count: 8200, color: "#f59e0b" },
                        { condition: "Hepatitis C", count: 3500, color: "#eab308" },
                        { condition: "HIV/AIDS", count: 1200, color: "#84cc16" },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.condition}</span>
                            <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${(item.count / 8200) * 100}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Syringe Service Program (SSP) Prevention</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Sterile Syringes Distributed</div>
                      <div className="text-2xl font-bold text-green-600">2.5 Million</div>
                      <div className="text-xs text-muted-foreground mt-1">Annual distribution</div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Active SSP Programs</div>
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-xs text-muted-foreground mt-1">Across Michigan</div>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-1">Cost of One Syringe</p>
                      <p className="text-2xl font-bold text-green-600">9¢</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Prevents infections costing $103K+ per hospitalization
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Public Health Impact & Prevention Strategies
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium mb-2">Key Statistics:</h5>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>87% longer average length of stay for IDU-related infections</li>
                        <li>83% increase in cost per hospitalization (2016-2022)</li>
                        <li>Endocarditis: 4,034 hospitalizations, average cost $136K</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">SSP Services Provided:</h5>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Sterile syringes to reduce reuse/sharing</li>
                        <li>Opioid overdose prevention education & naloxone</li>
                        <li>Onsite wound care and safer injection instruction</li>
                        <li>Hepatitis C and HIV screening with linkage to care</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="svi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CDC/ATSDR Social Vulnerability Index (SVI)</CardTitle>
              <CardDescription>
                Community vulnerability assessment across 4 themes correlated with opioid overdose risk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SVI Scores by County</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sviData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="county" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="overallScore" fill="#8b5cf6" name="Overall SVI Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SVI Theme Breakdown - Wayne County</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { theme: "Socioeconomic", score: 82.3 },
                          { theme: "Household", score: 71.2 },
                          { theme: "Minority Status", score: 92.5 },
                          { theme: "Housing/Transport", score: 78.6 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="theme" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {sviData.map((county, idx) => (
                  <Card
                    key={idx}
                    className="border-l-4"
                    style={{ borderLeftColor: COLORS[county.category as keyof typeof COLORS] || COLORS.moderate }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{county.county} County</CardTitle>
                        <Badge
                          variant={
                            county.category === "very_high"
                              ? "destructive"
                              : county.category === "high"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {county.category.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs">Overall SVI</div>
                          <div className="text-2xl font-bold">{county.overallScore}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Socioeconomic</div>
                          <div className="text-xl font-semibold">{county.socioeconomic}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Household</div>
                          <div className="text-xl font-semibold">{county.household}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Minority Status</div>
                          <div className="text-xl font-semibold">{county.minority}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Housing/Transport</div>
                          <div className="text-xl font-semibold">{county.housing}</div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Opioid Risk Contribution Weight</span>
                          <span className="text-lg font-bold text-purple-600">{county.opioidRiskWeight}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          SVI factors contribute {county.opioidRiskWeight}% to overall opioid overdose risk model
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3">SVI Themes & Opioid Risk Factors</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-orange-500" />
                        Theme 1: Socioeconomic Status
                      </h5>
                      <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Below 150% poverty</li>
                        <li>Unemployed</li>
                        <li>Housing cost burden</li>
                        <li>No high school diploma</li>
                        <li>No health insurance</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-yellow-500" />
                        Theme 2: Household Characteristics
                      </h5>
                      <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Aged 65 & older</li>
                        <li>Aged 17 & younger</li>
                        <li>Civilian with disability</li>
                        <li>Single-parent households</li>
                        <li>English language proficiency</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-purple-500" />
                        Theme 3: Racial & Ethnic Minority Status
                      </h5>
                      <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Hispanic or Latino (of any race)</li>
                        <li>Black or African American, Not Hispanic or Latino</li>
                        <li>Asian, Not Hispanic or Latino</li>
                        <li>American Indian or Alaska Native</li>
                        <li>Native Hawaiian or Pacific Islander</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        Theme 4: Housing Type & Transportation
                      </h5>
                      <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Multi-unit structures</li>
                        <li>Mobile homes</li>
                        <li>Crowding</li>
                        <li>No vehicle</li>
                        <li>Group quarters</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="odmap" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ODMAP Real-Time Overdose Alerts</CardTitle>
                  <CardDescription>
                    Overdose Detection Mapping Application Program - Live spike and cluster detection
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Radio className="h-3 w-3 animate-pulse" />
                  {odmapAlerts.filter((a) => a.status === "active").length} Active Alerts
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Critical Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {odmapAlerts.filter((a) => a.level === "critical").length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Require immediate action</div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Warning Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {odmapAlerts.filter((a) => a.level === "warning").length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Enhanced monitoring</div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Total Overdoses (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {odmapAlerts.reduce((sum, a) => sum + a.overdoses, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {odmapAlerts.reduce((sum, a) => sum + a.fatal, 0)} fatal
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {odmapAlerts.map((alert, idx) => (
                  <Card
                    key={idx}
                    className={`border-l-4 ${alert.level === "critical" ? "border-l-red-500 bg-red-50" : "border-l-orange-500 bg-orange-50"}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={alert.level === "critical" ? "destructive" : "default"}>
                            {alert.level.toUpperCase()}
                          </Badge>
                          <span className="font-semibold">{alert.county} County</span>
                          <span className="text-sm text-muted-foreground">{alert.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.id}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Overdoses</div>
                          <div className="text-2xl font-bold">{alert.overdoses}</div>
                          <div className="text-xs text-muted-foreground">{alert.timeframe}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Fatal</div>
                          <div className="text-2xl font-bold text-red-600">{alert.fatal}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Above Baseline</div>
                          <div className="text-xl font-bold text-orange-600">+{alert.percentAboveBaseline}%</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-muted-foreground">Suspected Substance</div>
                          <div className="text-sm font-semibold">{alert.substance}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant={alert.status === "active" ? "destructive" : "outline"}
                          onClick={() => {
                            console.log("[v0] Deploying response for alert:", alert.id)
                            setSelectedAlert(alert)
                            setShowResponseModal(true)
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {alert.status === "active" ? "Deploy Response" : "Monitor"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            console.log("[v0] Opening map for ZIP:", alert.zipCode)
                            alert('Map view would show overdose clusters in ZIP code: ' + alert.zipCode)
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          View Map
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            console.log("[v0] Viewing alert details:", alert.id)
                            setSelectedAlert(alert)
                            setShowAlertDetails(true)
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Alert Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Automated Response Protocols
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium mb-2">When ODMAP Spike Detected:</h5>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Automatic alert to EMS and public health within 15 minutes</li>
                        <li>Naloxone distribution teams deployed to affected zip code</li>
                        <li>Enhanced harm reduction outreach activated</li>
                        <li>Provider alert sent via PDMP system</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Real-Time Data Integration:</h5>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>EMS CAD system integration for automated reporting</li>
                        <li>Hospital ED visit data (DOSE-SYS)</li>
                        <li>Medical examiner preliminary findings</li>
                        <li>Substance contamination alerts from toxicology labs</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MiTracking Environmental Health Tab */}
        <TabsContent value="mitracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Michigan Environmental Public Health Tracking (MiTracking)</CardTitle>
              <CardDescription>
                Correlations between environmental hazards and Substance Use Disorder (SUD) outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Lead Exposure */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      {mitrackingData.leadExposure.title}
                    </CardTitle>
                    <Badge variant="outline">{mitrackingData.leadExposure.risk}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{mitrackingData.leadExposure.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">SUD Correlation:</div>
                      <div className="text-xl font-bold text-red-600">
                        {mitrackingData.leadExposure.correlationWithSUD}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Air Quality */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Wind className="h-4 w-4 text-cyan-500" />
                      {mitrackingData.airQuality.title}
                    </CardTitle>
                    <Badge variant="outline">{mitrackingData.airQuality.risk}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{mitrackingData.airQuality.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">SUD Correlation:</div>
                      <div className="text-xl font-bold text-cyan-600">
                        {mitrackingData.airQuality.correlationWithSUD}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Water Quality */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-blue-500" />
                      {mitrackingData.waterQuality.title}
                    </CardTitle>
                    <Badge variant="outline">{mitrackingData.waterQuality.risk}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{mitrackingData.waterQuality.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">SUD Correlation:</div>
                      <div className="text-xl font-bold text-blue-600">
                        {mitrackingData.waterQuality.correlationWithSUD}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Housing Conditions */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Home className="h-4 w-4 text-orange-600" />
                      {mitrackingData.housingConditions.title}
                    </CardTitle>
                    <Badge variant="outline">{mitrackingData.housingConditions.risk}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{mitrackingData.housingConditions.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">SUD Correlation:</div>
                      <div className="text-xl font-bold text-orange-700">
                        {mitrackingData.housingConditions.correlationWithSUD}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Toxic Releases */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Flame className="h-4 w-4 text-red-700" />
                      {mitrackingData.toxicReleases.title}
                    </CardTitle>
                    <Badge variant="outline">{mitrackingData.toxicReleases.risk}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{mitrackingData.toxicReleases.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">SUD Correlation:</div>
                      <div className="text-xl font-bold text-red-700">
                        {mitrackingData.toxicReleases.correlationWithSUD}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* County-Level Environmental Data Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>County-Level Environmental Hazards & SUD Risk</CardTitle>
                  <CardDescription>
                    Comparing environmental risk factors with overall overdose risk scores by county.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Lead Exposure Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Lead Exposure Prevalence vs. County Risk</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart
                            data={countyRiskLevels
                              .map((county) => {
                                const envData = mitrackingData.leadExposure.data.find(
                                  (item) => item.county === county.county,
                                )
                                return {
                                  county: county.county,
                                  overdoseRiskScore: county.score,
                                  leadExposure: envData ? envData.prevalence : 0,
                                  leadRisk: envData ? envData.risk : "low",
                                }
                              })
                              .filter((d) => d.county !== undefined)}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="county" />
                            <YAxis
                              yAxisId="left"
                              orientation="left"
                              stroke={COLORS.critical}
                              label={{ value: "Overdose Risk Score", angle: -90, position: "insideLeft" }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              stroke={COLORS.critical}
                              label={{ value: "Lead Exposure Prevalence (%)", angle: -90, position: "right" }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar
                              yAxisId="left"
                              dataKey="overdoseRiskScore"
                              fill={COLORS.purple}
                              name="County Risk Score"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="leadExposure"
                              stroke={COLORS.critical}
                              name="Lead Exposure (%)"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Air Quality Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Air Quality vs. County Risk</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart
                            data={countyRiskLevels
                              .map((county) => {
                                const envData = mitrackingData.airQuality.data.find(
                                  (item) => item.county === county.county,
                                )
                                return {
                                  county: county.county,
                                  overdoseRiskScore: county.score,
                                  avgAqi: envData ? envData.avgAqi : 0,
                                  aqiRisk: envData ? envData.risk : "low",
                                }
                              })
                              .filter((d) => d.county !== undefined)}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="county" />
                            <YAxis
                              yAxisId="left"
                              orientation="left"
                              stroke={COLORS.purple}
                              label={{ value: "Overdose Risk Score", angle: -90, position: "insideLeft" }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              stroke={COLORS.air}
                              label={{ value: "Average AQI (PM2.5)", angle: -90, position: "right" }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar
                              yAxisId="left"
                              dataKey="overdoseRiskScore"
                              fill={COLORS.purple}
                              name="County Risk Score"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="avgAqi"
                              stroke={COLORS.air}
                              name="Average AQI"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Patient-Level Environmental Exposure Assessment Integration */}
              <Card>
                <CardHeader>
                  <CardTitle>Integrated Patient Exposure Assessment</CardTitle>
                  <CardDescription>
                    Review patient-level environmental exposures during clinical encounters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">Environmental Factors as Contributors</h3>
                        <p className="text-sm text-blue-700">
                          Clinicians can view a patient's reported or estimated environmental exposures (e.g., lead
                          levels in home, proximity to industrial sites) alongside their SUD risk. This data can inform
                          treatment plans and referrals.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    <Users className="h-4 w-4 mr-2" />
                    Access Patient Environmental Profiles
                  </Button>
                </CardContent>
              </Card>

              {/* State Oversight Dashboard for Environmental Factors */}
              <Card>
                <CardHeader>
                  <CardTitle>State Oversight: Environmental Impact on Clinics</CardTitle>
                  <CardDescription>
                    Track how environmental factors influence clinic populations and resource allocation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 mb-1">Targeted Resource Deployment</h3>
                        <p className="text-sm text-green-700">
                          Utilize environmental data to identify areas with high concentrations of vulnerable
                          populations affected by environmental hazards. This informs decisions on where to deploy
                          additional SUD prevention resources, mobile clinics, and community health workers.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Download Environmental Impact Report
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ... existing tabs (overview, predictions, geographic, reporting, patient-risk) ... */}
      </Tabs>

      {/* Alert Details Modal */}
      {showAlertDetails && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAlertDetails(false)}>
          <Card className="w-full max-w-2xl m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>ODMAP Alert Details - {selectedAlert.id}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAlertDetails(false)}>✕</Button>
              </div>
              <CardDescription>Comprehensive overdose spike information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <p className="text-sm"><strong>County:</strong> {selectedAlert.county}</p>
                  <p className="text-sm"><strong>City:</strong> {selectedAlert.city}</p>
                  <p className="text-sm"><strong>ZIP Code:</strong> {selectedAlert.zipCode}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Statistics</h4>
                  <p className="text-sm"><strong>Total Overdoses:</strong> {selectedAlert.overdoses}</p>
                  <p className="text-sm"><strong>Fatal:</strong> {selectedAlert.fatal}</p>
                  <p className="text-sm"><strong>Above Baseline:</strong> +{selectedAlert.percentAboveBaseline}%</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Substance Information</h4>
                <p className="text-sm">{selectedAlert.substance}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Response Status</h4>
                <p className="text-sm"><strong>Naloxone Deployed:</strong> {selectedAlert.naloxoneDeployed} doses</p>
                <p className="text-sm"><strong>Alert Status:</strong> {selectedAlert.status}</p>
                <p className="text-sm"><strong>Timestamp:</strong> {selectedAlert.timestamp}</p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Automated Actions Taken</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>EMS units notified in {selectedAlert.zipCode} area</li>
                  <li>Public health alert issued to providers via PDMP</li>
                  <li>Harm reduction outreach team dispatched</li>
                  <li>Naloxone distribution increased at local pharmacies</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deploy Response Modal */}
      {showResponseModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowResponseModal(false)}>
          <Card className="w-full max-w-2xl m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Deploy Emergency Response - {selectedAlert.id}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowResponseModal(false)}>✕</Button>
              </div>
              <CardDescription>{selectedAlert.county} County - {selectedAlert.city}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!responseDeployed ? (
                <>
                  <div className="border-l-4 border-l-red-500 bg-red-50 p-4">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Critical Overdose Spike Detected
                    </h4>
                    <p className="text-sm text-red-800">
                      {selectedAlert.overdoses} overdoses in {selectedAlert.timeframe} ({selectedAlert.percentAboveBaseline}% above baseline)
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Response Actions to Deploy:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Alert all EMS units in {selectedAlert.zipCode}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Deploy mobile naloxone distribution team</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Issue provider alert via PDMP system</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Activate harm reduction outreach workers</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Increase naloxone stock at local pharmacies</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Notify {selectedAlert.county} County Health Department</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => {
                        console.log("[v0] Emergency response deployed for alert:", selectedAlert.id)
                        setResponseDeployed(true)
                      }}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Confirm Deploy Response
                    </Button>
                    <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-900 mb-2">Response Deployed Successfully</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    All emergency response actions have been activated for {selectedAlert.county} County
                  </p>
                  <Button onClick={() => {
                    setShowResponseModal(false)
                    setResponseDeployed(false)
                  }}>
                    Close
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
