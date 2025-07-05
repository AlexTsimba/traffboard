import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'superuser';
}

/**
 * Ensure test users exist in database
 */
export async function ensureTestUsers(): Promise<void> {
  const testUsers = [
    {
      email: 'admin@traffboard.com',
      password: 'admin123',
      name: 'Test Admin',
      role: 'superuser' as const,
    },
    {
      email: 'user@traffboard.com',
      password: 'user123', 
      name: 'Test User',
      role: 'user' as const,
    },
  ];

  for (const userData of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      const passwordHash = await bcrypt.hash(userData.password, 12);
      
      await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          passwordHash,
          role: userData.role,
          isActive: true,
        },
      });
      
      console.log(`Created test user: ${userData.email}`);
    }
  }
}

/**
 * Clean up temporary test users
 */
export async function cleanupTestUsers(): Promise<void> {
  // Only delete temporary users, keep admin and main test user
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'temp@',
      },
    },
  });
}

/**
 * Create a temporary test user for testing
 */
export async function createTempUser(userData: Omit<TestUser, 'id'>): Promise<TestUser> {
  const passwordHash = await bcrypt.hash(userData.password, 12);
  
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      passwordHash,
      role: userData.role,
      isActive: true,
    },
  });

  return {
    ...userData,
    id: user.id,
  };
}

/**
 * Delete a temporary test user
 */
export async function deleteTempUser(userId: string): Promise<void> {
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Setup test database with required users
 */
export async function setupTestDatabase(): Promise<void> {
  await ensureTestUsers();
}

/**
 * Cleanup test database
 */
export async function teardownTestDatabase(): Promise<void> {
  await cleanupTestUsers();
  await prisma.$disconnect();
}
