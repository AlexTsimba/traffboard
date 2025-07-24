import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server.js'
import { middleware } from '../../middleware'

// Mock the auth module
vi.mock('~/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn()
    }
  }
}))

// Mock next/headers
vi.mock('next/headers.js', () => ({
  headers: vi.fn().mockResolvedValue(new Headers())
}))

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should redirect unauthenticated users to login', async () => {
    const { auth } = await import('~/lib/auth')
    // Mock no session
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login')
  })

  test('should redirect users with 2FA enabled but not verified', async () => {
    const { auth } = await import('~/lib/auth')
    // Mock session with 2FA enabled but not verified
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { 
        id: '1', 
        twoFactorEnabled: true,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
        role: 'user'
      },
      session: { 
        id: 'session1',
        userId: '1',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      twoFactorVerified: false
    } as any)

    const request = new NextRequest('http://localhost:3000/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/auth/two-factor')
  })

  test('should allow access for users with 2FA disabled', async () => {
    const { auth } = await import('~/lib/auth')
    // Mock session with 2FA disabled
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { 
        id: '1', 
        twoFactorEnabled: false,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
        role: 'user'
      },
      session: { 
        id: 'session1',
        userId: '1',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    const request = new NextRequest('http://localhost:3000/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(200)
  })

  test('should allow access for users with 2FA verified', async () => {
    const { auth } = await import('~/lib/auth')
    // Mock session with 2FA enabled and verified
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { 
        id: '1', 
        twoFactorEnabled: true,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
        role: 'user'
      },
      session: { 
        id: 'session1',
        userId: '1',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      twoFactorVerified: true
    } as any)

    const request = new NextRequest('http://localhost:3000/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(200)
  })

  test('should handle protected routes correctly', async () => {
    const { auth } = await import('~/lib/auth')
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const protectedRoutes = [
      '/dashboard',
      '/reports/conversions', 
      '/reports/cohort',
      '/reports/quality',
      '/reports/landings',
      '/admin',
      '/settings'
    ]

    for (const route of protectedRoutes) {
      const request = new NextRequest(`http://localhost:3000${route}`)
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login')
    }
  })

  test('should handle auth API errors gracefully', async () => {
    const { auth } = await import('~/lib/auth')
    // Mock auth API throwing an error
    vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Auth API error'))

    const request = new NextRequest('http://localhost:3000/dashboard')
    
    // Should throw the error since middleware doesn't have error handling
    await expect(middleware(request)).rejects.toThrow('Auth API error')
  })
})