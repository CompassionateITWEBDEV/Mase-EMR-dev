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
  Database,
  CreditCard,
  History,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

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
  height_feet?: number | null;
  height_inches?: number | null;
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
  const [vitalSignsUpdates, setVitalSignsUpdates] = useState<VitalSignUpdate[]>([]);
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
  const [pmpData, setPmpData] = useState<any>(null);
  const [pmpLoading, setPmpLoading] = useState(false);
  const [billingClaims, setBillingClaims] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [encounterNoteAlerts, setEncounterNoteAlerts] = useState<any[]>([]);
  const [encounterAlertsLoading, setEncounterAlertsLoading] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

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

  // Listen for patient data updates (e.g., from encounter note edits)
  // Works both within same tab AND across different browser tabs
  useEffect(() => {
    // Handler for same-tab events
    const handlePatientDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('Patient data update event received (same tab):', {
        eventDetail: customEvent.detail,
        currentPatientId: patientId,
        matches: customEvent.detail?.patientId === patientId
      });
      
      if (customEvent.detail?.patientId === patientId) {
        console.log('Refreshing patient data due to update event...', customEvent.detail);
        // Add a small delay to ensure database has updated
        setTimeout(() => {
          fetchPatientData(patientId, true); // Force refresh with cache busting
        }, 500);
      }
    };
    
    // Handler for cross-tab BroadcastChannel messages
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('patient-vitals-channel');
      channel.onmessage = (event) => {
        console.log('BroadcastChannel message received (cross-tab):', {
          data: event.data,
          currentPatientId: patientId,
          matches: event.data?.patientId === patientId
        });
        
        if (event.data?.patientId === patientId) {
          console.log('Refreshing patient data due to cross-tab broadcast...', event.data);
          // Show toast notification that vitals are being refreshed
          if (event.data?.vitalsUpdated) {
            toast.info("New vital signs detected! Refreshing Patient Vitals...");
          }
          setTimeout(() => {
            fetchPatientData(patientId, true);
            if (event.data?.vitalsUpdated) {
              toast.success("Patient Vitals updated successfully!");
            }
          }, 500);
        }
      };
    } catch (e) {
      console.log('BroadcastChannel not supported, using localStorage fallback');
    }
    
    // Fallback: localStorage listener for older browsers
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'patient-vitals-update' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          console.log('localStorage update received:', data);
          if (data?.patientId === patientId) {
            setTimeout(() => {
              fetchPatientData(patientId, true);
            }, 500);
          }
        } catch (e) {
          console.error('Error parsing localStorage update:', e);
        }
      }
    };
    
    window.addEventListener('patient-data-updated', handlePatientDataUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('patient-data-updated', handlePatientDataUpdate);
      window.removeEventListener('storage', handleStorageChange);
      if (channel) {
        channel.close();
      }
    };
  }, [patientId]);

  const fetchPatientData = async (id: string, forceRefresh: boolean = false) => {
    console.log("[v0] fetchPatientData called with patientId:", id, "forceRefresh:", forceRefresh);
    if (!forceRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
      const response = await fetch(`/api/patients/${id}${cacheBuster}`);

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
      const vitals = data.vitalSigns || [];
      console.log('[v0] Setting vital signs:', vitals.length, 'records');
      if (vitals.length > 0) {
        console.log('[v0] Latest vital sign:', vitals[0]);
      }
      setVitalSigns(vitals);
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
      setProgressNotes(data.progressNotes || []);
      setCourtOrders(data.courtOrders || []);

      await fetchClinicalAlerts(id);

      // Fetch PMP and billing data
      await fetchPMPData(id);
      await fetchBillingData(id);

      // Fetch encounter note alerts
      await fetchEncounterNoteAlerts(id);

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

  const fetchPMPData = async (patientId: string) => {
    setPmpLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      // Fetch PMP requests for this patient
      const { data: pdmpRequests } = await supabase
        .from("pdmp_requests")
        .select("*")
        .eq("patient_id", patientId)
        .order("request_date", { ascending: false })
        .limit(10);

      if (pdmpRequests && pdmpRequests.length > 0) {
        const latestRequest = pdmpRequests[0];
        
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

  // Refresh patient data after adding new records
  const refreshPatientData = () => {
    if (patientId) {
      fetchPatientData(patientId, true);
      toast.success("Data refreshed");
    }
  };

  const fetchBillingData = async (patientId: string) => {
    setBillingLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
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
        <div className="pl-64">
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
        <div className="pl-64">
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
      <div className="pl-64">
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
                            : selectedPatient.program_type === "sub"
                              ? "SUB"
                              : selectedPatient.program_type === "beh"
                                ? "BEH"
                                : selectedPatient.program_type.charAt(0).toUpperCase() + selectedPatient.program_type.slice(1).toLowerCase()}
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
                {encounterNoteAlerts.filter((a) => !a.is_read).length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {encounterNoteAlerts.filter((a) => !a.is_read).length}
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
                Vital Signs Updates
                {vitalSignsUpdates.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
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
                      onClick={() => router.push(`/clinical-notes?patient=${patientId}`)}
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
                            <div className="text-sm text-muted-foreground">
                              {new Date(
                                note.note_date ||
                                note.created_at
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          {note.subjective && (
                            <div className="text-sm text-foreground mt-2">
                              <p className="whitespace-pre-wrap">{note.subjective}</p>
                            </div>
                          )}
                          {note.objective && (
                            <div className="text-sm text-foreground mt-2">
                              <p className="font-medium">Objective:</p>
                              <p className="whitespace-pre-wrap">{note.objective}</p>
                            </div>
                          )}
                          {note.assessment && (
                            <div className="text-sm text-foreground mt-2">
                              <p className="font-medium">Assessment:</p>
                              <p className="whitespace-pre-wrap">{note.assessment}</p>
                            </div>
                          )}
                          {note.plan && (
                            <div className="text-sm text-foreground mt-2">
                              <p className="font-medium">Plan:</p>
                              <p className="whitespace-pre-wrap">{note.plan}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No clinical notes available</p>
                    </div>
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
                                          `/api/patients/${patientId}/encounter-alerts`,
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
                                          await fetchEncounterNoteAlerts(patientId);
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Patient Documents</CardTitle>
                      <CardDescription>
                        Uploaded documents and files
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => router.push(`/documentation?patient=${patientId}`)}
                      size="sm"
                      variant="outline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Go to Documentation
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-500 py-8">
                    No documents uploaded. Click Add Document to create a new entry.
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Labs / Urine Drug Screens</CardTitle>
                      <CardDescription>
                        Laboratory results and drug screening tests
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => router.push(`/toxicology?patient=${patientId}`)}
                      size="sm"
                      variant="outline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Go to Toxicology
                    </Button>
                  </div>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Patient Vitals</CardTitle>
                      <CardDescription>
                        Vital signs measurements and trends
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/encounters?patient=${patientId}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Record in Encounters
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Manual refresh of patient vitals triggered');
                          fetchPatientData(patientId, true);
                          toast.info("Refreshing patient vitals...");
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
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
                                  {(vital.height || (vital.height_feet !== null && vital.height_feet !== undefined && vital.height_inches !== null && vital.height_inches !== undefined)) && (
                                    <div>
                                      <span className="font-medium text-gray-600">Height: </span>
                                      {vital.height_feet !== null && vital.height_feet !== undefined && vital.height_inches !== null && vital.height_inches !== undefined
                                        ? `${vital.height_feet}'${vital.height_inches}"`
                                        : vital.height
                                          ? `${vital.height} in`
                                          : "N/A"}
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
                          toast.info("Eligibility verification feature coming soon");
                        }}>
                          <Shield className="mr-2 h-4 w-4" />
                          Verify Eligibility
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Patient information not available
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
        </main>
      </div>
    </div>
  );
}
