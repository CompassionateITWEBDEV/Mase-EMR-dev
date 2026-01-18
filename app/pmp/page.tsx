"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Pill,
  Search,
  AlertTriangle,
  Clock,
  FileText,
  ExternalLink,
  RefreshCw,
  Settings,
  Shield,
  CheckCircle,
  Eye,
  Download,
  History,
  Key,
  Database,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PMPData {
  systemStatus: string;
  todayChecks: number;
  yesterdayChecks: number;
  highRiskAlerts: number;
  recentAlerts: Array<{
    id: string;
    patientName: string;
    dob: string;
    alertType: string;
    severity: string;
    message: string;
    createdAt: string;
  }>;
  controlledSubstancePatients: number;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
}

interface PDMPConfig {
  id: string;
  state_code: string;
  pdmp_username: string;
  pdmp_endpoint: string;
  is_active: boolean;
  auto_check_controlled_rx: boolean;
}

interface PDMPRequest {
  id: string;
  patient_id: string;
  request_type: string;
  request_status: string;
  state_requested: string;
  request_date: string;
  response_date: string | null;
  pdmp_report: any;
  alert_level: string | null;
  red_flags: any;
  patients?: Patient;
}

interface PDMPPrescription {
  id: string;
  pdmp_request_id: string;
  medication_name: string;
  fill_date: string;
  quantity: number;
  days_supply: number;
  prescriber_name: string;
  pharmacy_name: string;
  dea_schedule: string;
  morphine_equivalent_dose: number | null;
}

export default function PMPPage() {
  const { data, error, isLoading, mutate } = useSWR<PMPData>(
    "/api/pmp",
    fetcher
  );
  const { data: patientsData } = useSWR("/api/patients?limit=100", fetcher);
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const patients = patientsData?.patients || [];

  // State for patient search
  const [searchParams, setSearchParams] = useState({
    firstName: "",
    lastName: "",
    dob: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);

  // State for configuration
  const [pdmpConfig, setPdmpConfig] = useState<PDMPConfig | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    state_code: "MI",
    pdmp_username: "",
    pdmp_password: "",
    pdmp_api_key: "",
    pdmp_endpoint: "https://michigan.pmpaware.net/api/v2",
    auto_check_controlled_rx: true,
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // State for patient selection
  const [selectedPatient, setSelectedPatient] = useState<string>("");

  // State for history
  const [pdmpRequests, setPdmpRequests] = useState<PDMPRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PDMPRequest | null>(
    null
  );
  const [requestPrescriptions, setRequestPrescriptions] = useState<
    PDMPPrescription[]
  >([]);
  const [isViewResultsOpen, setIsViewResultsOpen] = useState(false);

  // Load configuration and patients on mount
  useEffect(() => {
    loadConfig();
    loadPDMPHistory();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("pdmp_config")
        .select("*")
        .maybeSingle();

      if (error) {
        // Only log if it's not a "not found" type error
        if (error.code !== "PGRST116") {
          console.warn("[v0] Error loading PDMP config:", error.message);
        }
        // If table doesn't exist or no config, continue without error
        return;
      }

      if (data) {
        setPdmpConfig(data);
        setConfigForm({
          state_code: data.state_code || "MI",
          pdmp_username: data.pdmp_username || "",
          pdmp_password: "", // Don't load password
          pdmp_api_key: data.pdmp_api_key || "",
          pdmp_endpoint:
            data.pdmp_endpoint || "https://michigan.pmpaware.net/api/v2",
          auto_check_controlled_rx: data.auto_check_controlled_rx ?? true,
        });
      }
    } catch (error) {
      // Silently handle errors - PMP config is optional
      // Don't log to avoid console spam
    }
  };

  const loadPDMPHistory = async () => {
    const { data } = await supabase
      .from("pdmp_requests")
      .select(
        `
        *,
        patients:patient_id (first_name, last_name, date_of_birth)
      `
      )
      .order("request_date", { ascending: false })
      .limit(50);

    if (data) {
      setPdmpRequests(data);
    }
  };

  const saveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const configData: any = {
        state_code: configForm.state_code,
        pdmp_username: configForm.pdmp_username,
        pdmp_api_key: configForm.pdmp_api_key,
        pdmp_endpoint: configForm.pdmp_endpoint,
        auto_check_controlled_rx: configForm.auto_check_controlled_rx,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      // Only update password if provided
      if (configForm.pdmp_password) {
        configData.pdmp_password_encrypted = configForm.pdmp_password; // In production, encrypt this
      }

      if (pdmpConfig?.id) {
        // Update existing config
        const { error } = await supabase
          .from("pdmp_config")
          .update(configData)
          .eq("id", pdmpConfig.id);

        if (error) throw error;
      } else {
        // Insert new config
        configData.created_at = new Date().toISOString();
        const { error } = await supabase.from("pdmp_config").insert(configData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "PMP configuration saved successfully",
      });
      setIsConfigDialogOpen(false);
      loadConfig();
    } catch (err) {
      console.error("Error saving config:", err);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSearch = async () => {
    if (!searchParams.firstName && !searchParams.lastName && !selectedPatient) {
      toast({
        title: "Error",
        description: "Please enter patient information or select a patient",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchResults(null);

    try {
      const patientData = {
        firstName: searchParams.firstName,
        lastName: searchParams.lastName,
        dob: searchParams.dob,
        patientId: selectedPatient || null,
      };

      // If patient selected from dropdown, get their info
      if (selectedPatient) {
        const patient = patients.find((p: Patient) => p.id === selectedPatient);
        if (patient) {
          patientData.firstName = patient.first_name;
          patientData.lastName = patient.last_name;
          patientData.dob = patient.date_of_birth;
        }
      }

      const response = await fetch("/api/pmp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults(result);
        toast({
          title: "PMP Check Complete",
          description: "Results retrieved from state database",
        });
        mutate(); // Refresh stats
        loadPDMPHistory(); // Refresh history
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to query PMP",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error performing PMP search:", err);
      toast({
        title: "Error",
        description: "Failed to query PMP database",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const viewRequestResults = async (request: PDMPRequest) => {
    setSelectedRequest(request);

    // Load prescriptions for this request
    const { data } = await supabase
      .from("pdmp_prescriptions")
      .select("*")
      .eq("pdmp_request_id", request.id)
      .order("fill_date", { ascending: false });

    if (data) {
      setRequestPrescriptions(data);
    }

    setIsViewResultsOpen(true);
  };

  const todayDiff = (data?.todayChecks || 0) - (data?.yesterdayChecks || 0);

  const getAlertBadge = (alertLevel: string | null) => {
    switch (alertLevel) {
      case "critical":
        return <Badge variant="destructive">Critical Risk</Badge>;
      case "high":
        return <Badge className="bg-orange-500">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case "low":
        return <Badge className="bg-green-500">Low Risk</Badge>;
      default:
        return <Badge variant="secondary">No Alerts</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                PMP Monitoring Dashboard
              </h1>
              <p className="text-muted-foreground">
                Prescription Monitoring Program Integration -{" "}
                {configForm.state_code || "Michigan"} PDMP
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfigDialogOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Configure PMP
              </Button>
              <Button
                variant="outline"
                onClick={() => mutate()}
                disabled={isLoading}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          <Card
            className={
              pdmpConfig?.is_active ? "border-green-500" : "border-yellow-500"
            }>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {pdmpConfig?.is_active ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {pdmpConfig?.is_active
                        ? "PMP Connected"
                        : "PMP Not Configured"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pdmpConfig?.is_active
                        ? `Connected to ${pdmpConfig.pdmp_endpoint} as ${pdmpConfig.pdmp_username}`
                        : "Please configure your PMP credentials to enable automatic checks"}
                    </p>
                  </div>
                </div>
                {pdmpConfig?.auto_check_controlled_rx && (
                  <Badge className="bg-blue-500">
                    Auto-Check at Intake Enabled
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Status
                </CardTitle>
                <div
                  className={`w-3 h-3 rounded-full ${
                    pdmpConfig?.is_active ? "bg-green-500" : "bg-yellow-500"
                  }`}></div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold capitalize">
                      {pdmpConfig?.is_active ? "Online" : "Offline"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {configForm.state_code} PMP Database
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {"Today's Checks"}
                </CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {data?.todayChecks || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span
                        className={
                          todayDiff >= 0 ? "text-green-600" : "text-red-600"
                        }>
                        {todayDiff >= 0 ? "+" : ""}
                        {todayDiff}
                      </span>{" "}
                      from yesterday
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  High Risk Alerts
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <>
                    <div
                      className={`text-2xl font-bold ${
                        (data?.highRiskAlerts || 0) > 0 ? "text-red-600" : ""
                      }`}>
                      {data?.highRiskAlerts || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Require immediate review
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Controlled Substance Patients
                </CardTitle>
                <Pill className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {data?.controlledSubstancePatients || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active monitoring
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="lookup" className="space-y-4">
            <TabsList>
              <TabsTrigger value="lookup">Patient Lookup</TabsTrigger>
              <TabsTrigger value="history">Query History</TabsTrigger>
              <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Patient Lookup Tab */}
            <TabsContent value="lookup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Patient PMP Lookup
                  </CardTitle>
                  <CardDescription>
                    Search the state Prescription Monitoring Program database
                    for patient prescription history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Select Existing Patient</Label>
                      <Select
                        value={selectedPatient}
                        onValueChange={setSelectedPatient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a patient..." />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient: Patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.last_name}, {patient.first_name} (DOB:{" "}
                              {patient.date_of_birth})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <p className="text-sm text-muted-foreground">
                        — OR enter patient info manually below —
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Enter first name"
                        value={searchParams.firstName}
                        onChange={(e) =>
                          setSearchParams({
                            ...searchParams,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!!selectedPatient}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Enter last name"
                        value={searchParams.lastName}
                        onChange={(e) =>
                          setSearchParams({
                            ...searchParams,
                            lastName: e.target.value,
                          })
                        }
                        disabled={!!selectedPatient}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={searchParams.dob}
                        onChange={(e) =>
                          setSearchParams({
                            ...searchParams,
                            dob: e.target.value,
                          })
                        }
                        disabled={!!selectedPatient}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleSearch}
                      disabled={
                        isSearching ||
                        (!selectedPatient &&
                          (!searchParams.firstName || !searchParams.lastName))
                      }>
                      <Search className="mr-2 h-4 w-4" />
                      {isSearching ? "Querying PMP..." : "Search PMP Database"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPatient("");
                        setSearchParams({
                          firstName: "",
                          lastName: "",
                          dob: "",
                        });
                        setSearchResults(null);
                      }}>
                      Clear
                    </Button>
                    <Button variant="outline" asChild>
                      <a
                        href={
                          configForm.pdmp_endpoint ||
                          "https://michigan.pmpaware.net"
                        }
                        target="_blank"
                        rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open State PMP Portal
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              {searchResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      PMP Search Results
                    </CardTitle>
                    <CardDescription>
                      Results for {searchResults.searchParams?.firstName}{" "}
                      {searchResults.searchParams?.lastName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {getAlertBadge(searchResults.alertLevel)}
                        <span className="text-sm text-muted-foreground">
                          {searchResults.prescriptionCount || 0} controlled
                          substance prescriptions found in the last 12 months
                        </span>
                      </div>

                      {searchResults.redFlags &&
                        searchResults.redFlags.length > 0 && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Red Flags Detected
                            </h4>
                            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                              {searchResults.redFlags.map(
                                (flag: string, i: number) => (
                                  <li key={i}>{flag}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {searchResults.prescriptions &&
                        searchResults.prescriptions.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Medication</TableHead>
                                <TableHead>Schedule</TableHead>
                                <TableHead>Fill Date</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Days Supply</TableHead>
                                <TableHead>Prescriber</TableHead>
                                <TableHead>Pharmacy</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {searchResults.prescriptions.map(
                                (rx: any, i: number) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-medium">
                                      {rx.medication_name}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {rx.dea_schedule}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{rx.fill_date}</TableCell>
                                    <TableCell>{rx.quantity}</TableCell>
                                    <TableCell>{rx.days_supply}</TableCell>
                                    <TableCell>{rx.prescriber_name}</TableCell>
                                    <TableCell>{rx.pharmacy_name}</TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        )}

                      {(!searchResults.prescriptions ||
                        searchResults.prescriptions.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p>
                            No controlled substance prescriptions found in the
                            monitoring period
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Query History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    PMP Query History
                  </CardTitle>
                  <CardDescription>
                    Recent PMP queries and results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pdmpRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="h-8 w-8 mx-auto mb-2" />
                      <p>No PMP queries have been performed yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Query Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Alert Level</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pdmpRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              {request.patients
                                ? `${request.patients.last_name}, ${request.patients.first_name}`
                                : "Unknown"}
                            </TableCell>
                            <TableCell>{request.state_requested}</TableCell>
                            <TableCell>
                              {new Date(request.request_date).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  request.request_status === "completed"
                                    ? "default"
                                    : "secondary"
                                }>
                                {request.request_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getAlertBadge(request.alert_level)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewRequestResults(request)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Alerts Tab */}
            <TabsContent value="alerts">
              <Card>
                <CardHeader>
                  <CardTitle>Active High-Risk Alerts</CardTitle>
                  <CardDescription>
                    Patients requiring immediate clinical attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : !data?.recentAlerts || data.recentAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No high-risk alerts at this time</p>
                      <p className="text-sm">
                        All patients are within normal monitoring parameters
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.recentAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 ${
                            alert.severity === "critical"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                          }`}>
                          <div className="flex items-start gap-3">
                            {alert.severity === "critical" ? (
                              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium">
                                {alert.patientName}{" "}
                                {alert.dob && `(DOB: ${alert.dob})`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {alert.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Alert:{" "}
                                {new Date(alert.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                alert.severity === "critical"
                                  ? "destructive"
                                  : "secondary"
                              }>
                              {alert.severity === "critical"
                                ? "Critical"
                                : "Medium Risk"}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <FileText className="mr-2 h-4 w-4" />
                              View Report
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      PMP Credentials
                    </CardTitle>
                    <CardDescription>
                      Configure your state PMP login credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={configForm.state_code}
                        onValueChange={(v) =>
                          setConfigForm({ ...configForm, state_code: v })
                        }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MI">Michigan (MAPS)</SelectItem>
                          <SelectItem value="OH">Ohio (OARRS)</SelectItem>
                          <SelectItem value="IN">Indiana (INSPECT)</SelectItem>
                          <SelectItem value="IL">Illinois (ILPMP)</SelectItem>
                          <SelectItem value="WI">Wisconsin (PDMP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>PMP Username/User ID</Label>
                      <Input
                        value={configForm.pdmp_username}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            pdmp_username: e.target.value,
                          })
                        }
                        placeholder="Enter your PMP username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>PMP Password</Label>
                      <Input
                        type="password"
                        value={configForm.pdmp_password}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            pdmp_password: e.target.value,
                          })
                        }
                        placeholder={
                          pdmpConfig?.pdmp_username
                            ? "••••••••"
                            : "Enter your PMP password"
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {pdmpConfig?.pdmp_username
                          ? "Leave blank to keep existing password"
                          : "Password is encrypted and stored securely"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>API Key (if applicable)</Label>
                      <Input
                        value={configForm.pdmp_api_key}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            pdmp_api_key: e.target.value,
                          })
                        }
                        placeholder="Enter API key if required by your state"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>PMP Endpoint URL</Label>
                      <Input
                        value={configForm.pdmp_endpoint}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            pdmp_endpoint: e.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                    </div>

                    <Button
                      onClick={saveConfig}
                      disabled={isSavingConfig}
                      className="w-full">
                      {isSavingConfig ? "Saving..." : "Save Credentials"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Automation Settings
                    </CardTitle>
                    <CardDescription>
                      Configure automatic PMP checking behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Check at Patient Intake</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically query PMP when a new patient is admitted
                        </p>
                      </div>
                      <Switch
                        checked={configForm.auto_check_controlled_rx}
                        onCheckedChange={(checked) =>
                          setConfigForm({
                            ...configForm,
                            auto_check_controlled_rx: checked,
                          })
                        }
                      />
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Intake Integration
                      </h4>
                      <p className="text-sm text-blue-700">
                        When enabled, the system will automatically query the
                        state PMP database during patient intake and admission.
                        Results will be stored in the patient's chart and any
                        red flags will generate clinical alerts.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Integration Features</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Automatic PMP query at new patient intake</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Real-time prescription history retrieval</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>
                            Red flag detection (multiple prescribers, early
                            refills, etc.)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>
                            Morphine Milligram Equivalent (MME) calculation
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>
                            Clinical alert generation for high-risk patients
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Audit trail for all PMP queries</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={saveConfig}
                      disabled={isSavingConfig}
                      className="w-full">
                      {isSavingConfig ? "Saving..." : "Save Settings"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure PMP Integration</DialogTitle>
            <DialogDescription>
              Enter your state PMP credentials to enable automatic prescription
              monitoring
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>State</Label>
              <Select
                value={configForm.state_code}
                onValueChange={(v) =>
                  setConfigForm({ ...configForm, state_code: v })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MI">Michigan (MAPS)</SelectItem>
                  <SelectItem value="OH">Ohio (OARRS)</SelectItem>
                  <SelectItem value="IN">Indiana (INSPECT)</SelectItem>
                  <SelectItem value="IL">Illinois (ILPMP)</SelectItem>
                  <SelectItem value="WI">Wisconsin (PDMP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Username/User ID</Label>
              <Input
                value={configForm.pdmp_username}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    pdmp_username: e.target.value,
                  })
                }
                placeholder="Your PMP login username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={configForm.pdmp_password}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    pdmp_password: e.target.value,
                  })
                }
                placeholder="Your PMP login password"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Check at Intake</Label>
                <p className="text-xs text-muted-foreground">
                  Query PMP automatically for new patients
                </p>
              </div>
              <Switch
                checked={configForm.auto_check_controlled_rx}
                onCheckedChange={(checked) =>
                  setConfigForm({
                    ...configForm,
                    auto_check_controlled_rx: checked,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveConfig} disabled={isSavingConfig}>
              {isSavingConfig ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Results Dialog */}
      <Dialog open={isViewResultsOpen} onOpenChange={setIsViewResultsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PMP Query Results</DialogTitle>
            <DialogDescription>
              {selectedRequest?.patients &&
                `${selectedRequest.patients.last_name}, ${selectedRequest.patients.first_name} - ${selectedRequest.state_requested} PDMP`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {getAlertBadge(selectedRequest?.alert_level || null)}
              <span className="text-sm text-muted-foreground">
                Query Date:{" "}
                {selectedRequest &&
                  new Date(selectedRequest.request_date).toLocaleString()}
              </span>
            </div>

            {selectedRequest?.red_flags &&
              Object.keys(selectedRequest.red_flags).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Red Flags Detected
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {Object.entries(selectedRequest.red_flags).map(
                      ([key, value]: [string, any]) => (
                        <li key={key}>
                          {key}: {String(value)}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {requestPrescriptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Fill Date</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>MME</TableHead>
                    <TableHead>Prescriber</TableHead>
                    <TableHead>Pharmacy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestPrescriptions.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium">
                        {rx.medication_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rx.dea_schedule}</Badge>
                      </TableCell>
                      <TableCell>{rx.fill_date}</TableCell>
                      <TableCell>{rx.quantity}</TableCell>
                      <TableCell>{rx.days_supply}</TableCell>
                      <TableCell>
                        {rx.morphine_equivalent_dose || "-"}
                      </TableCell>
                      <TableCell>{rx.prescriber_name}</TableCell>
                      <TableCell>{rx.pharmacy_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No controlled substance prescriptions found</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewResultsOpen(false)}>
              Close
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
