"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"
import { queryKeys, CACHE_TIMES } from "@/lib/react-query/provider"

/**
 * Prefetch common data on app load for faster navigation
 */
export function usePrefetchCommonData() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Prefetch patient list (most common navigation)
    queryClient.prefetchQuery({
      queryKey: queryKeys.patients.list(),
      queryFn: () => fetch("/api/patients").then((r) => r.json()),
      staleTime: CACHE_TIMES.DYNAMIC.staleTime,
    })

    // Prefetch today's appointments
    const today = new Date().toISOString().split("T")[0]
    queryClient.prefetchQuery({
      queryKey: queryKeys.appointments.list(today),
      queryFn: () => fetch(`/api/appointments?date=${today}`).then((r) => r.json()),
      staleTime: CACHE_TIMES.DYNAMIC.staleTime,
    })

    // Prefetch unread notifications
    queryClient.prefetchQuery({
      queryKey: queryKeys.notifications.unread,
      queryFn: () => fetch("/api/notifications?unread=true").then((r) => r.json()),
      staleTime: CACHE_TIMES.REALTIME.staleTime,
    })
  }, [queryClient])
}

/**
 * Prefetch patient data when hovering over patient links
 */
export function usePrefetchPatient() {
  const queryClient = useQueryClient()

  const prefetchPatient = useCallback(
    (patientId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.patients.detail(patientId),
        queryFn: () => fetch(`/api/patients/${patientId}`).then((r) => r.json()),
        staleTime: CACHE_TIMES.DYNAMIC.staleTime,
      })
    },
    [queryClient]
  )

  return { prefetchPatient }
}

/**
 * Prefetch route data before navigation
 */
export function usePrefetchRoute() {
  const queryClient = useQueryClient()

  const prefetchRoute = useCallback(
    (route: string) => {
      // Map routes to their data requirements
      const routePrefetchMap: Record<string, () => void> = {
        "/patients": () => {
          queryClient.prefetchQuery({
            queryKey: queryKeys.patients.list(),
            queryFn: () => fetch("/api/patients").then((r) => r.json()),
          })
        },
        "/appointments": () => {
          const today = new Date().toISOString().split("T")[0]
          queryClient.prefetchQuery({
            queryKey: queryKeys.appointments.list(today),
            queryFn: () => fetch(`/api/appointments?date=${today}`).then((r) => r.json()),
          })
        },
        "/medications": () => {
          queryClient.prefetchQuery({
            queryKey: queryKeys.medications.all,
            queryFn: () => fetch("/api/medications").then((r) => r.json()),
          })
        },
        "/staff": () => {
          queryClient.prefetchQuery({
            queryKey: queryKeys.staff.all,
            queryFn: () => fetch("/api/staff").then((r) => r.json()),
          })
        },
        "/notifications": () => {
          queryClient.prefetchQuery({
            queryKey: queryKeys.notifications.all,
            queryFn: () => fetch("/api/notifications").then((r) => r.json()),
          })
        },
      }

      const prefetchFn = routePrefetchMap[route]
      if (prefetchFn) {
        prefetchFn()
      }
    },
    [queryClient]
  )

  return { prefetchRoute }
}

/**
 * Invalidate and refetch queries after mutations
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  const invalidatePatients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
  }, [queryClient])

  const invalidateAppointments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
  }, [queryClient])

  const invalidateNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
  }, [queryClient])

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries()
  }, [queryClient])

  return {
    invalidatePatients,
    invalidateAppointments,
    invalidateNotifications,
    invalidateAll,
  }
}
