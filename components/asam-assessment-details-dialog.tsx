"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Brain, Calendar, User, AlertTriangle, CheckCircle2 } from "lucide-react"
import type { ASAMDimensions } from "@/types/clinical"

interface ASAMAssessmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: {
    id: string
    patient_id?: string
    provider_id?: string
    assessment_type: string
    risk_assessment?: {
      asam_dimensions?: ASAMDimensions
      recommended_level?: string
      suggested_level?: string | null
      suggestion_overridden?: boolean
    } | null
    chief_complaint?: string | null
    created_at: string
    updated_at?: string | null
  } | null
  providerName?: string
}

// Dimension metadata for display
const DIMENSION_INFO = {
  dimension1: {
    title: "Dimension 1: Acute Intoxication & Withdrawal Potential",
    color: "bg-blue-500",
    severityLabels: {
      0: "No withdrawal risk",
      1: "Minimal withdrawal risk",
      2: "Moderate withdrawal risk",
      3: "Severe withdrawal risk requiring medical supervision",
    },
  },
  dimension2: {
    title: "Dimension 2: Biomedical Conditions & Complications",
    color: "bg-green-500",
    severityLabels: {
      0: "No biomedical issues",
      1: "Stable chronic conditions",
      2: "Requires monitoring",
      3: "Requires intensive medical management",
    },
  },
  dimension3: {
    title: "Dimension 3: Emotional/Behavioral/Cognitive Conditions",
    color: "bg-purple-500",
    severityLabels: {
      0: "No emotional/behavioral issues",
      1: "Stable mental health condition",
      2: "Co-occurring disorder requiring treatment",
      3: "Severe psychiatric condition",
    },
  },
  dimension4: {
    title: "Dimension 4: Readiness to Change",
    color: "bg-orange-500",
    stageLabels: {
      precontemplation: "Precontemplation - Not ready for change",
      contemplation: "Contemplation - Considering change",
      preparation: "Preparation - Ready to change",
      action: "Action - Actively changing",
      maintenance: "Maintenance - Sustaining change",
    },
  },
  dimension5: {
    title: "Dimension 5: Relapse/Continued Use Potential",
    color: "bg-red-500",
    severityLabels: {
      0: "Low relapse risk",
      1: "Moderate relapse risk",
      2: "High risk without structure",
      3: "Unable to control use without intensive support",
    },
  },
  dimension6: {
    title: "Dimension 6: Recovery/Living Environment",
    color: "bg-pink-500",
    severityLabels: {
      0: "Supportive environment",
      1: "Minimal support",
      2: "High-risk environment",
      3: "Dangerous/unsafe environment",
    },
  },
}

// ASAM Level descriptions
const LEVEL_INFO: Record<string, { label: string; badge: string; variant: "default" | "secondary" | "destructive" }> = {
  "0.5": { label: "Level 0.5 - Early Intervention", badge: "Early Intervention", variant: "secondary" },
  "1.0": { label: "Level 1.0 - Outpatient Services", badge: "OTP MAT Program Eligible", variant: "secondary" },
  "2.1": { label: "Level 2.1 - Intensive Outpatient (IOP)", badge: "IOP + MAT Recommended", variant: "default" },
  "2.5": { label: "Level 2.5 - Partial Hospitalization (PHP)", badge: "Partial Hospitalization", variant: "default" },
  "3.1": { label: "Level 3.1 - Clinically Managed Low-Intensity Residential", badge: "Residential Treatment", variant: "default" },
  "3.3": { label: "Level 3.3 - Clinically Managed High-Intensity Residential", badge: "Residential Treatment", variant: "default" },
  "3.5": { label: "Level 3.5 - Clinically Managed High-Intensity Residential", badge: "Residential Treatment", variant: "default" },
  "3.7": { label: "Level 3.7 - Medically Monitored Intensive Inpatient", badge: "Inpatient/Detox Referral", variant: "destructive" },
  "4.0": { label: "Level 4.0 - Medically Managed Intensive Inpatient", badge: "Inpatient/Detox Referral", variant: "destructive" },
}

export function ASAMAssessmentDetailsDialog({
  open,
  onOpenChange,
  assessment,
  providerName,
}: ASAMAssessmentDetailsDialogProps) {
  if (!assessment) return null

  const riskAssessment = assessment.risk_assessment
  const dimensions = riskAssessment?.asam_dimensions
  const recommendedLevel = riskAssessment?.recommended_level
  const suggestedLevel = riskAssessment?.suggested_level
  const suggestionOverridden = riskAssessment?.suggestion_overridden

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  const getSeverityBadgeVariant = (value: number): "default" | "secondary" | "destructive" | "outline" => {
    if (value === 0) return "outline"
    if (value === 1) return "secondary"
    if (value === 2) return "default"
    return "destructive"
  }

  const renderDimension = (
    key: keyof typeof DIMENSION_INFO,
    value: number | string | null | undefined
  ) => {
    const info = DIMENSION_INFO[key]
    if (value === null || value === undefined) {
      return (
        <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className={`w-1 h-full min-h-[40px] rounded ${info.color}`} />
          <div className="flex-1">
            <p className="font-medium text-sm">{info.title}</p>
            <p className="text-sm text-muted-foreground">Not assessed</p>
          </div>
        </div>
      )
    }

    // Handle Dimension 4 (stages of change)
    if (key === "dimension4") {
      const dim4Info = DIMENSION_INFO.dimension4
      const stageLabel = dim4Info.stageLabels[value as keyof typeof dim4Info.stageLabels] || value
      return (
        <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className={`w-1 h-full min-h-[40px] rounded ${info.color}`} />
          <div className="flex-1">
            <p className="font-medium text-sm">{info.title}</p>
            <Badge variant="outline" className="mt-1">
              {stageLabel}
            </Badge>
          </div>
        </div>
      )
    }

    // Handle numeric dimensions
    const numValue = typeof value === "number" ? value : parseInt(value as string, 10)
    const severityLabels = "severityLabels" in info ? info.severityLabels : null
    const severityLabel = severityLabels?.[numValue as keyof typeof severityLabels] || `Level ${numValue}`

    return (
      <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
        <div className={`w-1 h-full min-h-[40px] rounded ${info.color}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{info.title}</p>
            <Badge variant={getSeverityBadgeVariant(numValue)}>
              {numValue}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{severityLabel}</p>
        </div>
      </div>
    )
  }

  const levelInfo = recommendedLevel ? LEVEL_INFO[recommendedLevel] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            ASAM Criteria Assessment Details
          </DialogTitle>
          <DialogDescription>
            Complete assessment of the six ASAM dimensions and level of care recommendation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assessment metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(assessment.created_at)}
            </div>
            {providerName && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {providerName}
              </div>
            )}
          </div>

          <Separator />

          {/* Recommended Level */}
          <div className="p-4 rounded-lg bg-primary/5 border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Recommended Level of Care</h3>
              {suggestionOverridden && suggestedLevel && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Override from {suggestedLevel}
                </Badge>
              )}
            </div>
            {levelInfo ? (
              <div className="space-y-2">
                <p className="text-lg font-medium">{levelInfo.label}</p>
                <Badge variant={levelInfo.variant}>{levelInfo.badge}</Badge>
              </div>
            ) : recommendedLevel ? (
              <p className="text-lg font-medium">Level {recommendedLevel}</p>
            ) : (
              <p className="text-muted-foreground">No level recommended</p>
            )}
          </div>

          <Separator />

          {/* Dimensions */}
          <div className="space-y-3">
            <h3 className="font-semibold">ASAM 6-Dimension Assessment</h3>
            {dimensions ? (
              <div className="space-y-2">
                {renderDimension("dimension1", dimensions.dimension1)}
                {renderDimension("dimension2", dimensions.dimension2)}
                {renderDimension("dimension3", dimensions.dimension3)}
                {renderDimension("dimension4", dimensions.dimension4)}
                {renderDimension("dimension5", dimensions.dimension5)}
                {renderDimension("dimension6", dimensions.dimension6)}
              </div>
            ) : (
              <p className="text-muted-foreground">No dimension data available</p>
            )}
          </div>

          {/* Notes */}
          {assessment.chief_complaint && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Clinical Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {assessment.chief_complaint}
                </p>
              </div>
            </>
          )}

          {/* Validation status */}
          <div className="flex items-center gap-2 text-sm pt-4 border-t">
            {dimensions &&
            dimensions.dimension1 !== null &&
            dimensions.dimension2 !== null &&
            dimensions.dimension3 !== null &&
            dimensions.dimension4 !== null &&
            dimensions.dimension5 !== null &&
            dimensions.dimension6 !== null ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Complete assessment</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-600">Partial assessment</span>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
