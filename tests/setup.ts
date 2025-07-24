// IMPORTANT: Load environment variables FIRST before any other imports
import { config } from 'dotenv'
config({ path: '.env.test' })

// Set NODE_ENV early - use Object.defineProperty to avoid readonly error
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    enumerable: true,
    configurable: true
  })
}

// Debug environment variable loading
console.log('Test setup: Environment variables loaded:', {
  BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
  DATABASE_URL: !!process.env.DATABASE_URL,
  BETTER_AUTH_URL: !!process.env.BETTER_AUTH_URL,
})

import { beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

let prisma: PrismaClient

beforeAll(async () => {
  // Use test database URL if available, otherwise use regular DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for testing')
  }

  // Ensure required environment variables are set
  if (!process.env.BETTER_AUTH_SECRET) {
    process.env.BETTER_AUTH_SECRET = 'test-secret-key-32-chars-long-abcd'
  }
  if (!process.env.BETTER_AUTH_URL) {
    process.env.BETTER_AUTH_URL = 'http://localhost:3000'
  }
  
  // Initialize Prisma client for tests
  prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    }
  })

  // Skip migrations - assume database is already set up
  // try {
  //   execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  // } catch (error) {
  //   console.warn('Migration failed - database may already be up to date:', error)
  // }
}, 60000)

afterAll(async () => {
  await prisma?.$disconnect()
})

export { prisma }