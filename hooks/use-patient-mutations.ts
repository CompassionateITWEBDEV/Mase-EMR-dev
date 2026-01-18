/**
 * Custom hooks for patient mutations (create, update, delete)
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Patient, PatientFormData } from "@/types/patient";
import type { MutationResponse, PatientDetailResponse } from "@/types/api";
import { patientKeys } from "@/lib/utils/query-keys";
import { formDataToPatient } from "@/types/patient";

/**
 * Create a new patient
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation<MutationResponse<Patient>, Error, PatientFormData>({
    mutationFn: async (formData: PatientFormData) => {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formDataToPatient(formData)),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create patient");
      }

      return { success: true, data: data.patient };
    },
    onSuccess: () => {
      // Invalidate patient lists to refetch
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: patientKeys.stats() });
      toast.success("Patient created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create patient");
    },
  });
}

/**
 * Update an existing patient
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation<
    MutationResponse<Patient>,
    Error,
    { id: string; data: PatientFormData }
  >({
    mutationFn: async ({ id, data }: { id: string; data: PatientFormData }) => {
      const response = await fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formDataToPatient(data, id),
          updated_at: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update patient");
      }

      return { success: true, data: result.patient };
    },
    onSuccess: (
      _: MutationResponse<Patient>,
      variables: { id: string; data: PatientFormData }
    ) => {
      // Invalidate specific patient and lists
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: patientKeys.stats() });
      toast.success("Patient updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update patient");
    },
  });
}

/**
 * Delete a patient
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation<MutationResponse, Error, string>({
    mutationFn: async (patientId: string) => {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete patient");
      }

      return { success: true, message: "Patient deleted successfully" };
    },
    onSuccess: (_: MutationResponse, patientId: string) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: patientKeys.detail(patientId) });
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: patientKeys.stats() });
      toast.success("Patient deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete patient");
    },
  });
}
