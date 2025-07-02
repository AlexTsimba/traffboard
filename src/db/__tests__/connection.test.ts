import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock postgres before importing connection
vi.mock("postgres", () => ({
  default: vi.fn(() => {
    const queryFn = Object.assign(vi.fn().mockResolvedValue([{ health_check: 1 }]), {
      end: vi.fn().mockResolvedValue(null),
    });
    return queryFn;
  }),
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: vi.fn(() => ({})),
}));

describe("Database Connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
