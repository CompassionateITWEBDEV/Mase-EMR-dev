"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertTriangle,
  Calendar,
  FileText,
  FileCheck,
  Phone,
  Pill,
  Brain,
  User,
  Download,
  Printer,
  Eye,
  Shield,
  StopCircle,
  AlertCircle,
  Syringe,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Activity,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  client_number?: string | null;
  program_type?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  insurance_provider?: string | null;
  insurance_id?: string | null;
  updated_at?: string | null;
}

interface VitalSign {
  id: string;
  measurement_date: string;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  heart_rate?: number | null;
  temperature?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  weight?: number | null;
  height?: number | null;
}

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
}

interface Assessment {
  id: string;
  assessment_type: string;
  assessment_date: string;
  created_at: string;
  severity_level?: string | null;
  total_score?: number | null;
  performed_by?: string | null;
  notes?: string | null;
}

interface Encounter {
  id: string;
  encounter_date: string;
  encounter_type?: string | null;
}

interface DosingHold {
  id: string;
  patient_id: string;
  hold_type: string;
  reason: string;
  status: string;
  start_date: string;
  end_date?: string | null;
}

interface PatientPrecaution {
  id: string;
  patient_id: string;
  precaution_type: string;
  description: string;
  is_active: boolean;
}

interface FacilityAlert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  expires_at?: string;
}

export default function PatientChartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [patientId, setPatientId] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [dosingLog, setDosingLog] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dosingHolds, setDosingHolds] = useState<DosingHold[]>([]);
  const [patientPrecautions, setPatientPrecautions] = useState<
    PatientPrecaution[]
  >([]);
  const [facilityAlerts, setFacilityAlerts] = useState<FacilityAlert[]>([]);
  const [nursingAssessments, setNursingAssessments] = useState<Assessment[]>([]);
  const [udsResults, setUdsResults] = useState<any[]>([]);
  const [progressNotes, setProgressNotes] = useState<any[]>([]);
  const [courtOrders, setCourtOrders] = useState<any[]>([]);

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setPatientId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (patientId) {
      fetchPatientData(patientId);
    }
  }, [patientId]);

  // Listen for refresh events (e.g., after patient update)
  useEffect(() => {
    const handleRefresh = () => {
      if (patientId) {
        fetchPatientData(patientId);
      }
    };
    
    window.addEventListener('patient-updated', handleRefresh);
    return () => {
      window.removeEventListener('patient-updated', handleRefresh);
    };
  }, [patientId]);

  const fetchPatientData = async (id: string) => {
    console.log("[v0] fetchPatientData called with patientId:", id);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch patient data: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("[v0] Patient chart data loaded:", {
        patient: data.patient?.first_name,
        client_number: data.patient?.client_number,
        program_type: data.patient?.program_type,
        vitals: data.vitalSigns?.length || 0,
        medications: data.medications?.length || 0,
        assessments: data.assessments?.length || 0,
        encounters: data.encounters?.length || 0,
        dosingLog: data.dosingLog?.length || 0,
        consents: data.consents?.length || 0,
      });
      console.log("[v0] Full patient object:", data.patient);

      const patientData = {
        ...data.patient,
        client_number:
          data.patient?.client_number || data.patient?.patient_number || null,
      };
      setSelectedPatient(patientData);
      setVitalSigns(data.vitalSigns || []);
      setMedications(data.medications || []);
      setAssessments(data.assessments || []);
      setEncounters(data.encounters || []);
      setDosingLog(data.dosingLog || []);
      setConsents(data.consents || []);
      
      // Filter nursing assessments from all assessments
      const nursingAssessments = (data.assessments || []).filter((a: Assessment) =>
        a.assessment_type?.toLowerCase().includes("nursing") ||
        a.assessment_type?.toLowerCase().includes("nurse")
      );
      setNursingAssessments(nursingAssessments);
      
      // Set new data
      setUdsResults(data.udsResults || []);
      setProgressNotes(data.progressNotes || []);
      setCourtOrders(data.courtOrders || []);

      await fetchClinicalAlerts(id);

      const criticalVitals = (data.vitalSigns || []).filter(
        (v: any) =>
          v.systolic_bp > 180 ||
          v.systolic_bp < 90 ||
          v.diastolic_bp > 120 ||
          v.diastolic_bp < 60 ||
          v.heart_rate > 120 ||
          v.heart_rate < 50 ||
          v.oxygen_saturation < 90 ||
          v.temperature > 101 ||
          v.temperature < 95
      );

      if (criticalVitals.length > 0) {
        setAlerts([
          {
            id: "critical-vitals",
            type: "Critical Vitals",
            message: `${criticalVitals.length} critical vital sign reading(s) detected`,
            severity: "critical",
          },
        ]);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load patient chart data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicalAlerts = async (patientId: string) => {
    try {
      const [holdsRes, precautionsRes, facilityRes] = await Promise.all([
        fetch("/api/clinical-alerts/holds"),
        fetch("/api/clinical-alerts/precautions"),
        fetch("/api/clinical-alerts/facility"),
      ]);

      if (holdsRes.ok) {
        const holdsData = await holdsRes.json();
        console.log("[Patient Detail] All holds from API:", holdsData.holds?.length || 0);
        
        const patientHolds = (holdsData.holds || []).filter((hold: DosingHold) => {
          // Normalize both IDs to strings for comparison
          const holdPatientId = String(hold.patient_id || "").trim();
          const targetPatientId = String(patientId || "").trim();
          return holdPatientId === targetPatientId && hold.status === "active";
        });
        
        console.log("[Patient Detail] Filtered holds for patient:", patientHolds.length);
        setDosingHolds(patientHolds);
      } else {
        console.error("[Patient Detail] Failed to fetch holds:", holdsRes.status, holdsRes.statusText);
        setDosingHolds([]);
      }

      if (precautionsRes.ok) {
        const precautionsData = await precautionsRes.json();
        console.log("[Patient Detail] All precautions from API:", precautionsData.precautions?.length || 0);
        console.log("[Patient Detail] Filtering for patientId:", patientId);
        
        const patientPrecautionsList = (precautionsData.precautions || []).filter(
          (precaution: PatientPrecaution) => {
            // Normalize both IDs to strings for comparison
            const precautionPatientId = String(precaution.patient_id || "").trim();
            const targetPatientId = String(patientId || "").trim();
            const matches = precautionPatientId === targetPatientId && precaution.is_active;
            
            if (precautionPatientId && targetPatientId) {
              console.log("[Patient Detail] Comparing:", {
                precautionPatientId,
                targetPatientId,
                matches,
                is_active: precaution.is_active,
              });
            }
            
            return matches;
          }
        );
        
        console.log("[Patient Detail] Filtered precautions for patient:", patientPrecautionsList.length);
        setPatientPrecautions(patientPrecautionsList);
      } else {
        console.error("[Patient Detail] Failed to fetch precautions:", precautionsRes.status, precautionsRes.statusText);
        setPatientPrecautions([]);
      }

      if (facilityRes.ok) {
        const facilityData = await facilityRes.json();
        setFacilityAlerts(facilityData.alerts || []);
      } else {
        setFacilityAlerts([]);
      }
    } catch (error) {
      console.error("Error fetching clinical alerts:", error);
      setDosingHolds([]);
      setPatientPrecautions([]);
      setFacilityAlerts([]);
    }
  };

  const getPatientAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <DashboardHeader />
          <main className="p-6">
            <Card>
              <CardContent className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">
                  Loading patient chart data...
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (error || !selectedPatient) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <DashboardHeader />
          <main className="p-6">
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <p className="text-lg font-medium mb-2">
                  {error || "Patient not found"}
                </p>
                <p className="text-muted-foreground mb-4">
                  {error
                    ? "Failed to load patient chart data"
                    : "The patient you're looking for doesn't exist."}
                </p>
                <Button onClick={() => router.push("/patients")}>
                  Back to Patient List
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const age = getPatientAge(selectedPatient.date_of_birth);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {selectedPatient.first_name[0]}
                  {selectedPatient.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {selectedPatient.client_number && (
                    <Badge variant="outline">
                      #{selectedPatient.client_number}
                    </Badge>
                  )}
                  {selectedPatient.program_type && (
                    <Badge variant="secondary">
                      {selectedPatient.program_type === "otp"
                        ? "OTP"
                        : selectedPatient.program_type === "mat"
                          ? "MAT"
                          : selectedPatient.program_type === "primary_care"
                            ? "Primary Care"
                            : selectedPatient.program_type.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  {age}y • {selectedPatient.gender || "N/A"} • DOB:{" "}
                  {selectedPatient.date_of_birth}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          {alerts.length > 0 && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">
                    Active Alerts
                  </span>
                  <div className="flex gap-1 ml-2">
                    {alerts.map((alert) => (
                      <Badge key={alert.id} variant="destructive" className="text-xs">
                        {alert.message}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="demographics" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 2xl:grid-cols-17 gap-1">
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
              <TabsTrigger value="medication">Medication</TabsTrigger>
              <TabsTrigger value="asam">ASAM Criteria</TabsTrigger>
              <TabsTrigger value="precaution">Precaution</TabsTrigger>
              <TabsTrigger value="pre-alert">Pre-Alert</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & Tags</TabsTrigger>
              <TabsTrigger value="clinical-notes">Clinical Notes</TabsTrigger>
              <TabsTrigger value="consents">Consents</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="dosing">Dosing</TabsTrigger>
              <TabsTrigger value="nursing">Nursing</TabsTrigger>
              <TabsTrigger value="labs-uds">Labs/UDS</TabsTrigger>
              <TabsTrigger value="medical-notes">Medical Notes</TabsTrigger>
              <TabsTrigger value="patient-vitals">Patient Vitals</TabsTrigger>
              <TabsTrigger value="court-orders">Court Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="demographics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Demographics</CardTitle>
                  <CardDescription>
                    Basic patient information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Patient Number
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedPatient.client_number ? (
                          <Badge
                            variant="secondary"
                            className="text-sm font-semibold">
                            #{selectedPatient.client_number}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        First Name
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedPatient.first_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Last Name
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedPatient.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Date of Birth
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedPatient.date_of_birth}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Gender
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedPatient.gender || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Program Type
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedPatient.program_type ? (
                          <Badge variant="outline" className="text-sm font-semibold">
                            {selectedPatient.program_type === "otp"
                              ? "OTP"
                              : selectedPatient.program_type === "mat"
                                ? "MAT"
                                : selectedPatient.program_type === "primary_care"
                                  ? "Primary Care"
                                  : selectedPatient.program_type.toUpperCase()}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Phone
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedPatient.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Email
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedPatient.email || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm text-muted-foreground">
                        Address
                      </Label>
                      <p className="font-medium mt-1">
                        {selectedPatient.address || "N/A"}
                      </p>
                    </div>
                    {selectedPatient.emergency_contact_name && (
                      <>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Emergency Contact
                          </Label>
                          <p className="font-medium mt-1">
                            {selectedPatient.emergency_contact_name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Emergency Phone
                          </Label>
                          <p className="font-medium mt-1">
                            {selectedPatient.emergency_contact_phone || "N/A"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPatient.insurance_provider ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Insurance Provider
                        </Label>
                        <p className="font-medium mt-1">
                          {selectedPatient.insurance_provider}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Insurance ID
                        </Label>
                        <p className="font-medium mt-1">
                          {selectedPatient.insurance_id || "N/A"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No insurance information recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medication" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  {medications.length > 0 ? (
                    <div className="space-y-2">
                      {medications.map((med) => (
                        <div
                          key={med.id}
                          className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Pill className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                {med.medication_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {med.dosage} - {med.frequency || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {med.start_date && (
                              <div className="text-sm text-gray-600">
                                Started: {med.start_date}
                              </div>
                            )}
                            <Badge
                              variant={
                                med.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="capitalize">
                              {med.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No medications recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="asam" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ASAM Criteria Assessment</CardTitle>
                  <CardDescription>
                    American Society of Addiction Medicine placement criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assessments.length > 0 ? (
                    <div className="space-y-2">
                      {assessments
                        .filter((a) =>
                          a.assessment_type?.toLowerCase().includes("asam")
                        )
                        .map((assessment) => (
                          <div
                            key={assessment.id}
                            className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileCheck className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">
                                  {assessment.assessment_type}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(
                                    assessment.assessment_date || assessment.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        ))}
                      {assessments.filter((a) =>
                        a.assessment_type?.toLowerCase().includes("asam")
                      ).length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                          No ASAM assessments recorded
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No ASAM assessments recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="precaution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Precautions</CardTitle>
                  <CardDescription>
                    Active precautions and safety alerts for this patient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {patientPrecautions.length > 0 ? (
                    <div className="space-y-3">
                      {patientPrecautions.map((precaution) => (
                        <div
                          key={precaution.id}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-start gap-3 flex-1">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  {precaution.precaution_type}
                                </p>
                                <Badge
                                  variant={
                                    precaution.is_active
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs">
                                  {precaution.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              {precaution.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {precaution.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No active precautions recorded for this patient</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pre-alert" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Dosing Holds</CardTitle>
                    <CardDescription>
                      Active medication dosing holds requiring clearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dosingHolds.length > 0 ? (
                      <div className="space-y-3">
                        {dosingHolds.map((hold) => (
                          <div
                            key={hold.id}
                            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                <p className="font-medium capitalize">
                                  {hold.hold_type} Hold
                                </p>
                                <Badge variant="destructive">{hold.status}</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              <span className="font-medium">Reason:</span>{" "}
                              {hold.reason}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span>
                                Started:{" "}
                                {new Date(hold.start_date).toLocaleDateString()}
                              </span>
                              {hold.end_date && (
                                <span>
                                  Ended:{" "}
                                  {new Date(hold.end_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No active dosing holds for this patient</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Facility Alerts</CardTitle>
                    <CardDescription>
                      Active facility-wide alerts and notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {facilityAlerts.length > 0 ? (
                      <div className="space-y-3">
                        {facilityAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                <p className="font-medium">{alert.alert_type}</p>
                                <Badge variant="secondary">{alert.severity}</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              {alert.message}
                            </p>
                            {alert.expires_at && (
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>
                                  Expires:{" "}
                                  {new Date(alert.expires_at).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No active facility alerts</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alerts & Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-medium text-red-900">
                                {alert.type}
                              </p>
                              <p className="text-sm text-red-700">
                                {alert.message}
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive">{alert.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No active alerts
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clinical-notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Notes</CardTitle>
                  <CardDescription>
                    Progress notes and clinical documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No clinical notes available</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Consents</CardTitle>
                </CardHeader>
                <CardContent>
                  {consents.length > 0 ? (
                    <div className="space-y-2">
                      {consents.map((consent) => (
                        <div
                          key={consent.id}
                          className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {consent.consent_type || "Consent Form"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {consent.created_at &&
                                new Date(consent.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No consents recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-500 py-8">
                    Document management coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient History</CardTitle>
                  <CardDescription>
                    Treatment timeline and significant events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-500 py-8">
                    History timeline coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dosing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dosing Log</CardTitle>
                  <CardDescription>
                    Medication dosing history and records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dosingLog.length > 0 ? (
                    <div className="space-y-3">
                      {dosingLog.map((dose) => (
                        <div
                          key={dose.id}
                          className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3 flex-1">
                            <Syringe className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{dose.medication || "N/A"}</p>
                                <Badge variant="outline">
                                  {dose.dose_amount} {dose.dose_amount ? "mg" : ""}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                                {dose.dose_date && (
                                  <div>
                                    <span className="font-medium">Date: </span>
                                    {new Date(dose.dose_date).toLocaleDateString()}
                                  </div>
                                )}
                                {dose.dose_time && (
                                  <div>
                                    <span className="font-medium">Time: </span>
                                    {dose.dose_time}
                                  </div>
                                )}
                                {dose.dispensed_by && (
                                  <div>
                                    <span className="font-medium">Dispensed by: </span>
                                    {dose.dispensed_by}
                                  </div>
                                )}
                                {dose.witnessed_by && (
                                  <div>
                                    <span className="font-medium">Witnessed by: </span>
                                    {dose.witnessed_by}
                                  </div>
                                )}
                              </div>
                              {dose.notes && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">Notes: </span>
                                  {dose.notes}
                                </p>
                              )}
                              {dose.bottle_number && (
                                <p className="text-sm text-gray-700 mt-1">
                                  <span className="font-medium">Bottle #: </span>
                                  {dose.bottle_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No dosing records found
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nursing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Nursing Assessments</CardTitle>
                  <CardDescription>
                    Nursing assessments and evaluations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {nursingAssessments.length > 0 ? (
                    <div className="space-y-3">
                      {nursingAssessments.map((assessment) => (
                        <div
                          key={assessment.id}
                          className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3 flex-1">
                            <Stethoscope className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  {assessment.assessment_type || "Nursing Assessment"}
                                </p>
                                {assessment.severity_level && (
                                  <Badge variant="outline">
                                    {assessment.severity_level}
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                {assessment.assessment_date && (
                                  <div>
                                    <span className="font-medium">Date: </span>
                                    {new Date(assessment.assessment_date).toLocaleDateString()}
                                  </div>
                                )}
                                {assessment.total_score !== null && assessment.total_score !== undefined && (
                                  <div>
                                    <span className="font-medium">Score: </span>
                                    {assessment.total_score}
                                  </div>
                                )}
                                {assessment.performed_by && (
                                  <div>
                                    <span className="font-medium">Performed by: </span>
                                    {assessment.performed_by}
                                  </div>
                                )}
                              </div>
                              {assessment.notes && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">Notes: </span>
                                  {assessment.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No nursing assessments recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="labs-uds" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Labs / Urine Drug Screens</CardTitle>
                  <CardDescription>
                    Laboratory results and drug screening tests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {udsResults.length > 0 ? (
                    <div className="space-y-3">
                      {udsResults.map((uds) => (
                        <div
                          key={uds.id}
                          className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3 flex-1">
                            <FlaskConical className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  {uds.test_type || "Urine Drug Screen"}
                                </p>
                                <Badge
                                  variant={
                                    uds.positive_for && uds.positive_for.length > 0
                                      ? "destructive"
                                      : "default"
                                  }>
                                  {uds.positive_for && uds.positive_for.length > 0
                                    ? "Positive"
                                    : "Negative"}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                {uds.collection_date && (
                                  <div>
                                    <span className="font-medium">Collection Date: </span>
                                    {new Date(uds.collection_date).toLocaleDateString()}
                                  </div>
                                )}
                                {uds.test_type && (
                                  <div>
                                    <span className="font-medium">Test Type: </span>
                                    {uds.test_type}
                                  </div>
                                )}
                                {uds.collected_by && (
                                  <div>
                                    <span className="font-medium">Collected by: </span>
                                    {uds.collected_by}
                                  </div>
                                )}
                              </div>
                              {uds.positive_for && uds.positive_for.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-red-700">
                                    Positive for: {uds.positive_for.join(", ")}
                                  </p>
                                </div>
                              )}
                              {uds.interpretation && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">Interpretation: </span>
                                  {uds.interpretation}
                                </p>
                              )}
                              {uds.notes && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">Notes: </span>
                                  {uds.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No lab results or UDS records found
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical-notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Notes</CardTitle>
                  <CardDescription>
                    Progress notes and medical documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {progressNotes.length > 0 ? (
                    <div className="space-y-3">
                      {progressNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3 flex-1">
                            <ClipboardList className="h-5 w-5 text-indigo-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  {note.note_type || "Progress Note"}
                                </p>
                                {note.note_date && (
                                  <Badge variant="outline">
                                    {new Date(note.note_date).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                              {note.full_note ? (
                                <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                                  {note.full_note}
                                </div>
                              ) : (
                                <div className="space-y-2 text-sm text-gray-700 mt-2">
                                  {note.subjective && (
                                    <div>
                                      <span className="font-medium">Subjective: </span>
                                      {note.subjective}
                                    </div>
                                  )}
                                  {note.objective && (
                                    <div>
                                      <span className="font-medium">Objective: </span>
                                      {note.objective}
                                    </div>
                                  )}
                                  {note.assessment && (
                                    <div>
                                      <span className="font-medium">Assessment: </span>
                                      {note.assessment}
                                    </div>
                                  )}
                                  {note.plan && (
                                    <div>
                                      <span className="font-medium">Plan: </span>
                                      {note.plan}
                                    </div>
                                  )}
                                </div>
                              )}
                              {note.author_id && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Author ID: {note.author_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No medical notes recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patient-vitals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Vitals</CardTitle>
                  <CardDescription>
                    Vital signs measurements and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vitalSigns.length > 0 ? (
                    <div className="space-y-3">
                      {vitalSigns.map((vital) => {
                        const isCritical =
                          (vital.systolic_bp && (vital.systolic_bp > 180 || vital.systolic_bp < 90)) ||
                          (vital.diastolic_bp && (vital.diastolic_bp > 120 || vital.diastolic_bp < 60)) ||
                          (vital.heart_rate && (vital.heart_rate > 120 || vital.heart_rate < 50)) ||
                          (vital.oxygen_saturation && vital.oxygen_saturation < 90) ||
                          (vital.temperature && (vital.temperature > 101 || vital.temperature < 95));
                        
                        return (
                          <div
                            key={vital.id}
                            className={`flex items-start justify-between p-4 border rounded-lg ${
                              isCritical ? "border-red-300 bg-red-50" : ""
                            }`}>
                            <div className="flex items-start gap-3 flex-1">
                              <Activity className={`h-5 w-5 mt-0.5 ${isCritical ? "text-red-600" : "text-blue-600"}`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium">
                                    {vital.measurement_date
                                      ? new Date(vital.measurement_date).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                  {isCritical && (
                                    <Badge variant="destructive">Critical</Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  {vital.systolic_bp && vital.diastolic_bp && (
                                    <div>
                                      <span className="font-medium text-gray-600">BP: </span>
                                      <span className={isCritical ? "font-bold text-red-700" : ""}>
                                        {vital.systolic_bp}/{vital.diastolic_bp} mmHg
                                      </span>
                                    </div>
                                  )}
                                  {vital.heart_rate && (
                                    <div>
                                      <span className="font-medium text-gray-600">HR: </span>
                                      <span className={isCritical ? "font-bold text-red-700" : ""}>
                                        {vital.heart_rate} bpm
                                      </span>
                                    </div>
                                  )}
                                  {vital.temperature && (
                                    <div>
                                      <span className="font-medium text-gray-600">Temp: </span>
                                      <span className={isCritical ? "font-bold text-red-700" : ""}>
                                        {vital.temperature}°F
                                      </span>
                                    </div>
                                  )}
                                  {vital.oxygen_saturation && (
                                    <div>
                                      <span className="font-medium text-gray-600">O2 Sat: </span>
                                      <span className={isCritical ? "font-bold text-red-700" : ""}>
                                        {vital.oxygen_saturation}%
                                      </span>
                                    </div>
                                  )}
                                  {vital.weight && (
                                    <div>
                                      <span className="font-medium text-gray-600">Weight: </span>
                                      {vital.weight} lbs
                                    </div>
                                  )}
                                  {vital.height && (
                                    <div>
                                      <span className="font-medium text-gray-600">Height: </span>
                                      {vital.height} in
                                    </div>
                                  )}
                                  {vital.respiratory_rate && (
                                    <div>
                                      <span className="font-medium text-gray-600">RR: </span>
                                      {vital.respiratory_rate} /min
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No vital signs recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="court-orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Court Orders</CardTitle>
                  <CardDescription>
                    Legal documents and court-ordered treatments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {courtOrders.length > 0 ? (
                    <div className="space-y-3">
                      {courtOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3 flex-1">
                            <Scale className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  {order.document_type || "Court Order"}
                                </p>
                                {order.status && (
                                  <Badge variant="outline">{order.status}</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                {order.document_date && (
                                  <div>
                                    <span className="font-medium">Date: </span>
                                    {new Date(order.document_date).toLocaleDateString()}
                                  </div>
                                )}
                                {order.court_name && (
                                  <div>
                                    <span className="font-medium">Court: </span>
                                    {order.court_name}
                                  </div>
                                )}
                                {order.expiration_date && (
                                  <div>
                                    <span className="font-medium">Expires: </span>
                                    {new Date(order.expiration_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              {order.order_details && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">Details: </span>
                                  {order.order_details}
                                </p>
                              )}
                              {order.description && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">Description: </span>
                                  {order.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No court orders on file
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
