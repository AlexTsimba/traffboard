import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const testDb = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
})

export async function clearDatabase() {
  // Clear all tables in dependency order
  await testDb.session.deleteMany()
  await testDb.account.deleteMany()
  await testDb.twoFactor.deleteMany()
  await testDb.verification.deleteMany()
  await testDb.post.deleteMany()
  await testDb.user.deleteMany()
}

export async function createTestUser(overrides = {}) {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    twoFactorEnabled: false,
    role: 'user'
  }

  return testDb.user.create({
    data: {
      ...defaultUser,
      ...overrides
    }
  })
}

export async function createTestUserWithSession(userOverrides = {}) {
  const user = await createTestUser(userOverrides)
  
  const session = await testDb.session.create({
    data: {
      userId: user.id,
      token: `test-session-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 86400000), // 24 hours
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent'
    }
  })

  return { user, session, sessionToken: session.token }
}

export async function createUserWith2FA() {
  const user = await createTestUser({ twoFactorEnabled: true })
  
  const secret = 'JBSWY3DPEHPK3PXP' // Base32 test secret
  
  const twoFactor = await testDb.twoFactor.create({
    data: {
      userId: user.id,
      secret,
      backupCodes: JSON.stringify(['123456', '789012'])
    }
  })

  const session = await testDb.session.create({
    data: {
      userId: user.id,
      token: `test-2fa-session-${Date.now()}`,
      expiresAt: new Date(Date.now() + 86400000),
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent'
    }
  })

  return { user, session, sessionToken: session.token, secret }
}

export async function createBetterAuthUser(overrides = {}) {
  const defaultUser = {
    name: 'Better Auth User',
    email: 'betterauth@example.com',
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    twoFactorEnabled: false,
    role: 'user'
  }

  return testDb.user.create({
    data: {
      ...defaultUser,
      ...overrides
    }
  })
}

export async function cleanupTestUsers() {
  // Clean up all test data
  await clearDatabase()
}