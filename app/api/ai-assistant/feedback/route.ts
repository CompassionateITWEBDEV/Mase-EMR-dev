/**
 * AI Feedback API
 * Handles user feedback on AI recommendations
 */

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { submitFeedback } from "@/lib/services/ai-feedback";

export async function POST(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recommendationId, helpful, rating, comment, accepted, rejected } = body;

    if (!recommendationId) {
      return NextResponse.json(
        { error: "Recommendation ID is required" },
        { status: 400 }
      );
    }

    await submitFeedback(recommendationId, user.id, {
      helpful,
      rating,
      comment,
      accepted,
      rejected,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Feedback submission error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
