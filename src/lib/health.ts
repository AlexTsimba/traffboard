import { prisma } from "@/lib/prisma";

export interface DatabaseHealth {
  status: "healthy" | "unhealthy";
  latency?: number;
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      status: "healthy",
      latency,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
