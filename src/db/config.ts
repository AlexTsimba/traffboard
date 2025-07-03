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

// Default configuration for test environment
export const TEST_DB_CONFIG: DbConfig = {
  host: "localhost",
  port: 5433, // Docker compose test port
  database: "traffboard_test",
  username: "traffboard",
  password: "traffboard_test_password",
  ssl: false,
  max: 5,
  idle_timeout: 30,
  connect_timeout: 20,
};

// Environment-based configuration
export function getDbConfig(): DbConfig {
  const env = process.env.NODE_ENV || "development";
  
  switch (env) {
    case "test":
      return {
        ...TEST_DB_CONFIG,
        host: process.env.TEST_DB_HOST || TEST_DB_CONFIG.host,
        port: parseInt(process.env.TEST_DB_PORT || "5433"),
        database: process.env.TEST_DB_NAME || TEST_DB_CONFIG.database,
        username: process.env.TEST_DB_USER || TEST_DB_CONFIG.username,
        password: process.env.TEST_DB_PASSWORD || TEST_DB_CONFIG.password,
      };
    
    case "development":
      return {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME || "traffboard_dev",
        username: process.env.DB_USER || "traffboard",
        password: process.env.DB_PASSWORD || "traffboard_dev_password",
        ssl: false,
        max: 20,
      };
    
    case "production":
      return {
        host: process.env.DB_HOST!,
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME!,
        username: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        ssl: true,
        max: 50,
        idle_timeout: 30,
        connect_timeout: 15,
      };
    
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

/**
 * Create database connection with proper configuration
 */
export function createDbConnection(config?: DbConfig) {
  const dbConfig = config || getDbConfig();
  
  // Create connection string
  const connectionString = `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
  
  // Create postgres connection
  const sql = postgres(connectionString, {
    max: dbConfig.max || 10,
    idle_timeout: dbConfig.idle_timeout || 20,
    connect_timeout: dbConfig.connect_timeout || 10,
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
let globalConnection: ReturnType<typeof createDbConnection> | null = null;

/**
 * Get or create global database connection
 */
export function getDb() {
  if (!globalConnection) {
    globalConnection = createDbConnection();
  }
  return globalConnection;
}

/**
 * Close database connection
 */
export async function closeDb() {
  if (globalConnection) {
    await globalConnection.sql.end();
    globalConnection = null;
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