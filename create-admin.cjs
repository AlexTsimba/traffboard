const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: 'admin@traffboard.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        emailVerified: true
      }
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@traffboard.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('User ID:', user.id);
    
    // Create an account record for email/password login
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.email,
        providerId: 'credential',
        password: hashedPassword
      }
    });

    console.log('Account record created for email/password login');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();