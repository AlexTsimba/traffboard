import { describe, it, expect } from "vitest";

describe("Database Module Exports", () => {
  it("should export all database connection utilities", async () => {
    const dbModule = await import("@/db");

    // Check connection exports
    expect(dbModule.db).toBeDefined();
    expect(dbModule.pool).toBeDefined();
    expect(dbModule.checkDatabaseHealth).toBeDefined();
    expect(dbModule.closeDatabaseConnection).toBeDefined();
    expect(dbModule.getDatabaseInfo).toBeDefined();
  });

  it("should export database configuration", async () => {
    const dbModule = await import("@/db");

    expect(dbModule.databaseConfig).toBeDefined();
    expect(dbModule.testDatabaseConfig).toBeDefined();
    expect(dbModule.isDevelopment).toBeDefined();
    expect(dbModule.isTest).toBeDefined();
    expect(dbModule.isProduction).toBeDefined();
    expect(dbModule.healthCheckConfig).toBeDefined();
  });

  it("should export Drizzle ORM utilities", async () => {
    const dbModule = await import("@/db");

    // Check key Drizzle exports
    expect(dbModule.eq).toBeDefined();
    expect(dbModule.and).toBeDefined();
    expect(dbModule.or).toBeDefined();
    expect(dbModule.not).toBeDefined();
    expect(dbModule.isNull).toBeDefined();
    expect(dbModule.isNotNull).toBeDefined();
    expect(dbModule.exists).toBeDefined();
    expect(dbModule.inArray).toBeDefined();
    expect(dbModule.like).toBeDefined();
    expect(dbModule.between).toBeDefined();
    expect(dbModule.gt).toBeDefined();
    expect(dbModule.lt).toBeDefined();
    expect(dbModule.desc).toBeDefined();
    expect(dbModule.asc).toBeDefined();
    expect(dbModule.count).toBeDefined();
    expect(dbModule.sum).toBeDefined();
    expect(dbModule.avg).toBeDefined();
    expect(dbModule.max).toBeDefined();
    expect(dbModule.min).toBeDefined();
  });

  it("should have correct function types", async () => {
    const dbModule = await import("@/db");

    expect(typeof dbModule.checkDatabaseHealth).toBe("function");
    expect(typeof dbModule.closeDatabaseConnection).toBe("function");
    expect(typeof dbModule.getDatabaseInfo).toBe("function");
  });

  it("should have correct configuration types", async () => {
    const dbModule = await import("@/db");

    expect(typeof dbModule.isDevelopment).toBe("boolean");
    expect(typeof dbModule.isTest).toBe("boolean");
    expect(typeof dbModule.isProduction).toBe("boolean");
    expect(typeof dbModule.databaseConfig).toBe("object");
    expect(typeof dbModule.testDatabaseConfig).toBe("object");
    expect(typeof dbModule.healthCheckConfig).toBe("object");
  });
});
