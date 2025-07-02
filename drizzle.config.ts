import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export default defineConfig({
  // Schema location
  schema: './src/db/schema/*',
  
  // Output directory for migrations
  out: './src/db/migrations',
  
  // Database dialect
  dialect: 'postgresql',
  
  // Database connection
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/traffboard_dev',
  },
  
  // Verbose logging for development
  verbose: process.env.NODE_ENV === 'development',
  
  // Strict mode for safer migrations
  strict: true,
  
  // Migration configuration
  migrations: {
    prefix: 'timestamp',
    table: 'migrations',
    schema: 'public',
  },
});