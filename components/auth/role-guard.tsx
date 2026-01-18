"use client"

import { useAuth } from "@/lib/auth/rbac-hooks"
import type { Permission, UserRole } from "@/lib/auth/roles"
import type { ReactNode } from "react"

interface RoleGuardProps {
  children: ReactNode
  requiredPermissions?: Permission[]
  requiredRoles?: UserRole[]
  requireAll?: boolean // If true, user must have ALL permissions/roles. If false, ANY will suffice
  fallback?: ReactNode
  showError?: boolean
}

export function RoleGuard({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallback = null,
  showError = false,
}: RoleGuardProps) {
  const { user, loading, hasAnyPermission } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    if (showError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">Authentication required</p>
        </div>
      )
    }
    return fallback
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role)
    if (!hasRequiredRole) {
      if (showError) {
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">Insufficient role permissions</p>
          </div>
        )
      }
      return fallback
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every((permission) => hasAnyPermission([permission]))
      : hasAnyPermission(requiredPermissions)

    if (!hasRequiredPermissions) {
      if (showError) {
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">Insufficient permissions</p>
          </div>
        )
      }
      return fallback
    }
  }

  return <>{children}</>
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRoles={["admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function DoctorOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRoles={["doctor"]} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function HealthcareStaffOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRoles={["doctor", "rn", "counselor"]} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}
