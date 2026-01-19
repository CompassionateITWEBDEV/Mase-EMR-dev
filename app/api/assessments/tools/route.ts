/**
 * Assessment Tools API Route
 * Returns list of available assessment tools
 */

import { NextResponse } from "next/server";
import type { AssessmentTool } from "@/types/clinical";

/**
 * GET /api/assessments/tools
 * Return list of available assessment tools
 */
export async function GET() {
  try {
    // For now, return hardcoded list. In the future, this could come from a database table
    const tools: AssessmentTool[] = [
      {
        name: "PHQ-9",
        description: "Patient Health Questionnaire - Depression",
        questions: 9,
        time: "5 min",
      },
      {
        name: "GAD-7",
        description: "Generalized Anxiety Disorder Scale",
        questions: 7,
        time: "3 min",
      },
      {
        name: "AUDIT-C",
        description: "Alcohol Use Screening",
        questions: 3,
        time: "2 min",
      },
      {
        name: "DAST-10",
        description: "Drug Abuse Screening Test",
        questions: 10,
        time: "5 min",
      },
      {
        name: "MMSE",
        description: "Mini-Mental State Examination",
        questions: 11,
        time: "10 min",
      },
      {
        name: "MoCA",
        description: "Montreal Cognitive Assessment",
        questions: 13,
        time: "10 min",
      },
      {
        name: "Fall Risk Assessment",
        description: "Fall Risk Screening Tool",
        questions: 12,
        time: "8 min",
      },
      {
        name: "Cardiovascular Risk",
        description: "ASCVD Risk Calculator",
        questions: 8,
        time: "5 min",
      },
      {
        name: "Diabetes Risk",
        description: "ADA Diabetes Risk Test",
        questions: 7,
        time: "3 min",
      },
      {
        name: "Nutrition Screening",
        description: "Mini Nutritional Assessment",
        questions: 6,
        time: "4 min",
      },
    ];

    return NextResponse.json({ tools });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[API] Assessment tools API error:", err);
    return NextResponse.json(
      { tools: [], error: err.message || "Failed to fetch assessment tools" },
      { status: 500 }
    );
  }
}

