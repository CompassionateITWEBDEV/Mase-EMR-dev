/**
 * Custom hook for fetching clinical alerts
 * Retrieves patient alerts for dashboard display and notifications
 *
 * NOTE: The /api/clinical-alerts endpoint will be created in Phase 3.
 * This hook is structured to work with the planned API.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clinicalAlertKeys } from "@/lib/utils/query-keys";
import type { ClinicalAlert } from "@/types/clinical";
import type { PriorityLevel } from "@/types/common";

/**
 * Response shape from /api/clinical-alerts
 */
interface ClinicalAlertsResponse {
  /** List of clinical alerts */
  alerts: ClinicalAlert[];
  /** Total count of alerts */
  total: number;
  /** Count by priority level */
  countByPriority?: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Filters for clinical alerts query
 */
interface ClinicalAlertsFilters {
  /** Filter by patient ID */
  patientId?: string;
  /** Filter by priority level */
  priority?: PriorityLevel;
  /** Filter acknowledged/unacknowledged */
  acknowledged?: boolean;
  /** Limit number of results */
  limit?: number;
}

/**
 * Options for useClinicalAlerts hook
 */
interface UseClinicalAlertsOptions {
  /** Filters to apply to the query */
  filters?: ClinicalAlertsFilters;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Fetches clinical alerts with optional filtering
 *
 * @param options - Hook options including filters and enabled flag
 * @returns React Query result with clinical alerts data
 *
 * @example
 * ```tsx
 * // Fetch all alerts
 * const { data, isLoading } = useClinicalAlerts();
 *
 * // Fetch alerts for specific patient
 * const { data } = useClinicalAlerts({
 *   filters: { patientId: 'patient-uuid' }
 * });
 *
 * // Fetch only high priority unacknowledged alerts
 * const { data } = useClinicalAlerts({
 *   filters: { priority: 'high', acknowledged: false }
 * });
 * ```
 *
 * @remarks
 * API endpoint /api/clinical-alerts will be created in Phase 3
 */
export function useClinicalAlerts(options: UseClinicalAlertsOptions = {}) {
  const { filters, enabled = true } = options;

  return useQuery<ClinicalAlertsResponse>({
    queryKey: clinicalAlertKeys.list(filters?.patientId),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.patientId) {
        params.append("patientId", filters.patientId);
      }
      if (filters?.priority) {
        params.append("priority", filters.priority);
      }
      if (filters?.acknowledged !== undefined) {
        params.append("acknowledged", String(filters.acknowledged));
      }
      if (filters?.limit) {
        params.append("limit", String(filters.limit));
      }

      const url = `/api/clinical-alerts${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch clinical alerts");
      }

      return response.json();
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds - alerts need to be relatively fresh
    refetchInterval: 60 * 1000, // Refetch every minute for dashboard
  });
}

/**
 * Fetches unacknowledged alerts for notification badges
 *
 * @param enabled - Whether to enable the query
 * @returns React Query result with unacknowledged alert count
 */
export function useUnacknowledgedAlerts(enabled = true) {
  return useQuery<ClinicalAlertsResponse>({
    queryKey: clinicalAlertKeys.unacknowledged(),
    queryFn: async () => {
      const response = await fetch("/api/clinical-alerts?acknowledged=false");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch unacknowledged alerts");
      }
      return response.json();
    },
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Mutation hook for acknowledging a clinical alert
 *
 * @returns React Query mutation for acknowledging alerts
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/clinical-alerts/${alertId}/acknowledge`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to acknowledge alert");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicalAlertKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clinicalAlertKeys.unacknowledged() });
    },
  });
}

