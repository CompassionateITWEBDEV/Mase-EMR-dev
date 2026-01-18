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
  ChevronUp,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  FileText,
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
  Database,
  CheckCircle,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ViewDocumentDialog } from "@/components/view-document-dialog";

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

interface VitalSignUpdate {
  id: string;
  patient_id: string;
  provider_id?: string;
  appointment_id?: string;
  measurement_date: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  temperature_unit?: string;
  oxygen_saturation: number | null;
  weight: number | null;
  weight_unit?: string;
  height_feet: number | null;
  height_inches: number | null;
  bmi: number | null;
  pain_scale: number | null;
  pain_location?: string;
  notes?: string;
  created_at: string;
  appointments?: {
    id: string;
    appointment_date: string;
    visit_reason?: string;
    encounter_type?: string;
    status: string;
    providers?: {
      id: string;
      first_name: string;
      last_name: string;
      specialization?: string;
    };
  };
}

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  status: string;
}

interface Assessment {
  id: string;
  assessment_type: string;
  created_at: string;
  provider_id: string;
  patient_id: string;
  chief_complaint?: string;
  history_present_illness?: string;
  mental_status_exam?: any;
  risk_assessment?: any;
  diagnosis_codes?: string[];
  treatment_plan?: string;
}

interface ProgressNote {
  id: string;
  patient_id: string;
  provider_id: string;
  note_type: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  created_at: string;
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
  const [filterBy, setFilterBy] = useState<"all" | "otp" | "mat" | "primary" | "sub" | "beh">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"name" | "client" | "recent">("name");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [vitalSignsUpdates, setVitalSignsUpdates] = useState<VitalSignUpdate[]>([]);
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
  const [toxicologyOrders, setToxicologyOrders] = useState<any[]>([]);
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([]);
  const [courtOrders, setCourtOrders] = useState<any[]>([]);
  const [pmpData, setPmpData] = useState<any>(null);
  const [pmpLoading, setPmpLoading] = useState(false);
  const [billingClaims, setBillingClaims] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [encounterNoteAlerts, setEncounterNoteAlerts] = useState<any[]>([]);
  const [encounterAlertsLoading, setEncounterAlertsLoading] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  
  // Router for navigation to workflow pages
  const router = useRouter();

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
      filtered = filtered.filter((p) => {
        const patientProgramType = p.program_type?.toLowerCase().trim() || "otp";
        if (filterBy === "otp") {
          return patientProgramType === "otp";
        } else if (filterBy === "mat") {
          return patientProgramType === "mat";
        } else if (filterBy === "primary") {
          return patientProgramType === "primary_care" || patientProgramType === "primary care";
        } else if (filterBy === "sub") {
          return patientProgramType === "sub";
        } else if (filterBy === "beh") {
          return patientProgramType === "beh";
        }
        return false;
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`
        );
      } else if (sortBy === "client") {
        // Sort by program type first, then by client number
        const aProgramType = a.program_type?.toLowerCase().trim() || "otp";
        const bProgramType = b.program_type?.toLowerCase().trim() || "otp";
        
        const programTypeOrder: Record<string, number> = {
          otp: 1,
          mat: 2,
          primary_care: 3,
          "primary care": 3,
          sub: 4,
          beh: 5,
        };
        
        const aOrder = programTypeOrder[aProgramType] || 99;
        const bOrder = programTypeOrder[bProgramType] || 99;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
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

  const fetchPMPData = async (patientId: string) => {
    setPmpLoading(true);
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
      
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      // Fetch PMP requests for this patient
      const { data: pdmpRequests } = await supabase
        .from("pdmp_requests")
        .select("*")
        .eq("patient_id", patientId)
        .order("request_date", { ascending: false })
        .limit(10);

      if (pdmpRequests && pdmpRequests.length > 0) {
        // Get the most recent request
        const latestRequest = pdmpRequests[0];
        
        // Fetch prescriptions for the latest request
        const { data: prescriptions } = await supabase
          .from("pdmp_prescriptions")
          .select("*")
          .eq("pdmp_request_id", latestRequest.id)
          .order("fill_date", { ascending: false })
          .limit(20);

        setPmpData({
          latestRequest,
          prescriptions: prescriptions || [],
          allRequests: pdmpRequests,
        });
      } else {
        setPmpData(null);
      }
    } catch (error) {
      console.error("Error fetching PMP data:", error);
      setPmpData(null);
    } finally {
      setPmpLoading(false);
    }
  };

  const fetchBillingData = async (patientId: string) => {
    setBillingLoading(true);
    try {
      const supabase = createClient();
      
      // Fetch claims for this patient directly from database
      const { data: claims, error } = await supabase
        .from("insurance_claims")
        .select(`
          *,
          insurance_payers (payer_name)
        `)
        .eq("patient_id", patientId)
        .order("service_date", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching billing claims:", error);
        setBillingClaims([]);
      } else {
        // Transform claims to match expected format
        const formattedClaims = (claims || []).map((claim: any) => ({
          id: claim.id,
          claimNumber: claim.claim_number || `CLM-${claim.id.slice(0, 8)}`,
          patientId: claim.patient_id,
          payerName: claim.insurance_payers?.payer_name || "Unknown Payer",
          payerId: claim.payer_id,
          serviceDate: claim.service_date,
          submissionDate: claim.submission_date,
          totalCharges: Number(claim.total_charges) || 0,
          paidAmount: claim.paid_amount ? Number(claim.paid_amount) : undefined,
          status: claim.claim_status || "pending",
          claimType: claim.claim_type || "professional",
          denialReason: claim.denial_reason,
        }));
        setBillingClaims(formattedClaims);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
      setBillingClaims([]);
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchEncounterNoteAlerts = async (patientId: string) => {
    setEncounterAlertsLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/encounter-alerts`);
      if (response.ok) {
        const data = await response.json();
        setEncounterNoteAlerts(data.alerts || []);
      } else {
        // Try to get error details from response
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response isn't JSON, use statusText
        }
        
        // If it's a 500 error, it's likely the table doesn't exist - just set empty array
        if (response.status === 500) {
          console.warn("Encounter note alerts table may not exist yet. Migration 024_encounter_note_enhancements.sql may need to be run.");
          setEncounterNoteAlerts([]);
        } else {
          console.error("Error fetching encounter note alerts:", errorMessage);
          setEncounterNoteAlerts([]);
        }
      }
    } catch (error) {
      // Network errors or other exceptions - just set empty array
      console.warn("Error fetching encounter note alerts (table may not exist):", error);
      setEncounterNoteAlerts([]);
    } finally {
      setEncounterAlertsLoading(false);
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
      setVitalSignsUpdates(data.vitalSignsUpdates || []);
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
      setToxicologyOrders(data.toxicologyOrders || []);
      setProgressNotes(data.progressNotes || []);
      setCourtOrders(data.courtOrders || []);

      // Fetch clinical alerts for this patient
      await fetchClinicalAlerts(patientId);

      // Fetch PMP and billing data
      await fetchPMPData(patientId);
      await fetchBillingData(patientId);

      // Fetch encounter note alerts
      await fetchEncounterNoteAlerts(patientId);

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
      setVitalSignsUpdates([]);
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

  // Refresh patient data after adding new records
  const refreshPatientData = () => {
    if (selectedPatientId) {
      fetchPatientData(selectedPatientId);
      toast.success("Data refreshed");
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
                  <Button
                    variant={filterBy === "sub" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("sub")}>
                    SUB
                  </Button>
                  <Button
                    variant={filterBy === "beh" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("beh")}>
                    BEH
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
                                  {patient.program_type === "otp"
                                    ? "OTP"
                                    : patient.program_type === "mat"
                                      ? "MAT"
                                      : patient.program_type === "primary_care"
                                        ? "Primary Care"
                                        : patient.program_type === "sub"
                                          ? "SUB"
                                          : patient.program_type === "beh"
                                            ? "BEH"
                                            : patient.program_type.charAt(0).toUpperCase() + patient.program_type.slice(1).toLowerCase()}
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
                <TabsList className="flex w-full overflow-x-auto gap-1 pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
                  <TabsTrigger value="demographics" className="whitespace-nowrap flex-shrink-0">Demographics</TabsTrigger>
                  <TabsTrigger value="insurance" className="whitespace-nowrap flex-shrink-0">Insurance</TabsTrigger>
                  <TabsTrigger value="medication" className="whitespace-nowrap flex-shrink-0">Medication</TabsTrigger>
                  <TabsTrigger value="asam" className="whitespace-nowrap flex-shrink-0">ASAM Criteria</TabsTrigger>
                  <TabsTrigger value="precaution" className="whitespace-nowrap flex-shrink-0">Precaution</TabsTrigger>
                  <TabsTrigger value="pre-alert" className="whitespace-nowrap flex-shrink-0">Pre-Alert</TabsTrigger>
                  <TabsTrigger value="clinical-notes" className="whitespace-nowrap flex-shrink-0">Clinical Notes</TabsTrigger>
                  <TabsTrigger value="encounter-notes" className="whitespace-nowrap flex-shrink-0">
                    Encounter Notes
                    {encounterNoteAlerts.filter(a => !a.is_read).length > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                        {encounterNoteAlerts.filter(a => !a.is_read).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="consents" className="whitespace-nowrap flex-shrink-0">Consents</TabsTrigger>
                  <TabsTrigger value="documents" className="whitespace-nowrap flex-shrink-0">Documents</TabsTrigger>
                  <TabsTrigger value="history" className="whitespace-nowrap flex-shrink-0">History</TabsTrigger>
                  <TabsTrigger value="dosing" className="whitespace-nowrap flex-shrink-0">Dosing</TabsTrigger>
                  <TabsTrigger value="nursing" className="whitespace-nowrap flex-shrink-0">Nursing</TabsTrigger>
                  <TabsTrigger value="labs-uds" className="whitespace-nowrap flex-shrink-0">Labs/UDS</TabsTrigger>
                  <TabsTrigger value="medical-notes" className="whitespace-nowrap flex-shrink-0">Medical Notes</TabsTrigger>
                  <TabsTrigger value="patient-vitals" className="whitespace-nowrap flex-shrink-0">Patient Vitals</TabsTrigger>
                  <TabsTrigger value="vital-signs-updates" className="whitespace-nowrap flex-shrink-0 relative">
                    Vital Signs Update
                    {vitalSignsUpdates.length > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                        {vitalSignsUpdates.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="court-orders" className="whitespace-nowrap flex-shrink-0">Court Orders</TabsTrigger>
                  <TabsTrigger value="pmp" className="whitespace-nowrap flex-shrink-0">PMP</TabsTrigger>
                  <TabsTrigger value="eligibility" className="whitespace-nowrap flex-shrink-0">Patient Eligibility</TabsTrigger>
                  <TabsTrigger value="billing" className="whitespace-nowrap flex-shrink-0">Billing</TabsTrigger>
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
                                      : selectedPatient.program_type === "sub"
                                        ? "SUB"
                                        : selectedPatient.program_type === "beh"
                                          ? "BEH"
                                          : selectedPatient.program_type.charAt(0).toUpperCase() + selectedPatient.program_type.slice(1).toLowerCase()}
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
                                    {med.dosage} - {med.frequency}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-600">
                                  Started: {med.start_date}
                                </div>
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
                        American Society of Addiction Medicine placement
                        criteria
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
                                        assessment.created_at
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

                <TabsContent value="clinical-notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Clinical Notes</CardTitle>
                          <CardDescription>
                            Progress notes and clinical documentation
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => router.push(`/clinical-notes?patient=${selectedPatientId}`)}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Go to Clinical Notes
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {progressNotes.length > 0 ? (
                        <div className="space-y-2">
                          {progressNotes.map((note) => (
                            <div
                              key={note.id}
                              className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-purple-600" />
                                  <p className="font-medium capitalize">
                                    {note.note_type?.replace(/_/g, " ") || "Progress Note"}
                                  </p>
                                  <Badge variant="outline">
                                    {note.plan ? "Completed" : "Draft"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {new Date(
                                    note.note_date ||
                                    note.created_at
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              {note.subjective && (
                                <div className="text-sm text-gray-700 mt-2">
                                  <p className="whitespace-pre-wrap">{note.subjective}</p>
                                </div>
                              )}
                              {note.objective && (
                                <div className="text-sm text-gray-700 mt-2">
                                  <p className="font-medium">Objective:</p>
                                  <p className="whitespace-pre-wrap">{note.objective}</p>
                                </div>
                              )}
                              {note.assessment && (
                                <div className="text-sm text-gray-700 mt-2">
                                  <p className="font-medium">Assessment:</p>
                                  <p className="whitespace-pre-wrap">{note.assessment}</p>
                                </div>
                              )}
                              {note.plan && (
                                <div className="text-sm text-gray-700 mt-2">
                                  <p className="font-medium">Plan:</p>
                                  <p className="whitespace-pre-wrap">{note.plan}</p>
                                </div>
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

                <TabsContent value="encounter-notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Encounter Note Alerts</CardTitle>
                      <CardDescription>
                        Notifications when encounter notes are edited or updated
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {encounterAlertsLoading ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                          <p className="text-muted-foreground">Loading encounter note alerts...</p>
                        </div>
                      ) : encounterNoteAlerts.length > 0 ? (
                        <div className="space-y-3">
                          {encounterNoteAlerts.map((alert) => {
                            const isExpanded = expandedAlerts.has(alert.id);
                            const noteContent = alert.metadata?.note_content;
                            const hasNoteContent = noteContent && (
                              noteContent.subjective || 
                              noteContent.objective || 
                              noteContent.assessment || 
                              noteContent.plan
                            );

                            return (
                              <div
                                key={alert.id}
                                className={`p-4 border rounded-lg transition-colors ${
                                  !alert.is_read
                                    ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                    : "hover:bg-accent/50"
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-start gap-3 flex-1">
                                    <FileText className={`h-5 w-5 mt-0.5 ${!alert.is_read ? "text-blue-600" : "text-gray-400"}`} />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold">{alert.message}</p>
                                        {!alert.is_read && (
                                          <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                            New
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-1 text-sm text-muted-foreground">
                                        {alert.editor_name && (
                                          <p>
                                            <span className="font-medium">Edited by:</span> {alert.editor_name}
                                            {alert.editor_role && ` (${alert.editor_role})`}
                                          </p>
                                        )}
                                        {alert.encounter_reference && (
                                          <p>
                                            <span className="font-medium">Encounter:</span> {alert.encounter_reference}
                                          </p>
                                        )}
                                        <p>
                                          <span className="font-medium">Time:</span> {alert.relativeTime || alert.formattedTimestamp}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {alert.encounter_id && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          window.open(`/encounters?encounter=${alert.encounter_id}`, "_blank");
                                        }}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Encounter
                                      </Button>
                                    )}
                                    {!alert.is_read && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => {
                                          try {
                                            const response = await fetch(
                                              `/api/patients/${selectedPatientId}/encounter-alerts`,
                                              {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                  alertId: alert.id,
                                                  isRead: true,
                                                }),
                                              }
                                            );
                                            if (response.ok) {
                                              await fetchEncounterNoteAlerts(selectedPatientId);
                                            }
                                          } catch (error) {
                                            console.error("Error marking alert as read:", error);
                                          }
                                        }}
                                      >
                                        Mark as Read
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Note Details Section */}
                                {hasNoteContent && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-between text-left font-medium text-sm"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedAlerts);
                                        if (isExpanded) {
                                          newExpanded.delete(alert.id);
                                        } else {
                                          newExpanded.add(alert.id);
                                        }
                                        setExpandedAlerts(newExpanded);
                                      }}
                                    >
                                      <span>View Updated Note Details</span>
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                    
                                    {isExpanded && (
                                      <div className="mt-3 space-y-4 bg-white rounded-lg p-4 border border-gray-200">
                                        {noteContent.subjective && (
                                          <div>
                                            <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                                              Subjective
                                            </Label>
                                            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                                              {noteContent.subjective}
                                            </div>
                                          </div>
                                        )}
                                        {noteContent.objective && (
                                          <div>
                                            <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                                              Objective
                                            </Label>
                                            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                                              {noteContent.objective}
                                            </div>
                                          </div>
                                        )}
                                        {noteContent.assessment && (
                                          <div>
                                            <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                                              Assessment
                                            </Label>
                                            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                                              {noteContent.assessment}
                                            </div>
                                          </div>
                                        )}
                                        {noteContent.plan && (
                                          <div>
                                            <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                                              Plan
                                            </Label>
                                            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                                              {noteContent.plan}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No encounter note alerts</p>
                          <p className="text-xs mt-2">Alerts will appear here when encounter notes are edited</p>
                        </div>
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
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Clinical Documents</CardTitle>
                          <CardDescription>
                            Assessments and progress notes for this patient - Click on any document to view full details
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => router.push(`/documentation?patient=${selectedPatientId}`)}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Create New Document
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(assessments.length > 0 || progressNotes.length > 0) ? (
                        <div className="space-y-6">
                          {/* Clinical Assessments Section */}
                          {assessments.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-blue-600" />
                                Clinical Assessments ({assessments.length})
                              </h4>
                              <div className="space-y-2">
                                {assessments.slice(0, 10).map((assessment) => (
                                  <ViewDocumentDialog
                                    key={assessment.id}
                                    document={{
                                      id: assessment.id,
                                      document_type: "assessment",
                                      patient_name: selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "Unknown Patient",
                                      provider_name: "Provider",
                                      created_at: assessment.created_at,
                                      assessment_type: assessment.assessment_type,
                                      chief_complaint: assessment.chief_complaint,
                                      history_present_illness: assessment.history_present_illness,
                                      mental_status_exam: assessment.mental_status_exam,
                                      risk_assessment: assessment.risk_assessment,
                                      diagnosis_codes: assessment.diagnosis_codes,
                                      treatment_plan: assessment.treatment_plan,
                                      patient_id: assessment.patient_id,
                                      provider_id: assessment.provider_id,
                                    }}
                                  >
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                                      <div className="flex items-center gap-3">
                                        <Eye className="h-5 w-5 text-blue-500" />
                                        <div>
                                          <p className="text-sm font-medium capitalize">
                                            {assessment.assessment_type?.replace(/_/g, " ") || "Assessment"}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {new Date(assessment.created_at).toLocaleDateString("en-US", {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </p>
                                          {assessment.chief_complaint && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-1 max-w-md">
                                              {assessment.chief_complaint}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                          Assessment
                                        </Badge>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                      </div>
                                    </div>
                                  </ViewDocumentDialog>
                                ))}
                                {assessments.length > 10 && (
                                  <p className="text-sm text-gray-500 text-center pt-2">
                                    + {assessments.length - 10} more assessments
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Progress Notes Section */}
                          {progressNotes.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                Progress Notes ({progressNotes.length})
                              </h4>
                              <div className="space-y-2">
                                {progressNotes.slice(0, 10).map((note) => (
                                  <ViewDocumentDialog
                                    key={note.id}
                                    document={{
                                      id: note.id,
                                      document_type: "progress_note",
                                      patient_name: selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "Unknown Patient",
                                      provider_name: "Provider",
                                      created_at: note.created_at,
                                      note_type: note.note_type,
                                      subjective: note.subjective,
                                      objective: note.objective,
                                      assessment: note.assessment,
                                      plan: note.plan,
                                      patient_id: note.patient_id,
                                      provider_id: note.provider_id,
                                    }}
                                  >
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-green-50 cursor-pointer transition-colors">
                                      <div className="flex items-center gap-3">
                                        <Eye className="h-5 w-5 text-green-500" />
                                        <div>
                                          <p className="text-sm font-medium capitalize">
                                            {note.note_type?.replace(/_/g, " ") || "Progress Note"}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {new Date(note.created_at).toLocaleDateString("en-US", {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </p>
                                          {note.subjective && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-1 max-w-md">
                                              {note.subjective}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                          Progress Note
                                        </Badge>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                      </div>
                                    </div>
                                  </ViewDocumentDialog>
                                ))}
                                {progressNotes.length > 10 && (
                                  <p className="text-sm text-gray-500 text-center pt-2">
                                    + {progressNotes.length - 10} more progress notes
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No clinical documents found</p>
                          <p className="text-sm mt-2">
                            Click "Create New Document" to add an assessment or progress note
                          </p>
                        </div>
                      )}
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
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Labs / Urine Drug Screens</CardTitle>
                          <CardDescription>
                            Laboratory results and drug screening tests
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => router.push(`/toxicology?patient=${selectedPatientId}`)}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Order New Drug Screen
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Toxicology Orders Section */}
                      {toxicologyOrders.length > 0 && (
                        <div className="space-y-3 mb-6">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">Toxicology Lab Orders</h3>
                          {toxicologyOrders.map((order: any) => (
                            <div
                              key={order.id}
                              className="flex items-start justify-between p-4 border rounded-lg bg-gray-50">
                              <div className="flex items-start gap-3 flex-1">
                                <FlaskConical className="h-5 w-5 text-purple-600 mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium">
                                      {order.test_panel || "Drug Screen"}
                                    </p>
                                    <Badge
                                      variant={
                                        order.status === "resulted"
                                          ? order.overall_result === "Positive"
                                            ? "destructive"
                                            : "default"
                                          : "secondary"
                                      }>
                                      {order.status === "resulted"
                                        ? order.overall_result
                                        : order.status}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      #{order.order_number}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                    {order.order_date && (
                                      <div>
                                        <span className="font-medium">Order Date: </span>
                                        {new Date(order.order_date).toLocaleDateString()}
                                      </div>
                                    )}
                                    {order.collection_date && (
                                      <div>
                                        <span className="font-medium">Collection Date: </span>
                                        {new Date(order.collection_date).toLocaleDateString()}
                                      </div>
                                    )}
                                    {order.providers && (
                                      <div>
                                        <span className="font-medium">Provider: </span>
                                        Dr. {order.providers.first_name} {order.providers.last_name}
                                      </div>
                                    )}
                                    {order.collection_method && (
                                      <div>
                                        <span className="font-medium">Method: </span>
                                        {order.collection_method}
                                      </div>
                                    )}
                                    {order.toxicology_labs && (
                                      <div>
                                        <span className="font-medium">Lab: </span>
                                        {order.toxicology_labs.lab_name}
                                      </div>
                                    )}
                                  </div>
                                  {/* Show individual substance results if available */}
                                  {order.toxicology_results && order.toxicology_results.length > 0 && (
                                    <div className="mt-3 border-t pt-3">
                                      <p className="text-sm font-medium mb-2">Substance Results:</p>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {order.toxicology_results.map((result: any) => (
                                          <div
                                            key={result.id}
                                            className={`text-xs p-2 rounded ${
                                              result.result === "Positive"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-green-100 text-green-700"
                                            }`}>
                                            <span className="font-medium">{result.substance_name}:</span> {result.result}
                                            {result.concentration && ` (${result.concentration})`}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {order.notes && (
                                    <p className="text-sm text-gray-700 mt-2">
                                      <span className="font-medium">Notes: </span>
                                      {order.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/toxicology?patient=${selectedPatientId}`)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Legacy UDS Results Section */}
                      {udsResults.length > 0 && (
                        <div className="space-y-3">
                          {toxicologyOrders.length > 0 && (
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Legacy UDS Records</h3>
                          )}
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
                      )}

                      {/* Empty state when no results */}
                      {toxicologyOrders.length === 0 && udsResults.length === 0 && (
                        <div className="text-center py-8">
                          <FlaskConical className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 mb-4">
                            No lab results or drug screen records found
                          </p>
                          <Button
                            onClick={() => router.push(`/toxicology?patient=${selectedPatientId}`)}
                            variant="outline"
                          >
                            Order New Drug Screen
                          </Button>
                        </div>
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
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Patient Vitals</CardTitle>
                          <CardDescription>
                            Vital signs measurements and trends
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => router.push(`/encounters?patient=${selectedPatientId}`)}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Record in Encounters
                        </Button>
                      </div>
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

                <TabsContent value="vital-signs-updates" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        Vital Signs Updates from Encounters
                      </CardTitle>
                      <CardDescription>
                        Vital signs recorded during patient encounters - updated from Edit Progress Note
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {vitalSignsUpdates.length > 0 ? (
                        <div className="space-y-4">
                          {vitalSignsUpdates.map((vital) => {
                            const isCritical =
                              (vital.systolic_bp && (vital.systolic_bp > 180 || vital.systolic_bp < 90)) ||
                              (vital.diastolic_bp && (vital.diastolic_bp > 120 || vital.diastolic_bp < 60)) ||
                              (vital.heart_rate && (vital.heart_rate > 120 || vital.heart_rate < 50)) ||
                              (vital.oxygen_saturation && vital.oxygen_saturation < 90) ||
                              (vital.temperature && (vital.temperature > 101 || vital.temperature < 95));
                            
                            const appointmentInfo = vital.appointments;
                            const providerInfo = appointmentInfo?.providers;

                            return (
                              <div
                                key={vital.id}
                                className={`p-4 border rounded-lg ${
                                  isCritical ? "border-red-300 bg-red-50" : "border-green-200 bg-green-50"
                                }`}>
                                {/* Header with encounter info */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Activity className={`h-5 w-5 ${isCritical ? "text-red-600" : "text-green-600"}`} />
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {vital.measurement_date
                                          ? new Date(vital.measurement_date).toLocaleDateString("en-US", {
                                              weekday: "short",
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          : "N/A"}
                                      </p>
                                      {appointmentInfo && (
                                        <p className="text-sm text-gray-600">
                                          Encounter: {appointmentInfo.visit_reason || appointmentInfo.encounter_type || "Visit"}
                                          {appointmentInfo.appointment_date && (
                                            <> on {new Date(appointmentInfo.appointment_date).toLocaleDateString()}</>
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isCritical && (
                                      <Badge variant="destructive">Critical Values</Badge>
                                    )}
                                    {appointmentInfo?.status && (
                                      <Badge variant="outline" className="capitalize">
                                        {appointmentInfo.status}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Provider info */}
                                {providerInfo && (
                                  <div className="mb-3 p-2 bg-white rounded border border-gray-200">
                                    <p className="text-sm text-gray-600">
                                      <Stethoscope className="h-4 w-4 inline mr-1" />
                                      Provider: <span className="font-medium text-gray-900">
                                        Dr. {providerInfo.first_name} {providerInfo.last_name}
                                      </span>
                                      {providerInfo.specialization && (
                                        <span className="text-gray-500"> ({providerInfo.specialization})</span>
                                      )}
                                    </p>
                                  </div>
                                )}

                                {/* Vital Signs Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                  {/* Blood Pressure */}
                                  {(vital.systolic_bp || vital.diastolic_bp) && (
                                    <div className="p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-500 uppercase font-medium">Blood Pressure</p>
                                      <p className={`text-lg font-semibold ${
                                        (vital.systolic_bp && (vital.systolic_bp > 180 || vital.systolic_bp < 90)) ||
                                        (vital.diastolic_bp && (vital.diastolic_bp > 120 || vital.diastolic_bp < 60))
                                          ? "text-red-700"
                                          : "text-gray-900"
                                      }`}>
                                        {vital.systolic_bp || "--"}/{vital.diastolic_bp || "--"} <span className="text-sm font-normal">mmHg</span>
                                      </p>
                                    </div>
                                  )}

                                  {/* Heart Rate */}
                                  {vital.heart_rate && (
                                    <div className="p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-500 uppercase font-medium">Heart Rate</p>
                                      <p className={`text-lg font-semibold ${
                                        vital.heart_rate > 120 || vital.heart_rate < 50
                                          ? "text-red-700"
                                          : "text-gray-900"
                                      }`}>
                                        {vital.heart_rate} <span className="text-sm font-normal">bpm</span>
                                      </p>
                                    </div>
                                  )}

                                  {/* Respiratory Rate */}
                                  {vital.respiratory_rate && (
                                    <div className="p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-500 uppercase font-medium">Respiratory Rate</p>
                                      <p className="text-lg font-semibold text-gray-900">
                                        {vital.respiratory_rate} <span className="text-sm font-normal">/min</span>
                                      </p>
                                    </div>
                                  )}

                                  {/* Temperature */}
                                  {vital.temperature && (
                                    <div className="p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-500 uppercase font-medium">Temperature</p>
                                      <p className={`text-lg font-semibold ${
                                        vital.temperature > 101 || vital.temperature < 95
                                          ? "text-red-700"
                                          : "text-gray-900"
                                      }`}>
                                        {vital.temperature}°<span className="text-sm font-normal">{vital.temperature_unit || "F"}</span>
                                      </p>
                                    </div>
                                  )}

                                  {/* Oxygen Saturation */}
                                  {vital.oxygen_saturation && (
                                    <div className="p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-500 uppercase font-medium">O2 Saturation</p>
                                      <p className={`text-lg font-semibold ${
                                        vital.oxygen_saturation < 90
                                          ? "text-red-700"
                                          : "text-gray-900"
                                      }`}>
                                        {vital.oxygen_saturation}<span className="text-sm font-normal">%</span>
                                      </p>
                                    </div>
                                  )}

                                  {/* Weight */}
                                  {vital.weight && (
                                    <div className="p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-500 uppercase font-medium">Weight</p>
                                      <p className="text-lg font-semibold text-gray-900">
                                        {vital.weight} <span className="text-sm font-normal">{vital.weight_unit || "lbs"}</span>
                                      </p>
                                    </div>
                                  )}

                                  {/* Height */}
                                  {(vital.height_feet !== null || vital.height_inches !== null) && (
                                    <div className="p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-500 uppercase font-medium">Height</p>
                                      <p className="text-lg font-semibold text-gray-900">
                                        {vital.height_feet || 0}' {vital.height_inches || 0}"
                                      </p>
                                    </div>
                                  )}

                                  {/* BMI */}
                                  {vital.bmi && (
                                    <div className="p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-500 uppercase font-medium">BMI</p>
                                      <p className={`text-lg font-semibold ${
                                        vital.bmi < 18.5 || vital.bmi > 30
                                          ? "text-orange-600"
                                          : "text-gray-900"
                                      }`}>
                                        {vital.bmi}
                                      </p>
                                    </div>
                                  )}

                                  {/* Pain Scale */}
                                  {vital.pain_scale !== null && (
                                    <div className="p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-500 uppercase font-medium">Pain Scale</p>
                                      <p className={`text-lg font-semibold ${
                                        vital.pain_scale >= 7
                                          ? "text-red-700"
                                          : vital.pain_scale >= 4
                                            ? "text-orange-600"
                                            : "text-gray-900"
                                      }`}>
                                        {vital.pain_scale}/10
                                        {vital.pain_location && (
                                          <span className="text-sm font-normal text-gray-500 ml-1">({vital.pain_location})</span>
                                        )}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Notes */}
                                {vital.notes && (
                                  <div className="mt-3 p-2 bg-white rounded border">
                                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Notes</p>
                                    <p className="text-sm text-gray-700">{vital.notes}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">No vital signs updates from encounters</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Vital signs recorded through Edit Progress Note in Patient Encounters will appear here
                          </p>
                        </div>
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

                <TabsContent value="pmp" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Prescription Monitoring Program (PMP)
                      </CardTitle>
                      <CardDescription>
                        Controlled substance prescription history and monitoring
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pmpLoading ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                          <p className="text-muted-foreground">Loading PMP data...</p>
                        </div>
                      ) : !pmpData ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No PMP queries have been performed for this patient</p>
                          <p className="text-sm mt-2">Query the PMP database to view prescription history</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pmpData.latestRequest && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">Latest Query</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(pmpData.latestRequest.request_date).toLocaleString()}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    pmpData.latestRequest.alert_level === "critical"
                                      ? "destructive"
                                      : pmpData.latestRequest.alert_level === "high"
                                        ? "default"
                                        : "secondary"
                                  }>
                                  {pmpData.latestRequest.alert_level || "No Alert"}
                                </Badge>
                              </div>
                              
                              {pmpData.latestRequest.red_flags && Object.keys(pmpData.latestRequest.red_flags).length > 0 && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Red Flags Detected
                                  </h4>
                                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                    {Object.entries(pmpData.latestRequest.red_flags).map(
                                      ([key, value]: [string, any]) => (
                                        <li key={key}>
                                          {key}: {String(value)}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}

                              {pmpData.prescriptions && pmpData.prescriptions.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Recent Prescriptions ({pmpData.prescriptions.length})</h4>
                                  <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {pmpData.prescriptions.map((rx: any) => (
                                      <div
                                        key={rx.id}
                                        className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                          <p className="font-medium">{rx.medication_name}</p>
                                          <Badge variant="outline">{rx.dea_schedule}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                          <div>Fill Date: {rx.fill_date}</div>
                                          <div>Qty: {rx.quantity}</div>
                                          <div>Days: {rx.days_supply}</div>
                                          {rx.morphine_equivalent_dose && (
                                            <div>MME: {rx.morphine_equivalent_dose}</div>
                                          )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          Prescriber: {rx.prescriber_name} • Pharmacy: {rx.pharmacy_name}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {pmpData.allRequests && pmpData.allRequests.length > 1 && (
                                <div className="pt-2 border-t">
                                  <p className="text-sm text-muted-foreground">
                                    Total queries: {pmpData.allRequests.length}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="eligibility" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Patient Eligibility & Insurance Verification
                      </CardTitle>
                      <CardDescription>
                        Verify insurance coverage and benefits for this patient
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedPatient ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Patient:</strong> {selectedPatient.first_name} {selectedPatient.last_name}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              Use the eligibility verification tool below to check coverage status and benefits.
                            </p>
                          </div>
                          <div className="border rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              Insurance eligibility verification component will be integrated here.
                              This will show coverage status, copays, deductibles, and PMP monitoring results.
                            </p>
                            <Button variant="outline" onClick={() => {
                              // Navigate to eligibility check or open dialog
                              toast.info("Eligibility verification feature coming soon");
                            }}>
                              <Shield className="mr-2 h-4 w-4" />
                              Verify Eligibility
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          Select a patient to view eligibility information
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Patient Billing & Claims
                      </CardTitle>
                      <CardDescription>
                        View billing claims, payments, and financial information for this patient
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {billingLoading ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                          <p className="text-muted-foreground">Loading billing data...</p>
                        </div>
                      ) : billingClaims.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No billing claims found for this patient</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium">
                              Total Claims: {billingClaims.length}
                            </p>
                            <Badge variant="outline">
                              Total: ${billingClaims.reduce((sum, claim) => sum + (claim.totalCharges || 0), 0).toFixed(2)}
                            </Badge>
                          </div>
                          {billingClaims.map((claim) => (
                            <div
                              key={claim.id}
                              className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium">{claim.claimNumber || `CLM-${claim.id.slice(0, 8)}`}</p>
                                  <Badge
                                    variant={
                                      claim.status === "paid"
                                        ? "default"
                                        : claim.status === "denied"
                                          ? "destructive"
                                          : "secondary"
                                    }>
                                    {claim.status || "pending"}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    <span className="font-medium">Service Date:</span> {new Date(claim.serviceDate).toLocaleDateString()}
                                  </div>
                                  <div>
                                    <span className="font-medium">Payer:</span> {claim.payerName || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Charges:</span> ${(claim.totalCharges || 0).toFixed(2)}
                                  </div>
                                  {claim.paidAmount && (
                                    <div>
                                      <span className="font-medium">Paid:</span> ${claim.paidAmount.toFixed(2)}
                                    </div>
                                  )}
                                  {claim.submissionDate && (
                                    <div>
                                      <span className="font-medium">Submitted:</span> {new Date(claim.submissionDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                {claim.denialReason && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                    <span className="font-medium">Denial Reason:</span> {claim.denialReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
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
    </div>
  );
}
