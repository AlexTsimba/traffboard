const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createProductionAdmin() {
  const email = 'simba292@gmail.com';
  const password = 'TempPass123';
  const name = 'Simba Admin';

  console.log('🔧 Creating production admin user...');
  console.log(`📧 Email: ${email}`);

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('✅ User already exists, updating to admin role...');
      await prisma.user.update({
        where: { email },
        data: { role: 'admin', emailVerified: true }
      });
      console.log('✅ User promoted to admin successfully!');
      return;
    }

    // Use Better Auth server API - dynamic import for ESM
    const { auth } = await import('../src/lib/auth.ts');
    
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name
      }
    });

    if (result.user) {
      // Update to admin role
      await prisma.user.update({
        where: { id: result.user.id },
        data: { 
          role: 'admin',
          emailVerified: true 
        }
      });

      console.log('✅ Production admin user created successfully!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log('👑 Role: admin');
      console.log('🆔 User ID:', result.user.id);
    } else {
      console.error('❌ Failed to create user via Better Auth');
    }

  } catch (error) {
    console.error('❌ Error creating production admin:', error);
    if (error?.message?.includes('User already exists')) {
      console.log('✅ User exists, trying to promote to admin...');
      try {
        await prisma.user.updateMany({
          where: { email },
          data: { role: 'admin', emailVerified: true }
        });
        console.log('✅ User promoted to admin!');
      } catch (updateError) {
        console.error('❌ Error promoting user:', updateError);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();