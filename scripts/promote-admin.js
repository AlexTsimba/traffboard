import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteUserToAdmin() {
  const email = process.env.ADMIN_EMAIL || 'simba292@gmail.com';

  console.log('🔧 Promoting user to admin...');
  console.log(`📧 Target email: ${email}`);

  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
        role: 'admin',
        emailVerified: true 
      }
    });

    console.log('✅ User promoted to admin successfully!');
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`👑 Role: ${updatedUser.role}`);
    console.log(`🆔 User ID: ${updatedUser.id}`);

  } catch (error) {
    console.error('❌ Error promoting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

promoteUserToAdmin();