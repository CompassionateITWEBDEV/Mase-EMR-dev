"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  Pill,
  Printer,
  User,
  Search,
  X,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Syringe,
  Shield,
  Brain,
  CreditCard,
  StopCircle,
  AlertCircle,
  Droplets,
  Zap,
  Eye,
  Heart,
  Home,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Activity,
  Scale,
  Plus,
  Edit,
  Ban,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PatientMedicationDialog,
  DiscontinueMedicationDialog,
} from "@/components/patient-medication-dialog";
import { ASAMAssessmentDetailsDialog } from "@/components/asam-assessment-details-dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  client_number?: string;
  program_type?: string;
  updated_at?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider?: string;
  insurance_id?: string;
}

interface VitalSign {
  id: string;
  measurement_date: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  temperature: number;
  oxygen_saturation: number;
  weight: number;
  bmi: number;
}

interface Medication {
  id: string;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  route?: string;
  start_date: string;
  end_date?: string;
  medication_type?: string;
  status: string;
  notes?: string;
  discontinuation_reason?: string;
}

interface Assessment {
  id: string;
  assessment_type: string;
  created_at: string;
  provider_id: string;
  risk_assessment?: {
    asam_dimensions?: {
      dimension1: number | null;
      dimension2: number | null;
      dimension3: number | null;
      dimension4: string | null;
      dimension5: number | null;
      dimension6: number | null;
    };
    recommended_level?: string;
    suggested_level?: string | null;
    suggestion_overridden?: boolean;
  } | null;
  chief_complaint?: string | null;
  updated_at?: string | null;
}

interface DosingHold {
  id: string;
  patient_id: string;
  hold_type: "counselor" | "nurse" | "doctor" | "compliance";
  reason: string;
  created_by: string;
  created_by_role?: string;
  created_at: string;
  requires_clearance_from: string[];
  cleared_by: string[];
  status: "active" | "cleared" | "expired" | "cancelled";
  notes?: string;
  severity: "low" | "medium" | "high" | "critical";
  cleared_at?: string;
  expires_at?: string;
}

interface PatientPrecaution {
  id: string;
  patient_id: string;
  precaution_type: string;
  custom_text?: string;
  icon?: string;
  color?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  show_on_chart: boolean;
  priority?: number;
}

interface FacilityAlert {
  id: string;
  alert_type: string;
  message: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  priority: "low" | "medium" | "high" | "critical";
  affected_areas: string[];
  expires_at?: string;
}

export default function PatientChartPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "otp" | "mat" | "primary">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"name" | "client" | "recent">("name");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);
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
  
  // Medication dialog states
  const [showMedDialog, setShowMedDialog] = useState(false);
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [medDialogMode, setMedDialogMode] = useState<"add" | "edit">("add");

  // ASAM assessment dialog states
  const [showASAMDialog, setShowASAMDialog] = useState(false);
  const [selectedASAMAssessment, setSelectedASAMAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    let filtered = [...patients];

    if (searchQuery) {
      filtered = filtered.filter((p) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const clientNumber = p.client_number?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return (
          fullName.includes(query) ||
          clientNumber.includes(query) ||
          p.id.includes(query)
        );
      });
    }

    if (filterBy !== "all") {
      filtered = filtered.filter((p) => p.program_type === filterBy);
    }

    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`
        );
      } else if (sortBy === "client") {
        return (a.client_number || "").localeCompare(b.client_number || "");
      } else if (sortBy === "recent") {
        return (
          new Date(b.updated_at || 0).getTime() -
          new Date(a.updated_at || 0).getTime()
        );
      }
      return 0;
    });

    setFilteredPatients(filtered);
  }, [patients, searchQuery, filterBy, sortBy]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  const fetchPatients = async () => {
    try {
      const supabase = createClient();
      
      // Get session token for authentication
      let sessionToken: string | null = null;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          sessionToken = session.access_token;
        }
      } catch (authError) {
        console.log("[v0] Auth check failed, proceeding without token");
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Include authorization header if we have a session token
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      const res = await fetch("/api/patients", {
        credentials: "include",
        headers,
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch patients: ${res.status}`);
      }
      const data = await res.json();
      const patientsList = data.patients || [];
      console.log(
        "[v0] Fetched patients for chart lookup:",
        patientsList.length
      );
      setPatients(patientsList);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patient list");
      setPatients([]);
    }
  };

  const fetchClinicalAlerts = async (patientId: string) => {
    try {
      const supabase = createClient();
      
      // Get session token for authentication
      let sessionToken: string | null = null;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          sessionToken = session.access_token;
        }
      } catch (authError) {
        console.log("[v0] Auth check failed, proceeding without token");
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Include authorization header if we have a session token
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      // Fetch dosing holds, precautions, and facility alerts in parallel
      const [holdsRes, precautionsRes, facilityRes] = await Promise.all([
        fetch("/api/clinical-alerts/holds", {
          credentials: "include",
          headers,
        }),
        fetch("/api/clinical-alerts/precautions", {
          credentials: "include",
          headers,
        }),
        fetch("/api/clinical-alerts/facility", {
          credentials: "include",
          headers,
        }),
      ]);

      // Process dosing holds - filter by patient_id and active status
      if (holdsRes.ok) {
        const holdsData = await holdsRes.json();
        console.log("[Patient Chart] All holds from API:", holdsData.holds?.length || 0);
        
        const patientHolds = (holdsData.holds || []).filter((hold: DosingHold) => {
          // Normalize both IDs to strings for comparison
          const holdPatientId = String(hold.patient_id || "").trim();
          const targetPatientId = String(patientId || "").trim();
          return holdPatientId === targetPatientId && hold.status === "active";
        });
        
        console.log("[Patient Chart] Filtered holds for patient:", patientHolds.length);
        setDosingHolds(patientHolds);
      } else {
        console.error("[Patient Chart] Failed to fetch holds:", holdsRes.status, holdsRes.statusText);
        setDosingHolds([]);
      }

      // Process patient precautions - filter by patient_id and active status
      if (precautionsRes.ok) {
        const precautionsData = await precautionsRes.json();
        console.log("[Patient Chart] All precautions from API:", precautionsData.precautions?.length || 0);
        console.log("[Patient Chart] Filtering for patientId:", patientId);
        
        const patientPrecautionsList = (
          precautionsData.precautions || []
        ).filter((precaution: PatientPrecaution) => {
          // Normalize both IDs to strings for comparison
          const precautionPatientId = String(precaution.patient_id || "").trim();
          const targetPatientId = String(patientId || "").trim();
          const matches = precautionPatientId === targetPatientId && precaution.is_active;
          
          if (precautionPatientId && targetPatientId) {
            console.log("[Patient Chart] Comparing:", {
              precautionPatientId,
              targetPatientId,
              matches,
              is_active: precaution.is_active,
            });
          }
          
          return matches;
        });
        
        console.log("[Patient Chart] Filtered precautions for patient:", patientPrecautionsList.length);
        setPatientPrecautions(patientPrecautionsList);
      } else {
        console.error("[Patient Chart] Failed to fetch precautions:", precautionsRes.status, precautionsRes.statusText);
        setPatientPrecautions([]);
      }

      // Process facility alerts - all active facility alerts (facility-wide)
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

  const fetchPatientData = async (patientId: string) => {
    console.log("[v0] fetchPatientData called with patientId:", patientId);
    setLoading(true);

    try {
      const supabase = createClient();
      
      // Get session token for authentication
      let sessionToken: string | null = null;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          sessionToken = session.access_token;
        }
      } catch (authError) {
        console.log("[v0] Auth check failed, proceeding without token");
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Include authorization header if we have a session token
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      // Use API endpoint to bypass RLS policies
      const response = await fetch(`/api/patients/${patientId}`, {
        credentials: "include",
        headers,
      });

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
        patient_number: data.patient?.patient_number,
        vitals: data.vitalSigns?.length || 0,
        medications: data.medications?.length || 0,
        assessments: data.assessments?.length || 0,
        encounters: data.encounters?.length || 0,
        dosingLog: data.dosingLog?.length || 0,
        consents: data.consents?.length || 0,
      });
      console.log(
        "[v0] Full patient object keys:",
        Object.keys(data.patient || {})
      );

      // Set patient data
      // Handle both client_number and patient_number for compatibility
      const patientData = {
        ...data.patient,
        client_number:
          data.patient?.client_number || data.patient?.patient_number || null,
      };
      console.log(
        "[v0] Setting patient with client_number:",
        patientData.client_number
      );
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

      // Fetch clinical alerts for this patient
      await fetchClinicalAlerts(patientId);

      // Check for critical vitals
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
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load patient chart data"
      );
      setSelectedPatient(null);
      setVitalSigns([]);
      setMedications([]);
      setAssessments([]);
      setEncounters([]);
      setDosingLog([]);
      setConsents([]);
      setAlerts([]);
      setDosingHolds([]);
      setPatientPrecautions([]);
      setFacilityAlerts([]);
      setNursingAssessments([]);
      setUdsResults([]);
      setProgressNotes([]);
      setCourtOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Medication management handlers
  const handleAddMedication = () => {
    setSelectedMedication(null);
    setMedDialogMode("add");
    setShowMedDialog(true);
  };

  const handleEditMedication = (med: Medication) => {
    setSelectedMedication(med);
    setMedDialogMode("edit");
    setShowMedDialog(true);
  };

  const handleDiscontinueMedication = (med: Medication) => {
    setSelectedMedication(med);
    setShowDiscontinueDialog(true);
  };

  const refreshMedications = async () => {
    if (!selectedPatientId) return;
    try {
      const response = await fetch(
        `/api/patients/${selectedPatientId}/medications?status=active`
      );
      if (response.ok) {
        const data = await response.json();
        setMedications(data.medications || []);
      }
    } catch (error) {
      console.error("Error refreshing medications:", error);
    }
  };

  const getVitalsTrendData = () => {
    return vitalSigns
      .slice(0, 14)
      .reverse()
      .map((v) => ({
        date: new Date(v.measurement_date).toLocaleDateString(),
        systolic: v.systolic_bp,
        diastolic: v.diastolic_bp,
        heartRate: v.heart_rate,
        weight: v.weight,
      }));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 pl-64">
        <DashboardHeader />
        <main className="p-6">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patient Chart Lookup</CardTitle>
                  <CardDescription>
                    Search by name, client number, or filter by program
                  </CardDescription>
                </div>
                {selectedPatient && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPatientId("");
                      setSelectedPatient(null);
                      setSearchQuery("");
                    }}>
                    <X className="mr-2 h-4 w-4" />
                    Clear Selection
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, client number, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant={filterBy === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("all")}>
                    All
                  </Button>
                  <Button
                    variant={filterBy === "otp" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("otp")}>
                    OTP
                  </Button>
                  <Button
                    variant={filterBy === "mat" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("mat")}>
                    MAT
                  </Button>
                  <Button
                    variant={filterBy === "primary" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("primary")}>
                    Primary Care
                  </Button>
                </div>

                <div className="flex gap-2 items-center">
                  <Label className="text-sm text-muted-foreground">
                    Sort by:
                  </Label>
                  <Button
                    variant={sortBy === "name" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("name")}>
                    A-Z Name
                  </Button>
                  <Button
                    variant={sortBy === "client" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("client")}>
                    Client #
                  </Button>
                  <Button
                    variant={sortBy === "recent" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("recent")}>
                    Recent
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredPatients.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No patients found. Try adjusting your search or filters.
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatientId(patient.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-accent ${
                          selectedPatientId === patient.id
                            ? "bg-accent border-2 border-primary"
                            : "border border-transparent"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {patient.last_name}, {patient.first_name}
                              </span>
                              {patient.client_number && (
                                <Badge variant="secondary" className="text-xs">
                                  #{patient.client_number}
                                </Badge>
                              )}
                              {patient.program_type && (
                                <Badge variant="outline" className="text-xs">
                                  {patient.program_type.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              DOB: {patient.date_of_birth} • {patient.gender} •{" "}
                              {patient.phone || "No phone"}
                            </div>
                          </div>
                          {selectedPatientId === patient.id && (
                            <ChevronRight className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>

              {selectedPatient && (
                <div className="mt-4 p-4 bg-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        Selected: {selectedPatient.first_name}{" "}
                        {selectedPatient.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Client #{selectedPatient.client_number || "N/A"} • MRN:{" "}
                        {selectedPatient.id.slice(0, 8)}
                      </div>
                    </div>
                    <div className="flex gap-2">
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
                </div>
              )}
            </CardContent>
          </Card>

          {loading && selectedPatientId && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">
                  Loading patient chart data...
                </p>
              </CardContent>
            </Card>
          )}

          {selectedPatient && !loading && (
            <>
              {alerts.length > 0 && (
                <Card className="mb-6 border-red-500 bg-red-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-red-900">
                        Critical Alerts
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg mb-2">
                        <div>
                          <Badge variant="destructive">{alert.type}</Badge>
                          <p className="mt-1 text-sm text-gray-900">
                            {alert.message}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    ))}
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
                  <TabsTrigger value="clinical-notes">
                    Clinical Notes
                  </TabsTrigger>
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
                                {selectedPatient.emergency_contact_phone ||
                                  "N/A"}
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
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Current Medications</CardTitle>
                        <CardDescription>
                          {medications.length} medication{medications.length !== 1 ? 's' : ''} on file
                        </CardDescription>
                      </div>
                      <Button size="sm" onClick={handleAddMedication}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medication
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {medications.length > 0 ? (
                        <div className="space-y-3">
                          {medications.map((med) => {
                            // Format the start date properly
                            const formatDate = (dateStr: string | undefined) => {
                              if (!dateStr) return 'N/A';
                              try {
                                const date = new Date(dateStr);
                                if (isNaN(date.getTime())) return dateStr;
                                return date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                });
                              } catch {
                                return dateStr;
                              }
                            };

                            return (
                              <div
                                key={med.id}
                                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="relative mt-0.5">
                                    <Pill className="h-5 w-5 text-blue-600" />
                                    {med.medication_type === "controlled" && (
                                      <Shield className="h-3 w-3 text-red-500 absolute -top-1 -right-1" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium">
                                        {med.medication_name || 'Unknown Medication'}
                                      </p>
                                      {med.generic_name && (
                                        <span className="text-sm text-muted-foreground">
                                          ({med.generic_name})
                                        </span>
                                      )}
                                      {med.medication_type === "controlled" && (
                                        <Badge variant="destructive" className="text-xs">
                                          Controlled
                                        </Badge>
                                      )}
                                      {med.medication_type === "prn" && (
                                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                                          PRN
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="mt-1 text-sm text-gray-600 space-y-1">
                                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        {med.dosage && (
                                          <span>
                                            <span className="font-medium">Dose:</span> {med.dosage}
                                          </span>
                                        )}
                                        {med.frequency && (
                                          <span>
                                            <span className="font-medium">Freq:</span> {med.frequency}
                                          </span>
                                        )}
                                        {med.route && (
                                          <span>
                                            <span className="font-medium">Route:</span> {med.route}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span>Started: {formatDate(med.start_date)}</span>
                                        {med.end_date && (
                                          <span>End: {formatDate(med.end_date)}</span>
                                        )}
                                      </div>
                                      {med.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                          {med.notes}
                                        </p>
                                      )}
                                      {med.discontinuation_reason && (
                                        <p className="text-xs text-red-600 mt-1">
                                          <span className="font-medium">Discontinued:</span> {med.discontinuation_reason}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Badge
                                    variant={
                                      med.status === "active"
                                        ? "default"
                                        : med.status === "discontinued"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="capitalize">
                                    {med.status || 'unknown'}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditMedication(med)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      {med.status === "active" && (
                                        <DropdownMenuItem 
                                          onClick={() => handleDiscontinueMedication(med)}
                                          className="text-destructive">
                                          <Ban className="h-4 w-4 mr-2" />
                                          Discontinue
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-gray-500 mb-4">No medications recorded for this patient</p>
                          <Button variant="outline" size="sm" onClick={handleAddMedication}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Medication
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="asam" className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          ASAM Criteria Assessment
                        </CardTitle>
                        <CardDescription>
                          American Society of Addiction Medicine placement criteria
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedPatient) {
                            window.location.href = `/counseling-intake?patientId=${selectedPatient.id}`;
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Assessment
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const asamAssessments = assessments.filter((a) =>
                          a.assessment_type?.toLowerCase().includes("asam")
                        );
                        
                        if (asamAssessments.length > 0) {
                          return (
                            <div className="space-y-3">
                              {asamAssessments.map((assessment) => {
                                const riskAssessment = assessment.risk_assessment;
                                const recommendedLevel = riskAssessment?.recommended_level;
                                
                                return (
                                  <div
                                    key={assessment.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Brain className="h-5 w-5 text-purple-600" />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium">
                                            {assessment.assessment_type}
                                          </p>
                                          {recommendedLevel && (
                                            <Badge
                                              variant={
                                                parseFloat(recommendedLevel) >= 3.7
                                                  ? "destructive"
                                                  : parseFloat(recommendedLevel) >= 2.5
                                                  ? "default"
                                                  : "secondary"
                                              }
                                            >
                                              Level {recommendedLevel}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(assessment.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedASAMAssessment(assessment);
                                        setShowASAMDialog(true);
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        
                        return (
                          <div className="text-center py-8">
                            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-gray-500 mb-4">No ASAM assessments recorded</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (selectedPatient) {
                                  window.location.href = `/counseling-intake?patientId=${selectedPatient.id}`;
                                }
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Assessment
                            </Button>
                          </div>
                        );
                      })()}
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
                          {patientPrecautions.map((precaution) => {
                            // Get icon component based on icon name
                            const getIcon = () => {
                              const iconName =
                                precaution.icon || "AlertTriangle";
                              const iconMap: Record<string, any> = {
                                Droplets: Droplets,
                                Zap: Zap,
                                UserCheck: User,
                                AlertTriangle: AlertTriangle,
                                Home: Home,
                                Phone: Phone,
                                Eye: Eye,
                                Brain: Brain,
                                Heart: Heart,
                                FileText: FileCheck,
                              };
                              const IconComponent =
                                iconMap[iconName] || AlertTriangle;
                              return (
                                <IconComponent
                                  className="h-5 w-5"
                                  style={{
                                    color: precaution.color || "#ef4444",
                                  }}
                                />
                              );
                            };

                            return (
                              <div
                                key={precaution.id}
                                className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                <div className="flex items-start gap-3 flex-1">
                                  {getIcon()}
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
                                        {precaution.is_active
                                          ? "Active"
                                          : "Inactive"}
                                      </Badge>
                                    </div>
                                    {precaution.custom_text && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {precaution.custom_text}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span>
                                        Created:{" "}
                                        {new Date(
                                          precaution.created_at
                                        ).toLocaleDateString()}
                                      </span>
                                      <span>By: {precaution.created_by}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No active precautions recorded for this patient</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pre-alert" className="space-y-4">
                  <div className="space-y-4">
                    {/* Dosing Holds Section */}
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
                            {dosingHolds.map((hold) => {
                              const getSeverityColor = () => {
                                switch (hold.severity) {
                                  case "critical":
                                    return "destructive";
                                  case "high":
                                    return "destructive";
                                  case "medium":
                                    return "default";
                                  case "low":
                                    return "secondary";
                                  default:
                                    return "secondary";
                                }
                              };

                              return (
                                <div
                                  key={hold.id}
                                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <StopCircle className="h-5 w-5 text-orange-600" />
                                      <p className="font-medium capitalize">
                                        {hold.hold_type} Hold
                                      </p>
                                      <Badge variant={getSeverityColor()}>
                                        {hold.severity}
                                      </Badge>
                                    </div>
                                    <Badge
                                      variant={
                                        hold.status === "active"
                                          ? "default"
                                          : "secondary"
                                      }>
                                      {hold.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">
                                    <span className="font-medium">Reason:</span>{" "}
                                    {hold.reason}
                                  </p>
                                  {hold.requires_clearance_from &&
                                    hold.requires_clearance_from.length > 0 && (
                                      <div className="mb-2">
                                        <p className="text-xs font-medium text-gray-600 mb-1">
                                          Requires Clearance From:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {hold.requires_clearance_from.map(
                                            (role, idx) => (
                                              <Badge
                                                key={idx}
                                                variant="outline"
                                                className="text-xs">
                                                {role}
                                              </Badge>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  {hold.notes && (
                                    <p className="text-sm text-gray-600 mt-2 italic">
                                      Note: {hold.notes}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                    <span>
                                      Created:{" "}
                                      {new Date(
                                        hold.created_at
                                      ).toLocaleDateString()}
                                    </span>
                                    <span>By: {hold.created_by}</span>
                                    {hold.expires_at && (
                                      <span>
                                        Expires:{" "}
                                        {new Date(
                                          hold.expires_at
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <StopCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No active dosing holds for this patient</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Facility Alerts Section */}
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
                            {facilityAlerts.map((alert) => {
                              const getPriorityColor = () => {
                                switch (alert.priority) {
                                  case "critical":
                                    return "destructive";
                                  case "high":
                                    return "destructive";
                                  case "medium":
                                    return "default";
                                  case "low":
                                    return "secondary";
                                  default:
                                    return "secondary";
                                }
                              };

                              return (
                                <div
                                  key={alert.id}
                                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                                      <p className="font-medium">
                                        {alert.alert_type}
                                      </p>
                                      <Badge variant={getPriorityColor()}>
                                        {alert.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">
                                    {alert.message}
                                  </p>
                                  {alert.affected_areas &&
                                    alert.affected_areas.length > 0 && (
                                      <div className="mb-2">
                                        <p className="text-xs font-medium text-gray-600 mb-1">
                                          Affected Areas:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {alert.affected_areas.map(
                                            (area, idx) => (
                                              <Badge
                                                key={idx}
                                                variant="outline"
                                                className="text-xs">
                                                {area}
                                              </Badge>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                    <span>
                                      Created:{" "}
                                      {new Date(
                                        alert.created_at
                                      ).toLocaleDateString()}
                                    </span>
                                    <span>By: {alert.created_by}</span>
                                    {alert.expires_at && (
                                      <span>
                                        Expires:{" "}
                                        {new Date(
                                          alert.expires_at
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
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
                              <Badge variant="destructive">
                                {alert.severity}
                              </Badge>
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
                      {encounters.length > 0 ? (
                        <div className="space-y-2">
                          {encounters.map((encounter) => (
                            <div
                              key={encounter.id}
                              className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Clock className="h-5 w-5 text-purple-600" />
                                  <p className="font-medium">
                                    {encounter.encounter_type ||
                                      "Clinical Note"}
                                  </p>
                                  <Badge variant="outline">
                                    {encounter.status || "Completed"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {new Date(
                                    encounter.encounter_date ||
                                      encounter.created_at
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              {encounter.chief_complaint && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">
                                    Chief Complaint:
                                  </span>{" "}
                                  {encounter.chief_complaint}
                                </p>
                              )}
                              {encounter.notes && (
                                <p className="text-sm text-gray-700 mt-2">
                                  {encounter.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          No clinical notes recorded
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="consents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Patient Consents & Authorizations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {consents.length > 0 ? (
                        <div className="space-y-2">
                          {consents.map((consent) => (
                            <div
                              key={consent.id}
                              className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-indigo-600" />
                                <div>
                                  <p className="font-medium">
                                    {consent.consent_type}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Signed: {consent.signed_date || "Pending"}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  consent.consent_status === "active"
                                    ? "default"
                                    : "secondary"
                                }>
                                {consent.consent_status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          No consent forms recorded
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Patient Documents</CardTitle>
                      <CardDescription>
                        Uploaded documents and files
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-gray-500">
                        <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No documents uploaded</p>
                        <Button className="mt-4" variant="outline">
                          <FileCheck className="mr-2 h-4 w-4" />
                          Upload Document
                        </Button>
                      </div>
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
                      <div className="space-y-4">
                        {dosingLog.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Dosing History</h4>
                            <div className="space-y-2">
                              {dosingLog.slice(0, 10).map((dose) => (
                                <div
                                  key={dose.id}
                                  className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Syringe className="h-4 w-4 text-orange-600" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {dose.medication} - {dose.dose_amount}mg
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {dose.dose_date} at {dose.dose_time}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {vitalSigns.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">
                              Vital Signs History
                            </h4>
                            <div className="space-y-2">
                              {vitalSigns.slice(0, 10).map((vital) => (
                                <div
                                  key={vital.id}
                                  className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="text-sm">
                                    <p className="font-medium">
                                      BP: {vital.systolic_bp}/
                                      {vital.diastolic_bp} • HR:{" "}
                                      {vital.heart_rate} • Temp:{" "}
                                      {vital.temperature}°F
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {new Date(
                                        vital.measurement_date
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {assessments.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">
                              Assessment History
                            </h4>
                            <div className="space-y-2">
                              {assessments.map((assessment) => (
                                <div
                                  key={assessment.id}
                                  className="flex items-center justify-between p-3 border rounded-lg">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {assessment.assessment_type}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {new Date(
                                        assessment.created_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {dosingLog.length === 0 &&
                          vitalSigns.length === 0 &&
                          assessments.length === 0 && (
                            <p className="text-center text-gray-500 py-8">
                              No history records available
                            </p>
                          )}
                      </div>
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
                                    {(assessment as any).severity_level && (
                                      <Badge variant="outline">
                                        {(assessment as any).severity_level}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                    {(assessment as any).assessment_date && (
                                      <div>
                                        <span className="font-medium">Date: </span>
                                        {new Date((assessment as any).assessment_date).toLocaleDateString()}
                                      </div>
                                    )}
                                    {(assessment as any).total_score !== null && (assessment as any).total_score !== undefined && (
                                      <div>
                                        <span className="font-medium">Score: </span>
                                        {(assessment as any).total_score}
                                      </div>
                                    )}
                                    {(assessment as any).performed_by && (
                                      <div>
                                        <span className="font-medium">Performed by: </span>
                                        {(assessment as any).performed_by}
                                      </div>
                                    )}
                                  </div>
                                  {(assessment as any).notes && (
                                    <p className="text-sm text-gray-700 mt-2">
                                      <span className="font-medium">Notes: </span>
                                      {(assessment as any).notes}
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
                                      {vital.bmi && (
                                        <div>
                                          <span className="font-medium text-gray-600">BMI: </span>
                                          {vital.bmi}
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
            </>
          )}

          {!selectedPatient && !loading && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>
                  Select a patient above to view their complete medical chart
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Medication Dialogs */}
      {selectedPatient && (
        <>
          <PatientMedicationDialog
            open={showMedDialog}
            onOpenChange={setShowMedDialog}
            patientId={selectedPatient.id}
            medication={selectedMedication}
            onSuccess={refreshMedications}
            mode={medDialogMode}
          />
          <DiscontinueMedicationDialog
            open={showDiscontinueDialog}
            onOpenChange={setShowDiscontinueDialog}
            patientId={selectedPatient.id}
            medication={selectedMedication}
            onSuccess={refreshMedications}
          />
        </>
      )}

      {/* ASAM Assessment Details Dialog */}
      <ASAMAssessmentDetailsDialog
        open={showASAMDialog}
        onOpenChange={setShowASAMDialog}
        assessment={selectedASAMAssessment}
      />
    </div>
  );
}
