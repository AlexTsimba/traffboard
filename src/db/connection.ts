import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { databaseConfig, testDatabaseConfig, isTest, isDevelopment } from "@/config/database";

/**
 * Global variable to store database instance (prevents multiple connections)
 * This pattern is essential for Next.js Hot Module Replacement (HMR) to prevent
 * connection leaks during development
 */
declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
  var __dbPool: postgres.Sql | undefined;
}

/**
 * Create PostgreSQL connection pool with optimized settings
 */
function createPool() {
  const config = isTest ? testDatabaseConfig : databaseConfig;

  return postgres(config.url, {
    max: config.poolMax,
    idle_timeout: config.poolIdleTimeout,
    connect_timeout: config.poolConnectTimeout,

    // Development-specific settings
    ...(isDevelopment && {
      debug: false, // Disable debug in development to reduce noise, enable if needed for debugging
      transform: {
        undefined: undefined, // Keep undefined as undefined
      },
    }),

    // Test-specific settings
    ...(isTest && {
      max: 1, // Single connection for tests
      debug: false,
    }),

    // Production optimizations for DigitalOcean Managed Database
    ...(!isDevelopment &&
      !isTest && {
        // Add SSL for production DigitalOcean connections
        ssl: { rejectUnauthorized: false },
        // Optimized keepalive settings for cloud connections
        keepalives_idle: 60,
        keepalives_interval: 30,
        keepalives_count: 3,
      }),
  });
}

/**
 * Create Drizzle ORM instance with proper error handling
 */
function createDatabase() {
  try {
    const pool = createPool();

    return drizzle(pool, {
      logger: isDevelopment, // Log queries in development
    });
  } catch (error) {
    console.error("❌ Failed to create database instance:", error);
    throw new Error("Database initialization failed");
  }
}

/**
 * Singleton database instance with HMR support
 * In development, we store the connection in globalThis to survive hot reloads
 * In production, we create a single instance that lives for the app lifetime
 */
let _db: ReturnType<typeof drizzle> | undefined;
let _pool: postgres.Sql | undefined;

function getDatabase() {
  // In development, use globalThis to survive HMR
  if (isDevelopment && !isTest) {
    if (!globalThis.__db || !globalThis.__dbPool) {
      globalThis.__dbPool = createPool();
      globalThis.__db = drizzle(globalThis.__dbPool, {
        logger: isDevelopment,
      });
    }
    return { db: globalThis.__db, pool: globalThis.__dbPool };
  }

  // In production/test, use module-level variables
  if (!_db || !_pool) {
    _pool = createPool();
    _db = drizzle(_pool, {
      logger: isDevelopment,
    });
  }
  return { db: _db, pool: _pool };
}

// Export the singleton instances
const { db, pool } = getDatabase();

export { db, pool };

/**
 * Database health check with comprehensive metrics
 */
export async function checkDatabaseHealth(): Promise<{
  status: "healthy" | "unhealthy";
  latency?: number;
  connectionInfo?: {
    poolSize: number;
    idleConnections: number;
    activeConnections: number;
  };
  error?: string;
}> {
  const start = Date.now();

  try {
    // Simple query to check connection
    await pool`SELECT 1 as health_check, version(), current_database(), inet_server_addr() as server_ip`;

    const latency = Date.now() - start;

    // Get connection pool information
    const connectionInfo = {
      poolSize: pool.options.max || 0,
      idleConnections: 0, // Not directly accessible in postgres.js
      activeConnections: 0, // Not directly accessible in postgres.js
    };

    return {
      status: "healthy",
      latency,
      connectionInfo,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Graceful database connection cleanup with proper error handling
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    // Close the current pool instance
    await pool.end();

    // Clean up global references in development
    if (isDevelopment && !isTest) {
      globalThis.__db = undefined;
      globalThis.__dbPool = undefined;
    }

    console.log("✅ Database connection closed successfully");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
    throw error;
  }
}

/**
 * Execute database operation with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt === maxRetries) {
        console.error(`❌ Database operation failed after ${maxRetries} attempts:`, lastError.message);
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(`⚠️ Database operation failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Get connection pool metrics for monitoring
 */
export function getConnectionMetrics() {
  return {
    environment: process.env.NODE_ENV,
    poolMax: pool.options.max,
    poolIdleTimeout: pool.options.idle_timeout,
    poolConnectTimeout: pool.options.connect_timeout,
    idleConnections: 0, // Not directly accessible in postgres.js
    totalConnections: pool.options.max || 0,
    activeConnections: 0, // Not directly accessible in postgres.js
  };
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
