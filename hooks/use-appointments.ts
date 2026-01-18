/**
 * Custom hook for fetching appointments and schedule data
 * Retrieves appointment lists with optional filtering
 *
 * NOTE: The /api/appointments endpoint will be created in Phase 3.
 * This hook is structured to work with the planned API.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentKeys } from "@/lib/utils/query-keys";
import type {
  AppointmentRecord,
  ScheduleFilters,
  ScheduleSummary,
  AppointmentsResponse,
} from "@/types/schedule";

/**
 * Options for useAppointments hook
 */
interface UseAppointmentsOptions {
  /** Filters to apply to the query */
  filters?: ScheduleFilters;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Fetches appointments with optional filtering
 *
 * @param options - Hook options including filters and enabled flag
 * @returns React Query result with appointments data
 *
 * @example
 * ```tsx
 * // Fetch all appointments
 * const { data, isLoading } = useAppointments();
 *
 * // Fetch with filters
 * const { data } = useAppointments({
 *   filters: {
 *     date: '2024-01-15',
 *     providerId: 'provider-uuid',
 *     status: ['scheduled', 'confirmed']
 *   }
 * });
 * ```
 *
 * @remarks
 * API endpoint /api/appointments will be created in Phase 3
 */
export function useAppointments(options: UseAppointmentsOptions = {}) {
  const { filters, enabled = true } = options;

  return useQuery<AppointmentsResponse>({
    queryKey: appointmentKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.date) {
        params.append("date", filters.date);
      }
      if (filters?.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters?.providerId) {
        params.append("providerId", filters.providerId);
      }
      if (filters?.patientId) {
        params.append("patientId", filters.patientId);
      }
      if (filters?.status) {
        const statusValue = Array.isArray(filters.status)
          ? filters.status.join(",")
          : filters.status;
        params.append("status", statusValue);
      }
      if (filters?.appointmentType) {
        const typeValue = Array.isArray(filters.appointmentType)
          ? filters.appointmentType.join(",")
          : filters.appointmentType;
        params.append("type", typeValue);
      }

      const url = `/api/appointments${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch appointments");
      }

      return response.json();
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds - appointments change frequently
  });
}

/**
 * Fetches a single appointment by ID
 *
 * @param appointmentId - The appointment UUID
 * @param enabled - Whether to enable the query
 * @returns React Query result with appointment details
 */
export function useAppointment(
  appointmentId: string | null | undefined,
  enabled = true
) {
  return useQuery<{ appointment: AppointmentRecord }>({
    queryKey: appointmentKeys.detail(appointmentId || ""),
    queryFn: async () => {
      if (!appointmentId) {
        throw new Error("Appointment ID is required");
      }

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch appointment");
      }
      return response.json();
    },
    enabled: enabled && !!appointmentId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetches schedule summary for a given date
 *
 * @param date - Date string (YYYY-MM-DD format)
 * @param enabled - Whether to enable the query
 * @returns React Query result with schedule summary
 */
export function useScheduleSummary(date?: string, enabled = true) {
  return useQuery<{ summary: ScheduleSummary }>({
    queryKey: appointmentKeys.summary(date),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (date) {
        params.append("date", date);
      }
      params.append("summary", "true");

      const response = await fetch(`/api/appointments?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch schedule summary");
      }
      return response.json();
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation hook for creating a new appointment
 *
 * @returns React Query mutation for creating appointments
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    { appointment: AppointmentRecord },
    Error,
    Partial<AppointmentRecord>
  >({
    mutationFn: async (appointmentData) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create appointment");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all appointment queries to refresh the list
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.summaries() });
    },
  });
}

/**
 * Mutation hook for updating an appointment
 *
 * @returns React Query mutation for updating appointments
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    { appointment: AppointmentRecord },
    Error,
    { id: string; data: Partial<AppointmentRecord> }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update appointment");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate specific appointment and list queries
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.summaries() });
    },
  });
}

/**
 * Mutation hook for cancelling an appointment (soft delete)
 *
 * @returns React Query mutation for cancelling appointments
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; appointment: AppointmentRecord },
    Error,
    string
  >({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel appointment");
      }

      return response.json();
    },
    onSuccess: (_, appointmentId) => {
      // Invalidate specific appointment and list queries
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(appointmentId),
      });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.summaries() });
    },
  });
}
