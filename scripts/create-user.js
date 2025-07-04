const { PrismaClient } = require("@prisma/client");
const bcryptjs = require("bcryptjs");

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = "admin@traffboard.com";
    const password = "admin123";
    const name = "Admin User";
    const role = "superuser";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("User already exists:", email);
      return;
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
      },
    });

    console.log("✅ Test user created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role:", role);
  } catch (error) {
    console.error("❌ Error creating user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
