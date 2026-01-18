"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { UDSCollectionModal } from "@/components/uds-collection-modal";
import { PatientDataEntryModal } from "@/components/patient-data-entry-modal";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TestTube,
  Stethoscope,
  Brain,
  UserCheck,
  Pill,
  FileText,
  Bell,
  Filter,
  Loader2,
  Activity,
} from "lucide-react";

export default function IntakeQueuePage() {
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showUDSModal, setShowUDSModal] = useState(false);
  const [selectedDataEntryPatient, setSelectedDataEntryPatient] = useState<any>(null);
  const [showDataEntryModal, setShowDataEntryModal] = useState(false);
  const [intakePatients, setIntakePatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const loadIntakePatients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/intake/patients");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch patients: ${response.status}`);
      }
      const data = await response.json();
      console.log("[Intake Queue] Loaded patients:", {
        count: data.length,
        patients: data.map((p: any) => ({
          name: p.name,
          stage: p.currentStage,
          status: p.admissionStatus
        }))
      });
      setIntakePatients(data || []);
      setError(null);
    } catch (err) {
      console.error("[v0] Error loading intake patients:", err);
      setError(err instanceof Error ? err.message : "Failed to load patients");
      setIntakePatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntakePatients();

    // Listen for intake completion events to refresh the queue
    const handleIntakeCompleted = () => {
      console.log("[Intake Queue] Intake completed, refreshing queue...");
      loadIntakePatients();
    };

    window.addEventListener("intake-completed", handleIntakeCompleted);

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data = await response.json();
          const unreadCount =
            data.notifications?.filter((n: any) => !n.is_read).length || 0;
          setNotificationCount(unreadCount);
        }
      } catch (err) {
        console.error("[v0] Error loading notifications:", err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      window.removeEventListener("intake-completed", handleIntakeCompleted);
      clearInterval(interval);
    };
  }, []);

  const queueStages = [
    {
      id: "data-entry",
      name: "Data Entry",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      id: "eligibility",
      name: "Eligibility Check",
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      id: "tech-onboarding",
      name: "Tech Onboarding",
      icon: Users,
      color: "bg-cyan-500",
    },
    {
      id: "consent-forms",
      name: "Consent Forms",
      icon: FileText,
      color: "bg-amber-500",
    },
    {
      id: "collector-queue",
      name: "Collector Queue",
      icon: TestTube,
      color: "bg-purple-500",
    },
    {
      id: "nurse-queue",
      name: "Nurse Queue",
      icon: Stethoscope,
      color: "bg-teal-500",
    },
    {
      id: "counselor-queue",
      name: "Counselor Queue",
      icon: Brain,
      color: "bg-orange-500",
    },
    {
      id: "doctor-queue",
      name: "Doctor Queue",
      icon: UserCheck,
      color: "bg-red-500",
    },
    { id: "dosing", name: "Dosing", icon: Pill, color: "bg-indigo-500" },
  ];

  const getStageInfo = (stageId: string) => {
    return queueStages.find((stage) => stage.id === stageId) || queueStages[0];
  };

  const getPriorityBadge = (priority: string) => {
    return (
      <Badge variant={priority === "urgent" ? "destructive" : "outline"}>
        {priority}
      </Badge>
    );
  };

  const getStagePatients = (stageId: string) => {
    return intakePatients.filter((patient) =>
      stageId === "all" ? true : patient.currentStage === stageId
    );
  };

  const filteredPatients = intakePatients.filter((patient) =>
    searchTerm
      ? patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.includes(searchTerm)
      : true
  );

  const handleMoveToNextStage = (patient: any) => {
    // Open the data entry modal for all patients to view their complete data entry documents
    // The patientId is the UUID from the API, which is what the modal needs
    if (patient.patientId) {
      setSelectedDataEntryPatient(patient);
      setShowDataEntryModal(true);
    } else {
      console.warn(`Patient ${patient.id} missing patientId (UUID)`);
    }
  };

  const handleCollectUDS = (patientId: string) => {
    const patient = intakePatients.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      setShowUDSModal(true);
    }
  };

  const handleUDSComplete = (results: any) => {
    console.log(`UDS completed for patient ${selectedPatient?.id}:`, results);
  };

  const handleNewIntake = () => {
    router.push("/intake");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading intake queue...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                Patient Intake Queue
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage patient admission workflow from entry to dosing
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleNotifications}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
              <Button size="sm" onClick={handleNewIntake}>
                <FileText className="mr-2 h-4 w-4" />
                New Intake
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                {error} - Showing cached data
              </p>
            </div>
          )}

          {/* Queue Stage Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-8">
            {queueStages.map((stage) => {
              const stagePatients = getStagePatients(stage.id);
              const IconComponent = stage.icon;
              return (
                <Card
                  key={stage.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedStage === stage.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedStage(stage.id)}>
                  <CardContent className="p-4 text-center">
                    <div
                      className={`w-12 h-12 rounded-lg ${stage.color} flex items-center justify-center mx-auto mb-2`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-sm mb-1">{stage.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {stagePatients.length} patients
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 items-center mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search patients by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {queueStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Patient Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedStage === "all"
                  ? "All Intake Patients"
                  : getStageInfo(selectedStage).name}
                <Badge variant="secondary">
                  {selectedStage === "all"
                    ? filteredPatients.length
                    : getStagePatients(selectedStage).length}{" "}
                  patients
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(selectedStage === "all"
                  ? filteredPatients
                  : getStagePatients(selectedStage)
                ).map((patient) => {
                  const stageInfo = getStageInfo(patient.currentStage);
                  const IconComponent = stageInfo.icon;
                  return (
                    <div
                      key={patient.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {patient.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-lg">
                                {patient.name}
                              </h3>
                              <Badge variant="outline">{patient.id}</Badge>
                              {getPriorityBadge(patient.priority)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{patient.age}y</span>
                              <span>{patient.phone}</span>
                              <span>Entry: {patient.entryTime}</span>
                              <span>Wait: {patient.estimatedWait}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${stageInfo.color}`}>
                                <IconComponent className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm font-medium">
                                {stageInfo.name}
                              </span>
                              {patient.eligibilityStatus === "approved" && (
                                <Badge variant="default" className="text-xs">
                                  Eligible
                                </Badge>
                              )}
                              {patient.hasRecentVitals && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  <Activity className="h-3 w-3 mr-1" />
                                  Vitals: {patient.lastVitalsDate}
                                  {patient.lastVitalsTime && ` ${patient.lastVitalsTime}`}
                                </Badge>
                              )}
                            </div>
                            {patient.alerts && patient.alerts.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <div className="flex gap-1">
                                  {patient.alerts.map(
                                    (alert: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="destructive"
                                        className="text-xs">
                                        {alert}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {patient.currentStage === "collector-queue" && (
                            <Button
                              size="sm"
                              onClick={() => handleCollectUDS(patient.id)}
                              className="bg-purple-500 hover:bg-purple-600">
                              <TestTube className="mr-2 h-4 w-4" />
                              Collect UDS
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveToNextStage(patient)}>
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(selectedStage === "all"
                  ? filteredPatients
                  : getStagePatients(selectedStage)
                ).length === 0 && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No patients in queue
                    </h3>
                    <p className="text-muted-foreground">
                      Patients will appear here when they enter the intake
                      process
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* UDS Collection Modal */}
      {selectedPatient && (
        <UDSCollectionModal
          isOpen={showUDSModal}
          onClose={() => setShowUDSModal(false)}
          patient={selectedPatient}
          onComplete={handleUDSComplete}
        />
      )}

      {/* Patient Data Entry Modal */}
      {selectedDataEntryPatient && selectedDataEntryPatient.patientId && (
        <PatientDataEntryModal
          isOpen={showDataEntryModal}
          onClose={() => {
            setShowDataEntryModal(false);
            setSelectedDataEntryPatient(null);
          }}
          patientId={selectedDataEntryPatient.patientId}
          patient={{
            name: selectedDataEntryPatient.name,
            id: selectedDataEntryPatient.patientId,
            age: selectedDataEntryPatient.age,
            phone: selectedDataEntryPatient.phone,
            email: selectedDataEntryPatient.email,
          }}
        />
      )}
    </div>
  );
}
