"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, type ReactNode } from "react"

/**
 * Cache time configurations for different data types
 */
export const CACHE_TIMES = {
  /** Static data that rarely changes (e.g., specialties, facility info) */
  STATIC: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (previously cacheTime)
  },
  /** Semi-static data (e.g., staff list, medications catalog) */
  SEMI_STATIC: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  /** Dynamic data that changes frequently (e.g., patient list, appointments) */
  DYNAMIC: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  /** Real-time data (e.g., notifications, queue status) */
  REALTIME: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
  },
} as const

/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  // Patients
  patients: {
    all: ["patients"] as const,
    list: (filters?: Record<string, unknown>) => ["patients", "list", filters] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
    chart: (id: string) => ["patients", "chart", id] as const,
  },
  // Appointments
  appointments: {
    all: ["appointments"] as const,
    list: (date?: string) => ["appointments", "list", date] as const,
    detail: (id: string) => ["appointments", "detail", id] as const,
  },
  // Medications
  medications: {
    all: ["medications"] as const,
    patient: (patientId: string) => ["medications", "patient", patientId] as const,
  },
  // AI Assistant
  aiAssistant: {
    analysis: (patientId: string, specialtyId: string) => 
      ["ai-assistant", "analysis", patientId, specialtyId] as const,
    chat: (sessionId: string) => ["ai-assistant", "chat", sessionId] as const,
  },
  // Staff
  staff: {
    all: ["staff"] as const,
    detail: (id: string) => ["staff", "detail", id] as const,
  },
  // Settings
  settings: {
    user: ["settings", "user"] as const,
    facility: ["settings", "facility"] as const,
  },
  // Notifications
  notifications: {
    all: ["notifications"] as const,
    unread: ["notifications", "unread"] as const,
  },
} as const

/**
 * React Query Provider Component
 * Provides QueryClient context to the application with optimized caching
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default to dynamic data settings
            staleTime: CACHE_TIMES.DYNAMIC.staleTime,
            gcTime: CACHE_TIMES.DYNAMIC.gcTime,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              return failureCount < 2
            },
          },
          mutations: {
            retry: 0,
            onError: (error: any) => {
              console.error("[React Query] Mutation error:", error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

