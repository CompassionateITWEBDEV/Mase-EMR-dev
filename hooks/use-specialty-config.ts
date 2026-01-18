/**
 * Custom hook for fetching specialty configuration
 * Retrieves clinic specialty settings and available features from the API
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { specialtyKeys } from "@/lib/utils/query-keys";
import type {
  ClinicSpecialtyConfiguration,
  SpecialtyFeature,
  SpecialtyConfigResponse,
} from "@/types/specialty";

/**
 * Response shape from /api/specialty-config
 */
interface SpecialtyConfigApiResponse {
  /** List of configured specialties for the clinic */
  specialties: ClinicSpecialtyConfiguration[];
  /** List of available specialty features */
  features: SpecialtyFeature[];
  /** Error message if request failed */
  error?: string;
}

/**
 * Options for useSpecialtyConfig hook
 */
interface UseSpecialtyConfigOptions {
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
  /** Optional specialty ID to filter by */
  specialtyId?: string;
}

/**
 * Fetches specialty configuration for the clinic
 *
 * @param options - Hook options including enabled flag and optional specialtyId filter
 * @returns React Query result with specialty configuration data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSpecialtyConfig();
 *
 * // With specific specialty filter
 * const { data } = useSpecialtyConfig({ specialtyId: 'primary-care' });
 * ```
 */
export function useSpecialtyConfig(options: UseSpecialtyConfigOptions = {}) {
  const { enabled = true, specialtyId } = options;

  return useQuery<SpecialtyConfigApiResponse>({
    queryKey: specialtyKeys.config(specialtyId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (specialtyId) {
        params.append("specialty", specialtyId);
      }

      const url = `/api/specialty-config${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch specialty configuration");
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - specialty config changes infrequently
  });
}

/**
 * Input for updating specialty configuration
 */
interface UpdateSpecialtyConfigInput {
  /** Array of specialty IDs to enable */
  specialtyIds: string[];
}

/**
 * Mutation hook for updating specialty configuration
 *
 * @returns React Query mutation for saving specialty settings
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateSpecialtyConfig();
 *
 * mutate({ specialtyIds: ['primary-care', 'behavioral-health'] });
 * ```
 */
export function useUpdateSpecialtyConfig() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, UpdateSpecialtyConfigInput>({
    mutationFn: async ({ specialtyIds }) => {
      const response = await fetch("/api/specialty-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ specialtyIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update specialty configuration");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all specialty config queries
      queryClient.invalidateQueries({ queryKey: specialtyKeys.configs() });
    },
  });
}

