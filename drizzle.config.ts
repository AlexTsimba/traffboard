import { defineConfig } from "drizzle-kit";
import { getDbConfig } from "./src/db/config";

// Get database configuration based on environment
const config = getDbConfig();

export default defineConfig({
  // Schema location
  schema: "./src/db/schema/index.ts",

  // Output directory for migrations
  out: "./src/db/migrations",

  // Database dialect
  dialect: "postgresql",

  // Database connection
  dbCredentials: {
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
  },

  // Verbose logging for development
  verbose: process.env.NODE_ENV === "development",

  // Strict mode for safer migrations
  strict: true,

  // Migration configuration
  migrations: {
    prefix: "timestamp",
    table: "migrations",
    schema: "public",
  },
});
