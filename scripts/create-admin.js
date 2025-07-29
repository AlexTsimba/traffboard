import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'simba292@gmail.com' }
    });

    if (existingUser) {
      console.log('User simba292@gmail.com already exists');
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123!', 12);

    // Create admin user directly in database
    const adminUser = await prisma.user.create({
      data: {
        email: 'simba292@gmail.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: simba292@gmail.com');
    console.log('🔑 Default password: admin123!');
    console.log('⚠️  Please change the password after first login');
    console.log('👑 Role: admin');
    console.log('🆔 User ID:', adminUser.id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();