"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  AlertTriangle,
  Calendar,
  Phone,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { EditPatientDialog } from "./edit-patient-dialog";
import { DeletePatientDialog } from "./delete-patient-dialog";
import type { PatientWithRelations } from "@/types/patient";

interface PatientListProps {
  patients: PatientWithRelations[];
  currentProviderId: string;
  showFilters?: boolean;
  onPatientUpdated?: () => void;
  onPatientDeleted?: () => void;
}

export function PatientList({
  patients,
  currentProviderId,
  showFilters = true,
  onPatientUpdated,
  onPatientDeleted,
}: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [programTypeFilter, setProgramTypeFilter] = useState("all");

  // Helper functions
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

  const getPatientRiskLevel = (patient: PatientWithRelations) => {
    const latestAssessment = patient.assessments?.[0];
    if (
      latestAssessment?.risk_assessment &&
      typeof latestAssessment.risk_assessment === "object"
    ) {
      return latestAssessment.risk_assessment.level || "low";
    }
    return "low";
  };

  const getPatientStatus = (patient: PatientWithRelations) => {
    const hasRecentAppointment = patient.appointments?.some((apt: { appointment_date: string }) => {
      const aptDate = new Date(apt.appointment_date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return aptDate > weekAgo;
    });

    const riskLevel = getPatientRiskLevel(patient);

    if (riskLevel === "high") return "High Risk";
    if (!hasRecentAppointment) return "Assessment Due";
    return "Active";
  };

  const getLastVisit = (patient: PatientWithRelations) => {
    const lastAppointment = patient.appointments?.[0];
    if (lastAppointment) {
      const date = new Date(lastAppointment.appointment_date);
      return date.toLocaleDateString();
    }
    return "No visits";
  };

  const getCurrentMedication = (patient: PatientWithRelations) => {
    const activeMed = patient.medications?.find(
      (med: { status: string }) => med.status === "active"
    );
    return activeMed
      ? `${activeMed.medication_name} ${activeMed.dosage}`
      : "No active medications";
  };

  // Helper function to get program type display name
  const getProgramTypeDisplay = (programType: string | null | undefined): string => {
    if (!programType) return "OTP";
    const normalized = programType.toLowerCase().trim();
    if (normalized === "otp") return "OTP";
    if (normalized === "mat") return "MAT";
    if (normalized === "primary_care" || normalized === "primary care") return "Primary Care";
    if (normalized === "sub") return "SUB";
    if (normalized === "beh") return "BEH";
    // For custom program types, return as-is (capitalized)
    return programType.charAt(0).toUpperCase() + programType.slice(1).toLowerCase();
  };

  // Filter patients based on search and filters
  const filteredPatients = patients
    .filter((patient) => {
      const matchesSearch =
        searchTerm === "" ||
        `${patient.first_name} ${patient.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (patient.phone || "").includes(searchTerm) ||
        (patient.client_number || "").toLowerCase().includes(searchTerm.toLowerCase());

      const patientStatus = getPatientStatus(patient);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && patientStatus === "Active") ||
        (statusFilter === "high-risk" && patientStatus === "High Risk") ||
        (statusFilter === "assessment-due" && patientStatus === "Assessment Due");

      const patientRisk = getPatientRiskLevel(patient);
      const matchesRisk = riskFilter === "all" || patientRisk === riskFilter;

      const patientProgramType = patient.program_type?.toLowerCase().trim() || "otp";
      const matchesProgramType =
        programTypeFilter === "all" ||
        (programTypeFilter === "otp" && patientProgramType === "otp") ||
        (programTypeFilter === "mat" && patientProgramType === "mat") ||
        (programTypeFilter === "primary_care" && (patientProgramType === "primary_care" || patientProgramType === "primary care")) ||
        (programTypeFilter === "sub" && patientProgramType === "sub") ||
        (programTypeFilter === "beh" && patientProgramType === "beh") ||
        (programTypeFilter === "custom" && patientProgramType !== "otp" && patientProgramType !== "mat" && patientProgramType !== "primary_care" && patientProgramType !== "primary care" && patientProgramType !== "sub" && patientProgramType !== "beh");

      return matchesSearch && matchesStatus && matchesRisk && matchesProgramType;
    })
    .sort((a, b) => {
      // Sort by program type first, then by patient number
      const aProgramType = a.program_type?.toLowerCase().trim() || "otp";
      const bProgramType = b.program_type?.toLowerCase().trim() || "otp";
      
      // Program type order: OTP, MAT, Primary Care, SUB, BEH, then custom types
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
      
      // Then sort by patient number
      const aNumber = a.client_number || "";
      const bNumber = b.client_number || "";
      return aNumber.localeCompare(bNumber);
    });

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search patients by name, ID, or phone..."
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={programTypeFilter} onValueChange={setProgramTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Program Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="otp">OTP</SelectItem>
              <SelectItem value="mat">MAT</SelectItem>
              <SelectItem value="primary_care">Primary Care</SelectItem>
              <SelectItem value="sub">SUB</SelectItem>
              <SelectItem value="beh">BEH</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="high-risk">High Risk</SelectItem>
              <SelectItem value="assessment-due">Assessment Due</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Patient List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Database
              <Badge variant="secondary">
                {filteredPatients.length} patients
              </Badge>
            </CardTitle>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients by name, ID, or phone..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8">
                {patients.length === 0 ? (
                  <div className="space-y-2">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-lg font-medium text-foreground">No patients in database</p>
                    <p className="text-sm text-muted-foreground">
                      Get started by adding your first patient using the "Add Patient" button above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-lg font-medium text-foreground">No patients found</p>
                    <p className="text-sm text-muted-foreground">
                      No patients match your current search or filter criteria. Try adjusting your filters or search terms.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const riskLevel = getPatientRiskLevel(patient);
                const status = getPatientStatus(patient);
                const age = getPatientAge(patient.date_of_birth);
                const lastVisit = getLastVisit(patient);
                const currentMedication = getCurrentMedication(patient);

                return (
                  <div
                    key={patient.id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {patient.first_name[0]}
                            {patient.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-lg">
                              {patient.first_name} {patient.last_name}
                            </h3>
                            {patient.client_number && (
                              <Badge variant="secondary" className="text-xs font-mono">
                                #{patient.client_number}
                              </Badge>
                            )}
                            {patient.program_type && (
                              <Badge variant="outline" className="text-xs">
                                {getProgramTypeDisplay(patient.program_type)}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                riskLevel === "high"
                                  ? "destructive"
                                  : riskLevel === "medium"
                                  ? "secondary"
                                  : "outline"
                              }>
                              {riskLevel} Risk
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {age}y • {patient.gender || "N/A"}
                            </span>
                            <span>{patient.phone || "N/A"}</span>
                            <span>{patient.insurance_provider || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              <strong>Last Visit:</strong> {lastVisit}
                            </span>
                            <span>
                              <strong>Medication:</strong> {currentMedication}
                            </span>
                          </div>
                          {status === "High Risk" && (
                            <div className="flex items-center gap-2 mt-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <Badge variant="destructive" className="text-xs">
                                Requires immediate attention
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            status === "Active"
                              ? "default"
                              : status === "High Risk"
                              ? "destructive"
                              : "secondary"
                          }>
                          {status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <EditPatientDialog 
                            patient={{
                              id: patient.id,
                              first_name: patient.first_name,
                              last_name: patient.last_name,
                              date_of_birth: patient.date_of_birth,
                              gender: patient.gender || "",
                              phone: patient.phone || "",
                              email: patient.email || "",
                              address: patient.address ?? undefined,
                              emergency_contact_name: patient.emergency_contact_name ?? undefined,
                              emergency_contact_phone: patient.emergency_contact_phone ?? undefined,
                              insurance_provider: patient.insurance_provider ?? undefined,
                              insurance_id: patient.insurance_id ?? undefined,
                              program_type: patient.program_type ?? undefined,
                            }}
                            onSuccess={onPatientUpdated}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </EditPatientDialog>
                          <DeletePatientDialog
                            patientId={patient.id}
                            patientName={`${patient.first_name} ${patient.last_name}`}
                            onSuccess={onPatientDeleted}>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeletePatientDialog>
                          <Link href={`/patients/${patient.id}`}>
                            <Button size="sm">View Chart</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
