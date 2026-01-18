/**
 * Custom hook for fetching patient statistics
 */

import { useQuery } from "@tanstack/react-query"
import type { PatientStats } from "@/types/patient"
import type { PatientStatsResponse } from "@/types/api"
import { patientKeys } from "@/lib/utils/query-keys"

/**
 * Fetch patient statistics (total, active, high risk, etc.)
 */
export function usePatientStats(enabled = true) {
  return useQuery<PatientStatsResponse>({
    queryKey: patientKeys.stats(),
    queryFn: async () => {
      const response = await fetch("/api/patients/stats")
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch patient stats")
      }
      return response.json()
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

