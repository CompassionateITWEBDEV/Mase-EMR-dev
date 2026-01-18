/**
 * Custom hook for fetching and managing patient lists
 */

import { useQuery } from "@tanstack/react-query"
import type { PatientWithRelations, PatientFilters, PaginationInput } from "@/types/patient"
import type { PaginatedResponse, PatientListResponse } from "@/types/api"
import { patientKeys } from "@/lib/utils/query-keys"

interface UsePatientsOptions {
  filters?: PatientFilters
  pagination?: PaginationInput
  enabled?: boolean
}

/**
 * Fetch list of patients with optional filters and pagination
 */
export function usePatients(options: UsePatientsOptions = {}) {
  const { filters, pagination, enabled = true } = options

  return useQuery<PatientListResponse>({
    queryKey: patientKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.search) {
        params.append("search", filters.search)
      }
      if (filters?.status) {
        params.append("status", filters.status)
      }
      if (pagination?.page) {
        params.append("page", String(pagination.page))
      }
      if (pagination?.pageSize) {
        params.append("pageSize", String(pagination.pageSize))
      }
      if (!pagination?.pageSize && !filters?.search) {
        params.append("limit", "200") // Default limit
      }

      const response = await fetch(`/api/patients?${params.toString()}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch patients")
      }
      return response.json()
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Search patients by query string
 */
export function usePatientSearch(query: string, enabled = true) {
  return useQuery<PatientListResponse>({
    queryKey: patientKeys.search(query),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("search", query)
      params.append("limit", "50")

      const response = await fetch(`/api/patients?${params.toString()}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to search patients")
      }
      return response.json()
    },
    enabled: enabled && query.length > 0,
    staleTime: 10 * 1000, // 10 seconds for search results
  })
}

