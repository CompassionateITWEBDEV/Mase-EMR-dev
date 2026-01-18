/**
 * Custom hook for fetching assessment tools
 * Retrieves available assessment tools from the API
 */

import { useQuery } from "@tanstack/react-query";
import type { AssessmentTool } from "@/types/clinical";
import { assessmentKeys } from "@/lib/utils/query-keys";

/**
 * Response shape from /api/assessments/tools
 */
interface AssessmentToolsResponse {
  tools: AssessmentTool[];
  error?: string;
}

/**
 * Options for useAssessmentTools hook
 */
interface UseAssessmentToolsOptions {
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Fetches available assessment tools
 *
 * @param options - Hook options including enabled flag
 * @returns React Query result with assessment tools data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAssessmentTools();
 * ```
 */
export function useAssessmentTools(options: UseAssessmentToolsOptions = {}) {
  const { enabled = true } = options;

  return useQuery<AssessmentToolsResponse>({
    queryKey: assessmentKeys.all,
    queryFn: async () => {
      const response = await fetch("/api/assessments/tools");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch assessment tools");
      }

      return response.json();
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - tools don't change often
  });
}

