import { prisma } from "@/lib/prisma";

export interface DatabaseHealth {
  status: "healthy" | "unhealthy";
  latency?: number;
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const start = Date.now();

    // Simple query with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Database query timeout"));
      }, 5000);
    });

    const queryPromise = prisma.$queryRaw`SELECT 1`;

    // Race between query and timeout
    await Promise.race([queryPromise, timeoutPromise]);

    const latency = Date.now() - start;

    // Consider unhealthy if latency is too high
    if (latency > 3000) {
      return {
        status: "unhealthy",
        latency,
        error: `High latency: ${latency}ms`,
      };
    }

    return {
      status: "healthy",
      latency,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Database connection failed",
    };
  }
}
