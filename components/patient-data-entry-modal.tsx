"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Pill,
  FileText,
  Stethoscope,
  ClipboardList,
  TestTube,
  Calendar,
  User,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { VitalSign, Medication, Assessment, ProgressNote } from "@/types/patient";

interface PatientDataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patient?: {
    name: string;
    id: string;
    age?: number;
    phone?: string;
    email?: string;
  };
}

interface PatientData {
  patient: any;
  vitalSigns: VitalSign[];
  medications: Medication[];
  assessments: Assessment[];
  encounters: any[];
  dosingLog: any[];
  consents: any[];
  udsResults: any[];
  progressNotes: ProgressNote[];
  courtOrders: any[];
}

export function PatientDataEntryModal({
  isOpen,
  onClose,
  patientId,
  patient,
}: PatientDataEntryModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PatientData | null>(null);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientData();
    }
  }, [isOpen, patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch patient data: ${response.status}`);
      }
      const patientData = await response.json();
      setData(patientData);
    } catch (err) {
      console.error("[Patient Data Entry Modal] Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load patient data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullChart = () => {
    router.push(`/patients/${patientId}`);
    onClose();
  };

  const isCriticalVital = (vital: VitalSign) => {
    return (
      (vital.blood_pressure_systolic &&
        (vital.blood_pressure_systolic > 180 || vital.blood_pressure_systolic < 90)) ||
      (vital.blood_pressure_diastolic &&
        (vital.blood_pressure_diastolic > 120 || vital.blood_pressure_diastolic < 60)) ||
      (vital.heart_rate && (vital.heart_rate > 120 || vital.heart_rate < 50)) ||
      (vital.oxygen_saturation && vital.oxygen_saturation < 90) ||
      (vital.temperature && (vital.temperature > 101 || vital.temperature < 95))
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[98vw] sm:max-w-[95vw] sm:w-[95vw] lg:max-w-[90vw] lg:w-[90vw] xl:max-w-[85vw] xl:w-[85vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Patient Data Entry -{" "}
            {patient?.name ||
              `${data?.patient?.first_name || ""} ${data?.patient?.last_name || ""}`.trim() ||
              "Patient"}
          </DialogTitle>
          <DialogDescription>
            View all patient data entry information including vital signs, medications,
            assessments, and documents.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading patient data...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <p className="font-medium">Error loading data</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPatientData} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && data && (
          <Tabs defaultValue="demographics" className="w-full">
            <TabsList className="flex flex-wrap w-full gap-2 p-2">
              <TabsTrigger value="demographics" className="flex-1 min-w-[120px] text-xs sm:text-sm px-3 py-2">Demographics</TabsTrigger>
              <TabsTrigger value="vitals" className="flex-1 min-w-[120px] text-xs sm:text-sm px-3 py-2">Vital Signs</TabsTrigger>
              <TabsTrigger value="medications" className="flex-1 min-w-[120px] text-xs sm:text-sm px-3 py-2">Medications</TabsTrigger>
              <TabsTrigger value="assessments" className="flex-1 min-w-[120px] text-xs sm:text-sm px-3 py-2">Assessments</TabsTrigger>
              <TabsTrigger value="encounters" className="flex-1 min-w-[120px] text-xs sm:text-sm px-3 py-2">Encounters</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 min-w-[120px] text-xs sm:text-sm px-3 py-2">Documents</TabsTrigger>
              <TabsTrigger value="uds" className="flex-1 min-w-[120px] text-xs sm:text-sm px-3 py-2">UDS Results</TabsTrigger>
              <TabsTrigger value="dosing" className="flex-1 min-w-[120px] text-xs sm:text-sm px-3 py-2">Dosing Log</TabsTrigger>
              <TabsTrigger value="consents" className="flex-1 min-w-[120px] text-xs sm:text-sm px-3 py-2">Consents</TabsTrigger>
            </TabsList>

            {/* Demographics Tab */}
            <TabsContent value="demographics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {data.patient?.first_name} {data.patient?.last_name}
                      </p>
                    </div>
                    {data.patient?.date_of_birth && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">{formatDate(data.patient.date_of_birth)}</p>
                      </div>
                    )}
                    {data.patient?.gender && (
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium">{data.patient.gender}</p>
                      </div>
                    )}
                    {data.patient?.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{data.patient.phone}</p>
                      </div>
                    )}
                    {data.patient?.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{data.patient.email}</p>
                      </div>
                    )}
                    {data.patient?.address && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{data.patient.address}</p>
                      </div>
                    )}
                    {data.patient?.client_number && (
                      <div>
                        <p className="text-sm text-muted-foreground">Client Number</p>
                        <p className="font-medium">{data.patient.client_number}</p>
                      </div>
                    )}
                    {data.patient?.insurance_provider && (
                      <div>
                        <p className="text-sm text-muted-foreground">Insurance Provider</p>
                        <p className="font-medium">{data.patient.insurance_provider}</p>
                      </div>
                    )}
                    {data.patient?.insurance_id && (
                      <div>
                        <p className="text-sm text-muted-foreground">Insurance ID</p>
                        <p className="font-medium">{data.patient.insurance_id}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vital Signs Tab */}
            <TabsContent value="vitals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Vital Signs
                    <Badge variant="secondary">{data.vitalSigns?.length || 0} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.vitalSigns && data.vitalSigns.length > 0 ? (
                    <div className="space-y-3">
                      {data.vitalSigns.map((vital) => {
                        const isCritical = isCriticalVital(vital);
                        return (
                          <div
                            key={vital.id}
                            className={`flex items-start justify-between p-4 border rounded-lg ${
                              isCritical ? "border-red-300 bg-red-50" : "border-border"
                            }`}>
                            <div className="flex items-start gap-3 flex-1">
                              <Activity
                                className={`h-5 w-5 mt-0.5 ${
                                  isCritical ? "text-red-600" : "text-blue-600"
                                }`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium">
                                    {formatDate(vital.measurement_date)}
                                  </p>
                                  {isCritical && <Badge variant="destructive">Critical</Badge>}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  {vital.blood_pressure_systolic &&
                                    vital.blood_pressure_diastolic && (
                                      <div>
                                        <span className="font-medium text-muted-foreground">
                                          BP:{" "}
                                        </span>
                                        <span
                                          className={
                                            isCritical
                                              ? "font-bold text-red-700"
                                              : "font-medium"
                                          }>
                                          {vital.blood_pressure_systolic}/
                                          {vital.blood_pressure_diastolic} mmHg
                                        </span>
                                      </div>
                                    )}
                                  {vital.heart_rate && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        HR:{" "}
                                      </span>
                                      <span
                                        className={
                                          isCritical
                                            ? "font-bold text-red-700"
                                            : "font-medium"
                                        }>
                                        {vital.heart_rate} bpm
                                      </span>
                                    </div>
                                  )}
                                  {vital.temperature && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Temp:{" "}
                                      </span>
                                      <span
                                        className={
                                          isCritical
                                            ? "font-bold text-red-700"
                                            : "font-medium"
                                        }>
                                        {vital.temperature}°F
                                      </span>
                                    </div>
                                  )}
                                  {vital.oxygen_saturation && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        O2 Sat:{" "}
                                      </span>
                                      <span
                                        className={
                                          isCritical
                                            ? "font-bold text-red-700"
                                            : "font-medium"
                                        }>
                                        {vital.oxygen_saturation}%
                                      </span>
                                    </div>
                                  )}
                                  {vital.weight && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Weight:{" "}
                                      </span>
                                      <span className="font-medium">{vital.weight} lbs</span>
                                    </div>
                                  )}
                                  {vital.height && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Height:{" "}
                                      </span>
                                      <span className="font-medium">{vital.height} in</span>
                                    </div>
                                  )}
                                  {vital.respiratory_rate && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        RR:{" "}
                                      </span>
                                      <span className="font-medium">
                                        {vital.respiratory_rate} /min
                                      </span>
                                    </div>
                                  )}
                                  {vital.bmi && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        BMI:{" "}
                                      </span>
                                      <span className="font-medium">{vital.bmi}</span>
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
                    <p className="text-center text-muted-foreground py-8">
                      No vital signs recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Medications Tab */}
            <TabsContent value="medications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Medications
                    <Badge variant="secondary">{data.medications?.length || 0} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.medications && data.medications.length > 0 ? (
                    <div className="space-y-3">
                      {data.medications.map((med) => (
                        <div key={med.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">{med.medication_name}</p>
                                <Badge
                                  variant={
                                    med.status === "active"
                                      ? "default"
                                      : med.status === "discontinued"
                                        ? "destructive"
                                        : "secondary"
                                  }>
                                  {med.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium">Dosage: </span>
                                  {med.dosage || "N/A"}
                                </div>
                                {med.frequency && (
                                  <div>
                                    <span className="font-medium">Frequency: </span>
                                    {med.frequency}
                                  </div>
                                )}
                                {med.start_date && (
                                  <div>
                                    <span className="font-medium">Start Date: </span>
                                    {formatDate(med.start_date)}
                                  </div>
                                )}
                                {med.end_date && (
                                  <div>
                                    <span className="font-medium">End Date: </span>
                                    {formatDate(med.end_date)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No medications recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessments Tab */}
            <TabsContent value="assessments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Assessments
                    <Badge variant="secondary">{data.assessments?.length || 0} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.assessments && data.assessments.length > 0 ? (
                    <div className="space-y-3">
                      {data.assessments.map((assessment) => (
                        <div
                          key={assessment.id}
                          className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">{assessment.assessment_type}</p>
                                <Badge variant="outline">
                                  {formatDate(assessment.assessment_date)}
                                </Badge>
                              </div>
                              {assessment.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {assessment.notes}
                                </p>
                              )}
                              {assessment.scores &&
                                Object.keys(assessment.scores).length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium mb-1">Scores:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(assessment.scores).map(([key, value]) => (
                                        <Badge key={key} variant="secondary" className="text-xs">
                                          {key}: {String(value)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No assessments recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Encounters Tab */}
            <TabsContent value="encounters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Encounters
                    <Badge variant="secondary">{data.encounters?.length || 0} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.encounters && data.encounters.length > 0 ? (
                    <div className="space-y-3">
                      {data.encounters.map((encounter) => (
                        <div
                          key={encounter.id}
                          className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">
                                  {encounter.encounter_type || "Encounter"}
                                </p>
                                <Badge variant="outline">
                                  {formatDate(encounter.encounter_date)}
                                </Badge>
                              </div>
                              {encounter.chief_complaint && (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Chief Complaint: </span>
                                  {encounter.chief_complaint}
                                </p>
                              )}
                              {encounter.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {encounter.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No encounters recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                    <Badge variant="secondary">
                      {(data.progressNotes?.length || 0) + (data.courtOrders?.length || 0)}{" "}
                      records
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.progressNotes && data.progressNotes.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Progress Notes</h4>
                        <div className="space-y-3">
                          {data.progressNotes.map((note) => (
                            <div key={note.id} className="p-4 border border-border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">{note.note_type}</p>
                                <Badge variant="outline">{formatDate(note.note_date)}</Badge>
                              </div>
                              {note.subjective && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Subjective:
                                  </p>
                                  <p className="text-sm">{note.subjective}</p>
                                </div>
                              )}
                              {note.objective && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Objective:
                                  </p>
                                  <p className="text-sm">{note.objective}</p>
                                </div>
                              )}
                              {note.assessment && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Assessment:
                                  </p>
                                  <p className="text-sm">{note.assessment}</p>
                                </div>
                              )}
                              {note.plan && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-muted-foreground">Plan:</p>
                                  <p className="text-sm">{note.plan}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.courtOrders && data.courtOrders.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Court Orders</h4>
                        <div className="space-y-3">
                          {data.courtOrders.map((order) => (
                            <div key={order.id} className="p-4 border border-border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">
                                  {order.document_type || "Court Order"}
                                </p>
                                <Badge variant="outline">{formatDate(order.document_date)}</Badge>
                              </div>
                              {order.notes && (
                                <p className="text-sm text-muted-foreground">{order.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(!data.progressNotes || data.progressNotes.length === 0) &&
                      (!data.courtOrders || data.courtOrders.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          No documents recorded
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* UDS Results Tab */}
            <TabsContent value="uds" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Urine Drug Screen Results
                    <Badge variant="secondary">{data.udsResults?.length || 0} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.udsResults && data.udsResults.length > 0 ? (
                    <div className="space-y-3">
                      {data.udsResults.map((uds) => (
                        <div key={uds.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{formatDate(uds.collection_date)}</Badge>
                                {uds.result && (
                                  <Badge
                                    variant={
                                      uds.result.toLowerCase().includes("positive")
                                        ? "destructive"
                                        : "default"
                                    }>
                                    {uds.result}
                                  </Badge>
                                )}
                              </div>
                              {uds.notes && (
                                <p className="text-sm text-muted-foreground mt-2">{uds.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No UDS results recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dosing Log Tab */}
            <TabsContent value="dosing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Dosing Log
                    <Badge variant="secondary">{data.dosingLog?.length || 0} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.dosingLog && data.dosingLog.length > 0 ? (
                    <div className="space-y-3">
                      {data.dosingLog.map((dose) => (
                        <div key={dose.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">
                                  {dose.medication_name || "Medication"}
                                </p>
                                <Badge variant="outline">{formatDate(dose.dose_date)}</Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                {dose.dose_amount && (
                                  <div>
                                    <span className="font-medium">Dose: </span>
                                    {dose.dose_amount} {dose.dose_unit || "mg"}
                                  </div>
                                )}
                                {dose.route && (
                                  <div>
                                    <span className="font-medium">Route: </span>
                                    {dose.route}
                                  </div>
                                )}
                                {dose.administered_by && (
                                  <div>
                                    <span className="font-medium">Administered By: </span>
                                    {dose.administered_by}
                                  </div>
                                )}
                              </div>
                              {dose.notes && (
                                <p className="text-sm text-muted-foreground mt-2">{dose.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No dosing records</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Consents Tab */}
            <TabsContent value="consents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Consents
                    <Badge variant="secondary">{data.consents?.length || 0} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.consents && data.consents.length > 0 ? (
                    <div className="space-y-3">
                      {data.consents.map((consent) => (
                        <div key={consent.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">
                                  {consent.consent_type || "Consent"}
                                </p>
                                <Badge variant="outline">{formatDate(consent.created_at)}</Badge>
                                {consent.status && (
                                  <Badge
                                    variant={
                                      consent.status === "signed"
                                        ? "default"
                                        : consent.status === "pending"
                                          ? "secondary"
                                          : "outline"
                                    }>
                                    {consent.status}
                                  </Badge>
                                )}
                              </div>
                              {consent.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {consent.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No consents recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!loading && !error && data && (
            <Button onClick={handleViewFullChart}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Chart
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
