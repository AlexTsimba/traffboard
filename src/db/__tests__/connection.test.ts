import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock postgres before importing connection
vi.mock("postgres", () => ({
  default: vi.fn(() => {
    const queryFn = Object.assign(
      vi.fn().mockResolvedValue([{ health_check: 1, version: "PostgreSQL 14.0", current_database: "test", server_ip: "127.0.0.1" }]), 
      {
        end: vi.fn().mockResolvedValue(void 0),
        options: { max: 10, idle_timeout: 60, connect_timeout: 30 },
        idle: [],
      }
    );
    return queryFn;
  }),
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: vi.fn(() => ({})),
}));

describe("Database Connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear global variables
    globalThis.__db = undefined;
    globalThis.__dbPool = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("exports", () => {
    it("should export db instance", async () => {
      const { db } = await import("@/db/connection");
      expect(db).toBeDefined();
    });

    it("should export pool instance", async () => {
      const { pool } = await import("@/db/connection");
      expect(pool).toBeDefined();
    });

    it("should export enhanced utility functions", async () => {
      const { 
        checkDatabaseHealth, 
        closeDatabaseConnection, 
        getDatabaseInfo,
        executeWithRetry,
        getConnectionMetrics,
      } = await import("@/db/connection");
      
      expect(checkDatabaseHealth).toBeTypeOf("function");
      expect(closeDatabaseConnection).toBeTypeOf("function");
      expect(getDatabaseInfo).toBeTypeOf("function");
      expect(executeWithRetry).toBeTypeOf("function");
      expect(getConnectionMetrics).toBeTypeOf("function");
    });
  });

    it("should export pool instance", async () => {
      const { pool } = await import("@/db/connection");
      expect(pool).toBeDefined();
    });

    it("should export utility functions", async () => {
      const connection = await import("@/db/connection");
      expect(connection.checkDatabaseHealth).toBeDefined();
      expect(connection.closeDatabaseConnection).toBeDefined();
      expect(connection.getDatabaseInfo).toBeDefined();
    });
  });

  describe("checkDatabaseHealth", () => {
    it("should return healthy status", async () => {
      const { checkDatabaseHealth } = await import("@/db/connection");
      const result = await checkDatabaseHealth();

      expect(result.status).toBe("healthy");
      expect(typeof result.latency).toBe("number");
    });
  });

  describe("utility functions", () => {
    it("should close connection without errors", async () => {
      const { closeDatabaseConnection } = await import("@/db/connection");
      await expect(closeDatabaseConnection()).resolves.toBeUndefined();
    });

    it("should return database info", async () => {
      const { getDatabaseInfo } = await import("@/db/connection");
      const info = getDatabaseInfo();

      expect(info.environment).toBeDefined();
      expect(info.poolMax).toBeDefined();
      expect(info.url).toBeDefined();
    });
  });

describe("Enhanced Database Connection Features", () => {
  describe("health check with metrics", () => {
    it("should return healthy status with comprehensive metrics", async () => {
      const { checkDatabaseHealth } = await import("@/db/connection");
      
      const result = await checkDatabaseHealth();
      
      expect(result.status).toBe("healthy");
      expect(result.latency).toBeTypeOf("number");
      expect(result.connectionInfo).toBeDefined();
      expect(result.connectionInfo?.poolSize).toBe(10);
    });
  });

  describe("retry mechanism", () => {
    it("should successfully execute operation on first try", async () => {
      const { executeWithRetry } = await import("@/db/connection");
      
      const mockOperation = vi.fn().mockResolvedValue("success");
      
      const result = await executeWithRetry(mockOperation);
      
      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it("should retry failed operations", async () => {
      const { executeWithRetry } = await import("@/db/connection");
      
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValue("success");
      
      const result = await executeWithRetry(mockOperation, 3, 10);
      
      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe("connection metrics", () => {
    it("should return connection pool metrics", async () => {
      const { getConnectionMetrics } = await import("@/db/connection");
      
      const metrics = getConnectionMetrics();
      
      expect(metrics).toHaveProperty("environment");
      expect(metrics).toHaveProperty("poolMax");
      expect(metrics).toHaveProperty("idleConnections");
      expect(metrics).toHaveProperty("activeConnections");
    });
  });
});
