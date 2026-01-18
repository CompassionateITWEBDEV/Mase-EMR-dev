/**
 * Workflow Integration Hooks
 * Provides hooks for integrating AI recommendations into clinical workflows
 * 
 * These hooks enable:
 * - Inserting AI-generated content into clinical notes
 * - Creating lab orders from AI suggestions
 * - Generating treatment plans from recommendations
 * - Tracking workflow actions for analytics
 */

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AIRecommendation, LabOrder, ClinicalRecommendation } from "@/types/ai-assistant";

// Types for workflow actions
export interface WorkflowAction {
  type: "insert_note" | "create_lab_order" | "create_treatment_plan" | "accept_recommendation" | "print_education";
  data: any;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface InsertNoteOptions {
  patientId: string;
  encounterId?: string;
  content: string;
  section?: "subjective" | "objective" | "assessment" | "plan" | "general";
  source: "ai_summary" | "ai_recommendation" | "ai_treatment_plan";
}

export interface CreateLabOrderOptions {
  patientId: string;
  encounterId?: string;
  labOrder: LabOrder;
  source: "ai_recommendation";
}

export interface AcceptRecommendationOptions {
  recommendationId: string;
  patientId: string;
  action: "implemented" | "scheduled" | "deferred" | "declined";
  notes?: string;
}

/**
 * Hook for inserting AI-generated content into clinical notes
 */
export function useInsertIntoNote() {
  const queryClient = useQueryClient();
  const [lastAction, setLastAction] = useState<WorkflowAction | null>(null);

  const mutation = useMutation({
    mutationFn: async (options: InsertNoteOptions) => {
      const response = await fetch("/api/encounters/notes/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: options.patientId,
          encounterId: options.encounterId,
          content: options.content,
          section: options.section || "general",
          source: options.source,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to insert into note");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setLastAction({
        type: "insert_note",
        data: variables,
        timestamp: new Date(),
        success: true,
      });

      // Invalidate relevant queries
      if (variables.encounterId) {
        queryClient.invalidateQueries({
          queryKey: ["encounter", variables.encounterId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["patient-encounters", variables.patientId],
      });
    },
    onError: (error, variables) => {
      setLastAction({
        type: "insert_note",
        data: variables,
        timestamp: new Date(),
        success: false,
        error: error.message,
      });
    },
  });

  const insertIntoNote = useCallback(
    (options: InsertNoteOptions) => {
      return mutation.mutateAsync(options);
    },
    [mutation]
  );

  // Helper to format AI summary for note insertion
  const formatSummaryForNote = useCallback((summary: string): string => {
    return `[AI-Generated Summary]\n${summary}\n[End AI Summary]`;
  }, []);

  // Helper to format recommendations for note insertion
  const formatRecommendationsForNote = useCallback(
    (recommendations: ClinicalRecommendation[]): string => {
      const lines = ["[AI-Generated Recommendations]"];
      recommendations.forEach((rec, idx) => {
        lines.push(`${idx + 1}. ${rec.category}: ${rec.text}`);
      });
      lines.push("[End AI Recommendations]");
      return lines.join("\n");
    },
    []
  );

  return {
    insertIntoNote,
    formatSummaryForNote,
    formatRecommendationsForNote,
    isLoading: mutation.isPending,
    lastAction,
    error: mutation.error,
  };
}

/**
 * Hook for creating lab orders from AI suggestions
 */
export function useCreateLabOrder() {
  const queryClient = useQueryClient();
  const [lastAction, setLastAction] = useState<WorkflowAction | null>(null);

  const mutation = useMutation({
    mutationFn: async (options: CreateLabOrderOptions) => {
      const response = await fetch("/api/lab-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: options.patientId,
          encounterId: options.encounterId,
          testName: options.labOrder.test,
          reason: options.labOrder.reason,
          urgency: options.labOrder.urgency,
          source: options.source,
          aiGenerated: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lab order");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setLastAction({
        type: "create_lab_order",
        data: variables,
        timestamp: new Date(),
        success: true,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["patient-lab-orders", variables.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["pending-lab-orders"],
      });
    },
    onError: (error, variables) => {
      setLastAction({
        type: "create_lab_order",
        data: variables,
        timestamp: new Date(),
        success: false,
        error: error.message,
      });
    },
  });

  const createLabOrder = useCallback(
    (options: CreateLabOrderOptions) => {
      return mutation.mutateAsync(options);
    },
    [mutation]
  );

  return {
    createLabOrder,
    isLoading: mutation.isPending,
    lastAction,
    error: mutation.error,
  };
}

/**
 * Hook for accepting/tracking AI recommendations
 */
export function useAcceptRecommendation() {
  const [lastAction, setLastAction] = useState<WorkflowAction | null>(null);

  const mutation = useMutation({
    mutationFn: async (options: AcceptRecommendationOptions) => {
      const response = await fetch("/api/ai-assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: options.recommendationId,
          accepted: options.action === "implemented" || options.action === "scheduled",
          rejected: options.action === "declined",
          comment: options.notes,
          action: options.action,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to record recommendation action");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setLastAction({
        type: "accept_recommendation",
        data: variables,
        timestamp: new Date(),
        success: true,
      });
    },
    onError: (error, variables) => {
      setLastAction({
        type: "accept_recommendation",
        data: variables,
        timestamp: new Date(),
        success: false,
        error: error.message,
      });
    },
  });

  const acceptRecommendation = useCallback(
    (options: AcceptRecommendationOptions) => {
      return mutation.mutateAsync(options);
    },
    [mutation]
  );

  return {
    acceptRecommendation,
    isLoading: mutation.isPending,
    lastAction,
    error: mutation.error,
  };
}

/**
 * Hook for generating and saving treatment plans
 */
export function useGenerateTreatmentPlan() {
  const queryClient = useQueryClient();
  const [lastAction, setLastAction] = useState<WorkflowAction | null>(null);

  const mutation = useMutation({
    mutationFn: async (options: {
      patientId: string;
      specialtyId: string;
      aiRecommendations?: AIRecommendation;
      saveToChart?: boolean;
    }) => {
      const response = await fetch("/api/ai-assistant/treatment-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: options.patientId,
          specialtyId: options.specialtyId,
          aiRecommendations: options.aiRecommendations,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate treatment plan");
      }

      const data = await response.json();

      // Optionally save to patient's chart
      if (options.saveToChart && data.treatmentPlan) {
        await fetch("/api/treatment-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: options.patientId,
            plan: data.treatmentPlan,
            aiGenerated: true,
          }),
        });
      }

      return data;
    },
    onSuccess: (data, variables) => {
      setLastAction({
        type: "create_treatment_plan",
        data: variables,
        timestamp: new Date(),
        success: true,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["patient-treatment-plans", variables.patientId],
      });
    },
    onError: (error, variables) => {
      setLastAction({
        type: "create_treatment_plan",
        data: variables,
        timestamp: new Date(),
        success: false,
        error: error.message,
      });
    },
  });

  const generateTreatmentPlan = useCallback(
    (options: {
      patientId: string;
      specialtyId: string;
      aiRecommendations?: AIRecommendation;
      saveToChart?: boolean;
    }) => {
      return mutation.mutateAsync(options);
    },
    [mutation]
  );

  return {
    generateTreatmentPlan,
    isLoading: mutation.isPending,
    lastAction,
    error: mutation.error,
    data: mutation.data,
  };
}

/**
 * Hook for printing patient education materials
 */
export function usePrintEducation() {
  const [lastAction, setLastAction] = useState<WorkflowAction | null>(null);

  const printEducation = useCallback(
    async (topic: string, patientId?: string) => {
      try {
        // Log the print action
        if (patientId) {
          await fetch("/api/patient-education/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId,
              topic,
              action: "print",
              timestamp: new Date().toISOString(),
            }),
          }).catch(() => {
            // Don't fail if logging fails
          });
        }

        // Open print dialog with education content
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Patient Education: ${topic}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 20px;
                  line-height: 1.6;
                }
                h1 {
                  color: #333;
                  border-bottom: 2px solid #007bff;
                  padding-bottom: 10px;
                }
                .disclaimer {
                  background: #f8f9fa;
                  padding: 10px;
                  border-radius: 4px;
                  font-size: 0.9em;
                  margin-top: 20px;
                }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              <h1>Patient Education: ${topic}</h1>
              <p>This educational material has been provided by your healthcare provider to help you understand your health condition better.</p>
              <p><strong>Topic:</strong> ${topic}</p>
              <p>Please discuss any questions with your healthcare provider at your next visit.</p>
              <div class="disclaimer">
                <strong>Disclaimer:</strong> This information is for educational purposes only and should not replace professional medical advice. Always consult with your healthcare provider for personalized guidance.
              </div>
              <p style="margin-top: 20px; font-size: 0.8em; color: #666;">
                Generated on: ${new Date().toLocaleDateString()}
              </p>
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }

        setLastAction({
          type: "print_education",
          data: { topic, patientId },
          timestamp: new Date(),
          success: true,
        });

        return { success: true };
      } catch (error) {
        setLastAction({
          type: "print_education",
          data: { topic, patientId },
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : "Print failed",
        });
        throw error;
      }
    },
    []
  );

  return {
    printEducation,
    lastAction,
  };
}

/**
 * Combined hook for all workflow integrations
 */
export function useAIWorkflowIntegration() {
  const insertNote = useInsertIntoNote();
  const labOrder = useCreateLabOrder();
  const recommendation = useAcceptRecommendation();
  const treatmentPlan = useGenerateTreatmentPlan();
  const education = usePrintEducation();

  return {
    insertNote,
    labOrder,
    recommendation,
    treatmentPlan,
    education,
    isAnyLoading:
      insertNote.isLoading ||
      labOrder.isLoading ||
      recommendation.isLoading ||
      treatmentPlan.isLoading,
  };
}
