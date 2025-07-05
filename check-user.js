const { PrismaClient } = require('@prisma/client');

async function checkUser() {
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@traffboard.com' },
      select: {
        id: true,
        email: true,
        totpSecret: true,
      }
    });
    
    console.log('User status:');
    console.log('- Email:', user?.email);
    console.log('- Has 2FA enabled:', !!user?.totpSecret);
    console.log('- Secret length:', user?.totpSecret?.length || 0);
    
    return user;
  } finally {
    await prisma.$disconnect();
  }
}

checkUser().catch(console.error);
