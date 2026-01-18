/**
 * Enhanced AI Response Caching Service
 * Provides multi-tier caching for AI responses with Redis support
 * 
 * Features:
 * - Redis-based distributed caching (when available)
 * - In-memory fallback cache
 * - Configurable TTL per cache type
 * - Cache invalidation strategies
 * - Cache statistics and monitoring
 * - Compression for large responses
 */

import type { AIRecommendation } from "@/types/ai-assistant";

// Cache configuration
interface CacheConfig {
  /** Redis URL (optional - falls back to in-memory if not provided) */
  redisUrl?: string;
  /** Default TTL in seconds */
  defaultTtl: number;
  /** Maximum in-memory cache size */
  maxMemoryCacheSize: number;
  /** Enable compression for large responses */
  enableCompression: boolean;
  /** Compression threshold in bytes */
  compressionThreshold: number;
}

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  compressed: boolean;
  size: number;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  itemCount: number;
  hitRate: number;
  avgResponseTime: number;
  memoryUsage: number;
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  redisUrl: process.env.REDIS_URL,
  defaultTtl: 300, // 5 minutes
  maxMemoryCacheSize: 100, // Maximum 100 items in memory
  enableCompression: true,
  compressionThreshold: 10000, // 10KB
};

// In-memory cache storage
const memoryCache = new Map<string, CacheEntry<any>>();
let cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  size: 0,
  itemCount: 0,
  hitRate: 0,
  avgResponseTime: 0,
  memoryUsage: 0,
};

// Response time tracking
const responseTimes: number[] = [];

/**
 * Redis client wrapper (lazy initialization)
 */
let redisClient: any = null;
let redisAvailable = false;

async function getRedisClient() {
  if (redisClient !== null) {
    return redisAvailable ? redisClient : null;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    redisAvailable = false;
    return null;
  }

  try {
    // Dynamic import to avoid issues when Redis is not installed
    // Using Function constructor to prevent TypeScript from analyzing the import
    const dynamicImport = new Function("moduleName", "return import(moduleName)");
    const redis = await dynamicImport("redis");
    const { createClient } = redis;
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on("error", (err: Error) => {
      console.error("Redis client error:", err);
      redisAvailable = false;
    });

    redisClient.on("connect", () => {
      console.log("Redis client connected");
      redisAvailable = true;
    });

    await redisClient.connect();
    redisAvailable = true;
    return redisClient;
  } catch (error) {
    console.warn("Redis not available, using in-memory cache:", error);
    redisAvailable = false;
    return null;
  }
}

/**
 * Generate cache key for AI analysis
 */
export function generateCacheKey(
  patientId: string,
  specialtyId: string,
  analysisType: string,
  focusAreas?: string[],
  dataHash?: string
): string {
  const focusKey = focusAreas?.sort().join(",") || "all";
  const hashKey = dataHash || "default";
  return `ai:analysis:${patientId}:${specialtyId}:${analysisType}:${focusKey}:${hashKey}`;
}

/**
 * Generate cache key for drug interactions
 */
export function generateDrugInteractionCacheKey(
  medications: string[]
): string {
  const sortedMeds = [...medications].sort().join(",");
  return `ai:drugs:${Buffer.from(sortedMeds).toString("base64").slice(0, 32)}`;
}

/**
 * Generate cache key for predictive insights
 */
export function generatePredictiveCacheKey(
  patientId: string
): string {
  return `ai:predictive:${patientId}`;
}

/**
 * Simple compression using base64 encoding
 * In production, use proper compression like zlib
 */
function compress(data: string): string {
  return Buffer.from(data).toString("base64");
}

function decompress(data: string): string {
  return Buffer.from(data, "base64").toString("utf-8");
}

/**
 * Set cache entry
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = DEFAULT_CONFIG.defaultTtl
): Promise<void> {
  const startTime = Date.now();
  const serialized = JSON.stringify(data);
  const size = serialized.length;
  
  // Determine if compression should be used
  const shouldCompress = DEFAULT_CONFIG.enableCompression && 
    size > DEFAULT_CONFIG.compressionThreshold;
  
  const storedData = shouldCompress ? compress(serialized) : serialized;
  
  const entry: CacheEntry<string> = {
    data: storedData,
    createdAt: Date.now(),
    expiresAt: Date.now() + (ttlSeconds * 1000),
    accessCount: 0,
    lastAccessed: Date.now(),
    compressed: shouldCompress,
    size,
  };

  // Try Redis first
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.setEx(key, ttlSeconds, JSON.stringify(entry));
    } catch (error) {
      console.error("Redis set error:", error);
      // Fall through to memory cache
    }
  }

  // Always store in memory cache as well (for faster access)
  setMemoryCache(key, entry);
  
  // Track response time
  trackResponseTime(Date.now() - startTime);
}

/**
 * Get cache entry
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const startTime = Date.now();

  // Check memory cache first (fastest)
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    memoryEntry.accessCount++;
    memoryEntry.lastAccessed = Date.now();
    cacheStats.hits++;
    updateHitRate();
    trackResponseTime(Date.now() - startTime);
    
    const data = memoryEntry.compressed 
      ? decompress(memoryEntry.data)
      : memoryEntry.data;
    return JSON.parse(data) as T;
  }

  // Check Redis
  const redis = await getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        const entry: CacheEntry<string> = JSON.parse(cached);
        if (entry.expiresAt > Date.now()) {
          // Update memory cache
          setMemoryCache(key, entry);
          
          cacheStats.hits++;
          updateHitRate();
          trackResponseTime(Date.now() - startTime);
          
          const data = entry.compressed 
            ? decompress(entry.data)
            : entry.data;
          return JSON.parse(data) as T;
        }
      }
    } catch (error) {
      console.error("Redis get error:", error);
    }
  }

  cacheStats.misses++;
  updateHitRate();
  trackResponseTime(Date.now() - startTime);
  return null;
}

/**
 * Delete cache entry
 */
export async function deleteCache(key: string): Promise<void> {
  // Remove from memory
  memoryCache.delete(key);
  
  // Remove from Redis
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Redis delete error:", error);
    }
  }
  
  updateCacheStats();
}

/**
 * Clear all cache entries matching a pattern
 */
export async function clearCachePattern(pattern: string): Promise<number> {
  let cleared = 0;

  // Clear from memory
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern) || matchPattern(key, pattern)) {
      memoryCache.delete(key);
      cleared++;
    }
  }

  // Clear from Redis
  const redis = await getRedisClient();
  if (redis) {
    try {
      const keys = await redis.keys(pattern.replace("*", "*"));
      if (keys.length > 0) {
        await redis.del(keys);
        cleared += keys.length;
      }
    } catch (error) {
      console.error("Redis clear pattern error:", error);
    }
  }

  updateCacheStats();
  return cleared;
}

/**
 * Invalidate cache for a specific patient
 */
export async function invalidatePatientCache(patientId: string): Promise<void> {
  await clearCachePattern(`ai:*:${patientId}:*`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  updateCacheStats();
  return { ...cacheStats };
}

/**
 * Warm up cache with pre-computed results
 */
export async function warmUpCache(
  entries: Array<{ key: string; data: any; ttl?: number }>
): Promise<void> {
  for (const entry of entries) {
    await setCache(entry.key, entry.data, entry.ttl);
  }
}

// Helper functions

function setMemoryCache(key: string, entry: CacheEntry<string>): void {
  // Enforce max cache size with LRU eviction
  if (memoryCache.size >= DEFAULT_CONFIG.maxMemoryCacheSize) {
    evictLRU();
  }
  memoryCache.set(key, entry);
  updateCacheStats();
}

function evictLRU(): void {
  let oldestKey: string | null = null;
  let oldestAccess = Infinity;

  for (const [key, entry] of memoryCache.entries()) {
    if (entry.lastAccessed < oldestAccess) {
      oldestAccess = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    memoryCache.delete(oldestKey);
  }
}

function updateCacheStats(): void {
  cacheStats.itemCount = memoryCache.size;
  cacheStats.size = Array.from(memoryCache.values()).reduce(
    (sum, entry) => sum + entry.size,
    0
  );
  cacheStats.memoryUsage = process.memoryUsage?.()?.heapUsed || 0;
}

function updateHitRate(): void {
  const total = cacheStats.hits + cacheStats.misses;
  cacheStats.hitRate = total > 0 ? cacheStats.hits / total : 0;
}

function trackResponseTime(ms: number): void {
  responseTimes.push(ms);
  // Keep only last 100 response times
  if (responseTimes.length > 100) {
    responseTimes.shift();
  }
  cacheStats.avgResponseTime = 
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
}

function matchPattern(str: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${regexPattern}$`).test(str);
}

/**
 * Cache decorator for async functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlSeconds: number = DEFAULT_CONFIG.defaultTtl
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try to get from cache
    const cached = await getCache<Awaited<ReturnType<T>>>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn(...args);
    await setCache(key, result, ttlSeconds);
    
    return result;
  }) as T;
}

/**
 * Cached AI analysis function wrapper
 */
export async function getCachedAnalysis(
  patientId: string,
  specialtyId: string,
  dataHash: string,
  analysisType: string = "full",
  focusAreas?: string[]
): Promise<{ recommendations: AIRecommendation; generated_at: string } | null> {
  const key = generateCacheKey(patientId, specialtyId, analysisType, focusAreas, dataHash);
  return getCache(key);
}

/**
 * Cache AI analysis result
 */
export async function cacheAnalysis(
  patientId: string,
  specialtyId: string,
  dataHash: string,
  recommendations: AIRecommendation,
  ttlMinutes: number = 5,
  analysisType: string = "full",
  focusAreas?: string[]
): Promise<void> {
  const key = generateCacheKey(patientId, specialtyId, analysisType, focusAreas, dataHash);
  await setCache(
    key,
    {
      recommendations,
      generated_at: new Date().toISOString(),
    },
    ttlMinutes * 60
  );
}

/**
 * Pre-warm cache for high-priority patients
 * Can be called from a background job
 */
export async function preWarmPatientCache(
  patientIds: string[],
  analysisFunction: (patientId: string) => Promise<AIRecommendation>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const patientId of patientIds) {
    try {
      const result = await analysisFunction(patientId);
      await cacheAnalysis(
        patientId,
        "primary-care",
        "prewarm",
        result,
        30 // 30 minutes for pre-warmed cache
      );
      success++;
    } catch (error) {
      console.error(`Failed to pre-warm cache for patient ${patientId}:`, error);
      failed++;
    }
  }

  return { success, failed };
}
