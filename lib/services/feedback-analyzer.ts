/**
 * Feedback Analyzer Service
 * Analyzes AI recommendation feedback to identify quality patterns and improvement opportunities
 * 
 * Features:
 * - Aggregates feedback patterns by recommendation type
 * - Identifies low-quality recommendation categories
 * - Calculates acceptance rates and confidence scores
 * - Provides insights for prompt tuning
 * - Supports provider-specific preference learning
 */

import { createClient } from "@/lib/supabase/server";

// Types for feedback analysis
export interface FeedbackPattern {
  recommendationType: string;
  category?: string;
  totalCount: number;
  acceptedCount: number;
  rejectedCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  acceptanceRate: number;
  helpfulnessRate: number;
  averageRating: number;
  commonComments: string[];
  trend: "improving" | "declining" | "stable";
}

export interface ProviderPreference {
  providerId: string;
  preferredCategories: string[];
  dismissedCategories: string[];
  acceptancePatterns: Record<string, number>;
  lastUpdated: Date;
}

export interface QualityInsight {
  type: "warning" | "improvement" | "success";
  category: string;
  message: string;
  metric: string;
  value: number;
  suggestion?: string;
}

export interface FeedbackAnalysisResult {
  overallAcceptanceRate: number;
  overallHelpfulnessRate: number;
  totalRecommendations: number;
  totalFeedback: number;
  patterns: FeedbackPattern[];
  insights: QualityInsight[];
  lowQualityCategories: string[];
  highQualityCategories: string[];
}

/**
 * Analyzes feedback for a specific time period
 */
export async function analyzeFeedback(
  options: {
    specialtyId?: string;
    providerId?: string;
    startDate?: Date;
    endDate?: Date;
    minSampleSize?: number;
  } = {}
): Promise<FeedbackAnalysisResult> {
  const supabase = await createClient();
  const minSampleSize = options.minSampleSize || 10;

  // Build query for recommendations log
  let query = supabase
    .from("ai_recommendations_log")
    .select("*");

  if (options.specialtyId) {
    query = query.eq("specialty_id", options.specialtyId);
  }

  if (options.providerId) {
    query = query.eq("user_id", options.providerId);
  }

  if (options.startDate) {
    query = query.gte("created_at", options.startDate.toISOString());
  }

  if (options.endDate) {
    query = query.lte("created_at", options.endDate.toISOString());
  }

  const { data: recommendations, error: recsError } = await query;

  if (recsError || !recommendations) {
    console.error("Error fetching recommendations:", recsError);
    return {
      overallAcceptanceRate: 0,
      overallHelpfulnessRate: 0,
      totalRecommendations: 0,
      totalFeedback: 0,
      patterns: [],
      insights: [],
      lowQualityCategories: [],
      highQualityCategories: [],
    };
  }

  // Get feedback for these recommendations
  const recommendationIds = recommendations.map((r) => r.id);
  const { data: feedbacks } = await supabase
    .from("ai_feedback")
    .select("*")
    .in("recommendation_id", recommendationIds);

  // Group recommendations by type and category
  const groupedRecs: Record<string, typeof recommendations> = {};
  for (const rec of recommendations) {
    const key = `${rec.recommendation_type}:${rec.recommendation_data?.category || "general"}`;
    if (!groupedRecs[key]) {
      groupedRecs[key] = [];
    }
    groupedRecs[key].push(rec);
  }

  // Calculate patterns for each group
  const patterns: FeedbackPattern[] = [];
  let totalAccepted = 0;
  let totalRejected = 0;
  let totalHelpful = 0;
  let totalNotHelpful = 0;

  for (const [key, recs] of Object.entries(groupedRecs)) {
    const [type, category] = key.split(":");
    const recIds = recs.map((r) => r.id);
    const relatedFeedback = feedbacks?.filter((f) =>
      recIds.includes(f.recommendation_id)
    ) || [];

    const accepted = recs.filter((r) => r.accepted === true).length;
    const rejected = recs.filter((r) => r.rejected === true).length;
    const helpful = relatedFeedback.filter((f) => f.helpful === true).length;
    const notHelpful = relatedFeedback.filter((f) => f.helpful === false).length;
    const ratings = relatedFeedback
      .filter((f) => f.rating != null)
      .map((f) => f.rating!);
    const comments = relatedFeedback
      .filter((f) => f.comment)
      .map((f) => f.comment!);

    totalAccepted += accepted;
    totalRejected += rejected;
    totalHelpful += helpful;
    totalNotHelpful += notHelpful;

    // Calculate trend (compare first half to second half)
    const sortedRecs = [...recs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const midpoint = Math.floor(sortedRecs.length / 2);
    const firstHalf = sortedRecs.slice(0, midpoint);
    const secondHalf = sortedRecs.slice(midpoint);

    const firstHalfAcceptance =
      firstHalf.length > 0
        ? firstHalf.filter((r) => r.accepted).length / firstHalf.length
        : 0;
    const secondHalfAcceptance =
      secondHalf.length > 0
        ? secondHalf.filter((r) => r.accepted).length / secondHalf.length
        : 0;

    let trend: "improving" | "declining" | "stable" = "stable";
    if (secondHalfAcceptance > firstHalfAcceptance + 0.1) {
      trend = "improving";
    } else if (secondHalfAcceptance < firstHalfAcceptance - 0.1) {
      trend = "declining";
    }

    patterns.push({
      recommendationType: type,
      category: category !== "general" ? category : undefined,
      totalCount: recs.length,
      acceptedCount: accepted,
      rejectedCount: rejected,
      helpfulCount: helpful,
      notHelpfulCount: notHelpful,
      acceptanceRate: recs.length > 0 ? accepted / recs.length : 0,
      helpfulnessRate:
        helpful + notHelpful > 0 ? helpful / (helpful + notHelpful) : 0,
      averageRating:
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0,
      commonComments: getTopComments(comments, 3),
      trend,
    });
  }

  // Calculate overall metrics
  const totalWithFeedback = totalAccepted + totalRejected;
  const totalHelpfulFeedback = totalHelpful + totalNotHelpful;

  const overallAcceptanceRate =
    totalWithFeedback > 0 ? totalAccepted / totalWithFeedback : 0;
  const overallHelpfulnessRate =
    totalHelpfulFeedback > 0 ? totalHelpful / totalHelpfulFeedback : 0;

  // Generate insights
  const insights: QualityInsight[] = [];
  const lowQualityCategories: string[] = [];
  const highQualityCategories: string[] = [];

  for (const pattern of patterns) {
    // Only analyze patterns with sufficient sample size
    if (pattern.totalCount < minSampleSize) continue;

    const categoryName = pattern.category || pattern.recommendationType;

    // Low acceptance rate warning
    if (pattern.acceptanceRate < 0.3) {
      lowQualityCategories.push(categoryName);
      insights.push({
        type: "warning",
        category: categoryName,
        message: `Low acceptance rate for ${categoryName} recommendations`,
        metric: "acceptanceRate",
        value: pattern.acceptanceRate,
        suggestion: `Consider reviewing prompt wording for ${categoryName} or adjusting relevance criteria`,
      });
    }

    // Low helpfulness warning
    if (pattern.helpfulnessRate < 0.4 && pattern.helpfulCount + pattern.notHelpfulCount >= 5) {
      if (!lowQualityCategories.includes(categoryName)) {
        lowQualityCategories.push(categoryName);
      }
      insights.push({
        type: "warning",
        category: categoryName,
        message: `Low helpfulness rating for ${categoryName}`,
        metric: "helpfulnessRate",
        value: pattern.helpfulnessRate,
        suggestion: `Review common feedback comments and adjust recommendation specificity`,
      });
    }

    // Declining trend warning
    if (pattern.trend === "declining") {
      insights.push({
        type: "warning",
        category: categoryName,
        message: `Declining acceptance trend for ${categoryName}`,
        metric: "trend",
        value: pattern.acceptanceRate,
        suggestion: `Investigate recent changes that may have affected recommendation quality`,
      });
    }

    // High quality recognition
    if (pattern.acceptanceRate > 0.7 && pattern.helpfulnessRate > 0.7) {
      highQualityCategories.push(categoryName);
      insights.push({
        type: "success",
        category: categoryName,
        message: `High quality ${categoryName} recommendations`,
        metric: "acceptanceRate",
        value: pattern.acceptanceRate,
      });
    }

    // Improvement recognition
    if (pattern.trend === "improving") {
      insights.push({
        type: "improvement",
        category: categoryName,
        message: `Improving acceptance trend for ${categoryName}`,
        metric: "trend",
        value: pattern.acceptanceRate,
      });
    }
  }

  return {
    overallAcceptanceRate,
    overallHelpfulnessRate,
    totalRecommendations: recommendations.length,
    totalFeedback: feedbacks?.length || 0,
    patterns,
    insights,
    lowQualityCategories,
    highQualityCategories,
  };
}

/**
 * Gets provider-specific preferences based on their feedback history
 */
export async function getProviderPreferences(
  providerId: string
): Promise<ProviderPreference | null> {
  const supabase = await createClient();

  // Get all recommendations and feedback for this provider
  const { data: recommendations } = await supabase
    .from("ai_recommendations_log")
    .select("*")
    .eq("user_id", providerId);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Analyze acceptance patterns by category
  const categoryStats: Record<string, { accepted: number; rejected: number; total: number }> = {};

  for (const rec of recommendations) {
    const category = rec.recommendation_data?.category || "general";
    if (!categoryStats[category]) {
      categoryStats[category] = { accepted: 0, rejected: 0, total: 0 };
    }
    categoryStats[category].total++;
    if (rec.accepted) categoryStats[category].accepted++;
    if (rec.rejected) categoryStats[category].rejected++;
  }

  // Identify preferred and dismissed categories
  const preferredCategories: string[] = [];
  const dismissedCategories: string[] = [];
  const acceptancePatterns: Record<string, number> = {};

  for (const [category, stats] of Object.entries(categoryStats)) {
    if (stats.total < 5) continue; // Need minimum sample size

    const acceptanceRate = stats.accepted / stats.total;
    acceptancePatterns[category] = acceptanceRate;

    if (acceptanceRate > 0.7) {
      preferredCategories.push(category);
    } else if (acceptanceRate < 0.2) {
      dismissedCategories.push(category);
    }
  }

  return {
    providerId,
    preferredCategories,
    dismissedCategories,
    acceptancePatterns,
    lastUpdated: new Date(),
  };
}

/**
 * Suggests prompt improvements based on feedback analysis
 */
export async function suggestPromptImprovements(
  specialtyId?: string
): Promise<{
  suggestions: Array<{
    category: string;
    currentIssue: string;
    suggestedChange: string;
    priority: "high" | "medium" | "low";
  }>;
}> {
  const analysis = await analyzeFeedback({ specialtyId, minSampleSize: 20 });
  const suggestions: Array<{
    category: string;
    currentIssue: string;
    suggestedChange: string;
    priority: "high" | "medium" | "low";
  }> = [];

  for (const pattern of analysis.patterns) {
    if (pattern.totalCount < 20) continue;

    const category = pattern.category || pattern.recommendationType;

    // Very low acceptance - high priority
    if (pattern.acceptanceRate < 0.2) {
      suggestions.push({
        category,
        currentIssue: `Only ${Math.round(pattern.acceptanceRate * 100)}% acceptance rate`,
        suggestedChange: `Consider removing or significantly revising ${category} recommendations. Common feedback: ${pattern.commonComments.join("; ") || "No comments available"}`,
        priority: "high",
      });
    }
    // Low acceptance - medium priority
    else if (pattern.acceptanceRate < 0.4) {
      suggestions.push({
        category,
        currentIssue: `Low acceptance rate of ${Math.round(pattern.acceptanceRate * 100)}%`,
        suggestedChange: `Review ${category} recommendations for relevance and specificity. Consider adding more patient-specific context.`,
        priority: "medium",
      });
    }

    // Low helpfulness with feedback
    if (
      pattern.helpfulnessRate < 0.3 &&
      pattern.helpfulCount + pattern.notHelpfulCount >= 10
    ) {
      suggestions.push({
        category,
        currentIssue: `Low helpfulness rating of ${Math.round(pattern.helpfulnessRate * 100)}%`,
        suggestedChange: `Make ${category} recommendations more actionable and specific. Common feedback: ${pattern.commonComments.join("; ") || "No comments available"}`,
        priority: pattern.helpfulnessRate < 0.2 ? "high" : "medium",
      });
    }

    // Declining trend
    if (pattern.trend === "declining" && pattern.acceptanceRate < 0.5) {
      suggestions.push({
        category,
        currentIssue: `Declining acceptance trend for ${category}`,
        suggestedChange: `Investigate recent changes to ${category} logic or prompt. Consider A/B testing different approaches.`,
        priority: "medium",
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return { suggestions };
}

/**
 * Calculates recommendation quality score for display
 */
export function calculateQualityScore(pattern: FeedbackPattern): number {
  // Weighted score based on multiple factors
  const acceptanceWeight = 0.4;
  const helpfulnessWeight = 0.3;
  const ratingWeight = 0.2;
  const trendWeight = 0.1;

  let score = 0;

  // Acceptance rate (0-100)
  score += pattern.acceptanceRate * 100 * acceptanceWeight;

  // Helpfulness rate (0-100)
  score += pattern.helpfulnessRate * 100 * helpfulnessWeight;

  // Average rating (assuming 1-5 scale, convert to 0-100)
  if (pattern.averageRating > 0) {
    score += ((pattern.averageRating - 1) / 4) * 100 * ratingWeight;
  } else {
    // If no ratings, use neutral score
    score += 50 * ratingWeight;
  }

  // Trend bonus/penalty
  if (pattern.trend === "improving") {
    score += 10 * trendWeight;
  } else if (pattern.trend === "declining") {
    score -= 10 * trendWeight;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Helper to extract top N most common comments
 */
function getTopComments(comments: string[], n: number): string[] {
  if (comments.length === 0) return [];

  // Simple frequency count
  const frequency: Record<string, number> = {};
  for (const comment of comments) {
    const normalized = comment.toLowerCase().trim();
    frequency[normalized] = (frequency[normalized] || 0) + 1;
  }

  // Sort by frequency and return top N
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([comment]) => comment);
}

/**
 * Filters recommendations based on provider preferences
 */
export function applyProviderPreferences<T extends { category?: string }>(
  recommendations: T[],
  preferences: ProviderPreference | null,
  options: { filterDismissed?: boolean; boostPreferred?: boolean } = {}
): T[] {
  if (!preferences) return recommendations;

  const { filterDismissed = false, boostPreferred = true } = options;

  let filtered = [...recommendations];

  // Filter out dismissed categories if requested
  if (filterDismissed && preferences.dismissedCategories.length > 0) {
    filtered = filtered.filter(
      (rec) => !preferences.dismissedCategories.includes(rec.category || "")
    );
  }

  // Boost preferred categories to the top if requested
  if (boostPreferred && preferences.preferredCategories.length > 0) {
    filtered.sort((a, b) => {
      const aPreferred = preferences.preferredCategories.includes(a.category || "");
      const bPreferred = preferences.preferredCategories.includes(b.category || "");
      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;
      return 0;
    });
  }

  return filtered;
}
