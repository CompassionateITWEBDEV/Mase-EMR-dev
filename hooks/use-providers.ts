/**
 * Custom hook for fetching providers
 * Retrieves provider lists with optional filtering
 */

import { useQuery } from "@tanstack/react-query";
import { providerKeys } from "@/lib/utils/query-keys";
import { fetchAllProviders } from "@/lib/utils/fetch-providers";
import type { Provider } from "@/types/patient";

/**
 * Options for useProviders hook
 */
interface UseProvidersOptions {
  /** Specialty filter */
  specialty?: string;
  /** Whether to fetch only active providers (default: true) */
  active?: boolean;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Response type for providers query
 */
interface ProvidersResponse {
  providers: Provider[];
}

/**
 * Fetches providers with optional filtering
 *
 * @param options - Hook options including filters and enabled flag
 * @returns React Query result with providers data
 *
 * @example
 * ```tsx
 * // Fetch all providers
 * const { data, isLoading } = useProviders();
 *
 * // Fetch with filters
 * const { data } = useProviders({
 *   specialty: 'psychiatry',
 *   active: true
 * });
 * ```
 */
export function useProviders(options: UseProvidersOptions = {}) {
  const { specialty, active = true, enabled = true } = options;

  return useQuery<ProvidersResponse>({
    queryKey: providerKeys.list({ specialty, active }),
    queryFn: async () => {
      console.log("[useProviders] Fetching providers with options:", { specialty, active, enabled });
      const providers = await fetchAllProviders({ specialty, active });
      console.log("[useProviders] Fetched providers:", providers.length);
      return { providers };
    },
    enabled,
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Fetches a single provider by ID
 *
 * @param providerId - The provider UUID
 * @param enabled - Whether to enable the query
 * @returns React Query result with provider details
 */
export function useProvider(
  providerId: string | null | undefined,
  enabled = true
) {
  return useQuery<{ provider: Provider }>({
    queryKey: providerKeys.detail(providerId || ""),
    queryFn: async () => {
      if (!providerId) {
        throw new Error("Provider ID is required");
      }

      const response = await fetch(`/api/providers/${providerId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch provider");
      }
      return response.json();
    },
    enabled: enabled && !!providerId,
    staleTime: 5 * 60 * 1000,
  });
}
