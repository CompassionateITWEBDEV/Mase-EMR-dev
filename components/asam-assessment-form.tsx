"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, AlertTriangle, CheckCircle2, Lightbulb, Info } from "lucide-react"

// ASAM Dimension Types
export interface ASAMDimensions {
  dimension1: number | null  // Acute Intoxication & Withdrawal Potential
  dimension2: number | null  // Biomedical Conditions & Complications
  dimension3: number | null  // Emotional/Behavioral/Cognitive Conditions
  dimension4: string | null  // Readiness to Change (stages of change)
  dimension5: number | null  // Relapse/Continued Use Potential
  dimension6: number | null  // Recovery/Living Environment
}

export interface ASAMAssessmentData {
  dimensions: ASAMDimensions
  recommendedLevel: string | null
  suggestedLevel?: string | null
  suggestionOverridden?: boolean
}

interface ASAMAssessmentFormProps {
  initialData?: Partial<ASAMAssessmentData>
  onSubmit?: (data: ASAMAssessmentData) => void
  onChange?: (data: ASAMAssessmentData) => void
  readOnly?: boolean
  showSubmitButton?: boolean
  submitButtonText?: string
}

// ASAM Level options
const ASAM_LEVELS = [
  { value: "0.5", label: "Level 0.5 - Early Intervention", badge: null },
  { value: "1.0", label: "Level 1.0 - Outpatient Services", badge: "OTP MAT Program Eligible" },
  { value: "2.1", label: "Level 2.1 - Intensive Outpatient (IOP)", badge: "IOP + MAT Recommended" },
  { value: "2.5", label: "Level 2.5 - Partial Hospitalization (PHP)", badge: "Partial Hospitalization Program" },
  { value: "3.1", label: "Level 3.1 - Clinically Managed Low-Intensity Residential", badge: "Residential Treatment" },
  { value: "3.3", label: "Level 3.3 - Clinically Managed Population-Specific High-Intensity Residential", badge: "Residential Treatment" },
  { value: "3.5", label: "Level 3.5 - Clinically Managed High-Intensity Residential", badge: "Residential Treatment" },
  { value: "3.7", label: "Level 3.7 - Medically Monitored Intensive Inpatient", badge: "Inpatient/Detox Referral Recommended" },
  { value: "4.0", label: "Level 4.0 - Medically Managed Intensive Inpatient", badge: "Inpatient/Detox Referral Recommended" },
]

// Dimension severity options
const SEVERITY_OPTIONS = [
  { value: "0", label: "0 - No risk/issues" },
  { value: "1", label: "1 - Minimal risk" },
  { value: "2", label: "2 - Moderate risk" },
  { value: "3", label: "3 - Severe risk" },
]

// Stages of change options for Dimension 4
const STAGES_OF_CHANGE = [
  { value: "precontemplation", label: "Precontemplation - Not ready" },
  { value: "contemplation", label: "Contemplation - Considering change" },
  { value: "preparation", label: "Preparation - Ready to change" },
  { value: "action", label: "Action - Actively changing" },
  { value: "maintenance", label: "Maintenance - Sustaining change" },
]

// Dimension definitions for tooltips
const DIMENSION_INFO = {
  dimension1: {
    title: "Dimension 1: Acute Intoxication & Withdrawal Potential",
    description: "Assesses the patient's current state of intoxication and risk of withdrawal symptoms.",
    color: "blue",
    severityDescriptions: {
      0: "No current intoxication or withdrawal risk",
      1: "Minimal withdrawal risk, can be managed outpatient",
      2: "Moderate withdrawal risk, requires monitoring",
      3: "Severe withdrawal risk, requires medical supervision/detox",
    },
  },
  dimension2: {
    title: "Dimension 2: Biomedical Conditions & Complications",
    description: "Evaluates physical health conditions that may affect treatment.",
    color: "green",
    severityDescriptions: {
      0: "No biomedical conditions affecting treatment",
      1: "Stable chronic conditions, minimal impact",
      2: "Conditions requiring regular monitoring",
      3: "Acute or unstable conditions requiring intensive medical management",
    },
  },
  dimension3: {
    title: "Dimension 3: Emotional/Behavioral/Cognitive Conditions",
    description: "Assesses mental health status and cognitive functioning.",
    color: "purple",
    severityDescriptions: {
      0: "No significant emotional/behavioral issues",
      1: "Stable mental health, minimal symptoms",
      2: "Co-occurring disorder requiring concurrent treatment",
      3: "Severe psychiatric symptoms requiring intensive intervention",
    },
  },
  dimension4: {
    title: "Dimension 4: Readiness to Change",
    description: "Evaluates motivation and readiness for treatment based on stages of change model.",
    color: "orange",
  },
  dimension5: {
    title: "Dimension 5: Relapse/Continued Use Potential",
    description: "Assesses risk of relapse or continued substance use.",
    color: "red",
    severityDescriptions: {
      0: "Low relapse risk, good coping skills",
      1: "Moderate risk, some coping skills present",
      2: "High risk without structured support",
      3: "Unable to control use without intensive support",
    },
  },
  dimension6: {
    title: "Dimension 6: Recovery/Living Environment",
    description: "Evaluates the patient's living situation and support system.",
    color: "pink",
    severityDescriptions: {
      0: "Supportive, recovery-friendly environment",
      1: "Minimal support, neutral environment",
      2: "High-risk environment with triggers",
      3: "Dangerous or actively hostile environment",
    },
  },
}

const BORDER_COLORS: Record<string, string> = {
  blue: "border-blue-500",
  green: "border-green-500",
  purple: "border-purple-500",
  orange: "border-orange-500",
  red: "border-red-500",
  pink: "border-pink-500",
}

export function ASAMAssessmentForm({
  initialData,
  onSubmit,
  onChange,
  readOnly = false,
  showSubmitButton = false,
  submitButtonText = "Save Assessment",
}: ASAMAssessmentFormProps) {
  const [dimensions, setDimensions] = useState<ASAMDimensions>({
    dimension1: initialData?.dimensions?.dimension1 ?? null,
    dimension2: initialData?.dimensions?.dimension2 ?? null,
    dimension3: initialData?.dimensions?.dimension3 ?? null,
    dimension4: initialData?.dimensions?.dimension4 ?? null,
    dimension5: initialData?.dimensions?.dimension5 ?? null,
    dimension6: initialData?.dimensions?.dimension6 ?? null,
  })

  const [recommendedLevel, setRecommendedLevel] = useState<string | null>(
    initialData?.recommendedLevel ?? null
  )
  const [suggestedLevel, setSuggestedLevel] = useState<string | null>(
    initialData?.suggestedLevel ?? null
  )
  const [suggestionOverridden, setSuggestionOverridden] = useState(
    initialData?.suggestionOverridden ?? false
  )

  // Refs to prevent infinite loops
  const hasAutoSelected = useRef(false)
  const onChangeRef = useRef(onChange)
  
  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Calculate suggested level based on dimensions
  const calculateSuggestedLevel = useCallback((dims: ASAMDimensions): string | null => {
    const { dimension1, dimension2, dimension3, dimension5, dimension6 } = dims

    // Need all numeric dimensions to calculate
    if (
      dimension1 === null ||
      dimension2 === null ||
      dimension3 === null ||
      dimension5 === null ||
      dimension6 === null
    ) {
      return null
    }

    // If any of D1, D2, or D3 is severe (3), suggest inpatient
    if (dimension1 === 3 || dimension2 === 3 || dimension3 === 3) {
      // If D1 is severe (withdrawal), suggest 3.7 or 4.0
      if (dimension1 === 3) {
        return dimension2 === 3 ? "4.0" : "3.7"
      }
      // If D2 or D3 is severe but not D1
      return "3.7"
    }

    // High relapse potential with moderate medical/withdrawal needs
    if (dimension5 === 3) {
      if (dimension1 >= 2 || dimension2 >= 2) {
        return "3.1"
      }
      return "2.5"
    }

    // Moderate across multiple dimensions
    const moderateCount = [dimension1, dimension2, dimension3, dimension5, dimension6].filter(
      (d) => d === 2
    ).length

    if (moderateCount >= 3) {
      return "2.5"
    }

    if (moderateCount >= 2 || dimension5 === 2) {
      return "2.1"
    }

    // Low severity across all dimensions
    const allLow = [dimension1, dimension2, dimension3, dimension5, dimension6].every(
      (d) => d <= 1
    )

    if (allLow) {
      return "1.0"
    }

    // Default to IOP for mixed low-moderate
    return "2.1"
  }, [])

  // Update suggested level when dimensions change
  useEffect(() => {
    const suggested = calculateSuggestedLevel(dimensions)
    setSuggestedLevel(suggested)

    // Auto-select if no level chosen yet (only once)
    if (suggested && !hasAutoSelected.current && !readOnly) {
      hasAutoSelected.current = true
      setRecommendedLevel(suggested)
      setSuggestionOverridden(false)
    }
  }, [dimensions, calculateSuggestedLevel, readOnly])

  // Notify parent of changes (using ref to avoid dependency on onChange)
  useEffect(() => {
    if (onChangeRef.current) {
      onChangeRef.current({
        dimensions,
        recommendedLevel,
        suggestedLevel,
        suggestionOverridden,
      })
    }
  }, [dimensions, recommendedLevel, suggestedLevel, suggestionOverridden])

  const handleDimensionChange = (dimension: keyof ASAMDimensions, value: string) => {
    if (readOnly) return

    setDimensions((prev) => ({
      ...prev,
      [dimension]: dimension === "dimension4" ? value : parseInt(value, 10),
    }))
  }

  const handleLevelChange = (value: string) => {
    if (readOnly) return

    setRecommendedLevel(value)
    setSuggestionOverridden(value !== suggestedLevel)
  }

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        dimensions,
        recommendedLevel,
        suggestedLevel,
        suggestionOverridden,
      })
    }
  }

  const isComplete = () => {
    return (
      dimensions.dimension1 !== null &&
      dimensions.dimension2 !== null &&
      dimensions.dimension3 !== null &&
      dimensions.dimension4 !== null &&
      dimensions.dimension5 !== null &&
      dimensions.dimension6 !== null &&
      recommendedLevel !== null
    )
  }

  const getLevelBadge = (level: string | null) => {
    if (!level) return null
    const levelInfo = ASAM_LEVELS.find((l) => l.value === level)
    return levelInfo?.badge || null
  }

  const renderDimensionSelect = (
    dimensionKey: keyof ASAMDimensions,
    options: { value: string; label: string }[]
  ) => {
    const info = DIMENSION_INFO[dimensionKey]
    const currentValue = dimensions[dimensionKey]

    return (
      <div className={`border-l-4 ${BORDER_COLORS[info.color]} pl-4`}>
        <div className="flex items-start gap-2">
          <Label className="text-lg font-semibold flex-1">
            {info.title}
          </Label>
          <span className="text-xs text-muted-foreground max-w-[200px] text-right">
            {info.description}
          </span>
        </div>
        <Select
          value={currentValue?.toString() ?? ""}
          onValueChange={(value) => handleDimensionChange(dimensionKey, value)}
          disabled={readOnly}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select severity level" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentValue !== null && "severityDescriptions" in info && (
          <p className="text-sm text-muted-foreground mt-1">
            {(info.severityDescriptions as Record<number, string>)[currentValue as number]}
          </p>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          ASAM Level of Care Determination
        </CardTitle>
        <CardDescription>
          Complete ASAM 6-Dimension assessment for level of care placement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dimension 1 */}
        {renderDimensionSelect("dimension1", SEVERITY_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label.replace("risk/issues", "withdrawal risk").replace("risk", "withdrawal risk"),
        })))}

        {/* Dimension 2 */}
        {renderDimensionSelect("dimension2", SEVERITY_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label.replace("risk/issues", "biomedical issues").replace("risk", "medical complexity"),
        })))}

        {/* Dimension 3 */}
        {renderDimensionSelect("dimension3", SEVERITY_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label.replace("risk/issues", "emotional/behavioral issues").replace("risk", "psychiatric severity"),
        })))}

        {/* Dimension 4 - Stages of Change */}
        {renderDimensionSelect("dimension4", STAGES_OF_CHANGE)}

        {/* Dimension 5 */}
        {renderDimensionSelect("dimension5", SEVERITY_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label.replace("risk/issues", "relapse risk").replace("risk", "relapse potential"),
        })))}

        {/* Dimension 6 */}
        {renderDimensionSelect("dimension6", SEVERITY_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label.replace("risk/issues", "environmental risk").replace("risk", "environmental risk"),
        })))}

        {/* ASAM Level Recommendation */}
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Recommended ASAM Level of Care</Label>
            {suggestedLevel && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Suggested: Level {suggestedLevel}
              </Badge>
            )}
          </div>

          <Select
            value={recommendedLevel ?? ""}
            onValueChange={handleLevelChange}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select recommended level" />
            </SelectTrigger>
            <SelectContent>
              {ASAM_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <div className="flex items-center gap-2">
                    {level.label}
                    {level.value === suggestedLevel && (
                      <Badge variant="secondary" className="text-xs">
                        Suggested
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Level badge */}
          {recommendedLevel && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={
                  parseFloat(recommendedLevel) >= 3.7
                    ? "destructive"
                    : parseFloat(recommendedLevel) >= 2.5
                    ? "default"
                    : "secondary"
                }
              >
                {getLevelBadge(recommendedLevel)}
              </Badge>
              {suggestionOverridden && suggestedLevel && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Override from suggested Level {suggestedLevel}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Validation status */}
        <div className="flex items-center gap-2 text-sm">
          {isComplete() ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-600">All dimensions completed</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-amber-600">Please complete all dimensions</span>
            </>
          )}
        </div>

        {/* Submit button */}
        {showSubmitButton && !readOnly && (
          <Button
            onClick={handleSubmit}
            disabled={!isComplete()}
            className="w-full"
          >
            {submitButtonText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Export types for use elsewhere
export type { ASAMAssessmentFormProps }
export { ASAM_LEVELS, DIMENSION_INFO }
