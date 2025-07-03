import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Database configuration for different environments
 */
export interface DbConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  max?: number; // Connection pool size
  idle_timeout?: number;
  connect_timeout?: number;
}

// Test database configuration for automated tests
export const TEST_DB_CONFIG = {
  host: "localhost",
  port: 5432,
  database: "traffboard_test",
  username: "postgres",
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test environment only
  password: "test_password",
  max: 5,
  idle_timeout: 30,
  connect_timeout: 60,
} as const;

// Environment-based configuration
export function getDbConfig(): DbConfig {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const env = process.env.NODE_ENV || "development";

  if (env === "test") {
    return {
      ...TEST_DB_CONFIG,
      host: process.env.TEST_DB_HOST ?? TEST_DB_CONFIG.host,
      port: Number.parseInt(process.env.TEST_DB_PORT ?? "5433"),
      database: process.env.TEST_DB_NAME ?? TEST_DB_CONFIG.database,
      username: process.env.TEST_DB_USER ?? TEST_DB_CONFIG.username,
      password: process.env.TEST_DB_PASSWORD ?? TEST_DB_CONFIG.password,
    };
  }

  if (env === "development") {
    return {
      host: process.env.DB_HOST ?? "localhost",
      port: Number.parseInt(process.env.DB_PORT ?? "5432"),
      database: process.env.DB_NAME ?? "traffboard_dev",
      username: process.env.DB_USER ?? "postgres",
      password: process.env.DB_PASSWORD ?? "password",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (env === "production") {
    return {
      host: process.env.DB_HOST ?? "",
      port: Number.parseInt(process.env.DB_PORT ?? "5432"),
      database: process.env.DB_NAME ?? "",
      username: process.env.DB_USER ?? "",
      password: process.env.DB_PASSWORD ?? "",
      ssl: true,
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
    };
  }

  throw new Error(`Unknown environment: ${String(env)}`);
}

/**
 * Create database connection with proper configuration
 */
export function createDbConnection(config?: DbConfig) {
  const dbConfig = config ?? getDbConfig();

  // Create connection string
  const connectionString = `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

  // Create postgres connection
  const sql = postgres(connectionString, {
    max: dbConfig.max ?? 10,
    idle_timeout: dbConfig.idle_timeout ?? 20,
    connect_timeout: dbConfig.connect_timeout ?? 10,
    ssl: dbConfig.ssl ? "require" : false,
    // Enable logging in development
    debug: process.env.NODE_ENV === "development",
    // For test environment, avoid SSL issues
    prepare: process.env.NODE_ENV !== "test",
  });

  // Create Drizzle instance
  const db = drizzle(sql, { schema });

  return { db, sql };
}

// Global connection instance (lazy-loaded)
let globalConnection: ReturnType<typeof createDbConnection> | undefined;

/**
 * Get or create global database connection
 */
export function getDb() {
  globalConnection ??= createDbConnection();
  return globalConnection;
}

/**
 * Close global database connection
 */
export async function closeDb() {
  if (globalConnection) {
    await globalConnection.sql.end();
    globalConnection = undefined;
  }
}

/**
 * Health check for database connection
 */
export async function checkDbHealth() {
  try {
    const { sql } = getDb();
    const result = await sql`SELECT 1 as health`;
    return result.length > 0;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}
