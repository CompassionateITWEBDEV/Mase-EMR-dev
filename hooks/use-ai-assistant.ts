/**
 * Custom hook for AI Clinical Decision Support
 * Fetches AI-powered recommendations, drug interactions, and clinical insights
 *
 * NOTE: The /api/ai-assistant endpoint will be created in Phase 3.
 * This hook is structured to work with the planned API.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiAssistantKeys } from "@/lib/utils/query-keys";
import type {
  AIRecommendation,
  AIAssistantRequest,
  AIAssistantResponse,
  DrugInteractionResult,
} from "@/types/ai-assistant";

/**
 * Options for useAIAssistant hook
 */
interface UseAIAssistantOptions {
  /** Patient ID to get recommendations for */
  patientId: string;
  /** Additional context for AI analysis */
  context?: Partial<AIAssistantRequest>;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Fetches AI-powered clinical recommendations for a patient
 *
 * @param options - Hook options including patientId and optional context
 * @returns React Query result with AI recommendations
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAIAssistant({
 *   patientId: 'patient-uuid'
 * });
 *
 * // With additional context
 * const { data } = useAIAssistant({
 *   patientId: 'patient-uuid',
 *   context: {
 *     encounterType: 'follow_up',
 *     chiefComplaint: 'Hypertension management'
 *   }
 * });
 * ```
 *
 * @remarks
 * API endpoint /api/ai-assistant will be created in Phase 3
 */
export function useAIAssistant(options: UseAIAssistantOptions) {
  const { patientId, context, enabled = true } = options;

  return useQuery<AIAssistantResponse>({
    queryKey: aiAssistantKeys.recommendation(patientId),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("patientId", patientId);

      if (context?.encounterType) {
        params.append("encounterType", context.encounterType);
      }
      if (context?.chiefComplaint) {
        params.append("chiefComplaint", context.chiefComplaint);
      }

      const response = await fetch(`/api/ai-assistant?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch AI recommendations");
      }

      return response.json();
    },
    enabled: enabled && !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes - AI analysis is expensive
  });
}

/**
 * Drug interactions response from API
 */
interface DrugInteractionsResponse {
  result: DrugInteractionResult;
  checkedAt: string;
}

/**
 * Fetches drug interaction check for a patient's medications
 *
 * @param patientId - Patient ID to check interactions for
 * @param enabled - Whether to enable the query
 * @returns React Query result with drug interaction data
 */
export function useDrugInteractions(
  patientId: string | null | undefined,
  enabled = true
) {
  return useQuery<DrugInteractionsResponse>({
    queryKey: aiAssistantKeys.drugInteractions(patientId || ""),
    queryFn: async () => {
      if (!patientId) {
        throw new Error("Patient ID is required");
      }

      const response = await fetch(
        `/api/ai-assistant/drug-interactions?patientId=${patientId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to check drug interactions");
      }

      return response.json();
    },
    enabled: enabled && !!patientId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Mutation hook for requesting AI analysis
 *
 * @returns React Query mutation for triggering AI analysis
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useRequestAIAnalysis();
 *
 * mutate({
 *   patientId: 'patient-uuid',
 *   encounterType: 'new_patient',
 *   chiefComplaint: 'Chest pain',
 *   includeLabReview: true
 * });
 * ```
 */
export function useRequestAIAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<AIAssistantResponse, Error, AIAssistantRequest & { specialtyId?: string }>({
    mutationFn: async (request) => {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request AI analysis");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch recommendations for this patient
      queryClient.invalidateQueries({
        queryKey: aiAssistantKeys.recommendation(variables.patientId),
      });
    },
  });
}

