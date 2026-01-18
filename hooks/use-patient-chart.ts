/**
 * React Query hooks for patient chart data
 * Provides synchronized data fetching for patient chart views
 */

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { patientKeys } from "@/lib/utils/query-keys";

interface PatientChartData {
  patient: any;
  vitalSigns: any[];
  medications: any[];
  assessments: any[];
  encounters: any[];
  dosingLog: any[];
  consents: any[];
}

interface ClinicalAlerts {
  dosingHolds: any[];
  patientPrecautions: any[];
  facilityAlerts: any[];
}

/**
 * Fetch complete patient chart data
 */
export function usePatientChart(
  patientId: string | null | undefined,
  enabled = true
) {
  return useQuery<PatientChartData>({
    queryKey: [...patientKeys.detail(patientId || ""), "chart"],
    queryFn: async () => {
      if (!patientId) {
        throw new Error("Patient ID is required");
      }

      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch patient chart data");
      }

      const data = await response.json();

      // Handle both client_number and patient_number for compatibility
      const patientData = {
        ...data.patient,
        client_number:
          data.patient?.client_number || data.patient?.patient_number || null,
      };

      return {
        patient: patientData,
        vitalSigns: data.vitalSigns || [],
        medications: data.medications || [],
        assessments: data.assessments || [],
        encounters: data.encounters || [],
        dosingLog: data.dosingLog || [],
        consents: data.consents || [],
      };
    },
    enabled: enabled && !!patientId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch clinical alerts (dosing holds, precautions, facility alerts)
 */
export function useClinicalAlerts(
  patientId: string | null | undefined,
  enabled = true
) {
  return useQuery<ClinicalAlerts>({
    queryKey: [...patientKeys.detail(patientId || ""), "clinical-alerts"],
    queryFn: async () => {
      if (!patientId) {
        throw new Error("Patient ID is required");
      }

      // Fetch all clinical alerts in parallel
      const [holdsRes, precautionsRes, facilityRes] = await Promise.all([
        fetch("/api/clinical-alerts/holds"),
        fetch("/api/clinical-alerts/precautions"),
        fetch("/api/clinical-alerts/facility"),
      ]);

      // Process dosing holds - filter by patient_id and active status
      let dosingHolds: any[] = [];
      if (holdsRes.ok) {
        const holdsData = await holdsRes.json();
        dosingHolds = (holdsData.holds || []).filter(
          (hold: any) =>
            hold.patient_id === patientId && hold.status === "active"
        );
      }

      // Process patient precautions - filter by patient_id and active status
      let patientPrecautions: any[] = [];
      if (precautionsRes.ok) {
        const precautionsData = await precautionsRes.json();
        patientPrecautions = (precautionsData.precautions || []).filter(
          (precaution: any) =>
            precaution.patient_id === patientId && precaution.is_active
        );
      }

      // Process facility alerts - all active facility alerts (facility-wide)
      let facilityAlerts: any[] = [];
      if (facilityRes.ok) {
        const facilityData = await facilityRes.json();
        facilityAlerts = (facilityData.alerts || []).filter(
          (alert: any) => alert.is_active
        );
      }

      return {
        dosingHolds,
        patientPrecautions,
        facilityAlerts,
      };
    },
    enabled: enabled && !!patientId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch ASAM assessments for a patient
 */
export function usePatientAssessments(
  patientId: string | null | undefined,
  enabled = true
) {
  const { data: chartData } = usePatientChart(patientId, enabled);

  return {
    assessments: chartData?.assessments || [],
    asamAssessments: (chartData?.assessments || []).filter((a: any) =>
      a.assessment_type?.toLowerCase().includes("asam")
    ),
    isLoading: !chartData,
  };
}

/**
 * Fetch patient precautions
 */
export function usePatientPrecautions(
  patientId: string | null | undefined,
  enabled = true
) {
  const { data: alertsData } = useClinicalAlerts(patientId, enabled);

  return {
    precautions: alertsData?.patientPrecautions || [],
    isLoading: !alertsData,
  };
}

/**
 * Hook to invalidate patient chart cache
 * Use this after mutations to refresh data in all views
 */
export function useInvalidatePatientChart() {
  const queryClient = useQueryClient();

  return (patientId: string) => {
    // Invalidate all patient-related queries
    queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) });
    // Also invalidate the list to refresh patient counts/stats
    queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
  };
}

/**
 * Mutation hook for creating assessments
 * Automatically invalidates patient chart cache
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentData: {
      patient_id: string;
      assessment_type: string;
      provider_id?: string;
      [key: string]: any;
    }) => {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_assessment",
          ...assessmentData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create assessment");
      }

      return response.json();
    },
    onSuccess: (
      _: any,
      variables: {
        patient_id: string;
        assessment_type: string;
        provider_id?: string;
        [key: string]: any;
      }
    ) => {
      // Invalidate patient chart to refresh assessments
      queryClient.invalidateQueries({
        queryKey: [...patientKeys.detail(variables.patient_id), "chart"],
      });
      queryClient.invalidateQueries({
        queryKey: [
          ...patientKeys.detail(variables.patient_id),
          "clinical-alerts",
        ],
      });
    },
  });
}

/**
 * Mutation hook for creating patient precautions
 * Automatically invalidates patient chart cache
 */
export function useCreatePrecaution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (precautionData: {
      patient_id: string;
      precaution_type: string;
      custom_text?: string;
      icon?: string;
      color?: string;
      created_by?: string;
      show_on_chart?: boolean;
    }) => {
      const response = await fetch("/api/clinical-alerts/precautions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(precautionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create precaution");
      }

      return response.json();
    },
    onSuccess: (
      _: any,
      variables: {
        patient_id: string;
        precaution_type: string;
        custom_text?: string;
        icon?: string;
        color?: string;
        created_by?: string;
        show_on_chart?: boolean;
      }
    ) => {
      // Invalidate patient chart to refresh precautions
      queryClient.invalidateQueries({
        queryKey: [...patientKeys.detail(variables.patient_id), "chart"],
      });
      queryClient.invalidateQueries({
        queryKey: [
          ...patientKeys.detail(variables.patient_id),
          "clinical-alerts",
        ],
      });
    },
  });
}
