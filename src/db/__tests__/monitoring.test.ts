import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the database connection
vi.mock("@/db/connection", () => ({
  db: {
    execute: vi.fn().mockResolvedValue([{ test: 1 }]),
  },
  checkDatabaseHealth: vi.fn().mockResolvedValue({
    status: "healthy",
    latency: 50,
    connectionInfo: {
      poolSize: 10,
      idleConnections: 5,
      activeConnections: 5,
    },
  }),
  getConnectionMetrics: vi.fn().mockReturnValue({
    environment: "test",
    poolMax: 10,
    poolIdleTimeout: 60,
    poolConnectTimeout: 30,
    idleConnections: 5,
    totalConnections: 10,
    activeConnections: 5,
  }),
  executeWithRetry: vi.fn().mockImplementation((fn) => fn()),
}));

vi.mock("@/config/database", () => ({
  healthCheckConfig: {
    timeout: 5000,
    retries: 3,
    retryDelay: 1000,
    checkInterval: 30000,
  },
}));

describe("Database Monitoring Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("monitorDatabase", () => {
    it("should return comprehensive monitoring data", async () => {
      const { monitorDatabase } = await import("@/db/utils/monitoring");
      
      const result = await monitorDatabase();
      
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("health");
      expect(result).toHaveProperty("metrics");
      expect(result).toHaveProperty("queryPerformance");
      
      expect(result.health.status).toBe("healthy");
      expect(result.metrics.environment).toBe("test");
      expect(result.queryPerformance).toBeDefined();
    });

    it("should handle unhealthy database gracefully", async () => {
      const { checkDatabaseHealth } = await import("@/db/connection");
      vi.mocked(checkDatabaseHealth).mockResolvedValueOnce({
        status: "unhealthy",
        error: "Connection failed",
      });

      const { monitorDatabase } = await import("@/db/utils/monitoring");
      
      const result = await monitorDatabase();
      
      expect(result.health.status).toBe("unhealthy");
      expect(result.queryPerformance).toBeUndefined();
    });
  });

  describe("formatMonitoringResult", () => {
    it("should format monitoring result for display", async () => {
      const { formatMonitoringResult } = await import("@/db/utils/monitoring");
      
      const mockResult = {
        timestamp: "2025-01-01T00:00:00.000Z",
        health: {
          status: "healthy" as const,
          latency: 50,
          connectionInfo: {
            poolSize: 10,
            idleConnections: 5,
            activeConnections: 5,
          },
        },
        metrics: {
          environment: "test",
          poolMax: 10,
          poolIdleTimeout: 60,
          poolConnectTimeout: 30,
          idleConnections: 5,
          totalConnections: 10,
          activeConnections: 5,
        },
        queryPerformance: {
          simpleQueryLatency: 25,
          connectionTestLatency: 30,
        },
      };
      
      const formatted = formatMonitoringResult(mockResult);
      
      expect(formatted).toContain("✅ Database Status: healthy");
      expect(formatted).toContain("Latency: 50ms");
      expect(formatted).toContain("Pool: 5/10 active");
      expect(formatted).toContain("Query Performance: 25ms");
    });
  });

  describe("troubleshootConnection", () => {
    it("should identify no issues when everything is healthy", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();
      
      const { checkDatabaseHealth, getConnectionMetrics } = await import("@/db/connection");
      vi.mocked(checkDatabaseHealth).mockResolvedValue({
        status: "healthy",
        latency: 50,
        connectionInfo: {
          poolSize: 10,
          idleConnections: 5,
          activeConnections: 5,
        },
      });
      
      vi.mocked(getConnectionMetrics).mockReturnValue({
        environment: "test",
        poolMax: 10,
        poolIdleTimeout: 60,
        poolConnectTimeout: 30,
        idleConnections: 5,
        totalConnections: 10,
        activeConnections: 5,
      });

      const { troubleshootConnection } = await import("@/db/utils/monitoring");
      
      const result = await troubleshootConnection();
      
      expect(result.issues).toContain("No issues detected");
      expect(result.recommendations).toContain("Database connection appears to be healthy");
    });

    it("should identify high latency issues", async () => {
      const { checkDatabaseHealth } = await import("@/db/connection");
      vi.mocked(checkDatabaseHealth).mockResolvedValueOnce({
        status: "healthy",
        latency: 1000, // High latency
        connectionInfo: {
          poolSize: 10,
          idleConnections: 5,
          activeConnections: 5,
        },
      });

      const { troubleshootConnection } = await import("@/db/utils/monitoring");
      
      const result = await troubleshootConnection();
      
      expect(result.issues.some(issue => issue.includes("High database latency"))).toBe(true);
      expect(result.recommendations.some(rec => rec.includes("network connection"))).toBe(true);
    });
  });

  describe("startDatabaseMonitoring", () => {
    it("should start periodic monitoring", async () => {
      const { startDatabaseMonitoring } = await import("@/db/utils/monitoring");
      
      const onResult = vi.fn();
      const cleanup = startDatabaseMonitoring(100, onResult); // Very short interval for testing
      
      // Wait for the monitoring to execute at least once
      await vi.waitFor(() => {
        expect(onResult).toHaveBeenCalled();
      }, { timeout: 1000 });
      
      cleanup();
    }, 15000); // Extended timeout for this test

    it("should return cleanup function", async () => {
      const { startDatabaseMonitoring } = await import("@/db/utils/monitoring");
      
      const cleanup = startDatabaseMonitoring(1000);
      
      expect(typeof cleanup).toBe("function");
      
      // Should not throw when called
      expect(() => cleanup()).not.toThrow();
    });
  });
});
