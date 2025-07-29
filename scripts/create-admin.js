import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'test-admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123!';
  const name = process.env.ADMIN_NAME || 'Admin User';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`User ${email} already exists`);
      return;
    }

    // Use Better Auth server API to create user properly
    const { auth } = await import('../src/lib/auth.ts');
    
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name
      }
    });

    if (result.user) {
      // Update user to admin role using Prisma (Better Auth doesn't have direct role update via API)
      await prisma.user.update({
        where: { id: result.user.id },
        data: { 
          role: 'admin',
          emailVerified: true 
        }
      });

      console.log('✅ Admin user created successfully!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Default password: ${password}`);
      console.log('⚠️  Please change the password after first login');
      console.log('👑 Role: admin');
      console.log('🆔 User ID:', result.user.id);
    } else {
      console.error('❌ Failed to create user');
    }

  } catch (error) {
    if (error?.message?.includes('User already exists')) {
      console.log(`User ${email} already exists`);
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();