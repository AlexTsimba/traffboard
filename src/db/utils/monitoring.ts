/**
 * Database monitoring utilities for TraffBoard
 *
 * Provides utilities for monitoring database performance, connection health,
 * and troubleshooting connection issues in DigitalOcean managed database environments.
 */

import { healthCheckConfig } from "@/config/database";

import { db, checkDatabaseHealth, getConnectionMetrics, executeWithRetry } from "../connection";

export interface DatabaseMonitoringResult {
  timestamp: string;
  health: Awaited<ReturnType<typeof checkDatabaseHealth>>;
  metrics: ReturnType<typeof getConnectionMetrics>;
  queryPerformance?: {
    simpleQueryLatency: number;
    connectionTestLatency: number;
  };
}

/**
 * Comprehensive database monitoring check
 */
export async function monitorDatabase(): Promise<DatabaseMonitoringResult> {
  const timestamp = new Date().toISOString();

  // Health check
  const health = await checkDatabaseHealth();

  // Connection metrics
  const metrics = getConnectionMetrics();

  // Query performance test (optional)
  let queryPerformance: DatabaseMonitoringResult["queryPerformance"];

  if (health.status === "healthy") {
    try {
      const start = Date.now();
      await executeWithRetry(async () => {
        await db.execute(`SELECT 1 as test`);
      });
      const simpleQueryLatency = Date.now() - start;

      const connStart = Date.now();
      await executeWithRetry(async () => {
        await db.execute(`SELECT pg_backend_pid() as connection_id`);
      });
      const connectionTestLatency = Date.now() - connStart;

      queryPerformance = {
        simpleQueryLatency,
        connectionTestLatency,
      };
    } catch (error) {
      console.warn("⚠️ Query performance test failed:", error);
    }
  }

  return {
    timestamp,
    health,
    metrics,
    queryPerformance,
  };
}

/**
 * Start periodic database monitoring
 */
export function startDatabaseMonitoring(
  interval: number = healthCheckConfig.checkInterval,
  onResult?: (result: DatabaseMonitoringResult) => void,
): () => void {
  const intervalId = setInterval(() => {
    void (async () => {
      try {
        const result = await monitorDatabase();

        // Log critical issues
        if (result.health.status === "unhealthy") {
          console.error("🚨 Database health check failed:", result.health.error);
        }

        // Warn about high latency
        if (result.health.latency && result.health.latency > 1000) {
          console.warn(`⚠️ High database latency detected: ${result.health.latency}ms`);
        }

        // Warn about connection pool exhaustion
        if (result.metrics.activeConnections >= result.metrics.totalConnections * 0.9) {
          console.warn("⚠️ Connection pool near exhaustion:", {
            active: result.metrics.activeConnections,
            total: result.metrics.totalConnections,
          });
        }

        if (onResult) {
          onResult(result);
        }
      } catch (error) {
        console.error("❌ Database monitoring failed:", error);
      }
    })();
  }, interval);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Format monitoring result for display
 */
export function formatMonitoringResult(result: DatabaseMonitoringResult): string {
  const status = result.health.status === "healthy" ? "✅" : "❌";
  const latency = result.health.latency ? `${result.health.latency}ms` : "N/A";

  const lines = [
    `${status} Database Status: ${result.health.status}`,
    `   Latency: ${latency}`,
    `   Pool: ${result.metrics.activeConnections}/${result.metrics.totalConnections} active`,
    `   Idle: ${result.metrics.idleConnections}`,
    result.queryPerformance ? `   Query Performance: ${result.queryPerformance.simpleQueryLatency}ms` : undefined,
    `   Timestamp: ${result.timestamp}`,
  ];

  return lines.filter(Boolean).join("\n");
}

/**
 * Troubleshoot common database connection issues
 */
export async function troubleshootConnection(): Promise<{
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    const result = await monitorDatabase();

    // Check for unhealthy status
    if (result.health.status === "unhealthy") {
      issues.push(`Database connection is unhealthy: ${result.health.error}`);
      recommendations.push(
        "Check DATABASE_URL environment variable",
        "Verify database server is running and accessible",
        "Check network connectivity to database host",
      );
    }

    // Check for high latency
    if (result.health.latency && result.health.latency > 500) {
      issues.push(`High database latency: ${result.health.latency}ms`);
      recommendations.push(
        "Check network connection to database",
        "Consider using connection pooling",
        "Review database server performance",
      );
    }

    // Check for connection pool issues
    if (result.metrics.activeConnections >= result.metrics.totalConnections * 0.8) {
      issues.push("Connection pool utilization is high");
      recommendations.push(
        "Consider increasing DB_POOL_MAX",
        "Review application for connection leaks",
        "Implement connection cleanup in error handlers",
      );
    }

    // Check for configuration issues
    if (result.metrics.poolMax < 5) {
      issues.push("Connection pool size may be too small");
      recommendations.push("Consider increasing DB_POOL_MAX for better performance");
    }

    if (issues.length === 0) {
      issues.push("No issues detected");
      recommendations.push("Database connection appears to be healthy");
    }
  } catch (error) {
    issues.push(`Failed to perform troubleshooting: ${String(error)}`);
    recommendations.push(
      "Check if database configuration is correct",
      "Verify all required environment variables are set",
    );
  }

  return { issues, recommendations };
}
