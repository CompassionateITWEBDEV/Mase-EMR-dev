/**
 * AI Feedback Service
 * Handles user feedback on AI recommendations
 */

import { createClient } from "@/lib/supabase/server";

export interface AIFeedback {
  recommendationId: string;
  userId: string;
  rating?: number;
  comment?: string;
  helpful?: boolean;
}

/**
 * Logs an AI recommendation for tracking
 */
export async function logRecommendation(
  patientId: string,
  specialtyId: string,
  userId: string,
  recommendationType: string,
  recommendationText: string,
  recommendationData?: any
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_recommendations_log")
    .insert({
      patient_id: patientId,
      specialty_id: specialtyId,
      user_id: userId,
      recommendation_type: recommendationType,
      recommendation_text: recommendationText,
      recommendation_data: recommendationData || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error logging recommendation:", error);
    throw new Error("Failed to log recommendation");
  }

  return data.id;
}

/**
 * Records user feedback on a recommendation
 */
export async function submitFeedback(
  recommendationId: string,
  userId: string,
  feedback: {
    rating?: number;
    comment?: string;
    helpful?: boolean;
    accepted?: boolean;
    rejected?: boolean;
  }
): Promise<void> {
  const supabase = await createClient();

  // Update recommendation log
  if (feedback.accepted !== undefined || feedback.rejected !== undefined) {
    await supabase
      .from("ai_recommendations_log")
      .update({
        accepted: feedback.accepted,
        rejected: feedback.rejected,
        feedback: feedback.comment,
      })
      .eq("id", recommendationId);
  }

  // Add feedback entry
  if (feedback.rating || feedback.comment || feedback.helpful !== undefined) {
    await supabase.from("ai_feedback").insert({
      recommendation_id: recommendationId,
      user_id: userId,
      rating: feedback.rating,
      comment: feedback.comment,
      helpful: feedback.helpful,
    });
  }
}

/**
 * Gets feedback statistics for recommendations
 */
export async function getFeedbackStats(
  recommendationType?: string,
  specialtyId?: string
): Promise<{
  total: number;
  accepted: number;
  rejected: number;
  averageRating: number;
  helpfulCount: number;
}> {
  const supabase = await createClient();

  let query = supabase.from("ai_recommendations_log").select("*", { count: "exact" });

  if (recommendationType) {
    query = query.eq("recommendation_type", recommendationType);
  }

  if (specialtyId) {
    query = query.eq("specialty_id", specialtyId);
  }

  const { data: logs, error: logsError } = await query;

  if (logsError || !logs) {
    return {
      total: 0,
      accepted: 0,
      rejected: 0,
      averageRating: 0,
      helpfulCount: 0,
    };
  }

  const accepted = logs.filter((l) => l.accepted === true).length;
  const rejected = logs.filter((l) => l.rejected === true).length;

  // Get feedback ratings
  const recommendationIds = logs.map((l) => l.id);
  const { data: feedbacks } = await supabase
    .from("ai_feedback")
    .select("rating, helpful")
    .in("recommendation_id", recommendationIds);

  const ratings = feedbacks?.filter((f) => f.rating).map((f) => f.rating!) || [];
  const averageRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const helpfulCount = feedbacks?.filter((f) => f.helpful === true).length || 0;

  return {
    total: logs.length,
    accepted,
    rejected,
    averageRating: Math.round(averageRating * 10) / 10,
    helpfulCount,
  };
}
