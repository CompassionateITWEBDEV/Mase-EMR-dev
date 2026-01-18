import { useQuery } from "@tanstack/react-query";

/**
 * React Query hook to fetch predictive insights for a given patient.
 *
 * This hook posts the patient identifier to the `/api/ai-assistant/predictive-insights` endpoint
 * and returns the parsed JSON response. It automatically disables itself when
 * `enabled` is false or when no `patientId` is provided.
 *
 * @param patientId The ID of the patient for whom to fetch predictive insights.
 * @param enabled Whether to enable the query (e.g., based on a feature flag). Defaults to true.
 */
export function usePredictiveInsights(
  patientId: string | null | undefined,
  enabled: boolean = true
) {
  return useQuery<any>({
    queryKey: ["predictive-insights", patientId],
    queryFn: async () => {
      const res = await fetch("/api/ai-assistant/predictive-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch predictive insights");
      }
      return res.json();
    },
    enabled: enabled && !!patientId,
    staleTime: 1000 * 60 * 10,
  });
}
