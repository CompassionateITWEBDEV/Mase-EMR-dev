/**
 * Query Keys for React Query
 * Centralized query key factory for consistent cache management
 */

import type { ScheduleFilters } from "@/types/schedule";

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (filters?: object) => [...patientKeys.lists(), { filters }] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  stats: () => [...patientKeys.all, "stats"] as const,
  search: (query: string) => [...patientKeys.all, "search", query] as const,
};

/**
 * Specialty configuration query keys
 */
export const specialtyKeys = {
  all: ["specialty"] as const,
  configs: () => [...specialtyKeys.all, "config"] as const,
  config: (specialtyId?: string) =>
    [...specialtyKeys.configs(), specialtyId] as const,
  features: () => [...specialtyKeys.all, "features"] as const,
};

/**
 * Quality measures query keys
 */
export const qualityMeasureKeys = {
  all: ["quality-measures"] as const,
  lists: () => [...qualityMeasureKeys.all, "list"] as const,
  list: (filters?: { specialty?: string; year?: string }) =>
    [...qualityMeasureKeys.lists(), { filters }] as const,
  tracking: () => [...qualityMeasureKeys.all, "tracking"] as const,
};

/**
 * Appointment/schedule query keys
 */
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters?: ScheduleFilters) =>
    [...appointmentKeys.lists(), { filters }] as const,
  detail: (id: string) => [...appointmentKeys.all, "detail", id] as const,
  summaries: () => [...appointmentKeys.all, "summary"] as const,
  summary: (date?: string) =>
    [...appointmentKeys.summaries(), date] as const,
};

/**
 * Clinical alerts query keys
 */
export const clinicalAlertKeys = {
  all: ["clinical-alerts"] as const,
  lists: () => [...clinicalAlertKeys.all, "list"] as const,
  list: (patientId?: string) =>
    [...clinicalAlertKeys.lists(), { patientId }] as const,
  detail: (id: string) => [...clinicalAlertKeys.all, "detail", id] as const,
  unacknowledged: () => [...clinicalAlertKeys.all, "unacknowledged"] as const,
};

/**
 * AI Assistant query keys
 */
export const aiAssistantKeys = {
  all: ["ai-assistant"] as const,
  recommendations: () => [...aiAssistantKeys.all, "recommendations"] as const,
  recommendation: (patientId: string) =>
    [...aiAssistantKeys.recommendations(), patientId] as const,
  drugInteractions: (patientId: string) =>
    [...aiAssistantKeys.all, "drug-interactions", patientId] as const,
};

/**
 * Billing codes query keys
 */
export const billingKeys = {
  all: ["billing-codes"] as const,
  codes: (specialty?: string) =>
    [...billingKeys.all, "codes", { specialty }] as const,
};

/**
 * Assessment tools query keys
 */
export const assessmentKeys = {
  all: ["assessment-tools"] as const,
};
