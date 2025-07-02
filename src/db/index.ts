/**
 * Database module main exports
 *
 * This is the main entry point for all database operations.
 * Import database instance, health checks, and utilities from here.
 */

// Database connection and instance
export { 
  db, 
  pool, 
  checkDatabaseHealth, 
  closeDatabaseConnection, 
  getDatabaseInfo,
  executeWithRetry,
  getConnectionMetrics,
} from "./connection";

// Database monitoring utilities
export { 
  monitorDatabase, 
  startDatabaseMonitoring, 
  formatMonitoringResult, 
  troubleshootConnection,
  type DatabaseMonitoringResult,
} from "./utils/monitoring";

// Database configuration
export {
  databaseConfig,
  testDatabaseConfig,
  isDevelopment,
  isTest,
  isProduction,
  healthCheckConfig,
} from "@/config/database";

// Schema will be exported here once created
// export * from './schema';

// Migrations will be exported here once created
// export * from './migrations';

/**
 * Re-export common Drizzle ORM utilities
 */
export {
  eq,
  and,
  or,
  not,
  isNull,
  isNotNull,
  exists,
  inArray,
  notInArray,
  like,
  ilike,
  between,
  gt,
  gte,
  lt,
  lte,
  desc,
  asc,
  count,
  sum,
  avg,
  max,
  min,
} from "drizzle-orm";
