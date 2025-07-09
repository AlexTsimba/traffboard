import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

export class DatabaseHelper {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
          },
        },
      });
    }
    return this.instance;
  }

  static async cleanup(): Promise<void> {
    const prisma = this.getInstance();

    // Clean up test data in reverse dependency order
    await prisma.authAttempt.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.twoFactorBackupCode.deleteMany();
    await prisma.account.deleteMany();
    await prisma.conversionUpload.deleteMany();
    await prisma.conversion.deleteMany();
    await prisma.playerData.deleteMany();
    await prisma.user.deleteMany();
    await prisma.verificationToken.deleteMany();
  }

  static async seedTestUser(): Promise<{
    id: string;
    email: string;
    password: string;
  }> {
    const prisma = this.getInstance();
    const testPassword = "test123456";
    const passwordHash = await hash(testPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        role: "user",
        passwordHash,
        isActive: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      password: testPassword,
    };
  }

  static async seedAdminUser(): Promise<{
    id: string;
    email: string;
    password: string;
  }> {
    const prisma = this.getInstance();
    const adminPassword = "admin123";
    const passwordHash = await hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: "admin@traffboard.com",
        name: "Admin User",
        role: "superuser",
        passwordHash,
        isActive: true,
      },
    });

    return {
      id: admin.id,
      email: admin.email,
      password: adminPassword,
    };
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
    }
  }
}
