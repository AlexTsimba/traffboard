import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create admin user
  const adminEmail = "admin@traffboard.com";
  const adminPassword = "admin123";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: "superuser",
      isActive: true,
      name: "Admin User",
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "superuser",
      isActive: true,
      name: "Admin User",
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // Create test users
  const testUsers = [
    {
      email: "test@traffboard.com",
      password: "test123",
      name: "Test User",
      role: "user",
    },
    {
      email: "manager@traffboard.com",
      password: "manager123",
      name: "Manager User",
      role: "user",
    },
    {
      email: "john@traffboard.com",
      password: "john123",
      name: "John Doe",
      role: "user",
    },
  ];

  for (const userData of testUsers) {
    const passwordHash = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        passwordHash,
        role: userData.role,
        isActive: true,
        name: userData.name,
        createdBy: admin.id,
        lastModifiedBy: admin.id,
      },
      create: {
        email: userData.email,
        passwordHash,
        role: userData.role,
        isActive: true,
        name: userData.name,
        createdBy: admin.id,
        lastModifiedBy: admin.id,
      },
    });

    console.log("✅ Test user created:", user.email);
  }

  console.log("✅ Seed completed successfully!");

  console.log("\n🔐 Login credentials:");
  console.log("Admin: admin@traffboard.com / admin123");
  console.log("Test User: test@traffboard.com / test123");
  console.log("Manager: manager@traffboard.com / manager123");
  console.log("John: john@traffboard.com / john123");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
