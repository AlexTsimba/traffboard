import { z } from "zod";

/**
 * Database configuration schema validation with DigitalOcean optimizations
 */
const databaseConfigSchema = z.object({
  url: z
    .string()
    .url("DATABASE_URL must be a valid URL")
    .refine(
      (url) => url.startsWith("postgresql://") || url.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection string",
    ),
  poolMax: z.number().min(1).max(50).default(10),
  poolIdleTimeout: z.number().min(10).max(600).default(60),
  poolConnectTimeout: z.number().min(5).max(60).default(30),
});

/**
 * Parse and validate pool configuration with proper error handling
 */
function parsePoolConfig() {
  try {
    const poolMax = Number.parseInt(process.env.DB_POOL_MAX ?? "10");
    const poolIdleTimeout = Number.parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? "60");
    const poolConnectTimeout = Number.parseInt(process.env.DB_POOL_CONNECT_TIMEOUT ?? "30");

    // Check for NaN values and return defaults if invalid
    if (Number.isNaN(poolMax) || Number.isNaN(poolIdleTimeout) || Number.isNaN(poolConnectTimeout)) {
      console.warn("⚠️ Invalid pool configuration, using defaults");
      return {
        poolMax: 10,
        poolIdleTimeout: 60,
        poolConnectTimeout: 30,
      };
    }

    return {
      poolMax,
      poolIdleTimeout,
      poolConnectTimeout,
    };
  } catch {
    console.warn("⚠️ Invalid pool configuration, using defaults");
    return {
      poolMax: 10,
      poolIdleTimeout: 60,
      poolConnectTimeout: 30,
    };
  }
}

/**
 * Environment-based database configuration with enhanced validation
 */
export const databaseConfig = databaseConfigSchema.parse({
  url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/traffboard_dev",
  ...parsePoolConfig(),
});

/**
 * Database environment detection
 */
export const isDevelopment = process.env.NODE_ENV === "development";
export const isTest = process.env.NODE_ENV === "test";
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Test database configuration with isolated settings
 */
export const testDatabaseConfig = {
  ...databaseConfig,
  url: process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/traffboard_test",
  poolMax: 5, // Smaller pool for tests
  poolIdleTimeout: 30, // Shorter timeouts for tests
  poolConnectTimeout: 15,
};

/**
 * Database connection health check configuration
 */
export const healthCheckConfig = {
  timeout: 5000, // 5 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  checkInterval: 30_000, // 30 seconds for periodic health checks
};
