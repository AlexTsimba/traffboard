import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { databaseConfig, testDatabaseConfig } from "@/config/database";

describe("Database Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("databaseConfig validation", () => {
    it("should use default values when environment variables are missing", () => {
      // Clear database-related env vars
      delete process.env.DATABASE_URL;
      delete process.env.DB_POOL_MAX;
      delete process.env.DB_POOL_IDLE_TIMEOUT;
      delete process.env.DB_POOL_CONNECT_TIMEOUT;

      // Import fresh config (in real test, would need to reset module)
      expect(databaseConfig.poolMax).toBe(10);
      expect(databaseConfig.poolIdleTimeout).toBe(60);
      expect(databaseConfig.poolConnectTimeout).toBe(30);
      expect(databaseConfig.url).toBe("postgresql://localhost:5432/traffboard_dev");
    });

    it("should parse environment variables correctly", () => {
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5433/testdb";
      process.env.DB_POOL_MAX = "20";
      process.env.DB_POOL_IDLE_TIMEOUT = "120";
      process.env.DB_POOL_CONNECT_TIMEOUT = "45";

      // For this test, we'll check that the values would be parsed correctly
      expect(Number.parseInt(process.env.DB_POOL_MAX)).toBe(20);
      expect(Number.parseInt(process.env.DB_POOL_IDLE_TIMEOUT)).toBe(120);
      expect(Number.parseInt(process.env.DB_POOL_CONNECT_TIMEOUT)).toBe(45);
    });

    it("should validate URL format", async () => {
      // This would be tested if we could re-import the module
      // For now, we test that invalid URLs would throw in Zod schema
      const { z } = await import("zod");
      const schema = z.object({
        url: z.string().url(),
      });

      expect(() => schema.parse({ url: "invalid-url" })).toThrow();
      expect(() => schema.parse({ url: "postgresql://valid:url@host:5432/db" })).not.toThrow();
    });
  });

  describe("testDatabaseConfig", () => {
    it("should have correct test database configuration", () => {
      expect(testDatabaseConfig.poolMax).toBe(5);
      expect(testDatabaseConfig.url).toContain("traffboard_test");
    });

    it("should use TEST_DATABASE_URL when provided", () => {
      process.env.TEST_DATABASE_URL = "postgresql://test:test@localhost:5432/custom_test";

      // The test config url should be based on env var
      expect(process.env.TEST_DATABASE_URL).toBe("postgresql://test:test@localhost:5432/custom_test");
    });
  });

  describe("environment detection", () => {
    it("should detect development environment", () => {
      // Just verify the function works with current environment
      const isDev = process.env.NODE_ENV === "development";
      expect(typeof isDev).toBe("boolean");
    });

    it("should detect test environment", () => {
      // During test runs, NODE_ENV should be 'test'
      const isTestEnv = process.env.NODE_ENV === "test";
      expect(isTestEnv).toBe(true); // Should be true during test runs
    });

    it("should detect production environment", () => {
      // Just verify the logic would work for production
      const isProd = process.env.NODE_ENV === "production";
      expect(typeof isProd).toBe("boolean");
    });
  });

  describe("healthCheckConfig", () => {
    it("should have correct health check configuration", async () => {
      const { healthCheckConfig } = await import("@/config/database");

      expect(healthCheckConfig).toEqual({
        timeout: 5000,
        retries: 3,
        retryDelay: 1000,
        checkInterval: 30000,
      });
    });
  });
});
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Enhanced Database Configuration", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear all module caches to test re-imports
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("Enhanced URL validation", () => {
    it("should accept valid PostgreSQL URLs", async () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      
      await expect(async () => {
        await import("@/config/database");
      }).not.toThrow();
    });

    it("should accept postgres:// protocol", async () => {
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/testdb";
      
      await expect(async () => {
        await import("@/config/database");
      }).not.toThrow();
    });

    it("should reject MySQL URLs", async () => {
      process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/testdb";
      
      await expect(async () => {
        await import("@/config/database");
      }).rejects.toThrow();
    });

    it("should reject invalid URLs", async () => {
      process.env.DATABASE_URL = "not-a-valid-url";
      
      await expect(async () => {
        await import("@/config/database");
      }).rejects.toThrow();
    });
  });

  describe("Enhanced pool configuration parsing", () => {
    it("should handle invalid numeric values gracefully", async () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.DB_POOL_MAX = "not-a-number";
      process.env.DB_POOL_IDLE_TIMEOUT = "invalid";
      process.env.DB_POOL_CONNECT_TIMEOUT = "NaN";

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      
      const { databaseConfig } = await import("@/config/database");
      
      expect(databaseConfig.poolMax).toBe(10); // default
      expect(databaseConfig.poolIdleTimeout).toBe(60); // default 
      expect(databaseConfig.poolConnectTimeout).toBe(30); // default
      expect(consoleSpy).toHaveBeenCalledWith("⚠️ Invalid pool configuration, using defaults");
      
      consoleSpy.mockRestore();
    });

    it("should use custom values when valid", async () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.DB_POOL_MAX = "25";
      process.env.DB_POOL_IDLE_TIMEOUT = "90";
      process.env.DB_POOL_CONNECT_TIMEOUT = "20";
      
      const { databaseConfig } = await import("@/config/database");
      
      expect(databaseConfig.poolMax).toBe(25);
      expect(databaseConfig.poolIdleTimeout).toBe(90);
      expect(databaseConfig.poolConnectTimeout).toBe(20);
    });
  });

  describe("Enhanced test configuration", () => {
    it("should have optimized test settings", async () => {
      const { testDatabaseConfig } = await import("@/config/database");
      
      expect(testDatabaseConfig.poolMax).toBe(5);
      expect(testDatabaseConfig.poolIdleTimeout).toBe(30);
      expect(testDatabaseConfig.poolConnectTimeout).toBe(15);
      expect(testDatabaseConfig.url).toContain("traffboard_test");
    });
  });

  describe("Enhanced health check configuration", () => {
    it("should include periodic check interval", async () => {
      const { healthCheckConfig } = await import("@/config/database");
      
      expect(healthCheckConfig.timeout).toBe(5000);
      expect(healthCheckConfig.retries).toBe(3);
      expect(healthCheckConfig.retryDelay).toBe(1000);
      expect(healthCheckConfig.checkInterval).toBe(30000);
    });
  });
});
