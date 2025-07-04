import { prisma } from "@/lib/prisma";

export interface DatabaseHealth {
  status: "healthy" | "unhealthy";
  latency?: number;
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const start = Date.now();

    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;

    const latency = Date.now() - start;

    return {
      status: "healthy",
      latency,
    };
  } catch (error) {
    console.error("Database health check failed:", error);

    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
