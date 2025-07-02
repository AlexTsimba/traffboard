import { z } from "zod";

/**
 * Database configuration schema validation
 */
const databaseConfigSchema = z.object({
  url: z.string().url("DATABASE_URL must be a valid URL"),
  poolMax: z.number().min(1).max(50).default(10),
  poolIdleTimeout: z.number().min(10).max(600).default(60),
  poolConnectTimeout: z.number().min(5).max(60).default(30),
});

/**
 * Environment-based database configuration
 */
export const databaseConfig = databaseConfigSchema.parse({
  url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/traffboard_dev",
  poolMax: Number.parseInt(process.env.DB_POOL_MAX ?? "10"),
  poolIdleTimeout: Number.parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? "60"),
  poolConnectTimeout: Number.parseInt(process.env.DB_POOL_CONNECT_TIMEOUT ?? "30"),
});

/**
 * Database environment detection
 */
export const isDevelopment = process.env.NODE_ENV === "development";
export const isTest = process.env.NODE_ENV === "test";
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Test database configuration
 */
export const testDatabaseConfig = {
  ...databaseConfig,
  url: process.env.TEST_DATABASE_URL ?? "postgresql://localhost:5432/traffboard_test",
  poolMax: 5, // Smaller pool for tests
};

/**
 * Database connection health check configuration
 */
export const healthCheckConfig = {
  timeout: 5000, // 5 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};
