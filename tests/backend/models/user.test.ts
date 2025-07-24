import { describe, test, expect, beforeEach } from 'vitest'
import { testDb, clearDatabase } from '../../utils/db-helpers'

describe('User Model', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  test('should create user with valid data', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const user = await testDb.user.create({ data: userData })
    
    expect(user.email).toBe('test@example.com')
    expect(user.name).toBe('Test User')
    expect(user.role).toBe('user') // default value
    expect(user.twoFactorEnabled).toBe(false) // default value
    expect(user.id).toBeDefined()
    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.updatedAt).toBeInstanceOf(Date)
  })

  test('should enforce unique email constraint', async () => {
    const userData = {
      name: 'User 1',
      email: 'duplicate@example.com',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await testDb.user.create({ data: userData })
    
    await expect(
      testDb.user.create({ 
        data: { ...userData, name: 'User 2' } 
      })
    ).rejects.toThrow()
  })

  test('should set default values correctly', async () => {
    const minimalUserData = {
      name: 'Minimal User',
      email: 'minimal@example.com',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const user = await testDb.user.create({ data: minimalUserData })
    
    expect(user.role).toBe('user')
    expect(user.twoFactorEnabled).toBe(false)
  })

  test('should allow admin role assignment', async () => {
    const adminUserData = {
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const user = await testDb.user.create({ data: adminUserData })
    
    expect(user.role).toBe('admin')
  })

  test('should cascade delete related records', async () => {
    const user = await testDb.user.create({
      data: { 
        name: 'Test User', 
        email: 'test@example.com',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create related session
    await testDb.session.create({
      data: {
        userId: user.id,
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent'
      }
    })

    // Create related account
    await testDb.account.create({
      data: {
        userId: user.id,
        accountId: 'google-123',
        providerId: 'google',
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }
    })

    await testDb.user.delete({ where: { id: user.id } })
    
    // Verify cascading deletes
    const sessions = await testDb.session.findMany({ 
      where: { userId: user.id } 
    })
    const accounts = await testDb.account.findMany({
      where: { userId: user.id }
    })
    
    expect(sessions).toHaveLength(0)
    expect(accounts).toHaveLength(0)
  })

  test('should handle 2FA settings', async () => {
    const user = await testDb.user.create({
      data: { 
        name: 'Test User', 
        email: 'test@example.com',
        twoFactorEnabled: true,
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create 2FA record
    await testDb.twoFactor.create({
      data: {
        userId: user.id,
        secret: 'test-secret',
        backupCodes: JSON.stringify(['123456', '789012'])
      }
    })

    const userWith2FA = await testDb.user.findUnique({
      where: { id: user.id },
      include: { twoFactor: true }
    })

    expect(userWith2FA?.twoFactorEnabled).toBe(true)
    expect(userWith2FA?.twoFactor).toBeDefined()
    expect(userWith2FA?.twoFactor?.secret).toBe('test-secret')
  })

  test('should handle user relationships correctly', async () => {
    const user = await testDb.user.create({
      data: {
        name: 'Relationship Test User',
        email: 'relationships@example.com',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: {
          create: {
            token: 'test-session-token',
            expiresAt: new Date(Date.now() + 86400000),
            ipAddress: '127.0.0.1',
            userAgent: 'Test Agent'
          }
        },
        accounts: {
          create: {
            accountId: 'google-456',
            providerId: 'google',
            accessToken: 'access-token-2',
            refreshToken: 'refresh-token-2'
          }
        }
      },
      include: { 
        sessions: true, 
        accounts: true 
      }
    })

    expect(user.sessions).toHaveLength(1)
    expect(user.accounts).toHaveLength(1)
    expect(user.sessions[0]?.token).toBe('test-session-token')
    expect(user.accounts[0]?.providerId).toBe('google')
  })
})