const { PrismaClient } = require('@prisma/client');
const { authenticator } = require('otplib');

async function generateCurrentTOTP() {
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@traffboard.com' },
      select: { totpSecret: true }
    });
    
    if (!user?.totpSecret) {
      console.log('❌ User does not have 2FA enabled');
      return;
    }
    
    // Generate current TOTP code
    const token = authenticator.generate(user.totpSecret);
    const timeRemaining = Math.floor((30 - (Math.floor(Date.now() / 1000) % 30)));
    
    console.log('🔐 Current TOTP code:', token);
    console.log('⏱️  Valid for:', timeRemaining, 'seconds');
    
    return token;
  } finally {
    await prisma.$disconnect();
  }
}

generateCurrentTOTP().catch(console.error);
