"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Activity,
  Brain,
  Pill,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VitalSign {
  id: string;
  measurement_date: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  respiratory_rate: number;
  temperature: number;
  oxygen_saturation: number;
  weight: number;
  bmi: number;
  pain_scale: number;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  vital_signs?: VitalSign[];
  medications?: any[];
  uds_results?: any[];
  diagnoses?: string[];
  latest_vitals?: VitalSign;
}

interface ClinicalRecommendation {
  category: string;
  priority: "critical" | "warning" | "info";
  title: string;
  recommendation: string;
  reasoning: string;
  evidence?: string;
}

export default function BehavioralHealthDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<
    ClinicalRecommendation[]
  >([]);
  const [clinicalQuery, setClinicalQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData(selectedPatient);
    }
  }, [selectedPatient]);

  async function fetchPatients() {
    const supabase = createClient();
    const { data } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .limit(50);

    if (data) {
      setPatients(data);
    }
  }

  async function fetchPatientData(patientId: string) {
    setLoading(true);
    const supabase = createClient();

    // Fetch vital signs
    const { data: vitals } = await supabase
      .from("vital_signs")
      .select("*")
      .eq("patient_id", patientId)
      .order("measurement_date", { ascending: false })
      .limit(30);

    // Fetch medications
    const { data: medications } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active");

    // Fetch UDS results
    const { data: uds } = await supabase
      .from("urine_drug_screens")
      .select("*")
      .eq("patient_id", patientId)
      .order("collection_date", { ascending: false })
      .limit(10);

    const patient = patients.find((p) => p.id === patientId);
    if (patient && vitals) {
      setPatientData({
        ...patient,
        vital_signs: vitals,
        medications: medications ?? undefined,
        uds_results: uds ?? undefined,
        latest_vitals: vitals[0],
      });
    }

    setLoading(false);
  }

  async function runAIAnalysis() {
    if (!patientData) return;

    setAiAnalyzing(true);
    try {
      const response = await fetch("/api/ai-behavioral-health-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientData.id,
          query:
            clinicalQuery || "Provide comprehensive clinical recommendations",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
        toast({
          title: "AI Analysis Complete",
          description: "Clinical recommendations generated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setAiAnalyzing(false);
    }
  }

  const isCriticalVitals = (vitals: VitalSign | undefined) => {
    if (!vitals) return false;
    return (
      vitals.systolic_bp > 180 ||
      vitals.systolic_bp < 90 ||
      vitals.diastolic_bp > 120 ||
      vitals.diastolic_bp < 60 ||
      vitals.heart_rate > 120 ||
      vitals.heart_rate < 50 ||
      vitals.oxygen_saturation < 90 ||
      vitals.temperature > 101 ||
      vitals.temperature < 96
    );
  };

  const vitalsTrendData = patientData?.vital_signs
    ?.slice(0, 14)
    .reverse()
    .map((v) => ({
      date: new Date(v.measurement_date).toLocaleDateString(),
      bp_sys: v.systolic_bp,
      bp_dia: v.diastolic_bp,
      hr: v.heart_rate,
      temp: v.temperature,
      weight: v.weight,
    }));

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Behavioral Health Dashboard</h1>
            <p className="text-muted-foreground">
              AI-powered clinical decision support and vital signs monitoring
            </p>
          </div>

          <div className="mb-6">
            <Label>Select Patient</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose a patient..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPatient && patientData && (
            <Tabs defaultValue="vitals" className="space-y-6">
              <TabsList>
                <TabsTrigger value="vitals">
                  <Activity className="mr-2 h-4 w-4" />
                  Vital Signs
                </TabsTrigger>
                <TabsTrigger value="ai-assistant">
                  <Brain className="mr-2 h-4 w-4" />
                  AI Clinical Assistant
                </TabsTrigger>
                <TabsTrigger value="medications">
                  <Pill className="mr-2 h-4 w-4" />
                  Medications
                </TabsTrigger>
                <TabsTrigger value="uds">
                  <FileText className="mr-2 h-4 w-4" />
                  UDS Results
                </TabsTrigger>
              </TabsList>

              {/* Vital Signs Tab */}
              <TabsContent value="vitals" className="space-y-6">
                {/* Critical Alerts */}
                {isCriticalVitals(patientData.latest_vitals) && (
                  <Card className="border-red-500 bg-red-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-red-700">
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        Critical Vital Signs Alert
                      </CardTitle>
                      <CardDescription>
                        Immediate attention required
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {patientData.latest_vitals?.systolic_bp &&
                          (patientData.latest_vitals.systolic_bp > 180 ||
                            patientData.latest_vitals.systolic_bp < 90) && (
                            <div className="text-red-700">
                              <div className="font-semibold">
                                Blood Pressure
                              </div>
                              <div>
                                {patientData.latest_vitals.systolic_bp}/
                                {patientData.latest_vitals.diastolic_bp}
                              </div>
                            </div>
                          )}
                        {patientData.latest_vitals?.heart_rate &&
                          (patientData.latest_vitals.heart_rate > 120 ||
                            patientData.latest_vitals.heart_rate < 50) && (
                            <div className="text-red-700">
                              <div className="font-semibold">Heart Rate</div>
                              <div>
                                {patientData.latest_vitals.heart_rate} bpm
                              </div>
                            </div>
                          )}
                        {patientData.latest_vitals?.oxygen_saturation &&
                          patientData.latest_vitals.oxygen_saturation < 90 && (
                            <div className="text-red-700">
                              <div className="font-semibold">O2 Saturation</div>
                              <div>
                                {patientData.latest_vitals.oxygen_saturation}%
                              </div>
                            </div>
                          )}
                        {patientData.latest_vitals?.temperature &&
                          (patientData.latest_vitals.temperature > 101 ||
                            patientData.latest_vitals.temperature < 96) && (
                            <div className="text-red-700">
                              <div className="font-semibold">Temperature</div>
                              <div>
                                {patientData.latest_vitals.temperature}°F
                              </div>
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Current Vitals */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Vital Signs</CardTitle>
                    <CardDescription>
                      Last recorded:{" "}
                      {patientData.latest_vitals
                        ? new Date(
                            patientData.latest_vitals.measurement_date
                          ).toLocaleString()
                        : "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Blood Pressure
                        </div>
                        <div className="text-2xl font-bold">
                          {patientData.latest_vitals?.systolic_bp || "--"}/
                          {patientData.latest_vitals?.diastolic_bp || "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          mmHg
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Heart Rate
                        </div>
                        <div className="text-2xl font-bold">
                          {patientData.latest_vitals?.heart_rate || "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">bpm</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Temperature
                        </div>
                        <div className="text-2xl font-bold">
                          {patientData.latest_vitals?.temperature || "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">°F</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          O2 Saturation
                        </div>
                        <div className="text-2xl font-bold">
                          {patientData.latest_vitals?.oxygen_saturation || "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Weight
                        </div>
                        <div className="text-2xl font-bold">
                          {patientData.latest_vitals?.weight || "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">lbs</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">BMI</div>
                        <div className="text-2xl font-bold">
                          {patientData.latest_vitals?.bmi?.toFixed(1) || "--"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Respiratory Rate
                        </div>
                        <div className="text-2xl font-bold">
                          {patientData.latest_vitals?.respiratory_rate || "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          /min
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Pain Scale
                        </div>
                        <div className="text-2xl font-bold">
                          {patientData.latest_vitals?.pain_scale || "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">/10</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vital Signs Trends */}
                {vitalsTrendData && vitalsTrendData.length > 0 && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Blood Pressure Trend (14 days)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={vitalsTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="bp_sys"
                              stroke="#ef4444"
                              name="Systolic"
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="bp_dia"
                              stroke="#3b82f6"
                              name="Diastolic"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Heart Rate & Temperature Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={vitalsTrendData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <Tooltip />
                              <Legend />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="hr"
                                stroke="#10b981"
                                name="Heart Rate"
                                strokeWidth={2}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="temp"
                                stroke="#f59e0b"
                                name="Temp (°F)"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Weight Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={vitalsTrendData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#8b5cf6"
                                name="Weight (lbs)"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* AI Clinical Assistant Tab */}
              <TabsContent value="ai-assistant" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
                      AI Clinical Decision Support
                    </CardTitle>
                    <CardDescription>
                      Powered by advanced behavioral health algorithms analyzing
                      patient history, vitals, medications, UDS results, and
                      diagnoses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Clinical Query (Optional)</Label>
                      <Textarea
                        placeholder="e.g., 'Recommend dosage adjustment for methadone' or leave blank for comprehensive analysis..."
                        value={clinicalQuery}
                        onChange={(e) => setClinicalQuery(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={runAIAnalysis}
                      disabled={aiAnalyzing}
                      className="w-full">
                      {aiAnalyzing
                        ? "Analyzing..."
                        : "Generate Clinical Recommendations"}
                    </Button>

                    {recommendations.length > 0 && (
                      <div className="space-y-4 mt-6">
                        <h3 className="font-semibold text-lg">
                          Clinical Recommendations
                        </h3>
                        {recommendations.map((rec, idx) => (
                          <Card
                            key={idx}
                            className={
                              rec.priority === "critical"
                                ? "border-red-500 bg-red-50"
                                : rec.priority === "warning"
                                ? "border-yellow-500 bg-yellow-50"
                                : "border-blue-500 bg-blue-50"
                            }>
                            <CardHeader>
                              <CardTitle className="flex items-center text-sm">
                                {rec.priority === "critical" && (
                                  <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
                                )}
                                {rec.priority === "warning" && (
                                  <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                                )}
                                <Badge
                                  variant={
                                    rec.priority === "critical"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="mr-2">
                                  {rec.priority.toUpperCase()}
                                </Badge>
                                {rec.category}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div>
                                <div className="font-semibold">{rec.title}</div>
                                <div className="text-sm mt-1">
                                  {rec.recommendation}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <strong>Reasoning:</strong> {rec.reasoning}
                              </div>
                              {rec.evidence && (
                                <div className="text-xs text-muted-foreground">
                                  <strong>Evidence:</strong> {rec.evidence}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Patient Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div>
                        <strong>Active Medications:</strong>{" "}
                        {patientData.medications?.length || 0}
                      </div>
                      <div>
                        <strong>Recent UDS Tests:</strong>{" "}
                        {patientData.uds_results?.length || 0}
                      </div>
                      <div>
                        <strong>Vital Signs Records:</strong>{" "}
                        {patientData.vital_signs?.length || 0}
                      </div>
                      <div>
                        <strong>Latest BP:</strong>{" "}
                        {patientData.latest_vitals?.systolic_bp || "--"}/
                        {patientData.latest_vitals?.diastolic_bp || "--"} mmHg
                      </div>
                      <div>
                        <strong>Latest HR:</strong>{" "}
                        {patientData.latest_vitals?.heart_rate || "--"} bpm
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">AI Capabilities</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div>✓ Medication dosage optimization</div>
                      <div>✓ Vital signs trend analysis</div>
                      <div>✓ Drug interaction screening</div>
                      <div>✓ UDS result interpretation</div>
                      <div>✓ Relapse risk assessment</div>
                      <div>✓ Evidence-based treatment recommendations</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Medications Tab */}
              <TabsContent value="medications">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Medications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patientData.medications &&
                    patientData.medications.length > 0 ? (
                      <div className="space-y-4">
                        {patientData.medications.map((med: any) => (
                          <div key={med.id} className="border-b pb-4">
                            <div className="font-semibold">
                              {med.medication_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {med.dosage} - {med.frequency}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Started:{" "}
                              {new Date(med.start_date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No active medications
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* UDS Results Tab */}
              <TabsContent value="uds">
                <Card>
                  <CardHeader>
                    <CardTitle>Urine Drug Screen Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patientData.uds_results &&
                    patientData.uds_results.length > 0 ? (
                      <div className="space-y-4">
                        {patientData.uds_results.map((uds: any) => (
                          <div key={uds.id} className="border-b pb-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-semibold">
                                  {new Date(
                                    uds.collection_date
                                  ).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Type: {uds.test_type}
                                </div>
                              </div>
                              <Badge
                                variant={
                                  uds.positive_for?.length > 0
                                    ? "destructive"
                                    : "outline"
                                }>
                                {uds.positive_for?.length > 0
                                  ? "Positive"
                                  : "Negative"}
                              </Badge>
                            </div>
                            {uds.positive_for &&
                              uds.positive_for.length > 0 && (
                                <div className="mt-2 text-sm">
                                  <strong>Positive for:</strong>{" "}
                                  {uds.positive_for.join(", ")}
                                </div>
                              )}
                            {uds.interpretation && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {uds.interpretation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No UDS results available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {!selectedPatient && (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    Select a patient to view vital signs and clinical
                    recommendations
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
