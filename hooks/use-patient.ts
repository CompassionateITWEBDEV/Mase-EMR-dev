/**
 * Custom hook for fetching a single patient with all relations
 */

import { useQuery } from "@tanstack/react-query"
import type { PatientWithRelations } from "@/types/patient"
import type { PatientDetailResponse } from "@/types/api"
import { patientKeys } from "@/lib/utils/query-keys"

/**
 * Fetch a single patient by ID with all related data
 */
export function usePatient(patientId: string | null | undefined, enabled = true) {
  return useQuery<PatientDetailResponse>({
    queryKey: patientKeys.detail(patientId || ""),
    queryFn: async () => {
      if (!patientId) {
        throw new Error("Patient ID is required")
      }

      const response = await fetch(`/api/patients/${patientId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch patient")
      }
      return response.json()
    },
    enabled: enabled && !!patientId,
    staleTime: 60 * 1000, // 1 minute
  })
}

