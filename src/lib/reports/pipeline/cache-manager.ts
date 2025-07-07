/**
 * Cache Manager
 *
 * Handles caching strategies for data pipeline results with TTL support
 * and configurable cache policies.
 */

import type { CacheConfig, ReportData, AppliedFilter } from "@/types/reports";

// =============================================================================
// CACHE MANAGER
// =============================================================================

export class CacheManager {
  private cache = new Map<string, { data: unknown; expires: Date }>();

  /**
   * Generate cache key from pipeline ID and filters
   */
  generateCacheKey(pipelineId: string, filters: AppliedFilter[]): string {
    const filterString = filters
      .map((f) => `${f.id}:${JSON.stringify(f.value)}`)
      .toSorted((a, b) => a.localeCompare(b))
      .join("|");

    const hashInput = `${pipelineId}:${filterString}`;

    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.codePointAt(i) ?? 0;
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `pipeline_${Math.abs(hash)}`;
  }

  /**
   * Get cached data if valid
   */
  getCachedData<T>(key: string, config: CacheConfig): ReportData<T> | null {
    if (!config.enabled) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (cached.expires < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as ReportData<T>;
  }

  /**
   * Set cached data with TTL
   */
  setCachedData<T>(key: string, data: ReportData<T>, config: CacheConfig): void {
    if (!config.enabled) {
      return;
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + config.ttl);

    this.cache.set(key, {
      data,
      expires: expiresAt,
    });
  }

  /**
   * Clear cache entries matching pattern
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Use simple string matching instead of regex for safety
    if (pattern.includes("*")) {
      // Handle wildcard patterns
      const prefix = pattern.replaceAll("*", "");
      for (const [key] of this.cache) {
        if (key.includes(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Exact string matching
      for (const [key] of this.cache) {
        if (key === pattern) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = new Date();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, entry] of this.cache) {
      if (entry.expires > now) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRatio: validEntries / Math.max(this.cache.size, 1),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanupExpired(): void {
    const now = new Date();
    for (const [key, entry] of this.cache) {
      if (entry.expires <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// =============================================================================
// CACHE INSTANCE
// =============================================================================

// Singleton cache manager instance
export const cacheManager = new CacheManager();
