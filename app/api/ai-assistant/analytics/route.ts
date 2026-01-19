/**
 * AI Assistant Analytics API
 * Provides analytics data for AI usage, acceptance rates, and costs
 */

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import { getFeedbackStats } from "@/lib/services/ai-feedback";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get("specialtyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const clinicId = searchParams.get("clinicId");

    const supabase = await createClient();

    // Build date filter
    let dateFilter = "";
    if (startDate) {
      dateFilter += ` AND created_at >= '${startDate}'`;
    }
    if (endDate) {
      dateFilter += ` AND created_at <= '${endDate}'`;
    }

    // Get usage statistics
    let usageQuery = supabase
      .from("ai_recommendations_log")
      .select("*", { count: "exact" });

    if (specialtyId) {
      usageQuery = usageQuery.eq("specialty_id", specialtyId);
    }

    if (startDate || endDate) {
      if (startDate) {
        usageQuery = usageQuery.gte("created_at", startDate);
      }
      if (endDate) {
        usageQuery = usageQuery.lte("created_at", endDate);
      }
    }

    const { data: usageData, count: totalUsage } = await usageQuery;

    // Get usage by specialty
    const specialtyUsageResult = await supabase
      .from("ai_recommendations_log")
      .select("specialty_id");
    
    const specialtyUsage = specialtyUsageResult.data
      ? (() => {
          const counts: Record<string, number> = {};
          specialtyUsageResult.data.forEach((row) => {
            counts[row.specialty_id] = (counts[row.specialty_id] || 0) + 1;
          });
          return Object.entries(counts).map(([id, count]) => ({ specialtyId: id, count }));
        })()
      : [];

    // Get usage by role
    const roleUsageResult = await supabase
      .from("ai_recommendations_log")
      .select("user_id");
    
    const roleUsage = roleUsageResult.data
      ? await (async () => {
          const userIds = [...new Set(roleUsageResult.data.map((r) => r.user_id))];
          const roleCounts: Record<string, number> = {};

          for (const userId of userIds) {
            const { data: staff } = await supabase
              .from("staff")
              .select("role")
              .eq("user_id", userId)
              .single();

            const role = staff?.role || "unknown";
            const count = roleUsageResult.data.filter((r) => r.user_id === userId).length;
            roleCounts[role] = (roleCounts[role] || 0) + count;
          }

          return Object.entries(roleCounts).map(([role, count]) => ({ role, count }));
        })()
      : [];

    // Get acceptance rates
    const { data: acceptanceData } = await supabase
      .from("ai_recommendations_log")
      .select("accepted, rejected");

    const accepted = acceptanceData?.filter((r) => r.accepted === true).length || 0;
    const rejected = acceptanceData?.filter((r) => r.rejected === true).length || 0;
    const totalWithFeedback = accepted + rejected;
    const acceptanceRate = totalWithFeedback > 0 ? (accepted / totalWithFeedback) * 100 : 0;

    // Get recommendation type distribution
    const typeDistributionResult = await supabase
      .from("ai_recommendations_log")
      .select("recommendation_type");
    
    const typeDistribution = typeDistributionResult.data
      ? (() => {
          const counts: Record<string, number> = {};
          typeDistributionResult.data.forEach((row) => {
            counts[row.recommendation_type] = (counts[row.recommendation_type] || 0) + 1;
          });
          return Object.entries(counts).map(([type, count]) => ({
            type,
            count,
            percentage: ((count / typeDistributionResult.data.length) * 100).toFixed(1),
          }));
        })()
      : [];

    // Get feedback statistics
    const feedbackStats = await getFeedbackStats(specialtyId || undefined);

    // Get cache hit rate (approximate)
    const { count: cacheHits } = await supabase
      .from("ai_analysis_cache")
      .select("*", { count: "exact", head: true })
      .gt("expires_at", new Date().toISOString());

    // Estimate costs (rough calculation - adjust based on actual pricing)
    const estimatedCostPerRequest = 0.01; // $0.01 per AI request (adjust based on actual costs)
    const totalRequests = totalUsage || 0;
    const estimatedCost = totalRequests * estimatedCostPerRequest;

    return NextResponse.json({
      usage: {
        total: totalUsage || 0,
        bySpecialty: specialtyUsage,
        byRole: roleUsage,
      },
      acceptance: {
        rate: Math.round(acceptanceRate * 10) / 10,
        accepted,
        rejected,
        totalWithFeedback,
      },
      recommendations: {
        typeDistribution: typeDistribution,
        feedbackStats,
      },
      performance: {
        cacheHits: cacheHits || 0,
        cacheHitRate: totalRequests > 0 ? ((cacheHits || 0) / totalRequests) * 100 : 0,
      },
      costs: {
        estimatedTotal: Math.round(estimatedCost * 100) / 100,
        estimatedPerRequest: estimatedCostPerRequest,
        totalRequests,
      },
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Analytics error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to get analytics" },
      { status: 500 }
    );
  }
}
