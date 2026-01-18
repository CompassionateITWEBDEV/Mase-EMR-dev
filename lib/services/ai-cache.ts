/**
 * AI Analysis Cache Service
 * Caches AI analysis results to improve performance and reduce costs
 */

import { createClient } from "@/lib/supabase/server";
import { createHash } from "node:crypto";

export interface CachedAnalysis {
  id: string;
  patient_id: string;
  specialty_id: string;
  data_hash: string;
  recommendations: any;
  generated_at: string;
  expires_at: string;
}

/**
 * Generates a hash of patient data to detect changes
 */
export function generateDataHash(
  patientId: string,
  specialtyId: string,
  dataContext: string
): string {
  const hash = createHash("sha256");
  hash.update(`${patientId}:${specialtyId}:${dataContext}`);
  return hash.digest("hex");
}

/**
 * Gets cached AI analysis if available and not expired
 */
export async function getCachedAnalysis(
  patientId: string,
  specialtyId: string,
  dataHash: string
): Promise<CachedAnalysis | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_analysis_cache")
    .select("*")
    .eq("patient_id", patientId)
    .eq("specialty_id", specialtyId)
    .eq("data_hash", dataHash)
    .gt("expires_at", new Date().toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as CachedAnalysis;
}

/**
 * Stores AI analysis in cache
 */
export async function cacheAnalysis(
  patientId: string,
  specialtyId: string,
  dataHash: string,
  recommendations: any,
  ttlMinutes: number = 5
): Promise<void> {
  const supabase = await createClient();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

  const { error } = await supabase.from("ai_analysis_cache").upsert(
    {
      patient_id: patientId,
      specialty_id: specialtyId,
      data_hash: dataHash,
      recommendations,
      expires_at: expiresAt.toISOString(),
    },
    {
      onConflict: "patient_id,specialty_id,data_hash",
    }
  );

  if (error) {
    console.error("Error caching AI analysis:", error);
    // Don't throw - caching is non-critical
  }
}

/**
 * Invalidates cache for a patient (when new data is added)
 */
export async function invalidatePatientCache(
  patientId: string,
  specialtyId?: string
): Promise<void> {
  const supabase = await createClient();

  const query = supabase
    .from("ai_analysis_cache")
    .delete()
    .eq("patient_id", patientId);

  if (specialtyId) {
    query.eq("specialty_id", specialtyId);
  }

  const { error } = await query;

  if (error) {
    console.error("Error invalidating cache:", error);
  }
}

/**
 * Cleans up expired cache entries (should be run periodically)
 */
export async function cleanupExpiredCache(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_analysis_cache")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select();

  if (error) {
    console.error("Error cleaning up cache:", error);
    return 0;
  }

  return data?.length || 0;
}
