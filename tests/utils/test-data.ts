const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPass123!'

export const TEST_USERS = {
  admin: {
    email: 'admin@traffboard.com',
    password: TEST_PASSWORD,
    name: 'Admin User',
    role: 'admin'
  },
  regularUser: {
    email: 'user@traffboard.com',
    password: TEST_PASSWORD,
    name: 'Regular User',
    role: 'user'
  },
  twoFactorUser: {
    email: '2fa@traffboard.com',
    password: TEST_PASSWORD,
    name: '2FA User',
    role: 'user',
    twoFactorEnabled: true
  },
  testUser: {
    email: 'test@example.com',
    password: TEST_PASSWORD,
    name: 'Test User',
    role: 'user'
  },
  STANDARD_USER: {
    email: 'standard@traffboard.com',
    password: TEST_PASSWORD,
    name: 'Standard User',
    role: 'user'
  },
  MFA_USER: {
    email: 'mfa@traffboard.com',
    password: TEST_PASSWORD,
    name: 'MFA User',
    role: 'user',
    twoFactorEnabled: true
  },
  OAUTH_USER: {
    email: 'oauth@traffboard.com',
    password: TEST_PASSWORD,
    name: 'OAuth User',
    role: 'user'
  }
} as const