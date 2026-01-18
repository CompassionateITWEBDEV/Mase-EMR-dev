/**
 * Patient Avatar Component
 * Displays patient avatar with initials
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getPatientInitials } from "@/lib/utils/patient-helpers"
import type { Patient } from "@/types/patient"

interface PatientAvatarProps {
  patient: Patient
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
}

/**
 * Patient avatar component with initials fallback
 */
export function PatientAvatar({ patient, size = "md", className }: PatientAvatarProps) {
  return (
    <Avatar className={`${sizeClasses[size]} ${className || ""}`}>
      <AvatarFallback>{getPatientInitials(patient)}</AvatarFallback>
    </Avatar>
  )
}

