"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { type UserRole, type Permission, hasPermission, hasAnyPermission, canAccessResource, STAFF_ROLES } from "./roles"
import { useAuthToggle } from "@/lib/dev-tools/auth-toggle-context"

interface StaffUser {
  id: string
  email: string
  role: UserRole
  first_name: string
  last_name: string
  employee_id: string
  is_active: boolean
  permissions?: Permission[]
}

interface UseAuthReturn {
  user: StaffUser | null
  loading: boolean
  error: string | null
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  canAccess: (resource: string, action: "read" | "write" | "delete" | "admin") => boolean
  signOut: () => Promise<void>
}

/**
 * Mock user for development/testing when auth bypass is enabled
 */
const MOCK_USER: StaffUser = {
  id: "dev-bypass-user",
  email: "dev@test.local",
  role: STAFF_ROLES.ADMIN,
  first_name: "Dev",
  last_name: "User",
  employee_id: "DEV-001",
  is_active: true,
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<StaffUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { bypassAuth, disableTokenRefresh } = useAuthToggle()

  useEffect(() => {
    // If bypass is enabled, return mock user immediately
    if (bypassAuth) {
      setUser(MOCK_USER)
      setLoading(false)
      setError(null)
      return
    }

    getUser()

    // Only subscribe to auth state changes if token refresh is not disabled
    if (disableTokenRefresh) {
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip token refresh events if disabled
      if (disableTokenRefresh && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN")) {
        return
      }

      if (event === "SIGNED_IN" && session) {
        await getUser()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [bypassAuth, disableTokenRefresh])

  const getUser = async () => {
    // If bypass is enabled, return mock user
    if (bypassAuth) {
      setUser(MOCK_USER)
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        setUser(null)
        return
      }

      // Get staff information
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (staffError || !staffData) {
        // Try providers table for backward compatibility
        const { data: providerData, error: providerError } = await supabase
          .from("providers")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (providerError || !providerData) {
          setError("User profile not found")
          setUser(null)
          return
        }

        // Map provider data to staff format
        setUser({
          id: providerData.id,
          email: authUser.email!,
          role: providerData.role || "general_staff",
          first_name: providerData.first_name,
          last_name: providerData.last_name,
          employee_id: providerData.license_number || "N/A",
          is_active: true,
        })
      } else {
        setUser({
          id: staffData.id,
          email: authUser.email!,
          role: staffData.role,
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          employee_id: staffData.employee_id,
          is_active: staffData.is_active,
        })
      }
    } catch (err) {
      console.error("Error getting user:", err)
      setError("Failed to load user information")
    } finally {
      setLoading(false)
    }
  }

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false
    return hasPermission(user.role, permission)
  }

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false
    return hasAnyPermission(user.role, permissions)
  }

  const checkAccess = (resource: string, action: "read" | "write" | "delete" | "admin"): boolean => {
    if (!user) return false
    return canAccessResource(user.role, resource, action)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return {
    user,
    loading,
    error,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    canAccess: checkAccess,
    signOut,
  }
}

// Hook for checking specific permissions
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuth()
  return hasPermission(permission)
}

// Hook for checking resource access
export function useResourceAccess(resource: string, action: "read" | "write" | "delete" | "admin"): boolean {
  const { canAccess } = useAuth()
  return canAccess(resource, action)
}

// Comprehensive hook that provides all permission checking functionality
export function useRolePermissions() {
  const { user, hasPermission, hasAnyPermission, canAccess } = useAuth()

  return {
    user,
    role: user?.role || null,
    hasPermission,
    hasAnyPermission,
    canAccess,
    isAuthenticated: !!user,
    isActive: user?.is_active || false,
  }
}
