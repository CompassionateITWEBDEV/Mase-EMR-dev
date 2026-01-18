/**
 * Custom hook for fetching quality measures data
 * Retrieves quality metrics and performance tracking from the API
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qualityMeasureKeys } from "@/lib/utils/query-keys";

/**
 * Quality measure from the database
 */
interface QualityMeasure {
  id: string;
  measure_id: string;
  measure_name: string;
  description?: string;
  specialty?: string;
  category?: string;
  target_rate?: number;
  // Calculated fields from API
  denominator: number;
  numerator: number;
  performance_rate: number;
  data_completeness: number;
  meets_minimum: boolean;
  meets_data_completeness: boolean;
}

/**
 * Response shape from /api/quality-measures
 */
interface QualityMeasuresApiResponse {
  /** List of quality measures with performance data */
  measures: QualityMeasure[];
  /** Reporting year */
  year: string;
  /** Specialty filter applied */
  specialty: string | null;
  /** Error message if request failed */
  error?: string;
}

/**
 * Filters for quality measures query
 */
interface QualityMeasuresFilters {
  /** Filter by specialty (e.g., 'primary-care', 'behavioral-health') */
  specialty?: string;
  /** Reporting year (defaults to current year) */
  year?: string;
}

/**
 * Options for useQualityMeasures hook
 */
interface UseQualityMeasuresOptions {
  /** Filters to apply to the query */
  filters?: QualityMeasuresFilters;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Fetches quality measures with performance calculations
 *
 * @param options - Hook options including filters and enabled flag
 * @returns React Query result with quality measures data
 *
 * @example
 * ```tsx
 * // Fetch all quality measures
 * const { data, isLoading } = useQualityMeasures();
 *
 * // Fetch by specialty
 * const { data } = useQualityMeasures({
 *   filters: { specialty: 'primary-care', year: '2024' }
 * });
 * ```
 */
export function useQualityMeasures(options: UseQualityMeasuresOptions = {}) {
  const { filters, enabled = true } = options;

  return useQuery<QualityMeasuresApiResponse>({
    queryKey: qualityMeasureKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.specialty) {
        params.append("specialty", filters.specialty);
      }
      if (filters?.year) {
        params.append("year", filters.year);
      }

      const url = `/api/quality-measures${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch quality measures");
      }

      return response.json();
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Input for recording a quality measure tracking entry
 */
interface RecordQualityMeasureInput {
  measure_id: string;
  patient_id: string;
  encounter_id?: string;
  reporting_year?: number;
  in_numerator?: boolean;
  in_denominator?: boolean;
  excluded?: boolean;
  exclusion_reason?: string;
  performance_met?: boolean;
}

/**
 * Mutation hook for recording quality measure tracking
 *
 * @returns React Query mutation for recording measure data
 *
 * @example
 * ```tsx
 * const { mutate } = useRecordQualityMeasure();
 *
 * mutate({
 *   measure_id: 'measure-uuid',
 *   patient_id: 'patient-uuid',
 *   in_numerator: true,
 *   in_denominator: true
 * });
 * ```
 */
export function useRecordQualityMeasure() {
  const queryClient = useQueryClient();

  return useMutation<{ data: unknown }, Error, RecordQualityMeasureInput>({
    mutationFn: async (input) => {
      const response = await fetch("/api/quality-measures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to record quality measure");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qualityMeasureKeys.lists() });
    },
  });
}

