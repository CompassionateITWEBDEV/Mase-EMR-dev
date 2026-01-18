"use client";

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
  HeartPulse,
  DollarSign,
  FileText,
  ClipboardList,
  Brain,
  AlertTriangle,
  Lightbulb,
  Pill,
  CheckCircle,
  Plus,
  Target,
  GraduationCap,
  Printer,
  Sparkles,
  Info,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
  AIRecommendation,
  RiskAlert,
  ClinicalRecommendation,
  LabOrder,
  Diagnosis,
  PreventiveGap,
} from "@/types/ai-assistant";
import type { ClinicalAlert, AssessmentTool } from "@/types/clinical";
import type { ScheduleItem } from "@/types/schedule";
import {
  useAppointments,
  useScheduleSummary,
  useCreateAppointment,
  useCancelAppointment,
} from "@/hooks/use-appointments";
import {
  useClinicalAlerts,
  useAcknowledgeAlert,
} from "@/hooks/use-clinical-alerts";
import { useRequestAIAnalysis } from "@/hooks/use-ai-assistant";
import { AIClinicalAssistant } from "@/components/ai-clinical-assistant";
import { useBillingCodes } from "@/hooks/use-billing-codes";
import { useAssessmentTools } from "@/hooks/use-assessment-tools";
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@/types/patient";
import type { Provider } from "@/types/patient";

export default function PrimaryCareDashboardPage() {
  // Get today's date in YYYY-MM-DD format for filtering
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // State for schedule filters
  const [scheduleDate, setScheduleDate] = useState(today);
  const [scheduleProvider, setScheduleProvider] = useState<string>("all");

  // Fetch today's appointments for dashboard tab
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useAppointments({
    filters: { date: today },
    enabled: true,
  });

  // Fetch appointments for schedule tab with filters
  const {
    data: scheduleAppointmentsData,
    isLoading: scheduleAppointmentsLoading,
    error: scheduleAppointmentsError,
  } = useAppointments({
    filters: { 
      date: scheduleDate,
      ...(scheduleProvider !== "all" && { providerId: scheduleProvider })
    },
    enabled: true,
  });

  // Fetch schedule summary for stats
  const { data: summaryData, isLoading: summaryLoading } =
    useScheduleSummary(today);

  // Fetch clinical alerts using React Query hook
  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
  } = useClinicalAlerts({
    filters: { acknowledged: false, limit: 10 },
    enabled: true,
  });

  // AI Analysis mutation hook
  const {
    mutate: requestAIAnalysis,
    isPending: aiMutationPending,
    data: aiMutationData,
  } = useRequestAIAnalysis();

  // Fetch pending results
  const [pendingResultsCount, setPendingResultsCount] = useState(0);
  const [qualityMetricsScore, setQualityMetricsScore] = useState(94);
  const [ccmPatientsCount, setCcmPatientsCount] = useState(45);

  // Fetch billing codes
  const { data: billingCodesData } = useBillingCodes({
    specialty: "primary-care",
    enabled: true,
  });

  // Fetch assessment tools
  const { data: assessmentToolsData } = useAssessmentTools({ enabled: true });

  // Appointment mutations
  const createAppointment = useCreateAppointment();
  const cancelAppointment = useCancelAppointment();
  const acknowledgeAlert = useAcknowledgeAlert();
  const { toast } = useToast();

  // State for patients and providers (for appointment dialog)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [currentProviderId, setCurrentProviderId] = useState<string>("");

  // Fetch stats on mount
  useEffect(() => {
    fetch("/api/primary-care/pending-results")
      .then((res) => res.json())
      .then((data) => setPendingResultsCount(data.count || 0))
      .catch(() => setPendingResultsCount(8));

    fetch("/api/primary-care/quality-metrics")
      .then((res) => res.json())
      .then((data) => setQualityMetricsScore(data.overall_score || 94))
      .catch(() => setQualityMetricsScore(94));

    fetch("/api/primary-care/ccm-patients")
      .then((res) => res.json())
      .then((data) => setCcmPatientsCount(data.count || 45))
      .catch(() => setCcmPatientsCount(45));

    // Fetch patients and providers
    fetch("/api/patients?limit=100")
      .then((res) => res.json())
      .then((data) => setPatients(data.patients || []))
      .catch(() => setPatients([]));

    fetch("/api/providers")
      .then((res) => {
        if (!res.ok) {
          console.error("[Primary Care Dashboard] Failed to fetch providers:", res.status, res.statusText);
          return { providers: [] };
        }
        return res.json();
      })
      .then((data) => {
        const providersList = data.providers || [];
        console.log("[Primary Care Dashboard] Fetched providers:", providersList.length);
        setProviders(providersList);
        if (providersList.length > 0) {
          setCurrentProviderId(providersList[0].id);
        }
      })
      .catch((error) => {
        console.error("[Primary Care Dashboard] Error fetching providers:", error);
        setProviders([]);
      });

    // Fetch claims
    fetchClaims();
  }, []);

  // Function to fetch claims
  const fetchClaims = async () => {
    setClaimsLoading(true);
    try {
      const response = await fetch("/api/claims");
      if (!response.ok) {
        throw new Error("Failed to fetch claims");
      }
      const data = await response.json();
      setClaims(data.claims || []);
      setPayers(data.payers || []);
    } catch (error) {
      console.error("[Primary Care Dashboard] Error fetching claims:", error);
      toast({
        title: "Error",
        description: "Failed to load claims",
        variant: "destructive",
      });
    } finally {
      setClaimsLoading(false);
    }
  };

  // Transform appointments to schedule items for display
  const todaySchedule: ScheduleItem[] = useMemo(() => {
    if (!appointmentsData?.appointments) return [];
    return appointmentsData.appointments.map((apt) => {
      // Format time from ISO date
      const aptDate = new Date(apt.appointment_date);
      const timeStr = aptDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      // Get patient name from joined data
      const patientName = apt.patients
        ? `${apt.patients.first_name} ${apt.patients.last_name}`
        : "Unknown Patient";
      return {
        time: timeStr,
        patient: patientName,
        patientId: apt.patient_id,
        appointmentId: apt.id,
        type: apt.appointment_type || "Appointment",
        status: apt.status,
        duration: apt.duration_minutes
          ? `${apt.duration_minutes} min`
          : undefined,
        room: apt.room || undefined,
      };
    });
  }, [appointmentsData]);

  // Get alerts from API data
  const alerts: ClinicalAlert[] = useMemo(() => {
    return alertsData?.alerts || [];
  }, [alertsData]);

  // Calculate stats from summary data
  const stats = useMemo(() => {
    const summary = summaryData?.summary;
    return {
      todayAppointments:
        summary?.total || appointmentsData?.appointments?.length || 0,
      pendingResults: pendingResultsCount,
      qualityMetrics: qualityMetricsScore,
      chronicCareManagement: ccmPatientsCount,
    };
  }, [summaryData, appointmentsData, pendingResultsCount, qualityMetricsScore, ccmPatientsCount]);

  // Use billing codes from API or fallback to hardcoded
  const primaryCareCPTCodes = useMemo(() => {
    if (billingCodesData?.codes && billingCodesData.codes.length > 0) {
      return billingCodesData.codes;
    }
    // Fallback to hardcoded codes if API fails
    return [
    // Office Visits - Established Patient
    {
      code: "99211",
      description: "Office visit - minimal",
      rate: 45,
        category: "Office Visit" as const,
    },
    {
      code: "99212",
      description: "Office visit - straightforward",
      rate: 75,
      category: "Office Visit",
    },
    {
      code: "99213",
      description: "Office visit - low complexity",
      rate: 110,
      category: "Office Visit",
    },
    {
      code: "99214",
      description: "Office visit - moderate complexity",
      rate: 165,
      category: "Office Visit",
    },
    {
      code: "99215",
      description: "Office visit - high complexity",
      rate: 210,
      category: "Office Visit",
    },
    // Office Visits - New Patient
    {
      code: "99202",
      description: "New patient - straightforward",
      rate: 95,
      category: "New Patient",
    },
    {
      code: "99203",
      description: "New patient - low complexity",
      rate: 135,
      category: "New Patient",
    },
    {
      code: "99204",
      description: "New patient - moderate complexity",
      rate: 185,
      category: "New Patient",
    },
    {
      code: "99205",
      description: "New patient - high complexity",
      rate: 245,
      category: "New Patient",
    },
    // Preventive Care
    {
      code: "99385",
      description: "Initial preventive visit 18-39 years",
      rate: 175,
      category: "Preventive",
    },
    {
      code: "99386",
      description: "Initial preventive visit 40-64 years",
      rate: 185,
      category: "Preventive",
    },
    {
      code: "99387",
      description: "Initial preventive visit 65+ years",
      rate: 195,
      category: "Preventive",
    },
    {
      code: "99395",
      description: "Periodic preventive visit 18-39 years",
      rate: 150,
      category: "Preventive",
    },
    {
      code: "99396",
      description: "Periodic preventive visit 40-64 years",
      rate: 160,
      category: "Preventive",
    },
    {
      code: "99397",
      description: "Periodic preventive visit 65+ years",
      rate: 170,
      category: "Preventive",
    },
    // Chronic Care Management
    {
      code: "99490",
      description: "Chronic care management - 20 min",
      rate: 42,
      category: "CCM",
    },
    {
      code: "99439",
      description: "CCM add-on - each additional 20 min",
      rate: 38,
      category: "CCM",
    },
    {
      code: "99487",
      description: "Complex CCM - 60 min",
      rate: 93,
      category: "CCM",
    },
    {
      code: "99489",
      description: "Complex CCM add-on - 30 min",
      rate: 46,
      category: "CCM",
    },
    // Annual Wellness Visit
    {
      code: "G0438",
      description: "Annual wellness visit - initial",
      rate: 172,
      category: "Wellness",
    },
    {
      code: "G0439",
      description: "Annual wellness visit - subsequent",
      rate: 115,
      category: "Wellness",
    },
    // Transitional Care Management
    {
      code: "99495",
      description: "TCM - moderate complexity",
      rate: 165,
      category: "TCM",
    },
    {
      code: "99496",
      description: "TCM - high complexity",
      rate: 235,
      category: "TCM" as const,
    },
    ];
  }, [billingCodesData]);

  // Use assessment tools from API or fallback to hardcoded
  const assessmentTools = useMemo(() => {
    if (assessmentToolsData?.tools && assessmentToolsData.tools.length > 0) {
      return assessmentToolsData.tools;
    }
    // Fallback to hardcoded tools if API fails
    return [
    {
      name: "PHQ-9",
      description: "Patient Health Questionnaire - Depression",
      questions: 9,
      time: "5 min",
    },
    {
      name: "GAD-7",
      description: "Generalized Anxiety Disorder Scale",
      questions: 7,
      time: "3 min",
    },
    {
      name: "AUDIT-C",
      description: "Alcohol Use Screening",
      questions: 3,
      time: "2 min",
    },
    {
      name: "DAST-10",
      description: "Drug Abuse Screening Test",
      questions: 10,
      time: "5 min",
    },
    {
      name: "MMSE",
      description: "Mini-Mental State Examination",
      questions: 11,
      time: "10 min",
    },
    {
      name: "MoCA",
      description: "Montreal Cognitive Assessment",
      questions: 13,
      time: "10 min",
    },
    {
      name: "Fall Risk Assessment",
      description: "Fall Risk Screening Tool",
      questions: 12,
      time: "8 min",
    },
    {
      name: "Cardiovascular Risk",
      description: "ASCVD Risk Calculator",
      questions: 8,
      time: "5 min",
    },
    {
      name: "Diabetes Risk",
      description: "ADA Diabetes Risk Test",
      questions: 7,
      time: "3 min",
    },
    {
      name: "Nutrition Screening",
      description: "Mini Nutritional Assessment",
      questions: 6,
      time: "4 min",
    },
    ];
  }, [assessmentToolsData]);

  const [billingFilter, setBillingFilter] = useState("all");
  const [selectedPatientForBilling, setSelectedPatientForBilling] =
    useState("");
  const [selectedCPT, setSelectedCPT] = useState("");
  
  // Billing claims state
  const [claims, setClaims] = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [createClaimDialogOpen, setCreateClaimDialogOpen] = useState(false);
  const [editClaimDialogOpen, setEditClaimDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [serviceDate, setServiceDate] = useState("");
  const [payerId, setPayerId] = useState("");
  const [payers, setPayers] = useState<any[]>([]);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Note: Patient selection for AI is now handled by AIClinicalAssistant component
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Assessment dialog state
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [selectedAssessmentTool, setSelectedAssessmentTool] = useState<AssessmentTool | null>(null);
  const [selectedPatientForAssessment, setSelectedPatientForAssessment] = useState("");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);

  // Note: AI analysis is now handled by the AIClinicalAssistant component

  // Handler to open assessment dialog
  const handleStartAssessment = (tool?: AssessmentTool) => {
    setSelectedAssessmentTool(tool || null);
    setAssessmentDialogOpen(true);
  };

  // Handler to create claim
  const handleCreateClaim = async () => {
    if (!selectedPatientForBilling || !selectedCPT || !serviceDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Patient, CPT Code, Date of Service)",
        variant: "destructive",
      });
      return;
    }

    // Find the selected CPT code to get the rate
    const selectedCPTCode = primaryCareCPTCodes.find(cpt => cpt.code === selectedCPT);
    if (!selectedCPTCode) {
      toast({
        title: "Error",
        description: "Invalid CPT code selected",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingClaim(true);
    try {
      // Convert IDs to integers
      const patientId = parseInt(selectedPatientForBilling, 10);
      const providerId = currentProviderId ? parseInt(currentProviderId, 10) : null;

      if (isNaN(patientId)) {
        toast({
          title: "Error",
          description: "Invalid patient ID",
          variant: "destructive",
        });
        setIsSubmittingClaim(false);
        return;
      }

      if (!providerId || isNaN(providerId)) {
        toast({
          title: "Error",
          description: "No provider selected",
          variant: "destructive",
        });
        setIsSubmittingClaim(false);
        return;
      }

      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "claim",
          patientId: patientId,
          payerId: payerId || null,
          providerId: providerId,
          serviceDate: serviceDate,
          totalCharges: selectedCPTCode.rate,
          claimType: "professional",
          procedureCodes: [selectedCPT],
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Claim created successfully",
        });
        setCreateClaimDialogOpen(false);
        setSelectedPatientForBilling("");
        setSelectedCPT("");
        setServiceDate("");
        setPayerId("");
        fetchClaims(); // Refresh claims list
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create claim",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating claim:", error);
      toast({
        title: "Error",
        description: "Failed to create claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Handler to update claim
  const handleUpdateClaim = async (claimId: string, updates: any) => {
    try {
      const response = await fetch("/api/claims", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: claimId,
          action: "update",
          ...updates,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Claim updated successfully",
        });
        setEditClaimDialogOpen(false);
        setSelectedClaim(null);
        fetchClaims();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update claim",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating claim:", error);
      toast({
        title: "Error",
        description: "Failed to update claim. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handler to delete claim
  const handleDeleteClaim = async (claimId: string) => {
    if (!confirm("Are you sure you want to delete this claim? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/claims?id=${claimId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Claim deleted successfully",
        });
        fetchClaims();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete claim",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting claim:", error);
      toast({
        title: "Error",
        description: "Failed to delete claim. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handler to submit assessment
  const handleSubmitAssessment = async () => {
    if (!selectedPatientForAssessment || !selectedAssessmentTool) {
      toast({
        title: "Error",
        description: "Please select a patient and assessment tool",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingAssessment(true);
    try {
      // First, fetch the assessment catalog to find the form_id
      const catalogResponse = await fetch("/api/assessments");
      const catalogData = await catalogResponse.json();
      
      // Find the form in the catalog by matching the tool name
      const matchingForm = catalogData.assessmentCatalog?.find(
        (form: any) => form.form_name === selectedAssessmentTool.name || 
                     form.form_code === selectedAssessmentTool.name
      );

      if (!matchingForm) {
        toast({
          title: "Error",
          description: `Could not find assessment form "${selectedAssessmentTool.name}" in catalog`,
          variant: "destructive",
        });
        setIsSubmittingAssessment(false);
        return;
      }

      // Validate and convert IDs to integers
      const patientId = parseInt(selectedPatientForAssessment, 10);
      const formId = parseInt(String(matchingForm.id), 10);
      const providerId = currentProviderId ? parseInt(currentProviderId, 10) : null;

      // Validate required fields
      if (isNaN(patientId)) {
        toast({
          title: "Error",
          description: "Invalid patient ID",
          variant: "destructive",
        });
        setIsSubmittingAssessment(false);
        return;
      }

      if (isNaN(formId)) {
        toast({
          title: "Error",
          description: "Invalid assessment form ID",
          variant: "destructive",
        });
        setIsSubmittingAssessment(false);
        return;
      }

      // provider_id is required (NOT NULL in database)
      if (!currentProviderId || isNaN(parseInt(currentProviderId, 10))) {
        toast({
          title: "Error",
          description: "No provider selected. Please ensure a provider is available.",
          variant: "destructive",
        });
        setIsSubmittingAssessment(false);
        return;
      }

      // Create the assessment
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_assessment",
          patient_id: patientId,
          form_id: formId,
          provider_id: providerId,
          notes: assessmentNotes || null,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Assessment "${selectedAssessmentTool.name}" started successfully`,
        });
        setAssessmentDialogOpen(false);
        setSelectedPatientForAssessment("");
        setAssessmentNotes("");
        setSelectedAssessmentTool(null);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to start assessment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to start assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  return (
    <>
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <HeartPulse className="h-8 w-8 text-indigo-600" />
              Primary Care Dashboard
            </h1>
            <p className="text-muted-foreground">
              Family Medicine & Internal Medicine Practice
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-8 lg:w-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
              <TabsTrigger value="chronic-care">Chronic Care</TabsTrigger>
              <TabsTrigger value="preventive">Preventive Care</TabsTrigger>
              <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>{" "}
              {/* Added AI Assistant Tab Trigger */}
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Today's Appointments
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summaryLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        stats.todayAppointments
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summaryData?.summary
                        ? `${summaryData.summary.completed} completed, ${summaryData.summary.scheduled} remaining`
                        : "Loading..."}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending Results
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.pendingResults}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Labs, imaging, consultations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Quality Metrics
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.qualityMetrics}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      MIPS/HEDIS compliance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      CCM Patients
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.chronicCareManagement}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active chronic care mgmt
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Today's Schedule
                  </CardTitle>
                  <CardDescription>Upcoming appointments</CardDescription>
                    </div>
                    <CreateAppointmentDialog
                      patients={patients}
                      providers={providers}
                      currentProviderId={currentProviderId}
                    >
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Appointment
                      </Button>
                    </CreateAppointmentDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appointmentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">
                          Loading schedule...
                        </span>
                      </div>
                    ) : appointmentsError ? (
                      <div className="text-center py-8 text-destructive">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>Failed to load schedule</p>
                      </div>
                    ) : todaySchedule.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-6 w-6 mx-auto mb-2" />
                        <p>No appointments scheduled for today</p>
                      </div>
                    ) : (
                      todaySchedule.map((appt, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-muted-foreground">
                              {appt.time}
                            </div>
                            <div>
                              <div className="font-semibold">
                                {appt.patient}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {appt.type}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {appt.duration && (
                              <Badge variant="outline">{appt.duration}</Badge>
                            )}
                            <Button size="sm">Start Visit</Button>
                            {appt.appointmentId && appt.status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to cancel this appointment?"
                                    )
                                  ) {
                                    cancelAppointment.mutate(appt.appointmentId!, {
                                      onSuccess: () => {
                                        toast({
                                          title: "Success",
                                          description: "Appointment cancelled successfully",
                                        });
                                      },
                                      onError: (error) => {
                                        toast({
                                          title: "Error",
                                          description: error.message || "Failed to cancel appointment",
                                          variant: "destructive",
                                        });
                                      },
                                    });
                                  }
                                }}
                                disabled={cancelAppointment.isPending}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Clinical Alerts
                  </CardTitle>
                  <CardDescription>Items requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">
                          Loading alerts...
                        </span>
                      </div>
                    ) : alertsError ? (
                      <div className="text-center py-8 text-destructive">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>Failed to load alerts</p>
                      </div>
                    ) : alerts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>No pending alerts</p>
                      </div>
                    ) : (
                      alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <Badge
                              variant={
                                alert.priority === "high"
                                  ? "destructive"
                                  : alert.priority === "medium"
                                  ? "default"
                                  : "secondary"
                              }>
                              {alert.priority}
                            </Badge>
                            <div>
                              <div className="font-semibold">
                                {alert.patient}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {alert.message}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {alert.time}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (alert.id) {
                                acknowledgeAlert.mutate(alert.id, {
                                  onSuccess: () => {
                                    toast({
                                      title: "Success",
                                      description: "Alert acknowledged successfully",
                                    });
                                  },
                                  onError: (error) => {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to acknowledge alert",
                                      variant: "destructive",
                                    });
                                  },
                                });
                              }
                            }}
                            disabled={!alert.id || acknowledgeAlert.isPending}
                          >
                            {acknowledgeAlert.isPending ? "Acknowledging..." : "Review"}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patients Tab */}
            <TabsContent value="patients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Panel</CardTitle>
                  <CardDescription>
                    Your assigned primary care patients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Patient list with filters and search coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                  <CardTitle>Appointment Schedule</CardTitle>
                      <CardDescription>View and manage appointments</CardDescription>
                    </div>
                    <CreateAppointmentDialog
                      patients={patients}
                      providers={providers}
                      currentProviderId={currentProviderId}
                    >
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Appointment
                      </Button>
                    </CreateAppointmentDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="schedule-date">Date:</Label>
                        <Input
                          id="schedule-date"
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => {
                            setScheduleDate(e.target.value);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="schedule-provider">Provider:</Label>
                        <Select
                          value={scheduleProvider}
                          onValueChange={(value) => {
                            setScheduleProvider(value);
                          }}
                        >
                          <SelectTrigger id="schedule-provider" className="w-[200px]">
                            <SelectValue placeholder="All providers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Providers</SelectItem>
                            {providers.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.first_name} {provider.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Appointments List */}
                    {scheduleAppointmentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">
                          Loading schedule...
                        </span>
                      </div>
                    ) : scheduleAppointmentsError ? (
                      <div className="text-center py-8 text-destructive">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>Failed to load schedule</p>
                      </div>
                    ) : scheduleAppointmentsData?.appointments && scheduleAppointmentsData.appointments.length > 0 ? (
                      <div className="space-y-2">
                        {scheduleAppointmentsData.appointments.map((apt) => {
                          const aptDate = new Date(apt.appointment_date);
                          const timeStr = aptDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                          const patientName = apt.patients
                            ? `${apt.patients.first_name} ${apt.patients.last_name}`
                            : "Unknown Patient";
                          return (
                            <div
                              key={apt.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-sm font-medium text-muted-foreground w-24">
                                  {timeStr}
                                </div>
                                <div>
                                  <div className="font-semibold">{patientName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {apt.appointment_type} • {apt.duration_minutes || 60} min
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    apt.status === "completed"
                                      ? "default"
                                      : apt.status === "cancelled"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {apt.status}
                                </Badge>
                                {apt.status !== "cancelled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          "Are you sure you want to cancel this appointment?"
                                        )
                                      ) {
                                        cancelAppointment.mutate(apt.id, {
                                          onSuccess: () => {
                                            toast({
                                              title: "Success",
                                              description: "Appointment cancelled successfully",
                                            });
                                          },
                                          onError: (error) => {
                                            toast({
                                              title: "Error",
                                              description: error.message || "Failed to cancel appointment",
                                              variant: "destructive",
                                            });
                                          },
                                        });
                                      }
                                    }}
                                    disabled={cancelAppointment.isPending}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-6 w-6 mx-auto mb-2" />
                        <p>No appointments scheduled for this date</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Primary Care Billing</h2>
                  <p className="text-muted-foreground">
                    CPT codes and charge capture
                  </p>
                </div>
                <Dialog open={createClaimDialogOpen} onOpenChange={setCreateClaimDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setCreateClaimDialogOpen(true)}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Create Claim
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Claim</DialogTitle>
                      <DialogDescription>
                        Select patient and CPT codes for billing
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Patient *</Label>
                        {patients.length > 0 ? (
                          <Select
                            value={selectedPatientForBilling}
                            onValueChange={setSelectedPatientForBilling}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {patients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.first_name} {patient.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            disabled
                            placeholder="No patients available"
                            className="bg-muted"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>CPT Code *</Label>
                        <Select
                          value={selectedCPT}
                          onValueChange={setSelectedCPT}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select CPT code" />
                          </SelectTrigger>
                          <SelectContent>
                            {primaryCareCPTCodes.map((cpt) => (
                              <SelectItem key={cpt.code} value={cpt.code}>
                                {cpt.code} - {cpt.description} (${cpt.rate})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Service *</Label>
                        <Input 
                          type="date" 
                          value={serviceDate}
                          onChange={(e) => setServiceDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Insurance Payer (Optional)</Label>
                        {payers.length > 0 ? (
                          <Select
                            value={payerId || "none"}
                            onValueChange={(value) => setPayerId(value === "none" ? "" : value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payer (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {payers.map((payer: any) => (
                                <SelectItem key={payer.id} value={payer.id}>
                                  {payer.payer_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            disabled
                            placeholder="No payers available"
                            className="bg-muted"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setCreateClaimDialogOpen(false);
                          setSelectedPatientForBilling("");
                          setSelectedCPT("");
                          setServiceDate("");
                          setPayerId("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateClaim}
                        disabled={isSubmittingClaim || !selectedPatientForBilling || !selectedCPT || !serviceDate}
                      >
                        {isSubmittingClaim ? "Creating..." : "Submit Claim"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Billing Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Today's Charges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$2,340</div>
                    <p className="text-xs text-muted-foreground">
                      16 encounters
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$45,600</div>
                    <p className="text-xs text-muted-foreground">
                      312 encounters
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      CCM Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$1,890</div>
                    <p className="text-xs text-muted-foreground">45 patients</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg RVU/Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18.4</div>
                    <p className="text-xs text-muted-foreground text-green-600">
                      +12% vs last month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Claims List */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Claims</CardTitle>
                  <CardDescription>
                    View and manage insurance claims
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {claimsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">
                        Loading claims...
                      </span>
                    </div>
                  ) : claims.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-6 w-6 mx-auto mb-2" />
                      <p>No claims found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {claims.map((claim) => (
                        <div
                          key={claim.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-1">
                              <div className="font-semibold">
                                {claim.patientName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {claim.claimNumber} • {claim.payerName} • {new Date(claim.serviceDate).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                ${claim.totalCharges.toFixed(2)} • Status: {claim.status}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                ${claim.totalCharges.toFixed(2)}
                              </div>
                              <Badge
                                variant={
                                  claim.status === "paid"
                                    ? "default"
                                    : claim.status === "pending" || claim.status === "submitted"
                                    ? "outline"
                                    : claim.status === "denied"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {claim.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedClaim(claim);
                                setEditClaimDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClaim(claim.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edit Claim Dialog */}
              <Dialog open={editClaimDialogOpen} onOpenChange={setEditClaimDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Claim</DialogTitle>
                    <DialogDescription>
                      Update claim information
                    </DialogDescription>
                  </DialogHeader>
                  {selectedClaim && (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Patient</Label>
                        <Input
                          value={selectedClaim.patientName}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Charges</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedClaim.totalCharges}
                          onChange={(e) => {
                            setSelectedClaim({
                              ...selectedClaim,
                              totalCharges: parseFloat(e.target.value) || 0,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={selectedClaim.status}
                          onValueChange={(value) => {
                            setSelectedClaim({
                              ...selectedClaim,
                              status: value,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="denied">Denied</SelectItem>
                            <SelectItem value="appealed">Appealed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={selectedClaim.notes || ""}
                          onChange={(e) => {
                            setSelectedClaim({
                              ...selectedClaim,
                              notes: e.target.value,
                            });
                          }}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditClaimDialogOpen(false);
                        setSelectedClaim(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedClaim) {
                          handleUpdateClaim(selectedClaim.id, {
                            total_charges: selectedClaim.totalCharges,
                            claim_status: selectedClaim.status,
                            notes: selectedClaim.notes,
                          });
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* CPT Code Library */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Primary Care CPT Code Library</CardTitle>
                      <CardDescription>
                        Common billing codes and reimbursement rates
                      </CardDescription>
                    </div>
                    <Select
                      value={billingFilter}
                      onValueChange={setBillingFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Office Visit">
                          Office Visits
                        </SelectItem>
                        <SelectItem value="New Patient">New Patient</SelectItem>
                        <SelectItem value="Preventive">
                          Preventive Care
                        </SelectItem>
                        <SelectItem value="CCM">
                          Chronic Care Management
                        </SelectItem>
                        <SelectItem value="Wellness">
                          Annual Wellness Visit
                        </SelectItem>
                        <SelectItem value="TCM">Transitional Care</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {primaryCareCPTCodes
                      .filter(
                        (cpt) =>
                          billingFilter === "all" ||
                          cpt.category === billingFilter
                      )
                      .map((cpt) => (
                        <div
                          key={cpt.code}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="font-mono">
                              {cpt.code}
                            </Badge>
                            <div>
                              <div className="font-semibold">
                                {cpt.description}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {cpt.category}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${cpt.rate}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Medicare Rate
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessments" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Clinical Assessment Tools
                  </h2>
                  <p className="text-muted-foreground">
                    Standardized screening and evaluation instruments
                  </p>
                </div>
                <Button onClick={() => handleStartAssessment()}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Start Assessment
                </Button>
              </div>

              {/* Assessment Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Completed Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-xs text-muted-foreground">
                      Total assessments
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Positive Screens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">23</div>
                    <p className="text-xs text-muted-foreground">
                      Requiring follow-up
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Completion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">94%</div>
                    <p className="text-xs text-muted-foreground text-green-600">
                      Above target
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Assessment Tools Library */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Assessment Tools</CardTitle>
                  <CardDescription>
                    Evidence-based screening instruments for primary care
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {assessmentTools.map((tool, index) => (
                      <Card
                        key={index}
                        className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {tool.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {tool.description}
                              </CardDescription>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStartAssessment(tool)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Start
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <ClipboardList className="h-4 w-4" />
                              {tool.questions} questions
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {tool.time}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Assessments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Assessments</CardTitle>
                  <CardDescription>
                    Completed screenings from the past 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold">
                            Sarah Johnson - PHQ-9
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Score: 12 (Moderate Depression)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Follow-up Needed</Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold">
                            Michael Chen - AUDIT-C
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Score: 2 (Low Risk)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Normal</Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold">
                            Emily Rodriguez - GAD-7
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Score: 15 (Moderate Anxiety)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Follow-up Needed</Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Start Assessment Dialog */}
              <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedAssessmentTool 
                        ? `Start ${selectedAssessmentTool.name}` 
                        : "Start Assessment"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedAssessmentTool 
                        ? selectedAssessmentTool.description
                        : "Select an assessment tool and patient to begin"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {!selectedAssessmentTool && (
                      <div className="space-y-2">
                        <Label>Assessment Tool *</Label>
                        <Select
                          value=""
                          onValueChange={(value) => {
                            const tool = assessmentTools.find(t => t.name === value);
                            setSelectedAssessmentTool(tool || null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select assessment tool" />
                          </SelectTrigger>
                          <SelectContent>
                            {assessmentTools.map((tool) => (
                              <SelectItem key={tool.name} value={tool.name}>
                                {tool.name} - {tool.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Patient *</Label>
                      {patients.length > 0 ? (
                        <Select
                          value={selectedPatientForAssessment}
                          onValueChange={setSelectedPatientForAssessment}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.first_name} {patient.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          disabled
                          placeholder="No patients available"
                          className="bg-muted"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        value={assessmentNotes}
                        onChange={(e) => setAssessmentNotes(e.target.value)}
                        placeholder="Add any notes about this assessment..."
                        rows={3}
                      />
                    </div>
                    {selectedAssessmentTool && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">
                          <strong>Assessment:</strong> {selectedAssessmentTool.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Estimated time: {selectedAssessmentTool.time} • {selectedAssessmentTool.questions} questions
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAssessmentDialogOpen(false);
                        setSelectedPatientForAssessment("");
                        setAssessmentNotes("");
                        setSelectedAssessmentTool(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitAssessment} 
                      disabled={isSubmittingAssessment || !selectedPatientForAssessment || !selectedAssessmentTool}
                    >
                      {isSubmittingAssessment ? "Starting..." : "Start Assessment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Quality Metrics Tab */}
            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics & MIPS</CardTitle>
                  <CardDescription>
                    Performance measures and value-based care
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-semibold">
                          Diabetes HbA1c Control
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Percentage with HbA1c &lt; 8%
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        87%
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-semibold">
                          Hypertension Control
                        </div>
                        <div className="text-sm text-muted-foreground">
                          BP &lt; 140/90
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        92%
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-semibold">
                          Colorectal Cancer Screening
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Age 50-75 screened
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        78%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chronic Care Tab */}
            <TabsContent value="chronic-care" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chronic Care Management (CCM)</CardTitle>
                  <CardDescription>
                    99490, 99439, 99487 billing opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    CCM patient tracking and time logging coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preventive Care Tab */}
            <TabsContent value="preventive" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preventive Care & Screenings</CardTitle>
                  <CardDescription>
                    Age and gender-appropriate health maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Preventive care tracking dashboard coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Clinical Assistant Tab */}
            <TabsContent value="ai-assistant" className="space-y-6">
              <AIClinicalAssistant
                specialtyId="primary-care"
                patients={patients}
                showPatientSelector={true}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
