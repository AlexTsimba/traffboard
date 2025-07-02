import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { databaseConfig, testDatabaseConfig, isTest, isDevelopment } from "@/config/database";

/**
 * Global variable to store database instance (prevents multiple connections)
 */
declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
  var __dbPool: postgres.Sql | undefined;
}

/**
 * Create PostgreSQL connection pool
 */
function createPool() {
  const config = isTest ? testDatabaseConfig : databaseConfig;

  return postgres(config.url, {
    max: config.poolMax,
    idle_timeout: config.poolIdleTimeout,
    connect_timeout: config.poolConnectTimeout,

    // Development-specific settings
    ...(isDevelopment && {
      debug: true, // Log queries in development
      transform: {
        undefined: undefined, // Keep undefined as undefined
      },
    }),

    // Test-specific settings
    ...(isTest && {
      max: 1, // Single connection for tests
      debug: false,
    }),
  });
}

/**
 * Create Drizzle ORM instance
 */
function createDatabase() {
  const pool = createPool();

  return drizzle(pool, {
    logger: isDevelopment, // Log queries in development
  });
}

/**
 * Singleton database instance
 */
export const db = globalThis.__db ?? createDatabase();
export const pool = globalThis.__dbPool ?? createPool();

// Store in global for development hot reload
if (isDevelopment && !isTest) {
  globalThis.__db = db;
  globalThis.__dbPool = pool;
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<{
  status: "healthy" | "unhealthy";
  latency?: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    // Simple query to check connection
    await pool`SELECT 1 as health_check`;

    const latency = Date.now() - start;

    return {
      status: "healthy",
      latency,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Graceful database connection cleanup
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    console.log("✅ Database connection closed successfully");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
  }
}

/**
 * Database connection info for debugging
 */
export function getDatabaseInfo() {
  const config = isTest ? testDatabaseConfig : databaseConfig;

  return {
    environment: process.env.NODE_ENV,
    poolMax: config.poolMax,
    poolIdleTimeout: config.poolIdleTimeout,
    poolConnectTimeout: config.poolConnectTimeout,
    url: config.url.replace(/:\/\/[^@/]+@/, "://***:***@"), // Hide credentials
  };
}
