"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Brain,
  AlertTriangle,
  Lightbulb,
  Pill,
  Activity,
  FileText,
  Target,
  GraduationCap,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Sparkles,
  Printer,
  Shield,
  FileCheck,
  Copy,
  Check,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Zap,
  Focus,
  X,
} from "lucide-react";
import type {
  AIRecommendation,
  RiskAlert,
  ClinicalRecommendation,
  LabOrder,
  Diagnosis,
  PreventiveGap,
} from "@/types/ai-assistant";
import { useRequestAIAnalysis } from "@/hooks/use-ai-assistant";
import type { Patient } from "@/types/patient";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { AIChatPanel } from "./ai-chat-panel";

// Focus area options for specific analysis
const FOCUS_AREA_OPTIONS = [
  { id: "diabetes", label: "Diabetes Management" },
  { id: "hypertension", label: "Hypertension" },
  { id: "cardiovascular", label: "Cardiovascular Health" },
  { id: "mental-health", label: "Mental Health" },
  { id: "substance-use", label: "Substance Use" },
  { id: "pain-management", label: "Pain Management" },
  { id: "preventive-care", label: "Preventive Care" },
  { id: "medication-review", label: "Medication Review" },
  { id: "lab-review", label: "Lab Review" },
  { id: "chronic-disease", label: "Chronic Disease Management" },
];

// Compliance check interface
interface ComplianceCheck {
  category: "mips" | "billing" | "documentation" | "regulatory";
  compliant: boolean;
  issues: string[];
  recommendations: string[];
  requiredActions: string[];
}

interface ComplianceResult {
  overallCompliant: boolean;
  checks: ComplianceCheck[];
  summary: string;
}

export interface AIClinicalAssistantProps {
  /** Patient ID to analyze (if provided, patient selector is hidden) */
  patientId?: string;
  /** Specialty ID for context */
  specialtyId: string;
  /** Optional list of patients for selection (if patientId not provided) */
  patients?: Patient[];
  /** Callback when a recommendation is selected/acted upon */
  onRecommendationSelect?: (type: string, data: any) => void;
  /** Whether to show patient selector */
  showPatientSelector?: boolean;
  /** Encounter type for context */
  encounterType?: "new_patient" | "follow_up" | "annual_wellness" | "sick_visit" | "procedure";
  /** Chief complaint for focused analysis */
  chiefComplaint?: string;
}

/**
 * Shared AI Clinical Assistant Component
 * Displays AI-powered clinical recommendations for any specialty
 */
export function AIClinicalAssistant({
  patientId: initialPatientId,
  specialtyId,
  patients = [],
  onRecommendationSelect,
  showPatientSelector = true,
  encounterType,
  chiefComplaint,
}: AIClinicalAssistantProps) {
  // Patient selection state
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || ""
  );
  const [patientsList, setPatientsList] = useState<Patient[]>(patients);
  
  // Analysis configuration state
  const [analysisType, setAnalysisType] = useState<"full" | "quick" | "specific">("full");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  
  // UI state
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [feedbackStates, setFeedbackStates] = useState<Record<string, "helpful" | "not_helpful" | null>>({});
  const [feedbackComments, setFeedbackComments] = useState<Record<string, string>>({});
  const [showFeedbackInput, setShowFeedbackInput] = useState<Record<string, boolean>>({});
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [complianceExpanded, setComplianceExpanded] = useState(true);

  // Fetch patients if not provided
  useEffect(() => {
    if (patients.length === 0 && showPatientSelector) {
      fetch("/api/patients?limit=100")
        .then((res) => res.json())
        .then((data) => setPatientsList(data.patients || []))
        .catch(() => setPatientsList([]));
    } else {
      setPatientsList(patients);
    }
  }, [patients, showPatientSelector]);

  // AI Analysis mutation hook
  const {
    mutate: requestAIAnalysis,
    isPending: aiAnalysisLoading,
    data: aiMutationData,
  } = useRequestAIAnalysis();

  // Extract recommendations from API response
  const responseData = aiMutationData as any;
  const aiRecommendations: AIRecommendation | null =
    responseData?.recommendations || responseData?.data || null;
  const complianceData: ComplianceResult | null = responseData?.compliance || null;
  const recommendationIds: Record<string, string> = responseData?.recommendationIds || {};

  // Handler for AI analysis with new parameters
  const analyzePatientChart = useCallback((patientId: string) => {
    requestAIAnalysis({
      patientId,
      specialtyId,
      encounterType: encounterType || "follow_up",
      chiefComplaint,
      includeLabReview: true,
      includeMedicationReview: true,
      analysisType,
      focusAreas: analysisType === "specific" ? focusAreas : undefined,
    } as any);
  }, [requestAIAnalysis, specialtyId, encounterType, chiefComplaint, analysisType, focusAreas]);

  const handleAnalyze = () => {
    const patientToAnalyze = initialPatientId || selectedPatientId;
    if (patientToAnalyze) {
      analyzePatientChart(patientToAnalyze);
    }
  };

  const handleGenerateTreatmentPlan = async () => {
    const patientToAnalyze = initialPatientId || selectedPatientId;
    if (!patientToAnalyze || !aiRecommendations) {
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const response = await fetch("/api/ai-assistant/treatment-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientToAnalyze,
          specialtyId,
          aiRecommendations, // Pass existing recommendations to avoid duplicate AI call
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate treatment plan");
      }

      const data = await response.json();
      onRecommendationSelect?.("treatment_plan", data.treatmentPlan);
    } catch (error) {
      console.error("Error generating treatment plan:", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleFeedback = async (
    recommendationId: string,
    helpful: boolean
  ) => {
    const isNegative = !helpful;
    
    setFeedbackStates((prev) => ({
      ...prev,
      [recommendationId]: helpful ? "helpful" : "not_helpful",
    }));

    // Show comment input for negative feedback
    if (isNegative) {
      setShowFeedbackInput((prev) => ({ ...prev, [recommendationId]: true }));
    } else {
      // Submit positive feedback immediately
      try {
        await fetch("/api/ai-assistant/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recommendationId: recommendationIds[recommendationId] || recommendationId,
            helpful: true,
          }),
        });
      } catch (error) {
        console.error("Error submitting feedback:", error);
      }
    }
  };

  const submitNegativeFeedback = async (recommendationId: string) => {
    try {
      await fetch("/api/ai-assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: recommendationIds[recommendationId] || recommendationId,
          helpful: false,
          comment: feedbackComments[recommendationId] || undefined,
        }),
      });
      
      // Collapse the recommendation after negative feedback
      setDismissedRecommendations((prev) => new Set([...prev, recommendationId]));
      setShowFeedbackInput((prev) => ({ ...prev, [recommendationId]: false }));
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const handleCopySummary = async () => {
    if (aiRecommendations?.summary) {
      try {
        await navigator.clipboard.writeText(aiRecommendations.summary);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      } catch (error) {
        console.error("Failed to copy summary:", error);
      }
    }
  };

  const toggleFocusArea = (areaId: string) => {
    setFocusAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const getComplianceCategoryIcon = (category: string) => {
    switch (category) {
      case "mips":
        return <Target className="h-4 w-4" />;
      case "billing":
        return <FileCheck className="h-4 w-4" />;
      case "documentation":
        return <FileText className="h-4 w-4" />;
      case "regulatory":
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const currentPatientId = initialPatientId || selectedPatientId;

  return (
    <div className="space-y-6">
      {/* Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Clinical Assistant
          </CardTitle>
          <CardDescription>
            Configure analysis settings and get AI-powered clinical recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patient Selection */}
          {showPatientSelector && !initialPatientId && (
            <div className="space-y-2">
              <Label>Select Patient</Label>
              {patientsList.length > 0 ? (
                <Select
                  value={selectedPatientId}
                  onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientsList.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                        {patient.date_of_birth
                          ? ` - DOB: ${new Date(patient.date_of_birth).toLocaleDateString()}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  disabled
                  placeholder="No patients available"
                  className="bg-muted"
                />
              )}
            </div>
          )}

          {/* Analysis Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Analysis Mode</Label>
              <Select
                value={analysisType}
                onValueChange={(value: "full" | "quick" | "specific") => setAnalysisType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <span>Full Analysis</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="quick">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>Quick Analysis</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <Focus className="h-4 w-4" />
                      <span>Focused Analysis</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {analysisType === "full" && "Comprehensive analysis including all sections"}
                {analysisType === "quick" && "Faster results with core recommendations only"}
                {analysisType === "specific" && "Focus on specific clinical areas"}
              </p>
            </div>
          </div>

          {/* Focus Areas (only shown for "specific" mode) */}
          {analysisType === "specific" && (
            <div className="space-y-3">
              <Label>Focus Areas</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {FOCUS_AREA_OPTIONS.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`focus-${area.id}`}
                      checked={focusAreas.includes(area.id)}
                      onCheckedChange={() => toggleFocusArea(area.id)}
                    />
                    <Label
                      htmlFor={`focus-${area.id}`}
                      className="text-sm font-normal cursor-pointer">
                      {area.label}
                    </Label>
                  </div>
                ))}
              </div>
              {focusAreas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {focusAreas.map((areaId) => {
                    const area = FOCUS_AREA_OPTIONS.find((a) => a.id === areaId);
                    return (
                      <Badge key={areaId} variant="secondary" className="gap-1">
                        {area?.label}
                        <button
                          onClick={() => toggleFocusArea(areaId)}
                          className="ml-1 hover:bg-muted rounded-full">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Analyze Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={!currentPatientId || aiAnalysisLoading}
              className="flex-1">
              {aiAnalysisLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {analysisType === "quick" ? "Quick Analysis" : analysisType === "specific" ? "Focused Analysis" : "Analyze Chart"}
                </>
              )}
            </Button>
            {aiRecommendations && currentPatientId && (
              <Button
                variant="outline"
                onClick={() => setIsChatOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask Follow-up
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {aiAnalysisLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">
                Analyzing patient chart...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations Display */}
      {aiRecommendations && (
        <>
          {/* Treatment Plan Generation Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleGenerateTreatmentPlan}
                disabled={isGeneratingPlan}
                className="w-full">
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Treatment Plan...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Generate Treatment Plan Draft
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Clinical Summary with Copy Button */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI-Generated Clinical Summary
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySummary}
                  className="gap-2">
                  {copiedSummary ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-sm text-muted-foreground">
                  Based on comprehensive chart review including medical history,
                  medications, lab results, vital signs, and recent encounters.
                </p>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p>{aiRecommendations.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance & Documentation Alerts */}
          {complianceData && (
            <Card>
              <Collapsible open={complianceExpanded} onOpenChange={setComplianceExpanded}>
                <CardHeader>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className={`h-5 w-5 ${complianceData.overallCompliant ? "text-green-500" : "text-amber-500"}`} />
                        Compliance & Documentation Alerts
                        {!complianceData.overallCompliant && (
                          <Badge variant="secondary" className="ml-2">
                            {complianceData.checks.filter(c => !c.compliant).length} Issues
                          </Badge>
                        )}
                      </CardTitle>
                      <Button variant="ghost" size="sm">
                        {complianceExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className={`p-3 rounded-lg mb-4 ${complianceData.overallCompliant ? "bg-green-50 dark:bg-green-950" : "bg-amber-50 dark:bg-amber-950"}`}>
                      <p className={`text-sm font-medium ${complianceData.overallCompliant ? "text-green-800 dark:text-green-200" : "text-amber-800 dark:text-amber-200"}`}>
                        {complianceData.summary}
                      </p>
                    </div>
                    <div className="space-y-4">
                      {complianceData.checks.map((check, index) => (
                        <div key={index} className={`border rounded-lg p-4 ${check.compliant ? "border-green-200 dark:border-green-800" : "border-amber-200 dark:border-amber-800"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {getComplianceCategoryIcon(check.category)}
                            <span className="font-medium capitalize">{check.category}</span>
                            {check.compliant ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Compliant
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Needs Attention
                              </Badge>
                            )}
                          </div>
                          {check.issues.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Issues:</p>
                              <ul className="text-sm space-y-1">
                                {check.issues.map((issue, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <AlertCircle className="h-3 w-3 mt-1 text-amber-500 flex-shrink-0" />
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {check.requiredActions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Required Actions:</p>
                              <ul className="text-sm space-y-1">
                                {check.requiredActions.map((action, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <Target className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Risk Alerts */}
          {aiRecommendations.riskAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Risk Alerts & Clinical Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiRecommendations.riskAlerts.map(
                    (alert: RiskAlert, index: number) => {
                      const alertVariant =
                        alert.type === "destructive"
                          ? "destructive"
                          : "default";
                      return (
                        <Alert key={index} variant={alertVariant}>
                          {alert.type === "destructive" && (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          {alert.type === "warning" && (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                          {alert.type === "info" && (
                            <Info className="h-4 w-4" />
                          )}
                          <AlertDescription>
                            <p
                              dangerouslySetInnerHTML={{
                                __html: alert.message,
                              }}
                            />
                          </AlertDescription>
                        </Alert>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Treatment Recommendations with Enhanced Feedback */}
          {aiRecommendations.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Evidence-Based Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiRecommendations.recommendations.map(
                    (rec: ClinicalRecommendation, index: number) => {
                      const recId = `rec-${index}`;
                      const feedback = feedbackStates[recId];
                      const isDismissed = dismissedRecommendations.has(recId);
                      const showInput = showFeedbackInput[recId];
                      
                      if (isDismissed) {
                        return (
                          <Collapsible key={index}>
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                                <span className="text-sm text-muted-foreground line-through">
                                  {rec.category}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  Dismissed
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className={`border-l-4 ${rec.color} pl-4 pr-4 mt-2 opacity-50`}>
                                <p className="text-sm text-muted-foreground">
                                  {rec.text}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="mt-2"
                                  onClick={() => setDismissedRecommendations((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(recId);
                                    return newSet;
                                  })}>
                                  Restore
                                </Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }
                      
                      return (
                        <div
                          key={index}
                          className={`border-l-4 ${rec.color} pl-4 pr-4`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{rec.category}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {rec.text}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleFeedback(recId, true)}
                                disabled={feedback === "helpful"}>
                                <ThumbsUp
                                  className={`h-4 w-4 ${
                                    feedback === "helpful"
                                      ? "text-green-600"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleFeedback(recId, false)}
                                disabled={feedback === "not_helpful"}>
                                <ThumbsDown
                                  className={`h-4 w-4 ${
                                    feedback === "not_helpful"
                                      ? "text-red-600"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Feedback Comment Input */}
                          {showInput && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                              <Label className="text-xs">Why wasn't this helpful? (optional)</Label>
                              <Textarea
                                placeholder="E.g., Already addressed, Not applicable, Inaccurate..."
                                value={feedbackComments[recId] || ""}
                                onChange={(e) => setFeedbackComments((prev) => ({
                                  ...prev,
                                  [recId]: e.target.value,
                                }))}
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => submitNegativeFeedback(recId)}>
                                  Submit Feedback
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setShowFeedbackInput((prev) => ({ ...prev, [recId]: false }));
                                    setFeedbackStates((prev) => ({ ...prev, [recId]: null }));
                                  }}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drug Interactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-orange-500" />
                Drug Interaction Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    aiRecommendations.drugInteractions.status === "no_major"
                      ? "bg-green-50 dark:bg-green-950"
                      : "bg-red-50 dark:bg-red-950"
                  }`}>
                  {aiRecommendations.drugInteractions.status === "no_major" ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-medium text-sm ${
                        aiRecommendations.drugInteractions.status === "no_major"
                          ? "text-green-800 dark:text-green-200"
                          : "text-red-800 dark:text-red-200"
                      }`}>
                      {aiRecommendations.drugInteractions.status === "no_major"
                        ? "No major interactions detected"
                        : "Interactions Detected"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {aiRecommendations.drugInteractions.message}
                    </p>
                  </div>
                </div>
                {aiRecommendations.drugInteractions.interactions &&
                  aiRecommendations.drugInteractions.interactions.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {aiRecommendations.drugInteractions.interactions.map(
                        (interaction, idx) => (
                          <div
                            key={idx}
                            className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                            <p className="font-medium text-sm">
                              {interaction.drug1} + {interaction.drug2}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {interaction.description}
                            </p>
                            {interaction.action && (
                              <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mt-1">
                                Action: {interaction.action}
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Lab Order Suggestions */}
          {aiRecommendations.labOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recommended Lab Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiRecommendations.labOrders.map(
                    (lab: LabOrder, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{lab.test}</p>
                          <p className="text-sm text-muted-foreground">
                            {lab.reason}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{lab.urgency}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onRecommendationSelect?.("lab_order", lab)
                            }>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Differential Diagnosis */}
          {aiRecommendations.differentialDiagnosis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Differential Diagnosis Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="space-y-2">
                    {aiRecommendations.differentialDiagnosis.map(
                      (dd: Diagnosis, index: number) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 border rounded ${
                            dd.type === "destructive"
                              ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                              : dd.type === "default"
                              ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                              : dd.type === "outline"
                              ? "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                              : ""
                          }`}>
                          <span className="font-medium">{dd.diagnosis}</span>
                          <Badge
                            variant={
                              dd.type === "destructive"
                                ? "destructive"
                                : dd.type === "default"
                                ? "default"
                                : "secondary"
                            }>
                            {dd.probability}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preventive Care Gaps */}
          {aiRecommendations.preventiveGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-teal-500" />
                  Quality Measures & Preventive Care Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiRecommendations.preventiveGaps.map(
                    (item: PreventiveGap, index: number) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          item.status === "overdue"
                            ? "bg-red-50 dark:bg-red-950"
                            : item.status === "due"
                            ? "bg-yellow-50 dark:bg-yellow-950"
                            : "bg-green-50 dark:bg-green-950"
                        }`}>
                        <div>
                          <p className="font-medium">{item.measure}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.action}
                          </p>
                        </div>
                        <Badge
                          variant={
                            item.status === "overdue"
                              ? "destructive"
                              : item.status === "due"
                              ? "default"
                              : "secondary"
                          }>
                          {item.status}
                          {item.days !== null && ` (${item.days}d)`}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patient Education */}
          {aiRecommendations.educationTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-pink-500" />
                  Patient Education Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiRecommendations.educationTopics.map(
                    (topic: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{topic}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onRecommendationSelect?.("education", topic)
                          }>
                          <Printer className="h-3 w-3 mr-1" />
                          Print
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Chat Panel */}
      {currentPatientId && (
        <AIChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          patientId={currentPatientId}
          specialtyId={specialtyId}
          initialContext={aiRecommendations?.summary}
        />
      )}
    </div>
  );
}
