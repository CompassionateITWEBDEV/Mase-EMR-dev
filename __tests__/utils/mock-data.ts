/**
 * Mock data for tests matching the type definitions from Phase 1
 */

import type { ScheduleItem } from "@/types/schedule";
import type { ClinicalAlert } from "@/types/clinical";
import type {
  AIRecommendation,
  DrugInteractionResult,
} from "@/types/ai-assistant";
import type {
  ClinicSpecialtyConfiguration,
  SpecialtyFeature,
} from "@/types/specialty";

// Mock Schedule Items (ScheduleItem does not have id, notes, or providerId)
export const mockScheduleItems: ScheduleItem[] = [
  {
    time: "09:00 AM",
    patient: "John Smith",
    type: "Follow-up",
    status: "scheduled",
    duration: "30 min",
    patientId: "pat-1",
  },
  {
    time: "10:00 AM",
    patient: "Jane Doe",
    type: "New Patient",
    status: "checked_in",
    duration: "60 min",
    patientId: "pat-2",
  },
  {
    time: "11:30 AM",
    patient: "Bob Johnson",
    type: "Urgent",
    status: "in_progress",
    duration: "45 min",
    patientId: "pat-3",
  },
];

// Mock Clinical Alerts (ClinicalAlert uses patient, message, priority, time, type, isAcknowledged)
export const mockClinicalAlerts: ClinicalAlert[] = [
  {
    patient: "John Smith",
    patientId: "pat-1",
    message: "Critical lab result requires immediate attention",
    priority: "high",
    time: "5 min ago",
    type: "destructive",
    isAcknowledged: false,
  },
  {
    patient: "Jane Doe",
    patientId: "pat-2",
    message: "Medication refill needed",
    priority: "medium",
    time: "10 min ago",
    type: "warning",
    isAcknowledged: false,
  },
  {
    patient: "Bob Johnson",
    patientId: "pat-3",
    message: "Routine follow-up scheduled",
    priority: "low",
    time: "30 min ago",
    type: "info",
    isAcknowledged: true,
  },
];

// Mock AI Recommendations (AIRecommendation is a complex object with summary, riskAlerts, etc.)
export const mockAIRecommendations: AIRecommendation[] = [
  {
    summary: "Patient is a 54-year-old with well-controlled hypertension",
    riskAlerts: [
      { type: "warning", message: "Annual physical overdue by 30 days" },
    ],
    recommendations: [
      {
        category: "Preventive Care",
        color: "border-blue-500",
        text: "Schedule annual wellness visit",
      },
    ],
    drugInteractions: {
      status: "no_major",
      message: "No major drug interactions detected",
    },
    labOrders: [
      { test: "Lipid Panel", reason: "Annual screening", urgency: "Routine" },
    ],
    differentialDiagnosis: [],
    preventiveGaps: [
      {
        measure: "Annual Physical",
        status: "overdue",
        days: 30,
        action: "Schedule appointment",
      },
    ],
    educationTopics: ["Medication adherence", "Diet and exercise"],
  },
  {
    summary: "Patient is a 45-year-old with type 2 diabetes",
    riskAlerts: [{ type: "destructive", message: "HbA1c elevated at 8.2%" }],
    recommendations: [
      {
        category: "Diabetes Management",
        color: "border-red-500",
        text: "Consider medication adjustment",
      },
    ],
    drugInteractions: {
      status: "minor",
      message: "Minor interaction detected",
      interactions: [
        {
          drug1: "Metformin",
          drug2: "Lisinopril",
          severity: "minor",
          description: "Monitor kidney function",
          action: "Regular monitoring",
        },
      ],
    },
    labOrders: [
      { test: "HbA1c", reason: "Diabetes monitoring", urgency: "This week" },
    ],
    differentialDiagnosis: [],
    preventiveGaps: [],
    educationTopics: ["Blood sugar monitoring", "Diabetic diet"],
  },
];

// Mock Drug Interactions (DrugInteractionResult has status, message, interactions)
export const mockDrugInteractions: DrugInteractionResult[] = [
  {
    status: "major",
    message: "Major drug interaction detected",
    interactions: [
      {
        drug1: "Warfarin",
        drug2: "Aspirin",
        severity: "major",
        description: "May increase anticoagulant effect and risk of bleeding",
        action: "Avoid combination if possible; monitor closely if necessary",
      },
    ],
  },
  {
    status: "minor",
    message: "Minor drug interaction detected",
    interactions: [
      {
        drug1: "Lisinopril",
        drug2: "Potassium",
        severity: "moderate",
        description: "May increase risk of hyperkalemia",
        action: "Monitor potassium levels regularly",
      },
    ],
  },
];

// Mock Specialty Configurations
export const mockSpecialtyConfigurations: ClinicSpecialtyConfiguration[] = [
  {
    id: "spec-1",
    clinic_id: "clinic-1",
    specialty_id: "primary-care",
    enabled: true,
    configured_at: new Date().toISOString(),
    configured_by: "admin",
    created_at: new Date().toISOString(),
  },
  {
    id: "spec-2",
    clinic_id: "clinic-1",
    specialty_id: "behavioral-health",
    enabled: true,
    configured_at: new Date().toISOString(),
    configured_by: "admin",
    created_at: new Date().toISOString(),
  },
];

// Mock Specialty Features
export const mockSpecialtyFeatures: SpecialtyFeature[] = [
  {
    id: "feat-1",
    specialty_id: "primary-care",
    feature_code: "icd10",
    feature_name: "ICD-10 Diagnosis Coding",
    description: "Support for ICD-10 diagnosis codes",
    is_core_feature: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "feat-2",
    specialty_id: "primary-care",
    feature_code: "vitals",
    feature_name: "Vitals Trending",
    description: "Track and trend patient vitals",
    is_core_feature: true,
    created_at: new Date().toISOString(),
  },
];
