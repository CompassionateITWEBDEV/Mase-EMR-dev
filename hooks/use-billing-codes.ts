/**
 * Custom hook for fetching billing CPT codes
 * Retrieves CPT codes by specialty from the database
 */

import { useQuery } from "@tanstack/react-query";
import type { CPTCode } from "@/types/billing";
import { billingKeys } from "@/lib/utils/query-keys";

/**
 * Response shape from /api/billing/cpt-codes
 */
interface BillingCodesResponse {
  codes: CPTCode[];
  error?: string;
}

/**
 * Options for useBillingCodes hook
 */
interface UseBillingCodesOptions {
  /** Specialty to filter codes by (e.g., 'primary-care') */
  specialty?: string;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Fetches billing CPT codes with optional specialty filter
 *
 * @param options - Hook options including specialty and enabled flag
 * @returns React Query result with billing codes data
 *
 * @example
 * ```tsx
 * // Fetch all codes
 * const { data, isLoading } = useBillingCodes();
 *
 * // Fetch codes for primary care
 * const { data } = useBillingCodes({ specialty: 'primary-care' });
 * ```
 */
export function useBillingCodes(options: UseBillingCodesOptions = {}) {
  const { specialty, enabled = true } = options;

  return useQuery<BillingCodesResponse>({
    queryKey: billingKeys.codes(specialty),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (specialty) {
        params.append("specialty", specialty);
      }

      const url = `/api/billing/cpt-codes${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch billing codes");
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - codes don't change often
  });
}

