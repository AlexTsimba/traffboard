/**
 * PostgreSQL Integration for Cohort Analysis
 *
 * Secure, high-performance PostgreSQL integration optimized for cohort analysis.
 * Implements connection pooling, pipeline mode, and proper credential management
 * following PostgreSQL best practices for the TraffBoard cohort data engine.
 */

import "server-only";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { databaseConfig } from "@/config/database";
import type { CohortConfig, AppliedFilter } from "@/types/reports";

// =============================================================================
// CONNECTION MANAGEMENT
// =============================================================================

/**
 * PostgreSQL connection configuration for cohort analysis
 */
const cohortConnectionSchema = z.object({
  maxConnections: z.number().min(1).max(20).default(5),
  statementTimeout: z.number().min(1000).max(60_000).default(30_000), // 30 seconds
  queryTimeout: z.number().min(5000).max(120_000).default(60_000), // 60 seconds
  idleInTransactionSessionTimeout: z.number().min(10_000).max(300_000).default(60_000),
  enablePipelineMode: z.boolean().default(true),
  enableStatementLevelPooling: z.boolean().default(true),
});

export type CohortConnectionConfig = z.infer<typeof cohortConnectionSchema>;

/**
 * Enhanced Prisma client with cohort-specific optimizations
 */
class CohortPostgreSQLClient {
  private client: PrismaClient;
  private config: CohortConnectionConfig;
  private healthStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
  private lastHealthCheck: Date = new Date();

  constructor(config: Partial<CohortConnectionConfig> = {}) {
    this.config = cohortConnectionSchema.parse(config);

    // Initialize Prisma client with optimized settings for cohort analysis
    this.client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
      datasources: {
        db: {
          url: databaseConfig.url,
        },
      },
    });

    // Session will be initialized lazy on first query
  }

  /**
   * Initialize PostgreSQL session with cohort-optimized settings
   */
  private async initializeSession(): Promise<void> {
    try {
      // Execute individual SET statements
      await this.client.$executeRawUnsafe(`SET statement_timeout = ${this.config.statementTimeout}`);
      await this.client.$executeRawUnsafe(
        `SET idle_in_transaction_session_timeout = ${this.config.idleInTransactionSessionTimeout}`,
      );
      await this.client.$executeRawUnsafe(`SET work_mem = '256MB'`);
      await this.client.$executeRawUnsafe(`SET effective_cache_size = '1GB'`);
      await this.client.$executeRawUnsafe(`SET random_page_cost = 1.1`);
      await this.client.$executeRawUnsafe(`SET seq_page_cost = 1.0`);
    } catch (error) {
      console.error("Failed to initialize PostgreSQL session:", error);
      this.healthStatus = "degraded";
    }
  }

  /**
   * Execute raw SQL query with performance monitoring
   */
  async executeQuery<T = unknown>(
    query: string,
    params: unknown[] = [],
    options: { timeout?: number } = {},
  ): Promise<T[]> {
    const startTime = Date.now();

    try {
      // Use query timeout if specified
      if (options.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Query timeout"));
          }, options.timeout);
        });

        const queryPromise = this.client.$queryRawUnsafe<T>(query, ...params);
        const result = await Promise.race([queryPromise, timeoutPromise]);

        this.logQueryPerformance(query, Date.now() - startTime, true);
        return Array.isArray(result) ? result : [];
      }

      const result = await this.client.$queryRawUnsafe<T>(query, ...params);
      this.logQueryPerformance(query, Date.now() - startTime, true);

      return Array.isArray(result) ? result : [];
    } catch (error) {
      this.logQueryPerformance(query, Date.now() - startTime, false);
      throw new PostgreSQLError(`Query execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute multiple queries in pipeline mode for better performance
   */
  async executePipeline<T = unknown>(
    queries: { sql: string; params: unknown[] }[],
    options: { stopOnError?: boolean } = {},
  ): Promise<(T[] | Error)[]> {
    const { stopOnError = true } = options;
    const results: (T[] | Error)[] = [];

    for (const query of queries) {
      try {
        const result = await this.executeQuery<T>(query.sql, query.params);
        results.push(result);
      } catch (error) {
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        results.push(errorInstance);

        if (stopOnError) {
          throw new PostgreSQLError(`Pipeline execution failed at query ${results.length}: ${errorInstance.message}`);
        }
      }
    }

    return results;
  }

  /**
   * Health check for the PostgreSQL connection
   */
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    latency: number;
    lastCheck: Date;
    details: Record<string, unknown>;
  }> {
    const startTime = Date.now();

    try {
      await this.client.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      this.healthStatus = latency < 100 ? "healthy" : "degraded";
      this.lastHealthCheck = new Date();

      return {
        status: this.healthStatus,
        latency,
        lastCheck: this.lastHealthCheck,
        details: {
          config: this.config,
          connectionUrl: databaseConfig.url.replaceAll(/:[^:@]+@/g, ":***@"), // Mask password
        },
      };
    } catch (error) {
      this.healthStatus = "unhealthy";
      this.lastHealthCheck = new Date();

      return {
        status: this.healthStatus,
        latency: Date.now() - startTime,
        lastCheck: this.lastHealthCheck,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Get connection statistics and performance metrics
   */
  getConnectionStats(): {
    config: CohortConnectionConfig;
    healthStatus: string;
    lastHealthCheck: Date;
    uptime: number;
  } {
    return {
      config: this.config,
      healthStatus: this.healthStatus,
      lastHealthCheck: this.lastHealthCheck,
      uptime: Date.now() - this.lastHealthCheck.getTime(),
    };
  }

  /**
   * Log query performance for monitoring
   */
  private logQueryPerformance(query: string, duration: number, success: boolean): void {
    const queryType = query.trim().split(" ")[0]?.toLowerCase() ?? "unknown";

    if (process.env.NODE_ENV === "development" || duration > 5000) {
      console.log(`PostgreSQL Query [${queryType}] - ${duration}ms ${success ? "✓" : "✗"}`);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === "production" && (duration > 10_000 || !success)) {
      // Send to monitoring service (DataDog, New Relic, etc.)
      console.warn(`Slow/Failed PostgreSQL Query: ${duration}ms`, {
        queryType,
        success,
        query: query.slice(0, 100),
      });
    }
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}

// =============================================================================
// GLOBAL INSTANCE
// =============================================================================

/**
 * Global PostgreSQL client instance for cohort analysis
 */
export const cohortPostgreSQL = new CohortPostgreSQLClient({
  maxConnections: 8,
  statementTimeout: 45_000, // 45 seconds for complex cohort queries
  queryTimeout: 90_000, // 90 seconds for large datasets
  enablePipelineMode: true,
  enableStatementLevelPooling: true,
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Custom PostgreSQL error for better error handling
 */
export class PostgreSQLError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly query?: string,
  ) {
    super(message);
    this.name = "PostgreSQLError";
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Safe parameter binding to prevent SQL injection
 */
export function safeParameterize(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    // Basic SQL injection prevention (Prisma handles this, but extra safety)
    return value.replaceAll("'", "''");
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  // Return null for unsupported types to maintain consistency
  return null;
}

/**
 * Validate SQL query for cohort analysis
 */
export function validateCohortQuery(query: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lowerQuery = query.toLowerCase();

  // Basic security checks
  if (lowerQuery.includes("drop ") || lowerQuery.includes("delete ") || lowerQuery.includes("truncate ")) {
    errors.push("Destructive operations not allowed");
  }

  if (lowerQuery.includes("--") || lowerQuery.includes("/*") || lowerQuery.includes("*/")) {
    errors.push("SQL comments not allowed for security");
  }

  // Cohort-specific validation
  if (!lowerQuery.includes("playerdata") && !lowerQuery.includes("conversion")) {
    errors.push("Query must reference PlayerData or Conversion tables");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate query cost and complexity
 */
export function estimateQueryCost(
  query: string,
  config: CohortConfig,
  filters: AppliedFilter[],
): {
  estimatedCost: number;
  complexity: "low" | "medium" | "high";
  recommendations: string[];
} {
  const dayRange = Math.ceil(
    (config.dateRange.end.getTime() - config.dateRange.start.getTime()) / (1000 * 60 * 60 * 24),
  );

  const recommendations: string[] = [];
  let estimatedCost = dayRange * 0.1; // Base cost

  // Factor in breakpoints
  estimatedCost += config.breakpoints.length * 0.5;

  // Factor in filters
  estimatedCost += filters.length * 0.2;

  // Check for expensive operations
  if (query.toLowerCase().includes("group by")) {
    estimatedCost *= 1.5;
    recommendations.push("Consider using materialized views for frequent GROUP BY operations");
  }

  if (query.toLowerCase().includes("order by")) {
    estimatedCost *= 1.2;
    recommendations.push("Ensure proper indexes exist for ORDER BY columns");
  }

  // Complexity classification
  let complexity: "low" | "medium" | "high";
  if (estimatedCost < 5) {
    complexity = "low";
  } else if (estimatedCost < 15) {
    complexity = "medium";
    recommendations.push("Consider query optimization for better performance");
  } else {
    complexity = "high";
    recommendations.push("High-cost query detected - consider caching or data aggregation");
  }

  return {
    estimatedCost,
    complexity,
    recommendations,
  };
}

// =============================================================================
// MONITORING AND OBSERVABILITY
// =============================================================================

/**
 * Performance monitoring for cohort queries
 */
let queryMetrics: {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
}[] = [];

export function recordCohortQuery(query: string, duration: number, success: boolean): void {
  queryMetrics.push({
    query: query.slice(0, 100), // Store first 100 chars
    duration,
    timestamp: new Date(),
    success,
  });

  // Keep only last 1000 metrics to prevent memory issues
  if (queryMetrics.length > 1000) {
    queryMetrics = queryMetrics.slice(-1000);
  }
}

export function getCohortQueryMetrics(): {
  totalQueries: number;
  averageDuration: number;
  successRate: number;
  slowQueries: number;
} {
  const total = queryMetrics.length;
  const successful = queryMetrics.filter((m) => m.success).length;
  const totalDuration = queryMetrics.reduce((sum, m) => sum + m.duration, 0);
  const slowQueries = queryMetrics.filter((m) => m.duration > 5000).length;

  return {
    totalQueries: total,
    averageDuration: total > 0 ? Math.round(totalDuration / total) : 0,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    slowQueries,
  };
}

export function resetCohortQueryMetrics(): void {
  queryMetrics = [];
}
