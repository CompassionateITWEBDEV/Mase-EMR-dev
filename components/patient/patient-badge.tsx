/**
 * Patient Badge Components
 * Badges for displaying patient status, risk level, etc.
 */

import { Badge } from "@/components/ui/badge"
import type { PatientRiskLevel } from "@/types/patient"

interface RiskBadgeProps {
  riskLevel: PatientRiskLevel
  className?: string
}

/**
 * Risk level badge component
 */
export function RiskBadge({ riskLevel, className }: RiskBadgeProps) {
  const variant =
    riskLevel === "high" ? "destructive" : riskLevel === "medium" ? "secondary" : "outline"
  const displayText = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) + " Risk"

  return (
    <Badge variant={variant} className={className}>
      {displayText}
    </Badge>
  )
}

interface StatusBadgeProps {
  status: string
  className?: string
}

/**
 * Patient status badge component
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant =
    status === "Active"
      ? "default"
      : status === "High Risk"
        ? "destructive"
        : status === "Assessment Due"
          ? "secondary"
          : "outline"

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  )
}

