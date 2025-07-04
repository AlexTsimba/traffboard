import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the database health check
vi.mock("@/lib/database", () => ({
  checkDatabaseHealth: vi.fn(),
}));

describe("/api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return healthy status when database is healthy", async () => {
    const { checkDatabaseHealth } = await import("@/lib/database");

    vi.mocked(checkDatabaseHealth).mockResolvedValue({
      status: "healthy",
      latency: 50,
    });

    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const data = (await response.json()) as {
      status: string;
      checks: {
        database: { status: string; latency: number };
        server: string;
      };
    };

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.database.status).toBe("healthy");
    expect(data.checks.database.latency).toBe(50);
    expect(data.checks.server).toBe("ok");
  });

  it("should return degraded status when database is unhealthy", async () => {
    const { checkDatabaseHealth } = await import("@/lib/database");

    vi.mocked(checkDatabaseHealth).mockResolvedValue({
      status: "unhealthy",
      error: "Connection timeout",
    });

    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const data = (await response.json()) as {
      status: string;
      checks: {
        database: { status: string; error: string };
      };
    };

    expect(response.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.checks.database.status).toBe("unhealthy");
    expect(data.checks.database.error).toBe("Connection timeout");
  });

  it("should return unhealthy status when health check throws error", async () => {
    const { checkDatabaseHealth } = await import("@/lib/database");

    vi.mocked(checkDatabaseHealth).mockRejectedValue(new Error("Unexpected error"));

    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const data = (await response.json()) as {
      status: string;
      error: string;
      checks: {
        server: string;
        database: string;
      };
    };

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.error).toBe("Unexpected error");
    expect(data.checks.server).toBe("error");
    expect(data.checks.database).toBe("error");
  });

  it("should include memory information", async () => {
    const { checkDatabaseHealth } = await import("@/lib/database");

    vi.mocked(checkDatabaseHealth).mockResolvedValue({
      status: "healthy",
      latency: 30,
    });

    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const data = (await response.json()) as {
      checks: {
        memory: {
          used: number;
          total: number;
          percentage: number;
        };
      };
    };

    expect(data.checks.memory).toBeDefined();
    expect(data.checks.memory.used).toBeDefined();
    expect(data.checks.memory.total).toBeDefined();
    expect(data.checks.memory.percentage).toBeDefined();
    expect(typeof data.checks.memory.percentage).toBe("number");
  });

  it("should include standard health check fields", async () => {
    const { checkDatabaseHealth } = await import("@/lib/database");

    vi.mocked(checkDatabaseHealth).mockResolvedValue({
      status: "healthy",
      latency: 25,
    });

    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const data = (await response.json()) as {
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
      version: string;
      checks: Record<string, unknown>;
    };

    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("uptime");
    expect(data).toHaveProperty("environment");
    expect(data).toHaveProperty("version");
    expect(data).toHaveProperty("checks");

    expect(typeof data.uptime).toBe("number");
    expect(typeof data.timestamp).toBe("string");
  });
});
