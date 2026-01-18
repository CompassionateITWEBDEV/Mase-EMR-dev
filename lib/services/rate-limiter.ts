/**
 * Rate Limiting Service
 * Prevents AI service abuse by limiting requests per user/clinic
 */

import { createClient } from "@/lib/supabase/server";

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  perUser?: boolean;
  perClinic?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  ai_assistant: {
    maxRequests: 100, // 100 requests per window
    windowMinutes: 60, // 1 hour window
    perUser: true,
  },
  ai_assistant_clinic: {
    maxRequests: 1000, // 1000 requests per window per clinic
    windowMinutes: 60,
    perClinic: true,
  },
  treatment_plan: {
    maxRequests: 50,
    windowMinutes: 60,
    perUser: true,
  },
  note_draft: {
    maxRequests: 200,
    windowMinutes: 60,
    perUser: true,
  },
};

/**
 * Checks if a request is within rate limits
 */
export async function checkRateLimit(
  userId: string,
  clinicId: string | null,
  endpoint: string = "ai_assistant"
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[endpoint] || RATE_LIMIT_CONFIGS.ai_assistant;
  const supabase = await createClient();

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

  // Get clinic ID if needed
  let effectiveClinicId = clinicId;
  if (!effectiveClinicId && config.perClinic) {
    // Try to get clinic from user
    const { data: userData } = await supabase
      .from("staff")
      .select("clinic_id")
      .eq("user_id", userId)
      .single();
    effectiveClinicId = userData?.clinic_id || null;
  }

  // Count requests in the current window
  let query = supabase
    .from("ai_rate_limits")
    .select("*", { count: "exact" })
    .gte("created_at", windowStart.toISOString());

  if (config.perUser) {
    query = query.eq("user_id", userId);
  }

  if (config.perClinic && effectiveClinicId) {
    query = query.eq("clinic_id", effectiveClinicId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error checking rate limit:", error);
    // Fail open - allow request if we can't check
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
      limit: config.maxRequests,
    };
  }

  const requestCount = count || 0;
  const remaining = Math.max(0, config.maxRequests - requestCount);
  const allowed = requestCount < config.maxRequests;
  const resetAt = new Date(now.getTime() + config.windowMinutes * 60 * 1000);

  return {
    allowed,
    remaining,
    resetAt,
    limit: config.maxRequests,
  };
}

/**
 * Records a request for rate limiting
 */
export async function recordRequest(
  userId: string,
  clinicId: string | null,
  endpoint: string = "ai_assistant"
): Promise<void> {
  const supabase = await createClient();

  // Get clinic ID if needed
  let effectiveClinicId = clinicId;
  if (!effectiveClinicId) {
    const { data: userData } = await supabase
      .from("staff")
      .select("clinic_id")
      .eq("user_id", userId)
      .single();
    effectiveClinicId = userData?.clinic_id || null;
  }

  const { error } = await supabase.from("ai_rate_limits").insert({
    user_id: userId,
    clinic_id: effectiveClinicId,
    endpoint,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error recording rate limit:", error);
    // Don't throw - rate limiting is non-critical
  }
}

/**
 * Cleans up old rate limit records (should be run periodically)
 */
export async function cleanupRateLimits(windowMinutes: number = 120): Promise<number> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);

  const { data, error } = await supabase
    .from("ai_rate_limits")
    .delete()
    .lt("created_at", cutoff.toISOString())
    .select();

  if (error) {
    console.error("Error cleaning up rate limits:", error);
    return 0;
  }

  return data?.length || 0;
}
