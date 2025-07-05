import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/lib/health";

export async function GET() {
  try {
    // Database health check
    const dbHealth = await checkDatabaseHealth();

    // Basic health checks
    const health = {
      status: dbHealth.status === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version ?? "1.0.0",
      checks: {
        server: "ok",
        database: {
          status: dbHealth.status,
          latency: dbHealth.latency,
          ...(dbHealth.error && { error: dbHealth.error }),
        },
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
        },
      },
    };

    // Return 503 if database is unhealthy
    const statusCode = dbHealth.status === "healthy" ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        checks: {
          server: "error",
          database: "error",
        },
      },
      { status: 503 },
    );
  }
}
